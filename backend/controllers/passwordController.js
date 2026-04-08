import crypto from 'crypto';
import bcrypt from 'bcrypt';
import userModel from '../models/userModel.js';
import adminModel from '../models/adminModel.js';
import { sendEmail, emailTemplates } from '../config/email.js';

const normalizeBaseUrl = (url, fallback) => {
  const base = (url || fallback || '').trim();
  return base.replace(/\/+$/, '');
};

//Request password reset
export const forgotPassword = async (req, res) => {
  try {
    const { email, userType } = req.body;

    if (!email) {
      return res.json({ success: false, message: "Email is required" });
    }

    const Model = userType === 'admin' ? adminModel : userModel;
    const user = await Model.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.json({ 
        success: true, 
        message: "If that email exists, a password reset link has been sent" 
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; 
    await user.save();

    const frontendUrl = normalizeBaseUrl(process.env.FRONTEND_URL, 'http://localhost:5173');
    const adminUrl = normalizeBaseUrl(process.env.ADMIN_URL, 'http://localhost:5174');
    const resetUrl = userType === 'admin' 
      ? `${adminUrl}/reset-password/${resetToken}`
      : `${frontendUrl}/reset-password/${resetToken}`;

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

//Reset password with token
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, userType } = req.body;

    if (!token || !newPassword) {
      return res.json({ success: false, message: "Token and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.json({ success: false, message: "Password must be at least 6 characters" });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

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

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

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

//Change password
export const changePassword = async (req, res) => {
  try {
    const { userId, currentPassword, newPassword, userType } = req.body;

    if (!userId || !currentPassword || !newPassword) {
      return res.json({ success: false, message: "All fields are required" });
    }

    if (newPassword.length < 6) {
      return res.json({ success: false, message: "New password must be at least 6 characters" });
    }

    const Model = userType === 'admin' ? adminModel : userModel;
    const user = await Model.findById(userId);

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

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

//Send email verification
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

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpires = Date.now() + 86400000;
    await user.save();

    const frontendUrl = normalizeBaseUrl(process.env.FRONTEND_URL, 'http://localhost:5173');
    const verificationUrl = `${frontendUrl}/verify-email/${verificationToken}`;

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

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.json({ success: false, message: "Verification token is required" });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

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
