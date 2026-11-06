const Exam = require('../models/Exam');
const Subject = require('../models/Subject');
const Enrollment = require('../models/Enrollment');
const Student = require('../models/Student');
const Professor = require('../models/Professor');
const { sendExamReminder } = require('../services/notificationService');
const { logAudit } = require('../services/auditService');

/**
 * Helper to determine accessible subject IDs for the calling user
 */
const getAccessibleSubjectIds = async (user) => {
  if (user.role === 'admin') {
    const all = await Subject.find({}, '_id');
    return all.map((s) => s._id);
  }

  if (user.role === 'professor') {
    const prof = await Professor.findOne({ userId: user._id });
    return prof?.assignedSubjectIds || [];
  }

  if (user.role === 'student') {
    const student = await Student.findOne({ userId: user._id });
    if (!student) return [];
    const enrollments = await Enrollment.find({ studentId: student._id });
    return enrollments.map((e) => e.subjectId);
  }

  return [];
};

// @desc Get exams list with filters (upcoming, subject, examType, status)
// @route GET /api/exams
exports.getExams = async (req, res) => {
  try {
    const { subjectId, examType, status, upcoming } = req.query;
    const allowedSubjectIds = await getAccessibleSubjectIds(req.user);

    const query = {
      subjectId: { $in: allowedSubjectIds },
    };

    if (subjectId) {
      if (!allowedSubjectIds.some((id) => id.toString() === subjectId.toString())) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not authorized for this subject.',
        });
      }
      query.subjectId = subjectId;
    }

    if (examType && examType !== 'All') {
      query.examType = examType;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    // Filter upcoming vs all
    if (upcoming === 'true') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.date = { $gte: today };
      query.status = { $in: ['Scheduled', 'Published'] };
    }

    const exams = await Exam.find(query)
      .populate('subjectId', 'name code department semester')
      .populate('createdBy', 'name email role')
      .sort({ date: 1, startTime: 1 });

    res.json({
      success: true,
      count: exams.length,
      exams,
    });
  } catch (err) {
    console.error('[ExamController] getExams error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching exams' });
  }
};

// @desc Get upcoming exams specifically (convenience endpoint for student dashboard / copilot)
// @route GET /api/exams/upcoming
exports.getUpcomingExams = async (req, res) => {
  try {
    const allowedSubjectIds = await getAccessibleSubjectIds(req.user);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const exams = await Exam.find({
      subjectId: { $in: allowedSubjectIds },
      date: { $gte: today },
      status: { $in: ['Scheduled', 'Published'] },
    })
      .populate('subjectId', 'name code department semester')
      .populate('createdBy', 'name email')
      .sort({ date: 1, startTime: 1 });

    res.json({
      success: true,
      count: exams.length,
      exams,
    });
  } catch (err) {
    console.error('[ExamController] getUpcomingExams error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching upcoming exams' });
  }
};

// @desc Get single exam by ID
// @route GET /api/exams/:id
exports.getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('subjectId', 'name code department semester')
      .populate('createdBy', 'name email role');

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    res.json({ success: true, exam });
  } catch (err) {
    console.error('[ExamController] getExamById error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching exam' });
  }
};

// @desc Create a new exam schedule
// @route POST /api/exams
exports.createExam = async (req, res) => {
  try {
    const {
      name,
      subjectId,
      examType = 'Internal Assessment',
      date,
      startTime,
      endTime,
      venue = 'Main Hall',
      maxMarks = 50,
      status = 'Scheduled',
    } = req.body;

    if (!name || !subjectId || !date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Name, subjectId, date, startTime, and endTime are required.',
      });
    }

    // Role check: Professor can only schedule for assigned subjects
    if (req.user.role === 'professor') {
      const prof = await Professor.findOne({ userId: req.user._id });
      const isAssigned = prof?.assignedSubjectIds.some(
        (id) => id.toString() === subjectId.toString()
      );
      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only schedule exams for your assigned subjects.',
        });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only professors and admins can schedule exams.',
      });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }

    const exam = await Exam.create({
      name: name.trim(),
      subjectId,
      examType,
      date: new Date(date),
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      venue: venue.trim(),
      maxMarks: Number(maxMarks) || 50,
      status,
      createdBy: req.user._id,
    });

    // Notify enrolled students if published or scheduled
    if (status === 'Scheduled' || status === 'Published') {
      const enrollments = await Enrollment.find({ subjectId }).populate({
        path: 'studentId',
        populate: { path: 'userId' },
      });

      const daysRemaining = Math.ceil(
        (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      for (const e of enrollments) {
        const studentUser = e.studentId?.userId;
        if (studentUser) {
          sendExamReminder({
            userId: studentUser._id,
            examName: exam.name,
            subjectName: subject.name,
            examType: exam.examType,
            date: exam.date,
            time: `${exam.startTime} – ${exam.endTime}`,
            venue: exam.venue,
            daysRemaining,
          }).catch((err) =>
            console.warn('[ExamController] Exam reminder dispatch failed:', err.message)
          );
        }
      }
    }

    await logAudit({
      actorId: req.user._id,
      action: 'CREATE_EXAM',
      entityType: 'Exam',
      entityId: exam._id,
      after: exam.toObject(),
      metadata: { subjectCode: subject.code, examType: exam.examType },
    });

    const populated = await Exam.findById(exam._id)
      .populate('subjectId', 'name code department semester')
      .populate('createdBy', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Exam scheduled successfully and reminders dispatched!',
      exam: populated,
    });
  } catch (err) {
    console.error('[ExamController] createExam error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error creating exam' });
  }
};

// @desc Update an exam schedule
// @route PUT /api/exams/:id
exports.updateExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    if (req.user.role !== 'admin' && exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only edit exams that you created.',
      });
    }

    const {
      name,
      examType,
      date,
      startTime,
      endTime,
      venue,
      maxMarks,
      status,
    } = req.body;

    const beforeState = exam.toObject();

    if (name) exam.name = name.trim();
    if (examType) exam.examType = examType;
    if (date) exam.date = new Date(date);
    if (startTime) exam.startTime = startTime.trim();
    if (endTime) exam.endTime = endTime.trim();
    if (venue) exam.venue = venue.trim();
    if (maxMarks !== undefined) exam.maxMarks = Number(maxMarks);
    if (status) exam.status = status;

    await exam.save();

    await logAudit({
      actorId: req.user._id,
      action: 'UPDATE_EXAM',
      entityType: 'Exam',
      entityId: exam._id,
      before: beforeState,
      after: exam.toObject(),
    });

    const populated = await Exam.findById(exam._id)
      .populate('subjectId', 'name code department semester')
      .populate('createdBy', 'name email role');

    res.json({
      success: true,
      message: 'Exam schedule updated successfully!',
      exam: populated,
    });
  } catch (err) {
    console.error('[ExamController] updateExam error:', err);
    res.status(500).json({ success: false, message: 'Server error updating exam' });
  }
};

// @desc Delete / Cancel an exam
// @route DELETE /api/exams/:id
exports.deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    if (req.user.role !== 'admin' && exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only cancel/delete exams that you created.',
      });
    }

    const beforeState = exam.toObject();
    await exam.deleteOne();

    await logAudit({
      actorId: req.user._id,
      action: 'DELETE_EXAM',
      entityType: 'Exam',
      entityId: exam._id,
      before: beforeState,
    });

    res.json({
      success: true,
      message: 'Exam deleted successfully.',
    });
  } catch (err) {
    console.error('[ExamController] deleteExam error:', err);
    res.status(500).json({ success: false, message: 'Server error deleting exam' });
  }
};
