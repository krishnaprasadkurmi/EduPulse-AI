const express = require('express');
const router = express.Router();
const { chat, confirm } = require('../controllers/copilotController');
const { protect } = require('../middleware/authMiddleware');

// All copilot endpoints require a verified JWT Bearer token
router.post('/chat', protect, chat);
router.post('/confirm', protect, confirm);

module.exports = router;
