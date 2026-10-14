-- Notifications — backfill guard on funds.* (2026-10-14, mainnet acceptance of v2)
--
-- Found: roll_demo_campaign_daily (demo engine, 00:02 UTC) deletes and re-inserts
-- alex's twelve "Trade every day" $1 bonus transactions every night with fresh
-- ids, so notif_transaction raised twelve new `funds.credit` rows per day.
-- Rule: a row INSERTed with a created_at older than one hour is imported /
-- re-seeded history, not something that just happened — never notify on it.
-- (Positions are not affected: roll_demo_positions inserts with created_at = now.)
CREATE OR REPLACE FUNCTION public.notif_transaction() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_type text; v_is_in boolean; v_is_out boolean;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.created_at < now() - interval '1 hour' THEN RETURN NEW; END IF;
  v_is_in  := NEW.type IN ('deposit','cross_chain_in','fiat_buy');
  v_is_out := NEW.type IN ('withdraw','cross_chain_out','fiat_sell');
  IF TG_OP = 'INSERT' THEN
    IF v_is_out AND NEW.status IN ('pending','processing') THEN v_type := 'funds.withdraw_submitted';
    ELSIF NEW.type = 'bonus' AND NEW.amount > 0 THEN v_type := 'funds.credit';
    ELSIF v_is_in AND NEW.status = 'completed' THEN v_type := 'funds.deposit_done';
    ELSIF v_is_out AND NEW.status = 'completed' THEN v_type := 'funds.withdraw_done';
    END IF;
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'completed' THEN
      v_type := CASE WHEN v_is_in THEN 'funds.deposit_done' WHEN v_is_out THEN 'funds.withdraw_done' END;
    ELSIF NEW.status IN ('failed','rejected') THEN
      v_type := CASE WHEN v_is_in THEN 'funds.deposit_failed' WHEN v_is_out THEN 'funds.withdraw_failed' END;
    END IF;
  END IF;
  IF v_type IS NULL THEN RETURN NEW; END IF;
  PERFORM public.notify(NEW.user_id, v_type,
    jsonb_build_object('amount', abs(NEW.amount), 'account', NEW.account, 'tx_type', NEW.type,
                       'network', NEW.network, 'tx_hash', NEW.tx_hash, 'description', NEW.description),
    'transaction', NEW.id, '/wallet', v_type || ':' || NEW.id::text);
  RETURN NEW;
END $$;

-- Retract the rows the re-seed already produced (notification newer than the transaction by > 1h).
DELETE FROM public.notifications n USING public.transactions t
 WHERE n.entity_type = 'transaction' AND n.entity_id = t.id AND n.type = 'funds.credit'
   AND t.description LIKE 'Campaign reward · Trade every day · %' AND n.created_at > t.created_at + interval '1 hour';
