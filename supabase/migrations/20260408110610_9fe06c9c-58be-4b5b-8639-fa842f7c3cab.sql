
-- =============================================
-- 1. connected_accounts — External platform wallets linked via EIP-712
-- =============================================
CREATE TABLE public.connected_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  platform text NOT NULL DEFAULT 'polymarket',
  wallet_address text NOT NULL,
  display_address text NOT NULL,
  signature text NOT NULL,
  signed_message jsonb NOT NULL,
  status text NOT NULL DEFAULT 'active',
  verified_at timestamptz,
  disconnected_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform, wallet_address)
);

ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own connected accounts"
  ON public.connected_accounts FOR SELECT
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own connected accounts"
  ON public.connected_accounts FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connected accounts"
  ON public.connected_accounts FOR UPDATE
  TO public
  USING (auth.uid() = user_id);

-- =============================================
-- 2. event_mappings — Maps external platform events to OmenX events
-- =============================================
CREATE TABLE public.event_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_platform text NOT NULL DEFAULT 'polymarket',
  external_event_id text NOT NULL,
  external_event_name text NOT NULL,
  omenx_event_id text,
  omenx_event_name text,
  mapping_status text NOT NULL DEFAULT 'pending',
  category text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(external_platform, external_event_id)
);

ALTER TABLE public.event_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event mappings are publicly readable"
  ON public.event_mappings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only admins can manage event mappings"
  ON public.event_mappings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 3. airdrop_positions — H2E counter-position airdrops
-- =============================================
CREATE TABLE public.airdrop_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connected_account_id uuid NOT NULL REFERENCES public.connected_accounts(id) ON DELETE CASCADE,
  external_position_id text,
  external_event_name text NOT NULL,
  external_side text NOT NULL,
  external_price numeric NOT NULL,
  external_size numeric NOT NULL,
  counter_event_name text NOT NULL,
  counter_option_label text NOT NULL,
  counter_side text NOT NULL,
  counter_price numeric NOT NULL,
  airdrop_value numeric NOT NULL DEFAULT 10.00,
  status text NOT NULL DEFAULT 'pending',
  activated_at timestamptz,
  activated_trade_id uuid REFERENCES public.trades(id),
  expires_at timestamptz NOT NULL,
  expired_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.airdrop_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own airdrop positions"
  ON public.airdrop_positions FOR SELECT
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Only admins can insert airdrop positions"
  ON public.airdrop_positions FOR INSERT
  TO public
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update airdrop positions"
  ON public.airdrop_positions FOR UPDATE
  TO public
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 4. h2e_fund — Tracks the hedge-to-earn fund pool
-- =============================================
CREATE TABLE public.h2e_fund (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_allocated numeric NOT NULL DEFAULT 0,
  total_disbursed numeric NOT NULL DEFAULT 0,
  total_returned numeric NOT NULL DEFAULT 0,
  active_airdrops_count integer NOT NULL DEFAULT 0,
  active_airdrops_value numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.h2e_fund ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view h2e fund"
  ON public.h2e_fund FOR SELECT
  TO public
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can manage h2e fund"
  ON public.h2e_fund FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 5. Auto-update triggers
-- =============================================
CREATE TRIGGER update_connected_accounts_updated_at
  BEFORE UPDATE ON public.connected_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_mappings_updated_at
  BEFORE UPDATE ON public.event_mappings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_airdrop_positions_updated_at
  BEFORE UPDATE ON public.airdrop_positions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 6. Enable realtime for airdrop_positions
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.airdrop_positions;
