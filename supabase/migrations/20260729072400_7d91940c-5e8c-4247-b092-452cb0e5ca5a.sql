-- Market activity: record limit orders that fill via UPDATE (Pending -> Filled).
-- Pairing invariant (no double-recording):
--   * trg_record_market_activity (AFTER INSERT) only records rows born 'Filled'.
--   * trg_record_market_activity_fill (AFTER UPDATE) only records the
--     Pending -> Filled transition, which by definition was NOT 'Filled' at
--     insert time. The two conditions are mutually exclusive per trade row.
DROP TRIGGER IF EXISTS trg_record_market_activity_fill ON public.trades;
CREATE TRIGGER trg_record_market_activity_fill
AFTER UPDATE ON public.trades
FOR EACH ROW
WHEN (OLD.status = 'Pending' AND NEW.status = 'Filled' AND NEW.side = 'buy')
EXECUTE FUNCTION public.record_market_activity();