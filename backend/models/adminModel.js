import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['superadmin', 'admin', 'staff'],
    default: 'staff'
  },
  permissions: {
    canManageUsers: { type: Boolean, default: false },
    canManageOrders: { type: Boolean, default: false },
    canManageInventory: { type: Boolean, default: false },
    canManageMenu: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: false },
    canManageSettings: { type: Boolean, default: false },
    canManagePromoCodes: { type: Boolean, default: false }  // NEW
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const adminModel = mongoose.models.admin || mongoose.model("admin", adminSchema);
export default adminModel;