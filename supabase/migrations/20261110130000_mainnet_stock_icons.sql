-- ============================================================
-- Mainnet sync · batch 2 follow-up (CPO 2026-11-10): stock logos come from
-- omenx.com too. The trading catalog has no logo; the home "daily close"
-- feed does — /pub/event/daily-close/rounds/current?assetCode=<code> →
-- sessions[].items[].asset.iconUrl (a full round avatar, 96×96 SVG, drawn
-- full-bleed in a circle on mainnet). Stored on mn_stock_names, readable by
-- the app; AssetAvatar prefers it over the repo's own logos.
-- ============================================================

alter table public.mn_stock_names add column if not exists icon_url text;
alter table public.mn_stock_names add column if not exists icon_at timestamptz;
drop policy if exists "stock names are public" on public.mn_stock_names;
create policy "stock names are public" on public.mn_stock_names for select to anon, authenticated using (true);
grant select on public.mn_stock_names to anon, authenticated;

-- display ticker (0700.HK / 000660.KR / NVDA) → mainnet asset code (700.HK / 000660.KR / NVDA)
create or replace function public.mn_mainnet_stock_code(p_tick text)
returns text language sql immutable as $$
  select case when p_tick ~ '^\d+\.HK$' then coalesce(nullif(ltrim(split_part(p_tick, '.', 1), '0'), ''), '0') || '.HK' else p_tick end
$$;
-- and back
create or replace function public.mn_display_stock_code(p_code text)
returns text language sql immutable as $$
  select case when p_code ~ '^\d+\.HK$' then lpad(split_part(p_code, '.', 1), 4, '0') || '.HK' else upper(p_code) end
$$;

create or replace function public.mn_apply_daily_close(p_key text, c jsonb)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare a jsonb; n int := 0;
begin
  for a in
    select it->'asset' from jsonb_array_elements(coalesce(c->'data'->'sessions','[]'::jsonb)) s,
                            jsonb_array_elements(coalesce(s->'items','[]'::jsonb)) it
  loop
    continue when a->>'code' is null or coalesce(a->>'iconUrl','') = '';
    insert into public.mn_stock_names (code, short, icon_url, icon_at)
    values (public.mn_display_stock_code(a->>'code'), coalesce(a->>'displayName', a->>'code'), a->>'iconUrl', now())
    on conflict (code) do update set icon_url = excluded.icon_url, icon_at = now();
    n := n + 1;
  end loop;
  -- asked for one code and mainnet had no logo for it: don't ask again for a day
  if p_key is not null and p_key <> '' then
    update public.mn_stock_names set icon_at = now() where code = public.mn_display_stock_code(p_key) and icon_at is null;
  end if;
  return jsonb_build_object('stock_icons', n);
end $$;
revoke all on function public.mn_apply_daily_close(text, jsonb) from public, anon, authenticated;

-- new stocks get a names row when their first round opens, so the icon fetch knows about them
create or replace function public.mn_note_stock_code(p_tick text, p_short text)
returns void language sql security definer set search_path to 'public' as $$
  insert into public.mn_stock_names (code, short) values (p_tick, p_short) on conflict (code) do nothing
$$;
revoke all on function public.mn_note_stock_code(text, text) from public, anon, authenticated;

-- ---------------------------------------------------------------- sync loop: note new codes, fetch + apply logos
create or replace function public.mn_apply_stock_rounds(c jsonb)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare
  ev jsonb; m jsonb; reg text; code text; sym text; tick text; sub text; tz text; cur text;
  td date; v_id text; nm text; short text; base numeric; p numeric; px text;
  close_at timestamptz; open_at timestamptz; start_at timestamptz; lc text; img text;
  ins int := 0; upd int := 0;
