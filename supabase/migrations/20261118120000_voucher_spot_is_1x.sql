-- CPO 2026-11-18: a voucher redeemed on a Standard (spot) event is a spot
-- order at face value (1x). Only vouchers on Boost (contract) events are 5x.
-- Mirrors src/lib/voucherMath.ts and supabase/functions/close-trial-position.
-- Demo engine only (roll_demo_positions settles expired demo positions).
-- Applied to the Lovable Cloud database on 2026-11-18 via query_database.
DO $do$
DECLARE d text;
BEGIN
  SELECT pg_get_functiondef(oid) INTO d FROM pg_proc WHERE proname = 'roll_demo_positions';
  d := replace(d,
    'v_lev := CASE WHEN r.source = ''voucher'' THEN 5 ELSE 1 END;',
    '-- CPO 2026-11-18: a voucher on a Standard (spot) event is a spot order at face value (1x); Boost stays 5x.
    v_lev := CASE WHEN r.source = ''voucher''
                  THEN CASE WHEN ''spot'' = ANY(COALESCE(ev.product_lines, ARRAY[]::text[])) THEN 1 ELSE 5 END
                  ELSE 1 END;');
  EXECUTE d;
END
$do$;
