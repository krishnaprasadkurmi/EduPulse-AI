const express = require('express');
const router = express.Router();
const { getStudents, getStudentById, updateStudent } = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, authorize('admin', 'professor'), getStudents);
router.get('/:id', protect, getStudentById);
router.put('/:id', protect, updateStudent);

module.exports = router;
