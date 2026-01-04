-- Update handle_new_user function to properly extract display name from Google OAuth and other providers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_display_name text;
BEGIN
  -- Priority order for display name:
  -- 1. Google OAuth: raw_user_meta_data->>'name' or ->>'full_name'
  -- 2. Manual signup: raw_user_meta_data->>'display_name' or ->>'full_name'
  -- 3. Fallback: email prefix
  v_display_name := nullif(trim(coalesce(
    new.raw_user_meta_data ->> 'name',           -- Google OAuth provides 'name'
    new.raw_user_meta_data ->> 'full_name',      -- Some providers use 'full_name'
    new.raw_user_meta_data ->> 'display_name',   -- Manual signup
    split_part(coalesce(new.email, ''), '@', 1)  -- Fallback to email prefix
  , '')), '');
  
  IF v_display_name IS NOT NULL THEN
    -- Enforce reasonable length limit
    v_display_name := left(v_display_name, 100);
  END IF;

  -- Upsert ensures idempotency
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (new.id, v_display_name)
  ON CONFLICT (user_id)
  DO UPDATE SET
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
    updated_at = now();

  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Never block user signup if profile insert fails
    RETURN new;
END;
$$;