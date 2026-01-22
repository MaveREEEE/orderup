import crypto from 'crypto';
import bcrypt from 'bcrypt';
import userModel from '../models/userModel.js';
import adminModel from '../models/adminModel.js';
import { sendEmail, emailTemplates } from '../config/email.js';

// Request password reset
export const forgotPassword = async (req, res) => {
  try {
    const { email, userType } = req.body; // userType: 'customer' or 'admin'

    if (!email) {
      return res.json({ success: false, message: "Email is required" });
    }

    // Find user in appropriate model
    const Model = userType === 'admin' ? adminModel : userModel;
    const user = await Model.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      // Don't reveal if email exists for security
      return res.json({ 
        success: true, 
        message: "If that email exists, a password reset link has been sent" 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save hashed token and expiry to database
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Create reset URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = userType === 'admin' 
      ? `${process.env.ADMIN_URL || 'http://localhost:5174'}/reset-password/${resetToken}`
      : `${frontendUrl}/reset-password/${resetToken}`;

    // Send email
    const emailHtml = emailTemplates.passwordReset({
      name: user.name,
      resetUrl
    });

    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request - OrderUP',
      html: emailHtml
    });

    res.json({ 
      success: true, 
      message: "Password reset link sent to your email" 
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.json({ success: false, message: "Error processing request" });
  }
};

// Reset password with token
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, userType } = req.body;

    if (!token || !newPassword) {
      return res.json({ success: false, message: "Token and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.json({ success: false, message: "Password must be at least 6 characters" });
    }

    // Hash the token to compare with stored version
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const Model = userType === 'admin' ? adminModel : userModel;
    const user = await Model.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.json({ 
        success: false, 
        message: "Invalid or expired reset token" 
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ 
      success: true, 
      message: "Password reset successful. You can now log in with your new password." 
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.json({ success: false, message: "Error resetting password" });
  }
};

// Change password (for logged-in users)
export const changePassword = async (req, res) => {
  try {
    const { userId, currentPassword, newPassword, userType } = req.body;

    if (!userId || !currentPassword || !newPassword) {
      return res.json({ success: false, message: "All fields are required" });
    }

    if (newPassword.length < 6) {
      return res.json({ success: false, message: "New password must be at least 6 characters" });
    }

    // Find user
    const Model = userType === 'admin' ? adminModel : userModel;
    const user = await Model.findById(userId);

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.json({ 
      success: true, 
      message: "Password changed successfully" 
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.json({ success: false, message: "Error changing password" });
  }
};

// Send email verification
export const sendEmailVerification = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    if (user.isEmailVerified) {
      return res.json({ success: false, message: "Email already verified" });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    // Save token
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpires = Date.now() + 86400000; // 24 hours
    await user.save();

    // Create verification URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verificationUrl = `${frontendUrl}/verify-email/${verificationToken}`;

    // Send email
    const emailHtml = emailTemplates.emailVerification({
      name: user.name,
      verificationUrl
    });

    await sendEmail({
      to: user.email,
      subject: 'Verify Your Email - OrderUP',
      html: emailHtml
    });

    res.json({ 
      success: true, 
      message: "Verification email sent" 
    });
  } catch (error) {
    console.error("Send verification error:", error);
    res.json({ success: false, message: "Error sending verification email" });
  }
};

// Verify email
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.json({ success: false, message: "Verification token is required" });
    }

    // Hash token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user
    const user = await userModel.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.json({ 
        success: false, 
        message: "Invalid or expired verification token" 
      });
    }

    // Mark as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({ 
      success: true, 
      message: "Email verified successfully!" 
    });
  } catch (error) {
    console.error("Verify email error:", error);
    res.json({ success: false, message: "Error verifying email" });
  }
};
