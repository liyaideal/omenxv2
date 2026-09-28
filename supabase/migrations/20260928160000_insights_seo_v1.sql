-- Insights SEO/GEO v1 (2026-09-28) — data layer for /insights, /insights/daily, /insights/weekly, /insights/category.
-- Executed in Lovable Cloud via query_database on 2026-09-28; kept here for the dev team (docs/delivery/lite-insights-seo-v1.md §5).

-- 1. Hourly price snapshots (price_history had 0 rows; sim_price_tick moves prices but never records them).
create or replace function public.insights_snapshot_prices()
returns void language sql security definer set search_path = public as $$
  insert into public.price_history (event_id, option_id, price, recorded_at)
  select eo.event_id, eo.id, eo.price::numeric, now()
  from public.event_options eo
  join public.events e on e.id = eo.event_id
  where e.is_resolved = false;
$$;

-- 2. Platform KPIs (aggregates only — positions/trades stay private; this returns sums, never rows).
create or replace function public.insights_platform_stats()
returns json language sql security definer stable set search_path = public as $$
  with ma as (select amount::numeric as amount, created_at from public.market_activity)
  select json_build_object(
    'as_of', now(),
    'total_volume', coalesce((select sum(amount) from ma),0),
    'open_interest', coalesce((select sum(margin*leverage) from public.positions where status = 'Open'),0),
    'active_markets', (select count(*) from public.events where is_resolved = false),
    'resolved_markets', (select count(*) from public.events where is_resolved = true),
    'volume_24h', coalesce((select sum(amount) from ma where created_at > now() - interval '24 hours'),0),
    'volume_prev_24h', coalesce((select sum(amount) from ma where created_at > now() - interval '48 hours' and created_at <= now() - interval '24 hours'),0),
    'trades_24h', (select count(*) from ma where created_at > now() - interval '24 hours'),
    'trades_prev_24h', (select count(*) from ma where created_at > now() - interval '48 hours' and created_at <= now() - interval '24 hours'),
    'volume_7d', coalesce((select sum(amount) from ma where created_at > now() - interval '7 days'),0),
    'volume_30d', coalesce((select sum(amount) from ma where created_at > now() - interval '30 days'),0)
  );
$$;

-- 3. Per-event activity in a window (public ledger, grouped server-side so the client never pulls 20k rows).
create or replace function public.insights_event_activity(p_from timestamptz, p_to timestamptz default now())
returns table(event_name text, trades bigint, volume numeric)
language sql security definer stable set search_path = public as $$
  select event_name, count(*)::bigint, sum(amount::numeric)
  from public.market_activity
  where created_at >= p_from and created_at < p_to
  group by event_name;
$$;

-- 4. Price movers in a window: first vs last snapshot per option.
create or replace function public.insights_movers(p_from timestamptz, p_to timestamptz default now())
returns table(event_id text, option_id text, first_price numeric, last_price numeric, first_at timestamptz, last_at timestamptz)
language sql security definer stable set search_path = public as $$
  with w as (
    select event_id, option_id, price, recorded_at,
           row_number() over (partition by option_id order by recorded_at asc)  as rn_a,
           row_number() over (partition by option_id order by recorded_at desc) as rn_d
    from public.price_history
    where recorded_at >= p_from and recorded_at < p_to
  )
  select a.event_id, a.option_id, a.price, d.price, a.recorded_at, d.recorded_at
  from w a join w d on d.option_id = a.option_id and d.rn_d = 1
  where a.rn_a = 1;
$$;

-- 5. Sparkline series (hourly points, capped) for a set of options.
create or replace function public.insights_series(p_option_ids text[], p_from timestamptz, p_to timestamptz default now())
returns table(option_id text, price numeric, recorded_at timestamptz)
language sql security definer stable set search_path = public as $$
  select option_id, price, recorded_at from public.price_history
  where option_id = any(p_option_ids) and recorded_at >= p_from and recorded_at < p_to
  order by recorded_at asc;
$$;

grant execute on function public.insights_snapshot_prices() to service_role;
grant execute on function public.insights_platform_stats() to anon, authenticated;
grant execute on function public.insights_event_activity(timestamptz, timestamptz) to anon, authenticated;
grant execute on function public.insights_movers(timestamptz, timestamptz) to anon, authenticated;
grant execute on function public.insights_series(text[], timestamptz, timestamptz) to anon, authenticated;

select cron.schedule('insights-snapshot-prices', '0 * * * *', 'select public.insights_snapshot_prices();');
