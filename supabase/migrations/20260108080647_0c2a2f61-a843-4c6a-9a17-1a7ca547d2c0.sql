-- Fix handle_new_user trigger: use correct event names that match resolved events in the database
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
  -- Replace spaces with underscores for usernames from metadata
  IF v_username IS NOT NULL THEN
    v_username := REPLACE(v_username, ' ', '_');
    IF NOT (v_username ~ '^[a-zA-Z0-9_]{3,20}$') THEN
      v_username := NULL;
    END IF;
  END IF;
  
  -- Generate random avatar URL using DiceBear adventurer-neutral style
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
  -- Creates trades matching ACTUAL resolved events in the database
  -- Event names MUST match exactly with events.name column
  
  -- 🏛️ POLITICS: Government shutdown - Win (+$50)
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, closed_at
  ) VALUES (
    NEW.id, 'When will government shutdown end?', 'Before Feb 1', 'buy', 'Market', 0.35, 100, 35, 35, 0.35, 'Filled', 50, 10, now() - interval '3 days'
  );
  
  -- 🏛️ POLITICS: Presidential Election - Win (+$80)
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, closed_at
  ) VALUES (
    NEW.id, '2024 US Presidential Election Result', 'Trump', 'buy', 'Market', 0.55, 80, 44, 44, 0.44, 'Filled', 80, 10, now() - interval '30 days'
  );
  
  -- 💰 CRYPTO: Bitcoin $100K - Win (+$75)
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, closed_at
  ) VALUES (
    NEW.id, 'Will Bitcoin exceed $100K by end of 2024?', 'Yes', 'buy', 'Market', 0.40, 150, 60, 60, 0.60, 'Filled', 75, 10, now() - interval '7 days'
  );
  
  -- 🤖 TECH: OpenAI GPT-5 release - Loss (-$40)
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, closed_at
  ) VALUES (
    NEW.id, 'Will OpenAI GPT-5 be released in 2024?', 'Yes', 'buy', 'Market', 0.60, 100, 60, 60, 0.60, 'Filled', -40, 10, now() - interval '20 days'
  );
  
  -- 📈 STOCKS: Tesla stock - Win (+$35)
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, closed_at
  ) VALUES (
    NEW.id, 'Will Tesla stock exceed $250 in Q4?', 'Yes', 'buy', 'Market', 0.60, 50, 30, 30, 0.30, 'Filled', 35, 10, now() - interval '5 days'
  );
  
  -- 🍎 TECH: Apple Fall Event - Win (+$25)
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, closed_at
  ) VALUES (
    NEW.id, 'Apple Fall Event Date', 'September', 'buy', 'Market', 0.75, 50, 37.5, 37.5, 0.375, 'Filled', 25, 10, now() - interval '90 days'
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$;