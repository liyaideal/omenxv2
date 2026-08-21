-- Demo settlement reconciliation (CPO v1.17 §4d demo data).
-- Scope: the demo account's already-closed positions + their fill ledger.

-- 1. Auto-closed demo position: cost $60, 3×, avg 60¢, closed 25¢, net -$105, fees $5.
UPDATE public.positions
SET entry_price = 0.60, mark_price = 0.25, size = 300, margin = 60, leverage = 3, pnl = -105
WHERE id = 'dbaf2101-011f-49df-bfd2-25c32ffaf6d6';

UPDATE public.trades
SET amount = 30, fee = 2.5, price = 0.60, quantity = 50, margin = 30, leverage = 3
WHERE user_id = '968a2b3a-3913-4acb-948b-c78cc828a125'
  AND event_name = 'Will the Fed cut rates in September?'
  AND option_label = 'Yes';

-- 2. Series demo (3 daily rounds): each cost $15, nets -15 / +18 / -15.
UPDATE public.positions SET entry_price = 0.40, mark_price = 0, size = 37.5, margin = 15, pnl = -15
WHERE id = '776e5cb9-9d53-460b-81a2-d36d9ee36190';
UPDATE public.positions SET entry_price = 0.4545, mark_price = 1, size = 33, margin = 15, pnl = 18
WHERE id = '8353a5c5-4817-4894-b5ab-33e778598761';
UPDATE public.positions SET entry_price = 0.50, mark_price = 0, size = 30, margin = 15, pnl = -15
WHERE id = 'dc5356b4-e63b-486e-8c2d-f569ed39628c';

DELETE FROM public.trades
WHERE id IN ('8f67dbaa-5245-47e6-b510-4e8d579cbc05',
             'c240512a-3f47-495a-b052-e9c51f33ea3c',
             'c91fdbd9-5b75-4a6e-924c-1d6ed16d3f24',
             'a597a864-5640-407e-bb97-a54f43906570');

UPDATE public.trades SET amount = 15, fee = 0.15, price = 0.40, quantity = 37.5, margin = 15
WHERE id = 'cc0e2432-f4c6-48e9-a6ca-1054e3a8b526';
UPDATE public.trades SET amount = 15, fee = 0.15, price = 0.4545, quantity = 33, margin = 15
WHERE id = 'f8fbdfec-62b6-4320-8eb4-d9522bf1ada0';
UPDATE public.trades SET amount = 15, fee = 0.15, price = 0.50, quantity = 30, margin = 15
WHERE id = '34d01f01-4f44-4fc0-96da-cd87f8ef94f5';

-- 3. Every demo closed position must carry a non-zero fee on its ledger.
UPDATE public.trades t
SET fee = GREATEST(ROUND((t.amount * 0.01)::numeric, 4), 0.01)
WHERE t.user_id = '968a2b3a-3913-4acb-948b-c78cc828a125'
  AND COALESCE(t.fee, 0) = 0
  AND EXISTS (
    SELECT 1 FROM public.positions p
    WHERE p.user_id = t.user_id AND p.status = 'Closed'
      AND p.event_name = t.event_name AND p.option_label = t.option_label
  );