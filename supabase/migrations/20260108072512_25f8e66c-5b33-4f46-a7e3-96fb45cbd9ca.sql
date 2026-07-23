-- Create events table to store event information and settlement status
CREATE TABLE public.events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '📊',
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  rules TEXT,
  source_name TEXT,
  source_url TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  volume TEXT,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  settled_at TIMESTAMP WITH TIME ZONE,
  winning_option_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event_options table to store options for each event
CREATE TABLE public.event_options (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0.5,
  final_price NUMERIC,
  is_winner BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_options ENABLE ROW LEVEL SECURITY;

-- Events are publicly readable (no auth required for viewing)
CREATE POLICY "Events are publicly readable"
ON public.events
FOR SELECT
USING (true);

-- Event options are publicly readable
CREATE POLICY "Event options are publicly readable"
ON public.event_options
FOR SELECT
USING (true);

-- Only authenticated users can insert/update events (for admin purposes later)
CREATE POLICY "Authenticated users can insert events"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update events"
ON public.events
FOR UPDATE
TO authenticated
USING (true);

-- Only authenticated users can insert/update event options
CREATE POLICY "Authenticated users can insert event options"
ON public.event_options
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update event options"
ON public.event_options
FOR UPDATE
TO authenticated
USING (true);

-- Add updated_at triggers
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_options_updated_at
BEFORE UPDATE ON public.event_options
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_events_is_resolved ON public.events(is_resolved);
CREATE INDEX idx_events_settled_at ON public.events(settled_at);
CREATE INDEX idx_events_category ON public.events(category);
CREATE INDEX idx_event_options_event_id ON public.event_options(event_id);