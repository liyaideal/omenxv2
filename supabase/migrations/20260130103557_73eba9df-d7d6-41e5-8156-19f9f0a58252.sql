-- Update handle_new_user function to add demo transactions with various statuses
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
  
  -- Create user profile
  INSERT INTO public.profiles (user_id, username, email, trial_balance, avatar_url)
  VALUES (
    NEW.id,
    v_username,
    NEW.email,
    10000.00,
    v_avatar_url
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- ========== CREATE DEMO TRANSACTIONS WITH VARIOUS STATUSES ==========
  
  -- 1. Welcome Bonus (completed)
  INSERT INTO public.transactions (user_id, type, amount, description, status, network, created_at)
  VALUES (
    NEW.id,
    'platform_credit',
    10000.00,
    'Welcome Bonus - Trial Balance',
    'completed',
    NULL,
    now() - interval '7 days'
  );
  
  -- 2. Completed deposit with tx hash
  INSERT INTO public.transactions (user_id, type, amount, description, status, network, tx_hash, created_at)
  VALUES (
    NEW.id,
    'deposit',
    500.00,
    'Deposit from external wallet',
    'completed',
    'BNB Smart Chain (BEP20)',
    '0x8f3a2b1c4d5e6f7890123456789abcdef0123456789abcdef0123456789abcd',
    now() - interval '5 days'
  );
  
  -- 3. Processing deposit (awaiting more confirmations)
  INSERT INTO public.transactions (user_id, type, amount, description, status, network, tx_hash, created_at)
  VALUES (
    NEW.id,
    'deposit',
    250.00,
    'Deposit from Binance',
    'processing',
    'BNB Smart Chain (BEP20)',
    '0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef12345678',
    now() - interval '30 minutes'
  );
  
  -- 4. Pending deposit (just detected)
  INSERT INTO public.transactions (user_id, type, amount, description, status, network, tx_hash, created_at)
  VALUES (
    NEW.id,
    'deposit',
    100.00,
    'Deposit detected on-chain',
    'pending',
    'Ethereum',
    '0xabcd1234ef5678901234567890abcdef1234567890abcdef1234567890abcd',
    now() - interval '5 minutes'
  );
  
  -- 5. Completed withdrawal
  INSERT INTO public.transactions (user_id, type, amount, description, status, network, tx_hash, created_at)
  VALUES (
    NEW.id,
    'withdraw',
    -200.00,
    'Withdrawal to 0x742d...F8e2',
    'completed',
    'Polygon',
    '0xdef456789012345678901234567890abcdef1234567890abcdef123456789012',
    now() - interval '3 days'
  );
  
  -- 6. Failed withdrawal
  INSERT INTO public.transactions (user_id, type, amount, description, status, network, created_at)
  VALUES (
    NEW.id,
    'withdraw',
    -150.00,
    'Withdrawal failed - Insufficient gas',
    'failed',
    'Ethereum',
    now() - interval '2 days'
  );
  
  -- 7. Trade profit (completed)
  INSERT INTO public.transactions (user_id, type, amount, description, status, created_at)
  VALUES (
    NEW.id,
    'trade_profit',
    85.50,
    'Profit from BTC $100K prediction',
    'completed',
    now() - interval '4 days'
  );
  
  -- 8. Trade loss (completed)
  INSERT INTO public.transactions (user_id, type, amount, description, status, created_at)
  VALUES (
    NEW.id,
    'trade_loss',
    -45.00,
    'Loss from GPT-5 release prediction',
    'completed',
    now() - interval '6 days'
  );
  
  -- 9. Another completed deposit (Solana)
  INSERT INTO public.transactions (user_id, type, amount, description, status, network, tx_hash, created_at)
  VALUES (
    NEW.id,
    'deposit',
    300.00,
    'Deposit from Phantom wallet',
    'completed',
    'Solana',
    '5xYz7W8v9U0T1S2R3Q4P5O6N7M8L9K0J1I2H3G4F5E6D7C8B9A0',
    now() - interval '1 day'
  );
  
  -- 10. Processing withdrawal (sent to chain)
  INSERT INTO public.transactions (user_id, type, amount, description, status, network, tx_hash, created_at)
  VALUES (
    NEW.id,
    'withdraw',
    -75.00,
    'Withdrawal to 0x9a8b...C3d4',
    'processing',
    'Arbitrum One',
    '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
    now() - interval '2 hours'
  );

  -- ========== DEMO TRADES FOR NEW USERS ==========
  -- Creates multiple trades per event with Open, Add, Reduce actions
  -- Note: All trades need positive margin value due to check constraint
  
  -- 🏛️ POLITICS: Government shutdown - Win (+$50 total)
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at, closed_at
  ) VALUES (
    NEW.id, 'When will government shutdown end?', 'Before Feb 1', 'buy', 'Market', 0.32, 80, 25.6, 25.6, 0.256, 'Filled', 30, 10, now() - interval '7 days', now() - interval '3 days'
  );
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at, closed_at
  ) VALUES (
    NEW.id, 'When will government shutdown end?', 'Before Feb 1', 'buy', 'Market', 0.38, 50, 19, 19, 0.19, 'Filled', 20, 10, now() - interval '5 days', now() - interval '3 days'
  );
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at, closed_at
  ) VALUES (
    NEW.id, 'When will government shutdown end?', 'Before Feb 1', 'sell', 'Market', 0.55, 30, 16.5, 16.5, 0.165, 'Filled', 8, 10, now() - interval '4 days', now() - interval '3 days'
  );
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at, closed_at
  ) VALUES (
    NEW.id, 'When will government shutdown end?', 'Before Feb 1', 'buy', 'Market', 0.48, 20, 9.6, 9.6, 0.096, 'Filled', 10, 10, now() - interval '3 days 12 hours', now() - interval '3 days'
  );
  
  -- 🏛️ POLITICS: Presidential Election - Win (+$80 total)
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at, closed_at
  ) VALUES (
    NEW.id, '2024 US Presidential Election Result', 'Trump', 'buy', 'Market', 0.45, 50, 22.5, 22.5, 0.225, 'Filled', 35, 10, now() - interval '50 days', now() - interval '30 days'
  );
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at, closed_at
  ) VALUES (
    NEW.id, '2024 US Presidential Election Result', 'Trump', 'buy', 'Market', 0.52, 40, 20.8, 20.8, 0.208, 'Filled', 25, 10, now() - interval '45 days', now() - interval '30 days'
  );
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at, closed_at
  ) VALUES (
    NEW.id, '2024 US Presidential Election Result', 'Trump', 'sell', 'Market', 0.65, 25, 16.25, 16.25, 0.163, 'Filled', 5, 10, now() - interval '38 days', now() - interval '30 days'
  );
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at, closed_at
  ) VALUES (
    NEW.id, '2024 US Presidential Election Result', 'Trump', 'buy', 'Market', 0.58, 30, 17.4, 17.4, 0.174, 'Filled', 15, 10, now() - interval '35 days', now() - interval '30 days'
  );
  
  -- 💰 CRYPTO: Bitcoin $100K - Win (+$75 total)
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at, closed_at
  ) VALUES (
    NEW.id, 'Will Bitcoin exceed $100K by end of 2024?', 'Yes', 'buy', 'Market', 0.35, 100, 35, 35, 0.35, 'Filled', 45, 10, now() - interval '14 days', now() - interval '7 days'
  );
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at, closed_at
  ) VALUES (
    NEW.id, 'Will Bitcoin exceed $100K by end of 2024?', 'Yes', 'buy', 'Market', 0.42, 60, 25.2, 25.2, 0.252, 'Filled', 25, 10, now() - interval '11 days', now() - interval '7 days'
  );
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at, closed_at
  ) VALUES (
    NEW.id, 'Will Bitcoin exceed $100K by end of 2024?', 'Yes', 'sell', 'Market', 0.72, 40, 28.8, 28.8, 0.288, 'Filled', 12, 10, now() - interval '9 days', now() - interval '7 days'
  );
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at, closed_at
  ) VALUES (
    NEW.id, 'Will Bitcoin exceed $100K by end of 2024?', 'Yes', 'buy', 'Market', 0.58, 30, 17.4, 17.4, 0.174, 'Filled', 10, 10, now() - interval '8 days', now() - interval '7 days'
  );
  
  -- 🤖 TECH: OpenAI GPT-5 release - Loss (-$40 total)
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at, closed_at
  ) VALUES (
    NEW.id, 'Will OpenAI GPT-5 be released in 2024?', 'Yes', 'buy', 'Market', 0.55, 60, 33, 33, 0.33, 'Filled', -22, 10, now() - interval '30 days', now() - interval '20 days'
  );
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at, closed_at
  ) VALUES (
    NEW.id, 'Will OpenAI GPT-5 be released in 2024?', 'Yes', 'buy', 'Market', 0.62, 40, 24.8, 24.8, 0.248, 'Filled', -15, 10, now() - interval '26 days', now() - interval '20 days'
  );
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at, closed_at
  ) VALUES (
    NEW.id, 'Will OpenAI GPT-5 be released in 2024?', 'Yes', 'sell', 'Market', 0.45, 30, 13.5, 13.5, 0.135, 'Filled', -5, 10, now() - interval '23 days', now() - interval '20 days'
  );
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at, closed_at
  ) VALUES (
    NEW.id, 'Will OpenAI GPT-5 be released in 2024?', 'Yes', 'buy', 'Market', 0.48, 25, 12, 12, 0.12, 'Filled', -8, 10, now() - interval '21 days', now() - interval '20 days'
  );
  
  -- 📈 STOCKS: Tesla stock - Win (+$35 total)
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at, closed_at
  ) VALUES (
    NEW.id, 'Will Tesla stock exceed $250 in Q4?', 'Yes', 'buy', 'Market', 0.52, 40, 20.8, 20.8, 0.208, 'Filled', 18, 10, now() - interval '15 days', now() - interval '5 days'
  );
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at, closed_at
  ) VALUES (
    NEW.id, 'Will Tesla stock exceed $250 in Q4?', 'Yes', 'buy', 'Market', 0.58, 30, 17.4, 17.4, 0.174, 'Filled', 12, 10, now() - interval '12 days', now() - interval '5 days'
  );
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at, closed_at
  ) VALUES (
    NEW.id, 'Will Tesla stock exceed $250 in Q4?', 'Yes', 'sell', 'Market', 0.75, 20, 15, 15, 0.15, 'Filled', 6, 10, now() - interval '8 days', now() - interval '5 days'
  );
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at, closed_at
  ) VALUES (
    NEW.id, 'Will Tesla stock exceed $250 in Q4?', 'Yes', 'buy', 'Market', 0.68, 15, 10.2, 10.2, 0.102, 'Filled', 5, 10, now() - interval '6 days', now() - interval '5 days'
  );
  
  -- 🍎 TECH: Apple Fall Event - Win (+$25 total)
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at, closed_at
  ) VALUES (
    NEW.id, 'Apple Fall Event Date', 'September', 'buy', 'Market', 0.68, 45, 30.6, 30.6, 0.306, 'Filled', 15, 10, now() - interval '100 days', now() - interval '90 days'
  );
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at, closed_at
  ) VALUES (
    NEW.id, 'Apple Fall Event Date', 'September', 'buy', 'Market', 0.75, 30, 22.5, 22.5, 0.225, 'Filled', 10, 10, now() - interval '96 days', now() - interval '90 days'
  );
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at, closed_at
  ) VALUES (
    NEW.id, 'Apple Fall Event Date', 'September', 'sell', 'Market', 0.85, 20, 17, 17, 0.17, 'Filled', 4, 10, now() - interval '93 days', now() - interval '90 days'
  );

  -- ========== DEMO OPEN POSITIONS FOR NEW USERS ==========
  -- Create 3 active positions linked to REAL events with option_id
  
  -- Generate trade IDs first for linking
  v_trade_id_1 := gen_random_uuid();
  v_trade_id_2 := gen_random_uuid();
  v_trade_id_3 := gen_random_uuid();
  
  -- Position 1: FIFA World Cup 2026 Winner - Long on Brazil (profitable)
  -- Uses real event: FIFA World Cup 2026 Winner? with option_id: wc-1 (Brazil)
  INSERT INTO public.trades (
    id, user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at
  ) VALUES (
    v_trade_id_1, NEW.id, 'FIFA World Cup 2026 Winner?', 'Brazil', 'buy', 'Market', 0.08, 500, 40, 40, 0.4, 'Filled', NULL, 10, now() - interval '2 days'
  );
  
  INSERT INTO public.positions (
    user_id, trade_id, event_name, option_label, option_id, side, entry_price, mark_price, size, margin, leverage, status, pnl, pnl_percent, tp_mode, sl_mode, created_at
  ) VALUES (
    NEW.id, v_trade_id_1, 'FIFA World Cup 2026 Winner?', 'Brazil', 'wc-1', 'long', 0.08, 0.08, 500, 40, 10, 'Open', 0, 0, '$', '$', now() - interval '2 days'
  );
  
  -- Position 2: Will Bitcoin reach $150K - Long on Yes (slightly profitable)
  -- Uses real event: Will Bitcoin reach $150,000 by June 2026? with option_id: btc-150k-yes
  INSERT INTO public.trades (
    id, user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at
  ) VALUES (
    v_trade_id_2, NEW.id, 'Will Bitcoin reach $150,000 by June 2026?', 'Yes', 'buy', 'Market', 0.35, 200, 70, 70, 0.7, 'Filled', NULL, 10, now() - interval '1 day'
  );
  
  INSERT INTO public.positions (
    user_id, trade_id, event_name, option_label, option_id, side, entry_price, mark_price, size, margin, leverage, status, pnl, pnl_percent, tp_mode, sl_mode, created_at
  ) VALUES (
    NEW.id, v_trade_id_2, 'Will Bitcoin reach $150,000 by June 2026?', 'Yes', 'btc-150k-yes', 'long', 0.35, 0.35, 200, 70, 10, 'Open', 0, 0, '$', '$', now() - interval '1 day'
  );
  
  -- Position 3: Leading AI model - Long on OpenAI (profitable)
  -- Uses real event: Leading AI model by June 2026? with option_id: ai-1 (OpenAI GPT)
  INSERT INTO public.trades (
    id, user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at
  ) VALUES (
    v_trade_id_3, NEW.id, 'Leading AI model by June 2026?', 'OpenAI (GPT)', 'buy', 'Market', 0.28, 300, 84, 84, 0.84, 'Filled', NULL, 10, now() - interval '12 hours'
  );
  
  INSERT INTO public.positions (
    user_id, trade_id, event_name, option_label, option_id, side, entry_price, mark_price, size, margin, leverage, status, pnl, pnl_percent, tp_mode, sl_mode, created_at
  ) VALUES (
    NEW.id, v_trade_id_3, 'Leading AI model by June 2026?', 'OpenAI (GPT)', 'ai-1', 'long', 0.28, 0.28, 300, 84, 10, 'Open', 0, 0, '$', '$', now() - interval '12 hours'
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$;