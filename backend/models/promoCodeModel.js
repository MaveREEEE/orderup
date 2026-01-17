import mongoose from "mongoose";

const promoCodeSchema = new mongoose.Schema({
  code: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true,
    trim: true
  },
  discountType: { 
    type: String, 
    enum: ['percentage', 'fixed'],
    required: true 
  },
  discountValue: { 
    type: Number, 
    required: true 
  },
  minOrderAmount: { 
    type: Number, 
    default: 0 
  },
  maxDiscount: { 
    type: Number, 
    default: null 
  },
  usageLimit: { 
    type: Number, 
    default: null 
  },
  usedCount: { 
    type: Number, 
    default: 0 
  },
  validFrom: { 
    type: Date, 
    required: true 
  },
  validUntil: { 
    type: Date, 
    required: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

const promoCodeModel = mongoose.models.promoCode || mongoose.model("promoCode", promoCodeSchema);
export default promoCodeModel;