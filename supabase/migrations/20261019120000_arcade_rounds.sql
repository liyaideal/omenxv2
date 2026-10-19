-- ============================================================
-- Quick Play (arcade) rounds — 30s / 1m Up/Down on the SPOT rail
-- CPO 2026-10-19: Table-style play moves out of the 5m/15m page into a
-- separate zone. Crypto tables run 24/7 (30s + 1m); US-stock tables run
-- 1m rounds during the cash session only (09:30–16:00 ET, Mon–Fri).
--
-- Design (Lovable demo engine — applied to the live DB the same day)
--   • arcade_rounds is the source of truth for the table UI: one row per
--     round with a seed. The price path is a deterministic LCG walk from
--     that seed (same math on the client, src/lib/arcade/arcadePath.ts),
--     so what the player watched and what the engine settles agree.
--     Every table of a symbol (30s and 1m) reads ONE stream: a 1m round
--     is exactly the two 30s rounds it spans (arcade_state_at).
--     Real platform: real reference price; this file is demo only.
--   • An events + event_options pair is still written per round so spot
--     positions / trades / Portfolio / posters keep working unchanged.
--     Event names carry the round start so fetchSpotSides never pairs a
--     leg from the previous round (names are matched, option ids differ).
--   • settle_arcade_round matches positions by option_id ONLY (rounds are
--     seconds apart; settle_spot_event's name+window match would catch the
--     next round's legs). Payoff = spot: $1/share if won, 0 if lost, 5 %
--     winning commission net of the entry fee, cash → profiles.spot_balance.
--     close == open → round VOID: every leg refunded at cost.
--   • pg_cron 1.6 runs roll_arcade_rounds every 30 seconds (job 22).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.arcade_rounds (
  id           text PRIMARY KEY,                 -- arcade-btc-30s-20261019032530
  symbol       text NOT NULL,                    -- BTC / ETH / SOL / AAPL / NVDA / TSLA / COIN
  kind         text NOT NULL,                    -- crypto | stock
  tf           text NOT NULL,                    -- 30s | 1m
  start_at     timestamptz NOT NULL,
  end_at       timestamptz NOT NULL,
  open_price   double precision NOT NULL,
  close_price  double precision,
  seed         bigint NOT NULL,                  -- 32-bit LCG state at the open
  steps        integer NOT NULL,                 -- draws in the path (4 per second); path = steps + 1 points
  sigma        double precision NOT NULL,        -- per-step vol (fraction)
  winner       text,                             -- up | down | void (NULL while open)
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS arcade_rounds_table_idx ON public.arcade_rounds (symbol, tf, end_at DESC);
ALTER TABLE public.arcade_rounds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS arcade_rounds_read ON public.arcade_rounds;
CREATE POLICY arcade_rounds_read ON public.arcade_rounds FOR SELECT USING (true);
GRANT SELECT ON public.arcade_rounds TO anon, authenticated;

-- Deterministic path. LCG: x = (x*1664525 + 1013904223) mod 2^32, r = x/2^32.
-- double precision throughout so the JS twin (IEEE doubles, same op order)
-- lands on the same numbers — verified to the last digit on 2026-10-19.
CREATE OR REPLACE FUNCTION public.arcade_path(p_seed bigint, p_open double precision, p_steps integer, p_sigma double precision)
RETURNS double precision[]
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
  x bigint := p_seed % 4294967296;
  p double precision := p_open;
  out double precision[] := ARRAY[p_open];
  i int;
  r double precision;
BEGIN
  -- p_steps draws; the path has p_steps + 1 points (open first)
  FOR i IN 1..p_steps LOOP
    x := (x * 1664525 + 1013904223) % 4294967296;
    r := x::double precision / 4294967296::double precision;
    p := p * (1 + (r - 0.5) * 2 * p_sigma);
    out := array_append(out, p);
  END LOOP;
  RETURN out;
END;
$$;

CREATE OR REPLACE FUNCTION public.arcade_close(p_seed bigint, p_open double precision, p_steps integer, p_sigma double precision)
RETURNS double precision
LANGUAGE sql IMMUTABLE
AS $$ SELECT (public.arcade_path(p_seed, p_open, p_steps, p_sigma))[p_steps + 1]; $$;

-- LCG state after n draws (so a later round continues the same stream)
CREATE OR REPLACE FUNCTION public.arcade_advance(p_seed bigint, p_n integer)
RETURNS bigint
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE x bigint := p_seed % 4294967296; i int;
BEGIN
  FOR i IN 1..p_n LOOP x := (x * 1664525 + 1013904223) % 4294967296; END LOOP;
  RETURN x;
END;
$$;

-- (seed, price) of a symbol's stream at a 30-second boundary. Every table of a
-- symbol (30s and 1m) reads the same stream, so prices agree across tables and
-- a 1m round is exactly the two 30s rounds it spans.
CREATE OR REPLACE FUNCTION public.arcade_state_at(p_symbol text, p_at timestamptz, OUT seed bigint, OUT price double precision)
LANGUAGE plpgsql STABLE
AS $$
DECLARE r record;
BEGIN
  SELECT * INTO r FROM public.arcade_rounds WHERE symbol = p_symbol AND start_at = p_at ORDER BY steps LIMIT 1;
  IF FOUND THEN seed := r.seed; price := r.open_price; RETURN; END IF;
  SELECT * INTO r FROM public.arcade_rounds WHERE symbol = p_symbol AND end_at = p_at ORDER BY steps LIMIT 1;
  IF FOUND THEN seed := public.arcade_advance(r.seed, r.steps); price := COALESCE(r.close_price, public.arcade_close(r.seed, r.open_price, r.steps, r.sigma)); RETURN; END IF;
  SELECT * INTO r FROM public.arcade_rounds WHERE symbol = p_symbol AND tf = '1m' AND start_at = p_at - interval '30 seconds' LIMIT 1;
  IF FOUND THEN seed := public.arcade_advance(r.seed, 120); price := (public.arcade_path(r.seed, r.open_price, 120, r.sigma))[121]; RETURN; END IF;
  seed := NULL; price := NULL;
END;
$$;

-- US cash session (09:30–16:00 ET, Mon–Fri). No holiday calendar in the demo.
CREATE OR REPLACE FUNCTION public.us_session_open(p_at timestamptz DEFAULT now())
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT extract(isodow FROM (p_at AT TIME ZONE 'America/New_York')) BETWEEN 1 AND 5
     AND (p_at AT TIME ZONE 'America/New_York')::time >= time '09:30'
     AND (p_at AT TIME ZONE 'America/New_York')::time <  time '16:00';
$$;

-- Settle one round's spot legs by option_id. p_void = true refunds at cost.
CREATE OR REPLACE FUNCTION public.settle_arcade_round(p_event_id text, p_void boolean DEFAULT false)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  ev record;
  win_label text;
  p record;
  proceeds numeric;
  v_profit numeric;
  v_fee numeric;
  v_wc numeric;
  v_cash numeric;
  n int := 0;
BEGIN
  SELECT id, name INTO ev FROM public.events WHERE id = p_event_id;
  IF ev.id IS NULL THEN RETURN 0; END IF;

  SELECT label INTO win_label FROM public.event_options WHERE event_id = p_event_id AND is_winner = true LIMIT 1;
  IF NOT p_void AND win_label IS NULL THEN RETURN 0; END IF;

  FOR p IN
    SELECT pos.id, pos.user_id, pos.option_label, pos.size, pos.margin, pos.entry_price, pos.trade_id
    FROM public.positions pos
    WHERE pos.product_line = 'spot'
      AND pos.status = 'Open'
      AND pos.option_id IN (SELECT o.id FROM public.event_options o WHERE o.event_id = ev.id)
  LOOP
    IF p_void THEN
      proceeds := round(COALESCE(p.margin, 0), 2);
      v_profit := 0; v_wc := 0; v_cash := proceeds;
    ELSE
      proceeds := CASE WHEN p.option_label = win_label THEN COALESCE(p.size, 0) ELSE 0 END;
      v_profit := round(proceeds - COALESCE(p.margin, 0), 2);
      SELECT COALESCE(t.fee, 0) INTO v_fee FROM public.trades t WHERE t.id = p.trade_id;
      v_fee := COALESCE(v_fee, 0);
      v_wc := CASE WHEN v_profit > 0 THEN round(0.05 * GREATEST(v_profit - v_fee, 0), 2) ELSE 0 END;
      v_cash := round(proceeds - v_wc, 2);
    END IF;

    UPDATE public.positions
       SET status = 'Closed',
           closed_at = now(),
           mark_price = CASE WHEN p_void THEN p.entry_price WHEN p.option_label = win_label THEN 1 ELSE 0 END,
           pnl = v_profit,
           pnl_percent = CASE WHEN p.margin > 0 THEN round(v_profit / p.margin * 100, 2) ELSE 0 END,
           winning_commission = COALESCE(winning_commission, 0) + v_wc,
           close_reason = CASE WHEN p_void THEN 'void' ELSE 'settlement' END,
           updated_at = now()
     WHERE id = p.id AND status = 'Open';
    IF NOT FOUND THEN CONTINUE; END IF;

    IF p.trade_id IS NOT NULL THEN
      UPDATE public.trades SET status = 'Closed', pnl = v_profit, closed_at = now(), updated_at = now() WHERE id = p.trade_id;
    END IF;

    IF v_cash > 0 THEN
      UPDATE public.profiles SET spot_balance = COALESCE(spot_balance, 0) + v_cash, updated_at = now() WHERE user_id = p.user_id;
    END IF;

    INSERT INTO public.transactions (user_id, type, amount, account, description, status)
    VALUES (p.user_id,
            CASE WHEN p_void THEN 'trade_profit' WHEN v_profit >= 0 THEN 'trade_profit' ELSE 'trade_loss' END,
            v_profit, 'spot',
            CASE WHEN p_void THEN 'Round void · stake returned: ' || ev.name || ' · ' || p.option_label
                 ELSE 'Settled: ' || ev.name || ' · ' || p.option_label || ' · ' || CASE WHEN p.option_label = win_label THEN 'Won' ELSE 'Lost' END END,
            'completed');

    IF v_wc > 0 THEN
      INSERT INTO public.transactions (user_id, type, amount, account, description, status)
      VALUES (p.user_id, 'winning_commission', -v_wc, 'spot',
              'Winning commission · 5% · ' || p.option_label || ' · ' || ev.name, 'completed');
    END IF;
    n := n + 1;
  END LOOP;
  RETURN n;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.settle_arcade_round(text, boolean) FROM anon, authenticated;

-- Open one round (idempotent). Writes arcade_rounds + events + event_options.
CREATE OR REPLACE FUNCTION public.arcade_open_round(p_symbol text, p_name text, p_kind text, p_tf text, p_start timestamptz, p_open double precision, p_seed bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  secs int := CASE p_tf WHEN '30s' THEN 30 ELSE 60 END;
  p_end timestamptz := p_start + make_interval(secs => secs);
  rid text := 'arcade-' || lower(p_symbol) || '-' || p_tf || '-' || to_char(p_start AT TIME ZONE 'UTC', 'YYYYMMDDHH24MISS');
  ename text;
  v_seed bigint := COALESCE(p_seed, (('x' || substr(md5(rid), 1, 8))::bit(32)::bigint));
  v_sigma double precision := CASE WHEN p_kind = 'stock' THEN 0.00022 ELSE 0.00045 END;
BEGIN
  IF EXISTS (SELECT 1 FROM public.arcade_rounds WHERE id = rid) THEN RETURN false; END IF;
  ename := p_symbol || ' — up or down? (' || p_tf || ' · ' || to_char(p_start AT TIME ZONE 'UTC', 'HH24:MI:SS') || ' UTC)';

  INSERT INTO public.arcade_rounds (id, symbol, kind, tf, start_at, end_at, open_price, seed, steps, sigma)
  VALUES (rid, p_symbol, p_kind, p_tf, p_start, p_end, p_open, v_seed, secs * 4, v_sigma);

  INSERT INTO public.events (id, name, icon, category, description, rules, start_date, end_date,
    volume, is_resolved, price_label, side_labels, product_lines, event_subtype, lifecycle_status,
    base_price, freeze_time, expected_settlement_time)
  VALUES (rid, ename, CASE WHEN p_kind = 'stock' THEN '📈' ELSE '🟢' END, CASE WHEN p_kind = 'stock' THEN 'stocks' ELSE 'crypto' END,
    'Quick Play ' || p_tf || ' round on ' || p_name || '. Up pays $1 a share if the price at the end of the round is above the open ($' || round(p_open::numeric, 2) || ').',
    'Up wins if the price at the end of the round is above the open ($' || round(p_open::numeric, 2) || '); Down wins if below. Closes exactly at the open → round void, stakes returned.',
    p_start, p_end, '0', false, '$' || round(p_open::numeric, 2),
    '{"yes":"Up","no":"Down"}'::jsonb, ARRAY['spot'], 'ARCADE_UPDOWN_SPOT', 'TRADING',
    round(p_open::numeric, 2), NULL, p_end)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.event_options (id, event_id, label, price, is_winner)
  VALUES (rid || '-up', rid, 'Up', 0.5, false), (rid || '-down', rid, 'Down', 0.5, false)
  ON CONFLICT (id) DO NOTHING;
  RETURN true;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.arcade_open_round(text, text, text, text, timestamptz, double precision, bigint) FROM anon, authenticated;

-- The 30-second tick: settle due rounds, keep the current + next round open per table, prune.
CREATE OR REPLACE FUNCTION public.roll_arcade_rounds()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  tbl record;
  due record;
  st record;
  v_close double precision;
  v_winner text;
  v_open double precision;
  v_seed bigint;
  secs int;
  bucket timestamptz;
  i int;
  settled int := 0; opened int := 0; pruned int := 0; paid int := 0;
  del record;
BEGIN
  -- 1) settle due rounds
  FOR due IN SELECT * FROM public.arcade_rounds WHERE winner IS NULL AND end_at <= now() ORDER BY end_at LOOP
    v_close := public.arcade_close(due.seed, due.open_price, due.steps, due.sigma);
    v_winner := CASE WHEN v_close > due.open_price THEN 'up' WHEN v_close < due.open_price THEN 'down' ELSE 'void' END;
    UPDATE public.arcade_rounds SET close_price = v_close, winner = v_winner WHERE id = due.id;
    IF v_winner <> 'void' THEN
      UPDATE public.event_options SET final_price = 1, is_winner = true,  updated_at = now() WHERE event_id = due.id AND lower(label) = v_winner;
      UPDATE public.event_options SET final_price = 0, is_winner = false, updated_at = now() WHERE event_id = due.id AND lower(label) <> v_winner;
    END IF;
    UPDATE public.events
       SET is_resolved = true, settled_at = now(), close_price = round(v_close::numeric, 2), lifecycle_status = 'SETTLED',
           winning_option_id = CASE WHEN v_winner = 'void' THEN NULL ELSE due.id || '-' || v_winner END,
           settlement_description = CASE WHEN v_winner = 'void' THEN 'Round void · closed exactly at the open $' || round(due.open_price::numeric, 2)
                                         ELSE 'Round closed at $' || round(v_close::numeric, 2) || ' vs open $' || round(due.open_price::numeric, 2) END
     WHERE id = due.id;
    paid := paid + public.settle_arcade_round(due.id, v_winner = 'void');
    settled := settled + 1;
  END LOOP;

  -- 2) keep the current + next round open on every live table, all tables of a symbol on one stream
  FOR tbl IN
    SELECT * FROM (VALUES
      ('BTC',  'Bitcoin',  'crypto', '30s'), ('BTC',  'Bitcoin',  'crypto', '1m'),
      ('ETH',  'Ethereum', 'crypto', '30s'), ('ETH',  'Ethereum', 'crypto', '1m'),
      ('SOL',  'Solana',   'crypto', '30s'), ('SOL',  'Solana',   'crypto', '1m'),
      ('AAPL', 'Apple',    'stock',  '1m'),  ('NVDA', 'NVIDIA',   'stock',  '1m'),
      ('TSLA', 'Tesla',    'stock',  '1m'),  ('COIN', 'Coinbase', 'stock',  '1m')
    ) AS t(symbol, name, kind, tf)
  LOOP
    secs := CASE tbl.tf WHEN '30s' THEN 30 ELSE 60 END;
    FOR i IN 0..1 LOOP
      bucket := to_timestamp(floor(extract(epoch FROM now()) / secs) * secs) + make_interval(secs => i * secs);
      IF tbl.kind = 'stock' AND NOT public.us_session_open(bucket) THEN CONTINUE; END IF;
      IF EXISTS (SELECT 1 FROM public.arcade_rounds WHERE symbol = tbl.symbol AND tf = tbl.tf AND start_at = bucket) THEN CONTINUE; END IF;

      SELECT * INTO st FROM public.arcade_state_at(tbl.symbol, bucket);
      v_seed := st.seed; v_open := st.price;
      IF v_open IS NULL THEN
        -- bootstrap: last known print of the symbol, else a seed price
        v_open := COALESCE(
          (SELECT r.close_price FROM public.arcade_rounds r WHERE r.symbol = tbl.symbol AND r.close_price IS NOT NULL ORDER BY r.end_at DESC LIMIT 1),
          CASE tbl.kind
            WHEN 'stock' THEN (SELECT e.base_price::double precision FROM public.events e WHERE e.id LIKE 'us-' || lower(tbl.symbol) || '-updown-%' ORDER BY e.end_date DESC LIMIT 1)
            ELSE (SELECT e.close_price::double precision FROM public.events e WHERE e.id LIKE 'crypto-' || lower(tbl.symbol) || '-updown-5m-%' AND e.close_price IS NOT NULL ORDER BY e.end_date DESC LIMIT 1)
          END,
          CASE tbl.symbol WHEN 'BTC' THEN 68000 WHEN 'ETH' THEN 3550 WHEN 'SOL' THEN 215 WHEN 'AAPL' THEN 235 WHEN 'NVDA' THEN 184 WHEN 'TSLA' THEN 301 ELSE 270 END);
      END IF;

      IF public.arcade_open_round(tbl.symbol, tbl.name, tbl.kind, tbl.tf, bucket, v_open, v_seed) THEN opened := opened + 1; END IF;
    END LOOP;
  END LOOP;

  -- 3) prune settled rounds older than 6 h that nobody traded
  FOR del IN SELECT r.id FROM public.arcade_rounds r WHERE r.winner IS NOT NULL AND r.end_at < now() - interval '6 hours' LOOP
    IF EXISTS (SELECT 1 FROM public.positions p WHERE p.option_id IN (del.id || '-up', del.id || '-down')) THEN CONTINUE; END IF;
    DELETE FROM public.event_options WHERE event_id = del.id;
    DELETE FROM public.events WHERE id = del.id;
    DELETE FROM public.arcade_rounds WHERE id = del.id;
    pruned := pruned + 1;
  END LOOP;

  RETURN jsonb_build_object('settled', settled, 'opened', opened, 'pruned', pruned, 'positions_paid', paid);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.roll_arcade_rounds() FROM anon, authenticated;

-- pg_cron 1.6: 30-second schedule (job 22 on the live DB)
SELECT cron.unschedule(jobid) FROM cron.job WHERE command LIKE '%roll_arcade_rounds%';
SELECT cron.schedule('arcade_rounds_30s', '30 seconds', 'select public.roll_arcade_rounds();');
