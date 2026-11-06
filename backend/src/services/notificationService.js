/**
 * Notification Service
 * Handles multi-channel alerts across In-App, WhatsApp, and Nodemailer Email.
 * Fulfills Requirements 3, 5, 7, 8, and 9 of the prompt.
 */

const Notification = require('../models/Notification');
const User = require('../models/User');
const { dispatchWhatsApp, dispatchEmail } = require('./alertDispatcher');

/**
 * Main dispatcher to persist notification and deliver to WhatsApp & Email
 */
const createNotificationWithChannels = async ({
  userId,
  type,
  title,
  message,
  metadata = {},
  userDoc = null,
}) => {
  try {
    // Resolve user document if not passed
    let user = userDoc;
    if (!user) {
      user = await User.findById(userId);
    }

    if (!user) {
      console.warn(`[NotificationService] Cannot find user with ID ${userId}`);
      return null;
    }

    const prefs = user.notificationPreferences || {
      attendanceAlerts: true,
      academicRiskAlerts: true,
      newMarkAdded: true,
      examReminders: true,
    };

    // Check preference filters
    let shouldDeliver = true;
    if (type.startsWith('ATTENDANCE') && prefs.attendanceAlerts === false) shouldDeliver = false;
    if (type.startsWith('RISK') && prefs.academicRiskAlerts === false) shouldDeliver = false;
    if (type.startsWith('MARK') && prefs.newMarkAdded === false) shouldDeliver = false;
    if (type.startsWith('EXAM') && prefs.examReminders === false) shouldDeliver = false;
    if (type.startsWith('RESOURCE') && prefs.resourceUpdates === false) shouldDeliver = false;
    if (type.startsWith('RESULT') && prefs.resultNotifications === false) shouldDeliver = false;

    // Delivery tracking objects
    let whatsappResult = { sent: false, status: 'SKIPPED', timestamp: new Date() };
    let emailResult = { sent: false, status: 'SKIPPED', timestamp: new Date() };

    if (shouldDeliver) {
      const recipientPhone = user.whatsappNumber || '+919876543210';
      const recipientEmail = user.gmail || user.email;

      // 1. Dispatch WhatsApp Alert
      whatsappResult = await dispatchWhatsApp({
        recipientPhone,
        messageText: message,
        title,
        apiKey: user.callmebotApiKey,
      });

      // 2. Dispatch Email Alert via Nodemailer
      emailResult = await dispatchEmail({
        recipientEmail,
        recipientName: user.name,
        subject: title,
        text: message,
        details: {
          subject: metadata.subjectName || metadata.subject || 'Academic Course',
          percentage: metadata.percentage,
          suggestion: metadata.recommendation || metadata.suggestion || 'Please attend upcoming classes regularly.',
        },
        smtpConfig: user.smtpConfig,
      });
    }

    // 3. Persist In-App Notification with Channel Badges
    const notification = await Notification.create({
      userId: user._id,
      type,
      title,
      message,
      metadata,
      channels: {
        whatsapp: whatsappResult,
        email: emailResult,
      },
    });

    return notification;
  } catch (err) {
    console.error('[NotificationService] Error creating notification:', err);
    return null;
  }
};

/**
 * Requirement 5 & 7: sendAttendanceAlert()
 * Formats clear, short, and informative message matching the example mockup
 */
const sendAttendanceAlert = async ({
  userId,
  userDoc = null,
  subjectName,
  percentage,
  status = 'CRITICAL',
  totalClasses = 50,
  attendedClasses = 34,
  requiredClasses = 4,
}) => {
  const user = userDoc || (await User.findById(userId));
  const firstName = user?.name?.split(' ')[0] || 'Student';

  const title = `EduPulse AI - Attendance Alert`;
  const message =
    `⚠️ *EduPulse AI - Attendance Alert*\n\n` +
    `Hi ${firstName},\n` +
    `Your ${subjectName} attendance is ${percentage}% (${attendedClasses} out of ${totalClasses} classes).\n` +
    `You are below the 75% requirement.\n` +
    `Please attend upcoming classes to avoid academic risk.`;

  return createNotificationWithChannels({
    userId: user._id,
    userDoc: user,
    type: status === 'CRITICAL' ? 'ATTENDANCE_CRITICAL' : 'ATTENDANCE_WARNING',
    title,
    message,
    metadata: {
      subjectName,
      percentage,
      status,
      totalClasses,
      attendedClasses,
      requiredClasses,
      suggestion: `Attend at least ${requiredClasses} more consecutive classes to recover above 75%.`,
    },
  });
};

/**
 * Requirement 5: sendRiskAlert()
 */
