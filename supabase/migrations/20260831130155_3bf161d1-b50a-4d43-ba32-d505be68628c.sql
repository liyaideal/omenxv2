CREATE OR REPLACE FUNCTION public.tick_live_matches()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  win timestamptz := date_trunc('hour', now())
    + (floor(extract(minute from now()) / 10) * interval '10 minutes');
  m record;
  sib record;
  o record;
  meta jsonb;
  res jsonb;
  cur jsonb;
  el jsonb;
  idx int; tot int; h int; a int;
  maps_h int; maps_a int; need int;
  clk int; phs text;
  yes_wins boolean;
  win_id text;
  r numeric; acc numeric; totp numeric;
  ticked int := 0; skipped int := 0; advanced int := 0;
  settled int := 0; paid int := 0;
  fixtures jsonb := '[]'::jsonb;
BEGIN
  FOR m IN
    SELECT id, metadata
    FROM public.events
    WHERE event_subtype = 'SPORTS_MATCH'
      AND is_resolved = false
      AND coalesce(metadata->>'market_type','winner') = 'winner'
      AND metadata ? 'family'
      AND start_date <= now()
      AND end_date > now()
    ORDER BY id
  LOOP
    IF (m.metadata->>'last_tick_at') IS NOT NULL
       AND (m.metadata->>'last_tick_at')::timestamptz >= win THEN
      skipped := skipped + 1;
      CONTINUE;
    END IF;

    meta := m.metadata || jsonb_build_object(
      'last_tick_at', to_char(win at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'));
    ticked := ticked + 1;

    IF meta->>'sport' = 'esports' THEN
      tot := CASE WHEN meta->>'league' LIKE '%BO5%' THEN 5 ELSE 3 END;
      need := ceil(tot / 2.0);
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
      advanced := advanced + 1;

      -- settlement-unit score: decided maps only
      maps_h := 0; maps_a := 0;
      FOR el IN SELECT jsonb_array_elements(res) LOOP
        IF el IS NOT NULL AND el <> 'null'::jsonb THEN
          IF (el->>'home')::int >= 13 THEN maps_h := maps_h + 1;
          ELSIF (el->>'away')::int >= 13 THEN maps_a := maps_a + 1;
          END IF;
        END IF;
      END LOOP;

      IF h >= 13 OR a >= 13 THEN
        FOR sib IN
          SELECT e.id,
                 e.metadata->>'market_type' AS mt,
                 (e.metadata->>'line')::numeric AS ln
          FROM public.events e
          WHERE e.metadata->>'fixture_id' = m.id
            AND e.is_resolved = false
            AND (
              (e.metadata->>'market_type' = 'mapwin' AND e.id = m.id || '-mapwin-' || idx)
              OR (coalesce(e.metadata->>'family','main') = 'seg'
                  AND (e.metadata->>'segment_index')::int = idx)
            )
        LOOP
          yes_wins := CASE
            WHEN sib.mt = 'mapwin' THEN h > a
            WHEN sib.mt = 'handicap' THEN (h + sib.ln) > a
            ELSE (h + a) > sib.ln
          END;
          win_id := sib.id || CASE WHEN yes_wins THEN '-yes' ELSE '-no' END;
          UPDATE public.event_options
            SET is_winner = (id = win_id),
                final_price = CASE WHEN id = win_id THEN 1 ELSE 0 END,
                updated_at = now()
            WHERE event_id = sib.id;
          UPDATE public.events
            SET is_resolved = true, settled_at = now(),
                lifecycle_status = 'SETTLED', winning_option_id = win_id,
                metadata = coalesce(metadata,'{}'::jsonb)
                  || jsonb_build_object('score', h || '-' || a, 'live', false),
                updated_at = now()
            WHERE id = sib.id;
          paid := paid + public.settle_spot_event(sib.id);
          settled := settled + 1;
        END LOOP;

        idx := idx + 1;

        maps_h := 0; maps_a := 0;
        FOR el IN SELECT jsonb_array_elements(res) LOOP
          IF el IS NOT NULL AND el <> 'null'::jsonb THEN
            IF (el->>'home')::int >= 13 THEN maps_h := maps_h + 1;
            ELSIF (el->>'away')::int >= 13 THEN maps_a := maps_a + 1;
            END IF;
          END IF;
        END LOOP;

        IF maps_h >= need OR maps_a >= need THEN
          win_id := m.id || CASE WHEN maps_h > maps_a THEN '-o1' ELSE '-o2' END;
          UPDATE public.event_options
            SET is_winner = (id = win_id),
                final_price = CASE WHEN id = win_id THEN 1 ELSE 0 END,
                updated_at = now()
            WHERE event_id = m.id;
          UPDATE public.events
            SET is_resolved = true, settled_at = now(),
                lifecycle_status = 'SETTLED', winning_option_id = win_id,
                metadata = meta || jsonb_build_object(
                  'segment_index', least(idx, tot),
                  'segment_results', res,
                  'score', maps_h || '-' || maps_a,
                  'live', false),
                updated_at = now()
            WHERE id = m.id;
          paid := paid + public.settle_spot_event(m.id);
          settled := settled + 1;

          FOR sib IN
            SELECT e.id,
                   e.metadata->>'market_type' AS mt,
                   (e.metadata->>'line')::numeric AS ln
            FROM public.events e
            WHERE e.metadata->>'fixture_id' = m.id
              AND e.is_resolved = false
              AND coalesce(e.metadata->>'family','main') = 'main'
              AND e.metadata->>'market_type' IN ('handicap','total')
          LOOP
            yes_wins := CASE
              WHEN sib.mt = 'handicap' THEN (maps_h + sib.ln) > maps_a
              ELSE (maps_h + maps_a) > sib.ln
            END;
            win_id := sib.id || CASE WHEN yes_wins THEN '-yes' ELSE '-no' END;
            UPDATE public.event_options
              SET is_winner = (id = win_id),
                  final_price = CASE WHEN id = win_id THEN 1 ELSE 0 END,
                  updated_at = now()
              WHERE event_id = sib.id;
            UPDATE public.events
              SET is_resolved = true, settled_at = now(),
                  lifecycle_status = 'SETTLED', winning_option_id = win_id,
                  metadata = coalesce(metadata,'{}'::jsonb)
                    || jsonb_build_object('score', maps_h || '-' || maps_a, 'live', false),
                  updated_at = now()
              WHERE id = sib.id;
            paid := paid + public.settle_spot_event(sib.id);
            settled := settled + 1;
          END LOOP;

          fixtures := fixtures || jsonb_build_object(
            'fixture', m.id, 'sport', 'esports', 'finished', true,
            'maps', maps_h || '-' || maps_a);
          CONTINUE;
        END IF;
      END IF;

      meta := meta || jsonb_build_object(
        'segment_index', least(idx, tot),
        'segment_results', res,
        'score', maps_h || '-' || maps_a,
        'live', true);
      fixtures := fixtures || jsonb_build_object(
        'fixture', m.id, 'sport', 'esports', 'segment_index', least(idx, tot),
        'score', maps_h || '-' || maps_a);

    ELSIF meta->>'sport' = 'mma' THEN
      tot := CASE WHEN meta->>'league' = 'UFC Fight Night' THEN 3 ELSE 5 END;
      idx := coalesce((meta->>'segment_index')::int, 1);
      clk := coalesce((meta->>'clock')::int, 300);
      phs := coalesce(meta->>'phase', 'LIVE');

      IF phs = 'BREAK' THEN
        phs := 'LIVE';
        clk := 300;
      ELSE
        clk := clk - 150;
        IF clk <= 0 THEN
          idx := idx + 1;
          clk := 300;
          phs := 'BREAK';
        END IF;
      END IF;
      advanced := advanced + 1;

      IF idx > tot THEN
        FOR sib IN
          SELECT e.id,
                 e.metadata->>'market_type' AS mt,
                 (e.metadata->>'line')::numeric AS ln
          FROM public.events e
          WHERE e.metadata->>'fixture_id' = m.id
            AND e.is_resolved = false
            AND e.metadata->>'market_type' IN ('total','distance','method')
        LOOP
          yes_wins := CASE
            WHEN sib.mt = 'distance' THEN true
            WHEN sib.mt = 'method' THEN false
            ELSE tot > sib.ln
          END;
          win_id := sib.id || CASE WHEN yes_wins THEN '-yes' ELSE '-no' END;
          UPDATE public.event_options
            SET is_winner = (id = win_id),
                final_price = CASE WHEN id = win_id THEN 1 ELSE 0 END,
                updated_at = now()
            WHERE event_id = sib.id;
          UPDATE public.events
            SET is_resolved = true, settled_at = now(),
                lifecycle_status = 'SETTLED', winning_option_id = win_id,
                metadata = coalesce(metadata,'{}'::jsonb)
                  || jsonb_build_object('live', false),
                updated_at = now()
            WHERE id = sib.id;
          paid := paid + public.settle_spot_event(sib.id);
          settled := settled + 1;
        END LOOP;

        SELECT coalesce(sum(price),0) INTO totp FROM public.event_options WHERE event_id = m.id;
        r := random() * totp;
        acc := 0;
        win_id := NULL;
        FOR o IN SELECT id, price FROM public.event_options WHERE event_id = m.id ORDER BY id LOOP
          acc := acc + o.price;
          IF win_id IS NULL AND r <= acc THEN win_id := o.id; END IF;
        END LOOP;
        UPDATE public.event_options
          SET is_winner = (id = win_id),
              final_price = CASE WHEN id = win_id THEN 1 ELSE 0 END,
              updated_at = now()
          WHERE event_id = m.id;
        UPDATE public.events
          SET is_resolved = true, settled_at = now(),
              lifecycle_status = 'SETTLED', winning_option_id = win_id,
              metadata = meta || jsonb_build_object(
                'segment_index', tot, 'clock', 0, 'phase', 'DECISION',
                'score', NULL, 'live', false),
              updated_at = now()
          WHERE id = m.id;
        paid := paid + public.settle_spot_event(m.id);
        settled := settled + 1;

        fixtures := fixtures || jsonb_build_object(
          'fixture', m.id, 'sport', 'mma', 'finished', true, 'result', 'decision');
        CONTINUE;
      END IF;

      meta := meta || jsonb_build_object(
        'segment_index', idx, 'clock', clk, 'phase', phs,
        'score', NULL, 'live', true);
      fixtures := fixtures || jsonb_build_object(
        'fixture', m.id, 'sport', 'mma', 'segment_index', idx,
        'clock', clk, 'phase', phs);
    ELSE
      CONTINUE;
    END IF;

    UPDATE public.events SET metadata = meta, updated_at = now() WHERE id = m.id;
  END LOOP;

  RETURN jsonb_build_object(
    'window', to_char(win at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'ticked', ticked,
    'skipped', skipped,
    'segments_advanced', advanced,
    'markets_settled', settled,
    'positions_paid', paid,
    'fixtures', fixtures
  );
END;
$fn$;

REVOKE ALL ON FUNCTION public.tick_live_matches() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tick_live_matches() TO service_role;