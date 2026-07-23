-- Create trigger to automatically create profile for new users
-- This trigger fires after a new user is created in auth.users

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Also manually create the missing profile for the current user
INSERT INTO public.profiles (user_id, username, email, trial_balance, avatar_url)
SELECT 
  '985bab49-08f9-4491-98ae-48a661128dc2',
  NULL,
  u.email,
  10000.00,
  'https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=felix&backgroundColor=b6e3f4'
FROM auth.users u
WHERE u.id = '985bab49-08f9-4491-98ae-48a661128dc2'
ON CONFLICT (user_id) DO NOTHING;