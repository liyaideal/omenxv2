-- Update handle_new_user() to restore demo data but keep balance at 0
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
  
  -- Create demo transactions for new users (various states for testing)
  INSERT INTO public.transactions (user_id, type, amount, status, description, network, tx_hash, confirmations, required_confirmations, created_at)
  VALUES
    -- Completed deposits
    (NEW.id, 'deposit', 5000, 'completed', 'USDT Deposit', 'TRC20', '0x' || encode(gen_random_bytes(32), 'hex'), 15, 15, NOW() - INTERVAL '7 days'),
    (NEW.id, 'deposit', 3000, 'completed', 'USDT Deposit', 'ERC20', '0x' || encode(gen_random_bytes(32), 'hex'), 12, 12, NOW() - INTERVAL '5 days'),
    (NEW.id, 'deposit', 2000, 'completed', 'USDT Deposit', 'TRC20', '0x' || encode(gen_random_bytes(32), 'hex'), 15, 15, NOW() - INTERVAL '3 days'),
    -- Pending deposit (confirming)
    (NEW.id, 'deposit', 1500, 'processing', 'USDT Deposit', 'ERC20', '0x' || encode(gen_random_bytes(32), 'hex'), 8, 12, NOW() - INTERVAL '30 minutes'),
    -- Completed withdrawal
    (NEW.id, 'withdrawal', -2000, 'completed', 'USDT Withdrawal', 'TRC20', '0x' || encode(gen_random_bytes(32), 'hex'), 15, 15, NOW() - INTERVAL '4 days'),
    -- Pending withdrawal
    (NEW.id, 'withdrawal', -500, 'processing', 'USDT Withdrawal', 'ERC20', NULL, 0, 12, NOW() - INTERVAL '2 hours'),
    -- Trade P&L records
    (NEW.id, 'trade_pnl', 850, 'completed', 'FIFA World Cup Winner - Won', NULL, NULL, NULL, NULL, NOW() - INTERVAL '2 days'),
    (NEW.id, 'trade_pnl', -320, 'completed', 'ETH Price Prediction - Lost', NULL, NULL, NULL, NULL, NOW() - INTERVAL '1 day'),
    (NEW.id, 'trade_pnl', 1200, 'completed', 'US Election Result - Won', NULL, NULL, NULL, NULL, NOW() - INTERVAL '6 hours'),
    -- Failed transaction
    (NEW.id, 'deposit', 1000, 'failed', 'USDT Deposit - Network Error', 'ERC20', NULL, 0, 12, NOW() - INTERVAL '6 days');

  -- Create demo trades for the user
  INSERT INTO public.trades (id, user_id, event_name, option_label, side, order_type, price, amount, quantity, leverage, margin, fee, status, created_at)
  VALUES
    (gen_random_uuid(), NEW.id, 'FIFA World Cup 2026 Winner?', 'Yes', 'buy', 'Market', 0.65, 100, 1538.46, 10, 10, 0.5, 'Filled', NOW() - INTERVAL '3 days')
  RETURNING id INTO v_trade_id_1;

  INSERT INTO public.trades (id, user_id, event_name, option_label, side, order_type, price, amount, quantity, leverage, margin, fee, status, created_at)
  VALUES
    (gen_random_uuid(), NEW.id, 'BTC Price on Dec 31, 2025?', 'Yes', 'buy', 'Market', 0.42, 150, 3571.43, 10, 15, 0.75, 'Filled', NOW() - INTERVAL '2 days')
  RETURNING id INTO v_trade_id_2;

  INSERT INTO public.trades (id, user_id, event_name, option_label, side, order_type, price, amount, quantity, leverage, margin, fee, status, created_at)
  VALUES
    (gen_random_uuid(), NEW.id, 'Will GPT-5 be released in 2025?', 'Yes', 'buy', 'Market', 0.58, 80, 1379.31, 10, 8, 0.4, 'Filled', NOW() - INTERVAL '1 day')
  RETURNING id INTO v_trade_id_3;

  -- Create demo open positions linked to real event options
  INSERT INTO public.positions (user_id, trade_id, event_name, option_label, option_id, side, entry_price, mark_price, size, margin, leverage, pnl, pnl_percent, status, created_at)
  VALUES
    (NEW.id, v_trade_id_1, 'FIFA World Cup 2026 Winner?', 'Yes', 'fifa-world-cup-2026-yes', 'long', 0.65, 0.72, 1538.46, 10, 10, 107.69, 10.77, 'Open', NOW() - INTERVAL '3 days'),
    (NEW.id, v_trade_id_2, 'BTC Price on Dec 31, 2025?', 'Yes', 'btc-price-dec-2025-yes', 'long', 0.42, 0.38, 3571.43, 15, 10, -142.86, -9.52, 'Open', NOW() - INTERVAL '2 days'),
    (NEW.id, v_trade_id_3, 'Will GPT-5 be released in 2025?', 'Yes', 'gpt5-2025-yes', 'long', 0.58, 0.61, 1379.31, 8, 10, 41.38, 5.17, 'Open', NOW() - INTERVAL '1 day');

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$;