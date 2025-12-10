/**
 * Calculate accuracy score based on annotations
 * Similar to chess accuracy - weighted by annotation quality
 */

const ANNOTATION_WEIGHTS = {
  brilliant: 100,  // !! Perfect move
  good: 80,        // ! Good move
  interesting: 60, // !? Interesting but questionable
  dubious: 40,     // ?! Dubious move
  mistake: 20,     // ? Clear mistake
  blunder: 0,      // ?? Severe error
};

const ANNOTATION_IMPACTS = {
  brilliant: 1.2,   // Boosts score
  good: 1.0,        // Neutral
  interesting: 0.9, // Slight penalty
  dubious: 0.7,     // Moderate penalty
  mistake: 0.4,     // Heavy penalty
  blunder: 0.1,     // Severe penalty
};

/**
 * Calculate accuracy score from annotations
 * @param {Array} annotations - Array of annotation objects with type and line
 * @param {number} totalLines - Total lines in the file
 * @returns {Object} Score data with percentage, grade, and breakdown
 */
export const calculateAccuracyScore = (annotations = [], totalLines = 100) => {
  if (annotations.length === 0) {
    return {
      score: 100,
      grade: 'N/A',
      color: '#888',
      breakdown: {},
      totalAnnotations: 0,
    };
  }

  // Count annotations by type
  const breakdown = {
    brilliant: 0,
    good: 0,
    interesting: 0,
    dubious: 0,
    mistake: 0,
    blunder: 0,
  };

  annotations.forEach(ann => {
    if (breakdown.hasOwnProperty(ann.type)) {
      breakdown[ann.type]++;
    }
  });

  // Calculate weighted score
  let totalWeight = 0;
  let earnedWeight = 0;

  Object.keys(breakdown).forEach(type => {
    const count = breakdown[type];
    const weight = ANNOTATION_WEIGHTS[type];
    totalWeight += count * 100; // Max possible
    earnedWeight += count * weight;
  });

  // Calculate percentage (0-100)
  const rawScore = totalWeight > 0 ? (earnedWeight / totalWeight) * 100 : 100;

  // Apply impact multipliers for severe issues
  let impactMultiplier = 1.0;
  if (breakdown.blunder > 0) {
    impactMultiplier *= Math.pow(0.8, breakdown.blunder);
  }
  if (breakdown.mistake > 2) {
    impactMultiplier *= 0.9;
  }

  const finalScore = Math.max(0, Math.min(100, rawScore * impactMultiplier));

  // Determine grade and color
  const { grade, color } = getGradeFromScore(finalScore);

  return {
    score: Math.round(finalScore * 10) / 10,
    grade,
    color,
    breakdown,
    totalAnnotations: annotations.length,
  };
};

/**
 * Get letter grade and color from numeric score
 */
const getGradeFromScore = (score) => {
  if (score >= 95) return { grade: 'A+', color: '#00ff88' };
  if (score >= 90) return { grade: 'A', color: '#00ff66' };
  if (score >= 85) return { grade: 'A-', color: '#00ff41' };
  if (score >= 80) return { grade: 'B+', color: '#88ff00' };
  if (score >= 75) return { grade: 'B', color: '#aaff00' };
  if (score >= 70) return { grade: 'B-', color: '#ccff00' };
  if (score >= 65) return { grade: 'C+', color: '#ffff00' };
  if (score >= 60) return { grade: 'C', color: '#ffd700' };
  if (score >= 55) return { grade: 'C-', color: '#ffaa00' };
  if (score >= 50) return { grade: 'D+', color: '#ff9500' };
  if (score >= 45) return { grade: 'D', color: '#ff7700' };
  if (score >= 40) return { grade: 'D-', color: '#ff5500' };
  return { grade: 'F', color: '#ff4444' };
};

/**
 * Calculate accuracy trends over multiple files
 */
export const calculateOverallAccuracy = (fileScores = []) => {
  if (fileScores.length === 0) {
    return {
      averageScore: 0,
      grade: 'N/A',
      color: '#888',
      totalFiles: 0,
      totalAnnotations: 0,
    };
  }

  const totalScore = fileScores.reduce((sum, file) => sum + file.score, 0);
  const averageScore = totalScore / fileScores.length;
  const totalAnnotations = fileScores.reduce((sum, file) => sum + file.totalAnnotations, 0);

  const { grade, color } = getGradeFromScore(averageScore);

  return {
    averageScore: Math.round(averageScore * 10) / 10,
    grade,
    color,
    totalFiles: fileScores.length,
    totalAnnotations,
  };
};

/**
 * Get recommendations based on score
 */
export const getRecommendations = (scoreData) => {
  const { score, breakdown } = scoreData;
  const recommendations = [];

  if (breakdown.blunder > 0) {
    recommendations.push({
      severity: 'high',
      message: `${breakdown.blunder} blunder(s) found - Critical issues that need immediate attention`,
      icon: '⚠️',
    });
  }

  if (breakdown.mistake > 2) {
    recommendations.push({
      severity: 'medium',
      message: `${breakdown.mistake} mistakes detected - Review error handling and edge cases`,
      icon: '⚡',
    });
  }

  if (breakdown.dubious > 3) {
    recommendations.push({
      severity: 'low',
      message: `${breakdown.dubious} dubious patterns - Consider refactoring for clarity`,
      icon: '💡',
    });
  }

  if (breakdown.brilliant > 0) {
    recommendations.push({
      severity: 'positive',
      message: `${breakdown.brilliant} brilliant move(s) - Excellent patterns worth learning!`,
      icon: '✨',
    });
  }

  if (score >= 90) {
    recommendations.push({
      severity: 'positive',
      message: 'Outstanding code quality - Keep up the great work!',
      icon: '🏆',
    });
  } else if (score < 60) {
    recommendations.push({
      severity: 'medium',
      message: 'Consider reviewing best practices and design patterns',
      icon: '📚',
    });
  }

  return recommendations;
};
