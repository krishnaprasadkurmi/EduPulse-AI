const express = require('express');
const router = express.Router();
const {
  recordAttendance,
  getStudentAttendance,
  getSubjectAttendance,
  getAttendancePrediction,
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('professor', 'admin'), recordAttendance);
router.get('/student/:studentId', protect, getStudentAttendance);
router.get('/subject/:subjectId', protect, getSubjectAttendance);
router.get('/prediction/:studentId/:subjectId', protect, getAttendancePrediction);

module.exports = router;
