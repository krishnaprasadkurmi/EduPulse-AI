const Student = require('../models/Student');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Subject = require('../models/Subject');
const RiskScore = require('../models/RiskScore');
const Attendance = require('../models/Attendance');

// @desc Get all students
// @route GET /api/students
exports.getStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate('userId', 'name email avatar department')
      .sort({ studentId: 1 });

    res.json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (err) {
    console.error('[StudentController] getStudents error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving students' });
  }
};

// @desc Get student by ID (or userId)
// @route GET /api/students/:id
exports.getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    // Support querying either by Student _id or User _id
    let student = await Student.findById(id).populate('userId', 'name email avatar department');
    if (!student) {
      student = await Student.findOne({ userId: id }).populate('userId', 'name email avatar department');
    }

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    // Role security check: Students can only view their own record unless Admin/Professor
    if (req.user.role === 'student' && String(student.userId._id) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to other student records' });
    }

    // Fetch enrollments and subjects
    const enrollments = await Enrollment.find({ studentId: student._id }).populate('subjectId');
    const riskScores = await RiskScore.find({ studentId: student._id }).populate('subjectId');

    res.json({
      success: true,
      data: {
        ...student.toObject(),
        enrollments,
        riskScores,
      },
    });
  } catch (err) {
    console.error('[StudentController] getStudentById error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving student details' });
  }
};

// @desc Update student profile
// @route PUT /api/students/:id
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { phone, semester, batch, department, cgpa } = req.body;

    let student = await Student.findById(id);
    if (!student) {
      student = await Student.findOne({ userId: id });
    }

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (req.user.role === 'student' && String(student.userId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this student' });
    }

    if (phone) student.phone = phone;
    if (semester) student.semester = semester;
    if (batch) student.batch = batch;
    if (department) student.department = department;
    if (cgpa !== undefined && (req.user.role === 'admin' || req.user.role === 'professor')) {
      student.cgpa = cgpa;
    }

    await student.save();

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: student,
    });
  } catch (err) {
    console.error('[StudentController] updateStudent error:', err);
    res.status(500).json({ success: false, message: 'Server error updating student' });
  }
};
