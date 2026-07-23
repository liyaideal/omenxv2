-- Add settlement_description to events table for settlement evidence
ALTER TABLE public.events 
ADD COLUMN settlement_description text;

-- Create price_history table for tracking option price changes over time
CREATE TABLE public.price_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id text NOT NULL,
  option_id text NOT NULL,
  price numeric NOT NULL,
  recorded_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_price_history_event_option ON public.price_history (event_id, option_id, recorded_at DESC);
CREATE INDEX idx_price_history_recorded_at ON public.price_history (recorded_at DESC);

-- Enable RLS
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

-- Price history is publicly readable (for charts)
CREATE POLICY "Price history is publicly readable"
ON public.price_history
FOR SELECT
USING (true);

-- Only admins can insert/update price history
CREATE POLICY "Only admins can insert price history"
ON public.price_history
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update price history"
ON public.price_history
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create event_relations table for admin-configured related events
CREATE TABLE public.event_relations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_event_id text NOT NULL,
  related_event_id text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(source_event_id, related_event_id)
);

-- Create indexes
CREATE INDEX idx_event_relations_source ON public.event_relations (source_event_id, display_order);

-- Enable RLS
ALTER TABLE public.event_relations ENABLE ROW LEVEL SECURITY;

-- Event relations are publicly readable
CREATE POLICY "Event relations are publicly readable"
ON public.event_relations
FOR SELECT
USING (true);

-- Only admins can manage event relations
CREATE POLICY "Only admins can insert event relations"
ON public.event_relations
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update event relations"
ON public.event_relations
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete event relations"
ON public.event_relations
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_event_relations_updated_at
BEFORE UPDATE ON public.event_relations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();