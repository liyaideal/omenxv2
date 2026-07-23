ALTER TABLE public.position_vouchers
  DROP CONSTRAINT IF EXISTS position_vouchers_status_check;

ALTER TABLE public.position_vouchers
  ADD CONSTRAINT position_vouchers_status_check
  CHECK (status = ANY (ARRAY['issued','redeemed','settled','expired','revoked']));