begin
  for ev in select x from jsonb_array_elements(coalesce(c->'data'->'data','[]'::jsonb)) x loop
    reg := ev->>'marketRegion';
    code := ev->>'stockCode';
    continue when code is null or code = '' or reg not in ('US','HK','KR')
              or coalesce(ev->>'seriesPeriod','') <> '1d' or ev->>'tradeDate' is null
              or ev->>'basePrice' is null;
    if reg = 'HK' then sym := lpad(split_part(code, '.', 1), 4, '0'); tick := sym || '.HK'; cur := 'HK$';
    elsif reg = 'KR' then sym := split_part(code, '.', 1); tick := sym || '.KR'; cur := '₩';
    else sym := lower(code); tick := upper(code); cur := '$';
    end if;
    sub := reg || '_STOCK_DAILY_UPDOWN_SPOT';
    tz := public.mn_stock_tz(sub);
    td := (ev->>'tradeDate')::date;
    v_id := lower(reg) || '-' || sym || '-updown-' || to_char(td, 'YYYYMMDD');
    close_at := (ev->>'lockTime')::timestamp at time zone 'UTC';
    open_at := public.mn_stock_open_at(sub, close_at);
    start_at := coalesce((ev->>'tradingStart')::timestamp at time zone 'UTC', now());
    base := round((ev->>'basePrice')::numeric, 2);
    -- won has no minor unit: ₩1,136,000 (as on omenx.com)
    px := case when reg = 'KR' then to_char(round(base), 'FM999,999,999,990') else base::text end;
    lc := case when now() < open_at then 'EXTENDED_TRADING' when now() < close_at - interval '5 minutes' then 'TRADING' else 'FROZEN' end;

    if not exists (select 1 from public.events where id = v_id) then
      select s.short into short from public.mn_stock_names s where s.code = tick;
      short := coalesce(short, trim(regexp_replace(regexp_replace(ev->>'title', ' Up or Down.*$', ''),
                        '(,? Inc\.?|,? Corporation|,? Corp\.?| Incorporated| Holdings| Co\.| H)$', '')));
      nm := short || ' (' || tick || ') — will close higher today?';
      perform public.mn_note_stock_code(tick, short);
      select e.image_url into img from public.events e
       where e.event_subtype = sub and e.id like lower(reg) || '-' || sym || '-updown-%' and e.image_url is not null
       order by e.end_date desc limit 1;
      insert into public.events (id, name, icon, category, description, rules, start_date, end_date, volume,
          is_resolved, price_label, side_labels, product_lines, event_subtype, lifecycle_status,
          base_price, freeze_time, expected_settlement_time, image_url, metadata)
      values (v_id, nm, '🟢', 'stocks',
          'Daily up/down market for ' || nm || '. Up settles $1 if today''s official close is above the prior close (' || cur || px || ').',
          'Trading date: ' || to_char(td, 'Dy, Mon DD, YYYY') || '. Prior close reference: ' || cur || px
            || '. Settles UP if the official close is strictly greater than the prior close; DOWN otherwise. Open orders are auto-cancelled and refunded ~15 min after the cash close.',
          start_at, close_at, round(coalesce((ev->>'totalVolume')::numeric, 0), 2)::text, false, cur || px,
          '{"yes":"Up","no":"Not Up"}'::jsonb, array['spot'], sub, lc,
          base, close_at - interval '5 minutes', close_at + interval '15 minutes', coalesce(img, '/card-bg/finance.jpg'),
          jsonb_build_object('source','mainnet','mainnet_id', ev->>'eventId','mn_seen_at', now(), 'mainnet_slug', ev->>'slug'));
      m := ev->'markets'->0;
      -- same start as batch 1: mainnet's last traded price (stock yesChance is a flat 50 placeholder on mainnet)
      p := round(least(0.98, greatest(0.02, coalesce((m->>'lastTradePrice')::numeric, (m->>'yesChance')::numeric / 100, 0.5))), 4);
      insert into public.event_options (id, event_id, label, price, is_winner) values
        (v_id || '-up',  v_id, 'Up',     p,             false),
        (v_id || '-not', v_id, 'Not Up', round(1 - p, 4), false)
      on conflict (id) do nothing;
      ins := ins + 1;
    else
      -- same round seen again (or opened earlier by the old roller): times and base follow mainnet, name stays
      update public.events
         set start_date = least(start_date, start_at), end_date = close_at,
             freeze_time = close_at - interval '5 minutes', expected_settlement_time = close_at + interval '15 minutes',
             base_price = base, price_label = cur || px, lifecycle_status = lc,
             metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object('source','mainnet','mainnet_id', ev->>'eventId','mn_seen_at', now())
       where id = v_id and is_resolved = false;
      upd := upd + 1;
    end if;
  end loop;
  return jsonb_build_object('stock_inserted', ins, 'stock_updated', upd);
