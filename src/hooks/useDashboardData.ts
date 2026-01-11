import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

interface StudentWithRisk {
  id: string;
  name: string;
  grade: string;
  risk: 'low' | 'medium' | 'high';
  score: number;
  lastAssessed: string;
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
  const { isIndividual } = useUserRole();

  // Query for students (only for clinicians/educators)
  const studentsQuery = useQuery({
    queryKey: ['students', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user && !isIndividual,
  });

  // Query for all diagnostic results (for clinicians - student assessments)
  const diagnosticResultsQuery = useQuery({
    queryKey: ['diagnostic_results_dashboard', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('diagnostic_results')
        .select('*')
        .not('student_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user && !isIndividual,
  });

  // Query for self-assessments (for individual users)
  const selfAssessmentsQuery = useQuery({
    queryKey: ['self_assessments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('diagnostic_results')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Calculate risk levels from assessment results
  const getRiskLevel = (riskScore: number | null): 'low' | 'medium' | 'high' => {
    if (riskScore === null) return 'low';
    if (riskScore >= 0.6) return 'high';
    if (riskScore >= 0.3) return 'medium';
    return 'low';
  };

  // Map students with their risk levels from latest assessment
  const studentsWithScores: StudentWithRisk[] = studentsQuery.data?.map(student => {
    // Find latest diagnostic result for this student
    const studentResults = diagnosticResultsQuery.data?.filter(r => r.student_id === student.id) ?? [];
    const latestResult = studentResults[0];
    
    const riskLevel = latestResult?.overall_risk_level as 'low' | 'medium' | 'high' || 'low';
    const riskScore = latestResult?.dyslexia_probability_index ?? 0;
    
    return {
      id: student.id,
      name: student.name,
      grade: student.grade ?? 'N/A',
      risk: riskLevel,
      score: riskScore * 100,
      lastAssessed: latestResult?.created_at 
        ? new Date(latestResult.created_at).toLocaleDateString()
        : 'Never',
    };
  }) ?? [];

  const stats: DashboardStats = {
    totalStudents: studentsQuery.data?.length ?? 0,
    totalAssessments: diagnosticResultsQuery.data?.length ?? 0,
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
    stats,
    riskDistribution,
    selfAssessments: selfAssessmentsQuery.data ?? [],
    isLoading: studentsQuery.isLoading || diagnosticResultsQuery.isLoading || selfAssessmentsQuery.isLoading,
    error: studentsQuery.error || diagnosticResultsQuery.error || selfAssessmentsQuery.error,
    refetch: () => {
      studentsQuery.refetch();
      diagnosticResultsQuery.refetch();
      selfAssessmentsQuery.refetch();
    },
  };
}
