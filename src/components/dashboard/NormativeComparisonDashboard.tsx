import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNormativeData } from '@/hooks/useNormativeData';
import { getComprehensiveComparison, getAvailableGradeLevels, getBaselineForGrade } from '@/lib/normativeEngine';
import { BarChart3, TrendingUp, TrendingDown, Minus, Info, Users, Target, Brain } from 'lucide-react';

interface NormativeComparisonDashboardProps {
  metrics: {
    wpm?: number;
    fixationDuration?: number;
    regressionCount?: number;
    chaosIndex?: number;
    fluencyScore?: number;
    pauseCount?: number;
  };
  studentAge?: number;
  studentGrade?: string;
  studentName?: string;
}

export function NormativeComparisonDashboard({
  metrics,
  studentAge = 8,
  studentGrade,
  studentName
}: NormativeComparisonDashboardProps) {
  const [selectedGrade, setSelectedGrade] = useState(studentGrade || '2-3');
  const [comparison, setComparison] = useState<Record<string, any>>({});
  const { baselines, fetchBaselines } = useNormativeData();

  useEffect(() => {
    fetchBaselines(undefined, selectedGrade, 'en');
    const result = getComprehensiveComparison(metrics, studentAge);
    setComparison(result);
  }, [metrics, studentAge, selectedGrade, fetchBaselines]);

  const gradeLevels = getAvailableGradeLevels();
  const baselineData = getBaselineForGrade(selectedGrade);

  const getPercentileIcon = (percentile: number) => {
    if (percentile >= 75) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (percentile <= 25) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-yellow-500" />;
  };

  const getClassificationBadge = (classification: string) => {
    const variants: Record<string, string> = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      below_average: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      average: 'bg-blue-100 text-blue-800 border-blue-200',
      above_average: 'bg-green-100 text-green-800 border-green-200',
      excellent: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    };

    const labels: Record<string, string> = {
      critical: 'Needs Support',
      below_average: 'Below Average',
      average: 'Average',
      above_average: 'Above Average',
      excellent: 'Excellent',
    };

    return (
      <Badge className={`${variants[classification] || variants.average} font-medium`}>
        {labels[classification] || classification}
      </Badge>
    );
  };

  const metricLabels: Record<string, { label: string; unit: string; icon: React.ReactNode }> = {
    wpm: { label: 'Words Per Minute', unit: 'WPM', icon: <BarChart3 className="h-5 w-5" /> },
    fixationDuration: { label: 'Avg Fixation Duration', unit: 'ms', icon: <Target className="h-5 w-5" /> },
    regressionCount: { label: 'Eye Regressions', unit: 'count', icon: <Brain className="h-5 w-5" /> },
    chaosIndex: { label: 'Chaos Index', unit: '', icon: <Brain className="h-5 w-5" /> },
    fluencyScore: { label: 'Fluency Score', unit: '/100', icon: <TrendingUp className="h-5 w-5" /> },
  };

  const overallPercentile = Object.values(comparison).length > 0
    ? Math.round(Object.values(comparison).reduce((sum: number, c: any) => sum + (c.percentile || 50), 0) / Object.values(comparison).length)
    : 50;

  return (
    <TooltipProvider>
      <Card className="border-2">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Normative Comparison</CardTitle>
                <CardDescription>
                  {studentName ? `${studentName}'s performance` : 'Performance'} compared to age/grade peers
                </CardDescription>
              </div>
            </div>
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Grade" />
              </SelectTrigger>
              <SelectContent>
                {gradeLevels.map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    Grade {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Overall Percentile Summary */}
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Percentile Ranking</span>
              <span className="text-2xl font-bold text-primary">{overallPercentile}th</span>
            </div>
            <Progress value={overallPercentile} className="h-3" />
            <p className="text-xs text-muted-foreground mt-2">
              Performing better than {overallPercentile}% of peers in the same grade level
            </p>
          </div>

          {/* Individual Metrics */}
          <div className="space-y-4">
            {Object.entries(comparison).map(([key, data]: [string, any]) => {
              const metricInfo = metricLabels[key];
              if (!metricInfo) return null;

              return (
                <div key={key} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-muted rounded-md">
                        {metricInfo.icon}
                      </div>
                      <div>
                        <span className="font-medium text-sm">{metricInfo.label}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-lg font-bold">
                            {typeof data.value === 'number' 
                              ? data.value.toFixed(key === 'chaosIndex' ? 2 : 0) 
                              : data.value}
                          </span>
                          <span className="text-xs text-muted-foreground">{metricInfo.unit}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPercentileIcon(data.percentile)}
                      <div className="text-right">
                        <div className="text-sm font-semibold">{data.percentile}th percentile</div>
                        {getClassificationBadge(data.classification)}
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <Progress value={data.percentile} className="h-2" />
                    {/* Percentile markers */}
                    <div className="absolute inset-x-0 top-0 h-2 flex items-center">
                      <div className="absolute left-[25%] w-px h-3 bg-border -top-0.5" />
                      <div className="absolute left-[50%] w-px h-3 bg-border -top-0.5" />
                      <div className="absolute left-[75%] w-px h-3 bg-border -top-0.5" />
                    </div>
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>10th</span>
                    <span>25th</span>
                    <span>50th</span>
                    <span>75th</span>
                    <span>90th</span>
                  </div>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground cursor-help">
                        <Info className="h-3 w-3" />
                        <span>{data.description}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Based on clinical research data from ETDD70 standards. 
                        Grade {selectedGrade} baseline: {baselineData[key === 'fixationDuration' ? 'fixation_duration' : 
                          key === 'regressionCount' ? 'regression_count' : 
                          key === 'chaosIndex' ? 'chaos_index' : key]?.mean.toFixed(1) || 'N/A'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              );
            })}
          </div>

          {/* Baseline Reference */}
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Grade {selectedGrade} Baselines (Clinical Reference)
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {baselineData.wpm && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Target WPM:</span>
                  <span className="font-medium">{baselineData.wpm.mean} ± {baselineData.wpm.stdDev}</span>
                </div>
              )}
              {baselineData.fixation_duration && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fixation (ms):</span>
                  <span className="font-medium">{baselineData.fixation_duration.mean} ± {baselineData.fixation_duration.stdDev}</span>
                </div>
              )}
              {baselineData.regression_count && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Regressions:</span>
                  <span className="font-medium">{baselineData.regression_count.percentiles?.p75 || baselineData.regression_count.mean}</span>
                </div>
              )}
              {baselineData.chaos_index && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chaos Index:</span>
                  <span className="font-medium">{'<'}{baselineData.chaos_index.percentiles?.p75.toFixed(2) || baselineData.chaos_index.mean.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
