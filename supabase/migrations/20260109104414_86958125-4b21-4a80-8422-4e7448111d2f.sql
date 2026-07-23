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
  -- Reduce position (margin = amount for reduce orders)
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
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$