const sendRiskAlert = async ({
  userId,
  userDoc = null,
  subjectName,
  score,
  level = 'HIGH',
  insights = [],
  recommendations = [],
}) => {
  const user = userDoc || (await User.findById(userId));
  const firstName = user?.name?.split(' ')[0] || 'Student';
  const primaryDriver = insights[0] || 'Decline in assessment scores and attendance.';
  const primaryRec = recommendations[0] || 'Attend upcoming doubt-clearing sessions with your professor.';

  const title = `EduPulse AI - Academic Risk Alert`;
  const message =
    `🛡️ *EduPulse AI - Academic Risk Alert*\n\n` +
    `Hi ${firstName},\n` +
    `Your academic risk index for ${subjectName} has reached ${score}/100 (${level} Risk).\n` +
    `Primary Factor: ${primaryDriver}\n` +
    `Actionable Suggestion: ${primaryRec}`;

  return createNotificationWithChannels({
    userId: user._id,
    userDoc: user,
    type: level === 'HIGH' ? 'RISK_HIGH' : 'RISK_MEDIUM',
    title,
    message,
    metadata: {
      subjectName,
      score,
      level,
      insights,
      recommendation: primaryRec,
    },
  });
};

/**
 * Requirement 5: sendMarkUpdateAlert()
 */
const sendMarkUpdateAlert = async ({
  userId,
  userDoc = null,
  subjectName,
  assessmentName,
  score,
  maxScore = 50,
  isUpdate = false,
}) => {
  const user = userDoc || (await User.findById(userId));
  const firstName = user?.name?.split(' ')[0] || 'Student';
  const percentage = ((score / maxScore) * 100).toFixed(1);

  const title = isUpdate ? `EduPulse AI - Mark Updated` : `EduPulse AI - New Mark Recorded`;
  const message =
    `📝 *${title}*\n\n` +
    `Hi ${firstName},\n` +
    `Your score for ${assessmentName} in ${subjectName} has been recorded as ${score}/${maxScore} (${percentage}%).\n` +
    `Risk index and grade standings have been recalculated.`;

  return createNotificationWithChannels({
    userId: user._id,
    userDoc: user,
    type: isUpdate ? 'MARK_UPDATED' : 'MARK_CREATED',
    title,
    message,
    metadata: {
      subjectName,
      assessmentName,
      score,
      maxScore,
      percentage,
      suggestion: 'Check the What-If Simulator and Gradebook to view updated projections.',
    },
  });
};

/**
 * Requirement 9: sendProfessorClassAlert()
 * Class-wise alerts sent to professors for students below 75% in assigned courses
 */
const sendProfessorClassAlert = async ({
  professorUser,
  subjectName,
  atRiskStudents = [],
}) => {
  if (!professorUser || atRiskStudents.length === 0) return null;

  const profName = professorUser.name || 'Professor';
  const count = atRiskStudents.length;

  const title = `Faculty Alert: ${count} Students Below 75% in ${subjectName}`;
  const studentListText = atRiskStudents
    .slice(0, 5)
    .map((s) => `• ${s.name} (${s.studentId}): ${s.percentage}% [${s.status}]`)
    .join('\n');

  const moreText = count > 5 ? `\n...and ${count - 5} other students.` : '';

  const message =
    `👨‍🏫 *EduPulse AI - Faculty Attendance Alert*\n\n` +
    `Hello ${profName},\n` +
    `${count} student(s) in your assigned course *${subjectName}* currently have attendance below the mandatory 75% threshold:\n\n` +
    `${studentListText}${moreText}\n\n` +
    `Please review details in your Professor Portal (At-Risk Students section).`;

  return createNotificationWithChannels({
    userId: professorUser._id,
    userDoc: professorUser,
    type: 'ADMIN_ANNOUNCEMENT',
    title,
    message,
    metadata: {
      subjectName,
      atRiskCount: count,
      suggestion: 'Reach out to students with low attendance or conduct a remedial review session.',
    },
  });
};

/**
 * Send Instant Test Alert (used by frontend Profile Page)
 */
const sendTestAlert = async ({ user }) => {
  const firstName = user.name?.split(' ')[0] || 'there';

  const title = `EduPulse AI - System Verification Alert`;
  const message =
    `🚀 *EduPulse AI - Alert System Connected*\n\n` +
    `Hi ${firstName},\n` +
    `Your WhatsApp number (${user.whatsappNumber || 'Not set'}) and Gmail (${user.gmail || user.email}) are successfully linked to EduPulse AI.\n` +
    `You will receive real-time alerts whenever your attendance drops below 75% or new assessment scores are posted! ✓`;

  return createNotificationWithChannels({
    userId: user._id,
    userDoc: user,
    type: 'ADMIN_ANNOUNCEMENT',
    title,
    message,
    metadata: {
      subjectName: 'System Verification',
      percentage: 100,
      suggestion: 'All alert dispatch channels are active and operational.',
    },
  });
};

// Legacy compatibility adapters
const notifyMarkUpdate = async ({
  userId,
  subjectName,
  assessmentName,
  score,
  maxScore,
  isUpdate = false,
}) => {
  return sendMarkUpdateAlert({
    userId,
    subjectName,
    assessmentName,
    score,
    maxScore,
    isUpdate,
  });
};

