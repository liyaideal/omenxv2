-- Add txHash column to transactions table for on-chain deposits/withdrawals
ALTER TABLE public.transactions 
ADD COLUMN tx_hash TEXT,
ADD COLUMN network TEXT,
ADD COLUMN status TEXT NOT NULL DEFAULT 'completed';

-- Create index for tx_hash lookups
CREATE INDEX idx_transactions_tx_hash ON public.transactions(tx_hash) WHERE tx_hash IS NOT NULL;
CREATE INDEX idx_transactions_status ON public.transactions(user_id, status);