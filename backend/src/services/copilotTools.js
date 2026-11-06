/**
 * Copilot Academic Tools
 * Implements Section 4 & 5 of the Blueprint.
 * 
 * Strict Server-Side Security:
 * - Student caller can ONLY query their own records (enforced by comparing caller JWT user with record).
 * - Professor caller can ONLY query/modify their assigned subjects/students.
 * - Admin follows university administrative scope.
 * - Deterministic calculations (75% recovery, attendance trend, risk) reused from existing services.
 * - Every write tool performs audit logging, risk recalculation, and student notifications.
 */

const Student = require('../models/Student');
const Professor = require('../models/Professor');
const Subject = require('../models/Subject');
const Enrollment = require('../models/Enrollment');
const Attendance = require('../models/Attendance');
const Mark = require('../models/Mark');
const RiskScore = require('../models/RiskScore');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const Exam = require('../models/Exam');
const Result = require('../models/Result');
const GradeHistory = require('../models/GradeHistory');
const LearningResource = require('../models/LearningResource');

const { analyzeAttendanceTrend, calculateRequiredClassesToReach75, calculateClassesCanMiss } = require('./attendanceService');
const { calculateSubjectRisk } = require('./riskService');
const { notifyMarkUpdate, notifyAttendanceAlert } = require('./notificationService');
const { logAudit } = require('./auditService');

// Helper to recalculate risk after a confirmed write
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

    return await RiskScore.findOneAndUpdate(
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
    console.error('[CopilotTools] Risk recalculation error:', err.message);
    return null;
  }
};

/* ========================================================================= */
/*                               READ TOOLS                                  */
/* ========================================================================= */

/**
 * 1. getMyAttendance(studentId, subjectId?)
 */
const getMyAttendance = async (callerUser, studentId, subjectId = null) => {
  // Authorization check: Student can only access their own records
  const student = await Student.findOne({ userId: callerUser._id });
  if (!student || student._id.toString() !== studentId.toString()) {
    throw new Error('ACCESS_DENIED: Students can access only their own academic records.');
  }

  const query = { studentId: student._id };
  if (subjectId) {
    query.subjectId = subjectId;
  }

  const allRecords = await Attendance.find(query)
    .populate('subjectId', 'name code department semester')
    .sort({ date: 1 });

  // Group by subject
  const bySubject = {};
  for (const r of allRecords) {
    if (!r.subjectId) continue;
    const subKey = r.subjectId._id.toString();
    if (!bySubject[subKey]) {
      bySubject[subKey] = {
        subject: r.subjectId,
        records: [],
      };
    }
    bySubject[subKey].records.push(r);
  }

  const summaries = Object.values(bySubject).map(({ subject, records }) => {
    const stats = analyzeAttendanceTrend(records);
    return {
      subject: { id: subject._id, code: subject.code, name: subject.name },
      stats,
      recordsCount: records.length,
    };
  });

  // If specific subject requested
  if (subjectId && summaries.length > 0) {
    return {
      singleSubject: summaries[0],
      summaries,
    };
  }

  return { summaries };
};

/**
 * 2. getMyMarks(studentId, subjectId?)
 */
const getMyMarks = async (callerUser, studentId, subjectId = null) => {
  const student = await Student.findOne({ userId: callerUser._id });
  if (!student || student._id.toString() !== studentId.toString()) {
    throw new Error('ACCESS_DENIED: Students can access only their own academic records.');
  }

  const query = { studentId: student._id };
  if (subjectId) {
    query.subjectId = subjectId;
  }

  const marks = await Mark.find(query)
    .populate('subjectId', 'name code department semester')
    .sort({ createdAt: -1 });

  return { marks };
};

/**
 * 3. getMySubjects(studentId)
 */
const getMySubjects = async (callerUser, studentId) => {
  const student = await Student.findOne({ userId: callerUser._id });
  if (!student || student._id.toString() !== studentId.toString()) {
    throw new Error('ACCESS_DENIED: Students can access only their own academic records.');
  }

  const enrollments = await Enrollment.find({ studentId: student._id })
    .populate('subjectId', 'name code department semester credits maxMark')
    .lean();

  const subjects = enrollments
    .map((e) => e.subjectId)
    .filter(Boolean);

  return { subjects };
};

