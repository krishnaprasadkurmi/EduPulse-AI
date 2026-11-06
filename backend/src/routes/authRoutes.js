const express = require('express');
const router = express.Router();
const {
  login,
  register,
  getMe,
  updateProfile,
  sendTestAlert,
  testWhatsAppGateway,
  testEmailGateway,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/register', register);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/test-alert', protect, sendTestAlert);
router.post('/test-whatsapp', protect, testWhatsAppGateway);
router.post('/test-email', protect, testEmailGateway);

module.exports = router;
