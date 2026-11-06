const Subject = require('../models/Subject');
const Enrollment = require('../models/Enrollment');
const Student = require('../models/Student');
const Mark = require('../models/Mark');
const Professor = require('../models/Professor');
const Attendance = require('../models/Attendance');
const Assignment = require('../models/Assignment');
const RiskScore = require('../models/RiskScore');
const { parseTranscript } = require('../services/voiceService');
const { notifyMarkUpdate } = require('../services/notificationService');
const { logAudit } = require('../services/auditService');
const { calculateSubjectRisk } = require('../services/riskService');
const { analyzeAttendanceTrend } = require('../services/attendanceService');

// Helper to recalculate risk
const triggerRiskUpdate = async (studentId, subjectId) => {
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
  } catch (e) {
    console.error('[VoiceController] triggerRiskUpdate error:', e.message);
  }
};

// Helper: Commit a mark entry to MongoDB, send notifications, log audit, and recalculate risk
const commitMarkRecord = async ({ studentId, subjectId, assessmentName, score, maxScore, user }) => {
  const existing = await Mark.findOne({ studentId, subjectId, assessmentName });
  const beforeState = existing ? existing.toObject() : null;

  const subject = await Subject.findById(subjectId);
  const resolvedMaxScore = maxScore || subject?.maxMark || 50;

  const mark = await Mark.findOneAndUpdate(
    { studentId, subjectId, assessmentName },
    {
      studentId,
      subjectId,
      assessmentName,
      score,
      maxScore: resolvedMaxScore,
      enteredBy: user._id,
    },
    { upsert: true, new: true }
  );

  // Log to Audit Log
  await logAudit({
    actorId: user._id,
    action: beforeState ? 'VOICE_UPDATE_MARK' : 'VOICE_CREATE_MARK',
    entityType: 'Mark',
    entityId: mark._id,
    before: beforeState,
    after: mark.toObject(),
    metadata: {
      studentId,
      subjectId,
      assessmentName,
      score,
      maxScore: resolvedMaxScore,
      isUpdate: !!beforeState,
      previousScore: beforeState?.score,
      voiceConfirmed: true,
    },
  });

  // Notify student
  let notificationSent = false;
  const student = await Student.findById(studentId).populate('userId');
  if (student && student.userId) {
    const notif = await notifyMarkUpdate({
      userId: student.userId._id,
      studentName: student.userId.name,
      subjectName: subject?.name || 'Academic Subject',
      assessmentName,
      score,
      maxScore: resolvedMaxScore,
      isUpdate: !!beforeState,
    });
    notificationSent = !!notif;
  }

  // Recalculate risk score
  await triggerRiskUpdate(studentId, subjectId);

  return {
    mark,
    isUpdate: !!beforeState,
    previousScore: beforeState?.score,
    studentName: student?.userId?.name || 'Student',
    subjectCode: subject?.code || 'Subject',
    subjectName: subject?.name || 'Subject',
    notificationSent,
  };
};

