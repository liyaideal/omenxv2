-- 2026-11-10 · Demo engine: crypto quick rounds get traded volume as the round runs.
-- CPO: the home Crypto card's "this round $x" sat at $0 on Lovable because the engine opens the
-- rounds with volume 0 and nobody trades them. Lovable only (demo data); the real platform shows
-- real volume. Every minute each open round adds a random amount, scaled by period and coin:
--   per minute  5m $150–600 · 15m $100–400 · 1h $60–240 · 4h $40–160 · 1d $20–80
--   coin        BTC × 1 · ETH × 0.6 · SOL × 0.35
-- so a BTC 5m round ends around $1.5k and "Traded today" lands in the hundreds of thousands.
-- Settled rounds are never touched.

create or replace function public.sim_quick_round_volume_tick()
returns integer language plpgsql security definer set search_path to 'public' as $$
declare
  e record; base numeric; mult numeric; add numeric; cur numeric; n int := 0;
begin
  for e in
    select id, volume from public.events
     where event_subtype = 'CRYPTO_QUICK_UPDOWN_SPOT'
       and is_resolved = false and start_date <= now() and end_date > now()
  loop
    base := case
      when e.id like '%-updown-5m-%'  then 150
      when e.id like '%-updown-15m-%' then 100
      when e.id like '%-updown-1h-%'  then 60
      when e.id like '%-updown-4h-%'  then 40
      when e.id like '%-updown-1d-%'  then 20
      else 0 end;
    continue when base = 0;
    mult := case when e.id like 'crypto-btc-%' then 1 when e.id like 'crypto-eth-%' then 0.6 else 0.35 end;
    add := round((base * mult * (1 + 3 * random()))::numeric, 2);
    cur := case when coalesce(nullif(btrim(e.volume), ''), '0') ~ '^[0-9]+(\.[0-9]+)?$'
                then coalesce(nullif(btrim(e.volume), ''), '0')::numeric else 0 end;
    update public.events set volume = (cur + add)::text where id = e.id;
    n := n + 1;
  end loop;
  return n;
end $$;
revoke all on function public.sim_quick_round_volume_tick() from public, anon, authenticated;

select cron.schedule('sim-quick-round-volume', '* * * * *', 'select public.sim_quick_round_volume_tick();');
