-- Sports list · stream reminders · server-side check (CPO 2026-11-04)
--
-- A reminder is only accepted for a match that (a) carries a stream,
-- (b) has not kicked off and (c) kicks off within the next 48 hours —
-- the same rule that decides which matches show a preview card with
-- "Remind me". No per-user cap. Removing a reminder is always allowed.
-- Kickoff = metadata.kickoff_at, else start_date (same as the cron producer).

DROP POLICY IF EXISTS "Own stream reminders · add" ON public.stream_reminders;
CREATE POLICY "Own stream reminders · add" ON public.stream_reminders
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
        FROM public.events e
       WHERE e.id = stream_reminders.event_id
         AND COALESCE(e.is_resolved, false) = false
         AND NULLIF(e.metadata->>'stream_url', '') IS NOT NULL
         AND COALESCE((e.metadata->>'kickoff_at')::timestamptz, e.start_date) > now()
         AND COALESCE((e.metadata->>'kickoff_at')::timestamptz, e.start_date) <= now() + interval '48 hours'
    )
  );
