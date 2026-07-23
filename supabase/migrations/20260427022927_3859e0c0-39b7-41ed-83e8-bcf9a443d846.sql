ALTER TABLE public.trades
DROP CONSTRAINT IF EXISTS check_positive_margin;

ALTER TABLE public.trades
ADD CONSTRAINT check_nonnegative_margin CHECK (margin >= 0);