-- Fix Security Issues: Strengthen RLS policies to block unauthenticated access
-- and prevent client-side manipulation of sensitive data

-- ===============================================
-- 1. PROFILES TABLE: Block unauthenticated access
-- ===============================================
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create stronger policies that explicitly require authentication
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- ===============================================
-- 2. WALLETS TABLE: Block unauthenticated access
-- ===============================================
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own wallets" ON public.wallets;
DROP POLICY IF EXISTS "Users can insert their own wallets" ON public.wallets;
DROP POLICY IF EXISTS "Users can update their own wallets" ON public.wallets;
DROP POLICY IF EXISTS "Users can delete their own wallets" ON public.wallets;

-- Create stronger policies that explicitly require authentication
CREATE POLICY "Users can view their own wallets"
ON public.wallets
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallets"
ON public.wallets
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can update their own wallets"
ON public.wallets
FOR UPDATE
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can delete their own wallets"
ON public.wallets
FOR DELETE
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- ===============================================
-- 3. POINTS_LEDGER TABLE: Block client-side inserts
-- Only server-side functions should insert ledger entries
-- ===============================================
-- Drop existing permissive insert policy
DROP POLICY IF EXISTS "System can insert points ledger entries" ON public.points_ledger;

-- Create restrictive policy: Only admins can insert via RPC/server functions
-- Regular users cannot insert directly - prevents points manipulation
CREATE POLICY "Only admins can insert points ledger entries"
ON public.points_ledger
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Ensure SELECT policy also requires authentication
DROP POLICY IF EXISTS "Users can view their own points history" ON public.points_ledger;

CREATE POLICY "Users can view their own points history"
ON public.points_ledger
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);