const express = require('express');
const router = express.Router();
const {
  getStudentRisk,
  getSubjectRisk,
  recalculateRisk,
} = require('../controllers/riskController');
const { protect } = require('../middleware/authMiddleware');

router.get('/student/:studentId', protect, getStudentRisk);
router.get('/subject/:studentId/:subjectId', protect, getSubjectRisk);
router.post('/recalculate', protect, recalculateRisk);

module.exports = router;
