import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Student {
  id: string;
  name: string;
  grade: string;
  age: number;
  risk_level: string | null;
  created_at: string;
  updated_at: string;
}

interface DiagnosticResult {
  id: string;
  student_id: string;
  session_id: string;
  overall_risk_level: string | null;
  dyslexia_probability_index: number | null;
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
    queryKey: ['diagnostic_results', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('diagnostic_results')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DiagnosticResult[];
    },
    enabled: !!user,
  });

  // Calculate risk levels from the risk_level field on students table
  const getRiskLevel = (riskLevel: string | null): 'low' | 'medium' | 'high' => {
    if (!riskLevel) return 'low';
    const level = riskLevel.toLowerCase();
    if (level === 'high') return 'high';
    if (level === 'medium' || level === 'moderate') return 'medium';
    return 'low';
  };

  // Map students with their risk levels
  const studentsWithScores = studentsQuery.data?.map(student => {
    // Find latest diagnostic result for this student
    const latestResult = resultsQuery.data?.find(r => r.student_id === student.id);
    const riskLevel = getRiskLevel(latestResult?.overall_risk_level ?? student.risk_level);
    
    return {
      id: student.id,
      name: student.name,
      grade: student.grade,
      risk: riskLevel,
      score: latestResult?.dyslexia_probability_index ? latestResult.dyslexia_probability_index * 100 : 0,
      lastAssessed: latestResult?.created_at 
        ? new Date(latestResult.created_at).toLocaleDateString()
        : 'Never',
    };
  }) ?? [];

  const stats: DashboardStats = {
    totalStudents: studentsQuery.data?.length ?? 0,
    totalAssessments: resultsQuery.data?.length ?? 0,
    highRiskCount: studentsWithScores.filter(s => s.risk === 'high').length,
    moderateRiskCount: studentsWithScores.filter(s => s.risk === 'medium').length,
    lowRiskCount: studentsWithScores.filter(s => s.risk === 'low').length,
  };

  // Calculate risk distribution for charts
  const riskDistribution = [
    { name: 'Low Risk', value: stats.lowRiskCount || 0, color: 'hsl(var(--success))' },
    { name: 'Moderate Risk', value: stats.moderateRiskCount || 0, color: 'hsl(var(--warning))' },
    { name: 'High Risk', value: stats.highRiskCount || 0, color: 'hsl(var(--destructive))' },
  ];

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
