-- ============================================================
-- Quick Play v2 — BTC 30-second calls on a REAL three-exchange index
-- CPO 2026-10-27/28 (研发稿《BTCUSDT_30秒与1分钟涨跌产品设计_v1.0》+ her
-- amendments). Replaces the shared 30s/1m rounds for the BTC table:
--
--   • Every chip is its own 30-second contract (t0 = server accept time,
--     t1 = t0 + 30 s). No rounds, no cash-out. Cancel within 2 s at the
--     open price for the platform close fee (0.15 %).
--   • Index = median of three mid prices in USDT terms: Binance BTC/USDT,
--     Hyperliquid BTC (USDC ≈ USD, ÷ USDT-USD) and Coinbase BTC-USD
--     (÷ USDT-USD). A tick is valid with ≥ 2 fresh sources (median of 3,
--     mean of 2; two sources > 5 bps apart → invalid). Sampled once a
--     second by pg_cron + pg_net (job arcade_feed).
--   • Quote = the 研发稿 30 s model on 1-second index returns
--     (z30 / z60 / RV600 → sigmoid → clip 0.40–0.60 → 0.001 steps).
--     A quote is the latest valid tick; it is accepted while younger than
--     quote_ttl_ms and while the index has not drifted > 1 bp since.
--   • Fees: 3 % of the chip on entry (fee_u = round_half_up_cent), payout
--     if won = floor_to_cent(net / p), minus 5 % winning commission on the
--     profit. Tie or no valid S0/S1 → full refund, fee included.
--   • Limits: chips $5/10/25/50/100 · ≤ $500 open per account · ≤ 2 calls
--     per second per account · global worst_loss ≤ $10,000 (sum of open
--     win payouts − sum of open chips). Pauses: index invalid, market
--     breaker (> 10 bps in one second or 30-second realised vol > 20 bps,
--     30 s cool-down), loss breaker (platform net loss ≥ $1,000 / 60 min
--     or ≥ $2,000 / UTC day), table full.
--   • Demo-engine relaxations (parameters in arcade_params, documented in
--     docs/delivery/lite-arcade-spec-v2.md): ~1.2 s sampling via pg_cron + pg_net (spec 500 ms), tick_max_age 4 s,
--     quote_ttl_ms 2500 (spec 500), settle source age 2500 ms (spec 500),
--     model needs ≥ 120 s of history (spec 600 s; RV is scaled to 600 s),
--     no USDC settlement-cash check (spot_balance is the only ledger).
--   • The old arcade_rounds stream keeps running: the 5m/15m/1h/4h/1d
--     quick rounds and the home ticker read it. From this migration the
--     BTC leg of that stream is re-anchored to the real index each roll
--     (roll_arcade_rounds), so the site's BTC price and the cabinet agree.
-- ============================================================

-- ---------- parameters ----------
CREATE TABLE IF NOT EXISTS public.arcade_params (
  key  text PRIMARY KEY,
  num  double precision,
  txt  text,
  note text
);
INSERT INTO public.arcade_params (key, num, txt, note) VALUES
  ('live',                 1,     NULL, '0 pauses new calls for everyone (manual kill switch)'),
  ('sim_table',            1,     NULL, '1 = anonymous simulated calls fill the TABLE feed when the table is quiet (same precedent as market_activity)'),
  ('fee_rate',             0.03,  NULL, 'entry fee, included in the chip'),
  ('cancel_fee_rate',      0.0015,NULL, 'platform close fee charged on a 2-second cancel'),
  ('commission_rate',      0.05,  NULL, 'winning commission on profit'),
  ('cancel_window_ms',     2000,  NULL, NULL),
  ('duration_sec',         30,    NULL, NULL),
  ('quote_ttl_ms',         2500,  NULL, 'spec 500 ms; feed cadence ≈ 1.2 s'),
  ('drift_max_bps',        1,     NULL, 'index may not move more than this between quote and accept'),
  ('tick_max_age_ms',      4000,  NULL, 'latest tick older than this → index invalid (feed cadence ≈ 1.2 s, occasional 2–3 s gaps)'),
  ('settle_src_age_ms',    2500,  NULL, 'S1 must be at most this old at t1 (spec 500 ms; feed cadence ≈ 1.2 s)'),
  ('settle_wait_ms',       2000,  NULL, 'wait this long after t1 for late data before voiding'),
  ('min_history_sec',      120,   NULL, 'model needs this much valid 1-second history (spec 600)'),
  ('p_min',                0.40,  NULL, NULL),
  ('p_max',                0.60,  NULL, NULL),
  ('max_open_per_user',    500,   NULL, NULL),
  ('max_calls_per_sec',    2,     NULL, NULL),
  ('max_worst_loss',       10000, NULL, 'global: Σ open win payouts − Σ open chips'),
  ('loss_break_60m',       1000,  NULL, 'platform net loss on settled calls, rolling 60 min'),
  ('loss_break_day',       2000,  NULL, 'platform net loss on settled calls, UTC day'),
  ('breaker_1s_bps',       10,    NULL, 'one-second index move that trips the market breaker'),
  ('breaker_30s_bps',      20,    NULL, 'sqrt(Σ last-30 one-second returns²) that trips it'),
  ('breaker_cooldown_sec', 30,    NULL, NULL),
  ('src_spread_max_bps',   2,     NULL, 'a source with a wider bid/ask is dropped'),
  ('pair_dev_max_bps',     5,     NULL, 'with only two sources, disagreement beyond this → invalid'),
  ('model_intercept',      0.010495, NULL, '研发稿 2.1'),
  ('model_z30',            0.106198, NULL, NULL),
  ('model_z60',            0.030205, NULL, NULL),
  ('hl_spot_coin',         NULL,  '@142', 'Hyperliquid spot pair id for UBTC/USDC (spotMeta universe index 142); the perp book "BTC" carries funding premium and is NOT the spot mid')
