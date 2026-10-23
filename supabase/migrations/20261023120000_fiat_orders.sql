-- Fiat on-ramp orders (MoonPay Card tab, 2026-10-23).
-- One row per checkout started from /deposit › Card. The ledger row lives in
-- public.transactions (type = 'fiat_buy'); `transaction_id` links the two.
-- Status machine (webhook-driven on the live platform, timer-driven in the
-- Lovable demo engine): waiting_payment → pending → sending → completed | failed.

CREATE TABLE IF NOT EXISTS public.fiat_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL DEFAULT 'moonpay',
  provider_tx_id TEXT,
  status TEXT NOT NULL DEFAULT 'waiting_payment'
    CHECK (status IN ('waiting_payment', 'pending', 'sending', 'completed', 'failed')),
  fiat_code TEXT NOT NULL,
  fiat_amount NUMERIC NOT NULL,
  quote_amount NUMERIC NOT NULL,
  total_fee NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'credit_debit_card',
  card_brand TEXT,
  card_last4 TEXT,
  failure_reason TEXT,
  account TEXT NOT NULL DEFAULT 'futures' CHECK (account IN ('spot', 'futures')),
  wallet_address TEXT,
  transaction_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS fiat_orders_user_created_idx ON public.fiat_orders (user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS fiat_orders_provider_tx_idx ON public.fiat_orders (provider, provider_tx_id) WHERE provider_tx_id IS NOT NULL;

ALTER TABLE public.fiat_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own fiat orders"
  ON public.fiat_orders FOR SELECT USING (auth.uid() = user_id);

-- Lovable demo engine writes from the browser; the live platform inserts /
-- updates only from the service role inside moonpay-sign-url & moonpay-webhook.
CREATE POLICY "Users can insert their own fiat orders"
  ON public.fiat_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own fiat orders"
  ON public.fiat_orders FOR UPDATE USING (auth.uid() = user_id);

-- Lovable demo engine only: the browser flips the linked fiat_buy ledger row
-- pending → processing → completed/failed. The live platform drops this policy
-- (the webhook updates ledger rows with the service role).
DROP POLICY IF EXISTS "Users can update their own fiat_buy transactions" ON public.transactions;
CREATE POLICY "Users can update their own fiat_buy transactions"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = user_id AND type = 'fiat_buy')
  WITH CHECK (auth.uid() = user_id AND type = 'fiat_buy');

CREATE OR REPLACE FUNCTION public.touch_fiat_orders_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS fiat_orders_touch ON public.fiat_orders;
CREATE TRIGGER fiat_orders_touch BEFORE UPDATE ON public.fiat_orders
  FOR EACH ROW EXECUTE FUNCTION public.touch_fiat_orders_updated_at();
