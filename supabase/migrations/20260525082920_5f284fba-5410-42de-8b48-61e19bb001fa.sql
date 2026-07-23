
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
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), '')
  );

  IF v_username IS NOT NULL AND v_username !~ '^[a-zA-Z0-9_]{3,20}$' THEN
    v_username := NULL;
  END IF;

  INSERT INTO public.profiles (user_id, email, username, balance)
  VALUES (NEW.id, NEW.email, v_username, v_initial_balance)
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    username = COALESCE(profiles.username, EXCLUDED.username),
    balance = v_initial_balance,
    updated_at = now();

  -- ========== TRANSACTIONS ==========
  INSERT INTO public.transactions (user_id, type, amount, status, description, network, tx_hash, confirmations, required_confirmations, created_at)
  VALUES
    (NEW.id, 'deposit', 5000, 'completed', 'Initial deposit', 'Ethereum', '0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890', 15, 15, now() - interval '7 days'),
    (NEW.id, 'deposit', 3000, 'completed', 'USDT deposit', 'BNB Smart Chain (BEP20)', '0x2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890ab', 15, 15, now() - interval '5 days'),
    (NEW.id, 'deposit', 8000, 'completed', 'USDC deposit', 'Polygon', '0x3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcd', 128, 128, now() - interval '3 days'),
    (NEW.id, 'deposit', 2500, 'processing', 'USDT deposit incoming', 'Ethereum', '0x4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 8, 15, now() - interval '10 minutes'),
    (NEW.id, 'deposit', 1800, 'processing', 'USDC deposit incoming', 'BNB Smart Chain (BEP20)', '0x5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12', 5, 15, now() - interval '5 minutes'),
    (NEW.id, 'withdraw', -1500, 'completed', 'Withdrawal to wallet', 'Ethereum', '0x6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234', 15, 15, now() - interval '4 days');

  INSERT INTO public.transactions (user_id, type, amount, status, description, network, created_at)
  VALUES
    (NEW.id, 'withdraw', -800, 'pending', 'Withdrawal to wallet', 'BNB Smart Chain (BEP20)', now() - interval '2 hours'),
    (NEW.id, 'withdraw', -2000, 'rejected', 'Withdrawal to wallet', 'Ethereum', now() - interval '1 day');

  INSERT INTO public.transactions (user_id, type, amount, status, description, network, tx_hash, created_at)
  VALUES
    (NEW.id, 'deposit', 500, 'failed', 'Deposit failed - insufficient gas', 'Ethereum', '0x890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567', now() - interval '6 days');

  INSERT INTO public.transactions (user_id, type, amount, status, description, created_at)
  VALUES
    (NEW.id, 'trade_profit', 450, 'completed', 'Realized P&L: BTC Price Prediction', now() - interval '1 day'),
    (NEW.id, 'trade_loss', -320, 'completed', 'Realized P&L: ETH Weekly Close', now() - interval '12 hours'),
    (NEW.id, 'trade_loss', -300, 'completed', 'Realized P&L: Gold Price Movement', now() - interval '6 hours');

  INSERT INTO public.transactions (user_id, type, amount, status, description, network, tx_hash, created_at)
  VALUES
    (NEW.id, 'cross_chain_in', 2000, 'completed', 'Bridge from Ethereum USDC', 'Ethereum', '0xaa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b', now() - interval '2 days'),
    (NEW.id, 'cross_chain_out', -1200, 'completed', 'Bridge to Arbitrum USDT', 'Arbitrum One', '0xbb2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c', now() - interval '1 day'),
    (NEW.id, 'cross_chain_in', 500, 'processing', 'Bridge from Polygon USDC', 'Polygon', '0xcc3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d', now() - interval '15 minutes');

  INSERT INTO public.transactions (user_id, type, amount, status, description, network, created_at)
  VALUES
    (NEW.id, 'fiat_buy', 1000, 'completed', 'Purchased USDC via Banxa (USD)', 'Base', now() - interval '3 days'),
    (NEW.id, 'fiat_sell', -750, 'completed', 'Sold USDC via Banxa (USD)', 'Base', now() - interval '2 days'),
    (NEW.id, 'fiat_buy', 500, 'processing', 'Purchasing USDC via Banxa (EUR)', 'Base', now() - interval '30 minutes');

  -- ========== OPEN POSITIONS ==========
  INSERT INTO public.positions (user_id, event_name, option_id, option_label, side, entry_price, mark_price, size, margin, leverage, pnl, pnl_percent, status, created_at)
  VALUES
    (NEW.id, 'BTC End of Week Price', NULL, 'Above $100,000', 'long', 0.52, 0.58, 100, 10, 10, 11.54, 115.38, 'Open', now() - interval '2 days'),
    (NEW.id, 'ETH Price Prediction', NULL, 'Above $4,000', 'long', 0.45, 0.42, 50, 5, 10, -3.33, -66.67, 'Open', now() - interval '1 day'),
    (NEW.id, 'SOL Weekly Performance', NULL, 'Up >5%', 'short', 0.38, 0.35, 80, 8, 10, 6.32, 78.95, 'Open', now() - interval '12 hours');

  -- ========== CURRENT (PENDING / PARTIAL) ORDERS ==========
  -- Powers the "Current Orders" tab so every new user lands with non-empty data
  INSERT INTO public.trades (user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, leverage, fee, status, created_at)
  VALUES
    (NEW.id, 'NBA Finals 2026 Game 7: Celtics vs Thunder?', 'Yes', 'buy',  'Limit', 0.45, 200, 90.00, 9.00, 10, 0.09, 'Pending',       now() - interval '8 minutes'),
    (NEW.id, 'NBA Finals 2026 champion?',                   'Boston Celtics',        'buy',  'Limit', 0.21, 300, 63.00, 6.30, 10, 0.06, 'Pending',       now() - interval '25 minutes'),
    (NEW.id, 'Ethereum price on May 31, 2026?',             '$3,000 - $4,000',       'buy',  'Limit', 0.12, 500, 60.00, 6.00, 10, 0.06, 'Partial Filled', now() - interval '42 minutes'),
    (NEW.id, 'Fed interest rate decision June 2026?',       '25bp Cut',              'sell', 'Limit', 0.28, 150, 42.00, 4.20, 10, 0.04, 'Pending',       now() - interval '2 hours'),
    (NEW.id, 'UFC 316 Headliner: Pereira vs Ankalaev?',     'No',                    'buy',  'Limit', 0.58, 120, 69.60, 6.96, 10, 0.07, 'Pending',       now() - interval '3 hours');

  -- ========== CLOSED POSITIONS (legacy demo) ==========
  INSERT INTO public.positions (user_id, event_name, option_id, option_label, side, entry_price, mark_price, size, margin, leverage, pnl, pnl_percent, status, closed_at, created_at)
  VALUES
    (NEW.id, 'Fed Interest Rate Decision', NULL, 'Hold Steady', 'long', 0.65, 1.00, 200, 20, 10, 107.69, 538.46, 'Closed', now() - interval '1 day', now() - interval '5 days'),
    (NEW.id, 'Apple Stock Movement', NULL, 'Up >2%', 'long', 0.55, 0.00, 150, 15, 10, -150.00, -1000.00, 'Closed', now() - interval '2 days', now() - interval '6 days'),
    (NEW.id, 'Gold Price Weekly', NULL, 'Down >1%', 'short', 0.42, 1.00, 100, 10, 10, 138.10, 1380.95, 'Closed', now() - interval '3 days', now() - interval '7 days');

  -- ========== FILLED TRADES (legacy demo) ==========
  INSERT INTO public.trades (user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, leverage, fee, pnl, status, closed_at, created_at)
  VALUES
    (NEW.id, 'Fed Interest Rate Decision', 'Hold Steady', 'buy', 'Market', 0.65, 200, 130, 20, 10, 0.13, 70.00, 'Filled', now() - interval '1 day', now() - interval '5 days'),
    (NEW.id, 'Apple Stock Movement', 'Up >2%', 'buy', 'Market', 0.55, 150, 82.5, 15, 10, 0.08, -82.50, 'Filled', now() - interval '2 days', now() - interval '6 days'),
    (NEW.id, 'Gold Price Weekly', 'Down >1%', 'sell', 'Market', 0.42, 100, 42, 10, 10, 0.04, 42.00, 'Filled', now() - interval '3 days', now() - interval '7 days');

  -- ========== SETTLED TRADES matched to real resolved events ==========
  INSERT INTO public.trades (user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, leverage, fee, pnl, status, closed_at, created_at)
  VALUES
    (NEW.id, 'Will Bitcoin exceed $100K by end of 2024?', 'YES', 'buy', 'Market', 0.62, 300, 186, 18.60, 10, 0.19, 114.00, 'Filled', now() - interval '10 days', now() - interval '25 days'),
    (NEW.id, 'Will Fed cut interest rates in December 2024?', 'Yes', 'buy', 'Market', 0.58, 200, 116, 11.60, 10, 0.12, 84.00, 'Filled', now() - interval '14 days', now() - interval '30 days'),
    (NEW.id, 'Super Bowl LVIII Winner', 'San Francisco 49ers', 'buy', 'Market', 0.48, 250, 120, 12.00, 10, 0.12, -120.00, 'Filled', now() - interval '45 days', now() - interval '60 days'),
    (NEW.id, 'Oscar Best Picture 2024', 'Oppenheimer', 'buy', 'Market', 0.71, 150, 106.50, 10.65, 10, 0.11, 43.50, 'Filled', now() - interval '60 days', now() - interval '75 days');

  INSERT INTO public.positions (user_id, event_name, option_id, option_label, side, entry_price, mark_price, size, margin, leverage, pnl, pnl_percent, status, closed_at, created_at)
  VALUES
    (NEW.id, 'Will Bitcoin exceed $100K by end of 2024?', NULL, 'YES', 'long', 0.62, 1.00, 300, 18.60, 10, 114.00, 612.90, 'Closed', now() - interval '10 days', now() - interval '25 days'),
    (NEW.id, 'Will Fed cut interest rates in December 2024?', NULL, 'Yes', 'long', 0.58, 1.00, 200, 11.60, 10, 84.00, 724.14, 'Closed', now() - interval '14 days', now() - interval '30 days'),
    (NEW.id, 'Super Bowl LVIII Winner', NULL, 'San Francisco 49ers', 'long', 0.48, 0.00, 250, 12.00, 10, -120.00, -1000.00, 'Closed', now() - interval '45 days', now() - interval '60 days'),
    (NEW.id, 'Oscar Best Picture 2024', NULL, 'Oppenheimer', 'long', 0.71, 1.00, 150, 10.65, 10, 43.50, 408.45, 'Closed', now() - interval '60 days', now() - interval '75 days');

  -- ========== POINTS ACCOUNT ==========
  INSERT INTO public.points_accounts (user_id, balance, lifetime_earned)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;
