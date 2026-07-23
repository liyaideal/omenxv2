CREATE TABLE public.trade_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  trade_id UUID NOT NULL,
  db_record JSONB NOT NULL DEFAULT '{}'::jsonb,
  onchain_log JSONB NOT NULL DEFAULT '{}'::jsonb,
  matched_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  counterparty TEXT NOT NULL DEFAULT 'Unknown',
  verification_result TEXT NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trade_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trade verifications"
  ON public.trade_verifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trade verifications"
  ON public.trade_verifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_trade_verifications_updated_at
  BEFORE UPDATE ON public.trade_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
