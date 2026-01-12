import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { z } from 'zod';
import type { Tables } from '@/integrations/supabase/types';

// Use the actual diagnostic_results table type
type DiagnosticResultRow = Tables<'diagnostic_results'>;

// Zod schemas for assessment input validation
const scoreSchema = z.number().min(0).max(1).optional();

const diagnosticResultSchema = z.object({
  dyslexia_probability_index: scoreSchema,
  adhd_probability_index: scoreSchema,
  dysgraphia_probability_index: scoreSchema,
  overall_risk_level: z.enum(['low', 'moderate', 'high']).optional(),
});

export interface DiagnosticResultWithStudent extends DiagnosticResultRow {
  students: {
    name: string;
    grade: string;
    age: number;
  } | null;
}

export function useAssessments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all diagnostic results with student info
  const assessmentsQuery = useQuery({
    queryKey: ['diagnostic_results', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('diagnostic_results')
        .select(`
          *,
          students (name, grade, age)
        `)
        .eq('clinician_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as DiagnosticResultWithStudent[];
    },
    enabled: !!user,
  });

  // Create new diagnostic result
  const createDiagnosticResult = useMutation({
    mutationFn: async (input: {
      student_id?: string;
      session_id: string;
      results?: {
        dyslexia_probability_index?: number;
        adhd_probability_index?: number;
        dysgraphia_probability_index?: number;
        overall_risk_level?: 'low' | 'moderate' | 'high';
      };
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Validate session ID
      z.string().min(1, 'Session ID required').parse(input.session_id);
      
      const validatedResults = input.results 
        ? diagnosticResultSchema.parse(input.results)
        : {};

      const { data, error } = await supabase
        .from('diagnostic_results')
        .insert({
          clinician_id: user.id,
          user_id: input.student_id ? null : user.id, // self-assessment if no student
          student_id: input.student_id || null,
          session_id: input.session_id,
          ...validatedResults,
        })
        .select()
        .single();

      if (error) throw error;
      return data as DiagnosticResultRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnostic_results'] });
    },
    onError: (error) => {
      if (error instanceof z.ZodError) {
        toast.error('Validation error: ' + error.errors.map(e => e.message).join(', '));
      } else {
        toast.error('Failed to create assessment: ' + error.message);
      }
    },
  });

  return {
    assessments: assessmentsQuery.data ?? [],
    isLoading: assessmentsQuery.isLoading,
    isError: assessmentsQuery.isError,
    error: assessmentsQuery.error,
    createDiagnosticResult,
    refetch: assessmentsQuery.refetch
  };
}

export function useAssessmentResults(studentId?: string) {
  return useQuery({
    queryKey: ['diagnostic_results', 'student', studentId],
    queryFn: async () => {
      if (!studentId) return null;
      
      const { data, error } = await supabase
        .from('diagnostic_results')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as DiagnosticResultRow[];
    },
    enabled: !!studentId,
  });
}
