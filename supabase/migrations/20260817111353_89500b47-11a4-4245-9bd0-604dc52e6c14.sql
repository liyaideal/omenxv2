insert into public.positions (
  user_id, event_name, option_label, side, entry_price, mark_price,
  size, margin, leverage, pnl, pnl_percent, status, product_line
)
select '2faf9a43-1ab7-47b7-919b-978c8c02b5ff'::uuid,
  'Arsenal vs Liverpool — handicap +1.5', 'ARS +1.5', 'long',
  0.85, 0.87, 40, 34, 1, 0.80, 2.35, 'Open', 'futures'
where not exists (
  select 1 from public.positions
  where user_id = '2faf9a43-1ab7-47b7-919b-978c8c02b5ff'::uuid
    and event_name = 'Arsenal vs Liverpool — handicap +1.5'
);