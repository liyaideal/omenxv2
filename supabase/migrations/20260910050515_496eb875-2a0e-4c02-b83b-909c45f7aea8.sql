REVOKE EXECUTE ON FUNCTION public.freeze_expired_events() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.freeze_expired_events() TO service_role;