import express from 'express';
import { 
  forgotPassword, 
  resetPassword, 
  changePassword,
  sendEmailVerification,
  verifyEmail 
} from '../controllers/passwordController.js';
import authMiddleware from '../middleware/auth.js';

const passwordRouter = express.Router();

// Public routes (no auth required)
passwordRouter.post('/forgot-password', forgotPassword);
passwordRouter.post('/reset-password', resetPassword);
passwordRouter.post('/verify-email', verifyEmail);

// Protected routes (auth required)
passwordRouter.post('/change-password', authMiddleware, changePassword);
passwordRouter.post('/send-verification', authMiddleware, sendEmailVerification);

export default passwordRouter;
