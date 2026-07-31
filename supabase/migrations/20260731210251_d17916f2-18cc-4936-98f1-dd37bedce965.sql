CREATE OR REPLACE FUNCTION public.sim_market_activity_tick()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  e record;
  n int := 0;
  i int;
  rows_for_event int;
  pick record;
  amt numeric;
  tier int;
  max_boost int;
  ladder int[];
  opt_count int;
  yes_label text;
  is_yes_val boolean;
  notional_sum numeric;
  cur_vol numeric;
  tier_vol numeric;
BEGIN
  FOR e IN
    SELECT ev.id, ev.name, ev.category, ev.side_labels->>'yes' AS yes_alias
    FROM public.events ev
    WHERE ev.is_resolved = false
      AND (ev.end_date IS NULL OR ev.end_date > now())
    LIMIT 60
  LOOP
    SELECT COALESCE(cbc.max_leverage, 1) INTO max_boost
    FROM public.category_boost_configs cbc
    WHERE lower(cbc.category) = lower(e.category) AND cbc.enabled = true;
    IF max_boost IS NULL THEN max_boost := 1; END IF;
    ladder := ARRAY(SELECT b FROM unnest(ARRAY[1,2,3,5,10,20,50]) AS b WHERE b <= max_boost);

    SELECT count(*) INTO opt_count FROM public.event_options WHERE event_id = e.id;

    yes_label := NULL;
    IF opt_count <= 2 THEN
      SELECT o.label INTO yes_label FROM public.event_options o
      WHERE o.event_id = e.id AND e.yes_alias IS NOT NULL
        AND lower(btrim(o.label)) = lower(btrim(e.yes_alias)) LIMIT 1;
      IF yes_label IS NULL THEN
        SELECT o.label INTO yes_label FROM public.event_options o
        WHERE o.event_id = e.id AND o.label ~* '(^|[-_ ])yes$' LIMIT 1;
      END IF;
      IF yes_label IS NULL THEN
        SELECT o.label INTO yes_label FROM public.event_options o
        WHERE o.event_id = e.id ORDER BY o.created_at, o.id LIMIT 1;
      END IF;
    END IF;

    -- Volume-tiered activity: busier books get more prints per tick.
    SELECT CASE
             WHEN COALESCE(NULLIF(btrim(ev.volume), ''), '0') ~ '^[0-9]+(\.[0-9]+)?$'
               THEN COALESCE(NULLIF(btrim(ev.volume), ''), '0')::numeric
             ELSE NULL
           END
      INTO tier_vol
    FROM public.events ev WHERE ev.id = e.id;

    IF tier_vol IS NOT NULL AND tier_vol >= 10000000 THEN
      rows_for_event := 2 + floor(random() * 5)::int;
    ELSIF tier_vol IS NOT NULL AND tier_vol >= 1000000 THEN
      rows_for_event := 1 + floor(random() * 3)::int;
    ELSE
      rows_for_event := floor(random() * 3)::int;
    END IF;

    notional_sum := 0;
    FOR i IN 1..rows_for_event LOOP
      SELECT o.label AS label, o.price AS price INTO pick
      FROM public.event_options o
      WHERE o.event_id = e.id
      ORDER BY random() * (1.0 / GREATEST(o.price, 0.01)) ASC
      LIMIT 1;
      IF pick IS NULL THEN CONTINUE; END IF;
      amt := round((5 * power(100, random()))::numeric, 2);
      tier := ladder[1 + floor(random() * GREATEST(array_length(ladder, 1), 1))::int];

      IF opt_count > 2 THEN
        is_yes_val := (random() < 0.62);
      ELSE
        is_yes_val := (yes_label IS NOT NULL
                       AND lower(btrim(pick.label)) = lower(btrim(yes_label)));
      END IF;

      INSERT INTO public.market_activity (event_name, option_label, amount, boost, is_yes, created_at)
      VALUES (e.name, pick.label, amt, COALESCE(tier, 1), is_yes_val, now() - (random() * interval '2 minutes'));
      notional_sum := notional_sum + amt * COALESCE(tier, 1);
      n := n + 1;
    END LOOP;

    IF notional_sum > 0 THEN
      SELECT CASE
               WHEN COALESCE(NULLIF(btrim(ev.volume), ''), '0') ~ '^[0-9]+(\.[0-9]+)?$'
                 THEN COALESCE(NULLIF(btrim(ev.volume), ''), '0')::numeric
               ELSE NULL
             END
        INTO cur_vol
      FROM public.events ev WHERE ev.id = e.id;

      IF cur_vol IS NOT NULL THEN
        UPDATE public.events
        SET volume = (cur_vol + notional_sum)::text
        WHERE id = e.id;
      END IF;
    END IF;
  END LOOP;

  DELETE FROM public.market_activity WHERE created_at < now() - interval '48 hours';
  RETURN n;
END;
$function$;