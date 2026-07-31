
CREATE OR REPLACE FUNCTION public.roll_daily_hk_stock_events()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  r record;
  hk_today date := (now() at time zone 'Asia/Hong_Kong')::date;
  ymd text := to_char(hk_today,'YYYYMMDD');
  open_utc   timestamptz := (hk_today + time '09:30') at time zone 'Asia/Hong_Kong';
  freeze_utc timestamptz := (hk_today + time '15:55') at time zone 'Asia/Hong_Kong';
  close_utc  timestamptz := (hk_today + time '16:00') at time zone 'Asia/Hong_Kong';
  settle_utc timestamptz := (hk_today + time '16:15') at time zone 'Asia/Hong_Kong';
  start_utc  timestamptz := ((hk_today - 1) + time '16:00') at time zone 'Asia/Hong_Kong';
  lc text;
  eid text; base numeric; up numeric; n int := 0;
begin
  if now() < open_utc then lc := 'EXTENDED_TRADING';
  elsif now() < freeze_utc then lc := 'TRADING';
  else lc := 'FROZEN'; end if;

  for r in
    select distinct on (substring(id from 'hk-(.+)-updown-'))
      substring(id from 'hk-(.+)-updown-') as sym, name, base_price, image_url
    from events
    where event_subtype = 'HK_STOCK_DAILY_UPDOWN_SPOT'
    order by substring(id from 'hk-(.+)-updown-'), end_date desc
  loop
    eid := 'hk-'||r.sym||'-updown-'||ymd;
    base := round((coalesce(r.base_price,100) * (1 + (random()-0.5)*0.03))::numeric, 2);
    up   := round((0.42 + random()*0.18)::numeric, 4);

    insert into events (id,name,icon,category,description,rules,start_date,end_date,volume,
        is_resolved,price_label,side_labels,product_lines,event_subtype,lifecycle_status,
        base_price,freeze_time,expected_settlement_time,image_url)
    values (eid, r.name, '🟢','stocks',
        'Daily up/down market for '||r.name||'. Up settles $1 if today''s official close is above the prior close (HK$'||base||').',
        'Trading date: '||to_char(hk_today,'Dy, Mon DD, YYYY')||'. Prior close reference: HK$'||base||'. Settles UP if the official close is strictly greater than the prior close; DOWN otherwise. Trading hours 09:30–16:00 HKT. Open orders are auto-cancelled and refunded ~15 min after the cash close.',
        start_utc, close_utc, '0', false, 'HK$'||base,
        '{"yes":"Up","no":"Not Up"}'::jsonb, array['spot'], 'HK_STOCK_DAILY_UPDOWN_SPOT', lc,
        base, freeze_utc, settle_utc, r.image_url)
    on conflict (id) do update set
        lifecycle_status = excluded.lifecycle_status, is_resolved=false,
        start_date=excluded.start_date, end_date=excluded.end_date,
        freeze_time=excluded.freeze_time, expected_settlement_time=excluded.expected_settlement_time,
        base_price=excluded.base_price, price_label=excluded.price_label,
        description=excluded.description, rules=excluded.rules;

    insert into event_options (id,event_id,label,price,is_winner)
    values (eid||'-up', eid,'Up', up, false),
           (eid||'-not',eid,'Not Up', round((1-up)::numeric,4), false)
    on conflict (id) do update set price=excluded.price, is_winner=false, final_price=null;

    n := n + 1;
  end loop;
  return n;
end;
$function$;
