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
  
  -- ========== DEMO TRADES FOR NEW USERS ==========
  -- Creates multiple trades per event to simulate realistic position building
  
  -- 🏛️ POLITICS: Government shutdown - Win (+$50 total across 3 trades)
  -- Trade 1: Open position
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at, closed_at
  ) VALUES (
    NEW.id, 'When will government shutdown end?', 'Before Feb 1', 'buy', 'Market', 0.32, 60, 19.2, 19.2, 0.192, 'Filled', 25, 10, now() - interval '7 days', now() - interval '3 days'
  );
  -- Trade 2: Add to position
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at, closed_at
  ) VALUES (
    NEW.id, 'When will government shutdown end?', 'Before Feb 1', 'buy', 'Market', 0.38, 40, 15.2, 15.2, 0.152, 'Filled', 15, 10, now() - interval '5 days', now() - interval '3 days'
  );
  -- Trade 3: Final add
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at, closed_at
  ) VALUES (
    NEW.id, 'When will government shutdown end?', 'Before Feb 1', 'buy', 'Market', 0.42, 30, 12.6, 12.6, 0.126, 'Filled', 10, 10, now() - interval '4 days', now() - interval '3 days'
  );
  
  -- 🏛️ POLITICS: Presidential Election - Win (+$80 total across 4 trades)
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at, closed_at
  ) VALUES (
    NEW.id, '2024 US Presidential Election Result', 'Trump', 'buy', 'Market', 0.48, 40, 19.2, 19.2, 0.192, 'Filled', 30, 10, now() - interval '45 days', now() - interval '30 days'
  );
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at, closed_at
  ) VALUES (
    NEW.id, '2024 US Presidential Election Result', 'Trump', 'buy', 'Market', 0.52, 30, 15.6, 15.6, 0.156, 'Filled', 22, 10, now() - interval '40 days', now() - interval '30 days'
  );
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at, closed_at
  ) VALUES (
    NEW.id, '2024 US Presidential Election Result', 'Trump', 'buy', 'Market', 0.58, 25, 14.5, 14.5, 0.145, 'Filled', 18, 10, now() - interval '35 days', now() - interval '30 days'
  );
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at, closed_at
  ) VALUES (
    NEW.id, '2024 US Presidential Election Result', 'Trump', 'buy', 'Market', 0.62, 20, 12.4, 12.4, 0.124, 'Filled', 10, 10, now() - interval '32 days', now() - interval '30 days'
  );
  
  -- 💰 CRYPTO: Bitcoin $100K - Win (+$75 total across 3 trades)
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at, closed_at
  ) VALUES (
    NEW.id, 'Will Bitcoin exceed $100K by end of 2024?', 'Yes', 'buy', 'Market', 0.35, 80, 28, 28, 0.28, 'Filled', 40, 10, now() - interval '14 days', now() - interval '7 days'
  );
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at, closed_at
  ) VALUES (
    NEW.id, 'Will Bitcoin exceed $100K by end of 2024?', 'Yes', 'buy', 'Market', 0.42, 50, 21, 21, 0.21, 'Filled', 25, 10, now() - interval '10 days', now() - interval '7 days'
  );
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at, closed_at
  ) VALUES (
    NEW.id, 'Will Bitcoin exceed $100K by end of 2024?', 'Yes', 'buy', 'Market', 0.48, 30, 14.4, 14.4, 0.144, 'Filled', 10, 10, now() - interval '8 days', now() - interval '7 days'
  );
  
  -- 🤖 TECH: OpenAI GPT-5 release - Loss (-$40 total across 3 trades)
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at, closed_at
  ) VALUES (
    NEW.id, 'Will OpenAI GPT-5 be released in 2024?', 'Yes', 'buy', 'Market', 0.55, 50, 27.5, 27.5, 0.275, 'Filled', -20, 10, now() - interval '28 days', now() - interval '20 days'
  );
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at, closed_at
  ) VALUES (
    NEW.id, 'Will OpenAI GPT-5 be released in 2024?', 'Yes', 'buy', 'Market', 0.62, 35, 21.7, 21.7, 0.217, 'Filled', -12, 10, now() - interval '25 days', now() - interval '20 days'
  );
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at, closed_at
  ) VALUES (
    NEW.id, 'Will OpenAI GPT-5 be released in 2024?', 'Yes', 'buy', 'Market', 0.68, 25, 17, 17, 0.17, 'Filled', -8, 10, now() - interval '22 days', now() - interval '20 days'
  );
  
  -- 📈 STOCKS: Tesla stock - Win (+$35 total across 3 trades)
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at, closed_at
  ) VALUES (
    NEW.id, 'Will Tesla stock exceed $250 in Q4?', 'Yes', 'buy', 'Market', 0.55, 30, 16.5, 16.5, 0.165, 'Filled', 18, 10, now() - interval '12 days', now() - interval '5 days'
  );
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at, closed_at
  ) VALUES (
    NEW.id, 'Will Tesla stock exceed $250 in Q4?', 'Yes', 'buy', 'Market', 0.62, 25, 15.5, 15.5, 0.155, 'Filled', 12, 10, now() - interval '9 days', now() - interval '5 days'
  );
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at, closed_at
  ) VALUES (
    NEW.id, 'Will Tesla stock exceed $250 in Q4?', 'Yes', 'buy', 'Market', 0.68, 20, 13.6, 13.6, 0.136, 'Filled', 5, 10, now() - interval '6 days', now() - interval '5 days'
  );
  
  -- 🍎 TECH: Apple Fall Event - Win (+$25 total across 2 trades)
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at, closed_at
  ) VALUES (
    NEW.id, 'Apple Fall Event Date', 'September', 'buy', 'Market', 0.72, 35, 25.2, 25.2, 0.252, 'Filled', 15, 10, now() - interval '95 days', now() - interval '90 days'
  );
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, created_at, closed_at
  ) VALUES (
    NEW.id, 'Apple Fall Event Date', 'September', 'buy', 'Market', 0.78, 25, 19.5, 19.5, 0.195, 'Filled', 10, 10, now() - interval '92 days', now() - interval '90 days'
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$