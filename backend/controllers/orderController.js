import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import foodModel from "../models/foodModel.js";
import promoCodeModel from "../models/promoCodeModel.js";
import { sendEmail, emailTemplates } from "../config/email.js";
import { createNotification } from "./notificationController.js";

const deductFoodStock = (food, requestedQuantity) => {
    const batches = Array.isArray(food.batches) ? food.batches : [];
    const totalStock = batches.reduce((sum, batch) => sum + batch.quantity, 0) || 0;

    if (totalStock < requestedQuantity) {
        return { success: false, totalStock };
    }

    let remainingToDeduct = requestedQuantity;

    batches.sort((a, b) => new Date(a.productionDate) - new Date(b.productionDate));

    for (let i = 0; i < batches.length && remainingToDeduct > 0; i++) {
        const batch = batches[i];

        if (batch.quantity > 0) {
            const deductAmount = Math.min(batch.quantity, remainingToDeduct);
            batch.quantity -= deductAmount;
            remainingToDeduct -= deductAmount;
        }
    }

    food.batches = batches.filter(batch => batch.quantity > 0);
    return { success: true, totalStock };
};

//Adjust inventory
const adjustInventoryForItems = async (items) => {
    for (const item of items) {
        const food = await foodModel.findById(item._id);
        if (!food) {
            return {
                success: false,
                message: `Item not found: ${item.name}`
            };
        }

        const stockResult = deductFoodStock(food, item.quantity);

        if (!stockResult.success) {
            return {
                success: false,
                message: `Insufficient stock for ${item.name}. Available: ${stockResult.totalStock}, Requested: ${item.quantity}`
            };
        }

        await food.save();
    }

    return { success: true };
};

//Send order-related notification
const sendOrderNotification = async ({ userId, title, message, orderId }) => {
    return createNotification({
        userId,
        type: 'order',
        title,
        message,
        relatedOrderId: orderId
    });
};

//Get all orders for admin
const listOrders = async (req, res) => {
    try {
        console.log("Fetching all orders...");
        
        const orders = await orderModel
            .find({})
            .populate('userId', 'name email')
            .sort({ date: -1 })
            .lean();
        
        console.log(`Found ${orders.length} orders`);
        
        res.json({ 
            success: true, 
            data: orders 
        });
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.json({ 
            success: false, 
            message: "Error fetching orders: " + error.message 
        });
    }
};

//Place order
const placeOrder = async (req, res) => {
    try {
        const parsedItems = typeof req.body.items === "string" ? JSON.parse(req.body.items) : req.body.items;
        const parsedAddress = typeof req.body.address === "string" ? JSON.parse(req.body.address) : req.body.address;

        const userId = req.body.userId;
        const items = parsedItems;
        const amount = Number(req.body.amount);
        const address = parsedAddress;
        const orderType = req.body.orderType;
        const paymentMethod = req.body.paymentMethod;
        const promoCode = req.body.promoCode;
        const subtotal = Number(req.body.subtotal);
        const discount = Number(req.body.discount);
        const paymentProofImage = req.file?.path || req.body.paymentProofImage;

        if (!userId || !items || !items.length || amount === undefined || !address) {
            return res.json({ 
                success: false, 
                message: "Missing required fields" 
            });
        }

        if (paymentMethod === "Gcash" && !paymentProofImage) {
            return res.json({
                success: false,
                message: "GCash payment screenshot is required"
            });
        }

        const inventoryResult = await adjustInventoryForItems(items);
        if (!inventoryResult.success) {
            return res.json({
                success: false,
                message: inventoryResult.message
            });
        }

        const normalizedAddress = typeof address === "string"
            ? { address }
            : address;

        const newOrder = new orderModel({
            userId,
            items,
            amount,
            address: normalizedAddress,
            orderType: orderType || "Delivery",
            paymentMethod: paymentMethod || "Cash",
            paymentProofImage: paymentProofImage || "",
            status: "Order Received",
            payment: false,
            date: new Date(),
            promoCode: promoCode || null,
            subtotal: Number.isFinite(subtotal) ? subtotal : amount,
            discount: Number.isFinite(discount) ? discount : 0
        });

        await newOrder.save();

        if (promoCode) {
            try {
                await promoCodeModel.findOneAndUpdate(
                    { code: promoCode.toUpperCase().trim() },
                    { $inc: { usedCount: 1 } }
                );
                console.log(`Promo code ${promoCode} usage incremented`);
            } catch (error) {
                console.error("Error incrementing promo usage:", error);
            }
        }
        
        await userModel.findByIdAndUpdate(userId, { cartData: {} });

        const user = await userModel.findById(userId);

        if (user && user.email) {
            const emailHtml = emailTemplates.orderConfirmation({
                customerName: user.name,
                orderId: newOrder._id,
                orderType: newOrder.orderType,
                amount: newOrder.amount,
                paymentMethod: newOrder.paymentMethod,
                items: items
            });

            await sendEmail({
                to: user.email,
                subject: 'Order Confirmation - OrderUP',
                html: emailHtml
            });
        }

        await sendOrderNotification({
            userId,
            title: 'Order Placed Successfully',
            message: `Your order of ₱${amount.toFixed(2)} has been placed and is being processed.`,
            orderId: newOrder._id
        });

        res.json({ 
            success: true, 
            message: "Order placed successfully",
            orderId: newOrder._id
        });
    } catch (error) {
        console.error("Error placing order:", error);
        res.json({ 
            success: false, 
            message: "Error placing order: " + error.message 
        });
    }
}; 

