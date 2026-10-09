-- ============================================================
-- Crypto quick rounds move from the spot rail to the CONTRACT rail
-- (CPO 2026-10-09, D1–D10). Matches production, where quick rounds are
-- leveraged contracts; Lovable had them as 1× spot shares.
--
-- What changes here
--   1. New settle_quick_contract_round(p_event_id): the futures payoff
--      (margin + (final − entry) × size, loss capped at margin, 5 % winning
--      commission, cash → profiles.balance) restricted to positions whose
--      option_id belongs to THIS round. settle_futures_event also matches on
--      event_name, which quick rounds share across rounds — using it would
--      settle next round's legs with this round's result.
--   2. roll_crypto_quick_rounds opens new rounds with product_lines =
--      ARRAY['contract'] and settles due rounds through BOTH rails:
--      settle_spot_event (legacy spot legs still open during the switch, D7)
--      then settle_quick_contract_round.
--   3. Unresolved quick rounds already open flip to ['contract'] so the
--      front end routes them to /trade from the moment this is applied.
-- event_subtype stays 'CRYPTO_QUICK_UPDOWN_SPOT' (a stable id, read by the
-- front end; renaming buys nothing).
-- ============================================================

CREATE OR REPLACE FUNCTION public.settle_quick_contract_round(p_event_id text)
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
      -- quick rounds share a name across rounds: option_id ONLY
      AND pos.option_id IN (SELECT o.id FROM public.event_options o WHERE o.event_id = ev.id)
  LOOP
    v_final := CASE WHEN p.option_id = ev.winning_option_id THEN 1 ELSE 0 END;

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
REVOKE EXECUTE ON FUNCTION public.settle_quick_contract_round(text) FROM anon, authenticated;

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

        -- legacy spot legs (opened before the contract switch) then contract legs
        paid := paid + public.settle_spot_event(due.id);
        paid := paid + public.settle_quick_contract_round(due.id);
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
          '{"yes":"Up","no":"Down"}'::jsonb, ARRAY['contract'], 'CRYPTO_QUICK_UPDOWN_SPOT', 'TRADING',
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
REVOKE EXECUTE ON FUNCTION public.roll_crypto_quick_rounds() FROM anon, authenticated;

-- 3) rounds already open switch rails now
UPDATE public.events
   SET product_lines = ARRAY['contract']
 WHERE event_subtype = 'CRYPTO_QUICK_UPDOWN_SPOT'
   AND is_resolved = false;
