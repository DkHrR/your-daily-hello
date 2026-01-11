-- Add user_id column for self-assessments
ALTER TABLE assessments ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Make student_id nullable for self-assessments
ALTER TABLE assessments ALTER COLUMN student_id DROP NOT NULL;

-- Drop existing policies that will be replaced
DROP POLICY IF EXISTS "Users can view their own assessments" ON assessments;
DROP POLICY IF EXISTS "Users can create assessments" ON assessments;

-- Create updated RLS policies for self-assessments
CREATE POLICY "Users can view own assessments"
ON assessments FOR SELECT
USING (auth.uid() = assessor_id OR auth.uid() = user_id);

CREATE POLICY "Users can create assessments"
ON assessments FOR INSERT
WITH CHECK (auth.uid() = assessor_id);

-- Drop existing SELECT policy on assessment_results to avoid conflict
DROP POLICY IF EXISTS "Users can view results for their assessments" ON assessment_results;

-- Create policy that allows both owner access AND public counting
CREATE POLICY "Users can view results for their assessments"
ON assessment_results FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM assessments
    WHERE assessments.id = assessment_results.assessment_id
    AND (assessments.assessor_id = auth.uid() OR assessments.user_id = auth.uid())
  )
  OR true  -- Allow public read for live counter
);