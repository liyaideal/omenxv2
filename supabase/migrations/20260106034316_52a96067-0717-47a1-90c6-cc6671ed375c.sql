-- Add database constraints for trades table
ALTER TABLE public.trades ADD CONSTRAINT check_positive_price CHECK (price > 0);
ALTER TABLE public.trades ADD CONSTRAINT check_positive_quantity CHECK (quantity > 0);
ALTER TABLE public.trades ADD CONSTRAINT check_leverage_limit CHECK (leverage BETWEEN 1 AND 100);
ALTER TABLE public.trades ADD CONSTRAINT check_positive_margin CHECK (margin > 0);
ALTER TABLE public.trades ADD CONSTRAINT check_nonnegative_fee CHECK (fee >= 0);
ALTER TABLE public.trades ADD CONSTRAINT check_positive_amount CHECK (amount > 0);

-- Add database constraints for positions table
ALTER TABLE public.positions ADD CONSTRAINT check_positive_entry_price CHECK (entry_price > 0);
ALTER TABLE public.positions ADD CONSTRAINT check_positive_mark_price CHECK (mark_price > 0);
ALTER TABLE public.positions ADD CONSTRAINT check_positive_size CHECK (size > 0);
ALTER TABLE public.positions ADD CONSTRAINT check_positive_position_margin CHECK (margin > 0);
ALTER TABLE public.positions ADD CONSTRAINT check_position_leverage_limit CHECK (leverage BETWEEN 1 AND 100);