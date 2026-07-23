-- Voucher earnings pool (per user) + ledger
CREATE TABLE public.voucher_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  pending_amount numeric NOT NULL DEFAULT 0,
  lifetime_credited numeric NOT NULL DEFAULT 0,
  last_settled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.voucher_earnings TO authenticated;
GRANT ALL ON public.voucher_earnings TO service_role;

ALTER TABLE public.voucher_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own voucher earnings"
ON public.voucher_earnings FOR SELECT
USING (auth.uid() = user_id);

CREATE TRIGGER update_voucher_earnings_updated_at
BEFORE UPDATE ON public.voucher_earnings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.voucher_earnings_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('accrual','claim')),
  amount numeric NOT NULL,
  airdrop_position_id uuid,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_voucher_earnings_ledger_user ON public.voucher_earnings_ledger(user_id, created_at DESC);

GRANT SELECT ON public.voucher_earnings_ledger TO authenticated;
GRANT ALL ON public.voucher_earnings_ledger TO service_role;

ALTER TABLE public.voucher_earnings_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own voucher ledger"
ON public.voucher_earnings_ledger FOR SELECT
USING (auth.uid() = user_id);