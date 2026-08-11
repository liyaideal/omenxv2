CREATE OR REPLACE FUNCTION public.roll_sports_matches()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  m record;
  o record;
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
BEGIN
  FOR m IN
    SELECT id, start_date, end_date
    FROM public.events
    WHERE event_subtype = 'SPORTS_MATCH'
      AND end_date IS NOT NULL
      AND end_date <= now()
    ORDER BY end_date
  LOOP
    IF EXISTS (SELECT 1 FROM public.events WHERE id = m.id AND is_resolved = false) THEN
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
          SET is_resolved = true,
              settled_at = now(),
              lifecycle_status = 'SETTLED',
              winning_option_id = win_id
          WHERE id = m.id;

        paid := paid + public.settle_spot_event(m.id);
        settled := settled + 1;
      END IF;
    END IF;

    idx := idx + 1;
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
          -- keep the fixture metadata in sync: a rescheduled match is not live
          metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
            'kickoff_at', to_char(new_start at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
            'live', false,
            'minute', NULL,
            'phase', NULL,
            'score', NULL
          ),
          updated_at = now()
      WHERE id = m.id;

    p := round((0.35 + random() * 0.30)::numeric, 4);
    idx := 0;
    FOR o IN SELECT id FROM public.event_options WHERE event_id = m.id ORDER BY id LOOP
      idx := idx + 1;
      UPDATE public.event_options
        SET price = CASE WHEN idx = 1 THEN p ELSE round((1 - p)::numeric, 4) END,
            is_winner = false,
            final_price = NULL,
            updated_at = now()
        WHERE id = o.id;
    END LOOP;

    rescheduled := rescheduled + 1;
  END LOOP;

  RETURN jsonb_build_object('settled', settled, 'rescheduled', rescheduled, 'positions_paid', paid);
END;
$function$;

-- one-off backfill: repair fixtures whose kickoff_at is stale relative to start_date
UPDATE public.events
SET metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'kickoff_at', to_char(start_date at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      'live', false,
      'minute', NULL,
      'phase', NULL,
      'score', NULL
    ),
    updated_at = now()
WHERE event_subtype = 'SPORTS_MATCH'
  AND is_resolved = false
  AND start_date > now()
  AND (metadata->>'kickoff_at') IS DISTINCT FROM to_char(start_date at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"');