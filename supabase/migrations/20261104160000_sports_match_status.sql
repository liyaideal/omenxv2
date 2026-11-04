-- Sports · match status decides when a match is over (CPO 2026-11-04)
--
-- end_date on a sports fixture is an ESTIMATE. It never ends a match, closes
-- trading or drives a countdown in the UI; the match status does
-- (metadata.match_status from the sports feed: scheduled / live / final /
-- postponed / cancelled). See docs/delivery/sports-match-clock-v1.md.
--
-- Applied on 2026-11-04 via the Lovable MCP (query_database):
--
-- 1) Demo settlement engine: roll_sports_matches() settles a winner fixture at
--    end_date, EXCEPT when metadata.match_status = 'live' (the feed says the
--    match is still being played). The WHERE clause of its main loop became:
--
--      WHERE event_subtype = 'SPORTS_MATCH'
--        AND end_date IS NOT NULL
--        AND end_date <= now()
--        -- CPO 2026-11-04: end_date is an estimate. A match the feed still reports live is not settled.
--        AND coalesce(metadata->>'match_status', '') <> 'live'
--        AND coalesce(metadata->>'market_type', 'winner') = 'winner'
--
--    (applied in place with replace() on pg_get_functiondef; the rest of the
--    function is unchanged.)
--
-- 2) 🔴 Demo only: one NHL fixture permanently in overtime, 20 minutes past its
--    estimated end — Toronto Maple Leafs vs Seattle Kraken (demo-live-ot-nhl).

CREATE OR REPLACE FUNCTION public.keep_demo_overtime_fixture() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $fn$
DECLARE ko timestamptz := now() - interval '2 hours 50 minutes';
BEGIN
  INSERT INTO public.events
  SELECT (jsonb_populate_record(NULL::public.events,
           to_jsonb(e) || jsonb_build_object(
             'id', 'demo-live-ot-nhl',
             'name', 'Toronto Maple Leafs vs Seattle Kraken',
             'created_at', now(),
             'is_resolved', false,
             'lifecycle_status', 'TRADING'))).*
    FROM public.events e WHERE e.id = 'sp-nhl-tor-mtl'
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.event_options
  SELECT (jsonb_populate_record(NULL::public.event_options,
           to_jsonb(o) || jsonb_build_object(
             'id', replace(o.id, 'sp-nhl-tor-mtl', 'demo-live-ot-nhl'),
             'event_id', 'demo-live-ot-nhl',
             'label', CASE WHEN o.id LIKE '%-o1' THEN 'Maple Leafs' ELSE 'Kraken' END,
             'price', CASE WHEN o.id LIKE '%-o1' THEN 0.41 ELSE 0.59 END,
             'is_winner', NULL, 'final_price', NULL))).*
    FROM public.event_options o WHERE o.event_id = 'sp-nhl-tor-mtl'
  ON CONFLICT (id) DO NOTHING;

  UPDATE public.events
     SET start_date = ko,
         end_date = now() - interval '20 minutes',
         is_resolved = false,
         lifecycle_status = 'TRADING',
         metadata = metadata || jsonb_build_object(
           'fixture_id', 'demo-live-ot-nhl',
           'home', 'Toronto Maple Leafs', 'away', 'Seattle Kraken',
           'home_abbr', 'TOR', 'away_abbr', 'SEA',
           'kickoff_at', to_char(ko at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
           'match_status', 'live',
           'live', true,
           'segment_index', 4,
           'clock', 201,
           'score', '2-2',
           'segment_results', jsonb_build_array(
             jsonb_build_object('home', 1, 'away', 1),
             jsonb_build_object('home', 1, 'away', 0),
             jsonb_build_object('home', 0, 'away', 1),
             NULL))
   WHERE id = 'demo-live-ot-nhl';
END $fn$;

SELECT public.keep_demo_overtime_fixture();

-- 3) PENDING CPO approval (not applied): keep the fixture inside its window.
--    Without it the 3h watchdog turns the demo match into "Final · In review"
--    about 3 hours after the last refresh, and it then never settles (the
--    engine skips match_status = 'live').
-- SELECT cron.schedule('keep-demo-overtime-fixture', '*/10 * * * *', 'select public.keep_demo_overtime_fixture();');

-- Cleanup:
-- DELETE FROM public.event_options WHERE event_id = 'demo-live-ot-nhl';
-- DELETE FROM public.events WHERE id = 'demo-live-ot-nhl';
-- DROP FUNCTION IF EXISTS public.keep_demo_overtime_fixture();
