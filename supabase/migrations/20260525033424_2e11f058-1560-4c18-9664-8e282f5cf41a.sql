
-- ============================================
-- 1) MOVE totp_secret TO SERVER-ONLY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_security (
  user_id UUID PRIMARY KEY,
  totp_secret TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_security ENABLE ROW LEVEL SECURITY;

-- Migrate existing data
INSERT INTO public.user_security (user_id, totp_secret)
SELECT user_id, totp_secret
FROM public.profiles
WHERE totp_secret IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- No client policies — only service_role (edge functions) can read/write
-- (default deny for authenticated/anon)

-- Drop the sensitive column from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS totp_secret;

CREATE TRIGGER trg_user_security_updated_at
BEFORE UPDATE ON public.user_security
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 2) LOCK DOWN transactions TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;

-- Only service_role (edge functions) can INSERT; no client-side policy.

-- ============================================
-- 3) REALTIME CHANNEL AUTHORIZATION
-- ============================================
-- Restrict realtime.messages so clients can only receive postgres_changes
-- (those are already filtered by the source table's RLS). Block all other
-- broadcast/presence topics for anon — authenticated users can use them
-- but postgres_changes RLS still applies for table streams.
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated postgres_changes only" ON realtime.messages;
CREATE POLICY "Authenticated postgres_changes only"
ON realtime.messages
FOR SELECT
TO authenticated
USING (extension = 'postgres_changes');

DROP POLICY IF EXISTS "Block anonymous realtime" ON realtime.messages;
CREATE POLICY "Block anonymous realtime"
ON realtime.messages
FOR SELECT
TO anon
USING (false);
