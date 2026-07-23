
-- ========== FIX: Username Validation Only Client-Side ==========
-- Add database CHECK constraint to enforce username format server-side

-- Add CHECK constraint for username validation
-- Username must be alphanumeric + underscore, 3-20 characters, or NULL
ALTER TABLE public.profiles 
ADD CONSTRAINT check_valid_username 
CHECK (username IS NULL OR username ~ '^[a-zA-Z0-9_]{3,20}$');
