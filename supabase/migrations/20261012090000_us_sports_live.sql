-- 2026-10-12 · NFL / MLB / NHL 直播推进引擎 + 子市场 + 常驻演示（已在 Lovable Cloud 执行，此文件留档）
-- 设计：与 tick_live_matches 并行的独立函数，只认 metadata.sport ∈ (american_football, hockey, baseball)，
-- 既有引擎零改动。每 5 分钟一 tick；demo-live-* 结算后立即重开（同 tick_demo_showcase 节奏），
-- 其他赛事结算后留给 roll_sports_matches 按 end_date 重排。让分 / 大小分按终场比分（含加时 / 加赛局）结算。

-- ---------- 子市场：每场 2 让分 + 2 大小分 ----------
create or replace function public.ensure_us_sport_lines(fx text, hcp numeric, tot numeric) returns int
language plpgsql security definer set search_path to 'public' as $$
declare m record; made int := 0; sid text; ha text; aa text; noun text; hw text; l numeric; k text;
begin
  select * into m from public.events where id = fx;
  if not found then return 0; end if;
  ha := coalesce(m.metadata->>'home_abbr','HOME'); aa := coalesce(m.metadata->>'away_abbr','AWAY');
  noun := case m.metadata->>'sport' when 'american_football' then 'points' when 'baseball' then 'runs' else 'goals' end;
  hw := case m.metadata->>'sport' when 'american_football' then 'spread' when 'baseball' then 'run line' when 'hockey' then 'puck line' else 'handicap' end;
  foreach l in array array[-hcp, hcp] loop
    k := replace(replace(l::text,'-','m'),'.','p');
    sid := fx || '-hcp-' || k;
    if not exists (select 1 from public.events where id = sid) then
      insert into public.events (id, name, category, event_subtype, description, start_date, end_date, expected_settlement_time, lifecycle_status, is_resolved, product_lines, side_labels, icon, volume, metadata)
      values (sid, m.name || ' — ' || hw || ' ' || (case when l < 0 then '−' else '+' end) || abs(l)::text,
              'sports', 'SPORTS_MATCH', m.description, m.start_date, m.end_date, m.expected_settlement_time, 'TRADING', false, array['contract'],
              jsonb_build_object('yes', ha || ' ' || (case when l < 0 then '−' else '+' end) || abs(l)::text,
                                 'no',  aa || ' ' || (case when l < 0 then '+' else '−' end) || abs(l)::text),
              '', 0,
              (m.metadata - 'segment_results' - 'segment_index' - 'clock' - 'half' - 'outs' - 'possession' - 'stream_url')
                || jsonb_build_object('fixture_id', fx, 'market_type', 'handicap', 'line', l, 'live', false, 'score', null, 'phase', null));
      insert into public.event_options (id, event_id, label, price) values
        (sid || '-yes', sid, ha || ' ' || (case when l < 0 then '−' else '+' end) || abs(l)::text, 0.5),
        (sid || '-no',  sid, aa || ' ' || (case when l < 0 then '+' else '−' end) || abs(l)::text, 0.5);
      made := made + 1;
    end if;
  end loop;
  foreach l in array array[tot, tot + 1] loop
    k := replace(l::text,'.','p');
    sid := fx || '-tot-' || k;
    if not exists (select 1 from public.events where id = sid) then
      insert into public.events (id, name, category, event_subtype, description, start_date, end_date, expected_settlement_time, lifecycle_status, is_resolved, product_lines, side_labels, icon, volume, metadata)
      values (sid, m.name || ' — total ' || noun || ' ' || l::text,
              'sports', 'SPORTS_MATCH', m.description, m.start_date, m.end_date, m.expected_settlement_time, 'TRADING', false, array['contract'],
              jsonb_build_object('yes', 'Over ' || l::text, 'no', 'Under ' || l::text), '', 0,
              (m.metadata - 'segment_results' - 'segment_index' - 'clock' - 'half' - 'outs' - 'possession' - 'stream_url')
                || jsonb_build_object('fixture_id', fx, 'market_type', 'total', 'line', l, 'live', false, 'score', null, 'phase', null));
      insert into public.event_options (id, event_id, label, price) values
        (sid || '-yes', sid, 'Over ' || l::text, 0.5), (sid || '-no', sid, 'Under ' || l::text, 0.5);
      made := made + 1;
    end if;
  end loop;
  return made;
