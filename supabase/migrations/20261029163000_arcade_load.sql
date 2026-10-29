-- ============================================================
-- Quick Play demo engine · load relief (2026-10-29, Lovable "database under high load")
-- pg_stat_statements since 2026-10-28 20:38 UTC showed the DB crawling: every
-- query uniformly 10× slower, no lock waits — the small instance's CPU was
-- saturated by sustained background work: the 1-second feed job (4 HTTP
-- calls + 4 responses + ~5 cron bookkeeping statements per second), the
-- arcade_stall_probe added on 10-28 (pg_stat_activity + pg_locks every 3 s),
-- the realtime WAL poller chewing through all that WAL, and the older
-- site-wide demo jobs (roll_arcade_rounds 30 s, roll_crypto_quick_rounds and
-- sim_price_tick every minute) each taking 10–17 s once throttled.
-- Done live: probe job unscheduled; feed job 1 s → 2 s; quote TTL / settle
-- source age 2.5 s → 4.5 s, tick max age 4 s → 6 s (the browser's Binance
-- line and the synthetic-tick fallback keep the cabinet feeling live).
-- ============================================================
select cron.unschedule(jobid) from cron.job where jobname = 'arcade_stall_probe';
select cron.alter_job((select jobid from cron.job where jobname = 'arcade_feed'), schedule := '2 seconds');
update public.arcade_params set num = 4500 where key in ('quote_ttl_ms', 'settle_src_age_ms');
update public.arcade_params set num = 6000 where key = 'tick_max_age_ms';
