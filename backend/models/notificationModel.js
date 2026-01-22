import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'user',
    required: true 
  },
  type: { 
    type: String, 
    enum: ['order', 'promo', 'system', 'account'],
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  relatedOrderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'order' 
  }
}, { timestamps: true });

const notificationModel = mongoose.models.notification || mongoose.model("notification", notificationSchema);
export default notificationModel;
