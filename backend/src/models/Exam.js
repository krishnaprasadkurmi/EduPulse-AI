const mongoose = require('mongoose');

const examSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
    examType: {
      type: String,
      enum: ['Internal Assessment', 'Midterm', 'Model Exam', 'End Semester', 'Practical', 'Other'],
      default: 'Internal Assessment',
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
    },
    endTime: {
      type: String,
      required: true,
      trim: true,
    },
    venue: {
      type: String,
      default: 'Main Hall',
      trim: true,
    },
    maxMarks: {
      type: Number,
      required: true,
      default: 50,
    },
    status: {
      type: String,
      enum: ['Scheduled', 'Published', 'Completed', 'Cancelled'],
      default: 'Scheduled',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual to calculate days remaining or status countdown
examSchema.virtual('daysRemaining').get(function () {
  const now = new Date();
  const examDate = new Date(this.date);
  const diffTime = examDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

examSchema.set('toJSON', { virtuals: true });
examSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Exam', examSchema);
