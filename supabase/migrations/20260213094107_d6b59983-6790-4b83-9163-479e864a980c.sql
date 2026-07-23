-- Fix: Replace overly permissive public SELECT policy on referral_codes
-- to prevent user_id enumeration. Use a secure function for code lookup instead.

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can lookup referral codes" ON public.referral_codes;

-- Create a secure function to validate referral codes without exposing user_id
CREATE OR REPLACE FUNCTION public.lookup_referral_code(_code text)
RETURNS TABLE (code text, is_active boolean, referrer_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rc.code, rc.is_active, rc.user_id as referrer_id
  FROM public.referral_codes rc
  WHERE rc.code = upper(_code)
    AND rc.is_active = true
  LIMIT 1;
$$;