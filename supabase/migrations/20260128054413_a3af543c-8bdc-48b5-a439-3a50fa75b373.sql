-- Add price_label column to events table for dynamic asset labels
ALTER TABLE public.events 
ADD COLUMN price_label text;

-- Add comment for documentation
COMMENT ON COLUMN public.events.price_label IS 'Dynamic label for price-based events (e.g., BTC/USD, ETH/USD, S&P 500)';

-- Update existing events with appropriate price labels
UPDATE public.events SET price_label = 'S&P 500' WHERE id LIKE '%sp500%' OR name ILIKE '%s&p%';
UPDATE public.events SET price_label = 'BTC/USD' WHERE id LIKE '%btc%' OR id LIKE '%bitcoin%' OR name ILIKE '%bitcoin%';
UPDATE public.events SET price_label = 'ETH/USD' WHERE id LIKE '%eth%' OR id LIKE '%ethereum%' OR name ILIKE '%ethereum%';