-- Fix handle_new_user trigger: set option_id to NULL since fake IDs violate foreign key constraint
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_initial_balance NUMERIC := 12530;
BEGIN
  -- Insert profile with calculated balance
  INSERT INTO public.profiles (user_id, email, username, balance)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    v_initial_balance
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    username = COALESCE(profiles.username, EXCLUDED.username),
    balance = v_initial_balance,
    updated_at = now();

  -- Completed deposits (credited to balance)
  INSERT INTO public.transactions (user_id, type, amount, status, description, network, tx_hash, confirmations, required_confirmations, created_at)
  VALUES
    (NEW.id, 'deposit', 5000, 'completed', 'Initial deposit', 'Ethereum', '0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890', 15, 15, now() - interval '7 days'),
    (NEW.id, 'deposit', 3000, 'completed', 'USDT deposit', 'BNB Smart Chain (BEP20)', '0x2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890ab', 15, 15, now() - interval '5 days'),
    (NEW.id, 'deposit', 8000, 'completed', 'USDC deposit', 'Polygon', '0x3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcd', 128, 128, now() - interval '3 days');

  -- Processing deposits (shown in Pending Confirmations module)
  INSERT INTO public.transactions (user_id, type, amount, status, description, network, tx_hash, confirmations, required_confirmations, created_at)
  VALUES
    (NEW.id, 'deposit', 2500, 'processing', 'USDT deposit incoming', 'Ethereum', '0x4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 8, 15, now() - interval '10 minutes'),
    (NEW.id, 'deposit', 1800, 'processing', 'USDC deposit incoming', 'BNB Smart Chain (BEP20)', '0x5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12', 5, 15, now() - interval '5 minutes');

  -- Completed withdrawals (debited from balance)
  INSERT INTO public.transactions (user_id, type, amount, status, description, network, tx_hash, confirmations, required_confirmations, created_at)
  VALUES
    (NEW.id, 'withdraw', -1500, 'completed', 'Withdrawal to wallet', 'Ethereum', '0x6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234', 15, 15, now() - interval '4 days'),
    (NEW.id, 'withdraw', -800, 'completed', 'Withdrawal to wallet', 'BNB Smart Chain (BEP20)', '0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456', 15, 15, now() - interval '2 days');

  -- Failed transaction
  INSERT INTO public.transactions (user_id, type, amount, status, description, network, tx_hash, created_at)
  VALUES
    (NEW.id, 'deposit', 500, 'failed', 'Deposit failed - insufficient gas', 'Ethereum', '0x890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567', now() - interval '6 days');

  -- Trade P&L transactions
  INSERT INTO public.transactions (user_id, type, amount, status, description, created_at)
  VALUES
    (NEW.id, 'trade_profit', 450, 'completed', 'Realized P&L: BTC Price Prediction', now() - interval '1 day'),
    (NEW.id, 'trade_loss', -320, 'completed', 'Realized P&L: ETH Weekly Close', now() - interval '12 hours'),
    (NEW.id, 'trade_loss', -300, 'completed', 'Realized P&L: Gold Price Movement', now() - interval '6 hours');

  -- Create mock open positions (option_id set to NULL to avoid foreign key constraint)
  INSERT INTO public.positions (user_id, event_name, option_id, option_label, side, entry_price, mark_price, size, margin, leverage, pnl, pnl_percent, status, created_at)
  VALUES
    (NEW.id, 'BTC End of Week Price', NULL, 'Above $100,000', 'long', 0.52, 0.58, 100, 10, 10, 11.54, 115.38, 'Open', now() - interval '2 days'),
    (NEW.id, 'ETH Price Prediction', NULL, 'Above $4,000', 'long', 0.45, 0.42, 50, 5, 10, -3.33, -66.67, 'Open', now() - interval '1 day'),
    (NEW.id, 'SOL Weekly Performance', NULL, 'Up >5%', 'short', 0.38, 0.35, 80, 8, 10, 6.32, 78.95, 'Open', now() - interval '12 hours');

  -- Create mock closed positions (option_id set to NULL to avoid foreign key constraint)
  INSERT INTO public.positions (user_id, event_name, option_id, option_label, side, entry_price, mark_price, size, margin, leverage, pnl, pnl_percent, status, closed_at, created_at)
  VALUES
    (NEW.id, 'Fed Interest Rate Decision', NULL, 'Hold Steady', 'long', 0.65, 1.00, 200, 20, 10, 107.69, 538.46, 'Closed', now() - interval '1 day', now() - interval '5 days'),
    (NEW.id, 'Apple Stock Movement', NULL, 'Up >2%', 'long', 0.55, 0.00, 150, 15, 10, -150.00, -1000.00, 'Closed', now() - interval '2 days', now() - interval '6 days'),
    (NEW.id, 'Gold Price Weekly', NULL, 'Down >1%', 'short', 0.42, 1.00, 100, 10, 10, 138.10, 1380.95, 'Closed', now() - interval '3 days', now() - interval '7 days');

  -- Create points account
  INSERT INTO public.points_accounts (user_id, balance, lifetime_earned)
  VALUES (NEW.id, 500, 500)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;