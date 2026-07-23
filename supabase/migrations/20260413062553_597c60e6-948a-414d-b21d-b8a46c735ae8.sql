CREATE TABLE public.asset_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  balance NUMERIC NOT NULL DEFAULT 0,
  positions_value NUMERIC NOT NULL DEFAULT 0,
  total_equity NUMERIC NOT NULL DEFAULT 0,
  leaf_hash TEXT NOT NULL,
  state_root TEXT NOT NULL,
  batch_id TEXT NOT NULL,
  proof_path JSONB NOT NULL DEFAULT '[]'::jsonb,
  verification_result TEXT NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.asset_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own verifications"
  ON public.asset_verifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own verifications"
  ON public.asset_verifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_asset_verifications_updated_at
  BEFORE UPDATE ON public.asset_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
