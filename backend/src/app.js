const express = require('express');
const cors = require('cors');

// Route handlers
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const marksRoutes = require('./routes/marksRoutes');
const riskRoutes = require('./routes/riskRoutes');
const voiceRoutes = require('./routes/voiceRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const copilotRoutes = require('./routes/copilotRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const examRoutes = require('./routes/examRoutes');
const resultRoutes = require('./routes/resultRoutes');
const path = require('path');

const app = express();

// Middleware
app.use(cors({
  origin: '*', // hackathon friendliness
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static directory for uploaded learning resources
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Root & API Welcome Handlers
const apiWelcomeHandler = (req, res) => {
  res.json({
    status: 'online',
    system: 'EduPulse AI Engine',
    version: '1.0.0',
    message: 'EduPulse AI REST API is operational',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      students: '/api/students',
      subjects: '/api/subjects',
      attendance: '/api/attendance',
      marks: '/api/marks',
      risk: '/api/risk',
      voice: '/api/voice',
      notifications: '/api/notifications',
      admin: '/api/admin',
      copilot: '/api/copilot',
      resources: '/api/resources',
      exams: '/api/exams',
      results: '/api/results',
    },
    timestamp: new Date().toISOString(),
  });
};

app.get('/', apiWelcomeHandler);
app.get('/api', apiWelcomeHandler);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'EduPulse AI Engine',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/marks', marksRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/copilot', copilotRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/results', resultRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[App Error]', err.stack || err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

module.exports = app;
