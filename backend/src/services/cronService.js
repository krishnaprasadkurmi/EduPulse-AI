/**
 * Academic Health Cron Service
 * Implements Requirement 6 & 9: Runs scheduled background jobs to monitor attendance
 * and academic risk, automatically triggering WhatsApp and Email alerts for students
 * and class-wise alerts for professors.
 */

const cron = require('node-cron');
const Student = require('../models/Student');
const Professor = require('../models/Professor');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const RiskScore = require('../models/RiskScore');
const { analyzeAttendanceTrend } = require('./attendanceService');
const {
  sendAttendanceAlert,
  sendRiskAlert,
  sendProfessorClassAlert,
} = require('./notificationService');

/**
 * Main evaluation routine: Checks campus-wide attendance & risk
 */
const runAcademicHealthCheck = async () => {
  console.log('[CronService] ⏰ Starting scheduled Academic Health & Alert Check...');
  let studentAlertsCount = 0;
  let professorAlertsCount = 0;

  try {
    const subjects = await Subject.find().populate('professorIds');
    const students = await Student.find().populate('userId');

    // Track at-risk students grouped by subject for professor class-wise alerts
    const subjectAtRiskMap = new Map(); // subjectId -> array of { student, percentage, status }

    // 1. Evaluate Student Attendance & Risk
    for (const student of students) {
      if (!student.userId) continue;

      for (const subj of subjects) {
        const records = await Attendance.find({
          studentId: student._id,
          subjectId: subj._id,
        }).sort({ date: 1 });

        if (records.length === 0) continue;

        const stats = analyzeAttendanceTrend(records);

        // If below 75% threshold
        if (stats.percentage < 75) {
          // Record for professor notification
          if (!subjectAtRiskMap.has(subj._id.toString())) {
            subjectAtRiskMap.set(subj._id.toString(), []);
          }
          subjectAtRiskMap.get(subj._id.toString()).push({
            name: student.userId.name,
            studentId: student.studentId,
            percentage: stats.percentage,
            status: stats.status,
          });

          // Dispatch student attendance alert
          await sendAttendanceAlert({
            userId: student.userId._id,
            userDoc: student.userId,
            subjectName: subj.name,
            percentage: stats.percentage,
            status: stats.status,
            totalClasses: stats.totalClasses,
            attendedClasses: stats.attendedClasses,
            requiredClasses: stats.requiredClassesToReach75,
          });
          studentAlertsCount++;
        }

        // Check Risk Scores
        const risk = await RiskScore.findOne({
          studentId: student._id,
          subjectId: subj._id,
        });

        if (risk && risk.score >= 65) {
          await sendRiskAlert({
            userId: student.userId._id,
            userDoc: student.userId,
            subjectName: subj.name,
            score: risk.score,
            level: risk.level,
            insights: risk.insights,
            recommendations: risk.recommendations,
          });
          studentAlertsCount++;
        }
      }
    }

    // 2. Evaluate Class-Wise Alerts for Professors (Requirement 9)
    const professors = await Professor.find().populate('userId').populate('assignedSubjectIds');

    for (const prof of professors) {
      if (!prof.userId || !prof.assignedSubjectIds) continue;

      for (const assignedSub of prof.assignedSubjectIds) {
        const atRiskStudents = subjectAtRiskMap.get(assignedSub._id.toString()) || [];

        if (atRiskStudents.length > 0) {
          await sendProfessorClassAlert({
            professorUser: prof.userId,
            subjectName: `${assignedSub.code} - ${assignedSub.name}`,
            atRiskStudents,
          });
          professorAlertsCount++;
        }
      }
    }

    console.log(
      `[CronService] ✓ Academic Health Check Complete. Dispatched ${studentAlertsCount} student alerts and ${professorAlertsCount} professor alerts.`
    );

    return {
      success: true,
      timestamp: new Date(),
      studentAlertsCount,
      professorAlertsCount,
    };
  } catch (err) {
    console.error('[CronService] Error running academic health check:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Initialize background cron job schedules
 */
const initCronJobs = () => {
  // Run daily at 09:00 AM
  cron.schedule('0 9 * * *', () => {
    runAcademicHealthCheck();
  });

  console.log('[CronService] 🕒 Background Academic Alert cron registered (Daily at 09:00 AM).');
};

module.exports = {
  initCronJobs,
  runAcademicHealthCheck,
};
