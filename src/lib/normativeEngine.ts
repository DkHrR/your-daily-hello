/**
 * Normative Engine for Comparative Analysis
 * Calculates percentile rankings and comparative metrics against age/grade baselines
 */

interface BaselineData {
  mean: number;
  stdDev: number;
  percentiles?: {
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  };
}

interface MetricComparison {
  value: number;
  percentile: number;
  zScore: number;
  classification: 'critical' | 'below_average' | 'average' | 'above_average' | 'excellent';
  colorCode: string;
  description: string;
}

// ETDD70 Clinical Reference Data
const CLINICAL_BASELINES: Record<string, Record<string, BaselineData>> = {
  'K-1': {
    'wpm': { mean: 30, stdDev: 10, percentiles: { p10: 15, p25: 22, p50: 30, p75: 38, p90: 45 } },
    'fixation_duration': { mean: 300, stdDev: 80, percentiles: { p10: 200, p25: 240, p50: 300, p75: 360, p90: 400 } },
    'regression_count': { mean: 8, stdDev: 3, percentiles: { p10: 4, p25: 6, p50: 8, p75: 10, p90: 12 } },
    'chaos_index': { mean: 0.3, stdDev: 0.1, percentiles: { p10: 0.15, p25: 0.22, p50: 0.3, p75: 0.38, p90: 0.45 } },
  },
  '2-3': {
    'wpm': { mean: 60, stdDev: 15, percentiles: { p10: 40, p25: 50, p50: 60, p75: 72, p90: 85 } },
    'fixation_duration': { mean: 270, stdDev: 60, percentiles: { p10: 180, p25: 220, p50: 270, p75: 320, p90: 350 } },
    'regression_count': { mean: 6, stdDev: 2, percentiles: { p10: 3, p25: 4, p50: 6, p75: 8, p90: 10 } },
    'chaos_index': { mean: 0.25, stdDev: 0.08, percentiles: { p10: 0.12, p25: 0.18, p50: 0.25, p75: 0.32, p90: 0.38 } },
  },
  '4-5': {
    'wpm': { mean: 100, stdDev: 20, percentiles: { p10: 70, p25: 85, p50: 100, p75: 118, p90: 135 } },
    'fixation_duration': { mean: 240, stdDev: 50, percentiles: { p10: 160, p25: 200, p50: 240, p75: 280, p90: 310 } },
    'regression_count': { mean: 4, stdDev: 2, percentiles: { p10: 2, p25: 3, p50: 4, p75: 6, p90: 8 } },
    'chaos_index': { mean: 0.2, stdDev: 0.06, percentiles: { p10: 0.1, p25: 0.15, p50: 0.2, p75: 0.26, p90: 0.32 } },
  },
  '6-8': {
    'wpm': { mean: 140, stdDev: 25, percentiles: { p10: 100, p25: 120, p50: 140, p75: 165, p90: 190 } },
    'fixation_duration': { mean: 220, stdDev: 40, percentiles: { p10: 150, p25: 185, p50: 220, p75: 255, p90: 280 } },
    'regression_count': { mean: 3, stdDev: 1.5, percentiles: { p10: 1, p25: 2, p50: 3, p75: 4, p90: 6 } },
    'chaos_index': { mean: 0.15, stdDev: 0.05, percentiles: { p10: 0.08, p25: 0.11, p50: 0.15, p75: 0.19, p90: 0.24 } },
  },
  'adult': {
    'wpm': { mean: 200, stdDev: 40, percentiles: { p10: 140, p25: 170, p50: 200, p75: 235, p90: 270 } },
    'fixation_duration': { mean: 200, stdDev: 35, percentiles: { p10: 140, p25: 170, p50: 200, p75: 230, p90: 260 } },
    'regression_count': { mean: 2, stdDev: 1, percentiles: { p10: 0, p25: 1, p50: 2, p75: 3, p90: 4 } },
    'chaos_index': { mean: 0.1, stdDev: 0.04, percentiles: { p10: 0.05, p25: 0.07, p50: 0.1, p75: 0.13, p90: 0.16 } },
  },
};

// Age group to grade mapping
function getGradeFromAge(age: number): string {
  if (age <= 6) return 'K-1';
  if (age <= 8) return '2-3';
  if (age <= 10) return '4-5';
  if (age <= 13) return '6-8';
  return 'adult';
}

// Calculate z-score
function calculateZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

// Approximate percentile from z-score using normal distribution
function zScoreToPercentile(zScore: number): number {
  // Simple approximation using error function
  const a = 0.147;
  const sign = zScore >= 0 ? 1 : -1;
  const z = Math.abs(zScore);
  
  const erf = sign * Math.sqrt(1 - Math.exp(-z * z * (4 / Math.PI + a * z * z) / (1 + a * z * z)));
  const percentile = Math.round((1 + erf) / 2 * 100);
  
  return Math.max(1, Math.min(99, percentile));
}

