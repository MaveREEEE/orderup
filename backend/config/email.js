import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Email templates
export const emailTemplates = {
  orderConfirmation: (orderData) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ff7043;">Order Confirmation</h2>
      <p>Dear ${orderData.customerName},</p>
      <p>Thank you for your order! Your order has been received and is being processed.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Order Details</h3>
        <p><strong>Order ID:</strong> ${orderData.orderId}</p>
        <p><strong>Order Type:</strong> ${orderData.orderType}</p>
        <p><strong>Total Amount:</strong> ₱${orderData.amount.toFixed(2)}</p>
        <p><strong>Payment Method:</strong> ${orderData.paymentMethod}</p>
      </div>
      
      <div style="margin: 20px 0;">
        <h4>Items Ordered:</h4>
        <ul>
          ${orderData.items.map(item => `
            <li>${item.name} x${item.quantity} - ₱${(item.price * item.quantity).toFixed(2)}</li>
          `).join('')}
        </ul>
      </div>
      
      <p>We'll notify you when your order status changes.</p>
      <p>Thank you for choosing OrderUP!</p>
    </div>
  `,

  orderStatusUpdate: (orderData) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ff7043;">Order Status Update</h2>
      <p>Dear ${orderData.customerName},</p>
      <p>Your order status has been updated.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Order ID:</strong> ${orderData.orderId}</p>
        <p><strong>New Status:</strong> <span style="color: #ff7043; font-weight: bold;">${orderData.status}</span></p>
      </div>
      
      <p>Thank you for your patience!</p>
    </div>
  `,

  passwordReset: (resetData) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ff7043;">Password Reset Request</h2>
      <p>Hello ${resetData.name},</p>
      <p>You requested to reset your password. Click the button below to reset it:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetData.resetUrl}" 
           style="background-color: #ff7043; color: white; padding: 12px 30px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Reset Password
        </a>
      </div>
      
      <p style="color: #666;">This link will expire in 1 hour.</p>
      <p style="color: #666;">If you didn't request this, please ignore this email.</p>
      
      <p style="color: #999; font-size: 12px; margin-top: 30px;">
        Or copy and paste this link: ${resetData.resetUrl}
      </p>
    </div>
  `,

  emailVerification: (verificationData) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ff7043;">Verify Your Email</h2>
      <p>Welcome to OrderUP, ${verificationData.name}!</p>
      <p>Please verify your email address to complete your registration:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationData.verificationUrl}" 
           style="background-color: #ff7043; color: white; padding: 12px 30px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Verify Email
        </a>
      </div>
      
      <p style="color: #666;">This link will expire in 24 hours.</p>
      
      <p style="color: #999; font-size: 12px; margin-top: 30px;">
        Or copy and paste this link: ${verificationData.verificationUrl}
      </p>
    </div>
  `,

  orderCancellation: (orderData) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ff7043;">Order Cancelled</h2>
      <p>Dear ${orderData.customerName},</p>
      <p>Your order has been cancelled as requested.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Order ID:</strong> ${orderData.orderId}</p>
        <p><strong>Cancelled Amount:</strong> ₱${orderData.amount.toFixed(2)}</p>
      </div>
      
      <p>If you have any questions, please contact our support team.</p>
      <p>We hope to serve you again soon!</p>
    </div>
  `
};

// Send email function using Resend
export const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️  Resend API key not configured. Email features will be disabled.');
      console.log('📧 Email not sent (no API key configured):', subject);
      return { success: false, message: 'Email service not configured' };
    }

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'OrderUP <onboarding@resend.dev>',
      to,
      subject,
      html
    });

    if (error) {
      console.error('❌ Email sending failed:', error);
      return { success: false, message: error.message };
    }

    console.log('✅ Email sent:', data.id);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return { success: false, message: error.message };
  }
};

export default { sendEmail, emailTemplates };