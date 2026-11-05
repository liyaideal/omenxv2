-- ============================================================
-- Quick Play · pre-handoff fixes (CPO 2026-11-05 "这些都批了")
--   item 10  every order carries the tap's own id: arcade_place(…, p_client_id) takes a
--            (user, id) pair once and hands the same call back on a resend; arcade_lookup(id)
--            answers "did my tap land?" for the cabinet's Checking your call… state
--   item 5   combo vouchers draw on the site-wide daily pool: a $2 tier with a daily quota
--            (arcade_params.combo_pool_day — Lovable demo 2,000; the real number is in
--            《BTCUSDT_30秒与1分钟涨跌产品设计_v1.0》); arcade_table_now reports what is left
--   B2       a void call also writes the fee back into the ledger (the balance already got it)
--   B9       simulated table rows older than 24 h are cleaned every 10 minutes
--   B10      LIVE TABLE masking: a name under 5 characters shows as pl***er, not in full
-- Applied on the Lovable DB with query_database the same day; this file is the record.
-- ============================================================

-- ---------- item 10 · one id per tap ----------
ALTER TABLE public.arcade_calls ADD COLUMN IF NOT EXISTS client_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS arcade_calls_user_client_uidx
  ON public.arcade_calls (user_id, client_id) WHERE client_id IS NOT NULL;

DROP FUNCTION IF EXISTS public.arcade_place(text, numeric, timestamptz);
CREATE OR REPLACE FUNCTION public.arcade_place(p_side text, p_gross numeric, p_quote_ts timestamp with time zone, p_client_id uuid DEFAULT NULL)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  q record; latest record; st record;
  v_now timestamptz := clock_timestamp();
  v_fee numeric; v_net numeric; v_p numeric; v_pay numeric;
  v_open numeric; v_recent int; v_worst numeric; v_bal numeric;
  c record;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Sign in to play'; END IF;
  -- the same tap again (a resend after no answer): the call it already made, never a second one (10.1)
  IF p_client_id IS NOT NULL THEN
    SELECT * INTO c FROM public.arcade_calls WHERE user_id = uid AND client_id = p_client_id;
    IF FOUND THEN
      SELECT spot_balance INTO v_bal FROM public.profiles WHERE user_id = uid;
      RETURN to_jsonb(c) || jsonb_build_object('balance', v_bal);
    END IF;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.arcade_acks WHERE user_id = uid) THEN RAISE EXCEPTION 'Accept the rules first'; END IF;
  IF p_side NOT IN ('up','down') THEN RAISE EXCEPTION 'Pick Up or Down'; END IF;
  IF p_gross NOT IN (2, 5, 10, 25, 50) THEN RAISE EXCEPTION 'Chips are $2, $5, $10, $25 or $50'; END IF;

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
  -- a quote older than quote_ttl_ms is refused — so a request that arrives late (after the cabinet
  -- gave up asking) can never land (10.6)
  IF q.ts < v_now - make_interval(secs => public.arcade_param('quote_ttl_ms') / 1000.0) THEN RAISE EXCEPTION 'Price moved · tap again'; END IF;
  IF abs(latest.idx - q.idx) / q.idx > public.arcade_param('drift_max_bps') / 10000.0 THEN RAISE EXCEPTION 'Price moved · tap again'; END IF;

  SELECT coalesce(sum(gross), 0) INTO v_open FROM public.arcade_calls WHERE user_id = uid AND status = 'open';
  IF v_open + p_gross > public.arcade_param('max_open_per_user') THEN
    RAISE EXCEPTION 'Limit reached · $% in play · room frees up as your calls settle', trim_scale(public.arcade_param('max_open_per_user')::numeric);
  END IF;
  SELECT count(*) INTO v_recent FROM public.arcade_calls WHERE user_id = uid AND t0 > v_now - interval '1 second';
  IF v_recent >= public.arcade_param('max_calls_per_sec') THEN RAISE EXCEPTION 'Too fast · 2 calls per second'; END IF;

  v_fee := public.arcade_round_half_up(p_gross * public.arcade_param('fee_rate')::numeric, 2);
  v_net := p_gross - v_fee;
  v_p := CASE WHEN p_side = 'up' THEN q.p_up ELSE 1 - q.p_up END;
  v_pay := floor(v_net / v_p * 100) / 100;

  SELECT coalesce(sum(win_payout - gross), 0) INTO v_worst FROM public.arcade_calls WHERE status = 'open' AND user_id IS NOT NULL;
  IF v_worst + (v_pay - p_gross) > public.arcade_param('max_worst_loss') THEN RAISE EXCEPTION 'Table full · room opens as calls settle'; END IF;

  SELECT spot_balance INTO v_bal FROM public.profiles WHERE user_id = uid FOR UPDATE;
  IF coalesce(v_bal, 0) < p_gross THEN RAISE EXCEPTION 'Not enough in your spot account'; END IF;
  UPDATE public.profiles SET spot_balance = spot_balance - p_gross, updated_at = now() WHERE user_id = uid;
  INSERT INTO public.transactions (user_id, type, amount, account, description, status)
  VALUES (uid, 'fee', -v_fee, 'spot', 'Quick Play fee · 3% · ' || initcap(p_side) || ' · BTC 30-second call', 'completed');

  INSERT INTO public.arcade_calls (user_id, side, gross, fee, net, p, p_up, win_payout, quote_ts, quote_idx, t0, t1, client_id)
  VALUES (uid, p_side, p_gross, v_fee, v_net, v_p, q.p_up, v_pay, q.ts, q.idx, v_now, v_now + make_interval(secs => public.arcade_param('duration_sec')), p_client_id)
  RETURNING * INTO c;
  RETURN to_jsonb(c) || jsonb_build_object('balance', v_bal - p_gross);
