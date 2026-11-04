-- Demo seed · Sports list streams (2026-11-04). Applied with query_database.
--
-- Streams: CPO rule "every LoL match and every big football match is streamed".
-- demo-live-cs2 / demo-prekick-cs2 already carry stream_url (SP-L, 2026-09-01);
-- the two big football fixtures inside the 48h preview window get one too.
UPDATE public.events
   SET metadata = metadata || jsonb_build_object('stream_url', 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8')
 WHERE id IN ('sp-ucl-mci-int', 'sp-sea-juv-nap');

-- alex_carter (968a2b3a…): one pending reminder (preview card shows
-- "Reminder set") + one already delivered (system.stream_live in the
-- Notifications → Updates tab). The delivered one is produced by running the
-- real producer against a reminder created before kickoff.
INSERT INTO public.stream_reminders (user_id, event_id)
VALUES ('968a2b3a-3913-4acb-948b-c78cc828a125', 'sp-ucl-mci-int')
ON CONFLICT DO NOTHING;

INSERT INTO public.stream_reminders (user_id, event_id, created_at)
VALUES ('968a2b3a-3913-4acb-948b-c78cc828a125', 'demo-live-cs2', now() - interval '40 minutes')
ON CONFLICT DO NOTHING;
SELECT public.notify_stream_reminders();

-- Clean-up (one statement each):
--   DELETE FROM public.stream_reminders WHERE user_id = '968a2b3a-3913-4acb-948b-c78cc828a125';
--   DELETE FROM public.notifications WHERE user_id = '968a2b3a-3913-4acb-948b-c78cc828a125' AND type = 'system.stream_live';
