-- Insights v2 (2026-09-28) — asset series / accuracy data layer for
-- /insights, /insights/{crypto|stocks}/{slug}, /insights/accuracy.
-- Aggregates only (SECURITY DEFINER over public.events + event_options). No user data.
-- "Majority" = the side priced above 50¢ when betting closed (pre-settlement `price` is kept on resolved rounds).

-- 0. One row per Up-or-Down round (crypto quick rounds + US/HK daily sessions).
create or replace function public.insights_updown_rounds(p_from timestamptz default now() - interval '400 days')
returns table(
  family text, asset text, ticker text, slug text, event_id text, mins int,
  start_date timestamptz, end_date timestamptz, freeze_time timestamptz,
  is_resolved boolean, up_price numeric, down_price numeric, up_won boolean, volume numeric
)
language sql security definer stable set search_path = public as $$
  with e as (
    select e.id, e.name, e.event_subtype, e.start_date, e.end_date, e.freeze_time, e.is_resolved,
           coalesce(nullif(e.volume::text,'')::numeric, 0) as volume,
           split_part(e.name, ' —', 1) as asset_full
    from public.events e
    where e.event_subtype in ('CRYPTO_QUICK_UPDOWN_SPOT','US_STOCK_DAILY_UPDOWN_SPOT','HK_STOCK_DAILY_UPDOWN_SPOT')
      and e.end_date >= p_from
  ), o as (
    select event_id,
           max(case when label = 'Up' then price::numeric end) as up_price,
           max(case when label <> 'Up' then price::numeric end) as down_price,
           bool_or(label = 'Up' and coalesce(is_winner,false)) as up_won
    from public.event_options group by event_id
  )
  select
    case e.event_subtype when 'CRYPTO_QUICK_UPDOWN_SPOT' then 'crypto' when 'US_STOCK_DAILY_UPDOWN_SPOT' then 'us' else 'hk' end,
    trim(regexp_replace(e.asset_full, '\s*\([^)]*\)\s*$', '')),
    substring(e.asset_full from '\(([^)]+)\)'),
    lower(regexp_replace(coalesce(substring(e.asset_full from '\(([^)]+)\)'), trim(regexp_replace(e.asset_full, '\s*\([^)]*\)\s*$', ''))), '[^A-Za-z0-9]+', '-', 'g')),
    e.id,
    (extract(epoch from (e.end_date - e.start_date)) / 60)::int,
    e.start_date, e.end_date, e.freeze_time, e.is_resolved,
    o.up_price, o.down_price, o.up_won, e.volume
  from e join o on o.event_id = e.id;
$$;

-- 1. Asset list for the Insights home + "more assets" cards.
create or replace function public.insights_series_list()
returns json language sql security definer stable set search_path = public as $$
  with r as (select * from public.insights_updown_rounds(now() - interval '35 days')),
  live as (
    select distinct on (slug) slug, event_id, mins, start_date, end_date, freeze_time, up_price, down_price, volume
    from r where not is_resolved and end_date > now()
    order by slug, end_date asc, mins asc
  ),
  agg as (
    select slug, min(family) family, min(asset) asset, min(ticker) ticker,
      count(*) filter (where is_resolved and end_date >= date_trunc('day', now())) as rounds_today,
      round(100*avg(case when up_price >= 0.5 then 1 else 0 end) filter (where is_resolved and end_date >= date_trunc('day', now()))) as up_pct_today,
      round(100*avg(case when (up_price >= 0.5) = up_won then 1 else 0 end) filter (where is_resolved and end_date >= date_trunc('day', now()))) as hit_today,
      round(100*avg(case when (up_price >= 0.5) = up_won then 1 else 0 end) filter (where is_resolved and end_date > now() - interval '30 days')) as hit_30d,
      count(*) filter (where is_resolved and end_date > now() - interval '30 days') as rounds_30d,
      count(*) filter (where is_resolved) as rounds_total,
      coalesce(sum(volume) filter (where end_date > now() - interval '24 hours'), 0) as vol_24h
    from r group by slug
  )
  select coalesce(json_agg(json_build_object(
    'family', a.family, 'asset', a.asset, 'ticker', a.ticker, 'slug', a.slug,
    'live', case when l.slug is null then null else json_build_object(
      'event_id', l.event_id, 'mins', l.mins, 'start', l.start_date, 'end', l.end_date, 'freeze', l.freeze_time,
      'up_price', l.up_price, 'down_price', l.down_price, 'volume', l.volume) end,
    'rounds_today', a.rounds_today, 'up_pct_today', a.up_pct_today, 'hit_today', a.hit_today,
    'hit_30d', a.hit_30d, 'rounds_30d', a.rounds_30d, 'rounds_total', a.rounds_total, 'vol_24h', a.vol_24h
  ) order by a.family, a.asset), '[]'::json)
  from agg a left join live l on l.slug = a.slug;
$$;

