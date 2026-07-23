ALTER TABLE public.airdrop_positions
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'matched';

ALTER TABLE public.airdrop_positions
  DROP CONSTRAINT IF EXISTS airdrop_positions_source_check;
ALTER TABLE public.airdrop_positions
  ADD CONSTRAINT airdrop_positions_source_check
  CHECK (source IN ('matched','welcome_gift'));

ALTER TABLE public.airdrop_positions
  ALTER COLUMN external_event_name DROP NOT NULL,
  ALTER COLUMN external_side DROP NOT NULL,
  ALTER COLUMN external_price DROP NOT NULL,
  ALTER COLUMN external_size DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS airdrop_positions_one_welcome_gift_per_user
  ON public.airdrop_positions (user_id)
  WHERE source = 'welcome_gift';

INSERT INTO public.points_config (key, value, description)
VALUES ('welcome_gift_enabled', 'true'::jsonb, 'Hedge-to-Earn fallback: enable Welcome Gift airdrop when a connected account has no matched Polymarket positions')
ON CONFLICT DO NOTHING;