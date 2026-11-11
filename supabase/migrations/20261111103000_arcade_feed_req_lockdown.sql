-- 2026-11-11 · security: lock down arcade_feed_req
-- Lovable security scan flagged it: RLS was off and anon/authenticated held full
-- table privileges, so anyone with the public anon key could insert/delete rows.
-- Inserting a row pointing at an old pg_net response id could drag the Quick Play
-- anchor price to a stale BTC quote; deleting rows could stall the feed.
-- Only SECURITY DEFINER functions run by pg_cron touch this table
-- (arcade_feed_tick / arcade_sim_feed / arcade_housekeeping); the frontend never does.
-- Applied to production via query_database on 2026-11-11.

alter table public.arcade_feed_req enable row level security;
revoke all on public.arcade_feed_req from anon, authenticated;
