-- Add user_id column to diagnostic_results for self-assessments (individual users)
ALTER TABLE public.diagnostic_results 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Make student_id nullable to allow self-assessments
ALTER TABLE public.diagnostic_results 
ALTER COLUMN student_id DROP NOT NULL;

-- Create RLS policy for users to view their own assessments
DROP POLICY IF EXISTS "Users can view own self_assessments" ON public.diagnostic_results;
CREATE POLICY "Users can view own self_assessments"
ON public.diagnostic_results FOR SELECT
USING (
  user_id = auth.uid() 
  OR clinician_id = auth.uid()
  OR student_id IN (SELECT id FROM students WHERE clinician_id = auth.uid())
);

-- Create RLS policy for users to insert their own self-assessments
DROP POLICY IF EXISTS "Users can insert own self_assessments" ON public.diagnostic_results;
CREATE POLICY "Users can insert own self_assessments"
ON public.diagnostic_results FOR INSERT
WITH CHECK (
  user_id = auth.uid() 
  OR clinician_id = auth.uid()
);

-- Drop existing SELECT policies that might conflict
DROP POLICY IF EXISTS "Users can view diagnostic results for their students" ON public.diagnostic_results;
DROP POLICY IF EXISTS "Users can create diagnostic results" ON public.diagnostic_results;

-- Enable realtime for live counter
ALTER PUBLICATION supabase_realtime ADD TABLE public.diagnostic_results;