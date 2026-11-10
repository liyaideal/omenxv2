-- 2026-11-10 · #12 (CPO approved on the mock canvas): stock round names read
--   "Apple (AAPL) — will it close higher today?" (was "... — will close higher today?").
-- Only rounds opened from now on get the new name; a round already open keeps its name,
-- so people holding a position still see the market they bought.
-- Body = 20261110130000_mainnet_stock_icons.sql's mn_apply_stock_rounds with that one string changed.

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
      nm := short || ' (' || tick || ') — will it close higher today?';
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
