import sgMail from '@sendgrid/mail';

const initializeSendGrid = () => {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.warn('⚠️  SendGrid API key not configured. Email features will be disabled.');
    return false;
  }
  sgMail.setApiKey(apiKey);
  return true;
};

// Email templates
export const emailTemplates = {
  orderConfirmation: (orderData) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ff7043;">Order Confirmation</h2>
      <p>Dear ${orderData.customerName},</p>
      <p>Thank you for your order! We've received it and will start preparing it soon.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3>Order Details</h3>
        <p><strong>Order ID:</strong> ${orderData.orderId}</p>
        <p><strong>Total:</strong> $${orderData.amount}</p>
        <p><strong>Delivery Address:</strong> ${orderData.address}</p>
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
      <p>Hello ${verificationData.name},</p>
      <p>Please verify your email address by clicking the button below:</p>
      
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

  orderDelivered: (orderData) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4caf50;">Order Delivered!</h2>
      <p>Dear ${orderData.customerName},</p>
      <p>Your order has been successfully delivered.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Order ID:</strong> ${orderData.orderId}</p>
        <p><strong>Delivered on:</strong> ${new Date().toLocaleDateString()}</p>
      </div>
      
      <p>We hope you enjoyed your meal!</p>
      <p>We hope to serve you again soon!</p>
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

// Send email function
export const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!initializeSendGrid()) {
      console.log('📧 Email not sent (SendGrid not configured):', subject);
      return { success: false, message: 'Email service not configured' };
    }

    const msg = {
      to,
      from: process.env.EMAIL_USER, // Must be verified in SendGrid dashboard
      subject,
      html
    };

    const response = await sgMail.send(msg);
    console.log('✅ Email sent via SendGrid to:', to);
    return { success: true, messageId: response[0].headers['x-message-id'] };
  } catch (error) {
    console.error('❌ SendGrid email failed:', error.response?.body || error);
    return { success: false, message: error.message };
  }
};

export default { sendEmail, emailTemplates };
