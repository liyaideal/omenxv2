CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
REVOKE EXECUTE ON FUNCTION public.sim_market_activity_tick() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.record_market_activity() FROM anon, authenticated, PUBLIC;