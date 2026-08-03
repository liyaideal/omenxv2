ALTER TABLE public.events ADD COLUMN IF NOT EXISTS close_price numeric;

-- ============ C. settle_spot_event ============
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
    proceeds := CASE WHEN p.option_label = win_label THEN Number_null(NULL) END;
    proceeds := CASE WHEN p.option_label = win_label THEN p.size ELSE 0 END;
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

-- ============ B. roll_crypto_quick_rounds ============
CREATE OR REPLACE FUNCTION public.roll_crypto_quick_rounds()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  coins text[] := ARRAY['btc','eth','sol'];
  cnames text[] := ARRAY['Bitcoin','Ethereum','Solana'];
  seeds numeric[] := ARRAY[64200, 3100, 188];
  tfs text[] := ARRAY['5m','15m','1h','4h','1d'];
  tsecs int[] := ARRAY[300, 900, 3600, 14400, 86400];
  tvols numeric[] := ARRAY[0.004, 0.007, 0.012, 0.02, 0.035];
  ci int; ti int;
  coin text; cname text; tf text; secs int; vol numeric;
  due record;
  cls numeric; winner text; loser text;
  pstart timestamptz; pend timestamptz;
  eid text; base numeric; up numeric;
  settled int := 0; opened int := 0; pruned int := 0; paid int := 0;
  del record;
BEGIN
  FOR ci IN 1..array_length(coins,1) LOOP
    coin := coins[ci]; cname := cnames[ci];
    FOR ti IN 1..array_length(tfs,1) LOOP
      tf := tfs[ti]; secs := tsecs[ti]; vol := tvols[ti];

      -- 1) settle past-due rounds
      FOR due IN
        SELECT id, base_price, name FROM public.events
        WHERE event_subtype = 'CRYPTO_QUICK_UPDOWN_SPOT'
          AND id LIKE 'crypto-'||coin||'-updown-'||tf||'-%'
          AND is_resolved = false
          AND end_date <= now()
        ORDER BY end_date
      LOOP
        cls := round((COALESCE(due.base_price, seeds[ci]) * (1 + (random()-0.5) * vol))::numeric, 2);
        IF cls > COALESCE(due.base_price, seeds[ci]) THEN winner := 'Up'; loser := 'Down';
        ELSE winner := 'Down'; loser := 'Up'; END IF;

        UPDATE public.event_options SET final_price = 1, is_winner = true, updated_at = now()
          WHERE event_id = due.id AND label = winner;
        UPDATE public.event_options SET final_price = 0, is_winner = false, updated_at = now()
          WHERE event_id = due.id AND label = loser;

        UPDATE public.events
          SET is_resolved = true,
              settled_at = now(),
              close_price = cls,
              lifecycle_status = 'SETTLED',
              winning_option_id = due.id || CASE WHEN winner = 'Up' THEN '-up' ELSE '-down' END,
              settlement_description = 'Round closed at $' || cls || ' vs open $' || COALESCE(due.base_price, seeds[ci])
          WHERE id = due.id;

        paid := paid + public.settle_spot_event(due.id);
        settled := settled + 1;
      END LOOP;

      -- 2) open current period
      pstart := to_timestamp(floor(extract(epoch from now()) / secs) * secs);
      pend := pstart + make_interval(secs => secs);
      eid := 'crypto-'||coin||'-updown-'||tf||'-'||to_char(pstart at time zone 'UTC','YYYYMMDDHH24MI');

      IF NOT EXISTS (SELECT 1 FROM public.events WHERE id = eid) THEN
        SELECT e.close_price INTO base
        FROM public.events e
        WHERE e.event_subtype = 'CRYPTO_QUICK_UPDOWN_SPOT'
          AND e.id LIKE 'crypto-'||coin||'-updown-'||tf||'-%'
          AND e.is_resolved = true AND e.close_price IS NOT NULL
        ORDER BY e.end_date DESC LIMIT 1;
        base := COALESCE(base, seeds[ci]);
        up := round((0.44 + random()*0.12)::numeric, 4);

        INSERT INTO public.events (id, name, icon, category, description, rules, start_date, end_date,
          volume, is_resolved, price_label, side_labels, product_lines, event_subtype, lifecycle_status,
          base_price, freeze_time, expected_settlement_time)
        VALUES (eid, cname || ' — up or down?', '🟢', 'crypto',
          'Quick ' || tf || ' round on ' || cname || '. Up settles $1 if the price at the end of the round is above the round open ($' || base || ').',
          'Settles Up if the price at the end of the round is above the round open ($' || base || '); otherwise Down. A new round starts the moment this one settles.',
          pstart, pend, '0', false, '$' || base,
          '{"yes":"Up","no":"Down"}'::jsonb, ARRAY['spot'], 'CRYPTO_QUICK_UPDOWN_SPOT', 'TRADING',
          base, NULL, pend)
        ON CONFLICT (id) DO NOTHING;

        INSERT INTO public.event_options (id, event_id, label, price, is_winner)
        VALUES (eid||'-up', eid, 'Up', up, false),
               (eid||'-down', eid, 'Down', round((1-up)::numeric,4), false)
        ON CONFLICT (id) DO NOTHING;

        opened := opened + 1;
      END IF;

      -- 3) prune old resolved rounds with no positions in their window
      FOR del IN
        SELECT e.id, e.name, e.start_date, e.end_date FROM public.events e
        WHERE e.event_subtype = 'CRYPTO_QUICK_UPDOWN_SPOT'
          AND e.id LIKE 'crypto-'||coin||'-updown-'||tf||'-%'
          AND e.is_resolved = true
          AND e.end_date < now() - interval '72 hours'
      LOOP
        IF EXISTS (
          SELECT 1 FROM public.positions p
          WHERE p.event_name = del.name
            AND p.created_at >= del.start_date
            AND p.created_at <= del.end_date + interval '1 hour'
        ) THEN CONTINUE; END IF;

        DELETE FROM public.market_activity ma
          WHERE ma.event_name = del.name
            AND ma.created_at >= del.start_date AND ma.created_at <= del.end_date;
        DELETE FROM public.event_options WHERE event_id = del.id;
        DELETE FROM public.events WHERE id = del.id;
        pruned := pruned + 1;
      END LOOP;

    END LOOP;
  END LOOP;

  RETURN jsonb_build_object('settled', settled, 'opened', opened, 'pruned', pruned, 'positions_paid', paid);
END;
$$;
