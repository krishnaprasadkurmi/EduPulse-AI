/**
 * Explainable Academic Risk Engine
 * Computes 0-100 risk score with normalized factors, factor breakdown,
 * human-readable drivers, and personalized recommendations.
 */

const normalizeAttendanceRisk = (attendancePercentage) => {
  if (attendancePercentage >= 90) return 5;
  if (attendancePercentage >= 80) return 20;
  if (attendancePercentage >= 75) return 40;
  if (attendancePercentage >= 65) return 75;
  return 95;
};

const normalizeAssessmentRisk = (marks) => {
  if (!marks || marks.length === 0) return 30; // default moderate uncertainty
  const percentages = marks.map((m) => (m.score / m.maxScore) * 100);
  const avg = percentages.reduce((a, b) => a + b, 0) / percentages.length;

  if (avg >= 85) return 5;
  if (avg >= 70) return 25;
  if (avg >= 55) return 55;
  if (avg >= 40) return 80;
  return 95;
};

const normalizeAssignmentRisk = (assignments, completedAssignments = []) => {
  if (!assignments || assignments.length === 0) return 10;
  const completionRate = completedAssignments.length / assignments.length;
  if (completionRate >= 0.9) return 10;
  if (completionRate >= 0.7) return 35;
  if (completionRate >= 0.5) return 65;
  return 90;
};

const normalizePreviousPerformanceRisk = (cgpa = 7.5) => {
  if (cgpa >= 8.5) return 10;
  if (cgpa >= 7.5) return 25;
  if (cgpa >= 6.5) return 50;
  if (cgpa >= 5.5) return 75;
  return 95;
};

const normalizeRecentTrendRisk = (attendanceTrend, marks = []) => {
  let markTrend = 0;
  if (marks.length >= 2) {
    const recent = marks[marks.length - 1];
    const prev = marks[marks.length - 2];
    const recentPct = (recent.score / recent.maxScore) * 100;
    const prevPct = (prev.score / prev.maxScore) * 100;
    markTrend = recentPct - prevPct;
  }

  // If both attendance and marks are declining
  if (attendanceTrend < -2 && markTrend < -5) return 90;
  if (attendanceTrend < -1.5 || markTrend < -5) return 70;
  if (attendanceTrend > 2 && markTrend > 5) return 10;
  if (attendanceTrend > 0 || markTrend >= 0) return 25;
  return 40;
};

const calculateSubjectRisk = ({
  attendanceStats,
  marks = [],
  assignments = [],
  completedAssignments = [],
  studentCGPA = 7.5,
}) => {
  const attPct = attendanceStats?.percentage ?? 100;
  const attTrend = attendanceStats?.trend ?? 0;

  // Normalized 0-100 risk values (higher = higher concern)
  const attRisk = normalizeAttendanceRisk(attPct);
  const examRisk = normalizeAssessmentRisk(marks);
  const assignRisk = normalizeAssignmentRisk(assignments, completedAssignments);
  const prevPerfRisk = normalizePreviousPerformanceRisk(studentCGPA);
  const trendRisk = normalizeRecentTrendRisk(attTrend, marks);

  // Example weighting from Blueprint:
  // Attendance: 25% | Assessment: 30% | Assignments: 15% | Previous performance: 15% | Recent trend: 15%
  const totalScore = Math.round(
    0.25 * attRisk +
    0.30 * examRisk +
    0.15 * assignRisk +
    0.15 * prevPerfRisk +
    0.15 * trendRisk
  );

  const clampedScore = Math.max(0, Math.min(100, totalScore));

  // Risk Level Mapping
  // 0-34 LOW, 35-64 MEDIUM, 65-100 HIGH
  let level = 'LOW';
  if (clampedScore >= 65) {
    level = 'HIGH';
  } else if (clampedScore >= 35) {
    level = 'MEDIUM';
  }

  // Explainability: Extract top contributing factors ranked by impact
  const factorsRanked = [
    {
      name: 'attendance',
      weight: 0.25,
      raw: attRisk,
      weightedContribution: attRisk * 0.25,
      insight: attPct < 75
        ? `Attendance (${attPct}%) is below the mandatory 75% threshold.`
        : attPct <= 80
        ? `Attendance (${attPct}%) is bordering the 75% requirement.`
        : `Attendance is healthy at ${attPct}%.`,
      isNegative: attRisk >= 40,
    },
    {
      name: 'assessment',
      weight: 0.30,
      raw: examRisk,
      weightedContribution: examRisk * 0.30,
      insight: examRisk >= 55
        ? `Subject assessment performance is below passing standard.`
        : examRisk >= 35
        ? `Assessment marks are average and require reinforcement.`
        : `Strong performance in recent tests and quizzes.`,
      isNegative: examRisk >= 50,
    },
    {
      name: 'trend',
      weight: 0.15,
      raw: trendRisk,
      weightedContribution: trendRisk * 0.15,
      insight: trendRisk >= 60
        ? `Negative trajectory: recent attendance/test scores have declined.`
        : `Performance trajectory is stable or progressing.`,
      isNegative: trendRisk >= 50,
    },
    {
      name: 'previousPerformance',
      weight: 0.15,
      raw: prevPerfRisk,
      weightedContribution: prevPerfRisk * 0.15,
      insight: prevPerfRisk >= 50
        ? `Cumulative academic baseline (CGPA ${studentCGPA}) indicates prior difficulty.`
        : `Solid baseline academic track record (CGPA ${studentCGPA}).`,
      isNegative: prevPerfRisk >= 50,
    },
    {
      name: 'assignment',
      weight: 0.15,
      raw: assignRisk,
      weightedContribution: assignRisk * 0.15,
      insight: assignRisk >= 50
        ? `Pending or missed assignment submissions.`
        : `Assignments submitted consistently.`,
      isNegative: assignRisk >= 50,
    },
  ];

  // Sort by weighted contribution descending
  factorsRanked.sort((a, b) => b.weightedContribution - a.weightedContribution);

  const insights = factorsRanked
    .filter((f) => f.isNegative)
    .map((f) => f.insight);

  if (insights.length === 0) {
    insights.push('Consistent academic performance and compliant attendance record.');
  }

  // Actionable recommendations
  const recommendations = [];
  if (attPct < 75) {
    const req = attendanceStats?.requiredClassesToReach75 || 3;
    recommendations.push(`Attend the next ${req} upcoming lectures without fail to reach 75%.`);
  }
  if (examRisk >= 50) {
    recommendations.push('Schedule a 1-on-1 concept review with the professor on recent test topics.');
  }
  if (assignRisk >= 50) {
    recommendations.push('Submit pending lab assignments and problem sets before the deadline.');
  }
  if (trendRisk >= 60) {
    recommendations.push('Form a study group to reverse the downward score trend before end-semester.');
  }
  if (recommendations.length === 0) {
    recommendations.push('Keep up the good work and prepare early for midterms.');
  }

  return {
    score: clampedScore,
    level,
    factors: {
      attendance: attRisk,
      assessment: examRisk,
      assignment: assignRisk,
      previousPerformance: prevPerfRisk,
      recentTrend: trendRisk,
    },
    insights,
    recommendations,
    calculatedAt: new Date(),
  };
};

module.exports = {
  calculateSubjectRisk,
  normalizeAttendanceRisk,
  normalizeAssessmentRisk,
};
