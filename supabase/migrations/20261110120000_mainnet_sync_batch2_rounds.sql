-- ============================================================
-- Mainnet catalog sync · batch 2 (CPO 2026-11-10, ten rules approved)
-- Stock daily rounds (US / HK / KR) and crypto rounds line up with
-- www.omenx.com:
--   1–3  the stock lineup, open and close times come from the mainnet catalog
--        (/pub/event/list); a stock mainnet stops listing gets no new round.
--   4    base = mainnet basePrice (the real prior official close).
--   5    prices stay simulated (first Up price = mainnet last trade, volume from mainnet, once).
--   6    settlement = Lovable's own simulated close — the same deterministic
--        walk the home Stocks sparkline draws (HomeStocksSection `walk`,
--        48 samples, σ 0.004) — compared with base. Ported 1:1 below.
--   7–8  names "Short (TICKER) — will close higher today?"; HK codes padded
--        to 4 digits (0700.HK); KR codes as mainnet (000660.KR).
--   9    crypto 1d / 4h rounds cut on US Eastern time like mainnet
--        (1d = noon ET, 4h = 0/4/8/12/16/20 ET). A round already open runs
--        to its old end; the next one uses the new cut.
--   10   crypto names unchanged; only the current round is listed.
-- The old stock rollers (roll-daily-stock-events / roll-daily-hk-stock-events)
-- are unscheduled; mn_sync_apply settles due stock rounds every 3 minutes.
-- ============================================================

-- ---------------------------------------------------------------- 0. 32-bit helpers (Math.imul / mulberry32 / FNV-1a)
create or replace function public.mn_u32_mul(a bigint, b bigint)
returns bigint language sql immutable as $$
  select ((a * (b & 65535)) + (((a * (b >> 16)) & 65535) << 16)) & 4294967295
$$;

