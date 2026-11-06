const mongoose = require('mongoose');

const markSchema = new mongoose.Schema(
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
    assessmentName: {
      type: String,
      required: true,
      trim: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    maxScore: {
      type: Number,
      required: true,
      default: 50,
      min: 1,
    },
    weight: {
      type: Number,
      default: 20, // percentage weight in subject total
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

markSchema.index({ studentId: 1, subjectId: 1, assessmentName: 1 });

module.exports = mongoose.model('Mark', markSchema);