ON CONFLICT (key) DO NOTHING;
ALTER TABLE public.arcade_params ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS arcade_params_read ON public.arcade_params;
CREATE POLICY arcade_params_read ON public.arcade_params FOR SELECT USING (true);
GRANT SELECT ON public.arcade_params TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.arcade_param(p_key text)
RETURNS double precision LANGUAGE sql STABLE
AS $$ SELECT num FROM public.arcade_params WHERE key = p_key $$;

-- ---------- index ticks (one row per second) ----------
CREATE TABLE IF NOT EXISTS public.arcade_index_ticks (
  ts          timestamptz PRIMARY KEY,            -- event time = harvest time
  binance     double precision,                   -- mids in USDT terms (NULL = source invalid this second)
  hyperliquid double precision,
  coinbase    double precision,
  usdt_usd    double precision,
  idx         double precision,                   -- NULL when invalid
  valid       boolean NOT NULL DEFAULT false,
  reason      text,                               -- why invalid
  r1          double precision,                   -- ln(S_t / S_{t-1})
  r30         double precision,
  r60         double precision,
  rv600       double precision,
  p_up        numeric(4,3),                       -- 30 s quote at this tick (NULL = no quote)
  src_raw     jsonb                               -- {binance:{bid,ask}, hyperliquid:{..}, coinbase:{..}} for audit
);
CREATE INDEX IF NOT EXISTS arcade_index_ticks_valid_idx ON public.arcade_index_ticks (ts DESC) WHERE valid;
ALTER TABLE public.arcade_index_ticks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS arcade_index_ticks_read ON public.arcade_index_ticks;
CREATE POLICY arcade_index_ticks_read ON public.arcade_index_ticks FOR SELECT USING (true);
GRANT SELECT ON public.arcade_index_ticks TO anon, authenticated;

-- in-flight pg_net request ids. pg_net's worker sends queued requests about
-- once a second, so a batch fired at second N is usually answered during
-- second N+1 or N+2; batches are harvested FIFO once all four answers are in
-- (or 3 s have passed), one batch per tick.
CREATE TABLE IF NOT EXISTS public.arcade_feed_req (
  batch  timestamptz NOT NULL,
  src    text NOT NULL,
  req_id bigint,
  PRIMARY KEY (batch, src)
);

