const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const RiskScore = require('../models/RiskScore');
const Mark = require('../models/Mark');
const Assignment = require('../models/Assignment');
const { analyzeAttendanceTrend, calculateRequiredClassesToReach75 } = require('../services/attendanceService');
const { calculateSubjectRisk } = require('../services/riskService');
const { notifyAttendanceAlert } = require('../services/notificationService');
const { logAudit } = require('../services/auditService');

// @desc Record or batch record attendance for a subject session
// @route POST /api/attendance
exports.recordAttendance = async (req, res) => {
  try {
    const { subjectId, date, records } = req.body;
    // records: Array of { studentId, status: 'present' | 'absent' }

    if (!subjectId || !records || !Array.isArray(records)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payload: subjectId and records array required',
      });
    }

    const sessionDate = date ? new Date(date) : new Date();
    // Normalize date to midnight for consistent daily sessions
    sessionDate.setHours(0, 0, 0, 0);

    const savedRecords = [];
    const affectedStudents = new Set();

    for (const item of records) {
      const { studentId, status } = item;
      if (!studentId || !status) continue;

      // Upsert attendance record for this student, subject, and day
      const existing = await Attendance.findOne({
        studentId,
        subjectId,
        date: sessionDate,
      });

      const beforeState = existing ? existing.toObject() : null;

      const record = await Attendance.findOneAndUpdate(
        {
          studentId,
          subjectId,
          date: sessionDate,
        },
        {
          studentId,
          subjectId,
          date: sessionDate,
          status,
          recordedBy: req.user._id,
        },
        { upsert: true, new: true }
      );

      savedRecords.push(record);
      affectedStudents.add(studentId.toString());

      // Audit log
      await logAudit({
        actorId: req.user._id,
        action: existing ? 'UPDATE_ATTENDANCE' : 'RECORD_ATTENDANCE',
        entityType: 'Attendance',
        entityId: record._id,
        before: beforeState,
        after: record.toObject(),
        metadata: { studentId, subjectId, date: sessionDate, status },
      });
    }

    // Now recalculate attendance trend & risk for all affected students
    const subject = await Subject.findById(subjectId);
    const notificationsSent = [];

    for (const sId of affectedStudents) {
      const studentAttendance = await Attendance.find({ studentId: sId, subjectId }).sort({ date: 1 });
      const stats = analyzeAttendanceTrend(studentAttendance);

      // Check for attendance warning or critical alert
      const student = await Student.findById(sId).populate('userId');
      if (student && (stats.status === 'CRITICAL' || stats.status === 'WARNING')) {
        const notif = await notifyAttendanceAlert({
          userId: student.userId._id,
          subjectName: subject?.name || 'Subject',
          percentage: stats.percentage,
          status: stats.status,
          requiredClasses: stats.requiredClassesToReach75,
        });
        if (notif) notificationsSent.push(notif);
      }

      // Recalculate academic risk for this student in this subject
      const studentMarks = await Mark.find({ studentId: sId, subjectId });
      const assignments = await Assignment.find({ subjectId });

      const riskCalc = calculateSubjectRisk({
        attendanceStats: stats,
        marks: studentMarks,
        assignments,
        studentCGPA: student?.cgpa || 7.5,
      });

      await RiskScore.findOneAndUpdate(
        { studentId: sId, subjectId },
        {
          studentId: sId,
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
    }

    res.json({
      success: true,
      message: `Recorded attendance for ${savedRecords.length} students`,
      count: savedRecords.length,
      notificationsTriggered: notificationsSent.length,
    });
  } catch (err) {
    console.error('[AttendanceController] recordAttendance error:', err);
    res.status(500).json({ success: false, message: 'Server error recording attendance' });
  }
};

// @desc Get attendance summary & details for a student across all subjects
// @route GET /api/attendance/student/:studentId
exports.getStudentAttendance = async (req, res) => {
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

    const allRecords = await Attendance.find({ studentId: student._id })
      .populate('subjectId', 'name code department semester')
      .sort({ date: -1 });

    // Group by subjectId
    const bySubject = {};
    for (const record of allRecords) {
      if (!record.subjectId) continue;
      const subId = record.subjectId._id.toString();
      if (!bySubject[subId]) {
        bySubject[subId] = {
          subject: record.subjectId,
          records: [],
        };
      }
      bySubject[subId].records.push(record);
    }

    const summaries = Object.values(bySubject).map(({ subject, records }) => {
      // Sort ascending for accurate trend calculation
      const ascRecords = [...records].reverse();
      const stats = analyzeAttendanceTrend(ascRecords);
      return {
        subject,
        stats,
        recentRecords: records.slice(0, 10), // latest 10
      };
    });

    res.json({
      success: true,
      data: {
        studentId: student._id,
        summaries,
      },
    });
  } catch (err) {
    console.error('[AttendanceController] getStudentAttendance error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving attendance' });
  }
};

// @desc Get subject attendance roster and class log
// @route GET /api/attendance/subject/:subjectId
exports.getSubjectAttendance = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { date } = req.query;

    const query = { subjectId };
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      query.date = d;
    }

    const records = await Attendance.find(query)
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'name email avatar' },
      })
      .sort({ date: -1 });

    res.json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (err) {
    console.error('[AttendanceController] getSubjectAttendance error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving subject attendance' });
  }
};

// @desc Get attendance prediction & what-if simulator data
// @route GET /api/attendance/prediction/:studentId/:subjectId
exports.getAttendancePrediction = async (req, res) => {
  try {
    const { studentId, subjectId } = req.params;
    const { simulateAttend = 0, simulateMiss = 0 } = req.query;

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

    const records = await Attendance.find({ studentId: student._id, subjectId }).sort({ date: 1 });
    const baseline = analyzeAttendanceTrend(records);

    // What-If Simulation
    const addAttend = parseInt(simulateAttend, 10) || 0;
    const addMiss = parseInt(simulateMiss, 10) || 0;
    const simulatedConducted = baseline.totalClasses + addAttend + addMiss;
    const simulatedAttended = baseline.attendedClasses + addAttend;

    const simulatedPercentage = simulatedConducted > 0
      ? Number(((simulatedAttended / simulatedConducted) * 100).toFixed(1))
      : 100;

    let simulatedStatus = 'SAFE';
    if (simulatedPercentage < 75) {
      simulatedStatus = 'CRITICAL';
    } else if (simulatedPercentage <= 80) {
      simulatedStatus = 'WARNING';
    }

    const simulatedRequired = calculateRequiredClassesToReach75(simulatedAttended, simulatedConducted);

    res.json({
      success: true,
      data: {
        subject: { id: subject._id, code: subject.code, name: subject.name },
        current: baseline,
        simulation: {
          additionalAttended: addAttend,
          additionalMissed: addMiss,
          simulatedConducted,
          simulatedAttended,
          simulatedPercentage,
          simulatedStatus,
          simulatedRequiredTo75: simulatedRequired,
        },
      },
    });
  } catch (err) {
    console.error('[AttendanceController] getAttendancePrediction error:', err);
    res.status(500).json({ success: false, message: 'Server error computing prediction' });
  }
};
