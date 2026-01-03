-- Harden handle_new_user trigger function with defensive validation and safer upsert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_display_name text;
BEGIN
  -- Defensive validation/sanitization of metadata-derived fields
  v_display_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '');
  IF v_display_name IS NOT NULL THEN
    -- Enforce reasonable length limit to prevent oversized payloads
    v_display_name := left(v_display_name, 100);
  END IF;

  -- Upsert ensures idempotency if the trigger fires multiple times
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (new.id, v_display_name)
  ON CONFLICT (user_id)
  DO UPDATE SET
    display_name = EXCLUDED.display_name,
    updated_at = now();

  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Never block user signup/creation if profile insert fails
    RETURN new;
END;
$function$;