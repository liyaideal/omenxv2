
CREATE TABLE public.recovery_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  tx_hash TEXT NOT NULL,
  wrong_network TEXT NOT NULL,
  wrong_token TEXT NOT NULL,
  claimed_amount NUMERIC NOT NULL CHECK (claimed_amount > 0),
  sender_address TEXT NOT NULL,
  user_note TEXT,
  
  status TEXT NOT NULL DEFAULT 'submitted',
  fee_percent NUMERIC NOT NULL DEFAULT 10,
  estimated_return NUMERIC,
  admin_note TEXT,
  processed_tx_hash TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  quoted_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_recovery_requests_user_id ON public.recovery_requests(user_id);
CREATE INDEX idx_recovery_requests_status ON public.recovery_requests(status);

ALTER TABLE public.recovery_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recovery requests"
  ON public.recovery_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own recovery requests"
  ON public.recovery_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can accept/decline only when quoted; trigger enforces immutable fields
CREATE POLICY "Users can update their own recovery requests"
  ON public.recovery_requests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all recovery requests"
  ON public.recovery_requests FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Restrict user updates to status transitions quoted -> accepted/rejected only
CREATE OR REPLACE FUNCTION public.enforce_recovery_request_user_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins bypass
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- Lock immutable fields
  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.tx_hash IS DISTINCT FROM OLD.tx_hash
     OR NEW.wrong_network IS DISTINCT FROM OLD.wrong_network
     OR NEW.wrong_token IS DISTINCT FROM OLD.wrong_token
     OR NEW.claimed_amount IS DISTINCT FROM OLD.claimed_amount
     OR NEW.sender_address IS DISTINCT FROM OLD.sender_address
     OR NEW.fee_percent IS DISTINCT FROM OLD.fee_percent
     OR NEW.estimated_return IS DISTINCT FROM OLD.estimated_return
     OR NEW.admin_note IS DISTINCT FROM OLD.admin_note
     OR NEW.processed_tx_hash IS DISTINCT FROM OLD.processed_tx_hash THEN
    RAISE EXCEPTION 'Only admins can modify these fields';
  END IF;

  -- Allow only quoted -> accepted/rejected
  IF OLD.status = 'quoted' AND NEW.status IN ('accepted', 'rejected') THEN
    IF NEW.status = 'accepted' THEN
      NEW.accepted_at = now();
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Invalid status transition for non-admin user';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_recovery_request_user_update_trigger
  BEFORE UPDATE ON public.recovery_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_recovery_request_user_update();

CREATE TRIGGER update_recovery_requests_updated_at
  BEFORE UPDATE ON public.recovery_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
