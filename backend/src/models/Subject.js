const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      default: 'Computer Science & Engineering',
    },
    semester: {
      type: Number,
      required: true,
      default: 5,
    },
    credits: {
      type: Number,
      default: 4,
    },
    maxMark: {
      type: Number,
      default: 100,
    },
    professorIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Professor',
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Subject', subjectSchema);
