-- ============================================================
-- Mainnet catalog sync · batch 1 (sports + long-dated) — CPO 2026-11-09
--
-- Lovable shows omenx.com's real events. Every 3 minutes the database pulls
-- the public catalog from www.omenx.com and keeps its own copy of what an
-- event LOOKS like: title, league, teams, team logos, kickoff, live score,
-- match status, stream flag + poster, cover image, options. Rows are
-- `events.id = 'mn-' || <mainnet eventId>`, `metadata.source = 'mainnet'`.
--
-- What is NOT taken from mainnet (A, approved): prices and volume. The first
-- insert seeds them from mainnet once; after that the Lovable engine
-- (sim_price_tick / sim_market_activity_tick) moves them, as before.
-- Settlement uses mainnet's result; PnL uses Lovable's price.
--
-- B (approved): the demo stream showcase stays — demo-live-cs2 (live) and
-- demo-prekick-cs2 (before kickoff) with their sibling markets.
-- Everything else the demo engine invented (sp-*, cs2-*, ufc-*, the other
-- demo-live-* matches, the 45 long-dated demo events) is RETIRED:
-- `metadata.retired = true`. Retired rows are never deleted: they stay
-- reachable by id / name (positions, history, trade page) but no list shows
-- them. Open positions on them run to settlement; retired fixtures are not
-- rescheduled after they settle.
--
-- Endpoints (public, no auth):
--   /pub/sports/calendar/query?page=1&pageSize=100  sports schedule, teams, logos, scores, status
--   /pub/event/list?pageNum=1&pageSize=200&status=TRADING   the whole trading catalog
--   /pub/event/homepage?pageNum=1&pageSize=100      cover images
--   /pub/event/detail?eventId=…                     result + rules (only when needed)
-- Batch 2 (later): stock dailies and crypto rounds line-up.
-- ============================================================

create table if not exists public.mn_sync_requests (
  req_id     bigint primary key,
  kind       text not null,           -- calendar | catalog | homepage | detail
  key        text,
  created_at timestamptz not null default now()
);
alter table public.mn_sync_requests enable row level security;

create table if not exists public.mn_sync_log (
  id     bigserial primary key,
  ran_at timestamptz not null default now(),
  stats  jsonb
);
alter table public.mn_sync_log enable row level security;

-- Team "logos" on the US-league feed (NBA / NFL / NHL / MLB) are flat colour
-- tiles with the team code printed on them, not crests. The home badge rule
-- (S1) draws those as a badge in the tile's colour + the code. The images send
-- no CORS header, so the page cannot sample them: the colour is looked up here
-- (sampled once from the image corners) and synced as metadata.home_tile /
-- away_tile. A tile not in this table shows as the image.
create table if not exists public.mn_logo_tiles (url text primary key, color text not null);
alter table public.mn_logo_tiles enable row level security;
insert into public.mn_logo_tiles (url, color)
select 'https://polymarket-upload.s3.us-east-2.amazonaws.com/' || split_part(x,':',1) || '+Team+Logos/' || split_part(x,':',2) || '.png', '#' || split_part(x,':',3)
from unnest(string_to_array('NBA:ATL:F65155 NBA:BKN:616161 NBA:BOS:09A74B NBA:CHA:0F9BB2 NBA:CHI:CE1141 NBA:CLE:D23E7C NBA:DAL:3794D4 NBA:DEN:DDAC22 NBA:DET:DF2D4A NBA:GSW:3F7AF0 NBA:HOU:EE3866 NBA:IND:E9AA27 NBA:LAC:4E78C9 NBA:LAL:8B59BA NBA:MEM:5E87DB NBA:MIA:DB3366 NBA:MIL:369D5D NBA:MIN:2F83C4 NBA:NOP:B59354 NBA:NYK:F58426 NBA:OKC:0687D2 NBA:ORL:2195DD NBA:PHI:1386D7 NBA:PHX:F97535 NBA:POR:FA5559 NBA:SAC:9248D3 NBA:SAS:799AAE NBA:TOR:E93160 NBA:UTA:3FA064 NBA:WAS:4A7AB0 NFL:BUF:1E57CC NFL:MIN:623599 NFL:NYG:2545A4 NFL:WSH:841F1F NHL:ANA:FA773A NHL:BOS:F7BE23 NHL:BUF:205BC7 NHL:CAR:DA393C NHL:CBJ:1C5FB3 NHL:CGY:EA354A NHL:CHI:C8102B NHL:COL:93475F NHL:DAL:049A63 NHL:DET:E7304F NHL:EDM:F38131 NHL:FLA:EEBE6E NHL:LAK:9DA6A9 NHL:MIN:37A661 NHL:MTL:CE1141 NHL:NJD:E62B28 NHL:NSH:F6B21B NHL:NYI:0B61AA NHL:NYR:3794D4 NHL:OTT:DF2D4A NHL:PHI:F26D38 NHL:PIT:FBC44B NHL:SEA:649CB2 NHL:SJS:128B93 NHL:STL:1460A6 NHL:TBL:16479D NHL:TOR:1469BB NHL:UTA:7AB3E0 NHL:VAN:3E67AB NHL:VGK:BEA063 NHL:WPG:0F4888 NHL:WSH:C91429', ' ')) x
on conflict (url) do update set color = excluded.color;

