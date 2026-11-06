const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const Professor = require('../models/Professor');

const generateToken = (userId, role) => {
  const secret = process.env.JWT_SECRET || 'edupulse_hackathon_jwt_secret_key_super_secure_2026';
  return jwt.sign({ id: userId, role }, secret, { expiresIn: '7d' });
};

// @desc Login user
// @route POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials',
      });
    }

    let profileData = null;
    if (user.role === 'student') {
      profileData = await Student.findOne({ userId: user._id });
    } else if (user.role === 'professor') {
      profileData = await Professor.findOne({ userId: user._id }).populate('assignedSubjectIds');
    }

    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        whatsappNumber: user.whatsappNumber || '+919876543210',
        gmail: user.gmail || user.email,
        callmebotApiKey: user.callmebotApiKey || '',
        smtpConfig: {
          senderEmail: user.smtpConfig?.senderEmail || user.gmail || '',
          hasPassword: !!(user.smtpConfig?.appPassword || process.env.SMTP_PASS),
        },
        notificationPreferences: user.notificationPreferences || {
          attendanceAlerts: true,
          academicRiskAlerts: true,
          newMarkAdded: true,
          examReminders: true,
        },
        role: user.role,
        department: user.department,
        avatar: user.avatar,
        profile: profileData,
      },
    });
  } catch (err) {
    console.error('[AuthController] Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// @desc Register user
// @route POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      department,
      studentId: customStudentId,
      employeeId: customEmployeeId,
      semester,
      phone,
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password and role',
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please log in.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      department: department || 'Computer Science & Engineering',
      avatar:
        role === 'professor'
          ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
          : role === 'admin'
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
          : 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    });

    let profileData = null;
    const Subject = require('../models/Subject');
    const Enrollment = require('../models/Enrollment');
    const Attendance = require('../models/Attendance');
    const RiskScore = require('../models/RiskScore');

    if (role === 'student') {
      const studentCount = await Student.countDocuments();
      const generatedId = customStudentId?.trim() || `STU${2024000 + studentCount + 1}`;
      
      profileData = await Student.create({
        userId: user._id,
        studentId: generatedId,
        department: user.department,
        semester: semester ? parseInt(semester, 10) : 5,
        batch: '2023-2027',
        phone: phone || '+1-555-0100',
        cgpa: 7.5,
      });

      // Auto-enroll student into subjects for their semester
      const subjects = await Subject.find({ semester: profileData.semester });
      for (const subj of subjects) {
        await Enrollment.create({
          studentId: profileData._id,
          subjectId: subj._id,
          semester: profileData.semester,
          academicYear: '2025-2026',
        });

        // Seed initial attendance session (e.g. 10 sessions, 8 present = 80%)
        const baseDate = new Date();
        baseDate.setDate(baseDate.getDate() - 15);
        for (let i = 0; i < 10; i++) {
          const d = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000);
          await Attendance.create({
            studentId: profileData._id,
            subjectId: subj._id,
            date: d,
            status: i === 3 || i === 7 ? 'absent' : 'present',
            recordedBy: user._id,
          });
        }

        // Initialize risk score
        await RiskScore.create({
          studentId: profileData._id,
          subjectId: subj._id,
          score: 25,
          level: 'LOW',
          factors: {
            attendance: 20,
            assessment: 25,
            assignment: 15,
            previousPerformance: 25,
            recentTrend: 25,
          },
          insights: ['Baseline attendance standing is compliant with 75% threshold.'],
          recommendations: ['Maintain lecture attendance and submit problem sets on time.'],
        });
      }
    } else if (role === 'professor') {
      const profCount = await Professor.countDocuments();
      const generatedEmpId = customEmployeeId?.trim() || `FAC${1000 + profCount + 1}`;

      // Assign available subjects to new professor
      const subjects = await Subject.find().limit(2);
      profileData = await Professor.create({
        userId: user._id,
        employeeId: generatedEmpId,
        department: user.department,
        designation: 'Assistant Professor',
        assignedSubjectIds: subjects.map((s) => s._id),
      });

      for (const s of subjects) {
        if (!s.professorIds.includes(profileData._id)) {
          s.professorIds.push(profileData._id);
          await s.save();
        }
      }
    }

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: `Account created successfully! Welcome to EduPulse AI.`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        avatar: user.avatar,
        profile: profileData,
      },
    });
  } catch (err) {
    console.error('[AuthController] Register error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// @desc Get current logged-in user profile
// @route GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let profileData = null;
    if (user.role === 'student') {
      profileData = await Student.findOne({ userId: user._id });
    } else if (user.role === 'professor') {
      profileData = await Professor.findOne({ userId: user._id }).populate('assignedSubjectIds');
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        whatsappNumber: user.whatsappNumber || '+919876543210',
        gmail: user.gmail || user.email,
        callmebotApiKey: user.callmebotApiKey || '',
        smtpConfig: {
          senderEmail: user.smtpConfig?.senderEmail || user.gmail || '',
          hasPassword: !!(user.smtpConfig?.appPassword || process.env.SMTP_PASS),
        },
        notificationPreferences: user.notificationPreferences || {
          attendanceAlerts: true,
          academicRiskAlerts: true,
          newMarkAdded: true,
          examReminders: true,
        },
        role: user.role,
        department: user.department,
        avatar: user.avatar,
        profile: profileData,
      },
    });
  } catch (err) {
    console.error('[AuthController] getMe error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching user profile' });
  }
};

