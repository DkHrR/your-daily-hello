import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type AssessmentType = 'reading' | 'phonological' | 'visual' | 'comprehensive';
export type AssessmentStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Assessment {
  id: string;
  student_id: string;
  assessor_id: string;
  assessment_type: AssessmentType;
  status: AssessmentStatus;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface AssessmentResult {
  id: string;
  assessment_id: string;
  overall_risk_score: number | null;
  reading_fluency_score: number | null;
  phonological_awareness_score: number | null;
  visual_processing_score: number | null;
  attention_score: number | null;
  recommendations: string[];
  raw_data: Record<string, unknown>;
  created_at: string;
}

export interface AssessmentWithResults extends Assessment {
  results?: AssessmentResult;
  student?: {
    first_name: string;
    last_name: string;
  };
}

export interface CreateAssessmentInput {
  student_id: string;
  assessment_type: AssessmentType;
}

export interface SaveResultsInput {
  assessment_id: string;
  overall_risk_score?: number;
  reading_fluency_score?: number;
  phonological_awareness_score?: number;
  visual_processing_score?: number;
  attention_score?: number;
  recommendations?: string[];
  raw_data?: Record<string, unknown>;
}

export function useAssessments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const assessmentsQuery = useQuery({
    queryKey: ['assessments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assessments')
        .select(`
          *,
          students (first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (Assessment & { students: { first_name: string; last_name: string } | null })[];
    },
    enabled: !!user,
  });

  const createAssessment = useMutation({
    mutationFn: async (input: CreateAssessmentInput) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('assessments')
        .insert({
          student_id: input.student_id,
          assessor_id: user.id,
          assessment_type: input.assessment_type,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data as Assessment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      toast.success('Assessment created');
    },
    onError: (error) => {
      toast.error('Failed to create assessment: ' + error.message);
    },
  });

  const startAssessment = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('assessments')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Assessment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
    },
  });

  const completeAssessment = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('assessments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Assessment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      toast.success('Assessment completed');
    },
  });

  const saveResults = useMutation({
    mutationFn: async (input: SaveResultsInput) => {
      const { data, error } = await supabase
        .from('assessment_results')
        .insert([{
          assessment_id: input.assessment_id,
          overall_risk_score: input.overall_risk_score,
          reading_fluency_score: input.reading_fluency_score,
          phonological_awareness_score: input.phonological_awareness_score,
          visual_processing_score: input.visual_processing_score,
          attention_score: input.attention_score,
          recommendations: JSON.parse(JSON.stringify(input.recommendations ?? [])),
          raw_data: JSON.parse(JSON.stringify(input.raw_data ?? {})),
        }])
        .select()
        .single();

      if (error) throw error;
      return data as AssessmentResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      queryClient.invalidateQueries({ queryKey: ['assessment-results'] });
    },
  });

  return {
    assessments: assessmentsQuery.data ?? [],
    isLoading: assessmentsQuery.isLoading,
    isError: assessmentsQuery.isError,
    error: assessmentsQuery.error,
    createAssessment,
    startAssessment,
    completeAssessment,
    saveResults,
  };
}

export function useAssessmentResults(assessmentId?: string) {
  return useQuery({
    queryKey: ['assessment-results', assessmentId],
    queryFn: async () => {
      if (!assessmentId) return null;
      
      const { data, error } = await supabase
        .from('assessment_results')
        .select('*')
        .eq('assessment_id', assessmentId)
        .maybeSingle();

      if (error) throw error;
      return data as AssessmentResult | null;
    },
    enabled: !!assessmentId,
  });
}
