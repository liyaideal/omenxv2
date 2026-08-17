update public.events
set metadata = coalesce(metadata, '{}'::jsonb)
  || jsonb_build_object('fixture_id', id, 'market_type', 'winner', 'sport', 'soccer')
where id in ('sp-epl-ars-liv', 'sp-lal-fcb-atm');

with fx(fid, home, away, habbr, aabbr, league, kick, ends) as (
  values
    ('sp-epl-ars-liv','Arsenal','Liverpool','ARS','LIV','Premier League',
      timestamptz '2026-08-18 20:00:00+00', timestamptz '2026-08-18 22:00:00+00'),
    ('sp-lal-fcb-atm','Barcelona','Atlético Madrid','FCB','ATM','LaLiga',
      timestamptz '2026-08-18 21:00:00+00', timestamptz '2026-08-18 23:00:00+00')
),
hcp(line, yes_price) as (
  values (-2.5, 0.06), (-1.5, 0.13), (1.5, 0.87), (2.5, 0.94)
),
tot(line, yes_price) as (
  values (0.5, 0.93), (1.5, 0.80), (2.5, 0.58), (3.5, 0.34), (4.5, 0.10)
),
rows as (
  select
    fx.fid || '-hcp-' || replace(replace(hcp.line::text, '-', 'm'), '.', 'p') as id,
    fx.home || ' vs ' || fx.away || ' — handicap '
      || (case when hcp.line < 0 then U&'\2212' else '+' end) || abs(hcp.line)::text as name,
    'handicap' as mtype, hcp.line as line, hcp.yes_price as yes_price,
    fx.habbr || ' ' || (case when hcp.line < 0 then U&'\2212' else '+' end) || abs(hcp.line)::text as yes_label,
    fx.aabbr || ' ' || (case when hcp.line < 0 then '+' else U&'\2212' end) || abs(hcp.line)::text as no_label,
    fx.fid, fx.home, fx.away, fx.habbr, fx.aabbr, fx.league, fx.kick, fx.ends
  from fx cross join hcp
  union all
  select
    fx.fid || '-tot-' || replace(tot.line::text, '.', 'p'),
    fx.home || ' vs ' || fx.away || ' — total goals ' || tot.line::text,
    'total', tot.line, tot.yes_price,
    'Over ' || tot.line::text,
    'Under ' || tot.line::text,
    fx.fid, fx.home, fx.away, fx.habbr, fx.aabbr, fx.league, fx.kick, fx.ends
  from fx cross join tot
)
insert into public.events (
  id, name, icon, category, description, rules, start_date, end_date, volume,
  is_resolved, product_lines, event_subtype, side_labels, metadata
)
select
  r.id, r.name, '', 'sports',
  r.league || ' · ' || r.home || ' v ' || r.away
    || '. Winning shares pay $1, losing shares pay $0.',
  'Settles on the regulation-time result of ' || r.home || ' v ' || r.away
    || ' (' || r.league || '). Extra time and penalties do not count. Winning shares pay $1.',
  r.kick, r.ends, (60000 + (random() * 90000))::int::text,
  false, array['contract'], 'SPORTS_MATCH',
  jsonb_build_object('yes', r.yes_label, 'no', r.no_label),
  jsonb_build_object(
    'fixture_id', r.fid, 'market_type', r.mtype, 'line', r.line,
    'league', r.league, 'home', r.home, 'away', r.away,
    'home_abbr', r.habbr, 'away_abbr', r.aabbr,
    'format', 'h2h', 'sport', 'soccer',
    'kickoff_at', to_char(r.kick at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'live', false
  )
from rows r
on conflict (id) do nothing;

insert into public.event_options (id, event_id, label, price)
select e.id || '-yes', e.id, e.side_labels->>'yes',
  (case when e.metadata->>'market_type' = 'handicap'
        then (case (e.metadata->>'line')::numeric
                when -2.5 then 0.06 when -1.5 then 0.13 when 1.5 then 0.87 else 0.94 end)
        else (case (e.metadata->>'line')::numeric
                when 0.5 then 0.93 when 1.5 then 0.80 when 2.5 then 0.58
                when 3.5 then 0.34 else 0.10 end) end)
from public.events e
where e.metadata->>'market_type' in ('handicap','total')
on conflict (id) do nothing;

insert into public.event_options (id, event_id, label, price)
select o.event_id || '-no', o.event_id, e.side_labels->>'no', round(1 - o.price, 4)
from public.event_options o
join public.events e on e.id = o.event_id
where o.id like '%-yes' and e.metadata->>'market_type' in ('handicap','total')
on conflict (id) do nothing;