import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, default: "" },
  address: { type: String, default: "" },
  cartData: { type: Object, default: {} },
  role: { 
    type: String, 
    enum: ['customer', 'staff', 'admin', 'superadmin'],
    default: "customer"
  },
  isActive: { type: Boolean, default: true },
  // Email verification
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date },
  // Password reset
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }
}, { timestamps: true, minimize: false });

const userModel = mongoose.models.user || mongoose.model("user", userSchema);
export default userModel;