// @desc Update user profile & notification preferences
// @route PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const {
      name,
      whatsappNumber,
      gmail,
      callmebotApiKey,
      smtpConfig,
      notificationPreferences,
      studentId,
    } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name && name.trim()) user.name = name.trim();

    // Validation for WhatsApp Number (Requirement 1: must include country code e.g. +91XXXXXXXXXX)
    if (whatsappNumber !== undefined) {
      const cleanWa = whatsappNumber.trim().replace(/[\s\-()]/g, '');
      if (!cleanWa) {
        return res.status(400).json({ success: false, message: 'WhatsApp number is required.' });
      }
      const { isValidWhatsAppNumber } = require('../services/alertDispatcher');
      if (!isValidWhatsAppNumber(cleanWa)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid WhatsApp number format. Must include country code (e.g. +919876543210).',
        });
      }
      user.whatsappNumber = cleanWa;
    }

    // Validation for Gmail address (Requirement 1)
    if (gmail !== undefined) {
      const cleanGmail = gmail.trim().toLowerCase();
      if (!cleanGmail) {
        return res.status(400).json({ success: false, message: 'Gmail address is required.' });
      }
      const { isValidEmail } = require('../services/alertDispatcher');
      if (!isValidEmail(cleanGmail)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email address format. Please enter a valid Gmail address.',
        });
      }
      user.gmail = cleanGmail;
    }

    // CallMeBot API key
    if (callmebotApiKey !== undefined) {
      user.callmebotApiKey = callmebotApiKey.trim();
    }

    // SMTP Configuration for Gmail
    if (smtpConfig) {
      if (!user.smtpConfig) user.smtpConfig = {};
      if (smtpConfig.senderEmail !== undefined) {
        user.smtpConfig.senderEmail = smtpConfig.senderEmail.trim();
      }
      if (
        smtpConfig.appPassword !== undefined &&
        smtpConfig.appPassword !== '********' &&
        smtpConfig.appPassword !== ''
      ) {
        user.smtpConfig.appPassword = smtpConfig.appPassword.replace(/\s+/g, '').trim();
      }
    }

    if (notificationPreferences) {
      user.notificationPreferences = {
        ...user.notificationPreferences,
        ...notificationPreferences,
      };
    }

    await user.save();

    let profileData = null;
    if (user.role === 'student') {
      const student = await Student.findOne({ userId: user._id });
      if (student) {
        if (studentId && studentId.trim()) student.studentId = studentId.trim();
        if (user.whatsappNumber) student.whatsappNumber = user.whatsappNumber;
        if (user.gmail) student.gmail = user.gmail;
        await student.save();
        profileData = student;
      }
    } else if (user.role === 'professor') {
      profileData = await Professor.findOne({ userId: user._id }).populate('assignedSubjectIds');
    }

    res.json({
      success: true,
      message: 'Profile and gateway settings updated successfully!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        whatsappNumber: user.whatsappNumber,
        gmail: user.gmail,
        callmebotApiKey: user.callmebotApiKey || '',
        smtpConfig: {
          senderEmail: user.smtpConfig?.senderEmail || user.gmail || '',
          hasPassword: !!(user.smtpConfig?.appPassword || process.env.SMTP_PASS),
        },
        notificationPreferences: user.notificationPreferences,
        role: user.role,
        department: user.department,
        avatar: user.avatar,
        profile: profileData,
      },
    });
  } catch (err) {
    console.error('[AuthController] updateProfile error:', err);
    res.status(500).json({ success: false, message: 'Server error updating profile' });
  }
};

