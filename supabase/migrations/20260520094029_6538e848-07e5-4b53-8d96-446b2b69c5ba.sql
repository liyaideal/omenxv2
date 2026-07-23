ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS withdraw_2fa_mode text NOT NULL DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS totp_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS totp_secret text;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_withdraw_2fa_mode_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_withdraw_2fa_mode_check
  CHECK (withdraw_2fa_mode IN ('email','totp','both'));