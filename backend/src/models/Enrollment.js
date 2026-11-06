const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    semester: {
      type: Number,
      required: true,
    },
    academicYear: {
      type: String,
      default: '2025-2026',
    },
  },
  {
    timestamps: true,
  }
);

enrollmentSchema.index({ studentId: 1, subjectId: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
