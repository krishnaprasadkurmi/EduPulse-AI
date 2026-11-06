const RiskScore = require('../models/RiskScore');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const Mark = require('../models/Mark');
const Assignment = require('../models/Assignment');
const { calculateSubjectRisk } = require('../services/riskService');
const { analyzeAttendanceTrend } = require('../services/attendanceService');
const { notifyHighRisk } = require('../services/notificationService');

// @desc Get student's risk profile across all subjects
// @route GET /api/risk/student/:studentId
exports.getStudentRisk = async (req, res) => {
  try {
    const { studentId } = req.params;

    let student = await Student.findById(studentId);
    if (!student) {
      student = await Student.findOne({ userId: studentId });
    }

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Role check
    if (req.user.role === 'student' && String(student.userId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const riskScores = await RiskScore.find({ studentId: student._id })
      .populate('subjectId', 'name code department semester maxMark')
      .sort({ score: -1 });

    // Calculate overall average risk index
    const total = riskScores.reduce((sum, r) => sum + r.score, 0);
    const averageScore = riskScores.length > 0 ? Math.round(total / riskScores.length) : 0;
    let overallLevel = 'LOW';
    if (averageScore >= 65) overallLevel = 'HIGH';
    else if (averageScore >= 35) overallLevel = 'MEDIUM';

    res.json({
      success: true,
      data: {
        studentId: student._id,
        averageScore,
        overallLevel,
        subjectRisks: riskScores,
      },
    });
  } catch (err) {
    console.error('[RiskController] getStudentRisk error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving risk scores' });
  }
};

// @desc Get subject-specific risk score and explainable drivers
// @route GET /api/risk/subject/:studentId/:subjectId
exports.getSubjectRisk = async (req, res) => {
  try {
    const { studentId, subjectId } = req.params;

    let student = await Student.findById(studentId);
    if (!student) {
      student = await Student.findOne({ userId: studentId });
    }

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    let risk = await RiskScore.findOne({ studentId: student._id, subjectId }).populate('subjectId');

    // If not calculated yet, compute on demand
    if (!risk) {
      const records = await Attendance.find({ studentId: student._id, subjectId }).sort({ date: 1 });
      const stats = analyzeAttendanceTrend(records);
      const marks = await Mark.find({ studentId: student._id, subjectId });
      const assignments = await Assignment.find({ subjectId });

      const calculated = calculateSubjectRisk({
        attendanceStats: stats,
        marks,
        assignments,
        studentCGPA: student.cgpa,
      });

      risk = await RiskScore.create({
        studentId: student._id,
        subjectId,
        score: calculated.score,
        level: calculated.level,
        factors: calculated.factors,
        insights: calculated.insights,
        recommendations: calculated.recommendations,
      });
      await risk.populate('subjectId');
    }

    res.json({
      success: true,
      data: risk,
    });
  } catch (err) {
    console.error('[RiskController] getSubjectRisk error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving subject risk' });
  }
};

// @desc Force recalculate risk for student and subject
// @route POST /api/risk/recalculate
exports.recalculateRisk = async (req, res) => {
  try {
    const { studentId, subjectId } = req.body;

    if (!studentId || !subjectId) {
      return res.status(400).json({
        success: false,
        message: 'studentId and subjectId are required for recalculation',
      });
    }

    let student = await Student.findById(studentId).populate('userId');
    if (!student) {
      student = await Student.findOne({ userId: studentId }).populate('userId');
    }

    const subject = await Subject.findById(subjectId);
    if (!subject || !student) {
      return res.status(404).json({ success: false, message: 'Student or Subject not found' });
    }

    const records = await Attendance.find({ studentId: student._id, subjectId }).sort({ date: 1 });
    const stats = analyzeAttendanceTrend(records);
    const marks = await Mark.find({ studentId: student._id, subjectId });
    const assignments = await Assignment.find({ subjectId });

    const calculated = calculateSubjectRisk({
      attendanceStats: stats,
      marks,
      assignments,
      studentCGPA: student.cgpa,
    });

    const previous = await RiskScore.findOne({ studentId: student._id, subjectId });
    const wasHigh = previous?.level === 'HIGH';

    const updated = await RiskScore.findOneAndUpdate(
      { studentId: student._id, subjectId },
      {
        studentId: student._id,
        subjectId,
        score: calculated.score,
        level: calculated.level,
        factors: calculated.factors,
        insights: calculated.insights,
        recommendations: calculated.recommendations,
        calculatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // If transitioned to HIGH risk, notify
    if (!wasHigh && calculated.level === 'HIGH' && student.userId) {
      await notifyHighRisk({
        userId: student.userId._id,
        subjectName: subject.name,
        score: calculated.score,
        insights: calculated.insights,
      });
    }

    res.json({
      success: true,
      message: 'Risk score recalculated successfully',
      data: updated,
    });
  } catch (err) {
    console.error('[RiskController] recalculateRisk error:', err);
    res.status(500).json({ success: false, message: 'Server error recalculating risk' });
  }
};
