// controllers/notificationController.js
const Notification = require('../models/Notification');

async function getMyNotifications(req, res) {
  try {
    const me = req.user;
    const list = await Notification.find({ user: me }).sort({ createdAt: -1 }).limit(100);
    return res.json(list);
  } catch (err) {
    console.error('[notificationController.getMyNotifications]', err);
    return res.status(500).json({ message: err.message });
  }
}

async function getUnreadCount(req, res) {
  try {
    const me = req.user;
    const count = await Notification.countDocuments({ user: me, read: false });
    return res.json({ count });
  } catch (err) {
    console.error('[notificationController.getUnreadCount]', err);
    return res.status(500).json({ message: err.message });
  }
}

async function markRead(req, res) {
  try {
    const me = req.user;
    const { id } = req.params;
    const updated = await Notification.findOneAndUpdate(
      { _id: id, user: me },
      { $set: { read: true } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Notification not found' });
    return res.json(updated);
  } catch (err) {
    console.error('[notificationController.markRead]', err);
    return res.status(500).json({ message: err.message });
  }
}

async function markAllRead(req, res) {
  try {
    const me = req.user;
    await Notification.updateMany({ user: me, read: false }, { $set: { read: true } });
    return res.json({ message: 'All notifications marked read' });
  } catch (err) {
    console.error('[notificationController.markAllRead]', err);
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markRead,
  markAllRead
};
