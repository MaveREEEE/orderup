import promoCodeModel from "../models/promoCodeModel.js";

// Get all promo codes (Admin)
const listPromoCodes = async (req, res) => {
    try {
        const promoCodes = await promoCodeModel.find().sort({ createdAt: -1 });
        res.json({ success: true, data: promoCodes });
    } catch (error) {
        console.error("Error fetching promo codes:", error);
        res.json({ success: false, message: "Error fetching promo codes" });
    }
};

// Create promo code (Admin)
const createPromoCode = async (req, res) => {
    try {
        const {
            code,
            discountType,
            discountValue,
            minOrderAmount,
            maxDiscount,
            usageLimit,
            validFrom,
            validUntil
        } = req.body;

        // Validation
        if (!code || !discountType || !discountValue || !validFrom || !validUntil) {
            return res.json({
                success: false,
                message: "Please provide all required fields"
            });
        }

        // Check if code already exists
        const existingCode = await promoCodeModel.findOne({ 
            code: code.toUpperCase().trim() 
        });
        
        if (existingCode) {
            return res.json({
                success: false,
                message: "Promo code already exists"
            });
        }

        const newPromoCode = new promoCodeModel({
            code: code.toUpperCase().trim(),
            discountType,
            discountValue,
            minOrderAmount: minOrderAmount || 0,
            maxDiscount: maxDiscount || null,
            usageLimit: usageLimit || null,
            validFrom: new Date(validFrom),
            validUntil: new Date(validUntil),
            isActive: true
        });

        await newPromoCode.save();

        res.json({
            success: true,
            message: "Promo code created successfully",
            data: newPromoCode
        });
    } catch (error) {
        console.error("Error creating promo code:", error);
        res.json({ success: false, message: "Error creating promo code" });
    }
};

// Update promo code (Admin)
const updatePromoCode = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const promoCode = await promoCodeModel.findById(id);
        
        if (!promoCode) {
            return res.json({ success: false, message: "Promo code not found" });
        }

        // Update fields
        Object.keys(updateData).forEach(key => {
            if (key === 'code') {
                promoCode[key] = updateData[key].toUpperCase().trim();
            } else {
                promoCode[key] = updateData[key];
            }
        });

        await promoCode.save();

        res.json({
            success: true,
            message: "Promo code updated successfully",
            data: promoCode
        });
    } catch (error) {
        console.error("Error updating promo code:", error);
        res.json({ success: false, message: "Error updating promo code" });
    }
};

// Delete promo code (Admin)
const deletePromoCode = async (req, res) => {
    try {
        const { id } = req.params;

        const promoCode = await promoCodeModel.findByIdAndDelete(id);
        
        if (!promoCode) {
            return res.json({ success: false, message: "Promo code not found" });
        }

        res.json({
            success: true,
            message: "Promo code deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting promo code:", error);
        res.json({ success: false, message: "Error deleting promo code" });
    }
};

// Toggle promo code status (Admin)
const togglePromoStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const promoCode = await promoCodeModel.findById(id);
        
        if (!promoCode) {
            return res.json({ success: false, message: "Promo code not found" });
        }

        promoCode.isActive = !promoCode.isActive;
        await promoCode.save();

        res.json({
            success: true,
            message: `Promo code ${promoCode.isActive ? 'activated' : 'deactivated'}`,
            data: promoCode
        });
    } catch (error) {
        console.error("Error toggling promo status:", error);
        res.json({ success: false, message: "Error toggling promo status" });
    }
};

// Apply promo code (Customer)
const applyPromoCode = async (req, res) => {
    try {
        const { code, orderAmount } = req.body;

        if (!code || !orderAmount) {
            return res.json({ 
                success: false, 
                message: "Promo code and order amount are required" 
            });
        }

        const promoCode = await promoCodeModel.findOne({ 
            code: code.toUpperCase().trim() 
        });

        if (!promoCode) {
            return res.json({ 
                success: false, 
                message: "Invalid promo code" 
            });
        }

        if (!promoCode.isActive) {
            return res.json({ 
                success: false, 
                message: "This promo code is no longer active" 
            });
        }

        const now = new Date();
        if (now < promoCode.validFrom || now > promoCode.validUntil) {
            return res.json({ 
                success: false, 
                message: "This promo code has expired or is not yet valid" 
            });
        }

        if (promoCode.usageLimit && promoCode.usedCount >= promoCode.usageLimit) {
            return res.json({ 
                success: false, 
                message: "This promo code has reached its usage limit" 
            });
        }

        if (orderAmount < promoCode.minOrderAmount) {
            return res.json({ 
                success: false, 
                message: `Minimum order amount of ₱${promoCode.minOrderAmount} required` 
            });
        }

        let discount = 0;
        if (promoCode.discountType === 'percentage') {
            discount = (orderAmount * promoCode.discountValue) / 100;
            if (promoCode.maxDiscount && discount > promoCode.maxDiscount) {
                discount = promoCode.maxDiscount;
            }
        } else if (promoCode.discountType === 'fixed') {
            discount = promoCode.discountValue;
        }

        if (discount > orderAmount) {
            discount = orderAmount;
        }

        const finalAmount = orderAmount - discount;

        return res.json({
            success: true,
            message: "Promo code applied successfully",
            data: {
                code: promoCode.code,
                discount: discount,
                finalAmount: finalAmount,
                discountType: promoCode.discountType,
                discountValue: promoCode.discountValue
            }
        });

    } catch (error) {
        console.error("Error applying promo code:", error);
        res.json({ 
            success: false, 
            message: "Error applying promo code" 
        });
    }
};

// Increment usage count
const incrementPromoUsage = async (code) => {
    try {
        await promoCodeModel.findOneAndUpdate(
            { code: code.toUpperCase().trim() },
            { $inc: { usedCount: 1 } }
        );
    } catch (error) {
        console.error("Error incrementing promo usage:", error);
    }
};

export { 
    listPromoCodes,
    createPromoCode,
    updatePromoCode,
    deletePromoCode,
    togglePromoStatus,
    applyPromoCode, 
    incrementPromoUsage 
};