-- ---------------------------------------------------------------- helpers
create or replace function public.mn_sport_of(p_code text, p_shape text, p_team text)
returns text language sql immutable as $$
  select case
    when upper(coalesce(p_code,'')) in ('NBA','WNBA','NCAAB','CBA','EUROLEAGUE') then 'basketball'
    when upper(coalesce(p_code,'')) in ('NHL','KHL') then 'hockey'
    when upper(coalesce(p_code,'')) in ('NFL','NCAAF') then 'american_football'
    when upper(coalesce(p_code,'')) in ('MLB','NPB','KBO') then 'baseball'
    when upper(coalesce(p_code,'')) like 'UFC%' or upper(coalesce(p_code,'')) in ('MMA','PFL') then 'mma'
    when upper(coalesce(p_code,'')) in ('CS2','CSGO','LOL','DOTA2','VALORANT','VAL') then 'esports'
    when upper(coalesce(p_code,'')) in ('ATP','WTA') then 'tennis'
    when p_shape = 'three-way' or coalesce(p_team,'') like 'SOCCER\_%' or coalesce(p_team,'') like 'WC\_%' then 'soccer'
    else null end
$$;

create or replace function public.mn_match_status(p text, p_kickoff timestamptz)
returns text language sql stable as $$
  select case upper(coalesce(p,''))
    when 'NOT_STARTED' then 'scheduled'
    when 'LIVE' then 'live'
    when 'IN_PROGRESS' then 'live'
    when 'FINISHED' then 'final'
    when 'ENDED' then 'final'
    when 'COMPLETED' then 'final'
    when 'CANCELLED' then 'cancelled'
    when 'CANCELED' then 'cancelled'
    when 'SUSPENDED' then case when p_kickoff > now() then 'postponed' else 'live' end
    else null end
$$;

-- A name no other row uses (trades and positions find their event by name).
create or replace function public.mn_unique_name(p_name text, p_id text, p_when timestamptz)
returns text language plpgsql stable as $$
declare n text := btrim(p_name);
begin
  if exists (select 1 from public.events where name = n and id <> p_id) then
    n := n || ' · ' || to_char(p_when at time zone 'UTC', 'Mon FMDD');
  end if;
  if exists (select 1 from public.events where name = n and id <> p_id) then
    n := n || ' · ' || right(p_id, 4);
  end if;
  return n;
end $$;

-- ---------------------------------------------------------------- settle one synced event
create or replace function public.mn_settle(p_id text, p_winners text[], p_note text)
returns int language plpgsql security definer set search_path to 'public' as $$
declare paid int := 0;
begin
  if p_winners is null or array_length(p_winners, 1) is null then return 0; end if;
  if not exists (select 1 from public.events where id = p_id and is_resolved = false) then return 0; end if;
  update public.event_options
     set is_winner = (id = any(p_winners)),
         final_price = case when id = any(p_winners) then 1 else 0 end,
         updated_at = now()
   where event_id = p_id;
  update public.events
     set is_resolved = true, settled_at = now(), lifecycle_status = 'SETTLED',
         winning_option_id = p_winners[1],
         settlement_description = p_note,
         metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object('match_status','final','live',false),
         updated_at = now()
   where id = p_id;
  paid := public.settle_spot_event(p_id);
  return 1;
end $$;

-- ---------------------------------------------------------------- apply: sports calendar
create or replace function public.mn_apply_calendar(c jsonb)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare
  ev jsonb; t1 jsonb; t2 jsonb; oy jsonb; o jsonb;
  v_mid text; v_id text; three boolean; flipped boolean;
  kick timestamptz; ms text; sport text; dur interval; nm text; lg text;
  s1 text; s2 text; score text; meta jsonb; outs jsonb;
  p1 numeric; p2 numeric; p3 numeric; tot numeric;
  l1 text; l2 text; l3 text;
  ins int := 0; upd int := 0;
