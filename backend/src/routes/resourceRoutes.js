const express = require('express');
const router = express.Router();
const {
  getResources,
  getResourceById,
  getResourcesBySubject,
  createResource,
  updateResource,
  deleteResource,
  getResourceStats,
} = require('../controllers/resourceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/stats', protect, authorize('admin', 'professor'), getResourceStats);
router.get('/subject/:subjectId', protect, getResourcesBySubject);
router.get('/:id', protect, getResourceById);
router.get('/', protect, getResources);

router.post('/', protect, authorize('professor', 'admin'), createResource);
router.put('/:id', protect, authorize('professor', 'admin'), updateResource);
router.delete('/:id', protect, authorize('professor', 'admin'), deleteResource);

module.exports = router;
