import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  grade_level: string | null;
  date_of_birth: string | null;
  created_at: string;
  updated_at: string;
}

interface AssessmentResult {
  id: string;
  assessment_id: string;
  overall_risk_score: number | null;
  reading_fluency_score: number | null;
  phonological_awareness_score: number | null;
  visual_processing_score: number | null;
  attention_score: number | null;
  created_at: string;
}

interface DashboardStats {
  totalStudents: number;
  totalAssessments: number;
  highRiskCount: number;
  moderateRiskCount: number;
  lowRiskCount: number;
}

export function useDashboardData() {
  const { user } = useAuth();

  const studentsQuery = useQuery({
    queryKey: ['students', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as Student[];
    },
    enabled: !!user,
  });

  const resultsQuery = useQuery({
    queryKey: ['assessment_results', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assessment_results')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AssessmentResult[];
    },
    enabled: !!user,
  });

  // Calculate risk levels from assessment scores
  const getRiskLevel = (score: number | null): 'low' | 'medium' | 'high' => {
    if (!score) return 'low';
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  };

  // Map results to students with their latest risk score
  const studentsWithRisk = studentsQuery.data?.map(student => {
    const latestResult = resultsQuery.data?.find(r => {
      // We need to join through assessments - for now use overall_risk_score
      return true; // Will be refined when we have proper student-assessment linkage
    });
    return {
      ...student,
      risk_level: getRiskLevel(latestResult?.overall_risk_score),
    };
  }) ?? [];

  const stats: DashboardStats = {
    totalStudents: studentsQuery.data?.length ?? 0,
    totalAssessments: resultsQuery.data?.length ?? 0,
    highRiskCount: studentsWithRisk.filter(s => s.risk_level === 'high').length,
    moderateRiskCount: studentsWithRisk.filter(s => s.risk_level === 'medium').length,
    lowRiskCount: studentsWithRisk.filter(s => s.risk_level === 'low').length,
  };

  // Calculate risk distribution for charts
  const riskDistribution = [
    { name: 'Low Risk', value: stats.lowRiskCount || 0, color: 'hsl(var(--success))' },
    { name: 'Moderate Risk', value: stats.moderateRiskCount || 0, color: 'hsl(var(--warning))' },
    { name: 'High Risk', value: stats.highRiskCount || 0, color: 'hsl(var(--destructive))' },
  ];

  // Get students with their latest session score
  const studentsWithScores = studentsQuery.data?.map(student => {
    const latestResult = resultsQuery.data?.[0]; // Get most recent result
    const score = latestResult?.overall_risk_score ?? 0;
    const riskLevel = getRiskLevel(latestResult?.overall_risk_score);
    
    return {
      id: student.id,
      name: `${student.first_name} ${student.last_name}`,
      grade: student.grade_level || 'N/A',
      risk: riskLevel,
      score,
      lastAssessed: latestResult?.created_at 
        ? new Date(latestResult.created_at).toLocaleDateString()
        : 'Never',
    };
  }) ?? [];

  return {
    students: studentsWithScores,
    sessions: resultsQuery.data ?? [],
    stats,
    riskDistribution,
    isLoading: studentsQuery.isLoading || resultsQuery.isLoading,
    error: studentsQuery.error || resultsQuery.error,
    refetch: () => {
      studentsQuery.refetch();
      resultsQuery.refetch();
    },
  };
}
