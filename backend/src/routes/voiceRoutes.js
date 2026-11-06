const express = require('express');
const router = express.Router();
const {
  parseVoiceInput,
  confirmVoiceMarks,
  transcribeVoice,
} = require('../controllers/voiceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/parse', protect, authorize('professor', 'admin'), parseVoiceInput);
router.post('/confirm', protect, authorize('professor', 'admin'), confirmVoiceMarks);
router.post('/transcribe', protect, transcribeVoice);

module.exports = router;
