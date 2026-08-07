
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','live','ended')),
  budget_total numeric NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.campaigns TO anon, authenticated;
GRANT ALL ON public.campaigns TO service_role;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view visible campaigns" ON public.campaigns FOR SELECT USING (status IN ('live','ended'));
CREATE POLICY "Admins manage campaigns" ON public.campaigns FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.channels TO anon, authenticated;
GRANT ALL ON public.channels TO service_role;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view channels" ON public.channels FOR SELECT USING (true);
CREATE POLICY "Admins manage channels" ON public.channels FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON public.channels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.campaign_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('public','special')),
  channel_id uuid NULL REFERENCES public.channels(id) ON DELETE SET NULL,
  link_code text UNIQUE,
  rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  reward jsonb NOT NULL DEFAULT '{}'::jsonb,
  branding jsonb NOT NULL DEFAULT '{}'::jsonb,
  seed_base int NOT NULL DEFAULT 0,
  cap numeric NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.campaign_entries TO anon, authenticated;
GRANT ALL ON public.campaign_entries TO service_role;
ALTER TABLE public.campaign_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view campaign entries" ON public.campaign_entries FOR SELECT USING (true);
CREATE POLICY "Admins manage campaign entries" ON public.campaign_entries FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_campaign_entries_updated_at BEFORE UPDATE ON public.campaign_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.campaign_participations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  entry_id uuid NOT NULL REFERENCES public.campaign_entries(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  source text,
  locked_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, campaign_id)
);
GRANT SELECT, INSERT, UPDATE ON public.campaign_participations TO authenticated;
GRANT ALL ON public.campaign_participations TO service_role;
ALTER TABLE public.campaign_participations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own participations" ON public.campaign_participations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own participations" ON public.campaign_participations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own unlocked participations" ON public.campaign_participations FOR UPDATE TO authenticated USING (auth.uid() = user_id AND locked_at IS NULL) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_campaign_participations_updated_at BEFORE UPDATE ON public.campaign_participations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.campaign_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  entry_id uuid NOT NULL REFERENCES public.campaign_entries(id) ON DELETE CASCADE,
  task_key text NOT NULL,
  progress jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','claimable','claimed','not_eligible')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, entry_id, task_key)
);
GRANT SELECT, INSERT, UPDATE ON public.campaign_grants TO authenticated;
GRANT ALL ON public.campaign_grants TO service_role;
ALTER TABLE public.campaign_grants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own grants" ON public.campaign_grants FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own grants" ON public.campaign_grants FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status <> 'claimed');
CREATE POLICY "Users update own grants" ON public.campaign_grants FOR UPDATE TO authenticated USING (auth.uid() = user_id AND status <> 'claimed') WITH CHECK (auth.uid() = user_id AND status <> 'claimed');
CREATE TRIGGER update_campaign_grants_updated_at BEFORE UPDATE ON public.campaign_grants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.position_vouchers ADD COLUMN IF NOT EXISTS source_entry_id uuid NULL REFERENCES public.campaign_entries(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.get_campaign_entry_joined()
RETURNS TABLE(entry_id uuid, campaign_id uuid, joined int)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.id, e.campaign_id,
         (e.seed_base + COALESCE((SELECT count(*) FROM public.campaign_participations p WHERE p.entry_id = e.id), 0))::int
  FROM public.campaign_entries e;
$$;
GRANT EXECUTE ON FUNCTION public.get_campaign_entry_joined() TO anon, authenticated;

-- Seed data
WITH ch AS (
  INSERT INTO public.channels (name, notes) VALUES ('Lao Wang', 'KOL channel — Chinese trading community')
  RETURNING id
), wc AS (
  INSERT INTO public.campaigns (name, starts_at, ends_at, status, budget_total)
  VALUES ('World Cup Qualifiers', now() - interval '3 days', now() + interval '18 days', 'live', 50000)
  RETURNING id
)
INSERT INTO public.campaign_entries (campaign_id, kind, channel_id, link_code, rules, reward, branding, seed_base)
SELECT wc.id, 'public', NULL, NULL,
  '{"tasks":[{"task_key":"wc_trade_volume","name":"Buy $500 across World Cup markets","subtitle":"Counts every Buy on a World Cup Qualifiers market","target":500,"metric":"usd_volume","reward":{"voucher":20}},{"task_key":"wc_first_trade","name":"Place your first World Cup order","subtitle":"Any market in this campaign","target":1,"metric":"count","reward":{"voucher":5}},{"task_key":"wc_share","name":"Share a settled World Cup market","subtitle":"Share any settled market from this campaign","target":1,"metric":"count","reward":{"usdc":5}}]}'::jsonb,
  '{"voucher":25,"usdc":5}'::jsonb,
  '{"display_name":"World Cup Qualifiers","avatar_url":null,"blurb":"Trade the road to the finals.","key_visual_url":null,"accent":"#33D6FF"}'::jsonb,
  1840
FROM wc
UNION ALL
SELECT wc.id, 'special', ch.id, 'WANG24',
  '{"tasks":[{"task_key":"wc_trade_volume","name":"Buy $200 across World Cup markets","subtitle":"Exclusive threshold via Lao Wang''s link","target":200,"metric":"usd_volume","reward":{"voucher":20}},{"task_key":"wc_first_trade","name":"Place your first World Cup order","subtitle":"Any market in this campaign","target":1,"metric":"count","reward":{"voucher":5}},{"task_key":"wc_share","name":"Share a settled World Cup market","subtitle":"Share any settled market from this campaign","target":1,"metric":"count","reward":{"usdc":5}}]}'::jsonb,
  '{"voucher":20,"usdc":5}'::jsonb,
  '{"display_name":"Lao Wang","avatar_url":null,"blurb":"Exclusive entry for Lao Wang''s community.","key_visual_url":null,"accent":"#FF8A3D"}'::jsonb,
  620
FROM wc, ch;

WITH st AS (
  INSERT INTO public.campaigns (name, starts_at, ends_at, status)
  VALUES ('Starter Rewards', now() - interval '90 days', NULL, 'live')
  RETURNING id
)
INSERT INTO public.campaign_entries (campaign_id, kind, link_code, rules, reward, branding, seed_base)
SELECT st.id, 'public', NULL,
  '{"tasks":[{"task_key":"first_trade","name":"Place your first order","subtitle":"Buy Yes or No on any market","target":1,"metric":"count","reward":{"voucher":10}},{"task_key":"join_discord","name":"Join the Discord","subtitle":"Say hello in the community","target":1,"metric":"count","reward":{"voucher":5}},{"task_key":"connect_external","name":"Connect an external account","subtitle":"Link a Polymarket wallet in Settings","target":1,"metric":"count","reward":{"voucher":10}}]}'::jsonb,
  '{"voucher":25}'::jsonb,
  '{"display_name":"Starter Rewards","avatar_url":null,"blurb":"Three first steps. No end date.","key_visual_url":null,"accent":"#CFFF4A"}'::jsonb,
  9200
FROM st;

WITH cpi AS (
  INSERT INTO public.campaigns (name, starts_at, ends_at, status)
  VALUES ('CPI Print Week', now() + interval '13 days', now() + interval '20 days', 'live')
  RETURNING id
)
INSERT INTO public.campaign_entries (campaign_id, kind, link_code, rules, reward, branding, seed_base)
SELECT cpi.id, 'public', NULL,
  '{"tasks":[{"task_key":"cpi_trade_volume","name":"Buy $300 across CPI markets","subtitle":"Counts every Buy on a CPI market","target":300,"metric":"usd_volume","reward":{"voucher":15}},{"task_key":"cpi_first_trade","name":"Place your first CPI order","subtitle":"Any market in this campaign","target":1,"metric":"count","reward":{"voucher":5}}]}'::jsonb,
  '{"voucher":20}'::jsonb,
  '{"display_name":"CPI Print Week","avatar_url":null,"blurb":"Trade the print, not the noise.","key_visual_url":null,"accent":"#9AA1AC"}'::jsonb,
  0
FROM cpi;
