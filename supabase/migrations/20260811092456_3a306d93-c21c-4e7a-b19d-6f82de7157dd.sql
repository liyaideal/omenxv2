ALTER TABLE public.position_vouchers
  ADD COLUMN IF NOT EXISTS payout_mode text NOT NULL DEFAULT 'tiered',
  ADD COLUMN IF NOT EXISTS instant_paid_at timestamptz;

UPDATE public.position_vouchers SET payout_mode = 'tiered' WHERE payout_mode IS NULL;

ALTER TABLE public.position_vouchers
  DROP CONSTRAINT IF EXISTS position_vouchers_payout_mode_check;
ALTER TABLE public.position_vouchers
  ADD CONSTRAINT position_vouchers_payout_mode_check
  CHECK (payout_mode IN ('instant','tiered'));

CREATE OR REPLACE FUNCTION public.pay_instant_voucher_settlement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v record;
  v_amount numeric;
BEGIN
  IF NEW.status <> 'settled' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'settled' THEN RETURN NEW; END IF;

  v_amount := COALESCE(NEW.settled_pnl, 0);
  IF v_amount <= 0 THEN RETURN NEW; END IF;

  SELECT id, user_id, code, payout_mode, instant_paid_at
    INTO v
  FROM public.position_vouchers
  WHERE redeemed_airdrop_position_id = NEW.id
  LIMIT 1;

  IF v.id IS NULL OR v.payout_mode <> 'instant' OR v.instant_paid_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Idempotency latch: only the first writer wins.
  UPDATE public.position_vouchers
     SET instant_paid_at = now(), updated_at = now()
   WHERE id = v.id AND instant_paid_at IS NULL;
  IF NOT FOUND THEN RETURN NEW; END IF;

  UPDATE public.profiles
     SET spot_balance = COALESCE(spot_balance, 0) + v_amount,
         updated_at = now()
   WHERE user_id = v.user_id;

  INSERT INTO public.transactions (user_id, type, amount, account, description, status)
  VALUES (v.user_id, 'bonus', v_amount, 'spot',
          'Voucher payout · ' || COALESCE(v.code, ''), 'completed');

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.pay_instant_voucher_settlement() FROM anon, authenticated, PUBLIC;

DROP TRIGGER IF EXISTS trg_pay_instant_voucher_settlement ON public.airdrop_positions;
CREATE TRIGGER trg_pay_instant_voucher_settlement
AFTER INSERT OR UPDATE OF status ON public.airdrop_positions
FOR EACH ROW EXECUTE FUNCTION public.pay_instant_voucher_settlement();