// @desc Send instant test alert to WhatsApp and Email
// @route POST /api/auth/test-alert
exports.sendTestAlert = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { sendTestAlert } = require('../services/notificationService');
    const notification = await sendTestAlert({ user });

    const waChannel = notification?.channels?.whatsapp || {};
    const emailChannel = notification?.channels?.email || {};

    let userMessage = `Test alert generated!`;
    if (waChannel.status === 'SENT' && emailChannel.status === 'SENT') {
      userMessage = `✓ Live alert sent to WhatsApp (${user.whatsappNumber}) and Gmail (${user.gmail || user.email})!`;
    } else if (waChannel.status === 'SENT') {
      userMessage = `✓ Live WhatsApp delivered! Email pending SMTP configuration.`;
    } else if (emailChannel.status === 'SENT') {
      userMessage = `✓ Live email delivered to ${user.gmail || user.email}! WhatsApp pending CallMeBot key.`;
    } else {
      userMessage = `Alert generated! Use the 1-click links below or set up your CallMeBot / Gmail credentials for automated delivery.`;
    }

    res.json({
      success: true,
      message: userMessage,
      data: notification,
      whatsappLink: waChannel.link,
      emailLink: emailChannel.link,
      channels: notification.channels,
    });
  } catch (err) {
    console.error('[AuthController] sendTestAlert error:', err);
    res.status(500).json({ success: false, message: 'Failed to dispatch test alert' });
  }
};

// @desc Test CallMeBot WhatsApp Gateway Connection
// @route POST /api/auth/test-whatsapp
exports.testWhatsAppGateway = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { phone, apiKey } = req.body;
    const targetPhone = phone || user.whatsappNumber;
    const targetKey = apiKey || user.callmebotApiKey || process.env.CALLMEBOT_API_KEY;

    const { testCallMeBotKey } = require('../services/alertDispatcher');
    const result = await testCallMeBotKey({ phone: targetPhone, apiKey: targetKey });

    res.json(result);
  } catch (err) {
    console.error('[AuthController] testWhatsAppGateway error:', err);
    res.status(500).json({ success: false, message: 'Gateway test failed: ' + err.message });
  }
};

// @desc Test Nodemailer Gmail SMTP Gateway Connection
// @route POST /api/auth/test-email
exports.testEmailGateway = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { senderEmail, appPassword } = req.body;
    const cleanSender = senderEmail || user.smtpConfig?.senderEmail || user.gmail || user.email;
    const cleanPass = appPassword || user.smtpConfig?.appPassword || process.env.SMTP_PASS;

    const { testSmtpConnection } = require('../services/alertDispatcher');
    const result = await testSmtpConnection({
      senderEmail: cleanSender,
      appPassword: cleanPass,
      recipientEmail: user.gmail || user.email,
    });

    res.json(result);
  } catch (err) {
    console.error('[AuthController] testEmailGateway error:', err);
    res.status(500).json({ success: false, message: 'SMTP test failed: ' + err.message });
  }
};


