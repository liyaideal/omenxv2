REVOKE EXECUTE ON FUNCTION public.tick_live_matches() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tick_live_matches() TO service_role;