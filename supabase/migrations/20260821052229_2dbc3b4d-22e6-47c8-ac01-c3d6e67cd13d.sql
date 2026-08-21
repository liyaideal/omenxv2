ALTER TABLE public.positions ADD COLUMN IF NOT EXISTS close_reason text;

ALTER TABLE public.positions DROP CONSTRAINT IF EXISTS positions_close_reason_check;
ALTER TABLE public.positions ADD CONSTRAINT positions_close_reason_check
  CHECK (close_reason IS NULL OR close_reason IN ('settlement','cashout','auto_close'));

UPDATE public.positions
   SET close_reason = 'settlement'
 WHERE status = 'Closed' AND close_reason IS NULL;

-- Demo history for the demo account (auth uid), tagged so it is identifiable.
INSERT INTO public.positions
  (user_id, event_name, option_label, side, entry_price, mark_price, size, margin,
   leverage, pnl, pnl_percent, status, product_line, close_reason, option_id, created_at, closed_at, updated_at)
VALUES
  -- August 2026 · series (same event, three days)
  ('968a2b3a-3913-4acb-948b-c78cc828a125','Ethereum — up or down?','Up','long',0.55,1,140,77,1,63,81.8,'Closed','spot','settlement',NULL,'2026-08-14T08:10:00Z','2026-08-14T12:20:00Z','2026-08-14T12:20:00Z'),
  ('968a2b3a-3913-4acb-948b-c78cc828a125','Ethereum — up or down?','Up','long',0.50,0,50,25,1,-25,-100,'Closed','spot','settlement',NULL,'2026-08-13T08:05:00Z','2026-08-13T12:20:00Z','2026-08-13T12:20:00Z'),
  ('968a2b3a-3913-4acb-948b-c78cc828a125','Ethereum — up or down?','Up','long',0.40,0,50,20,1,-20,-100,'Closed','spot','settlement',NULL,'2026-08-12T08:05:00Z','2026-08-12T12:20:00Z','2026-08-12T12:20:00Z'),
  ('968a2b3a-3913-4acb-948b-c78cc828a125','Will July CPI come in under 3.0% YoY?','No','long',0.40,1,250,50,2,150,300,'Closed','futures','settlement',NULL,'2026-08-02T10:00:00Z','2026-08-18T14:00:00Z','2026-08-18T14:00:00Z'),
  ('968a2b3a-3913-4acb-948b-c78cc828a125','NVIDIA (NVDA) — will close higher today?','Up','long',0.60,1,150,90,1,60,66.7,'Closed','spot','settlement',NULL,'2026-08-15T13:40:00Z','2026-08-15T20:00:00Z','2026-08-15T20:00:00Z'),
  ('968a2b3a-3913-4acb-948b-c78cc828a125','Will the Fed cut rates in September?','Yes','long',0.45,0.25,400,60,3,-80,-133.3,'Closed','futures','auto_close',NULL,'2026-08-04T09:30:00Z','2026-08-12T16:45:00Z','2026-08-12T16:45:00Z'),
  -- July 2026
  ('968a2b3a-3913-4acb-948b-c78cc828a125','Will Bitcoin close above $120,000 by end of month?','Yes','long',0.50,0.71,400,100,2,84,84,'Closed','futures','cashout',NULL,'2026-07-14T11:00:00Z','2026-07-31T15:10:00Z','2026-07-31T15:10:00Z'),
  ('968a2b3a-3913-4acb-948b-c78cc828a125','AMD (AMD) — will close higher today?','Up','long',0.60,1,70,42,1,28,66.7,'Closed','spot','settlement',NULL,'2026-07-28T13:35:00Z','2026-07-28T20:00:00Z','2026-07-28T20:00:00Z'),
  ('968a2b3a-3913-4acb-948b-c78cc828a125','Will Apple ship 2M Vision Pro units by year-end?','No','long',0.60,1,100,30,2,40,133.3,'Closed','futures','settlement',NULL,'2026-07-09T09:00:00Z','2026-07-24T18:00:00Z','2026-07-24T18:00:00Z'),
  ('968a2b3a-3913-4acb-948b-c78cc828a125','Will the NBER declare a US recession before 2027?','Yes','long',0.50,1,38,19,1,19,100,'Closed','futures','settlement',NULL,'2026-07-05T09:00:00Z','2026-07-20T17:00:00Z','2026-07-20T17:00:00Z'),
  ('968a2b3a-3913-4acb-948b-c78cc828a125','TSLA (TSLA) — will close higher today?','Up','long',0.45,0,100,45,1,-45,-100,'Closed','spot','settlement',NULL,'2026-07-17T13:35:00Z','2026-07-17T20:00:00Z','2026-07-17T20:00:00Z'),
  ('968a2b3a-3913-4acb-948b-c78cc828a125','Will Ethereum hit $5,000 in July?','Yes','long',0.30,0,200,30,2,-60,-200,'Closed','futures','settlement',NULL,'2026-07-02T10:00:00Z','2026-07-12T22:00:00Z','2026-07-12T22:00:00Z');

-- One order waiting to fill (placed in Pro) on a live Boost market.
INSERT INTO public.trades
  (user_id, event_name, option_label, side, order_type, price, amount, quantity, leverage,
   margin, fee, status, product_line, created_at, updated_at)
SELECT '968a2b3a-3913-4acb-948b-c78cc828a125','Will Bitcoin close above $120,000 by end of month?','Yes','buy','Limit',
       0.38, 76, 200, 2, 38, 0.15, 'Pending', 'futures', now() - interval '3 hours', now() - interval '3 hours'
WHERE NOT EXISTS (
  SELECT 1 FROM public.trades
   WHERE user_id = '968a2b3a-3913-4acb-948b-c78cc828a125'
     AND status = 'Pending'
     AND event_name = 'Will Bitcoin close above $120,000 by end of month?'
);