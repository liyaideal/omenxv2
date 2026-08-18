-- ============================================================
-- Sports lines v1.1 — league map + soccer line generation/pricing
-- ============================================================

create table if not exists public.sports_league_map (
  league text primary key,
  sport text not null
);

grant select on public.sports_league_map to anon;
grant select on public.sports_league_map to authenticated;
grant all on public.sports_league_map to service_role;

alter table public.sports_league_map enable row level security;

drop policy if exists "League map is public" on public.sports_league_map;
create policy "League map is public"
  on public.sports_league_map for select
  using (true);

insert into public.sports_league_map (league, sport) values
  ('Premier League','soccer'),
  ('LaLiga','soccer'),
  ('UCL','soccer'),
  ('Bundesliga','soccer'),
  ('Serie A','soccer'),
  ('Ligue 1','soccer'),
  ('CSL','soccer'),
  ('K League 1','soccer'),
  ('MLS','soccer'),
  ('Eredivisie','soccer'),
  ('Primeira Liga','soccer'),
  ('Greek Cup','soccer'),
  ('NBA','basketball'),
  ('WNBA','basketball'),
  ('EuroLeague','basketball'),
  ('NFL','football'),
  ('NHL','hockey'),
  ('MLB','baseball'),
  ('ATP Finals','tennis'),
  ('F1 Qatar GP','motorsport'),
  ('UFC 321 · Main','mma')
on conflict (league) do nothing;

-- ------------------------------------------------------------
-- Poisson sampler (demo engine only)
-- ------------------------------------------------------------
create or replace function public.sim_poisson(p_lambda numeric)
returns int
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  l double precision := exp(-greatest(0.05, p_lambda)::double precision);
  p double precision := 1;
  k int := -1;
begin
  loop
    k := k + 1;
    p := p * random();
    exit when p <= l or k >= 12;
  end loop;
  return k;
end;
$$;

-- ------------------------------------------------------------
-- A2 · line prices derived from the winner's 1X2 prices
-- ------------------------------------------------------------
create or replace function public.soccer_line_prices(
  p_home numeric, p_draw numeric, p_away numeric
)
returns table(market_type text, line numeric, yes_price numeric)
language plpgsql
immutable
security definer
set search_path = public
as $$
declare
  s numeric;
  lam numeric := 2.6;
  l numeric;
  k int;
  cdf numeric;
  term numeric;
  i int;
begin
  s := coalesce(p_home, 0) - coalesce(p_away, 0);

  foreach l in array array[-2.5, -1.5, 1.5, 2.5] loop
    market_type := 'handicap';
    line := l;
    yes_price := round(
      least(0.97, greatest(0.03,
        0.5 + 0.5 * tanh(((l * 0.9) + (s * 1.6))::double precision)::numeric
      ))::numeric, 4);
    return next;
  end loop;

  foreach l in array array[0.5, 1.5, 2.5, 3.5, 4.5] loop
    k := floor(l)::int;
    cdf := 0;
    term := 1;
    for i in 0..k loop
      if i > 0 then term := term * lam / i; end if;
      cdf := cdf + term;
    end loop;
    cdf := cdf * exp(-lam);
    market_type := 'total';
    line := l;
    yes_price := round(least(0.97, greatest(0.03, 1 - cdf))::numeric, 4);
    return next;
  end loop;
end;
$$;

