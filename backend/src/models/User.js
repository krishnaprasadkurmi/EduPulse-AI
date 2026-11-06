const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['student', 'professor', 'admin'],
      required: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    department: {
      type: String,
      default: 'Computer Science & Engineering',
    },
    // WhatsApp Number (with country code, e.g., +91XXXXXXXXXX)
    whatsappNumber: {
      type: String,
      default: '+919876543210',
      trim: true,
    },
    // Gmail address for academic alerts
    gmail: {
      type: String,
      default: '',
      lowercase: true,
      trim: true,
    },
    // CallMeBot Free WhatsApp API key (user-specific)
    callmebotApiKey: {
      type: String,
      default: '',
      trim: true,
    },
    // Custom SMTP configuration for real Email delivery
    smtpConfig: {
      senderEmail: { type: String, default: '', trim: true },
      appPassword: { type: String, default: '', trim: true },
    },
    phone: {
      type: String,
      default: '+919876543210',
      trim: true,
    },
    // Notification channel preferences
    notificationPreferences: {
      attendanceAlerts: { type: Boolean, default: true },
      academicRiskAlerts: { type: Boolean, default: true },
      newMarkAdded: { type: Boolean, default: true },
      examReminders: { type: Boolean, default: true },
      resourceUpdates: { type: Boolean, default: true },
      resultNotifications: { type: Boolean, default: true },
    },
    preferences: {
      theme: { type: String, default: 'dark' },
      emailNotifications: { type: Boolean, default: true },
      whatsappNotifications: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
