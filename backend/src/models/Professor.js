const mongoose = require('mongoose');

const professorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    department: {
      type: String,
      default: 'Computer Science & Engineering',
    },
    designation: {
      type: String,
      default: 'Associate Professor',
    },
    assignedSubjectIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Professor', professorSchema);