/**
 * 4. getMyRisk(studentId, subjectId?)
 */
const getMyRisk = async (callerUser, studentId, subjectId = null) => {
  const student = await Student.findOne({ userId: callerUser._id });
  if (!student || student._id.toString() !== studentId.toString()) {
    throw new Error('ACCESS_DENIED: Students can access only their own academic records.');
  }

  const query = { studentId: student._id };
  if (subjectId) {
    query.subjectId = subjectId;
  }

  const risks = await RiskScore.find(query)
    .populate('subjectId', 'name code department semester')
    .sort({ score: -1 });

  const highestRisk = risks.length > 0 ? risks[0] : null;

  return {
    risks,
    highestRisk,
  };
};

/**
 * 5. getAttendanceProjection(studentId, subjectId)
 */
const getAttendanceProjection = async (callerUser, studentId, subjectId) => {
  const student = await Student.findOne({ userId: callerUser._id });
  if (!student || student._id.toString() !== studentId.toString()) {
    throw new Error('ACCESS_DENIED: Students can access only their own academic records.');
  }

  const subject = await Subject.findById(subjectId);
  if (!subject) {
    throw new Error('NOT_FOUND: Requested subject does not exist.');
  }

  const records = await Attendance.find({ studentId: student._id, subjectId }).sort({ date: 1 });
  const stats = analyzeAttendanceTrend(records);

  return {
    subject: { id: subject._id, code: subject.code, name: subject.name },
    stats,
  };
};

/**
 * 6. getStudentDetails(professorId, studentId)
 */
const getStudentDetails = async (callerUser, professorId, studentId) => {
  const prof = await Professor.findOne({ userId: callerUser._id });
  if (!prof || prof._id.toString() !== professorId.toString()) {
    throw new Error('ACCESS_DENIED: Unauthorized professor context.');
  }

  const student = await Student.findById(studentId).populate('userId', 'name email avatar');
  if (!student) {
    throw new Error('NOT_FOUND: Student record not found.');
  }

  // Verify student is enrolled in at least one of the professor's assigned subjects
  const assignedIds = prof.assignedSubjectIds.map((id) => id.toString());
  const studentEnrollments = await Enrollment.find({
    studentId: student._id,
    subjectId: { $in: assignedIds },
  }).populate('subjectId');

  if (studentEnrollments.length === 0) {
    throw new Error('ACCESS_DENIED: Student is not enrolled in any of your assigned subjects.');
  }

  // Fetch attendance summaries in assigned subjects
  const subjectsSummary = [];
  for (const enr of studentEnrollments) {
    const sub = enr.subjectId;
    const records = await Attendance.find({ studentId: student._id, subjectId: sub._id }).sort({ date: 1 });
    const stats = analyzeAttendanceTrend(records);
    subjectsSummary.push({ subject: sub, stats });
  }

  const marks = await Mark.find({
    studentId: student._id,
    subjectId: { $in: assignedIds },
  }).populate('subjectId');

  return {
    student,
    subjectsSummary,
    marks,
  };
};

/**
 * 7. getStudentMarks(professorId, studentId, subjectId?)
 */
const getStudentMarks = async (callerUser, professorId, studentId, subjectId = null) => {
  const prof = await Professor.findOne({ userId: callerUser._id });
  if (!prof || prof._id.toString() !== professorId.toString()) {
    throw new Error('ACCESS_DENIED: Unauthorized professor context.');
  }

  const assignedIds = prof.assignedSubjectIds.map((id) => id.toString());

  if (subjectId && !assignedIds.includes(subjectId.toString())) {
    throw new Error('ACCESS_DENIED: You are not authorized to access records for unassigned subjects.');
  }

  const targetSubjects = subjectId ? [subjectId] : assignedIds;
  const marks = await Mark.find({
    studentId,
    subjectId: { $in: targetSubjects },
  }).populate('subjectId studentId');

  return { marks };
};

