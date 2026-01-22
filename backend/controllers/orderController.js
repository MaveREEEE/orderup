import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import foodModel from "../models/foodModel.js";
import promoCodeModel from "../models/promoCodeModel.js";
import { sendEmail, emailTemplates } from "../config/email.js";
import { createNotification } from "./notificationController.js";

// Get all orders for admin
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

// Place order from frontend
const placeOrder = async (req, res) => {
    try {
        const { userId, items, amount, address, orderType, paymentMethod, promoCode, subtotal, discount } = req.body;

        if (!userId || !items || !items.length || amount === undefined || !address) {
            return res.json({ 
                success: false, 
                message: "Missing required fields" 
            });
        }

        // Check inventory and deduct quantities (FIFO)
        for (const item of items) {
            const food = await foodModel.findById(item._id);
            if (!food) {
                return res.json({ 
                    success: false, 
                    message: `Item not found: ${item.name}` 
                });
            }

            // Calculate total available stock
            const totalStock = food.batches?.reduce((sum, batch) => sum + batch.quantity, 0) || 0;
            
            if (totalStock < item.quantity) {
                return res.json({ 
                    success: false, 
                    message: `Insufficient stock for ${item.name}. Available: ${totalStock}, Requested: ${item.quantity}` 
                });
            }

            // Deduct from batches (FIFO - First In First Out, use oldest batches first)
            let remainingToDeduct = item.quantity;
            
            // Sort batches by production date (oldest first)
            food.batches.sort((a, b) => new Date(a.productionDate) - new Date(b.productionDate));
            
            for (let i = 0; i < food.batches.length && remainingToDeduct > 0; i++) {
                const batch = food.batches[i];
                
                if (batch.quantity > 0) {
                    const deductAmount = Math.min(batch.quantity, remainingToDeduct);
                    batch.quantity -= deductAmount;
                    remainingToDeduct -= deductAmount;
                }
            }

            // Remove batches with 0 quantity
            food.batches = food.batches.filter(batch => batch.quantity > 0);
            
            await food.save();
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
            status: "Food Processing",
            payment: false,
            date: new Date(),
            promoCode: promoCode || null,
            subtotal: subtotal || amount,
            discount: discount || 0
        });

        await newOrder.save();
        
        // Increment promo code usage if promo was applied
        if (promoCode) {
            try {
                await promoCodeModel.findOneAndUpdate(
                    { code: promoCode.toUpperCase().trim() },
                    { $inc: { usedCount: 1 } }
                );
                console.log(`Promo code ${promoCode} usage incremented`);
            } catch (error) {
                console.error("Error incrementing promo usage:", error);
                // Don't fail the order if promo increment fails
            }
        }
        
        // Clear user cart
        await userModel.findByIdAndUpdate(userId, { cartData: {} });

        // Get user details for email
        const user = await userModel.findById(userId);

        // Send order confirmation email
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

        // Create notification
        await createNotification({
            userId,
            type: 'order',
            title: 'Order Placed Successfully',
            message: `Your order of ₱${amount.toFixed(2)} has been placed and is being processed.`,
            relatedOrderId: newOrder._id
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

// Place dine-in order (admin/staff)
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

        // Check inventory and deduct quantities
        for (const item of items) {
            const food = await foodModel.findById(item._id);
            if (!food) {
                return res.json({ 
                    success: false, 
                    message: `Item not found: ${item.name}` 
                });
            }

            // Calculate total available stock
            const totalStock = food.batches?.reduce((sum, batch) => sum + batch.quantity, 0) || 0;
            
            if (totalStock < item.quantity) {
                return res.json({ 
                    success: false, 
                    message: `Insufficient stock for ${item.name}. Available: ${totalStock}, Requested: ${item.quantity}` 
                });
            }

            // Deduct from batches (FIFO - First In First Out, use oldest batches first)
            let remainingToDeduct = item.quantity;
            
            // Sort batches by production date (oldest first)
            food.batches.sort((a, b) => new Date(a.productionDate) - new Date(b.productionDate));
            
            for (let i = 0; i < food.batches.length && remainingToDeduct > 0; i++) {
                const batch = food.batches[i];
                
                if (batch.quantity > 0) {
                    const deductAmount = Math.min(batch.quantity, remainingToDeduct);
                    batch.quantity -= deductAmount;
                    remainingToDeduct -= deductAmount;
                }
            }

            // Remove batches with 0 quantity
            food.batches = food.batches.filter(batch => batch.quantity > 0);
            
            await food.save();
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
            status: "Food Processing",
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


// Update order status
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
        
        if (status === "Delivered") {
            order.payment = true;
        }

        await order.save();

        // Get user details for email and notification
        const user = await userModel.findById(order.userId);

        // Send status update email
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

        // Create notification
        await createNotification({
            userId: order.userId,
            type: 'order',
            title: 'Order Status Updated',
            message: `Your order status has been updated to: ${status}`,
            relatedOrderId: order._id
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

// Get user orders
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

// Cancel order
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

        // Only allow cancellation if order is in "Food Processing" status
        if (order.status !== "Food Processing") {
            return res.json({ 
                success: false, 
                message: "Order can only be cancelled when in 'Food Processing' status" 
            });
        }

        // Verify order belongs to user (security check)
        if (userId && order.userId.toString() !== userId) {
            return res.json({ success: false, message: "Unauthorized" });
        }

        // Refund inventory - add items back to food batches
        for (const item of order.items) {
            const food = await foodModel.findById(item._id);
            if (food) {
                // Add back as a new batch
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

        // Refund promo code usage
        if (order.promoCode) {
            const promo = await promoCodeModel.findOne({ code: order.promoCode });
            if (promo && promo.usageLimit > 0) {
                promo.usageCount = Math.max(0, (promo.usageCount || 0) - 1);
                await promo.save();
            }
        }

        // Update order status to Cancelled
        order.status = "Cancelled";
        await order.save();

        // Get user details for email
        const user = await userModel.findById(order.userId);

        // Send cancellation email
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

        // Create notification
        await createNotification({
            userId: order.userId,
            type: 'order',
            title: 'Order Cancelled',
            message: `Your order has been cancelled successfully. Amount: ₱${order.amount.toFixed(2)}`,
            relatedOrderId: order._id
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