-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also fix existing users' balances to match their completed transactions
-- Calculate: completed deposits - completed withdrawals + trade profits - trade losses
UPDATE public.profiles p
SET balance = (
  SELECT COALESCE(
    SUM(
      CASE 
        WHEN t.type = 'deposit' AND t.status = 'completed' THEN t.amount
        WHEN t.type = 'withdraw' AND t.status = 'completed' THEN -t.amount
        WHEN t.type = 'trade_profit' AND t.status = 'completed' THEN t.amount
        WHEN t.type = 'trade_loss' AND t.status = 'completed' THEN -t.amount
        ELSE 0
      END
    ), 0
  )
  FROM public.transactions t
  WHERE t.user_id = p.user_id
),
updated_at = NOW()
WHERE p.balance = 0 OR p.balance IS NULL;