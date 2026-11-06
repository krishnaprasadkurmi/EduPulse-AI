/**
 * Attendance Intelligence Service
 * Computes transparent attendance statistics, required classes to reach 75%,
 * rolling trends, and linear projections based on Section 5 of Blueprint.
 */

const calculateRequiredClassesToReach75 = (attended, conducted) => {
  if (conducted === 0) return 0;
  const currentRatio = attended / conducted;
  if (currentRatio >= 0.75) return 0;

  // (attended + x) / (conducted + x) >= 0.75
  // x >= (0.75 * conducted - attended) / 0.25 = 3 * conducted - 4 * attended
  const needed = Math.ceil(3 * conducted - 4 * attended);
  return Math.max(0, needed);
};

const calculateClassesCanMiss = (attended, conducted) => {
  if (conducted === 0) return 0;
  // attended / (conducted + m) >= 0.75
  // m <= (attended - 0.75 * conducted) / 0.75 = (attended / 0.75) - conducted
  const missable = Math.floor((attended / 0.75) - conducted);
  return Math.max(0, missable);
};

const analyzeAttendanceTrend = (records) => {
  // records sorted ascending by date
  if (!records || records.length === 0) {
    return {
      totalClasses: 0,
      attendedClasses: 0,
      percentage: 100,
      trend: 0,
      trendDirection: 'STABLE',
      projectedPercentage: 100,
      status: 'SAFE',
      requiredClassesToReach75: 0,
      classesCanMiss: 0,
      recommendation: 'No classes conducted yet.',
    };
  }

  const conducted = records.length;
  const attended = records.filter((r) => r.status === 'present').length;
  const percentage = Number(((attended / conducted) * 100).toFixed(1));

  // Recent trend calculation: Compare last 5 classes (or half) with previous window
  let trend = 0;
  let trendDirection = 'STABLE';
  if (conducted >= 4) {
    const recentWindowSize = Math.min(5, Math.floor(conducted / 2));
    const recentRecords = records.slice(-recentWindowSize);
    const earlierRecords = records.slice(0, -recentWindowSize);

    const recentRate = (recentRecords.filter((r) => r.status === 'present').length / recentRecords.length) * 100;
    const earlierRate = (earlierRecords.filter((r) => r.status === 'present').length / earlierRecords.length) * 100;

    trend = Number((recentRate - earlierRate).toFixed(1));
    if (trend < -1.5) trendDirection = 'DOWN';
    else if (trend > 1.5) trendDirection = 'UP';
    else trendDirection = 'STABLE';
  }

  // Projected attendance: linear weighted estimate
  // If recent trend is negative, projected % dampens slightly
  let projectedPercentage = percentage;
  if (trendDirection === 'DOWN') {
    projectedPercentage = Math.max(0, Number((percentage + (trend * 0.4)).toFixed(1)));
  } else if (trendDirection === 'UP') {
    projectedPercentage = Math.min(100, Number((percentage + (trend * 0.4)).toFixed(1)));
  }

  // Threshold status rule from blueprint:
  // If projected attendance is below 75%, status = CRITICAL.
  // If current/projected attendance is close to 75% (75% to 80%), status = WARNING.
  // Otherwise status = SAFE.
  let status = 'SAFE';
  if (percentage < 75 || projectedPercentage < 75) {
    status = 'CRITICAL';
  } else if (percentage <= 80 || projectedPercentage <= 80) {
    status = 'WARNING';
  }

  const requiredClasses = calculateRequiredClassesToReach75(attended, conducted);
  const classesCanMiss = calculateClassesCanMiss(attended, conducted);

  let recommendation = 'Your attendance is in great standing. Maintain consistency.';
  if (status === 'CRITICAL') {
    recommendation = `Attend the next ${requiredClasses} consecutive classes to recover to 75% threshold.`;
  } else if (status === 'WARNING') {
    recommendation = `Attendance is near the 75% border. You can afford to miss at most ${classesCanMiss} class(es). Do not skip upcoming lectures.`;
  }

  return {
    totalClasses: conducted,
    attendedClasses: attended,
    percentage,
    trend,
    trendDirection,
    projectedPercentage,
    status,
    requiredClassesToReach75: requiredClasses,
    classesCanMiss,
    recommendation,
  };
};

module.exports = {
  calculateRequiredClassesToReach75,
  calculateClassesCanMiss,
  analyzeAttendanceTrend,
};
