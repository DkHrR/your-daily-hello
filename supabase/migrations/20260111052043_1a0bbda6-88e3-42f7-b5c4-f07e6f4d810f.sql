-- Add expires_at column to parent_student_links for access code expiration
ALTER TABLE public.parent_student_links
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '7 days');

-- Update existing links to have 7-day expiration from now
UPDATE public.parent_student_links 
SET expires_at = now() + INTERVAL '7 days' 
WHERE expires_at IS NULL;

-- Make expires_at NOT NULL after setting defaults
ALTER TABLE public.parent_student_links
ALTER COLUMN expires_at SET NOT NULL;

-- Update the RLS policy to only allow claiming non-expired links
DROP POLICY IF EXISTS "Parents can claim pending links" ON public.parent_student_links;

CREATE POLICY "Parents can claim pending links" 
ON public.parent_student_links 
FOR UPDATE 
USING (
  parent_id IS NULL 
  AND access_code IS NOT NULL 
  AND expires_at > now()
)
WITH CHECK (
  parent_id IN (
    SELECT parent_accounts.id
    FROM parent_accounts
    WHERE parent_accounts.user_id = auth.uid()
  )
);

-- Add index on access_code and expires_at for efficient lookups
CREATE INDEX IF NOT EXISTS idx_parent_student_links_access_code_expires 
ON public.parent_student_links (access_code, expires_at)
WHERE parent_id IS NULL;