create or replace function public.mn_fnv1a(s text)
returns bigint language plpgsql immutable as $$
declare h bigint := 2166136261; i int;
begin
  for i in 1..length(s) loop
    h := public.mn_u32_mul(h # ascii(substr(s, i, 1)), 16777619);
  end loop;
  return h;
end $$;

-- Deterministic close of a stock round = HomeStocksSection walk(id, base, 48, 0.004).last
create or replace function public.mn_walk_close(p_id text, p_base numeric)
returns numeric language plpgsql immutable as $$
declare
  a bigint := public.mn_fnv1a(p_id);
  t bigint; u1 double precision; u2 double precision; u3 double precision;
  n int := 48; sig double precision := 0.004 / sqrt(48.0);
  v double precision := p_base::double precision; drift double precision := 0; g1 double precision; i int;
begin
  for i in 1..n-1 loop
    -- three mulberry32 draws per step, in the JS evaluation order
    a := (a + 1831565813) & 4294967295;
    t := public.mn_u32_mul(a # (a >> 15), 1 | a);
    t := ((t + public.mn_u32_mul(t # (t >> 7), 61 | t)) & 4294967295) # t;
    u1 := (t # (t >> 14))::double precision / 4294967296.0;
    a := (a + 1831565813) & 4294967295;
    t := public.mn_u32_mul(a # (a >> 15), 1 | a);
    t := ((t + public.mn_u32_mul(t # (t >> 7), 61 | t)) & 4294967295) # t;
    u2 := (t # (t >> 14))::double precision / 4294967296.0;
    a := (a + 1831565813) & 4294967295;
    t := public.mn_u32_mul(a # (a >> 15), 1 | a);
    t := ((t + public.mn_u32_mul(t # (t >> 7), 61 | t)) & 4294967295) # t;
    u3 := (t # (t >> 14))::double precision / 4294967296.0;
    g1 := sqrt(-2 * ln(greatest(1e-9, u1))) * cos(2 * pi() * u2);
    drift := drift * 0.6 + g1 * sig * 0.35;
    v := v * (1 + drift + (u3 - 0.5) * sig * 0.8);
  end loop;
  return v::numeric;
end $$;

-- ---------------------------------------------------------------- 1. short names (rule 7)
create table if not exists public.mn_stock_names (
  code  text primary key,   -- display ticker: NVDA / 0700.HK / 000660.KR
  short text not null
);
alter table public.mn_stock_names enable row level security;
insert into public.mn_stock_names (code, short) values
  ('AAPL','Apple'),('AMAT','Applied Materials'),('AMD','AMD'),('AMZN','Amazon'),('ASTS','AST SpaceMobile'),
  ('AVGO','Broadcom'),('BE','Bloom Energy'),('BMNR','Bitmine'),('CBRS','Cerebras'),('COHR','Coherent'),
  ('COIN','Coinbase'),('COST','Costco'),('CRCL','Circle'),('CRWD','CrowdStrike'),('CRWV','CoreWeave'),
  ('CSCO','Cisco'),('DELL','Dell'),('GLW','Corning'),('GME','GameStop'),('GOOGL','Alphabet'),
  ('HOOD','Robinhood'),('IBM','IBM'),('INTC','Intel'),('IONQ','IonQ'),('JPM','JPMorgan'),
  ('LITE','Lumentum'),('LLY','Eli Lilly'),('LRCX','Lam Research'),('META','Meta'),('MRNA','Moderna'),
  ('MRVL','Marvell'),('MSFT','Microsoft'),('MSTR','Strategy'),('MU','Micron'),('NFLX','Netflix'),
  ('NOW','ServiceNow'),('NVDA','NVIDIA'),('ORCL','Oracle'),('PANW','Palo Alto Networks'),('PLTR','Palantir'),
  ('QCOM','Qualcomm'),('QQQ','Invesco QQQ'),('RKLB','Rocket Lab'),('SMCI','Super Micro'),('SNDK','Sandisk'),
  ('SPCX','SpaceX'),('SPY','S&P 500 ETF'),('TSLA','Tesla'),('UBER','Uber'),('WDC','Western Digital'),('WMT','Walmart'),
  ('0100.HK','MiniMax'),('1024.HK','Kuaishou'),('1211.HK','BYD'),('1810.HK','Xiaomi'),('2513.HK','Zhipu AI'),
  ('3308.HK','Innolight'),('3690.HK','Meituan'),('3986.HK','GigaDevice'),('0625.HK','SHEIN'),('0700.HK','Tencent'),
  ('0992.HK','Lenovo'),('9992.HK','Pop Mart'),('9988.HK','Alibaba'),('0005.HK','HSBC'),
  ('000660.KR','SK Hynix'),('005380.KR','Hyundai Motor'),('005930.KR','Samsung Electronics'),
  ('009150.KR','Samsung Electro-Mechanics'),('035420.KR','NAVER'),('042700.KR','Hanmi Semiconductor'),('066570.KR','LG Electronics')
on conflict (code) do update set short = excluded.short;

-- ---------------------------------------------------------------- 2. session clock per market
create or replace function public.mn_stock_tz(p_subtype text)
returns text language sql immutable as $$
  select case split_part(p_subtype, '_', 1) when 'HK' then 'Asia/Hong_Kong' when 'KR' then 'Asia/Seoul' else 'America/New_York' end
$$;
create or replace function public.mn_stock_open_at(p_subtype text, p_close timestamptz)
returns timestamptz language sql stable as $$
  select (((p_close at time zone public.mn_stock_tz(p_subtype))::date)
          + case split_part(p_subtype, '_', 1) when 'KR' then time '09:00' else time '09:30' end)
         at time zone public.mn_stock_tz(p_subtype)
$$;

-- ---------------------------------------------------------------- 3. apply: stock daily rounds from the catalog (rules 1–5, 7, 8)
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

-- ---------------------------------------------------------------- 4. settle (rule 6) + session status, every sync
create or replace function public.settle_prior_stock_session(_subtype text)
returns integer language plpgsql security definer set search_path to 'public' as $$
DECLARE
  due record; cls numeric; winner text; loser text; n int := 0;
BEGIN
  FOR due IN
    SELECT id, base_price FROM public.events
    WHERE event_subtype = _subtype AND is_resolved = false AND end_date <= now()
  LOOP
    -- the close the home sparkline ends on (HomeStocksSection walk), not a fresh random draw
    cls := round(public.mn_walk_close(due.id, COALESCE(due.base_price, 100)), 2);
    IF public.mn_walk_close(due.id, COALESCE(due.base_price, 100)) > COALESCE(due.base_price, 100)
      THEN winner := 'Up'; loser := 'Not Up';
      ELSE winner := 'Not Up'; loser := 'Up'; END IF;

    UPDATE public.event_options SET final_price = 1, is_winner = true, updated_at = now()
      WHERE event_id = due.id AND label = winner;
    UPDATE public.event_options SET final_price = 0, is_winner = false, updated_at = now()
      WHERE event_id = due.id AND label = loser;

    UPDATE public.events
      SET is_resolved = true, settled_at = now(), close_price = cls,
          lifecycle_status = 'SETTLED',
          settlement_description = 'Session closed at ' || cls || ' vs prior close ' || COALESCE(due.base_price, 100)
      WHERE id = due.id;

    PERFORM public.settle_spot_event(due.id);
    n := n + 1;
  END LOOP;
  RETURN n;
END;
$$;

create or replace function public.mn_tick_stock_rounds()
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare s int := 0;
begin
  s := s + public.settle_prior_stock_session('US_STOCK_DAILY_UPDOWN_SPOT')
         + public.settle_prior_stock_session('HK_STOCK_DAILY_UPDOWN_SPOT')
         + public.settle_prior_stock_session('KR_STOCK_DAILY_UPDOWN_SPOT');
  update public.events e
     set lifecycle_status = x.lc
    from (select id, case when now() < public.mn_stock_open_at(event_subtype, end_date) then 'EXTENDED_TRADING'
                          when now() < end_date - interval '5 minutes' then 'TRADING' else 'FROZEN' end lc
            from public.events
           where event_subtype in ('US_STOCK_DAILY_UPDOWN_SPOT','HK_STOCK_DAILY_UPDOWN_SPOT','KR_STOCK_DAILY_UPDOWN_SPOT')
             and is_resolved = false) x
   where e.id = x.id and e.lifecycle_status is distinct from x.lc;
  return jsonb_build_object('stock_settled', s);
end $$;
revoke all on function public.mn_tick_stock_rounds() from public, anon, authenticated;

-- ---------------------------------------------------------------- 5. sync loop: stock rounds + catalog page 2 + tick
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

-- ---------------------------------------------------------------- 6. old stock rollers off (the sync opens rounds now)
do $$ begin
  perform cron.unschedule('roll-daily-stock-events');
exception when others then null; end $$;
do $$ begin
  perform cron.unschedule('roll-daily-hk-stock-events');
exception when others then null; end $$;

-- ---------------------------------------------------------------- 7. crypto rounds: 1d / 4h cut on US Eastern like mainnet (rule 9)
-- 5m / 15m / 1h are unchanged (same grid on both). 1d = noon ET → noon ET;
-- 4h = 0/4/8/12/16/20 ET. A round still open keeps its old end; the next
-- round opens on the new cut (rule 9) and only one round per coin + length
-- is ever open (rule 10).
CREATE OR REPLACE FUNCTION public.roll_crypto_quick_rounds()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  coins text[] := ARRAY['btc','eth','sol'];
  cnames text[] := ARRAY['Bitcoin','Ethereum','Solana'];
  seeds numeric[] := ARRAY[64200, 3100, 188];
  tfs text[] := ARRAY['5m','15m','1h','4h','1d'];
  tsecs int[] := ARRAY[300, 900, 3600, 14400, 86400];
  tvols numeric[] := ARRAY[0.004, 0.007, 0.012, 0.02, 0.035];
  ci int; ti int;
  coin text; cname text; tf text; secs int; vol numeric;
  due record;
  cls numeric; winner text; loser text;
  pstart timestamptz; pend timestamptz; et timestamp; blk timestamp;
  eid text; base numeric; up numeric;
  v_stream double precision;
  settled int := 0; opened int := 0; pruned int := 0; paid int := 0;
  del record;
BEGIN
  FOR ci IN 1..array_length(coins,1) LOOP
    coin := coins[ci]; cname := cnames[ci];
    FOR ti IN 1..array_length(tfs,1) LOOP
      tf := tfs[ti]; secs := tsecs[ti]; vol := tvols[ti];

      FOR due IN
        SELECT id, base_price, name, end_date FROM public.events
        WHERE event_subtype = 'CRYPTO_QUICK_UPDOWN_SPOT'
          AND id LIKE 'crypto-'||coin||'-updown-'||tf||'-%'
          AND is_resolved = false
          AND end_date <= now()
        ORDER BY end_date
      LOOP
        SELECT s.price INTO v_stream FROM public.arcade_state_at(upper(coin), due.end_date) s;
        cls := round(COALESCE(v_stream::numeric, (COALESCE(due.base_price, seeds[ci]) * (1 + (random()-0.5) * vol))::numeric), 2);
        IF cls > COALESCE(due.base_price, seeds[ci]) THEN winner := 'Up'; loser := 'Down';
        ELSE winner := 'Down'; loser := 'Up'; END IF;

        UPDATE public.event_options SET final_price = 1, is_winner = true, updated_at = now()
          WHERE event_id = due.id AND label = winner;
        UPDATE public.event_options SET final_price = 0, is_winner = false, updated_at = now()
          WHERE event_id = due.id AND label = loser;

        UPDATE public.events
          SET is_resolved = true,
              settled_at = now(),
              close_price = cls,
              lifecycle_status = 'SETTLED',
              winning_option_id = due.id || CASE WHEN winner = 'Up' THEN '-up' ELSE '-down' END,
              settlement_description = 'Round closed at $' || cls || ' vs open $' || COALESCE(due.base_price, seeds[ci])
          WHERE id = due.id;

        paid := paid + public.settle_spot_event(due.id);
        paid := paid + public.settle_quick_contract_round(due.id);
        settled := settled + 1;
      END LOOP;

      -- one open round per coin + length: wait for the current one to end
      CONTINUE WHEN EXISTS (
        SELECT 1 FROM public.events
         WHERE event_subtype = 'CRYPTO_QUICK_UPDOWN_SPOT'
           AND id LIKE 'crypto-'||coin||'-updown-'||tf||'-%'
           AND is_resolved = false AND end_date > now());

      et := now() AT TIME ZONE 'America/New_York';
      IF tf = '1d' THEN
        blk := date_trunc('day', et - interval '12 hours') + interval '12 hours';
        pstart := blk AT TIME ZONE 'America/New_York';
        pend := (blk + interval '1 day') AT TIME ZONE 'America/New_York';
      ELSIF tf = '4h' THEN
        blk := date_trunc('day', et) + make_interval(hours => (extract(hour from et)::int / 4) * 4);
        pstart := blk AT TIME ZONE 'America/New_York';
        pend := (blk + interval '4 hours') AT TIME ZONE 'America/New_York';
      ELSE
        pstart := to_timestamp(floor(extract(epoch from now()) / secs) * secs);
        pend := pstart + make_interval(secs => secs);
      END IF;
      eid := 'crypto-'||coin||'-updown-'||tf||'-'||to_char(pstart at time zone 'UTC','YYYYMMDDHH24MI');

      IF NOT EXISTS (SELECT 1 FROM public.events WHERE id = eid) THEN
        SELECT s.price INTO v_stream FROM public.arcade_state_at(upper(coin), pstart) s;
        IF v_stream IS NOT NULL THEN
          base := round(v_stream::numeric, 2);
        ELSE
          SELECT e.close_price INTO base
          FROM public.events e
          WHERE e.event_subtype = 'CRYPTO_QUICK_UPDOWN_SPOT'
            AND e.id LIKE 'crypto-'||coin||'-updown-'||tf||'-%'
            AND e.is_resolved = true AND e.close_price IS NOT NULL
          ORDER BY e.end_date DESC LIMIT 1;
          base := COALESCE(base, seeds[ci]);
        END IF;
        up := round((0.44 + random()*0.12)::numeric, 4);

        INSERT INTO public.events (id, name, icon, category, description, rules, start_date, end_date,
          volume, is_resolved, price_label, side_labels, product_lines, event_subtype, lifecycle_status,
          base_price, freeze_time, expected_settlement_time)
        VALUES (eid, cname || ' — up or down?', '🟢', 'crypto',
          'Quick ' || tf || ' round on ' || cname || '. Up settles $1 if the price at the end of the round is above the round open ($' || base || ').',
          'Settles Up if the price at the end of the round is above the round open ($' || base || '); otherwise Down. A new round starts the moment this one settles.',
          pstart, pend, '0', false, '$' || base,
          '{"yes":"Up","no":"Down"}'::jsonb, ARRAY['contract'], 'CRYPTO_QUICK_UPDOWN_SPOT', 'TRADING',
          base, NULL, pend)
        ON CONFLICT (id) DO NOTHING;

        INSERT INTO public.event_options (id, event_id, label, price, is_winner)
        VALUES (eid||'-up', eid, 'Up', up, false),
               (eid||'-down', eid, 'Down', round((1-up)::numeric,4), false)
        ON CONFLICT (id) DO NOTHING;

        opened := opened + 1;
      END IF;

      FOR del IN
        SELECT e.id, e.name, e.start_date, e.end_date FROM public.events e
        WHERE e.event_subtype = 'CRYPTO_QUICK_UPDOWN_SPOT'
          AND e.id LIKE 'crypto-'||coin||'-updown-'||tf||'-%'
          AND e.is_resolved = true
          AND e.end_date < now() - interval '72 hours'
      LOOP
        IF EXISTS (
          SELECT 1 FROM public.positions p
          WHERE p.event_name = del.name
            AND p.created_at >= del.start_date
            AND p.created_at <= del.end_date + interval '1 hour'
        ) THEN CONTINUE; END IF;

        DELETE FROM public.market_activity ma
          WHERE ma.event_name = del.name
            AND ma.created_at >= del.start_date AND ma.created_at <= del.end_date;
        DELETE FROM public.event_options WHERE event_id = del.id;
        DELETE FROM public.events WHERE id = del.id;
        pruned := pruned + 1;
      END LOOP;

    END LOOP;
  END LOOP;

  RETURN jsonb_build_object('settled', settled, 'opened', opened, 'pruned', pruned, 'positions_paid', paid);
END;
$function$;
