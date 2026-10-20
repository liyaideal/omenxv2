-- Notifications — tester feedback round (CPO 2026-10-20)
-- 1. settled.* / trade.cashed_out / settled.round_batch carry the NET pnl
--    (pnl − winning_commission) so the figure matches the wallet ledger.
-- 2. US / HK daily stock rounds (*_DAILY_UPDOWN_SPOT) carry `session_date`
--    (the round's trading day) on trade.bought and every close type.
-- 3. reward.treasure_opened retired (points treasure box is gone from the product).

CREATE OR REPLACE FUNCTION public.notif_session_date(p_option_id text) RETURNS date
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT e.end_date::date
    FROM public.event_options o JOIN public.events e ON e.id = o.event_id
   WHERE o.id = p_option_id AND e.event_subtype LIKE '%\_DAILY\_UPDOWN\_SPOT' ESCAPE '\'
   LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.notif_position_insert() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_event text;
BEGIN
  IF NEW.status <> 'Open' THEN RETURN NEW; END IF;
  SELECT event_id INTO v_event FROM public.event_options WHERE id = NEW.option_id;
  PERFORM public.notify(NEW.user_id, 'trade.bought',
    jsonb_strip_nulls(jsonb_build_object('event_name', NEW.event_name, 'option_label', NEW.option_label, 'side', NEW.side,
                       'side_labels', public.position_side_labels(NEW.option_id),
                       'margin', NEW.margin, 'leverage', NEW.leverage, 'product_line', NEW.product_line,
                       'session_date', public.notif_session_date(NEW.option_id))),
    'position', NEW.id,
    CASE WHEN v_event IS NULL THEN '/trade' ELSE '/trade?event=' || v_event END,
    'trade.bought:' || NEW.id::text);
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.notif_position_close() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; g record;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM new_tbl n JOIN old_tbl o ON o.id = n.id
                 WHERE n.status = 'Closed' AND o.status IS DISTINCT FROM 'Closed') THEN
    RETURN NULL;
  END IF;

  CREATE TEMP TABLE IF NOT EXISTS _closed (LIKE public.positions) ON COMMIT DROP;
  TRUNCATE _closed;
  INSERT INTO _closed
    SELECT n.* FROM new_tbl n JOIN old_tbl o ON o.id = n.id
    WHERE n.status = 'Closed' AND o.status IS DISTINCT FROM 'Closed'
      AND (n.close_reason IS NOT NULL OR COALESCE(n.pnl, 0) <> 0);

  -- batches: net = Σ(pnl − winning_commission)
  FOR g IN
    SELECT user_id, event_name, count(*) AS n,
           sum(COALESCE(pnl,0) - COALESCE(winning_commission,0)) AS net, max(closed_at) AS at
      FROM _closed WHERE COALESCE(close_reason,'settlement') = 'settlement'
     GROUP BY user_id, event_name HAVING count(*) >= 3
  LOOP
    PERFORM public.notify(g.user_id, 'settled.round_batch',
      jsonb_build_object('series', g.event_name, 'n', g.n, 'net', g.net),
      NULL, NULL, '/portfolio/settlements',
      'settled.round_batch:' || g.user_id::text || ':' || g.event_name || ':' || to_char(COALESCE(g.at, now()), 'YYYY-MM-DD"T"HH24:MI'));
  END LOOP;

  -- singles: pnl = net to wallet (pnl − winning_commission); win / loss / flat by gross sign
  FOR r IN
    SELECT c.* FROM _closed c
    WHERE NOT (COALESCE(c.close_reason,'settlement') = 'settlement' AND (c.user_id, c.event_name) IN (
      SELECT user_id, event_name FROM _closed WHERE COALESCE(close_reason,'settlement') = 'settlement'
      GROUP BY user_id, event_name HAVING count(*) >= 3))
  LOOP
    PERFORM public.notify(r.user_id,
      CASE COALESCE(r.close_reason, 'settlement')
        WHEN 'cashout'    THEN 'trade.cashed_out'
        WHEN 'auto_close' THEN 'autoclose.done'
        ELSE CASE WHEN COALESCE(r.pnl,0) > 0 THEN 'settled.win' WHEN COALESCE(r.pnl,0) < 0 THEN 'settled.loss' ELSE 'settled.flat' END
      END,
      jsonb_strip_nulls(jsonb_build_object('event_name', r.event_name, 'option_label', r.option_label, 'side', r.side,
                         'side_labels', public.position_side_labels(r.option_id),
                         'pnl', COALESCE(r.pnl,0) - COALESCE(r.winning_commission,0),
                         'gross_pnl', COALESCE(r.pnl,0), 'winning_commission', COALESCE(r.winning_commission,0),
                         'margin', r.margin, 'leverage', r.leverage, 'product_line', r.product_line,
                         'session_date', public.notif_session_date(r.option_id))),
      'position', r.id, '/portfolio/settlement/' || r.id::text,
      'position.closed:' || r.id::text);
  END LOOP;
  RETURN NULL;
END $$;

-- treasure box retired
DROP TRIGGER IF EXISTS notif_treasure ON public.treasure_drops;
DROP FUNCTION IF EXISTS public.notif_treasure();
DELETE FROM public.notifications WHERE type = 'reward.treasure_opened';
