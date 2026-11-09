-- ============================================================
-- Mainnet catalog sync · follow-up (CPO 2026-11-09 evening)
--
-- 1. Sports come from the same feed as omenx.com/?tab=sports:
--    /pub/sports/matches with header X-Time-Zone (without it the endpoint
--    answers 400). The calendar feed (/pub/sports/calendar/query, used by the
--    /sports page) carries stale fixtures the home tab does not show.
--    A synced fixture that drops out of the feed for 30 minutes is hidden
--    (retired) until it comes back or settles.
-- 2. Homepage covers: the real query is ?page=1&pageSize=100&surface=STANDARD.
-- 3. Editor's Desk keeps the three picks of the approved home mock, always on:
--    BTC daily close · NVDA higher than it opened · the biggest sports book
--    (Bills vs Vikings while it is open, then the biggest NFL / sports match).
--    They follow the live round of each series, re-pointed every 3 minutes.
-- 4. More keeps four demo long-dated events beside mainnet's one, in the
--    four looks the section has (exclusive 5-way with "+1 more", exclusive
--    4-way, date buckets, binary). Never touched by the sync.
-- ============================================================

-- ---------------------------------------------------------------- 1. /pub/sports/matches → calendar shape
create or replace function public.mn_matches_to_calendar(c jsonb)
returns jsonb language sql immutable as $$
  select jsonb_build_object('data', jsonb_build_array(jsonb_build_object('events', coalesce(jsonb_agg(
    jsonb_build_object(
      'eventId', m->>'eventId',
      'sportsEventType', 'MATCH_RESULT',
      'shape', case when jsonb_array_length(coalesce(m->'outcomes','[]'::jsonb)) >= 3 then 'three-way' else 'binary' end,
      'tournament', m->'tournament',
      'homeTeam', m->'homeTeam',
      'awayTeam', m->'awayTeam',
      'kickoffTime', to_char(to_timestamp((m->>'kickoffTime')::numeric / 1000) at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS'),
      'status', 'TRADING',
      'matchStatus', m->>'matchStatus',
      'statusDetail', m->>'statusDetail',
      'liveHomeScore', m->'liveHomeScore',
      'liveAwayScore', m->'liveAwayScore',
      'volumeTotal', m->'volumeTotal',
      'isLiveStream', coalesce((m->>'hasStream')::boolean, false),
      'scoreboard', m->'scoreboard',
      'outcomes', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'marketId', o->>'marketId',
          'side', o->>'side',
          'label', case when o->'scoreboardTeam' is null or jsonb_typeof(o->'scoreboardTeam') = 'null'
                        then case when o->>'displayLabel' ilike 'draw%' then 'Draw' else o->>'displayLabel' end
                        else o->>'displayLabel' end,
          'price', o->'displayPrice',
          'teamId', case
            when lower(o->'scoreboardTeam'->>'abbr') = lower(m->'homeTeam'->>'shortCode') then m->'homeTeam'->>'teamId'
            when lower(o->'scoreboardTeam'->>'abbr') = lower(m->'awayTeam'->>'shortCode') then m->'awayTeam'->>'teamId'
            when o->>'displayLabel' = m->'homeTeam'->>'name' then m->'homeTeam'->>'teamId'
            when o->>'displayLabel' = m->'awayTeam'->>'name' then m->'awayTeam'->>'teamId'
          end)), '[]'::jsonb)
        from jsonb_array_elements(coalesce(m->'outcomes','[]'::jsonb)) o)
    )), '[]'::jsonb))))
  from jsonb_array_elements(case when jsonb_typeof(c->'data'->'days') = 'array' then c->'data'->'days' else '[]'::jsonb end) d,
       jsonb_array_elements(case when jsonb_typeof(d->'matches') = 'array' then d->'matches' else '[]'::jsonb end) m
$$;

-- keep the feed's raw scoreboard; a fixture that comes back un-hides itself
do $$
declare src text; dst text;
begin
  src := pg_get_functiondef('public.mn_apply_calendar(jsonb)'::regprocedure);
  dst := replace(src,
$a$    if not exists (select 1 from public.events where id = v_id) then
      nm := $a$,
$a$    meta := meta || jsonb_strip_nulls(jsonb_build_object('mn_scoreboard', ev->'scoreboard'));

    if not exists (select 1 from public.events where id = v_id) then
      nm := $a$);
  dst := replace(dst,
$a$(coalesce(metadata,'{}'::jsonb) - 'stream_url' - 'stream_thumb_url' - 'stream_thumb_at')$a$,
$a$(coalesce(metadata,'{}'::jsonb) - 'stream_url' - 'stream_thumb_url' - 'stream_thumb_at' - 'retired' - 'retired_at' - 'retired_by')$a$);
  if dst = src or (length(dst) - length(src)) < 120 then raise exception 'mn_apply_calendar patch did not apply'; end if;
  execute dst;
end $$;

-- ---------------------------------------------------------------- 3. Editor's Desk: the mock's three picks, always on
create or replace function public.mn_refresh_demo_picks()
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare
  btc text; nvda text; sp text; sp_note text;
  keep text[];
