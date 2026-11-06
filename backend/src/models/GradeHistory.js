const mongoose = require('mongoose');

const gradeHistorySchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
    },
    academicYear: {
      type: String,
      required: true,
      default: '2023-2024',
    },
    sgpa: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },
    cgpa: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },
    totalCredits: {
      type: Number,
      default: 24,
    },
    completedCredits: {
      type: Number,
      default: 24,
    },
    passedSubjectsCount: {
      type: Number,
      default: 6,
    },
    failedSubjectsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

gradeHistorySchema.index({ studentId: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('GradeHistory', gradeHistorySchema);
