const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'CREATE_MARK',
        'UPDATE_MARK',
        'VOICE_CREATE_MARK',
        'VOICE_UPDATE_MARK',
        'RECORD_ATTENDANCE',
        'UPDATE_ATTENDANCE',
        'ENROLL_STUDENT',
        'UPDATE_USER',
        'UPDATE_SUBJECT',
        'CREATE_RESOURCE',
        'UPDATE_RESOURCE',
        'DELETE_RESOURCE',
        'CREATE_EXAM',
        'UPDATE_EXAM',
        'DELETE_EXAM',
        'PUBLISH_RESULT',
        'UPDATE_RESULT',
      ],
    },
    entityType: {
      type: String,
      required: true,
      enum: [
        'Mark',
        'Attendance',
        'Enrollment',
        'Subject',
        'Student',
        'User',
        'LearningResource',
        'Exam',
        'Result',
      ],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    before: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    after: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
