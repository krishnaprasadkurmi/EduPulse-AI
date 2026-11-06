const Mark = require('../models/Mark');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const RiskScore = require('../models/RiskScore');
const Attendance = require('../models/Attendance');
const Assignment = require('../models/Assignment');
const Professor = require('../models/Professor');
const { notifyMarkUpdate } = require('../services/notificationService');
const { calculateSubjectRisk } = require('../services/riskService');
const { analyzeAttendanceTrend } = require('../services/attendanceService');
const { logAudit } = require('../services/auditService');

// Helper to recalculate risk after marks change
const triggerStudentRiskRecalc = async (studentId, subjectId) => {
  try {
    const student = await Student.findById(studentId);
    const records = await Attendance.find({ studentId, subjectId }).sort({ date: 1 });
    const attendanceStats = analyzeAttendanceTrend(records);
    const marks = await Mark.find({ studentId, subjectId });
    const assignments = await Assignment.find({ subjectId });

    const riskCalc = calculateSubjectRisk({
      attendanceStats,
      marks,
      assignments,
      studentCGPA: student?.cgpa || 7.5,
    });

    await RiskScore.findOneAndUpdate(
      { studentId, subjectId },
      {
        studentId,
        subjectId,
        score: riskCalc.score,
        level: riskCalc.level,
        factors: riskCalc.factors,
        insights: riskCalc.insights,
        recommendations: riskCalc.recommendations,
        calculatedAt: new Date(),
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error('[MarksController] triggerStudentRiskRecalc error:', err.message);
  }
};

// @desc Create a new mark entry
// @route POST /api/marks
exports.createMark = async (req, res) => {
  try {
    const { studentId, subjectId, assessmentName, score, maxScore = 50, weight } = req.body;

    if (!studentId || !subjectId || !assessmentName || score === undefined) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (score < 0 || score > maxScore) {
      return res.status(400).json({
        success: false,
        message: `Mark score (${score}) must be between 0 and maximum mark (${maxScore})`,
      });
    }

    // Role check: If professor, verify subject is assigned
    if (req.user.role === 'professor') {
      const prof = await Professor.findOne({ userId: req.user._id });
      if (!prof || !prof.assignedSubjectIds.some((id) => id.toString() === subjectId.toString())) {
        return res.status(403).json({
          success: false,
          message: 'You are only authorized to enter marks for your assigned subjects',
        });
      }
    }

    const subject = await Subject.findById(subjectId);
    const student = await Student.findById(studentId).populate('userId');

    // Check if mark already exists for this assessment
    let existingMark = await Mark.findOne({ studentId, subjectId, assessmentName });
    let mark;
    let isUpdate = false;

    if (existingMark) {
      isUpdate = true;
      const beforeState = existingMark.toObject();
      existingMark.score = score;
      existingMark.maxScore = maxScore;
      if (weight) existingMark.weight = weight;
      existingMark.enteredBy = req.user._id;
      mark = await existingMark.save();

      await logAudit({
        actorId: req.user._id,
        action: 'UPDATE_MARK',
        entityType: 'Mark',
        entityId: mark._id,
        before: beforeState,
        after: mark.toObject(),
        metadata: { studentId, subjectId, assessmentName, score, maxScore },
      });
    } else {
      mark = await Mark.create({
        studentId,
        subjectId,
        assessmentName,
        score,
        maxScore,
        weight: weight || 20,
        enteredBy: req.user._id,
      });

      await logAudit({
        actorId: req.user._id,
        action: 'CREATE_MARK',
        entityType: 'Mark',
        entityId: mark._id,
        before: null,
        after: mark.toObject(),
        metadata: { studentId, subjectId, assessmentName, score, maxScore },
      });
    }

    // Trigger in-app notification to student
    if (student && student.userId) {
      await notifyMarkUpdate({
        userId: student.userId._id,
        studentName: student.userId.name,
        subjectName: subject?.name || 'Subject',
        assessmentName,
        score,
        maxScore,
        isUpdate,
      });
    }

    // Recalculate academic risk
    await triggerStudentRiskRecalc(studentId, subjectId);

    res.status(isUpdate ? 200 : 201).json({
      success: true,
      message: isUpdate ? 'Mark updated and student notified' : 'Mark recorded and student notified',
      data: mark,
    });
  } catch (err) {
    console.error('[MarksController] createMark error:', err);
    res.status(500).json({ success: false, message: 'Server error saving mark' });
  }
};

// @desc Update mark by ID
// @route PUT /api/marks/:id
exports.updateMark = async (req, res) => {
  try {
    const { id } = req.params;
    const { score, maxScore, assessmentName } = req.body;

    const mark = await Mark.findById(id);
    if (!mark) {
      return res.status(404).json({ success: false, message: 'Mark record not found' });
    }

    const effectiveMax = maxScore !== undefined ? maxScore : mark.maxScore;
    if (score !== undefined && (score < 0 || score > effectiveMax)) {
      return res.status(400).json({
        success: false,
        message: `Score (${score}) must be between 0 and ${effectiveMax}`,
      });
    }

    const beforeState = mark.toObject();

    if (score !== undefined) mark.score = score;
    if (maxScore !== undefined) mark.maxScore = maxScore;
    if (assessmentName) mark.assessmentName = assessmentName;
    mark.enteredBy = req.user._id;

    await mark.save();

    await logAudit({
      actorId: req.user._id,
      action: 'UPDATE_MARK',
      entityType: 'Mark',
      entityId: mark._id,
      before: beforeState,
      after: mark.toObject(),
      metadata: { score, maxScore },
    });

    const student = await Student.findById(mark.studentId).populate('userId');
    const subject = await Subject.findById(mark.subjectId);

    if (student && student.userId) {
      await notifyMarkUpdate({
        userId: student.userId._id,
        studentName: student.userId.name,
        subjectName: subject?.name || 'Subject',
        assessmentName: mark.assessmentName,
        score: mark.score,
        maxScore: mark.maxScore,
        isUpdate: true,
      });
    }

    await triggerStudentRiskRecalc(mark.studentId, mark.subjectId);

    res.json({
      success: true,
      message: 'Mark updated and risk score recalculated',
      data: mark,
    });
  } catch (err) {
    console.error('[MarksController] updateMark error:', err);
    res.status(500).json({ success: false, message: 'Server error updating mark' });
  }
};

// @desc Get all marks for a student
// @route GET /api/marks/student/:studentId
exports.getStudentMarks = async (req, res) => {
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

    const marks = await Mark.find({ studentId: student._id })
      .populate('subjectId', 'name code department semester maxMark')
      .populate('enteredBy', 'name role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: marks.length,
      data: marks,
    });
  } catch (err) {
    console.error('[MarksController] getStudentMarks error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving student marks' });
  }
};

// @desc Get all marks for a subject
// @route GET /api/marks/subject/:subjectId
exports.getSubjectMarks = async (req, res) => {
  try {
    const { subjectId } = req.params;

    const marks = await Mark.find({ subjectId })
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'name email avatar' },
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: marks.length,
      data: marks,
    });
  } catch (err) {
    console.error('[MarksController] getSubjectMarks error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving subject marks' });
  }
};
