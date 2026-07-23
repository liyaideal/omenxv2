-- Add option_id column to positions table
ALTER TABLE public.positions 
ADD COLUMN option_id TEXT REFERENCES public.event_options(id);

-- Create index for faster lookups
CREATE INDEX idx_positions_option_id ON public.positions(option_id);

-- Update existing positions with their option_ids based on event_name and option_label matching
-- FIFA World Cup positions
UPDATE public.positions p
SET option_id = eo.id
FROM public.event_options eo
JOIN public.events e ON eo.event_id = e.id
WHERE p.option_id IS NULL
  AND LOWER(p.option_label) = LOWER(eo.label)
  AND (
    -- Exact match
    LOWER(p.event_name) = LOWER(e.name)
    -- Or partial match for truncated names
    OR LOWER(e.name) LIKE '%' || LOWER(SUBSTRING(p.event_name FROM 1 FOR 15)) || '%'
    OR LOWER(p.event_name) LIKE '%' || LOWER(SUBSTRING(e.name FROM 1 FOR 15)) || '%'
  );