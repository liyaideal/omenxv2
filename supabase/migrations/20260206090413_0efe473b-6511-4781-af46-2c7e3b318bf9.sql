-- Create table to track treasure drop status for each user
CREATE TABLE public.treasure_drops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  tier TEXT NOT NULL, -- 'low' (10%), 'mid' (80%), 'high' (10%)
  target_points INTEGER NOT NULL, -- The final points target (300-350, 500-850, 1000-1100)
  points_dropped INTEGER NOT NULL, -- Actual points awarded
  dropped_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for faster lookups
CREATE INDEX idx_treasure_drops_user_id ON public.treasure_drops(user_id);

-- Enable RLS
ALTER TABLE public.treasure_drops ENABLE ROW LEVEL SECURITY;

-- Users can view their own treasure drop status
CREATE POLICY "Users can view their own treasure drops"
  ON public.treasure_drops
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only system (via edge function with service role) can insert
-- No INSERT policy for regular users - edge function will use service role