-- 2. One asset: now (every round length) · today · 30d by length · recent rounds.
create or replace function public.insights_series_detail(p_slug text)
returns json language sql security definer stable set search_path = public as $$
  with r as (select * from public.insights_updown_rounds(now() - interval '35 days') where slug = p_slug),
  meta as (select min(family) family, min(asset) asset, min(ticker) ticker, min(slug) slug from r),
  primary_len as (select case when (select family from meta) = 'crypto' then 15 else 1440 end as mins),
  live as (
    select distinct on (mins) mins, event_id, start_date, end_date, freeze_time, up_price, down_price, volume
    from r where not is_resolved and end_date > now() order by mins, end_date asc
  ),
  today as (
    select count(*) as rounds,
      round(100*avg(case when up_price >= 0.5 then 1 else 0 end)) as up_pct,
      round(100*avg(case when (up_price >= 0.5) = up_won then 1 else 0 end)) as hit,
      coalesce(sum(volume),0) as volume
    from r where is_resolved and end_date >= date_trunc('day', now())
  ),
  run as (
    -- longest streak of "majority right" today, primary length only
    select coalesce(max(len),0) as longest, (array_agg(start_at order by len desc, start_at desc))[1] as start_at
    from (
      select count(*) len, min(end_date) start_at from (
        select end_date, ok, sum(case when ok then 0 else 1 end) over (order by end_date) grp
        from (select end_date, (up_price >= 0.5) = up_won as ok from r where is_resolved and end_date >= date_trunc('day', now()) and mins = (select mins from primary_len)) x
      ) y where ok group by grp
    ) s
  ),
  by_len as (
    select mins, count(*) rounds,
      round(100*avg(case when up_price >= 0.5 then 1 else 0 end)) up_pct,
      round(100*avg(case when (up_price >= 0.5) = up_won then 1 else 0 end)) hit,
      round(100*avg(case when up_won then 1 else 0 end)) rose_pct,
      round(avg(volume)) avg_volume
    from r where is_resolved and end_date > now() - interval '30 days' group by mins
  ),
  recent as (
    select event_id, mins, start_date, end_date, is_resolved, up_price, down_price, up_won, volume
    from r where mins = (select mins from primary_len) and (is_resolved or end_date > now())
    order by end_date desc limit 10
  )
  select json_build_object(
    'as_of', now(),
    'family', m.family, 'asset', m.asset, 'ticker', m.ticker, 'slug', m.slug,
    'primary_mins', (select mins from primary_len),
    'live', (select coalesce(json_agg(json_build_object('mins', mins, 'event_id', event_id, 'start', start_date, 'end', end_date, 'freeze', freeze_time, 'up_price', up_price, 'down_price', down_price, 'volume', volume) order by mins), '[]'::json) from live),
    'today', (select json_build_object('rounds', rounds, 'up_pct', up_pct, 'hit', hit, 'volume', volume) from today),
    'hit_30d', (select round(100*avg(case when (up_price >= 0.5) = up_won then 1 else 0 end)) from r where is_resolved and end_date > now() - interval '30 days'),
    'rounds_30d', (select count(*) from r where is_resolved and end_date > now() - interval '30 days'),
    'longest_run_today', (select json_build_object('len', longest, 'start', start_at) from run),
    'by_len', (select coalesce(json_agg(json_build_object('mins', mins, 'rounds', rounds, 'up_pct', up_pct, 'hit', hit, 'rose_pct', rose_pct, 'avg_volume', avg_volume) order by mins), '[]'::json) from by_len),
    'recent', (select coalesce(json_agg(json_build_object('event_id', event_id, 'mins', mins, 'start', start_date, 'end', end_date, 'is_resolved', is_resolved, 'up_price', up_price, 'down_price', down_price, 'up_won', up_won, 'volume', volume) order by end_date desc), '[]'::json) from recent)
  ) from meta m;
$$;

-- 3. Platform-wide accuracy (report page + home strip). p_days window; monthly report passes a fixed month via p_from/p_to.
create or replace function public.insights_accuracy(p_from timestamptz, p_to timestamptz default now())
returns json language sql security definer stable set search_path = public as $$
  with r as (select * from public.insights_updown_rounds(p_from) where is_resolved and end_date >= p_from and end_date < p_to),
  by_asset as (
    select slug, min(family) family, min(asset) asset, min(ticker) ticker, count(*) rounds,
      round(100*avg(case when (up_price >= 0.5) = up_won then 1 else 0 end)) hit
    from r group by slug having count(*) >= 5
  ),
  by_len as (
    select mins, count(*) rounds,
      round(100*avg(case when (up_price >= 0.5) = up_won then 1 else 0 end)) hit,
      round(100*avg(case when up_won then 1 else 0 end)) rose_pct
    from r where family = 'crypto' group by mins
  )
  select json_build_object(
    'as_of', now(), 'from', p_from, 'to', p_to,
    'rounds', (select count(*) from r),
    'hit', (select round(100*avg(case when (up_price >= 0.5) = up_won then 1 else 0 end)) from r),
    'hit_today', (select round(100*avg(case when (up_price >= 0.5) = up_won then 1 else 0 end)) from r where end_date >= date_trunc('day', now())),
    'rounds_24h', (select count(*) from r where end_date > now() - interval '24 hours'),
    'by_asset', (select coalesce(json_agg(json_build_object('slug', slug, 'family', family, 'asset', asset, 'ticker', ticker, 'rounds', rounds, 'hit', hit) order by hit desc, rounds desc), '[]'::json) from by_asset),
    'by_len', (select coalesce(json_agg(json_build_object('mins', mins, 'rounds', rounds, 'hit', hit, 'rose_pct', rose_pct) order by mins), '[]'::json) from by_len)
  );
$$;

grant execute on function public.insights_updown_rounds(timestamptz) to anon, authenticated;
grant execute on function public.insights_series_list() to anon, authenticated;
grant execute on function public.insights_series_detail(text) to anon, authenticated;
grant execute on function public.insights_accuracy(timestamptz, timestamptz) to anon, authenticated;
