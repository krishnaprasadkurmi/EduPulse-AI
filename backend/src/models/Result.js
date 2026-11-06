const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      default: null,
      index: true,
    },
    internalMarks: {
      type: Number,
      default: 0,
      min: 0,
    },
    assignmentMarks: {
      type: Number,
      default: 0,
      min: 0,
    },
    practicalMarks: {
      type: Number,
      default: 0,
      min: 0,
    },
    externalMarks: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalMarks: {
      type: Number,
      required: true,
      min: 0,
    },
    maxMarks: {
      type: Number,
      default: 100,
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    grade: {
      type: String,
      required: true,
      enum: ['O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F'],
      default: 'A',
    },
    gradePoint: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
      default: 8,
    },
    resultStatus: {
      type: String,
      enum: ['Pass', 'Fail', 'Distinction'],
      default: 'Pass',
      index: true,
    },
    published: {
      type: Boolean,
      default: true,
      index: true,
    },
    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to avoid duplicate result entries for same student, subject, and exam
resultSchema.index({ studentId: 1, subjectId: 1, examId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Result', resultSchema);