EXCEPTION WHEN unique_violation THEN
  -- two copies of the same tap raced in: the first one made the call, this one hands it back
  SELECT * INTO c FROM public.arcade_calls WHERE user_id = uid AND client_id = p_client_id;
  SELECT spot_balance INTO v_bal FROM public.profiles WHERE user_id = uid;
  RETURN to_jsonb(c) || jsonb_build_object('balance', v_bal);
END; $function$;
REVOKE ALL ON FUNCTION public.arcade_place(text, numeric, timestamptz, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.arcade_place(text, numeric, timestamptz, uuid) TO authenticated;

-- "did my tap go through?" — the caller's own call with that id, or nothing
CREATE OR REPLACE FUNCTION public.arcade_lookup(p_client_id uuid)
 RETURNS jsonb
 LANGUAGE sql STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT to_jsonb(c) || jsonb_build_object('balance', (SELECT spot_balance FROM public.profiles WHERE user_id = auth.uid()))
    FROM public.arcade_calls c
   WHERE c.user_id = auth.uid() AND c.client_id = p_client_id
$$;
REVOKE ALL ON FUNCTION public.arcade_lookup(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.arcade_lookup(uuid) TO authenticated;

-- ---------- item 5 · combo vouchers come out of the daily pool ----------
INSERT INTO public.arcade_params (key, num, note) VALUES
  ('combo_pool_day', 2000, 'site-wide daily quota of $2 combo vouchers (voucher_daily_pools face 2); Lovable demo value — the real one is in the risk doc')
ON CONFLICT (key) DO UPDATE SET num = EXCLUDED.num, note = EXCLUDED.note;

CREATE OR REPLACE FUNCTION public.ensure_voucher_pool_today()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_today date := (now() AT TIME ZONE 'UTC')::date;
BEGIN
  INSERT INTO public.voucher_daily_pools (face_value, pool_date, total_quota)
  VALUES
    (2, v_today, coalesce(public.arcade_param('combo_pool_day'), 2000)::int),
    (10, v_today, 1000),
    (25, v_today, 500),
    (50, v_today, 100)
  ON CONFLICT (face_value, pool_date) DO NOTHING;
END;
$function$;

CREATE OR REPLACE FUNCTION public.arcade_combo_vouchers(p_user uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  r record;
  v_day_start timestamptz := date_trunc('day', now() AT TIME ZONE 'utc') AT TIME ZONE 'utc';
  v_every int := coalesce(public.arcade_param('combo_voucher_every'), 3)::int;
  v_face numeric := coalesce(public.arcade_param('combo_voucher_face'), 2);
  v_cap numeric := coalesce(public.arcade_param('combo_voucher_cap_day'), 10);
  v_today numeric;
  v_run int := 0;
  v_prev timestamptz := NULL;
BEGIN
  IF p_user IS NULL THEN RETURN 0; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('arcade_combo:' || p_user::text));

  SELECT coalesce(sum(face_value), 0) INTO v_today
    FROM public.position_vouchers
   WHERE user_id = p_user AND source_arcade_call_id IS NOT NULL AND issued_at >= v_day_start;

  FOR r IN
    SELECT id, status, t1, settled_at
      FROM public.arcade_calls
     WHERE user_id = p_user AND status IN ('won', 'lost') AND t1 >= v_day_start - interval '1 day'
     ORDER BY t1, id
  LOOP
    IF v_prev IS NOT NULL AND r.t1 - v_prev > interval '30 minutes' THEN v_run := 0; END IF;
    v_prev := r.t1;
    IF r.status = 'lost' THEN v_run := 0; CONTINUE; END IF;
    v_run := v_run + 1;
    -- the streak itself never depends on vouchers; a voucher drops only when (5.1) this account is
    -- under its daily cap AND the site's $2 pool still has one — the pool slot is taken last, so a
    -- call that already has its voucher never spends one
    IF v_run % v_every = 0 AND r.settled_at >= v_day_start AND v_today + v_face <= v_cap
       AND NOT EXISTS (SELECT 1 FROM public.position_vouchers WHERE source_arcade_call_id = r.id) THEN
      IF public.consume_daily_voucher_pool(v_face) THEN
        INSERT INTO public.position_vouchers (user_id, code, face_value, status, payout_mode, issued_at, expires_at, source_arcade_call_id)
        VALUES (p_user, public.gen_voucher_code(), v_face, 'granted', 'tiered', now(), now() + interval '30 days', r.id)
        ON CONFLICT (source_arcade_call_id) DO NOTHING;
        IF FOUND THEN v_today := v_today + v_face; END IF;
      END IF;
    END IF;
  END LOOP;
  RETURN v_today;
END; $function$;
REVOKE ALL ON FUNCTION public.arcade_combo_vouchers(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.arcade_table_now()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  perform public.arcade_synth_tick();
  return jsonb_build_object(
    'tick', (select to_jsonb(t) - 'src_raw' from public.arcade_index_ticks t order by ts desc limit 1),
    'state', (select to_jsonb(s) from public.arcade_table_state s where id = 1),
    'params', (select jsonb_object_agg(key, num) from public.arcade_params),
    'now', clock_timestamp(),
    'my_open', (select coalesce(sum(gross), 0) from public.arcade_calls where user_id = auth.uid() and status = 'open'),
    'ack', (select accepted_at from public.arcade_acks where user_id = auth.uid()),
    'combo_today', (select coalesce(sum(face_value), 0) from public.position_vouchers
                     where user_id = auth.uid() and source_arcade_call_id is not null
                       and issued_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc'),
    -- what is left of today's site-wide $2 pool; no row yet today = nothing taken yet (item 5)
    'combo_pool_left', coalesce(
      (select greatest(p.total_quota - p.claimed_count, 0) from public.voucher_daily_pools p
        where p.face_value = coalesce(public.arcade_param('combo_voucher_face'), 2)
          and p.pool_date = (now() at time zone 'utc')::date),
      coalesce(public.arcade_param('combo_pool_day'), 2000)::int)
  );
end;
$function$;

-- ---------- B2 · a void call hands the fee back in the ledger too ----------
DO $patch$
DECLARE d text; n text;
BEGIN
  d := pg_get_functiondef('public.arcade_settle_due(uuid)'::regprocedure);
  IF position('Quick Play fee returned' in d) = 0 THEN
    n := replace(d,
      $q$v_status := 'void'; v_pnl := 0; v_commission := 0; v_credit := c.gross;$q$,
      $q$v_status := 'void'; v_pnl := 0; v_commission := 0; v_credit := c.gross;
      IF c.fee > 0 THEN
        INSERT INTO public.transactions (user_id, type, amount, account, description, status)
        VALUES (c.user_id, 'fee', c.fee, 'spot', 'Quick Play fee returned · ' || CASE WHEN s0.idx IS NULL OR s1.idx IS NULL THEN 'no valid price' ELSE 'tie' END || ' · ' || initcap(c.side), 'completed');
      END IF;$q$);
    IF n = d THEN RAISE EXCEPTION 'arcade_settle_due: void line not found'; END IF;
    EXECUTE n;
  END IF;
END $patch$;

-- ---------- B9 · simulated table rows don't pile up ----------
CREATE OR REPLACE FUNCTION public.arcade_housekeeping()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_hot int[];
begin
  -- the second-by-second jobs keep an hour of run history, everything else a week
  select array_agg(jobid) into v_hot from cron.job where jobname in ('arcade_feed','arcade_rounds_30s','arcade_sim_feed');
  delete from cron.job_run_details
   where (jobid = any(coalesce(v_hot, '{}')) and start_time < now() - interval '1 hour')
      or (not (jobid = any(coalesce(v_hot, '{}'))) and start_time < now() - interval '7 days');
  delete from public.arcade_index_ticks where ts < now() - interval '24 hours';
  delete from public.arcade_feed_req where batch < now() - interval '2 minutes';
  -- simulated filler calls (user_id is null) are table dressing, not records: a day is plenty (B9)
  delete from public.arcade_calls where user_id is null and t1 < now() - interval '24 hours';
end;
$function$;
REVOKE ALL ON FUNCTION public.arcade_housekeeping() FROM PUBLIC, anon, authenticated;

-- ---------- B10 · short names mask to pl***er ----------
CREATE OR REPLACE FUNCTION public.arcade_table_feed()
RETURNS TABLE (id uuid, who text, side text, gross numeric, p numeric, t0 timestamptz, t1 timestamptz, mine boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT c.id,
         CASE WHEN c.user_id IS NULL THEN c.bot_name
              -- first 2 + *** + last 2; under 5 characters that would show the whole name, so it is pl***er (B10)
              WHEN length(coalesce(pr.username, '')) < 5 THEN 'pl***er'
              ELSE left(pr.username, 2) || '***' || right(pr.username, 2) END AS who,
         c.side, c.gross, c.p, c.t0, c.t1, c.user_id = auth.uid() AS mine
  FROM public.arcade_calls c
  LEFT JOIN public.profiles pr ON pr.user_id = c.user_id
  WHERE c.status = 'open'
  ORDER BY c.t1
  LIMIT 30
$$;
GRANT EXECUTE ON FUNCTION public.arcade_table_feed() TO anon, authenticated;
