import notificationModel from '../models/notificationModel.js';

// Create notification
export const createNotification = async ({ userId, type, title, message, relatedOrderId = null }) => {
  try {
    const notification = new notificationModel({
      userId,
      type,
      title,
      message,
      relatedOrderId
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
};

// Get user notifications
export const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const notifications = await notificationModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('relatedOrderId', 'items amount status')
      .lean();

    const unreadCount = await notificationModel.countDocuments({ 
      userId, 
      isRead: false 
    });

    res.json({ 
      success: true, 
      data: notifications,
      unreadCount 
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.json({ success: false, message: "Error fetching notifications" });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    await notificationModel.findByIdAndUpdate(notificationId, { isRead: true });

    res.json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.json({ success: false, message: "Error updating notification" });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.body;

    await notificationModel.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );

    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all as read:", error);
    res.json({ success: false, message: "Error updating notifications" });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    await notificationModel.findByIdAndDelete(notificationId);

    res.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.json({ success: false, message: "Error deleting notification" });
  }
};

// Get unread count
export const getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.params;

    const count = await notificationModel.countDocuments({ 
      userId, 
      isRead: false 
    });

    res.json({ success: true, count });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.json({ success: false, message: "Error getting count" });
  }
};
