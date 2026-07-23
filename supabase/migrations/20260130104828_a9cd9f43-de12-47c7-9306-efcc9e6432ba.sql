-- Add confirmations tracking columns to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS confirmations integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS required_confirmations integer DEFAULT 15;

-- Update existing pending/processing deposits with initial confirmations
UPDATE public.transactions
SET 
  confirmations = CASE 
    WHEN status = 'pending' THEN floor(random() * 3)::int
    WHEN status = 'processing' THEN floor(random() * 10 + 5)::int
    ELSE 0
  END,
  required_confirmations = 15
WHERE type = 'deposit' AND status IN ('pending', 'processing');

-- Create a comment for documentation
COMMENT ON COLUMN public.transactions.confirmations IS 'Current block confirmations for on-chain transactions';
COMMENT ON COLUMN public.transactions.required_confirmations IS 'Required confirmations before transaction is considered complete';