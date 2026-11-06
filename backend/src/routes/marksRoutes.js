const express = require('express');
const router = express.Router();
const {
  createMark,
  updateMark,
  getStudentMarks,
  getSubjectMarks,
} = require('../controllers/marksController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('professor', 'admin'), createMark);
router.put('/:id', protect, authorize('professor', 'admin'), updateMark);
router.get('/student/:studentId', protect, getStudentMarks);
router.get('/subject/:subjectId', protect, getSubjectMarks);

module.exports = router;
