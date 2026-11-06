const mongoose = require('mongoose');

const riskScoreSchema = new mongoose.Schema(
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
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    level: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      required: true,
      default: 'LOW',
    },
    factors: {
      attendance: { type: Number, default: 0 },         // Normalized 0-100 risk contribution (25% weight)
      assessment: { type: Number, default: 0 },         // Normalized 0-100 risk contribution (30% weight)
      assignment: { type: Number, default: 0 },         // Normalized 0-100 risk contribution (15% weight)
      previousPerformance: { type: Number, default: 0 },// Normalized 0-100 risk contribution (15% weight)
      recentTrend: { type: Number, default: 0 },        // Normalized 0-100 risk contribution (15% weight)
    },
    insights: [
      {
        type: String,
      },
    ],
    recommendations: [
      {
        type: String,
      },
    ],
    calculatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

riskScoreSchema.index({ studentId: 1, subjectId: 1 }, { unique: true });

module.exports = mongoose.model('RiskScore', riskScoreSchema);
