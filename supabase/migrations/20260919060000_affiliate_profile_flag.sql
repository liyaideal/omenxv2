-- /affiliate CTA state (2026-09-19): the blueprint's "is this user an affiliate" flag.
-- On the live platform this maps to the affiliate service; here it is a profile column
-- so the marketing page can show guest / member / affiliate states.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_affiliate boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS affiliate_since timestamptz NULL;

COMMENT ON COLUMN public.profiles.is_affiliate IS
  'Affiliate Program membership flag (blueprint for the platform affiliate service). Drives the /affiliate CTA state.';

-- Demo account alex_carter is an affiliate so the "Open affiliate portal" state is demonstrable.
UPDATE public.profiles
   SET is_affiliate = true, affiliate_since = '2026-09-19T00:00:00Z'
 WHERE user_id = '968a2b3a-3913-4acb-948b-c78cc828a125';
