const mongoose = require('mongoose');

const learningResourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['Notes', 'PDF', 'Lecture Material', 'Reference Link', 'Assignment Material', 'Other'],
      default: 'Notes',
      index: true,
    },
    fileUrl: {
      type: String,
      default: '',
    },
    externalUrl: {
      type: String,
      default: '',
    },
    fileSize: {
      type: String,
      default: '',
    },
    fileType: {
      type: String,
      default: '',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    visibleToStudents: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual to determine if upload is within last 7 days (New badge)
learningResourceSchema.virtual('isNew').get(function () {
  const diffDays = (Date.now() - new Date(this.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= 7;
});

learningResourceSchema.set('toJSON', { virtuals: true });
learningResourceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('LearningResource', learningResourceSchema);
