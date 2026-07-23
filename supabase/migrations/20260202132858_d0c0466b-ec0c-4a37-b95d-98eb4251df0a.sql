
-- Update handle_new_user function to include settled positions (Closed status)
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_username TEXT;
  v_avatar_url TEXT;
  v_avatar_seeds TEXT[] := ARRAY['felix', 'aneka', 'sophia', 'liam', 'mia', 'oliver', 'emma', 'noah', 'ava', 'elijah', 'isabella', 'james', 'luna', 'benjamin', 'chloe', 'lucas', 'penelope', 'henry', 'layla', 'alexander'];
  v_avatar_bgs TEXT[] := ARRAY['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'];
  v_random_seed TEXT;
  v_random_bg TEXT;
  v_trade_id_1 UUID;
  v_trade_id_2 UUID;
  v_trade_id_3 UUID;
  v_trade_id_4 UUID;
  v_trade_id_5 UUID;
  v_trade_id_6 UUID;
BEGIN
  -- Safely extract username from metadata
  v_username := NEW.raw_user_meta_data ->> 'username';
  
  -- Validate username: alphanumeric + underscore, 3-20 chars
  IF v_username IS NOT NULL THEN
    v_username := REPLACE(v_username, ' ', '_');
    IF NOT (v_username ~ '^[a-zA-Z0-9_]{3,20}$') THEN
      v_username := NULL;
    END IF;
  END IF;
  
  -- Generate random avatar URL
  v_random_seed := v_avatar_seeds[1 + floor(random() * array_length(v_avatar_seeds, 1))::int];
  v_random_bg := v_avatar_bgs[1 + floor(random() * array_length(v_avatar_bgs, 1))::int];
  v_avatar_url := 'https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=' || v_random_seed || '&backgroundColor=' || v_random_bg;
  
  -- Create user profile with 0 initial balance (real money mode)
  INSERT INTO public.profiles (user_id, username, email, balance, avatar_url)
  VALUES (
    NEW.id,
    v_username,
    NEW.email,
    0,
    v_avatar_url
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create mock transactions for new users (pending + history)
  INSERT INTO public.transactions (user_id, type, amount, status, description, network, tx_hash, confirmations, required_confirmations, created_at)
  VALUES
    -- PENDING CONFIRMATIONS (processing status)
    (NEW.id, 'deposit', 2500, 'processing', 'USDT Deposit', 'TRC20', '0x' || replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''), 12, 15, NOW() - INTERVAL '15 minutes'),
    (NEW.id, 'deposit', 1800, 'processing', 'USDT Deposit', 'ERC20', '0x' || replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''), 6, 12, NOW() - INTERVAL '25 minutes'),
    
    -- TRANSACTION HISTORY (completed + failed)
    (NEW.id, 'deposit', 5000, 'completed', 'USDT Deposit', 'TRC20', '0x' || replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''), 15, 15, NOW() - INTERVAL '7 days'),
    (NEW.id, 'deposit', 3000, 'completed', 'USDT Deposit', 'ERC20', '0x' || replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''), 12, 12, NOW() - INTERVAL '5 days'),
    (NEW.id, 'deposit', 2000, 'completed', 'USDT Deposit', 'TRC20', '0x' || replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''), 15, 15, NOW() - INTERVAL '3 days'),
    (NEW.id, 'withdraw', 2000, 'completed', 'USDT Withdrawal', 'TRC20', '0x' || replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''), 15, 15, NOW() - INTERVAL '4 days'),
    (NEW.id, 'withdraw', 1500, 'completed', 'USDT Withdrawal', 'ERC20', '0x' || replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''), 12, 12, NOW() - INTERVAL '2 days'),
    (NEW.id, 'trade_profit', 850, 'completed', 'FIFA World Cup Winner - Won', NULL, NULL, NULL, NULL, NOW() - INTERVAL '2 days'),
    (NEW.id, 'trade_loss', 320, 'completed', 'ETH Price Prediction - Lost', NULL, NULL, NULL, NULL, NOW() - INTERVAL '1 day'),
    (NEW.id, 'trade_profit', 1200, 'completed', 'US Election Result - Won', NULL, NULL, NULL, NULL, NOW() - INTERVAL '6 hours'),
    (NEW.id, 'deposit', 1000, 'failed', 'USDT Deposit - Network Error', 'ERC20', NULL, 0, 12, NOW() - INTERVAL '6 days');

  -- Create demo trades for OPEN positions
  INSERT INTO public.trades (id, user_id, event_name, option_label, side, order_type, price, amount, quantity, leverage, margin, fee, status, created_at)
  VALUES
    (gen_random_uuid(), NEW.id, 'FIFA World Cup 2026 Winner?', 'Brazil', 'buy', 'Market', 0.65, 100, 1538.46, 10, 10, 0.5, 'Filled', NOW() - INTERVAL '3 days')
  RETURNING id INTO v_trade_id_1;

  INSERT INTO public.trades (id, user_id, event_name, option_label, side, order_type, price, amount, quantity, leverage, margin, fee, status, created_at)
  VALUES
    (gen_random_uuid(), NEW.id, 'BTC Price Q2 2026?', '$100,000 - $120,000', 'buy', 'Market', 0.42, 150, 3571.43, 10, 15, 0.75, 'Filled', NOW() - INTERVAL '2 days')
  RETURNING id INTO v_trade_id_2;

  INSERT INTO public.trades (id, user_id, event_name, option_label, side, order_type, price, amount, quantity, leverage, margin, fee, status, created_at)
  VALUES
    (gen_random_uuid(), NEW.id, 'Will ETH reach $10k in 2026?', 'Yes', 'buy', 'Market', 0.58, 80, 1379.31, 10, 8, 0.4, 'Filled', NOW() - INTERVAL '1 day')
  RETURNING id INTO v_trade_id_3;

  -- Create demo trades for SETTLED (Closed) positions
  INSERT INTO public.trades (id, user_id, event_name, option_label, side, order_type, price, amount, quantity, leverage, margin, fee, status, pnl, closed_at, created_at)
  VALUES
    (gen_random_uuid(), NEW.id, 'US Presidential Election 2024', 'Donald Trump', 'buy', 'Market', 0.55, 200, 3636.36, 10, 20, 1.0, 'Filled', 450, NOW() - INTERVAL '30 days', NOW() - INTERVAL '45 days')
  RETURNING id INTO v_trade_id_4;

  INSERT INTO public.trades (id, user_id, event_name, option_label, side, order_type, price, amount, quantity, leverage, margin, fee, status, pnl, closed_at, created_at)
  VALUES
    (gen_random_uuid(), NEW.id, 'Super Bowl LVIII Winner', 'Kansas City Chiefs', 'buy', 'Market', 0.48, 120, 2500, 10, 12, 0.6, 'Filled', 624, NOW() - INTERVAL '25 days', NOW() - INTERVAL '40 days')
  RETURNING id INTO v_trade_id_5;

  INSERT INTO public.trades (id, user_id, event_name, option_label, side, order_type, price, amount, quantity, leverage, margin, fee, status, pnl, closed_at, created_at)
  VALUES
    (gen_random_uuid(), NEW.id, 'Fed Rate Decision March 2025', 'No Cut', 'buy', 'Market', 0.72, 80, 1111.11, 10, 8, 0.4, 'Filled', -80, NOW() - INTERVAL '20 days', NOW() - INTERVAL '35 days')
  RETURNING id INTO v_trade_id_6;

  -- Create demo OPEN positions
  INSERT INTO public.positions (user_id, trade_id, event_name, option_label, option_id, side, entry_price, mark_price, size, margin, leverage, pnl, pnl_percent, status, created_at)
  VALUES
    (NEW.id, v_trade_id_1, 'FIFA World Cup 2026 Winner?', 'Brazil', NULL, 'long', 0.65, 0.72, 1538.46, 10, 10, 107.69, 10.77, 'Open', NOW() - INTERVAL '3 days'),
    (NEW.id, v_trade_id_2, 'BTC Price Q2 2026?', '$100,000 - $120,000', NULL, 'long', 0.42, 0.38, 3571.43, 15, 10, -142.86, -9.52, 'Open', NOW() - INTERVAL '2 days'),
    (NEW.id, v_trade_id_3, 'Will ETH reach $10k in 2026?', 'Yes', NULL, 'long', 0.58, 0.61, 1379.31, 8, 10, 41.38, 5.17, 'Open', NOW() - INTERVAL '1 day');

  -- Create demo SETTLED (Closed) positions
  INSERT INTO public.positions (user_id, trade_id, event_name, option_label, option_id, side, entry_price, mark_price, size, margin, leverage, pnl, pnl_percent, status, closed_at, created_at)
  VALUES
    -- Won position - US Election
    (NEW.id, v_trade_id_4, 'US Presidential Election 2024', 'Donald Trump', NULL, 'long', 0.55, 1.00, 3636.36, 20, 10, 450, 22.5, 'Closed', NOW() - INTERVAL '30 days', NOW() - INTERVAL '45 days'),
    -- Won position - Super Bowl
    (NEW.id, v_trade_id_5, 'Super Bowl LVIII Winner', 'Kansas City Chiefs', NULL, 'long', 0.48, 1.00, 2500, 12, 10, 624, 52, 'Closed', NOW() - INTERVAL '25 days', NOW() - INTERVAL '40 days'),
    -- Lost position - Fed Rate
    (NEW.id, v_trade_id_6, 'Fed Rate Decision March 2025', 'No Cut', NULL, 'long', 0.72, 0.00, 1111.11, 8, 10, -80, -100, 'Closed', NOW() - INTERVAL '20 days', NOW() - INTERVAL '35 days');

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$;
