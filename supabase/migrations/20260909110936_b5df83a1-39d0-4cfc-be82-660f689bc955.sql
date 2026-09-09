CREATE OR REPLACE FUNCTION public.settle_spot_event(p_event_id text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  SELECT id, name, start_date, end_date INTO ev FROM public.events WHERE id = p_event_id;
  IF ev.id IS NULL THEN RETURN 0; END IF;

  SELECT label INTO win_label FROM public.event_options
   WHERE event_id = p_event_id AND is_winner = true LIMIT 1;
  IF win_label IS NULL THEN RETURN 0; END IF;

  FOR p IN
    SELECT pos.id, pos.user_id, pos.option_label, pos.size, pos.margin,
           pos.entry_price, pos.trade_id, pos.winning_commission
    FROM public.positions pos
    WHERE pos.product_line = 'spot'
      AND pos.status = 'Open'
      AND pos.event_name = ev.name
      AND (ev.start_date IS NULL OR pos.created_at >= ev.start_date)
      AND (ev.end_date IS NULL OR pos.created_at <= ev.end_date + interval '1 hour')
  LOOP
    proceeds := CASE WHEN p.option_label = win_label THEN COALESCE(p.size, 0) ELSE 0 END;
    v_profit := round(proceeds - COALESCE(p.margin, 0), 2);

    -- Allocated entry fee: the originating trade's fee, falling back to a
    -- recomputed 15 bps on the entry notional for pre-V4 (fee = 0) rows.
    SELECT COALESCE(t.fee, 0) INTO v_fee FROM public.trades t WHERE t.id = p.trade_id;
    v_fee := COALESCE(v_fee, 0);
    IF v_fee = 0 THEN
      v_fee := round(COALESCE(p.entry_price, 0) * COALESCE(p.size, 0) * 0.0015, 2);
    END IF;

    v_wc := CASE WHEN v_profit > 0 THEN round(0.05 * GREATEST(v_profit - v_fee, 0), 2) ELSE 0 END;
    v_cash := round(proceeds - v_wc, 2);

    UPDATE public.positions
      SET status = 'Closed',
          closed_at = now(),
          mark_price = CASE WHEN p.option_label = win_label THEN 1 ELSE 0 END,
          pnl = v_profit,
          pnl_percent = CASE WHEN p.margin > 0 THEN round(v_profit / p.margin * 100, 2) ELSE 0 END,
          winning_commission = COALESCE(winning_commission, 0) + v_wc,
          close_reason = 'settlement',
          updated_at = now()
      WHERE id = p.id AND status = 'Open';

    IF NOT FOUND THEN CONTINUE; END IF;

    IF v_cash > 0 THEN
      UPDATE public.profiles
        SET spot_balance = COALESCE(spot_balance, 0) + v_cash,
            updated_at = now()
        WHERE user_id = p.user_id;
    END IF;

    INSERT INTO public.transactions (user_id, type, amount, account, description, status)
    VALUES (p.user_id,
            CASE WHEN v_profit >= 0 THEN 'trade_profit' ELSE 'trade_loss' END,
            v_profit, 'spot',
            'Settled: ' || ev.name || ' · ' || p.option_label || ' · ' ||
            CASE WHEN p.option_label = win_label THEN 'Won' ELSE 'Lost' END,
            'completed');

    IF v_wc > 0 THEN
      INSERT INTO public.transactions (user_id, type, amount, account, description, status)
      VALUES (p.user_id, 'winning_commission', -v_wc, 'spot',
              'Winning commission · 5% · ' || p.option_label || ' · ' || ev.name,
              'completed');
    END IF;

    n := n + 1;
  END LOOP;

  RETURN n;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.settle_spot_event(text) FROM anon, authenticated;