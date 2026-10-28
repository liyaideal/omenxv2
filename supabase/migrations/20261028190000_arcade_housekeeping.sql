-- ============================================================
-- Quick Play demo engine · housekeeping (CPO 2026-10-28 "你改吧")
-- The 1-second feed job writes a cron.job_run_details row every run
-- (~86k rows / day; 403k rows · 76 MB when this was written) and the index
-- ticks grow ~3k rows / hour. Nothing pruned either, and the feed job was
-- seen stalling 2–12 s every 10–15 min (60 s once, during a publish).
-- This adds one job, every 10 minutes:
--   • cron.job_run_details: keep 1 h of arcade_feed / arcade_rounds_30s runs
--     (enough to read stalls), 7 days of every other job
--   • arcade_index_ticks: keep 24 h (the road reads 60 slots = 30 min,
--     the banner 45 s, calls carry their own s0 / s1)
--   • arcade_feed_req: drop batches older than 2 min (answers never came)
-- Applied to the New OmenX database (a8d166e9) by query_database; this file
-- is the record for 研发.
-- ============================================================
create or replace function public.arcade_housekeeping()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hot int[];
begin
  select array_agg(jobid) into v_hot from cron.job where jobname in ('arcade_feed','arcade_rounds_30s');
  delete from cron.job_run_details
   where (jobid = any(coalesce(v_hot, '{}')) and start_time < now() - interval '1 hour')
      or (not (jobid = any(coalesce(v_hot, '{}'))) and start_time < now() - interval '7 days');
  delete from public.arcade_index_ticks where ts < now() - interval '24 hours';
  delete from public.arcade_feed_req where batch < now() - interval '2 minutes';
end;
$$;

revoke all on function public.arcade_housekeeping() from public, anon, authenticated;

select cron.unschedule(jobid) from cron.job where jobname = 'arcade_housekeeping';
select cron.schedule('arcade_housekeeping', '*/10 * * * *', $$select public.arcade_housekeeping()$$);
