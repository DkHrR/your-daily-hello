-- Fix the overly permissive RLS policy on assessment_results
-- Remove the 'OR true' that exposes all data

DROP POLICY IF EXISTS "Users can view results for their assessments" ON assessment_results;

-- Create proper policy that only allows owners to view their assessment results
CREATE POLICY "Users can view results for their assessments"
ON assessment_results FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM assessments
    WHERE assessments.id = assessment_results.assessment_id
    AND (assessments.assessor_id = auth.uid() OR assessments.user_id = auth.uid())
  )
);

-- Create a database function to get assessment count (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_assessment_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM assessment_results;
$$;