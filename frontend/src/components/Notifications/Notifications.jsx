import React, { useState, useEffect, useContext } from 'react';
import './Notifications.css';
import { StoreContext } from '../../context/StoreContext';
import axios from 'axios';
import { assets } from '../../assets/assets';

const Notifications = ({ onClose }) => {
  const { url, token, userId } = useContext(StoreContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    if (!userId || !token) return;

    try {
      setLoading(true);
      const response = await axios.get(`${url}/api/notifications/${userId}`, {
        headers: { token }
      });

      if (response.data.success) {
        setNotifications(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(
        `${url}/api/notifications/${notificationId}/read`,
        {},
        { headers: { token } }
      );

      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(
        `${url}/api/notifications/mark-all-read`,
        { userId },
        { headers: { token } }
      );

      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true }))
      );
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await axios.delete(
        `${url}/api/notifications/${notificationId}`,
        { headers: { token } }
      );

      setNotifications(prev =>
        prev.filter(notif => notif._id !== notificationId)
      );
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = notifications.filter(notif =>
    filter === 'all' || (filter === 'unread' && !notif.isRead)
  );

  return (
    <div className='notifications-overlay' onClick={onClose}>
      <div className='notifications-panel' onClick={(e) => e.stopPropagation()}>
        <div className='notifications-header'>
          <h2>Notifications</h2>
          <button className='close-btn' onClick={onClose}>✕</button>
        </div>

        <div className='notifications-filters'>
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={filter === 'unread' ? 'active' : ''}
            onClick={() => setFilter('unread')}
          >
            Unread
          </button>
          {notifications.some(n => !n.isRead) && (
            <button className='mark-all-btn' onClick={markAllAsRead}>
              Mark all as read
            </button>
          )}
        </div>

        <div className='notifications-list'>
          {loading ? (
            <div className='loading-state'>Loading...</div>
          ) : filteredNotifications.length === 0 ? (
            <div className='empty-state'>
              <div className='empty-icon'>
                <img src={assets.notification_icon} alt="No Notifications" />
              </div>
              <p>No notifications</p>
            </div>
          ) : (
            filteredNotifications.map(notif => (
              <div
                key={notif._id}
                className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                onClick={() => !notif.isRead && markAsRead(notif._id)}
              >
                <div className='notif-content'>
                  <h4>{notif.title}</h4>
                  <p>{notif.message}</p>
                  <span className='notif-time'>{formatTime(notif.createdAt)}</span>
                </div>
                <button
                  className='delete-btn'
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notif._id);
                  }}
                >
                  ✕
                </button>
                {!notif.isRead && <div className='unread-dot'></div>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