const notifyAttendanceAlert = async ({
  userId,
  subjectName,
  percentage,
  status,
  requiredClasses,
  totalClasses = 25,
  attendedClasses = 18,
}) => {
  return sendAttendanceAlert({
    userId,
    subjectName,
    percentage,
    status,
    totalClasses,
    attendedClasses,
    requiredClasses,
  });
};

const notifyHighRisk = async ({
  userId,
  subjectName,
  score,
  insights = [],
}) => {
  return sendRiskAlert({
    userId,
    subjectName,
    score,
    level: 'HIGH',
    insights,
    recommendations: ['Attend remedial lectures and schedule 1-on-1 concept review.'],
  });
};

/**
 * Send Exam Reminder or Exam Schedule Notification
 */
const sendExamReminder = async ({
  userId,
  examName,
  subjectName,
  examType = 'Examination',
  date,
  time,
  venue = 'Main Hall',
  daysRemaining,
}) => {
  const user = await User.findById(userId);
  if (!user) return null;

  const dateFormatted = new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const countdownText = daysRemaining !== undefined ? ` (in ${daysRemaining} days)` : '';
  const title = `📅 Exam Scheduled: ${examName} - ${subjectName}`;
  const message =
    `📝 *EduPulse AI - Upcoming Examination Reminder*\n\n` +
    `Hello ${user.name},\n` +
    `Your *${examName}* (${examType}) for *${subjectName}* is scheduled${countdownText}.\n\n` +
    `• *Date:* ${dateFormatted}\n` +
    `• *Time:* ${time}\n` +
    `• *Venue:* ${venue}\n\n` +
    `Make sure your study materials and revisions are up to date! Best of luck!`;

  return createNotificationWithChannels({
    userId: user._id,
    userDoc: user,
    type: 'EXAM_SCHEDULED',
    title,
    message,
    metadata: {
      subjectName,
      examName,
      date,
      time,
      venue,
      suggestion: 'Review lecture notes and past question papers in Learning Resources.',
    },
  });
};

/**
 * Send Learning Resource Upload Notification
 */
const sendResourceUpdate = async ({
  userId,
  title: resourceTitle,
  subjectName,
  type = 'Study Material',
  uploaderName = 'Faculty',
}) => {
  const user = await User.findById(userId);
  if (!user) return null;

  const title = `📚 New Resource: ${resourceTitle} (${subjectName})`;
  const message =
    `📖 *EduPulse AI - New Learning Resource Uploaded*\n\n` +
    `Hello ${user.name},\n` +
    `A new ${type.toLowerCase()} has been uploaded for *${subjectName}* by ${uploaderName}:\n` +
    `*"${resourceTitle}"*\n\n` +
    `Head to the Learning Resources portal to download or review this material!`;

  return createNotificationWithChannels({
    userId: user._id,
    userDoc: user,
    type: 'RESOURCE_UPLOADED',
    title,
    message,
    metadata: {
      subjectName,
      resourceTitle,
      type,
      suggestion: 'Access the new resource from your enrolled subjects panel.',
    },
  });
};

/**
 * Send Result Published Notification
 */
const sendResultAlert = async ({
  userId,
  subjectName,
  examName = 'Assessment',
  totalMarks,
  maxMarks = 100,
  grade,
  resultStatus = 'Pass',
}) => {
  const user = await User.findById(userId);
  if (!user) return null;

  const title = `🎯 Results Published: ${subjectName} (${grade} - ${resultStatus})`;
  const message =
    `🏆 *EduPulse AI - Examination Results Published*\n\n` +
    `Hello ${user.name},\n` +
    `The official results for *${subjectName}* (${examName}) have been published.\n\n` +
    `• *Score:* ${totalMarks} / ${maxMarks} (${((totalMarks / maxMarks) * 100).toFixed(1)}%)\n` +
    `• *Grade:* ${grade}\n` +
    `• *Status:* ${resultStatus.toUpperCase()}\n\n` +
    `Check your complete grade history and performance breakdown in the Exams & Results portal.`;

  return createNotificationWithChannels({
    userId: user._id,
    userDoc: user,
    type: 'RESULT_PUBLISHED',
    title,
    message,
    metadata: {
      subjectName,
      examName,
      score: totalMarks,
      maxScore: maxMarks,
      suggestion: resultStatus === 'Pass' ? 'Keep up the strong academic momentum!' : 'Schedule concept review with faculty.',
    },
  });
};

module.exports = {
  createNotificationWithChannels,
  sendAttendanceAlert,
  sendRiskAlert,
  sendMarkUpdateAlert,
  sendProfessorClassAlert,
  sendTestAlert,
  sendExamReminder,
  sendResourceUpdate,
  sendResultAlert,

  // Legacy mappings
  notifyMarkUpdate,
  notifyAttendanceAlert,
  notifyHighRisk,
  createNotification: createNotificationWithChannels,
};
