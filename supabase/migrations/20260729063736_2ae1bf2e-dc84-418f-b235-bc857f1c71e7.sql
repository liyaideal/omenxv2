CREATE TABLE public.market_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text,
  option_label text,
  amount numeric,
  boost integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.market_activity TO anon;
GRANT SELECT ON public.market_activity TO authenticated;
GRANT ALL ON public.market_activity TO service_role;
ALTER TABLE public.market_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Market activity is public" ON public.market_activity FOR SELECT USING (true);
CREATE INDEX market_activity_event_created_idx ON public.market_activity (event_name, created_at DESC);

CREATE OR REPLACE FUNCTION public.record_market_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF NEW.side = 'buy' AND NEW.status = 'Filled' THEN
    INSERT INTO public.market_activity (event_name, option_label, amount, boost, created_at)
    VALUES (NEW.event_name, NEW.option_label, NEW.amount, COALESCE(NEW.leverage, 1), now());
  END IF;
  RETURN NEW;
END;
$fn$;

CREATE TRIGGER trades_record_market_activity
AFTER INSERT ON public.trades
FOR EACH ROW EXECUTE FUNCTION public.record_market_activity();

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
BEGIN
  FOR e IN
    SELECT ev.id, ev.name, ev.category
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
      INSERT INTO public.market_activity (event_name, option_label, amount, boost, created_at)
      VALUES (e.name, pick.label, amt, COALESCE(tier, 1), now() - (random() * interval '5 minutes'));
      n := n + 1;
    END LOOP;
  END LOOP;
  DELETE FROM public.market_activity WHERE created_at < now() - interval '48 hours';
  RETURN n;
END;
$fn$;