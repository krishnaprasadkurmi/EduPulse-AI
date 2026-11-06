const User = require('../models/User');
const Student = require('../models/Student');
const Professor = require('../models/Professor');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const RiskScore = require('../models/RiskScore');
const AuditLog = require('../models/AuditLog');

// @desc Get university-wide high level analytics
// @route GET /api/admin/analytics
exports.getUniversityAnalytics = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalProfessors = await Professor.countDocuments();
    const totalSubjects = await Subject.countDocuments();

    // Risk distribution calculation
    const allRiskScores = await RiskScore.find();
    let highRiskCount = 0;
    let medRiskCount = 0;
    let lowRiskCount = 0;

    for (const r of allRiskScores) {
      if (r.level === 'HIGH') highRiskCount++;
      else if (r.level === 'MEDIUM') medRiskCount++;
      else lowRiskCount++;
    }

    const totalRisks = allRiskScores.length || 1;
    const riskDistribution = {
      high: { count: highRiskCount, percentage: Number(((highRiskCount / totalRisks) * 100).toFixed(1)) },
      medium: { count: medRiskCount, percentage: Number(((medRiskCount / totalRisks) * 100).toFixed(1)) },
      low: { count: lowRiskCount, percentage: Number(((lowRiskCount / totalRisks) * 100).toFixed(1)) },
    };

    // Overall campus attendance health
    const allAttendance = await Attendance.find();
    const conductedCount = allAttendance.length;
    const presentCount = allAttendance.filter((a) => a.status === 'present').length;
    const campusAttendanceRate = conductedCount > 0
      ? Number(((presentCount / conductedCount) * 100).toFixed(1))
      : 84.5;

    // Attendance below 75% student subject count
    const criticalAttendanceCount = allRiskScores.filter((r) => r.factors.attendance >= 40).length;

    res.json({
      success: true,
      data: {
        totalStudents,
        totalProfessors,
        totalSubjects,
        campusAttendanceRate,
        criticalAttendanceCount,
        riskDistribution,
      },
    });
  } catch (err) {
    console.error('[AdminController] getUniversityAnalytics error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving analytics' });
  }
};

// @desc Get detailed university risk monitor list
// @route GET /api/admin/risk
exports.getUniversityRiskMonitor = async (req, res) => {
  try {
    const riskScores = await RiskScore.find()
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'name email avatar department' },
      })
      .populate('subjectId', 'name code department semester')
      .sort({ score: -1 });

    res.json({
      success: true,
      count: riskScores.length,
      data: riskScores,
    });
  } catch (err) {
    console.error('[AdminController] getUniversityRiskMonitor error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving risk monitor' });
  }
};

// @desc Get audit logs
// @route GET /api/admin/audit-logs
exports.getAuditLogs = async (req, res) => {
  try {
    const { limit = 50, action, entityType } = req.query;
    const filter = {};

    if (action) filter.action = action;
    if (entityType) filter.entityType = entityType;

    const logs = await AuditLog.find(filter)
      .populate('actorId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10));

    res.json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (err) {
    console.error('[AdminController] getAuditLogs error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving audit logs' });
  }
};

// @desc Get all MongoDB collections and document counts
// @route GET /api/admin/collections
exports.getCollectionsList = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const collections = await mongoose.connection.db.listCollections().toArray();
    const result = [];
    for (const c of collections) {
      const count = await mongoose.connection.db.collection(c.name).countDocuments();
      result.push({ name: c.name, count });
    }
    res.json({
      success: true,
      database: mongoose.connection.db.databaseName,
      uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/edupulse',
      connectionStatus: 'CONNECTED',
      data: result,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Get documents from a specific collection
// @route GET /api/admin/collections/:name
exports.getCollectionData = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const { name } = req.params;
    const { limit = 50 } = req.query;
    const docs = await mongoose.connection.db
      .collection(name)
      .find({})
      .sort({ _id: -1 })
      .limit(parseInt(limit, 10))
      .toArray();
    res.json({
      success: true,
      collection: name,
      count: docs.length,
      data: docs,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

