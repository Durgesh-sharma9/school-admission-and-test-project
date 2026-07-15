const Notification = require('../models/Notification');

// @desc    Get all notifications for logged-in school
// @route   GET /api/v1/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const schoolId = req.school.id;
    const notifications = await Notification.find({ schoolId })
      .sort({ createdAt: -1 })
      .limit(50); // limit to recent 50 logs

    const unreadCount = await Notification.countDocuments({ schoolId, isRead: false });

    return res.json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching notifications' });
  }
};

// @desc    Mark a single notification as read
// @route   PUT /api/v1/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.school.id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    return res.json({ success: true, data: notification });
  } catch (error) {
    console.error('Mark read error:', error);
    return res.status(550).json({ success: false, message: 'Server error updating notification status' });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/v1/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    const schoolId = req.school.id;
    await Notification.updateMany({ schoolId, isRead: false }, { isRead: true });
    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    return res.status(500).json({ success: false, message: 'Server error clearing alerts' });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
