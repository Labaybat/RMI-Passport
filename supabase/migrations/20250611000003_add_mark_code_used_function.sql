-- Migration: 20250611000003_add_mark_code_used_function.sql
-- Description: Adds a helper function to mark verification codes as used

-- Create a function to mark a verification code as used
-- This is a SECURITY DEFINER function, meaning it runs with the privileges of the DB user who created it
-- This bypasses RLS policies, allowing anonymous users to mark codes as used safely
CREATE OR REPLACE FUNCTION public.mark_code_as_used(
  p_email TEXT,
  p_code TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Important: runs with creator's permissions
SET search_path = public -- Security: prevent search path injection
AS $$
DECLARE
  v_success BOOLEAN := FALSE;
  v_code_id INT;
BEGIN
  -- First check if the code exists and is valid
  SELECT id INTO v_code_id
  FROM public.recovery_codes
  WHERE email = p_email
  AND code = p_code
  AND used = FALSE
  AND expires_at > NOW();
  
  -- If code found, mark it as used
  IF v_code_id IS NOT NULL THEN
    UPDATE public.recovery_codes
    SET used = TRUE
    WHERE id = v_code_id;
    
    v_success := TRUE;
  END IF;
  
  RETURN v_success;
END;
$$;

-- Grant execution permission to anonymous (public) users
GRANT EXECUTE ON FUNCTION public.mark_code_as_used(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.mark_code_as_used(TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION public.mark_code_as_used IS 'Securely mark a verification code as used, bypassing RLS policies';
