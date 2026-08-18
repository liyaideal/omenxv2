-- ============================================================
-- A3 · roll_sports_matches rewrite (fixture-aware, consistent settle)
-- ============================================================
create or replace function public.roll_sports_matches()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
DECLARE
  m record;
  o record;
  sib record;
  win_id text;
  r numeric;
  acc numeric;
  total numeric;
  settled int := 0;
  rescheduled int := 0;
  paid int := 0;
  idx int := 0;
  new_start timestamptz;
  new_end timestamptz;
  dur interval;
  p numeric;
  is_soccer boolean;
  ph numeric; pd numeric; pa numeric; s numeric;
  gh int; ga int;
  win_label text;
  yes_wins boolean;
  draw numeric; q numeric;
  scores jsonb := '[]'::jsonb;
BEGIN
  FOR m IN
    SELECT id, name, start_date, end_date, metadata
    FROM public.events
    WHERE event_subtype = 'SPORTS_MATCH'
      AND end_date IS NOT NULL
      AND end_date <= now()
      AND coalesce(metadata->>'market_type', 'winner') = 'winner'
    ORDER BY end_date
  LOOP
    is_soccer :=
      (m.metadata->>'sport' = 'soccer')
      OR (m.metadata->>'format' = '1x2')
      OR EXISTS (
        SELECT 1 FROM public.sports_league_map lm
        WHERE lm.league = m.metadata->>'league' AND lm.sport = 'soccer'
      );

    IF EXISTS (SELECT 1 FROM public.events WHERE id = m.id AND is_resolved = false) THEN
      IF is_soccer THEN
        SELECT * INTO ph, pd, pa FROM public.soccer_winner_prices(m.id);
        s := coalesce(ph, 0.4) - coalesce(pa, 0.4);
        gh := public.sim_poisson(1.3 + 1.2 * greatest(0, s));
        ga := public.sim_poisson(1.3 + 1.2 * greatest(0, -s));

        win_label := CASE
          WHEN gh > ga THEN m.metadata->>'home'
          WHEN gh = ga THEN 'Draw'
          ELSE m.metadata->>'away'
        END;
        SELECT id INTO win_id FROM public.event_options
          WHERE event_id = m.id AND label = win_label LIMIT 1;
        IF win_id IS NULL THEN
          SELECT id INTO win_id FROM public.event_options
            WHERE event_id = m.id
            ORDER BY id
            OFFSET (CASE WHEN gh > ga THEN 0 WHEN gh = ga THEN 1 ELSE 2 END)
            LIMIT 1;
        END IF;

        IF win_id IS NOT NULL THEN
          UPDATE public.event_options
            SET is_winner = (id = win_id),
                final_price = CASE WHEN id = win_id THEN 1 ELSE 0 END,
                updated_at = now()
            WHERE event_id = m.id;
          UPDATE public.events
            SET is_resolved = true, settled_at = now(),
                lifecycle_status = 'SETTLED', winning_option_id = win_id,
                metadata = coalesce(metadata, '{}'::jsonb)
                  || jsonb_build_object('score', gh || '-' || ga, 'live', false)
            WHERE id = m.id;
          paid := paid + public.settle_spot_event(m.id);
          settled := settled + 1;
        END IF;

        -- siblings settle from the SAME score
        FOR sib IN
          SELECT e.id, e.metadata->>'market_type' AS mt, (e.metadata->>'line')::numeric AS ln
          FROM public.events e
          WHERE e.metadata->>'fixture_id' = m.id
            AND e.metadata->>'market_type' IN ('handicap','total')
            AND e.is_resolved = false
        LOOP
          yes_wins := CASE
            WHEN sib.mt = 'handicap' THEN (gh + sib.ln) > ga
            ELSE (gh + ga) > sib.ln
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
                metadata = coalesce(metadata, '{}'::jsonb)
                  || jsonb_build_object('score', gh || '-' || ga, 'live', false)
            WHERE id = sib.id;
          paid := paid + public.settle_spot_event(sib.id);
          settled := settled + 1;
        END LOOP;

        scores := scores || jsonb_build_object('fixture', m.id, 'score', gh || '-' || ga);
      ELSE
        SELECT coalesce(sum(price), 0) INTO total FROM public.event_options WHERE event_id = m.id;
        IF total > 0 THEN
          r := random() * total;
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
                lifecycle_status = 'SETTLED', winning_option_id = win_id
            WHERE id = m.id;
          paid := paid + public.settle_spot_event(m.id);
          settled := settled + 1;
        END IF;
      END IF;
    END IF;

    -- ---------- reschedule the fixture (winner + every sibling) ----------
    dur := coalesce(m.end_date - m.start_date, interval '2 hours');
    new_start := m.start_date;
    WHILE new_start <= now() + interval '2 hours' LOOP
      new_start := new_start + interval '7 days';
    END LOOP;
    new_end := new_start + dur;

    UPDATE public.events
      SET start_date = new_start,
          end_date = new_end,
          is_resolved = false,
          settled_at = NULL,
          winning_option_id = NULL,
          settlement_description = NULL,
          close_price = NULL,
          lifecycle_status = 'TRADING',
          expected_settlement_time = new_end,
          metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
            'kickoff_at', to_char(new_start at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
            'live', false,
            'minute', NULL,
            'phase', NULL,
            'score', NULL
          ),
          updated_at = now()
      WHERE id = m.id
         OR (metadata->>'fixture_id' = m.id
             AND metadata->>'market_type' IN ('handicap','total'));

    UPDATE public.event_options
      SET is_winner = false, final_price = NULL, updated_at = now()
      WHERE event_id = m.id
         OR event_id IN (
           SELECT e.id FROM public.events e
           WHERE e.metadata->>'fixture_id' = m.id
             AND e.metadata->>'market_type' IN ('handicap','total')
         );

    -- ---------- reset winner prices (3-way sums to exactly 1) ----------
    SELECT count(*) INTO idx FROM public.event_options WHERE event_id = m.id;
    IF idx = 3 THEN
      draw := round((0.22 + random() * 0.12)::numeric, 4);
      q := (0.35 + random() * 0.30)::numeric;
      p := round(((1 - draw) * q)::numeric, 4);
      UPDATE public.event_options SET price = p, updated_at = now()
        WHERE event_id = m.id
          AND id = (SELECT id FROM public.event_options WHERE event_id = m.id ORDER BY id OFFSET 0 LIMIT 1);
      UPDATE public.event_options SET price = draw, updated_at = now()
        WHERE event_id = m.id
          AND id = (SELECT id FROM public.event_options WHERE event_id = m.id ORDER BY id OFFSET 1 LIMIT 1);
      UPDATE public.event_options SET price = round((1 - draw - p)::numeric, 4), updated_at = now()
        WHERE event_id = m.id
          AND id = (SELECT id FROM public.event_options WHERE event_id = m.id ORDER BY id OFFSET 2 LIMIT 1);
    ELSE
      p := round((0.35 + random() * 0.30)::numeric, 4);
      idx := 0;
      FOR o IN SELECT id FROM public.event_options WHERE event_id = m.id ORDER BY id LOOP
        idx := idx + 1;
        UPDATE public.event_options
          SET price = CASE WHEN idx = 1 THEN p ELSE round((1 - p)::numeric, 4) END,
              updated_at = now()
          WHERE id = o.id;
      END LOOP;
    END IF;

    IF is_soccer THEN
      PERFORM public.reprice_soccer_lines(m.id);
    END IF;

    rescheduled := rescheduled + 1;
  END LOOP;

  -- every soccer winner keeps its three groups, including newly seeded fixtures
  FOR m IN
    SELECT e.id, e.metadata
    FROM public.events e
    WHERE e.event_subtype = 'SPORTS_MATCH'
      AND coalesce(e.metadata->>'market_type', 'winner') = 'winner'
      AND (
        e.metadata->>'sport' = 'soccer'
        OR e.metadata->>'format' = '1x2'
        OR EXISTS (
          SELECT 1 FROM public.sports_league_map lm
          WHERE lm.league = e.metadata->>'league' AND lm.sport = 'soccer'
        )
      )
  LOOP
    PERFORM public.ensure_soccer_lines(m.id);
  END LOOP;

  RETURN jsonb_build_object(
    'settled', settled, 'rescheduled', rescheduled,
    'positions_paid', paid, 'scores', scores
  );
