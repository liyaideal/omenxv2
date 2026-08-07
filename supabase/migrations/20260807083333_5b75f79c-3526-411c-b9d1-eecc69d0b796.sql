-- 1) allow the progress driver to update referral state
CREATE OR REPLACE FUNCTION public.enforce_referral_user_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.role() = 'service_role'
     OR public.has_role(auth.uid(), 'admin')
     OR coalesce(current_setting('app.progress_driver', true), '') = 'on' THEN
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
$function$;

-- 2) scope matcher: does a traded market fall inside a task scope?
CREATE OR REPLACE FUNCTION public.campaign_scope_matches(_scope jsonb, _event_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_cat text;
  v_cats text[];
BEGIN
  IF _scope IS NULL OR _scope = '{}'::jsonb THEN RETURN true; END IF;
  IF coalesce((_scope->>'any_market')::boolean, false) THEN RETURN true; END IF;

  IF _scope ? 'categories' THEN
    SELECT array_agg(lower(x)) INTO v_cats
      FROM jsonb_array_elements_text(_scope->'categories') AS t(x);
    SELECT lower(e.category) INTO v_cat
      FROM public.events e
     WHERE e.name = _event_name
     ORDER BY e.created_at DESC
     LIMIT 1;
    IF v_cat IS NULL THEN RETURN false; END IF;
    RETURN v_cat = ANY (v_cats);
  END IF;

  RETURN true;
END;
$$;

-- 3) the driver itself
CREATE OR REPLACE FUNCTION public.apply_campaign_progress(
  _user_id uuid, _event_name text, _amount numeric, _at timestamptz
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  p record;
  t jsonb;
  v_metric text;
  v_key text;
  v_target numeric;
  v_scope jsonb;
  v_cur numeric;
  v_status text;
  v_new numeric;
  v_new_status text;
  n int := 0;
  v_volume numeric;
BEGIN
  IF _user_id IS NULL OR coalesce(_amount, 0) <= 0 THEN RETURN 0; END IF;

  FOR p IN
    SELECT pa.entry_id, pa.joined_at, e.rules
    FROM public.campaign_participations pa
    JOIN public.campaign_entries e ON e.id = pa.entry_id
    JOIN public.campaigns c ON c.id = pa.campaign_id
    WHERE pa.user_id = _user_id
      AND pa.joined_at <= _at
      AND c.status = 'live'
      AND c.starts_at <= _at
      AND (c.ends_at IS NULL OR c.ends_at >= _at)
  LOOP
    FOR t IN SELECT jsonb_array_elements(coalesce(p.rules->'tasks', '[]'::jsonb))
    LOOP
      v_metric := coalesce(t->>'metric', 'count');
      v_key := t->>'task_key';
      v_target := coalesce((t->>'target')::numeric, 1);
      v_scope := t->'scope';

      -- only trade-driven metrics are automated here
      IF v_metric NOT IN ('usd_volume', 'count') THEN CONTINUE; END IF;
      IF v_metric = 'count' AND v_scope IS NULL THEN CONTINUE; END IF;
      IF NOT public.campaign_scope_matches(v_scope, _event_name) THEN CONTINUE; END IF;

      INSERT INTO public.campaign_grants (user_id, entry_id, task_key, progress, status)
      VALUES (_user_id, p.entry_id, v_key, jsonb_build_object('value', 0, 'current', 0), 'not_started')
      ON CONFLICT (user_id, entry_id, task_key) DO NOTHING;

      SELECT coalesce((g.progress->>'value')::numeric, (g.progress->>'current')::numeric, 0), g.status
        INTO v_cur, v_status
        FROM public.campaign_grants g
       WHERE g.user_id = _user_id AND g.entry_id = p.entry_id AND g.task_key = v_key;

      IF v_status IN ('claimed', 'not_eligible') THEN CONTINUE; END IF;

      IF v_metric = 'usd_volume' THEN
        v_new := v_cur + _amount;
      ELSE
        v_new := GREATEST(v_cur, 1);
      END IF;

      v_new_status := CASE
        WHEN v_status = 'claimable' THEN 'claimable'
        WHEN v_new >= v_target THEN 'claimable'
        ELSE 'in_progress'
      END;

      UPDATE public.campaign_grants
         SET progress = coalesce(progress, '{}'::jsonb)
                        || jsonb_build_object('value', round(v_new, 2), 'current', round(v_new, 2), 'target', v_target),
             status = v_new_status,
             updated_at = now()
       WHERE user_id = _user_id AND entry_id = p.entry_id AND task_key = v_key;

      n := n + 1;
    END LOOP;
  END LOOP;

  -- referral qualification: same driver, $100 lifetime filled volume
  IF EXISTS (SELECT 1 FROM public.referrals r WHERE r.referee_id = _user_id AND r.status = 'pending') THEN
    SELECT coalesce(sum(tr.amount), 0) INTO v_volume
      FROM public.trades tr
     WHERE tr.user_id = _user_id AND tr.status IN ('Filled', 'Closed');

    PERFORM set_config('app.progress_driver', 'on', true);
    UPDATE public.referrals r
       SET metadata = coalesce(r.metadata, '{}'::jsonb) || jsonb_build_object('volume', round(v_volume, 2)),
           status = CASE WHEN v_volume >= 100 THEN 'qualified' ELSE r.status END,
           qualified_at = CASE WHEN v_volume >= 100 THEN coalesce(r.qualified_at, now()) ELSE r.qualified_at END,
           updated_at = now()
     WHERE r.referee_id = _user_id AND r.status = 'pending';
    PERFORM set_config('app.progress_driver', 'off', true);
  END IF;

  RETURN n;
END;
$$;

-- 4) trades trigger
CREATE OR REPLACE FUNCTION public.trades_campaign_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status <> 'Filled' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'Filled' THEN RETURN NEW; END IF;

  PERFORM public.apply_campaign_progress(
    NEW.user_id, NEW.event_name, coalesce(NEW.amount, 0), coalesce(NEW.created_at, now())
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_trades_campaign_progress_ins ON public.trades;
CREATE TRIGGER trg_trades_campaign_progress_ins
AFTER INSERT ON public.trades
FOR EACH ROW EXECUTE FUNCTION public.trades_campaign_progress();

DROP TRIGGER IF EXISTS trg_trades_campaign_progress_upd ON public.trades;
CREATE TRIGGER trg_trades_campaign_progress_upd
AFTER UPDATE OF status ON public.trades
FOR EACH ROW EXECUTE FUNCTION public.trades_campaign_progress();