import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface DiagnosticResult {
  id: string;
  student_id: string;
  clinician_id: string;
  session_id: string;
  overall_risk_level: string | null;
  dyslexia_probability_index: number | null;
  adhd_probability_index: number | null;
  dysgraphia_probability_index: number | null;
  eye_total_fixations: number | null;
  eye_avg_fixation_duration: number | null;
  eye_regression_count: number | null;
  voice_words_per_minute: number | null;
  voice_fluency_score: number | null;
  created_at: string;
}

export interface Student {
  id: string;
  name: string;
  age: number;
  grade: string;
  risk_level: string | null;
  notes: string | null;
  clinician_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDiagnosticInput {
  student_id: string;
  session_id: string;
  overall_risk_level?: string;
  dyslexia_probability_index?: number;
  adhd_probability_index?: number;
  dysgraphia_probability_index?: number;
  eye_total_fixations?: number;
  eye_avg_fixation_duration?: number;
  eye_regression_count?: number;
  voice_words_per_minute?: number;
  voice_fluency_score?: number;
}

export function useAssessments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const diagnosticsQuery = useQuery({
    queryKey: ['diagnostic_results'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('diagnostic_results')
        .select(`
          *,
          students (name, grade, age)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (DiagnosticResult & { students: { name: string; grade: string; age: number } | null })[];
    },
    enabled: !!user,
  });

  const studentsQuery = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Student[];
    },
    enabled: !!user,
  });

  const createDiagnostic = useMutation({
    mutationFn: async (input: CreateDiagnosticInput) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('diagnostic_results')
        .insert({
          ...input,
          clinician_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as DiagnosticResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnostic_results'] });
      toast.success('Diagnostic result saved');
    },
    onError: (error) => {
      toast.error('Failed to save diagnostic: ' + error.message);
    },
  });

  const createStudent = useMutation({
    mutationFn: async (input: { name: string; age: number; grade: string; notes?: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('students')
        .insert({
          ...input,
          clinician_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Student;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student added');
    },
    onError: (error) => {
      toast.error('Failed to add student: ' + error.message);
    },
  });

  return {
    diagnostics: diagnosticsQuery.data ?? [],
    students: studentsQuery.data ?? [],
    isLoading: diagnosticsQuery.isLoading || studentsQuery.isLoading,
    isError: diagnosticsQuery.isError || studentsQuery.isError,
    error: diagnosticsQuery.error || studentsQuery.error,
    createDiagnostic,
    createStudent,
  };
}

export function useDiagnosticResults(studentId?: string) {
  return useQuery({
    queryKey: ['diagnostic_results', studentId],
    queryFn: async () => {
      if (!studentId) return null;
      
      const { data, error } = await supabase
        .from('diagnostic_results')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DiagnosticResult[];
    },
    enabled: !!studentId,
  });
}
