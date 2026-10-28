-- ============================================================
-- Quick Play demo engine · keep the table tradable (CPO 2026-10-28 21:34:
-- "lovable 里一直交易不了…一直让它保持可以交易；不能交易的异常情况放在 styleguide")
-- 1. Synthetic ticks: whenever a client asks arcade_table_now() and the last
--    tick is older than 1.5 s (the pg_cron feed stalls for up to a minute now
--    and then), the server writes a tick itself — a tiny random walk (±0.4 bps)
--    from the last valid index, flagged src_raw.synthetic — clears the pause and
--    settles whatever is due. Real exchange ticks take over again as soon as
--    the feed is back. Demo only: the real platform has its own feed.
-- 2. Pause triggers that exist for the real platform are parked out of reach
--    on the demo (market breaker, 60 min / daily loss limits, table full); the
--    paused state itself stays in the style-guide (AR-3) and in the code.
-- Applied to the New OmenX database (a8d166e9) by query_database; this file
-- is the record for 研发.
-- ============================================================
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
  if last.ts is null or last.ts > v_now - interval '1.5 seconds' then return; end if;
  select * into last from public.arcade_index_ticks where valid and idx is not null order by ts desc limit 1;
  if last.idx is null or last.ts < v_now - interval '30 minutes' then return; end if;
  v_r1 := (random() - 0.5) * 0.00008;
  v_idx := last.idx * exp(v_r1);
  insert into public.arcade_index_ticks (ts, binance, hyperliquid, coinbase, usdt_usd, idx, valid, reason, r1, r30, r60, rv600, p_up, src_raw)
  values (v_now, v_idx, v_idx, v_idx, last.usdt_usd, v_idx, true, null, v_r1, last.r30, last.r60, last.rv600, coalesce(last.p_up, 0.5), '{"synthetic": true}'::jsonb);
  update public.arcade_table_state
     set paused_reason = case when public.arcade_param('live') <> 1 then 'off' else null end,
         updated_at = v_now
   where id = 1;
  perform public.arcade_settle_due(null);
end;
$$;
revoke all on function public.arcade_synth_tick() from public, anon, authenticated;

-- arcade_table_now: same shape as before, but volatile so it can keep the table alive first
create or replace function public.arcade_table_now()
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  perform public.arcade_synth_tick();
  return jsonb_build_object(
    'tick', (select to_jsonb(t) - 'src_raw' from public.arcade_index_ticks t order by ts desc limit 1),
    'state', (select to_jsonb(s) from public.arcade_table_state s where id = 1),
    'params', (select jsonb_object_agg(key, num) from public.arcade_params),
    'now', clock_timestamp(),
    'my_open', (select coalesce(sum(gross), 0) from public.arcade_calls where user_id = auth.uid() and status = 'open'),
    'ack', (select accepted_at from public.arcade_acks where user_id = auth.uid())
  );
end;
$$;

-- demo: park the real-platform pause triggers out of reach (AR-3 keeps the visuals)
update public.arcade_params set num = 1000000 where key in ('breaker_1s_bps', 'breaker_30s_bps');
update public.arcade_params set num = 1000000000 where key in ('loss_break_60m', 'loss_break_day', 'max_worst_loss');
update public.arcade_table_state set paused_reason = null, breaker_until = null where id = 1 and paused_reason in ('index', 'breaker', 'loss', 'full');