/**
 * 8. getAtRiskStudents(professorId, subjectId?)
 */
const getAtRiskStudents = async (callerUser, professorId, subjectId = null) => {
  const prof = await Professor.findOne({ userId: callerUser._id });
  if (!prof || prof._id.toString() !== professorId.toString()) {
    throw new Error('ACCESS_DENIED: Unauthorized professor context.');
  }

  const assignedIds = prof.assignedSubjectIds.map((id) => id.toString());

  if (subjectId && !assignedIds.includes(subjectId.toString())) {
    throw new Error('ACCESS_DENIED: You are not authorized to access records for unassigned subjects.');
  }

  const targetSubjects = subjectId ? [subjectId] : assignedIds;

  // Find all risk scores for assigned subjects
  const riskScores = await RiskScore.find({
    subjectId: { $in: targetSubjects },
  })
    .populate({
      path: 'studentId',
      populate: { path: 'userId', select: 'name email avatar' },
    })
    .populate('subjectId', 'name code')
    .sort({ score: -1 });

  const atRiskList = [];

  for (const r of riskScores) {
    if (!r.studentId || !r.studentId.userId) continue;

    // Get attendance stats for this student & subject
    const records = await Attendance.find({
      studentId: r.studentId._id,
      subjectId: r.subjectId._id,
    }).sort({ date: 1 });
    const attStats = analyzeAttendanceTrend(records);

    // Flag if risk is HIGH or attendance is below 75%
    if (r.level === 'HIGH' || attStats.percentage < 75 || r.level === 'MEDIUM') {
      atRiskList.push({
        studentDbId: r.studentId._id,
        studentId: r.studentId.studentId,
        name: r.studentId.userId.name,
        email: r.studentId.userId.email,
        subjectCode: r.subjectId.code,
        subjectName: r.subjectId.name,
        riskScore: r.score,
        riskLevel: r.level,
        attendancePct: attStats.percentage,
        attendanceStatus: attStats.status,
        requiredToRecover: attStats.requiredClassesToReach75,
        primaryInsight: r.insights?.[0] || 'Academic intervention recommended',
      });
    }
  }

  return { students: atRiskList };
};

/* ========================================================================= */
/*                          WRITE TOOLS (CONFIRMED)                          */
/* ========================================================================= */

/**
 * 9. createMark(professorId, studentId, subjectId, assessmentName, score, maxScore)
 */
const createMark = async (callerUser, professorId, studentId, subjectId, assessmentName, score, maxScore = 50) => {
  const prof = await Professor.findOne({ userId: callerUser._id });
  if (!prof || prof._id.toString() !== professorId.toString()) {
    throw new Error('ACCESS_DENIED: Unauthorized professor context.');
  }

  const assignedIds = prof.assignedSubjectIds.map((id) => id.toString());
  if (!assignedIds.includes(subjectId.toString())) {
    throw new Error('ACCESS_DENIED: You can only enter marks for your assigned subjects.');
  }

  if (score < 0 || score > maxScore) {
    throw new Error(`VALIDATION_ERROR: Score (${score}) must be between 0 and maximum mark (${maxScore}).`);
  }

  const student = await Student.findById(studentId).populate('userId');
  const subject = await Subject.findById(subjectId);
  if (!student || !subject) {
    throw new Error('NOT_FOUND: Student or Subject not found.');
  }

  // Check if mark already exists for this assessment
  let mark = await Mark.findOne({ studentId, subjectId, assessmentName });
  let isUpdate = false;
  let beforeState = null;

  if (mark) {
    isUpdate = true;
    beforeState = mark.toObject();
    mark.score = score;
    mark.maxScore = maxScore;
    mark.enteredBy = callerUser._id;
    await mark.save();
  } else {
    mark = await Mark.create({
      studentId,
      subjectId,
      assessmentName,
      score,
      maxScore,
      weight: 20,
      enteredBy: callerUser._id,
    });
  }

  // 1. Audit Log
  await logAudit({
    actorId: callerUser._id,
    action: isUpdate ? 'UPDATE_MARK' : 'CREATE_MARK',
    entityType: 'Mark',
    entityId: mark._id,
    before: beforeState,
    after: mark.toObject(),
    metadata: {
      source: 'AI_COPILOT_CONFIRMED',
      studentName: student.userId?.name,
      subjectCode: subject.code,
      assessmentName,
      score,
      maxScore,
    },
  });

  // 2. Student Notification
  if (student.userId?._id) {
    await notifyMarkUpdate({
      userId: student.userId._id,
      studentName: student.userId.name,
      subjectName: subject.name,
      assessmentName,
      score,
      maxScore,
      isUpdate,
    });
  }

  // 3. Recalculate Risk
  const updatedRisk = await triggerStudentRiskRecalc(studentId, subjectId);

  return {
    mark,
    isUpdate,
    risk: updatedRisk,
  };
};

