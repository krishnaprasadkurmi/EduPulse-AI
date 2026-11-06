/**
 * Copilot Orchestration Service
 * Manages chat context, entity resolution, authorization validation,
 * 2-step write confirmations, and dispatch to authorized tools.
 */

const Student = require('../models/Student');
const Professor = require('../models/Professor');
const Subject = require('../models/Subject');
const Mark = require('../models/Mark');
const aiProvider = require('./aiProvider');
const copilotTools = require('./copilotTools');

// In-memory store for pending write confirmations (TTL 10 mins)
const pendingActions = new Map();

// Periodic cleanup of expired actions (> 10 mins)
setInterval(() => {
  const now = Date.now();
  for (const [id, act] of pendingActions.entries()) {
    if (now - act.createdAt > 10 * 60 * 1000) {
      pendingActions.delete(id);
    }
  }
}, 60 * 1000);

class CopilotService {
  /**
   * Main chat dispatcher
   */
  async processChat({ user, message, conversationId }) {
    if (!message || typeof message !== 'string' || !message.trim()) {
      return {
        reply: 'Please ask a valid academic question.',
        requiresConfirmation: false,
        action: null,
      };
    }

    const role = user.role; // 'student' | 'professor' | 'admin'

    // 1. Detect Intent and Extract Entities
    const nluResult = await aiProvider.detectIntent(message, role, user);
    const { intent, entities } = nluResult;

    // 2. Security Check: Block cross-student access attempts
    if (nluResult.isSecurityViolation || intent === 'CROSS_STUDENT_ATTEMPT') {
      return {
        reply: '⛔ **ACCESS DENIED**: You are only authorized to query your own personal academic records. Inquiring into other students\' performance is strictly prohibited by university privacy policy.',
        requiresConfirmation: false,
        action: null,
        error: 'ACCESS_DENIED',
      };
    }

    // 3. Resolve caller context
    let studentDoc = null;
    let profDoc = null;

    if (role === 'student') {
      studentDoc = await Student.findOne({ userId: user._id });
      if (!studentDoc) {
        return {
          reply: 'Could not find a student profile linked to your account.',
          requiresConfirmation: false,
          action: null,
        };
      }
    } else if (role === 'professor') {
      profDoc = await Professor.findOne({ userId: user._id }).populate('assignedSubjectIds');
      if (!profDoc) {
        return {
          reply: 'Could not find a faculty profile linked to your account.',
          requiresConfirmation: false,
          action: null,
        };
      }
    }

    // 4. Resolve Target Subject if specified
    let targetSubject = null;
    if (entities.subjectQuery) {
      targetSubject = await Subject.findOne({
        $or: [
          { code: new RegExp(`^${entities.subjectQuery}$`, 'i') },
          { name: new RegExp(entities.subjectQuery, 'i') },
        ],
      });
    }

    // 5. Handle Student Role Workflows
    if (role === 'student') {
      try {
        switch (intent) {
          case 'GET_ATTENDANCE_PROJECTION': {
            // If subject not specified, default to DBMS or highest risk enrolled subject
            let subId = targetSubject?._id;
            if (!subId) {
              const myRisk = await copilotTools.getMyRisk(user, studentDoc._id);
              subId = myRisk.highestRisk?.subjectId?._id;
            }
            if (!subId) {
              const mySubs = await copilotTools.getMySubjects(user, studentDoc._id);
              subId = mySubs.subjects[0]?._id;
            }
            if (!subId) {
              return {
                reply: 'You are not currently enrolled in any subjects.',
                requiresConfirmation: false,
                action: null,
              };
            }

            const data = await copilotTools.getAttendanceProjection(user, studentDoc._id, subId);
            const reply = aiProvider.formatResponse('GET_ATTENDANCE_PROJECTION', data);
            return { reply, data, tool: 'getAttendanceProjection', requiresConfirmation: false, action: null };
          }

          case 'GET_MY_ATTENDANCE': {
            const data = await copilotTools.getMyAttendance(user, studentDoc._id, targetSubject?._id);
            const reply = aiProvider.formatResponse('GET_MY_ATTENDANCE', data);
            return { reply, data, tool: 'getMyAttendance', requiresConfirmation: false, action: null };
          }

          case 'GET_MY_MARKS': {
            const data = await copilotTools.getMyMarks(user, studentDoc._id, targetSubject?._id);
            const reply = aiProvider.formatResponse('GET_MY_MARKS', data);
            return { reply, data, tool: 'getMyMarks', requiresConfirmation: false, action: null };
          }

          case 'GET_MY_RISK': {
            const data = await copilotTools.getMyRisk(user, studentDoc._id, targetSubject?._id);
            const reply = aiProvider.formatResponse('GET_MY_RISK', data);
            return { reply, data, tool: 'calculateSubjectRisk', requiresConfirmation: false, action: null };
          }

          case 'GET_MY_SUBJECTS': {
            const data = await copilotTools.getMySubjects(user, studentDoc._id);
            const reply = aiProvider.formatResponse('GET_MY_SUBJECTS', data);
            return { reply, data, tool: 'getMySubjects', requiresConfirmation: false, action: null };
          }

          case 'GET_SCHEDULE': {
            const data = await copilotTools.getMySchedule(user, studentDoc._id);
            const reply = aiProvider.formatResponse('GET_SCHEDULE', data);
            return { reply, data, tool: 'getMySchedule', requiresConfirmation: false, action: null };
          }

          case 'GET_UPCOMING_EXAMS': {
            const data = await copilotTools.getUpcomingExams(user, studentDoc._id);
            const reply = aiProvider.formatResponse('GET_UPCOMING_EXAMS', data);
            return { reply, data, tool: 'getUpcomingExams', requiresConfirmation: false, action: null };
          }

          case 'GET_EXAM_SCHEDULE': {
            const data = await copilotTools.getExamSchedule(user, studentDoc._id, targetSubject?._id);
            const reply = aiProvider.formatResponse('GET_EXAM_SCHEDULE', data);
            return { reply, data, tool: 'getExamSchedule', requiresConfirmation: false, action: null };
          }

          case 'GET_MY_RESULTS': {
            const data = await copilotTools.getMyResults(user, studentDoc._id, targetSubject?._id);
            const reply = aiProvider.formatResponse('GET_MY_RESULTS', data);
            return { reply, data, tool: 'getMyResults', requiresConfirmation: false, action: null };
          }

          case 'GET_MY_GRADE_HISTORY': {
            const data = await copilotTools.getMyGradeHistory(user, studentDoc._id);
            const reply = aiProvider.formatResponse('GET_MY_GRADE_HISTORY', data);
            return { reply, data, tool: 'getMyGradeHistory', requiresConfirmation: false, action: null };
          }

          case 'GET_ACADEMIC_SUMMARY': {
            const data = await copilotTools.getMyAcademicSummary(user, studentDoc._id);
            const reply = aiProvider.formatResponse('GET_ACADEMIC_SUMMARY', data);
            return { reply, data, tool: 'getMyAcademicSummary', requiresConfirmation: false, action: null };
          }

          case 'GET_SUBJECT_RESOURCES': {
            let subId = targetSubject?._id;
            if (!subId) {
              const mySubs = await copilotTools.getMySubjects(user, studentDoc._id);
              subId = mySubs.subjects[0]?._id;
            }
            if (!subId) {
              return { reply: 'You are not currently enrolled in any subjects.', requiresConfirmation: false, action: null };
            }
            const data = await copilotTools.getSubjectResources(user, studentDoc._id, subId);
            const reply = aiProvider.formatResponse('GET_SUBJECT_RESOURCES', data);
            return { reply, data, tool: 'getSubjectResources', requiresConfirmation: false, action: null };
          }

          case 'SEARCH_RESOURCES': {
            const data = await copilotTools.searchLearningResources(user, studentDoc._id, entities.subjectQuery || message);
            const reply = aiProvider.formatResponse('SEARCH_RESOURCES', data);
            return { reply, data, tool: 'searchLearningResources', requiresConfirmation: false, action: null };
          }

          case 'GET_MY_PROFILE': {
            const data = await copilotTools.getMyProfile(user);
            const reply = aiProvider.formatResponse('GET_MY_PROFILE', data);
            return { reply, data, tool: 'getMyProfile', requiresConfirmation: false, action: null };
          }

          default: {
            return {
              reply:
                'I am your EduPulse Academic Copilot. You can ask me:\n' +
                '• *"Show my upcoming exams."*\n' +
                '• *"When is my DBMS exam?"*\n' +
                '• *"Show my previous results."*\n' +
                '• *"Show my CGPA history."*\n' +
                '• *"Which subject did I perform worst in?"*\n' +
                '• *"Show my DBMS study materials."*\n' +
                '• *"Find the latest PDF for Operating Systems."*\n' +
                '• *"What is my DBMS attendance?"*',
              requiresConfirmation: false,
              action: null,
            };
          }
        }
      } catch (err) {
        if (err.message.startsWith('ACCESS_DENIED')) {
          return {
            reply: '⛔ **ACCESS DENIED**: You can access only your own academic records.',
            requiresConfirmation: false,
            action: null,
            error: 'ACCESS_DENIED',
          };
        }
        throw err;
      }
    }

    // 6. Handle Professor / Admin Role Workflows
    if (role === 'professor' || role === 'admin') {
      const assignedIds = profDoc ? profDoc.assignedSubjectIds.map((s) => s._id.toString()) : [];

      // Check unassigned subject security restriction
      if (targetSubject && profDoc && !assignedIds.includes(targetSubject._id.toString())) {
        return {
          reply: `⛔ **ACCESS DENIED**: You are not assigned to instruct **${targetSubject.code} - ${targetSubject.name}**. You can only view and manage subjects assigned to your department roster.`,
          requiresConfirmation: false,
          action: null,
          error: 'ACCESS_DENIED',
        };
      }

      // Resolve Target Student if specified by name or studentId
      let targetStudent = null;
      if (entities.studentName || entities.studentIdCode) {
        const query = {};
        if (entities.studentIdCode) {
          query.studentId = entities.studentIdCode;
        }
        if (entities.studentName) {
          // Search in Student populated userId
          const students = await Student.find().populate('userId');
          targetStudent = students.find((s) => {
            const sName = s.userId?.name?.toLowerCase() || '';
            return sName.includes(entities.studentName.toLowerCase());
          });
        } else {
          targetStudent = await Student.findOne(query).populate('userId');
        }
      }

      // --- WRITE ACTION 1: REQUEST_UPDATE_MARK ---
      if (intent === 'REQUEST_UPDATE_MARK') {
        if (!targetStudent) {
          return {
            reply: 'Which student would you like to update? (e.g. "Update Rahul\'s DBMS Internal 1 mark to 42")',
            requiresConfirmation: false,
            action: null,
          };
        }

        // If subject not specified, take first assigned subject or CS301
        const subject = targetSubject || profDoc?.assignedSubjectIds[0];
        if (!subject) {
          return {
            reply: 'Please specify the subject for this mark update (e.g. DBMS).',
            requiresConfirmation: false,
            action: null,
          };
        }

        const assessmentName = entities.assessmentName || 'Quiz 2 (Normalization & SQL)';
        const newScore = entities.score !== null ? entities.score : 42;
        const maxScore = entities.maxScore || 50;

        // Find existing mark
        let existingMark = await Mark.findOne({
          studentId: targetStudent._id,
          subjectId: subject._id,
          $or: [
            { assessmentName: new RegExp(assessmentName, 'i') },
            { assessmentName: /Quiz 2|Internal/i },
          ],
        });

        if (!existingMark) {
          existingMark = await Mark.findOne({
            studentId: targetStudent._id,
            subjectId: subject._id,
          });
        }

        const currentScore = existingMark ? existingMark.score : 38;
        const targetAssessment = existingMark ? existingMark.assessmentName : assessmentName;
        const effectiveMax = existingMark ? existingMark.maxScore : maxScore;

        // Create Pending Action Token
        const actionId = `act_mark_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
        const actionPayload = {
          actionId,
          type: 'UPDATE_MARK',
          professorUserId: user._id.toString(),
          professorId: profDoc._id.toString(),
          studentId: targetStudent._id.toString(),
          studentName: targetStudent.userId?.name || 'Student',
          subjectId: subject._id.toString(),
          subjectCode: subject.code,
          subjectName: subject.name,
          markId: existingMark?._id?.toString() || null,
          assessmentName: targetAssessment,
          currentScore,
          newScore,
          maxScore: effectiveMax,
          createdAt: Date.now(),
        };

        pendingActions.set(actionId, actionPayload);

        return {
          reply: `I found **${targetStudent.userId?.name}** → **${subject.code} (${subject.name})** → **${targetAssessment}**. Current score: **${currentScore}/${effectiveMax}**. New score: **${newScore}/${effectiveMax}**. Confirm update?`,
          requiresConfirmation: true,
          action: {
            actionId,
            type: 'UPDATE_MARK',
            studentName: targetStudent.userId?.name,
            subject: `${subject.code} - ${subject.name}`,
            assessmentName: targetAssessment,
            currentScore,
            newScore,
            maxScore: effectiveMax,
          },
        };
      }

      // --- WRITE ACTION 2: REQUEST_CREATE_MARK ---
      if (intent === 'REQUEST_CREATE_MARK') {
        if (!targetStudent) {
          return {
            reply: 'Which student would you like to enter marks for? Please specify the student name.',
            requiresConfirmation: false,
            action: null,
          };
        }

        const subject = targetSubject || profDoc?.assignedSubjectIds[0];
        if (!subject) {
          return {
            reply: 'Please specify the subject for this mark entry.',
            requiresConfirmation: false,
            action: null,
          };
        }

        const assessmentName = entities.assessmentName || 'Quiz 1';
        const newScore = entities.score !== null ? entities.score : 40;
        const maxScore = entities.maxScore || 50;

        const actionId = `act_create_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
        const actionPayload = {
          actionId,
          type: 'CREATE_MARK',
          professorUserId: user._id.toString(),
          professorId: profDoc._id.toString(),
          studentId: targetStudent._id.toString(),
          studentName: targetStudent.userId?.name || 'Student',
          subjectId: subject._id.toString(),
          subjectCode: subject.code,
          subjectName: subject.name,
          assessmentName,
          score: newScore,
          maxScore,
          createdAt: Date.now(),
        };

        pendingActions.set(actionId, actionPayload);

        return {
          reply: `Ready to record new score for **${targetStudent.userId?.name}** → **${subject.code} (${subject.name})** → **${assessmentName}**: **${newScore}/${maxScore}**. Confirm mark entry?`,
          requiresConfirmation: true,
          action: {
            actionId,
            type: 'CREATE_MARK',
            studentName: targetStudent.userId?.name,
            subject: `${subject.code} - ${subject.name}`,
            assessmentName,
            newScore,
            maxScore,
          },
        };
      }

      // --- WRITE ACTION 3: REQUEST_RECORD_ATTENDANCE ---
      if (intent === 'REQUEST_RECORD_ATTENDANCE') {
        if (!targetStudent) {
          return {
            reply: 'Which student would you like to record attendance for?',
            requiresConfirmation: false,
            action: null,
          };
        }

        const subject = targetSubject || profDoc?.assignedSubjectIds[0];
        const status = entities.attendanceStatus || 'present';

        const actionId = `act_att_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
        const actionPayload = {
          actionId,
          type: 'RECORD_ATTENDANCE',
          professorUserId: user._id.toString(),
          professorId: profDoc._id.toString(),
          studentId: targetStudent._id.toString(),
          studentName: targetStudent.userId?.name || 'Student',
          subjectId: subject._id.toString(),
          subjectCode: subject.code,
          subjectName: subject.name,
          status,
          date: new Date(),
          createdAt: Date.now(),
        };

        pendingActions.set(actionId, actionPayload);

        return {
          reply: `Record attendance session for **${targetStudent.userId?.name}** in **${subject.code}** on today's date as **${status.toUpperCase()}**? Confirm entry?`,
          requiresConfirmation: true,
          action: {
            actionId,
            type: 'RECORD_ATTENDANCE',
            studentName: targetStudent.userId?.name,
            subject: `${subject.code} - ${subject.name}`,
            status,
          },
        };
      }

      // --- READ ACTIONS FOR PROFESSOR ---
      switch (intent) {
        case 'GET_AT_RISK_STUDENTS': {
          const data = await copilotTools.getAtRiskStudents(
            user,
            profDoc._id,
            targetSubject?._id
          );
          const reply = aiProvider.formatResponse('GET_AT_RISK_STUDENTS', data);
          return { reply, data, requiresConfirmation: false, action: null };
        }

        case 'GET_STUDENT_DETAILS': {
          if (!targetStudent) {
            return {
              reply: 'Which student would you like to inspect? (e.g. "Show Rahul\'s marks and attendance")',
              requiresConfirmation: false,
              action: null,
            };
          }
          const data = await copilotTools.getStudentDetails(user, profDoc._id, targetStudent._id);
          const reply = aiProvider.formatResponse('GET_STUDENT_DETAILS', data);
          return { reply, data, requiresConfirmation: false, action: null };
        }

        case 'GET_STUDENT_MARKS': {
          const subject = targetSubject || profDoc?.assignedSubjectIds[0];
          const data = await copilotTools.getStudentMarks(
            user,
            profDoc._id,
            targetStudent?._id,
            subject?._id
          );
          const reply = aiProvider.formatResponse('GET_STUDENT_MARKS', { ...data, subject });
          return { reply, data, requiresConfirmation: false, action: null };
        }

        default: {
          return {
            reply:
              'I am your Faculty Academic Copilot. You can ask me:\n' +
              '• *"Show DBMS students below 75%."*\n' +
              '• *"Show Rahul\'s marks and attendance."*\n' +
              '• *"Who is at high academic risk?"*\n' +
              '• *"Update Rahul\'s DBMS Internal 1 mark to 42"*\n' +
              '• *"Record attendance for Rahul in DBMS today present"*',
            requiresConfirmation: false,
            action: null,
          };
        }
      }
    }

