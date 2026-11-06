const express = require('express');
const router = express.Router();
const {
  getUserNotifications,
  markAsRead,
  markAllRead,
  triggerCronCheck,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getUserNotifications);
router.put('/read-all', protect, markAllRead);
router.put('/:id/read', protect, markAsRead);
router.post('/run-cron', protect, triggerCronCheck);

module.exports = router;
