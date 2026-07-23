-- 1) Loosen airdrop_positions for voucher rows + add redeemable_cap
ALTER TABLE public.airdrop_positions
  ALTER COLUMN connected_account_id DROP NOT NULL;

ALTER TABLE public.airdrop_positions
  ADD COLUMN IF NOT EXISTS redeemable_cap numeric NULL;

-- Drop & recreate source check to include 'voucher'
ALTER TABLE public.airdrop_positions
  DROP CONSTRAINT IF EXISTS airdrop_positions_source_check;
ALTER TABLE public.airdrop_positions
  ADD CONSTRAINT airdrop_positions_source_check
  CHECK (source = ANY (ARRAY['matched'::text, 'welcome_gift'::text, 'voucher'::text]));

-- 2) Create position_vouchers
CREATE TABLE public.position_vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code text NOT NULL UNIQUE,
  face_value numeric NOT NULL CHECK (face_value > 0),
  redeemable_cap_pct numeric NOT NULL DEFAULT 0.5 CHECK (redeemable_cap_pct > 0 AND redeemable_cap_pct <= 1),
  max_holding_hours integer NOT NULL DEFAULT 72 CHECK (max_holding_hours > 0),
  entry_price_min numeric NOT NULL DEFAULT 0.20 CHECK (entry_price_min >= 0 AND entry_price_min < 1),
  entry_price_max numeric NOT NULL DEFAULT 0.80 CHECK (entry_price_max > 0 AND entry_price_max <= 1),
  min_hours_to_settlement integer NOT NULL DEFAULT 12 CHECK (min_hours_to_settlement >= 0),
  status text NOT NULL DEFAULT 'issued' CHECK (status = ANY (ARRAY['issued','redeemed','expired','revoked'])),
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  redeemed_at timestamptz NULL,
  redeemed_airdrop_position_id uuid NULL REFERENCES public.airdrop_positions(id) ON DELETE SET NULL,
  redeemed_event_id text NULL,
  redeemed_option_id text NULL,
  redeemed_side text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_position_vouchers_user_status ON public.position_vouchers(user_id, status);

GRANT SELECT ON public.position_vouchers TO authenticated;
GRANT ALL ON public.position_vouchers TO service_role;

ALTER TABLE public.position_vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own vouchers"
  ON public.position_vouchers
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Only admins can insert vouchers"
  ON public.position_vouchers
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update vouchers"
  ON public.position_vouchers
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_position_vouchers_updated_at
  BEFORE UPDATE ON public.position_vouchers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();