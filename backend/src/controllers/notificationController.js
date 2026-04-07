const Notification = require('../models/Notification');

// GET /api/notifications
exports.getNotifications = async (req, res) => {
  try {
    const filter = { user: req.user._id };
    if (req.query.isRead !== undefined) filter.isRead = req.query.isRead === 'true';

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ data: notifications });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

// PUT /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json({ data: notification });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark as read' });
  }
};

// PUT /api/notifications/read-all
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark all as read' });
  }
};

// DELETE /api/notifications/:id
exports.deleteNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete notification' });
  }
};

// Internal helper — called by simulation/IoT to push notifications to users
exports.createNotification = async (userId, title, message, type, busId, routeId) => {
  try {
    return await Notification.create({ user: userId, title, message, type, busId, routeId });
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
};
