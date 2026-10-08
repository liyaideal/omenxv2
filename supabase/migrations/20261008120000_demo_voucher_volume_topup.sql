-- Demo: keep alex_carter's trailing 30-day filled volume at T3 for the
-- Vouchers payout-tier hero (tiers read a rolling 30-day window since
-- 2026-10-08). roll_demo_positions only opens ~$75/day, which decays below
-- the $10k T3 line within a week — this daily top-up settles one extra
-- futures trade (trade + Closed position + ledger row, same shape as the
-- engine) whenever the window total falls under $12,000, aiming at ~$15k —
-- enough buffer that a single-day $4.6k roll-off still leaves T3 intact
-- until the next run.
-- Idempotent per day: a second run on the same day is a no-op once the
-- window is back above the floor.

CREATE OR REPLACE FUNCTION public.top_up_demo_voucher_volume()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_alex uuid := '968a2b3a-3913-4acb-948b-c78cc828a125';
  v_floor numeric := 12000;
  v_target numeric := 15000;
  v_max_chunk numeric := 4000;
  v_vol30 numeric;
  v_amount numeric;
  v_lev int := 5;
  v_margin numeric;
  v_entry numeric;
  v_size numeric;
  v_fee numeric;
  v_pnl numeric;
  v_side text;
  v_trade_id uuid;
  ev record;
  opt record;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_vol30
  FROM public.trades
  WHERE user_id = v_alex
    AND status IN ('Filled', 'Closed')
    AND created_at >= now() - interval '30 days';

  IF v_vol30 >= v_floor THEN
    RETURN jsonb_build_object('skipped', true, 'vol30', v_vol30);
  END IF;

  v_amount := LEAST(v_max_chunk, round(v_target - v_vol30, 2));

  -- A recently resolved futures event with a known winner, so the settled
  -- row reads like any other engine settlement.
  SELECT e.id, e.name, e.winning_option_id INTO ev
  FROM public.events e
  WHERE e.is_resolved = true
    AND e.winning_option_id IS NOT NULL
    AND e.end_date > now() - interval '7 days'
    AND e.product_lines @> ARRAY['futures']
  ORDER BY e.end_date DESC LIMIT 1;

  IF ev.id IS NULL THEN
    SELECT e.id, e.name, e.winning_option_id INTO ev
    FROM public.events e
    WHERE e.is_resolved = true AND e.winning_option_id IS NOT NULL
      AND e.product_lines @> ARRAY['futures']
    ORDER BY e.end_date DESC LIMIT 1;
  END IF;
  IF ev.id IS NULL THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'no resolved event', 'vol30', v_vol30);
  END IF;

  SELECT o.id, o.label, o.price INTO opt
  FROM public.event_options o WHERE o.id = ev.winning_option_id;

  v_entry := GREATEST(0.03, LEAST(0.97, COALESCE(opt.price, 0.5)));
  v_margin := round(v_amount / v_lev, 2);
  v_size := GREATEST(1, round(v_amount / v_entry));
  v_fee := round(v_amount * 0.0015, 4);
  v_side := 'long';
  -- Small settled profit (winner side, ~1.2% of margin) so the row is a
  -- realistic 'Won' settlement; mirrors roll_demo_positions ledger shape.
  v_pnl := round(v_margin * 0.012, 2);

  INSERT INTO public.trades (user_id, event_name, option_label, side, order_type, price, amount,
                             quantity, leverage, margin, fee, status, product_line, pnl, closed_at)
  VALUES (v_alex, ev.name, opt.label, 'buy', 'Market', v_entry, v_amount,
          v_size, v_lev, v_margin, v_fee, 'Closed', 'futures', v_pnl, now())
  RETURNING id INTO v_trade_id;

  INSERT INTO public.positions (user_id, trade_id, event_name, option_label, option_id, side,
                                entry_price, mark_price, size, margin, leverage, pnl, pnl_percent,
                                status, product_line, close_reason, closed_at)
  VALUES (v_alex, v_trade_id, ev.name, opt.label, opt.id, v_side,
          v_entry, 1, v_size, v_margin, v_lev, v_pnl,
          CASE WHEN v_margin > 0 THEN round(v_pnl / v_margin * 100, 2) ELSE 0 END,
          'Closed', 'futures', 'settlement', now());

  -- Margin was never debited (seed, not a live order) — only the profit lands.
  UPDATE public.profiles
     SET balance = COALESCE(balance, 0) + v_pnl, updated_at = now()
   WHERE user_id = v_alex;

  INSERT INTO public.transactions (user_id, type, amount, account, description, status)
  VALUES (v_alex, 'trade_profit', v_pnl, 'futures',
          'Settled: ' || ev.name || ' · ' || opt.label || ' · Won', 'completed');

  RETURN jsonb_build_object('skipped', false, 'vol30_before', v_vol30,
                            'added', v_amount, 'trade_id', v_trade_id);
END;
$function$;

SELECT cron.schedule('top-up-demo-voucher-volume', '25 5 * * *',
                     $$SELECT public.top_up_demo_voucher_volume()$$);
