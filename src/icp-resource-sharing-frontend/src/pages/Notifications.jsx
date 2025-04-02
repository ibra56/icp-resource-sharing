import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Notifications() {
  const { isAuthenticated, backendActor } = useContext(AuthContext);
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await backendActor.getMyNotifications(false); // Get all notifications, not just unread
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationIds) => {
    try {
      await backendActor.markNotificationsAsRead(notificationIds);
      loadNotifications(); // Reload to update read status
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      setError('Failed to mark notifications as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications
      .filter(notification => !notification.isRead)
      .map(notification => notification.id);
    
    if (unreadIds.length > 0) {
      await handleMarkAsRead(unreadIds);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="alert alert-warning">
        Please log in to view your notifications.
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Notifications</h2>
        
        {notifications.some(notification => !notification.isRead) && (
          <button 
            className="btn btn-outline-primary"
            onClick={handleMarkAllAsRead}
          >
            Mark All as Read
          </button>
        )}
      </div>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      {loading ? (
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="alert alert-info">
          You don't have any notifications yet.
        </div>
      ) : (
        <div className="list-group">
          {notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`list-group-item list-group-item-action ${!notification.isRead ? 'list-group-item-primary' : ''}`}
            >
              <div className="d-flex w-100 justify-content-between">
                <h5 className="mb-1">
                  {getNotificationTitle(notification.notificationType)}
                </h5>
                <small>
                  {new Date(Number(notification.timestamp) / 1000000).toLocaleString()}
                </small>
              </div>
              <p className="mb-1">{notification.message}</p>
              
              {notification.resourceId && (
                <Link 
                  to={`/resource/${notification.resourceId}`}
                  className="btn btn-sm btn-outline-secondary mt-2"
                >
                  View Resource
                </Link>
              )}
              
              {!notification.isRead && (
                <button 
                  className="btn btn-sm btn-outline-primary mt-2 ms-2"
                  onClick={() => handleMarkAsRead([notification.id])}
                >
                  Mark as Read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper function to get a human-readable title for notification types
function getNotificationTitle(type) {
  switch (type) {
    case 'ResourceClaimed':
      return 'Resource Claimed';
    case 'ResourceReserved':
      return 'Resource Reserved';
    case 'ReservationExpired':
      return 'Reservation Expired';
    case 'NewReview':
      return 'New Review';
    case 'ResourceExpiringSoon':
      return 'Resource Expiring Soon';
    default:
      if (type.Custom) {
        return type.Custom;
      }
      return 'Notification';
  }
}

export default Notifications;