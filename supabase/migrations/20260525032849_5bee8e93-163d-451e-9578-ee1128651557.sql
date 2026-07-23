-- ============================================================
-- 1) points_accounts: lock balance fields from user UPDATE
-- ============================================================
CREATE OR REPLACE FUNCTION public.enforce_points_account_user_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Service role and admins bypass
  IF auth.role() = 'service_role' OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.balance IS DISTINCT FROM OLD.balance
     OR NEW.lifetime_earned IS DISTINCT FROM OLD.lifetime_earned
     OR NEW.lifetime_spent IS DISTINCT FROM OLD.lifetime_spent
     OR NEW.frozen IS DISTINCT FROM OLD.frozen
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Points balance fields can only be modified by the server';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_points_account_user_update ON public.points_accounts;
CREATE TRIGGER enforce_points_account_user_update
BEFORE UPDATE ON public.points_accounts
FOR EACH ROW
EXECUTE FUNCTION public.enforce_points_account_user_update();

-- ============================================================
-- 2) points_redemptions: remove client INSERT (edge fn uses service role)
-- ============================================================
DROP POLICY IF EXISTS "Users can create redemptions" ON public.points_redemptions;

-- ============================================================
-- 3) user_tasks: lock claimed status and reward fields
-- ============================================================
CREATE OR REPLACE FUNCTION public.enforce_user_task_user_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Users can self-report progress but cannot set claimed state or rewards
    IF NEW.status = 'claimed'
       OR NEW.points_awarded IS NOT NULL
       OR NEW.claimed_at IS NOT NULL THEN
      RAISE EXCEPTION 'Task claim and rewards can only be set by the server';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Users may update progress / completed_at, but not claim or set their reward
    IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status = 'claimed' THEN
      RAISE EXCEPTION 'Tasks can only be claimed via the server';
    END IF;
    IF NEW.points_awarded IS DISTINCT FROM OLD.points_awarded
       OR NEW.claimed_at IS DISTINCT FROM OLD.claimed_at
       OR NEW.task_id IS DISTINCT FROM OLD.task_id
       OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
      RAISE EXCEPTION 'Reward fields can only be modified by the server';
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_user_task_user_write ON public.user_tasks;
CREATE TRIGGER enforce_user_task_user_write
BEFORE INSERT OR UPDATE ON public.user_tasks
FOR EACH ROW
EXECUTE FUNCTION public.enforce_user_task_user_write();

-- ============================================================
-- 4) referrals: lock status/reward fields from user UPDATE
-- ============================================================
CREATE OR REPLACE FUNCTION public.enforce_referral_user_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.points_awarded IS DISTINCT FROM OLD.points_awarded
     OR NEW.rewarded_at IS DISTINCT FROM OLD.rewarded_at
     OR NEW.qualified_at IS DISTINCT FROM OLD.qualified_at
     OR NEW.referrer_id IS DISTINCT FROM OLD.referrer_id
     OR NEW.referee_id IS DISTINCT FROM OLD.referee_id
     OR NEW.referral_code IS DISTINCT FROM OLD.referral_code
     OR NEW.level IS DISTINCT FROM OLD.level THEN
    RAISE EXCEPTION 'Referral state can only be modified by the server';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_referral_user_update ON public.referrals;
CREATE TRIGGER enforce_referral_user_update
BEFORE UPDATE ON public.referrals
FOR EACH ROW
EXECUTE FUNCTION public.enforce_referral_user_update();