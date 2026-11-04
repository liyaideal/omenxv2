-- Sports list · stream reminders (CPO 2026-11-04)
--
--   * `stream_reminders`: one row per (user, event) — the user tapped
--     "Remind me" on a stream preview in the Sports list. Users read / add /
--     remove only their own rows (RLS). Guests cannot write; the client opens
--     the sign-in prompt instead.
--   * `notify_stream_reminders()` (cron, every minute): once an event's kickoff
--     (metadata.kickoff_at, else start_date) has passed — within the last 30
--     minutes, still unresolved, with metadata.stream_url — every reminder on it
--     becomes one `system.stream_live` notification (Updates tab), dedupe
--     `stream:<event_id>`, then the row is stamped `notified_at`.
--     Re-running is a no-op: the stamp + the dedupe key both stop a second send.
--   * Reminders older than kickoff + 30 min that never fired (event postponed,
--     stream removed) are stamped too, so they never fire late.
--
-- 🔴 Demo engine. The real platform owns the reminder service and emits the
-- same `system.stream_live` message type from it.

CREATE TABLE IF NOT EXISTS public.stream_reminders (
  user_id uuid NOT NULL,
  event_id text NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  notified_at timestamptz,
  PRIMARY KEY (user_id, event_id)
);
CREATE INDEX IF NOT EXISTS stream_reminders_pending_idx
  ON public.stream_reminders (event_id) WHERE notified_at IS NULL;

ALTER TABLE public.stream_reminders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own stream reminders · read" ON public.stream_reminders;
CREATE POLICY "Own stream reminders · read" ON public.stream_reminders
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Own stream reminders · add" ON public.stream_reminders;
CREATE POLICY "Own stream reminders · add" ON public.stream_reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Own stream reminders · remove" ON public.stream_reminders;
CREATE POLICY "Own stream reminders · remove" ON public.stream_reminders
  FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.notify_stream_reminders() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; n integer := 0;
BEGIN
  FOR r IN
    SELECT sr.user_id, e.id AS event_id, e.name,
           e.metadata->>'home' AS home, e.metadata->>'away' AS away,
           e.metadata->>'league' AS league
      FROM public.stream_reminders sr
      JOIN public.events e ON e.id = sr.event_id
     WHERE sr.notified_at IS NULL
       AND e.is_resolved = false
       AND COALESCE(e.metadata->>'stream_url', '') <> ''
       AND COALESCE((e.metadata->>'kickoff_at')::timestamptz, e.start_date)
           BETWEEN now() - interval '30 minutes' AND now()
  LOOP
    PERFORM public.notify(r.user_id, 'system.stream_live',
      jsonb_build_object('event_name', r.name, 'event_id', r.event_id,
                         'home', r.home, 'away', r.away, 'league', r.league),
      'event', NULL, '/trade?event=' || r.event_id, 'stream:' || r.event_id);
    UPDATE public.stream_reminders SET notified_at = now()
     WHERE user_id = r.user_id AND event_id = r.event_id;
    n := n + 1;
  END LOOP;

  -- Never fire late: kickoff + 30 min passed without a send → stamp and drop.
  UPDATE public.stream_reminders sr SET notified_at = now()
    FROM public.events e
   WHERE e.id = sr.event_id AND sr.notified_at IS NULL
     AND COALESCE((e.metadata->>'kickoff_at')::timestamptz, e.start_date) < now() - interval '30 minutes';

  RETURN n;
END $$;

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'notify-stream-reminders';
SELECT cron.schedule('notify-stream-reminders', '* * * * *', $$SELECT public.notify_stream_reminders()$$);
