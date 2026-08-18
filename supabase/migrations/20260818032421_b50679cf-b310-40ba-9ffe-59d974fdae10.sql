-- B1 · rescale every 3-option SPORTS_MATCH winner to sum exactly 1.0
do $$
declare
  e record;
  ids text[];
  ps numeric[];
  t numeric;
  i int;
  v numeric;
  acc numeric;
begin
  for e in
    select ev.id from public.events ev
    where ev.event_subtype = 'SPORTS_MATCH'
      and coalesce(ev.metadata->>'market_type','winner') = 'winner'
      and (select count(*) from public.event_options o where o.event_id = ev.id) = 3
  loop
    select array_agg(o.id order by o.id), array_agg(o.price order by o.id)
      into ids, ps from public.event_options o where o.event_id = e.id;
    t := ps[1] + ps[2] + ps[3];
    if t is null or t <= 0 then continue; end if;

    -- proportional rescale + clamp
    for i in 1..3 loop
      ps[i] := least(0.96, greatest(0.02, ps[i] / t));
    end loop;
    t := ps[1] + ps[2] + ps[3];
    acc := 0;
    for i in 1..3 loop
      if i < 3 then
        v := round((ps[i] / t)::numeric, 4);
        acc := acc + v;
      else
        v := round((1 - acc)::numeric, 4);
      end if;
      update public.event_options set price = v, updated_at = now() where id = ids[i];
    end loop;
  end loop;
end $$;

-- A4 · every existing soccer winner gets its three groups + derived line prices
do $$
declare e record;
begin
  for e in
    select ev.id from public.events ev
    where ev.event_subtype = 'SPORTS_MATCH'
      and coalesce(ev.metadata->>'market_type','winner') = 'winner'
      and (
        ev.metadata->>'sport' = 'soccer'
        or ev.metadata->>'format' = '1x2'
        or exists (select 1 from public.sports_league_map lm
                   where lm.league = ev.metadata->>'league' and lm.sport = 'soccer')
      )
  loop
    perform public.ensure_soccer_lines(e.id);
    perform public.reprice_soccer_lines(e.id);
  end loop;
end $$;
