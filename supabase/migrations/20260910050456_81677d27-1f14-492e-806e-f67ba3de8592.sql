-- lovable-cron-fallback-reviewed: 288 runs/day; freeze_time is a per-row future timestamp with no row-change event at that moment, so triggers/webhooks cannot fire it; a 5-minute sweep bounds post-close order acceptance to 5 minutes.
CREATE OR REPLACE FUNCTION public.freeze_expired_events()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  n int := 0;
BEGIN
  UPDATE public.events
     SET lifecycle_status = 'FROZEN',
         updated_at = now()
   WHERE lifecycle_status IN ('TRADING', 'EXTENDED_TRADING')
     AND is_resolved = false
     AND (
           (freeze_time IS NOT NULL AND now() > freeze_time)
        OR (freeze_time IS NULL AND end_date IS NOT NULL AND now() > end_date)
         );
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$function$;

SELECT cron.schedule('freeze-sweep', '*/5 * * * *', $$select public.freeze_expired_events();$$);