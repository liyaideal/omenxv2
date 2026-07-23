-- 1. Migrate existing data to new 3-status model
update recovery_requests
  set status='submitted'
  where status in ('reviewing','quoted','accepted','processing');

update recovery_requests
  set status='rejected'
  where status='unrecoverable';

-- 2. Add CHECK constraint to enforce 3-status model going forward
alter table recovery_requests
  drop constraint if exists recovery_status_chk;
alter table recovery_requests
  add constraint recovery_status_chk
  check (status in ('submitted','completed','rejected'));

-- 3. Update enforce trigger function: users can no longer change status at all
create or replace function public.enforce_recovery_request_user_update()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
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

  -- Users cannot change status under the simplified flow
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Only admins can change recovery status';
  END IF;

  RETURN NEW;
END;
$function$;