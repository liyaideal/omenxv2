-- Create a function to apply a referral code atomically (validates + increments count)
CREATE OR REPLACE FUNCTION public.increment_referral_uses(_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.referral_codes
  SET uses_count = COALESCE(uses_count, 0) + 1,
      updated_at = now()
  WHERE code = upper(_code)
    AND is_active = true;
END;
$$;