// Get classification from percentile
function getClassification(percentile: number, isInverted: boolean = false): MetricComparison['classification'] {
  const p = isInverted ? 100 - percentile : percentile;
  
  if (p <= 10) return 'critical';
  if (p <= 25) return 'below_average';
  if (p <= 75) return 'average';
  if (p <= 90) return 'above_average';
  return 'excellent';
}

// Get color code for visualization
function getColorCode(classification: MetricComparison['classification']): string {
  const colors: Record<MetricComparison['classification'], string> = {
    critical: '#dc2626',      // Red
    below_average: '#f59e0b', // Amber
    average: '#6366f1',       // Indigo
    above_average: '#10b981', // Emerald
    excellent: '#059669',     // Dark green
  };
  return colors[classification];
}

// Get description based on classification
function getDescription(metric: string, classification: MetricComparison['classification']): string {
  const descriptions: Record<string, Record<MetricComparison['classification'], string>> = {
    wpm: {
      critical: 'Reading speed is significantly below age expectations',
      below_average: 'Reading speed is below age expectations',
      average: 'Reading speed is within normal range for age',
      above_average: 'Reading speed is above age expectations',
      excellent: 'Exceptional reading speed for age group',
    },
    fixation_duration: {
      critical: 'Prolonged fixations indicate processing difficulties',
      below_average: 'Fixation duration slightly elevated',
      average: 'Fixation patterns within normal range',
      above_average: 'Efficient visual processing',
      excellent: 'Highly efficient eye movement patterns',
    },
    regression_count: {
      critical: 'Excessive regressions suggest comprehension issues',
      below_average: 'Elevated regression rate',
      average: 'Normal regression patterns',
      above_average: 'Minimal regressions',
      excellent: 'Excellent forward reading flow',
    },
    chaos_index: {
      critical: 'Highly disorganized reading patterns',
      below_average: 'Somewhat irregular reading patterns',
      average: 'Normal reading pattern consistency',
      above_average: 'Organized reading patterns',
      excellent: 'Highly organized, efficient reading',
    },
  };

  return descriptions[metric]?.[classification] || 'Metric within expected range';
}

/**
 * Compare a metric value against normative baseline
 */
export function compareMetricToNorm(
  value: number,
  metric: string,
  gradeLevel: string,
  isInverted: boolean = false // true for metrics where lower is better
): MetricComparison {
  const baselines = CLINICAL_BASELINES[gradeLevel] || CLINICAL_BASELINES['adult'];
  const baseline = baselines[metric];

  if (!baseline) {
    return {
      value,
      percentile: 50,
      zScore: 0,
      classification: 'average',
      colorCode: '#6366f1',
      description: 'No baseline data available',
    };
  }

  const zScore = calculateZScore(value, baseline.mean, baseline.stdDev);
  const rawPercentile = zScoreToPercentile(zScore);
  const percentile = isInverted ? 100 - rawPercentile : rawPercentile;
  const classification = getClassification(percentile, false);

  return {
    value,
    percentile,
    zScore,
    classification,
    colorCode: getColorCode(classification),
    description: getDescription(metric, classification),
  };
}

/**
 * Get comprehensive comparison for all metrics
 */
export function getComprehensiveComparison(
  metrics: {
    wpm?: number;
    fixationDuration?: number;
    regressionCount?: number;
    chaosIndex?: number;
    fluencyScore?: number;
    pauseCount?: number;
  },
  age: number
): Record<string, MetricComparison> {
  const grade = getGradeFromAge(age);
  const results: Record<string, MetricComparison> = {};

  if (metrics.wpm !== undefined) {
    results.wpm = compareMetricToNorm(metrics.wpm, 'wpm', grade);
  }
  if (metrics.fixationDuration !== undefined) {
    results.fixationDuration = compareMetricToNorm(metrics.fixationDuration, 'fixation_duration', grade, true);
  }
  if (metrics.regressionCount !== undefined) {
    results.regressionCount = compareMetricToNorm(metrics.regressionCount, 'regression_count', grade, true);
  }
  if (metrics.chaosIndex !== undefined) {
    results.chaosIndex = compareMetricToNorm(metrics.chaosIndex, 'chaos_index', grade, true);
  }
  if (metrics.fluencyScore !== undefined) {
    // Fluency score is 0-100, normalize for comparison
    results.fluencyScore = {
      value: metrics.fluencyScore,
      percentile: metrics.fluencyScore,
      zScore: (metrics.fluencyScore - 50) / 15,
      classification: getClassification(metrics.fluencyScore),
      colorCode: getColorCode(getClassification(metrics.fluencyScore)),
      description: getDescription('fluency_score', getClassification(metrics.fluencyScore)),
    };
  }

  return results;
}

/**
 * Get grade-level baseline for display
 */
export function getBaselineForGrade(grade: string): Record<string, BaselineData> {
  return CLINICAL_BASELINES[grade] || CLINICAL_BASELINES['adult'];
}

/**
 * Get all available grade levels
 */
export function getAvailableGradeLevels(): string[] {
  return Object.keys(CLINICAL_BASELINES);
}

export { getGradeFromAge, CLINICAL_BASELINES };
