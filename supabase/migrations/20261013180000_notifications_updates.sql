-- Notifications v2 — Updates tab (2026-10-13, CPO V1–V5 + A1–A9)
--
--  * `announcements` table: operations-written notices (kind = announcement |
--    maintenance). Published rows are public (guests read /announcements).
--  * Publishing = broadcast: one `system.announcement` / `system.maintenance`
--    notification per profile, dedupe `ann:<id>`. Withdrawing deletes them.
--  * `system.campaign_live` broadcast when a campaign flips to live.
--  * `system.campaign_ending` (cron, 24h before ends_at) only to participants.
--  * `system.watchlist_live` (cron */5) when a starred event's start_date hits.
--
-- 🔴 Demo engine: writing announcements happens through SQL (no ops console).
-- The real platform owns an ops backend (publish / schedule / withdraw / preview)
-- and emits the same four message types from its services.

-- ───────────────────────── announcements ─────────────────────────
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('announcement','maintenance')),
  title text NOT NULL,
  summary text NOT NULL,
  body_md text NOT NULL DEFAULT '',
  cta_label text,
  cta_href text,
  window_starts_at timestamptz,
  window_ends_at timestamptz,
  affects text,
  not_affected text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','withdrawn')),
  locale text NOT NULL DEFAULT 'en',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS announcements_published_idx ON public.announcements (published_at DESC) WHERE status = 'published';

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Published announcements are public" ON public.announcements;
CREATE POLICY "Published announcements are public" ON public.announcements
  FOR SELECT USING (status = 'published');
DROP POLICY IF EXISTS "Admins manage announcements" ON public.announcements;
CREATE POLICY "Admins manage announcements" ON public.announcements
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
GRANT SELECT ON public.announcements TO anon, authenticated;
GRANT ALL ON public.announcements TO service_role;

-- updated_at
CREATE OR REPLACE FUNCTION public.touch_announcement() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS trg_announcements_touch ON public.announcements;
CREATE TRIGGER trg_announcements_touch BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.touch_announcement();

-- Publish = broadcast; withdraw = retract.
CREATE OR REPLACE FUNCTION public.notif_announcement() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_type text; v_user uuid;
BEGIN
  IF NEW.status = 'published' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'published') THEN
    IF NEW.published_at IS NULL THEN NEW.published_at := now(); END IF;
    v_type := CASE WHEN NEW.kind = 'maintenance' THEN 'system.maintenance' ELSE 'system.announcement' END;
    FOR v_user IN SELECT user_id FROM public.profiles LOOP
      PERFORM public.notify(v_user, v_type,
        jsonb_build_object('title', NEW.title, 'summary', NEW.summary, 'kind', NEW.kind),
        'announcement', NEW.id, '/announcements/' || NEW.id::text, 'ann:' || NEW.id::text);
    END LOOP;
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'withdrawn' AND OLD.status = 'published' THEN
    DELETE FROM public.notifications WHERE entity_type = 'announcement' AND entity_id = NEW.id;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_announcements_notify ON public.announcements;
CREATE TRIGGER trg_announcements_notify BEFORE INSERT OR UPDATE OF status ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.notif_announcement();

-- ───────────────────────── campaign live ─────────────────────────
CREATE OR REPLACE FUNCTION public.notif_campaign_live() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid; v_task text;
BEGIN
  IF NEW.status = 'live' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'live') THEN
    SELECT e.rules->'tasks'->0->>'name' INTO v_task
      FROM public.campaign_entries e WHERE e.campaign_id = NEW.id ORDER BY e.created_at LIMIT 1;
    FOR v_user IN SELECT user_id FROM public.profiles LOOP
      PERFORM public.notify(v_user, 'system.campaign_live',
        jsonb_build_object('campaign', NEW.name, 'task', COALESCE(v_task, ''), 'ends_at', NEW.ends_at),
        'campaign', NEW.id, '/rewards/campaign/' || NEW.id::text, 'camp-live:' || NEW.id::text);
    END LOOP;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_campaigns_notify_live ON public.campaigns;
CREATE TRIGGER trg_campaigns_notify_live AFTER INSERT OR UPDATE OF status ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.notif_campaign_live();

-- ───────────────────────── cron producers ─────────────────────────
-- campaign_ending: 24h before ends_at, participants only (A8).
CREATE OR REPLACE FUNCTION public.notify_campaign_ending() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; n integer := 0;
BEGIN
  FOR r IN SELECT DISTINCT p.user_id, c.id, c.name, c.ends_at
             FROM public.campaigns c
             JOIN public.campaign_participations p ON p.campaign_id = c.id
            WHERE c.status = 'live' AND c.ends_at BETWEEN now() AND now() + interval '24 hours'
  LOOP
    IF public.notify(r.user_id, 'system.campaign_ending',
         jsonb_build_object('campaign', r.name, 'ends_at', r.ends_at),
         'campaign', r.id, '/rewards/campaign/' || r.id::text, 'camp-end:' || r.id::text) IS NOT NULL THEN n := n + 1; END IF;
  END LOOP;
  RETURN n;
END $$;

-- watchlist_live: a starred event's start_date passed within the last 10 min.
-- (A9: "approaching settlement" not in this round.)
CREATE OR REPLACE FUNCTION public.notify_watchlist_live() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; n integer := 0;
BEGIN
  FOR r IN SELECT w.user_id, e.id AS event_id, e.name
             FROM public.user_watchlist w
             JOIN public.events e ON e.id = w.event_id
            WHERE e.start_date BETWEEN now() - interval '10 minutes' AND now()
              AND e.is_resolved = false
  LOOP
    IF public.notify(r.user_id, 'system.watchlist_live',
         jsonb_build_object('event_name', r.name, 'event_id', r.event_id),
         'event', NULL, '/trade?event=' || r.event_id, 'wl:' || r.event_id) IS NOT NULL THEN n := n + 1; END IF;
  END LOOP;
  RETURN n;
END $$;

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname IN ('notify-campaign-ending','notify-watchlist-live');
SELECT cron.schedule('notify-campaign-ending', '*/30 * * * *', $$SELECT public.notify_campaign_ending()$$);
SELECT cron.schedule('notify-watchlist-live', '*/5 * * * *', $$SELECT public.notify_watchlist_live()$$);
