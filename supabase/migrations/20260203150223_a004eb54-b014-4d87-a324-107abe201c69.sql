-- Update handle_new_user to handle anonymous users (no email)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_initial_balance NUMERIC := 13530;
  v_username TEXT;
BEGIN
  -- Generate username: prefer metadata, then email prefix, then NULL for anonymous users
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), '')
  );
  
  -- Validate username format (3-20 chars, alphanumeric + underscore) or set to NULL
  IF v_username IS NOT NULL AND v_username !~ '^[a-zA-Z0-9_]{3,20}$' THEN
    v_username := NULL;
  END IF;

  -- Insert profile with calculated balance (excludes pending deposits)
  INSERT INTO public.profiles (user_id, email, username, balance)
  VALUES (
    NEW.id,
    NEW.email,
    v_username,
    v_initial_balance
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    username = COALESCE(profiles.username, EXCLUDED.username),
    balance = v_initial_balance,
    updated_at = now();

  -- ========== TRANSACTIONS ==========
  -- Completed deposits: 5000 + 3000 + 8000 = 16,000
  INSERT INTO public.transactions (user_id, type, amount, status, description, network, tx_hash, confirmations, required_confirmations, created_at)
  VALUES
    (NEW.id, 'deposit', 5000, 'completed', 'Initial deposit', 'Ethereum', '0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890', 15, 15, now() - interval '7 days'),
    (NEW.id, 'deposit', 3000, 'completed', 'USDT deposit', 'BNB Smart Chain (BEP20)', '0x2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890ab', 15, 15, now() - interval '5 days'),
    (NEW.id, 'deposit', 8000, 'completed', 'USDC deposit', 'Polygon', '0x3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcd', 128, 128, now() - interval '3 days');

  -- Processing deposits (NOT in balance)
  INSERT INTO public.transactions (user_id, type, amount, status, description, network, tx_hash, confirmations, required_confirmations, created_at)
  VALUES
    (NEW.id, 'deposit', 2500, 'processing', 'USDT deposit incoming', 'Ethereum', '0x4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 8, 15, now() - interval '10 minutes'),
    (NEW.id, 'deposit', 1800, 'processing', 'USDC deposit incoming', 'BNB Smart Chain (BEP20)', '0x5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12', 5, 15, now() - interval '5 minutes');

  -- Completed withdrawals: 1500 + 800 = 2,300
  INSERT INTO public.transactions (user_id, type, amount, status, description, network, tx_hash, confirmations, required_confirmations, created_at)
  VALUES
    (NEW.id, 'withdraw', -1500, 'completed', 'Withdrawal to wallet', 'Ethereum', '0x6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234', 15, 15, now() - interval '4 days'),
    (NEW.id, 'withdraw', -800, 'completed', 'Withdrawal to wallet', 'BNB Smart Chain (BEP20)', '0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456', 15, 15, now() - interval '2 days');

  -- Failed transaction
  INSERT INTO public.transactions (user_id, type, amount, status, description, network, tx_hash, created_at)
  VALUES
    (NEW.id, 'deposit', 500, 'failed', 'Deposit failed - insufficient gas', 'Ethereum', '0x890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567', now() - interval '6 days');

  -- Trade P&L: 450 - 320 - 300 = -170
  INSERT INTO public.transactions (user_id, type, amount, status, description, created_at)
  VALUES
    (NEW.id, 'trade_profit', 450, 'completed', 'Realized P&L: BTC Price Prediction', now() - interval '1 day'),
    (NEW.id, 'trade_loss', -320, 'completed', 'Realized P&L: ETH Weekly Close', now() - interval '12 hours'),
    (NEW.id, 'trade_loss', -300, 'completed', 'Realized P&L: Gold Price Movement', now() - interval '6 hours');

  -- ========== OPEN POSITIONS (for Portfolio > Positions tab) ==========
  INSERT INTO public.positions (user_id, event_name, option_id, option_label, side, entry_price, mark_price, size, margin, leverage, pnl, pnl_percent, status, created_at)
  VALUES
    (NEW.id, 'BTC End of Week Price', NULL, 'Above $100,000', 'long', 0.52, 0.58, 100, 10, 10, 11.54, 115.38, 'Open', now() - interval '2 days'),
    (NEW.id, 'ETH Price Prediction', NULL, 'Above $4,000', 'long', 0.45, 0.42, 50, 5, 10, -3.33, -66.67, 'Open', now() - interval '1 day'),
    (NEW.id, 'SOL Weekly Performance', NULL, 'Up >5%', 'short', 0.38, 0.35, 80, 8, 10, 6.32, 78.95, 'Open', now() - interval '12 hours');

  -- ========== CLOSED POSITIONS (for records) ==========
  INSERT INTO public.positions (user_id, event_name, option_id, option_label, side, entry_price, mark_price, size, margin, leverage, pnl, pnl_percent, status, closed_at, created_at)
  VALUES
    (NEW.id, 'Fed Interest Rate Decision', NULL, 'Hold Steady', 'long', 0.65, 1.00, 200, 20, 10, 107.69, 538.46, 'Closed', now() - interval '1 day', now() - interval '5 days'),
    (NEW.id, 'Apple Stock Movement', NULL, 'Up >2%', 'long', 0.55, 0.00, 150, 15, 10, -150.00, -1000.00, 'Closed', now() - interval '2 days', now() - interval '6 days'),
    (NEW.id, 'Gold Price Weekly', NULL, 'Down >1%', 'short', 0.42, 1.00, 100, 10, 10, 138.10, 1380.95, 'Closed', now() - interval '3 days', now() - interval '7 days');

  -- ========== FILLED TRADES (for Portfolio > Settlements tab) ==========
  INSERT INTO public.trades (user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, leverage, fee, pnl, status, closed_at, created_at)
  VALUES
    (NEW.id, 'Fed Interest Rate Decision', 'Hold Steady', 'buy', 'market', 0.65, 200, 130, 20, 10, 0.13, 70.00, 'Filled', now() - interval '1 day', now() - interval '5 days'),
    (NEW.id, 'Apple Stock Movement', 'Up >2%', 'buy', 'market', 0.55, 150, 82.5, 15, 10, 0.08, -82.50, 'Filled', now() - interval '2 days', now() - interval '6 days'),
    (NEW.id, 'Gold Price Weekly', 'Down >1%', 'sell', 'market', 0.42, 100, 42, 10, 10, 0.04, 42.00, 'Filled', now() - interval '3 days', now() - interval '7 days');

  -- ========== POINTS ACCOUNT ==========
  INSERT INTO public.points_accounts (user_id, balance, lifetime_earned)
  VALUES (NEW.id, 500, 500)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;