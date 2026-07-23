
-- Update handle_new_user function to also create demo trades for new users
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
  IF v_username IS NOT NULL AND NOT (v_username ~ '^[a-zA-Z0-9_]{3,20}$') THEN
    v_username := NULL;
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
  
  -- Create demo trades for resolved events so new users can see Participated feature
  -- Trade 1: Government shutdown - Win (+$50)
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, closed_at
  ) VALUES (
    NEW.id, 'Will there be a government shutdown before April?', 'Yes', 'buy', 'market', 0.35, 100, 35, 35, 0.35, 'Filled', 50, 10, now() - interval '3 days'
  );
  
  -- Trade 2: Presidential Election - Loss (-$20)
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, closed_at
  ) VALUES (
    NEW.id, 'Who will win the 2024 Presidential Election?', 'Trump', 'buy', 'market', 0.55, 80, 44, 44, 0.44, 'Filled', -20, 10, now() - interval '30 days'
  );
  
  -- Trade 3: Bitcoin $100K - Win (+$75)
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, closed_at
  ) VALUES (
    NEW.id, 'Will Bitcoin reach $100,000 by end of 2024?', 'Yes', 'buy', 'market', 0.40, 150, 60, 60, 0.60, 'Filled', 75, 10, now() - interval '7 days'
  );
  
  -- Trade 4: Tesla stock - Loss (-$15)
  INSERT INTO public.trades (
    user_id, event_name, option_label, side, order_type, price, quantity, amount, margin, fee, status, pnl, leverage, closed_at
  ) VALUES (
    NEW.id, 'Will Tesla stock close above $250 on Dec 31?', 'Yes', 'buy', 'market', 0.60, 50, 30, 30, 0.30, 'Filled', -15, 10, now() - interval '5 days'
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$;
