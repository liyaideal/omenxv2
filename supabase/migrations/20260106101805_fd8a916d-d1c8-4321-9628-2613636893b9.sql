-- Create the trigger to call handle_new_user when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Also update existing profiles that don't have avatar_url
UPDATE public.profiles
SET avatar_url = 'https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=' || 
  (ARRAY['felix', 'aneka', 'sophia', 'liam', 'mia', 'oliver', 'emma', 'noah', 'ava', 'elijah'])[1 + floor(random() * 10)::int] ||
  '&backgroundColor=' || 
  (ARRAY['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'])[1 + floor(random() * 5)::int]
WHERE avatar_url IS NULL;