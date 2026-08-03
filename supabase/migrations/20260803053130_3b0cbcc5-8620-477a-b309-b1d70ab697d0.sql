CREATE OR REPLACE FUNCTION public.settle_spot_event(p_event_id text)
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
  profit numeric;
  n int := 0;
BEGIN
  SELECT id, name, start_date, end_date INTO ev FROM public.events WHERE id = p_event_id;
  IF ev.id IS NULL THEN RETURN 0; END IF;

  SELECT label INTO win_label FROM public.event_options
   WHERE event_id = p_event_id AND is_winner = true LIMIT 1;
  IF win_label IS NULL THEN RETURN 0; END IF;

  FOR p IN
    SELECT pos.id, pos.user_id, pos.option_label, pos.size, pos.margin
    FROM public.positions pos
    WHERE pos.product_line = 'spot'
      AND pos.status = 'Open'
      AND pos.event_name = ev.name
      AND (ev.start_date IS NULL OR pos.created_at >= ev.start_date)
      AND (ev.end_date IS NULL OR pos.created_at <= ev.end_date + interval '1 hour')
  LOOP
    proceeds := CASE WHEN p.option_label = win_label THEN COALESCE(p.size, 0) ELSE 0 END;
    profit := proceeds - COALESCE(p.margin, 0);

    UPDATE public.positions
      SET status = 'Closed',
          closed_at = now(),
          mark_price = CASE WHEN p.option_label = win_label THEN 1 ELSE 0 END,
          pnl = profit,
          updated_at = now()
      WHERE id = p.id AND status = 'Open';

    IF NOT FOUND THEN CONTINUE; END IF;

    IF proceeds > 0 THEN
      UPDATE public.profiles
        SET spot_balance = COALESCE(spot_balance, 0) + proceeds,
            updated_at = now()
        WHERE user_id = p.user_id;
    END IF;

    INSERT INTO public.transactions (user_id, type, amount, account, description, status)
    VALUES (p.user_id,
            CASE WHEN profit >= 0 THEN 'trade_profit' ELSE 'trade_loss' END,
            abs(profit), 'spot',
            'Settled: ' || ev.name || ' · ' || p.option_label || ' · ' ||
            CASE WHEN p.option_label = win_label THEN 'Won' ELSE 'Lost' END,
            'completed');

    n := n + 1;
  END LOOP;

  RETURN n;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.settle_spot_event(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.roll_crypto_quick_rounds() FROM anon, authenticated;
