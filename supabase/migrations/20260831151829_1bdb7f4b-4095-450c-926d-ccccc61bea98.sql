-- lovable-cron-fallback-reviewed: 288 runs/day; demo showcase fixtures must advance score and countdown on a 5-minute cadence to look live
CREATE OR REPLACE FUNCTION public.tick_demo_showcase()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  win timestamptz := date_trunc('hour', now())
    + (floor(extract(minute from now()) / 5) * interval '5 minutes');
  m record;
  meta jsonb;
  res jsonb;
  cur jsonb;
  el jsonb;
  idx int; tot int := 3; need int := 2;
  h int; a int; maps_h int; maps_a int;
  win_id text;
  p numeric;
  sd timestamptz; ed timestamptz;
  restarted boolean := false;
  rolled boolean := false;
  live_out jsonb := '{}'::jsonb;
  prek_out jsonb := '{}'::jsonb;
  paid int := 0;
BEGIN
  -- ---------- A: always-live demo fixture ----------
  SELECT id, metadata INTO m FROM public.events WHERE id = 'demo-live-cs2';
  IF FOUND THEN
    IF (m.metadata->>'last_tick_at') IS NOT NULL
       AND (m.metadata->>'last_tick_at')::timestamptz >= win THEN
      live_out := jsonb_build_object('fixture','demo-live-cs2','skipped',true,
        'segment_index', m.metadata->>'segment_index',
        'score', m.metadata->>'score', 'restarted', false);
    ELSE
      meta := m.metadata || jsonb_build_object(
        'last_tick_at', to_char(win at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'));

      idx := coalesce((meta->>'segment_index')::int, 1);
      res := coalesce(meta->'segment_results', '[]'::jsonb);
      WHILE jsonb_array_length(res) < tot LOOP
        res := res || jsonb_build_array(NULL);
      END LOOP;

      cur := res -> (idx - 1);
      IF cur IS NULL OR cur = 'null'::jsonb THEN
        h := 0; a := 0;
      ELSE
        h := (cur->>'home')::int; a := (cur->>'away')::int;
      END IF;

      h := h + (CASE WHEN random() < 0.35 THEN 0 WHEN random() < 0.72 THEN 1 ELSE 2 END);
      a := a + (CASE WHEN random() < 0.40 THEN 0 WHEN random() < 0.78 THEN 1 ELSE 2 END);
      res := jsonb_set(res, ARRAY[(idx - 1)::text], jsonb_build_object('home', h, 'away', a));

      maps_h := 0; maps_a := 0;
      FOR el IN SELECT jsonb_array_elements(res) LOOP
        IF el IS NOT NULL AND el <> 'null'::jsonb THEN
          IF (el->>'home')::int >= 13 THEN maps_h := maps_h + 1;
          ELSIF (el->>'away')::int >= 13 THEN maps_a := maps_a + 1;
          END IF;
        END IF;
      END LOOP;

      IF h >= 13 OR a >= 13 THEN
        idx := idx + 1;
      END IF;

      IF maps_h >= need OR maps_a >= need THEN
        win_id := 'demo-live-cs2' || CASE WHEN maps_h > maps_a THEN '-o1' ELSE '-o2' END;
        UPDATE public.event_options
          SET is_winner = (id = win_id),
              final_price = CASE WHEN id = win_id THEN 1 ELSE 0 END,
              updated_at = now()
          WHERE event_id = 'demo-live-cs2';
        UPDATE public.events
          SET is_resolved = true, settled_at = now(),
              lifecycle_status = 'SETTLED', winning_option_id = win_id,
              metadata = meta || jsonb_build_object(
                'segment_index', least(idx, tot),
                'segment_results', res,
                'score', maps_h || '-' || maps_a,
                'live', false),
              updated_at = now()
          WHERE id = 'demo-live-cs2';
        paid := paid + public.settle_spot_event('demo-live-cs2');

        restarted := true;
        sd := now();
        ed := now() + interval '100 years';
        meta := meta || jsonb_build_object(
          'segment_index', 1,
          'segment_results', jsonb_build_array(NULL, NULL, NULL),
          'score', '0-0',
          'clock', NULL,
          'phase', NULL,
          'live', true,
          'kickoff_at', to_char(sd at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'));

        UPDATE public.events
          SET is_resolved = false, settled_at = NULL, winning_option_id = NULL,
              lifecycle_status = 'TRADING', close_price = NULL,
              settlement_description = NULL,
              start_date = sd, end_date = ed, expected_settlement_time = ed,
              volume = '482000',
              metadata = meta,
              updated_at = now()
          WHERE id = 'demo-live-cs2';

        p := round((0.35 + random() * 0.30)::numeric, 4);
        UPDATE public.event_options
          SET is_winner = false, final_price = NULL,
              price = CASE WHEN id = 'demo-live-cs2-o1' THEN p ELSE round(1 - p, 4) END,
              updated_at = now()
          WHERE event_id = 'demo-live-cs2';

        UPDATE public.events
          SET start_date = sd, end_date = ed,
              metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
                'kickoff_at', to_char(sd at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"')),
              updated_at = now()
          WHERE metadata->>'fixture_id' = 'demo-live-cs2' AND id <> 'demo-live-cs2';

        live_out := jsonb_build_object('fixture','demo-live-cs2','skipped',false,
          'segment_index', 1, 'score', '0-0', 'restarted', true,
          'positions_paid', paid);
      ELSE
        meta := meta || jsonb_build_object(
          'segment_index', least(idx, tot),
          'segment_results', res,
          'score', maps_h || '-' || maps_a,
          'live', true);
        UPDATE public.events SET metadata = meta, volume = '482000', updated_at = now()
          WHERE id = 'demo-live-cs2';
        live_out := jsonb_build_object('fixture','demo-live-cs2','skipped',false,
          'segment_index', least(idx, tot),
          'score', maps_h || '-' || maps_a, 'restarted', false);
      END IF;
    END IF;
  END IF;

  -- ---------- B: always-about-to-start demo fixture ----------
  SELECT id, metadata INTO m FROM public.events WHERE id = 'demo-prekick-cs2';
  IF FOUND THEN
    IF (m.metadata->>'kickoff_at') IS NULL
       OR (m.metadata->>'kickoff_at')::timestamptz <= now() + interval '20 minutes' THEN
      rolled := true;
      sd := now() + interval '3 hours';
      UPDATE public.events
        SET is_resolved = false, settled_at = NULL, winning_option_id = NULL,
            lifecycle_status = 'TRADING',
            start_date = sd, end_date = sd + interval '2 hours',
            expected_settlement_time = sd + interval '2 hours',
            volume = '96000',
            metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
              'kickoff_at', to_char(sd at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'),
              'segment_index', NULL,
              'segment_results', jsonb_build_array(NULL, NULL, NULL),
              'score', NULL,
              'live', false),
            updated_at = now()
        WHERE id = 'demo-prekick-cs2';

      UPDATE public.events
        SET start_date = sd, end_date = sd + interval '2 hours',
            metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
              'kickoff_at', to_char(sd at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"')),
            updated_at = now()
        WHERE metadata->>'fixture_id' = 'demo-prekick-cs2' AND id <> 'demo-prekick-cs2';

      prek_out := jsonb_build_object('fixture','demo-prekick-cs2','rolled',true,
        'kickoff_at', to_char(sd at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'));
    ELSE
      prek_out := jsonb_build_object('fixture','demo-prekick-cs2','rolled',false,
        'kickoff_at', m.metadata->>'kickoff_at');
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'window', to_char(win at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'live_fixture', live_out,
    'prekick_fixture', prek_out
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.tick_demo_showcase() FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  PERFORM cron.unschedule('tick-demo-showcase')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'tick-demo-showcase');
  PERFORM cron.schedule('tick-demo-showcase', '*/5 * * * *', $cron$select public.tick_demo_showcase();$cron$);
END
$$;