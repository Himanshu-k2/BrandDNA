import Notification from '../models/Notification.js';

/**
 * @route   GET /api/notifications
 * @desc    Get user's in-app notifications
 * @access  Private
 */
export const getNotifications = async (req, res, next) => {
  try {
    const recipientId = req.user._id;

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipientId })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate('reviewId', 'content status currentVersion'),
      Notification.countDocuments({ recipientId, isRead: false }),
    ]);

    res.status(200).json({
      success: true,
      unreadCount,
      data: notifications.map((n) => n.toJSON()),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark single notification as read
 * @access  Private
 */
export const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipientId: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/notifications/read-all
 * @desc    Mark all user notifications as read
 * @access  Private
 */
export const markAllNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ recipientId: req.user._id, isRead: false }, { isRead: true });

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};
