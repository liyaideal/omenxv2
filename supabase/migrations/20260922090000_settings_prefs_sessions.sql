-- Settings reskin (CPO 2026-09-22): Notifications · Preferences · Sessions.
-- Blueprint storage for the three new Settings modules. On the live platform
-- notification_prefs feeds the mailer, language feeds i18n + transactional
-- email language, and sessions come from the auth service.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_prefs jsonb NOT NULL
    DEFAULT '{"settled": true, "auto_close": true, "trades": true, "funds": true}'::jsonb,
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en';

COMMENT ON COLUMN public.profiles.notification_prefs IS
  'Email alert toggles (Settings › Notifications): settled | auto_close | trades | funds. Blueprint stores the preference only; no mail is sent.';
COMMENT ON COLUMN public.profiles.language IS
  'UI + email language code (Settings › Preferences): en | zh-CN | zh-TW | ja | ko | ru | vi. Page copy is not translated in the blueprint.';

-- Sessions list for Settings › Sessions. SECURITY DEFINER because auth.sessions
-- is not readable by the authenticated role; scoped to auth.uid() so a user only
-- ever sees their own rows. `is_current` compares against the JWT session_id.
CREATE OR REPLACE FUNCTION public.list_my_sessions()
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  last_active_at timestamptz,
  user_agent text,
  ip text,
  is_current boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    s.id,
    s.created_at,
    COALESCE(s.refreshed_at AT TIME ZONE 'UTC', s.updated_at) AS last_active_at,
    s.user_agent,
    host(s.ip) AS ip,
    (s.id::text = (auth.jwt() ->> 'session_id')) AS is_current
  FROM auth.sessions s
  WHERE s.user_id = auth.uid()
    AND (s.not_after IS NULL OR s.not_after > now())
  ORDER BY (s.id::text = (auth.jwt() ->> 'session_id')) DESC,
           COALESCE(s.refreshed_at AT TIME ZONE 'UTC', s.updated_at) DESC;
$$;

REVOKE ALL ON FUNCTION public.list_my_sessions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_my_sessions() TO authenticated;