-- table-wide state, one row (what the cabinet shows as PAUSED / TABLE FULL)
CREATE TABLE IF NOT EXISTS public.arcade_table_state (
  id             int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  paused_reason  text,                            -- NULL | index | breaker | loss | full | off
  breaker_until  timestamptz,
  worst_loss     numeric(12,2) NOT NULL DEFAULT 0,
  open_calls     int NOT NULL DEFAULT 0,
  open_stake     numeric(12,2) NOT NULL DEFAULT 0,
  loss_60m       numeric(12,2) NOT NULL DEFAULT 0,
  loss_day       numeric(12,2) NOT NULL DEFAULT 0,
  updated_at     timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.arcade_table_state (id) VALUES (1) ON CONFLICT DO NOTHING;
ALTER TABLE public.arcade_table_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS arcade_table_state_read ON public.arcade_table_state;
CREATE POLICY arcade_table_state_read ON public.arcade_table_state FOR SELECT USING (true);
GRANT SELECT ON public.arcade_table_state TO anon, authenticated;

-- ---------- calls ----------
CREATE TABLE IF NOT EXISTS public.arcade_calls (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid,                               -- NULL = simulated table filler (never settles cash)
  bot_name    text,                               -- masked display name for the TABLE feed
  side        text NOT NULL CHECK (side IN ('up','down')),
  gross       numeric(10,2) NOT NULL,             -- the chip
  fee         numeric(10,2) NOT NULL,
  net         numeric(10,2) NOT NULL,
  p           numeric(4,3) NOT NULL,              -- p_selected
  p_up        numeric(4,3) NOT NULL,
  win_payout  numeric(10,2) NOT NULL,             -- floor_to_cent(net / p), before commission
  quote_ts    timestamptz NOT NULL,
  quote_idx   double precision NOT NULL,
  t0          timestamptz NOT NULL,
  t1          timestamptz NOT NULL,
  s0          double precision, s0_ts timestamptz,
  s1          double precision, s1_ts timestamptz,
  status      text NOT NULL DEFAULT 'open' CHECK (status IN ('open','cancelled','won','lost','void')),
  pnl         numeric(10,2),                      -- cash result vs the chip (won: payout − commission − gross; lost: −gross; void: 0; cancelled: −cancel_fee)
  commission  numeric(10,2),
  cancel_fee  numeric(10,2),
  settled_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS arcade_calls_open_idx ON public.arcade_calls (t1) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS arcade_calls_user_idx ON public.arcade_calls (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS arcade_calls_settled_idx ON public.arcade_calls (settled_at DESC) WHERE user_id IS NOT NULL;
ALTER TABLE public.arcade_calls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS arcade_calls_own ON public.arcade_calls;
CREATE POLICY arcade_calls_own ON public.arcade_calls FOR SELECT USING (auth.uid() = user_id);
GRANT SELECT ON public.arcade_calls TO authenticated;

-- first-entry disclaimer, once per account
CREATE TABLE IF NOT EXISTS public.arcade_acks (
  user_id     uuid PRIMARY KEY,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  version     int NOT NULL DEFAULT 1
);
ALTER TABLE public.arcade_acks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS arcade_acks_own ON public.arcade_acks;
CREATE POLICY arcade_acks_own ON public.arcade_acks FOR SELECT USING (auth.uid() = user_id);
GRANT SELECT ON public.arcade_acks TO authenticated;

CREATE OR REPLACE FUNCTION public.arcade_accept_terms()
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to play'; END IF;
  INSERT INTO public.arcade_acks (user_id) VALUES (auth.uid())
  ON CONFLICT (user_id) DO UPDATE SET accepted_at = public.arcade_acks.accepted_at
  RETURNING accepted_at INTO v;
  RETURN v;
END; $$;
GRANT EXECUTE ON FUNCTION public.arcade_accept_terms() TO authenticated;

-- ---------- helpers ----------
CREATE OR REPLACE FUNCTION public.arcade_round_half_up(p numeric, p_scale int)
RETURNS numeric LANGUAGE sql IMMUTABLE
AS $$ SELECT floor(p * power(10, p_scale) + 0.5) / power(10, p_scale) $$;

-- median of the non-null members; NULL when fewer than two
CREATE OR REPLACE FUNCTION public.arcade_median3(a double precision, b double precision, c double precision)
RETURNS double precision LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
    WHEN a IS NOT NULL AND b IS NOT NULL AND c IS NOT NULL THEN greatest(least(a,b), least(greatest(a,b), c))
    WHEN a IS NOT NULL AND b IS NOT NULL THEN (a + b) / 2
    WHEN a IS NOT NULL AND c IS NOT NULL THEN (a + c) / 2
    WHEN b IS NOT NULL AND c IS NOT NULL THEN (b + c) / 2
    ELSE NULL END
$$;

-- ---------- the feed tick (pg_cron, every second) ----------
-- 1) harvest the responses of the requests fired one second ago
-- 2) build the tick: validity, index, model features, quote
-- 3) refresh the table state (breakers, exposure)
-- 4) settle due calls, top up the simulated table
-- 5) fire the next three requests (+ USDT-USD) and remember their ids
CREATE OR REPLACE FUNCTION public.arcade_feed_tick()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  r record; bt record;
  v_body jsonb;
  bid double precision; ask double precision;
  v_bin double precision; v_hl double precision; v_cb double precision; v_usdt double precision;
  raw jsonb := '{}'::jsonb;
  v_idx double precision; v_valid boolean := false; v_reason text := NULL;
  n_src int := 0; n_resp int := 0;
  spread_max double precision := public.arcade_param('src_spread_max_bps') / 10000.0;
  pair_max   double precision := public.arcade_param('pair_dev_max_bps') / 10000.0;
  v_now timestamptz := clock_timestamp();
  v_ts timestamptz;
  v_last timestamptz;
  harvested boolean := false;
  prev record; s30 record; s60 record;
  v_r1 double precision; v_r30 double precision; v_r60 double precision; v_rv double precision; v_n int;
  z30 double precision; z60 double precision; v_p numeric(4,3);
  min_hist int := public.arcade_param('min_history_sec')::int;
  st record;
  v_rv30 double precision;
  v_until timestamptz;
  v_reason_state text := NULL;
  v_worst numeric; v_open int; v_stake numeric; v_l60 numeric; v_lday numeric;
  hl_coin text := coalesce((SELECT txt FROM public.arcade_params WHERE key = 'hl_spot_coin'), '@142');
