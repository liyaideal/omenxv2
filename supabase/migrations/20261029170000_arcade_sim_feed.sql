-- ============================================================
-- Quick Play demo engine · simulated feed (CPO 2026-10-29 16:46: "不用升级了，
-- lovable 只要保证手感不受影响就可以了，是不是真的数据不重要")
-- The real three-exchange feed (arcade_feed_tick: 4 HTTP calls a second via
-- pg_net) is what saturated the small database. The demo now runs on a
-- simulated index: every 2 s one tick = a small random walk (~0.6 bps) that
-- drifts toward a real Binance anchor fetched ONCE A MINUTE (one HTTP call),
-- so the level stays true to the market while the feel (the wiggle, the
-- model quote, the road, settlements) is unchanged. The browser's own Binance
-- book line keeps the stage moving between ticks. arcade_feed_tick stays in
-- the schema as the record of the real design; the job is unscheduled.
-- Applied live with query_database; this file is the record for 研发.
-- ============================================================
create table if not exists public.arcade_sim_state (
  id int primary key default 1,
  anchor double precision,
  anchor_at timestamptz,
  req_at timestamptz
);
insert into public.arcade_sim_state (id) values (1) on conflict do nothing;
revoke all on public.arcade_sim_state from public, anon, authenticated;

create or replace function public.arcade_sim_feed()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := clock_timestamp();
  ss record;
  last record;
  v_body jsonb;
  v_bid double precision;
  v_ask double precision;
  v_idx double precision;
  v_r1 double precision;
  v_r30 double precision;
  v_r60 double precision;
  v_rv double precision;
  v_n int;
  z30 double precision;
  z60 double precision;
  v_p numeric(4,3);
  s30 record;
  s60 record;
  v_worst numeric;
  v_open int;
  v_stake numeric;
  min_hist int := public.arcade_param('min_history_sec')::int;
begin
  if not pg_try_advisory_xact_lock(7202610281) then return; end if;
  select * into ss from public.arcade_sim_state where id = 1 for update;

  -- 1 · harvest the anchor answer fired a minute ago (one Binance call), then fire the next one
  begin
    select case when h.status_code = 200 then h.content::jsonb end into v_body
      from public.arcade_feed_req q join net._http_response h on h.id = q.req_id
     where q.src = 'anchor' order by q.batch desc limit 1;
  exception when others then v_body := null; end;
  if v_body is not null then
    begin
      v_bid := (v_body->>'bidPrice')::double precision;
      v_ask := (v_body->>'askPrice')::double precision;
    exception when others then v_bid := null; v_ask := null; end;
    if v_bid is not null and v_ask is not null and v_bid > 0 and v_ask >= v_bid then
      update public.arcade_sim_state set anchor = (v_bid + v_ask) / 2, anchor_at = v_now where id = 1;
      ss.anchor := (v_bid + v_ask) / 2;
    end if;
    delete from public.arcade_feed_req where src = 'anchor';
  end if;
  if ss.req_at is null or ss.req_at < v_now - interval '60 seconds' then
    delete from public.arcade_feed_req where src = 'anchor';
    insert into public.arcade_feed_req (batch, src, req_id)
    values (v_now, 'anchor', net.http_get('https://api.binance.com/api/v3/ticker/bookTicker?symbol=BTCUSDT', timeout_milliseconds := 2000));
    update public.arcade_sim_state set req_at = v_now where id = 1;
  end if;

  -- 2 · one simulated tick: random walk, drifting toward the anchor
  select * into last from public.arcade_index_ticks where valid and idx is not null order by ts desc limit 1;
  if last.idx is null then
    if ss.anchor is null then return; end if;
    last.idx := ss.anchor;
  end if;
  if last.ts is not null and last.ts > v_now - interval '1.2 seconds' then return; end if;
  v_r1 := (random() + random() + random() - 1.5) * 0.00012;
  if ss.anchor is not null and ss.anchor > 0 then
    v_r1 := v_r1 + greatest(-0.0004, least(0.0004, 0.08 * ln(ss.anchor / last.idx)));
  end if;
  v_idx := last.idx * exp(v_r1);

  -- 3 · the model quote, same maths as the real feed (r30 / r60 / rv600 → sigmoid → clip)
  select * into s30 from public.arcade_index_ticks t where t.valid and t.ts between v_now - interval '31.5 seconds' and v_now - interval '28.5 seconds' order by abs(extract(epoch from (t.ts - (v_now - interval '30 seconds')))) limit 1;
  select * into s60 from public.arcade_index_ticks t where t.valid and t.ts between v_now - interval '61.5 seconds' and v_now - interval '58.5 seconds' order by abs(extract(epoch from (t.ts - (v_now - interval '60 seconds')))) limit 1;
  if s30.idx is not null then v_r30 := ln(v_idx / s30.idx); end if;
  if s60.idx is not null then v_r60 := ln(v_idx / s60.idx); end if;
  select count(*), sum(t.r1 * t.r1) into v_n, v_rv from public.arcade_index_ticks t where t.valid and t.r1 is not null and t.ts > v_now - interval '600 seconds';
  v_n := v_n + 1; v_rv := coalesce(v_rv, 0) + v_r1 * v_r1;
  if v_n >= least(min_hist, 60) and v_r30 is not null and v_r60 is not null then
    v_rv := v_rv * 600.0 / v_n;
    z30 := greatest(-5, least(5, v_r30 / sqrt(greatest(v_rv * 30 / 600, 1e-12))));
    z60 := greatest(-5, least(5, v_r60 / sqrt(greatest(v_rv * 60 / 600, 1e-12))));
    v_p := public.arcade_round_half_up(greatest(public.arcade_param('p_min'), least(public.arcade_param('p_max'), 1 / (1 + exp(-(public.arcade_param('model_intercept') + public.arcade_param('model_z30') * z30 + public.arcade_param('model_z60') * z60)))))::numeric, 3);
  else
    v_p := coalesce(last.p_up, 0.5);
    v_rv := null;
  end if;

  insert into public.arcade_index_ticks (ts, binance, hyperliquid, coinbase, usdt_usd, idx, valid, reason, r1, r30, r60, rv600, p_up, src_raw)
  values (v_now, v_idx, v_idx * (1 + (random() - 0.5) * 0.00006), v_idx * (1 + (random() - 0.5) * 0.00006), coalesce(last.usdt_usd, 0.9995), v_idx, true, null, v_r1, v_r30, v_r60, v_rv, v_p, '{"sim": true}'::jsonb);

  -- 4 · table state (no pauses on the demo except the manual switch), settlements, the anonymous table
  select coalesce(sum(win_payout - gross), 0), count(*), coalesce(sum(gross), 0) into v_worst, v_open, v_stake
    from public.arcade_calls where status = 'open' and user_id is not null;
  update public.arcade_table_state
     set paused_reason = case when public.arcade_param('live') <> 1 then 'off' else null end,
         breaker_until = null, worst_loss = v_worst, open_calls = v_open, open_stake = v_stake, updated_at = v_now
   where id = 1;
  perform public.arcade_settle_due(null);
  if public.arcade_param('sim_table') = 1 then perform public.arcade_sim_tick(v_now, v_p); end if;
end;
$$;
revoke all on function public.arcade_sim_feed() from public, anon, authenticated;

-- the client-side keep-alive only steps in when the job itself is late
create or replace function public.arcade_synth_tick()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := clock_timestamp();
  last record;
  v_r1 double precision;
  v_idx double precision;
begin
  if not pg_try_advisory_xact_lock(7202610282) then return; end if;
  select ts into last from public.arcade_index_ticks order by ts desc limit 1;
  if last.ts is null or last.ts > v_now - interval '3.5 seconds' then return; end if;
  select * into last from public.arcade_index_ticks where valid and idx is not null order by ts desc limit 1;
  if last.idx is null or last.ts < v_now - interval '30 minutes' then return; end if;
  v_r1 := (random() - 0.5) * 0.00008;
  v_idx := last.idx * exp(v_r1);
  insert into public.arcade_index_ticks (ts, binance, hyperliquid, coinbase, usdt_usd, idx, valid, reason, r1, r30, r60, rv600, p_up, src_raw)
  values (v_now, v_idx, v_idx, v_idx, last.usdt_usd, v_idx, true, null, v_r1, last.r30, last.r60, last.rv600, coalesce(last.p_up, 0.5), '{"synthetic": true}'::jsonb);
  update public.arcade_table_state
     set paused_reason = case when public.arcade_param('live') <> 1 then 'off' else null end, updated_at = v_now
   where id = 1;
  perform public.arcade_settle_due(null);
end;
$$;

select cron.unschedule(jobid) from cron.job where jobname in ('arcade_feed', 'arcade_sim_feed');
select cron.schedule('arcade_sim_feed', '2 seconds', $$select public.arcade_sim_feed()$$);
delete from public.arcade_feed_req where src <> 'anchor';