// @desc Parse raw voice/speech transcript into structured candidates (with multi-subject and direct-save support)
// @route POST /api/voice/parse
exports.parseVoiceInput = async (req, res) => {
  try {
    const { subjectId, assessmentName, directSave = false } = req.body;
    const rawTranscript = req.body.rawTranscript || req.body.transcript;

    if (!rawTranscript || !rawTranscript.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Speech or text transcript is required',
      });
    }

    // 1. Fetch available subjects for the professor (or all subjects if admin)
    let availableSubjects = [];
    if (req.user.role === 'professor') {
      const prof = await Professor.findOne({ userId: req.user._id }).populate('assignedSubjectIds');
      if (prof && prof.assignedSubjectIds?.length > 0) {
        availableSubjects = prof.assignedSubjectIds;
      } else {
        availableSubjects = await Subject.find({});
      }
    } else {
      availableSubjects = await Subject.find({});
    }

    let defaultSubject = null;
    if (subjectId && subjectId !== 'auto') {
      defaultSubject = availableSubjects.find((s) => s._id.toString() === subjectId.toString()) || (await Subject.findById(subjectId));
    }

    // 2. Build roster per subject & a combined unique roster of all students
    const rostersBySubject = {};
    const allStudentsMap = new Map();

    for (const subj of availableSubjects) {
      const enrollments = await Enrollment.find({ subjectId: subj._id }).populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'name email avatar' },
      });

      const rosterList = enrollments
        .filter((e) => e.studentId && e.studentId.userId)
        .map((e) => ({
          _id: e.studentId._id,
          studentId: e.studentId._id.toString(),
          code: e.studentId.studentId,
          name: e.studentId.userId.name,
          email: e.studentId.userId.email,
          userId: e.studentId.userId._id.toString(),
          avatar: e.studentId.userId.avatar,
        }));

      rostersBySubject[subj._id.toString()] = rosterList;

      for (const r of rosterList) {
        if (!allStudentsMap.has(r.studentId)) {
          allStudentsMap.set(r.studentId, r);
        }
      }
    }

    // If subject was pre-selected, also load its specific roster if not already in map
    if (defaultSubject && !rostersBySubject[defaultSubject._id.toString()]) {
      const enrollments = await Enrollment.find({ subjectId: defaultSubject._id }).populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'name email avatar' },
      });
      rostersBySubject[defaultSubject._id.toString()] = enrollments
        .filter((e) => e.studentId && e.studentId.userId)
        .map((e) => ({
          _id: e.studentId._id,
          studentId: e.studentId._id.toString(),
          code: e.studentId.studentId,
          name: e.studentId.userId.name,
          email: e.studentId.userId.email,
          userId: e.studentId.userId._id.toString(),
          avatar: e.studentId.userId.avatar,
        }));
    }

    // 3. Parse transcript using the upgraded parser
    const parsedCandidates = parseTranscript(rawTranscript, {
      defaultSubject,
      allSubjects: availableSubjects,
      rostersBySubject,
      allStudents: Array.from(allStudentsMap.values()),
      defaultAssessmentName: assessmentName || 'Midterm Assessment',
    });

    // 4. Enrich each candidate with existing marks in MongoDB (Detecting ADD vs UPDATE)
    for (const c of parsedCandidates) {
      if (c.matchedStudentId && c.matchedSubjectId) {
        const existing = await Mark.findOne({
          studentId: c.matchedStudentId,
          subjectId: c.matchedSubjectId,
          assessmentName: c.assessmentName,
        });

        if (existing) {
          c.isUpdate = true;
          c.previousScore = existing.score;
          c.message = `Update: Will change existing score from ${existing.score}/${c.maxScore} to ${c.parsedScore}/${c.maxScore}`;
        } else {
          c.isUpdate = false;
          c.message = `New entry: Will record ${c.parsedScore}/${c.maxScore}`;
        }
      }
    }

    // 5. If Direct Save Mode is requested, immediately commit all valid candidates!
    if (directSave && parsedCandidates.length > 0) {
      const validEntries = parsedCandidates.filter(
        (c) => c.status === 'VALID' && c.matchedStudentId && c.matchedSubjectId
      );

      if (validEntries.length > 0) {
        const savedResults = [];
        for (const item of validEntries) {
          const res = await commitMarkRecord({
            studentId: item.matchedStudentId,
            subjectId: item.matchedSubjectId,
            assessmentName: item.assessmentName,
            score: item.parsedScore,
            maxScore: item.maxScore,
            user: req.user,
          });
          savedResults.push(res);
        }

        // Build spoken speech feedback string
        const speechSummary = savedResults
          .map(
            (r) =>
              `${r.isUpdate ? 'Updated' : 'Recorded'} marks for ${r.studentName} in ${r.subjectCode}: ${r.mark.score} out of ${r.mark.maxScore}.`
          )
          .join(' ');

        return res.json({
          success: true,
          directSaved: true,
          savedCount: savedResults.length,
          speechSummary,
          message: `Successfully saved ${savedResults.length} marks directly to MongoDB!`,
          candidates: parsedCandidates,
          savedData: savedResults,
        });
      }
    }

    // Standard preview mode
    res.json({
      success: true,
      directSaved: false,
      rawTranscript,
      defaultSubject: defaultSubject
        ? { id: defaultSubject._id, code: defaultSubject.code, name: defaultSubject.name, maxMark: defaultSubject.maxMark }
        : null,
      assessmentName: assessmentName || 'Midterm Assessment',
      candidatesCount: parsedCandidates.length,
      candidates: parsedCandidates,
    });
  } catch (err) {
    console.error('[VoiceController] parseVoiceInput error:', err);
    res.status(500).json({ success: false, message: 'Server error parsing voice input: ' + err.message });
  }
};

// @desc Confirm and commit voice-entered marks to database
// @route POST /api/voice/confirm
exports.confirmVoiceMarks = async (req, res) => {
  try {
    const { subjectId, assessmentName = 'Midterm Assessment', confirmedEntries } = req.body;

    if (!confirmedEntries || !Array.isArray(confirmedEntries) || confirmedEntries.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No confirmed entries provided to commit',
      });
    }

    const savedMarks = [];
    const speechFragments = [];

    for (const item of confirmedEntries) {
      const targetSubjectId = item.subjectId || subjectId;
      const targetAssessmentName = item.assessmentName || assessmentName;
      const { studentId, score, maxScore } = item;

      if (!studentId || !targetSubjectId || score === undefined) continue;

      const recordResult = await commitMarkRecord({
        studentId,
        subjectId: targetSubjectId,
        assessmentName: targetAssessmentName,
        score,
        maxScore,
        user: req.user,
      });

      savedMarks.push(recordResult);
      speechFragments.push(
        `${recordResult.isUpdate ? 'Updated' : 'Saved'} ${recordResult.studentName} in ${recordResult.subjectCode}: ${score}/${maxScore || 50}.`
      );
    }

    const speechSummary = speechFragments.join(' ');

    res.json({
      success: true,
      message: `Successfully saved ${savedMarks.length} confirmed marks from voice entry!`,
      savedCount: savedMarks.length,
      speechSummary,
      data: savedMarks.map((s) => s.mark),
    });
  } catch (err) {
    console.error('[VoiceController] confirmVoiceMarks error:', err);
    res.status(500).json({ success: false, message: 'Server error confirming voice marks' });
  }
};

// @desc Sample voice phrases
// @route POST /api/voice/transcribe
exports.transcribeVoice = async (req, res) => {
  try {
    const sampleTranscripts = [
      'Rahul Sharma, DBMS, 42.',
      'Priya Singh, Operating Systems, 45.',
      'Update Arjun Kumar DSA marks to 48.',
      'Rahul Sharma DBMS 42, Priya Singh OS 46, Arjun Kumar DSA 49.',
      'Neha Gupta AI 44.',
      'Ananya Patel Software Engineering 49.',
    ];

    res.json({
      success: true,
      message: 'Audio transcript adapter ready',
      sampleTranscripts,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error in transcribe adapter' });
  }
};
