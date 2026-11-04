-- Quick Play · one wording for the $500 open limit (CPO 2026-11-04, item 15).
-- The cabinet already says "Limit reached · $500 in play · room frees up as your calls settle";
-- arcade_place still raised the old "$500 max open per account". Same check, same order —
-- only the RAISE text changes (and it reads the limit from arcade_params instead of hard-coding $500).
CREATE OR REPLACE FUNCTION public.arcade_place(p_side text, p_gross numeric, p_quote_ts timestamp with time zone)
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

  INSERT INTO public.arcade_calls (user_id, side, gross, fee, net, p, p_up, win_payout, quote_ts, quote_idx, t0, t1)
  VALUES (uid, p_side, p_gross, v_fee, v_net, v_p, q.p_up, v_pay, q.ts, q.idx, v_now, v_now + make_interval(secs => public.arcade_param('duration_sec')))
  RETURNING * INTO c;
  RETURN to_jsonb(c) || jsonb_build_object('balance', v_bal - p_gross);
END; $function$;
