-- CPO 2026-11-18: same as the real platform — vouchers can be redeemed on events
-- regardless of how soon they settle (the "not within N hours of settlement" rule is gone).
ALTER TABLE public.position_vouchers ALTER COLUMN min_hours_to_settlement SET DEFAULT 0;
UPDATE public.position_vouchers SET min_hours_to_settlement = 0 WHERE min_hours_to_settlement <> 0;
