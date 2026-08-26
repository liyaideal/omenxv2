CREATE OR REPLACE FUNCTION public.roll_demo_positions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_alex uuid := '968a2b3a-3913-4acb-948b-c78cc828a125';
  v_mia  uuid := 'eec9d121-3291-4216-b60d-2628704430c0';
  v_users uuid[] := ARRAY[v_alex, v_mia];
  r record;
  ev record;
  v_exit numeric;
  v_pnl numeric;
  v_rand numeric;
  v_closed int := 0;
  v_expired int := 0;
  v_settled int := 0;
  v_opened_f int := 0;
  v_opened_s int := 0;
  v_need int;
  v_lev numeric;
  v_qty numeric;
  v_raw numeric;
  v_cap numeric;
  v_earned numeric;
  v_trade_id uuid;
  v_side text;
  v_margin numeric;
  v_entry numeric;
  v_size numeric;
BEGIN
  ---------------------------------------------------------------- Step 1
  FOR r IN
    SELECT p.* FROM public.positions p
    WHERE p.user_id = ANY(v_users) AND p.status = 'Open'
  LOOP
    SELECT e.* INTO ev
    FROM public.events e
    WHERE e.id = (SELECT eo.event_id FROM public.event_options eo WHERE eo.id = r.option_id)
    LIMIT 1;

    IF ev.id IS NULL THEN
      SELECT e.* INTO ev FROM public.events e
      WHERE e.name = r.event_name
      ORDER BY e.end_date DESC NULLS LAST LIMIT 1;
    END IF;

    IF ev.id IS NOT NULL AND ev.is_resolved IS NOT TRUE
       AND ev.end_date IS NOT NULL AND ev.end_date > now() THEN
      CONTINUE;
    END IF;

    v_rand := (abs(hashtext(r.id::text)) % 1000)::numeric / 1000.0;

    IF ev.id IS NOT NULL AND ev.winning_option_id IS NOT NULL THEN
      v_exit := CASE WHEN r.option_id IS NOT NULL AND r.option_id = ev.winning_option_id THEN 1 ELSE 0 END;
    ELSIF ev.id IS NOT NULL AND ev.close_price IS NOT NULL THEN
      v_exit := ev.close_price;
    ELSE
      v_exit := r.entry_price + (v_rand - 0.5) * 0.4;
    END IF;
    v_exit := GREATEST(0.01, LEAST(0.99, v_exit));

    IF lower(r.side) = 'short' THEN
      v_pnl := (r.entry_price - v_exit) * r.size;
    ELSE
      v_pnl := (v_exit - r.entry_price) * r.size;
    END IF;
    v_pnl := GREATEST(v_pnl, -r.margin);

    UPDATE public.positions
       SET status = 'Closed',
           close_reason = 'settlement',
           mark_price = v_exit,
           pnl = round(v_pnl, 2),
           pnl_percent = CASE WHEN r.margin > 0 THEN round(v_pnl / r.margin * 100, 2) ELSE 0 END,
           closed_at = now(),
           updated_at = now()
     WHERE id = r.id;
    v_closed := v_closed + 1;
  END LOOP;

  ---------------------------------------------------------------- Step 2
  UPDATE public.airdrop_positions
     SET status = 'expired', expired_at = now(), updated_at = now()
   WHERE user_id = ANY(v_users) AND status = 'pending' AND expires_at < now();
  GET DIAGNOSTICS v_expired = ROW_COUNT;

  FOR r IN
    SELECT a.* FROM public.airdrop_positions a
    WHERE a.user_id = ANY(v_users) AND a.status IN ('active','activated')
  LOOP
    SELECT e.* INTO ev FROM public.events e
    WHERE e.name = r.counter_event_name
    ORDER BY e.end_date DESC NULLS LAST LIMIT 1;

    IF NOT (
      r.expires_at < now()
      OR ev.id IS NULL
      OR ev.is_resolved IS TRUE
      OR (ev.end_date IS NOT NULL AND ev.end_date < now())
    ) THEN
      CONTINUE;
    END IF;

    v_rand := (abs(hashtext(r.id::text)) % 1000)::numeric / 1000.0;
    IF ev.id IS NOT NULL AND ev.close_price IS NOT NULL THEN
      v_exit := ev.close_price;
    ELSE
      v_exit := r.counter_price + (v_rand - 0.5) * 0.4;
    END IF;
    v_exit := GREATEST(0.01, LEAST(0.99, v_exit));

    v_lev := CASE WHEN r.source = 'voucher' THEN 5 ELSE 1 END;
    v_qty := CASE WHEN r.counter_price > 0 THEN r.airdrop_value * v_lev / r.counter_price ELSE 0 END;
    v_raw := CASE WHEN lower(r.counter_side) = 'short' THEN (r.counter_price - v_exit) ELSE (v_exit - r.counter_price) END * v_qty;

    IF r.source = 'voucher' THEN
      v_cap := COALESCE(r.redeemable_cap, r.airdrop_value * 0.5);
      v_pnl := GREATEST(0, LEAST(v_raw, v_cap));
    ELSE
      SELECT COALESCE(SUM(settled_pnl), 0) INTO v_earned
      FROM public.airdrop_positions
      WHERE user_id = r.user_id AND source <> 'voucher' AND status = 'settled';
      IF v_earned >= 100 THEN
        v_pnl := 0;
      ELSE
        v_pnl := GREATEST(0, v_raw);
      END IF;
    END IF;

    UPDATE public.airdrop_positions
       SET status = 'settled',
           settled_at = now(),
           close_reason = 'EVENT_RESOLVED',
           exit_price = v_exit,
           settled_pnl = round(v_pnl, 2),
           updated_at = now()
     WHERE id = r.id;
    v_settled := v_settled + 1;
  END LOOP;

  ---------------------------------------------------------------- Step 3
  FOR v_need IN 1..GREATEST(0, 16 - (
        SELECT count(*) FROM public.positions
        WHERE user_id = v_alex AND status = 'Open' AND product_line = 'futures'))
  LOOP
    SELECT e.id, e.name INTO ev
    FROM public.events e
    WHERE e.is_resolved = false
      AND e.end_date > now() + interval '6 hours'
      AND (e.lifecycle_status IS NULL OR e.lifecycle_status IN ('ACTIVE','TRADING'))
      AND e.product_lines @> ARRAY['futures']
      AND EXISTS (SELECT 1 FROM public.event_options o WHERE o.event_id = e.id)
    ORDER BY random() LIMIT 1;
    EXIT WHEN ev.id IS NULL;

    SELECT o.id, o.label, o.price INTO r
    FROM public.event_options o WHERE o.event_id = ev.id ORDER BY random() LIMIT 1;

    v_entry := GREATEST(0.03, LEAST(0.97, COALESCE(r.price, 0.5)));
    v_margin := round((1 + random() * 49)::numeric, 2);
    v_lev := floor(1 + random() * 5)::int;
    v_size := GREATEST(1, round(v_margin * v_lev / v_entry));
    v_side := CASE WHEN random() < 0.5 THEN 'long' ELSE 'short' END;

    INSERT INTO public.trades (user_id, event_name, option_label, side, order_type, price, amount,
                               quantity, leverage, margin, fee, status, product_line)
    VALUES (v_alex, ev.name, r.label, v_side, 'market', v_entry, round(v_margin * v_lev, 2),
            v_size, v_lev::int, v_margin, round(v_margin * v_lev * 0.001, 4), 'Filled', 'futures')
    RETURNING id INTO v_trade_id;

    INSERT INTO public.positions (user_id, trade_id, event_name, option_label, option_id, side,
                                  entry_price, mark_price, size, margin, leverage, pnl, pnl_percent,
                                  status, product_line)
    VALUES (v_alex, v_trade_id, ev.name, r.label, r.id, v_side,
            v_entry, v_entry, v_size, v_margin, v_lev, 0, 0, 'Open', 'futures');
    v_opened_f := v_opened_f + 1;
  END LOOP;

  FOR v_need IN 1..GREATEST(0, 1 - (
        SELECT count(*) FROM public.positions
        WHERE user_id = v_alex AND status = 'Open' AND product_line = 'spot'))
  LOOP
    SELECT e.id, e.name INTO ev
    FROM public.events e
    WHERE e.is_resolved = false
      AND e.end_date > now() + interval '6 hours'
      AND (e.lifecycle_status IS NULL OR e.lifecycle_status IN ('ACTIVE','TRADING'))
      AND e.product_lines @> ARRAY['spot']
      AND EXISTS (SELECT 1 FROM public.event_options o WHERE o.event_id = e.id)
    ORDER BY random() LIMIT 1;
    EXIT WHEN ev.id IS NULL;

    SELECT o.id, o.label, o.price INTO r
    FROM public.event_options o WHERE o.event_id = ev.id ORDER BY random() LIMIT 1;

    v_entry := GREATEST(0.03, LEAST(0.97, COALESCE(r.price, 0.5)));
    v_margin := round((1 + random() * 49)::numeric, 2);
    v_size := GREATEST(1, round(v_margin / v_entry));

    INSERT INTO public.trades (user_id, event_name, option_label, side, order_type, price, amount,
                               quantity, leverage, margin, fee, status, product_line)
    VALUES (v_alex, ev.name, r.label, 'long', 'market', v_entry, v_margin,
            v_size, 1, v_margin, round(v_margin * 0.001, 4), 'Filled', 'spot')
    RETURNING id INTO v_trade_id;

    INSERT INTO public.positions (user_id, trade_id, event_name, option_label, option_id, side,
                                  entry_price, mark_price, size, margin, leverage, pnl, pnl_percent,
                                  status, product_line)
    VALUES (v_alex, v_trade_id, ev.name, r.label, r.id, 'long',
            v_entry, v_entry, v_size, v_margin, 1, 0, 0, 'Open', 'spot');
    v_opened_s := v_opened_s + 1;
  END LOOP;

  RETURN jsonb_build_object('closed', v_closed, 'airdrops_expired', v_expired,
                            'airdrops_settled', v_settled,
                            'opened_futures', v_opened_f, 'opened_spot', v_opened_s);
END;
$function$;

DO $$
BEGIN
  PERFORM cron.unschedule('roll-demo-positions');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule('roll-demo-positions', '20 5 * * *', 'select public.roll_demo_positions();');