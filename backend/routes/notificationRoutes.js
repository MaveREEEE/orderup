import express from 'express';
import { 
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
} from '../controllers/notificationController.js';
import authMiddleware from '../middleware/auth.js';

const notificationRouter = express.Router();

// All routes require authentication
notificationRouter.get('/:userId', authMiddleware, getUserNotifications);
notificationRouter.get('/:userId/unread-count', authMiddleware, getUnreadCount);
notificationRouter.put('/:notificationId/read', authMiddleware, markAsRead);
notificationRouter.put('/mark-all-read', authMiddleware, markAllAsRead);
notificationRouter.delete('/:notificationId', authMiddleware, deleteNotification);

export default notificationRouter;
