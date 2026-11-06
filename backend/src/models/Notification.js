const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'MARK_CREATED',
        'MARK_UPDATED',
        'ATTENDANCE_WARNING',
        'ATTENDANCE_CRITICAL',
        'RISK_HIGH',
        'RISK_MEDIUM',
        'ASSIGNMENT_NEW',
        'ADMIN_ANNOUNCEMENT',
        'EXAM_SCHEDULED',
        'EXAM_REMINDER',
        'RESULT_PUBLISHED',
        'RESOURCE_UPLOADED',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    // Multi-channel delivery tracking (Requirement 8)
    channels: {
      whatsapp: {
        sent: { type: Boolean, default: false },
        status: { type: String, enum: ['SENT', 'FAILED', 'SKIPPED', 'UNCONFIGURED'], default: 'SKIPPED' },
        timestamp: { type: Date },
        recipient: { type: String },
        error: { type: String },
        link: { type: String }, // Direct 1-click WhatsApp send link
        provider: { type: String },
      },
      email: {
        sent: { type: Boolean, default: false },
        status: { type: String, enum: ['SENT', 'FAILED', 'SKIPPED', 'UNCONFIGURED'], default: 'SKIPPED' },
        timestamp: { type: Date },
        recipient: { type: String },
        error: { type: String },
        link: { type: String }, // Direct 1-click Gmail web compose link
        provider: { type: String },
      },
    },
    metadata: {
      subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
      studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
      markId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mark' },
      extra: { type: mongoose.Schema.Types.Mixed },
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

module.exports = mongoose.model('Notification', notificationSchema);
