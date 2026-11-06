const express = require('express');
const router = express.Router();
const {
  getExams,
  getUpcomingExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
} = require('../controllers/examController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/upcoming', protect, getUpcomingExams);
router.get('/:id', protect, getExamById);
router.get('/', protect, getExams);

router.post('/', protect, authorize('professor', 'admin'), createExam);
router.put('/:id', protect, authorize('professor', 'admin'), updateExam);
router.delete('/:id', protect, authorize('professor', 'admin'), deleteExam);

module.exports = router;
