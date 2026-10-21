-- ============================================================
-- Hotfix 2026-10-21: roll_crypto_quick_rounds has failed every minute since
-- 2026-10-19 06:00 UTC — `random()` is double precision, so the fallback
-- expression made COALESCE(...) double and round(double, int) does not exist
-- in Postgres. No quick round settled or opened for two days (prod /trade
-- redirected to the stale Oct 19 rounds, "Settling" forever). Only change:
-- cast the fallback to numeric. Everything else in the function is verbatim
-- from 20261019130000_quick_rounds_on_arcade_stream.sql.
-- ============================================================

CREATE OR REPLACE FUNCTION public.roll_crypto_quick_rounds()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  v_stream double precision;
  settled int := 0; opened int := 0; pruned int := 0; paid int := 0;
  del record;
BEGIN
  FOR ci IN 1..array_length(coins,1) LOOP
    coin := coins[ci]; cname := cnames[ci];
    FOR ti IN 1..array_length(tfs,1) LOOP
      tf := tfs[ti]; secs := tsecs[ti]; vol := tvols[ti];

      FOR due IN
        SELECT id, base_price, name, end_date FROM public.events
        WHERE event_subtype = 'CRYPTO_QUICK_UPDOWN_SPOT'
          AND id LIKE 'crypto-'||coin||'-updown-'||tf||'-%'
          AND is_resolved = false
          AND end_date <= now()
        ORDER BY end_date
      LOOP
        -- close = the Quick Play stream at the round's end; random walk only as fallback
        SELECT s.price INTO v_stream FROM public.arcade_state_at(upper(coin), due.end_date) s;
        cls := round(COALESCE(v_stream::numeric, (COALESCE(due.base_price, seeds[ci]) * (1 + (random()-0.5) * vol))::numeric), 2);
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
        paid := paid + public.settle_quick_contract_round(due.id);
        settled := settled + 1;
      END LOOP;

      pstart := to_timestamp(floor(extract(epoch from now()) / secs) * secs);
      pend := pstart + make_interval(secs => secs);
      eid := 'crypto-'||coin||'-updown-'||tf||'-'||to_char(pstart at time zone 'UTC','YYYYMMDDHH24MI');

      IF NOT EXISTS (SELECT 1 FROM public.events WHERE id = eid) THEN
        -- open = the Quick Play stream at the round's start; own chain only as fallback
        SELECT s.price INTO v_stream FROM public.arcade_state_at(upper(coin), pstart) s;
        IF v_stream IS NOT NULL THEN
          base := round(v_stream::numeric, 2);
        ELSE
          SELECT e.close_price INTO base
          FROM public.events e
          WHERE e.event_subtype = 'CRYPTO_QUICK_UPDOWN_SPOT'
            AND e.id LIKE 'crypto-'||coin||'-updown-'||tf||'-%'
            AND e.is_resolved = true AND e.close_price IS NOT NULL
          ORDER BY e.end_date DESC LIMIT 1;
          base := COALESCE(base, seeds[ci]);
        END IF;
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
$function$;
REVOKE EXECUTE ON FUNCTION public.roll_crypto_quick_rounds() FROM anon, authenticated;
