const Notification = require('../models/Notification');

// @desc Get current user notifications
// @route GET /api/notifications
exports.getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      read: false,
    });

    res.json({
      success: true,
      unreadCount,
      count: notifications.length,
      data: notifications,
    });
  } catch (err) {
    console.error('[NotificationController] getUserNotifications error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving notifications' });
  }
};

// @desc Mark single notification as read
// @route PUT /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notif = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({
      success: true,
      data: notif,
    });
  } catch (err) {
    console.error('[NotificationController] markAsRead error:', err);
    res.status(500).json({ success: false, message: 'Server error updating notification' });
  }
};

// @desc Mark all notifications as read
// @route PUT /api/notifications/read-all
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (err) {
    console.error('[NotificationController] markAllRead error:', err);
    res.status(500).json({ success: false, message: 'Server error marking notifications read' });
  }
};

// @desc Manually trigger background academic health & alert check
// @route POST /api/notifications/run-cron
exports.triggerCronCheck = async (req, res) => {
  try {
    const { runAcademicHealthCheck } = require('../services/cronService');
    const result = await runAcademicHealthCheck();

    res.json({
      success: true,
      message: 'Academic health check completed and alerts dispatched',
      data: result,
    });
  } catch (err) {
    console.error('[NotificationController] triggerCronCheck error:', err);
    res.status(500).json({ success: false, message: 'Server error triggering health check' });
  }
};