BEGIN
  -- never overlap two ticks
  IF NOT pg_try_advisory_xact_lock(7202610281) THEN RETURN; END IF;

  -- 1) harvest the oldest complete batch (FIFO; one per tick) -------------
  FOR bt IN SELECT q.batch FROM public.arcade_feed_req q WHERE q.batch <= v_now - interval '0.8 seconds' GROUP BY q.batch ORDER BY q.batch LOOP
    SELECT count(h.id), max(h.created) INTO n_resp, v_ts
      FROM public.arcade_feed_req q LEFT JOIN net._http_response h ON h.id = q.req_id WHERE q.batch = bt.batch;
    IF n_resp < 4 AND bt.batch > v_now - interval '3 seconds' THEN EXIT; END IF;   -- still in flight: wait
    v_ts := coalesce(v_ts, v_now);
    SELECT max(ts) INTO v_last FROM public.arcade_index_ticks;
    IF v_last IS NOT NULL AND v_ts < v_last + interval '0.3 seconds' THEN
      -- pg_net answered two batches in one go: the second is the same second, drop it
      DELETE FROM public.arcade_feed_req WHERE batch = bt.batch;
      CONTINUE;
    END IF;
    FOR r IN SELECT q.src, q.req_id FROM public.arcade_feed_req q WHERE q.batch = bt.batch LOOP
      v_body := NULL; bid := NULL; ask := NULL;
      BEGIN
        SELECT CASE WHEN h.status_code = 200 THEN h.content::jsonb END INTO v_body
        FROM net._http_response h WHERE h.id = r.req_id;
      EXCEPTION WHEN others THEN v_body := NULL;
      END;
      IF v_body IS NOT NULL THEN
        BEGIN
          IF r.src = 'binance' THEN
            bid := (v_body->>'bidPrice')::double precision; ask := (v_body->>'askPrice')::double precision;
          ELSIF r.src = 'hyperliquid' THEN
            bid := (v_body->'levels'->0->0->>'px')::double precision; ask := (v_body->'levels'->1->0->>'px')::double precision;
          ELSIF r.src = 'coinbase' OR r.src = 'usdt' THEN
            bid := (v_body->>'bid')::double precision; ask := (v_body->>'ask')::double precision;
          END IF;
        EXCEPTION WHEN others THEN bid := NULL; ask := NULL;
        END;
      END IF;
      IF bid IS NOT NULL AND ask IS NOT NULL AND bid > 0 AND ask >= bid THEN
        raw := raw || jsonb_build_object(r.src, jsonb_build_object('bid', bid, 'ask', ask));
        IF r.src = 'usdt' THEN
          v_usdt := (bid + ask) / 2;
        ELSIF (ask - bid) / bid <= spread_max THEN
          IF r.src = 'binance' THEN v_bin := (bid + ask) / 2;
          ELSIF r.src = 'hyperliquid' THEN v_hl := (bid + ask) / 2;
          ELSIF r.src = 'coinbase' THEN v_cb := (bid + ask) / 2; END IF;
        END IF;
      END IF;
    END LOOP;
    DELETE FROM public.arcade_feed_req WHERE batch = bt.batch;
    harvested := true;
    EXIT;
  END LOOP;
  DELETE FROM public.arcade_feed_req WHERE batch < v_now - interval '10 seconds';

  IF harvested THEN
    -- USD-quoted sources → USDT terms (USDC ≈ USD). No rate → those sources drop.
    IF v_usdt IS NULL OR v_usdt <= 0 THEN v_hl := NULL; v_cb := NULL; v_reason := 'no USDT-USD rate';
    ELSE v_hl := v_hl / v_usdt; v_cb := v_cb / v_usdt; END IF;

    n_src := (v_bin IS NOT NULL)::int + (v_hl IS NOT NULL)::int + (v_cb IS NOT NULL)::int;
    IF n_src >= 2 THEN
      v_idx := public.arcade_median3(v_bin, v_hl, v_cb);
      v_valid := true;
      IF n_src = 2 AND abs(coalesce(v_bin, v_hl) - coalesce(v_cb, v_hl)) / v_idx > pair_max THEN
        v_valid := false; v_reason := 'two sources disagree';
      END IF;
    ELSE
      v_valid := false; v_reason := coalesce(v_reason, 'fewer than two sources');
    END IF;
    IF NOT v_valid THEN v_idx := NULL; END IF;

    -- 2) model features on valid 1-second history ---------------------------
    v_r1 := NULL; v_r30 := NULL; v_r60 := NULL; v_rv := NULL; v_p := NULL;
    IF v_valid THEN
      SELECT * INTO prev FROM public.arcade_index_ticks t WHERE t.valid AND t.ts > v_ts - interval '1.6 seconds' AND t.ts < v_ts ORDER BY t.ts DESC LIMIT 1;
      IF prev.idx IS NOT NULL THEN v_r1 := ln(v_idx / prev.idx); END IF;
      SELECT * INTO s30 FROM public.arcade_index_ticks t WHERE t.valid AND t.ts BETWEEN v_ts - interval '31.5 seconds' AND v_ts - interval '28.5 seconds' ORDER BY abs(extract(epoch FROM (t.ts - (v_ts - interval '30 seconds')))) LIMIT 1;
      SELECT * INTO s60 FROM public.arcade_index_ticks t WHERE t.valid AND t.ts BETWEEN v_ts - interval '61.5 seconds' AND v_ts - interval '58.5 seconds' ORDER BY abs(extract(epoch FROM (t.ts - (v_ts - interval '60 seconds')))) LIMIT 1;
      IF s30.idx IS NOT NULL THEN v_r30 := ln(v_idx / s30.idx); END IF;
      IF s60.idx IS NOT NULL THEN v_r60 := ln(v_idx / s60.idx); END IF;
      SELECT count(*), sum(t.r1 * t.r1) INTO v_n, v_rv FROM public.arcade_index_ticks t WHERE t.valid AND t.r1 IS NOT NULL AND t.ts > v_ts - interval '600 seconds';
      IF v_r1 IS NOT NULL THEN v_n := v_n + 1; v_rv := coalesce(v_rv, 0) + v_r1 * v_r1; END IF;
      IF v_n >= min_hist AND v_r30 IS NOT NULL AND v_r60 IS NOT NULL THEN
        v_rv := v_rv * 600.0 / v_n;                                  -- scale to a full 600 s window
        z30 := greatest(-5, least(5, v_r30 / sqrt(greatest(v_rv * 30 / 600, 1e-12))));
        z60 := greatest(-5, least(5, v_r60 / sqrt(greatest(v_rv * 60 / 600, 1e-12))));
        v_p := public.arcade_round_half_up(
                 greatest(public.arcade_param('p_min'), least(public.arcade_param('p_max'),
                   1 / (1 + exp(-(public.arcade_param('model_intercept') + public.arcade_param('model_z30') * z30 + public.arcade_param('model_z60') * z60)))))::numeric, 3);
      ELSE
        v_rv := NULL;
      END IF;
    END IF;

    INSERT INTO public.arcade_index_ticks (ts, binance, hyperliquid, coinbase, usdt_usd, idx, valid, reason, r1, r30, r60, rv600, p_up, src_raw)
    VALUES (v_ts, v_bin, v_hl, v_cb, v_usdt, v_idx, v_valid, v_reason, v_r1, v_r30, v_r60, v_rv, v_p, raw);
  ELSE
    -- nothing harvested this second: the table is only as fresh as the last tick
    SELECT t.valid, t.r1, t.p_up, t.ts INTO v_valid, v_r1, v_p, v_ts FROM public.arcade_index_ticks t ORDER BY ts DESC LIMIT 1;
    IF v_ts IS NULL OR v_ts < v_now - make_interval(secs => public.arcade_param('tick_max_age_ms') / 1000.0) THEN v_valid := false; END IF;
  END IF;

  -- 3) table state ------------------------------------------------------------
  SELECT * INTO st FROM public.arcade_table_state WHERE id = 1 FOR UPDATE;
  v_until := st.breaker_until;
  IF harvested AND v_valid THEN
    SELECT sqrt(sum(t.r1 * t.r1)) INTO v_rv30 FROM public.arcade_index_ticks t WHERE t.valid AND t.r1 IS NOT NULL AND t.ts > v_ts - interval '30 seconds';
    IF abs(coalesce(v_r1, 0)) > public.arcade_param('breaker_1s_bps') / 10000.0
       OR coalesce(v_rv30, 0) > public.arcade_param('breaker_30s_bps') / 10000.0 THEN
      v_until := v_now + make_interval(secs => public.arcade_param('breaker_cooldown_sec'));
    END IF;
  END IF;
  SELECT coalesce(sum(win_payout - gross), 0), count(*), coalesce(sum(gross), 0) INTO v_worst, v_open, v_stake
    FROM public.arcade_calls WHERE status = 'open' AND user_id IS NOT NULL;
  SELECT coalesce(-sum(pnl), 0) INTO v_l60 FROM public.arcade_calls WHERE user_id IS NOT NULL AND status IN ('won','lost') AND settled_at > v_now - interval '60 minutes';
  SELECT coalesce(-sum(pnl), 0) INTO v_lday FROM public.arcade_calls WHERE user_id IS NOT NULL AND status IN ('won','lost') AND settled_at >= date_trunc('day', v_now);
  v_reason_state := CASE
    WHEN public.arcade_param('live') <> 1 THEN 'off'
    WHEN NOT coalesce(v_valid, false) THEN 'index'
    WHEN v_until IS NOT NULL AND v_until > v_now THEN 'breaker'
    WHEN v_l60 >= public.arcade_param('loss_break_60m') OR v_lday >= public.arcade_param('loss_break_day') THEN 'loss'
    WHEN v_worst >= public.arcade_param('max_worst_loss') - 10 THEN 'full'
    ELSE NULL END;
  UPDATE public.arcade_table_state
     SET paused_reason = v_reason_state, breaker_until = v_until, worst_loss = v_worst, open_calls = v_open,
         open_stake = v_stake, loss_60m = v_l60, loss_day = v_lday, updated_at = v_now
   WHERE id = 1;

  -- 4) settle what is due; keep the simulated table alive ----------------------
  PERFORM public.arcade_settle_due(NULL);
  IF harvested AND public.arcade_param('sim_table') = 1 AND v_valid AND v_p IS NOT NULL THEN PERFORM public.arcade_sim_tick(v_ts, v_p); END IF;
  IF extract(second FROM v_now) < 1 AND extract(minute FROM v_now) = 7 THEN
    DELETE FROM public.arcade_index_ticks WHERE ts < v_now - interval '26 hours';
    DELETE FROM public.arcade_calls WHERE user_id IS NULL AND created_at < v_now - interval '2 hours';
  END IF;

  -- 5) fire the next batch ---------------------------------------------------------
  INSERT INTO public.arcade_feed_req (batch, src, req_id) VALUES
    (v_now, 'binance', net.http_get('https://api.binance.com/api/v3/ticker/bookTicker?symbol=BTCUSDT', timeout_milliseconds := 900)),
    (v_now, 'hyperliquid', net.http_post('https://api.hyperliquid.xyz/info', body := jsonb_build_object('type', 'l2Book', 'coin', hl_coin, 'nSigFigs', 5), timeout_milliseconds := 900)),
    (v_now, 'coinbase', net.http_get('https://api.exchange.coinbase.com/products/BTC-USD/ticker', headers := '{"User-Agent":"omenx-index"}'::jsonb, timeout_milliseconds := 900)),
    (v_now, 'usdt', net.http_get('https://api.exchange.coinbase.com/products/USDT-USD/ticker', headers := '{"User-Agent":"omenx-index"}'::jsonb, timeout_milliseconds := 900));