begin
  select id into btc from public.events
   where id like 'crypto-btc-updown-1d-%' and is_resolved = false
   order by (end_date > now()) desc, end_date limit 1;
  select id into nvda from public.events
   where id like 'us-nvda-updown-%' and is_resolved = false
   order by (end_date > now()) desc, end_date limit 1;
  -- the mock's sports pick while it is open, then the biggest sports book on the site
  select id into sp from public.events
   where id = 'mn-E1YUVZKAL' and is_resolved = false
     and coalesce(metadata->>'match_status','scheduled') in ('scheduled','live')
     and coalesce(metadata->>'retired','') <> 'true';
  if sp is not null then
    sp_note := 'Biggest sports book on the site this week. The Bills have drifted up with the weather report.';
  else
    select id into sp from public.events
     where id like 'mn-%' and event_subtype = 'SPORTS_MATCH' and is_resolved = false
       and coalesce(metadata->>'match_status','scheduled') = 'scheduled'
       and coalesce(metadata->>'retired','') <> 'true'
     order by (metadata->>'sport' = 'american_football') desc,
              (case when volume ~ '^[0-9]+(\.[0-9]+)?$' then volume::numeric else 0 end) desc
     limit 1;
    sp_note := 'Biggest sports book on the site this week.';
  end if;

  keep := array_remove(array[btc, nvda, sp], null);

  -- drop the flag from anything that is no longer a pick
  update public.events
     set metadata = metadata - 'editorial'
   where metadata->'editorial'->>'pick' = 'true'
     and coalesce(metadata->>'retired','') <> 'true'
     and not (id = any(keep));

  if btc is not null then
    update public.events set metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object('editorial', jsonb_build_object(
      'pick', true, 'rank', 1, 'updated_at', now(),
      'note', 'Today''s open sits above where it trades now. The crowd is leaning one way, which is usually when the other side pays.'))
     where id = btc and coalesce(metadata->'editorial'->>'pick','') <> 'true';
  end if;
  if nvda is not null then
    update public.events set metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object('editorial', jsonb_build_object(
      'pick', true, 'rank', 2, 'updated_at', now(),
      'note', 'Down in the overnight session after the export-rule headline. Up is cheap if you think the cash session buys the dip.'))
     where id = nvda and coalesce(metadata->'editorial'->>'pick','') <> 'true';
  end if;
  if sp is not null then
    update public.events set metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object('editorial', jsonb_build_object(
      'pick', true, 'rank', 3, 'updated_at', now(), 'note', sp_note))
     where id = sp and (coalesce(metadata->'editorial'->>'pick','') <> 'true' or metadata->'editorial'->>'note' is distinct from sp_note);
  end if;
  return jsonb_build_object('btc', btc, 'nvda', nvda, 'sports', sp);
end $$;
revoke all on function public.mn_refresh_demo_picks() from public, anon, authenticated;

-- ---------------------------------------------------------------- apply: add the matches feed, hide dropped fixtures, refresh picks
create or replace function public.mn_sync_apply()
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare r record; body jsonb; res jsonb; stats jsonb := '{}'::jsonb; k text; n int; got_matches boolean := false;
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
        if r.kind = 'matches' then res := public.mn_apply_calendar(public.mn_matches_to_calendar(body)); got_matches := true;
        elsif r.kind = 'calendar' then res := public.mn_apply_calendar(body);
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

  -- a synced fixture omenx.com no longer lists (30 min) is hidden until it comes back or settles
  if got_matches then
    update public.events
       set metadata = metadata || jsonb_build_object('retired', true, 'retired_at', now(), 'retired_by', 'mainnet-dropped')
     where id like 'mn-%' and event_subtype = 'SPORTS_MATCH' and is_resolved = false
       and coalesce(metadata->>'retired','') <> 'true'
       and (metadata->>'mn_seen_at')::timestamptz < now() - interval '30 minutes';
    get diagnostics n = row_count;
    if n > 0 then stats := stats || jsonb_build_object('hidden_dropped', n); end if;
  end if;

  stats := stats || jsonb_build_object('picks', public.mn_refresh_demo_picks());

  delete from public.mn_sync_requests where created_at < now() - interval '30 minutes';
  insert into public.mn_sync_log (stats) values (stats);
  delete from public.mn_sync_log where ran_at < now() - interval '3 days';
  return stats;
end $$;
revoke all on function public.mn_sync_apply() from public, anon, authenticated;

-- ---------------------------------------------------------------- request: home-tab sports feed + real homepage query
create or replace function public.mn_sync_request()
returns int language plpgsql security definer set search_path to 'public' as $$
declare base text := 'https://www.omenx.com'; n int := 0; e record;
begin
  insert into public.mn_sync_requests (req_id, kind, key) values
    (net.http_get(base || '/pub/sports/matches', headers := '{"X-Time-Zone": "UTC"}'::jsonb, timeout_milliseconds := 20000), 'matches', '1'),
    (net.http_get(base || '/pub/event/list?pageNum=1&pageSize=200&status=TRADING', timeout_milliseconds := 20000), 'catalog', '1'),
    (net.http_get(base || '/pub/event/homepage?page=1&pageSize=100&surface=STANDARD', timeout_milliseconds := 20000), 'homepage', '1');
  n := 3;
  for e in
    select id, metadata->>'mainnet_id' mid from public.events
     where id like 'mn-%' and is_resolved = false
       and (metadata->>'mn_detail_req_at' is null or (metadata->>'mn_detail_req_at')::timestamptz < now() - interval '6 minutes')
       and (
             (event_subtype is null and metadata->>'mn_detail_at' is null)
          or coalesce(metadata->>'match_status','') in ('final','cancelled')
          or coalesce(metadata->>'mn_status','TRADING') <> 'TRADING'
          or (metadata->>'mn_seen_at')::timestamptz < now() - interval '10 minutes'
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
revoke all on function public.mn_sync_request() from public, anon, authenticated;

-- ---------------------------------------------------------------- 4. More: four demo long-dated events stay on
update public.events
   set metadata = (metadata - 'retired' - 'retired_at' - 'retired_by') || jsonb_build_object('demo_pinned', true)
 where id in ('best-ai-model-eoy-2026', 'us-president-2028', 'gpt6-release-window-2026', 'fed-rate-hike-2026');
