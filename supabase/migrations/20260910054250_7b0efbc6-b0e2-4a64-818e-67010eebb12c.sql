CREATE OR REPLACE FUNCTION public.freeze_expired_events()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n int := 0;
BEGIN
  UPDATE public.events
     SET lifecycle_status = 'FROZEN',
         updated_at = now()
   WHERE lifecycle_status IN ('TRADING', 'EXTENDED_TRADING')
     AND is_resolved = false
     AND 'spot' = ANY(product_lines)
     AND (
           (freeze_time IS NOT NULL AND now() > freeze_time)
        OR (freeze_time IS NULL AND end_date IS NOT NULL AND now() > end_date)
         );
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.freeze_expired_events() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.freeze_expired_events() TO service_role;