end $$;
revoke all on function public.mn_apply_stock_rounds(jsonb) from public, anon, authenticated;

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
        elsif r.kind = 'catalog' then res := public.mn_apply_catalog(body) || public.mn_apply_stock_rounds(body);
        elsif r.kind = 'homepage' then res := public.mn_apply_homepage(body);
        elsif r.kind = 'dailyclose' then res := public.mn_apply_daily_close(r.key, body);
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

  if got_matches then
    update public.events
       set metadata = metadata || jsonb_build_object('retired', true, 'retired_at', now(), 'retired_by', 'mainnet-dropped')
     where id like 'mn-%' and event_subtype = 'SPORTS_MATCH' and is_resolved = false
       and coalesce(metadata->>'retired','') <> 'true'
       and (metadata->>'mn_seen_at')::timestamptz < now() - interval '30 minutes';
    get diagnostics n = row_count;
    if n > 0 then stats := stats || jsonb_build_object('hidden_dropped', n); end if;
  end if;

  begin
    stats := stats || public.mn_tick_stock_rounds();
  exception when others then
    stats := stats || jsonb_build_object('error_stock_tick', sqlerrm);
  end;
  stats := stats || jsonb_build_object('picks', public.mn_refresh_demo_picks());

  delete from public.mn_sync_requests where created_at < now() - interval '30 minutes';
  insert into public.mn_sync_log (stats) values (stats);
  delete from public.mn_sync_log where ran_at < now() - interval '3 days';
  return stats;
end $$;
revoke all on function public.mn_sync_apply() from public, anon, authenticated;

create or replace function public.mn_sync_request()
returns int language plpgsql security definer set search_path to 'public' as $$
declare base text := 'https://www.omenx.com'; n int := 0; e record;
begin
  insert into public.mn_sync_requests (req_id, kind, key) values
    (net.http_get(base || '/pub/sports/matches', headers := '{"X-Time-Zone": "UTC"}'::jsonb, timeout_milliseconds := 20000), 'matches', '1'),
    (net.http_get(base || '/pub/event/list?pageNum=1&pageSize=200&status=TRADING', timeout_milliseconds := 20000), 'catalog', '1'),
    -- the trading catalog is ~190 events now; page 2 keeps the 70 stock rounds from falling off the end
    (net.http_get(base || '/pub/event/list?pageNum=2&pageSize=200&status=TRADING', timeout_milliseconds := 20000), 'catalog', '2'),
    (net.http_get(base || '/pub/event/homepage?page=1&pageSize=100&surface=STANDARD', timeout_milliseconds := 20000), 'homepage', '1');
  n := 4;
  -- stock logos: a few listed stocks per run whose logo is missing or a day old
  for e in
    select s.code from public.mn_stock_names s
     where (s.icon_at is null or s.icon_at < now() - interval '1 day')
       and exists (select 1 from public.events v
                    where v.is_resolved = false
                      and v.event_subtype in ('US_STOCK_DAILY_UPDOWN_SPOT','HK_STOCK_DAILY_UPDOWN_SPOT','KR_STOCK_DAILY_UPDOWN_SPOT')
                      and v.name like '% (' || s.code || ') — %')
     order by s.icon_at nulls first, s.code
     limit 12
  loop
    insert into public.mn_sync_requests (req_id, kind, key)
    values (net.http_get(base || '/pub/event/daily-close/rounds/current?assetCode=' || public.mn_mainnet_stock_code(e.code),
                         timeout_milliseconds := 20000), 'dailyclose', public.mn_mainnet_stock_code(e.code));
    n := n + 1;
  end loop;
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
