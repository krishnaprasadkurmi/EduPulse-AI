const Subject = require('../models/Subject');
const Professor = require('../models/Professor');
const Enrollment = require('../models/Enrollment');
const Student = require('../models/Student');

// @desc Get all subjects (optionally filtered by professor or current user)
// @route GET /api/subjects
exports.getSubjects = async (req, res) => {
  try {
    const { professorId } = req.query;
    const filter = {};

    if (professorId) {
      filter.professorIds = professorId;
    } else if (req.user && req.user.role === 'professor') {
      const prof = await Professor.findOne({ userId: req.user._id });
      if (prof) {
        filter.professorIds = prof._id;
      }
    }

    const subjects = await Subject.find(filter).populate({
      path: 'professorIds',
      populate: { path: 'userId', select: 'name email avatar' },
    });

    res.json({
      success: true,
      count: subjects.length,
      data: subjects,
    });
  } catch (err) {
    console.error('[SubjectController] getSubjects error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving subjects' });
  }
};

// @desc Get single subject with enrolled student roster
// @route GET /api/subjects/:id
exports.getSubjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const subject = await Subject.findById(id).populate({
      path: 'professorIds',
      populate: { path: 'userId', select: 'name email avatar' },
    });

    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    // Fetch enrolled students roster
    const enrollments = await Enrollment.find({ subjectId: subject._id })
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'name email avatar' },
      });

    const roster = enrollments.map((e) => ({
      enrollmentId: e._id,
      studentId: e.studentId?._id,
      studentCode: e.studentId?.studentId,
      name: e.studentId?.userId?.name || 'Unknown',
      email: e.studentId?.userId?.email || '',
      avatar: e.studentId?.userId?.avatar || '',
      cgpa: e.studentId?.cgpa || 7.0,
      semester: e.studentId?.semester || subject.semester,
    }));

    res.json({
      success: true,
      data: {
        ...subject.toObject(),
        roster,
      },
    });
  } catch (err) {
    console.error('[SubjectController] getSubjectById error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving subject' });
  }
};

// @desc Create new subject
// @route POST /api/subjects
exports.createSubject = async (req, res) => {
  try {
    const { code, name, department, semester, credits, maxMark, professorIds } = req.body;

    const existing = await Subject.findOne({ code: code.toUpperCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Subject code already exists' });
    }

    const subject = await Subject.create({
      code: code.toUpperCase().trim(),
      name,
      department,
      semester,
      credits: credits || 4,
      maxMark: maxMark || 100,
      professorIds: professorIds || [],
    });

    res.status(201).json({
      success: true,
      data: subject,
    });
  } catch (err) {
    console.error('[SubjectController] createSubject error:', err);
    res.status(500).json({ success: false, message: 'Server error creating subject' });
  }
};

// @desc Update subject
// @route PUT /api/subjects/:id
exports.updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Subject.findByIdAndUpdate(id, req.body, { new: true });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    console.error('[SubjectController] updateSubject error:', err);
    res.status(500).json({ success: false, message: 'Server error updating subject' });
  }
};