begin
  for ev in
    select x from jsonb_array_elements(coalesce(c->'data','[]'::jsonb)) d,
                  jsonb_array_elements(coalesce(d->'events','[]'::jsonb)) x
  loop
    v_mid := ev->>'eventId';
    continue when v_mid is null or coalesce(ev->>'sportsEventType','MATCH_RESULT') <> 'MATCH_RESULT';
    v_id := 'mn-' || v_mid;
    three := (ev->>'shape') = 'three-way';
    flipped := false;
    -- Lovable's "home" slot = the team named first in mainnet's title
    -- (binary: the YES side; three-way: mainnet's home team).
    if three then
      t1 := ev->'homeTeam'; t2 := ev->'awayTeam';
    else
      select x into oy from jsonb_array_elements(ev->'outcomes') x where x->>'side' = 'YES' limit 1;
      if oy->>'teamId' is not null and oy->>'teamId' = ev->'awayTeam'->>'teamId' then
        t1 := ev->'awayTeam'; t2 := ev->'homeTeam'; flipped := true;
      else
        t1 := ev->'homeTeam'; t2 := ev->'awayTeam';
      end if;
    end if;

    kick := (ev->>'kickoffTime')::timestamp at time zone 'UTC';
    ms := public.mn_match_status(ev->>'matchStatus', kick);
    lg := coalesce(ev->'tournament'->>'name', ev->'tournament'->>'shortCode', '');
    sport := public.mn_sport_of(ev->'tournament'->>'shortCode', ev->>'shape', t1->>'teamId');
    dur := case sport
      when 'soccer' then interval '115 minutes'
      when 'basketball' then interval '150 minutes'
      when 'hockey' then interval '150 minutes'
      when 'american_football' then interval '200 minutes'
      when 'baseball' then interval '190 minutes'
      else interval '180 minutes' end;
    if ms in ('live','final') then
      s1 := case when flipped then ev->>'liveAwayScore' else ev->>'liveHomeScore' end;
      s2 := case when flipped then ev->>'liveHomeScore' else ev->>'liveAwayScore' end;
      score := case when s1 is not null and s2 is not null then s1 || '-' || s2 end;
    else
      score := null;
    end if;

    -- option ↔ mainnet market map
    if three then
      select x into o from jsonb_array_elements(ev->'outcomes') x where x->>'teamId' = t1->>'teamId' limit 1;
      l1 := coalesce(o->>'label', t1->>'name'); p1 := coalesce((o->>'price')::numeric, 0.4);
      outs := jsonb_build_array(jsonb_build_object('opt', v_id || '-o1', 'marketId', o->>'marketId', 'side', 'YES'));
      select x into o from jsonb_array_elements(ev->'outcomes') x where x->>'teamId' is null limit 1;
      l2 := 'Draw'; p2 := coalesce((o->>'price')::numeric, 0.25);
      outs := outs || jsonb_build_object('opt', v_id || '-o2', 'marketId', o->>'marketId', 'side', 'YES');
      select x into o from jsonb_array_elements(ev->'outcomes') x where x->>'teamId' = t2->>'teamId' limit 1;
      l3 := coalesce(o->>'label', t2->>'name'); p3 := coalesce((o->>'price')::numeric, 0.35);
      outs := outs || jsonb_build_object('opt', v_id || '-o3', 'marketId', o->>'marketId', 'side', 'YES');
      tot := greatest(p1 + p2 + p3, 0.0001);
      p1 := round(greatest(0.01, p1 / tot), 4); p2 := round(greatest(0.01, p2 / tot), 4);
      p3 := round(greatest(0.01, 1 - p1 - p2), 4);
    else
      select x into oy from jsonb_array_elements(ev->'outcomes') x where x->>'side' = 'YES' limit 1;
      select x into o  from jsonb_array_elements(ev->'outcomes') x where x->>'side' = 'NO'  limit 1;
      l1 := coalesce(oy->>'label', t1->>'name'); l2 := coalesce(o->>'label', t2->>'name');
      p1 := round(least(0.98, greatest(0.02, coalesce((oy->>'price')::numeric, 0.5))), 4);
      p2 := round(1 - p1, 4);
      outs := jsonb_build_array(
        jsonb_build_object('opt', v_id || '-o1', 'marketId', oy->>'marketId', 'side', 'YES'),
        jsonb_build_object('opt', v_id || '-o2', 'marketId', oy->>'marketId', 'side', 'NO'));
    end if;

    meta := jsonb_build_object(
      'source', 'mainnet', 'mainnet_id', v_mid, 'mn_seen_at', now(), 'mn_status', ev->>'status',
      'home', t1->>'name', 'away', t2->>'name',
      'home_abbr', t1->>'shortCode', 'away_abbr', t2->>'shortCode',
      'home_logo', coalesce(t1->>'logoUrl', t1->>'flagUrl'), 'away_logo', coalesce(t2->>'logoUrl', t2->>'flagUrl'),
      'home_tile', (select color from public.mn_logo_tiles where url = coalesce(t1->>'logoUrl', t1->>'flagUrl')),
      'away_tile', (select color from public.mn_logo_tiles where url = coalesce(t2->>'logoUrl', t2->>'flagUrl')),
      'league', lg, 'league_code', ev->'tournament'->>'shortCode', 'league_logo', ev->'tournament'->>'logoUrl',
      'sport', sport, 'format', case when three then '1x2' else 'h2h' end,
      'kickoff_at', to_char(kick at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      'market_type', 'winner', 'fixture_id', v_id,
      'match_status', ms, 'live', ms = 'live', 'score', score,
      'status_label', nullif(btrim(coalesce(ev->>'statusDetail','')), ''),
      'mn_outcomes', outs,
      'stream_url', case when (ev->>'isLiveStream')::boolean then 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' end,
      'stream_thumb_url', case when (ev->>'isLiveStream')::boolean then ev->>'livePosterUrl' end,
      'stream_thumb_at', case when (ev->>'isLiveStream')::boolean and ev->>'livePosterUrl' is not null then now() end
    );

    if not exists (select 1 from public.events where id = v_id) then
      nm := public.mn_unique_name(regexp_replace(coalesce(ev->>'title', (t1->>'name') || ' vs. ' || (t2->>'name')), '^【[^】]*】\s*', ''), v_id, kick);
      insert into public.events (id, name, icon, category, description, rules, start_date, end_date,
                                 expected_settlement_time, volume, product_lines, event_subtype,
                                 lifecycle_status, is_resolved, image_url, side_labels, metadata)
      values (v_id, nm, '', 'sports',
              lg || ' · ' || (t1->>'name') || ' vs ' || (t2->>'name') || '. Winning shares pay $1, losing shares pay $0.',
              'Settles on the official result of ' || (t1->>'name') || ' vs ' || (t2->>'name') || ' (' || lg || '), as published by OmenX. Winning shares pay $1, losing shares pay $0.',
              kick, kick + dur, kick + dur,
              round(coalesce((ev->>'volumeTotal')::numeric, 0), 2)::text,
              array['contract'], 'SPORTS_MATCH', 'TRADING', false, '/card-bg/sports.jpg',
              case when three then null else jsonb_build_object('yes', l1, 'no', l2) end,
              meta);
      if three then
        insert into public.event_options (id, event_id, label, price) values
          (v_id || '-o1', v_id, l1, p1), (v_id || '-o2', v_id, l2, p2), (v_id || '-o3', v_id, l3, p3);
      else
        insert into public.event_options (id, event_id, label, price) values
          (v_id || '-o1', v_id, l1, p1), (v_id || '-o2', v_id, l2, p2);
      end if;
      ins := ins + 1;
    else
      update public.events
         set start_date = kick,
             end_date = greatest(kick + dur, case when ms = 'live' then now() + interval '30 minutes' else kick + dur end),
             expected_settlement_time = kick + dur,
             metadata = (coalesce(metadata,'{}'::jsonb) - 'stream_url' - 'stream_thumb_url' - 'stream_thumb_at')
                        || jsonb_strip_nulls(meta) || jsonb_build_object('match_status', ms, 'score', score, 'live', ms = 'live', 'status_label', meta->'status_label')
       where id = v_id and is_resolved = false;
      upd := upd + 1;
    end if;
  end loop;
  return jsonb_build_object('calendar_inserted', ins, 'calendar_updated', upd);
end $$;

-- ---------------------------------------------------------------- apply: trading catalog (long-dated only in batch 1)
create or replace function public.mn_apply_catalog(c jsonb)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare
  ev jsonb; m jsonb; v_mid text; v_id text; cat text; nm text; lock_at timestamptz; i int;
  ins int := 0; upd int := 0; p numeric;
begin
  for ev in select x from jsonb_array_elements(coalesce(c->'data'->'data','[]'::jsonb)) x loop
    v_mid := ev->>'eventId';
    -- long-dated = not sports, not a series round (crypto 5m…1d, stock daily), not a stock code
    continue when v_mid is null
              or (ev->>'categoryId') = '2'
              or ev->>'seriesPeriod' is not null
              or coalesce(ev->>'stockCode','') <> ''
              or coalesce(ev->>'marketRegion','') <> '';
    v_id := 'mn-' || v_mid;
    lock_at := (ev->>'lockTime')::timestamp at time zone 'UTC';
    cat := case ev->>'categoryId' when '4' then 'crypto' when '5' then 'finance'
                                  when '10' then 'sports' when '12' then 'sports' when '13' then 'sports'
                                  else 'finance' end;
    if not exists (select 1 from public.events where id = v_id) then
      nm := public.mn_unique_name(ev->>'title', v_id, lock_at);
      insert into public.events (id, name, icon, category, description, start_date, end_date,
                                 volume, product_lines, lifecycle_status, is_resolved, image_url, metadata)
      values (v_id, nm, '', cat, ev->>'title',
              coalesce((ev->>'tradingStart')::timestamp at time zone 'UTC', now()), lock_at,
              round(coalesce((ev->>'totalVolume')::numeric, 0), 2)::text,
              array['futures'], 'TRADING', false, '/card-bg/' || cat || '.jpg',
              jsonb_build_object('source','mainnet','mainnet_id',v_mid,'mn_seen_at',now(),
                                 'mainnet_slug', ev->>'slug', 'mn_event_type', ev->>'eventType',
                                 'independent_options', (ev->>'eventType') = 'MULTIPLE_CHOICE'));
      i := 0;
      if (ev->>'eventType') = 'MULTIPLE_CHOICE' then
        -- each mainnet market is its own Yes/No book → one Lovable option per market, priced at its Yes chance
        for m in select x from jsonb_array_elements(coalesce(ev->'markets','[]'::jsonb)) x loop
          i := i + 1;
          p := coalesce((m->>'lastTradePrice')::numeric, (m->>'yesChance')::numeric / 100, (m->>'lastPrice')::numeric, 0.5);
          insert into public.event_options (id, event_id, label, price)
          values (v_id || '-m' || i, v_id, coalesce(m->>'title', m->>'question', 'Option ' || i),
                  round(least(0.98, greatest(0.02, p)), 4));
        end loop;
        update public.events set metadata = metadata || jsonb_build_object('mn_outcomes',
          (select jsonb_agg(jsonb_build_object('opt', v_id || '-m' || n, 'marketId', x->>'marketId', 'side', 'YES') order by n)
             from jsonb_array_elements(ev->'markets') with ordinality t(x, n)))
         where id = v_id;
      else
        m := ev->'markets'->0;
        p := round(least(0.98, greatest(0.02, coalesce((m->>'lastTradePrice')::numeric, (m->>'yesChance')::numeric / 100, 0.5))), 4);
        insert into public.event_options (id, event_id, label, price) values
          (v_id || '-yes', v_id, coalesce(m->>'yesOutcomeLabel', 'Yes'), p),
          (v_id || '-no',  v_id, coalesce(m->>'noOutcomeLabel',  'No'),  round(1 - p, 4));
        update public.events set
          side_labels = jsonb_build_object('yes', coalesce(m->>'yesOutcomeLabel','Yes'), 'no', coalesce(m->>'noOutcomeLabel','No')),
          metadata = metadata || jsonb_build_object('mn_outcomes', jsonb_build_array(
            jsonb_build_object('opt', v_id || '-yes', 'marketId', m->>'marketId', 'side', 'YES'),
            jsonb_build_object('opt', v_id || '-no',  'marketId', m->>'marketId', 'side', 'NO')))
         where id = v_id;
      end if;
      ins := ins + 1;
    else
      update public.events
         set end_date = lock_at,
             metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object('mn_seen_at', now(), 'mn_status', ev->>'status')
       where id = v_id and is_resolved = false;
      upd := upd + 1;
    end if;
  end loop;
  return jsonb_build_object('catalog_inserted', ins, 'catalog_updated', upd);
end $$;

-- ---------------------------------------------------------------- apply: cover images
create or replace function public.mn_apply_homepage(c jsonb)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare n int;
begin
  update public.events e
     set image_url = x->>'imageUrl'
    from jsonb_array_elements(coalesce(c->'data'->'data','[]'::jsonb)) x
   where e.id = 'mn-' || (x->>'eventId')
     and coalesce(x->>'imageUrl','') like 'http%'
     and e.image_url is distinct from x->>'imageUrl';
  get diagnostics n = row_count;
  return jsonb_build_object('covers', n);
end $$;

-- ---------------------------------------------------------------- apply: one event's detail (result + rules)
create or replace function public.mn_apply_detail(p_id text, c jsonb)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare
  d jsonb := c->'data'; ev record; wo text; w text[] := '{}'; o jsonb; mk jsonb; ss text; ms text;
begin
  select * into ev from public.events where id = p_id;
  if ev.id is null or d is null or jsonb_typeof(d) <> 'object' then return '{}'::jsonb; end if;

  -- rules / summary for long-dated rows (first time only)
  if ev.event_subtype is null and ev.metadata->>'mn_detail_at' is null then
    update public.events
       set description = coalesce(nullif(btrim(d->>'summary'), ''), description),
           rules = coalesce(nullif(btrim(case when jsonb_typeof(d->'marketRules') = 'string' then d->>'marketRules' else d->>'summary' end), ''), rules),
           source_name = coalesce(case when jsonb_typeof(d->'resolutionSource') = 'string' then nullif(d->>'resolutionSource', '') end, source_name)
     where id = p_id;
  end if;
  update public.events set metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object('mn_detail_at', now())
   where id = p_id;

  if ev.is_resolved then return '{}'::jsonb; end if;

  ss := upper(coalesce(d->>'settlementStatus', ''));
  ms := public.mn_match_status(d->>'sportsMatchStatus', coalesce((ev.metadata->>'kickoff_at')::timestamptz, now()));
  wo := upper(coalesce(d->>'winningOutcome', ''));

  -- winners from per-market results
  for o in select x from jsonb_array_elements(coalesce(ev.metadata->'mn_outcomes','[]'::jsonb)) x loop
    mk := null;
    select x into mk from jsonb_array_elements(case when jsonb_typeof(d->'markets') = 'array' then d->'markets' else '[]'::jsonb end) x
     where x->>'marketId' = o->>'marketId' limit 1;
    if mk is not null and coalesce(mk->>'winningOutcome','') <> ''
       and upper(mk->>'winningOutcome') = upper(o->>'side') then
      w := w || (o->>'opt');
    end if;
  end loop;
  -- or from the event-level result: YES / NO / a market id / a label
  if array_length(w, 1) is null and wo <> '' then
    select array_agg(x->>'opt') into w from jsonb_array_elements(coalesce(ev.metadata->'mn_outcomes','[]'::jsonb)) x
     where (jsonb_array_length(ev.metadata->'mn_outcomes') = 2 and upper(x->>'side') = wo)
        or upper(x->>'marketId') = wo;
    if w is null then
      select array_agg(id) into w from public.event_options where event_id = p_id and upper(label) = wo;
    end if;
  end if;

  if array_length(w, 1) is not null then
    perform public.mn_settle(p_id, w, 'Settled on the OmenX result.');
    return jsonb_build_object('settled', p_id);
  end if;

  -- no result yet: mirror the match status (final / cancelled → In review)
  if ms is not null and ev.event_subtype = 'SPORTS_MATCH' then
    update public.events set metadata = metadata || jsonb_build_object('match_status', ms, 'live', ms = 'live')
     where id = p_id;
  end if;
  if ss in ('VOID','CANCELLED','CANCELED','REFUNDED') then
    update public.events set lifecycle_status = 'REVIEW',
           metadata = metadata || jsonb_build_object('match_status', 'cancelled')
     where id = p_id;
  end if;
  return jsonb_build_object('pending', p_id);
end $$;

-- ---------------------------------------------------------------- apply every answered request
create or replace function public.mn_sync_apply()
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare r record; body jsonb; res jsonb; stats jsonb := '{}'::jsonb; k text;
begin
  for r in
    select q.req_id, q.kind, q.key, h.status_code, h.content
      from public.mn_sync_requests q
      join net._http_response h on h.id = q.req_id
     order by q.req_id
  loop
    res := '{}'::jsonb;
    begin
      if r.status_code = 200 then
        body := r.content::jsonb;
        if r.kind = 'calendar' then res := public.mn_apply_calendar(body);
        elsif r.kind = 'catalog' then res := public.mn_apply_catalog(body);
        elsif r.kind = 'homepage' then res := public.mn_apply_homepage(body);
        elsif r.kind = 'detail' then res := public.mn_apply_detail(r.key, body);
        end if;
      else
        res := jsonb_build_object('http_' || r.kind, r.status_code);
      end if;
    exception when others then
      res := jsonb_build_object('error_' || r.kind, sqlerrm);
    end;
    for k in select jsonb_object_keys(res) loop
      if jsonb_typeof(res->k) = 'number' and jsonb_typeof(stats->k) = 'number' then
        stats := stats || jsonb_build_object(k, (stats->>k)::numeric + (res->>k)::numeric);
      else
        stats := stats || jsonb_build_object(k, res->k);
      end if;
    end loop;
    delete from public.mn_sync_requests where req_id = r.req_id;
  end loop;
  -- requests pg_net never answered
  delete from public.mn_sync_requests where created_at < now() - interval '30 minutes';
  if stats <> '{}'::jsonb then
    insert into public.mn_sync_log (stats) values (stats);
    delete from public.mn_sync_log where ran_at < now() - interval '3 days';
  end if;
  return stats;
end $$;

-- ---------------------------------------------------------------- fire this round's requests
create or replace function public.mn_sync_request()
returns int language plpgsql security definer set search_path to 'public' as $$
declare base text := 'https://www.omenx.com'; n int := 0; e record;
begin
  insert into public.mn_sync_requests (req_id, kind, key) values
    (net.http_get(base || '/pub/sports/calendar/query?page=1&pageSize=100', timeout_milliseconds := 20000), 'calendar', '1'),
    (net.http_get(base || '/pub/sports/calendar/query?page=2&pageSize=100', timeout_milliseconds := 20000), 'calendar', '2'),
    (net.http_get(base || '/pub/event/list?pageNum=1&pageSize=200&status=TRADING', timeout_milliseconds := 20000), 'catalog', '1'),
    (net.http_get(base || '/pub/event/homepage?pageNum=1&pageSize=100', timeout_milliseconds := 20000), 'homepage', '1');
  n := 4;
  -- results / rules, only for rows that need them (max 15 a round)
  for e in
    select id, metadata->>'mainnet_id' mid from public.events
     where id like 'mn-%' and is_resolved = false
       and (metadata->>'mn_detail_req_at' is null or (metadata->>'mn_detail_req_at')::timestamptz < now() - interval '6 minutes')
       and (
             (event_subtype is null and metadata->>'mn_detail_at' is null)                       -- rules not fetched yet
          or coalesce(metadata->>'match_status','') in ('final','cancelled')                     -- finished: look for the result
          or coalesce(metadata->>'mn_status','TRADING') <> 'TRADING'                             -- mainnet stopped trading it
          or (metadata->>'mn_seen_at')::timestamptz < now() - interval '10 minutes'              -- dropped out of the feed
       )
     order by end_date nulls last
     limit 15
  loop
    insert into public.mn_sync_requests (req_id, kind, key)
    values (net.http_get(base || '/pub/event/detail?eventId=' || e.mid, timeout_milliseconds := 20000), 'detail', e.id);
    update public.events set metadata = metadata || jsonb_build_object('mn_detail_req_at', now()) where id = e.id;
    n := n + 1;
  end loop;
  return n;
end $$;

revoke all on function public.mn_sync_apply() from public, anon, authenticated;
revoke all on function public.mn_sync_request() from public, anon, authenticated;
revoke all on function public.mn_settle(text, text[], text) from public, anon, authenticated;
revoke all on function public.mn_apply_calendar(jsonb) from public, anon, authenticated;
revoke all on function public.mn_apply_catalog(jsonb) from public, anon, authenticated;
revoke all on function public.mn_apply_homepage(jsonb) from public, anon, authenticated;
revoke all on function public.mn_apply_detail(text, jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------- demo engine: leave mainnet rows alone, stop re-running retired ones
do $$
declare src text; dst text;
begin
  -- roll_sports_matches: never random-settle or reschedule a mainnet row; a retired
  -- fixture only settles when someone still holds it, and is not rescheduled after.
  src := pg_get_functiondef('public.roll_sports_matches'::regproc);
  dst := replace(src,
$a$      AND coalesce(metadata->>'market_type', 'winner') = 'winner'
    ORDER BY end_date$a$,
$a$      AND coalesce(metadata->>'market_type', 'winner') = 'winner'
      AND coalesce(metadata->>'source', '') <> 'mainnet'
      AND (coalesce(metadata->>'retired', '') <> 'true'
           OR (is_resolved = false AND EXISTS (
                 SELECT 1 FROM public.positions p JOIN public.event_options eo ON eo.id = p.option_id
                  WHERE eo.event_id = events.id AND p.status = 'Open')))
    ORDER BY end_date$a$);
  dst := replace(dst,
$a$    PERFORM public.archive_sports_result(m.id);
$a$,
$a$    PERFORM public.archive_sports_result(m.id);

    -- Mainnet catalog sync (2026-11-09): a retired demo fixture is not reopened.
    IF coalesce(m.metadata->>'retired', '') = 'true' THEN CONTINUE; END IF;
$a$);
  dst := replace(dst,
$a$    WHERE e.event_subtype = 'SPORTS_MATCH'
      AND coalesce(e.metadata->>'market_type', 'winner') = 'winner'
      AND ($a$,
$a$    WHERE e.event_subtype = 'SPORTS_MATCH'
      AND coalesce(e.metadata->>'market_type', 'winner') = 'winner'
      AND coalesce(e.metadata->>'source', '') <> 'mainnet'
      AND coalesce(e.metadata->>'retired', '') <> 'true'
      AND ($a$);
  if dst = src or (length(dst) - length(src)) < 400 then raise exception 'roll_sports_matches patch did not apply'; end if;
  execute dst;

  -- tick_live_us_sports: mainnet scores come from mainnet; retired demo-live-* are not reopened.
  src := pg_get_functiondef('public.tick_live_us_sports'::regproc);
  dst := replace(src,
$a$      and metadata->>'sport' in ('american_football','hockey','baseball')$a$,
$a$      and metadata->>'sport' in ('american_football','hockey','baseball')
      and coalesce(metadata->>'source','') <> 'mainnet'$a$);
  dst := replace(dst,
$a$    if m.id like 'demo-live-%' then$a$,
$a$    if m.id like 'demo-live-%' and coalesce(m.metadata->>'retired','') <> 'true' then$a$);
  if dst = src or (length(dst) - length(src)) < 80 then raise exception 'tick_live_us_sports patch did not apply'; end if;
  execute dst;

  -- sim_price_tick: skip retired rows, cover the whole live catalog, and walk
  -- mainnet multi-market events option by option (they are separate Yes/No
  -- books — the prices are not one probability set).
  src := pg_get_functiondef('public.sim_price_tick'::regproc);
  dst := replace(src,
$a$    SELECT ev.id
    FROM public.events ev
    WHERE ev.is_resolved = false
      AND (ev.end_date IS NULL OR ev.end_date > now())
      AND (ev.freeze_time IS NULL OR ev.freeze_time > now())
    LIMIT 100$a$,
$a$    SELECT ev.id, ev.metadata
    FROM public.events ev
    WHERE ev.is_resolved = false
      AND (ev.end_date IS NULL OR ev.end_date > now())
      AND (ev.freeze_time IS NULL OR ev.freeze_time > now())
      AND coalesce(ev.metadata->>'retired', '') <> 'true'
    LIMIT 400$a$);
  dst := replace(dst,
$a$    ELSIF live_cnt > 2 THEN$a$,
$a$    ELSIF live_cnt > 2 AND coalesce(e.metadata->>'independent_options', '') = 'true' THEN
      UPDATE public.event_options
         SET price = round(LEAST(0.98, GREATEST(0.02, price * (1 + (random() - 0.5) * 0.03)))::numeric, 4),
             updated_at = now()
       WHERE event_id = e.id AND final_price IS NULL;
      n := n + live_cnt;

    ELSIF live_cnt > 2 THEN$a$);
  if dst = src or (length(dst) - length(src)) < 200 then raise exception 'sim_price_tick patch did not apply'; end if;
  execute dst;

  -- sim_market_activity_tick: no prints on retired rows.
  src := pg_get_functiondef('public.sim_market_activity_tick'::regproc);
  dst := replace(src,
$a$      AND (ev.end_date IS NULL OR ev.end_date > now())
    LIMIT 60$a$,
$a$      AND (ev.end_date IS NULL OR ev.end_date > now())
      AND coalesce(ev.metadata->>'retired', '') <> 'true'
    ORDER BY random()
    LIMIT 60$a$);
  if dst = src then raise exception 'sim_market_activity_tick patch did not apply'; end if;
  execute dst;

  -- roll_demo_positions: new demo positions open on what Lovable lists now
  -- (mainnet sports + long-dated), never on a retired row or a game-line sibling.
  src := pg_get_functiondef('public.roll_demo_positions'::regproc);
  dst := replace(src,
$a$      AND e.product_lines @> ARRAY['futures']
      AND EXISTS$a$,
$a$      AND e.product_lines && ARRAY['futures','contract']
      AND coalesce(e.metadata->>'retired', '') <> 'true'
      AND coalesce(e.metadata->>'market_type', 'winner') = 'winner'
      AND EXISTS$a$);
  if dst = src then raise exception 'roll_demo_positions patch did not apply'; end if;
  execute dst;
end $$;

-- ---------------------------------------------------------------- retire what the demo engine invented
update public.events
   set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('retired', true, 'retired_at', now(), 'retired_by', 'mainnet-catalog-sync')
 where is_resolved = false
   and id not like 'mn-%'
   and coalesce(metadata->>'retired', '') <> 'true'
   and (
         (event_subtype = 'SPORTS_MATCH'
          and id not in ('demo-live-cs2', 'demo-prekick-cs2')
          and coalesce(metadata->>'fixture_id', '') not in ('demo-live-cs2', 'demo-prekick-cs2'))
      or event_subtype is null
   );

-- ---------------------------------------------------------------- schedule: every 3 minutes, apply last round then fire the next
select cron.unschedule('mainnet-catalog-sync') where exists (select 1 from cron.job where jobname = 'mainnet-catalog-sync');
select cron.schedule('mainnet-catalog-sync', '*/3 * * * *', $$select public.mn_sync_apply(); select public.mn_sync_request();$$);
