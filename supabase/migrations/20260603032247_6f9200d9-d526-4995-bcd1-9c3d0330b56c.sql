-- Add settlement fields to airdrop_positions to support manual / auto close
ALTER TABLE public.airdrop_positions
  ADD COLUMN IF NOT EXISTS settled_pnl numeric,
  ADD COLUMN IF NOT EXISTS settled_at timestamptz,
  ADD COLUMN IF NOT EXISTS close_reason text,
  ADD COLUMN IF NOT EXISTS exit_price numeric;

-- Partial unique index: at most 1 active voucher airdrop position per user
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_voucher_airdrop_per_user
  ON public.airdrop_positions (user_id)
  WHERE source = 'voucher' AND status = 'activated';