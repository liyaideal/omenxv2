-- Create deposit_addresses table to store user-specific deposit addresses
CREATE TABLE public.deposit_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  token TEXT NOT NULL,
  network TEXT NOT NULL,
  address TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_deposit_addresses_user_token ON public.deposit_addresses(user_id, token);
CREATE INDEX idx_deposit_addresses_active ON public.deposit_addresses(user_id, token, is_active) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE public.deposit_addresses ENABLE ROW LEVEL SECURITY;

-- Users can only view their own deposit addresses
CREATE POLICY "Users can view their own deposit addresses"
ON public.deposit_addresses
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own deposit addresses (via edge function)
CREATE POLICY "Users can insert their own deposit addresses"
ON public.deposit_addresses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own deposit addresses
CREATE POLICY "Users can update their own deposit addresses"
ON public.deposit_addresses
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_deposit_addresses_updated_at
BEFORE UPDATE ON public.deposit_addresses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();