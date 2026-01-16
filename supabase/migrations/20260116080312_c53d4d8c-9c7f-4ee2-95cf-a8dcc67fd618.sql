-- 1) Create verification_audit_log table for clinical compliance
CREATE TABLE IF NOT EXISTS public.verification_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('email_sent', 'email_verified', 'email_resend', 'token_expired')),
  verified_by UUID NULL, -- for admin/clinician verifications
  ip_address TEXT NULL,
  user_agent TEXT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for audit log queries
CREATE INDEX IF NOT EXISTS verification_audit_log_user_id_idx 
ON public.verification_audit_log (user_id);

CREATE INDEX IF NOT EXISTS verification_audit_log_created_at_idx 
ON public.verification_audit_log (created_at DESC);

CREATE INDEX IF NOT EXISTS verification_audit_log_action_idx 
ON public.verification_audit_log (action);

ALTER TABLE public.verification_audit_log ENABLE ROW LEVEL SECURITY;

-- Only service role can insert (from edge functions), users can view their own logs
CREATE POLICY "Users can view their own audit logs"
ON public.verification_audit_log
FOR SELECT
USING (auth.uid() = user_id);

-- 2) Add eye_tracking_settings column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS eye_tracking_settings JSONB DEFAULT '{"preferred_provider": "auto", "tobii_enabled": false, "calibration_points": 9}'::jsonb;