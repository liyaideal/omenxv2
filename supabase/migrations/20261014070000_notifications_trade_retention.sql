-- Notifications — split retention (CPO 2026-10-14 N1)
-- Buy / Cash out confirmations (`trade.*`) are receipts; Portfolio is the ledger.
-- They keep 7 days, everything else keeps 90 days. The Trading tab's end note
-- spells this out (notifications.endOfList.trading).
CREATE OR REPLACE FUNCTION public.purge_notifications() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer; m integer;
BEGIN
  DELETE FROM public.notifications WHERE type LIKE 'trade.%' AND created_at < now() - interval '7 days';
  GET DIAGNOSTICS n = ROW_COUNT;
  DELETE FROM public.notifications WHERE created_at < now() - interval '90 days';
  GET DIAGNOSTICS m = ROW_COUNT;
  RETURN n + m;
END $$;
