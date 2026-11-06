const express = require('express');
const router = express.Router();
const {
  getUniversityAnalytics,
  getUniversityRiskMonitor,
  getAuditLogs,
  getCollectionsList,
  getCollectionData,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/analytics', protect, authorize('admin', 'professor'), getUniversityAnalytics);
router.get('/risk', protect, authorize('admin', 'professor'), getUniversityRiskMonitor);
router.get('/audit-logs', protect, authorize('admin'), getAuditLogs);
router.get('/collections', protect, authorize('admin'), getCollectionsList);
router.get('/collections/:name', protect, authorize('admin'), getCollectionData);

module.exports = router;