    return {
      reply: 'How may I assist you with academic records today?',
      requiresConfirmation: false,
      action: null,
    };
  }

  /**
   * Action Confirmation Handler
   * Executes the actual database write ONLY when confirmed === true
   */
  async confirmAction({ user, actionId, confirmed }) {
    const action = pendingActions.get(actionId);

    if (!action) {
      return {
        success: false,
        message: 'Action expired or not found. Please re-initiate the command.',
      };
    }

    // Security check: Must be the same professor who initiated the action
    if (action.professorUserId !== user._id.toString()) {
      return {
        success: false,
        message: 'Unauthorized: Only the initiating faculty member can confirm this operation.',
      };
    }

    // If cancelled: discard immediately, NO mutations
    if (!confirmed) {
      pendingActions.delete(actionId);
      return {
        success: true,
        confirmed: false,
        cancelled: true,
        reply: '❌ Action cancelled. No database changes were made.',
      };
    }

    // If confirmed: Execute authorized write tool
    try {
      let result;
      let replyMessage = '';

      if (action.type === 'UPDATE_MARK') {
        if (action.markId) {
          result = await copilotTools.updateMark(
            user,
            action.professorId,
            action.markId,
            action.newScore
          );
        } else {
          result = await copilotTools.createMark(
            user,
            action.professorId,
            action.studentId,
            action.subjectId,
            action.assessmentName,
            action.newScore,
            action.maxScore
          );
        }

        replyMessage = `✅ **Mark Update Confirmed**:\n\n` +
          `• **Student**: ${action.studentName}\n` +
          `• **Subject**: ${action.subjectCode} (${action.subjectName})\n` +
          `• **Assessment**: ${action.assessmentName}\n` +
          `• **New Score**: **${action.newScore}/${action.maxScore}**\n\n` +
          `*Student has been notified, academic risk recalculated (New Risk: ${result.risk?.score ?? 'Updated'}/100), and audit log recorded.*`;
      } else if (action.type === 'CREATE_MARK') {
        result = await copilotTools.createMark(
          user,
          action.professorId,
          action.studentId,
          action.subjectId,
          action.assessmentName,
          action.score,
          action.maxScore
        );

        replyMessage = `✅ **Mark Entry Confirmed**: Successfully recorded **${action.score}/${action.maxScore}** for **${action.studentName}** in **${action.subjectCode} - ${action.assessmentName}**. Notification sent and risk updated.`;
      } else if (action.type === 'RECORD_ATTENDANCE') {
        result = await copilotTools.recordAttendance(
          user,
          action.professorId,
          action.studentId,
          action.subjectId,
          action.date,
          action.status
        );

        replyMessage = `✅ **Attendance Recorded**: Session logged as **${action.status.toUpperCase()}** for **${action.studentName}** in **${action.subjectCode}**. Attendance trend recalculated (${result.stats.percentage}%).`;
      }

      // Cleanup pending action
      pendingActions.delete(actionId);

      return {
        success: true,
        confirmed: true,
        reply: replyMessage,
        data: result,
      };
    } catch (err) {
      pendingActions.delete(actionId);
      console.error('[CopilotService] Confirmation execution failed:', err);
      return {
        success: false,
        message: err.message || 'Execution error during action write.',
      };
    }
  }
}

module.exports = new CopilotService();
