-- 1. Side marker on the anonymised activity feed.
ALTER TABLE public.market_activity ADD COLUMN IF NOT EXISTS is_yes boolean;

-- 2. Recording trigger: derive the side from the trade itself.
--    Binary events: unchanged semantics (only buys are recorded; is_yes is the
--    label-vs-yes-option comparison the client used to do).
--    Multi events: buy -> Yes leg, sell -> No leg on that option.
CREATE OR REPLACE FUNCTION public.record_market_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_event_id text;
  v_alias text;
  v_opt_count int := 2;
  v_yes_label text;
  v_is_yes boolean;
BEGIN
  IF NEW.status <> 'Filled' THEN
    RETURN NEW;
  END IF;

  SELECT e.id, e.side_labels->>'yes'
    INTO v_event_id, v_alias
  FROM public.events e
  WHERE e.name = NEW.event_name
  ORDER BY e.created_at DESC
  LIMIT 1;

  IF v_event_id IS NOT NULL THEN
    SELECT count(*) INTO v_opt_count FROM public.event_options WHERE event_id = v_event_id;
  END IF;

  IF v_opt_count > 2 THEN
    IF NEW.side = 'buy' THEN
      v_is_yes := true;
    ELSIF NEW.side = 'sell' THEN
      v_is_yes := false;
    ELSE
      RETURN NEW;
    END IF;
  ELSE
    IF NEW.side <> 'buy' THEN
      RETURN NEW;
    END IF;
    IF v_event_id IS NOT NULL THEN
      SELECT o.label INTO v_yes_label
      FROM public.event_options o
      WHERE o.event_id = v_event_id
        AND v_alias IS NOT NULL
        AND lower(btrim(o.label)) = lower(btrim(v_alias))
      LIMIT 1;
      IF v_yes_label IS NULL THEN
        SELECT o.label INTO v_yes_label
        FROM public.event_options o
        WHERE o.event_id = v_event_id AND o.label ~* '(^|[-_ ])yes$'
        LIMIT 1;
      END IF;
      IF v_yes_label IS NULL THEN
        SELECT o.label INTO v_yes_label
        FROM public.event_options o
        WHERE o.event_id = v_event_id
        ORDER BY o.created_at, o.id
        LIMIT 1;
      END IF;
    END IF;
    v_is_yes := (v_yes_label IS NOT NULL
                 AND lower(btrim(NEW.option_label)) = lower(btrim(v_yes_label)));
  END IF;

  -- Legacy display prefix always wins as a No marker.
  IF NEW.option_label ~* '^no:\s*' THEN
    v_is_yes := false;
  END IF;

  INSERT INTO public.market_activity (event_name, option_label, amount, boost, is_yes, created_at)
  VALUES (NEW.event_name, NEW.option_label, NEW.amount, COALESCE(NEW.leverage, 1), v_is_yes, now());
  RETURN NEW;
END;
$fn$;

-- Pending -> Filled fill trigger must no longer filter on side='buy' (multi No
-- legs are submitted as sells). The function itself decides what to record.
DROP TRIGGER IF EXISTS trg_record_market_activity_fill ON public.trades;
CREATE TRIGGER trg_record_market_activity_fill
AFTER UPDATE ON public.trades
FOR EACH ROW
WHEN (OLD.status = 'Pending' AND NEW.status = 'Filled')
EXECUTE FUNCTION public.record_market_activity();

DROP TRIGGER IF EXISTS trades_record_market_activity ON public.trades;
CREATE TRIGGER trades_record_market_activity
AFTER INSERT ON public.trades
FOR EACH ROW EXECUTE FUNCTION public.record_market_activity();

-- 3. Simulated feed: mixed Yes/No rows on multi events, label-derived on binary.
CREATE OR REPLACE FUNCTION public.sim_market_activity_tick()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
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

    rows_for_event := floor(random() * 4)::int;
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
        -- Healthy mix so the board feed shows both Backed Yes and Backed No.
        is_yes_val := (random() < 0.62);
      ELSE
        is_yes_val := (yes_label IS NOT NULL
                       AND lower(btrim(pick.label)) = lower(btrim(yes_label)));
      END IF;

      INSERT INTO public.market_activity (event_name, option_label, amount, boost, is_yes, created_at)
      VALUES (e.name, pick.label, amt, COALESCE(tier, 1), is_yes_val, now() - (random() * interval '5 minutes'));
      n := n + 1;
    END LOOP;
  END LOOP;
  DELETE FROM public.market_activity WHERE created_at < now() - interval '48 hours';
  RETURN n;
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.sim_market_activity_tick() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.record_market_activity() FROM anon, authenticated, PUBLIC;
