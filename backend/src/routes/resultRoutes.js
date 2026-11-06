const express = require('express');
const router = express.Router();
const {
  getMyResults,
  getMyGradeHistory,
  getMyAcademicSummary,
  getExamResults,
  saveResults,
  getAdminAnalytics,
} = require('../controllers/resultController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/my-results', protect, getMyResults);
router.get('/grade-history', protect, getMyGradeHistory);
router.get('/academic-summary', protect, getMyAcademicSummary);
router.get('/admin-analytics', protect, authorize('admin', 'professor'), getAdminAnalytics);
router.get('/exam/:examId', protect, authorize('professor', 'admin'), getExamResults);

router.post('/', protect, authorize('professor', 'admin'), saveResults);

module.exports = router;