END;
$$;

-- ============================================================
-- B2 · sim_price_tick renormalises multi-option markets to 1.0
-- ============================================================
create or replace function public.sim_price_tick()
returns int
language plpgsql
security definer
set search_path = public
as $$
DECLARE
  e record;
  n int := 0;
  live_cnt int;
  a record;
  b record;
  new_p numeric;
  new_sum numeric;
  o record;
BEGIN
  FOR e IN
    SELECT ev.id
    FROM public.events ev
    WHERE ev.is_resolved = false
      AND (ev.end_date IS NULL OR ev.end_date > now())
      AND (ev.freeze_time IS NULL OR ev.freeze_time > now())
    LIMIT 100
  LOOP
    SELECT count(*) INTO live_cnt
    FROM public.event_options eo
    WHERE eo.event_id = e.id AND eo.final_price IS NULL;

    IF live_cnt = 2 THEN
      SELECT eo.id, eo.price INTO a
      FROM public.event_options eo
      WHERE eo.event_id = e.id AND eo.final_price IS NULL
      ORDER BY eo.created_at, eo.id
      LIMIT 1;
      SELECT eo.id INTO b
      FROM public.event_options eo
      WHERE eo.event_id = e.id AND eo.final_price IS NULL AND eo.id <> a.id
      LIMIT 1;
      IF a.id IS NULL OR b.id IS NULL THEN CONTINUE; END IF;

      new_p := round(LEAST(0.98, GREATEST(0.02, a.price * (1 + (random() - 0.5) * 0.03)))::numeric, 4);
      UPDATE public.event_options SET price = new_p, updated_at = now() WHERE id = a.id;
      UPDATE public.event_options SET price = round((1 - new_p)::numeric, 4), updated_at = now() WHERE id = b.id;
      n := n + 2;

    ELSIF live_cnt > 2 THEN
      CREATE TEMP TABLE IF NOT EXISTS _tick_tmp (id text, p numeric) ON COMMIT DROP;
      DELETE FROM _tick_tmp;

      INSERT INTO _tick_tmp (id, p)
      SELECT eo.id, GREATEST(0.0001, eo.price * (1 + (random() - 0.5) * 0.03))
      FROM public.event_options eo
      WHERE eo.event_id = e.id AND eo.final_price IS NULL;

      SELECT COALESCE(sum(p), 0) INTO new_sum FROM _tick_tmp;
      IF new_sum <= 0 THEN CONTINUE; END IF;

      -- normalise to exactly 1.0 so multi-outcome prices stay a probability set
      FOR o IN SELECT id, p FROM _tick_tmp LOOP
        UPDATE public.event_options
        SET price = round(LEAST(0.99, GREATEST(0.01, o.p / new_sum))::numeric, 4),
            updated_at = now()
        WHERE id = o.id;
        n := n + 1;
      END LOOP;
    END IF;
  END LOOP;

  RETURN n;
END;
$$;
