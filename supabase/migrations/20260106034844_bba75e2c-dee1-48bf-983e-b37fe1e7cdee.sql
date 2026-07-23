-- Add explicit DELETE policies for all tables

-- Profiles: Prevent deletion via client (users shouldn't delete their profiles)
CREATE POLICY "Prevent profile deletion"
ON public.profiles
FOR DELETE
USING (false);

-- Trades: Prevent deletion (trade history should be preserved)
CREATE POLICY "Prevent trade deletion"
ON public.trades
FOR DELETE
USING (false);

-- Positions: Prevent deletion (use status update instead)
CREATE POLICY "Prevent position deletion"
ON public.positions
FOR DELETE
USING (false);

-- Update handle_new_user function with input validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public 
AS $$
DECLARE
  v_username TEXT;
BEGIN
  -- Safely extract username from metadata
  v_username := NEW.raw_user_meta_data ->> 'username';
  
  -- Validate username: alphanumeric + underscore, 3-20 chars
  -- Reject invalid usernames by setting to NULL
  IF v_username IS NOT NULL AND NOT (v_username ~ '^[a-zA-Z0-9_]{3,20}$') THEN
    v_username := NULL;
  END IF;
  
  -- Use ON CONFLICT to handle duplicates gracefully
  INSERT INTO public.profiles (user_id, username, email, trial_balance)
  VALUES (
    NEW.id,
    v_username,
    NEW.email,
    10000.00
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth flow
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;