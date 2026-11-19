-- 🔴 Lovable demo only. CPO 2026-11-19: restore the permanent "overtime, past its
-- estimated end" showcase match (demo-live-ot-nhl) that the 2026-11-09 mainnet catalog
-- sync had retired, and finally schedule its keeper (pending since 2026-11-04).
--
-- Executed against the live DB via Lovable MCP on 2026-11-19; this file is the record.
--   1. keep_demo_overtime_fixture(): same body as 20261104160000, plus it strips
--      metadata.retired / retired_at / retired_by so the fixture is listed again
--      (Sports list, Pro event dropdown; isListed() hides retired rows).
--   2. cron: every 10 minutes → kickoff = now − 2h50m, end_date = now − 20m, match_status
--      = 'live', OT 3:21. The 3-hour watchdog therefore never fires on it.
--
-- Not a product requirement: production sports status comes from the sports feed
-- (docs/delivery/sports-match-clock-v1.md §4).

-- (function body: see pg_get_functiondef('public.keep_demo_overtime_fixture'); the only
--  change vs 20261104160000 is `metadata = (metadata - 'retired' - 'retired_at' - 'retired_by') || …`)

select cron.unschedule('keep-demo-overtime-fixture') where exists (select 1 from cron.job where jobname = 'keep-demo-overtime-fixture');
select cron.schedule('keep-demo-overtime-fixture', '*/10 * * * *', $$select public.keep_demo_overtime_fixture();$$);
select public.keep_demo_overtime_fixture();