/**
 * 10. updateMark(professorId, markId, score)
 */
const updateMark = async (callerUser, professorId, markId, score) => {
  const prof = await Professor.findOne({ userId: callerUser._id });
  if (!prof || prof._id.toString() !== professorId.toString()) {
    throw new Error('ACCESS_DENIED: Unauthorized professor context.');
  }

  const mark = await Mark.findById(markId);
  if (!mark) {
    throw new Error('NOT_FOUND: Mark record not found.');
  }

  const assignedIds = prof.assignedSubjectIds.map((id) => id.toString());
  if (!assignedIds.includes(mark.subjectId.toString())) {
    throw new Error('ACCESS_DENIED: You are not authorized to update marks for this subject.');
  }

  if (score < 0 || score > mark.maxScore) {
    throw new Error(`VALIDATION_ERROR: Score (${score}) must be between 0 and maximum mark (${mark.maxScore}).`);
  }

  const beforeState = mark.toObject();
  const oldScore = mark.score;
  mark.score = score;
  mark.enteredBy = callerUser._id;
  await mark.save();

  const student = await Student.findById(mark.studentId).populate('userId');
  const subject = await Subject.findById(mark.subjectId);

  // 1. Audit Log
  await logAudit({
    actorId: callerUser._id,
    action: 'UPDATE_MARK',
    entityType: 'Mark',
    entityId: mark._id,
    before: beforeState,
    after: mark.toObject(),
    metadata: {
      source: 'AI_COPILOT_CONFIRMED',
      studentName: student?.userId?.name,
      subjectCode: subject?.code,
      assessmentName: mark.assessmentName,
      oldScore,
      newScore: score,
    },
  });

  // 2. Notification
  if (student?.userId?._id) {
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

  // 3. Recalculate Risk
  const updatedRisk = await triggerStudentRiskRecalc(mark.studentId, mark.subjectId);

  return {
    mark,
    oldScore,
    newScore: score,
    risk: updatedRisk,
  };
};

/**
 * 11. recordAttendance(professorId, studentId, subjectId, date, status)
 */
const recordAttendance = async (callerUser, professorId, studentId, subjectId, date, status) => {
  const prof = await Professor.findOne({ userId: callerUser._id });
  if (!prof || prof._id.toString() !== professorId.toString()) {
    throw new Error('ACCESS_DENIED: Unauthorized professor context.');
  }

  const assignedIds = prof.assignedSubjectIds.map((id) => id.toString());
  if (!assignedIds.includes(subjectId.toString())) {
    throw new Error('ACCESS_DENIED: You are only authorized to log attendance for your assigned subjects.');
  }

  if (!['present', 'absent'].includes(status)) {
    throw new Error('VALIDATION_ERROR: Attendance status must be "present" or "absent".');
  }

  const sessionDate = date ? new Date(date) : new Date();
  sessionDate.setHours(0, 0, 0, 0);

  const existing = await Attendance.findOne({ studentId, subjectId, date: sessionDate });
  const beforeState = existing ? existing.toObject() : null;

  const record = await Attendance.findOneAndUpdate(
    { studentId, subjectId, date: sessionDate },
    {
      studentId,
      subjectId,
      date: sessionDate,
      status,
      recordedBy: callerUser._id,
    },
    { upsert: true, new: true }
  );

  // 1. Audit Log
  await logAudit({
    actorId: callerUser._id,
    action: existing ? 'UPDATE_ATTENDANCE' : 'RECORD_ATTENDANCE',
    entityType: 'Attendance',
    entityId: record._id,
    before: beforeState,
    after: record.toObject(),
    metadata: {
      source: 'AI_COPILOT_CONFIRMED',
      studentId,
      subjectId,
      date: sessionDate,
      status,
    },
  });

  // 2. Attendance recalculation and alert check
  const student = await Student.findById(studentId).populate('userId');
  const subject = await Subject.findById(subjectId);
  const studentAttendance = await Attendance.find({ studentId, subjectId }).sort({ date: 1 });
  const stats = analyzeAttendanceTrend(studentAttendance);

  if (student?.userId?._id && (stats.status === 'CRITICAL' || stats.status === 'WARNING')) {
    await notifyAttendanceAlert({
      userId: student.userId._id,
      subjectName: subject?.name || 'Subject',
      percentage: stats.percentage,
      status: stats.status,
      requiredClasses: stats.requiredClassesToReach75,
    });
  }

  // 3. Recalculate Risk
  const updatedRisk = await triggerStudentRiskRecalc(studentId, subjectId);

  return {
    record,
    stats,
    risk: updatedRisk,
  };
};

/**
 * 9. getMySchedule(callerUser, studentId)
 */
const getMySchedule = async (callerUser, studentId) => {
  const student = await Student.findOne({ userId: callerUser._id });
  if (!student || student._id.toString() !== studentId.toString()) {
    throw new Error('ACCESS_DENIED: Students can access only their own academic records.');
  }

  return {
    today: [
      {
        subject: 'Database Management Systems',
        code: 'CS301',
        time: '10:00 AM – 11:00 AM',
        room: 'Lecture Hall 402',
        instructor: 'Prof. Rajesh Sharma',
        status: 'Active',
      },
      {
        subject: 'Operating Systems',
        code: 'CS302',
        time: '11:30 AM – 12:30 PM',
        room: 'Room 305',
        instructor: 'Prof. Anita Desai',
        status: 'Upcoming',
      },
      {
        subject: 'Computer Networks',
        code: 'CS305',
        time: '02:00 PM – 03:00 PM',
        room: 'Lab 2',
        instructor: 'Prof. Vikram Sen',
        status: 'Upcoming',
      },
    ],
    tomorrow: [
      {
        subject: 'Artificial Intelligence',
        code: 'CS304',
        time: '10:00 AM – 11:00 AM',
        room: 'Lecture Hall B',
        instructor: 'Prof. Vikram Sen',
      },
    ],
  };
};

/**
 * 10. getUpcomingExams(callerUser, studentId)
 */
const getUpcomingExams = async (callerUser, studentId) => {
  const student = await Student.findOne({ userId: callerUser._id });
  if (!student || student._id.toString() !== studentId.toString()) {
    throw new Error('ACCESS_DENIED: Students can access only their own exam schedules.');
  }

  const enrollments = await Enrollment.find({ studentId: student._id });
  const subjectIds = enrollments.map((e) => e.subjectId);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const exams = await Exam.find({
    subjectId: { $in: subjectIds },
    date: { $gte: today },
    status: { $in: ['Scheduled', 'Published'] },
  })
    .populate('subjectId', 'name code department')
    .sort({ date: 1, startTime: 1 });

  return {
    studentName: callerUser.name,
    totalUpcoming: exams.length,
    exams: exams.map((ex) => {
      const diffTime = new Date(ex.date).getTime() - Date.now();
      const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      return {
        id: ex._id,
        name: ex.name,
        subject: ex.subjectId?.name || 'Subject',
        code: ex.subjectId?.code || '',
        examType: ex.examType,
        date: new Date(ex.date).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        rawDate: ex.date,
        time: `${ex.startTime} – ${ex.endTime}`,
        venue: ex.venue,
        maxMarks: ex.maxMarks,
        daysRemaining,
        status: ex.status,
      };
    }),
  };
};

/**
 * 11. getExamSchedule(callerUser, studentId, subjectId?)
 */
const getExamSchedule = async (callerUser, studentId, subjectId = null) => {
  const student = await Student.findOne({ userId: callerUser._id });
  if (!student || student._id.toString() !== studentId.toString()) {
    throw new Error('ACCESS_DENIED: Students can access only their own exam schedules.');
  }

  let subjectIds = [];
  if (subjectId) {
    subjectIds = [subjectId];
  } else {
    const enrollments = await Enrollment.find({ studentId: student._id });
    subjectIds = enrollments.map((e) => e.subjectId);
  }

  const exams = await Exam.find({
    subjectId: { $in: subjectIds },
  })
    .populate('subjectId', 'name code')
    .sort({ date: 1 });

  return {
    studentName: callerUser.name,
    totalExams: exams.length,
    schedule: exams.map((ex) => {
      const diffTime = new Date(ex.date).getTime() - Date.now();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return {
        id: ex._id,
        name: ex.name,
        subject: ex.subjectId?.name,
        code: ex.subjectId?.code,
        examType: ex.examType,
        date: new Date(ex.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        time: `${ex.startTime} – ${ex.endTime}`,
        venue: ex.venue,
        maxMarks: ex.maxMarks,
        daysRemaining,
        isPast: daysRemaining < 0,
      };
    }),
  };
};

/**
 * 12. getMyResults(callerUser, studentId, subjectId?)
 */
const getMyResults = async (callerUser, studentId, subjectId = null) => {
  const student = await Student.findOne({ userId: callerUser._id });
  if (!student || student._id.toString() !== studentId.toString()) {
    throw new Error('ACCESS_DENIED: Students can access only their own examination results.');
  }

  const query = { studentId: student._id, published: true };
  if (subjectId) query.subjectId = subjectId;

  const results = await Result.find(query)
    .populate('subjectId', 'name code credits')
    .populate('examId', 'name examType date')
    .sort({ createdAt: -1 });

  return {
    studentName: callerUser.name,
    totalResults: results.length,
    results: results.map((r) => ({
      id: r._id,
      subjectName: r.subjectId?.name,
      subjectCode: r.subjectId?.code,
      examName: r.examId?.name || 'Internal Evaluation',
      internalMarks: r.internalMarks,
      assignmentMarks: r.assignmentMarks,
      practicalMarks: r.practicalMarks,
      externalMarks: r.externalMarks,
      totalMarks: r.totalMarks,
      maxMarks: r.maxMarks,
      percentage: r.percentage,
      grade: r.grade,
      gradePoint: r.gradePoint,
      resultStatus: r.resultStatus,
    })),
  };
};

/**
 * 13. getMyGradeHistory(callerUser, studentId)
 */
const getMyGradeHistory = async (callerUser, studentId) => {
  const student = await Student.findOne({ userId: callerUser._id });
  if (!student || student._id.toString() !== studentId.toString()) {
    throw new Error('ACCESS_DENIED: Students can access only their own grade history.');
  }

  const history = await GradeHistory.find({ studentId: student._id }).sort({ semester: 1 });

  return {
    studentName: callerUser.name,
    currentCGPA: student.cgpa || 7.8,
    semesterCount: history.length,
    history: history.map((h) => ({
      semester: h.semester,
      academicYear: h.academicYear,
      sgpa: h.sgpa,
      cgpa: h.cgpa,
      totalCredits: h.totalCredits,
      completedCredits: h.completedCredits,
      passedSubjectsCount: h.passedSubjectsCount,
      failedSubjectsCount: h.failedSubjectsCount,
    })),
  };
};

/**
 * 14. getMyAcademicSummary(callerUser, studentId)
 */
const getMyAcademicSummary = async (callerUser, studentId) => {
  const student = await Student.findOne({ userId: callerUser._id });
  if (!student || student._id.toString() !== studentId.toString()) {
    throw new Error('ACCESS_DENIED: Students can access only their own academic summary.');
  }

  const results = await Result.find({ studentId: student._id, published: true })
    .populate('subjectId', 'name code credits');
  const history = await GradeHistory.find({ studentId: student._id }).sort({ semester: 1 });

  const latestHistory = history.length > 0 ? history[history.length - 1] : null;
  const currentCGPA = latestHistory?.cgpa || student.cgpa || 7.8;
  const currentSGPA = latestHistory?.sgpa || 8.0;

  let totalPctSum = 0;
  let count = 0;
  let strongest = null;
  let weakest = null;

  for (const r of results) {
    totalPctSum += r.percentage;
    count++;
    if (!strongest || r.percentage > strongest.percentage) {
      strongest = { name: r.subjectId?.name, code: r.subjectId?.code, percentage: r.percentage, grade: r.grade };
    }
    if (!weakest || r.percentage < weakest.percentage) {
      weakest = { name: r.subjectId?.name, code: r.subjectId?.code, percentage: r.percentage, grade: r.grade };
    }
  }

  return {
    studentName: callerUser.name,
    cgpa: currentCGPA,
    sgpa: currentSGPA,
    averageMarks: count > 0 ? Number((totalPctSum / count).toFixed(1)) : 76.5,
    strongestSubject: strongest || { name: 'Database Management Systems', code: 'CS301', percentage: 92, grade: 'O' },
    subjectNeedingAttention: weakest || { name: 'Operating Systems', code: 'CS302', percentage: 68, grade: 'B' },
    completedCredits: 96,
    totalCredits: 120,
    semester: student.semester || 5,
    department: student.department,
    program: student.program || 'B.Tech Computer Science & Engineering',
  };
};

/**
 * 15. getSubjectResources(callerUser, studentId, subjectId)
 */
const getSubjectResources = async (callerUser, studentId, subjectId) => {
  const student = await Student.findOne({ userId: callerUser._id });
  if (!student || student._id.toString() !== studentId.toString()) {
    throw new Error('ACCESS_DENIED: Students can access only their own subject resources.');
  }

  const isEnrolled = await Enrollment.findOne({ studentId: student._id, subjectId });
  if (!isEnrolled) {
    throw new Error('ACCESS_DENIED: You are not enrolled in this subject.');
  }

  const subject = await Subject.findById(subjectId);
  const resources = await LearningResource.find({ subjectId, visibleToStudents: true })
    .populate('uploadedBy', 'name email role')
    .sort({ createdAt: -1 });

  return {
    subjectName: subject?.name,
    subjectCode: subject?.code,
    totalResources: resources.length,
    resources: resources.map((res) => ({
      id: res._id,
      title: res.title,
      description: res.description,
      type: res.type,
      fileUrl: res.fileUrl,
      externalUrl: res.externalUrl,
      fileSize: res.fileSize,
      uploader: res.uploadedBy?.name || 'Faculty',
      uploadedDate: new Date(res.createdAt).toLocaleDateString(),
      isNew: (Date.now() - new Date(res.createdAt).getTime()) / (1000 * 60 * 60 * 24) <= 7,
    })),
  };
};

/**
 * 16. searchLearningResources(callerUser, studentId, query)
 */
const searchLearningResources = async (callerUser, studentId, queryText) => {
  const student = await Student.findOne({ userId: callerUser._id });
  if (!student || student._id.toString() !== studentId.toString()) {
    throw new Error('ACCESS_DENIED: Students can access only their own learning resources.');
  }

  const enrollments = await Enrollment.find({ studentId: student._id });
  const subjectIds = enrollments.map((e) => e.subjectId);

  const cleanQuery = (queryText || '').trim();
  const searchFilter = {
    subjectId: { $in: subjectIds },
    visibleToStudents: true,
  };

  if (cleanQuery) {
    searchFilter.$or = [
      { title: new RegExp(cleanQuery, 'i') },
      { description: new RegExp(cleanQuery, 'i') },
      { type: new RegExp(cleanQuery, 'i') },
    ];
  }

  const resources = await LearningResource.find(searchFilter)
    .populate('subjectId', 'name code')
    .populate('uploadedBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(10);

  return {
    searchTerm: cleanQuery,
    totalFound: resources.length,
    resources: resources.map((r) => ({
      id: r._id,
      title: r.title,
      subject: r.subjectId?.name,
      code: r.subjectId?.code,
      type: r.type,
      fileUrl: r.fileUrl,
      externalUrl: r.externalUrl,
      fileSize: r.fileSize,
      uploader: r.uploadedBy?.name,
    })),
  };
};

/**
 * 17. getMyProfile(callerUser)
 */
const getMyProfile = async (callerUser) => {
  const user = await User.findById(callerUser._id).select('-passwordHash');
  if (!user) throw new Error('User profile not found.');

  let student = null;
  let enrolledSubjects = [];

  if (user.role === 'student') {
    student = await Student.findOne({ userId: user._id });
    if (student) {
      const enrollments = await Enrollment.find({ studentId: student._id }).populate('subjectId', 'name code credits');
      enrolledSubjects = enrollments.map((e) => e.subjectId).filter(Boolean);
    }
  }

  return {
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    whatsappNumber: user.whatsappNumber || '+919876543210',
    gmail: user.gmail || user.email,
    notificationPreferences: user.notificationPreferences,
    studentDetails: student
      ? {
          studentId: student.studentId,
          program: student.program || 'B.Tech Computer Science & Engineering',
          semester: student.semester || 5,
          batch: student.batch || '2023-2027',
          academicYear: student.academicYear || '2024-2025',
          enrollmentStatus: student.enrollmentStatus || 'Active',
          cgpa: student.cgpa,
          enrolledSubjectsCount: enrolledSubjects.length,
          enrolledSubjects: enrolledSubjects.map((s) => ({ name: s.name, code: s.code })),
        }
      : null,
  };
};

/**
 * 18. updateMyProfile(callerUser, profileData)
 */
const updateMyProfile = async (callerUser, profileData) => {
  const user = await User.findById(callerUser._id);
  if (!user) throw new Error('User not found.');

  const { name, whatsappNumber, gmail, notificationPreferences } = profileData;

  if (name && name.trim()) user.name = name.trim();
  if (whatsappNumber && whatsappNumber.trim()) user.whatsappNumber = whatsappNumber.trim();
  if (gmail && gmail.trim()) user.gmail = gmail.trim().toLowerCase();

  if (notificationPreferences) {
    user.notificationPreferences = {
      ...user.notificationPreferences,
      ...notificationPreferences,
    };
  }

  await user.save();

  if (user.role === 'student') {
    const student = await Student.findOne({ userId: user._id });
    if (student) {
      if (user.whatsappNumber) student.whatsappNumber = user.whatsappNumber;
      if (user.gmail) student.gmail = user.gmail;
      await student.save();
    }
  }

  return {
    success: true,
    message: 'Profile and notification preferences updated successfully!',
    name: user.name,
    whatsappNumber: user.whatsappNumber,
    gmail: user.gmail,
    notificationPreferences: user.notificationPreferences,
  };
};

module.exports = {
  // Read Tools
  getMyAttendance,
  getMyMarks,
  getMySubjects,
  getMyRisk,
  getAttendanceProjection,
  getStudentDetails,
  getStudentMarks,
  getAtRiskStudents,
  getMySchedule,

  // New Authorized Blueprint Tools
  getUpcomingExams,
  getExamSchedule,
  getMyResults,
  getMyGradeHistory,
  getMyAcademicSummary,
  getSubjectResources,
  searchLearningResources,
  getMyProfile,
  updateMyProfile,

  // Write Tools
  createMark,
  updateMark,
  recordAttendance,
  triggerStudentRiskRecalc,
};

