-- Explicit UPDATE access for clinicians on their own handwriting samples
-- (RLS is already enabled; this just completes CRUD policy coverage)
CREATE POLICY "Clinicians can update their own handwriting samples"
ON public.handwriting_samples
FOR UPDATE
USING (auth.uid() = clinician_id)
WITH CHECK (auth.uid() = clinician_id);