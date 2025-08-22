const router = require('express').Router();
const auth = require('../middleware/auth');
const {
  getMyNotifications,   // <- plural
  getUnreadCount,
  markRead,
  markAllRead
} = require('../controllers/notificationController');

router.get('/', auth, getMyNotifications);
router.get('/unread-count', auth, getUnreadCount);
router.patch('/:id/read', auth, markRead);
router.patch('/read-all', auth, markAllRead);

module.exports = router;
