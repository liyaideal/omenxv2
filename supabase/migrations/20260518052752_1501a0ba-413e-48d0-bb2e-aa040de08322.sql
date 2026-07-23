-- 1. positions: add funding accrual fields
ALTER TABLE public.positions
  ADD COLUMN IF NOT EXISTS funding_accrued NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_funding_at TIMESTAMPTZ;

-- Backfill last_funding_at for existing open positions
UPDATE public.positions
SET last_funding_at = created_at
WHERE last_funding_at IS NULL AND status = 'Open';

-- 2. event_options: add funding rate
ALTER TABLE public.event_options
  ADD COLUMN IF NOT EXISTS funding_rate NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_funding_at TIMESTAMPTZ;

-- Seed initial random funding rate ∈ [-0.0002, +0.0002] per hour
UPDATE public.event_options
SET funding_rate = ROUND(((random() - 0.5) * 0.0004)::numeric, 6),
    next_funding_at = now() + interval '1 hour'
WHERE next_funding_at IS NULL;

-- 3. trades: snapshot funding paid at close
ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS funding_paid NUMERIC NOT NULL DEFAULT 0;

-- 4. position_funding_ledger
CREATE TABLE IF NOT EXISTS public.position_funding_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  position_id UUID NOT NULL,
  option_id TEXT,
  event_name TEXT NOT NULL,
  applied_rate NUMERIC NOT NULL,
  notional NUMERIC NOT NULL,
  amount NUMERIC NOT NULL,
  accrual_start TIMESTAMPTZ NOT NULL,
  accrual_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pfl_user_position ON public.position_funding_ledger(user_id, position_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pfl_position ON public.position_funding_ledger(position_id, created_at DESC);

ALTER TABLE public.position_funding_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own funding ledger"
ON public.position_funding_ledger
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policies → only service-role (edge function) can write