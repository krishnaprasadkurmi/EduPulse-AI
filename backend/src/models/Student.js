const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    department: {
      type: String,
      default: 'Computer Science & Engineering',
    },
    program: {
      type: String,
      default: 'B.Tech in Computer Science & Engineering',
    },
    semester: {
      type: Number,
      required: true,
      default: 5,
    },
    batch: {
      type: String,
      default: '2023-2027',
    },
    academicYear: {
      type: String,
      default: '2024-2025',
    },
    enrollmentStatus: {
      type: String,
      enum: ['Active', 'Suspended', 'Graduated', 'Withdrawn'],
      default: 'Active',
    },
    phone: {
      type: String,
      default: '+919876543210',
    },
    whatsappNumber: {
      type: String,
      default: '+919876543210',
      trim: true,
    },
    gmail: {
      type: String,
      default: '',
      trim: true,
    },
    cgpa: {
      type: Number,
      default: 7.5,
      min: 0,
      max: 10,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Student', studentSchema);