END; $$;

-- ---------- what the cabinet polls (one call per second) ----------
-- latest tick + table state + the caller's own exposure, in one round trip
CREATE OR REPLACE FUNCTION public.arcade_table_now()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'tick', (SELECT to_jsonb(t) - 'src_raw' FROM public.arcade_index_ticks t ORDER BY ts DESC LIMIT 1),
    'state', (SELECT to_jsonb(s) FROM public.arcade_table_state s WHERE id = 1),
    'params', (SELECT jsonb_object_agg(key, num) FROM public.arcade_params),
    'now', clock_timestamp(),
    'my_open', (SELECT coalesce(sum(gross), 0) FROM public.arcade_calls WHERE user_id = auth.uid() AND status = 'open'),
    'ack', (SELECT accepted_at FROM public.arcade_acks WHERE user_id = auth.uid())
  )
$$;
GRANT EXECUTE ON FUNCTION public.arcade_table_now() TO anon, authenticated;

-- ---------- place a call ----------
CREATE OR REPLACE FUNCTION public.arcade_place(p_side text, p_gross numeric, p_quote_ts timestamptz)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  uid uuid := auth.uid();
  q record; latest record; st record;
  v_now timestamptz := clock_timestamp();
  v_fee numeric; v_net numeric; v_p numeric; v_pay numeric;
  v_open numeric; v_recent int; v_worst numeric; v_bal numeric;
  c record;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Sign in to play'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.arcade_acks WHERE user_id = uid) THEN RAISE EXCEPTION 'Accept the rules first'; END IF;
  IF p_side NOT IN ('up','down') THEN RAISE EXCEPTION 'Pick Up or Down'; END IF;
  IF p_gross NOT IN (5, 10, 25, 50, 100) THEN RAISE EXCEPTION 'Chips are $5, $10, $25, $50 or $100'; END IF;

  SELECT * INTO st FROM public.arcade_table_state WHERE id = 1;
  IF st.paused_reason IS NOT NULL THEN
    RAISE EXCEPTION '%', CASE st.paused_reason WHEN 'full' THEN 'Table full · room opens as calls settle'
                                              WHEN 'index' THEN 'Table paused · index invalid'
                                              WHEN 'breaker' THEN 'Table paused · market moving too fast'
                                              WHEN 'loss' THEN 'Table paused · daily limit reached'
                                              ELSE 'Table closed' END;
  END IF;

  SELECT * INTO latest FROM public.arcade_index_ticks ORDER BY ts DESC LIMIT 1;
  IF latest.ts IS NULL OR NOT latest.valid OR latest.ts < v_now - make_interval(secs => public.arcade_param('tick_max_age_ms') / 1000.0) THEN
    RAISE EXCEPTION 'Table paused · index invalid';
  END IF;
  SELECT * INTO q FROM public.arcade_index_ticks WHERE ts = p_quote_ts;
  IF q.ts IS NULL OR q.p_up IS NULL OR NOT q.valid THEN RAISE EXCEPTION 'Price moved · tap again'; END IF;
  IF q.ts < v_now - make_interval(secs => public.arcade_param('quote_ttl_ms') / 1000.0) THEN RAISE EXCEPTION 'Price moved · tap again'; END IF;
  IF abs(latest.idx - q.idx) / q.idx > public.arcade_param('drift_max_bps') / 10000.0 THEN RAISE EXCEPTION 'Price moved · tap again'; END IF;

  -- limits
  SELECT coalesce(sum(gross), 0) INTO v_open FROM public.arcade_calls WHERE user_id = uid AND status = 'open';
  IF v_open + p_gross > public.arcade_param('max_open_per_user') THEN RAISE EXCEPTION '$500 max open per account'; END IF;
  SELECT count(*) INTO v_recent FROM public.arcade_calls WHERE user_id = uid AND t0 > v_now - interval '1 second';
  IF v_recent >= public.arcade_param('max_calls_per_sec') THEN RAISE EXCEPTION 'Too fast · 2 calls per second'; END IF;

  v_fee := public.arcade_round_half_up(p_gross * public.arcade_param('fee_rate')::numeric, 2);
  v_net := p_gross - v_fee;
  v_p := CASE WHEN p_side = 'up' THEN q.p_up ELSE 1 - q.p_up END;
  v_pay := floor(v_net / v_p * 100) / 100;

  SELECT coalesce(sum(win_payout - gross), 0) INTO v_worst FROM public.arcade_calls WHERE status = 'open' AND user_id IS NOT NULL;
  IF v_worst + (v_pay - p_gross) > public.arcade_param('max_worst_loss') THEN RAISE EXCEPTION 'Table full · room opens as calls settle'; END IF;

  -- cash
  SELECT spot_balance INTO v_bal FROM public.profiles WHERE user_id = uid FOR UPDATE;
  IF coalesce(v_bal, 0) < p_gross THEN RAISE EXCEPTION 'Not enough in your spot account'; END IF;
  UPDATE public.profiles SET spot_balance = spot_balance - p_gross, updated_at = now() WHERE user_id = uid;
  INSERT INTO public.transactions (user_id, type, amount, account, description, status)
  VALUES (uid, 'fee', -v_fee, 'spot', 'Quick Play fee · 3% · ' || initcap(p_side) || ' · BTC 30-second call', 'completed');

  INSERT INTO public.arcade_calls (user_id, side, gross, fee, net, p, p_up, win_payout, quote_ts, quote_idx, t0, t1)
  VALUES (uid, p_side, p_gross, v_fee, v_net, v_p, q.p_up, v_pay, q.ts, q.idx, v_now, v_now + make_interval(secs => public.arcade_param('duration_sec')))
  RETURNING * INTO c;
  RETURN to_jsonb(c) || jsonb_build_object('balance', v_bal - p_gross);
