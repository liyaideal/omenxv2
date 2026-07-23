-- Fix handle_new_user trigger: order_type should be 'Market' not 'market'
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
  -- Creates diverse trades across different categories so users can see the Participated feature
  -- NOTE: order_type must be 'Market' or 'Limit' (capital first letter) to satisfy check constraint
  
  -- 🏛️ POLITICS: Government shutdown - Win (+$50)
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, closed_at
  ) VALUES (
    NEW.id, 'Will there be a government shutdown before April?', 'Yes', 'buy', 'Market', 0.35, 100, 35, 35, 0.35, 'Filled', 50, 10, now() - interval '3 days'
  );
  
  -- 🏛️ POLITICS: Presidential Election - Loss (-$20)
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, closed_at
  ) VALUES (
    NEW.id, 'Who will win the 2024 Presidential Election?', 'Trump', 'buy', 'Market', 0.55, 80, 44, 44, 0.44, 'Filled', -20, 10, now() - interval '30 days'
  );
  
  -- 💰 CRYPTO: Bitcoin $100K - Win (+$75)
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, closed_at
  ) VALUES (
    NEW.id, 'Will Bitcoin reach $100,000 by end of 2024?', 'Yes', 'buy', 'Market', 0.40, 150, 60, 60, 0.60, 'Filled', 75, 10, now() - interval '7 days'
  );
  
  -- 💰 CRYPTO: Ethereum merge success - Win (+$45)
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, closed_at
  ) VALUES (
    NEW.id, 'Will Ethereum stay above $3,000 in January?', 'Yes', 'buy', 'Market', 0.55, 80, 44, 44, 0.44, 'Filled', 45, 10, now() - interval '10 days'
  );
  
  -- 📈 STOCKS: Tesla stock - Loss (-$15)
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, closed_at
  ) VALUES (
    NEW.id, 'Will Tesla stock close above $250 on Dec 31?', 'Yes', 'buy', 'Market', 0.60, 50, 30, 30, 0.30, 'Filled', -15, 10, now() - interval '5 days'
  );
  
  -- 📈 STOCKS: Apple earnings beat - Win (+$35)
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, closed_at
  ) VALUES (
    NEW.id, 'Will Apple beat Q4 earnings expectations?', 'Yes', 'buy', 'Market', 0.65, 60, 39, 39, 0.39, 'Filled', 35, 10, now() - interval '14 days'
  );
  
  -- 🏈 SPORTS: Super Bowl winner - Win (+$120)
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, closed_at
  ) VALUES (
    NEW.id, 'Who will win Super Bowl LVIII?', 'Kansas City Chiefs', 'buy', 'Market', 0.45, 200, 90, 90, 0.90, 'Filled', 120, 10, now() - interval '60 days'
  );
  
  -- 🏈 SPORTS: World Cup match - Loss (-$25)
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, closed_at
  ) VALUES (
    NEW.id, 'Will Argentina win the Copa America 2024?', 'Yes', 'buy', 'Market', 0.70, 50, 35, 35, 0.35, 'Filled', -25, 10, now() - interval '45 days'
  );
  
  -- 🤖 TECH: OpenAI GPT-5 release - Win (+$55)
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, closed_at
  ) VALUES (
    NEW.id, 'Will OpenAI release GPT-5 before July 2024?', 'No', 'buy', 'Market', 0.60, 100, 60, 60, 0.60, 'Filled', 55, 10, now() - interval '20 days'
  );
  
  -- 🤖 TECH: Apple Vision Pro sales - Loss (-$40)
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, closed_at
  ) VALUES (
    NEW.id, 'Will Apple Vision Pro sell 1M units in 2024?', 'Yes', 'buy', 'Market', 0.40, 120, 48, 48, 0.48, 'Filled', -40, 10, now() - interval '8 days'
  );
  
  -- 🎬 ENTERTAINMENT: Oscar winner - Win (+$30)
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, closed_at
  ) VALUES (
    NEW.id, 'Will Oppenheimer win Best Picture at the Oscars?', 'Yes', 'buy', 'Market', 0.75, 50, 37.5, 37.5, 0.375, 'Filled', 30, 10, now() - interval '90 days'
  );
  
  -- 🌍 WORLD: Climate agreement - Loss (-$10)
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, closed_at
  ) VALUES (
    NEW.id, 'Will COP29 reach a major climate funding deal?', 'Yes', 'buy', 'Market', 0.50, 40, 20, 20, 0.20, 'Filled', -10, 10, now() - interval '25 days'
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$;