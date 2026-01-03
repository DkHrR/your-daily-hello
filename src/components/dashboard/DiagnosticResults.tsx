import { motion } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar
} from 'recharts';
import type { DiagnosticResult } from '@/types/diagnostic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface DiagnosticResultsProps {
  result: DiagnosticResult;
}

export function DiagnosticResults({ result }: DiagnosticResultsProps) {
  const riskColor = {
    low: 'success',
    moderate: 'warning',
    high: 'destructive',
  }[result.overallRiskLevel] as 'success' | 'warning' | 'destructive';

  const RiskIcon = {
    low: CheckCircle,
    moderate: Info,
    high: AlertTriangle,
  }[result.overallRiskLevel];

  // Prepare radar chart data
  const radarData = [
    { metric: 'Eye Tracking', value: Math.min(100, (1 - result.eyeTracking.chaosIndex) * 100) },
    { metric: 'Fluency', value: result.voice.fluencyScore },
    { metric: 'Prosody', value: result.voice.prosodyScore },
    { metric: 'Handwriting', value: Math.max(0, 100 - result.handwriting.reversalCount * 10) },
    { metric: 'Cognitive Load', value: Math.max(0, 100 - result.cognitiveLoad.overloadEvents * 10) },
  ];

  // Fixation duration histogram
  const fixationData = [
    { range: '0-200ms', count: result.eyeTracking.totalFixations - result.eyeTracking.prolongedFixations },
    { range: '200-400ms', count: Math.floor(result.eyeTracking.prolongedFixations * 0.4) },
    { range: '400-600ms', count: Math.floor(result.eyeTracking.prolongedFixations * 0.4) },
    { range: '600ms+', count: Math.floor(result.eyeTracking.prolongedFixations * 0.2) },
  ];

  return (
    <div className="space-y-6">
      {/* Overall Risk Assessment */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl bg-gradient-neuro text-primary-foreground"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Diagnostic Assessment</h2>
            <p className="text-primary-foreground/80 mb-4">
              Session ID: {result.sessionId}
            </p>
          </div>
          <Badge 
            className={`text-lg px-4 py-2 ${
              result.overallRiskLevel === 'low' 
                ? 'bg-success/20 text-success-foreground' 
                : result.overallRiskLevel === 'moderate'
                  ? 'bg-warning/20 text-warning-foreground'
                  : 'bg-destructive/20 text-destructive-foreground'
            }`}
          >
            <RiskIcon className="w-5 h-5 mr-2" />
            {result.overallRiskLevel.charAt(0).toUpperCase() + result.overallRiskLevel.slice(1)} Risk
          </Badge>
        </div>

        {/* Probability Indices */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          {[
            { label: 'Dyslexia Index', value: result.dyslexiaProbabilityIndex },
            { label: 'ADHD Index', value: result.adhdProbabilityIndex },
            { label: 'Dysgraphia Index', value: result.dysgraphiaProbabilityIndex },
          ].map((index) => (
            <div key={index.label} className="p-4 rounded-xl bg-primary-foreground/10">
              <div className="text-sm text-primary-foreground/70 mb-1">{index.label}</div>
              <div className="text-3xl font-bold">{Math.round(index.value * 100)}%</div>
              <div className="mt-2 h-2 rounded-full bg-primary-foreground/20">
                <div 
                  className="h-full rounded-full bg-primary-foreground transition-all duration-500"
                  style={{ width: `${index.value * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis 
                  dataKey="metric" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fixation Duration Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Fixation Duration Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={fixationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="range" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Eye Tracking Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              Eye Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <MetricRow label="Total Fixations" value={result.eyeTracking.totalFixations} />
            <MetricRow label="Avg Duration" value={`${Math.round(result.eyeTracking.averageFixationDuration)}ms`} />
            <MetricRow label="Regressions" value={result.eyeTracking.regressionCount} />
            <MetricRow label="Prolonged (>400ms)" value={result.eyeTracking.prolongedFixations} />
            <MetricRow label="Chaos Index" value={result.eyeTracking.chaosIndex.toFixed(2)} />
            <MetricRow label="FIC Score" value={result.eyeTracking.fixationIntersectionCoefficient.toFixed(2)} />
          </CardContent>
        </Card>

        {/* Voice Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-secondary" />
              Voice Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <MetricRow label="Words/Minute" value={result.voice.wordsPerMinute} />
            <MetricRow label="Pause Count" value={result.voice.pauseCount} />
            <MetricRow label="Avg Pause" value={`${result.voice.averagePauseDuration}ms`} />
            <MetricRow label="Phonemic Errors" value={result.voice.phonemicErrors} />
            <MetricRow label="Fluency Score" value={`${result.voice.fluencyScore}%`} />
            <MetricRow label="Prosody Score" value={`${result.voice.prosodyScore}%`} />
          </CardContent>
        </Card>

        {/* Handwriting & Cognitive */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent" />
              Handwriting & Load
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <MetricRow label="Reversals (b↔d)" value={result.handwriting.reversalCount} />
            <MetricRow label="Letter Crowding" value={`${Math.round(result.handwriting.letterCrowding * 100)}%`} />
            <MetricRow label="Inconsistency" value={`${Math.round(result.handwriting.graphicInconsistency * 100)}%`} />
            <div className="border-t border-border pt-4 mt-4">
              <MetricRow label="Pupil Dilation" value={`${result.cognitiveLoad.averagePupilDilation.toFixed(1)}mm`} />
              <MetricRow label="Overload Events" value={result.cognitiveLoad.overloadEvents} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
