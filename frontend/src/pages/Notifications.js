import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Bus, AlertCircle, Check, Trash2, Info } from 'lucide-react';
import Navbar from '../components/Navbar';
import { notificationAPI } from '../services/api';
import socketService from '../services/socket';
import { useAuth } from '../context/AuthContext';
import './Notifications.css';

const Notifications = ({ onNavigate }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter]               = useState('all');
  const [loading, setLoading]             = useState(true);

  const handleNewNotification = useCallback((notif) => {
    setNotifications(prev => [
      { ...notif, _id: notif._id || String(Date.now()), isRead: false, createdAt: new Date() },
      ...prev
    ]);
  }, []);

  useEffect(() => {
    fetchNotifications();
    if (user?._id) {
      socketService.on(`notification_${user._id}`, handleNewNotification);
    }
    return () => {
      if (user?._id) socketService.off(`notification_${user._id}`, handleNewNotification);
    };
  }, [filter, user?._id, handleNewNotification]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = filter === 'all' ? {} : { isRead: filter === 'read' };
      const res = await notificationAPI.getNotifications(params);
      setNotifications(res.data.data || []);
    } catch {
      // Backend may have 0 notifications — show empty state, not error
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch { /* ignore */ }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch { /* ignore */ }
  };

  const handleDelete = async (id) => {
    try {
      await notificationAPI.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch { /* ignore */ }
  };

  const getIcon  = (type) => {
    if (type === 'bus_arrival') return <Bus size={20} />;
    if (type === 'delay')       return <AlertCircle size={20} />;
    return <Bell size={20} />;
  };
  const getColor = (type) => {
    if (type === 'bus_arrival') return 'green';
    if (type === 'delay')       return 'orange';
    if (type === 'route_change') return 'blue';
    return 'gray';
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const diff = (Date.now() - d) / 1000;
    if (diff < 60)   return 'Just now';
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return d.toLocaleDateString();
  };

  const filtered = filter === 'all' ? notifications
    : filter === 'unread' ? notifications.filter(n => !n.isRead)
    : notifications.filter(n => n.isRead);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) return (
    <>
      <Navbar currentPage="notifications" onNavigate={onNavigate} />
      <div className="notifications-loading"><div className="spinner"></div></div>
    </>
  );

  return (
    <>
      <Navbar currentPage="notifications" onNavigate={onNavigate} />
      <div className="notifications-page">
        <div className="notifications-container">

          <div className="notifications-header">
            <div>
              <h1>Notifications</h1>
              <p>Bus arrival alerts and route updates</p>
            </div>
            {unreadCount > 0 && (
              <button className="btn-secondary" onClick={handleMarkAllAsRead}>
                <Check size={20} /> Mark All Read
              </button>
            )}
          </div>

          <div className="notification-filters">
            {['all','unread','read'].map(f => (
              <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === 'unread' && unreadCount > 0 && <span className="count">{unreadCount}</span>}
              </button>
            ))}
          </div>

          <div className="notifications-list">
            {filtered.length === 0 ? (
              <div className="empty-notifications">
                <Bell size={64} />
                <h3>No notifications yet</h3>
                <p>You'll see bus arrival alerts and delay warnings here as buses move on the map.</p>
                <p style={{fontSize:'13px',color:'#888',marginTop:'8px'}}>
                  <Info size={14} style={{verticalAlign:'middle',marginRight:'4px'}}/>
                  Notifications are created automatically when buses are delayed or approaching your stop.
                </p>
              </div>
            ) : (
              filtered.map(n => (
                <div key={n._id} className={`notification-item ${!n.isRead ? 'unread' : ''}`}>
                  <div className={`notification-icon ${getColor(n.type)}`}>{getIcon(n.type)}</div>
                  <div className="notification-content">
                    <h3>{n.title}</h3>
                    <p>{n.message}</p>
                    <span className="notification-time">{formatTime(n.createdAt)}</span>
                  </div>
                  <div className="notification-actions">
                    {!n.isRead && (
                      <button className="notification-action-btn" onClick={() => handleMarkAsRead(n._id)} title="Mark as read">
                        <Check size={18} />
                      </button>
                    )}
                    <button className="notification-action-btn delete" onClick={() => handleDelete(n._id)} title="Delete">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </>
  );
};

export default Notifications;