END; $$;
GRANT EXECUTE ON FUNCTION public.arcade_place(text, numeric, timestamptz) TO authenticated;

-- ---------- cancel within 2 s ----------
CREATE OR REPLACE FUNCTION public.arcade_cancel(p_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  uid uuid := auth.uid();
  c record; v_fee numeric; v_bal numeric;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Sign in to play'; END IF;
  SELECT * INTO c FROM public.arcade_calls WHERE id = p_id AND user_id = uid FOR UPDATE;
  IF c.id IS NULL THEN RAISE EXCEPTION 'Call not found'; END IF;
  IF c.status <> 'open' THEN RAISE EXCEPTION 'Already settled'; END IF;
  IF clock_timestamp() > c.t0 + make_interval(secs => public.arcade_param('cancel_window_ms') / 1000.0) THEN RAISE EXCEPTION 'Locked · the 2 seconds are up'; END IF;
  v_fee := public.arcade_round_half_up(c.gross * public.arcade_param('cancel_fee_rate')::numeric, 2);
  UPDATE public.arcade_calls SET status = 'cancelled', cancel_fee = v_fee, pnl = -v_fee, settled_at = clock_timestamp() WHERE id = c.id;
  UPDATE public.profiles SET spot_balance = spot_balance + c.gross - v_fee, updated_at = now() WHERE user_id = uid RETURNING spot_balance INTO v_bal;
  INSERT INTO public.transactions (user_id, type, amount, account, description, status)
  VALUES (uid, 'fee', -v_fee, 'spot', 'Quick Play cancel · 0.15% · ' || initcap(c.side) || ' · BTC 30-second call', 'completed');
  INSERT INTO public.transactions (user_id, type, amount, account, description, status)
  VALUES (uid, 'fee', c.fee, 'spot', 'Quick Play fee returned · cancelled within 2 s', 'completed');
  RETURN jsonb_build_object('id', c.id, 'cancel_fee', v_fee, 'balance', v_bal);
END; $$;
GRANT EXECUTE ON FUNCTION public.arcade_cancel(uuid) TO authenticated;

-- ---------- settlement ----------
-- S0 = first valid tick strictly after t0; S1 = last valid tick at or before
-- t1, at most settle_src_age_ms old. Settles once a tick ≥ t1 exists or
-- settle_wait_ms have passed. Idempotent (row lock + status check).
-- p_user = NULL settles everyone's due calls (cron); a user id settles that
-- user's (the cabinet calls it when its own timer hits, so results never
-- wait for the sweep).
CREATE OR REPLACE FUNCTION public.arcade_settle_due(p_user uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  c record; s0 record; s1 record;
  v_now timestamptz := clock_timestamp();
  v_wait interval := make_interval(secs => public.arcade_param('settle_wait_ms') / 1000.0);
  v_age interval := make_interval(secs => public.arcade_param('settle_src_age_ms') / 1000.0);
  v_commission numeric; v_credit numeric; v_pnl numeric; v_status text;
  done jsonb := '[]'::jsonb;
  later boolean;
BEGIN
  FOR c IN
    SELECT * FROM public.arcade_calls
    WHERE status = 'open' AND t1 <= v_now AND (p_user IS NULL OR user_id = p_user)
    ORDER BY t1
    FOR UPDATE SKIP LOCKED
  LOOP
    SELECT EXISTS (SELECT 1 FROM public.arcade_index_ticks WHERE ts >= c.t1) INTO later;
    IF NOT later AND v_now < c.t1 + v_wait THEN CONTINUE; END IF;   -- give late data its 2 seconds

    SELECT * INTO s0 FROM public.arcade_index_ticks WHERE valid AND ts > c.t0 AND ts <= c.t1 ORDER BY ts LIMIT 1;
    SELECT * INTO s1 FROM public.arcade_index_ticks WHERE valid AND ts <= c.t1 AND ts >= c.t1 - v_age ORDER BY ts DESC LIMIT 1;

    IF c.user_id IS NULL THEN                       -- simulated filler: result only, no cash
      v_status := CASE WHEN s0.idx IS NULL OR s1.idx IS NULL OR s1.idx = s0.idx THEN 'void'
                       WHEN (c.side = 'up') = (s1.idx > s0.idx) THEN 'won' ELSE 'lost' END;
      UPDATE public.arcade_calls SET status = v_status, s0 = s0.idx, s0_ts = s0.ts, s1 = s1.idx, s1_ts = s1.ts, pnl = 0, settled_at = v_now WHERE id = c.id;
      CONTINUE;
    END IF;

    IF s0.idx IS NULL OR s1.idx IS NULL OR s1.idx = s0.idx THEN
      v_status := 'void'; v_pnl := 0; v_commission := 0; v_credit := c.gross;
      INSERT INTO public.transactions (user_id, type, amount, account, description, status)
      VALUES (c.user_id, 'trade_profit', 0, 'spot',
              'Quick Play · ' || initcap(c.side) || ' · ' || CASE WHEN s0.idx IS NULL OR s1.idx IS NULL THEN 'no valid price · chip and fee returned' ELSE 'tie · chip and fee returned' END, 'completed');
    ELSIF (c.side = 'up') = (s1.idx > s0.idx) THEN
      v_status := 'won';
      v_commission := public.arcade_round_half_up((c.win_payout - c.gross) * public.arcade_param('commission_rate')::numeric, 2);
      v_credit := c.win_payout - v_commission;
      v_pnl := v_credit - c.gross;
      INSERT INTO public.transactions (user_id, type, amount, account, description, status)
      VALUES (c.user_id, 'trade_profit', c.win_payout - c.net, 'spot', 'Quick Play · ' || initcap(c.side) || ' · Won · open ' || round(s0.idx::numeric, 2) || ' → close ' || round(s1.idx::numeric, 2), 'completed');
      IF v_commission > 0 THEN
        INSERT INTO public.transactions (user_id, type, amount, account, description, status)
        VALUES (c.user_id, 'winning_commission', -v_commission, 'spot', 'Winning commission · 5% · Quick Play · ' || initcap(c.side), 'completed');
      END IF;
    ELSE
      v_status := 'lost'; v_commission := 0; v_credit := 0; v_pnl := -c.gross;
      INSERT INTO public.transactions (user_id, type, amount, account, description, status)
      VALUES (c.user_id, 'trade_loss', -c.net, 'spot', 'Quick Play · ' || initcap(c.side) || ' · Lost · open ' || round(s0.idx::numeric, 2) || ' → close ' || round(s1.idx::numeric, 2), 'completed');
    END IF;

    UPDATE public.arcade_calls
       SET status = v_status, s0 = s0.idx, s0_ts = s0.ts, s1 = s1.idx, s1_ts = s1.ts,
           commission = v_commission, pnl = v_pnl, settled_at = v_now
     WHERE id = c.id;
    IF v_credit > 0 THEN
      UPDATE public.profiles SET spot_balance = spot_balance + v_credit, updated_at = now() WHERE user_id = c.user_id;
    END IF;
    done := done || jsonb_build_object('id', c.id, 'status', v_status, 'pnl', v_pnl, 's0', s0.idx, 's1', s1.idx);
  END LOOP;
  RETURN done;
END; $$;
GRANT EXECUTE ON FUNCTION public.arcade_settle_due(uuid) TO authenticated;

-- the cabinet's own sweep: only the caller's calls
CREATE OR REPLACE FUNCTION public.arcade_settle_mine()
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT public.arcade_settle_due(auth.uid()) $$;
GRANT EXECUTE ON FUNCTION public.arcade_settle_mine() TO authenticated;

-- ---------- the TABLE feed (everyone's open calls, anonymised) ----------
CREATE OR REPLACE FUNCTION public.arcade_table_feed()
RETURNS TABLE (id uuid, who text, side text, gross numeric, p numeric, t0 timestamptz, t1 timestamptz, mine boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT c.id,
         CASE WHEN c.user_id IS NULL THEN c.bot_name
              ELSE left(coalesce(pr.username, 'player'), 2) || '***' || right(coalesce(pr.username, 'player'), 2) END AS who,
         c.side, c.gross, c.p, c.t0, c.t1, c.user_id = auth.uid() AS mine
  FROM public.arcade_calls c
  LEFT JOIN public.profiles pr ON pr.user_id = c.user_id
  WHERE c.status = 'open'
  ORDER BY c.t1
  LIMIT 30
$$;
GRANT EXECUTE ON FUNCTION public.arcade_table_feed() TO anon, authenticated;

-- simulated filler: a handful of anonymous calls so the TABLE tab breathes
-- when the room is quiet (never cash, never counted in limits/breakers)
CREATE OR REPLACE FUNCTION public.arcade_sim_tick(p_ts timestamptz, p_pup numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_n int; v_g numeric; v_s text; v_p numeric; v_nm text; v_fee numeric;
  names text[] := ARRAY['al***er','mi***to','kz***88','sa***ra','jo***ng','ve***0x','ha***ru','nu***do','pr***me','ol***ia','ry***an','ch***en'];
BEGIN
  SELECT count(*) INTO v_n FROM public.arcade_calls c WHERE c.user_id IS NULL AND c.status = 'open';
  IF v_n >= 6 OR random() > 0.12 THEN RETURN; END IF;
  v_g := (ARRAY[5,5,5,10,10,25,50,100])[1 + floor(random() * 8)::int];
  v_s := CASE WHEN random() < 0.5 THEN 'up' ELSE 'down' END;
  v_p := CASE WHEN v_s = 'up' THEN p_pup ELSE 1 - p_pup END;
  v_nm := names[1 + floor(random() * array_length(names, 1))::int];
  v_fee := public.arcade_round_half_up(v_g * 0.03, 2);
  INSERT INTO public.arcade_calls (user_id, bot_name, side, gross, fee, net, p, p_up, win_payout, quote_ts, quote_idx, t0, t1)
  SELECT NULL, v_nm, v_s, v_g, v_fee, v_g - v_fee, v_p, p_pup,
         floor((v_g - v_fee) / v_p * 100) / 100, t.ts, t.idx, p_ts, p_ts + interval '30 seconds'
  FROM public.arcade_index_ticks t WHERE t.ts = p_ts;
END; $$;

-- ---------- the table's road: 30-second cells of the index ----------
CREATE OR REPLACE FUNCTION public.arcade_road(p_slots int DEFAULT 120)
RETURNS TABLE (slot_start timestamptz, open_idx double precision, close_idx double precision)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  WITH b AS (SELECT to_timestamp(floor(extract(epoch FROM clock_timestamp()) / 30) * 30) AS cur)
  SELECT to_timestamp(floor(extract(epoch FROM t.ts) / 30) * 30) AS slot_start,
         (array_agg(t.idx ORDER BY t.ts))[1] AS open_idx,
         (array_agg(t.idx ORDER BY t.ts DESC))[1] AS close_idx
  FROM public.arcade_index_ticks t, b
  WHERE t.valid AND t.ts >= b.cur - p_slots * interval '30 seconds' AND t.ts < b.cur
  GROUP BY 1 ORDER BY 1
$$;
GRANT EXECUTE ON FUNCTION public.arcade_road(int) TO anon, authenticated;

-- ---------- my record (session scoreboard + settled list) ----------
CREATE OR REPLACE FUNCTION public.arcade_my_calls(p_since timestamptz DEFAULT NULL, p_limit int DEFAULT 60)
RETURNS SETOF public.arcade_calls LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT * FROM public.arcade_calls
  WHERE user_id = auth.uid() AND (p_since IS NULL OR created_at >= p_since OR status = 'open')
  ORDER BY created_at DESC
  LIMIT p_limit
$$;
GRANT EXECUTE ON FUNCTION public.arcade_my_calls(timestamptz, int) TO authenticated;

-- ---------- the site's BTC stream follows the real index ----------
-- roll_arcade_rounds (2026-10-19) seeds each BTC round's open from the
-- previous round's close; from now the BTC open is the latest valid index
-- when one exists, so the home ticker / quick rounds / cabinet agree.
CREATE OR REPLACE FUNCTION public.arcade_real_btc()
RETURNS double precision LANGUAGE sql STABLE
AS $$ SELECT idx FROM public.arcade_index_ticks WHERE valid AND ts > now() - interval '10 seconds' ORDER BY ts DESC LIMIT 1 $$;

-- roll_arcade_rounds, unchanged except the BTC anchor (full text so the file replays on its own)
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

      -- 2026-10-28: the BTC leg follows the real three-exchange index when it is live
      IF tbl.symbol = 'BTC' THEN v_open := COALESCE(public.arcade_real_btc(), v_open); END IF;

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

-- ---------- cron ----------
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'arcade_feed';
SELECT cron.schedule('arcade_feed', '1 second', 'select public.arcade_feed_tick()');
