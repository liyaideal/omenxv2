ALTER TABLE public.positions
  ADD COLUMN IF NOT EXISTS winning_commission numeric NOT NULL DEFAULT 0;

ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_type_check CHECK (type = ANY (ARRAY[
    'deposit','withdraw','platform_credit','trade_profit','trade_loss',
    'fee','bonus','cross_chain_in','cross_chain_out','fiat_buy','fiat_sell',
    'transfer_to_spot','transfer_to_futures','winning_commission'
  ]));

CREATE OR REPLACE FUNCTION public.settle_futures_event(p_event_id text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  ev record;
  p record;
  v_final numeric;
  v_pnl numeric;
  v_fee numeric;
  v_wc numeric;
  v_cash numeric;
  n int := 0;
BEGIN
  SELECT id, name, winning_option_id INTO ev FROM public.events WHERE id = p_event_id;
  IF ev.id IS NULL OR ev.winning_option_id IS NULL THEN RETURN 0; END IF;

  FOR p IN
    SELECT pos.*
    FROM public.positions pos
    WHERE pos.status = 'Open'
      AND pos.product_line IN ('futures', 'contract')
      AND (
        pos.option_id IN (SELECT o.id FROM public.event_options o WHERE o.event_id = ev.id)
        OR pos.event_name = ev.name
      )
  LOOP
    v_final := CASE WHEN p.option_id IS NOT NULL AND p.option_id = ev.winning_option_id THEN 1 ELSE 0 END;

    IF lower(p.side) = 'short' THEN
      v_pnl := (p.entry_price - v_final) * p.size;
    ELSE
      v_pnl := (v_final - p.entry_price) * p.size;
    END IF;
    v_pnl := round(GREATEST(v_pnl, -COALESCE(p.margin, 0)), 2);

    SELECT COALESCE(t.fee, 0) INTO v_fee FROM public.trades t WHERE t.id = p.trade_id;
    v_fee := COALESCE(v_fee, 0);

    v_wc := CASE WHEN v_pnl > 0 THEN round(0.05 * GREATEST(v_pnl - v_fee, 0), 2) ELSE 0 END;
    v_cash := COALESCE(p.margin, 0) + v_pnl - v_wc;

    UPDATE public.positions
       SET status = 'Closed',
           mark_price = v_final,
           pnl = v_pnl,
           pnl_percent = CASE WHEN p.margin > 0 THEN round(v_pnl / p.margin * 100, 2) ELSE 0 END,
           winning_commission = COALESCE(winning_commission, 0) + v_wc,
           close_reason = 'settlement',
           closed_at = now(),
           updated_at = now()
     WHERE id = p.id AND status = 'Open';

    IF NOT FOUND THEN CONTINUE; END IF;

    IF p.trade_id IS NOT NULL THEN
      UPDATE public.trades
         SET status = 'Closed', pnl = v_pnl, closed_at = now(), updated_at = now()
       WHERE id = p.trade_id;
    END IF;

    UPDATE public.profiles
       SET balance = COALESCE(balance, 0) + v_cash, updated_at = now()
     WHERE user_id = p.user_id;

    INSERT INTO public.transactions (user_id, type, amount, account, description, status)
    VALUES (p.user_id,
            CASE WHEN v_pnl >= 0 THEN 'trade_profit' ELSE 'trade_loss' END,
            v_pnl, 'futures',
            'Settled: ' || ev.name || ' · ' || p.option_label || ' · ' ||
            CASE WHEN v_pnl >= 0 THEN 'Won' ELSE 'Lost' END,
            'completed');

    IF v_wc > 0 THEN
      INSERT INTO public.transactions (user_id, type, amount, account, description, status)
      VALUES (p.user_id, 'winning_commission', -v_wc, 'futures',
              'Winning commission · 5% · ' || p.option_label || ' · ' || ev.name,
              'completed');
    END IF;

    n := n + 1;
  END LOOP;

  RETURN n;
END;
$function$;

CREATE OR REPLACE FUNCTION public.settle_futures_sweep()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  e record;
  n int := 0;
BEGIN
  FOR e IN
    SELECT ev.id FROM public.events ev
    WHERE ev.is_resolved = true
      AND ev.winning_option_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.positions p
        WHERE p.status = 'Open'
          AND p.product_line IN ('futures','contract')
          AND (
            p.option_id IN (SELECT o.id FROM public.event_options o WHERE o.event_id = ev.id)
            OR p.event_name = ev.name
          )
      )
  LOOP
    n := n + public.settle_futures_event(e.id);
  END LOOP;
  RETURN n;
END;
$function$;