//Place dine-in order
const placeDineInOrder = async (req, res) => {
    try {
        const { items, amount, tableNumber, notes } = req.body;

        if (!items || !items.length) {
            return res.json({ success: false, message: "No items to order" });
        }
        if (amount === undefined || amount === null) {
            return res.json({ success: false, message: "Amount is required" });
        }
        if (!tableNumber) {
            return res.json({ success: false, message: "Table number is required" });
        }

        const inventoryResult = await adjustInventoryForItems(items);
        if (!inventoryResult.success) {
            return res.json({
                success: false,
                message: inventoryResult.message
            });
        }

        const adminId = (req.admin?._id || req.user?.id || req.user?._id || "dine-in").toString();

        const sanitizedItems = items.map(i => ({
            _id: i._id,
            name: i.name,
            description: i.description,
            price: i.price,
            image: i.image,
            category: i.category,
            quantity: i.quantity
        }));

        const newOrder = new orderModel({
            userId: adminId,
            items: sanitizedItems,
            amount,
            address: { tableNumber, name: "Dine-In" },
            orderType: "Dine In",
            paymentMethod: "Cash",
            status: "Order Received",
            payment: false,
            date: new Date(),
            notes: notes || ""
        });

        await newOrder.save();

        return res.json({
            success: true,
            message: "Dine-in order saved and inventory updated",
            orderId: newOrder._id
        });
    } catch (error) {
        console.error("Error placing dine-in order:", error);
        return res.json({
            success: false,
            message: "Error placing dine-in order: " + error.message
        });
    }
};


//Update order status
const updateStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;

        if (!orderId || !status) {
            return res.json({ 
                success: false, 
                message: "Order ID and status are required" 
            });
        }

        const order = await orderModel.findById(orderId);
        
        if (!order) {
            return res.json({ 
                success: false, 
                message: "Order not found" 
            });
        }

        order.status = status;
        
        if (status === "Food is delivered" || status === "Delivered") {
            order.payment = true;
        }

        await order.save();

        const user = await userModel.findById(order.userId);

        if (user && user.email) {
            const emailHtml = emailTemplates.orderStatusUpdate({
                customerName: user.name,
                orderId: order._id,
                status: status
            });

            await sendEmail({
                to: user.email,
                subject: `Order Status Update - ${status}`,
                html: emailHtml
            });
        }

        await sendOrderNotification({
            userId: order.userId,
            title: 'Order Status Updated',
            message: `Your order status has been updated to: ${status}`,
            orderId: order._id
        });

        res.json({ 
            success: true, 
            message: "Status updated successfully",
            data: order
        });
    } catch (error) {
        console.error("Error updating status:", error);
        res.json({ 
            success: false, 
            message: "Error updating status: " + error.message 
        });
    }
};

//Get user orders
const userOrders = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.json({ 
                success: false, 
                message: "User ID is required" 
            });
        }

        const orders = await orderModel
            .find({ userId })
            .sort({ date: -1 })
            .lean();

        res.json({ 
            success: true, 
            data: orders 
        });
    } catch (error) {
        console.error("Error fetching user orders:", error);
        res.json({ 
            success: false, 
            message: "Error fetching orders: " + error.message 
        });
    }
};

//Cancel order
const cancelOrder = async (req, res) => {
    try {
        const { orderId, userId } = req.body;

        if (!orderId) {
            return res.json({ success: false, message: "Order ID is required" });
        }

        const order = await orderModel.findById(orderId);

        if (!order) {
            return res.json({ success: false, message: "Order not found" });
        }

        const cancellableStatuses = ["Order Received", "Food is being processed", "Food Processing"];
        if (!cancellableStatuses.includes(order.status)) {
            return res.json({ 
                success: false, 
                message: "Order can only be cancelled when status is 'Order Received' or 'Food is being processed'" 
            });
        }

        if (userId && order.userId.toString() !== userId) {
            return res.json({ success: false, message: "Unauthorized" });
        }

        for (const item of order.items) {
            const food = await foodModel.findById(item._id);
            if (food) {
                const refundBatch = {
                    quantity: item.quantity,
                    productionDate: new Date(),
                    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
                };
                
                if (!food.batches) {
                    food.batches = [];
                }
                food.batches.push(refundBatch);
                await food.save();
            }
        }

        if (order.promoCode) {
            const promo = await promoCodeModel.findOne({ code: order.promoCode });
            if (promo && promo.usageLimit > 0) {
                promo.usageCount = Math.max(0, (promo.usageCount || 0) - 1);
                await promo.save();
            }
        }

        order.status = "Cancelled";
        await order.save();

        const user = await userModel.findById(order.userId);

        if (user && user.email) {
            const emailHtml = emailTemplates.orderCancellation({
                customerName: user.name,
                orderId: order._id,
                amount: order.amount
            });

            await sendEmail({
                to: user.email,
                subject: 'Order Cancelled - OrderUP',
                html: emailHtml
            });
        }

        await sendOrderNotification({
            userId: order.userId,
            title: 'Order Cancelled',
            message: `Your order has been cancelled successfully. Amount: ₱${order.amount.toFixed(2)}`,
            orderId: order._id
        });

        res.json({ 
            success: true, 
            message: "Order cancelled successfully and inventory refunded" 
        });
    } catch (error) {
        console.error("Error cancelling order:", error);
        res.json({ success: false, message: "Error cancelling order" });
    }
};

export { placeOrder,placeDineInOrder, listOrders, updateStatus, userOrders, cancelOrder };