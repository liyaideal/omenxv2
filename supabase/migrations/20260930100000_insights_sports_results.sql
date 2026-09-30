-- Insights v2 · sports results archive (2026-09-30). Executed in Lovable Cloud via query_database.
-- Problem: the demo roller (roll_sports_matches) settles a fixture and immediately reschedules it a week
-- later, so no settled sports history ever survives → the Insights sports pages had nothing for
-- "Favourite won in" / "Settled this week". Fix: before rescheduling, copy the settled winner market
-- (+ its total line closest to 2.5) into archive rows with event_subtype = 'SPORTS_RESULT'.
-- The archive rows are read only by Insights (buildFixtures) and are excluded from the public Resolved list.
-- Seed: 18 fixtures (14 soccer + 4 esports) settled 2–27 days ago, ids res-seed-*, metadata.seed = true.

create or replace function public.archive_sports_result(p_id text)
returns void language plpgsql security definer set search_path = public as $$
declare
  w record; t record; new_id text; new_tid text; stamp text;
begin
  select * into w from public.events where id = p_id and is_resolved = true and event_subtype = 'SPORTS_MATCH';
  if w.id is null then return; end if;
  stamp := to_char(coalesce(w.settled_at, now()) at time zone 'UTC', 'YYYYMMDDHH24MI');
  new_id := 'res-' || w.id || '-' || stamp;
  if exists (select 1 from public.events where id = new_id) then return; end if;
  insert into public.events (id, name, icon, category, description, rules, start_date, end_date, volume, is_resolved, settled_at, winning_option_id, product_lines, event_subtype, lifecycle_status, expected_settlement_time, image_url, metadata, created_at, updated_at)
  values (new_id, w.name, w.icon, w.category, w.description, w.rules, w.start_date, w.end_date, w.volume, true, coalesce(w.settled_at, now()), null, w.product_lines, 'SPORTS_RESULT', 'SETTLED', w.end_date, w.image_url,
          coalesce(w.metadata, '{}'::jsonb) || jsonb_build_object('fixture_id', new_id, 'archived_from', w.id, 'market_type', 'winner'), now(), now());
  insert into public.event_options (id, event_id, label, price, is_winner, final_price, created_at, updated_at)
  select new_id || '-' || substr(md5(o.id), 1, 6), new_id, o.label, o.price, o.is_winner, o.final_price, now(), now()
  from public.event_options o where o.event_id = w.id;
  update public.events set winning_option_id = (select id from public.event_options where event_id = new_id and is_winner limit 1) where id = new_id;
  select * into t from public.events e where e.metadata->>'fixture_id' = w.id and e.metadata->>'market_type' = 'total' and e.is_resolved = true
    order by abs(coalesce((e.metadata->>'line')::numeric, 0) - 2.5) limit 1;
  if t.id is not null then
    new_tid := 'res-' || t.id || '-' || stamp;
    insert into public.events (id, name, icon, category, description, rules, start_date, end_date, volume, is_resolved, settled_at, product_lines, event_subtype, lifecycle_status, expected_settlement_time, metadata, created_at, updated_at)
    values (new_tid, t.name, t.icon, t.category, t.description, t.rules, t.start_date, t.end_date, t.volume, true, coalesce(t.settled_at, now()), t.product_lines, 'SPORTS_RESULT', 'SETTLED', t.end_date,
            coalesce(t.metadata, '{}'::jsonb) || jsonb_build_object('fixture_id', new_id, 'archived_from', t.id), now(), now());
    insert into public.event_options (id, event_id, label, price, is_winner, final_price, created_at, updated_at)
    select new_tid || '-' || substr(md5(o.id), 1, 6), new_tid, o.label, o.price, o.is_winner, o.final_price, now(), now()
    from public.event_options o where o.event_id = t.id;
  end if;
end $$;

-- Hook: in roll_sports_matches(), right before "-- reschedule the fixture (winner + every sibling)":
--   PERFORM public.archive_sports_result(m.id);
-- (applied in place with a DO block that string-replaces the function body; see delivery doc v2 §1.)