-- ------------------------------------------------------------
-- winner 1X2 prices of a fixture
-- ------------------------------------------------------------
create or replace function public.soccer_winner_prices(
  p_fixture_id text,
  out ph numeric, out pd numeric, out pa numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  w record;
begin
  select id, metadata into w from public.events where id = p_fixture_id;
  if not found then return; end if;

  select price into ph from public.event_options
    where event_id = w.id and label = w.metadata->>'home' limit 1;
  select price into pd from public.event_options
    where event_id = w.id and label = 'Draw' limit 1;
  select price into pa from public.event_options
    where event_id = w.id and label = w.metadata->>'away' limit 1;

  if ph is null then
    select price into ph from public.event_options
      where event_id = w.id order by id offset 0 limit 1;
  end if;
  if pd is null then
    select price into pd from public.event_options
      where event_id = w.id order by id offset 1 limit 1;
  end if;
  if pa is null then
    select price into pa from public.event_options
      where event_id = w.id order by id offset 2 limit 1;
  end if;
end;
$$;

-- ------------------------------------------------------------
-- reprice all siblings of a fixture from the winner's prices
-- ------------------------------------------------------------
create or replace function public.reprice_soccer_lines(p_fixture_id text)
returns int
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  ph numeric; pd numeric; pa numeric;
  sib record;
  yp numeric;
  n int := 0;
begin
  select * into ph, pd, pa from public.soccer_winner_prices(p_fixture_id);
  if ph is null or pa is null then return 0; end if;

  for sib in
    select e.id, e.metadata->>'market_type' as mt, (e.metadata->>'line')::numeric as ln
    from public.events e
    where e.metadata->>'fixture_id' = p_fixture_id
      and e.metadata->>'market_type' in ('handicap','total')
      and e.is_resolved = false
  loop
    select p.yes_price into yp
    from public.soccer_line_prices(ph, pd, pa) p
    where p.market_type = sib.mt and p.line = sib.ln;
    if yp is null then continue; end if;

    update public.event_options
      set price = yp, updated_at = now()
      where id = sib.id || '-yes';
    update public.event_options
      set price = round((1 - yp)::numeric, 4), updated_at = now()
      where id = sib.id || '-no';
    n := n + 1;
  end loop;

  return n;
end;
$$;

-- ------------------------------------------------------------
-- A1 · create any missing Handicap / Total siblings for a soccer fixture
-- ------------------------------------------------------------
create or replace function public.ensure_soccer_lines(p_fixture_id text)
returns int
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  w record;
  is_soccer boolean;
  ph numeric; pd numeric; pa numeric;
  l numeric;
  sid text;
  sname text;
  yl text; nl text;
  mt text;
  yp numeric;
  created int := 0;
  home text; away text; habbr text; aabbr text; league text;
  minus text := U&'\2212';
begin
  select * into w from public.events
    where id = p_fixture_id and event_subtype = 'SPORTS_MATCH';
  if not found then return 0; end if;
  if coalesce(w.metadata->>'market_type', 'winner') <> 'winner' then return 0; end if;

  is_soccer :=
    (w.metadata->>'sport' = 'soccer')
    or (w.metadata->>'format' = '1x2')
    or exists (
      select 1 from public.sports_league_map m
      where m.league = w.metadata->>'league' and m.sport = 'soccer'
    );
  if not is_soccer then return 0; end if;

  update public.events
    set metadata = coalesce(metadata, '{}'::jsonb)
      || jsonb_build_object('fixture_id', id, 'market_type', 'winner', 'sport', 'soccer'),
        updated_at = now()
    where id = w.id;

  home   := coalesce(w.metadata->>'home', w.name);
  away   := coalesce(w.metadata->>'away', '');
  habbr  := coalesce(w.metadata->>'home_abbr', upper(left(home, 3)));
  aabbr  := coalesce(w.metadata->>'away_abbr', upper(left(away, 3)));
  league := coalesce(w.metadata->>'league', '');

  select * into ph, pd, pa from public.soccer_winner_prices(w.id);

  for mt, l, yp in
    select p.market_type, p.line, p.yes_price
    from public.soccer_line_prices(ph, pd, pa) p
  loop
    if mt = 'handicap' then
      sid := w.id || '-hcp-' || replace(replace(l::text, '-', 'm'), '.', 'p');
      sname := home || ' vs ' || away || ' — handicap '
        || (case when l < 0 then minus else '+' end) || abs(l)::text;
      yl := habbr || ' ' || (case when l < 0 then minus else '+' end) || abs(l)::text;
      nl := aabbr || ' ' || (case when l < 0 then '+' else minus end) || abs(l)::text;
    else
      sid := w.id || '-tot-' || replace(l::text, '.', 'p');
      sname := home || ' vs ' || away || ' — total goals ' || l::text;
      yl := 'Over ' || l::text;
      nl := 'Under ' || l::text;
    end if;

    if exists (select 1 from public.events where id = sid) then
      continue;
    end if;

    insert into public.events (
      id, name, icon, category, description, rules, start_date, end_date, volume,
      is_resolved, product_lines, event_subtype, side_labels, metadata,
      lifecycle_status, freeze_time, expected_settlement_time
    )
    values (
      sid, sname, coalesce(w.icon, ''), w.category,
      league || ' · ' || home || ' v ' || away
        || '. Winning shares pay $1, losing shares pay $0.',
      'Settles on the regulation-time result of ' || home || ' v ' || away
        || ' (' || league || '). Extra time and penalties do not count. Winning shares pay $1.',
      w.start_date, w.end_date, (60000 + (random() * 90000))::int::text,
      false, w.product_lines, 'SPORTS_MATCH',
      jsonb_build_object('yes', yl, 'no', nl),
      jsonb_build_object(
        'fixture_id', w.id, 'market_type', mt, 'line', l,
        'league', league, 'home', home, 'away', away,
        'home_abbr', habbr, 'away_abbr', aabbr,
        'format', 'h2h', 'sport', 'soccer',
        'kickoff_at', to_char(w.start_date at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'live', false
      ),
      w.lifecycle_status, w.freeze_time, w.expected_settlement_time
    )
    on conflict (id) do nothing;

    insert into public.event_options (id, event_id, label, price)
      values (sid || '-yes', sid, yl, yp)
      on conflict (id) do nothing;
    insert into public.event_options (id, event_id, label, price)
      values (sid || '-no', sid, nl, round((1 - yp)::numeric, 4))
      on conflict (id) do nothing;

    created := created + 1;
  end loop;

  return created;
end;
$$;
