import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type NormativeBaseline = Tables<'normative_baselines'>;

interface PercentileRanking {
  value: number;
  percentile: number;
  comparisonLabel: 'significantly below' | 'below' | 'average' | 'above' | 'significantly above';
  color: string;
}

interface NormativeComparison {
  wpm?: PercentileRanking;
  fixationDuration?: PercentileRanking;
  regressionCount?: PercentileRanking;
  pauseCount?: PercentileRanking;
  fluencyScore?: PercentileRanking;
  chaosIndex?: PercentileRanking;
}

export function useNormativeData() {
  const [baselines, setBaselines] = useState<NormativeBaseline[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBaselines = useCallback(async (
    ageGroup?: string,
    grade?: string,
    language: string = 'en'
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('normative_baselines')
        .select('*');

      if (ageGroup) query = query.eq('age_group', ageGroup);
      if (grade) query = query.eq('grade', grade);
      query = query.eq('language', language);

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setBaselines(data || []);
      return data || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch baselines';
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const calculatePercentile = useCallback((
    value: number,
    baseline: NormativeBaseline
  ): PercentileRanking => {
    const { mean_value, std_deviation, percentile_10, percentile_25, percentile_50, percentile_75, percentile_90 } = baseline;

    // Calculate z-score
    const zScore = std_deviation > 0 ? (value - mean_value) / std_deviation : 0;
    
    // Approximate percentile from z-score
    let percentile = 50;
    if (percentile_10 && percentile_25 && percentile_50 && percentile_75 && percentile_90) {
      if (value <= percentile_10) percentile = 10;
      else if (value <= percentile_25) percentile = 25;
      else if (value <= percentile_50) percentile = 50;
      else if (value <= percentile_75) percentile = 75;
      else if (value <= percentile_90) percentile = 90;
      else percentile = 95;
    } else {
      // Use normal distribution approximation
      percentile = Math.round(50 + (zScore * 15));
      percentile = Math.max(1, Math.min(99, percentile));
    }

    // Determine comparison label and color
    let comparisonLabel: PercentileRanking['comparisonLabel'];
    let color: string;

    if (percentile <= 10) {
      comparisonLabel = 'significantly below';
      color = 'hsl(var(--destructive))';
    } else if (percentile <= 25) {
      comparisonLabel = 'below';
      color = 'hsl(var(--warning))';
    } else if (percentile <= 75) {
      comparisonLabel = 'average';
      color = 'hsl(var(--primary))';
    } else if (percentile <= 90) {
      comparisonLabel = 'above';
      color = 'hsl(var(--success))';
    } else {
      comparisonLabel = 'significantly above';
      color = 'hsl(var(--success))';
    }

    return { value, percentile, comparisonLabel, color };
  }, []);

  const compareToNorms = useCallback((
    metrics: {
      wpm?: number;
      fixationDuration?: number;
      regressionCount?: number;
      pauseCount?: number;
      fluencyScore?: number;
      chaosIndex?: number;
    },
    currentBaselines: NormativeBaseline[]
  ): NormativeComparison => {
    const result: NormativeComparison = {};

    const metricTypeMap: Record<string, keyof typeof metrics> = {
      'wpm': 'wpm',
      'fixation_duration': 'fixationDuration',
      'regression_count': 'regressionCount',
      'pause_count': 'pauseCount',
      'fluency_score': 'fluencyScore',
      'chaos_index': 'chaosIndex'
    };

    for (const baseline of currentBaselines) {
      const metricKey = metricTypeMap[baseline.metric_type];
      if (metricKey && metrics[metricKey] !== undefined) {
        const value = metrics[metricKey]!;
        
        // For some metrics, lower is better (invert the comparison)
        const invertedMetrics = ['regression_count', 'pause_count', 'chaos_index', 'fixation_duration'];
        const isInverted = invertedMetrics.includes(baseline.metric_type);
        
        let ranking = calculatePercentile(value, baseline);
        
        if (isInverted) {
          // Invert percentile for metrics where lower is better
          ranking = {
            ...ranking,
            percentile: 100 - ranking.percentile,
            comparisonLabel: ranking.comparisonLabel === 'significantly below' ? 'significantly above' :
                            ranking.comparisonLabel === 'below' ? 'above' :
                            ranking.comparisonLabel === 'above' ? 'below' :
                            ranking.comparisonLabel === 'significantly above' ? 'significantly below' :
                            'average'
          };
        }
        
        result[metricKey as keyof NormativeComparison] = ranking;
      }
    }

    return result;
  }, [calculatePercentile]);

  const contributeAnonymizedMetrics = useCallback(async (
    ageGroup: string,
    grade: string,
    language: string,
    metrics: {
      wpm?: number;
      fixationDurationAvg?: number;
      regressionCount?: number;
      pauseCount?: number;
      fluencyScore?: number;
      prosodyScore?: number;
      chaosIndex?: number;
    }
  ) => {
    try {
      const { error: insertError } = await supabase
        .from('anonymized_assessment_metrics')
        .insert({
          age_group: ageGroup,
          grade,
          language,
          wpm: metrics.wpm,
          fixation_duration_avg: metrics.fixationDurationAvg,
          regression_count: metrics.regressionCount,
          pause_count: metrics.pauseCount,
          fluency_score: metrics.fluencyScore,
          prosody_score: metrics.prosodyScore,
          chaos_index: metrics.chaosIndex
        });

      if (insertError) {
        console.error('Failed to contribute metrics:', insertError);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error contributing metrics:', err);
      return false;
    }
  }, []);

  return {
    baselines,
    isLoading,
    error,
    fetchBaselines,
    calculatePercentile,
    compareToNorms,
    contributeAnonymizedMetrics
  };
}
