
-- 1. profiles: add spot_balance + change default balance to 0
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS spot_balance numeric NOT NULL DEFAULT 0;

ALTER TABLE public.profiles
  ALTER COLUMN balance SET DEFAULT 0;

-- 2. transactions: add account column + allow transfer types
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS account text;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_account_check
  CHECK (account IS NULL OR account IN ('spot', 'futures'));

ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_type_check CHECK (type = ANY (ARRAY[
    'deposit','withdraw','platform_credit','trade_profit','trade_loss',
    'fee','bonus','cross_chain_in','cross_chain_out','fiat_buy','fiat_sell',
    'transfer_to_spot','transfer_to_futures'
  ]));

-- 3. handle_new_user: start both accounts at $0; keep demo transaction decorations.
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_initial_balance NUMERIC := 0;
  v_username TEXT;
  v_face NUMERIC;
  v_face_values NUMERIC[] := ARRAY[10, 25, 50];
  v_suffix INT := 0;
BEGIN
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), '')
  );

  IF v_username IS NOT NULL AND v_username !~ '^[a-zA-Z0-9_]{3,20}$' THEN
    v_username := NULL;
  END IF;

  INSERT INTO public.profiles (user_id, email, username, balance, spot_balance)
  VALUES (NEW.id, NEW.email, v_username, v_initial_balance, 0)
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    username = COALESCE(profiles.username, EXCLUDED.username),
    balance = v_initial_balance,
    spot_balance = 0,
    updated_at = now();

  INSERT INTO public.points_accounts (user_id, balance, lifetime_earned)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Position voucher grants remain as onboarding gift (drawn from daily pool)
  FOREACH v_face IN ARRAY v_face_values
  LOOP
    v_suffix := v_suffix + 1;
    IF public.consume_daily_voucher_pool(v_face) THEN
      INSERT INTO public.position_vouchers (user_id, code, face_value, status, issued_at, expires_at)
      VALUES (NEW.id, public.gen_voucher_code() || lpad(v_suffix::text, 2, '0'), v_face, 'granted', now(), now() + interval '30 days');
    END IF;
  END LOOP;

  RETURN NEW;
END;
$function$;