end $$;

-- ---------- 推进引擎 ----------
create or replace function public.tick_live_us_sports() returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare
  win timestamptz := date_trunc('hour', now()) + (floor(extract(minute from now()) / 5) * interval '5 minutes');
  m record; sib record; meta jsonb; res jsonb; cur jsonb; el jsonb;
  sport text; idx int; tot int; cmax int; clk int; h int; a int; th int; ta int;
  half text; outs int; r numeric; fin boolean; yes_wins boolean; win_id text; score text;
  ticked int := 0; settled int := 0; paid int := 0; reopened int := 0;
begin
  for m in
    select id, metadata, start_date, end_date from public.events
    where event_subtype = 'SPORTS_MATCH' and is_resolved = false
      and coalesce(metadata->>'market_type','winner') = 'winner'
      and metadata->>'sport' in ('american_football','hockey','baseball')
      and start_date <= now() and end_date > now()
    order by id
  loop
    if (m.metadata->>'last_tick_at') is not null and (m.metadata->>'last_tick_at')::timestamptz >= win then continue; end if;
    meta := m.metadata || jsonb_build_object('last_tick_at', to_char(win at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'), 'live', true, 'phase', 'LIVE');
    sport := meta->>'sport';
    tot := case sport when 'american_football' then 4 when 'hockey' then 3 else 9 end;
    cmax := case sport when 'american_football' then 900 when 'hockey' then 1200 else 0 end;
    res := coalesce(meta->'segment_results', '[]'::jsonb);
    idx := coalesce((meta->>'segment_index')::int, 0);
    fin := false;

    -- 开局初始化
    if idx = 0 or jsonb_array_length(res) = 0 then
      idx := 1;
      if sport = 'baseball' then
        res := jsonb_build_array(jsonb_build_object('home', null, 'away', 0)); half := 'top'; outs := 0;
      else
        res := jsonb_build_array(jsonb_build_object('home', 0, 'away', 0)); clk := cmax;
      end if;
    else
      clk := coalesce((meta->>'clock')::int, cmax); half := coalesce(meta->>'half','top'); outs := coalesce((meta->>'outs')::int, 0);
    end if;
    while jsonb_array_length(res) < idx loop res := res || jsonb_build_array(jsonb_build_object('home', 0, 'away', 0)); end loop;

    cur := res -> (idx - 1);
    h := coalesce((cur->>'home')::int, 0); a := coalesce((cur->>'away')::int, 0);

    if sport = 'baseball' then
      -- 一 tick 推进一个半局：上半客队打，下半主队打
      r := random();
      if half = 'top' then
        a := a + (case when r < 0.60 then 0 when r < 0.85 then 1 when r < 0.95 then 2 else 3 end);
        res := jsonb_set(res, array[(idx-1)::text], jsonb_build_object('home', 0, 'away', a));
        half := 'bottom';
      else
        h := h + (case when r < 0.60 then 0 when r < 0.85 then 1 when r < 0.95 then 2 else 3 end);
        res := jsonb_set(res, array[(idx-1)::text], jsonb_build_object('home', h, 'away', a));
        -- 本局打完：总分
        select coalesce(sum((e->>'home')::int),0), coalesce(sum((e->>'away')::int),0) into th, ta from jsonb_array_elements(res) e;
        if idx >= tot and th <> ta then fin := true;
        else idx := idx + 1; half := 'top'; res := res || jsonb_build_array(jsonb_build_object('home', null, 'away', 0)); end if;
      end if;
      outs := floor(random() * 3)::int;
      meta := meta || jsonb_build_object('half', half, 'outs', outs);
    else
      -- 有钟的运动：每 tick 走 5 分钟比赛时间，随机得分
      r := random();
      if sport = 'american_football' then
        h := h + (case when r < 0.55 then 0 when r < 0.75 then 3 else 7 end);
        r := random();
        a := a + (case when r < 0.55 then 0 when r < 0.75 then 3 else 7 end);
        meta := meta || jsonb_build_object('possession', case when random() < 0.5 then meta->>'home_abbr' else meta->>'away_abbr' end);
      else
        if random() < 0.25 then h := h + 1; end if;
        if random() < 0.25 then a := a + 1; end if;
      end if;
      res := jsonb_set(res, array[(idx-1)::text], jsonb_build_object('home', h, 'away', a));
      clk := clk - 300;
      if clk <= 0 then
        select coalesce(sum((e->>'home')::int),0), coalesce(sum((e->>'away')::int),0) into th, ta from jsonb_array_elements(res) e;
        if idx >= tot and th <> ta then fin := true;
        else idx := idx + 1; clk := case when idx > tot then 600 else cmax end;
             res := res || jsonb_build_array(jsonb_build_object('home', 0, 'away', 0)); end if;
      end if;
      meta := meta || jsonb_build_object('clock', clk);
    end if;

    select coalesce(sum((e->>'home')::int),0), coalesce(sum((e->>'away')::int),0) into th, ta from jsonb_array_elements(res) e;
    score := th || '-' || ta;
    meta := meta || jsonb_build_object('segment_index', idx, 'segment_results', res, 'score', score);
    ticked := ticked + 1;

    if not fin then
      update public.events set metadata = meta, updated_at = now() where id = m.id;
      continue;
    end if;

    -- ---------- 终场结算 ----------
    win_id := m.id || case when th > ta then '-o1' else '-o2' end;
    update public.event_options set is_winner = (id = win_id), final_price = case when id = win_id then 1 else 0 end, updated_at = now() where event_id = m.id;
    update public.events set is_resolved = true, settled_at = now(), lifecycle_status = 'SETTLED', winning_option_id = win_id,
      metadata = meta || jsonb_build_object('live', false, 'phase', null), updated_at = now() where id = m.id;
    paid := paid + public.settle_spot_event(m.id);
    settled := settled + 1;
    for sib in select e.id, e.metadata->>'market_type' as mt, (e.metadata->>'line')::numeric as ln
               from public.events e where e.metadata->>'fixture_id' = m.id and e.is_resolved = false and e.metadata->>'market_type' in ('handicap','total')
    loop
      yes_wins := case when sib.mt = 'handicap' then (th + sib.ln) > ta else (th + ta) > sib.ln end;
      win_id := sib.id || case when yes_wins then '-yes' else '-no' end;
      update public.event_options set is_winner = (id = win_id), final_price = case when id = win_id then 1 else 0 end, updated_at = now() where event_id = sib.id;
      update public.events set is_resolved = true, settled_at = now(), lifecycle_status = 'SETTLED', winning_option_id = win_id,
        metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object('score', score, 'live', false), updated_at = now() where id = sib.id;
      paid := paid + public.settle_spot_event(sib.id);
      settled := settled + 1;
    end loop;

    -- ---------- 常驻演示：立即重开 ----------
    if m.id like 'demo-live-%' then
      update public.events set is_resolved = false, settled_at = null, winning_option_id = null, lifecycle_status = 'TRADING',
        start_date = now(),
        metadata = (meta - 'segment_results' - 'segment_index' - 'clock' - 'half' - 'outs' - 'possession' - 'last_tick_at')
          || jsonb_build_object('kickoff_at', to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'), 'live', false, 'score', null, 'phase', null),
        updated_at = now() where id = m.id;
      update public.event_options set is_winner = false, final_price = null, price = 0.5, updated_at = now() where event_id = m.id;
      update public.events set is_resolved = false, settled_at = null, winning_option_id = null, lifecycle_status = 'TRADING', start_date = now(),
        metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object('kickoff_at', to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'), 'live', false, 'score', null),
        updated_at = now() where metadata->>'fixture_id' = m.id;
      update public.event_options set is_winner = false, final_price = null, price = 0.5, updated_at = now()
        where event_id in (select id from public.events where metadata->>'fixture_id' = m.id);
      reopened := reopened + 1;
    end if;
  end loop;
  return jsonb_build_object('ticked', ticked, 'settled', settled, 'paid', paid, 'reopened', reopened);
end $$;

-- ---------- 既有三条赛事回填 sport ----------
update public.events set metadata = metadata || jsonb_build_object('sport','american_football') where id = 'sp-nfl-kc-buf';
update public.events set metadata = metadata || jsonb_build_object('sport','baseball') where id = 'sp-mlb-lad-nyy';
update public.events set metadata = metadata || jsonb_build_object('sport','hockey') where id = 'sp-nhl-tor-mtl';

-- ---------- 常驻演示赛事 ----------
insert into public.events (id, name, category, event_subtype, description, start_date, end_date, expected_settlement_time, lifecycle_status, is_resolved, product_lines, side_labels, icon, volume, metadata) values
('demo-live-nfl', 'Kansas City Chiefs vs Buffalo Bills', 'sports', 'SPORTS_MATCH', 'NFL · Kansas City Chiefs vs Buffalo Bills. Winning shares pay $1, losing shares pay $0.',
 now(), '2126-10-12 00:00:00+00', '2126-10-12 00:00:00+00', 'TRADING', false, array['contract'], '{"yes":"Chiefs","no":"Bills"}'::jsonb, '', 318400,
 jsonb_build_object('sport','american_football','league','NFL','format','h2h','home','Kansas City Chiefs','away','Buffalo Bills','home_abbr','KC','away_abbr','BUF',
   'kickoff_at', to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'), 'live', false, 'market_type','winner')),
('demo-live-mlb', 'Los Angeles Dodgers vs New York Yankees', 'sports', 'SPORTS_MATCH', 'MLB · Los Angeles Dodgers vs New York Yankees. Winning shares pay $1, losing shares pay $0.',
 now(), '2126-10-12 00:00:00+00', '2126-10-12 00:00:00+00', 'TRADING', false, array['contract'], '{"yes":"Dodgers","no":"Yankees"}'::jsonb, '', 241900,
 jsonb_build_object('sport','baseball','league','MLB','format','h2h','home','Los Angeles Dodgers','away','New York Yankees','home_abbr','LAD','away_abbr','NYY',
   'kickoff_at', to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'), 'live', false, 'market_type','winner'))
on conflict (id) do nothing;
insert into public.event_options (id, event_id, label, price) values
('demo-live-nfl-o1','demo-live-nfl','Chiefs',0.54),('demo-live-nfl-o2','demo-live-nfl','Bills',0.46),
('demo-live-mlb-o1','demo-live-mlb','Dodgers',0.58),('demo-live-mlb-o2','demo-live-mlb','Yankees',0.42)
on conflict (id) do nothing;

-- 主行必须自指 fixture_id，交易页才会拉到兄弟行
update public.events set metadata = metadata || jsonb_build_object('fixture_id', id, 'market_type', 'winner')
 where id in ('demo-live-nfl','demo-live-mlb','sp-nfl-kc-buf','sp-mlb-lad-nyy','sp-nhl-tor-mtl');

select public.ensure_us_sport_lines('demo-live-nfl', 3.5, 47.5);
select public.ensure_us_sport_lines('demo-live-mlb', 1.5, 8.5);
select public.ensure_us_sport_lines('sp-nfl-kc-buf', 3.5, 47.5);
select public.ensure_us_sport_lines('sp-mlb-lad-nyy', 1.5, 8.5);
select public.ensure_us_sport_lines('sp-nhl-tor-mtl', 1.5, 6.5);

select cron.schedule('tick_live_us_sports', '*/5 * * * *', 'select public.tick_live_us_sports();');
