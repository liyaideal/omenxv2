-- Campaign task types · round 2 (2026-09-25)
-- Adds: type "recurring" (daily / weekly + streak bonus), metrics referrals_qualified /
-- active_days / hold_positions, referral "counted toward campaign" (no double reward),
-- hourly hold sweep. Driver is split in two layers: metric value (recomputed from source,
-- idempotent) → task type (threshold / tiered / recurring) → grant settlement (one place
-- credits USDC, with the same row-level latch as round 1).
-- Executed on Lovable Cloud via query_database; this file is the record.

-- ---------------------------------------------------------------------------
-- 1 · metric value (absolute, recomputed from source tables)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.campaign_metric_value(
  _user_id uuid, _metric text, _task jsonb, _from timestamptz, _to timestamptz
) RETURNS numeric
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v numeric := 0;
  v_scope jsonb := _task->'scope';
  v_min numeric := coalesce((_task->>'min_notional')::numeric, (_task->'hold'->>'min_notional')::numeric, 0);
  v_hours numeric := coalesce((_task->'hold'->>'min_hours')::numeric, 24);
BEGIN
  IF _metric = 'usd_volume' THEN
    SELECT coalesce(sum(tr.amount),0) INTO v FROM public.trades tr
     WHERE tr.user_id=_user_id AND tr.status IN ('Filled','Closed')
       AND tr.created_at >= _from AND tr.created_at < _to
       AND public.campaign_scope_matches(v_scope, tr.event_name);
  ELSIF _metric = 'count' THEN
    SELECT CASE WHEN EXISTS (SELECT 1 FROM public.trades tr
     WHERE tr.user_id=_user_id AND tr.status IN ('Filled','Closed')
       AND tr.created_at >= _from AND tr.created_at < _to
       AND public.campaign_scope_matches(v_scope, tr.event_name)) THEN 1 ELSE 0 END INTO v;
  ELSIF _metric = 'active_days' THEN
    SELECT count(DISTINCT (tr.created_at AT TIME ZONE 'UTC')::date) INTO v FROM public.trades tr
     WHERE tr.user_id=_user_id AND tr.status IN ('Filled','Closed')
       AND tr.created_at >= _from AND tr.created_at < _to
       AND tr.amount >= coalesce(nullif(v_min,0), 10)
       AND public.campaign_scope_matches(v_scope, tr.event_name);
  ELSIF _metric = 'hold_positions' THEN
    -- a position counts once it has been held min_hours: still open (Filled) or closed
    -- (Closed, incl. auto-closed) with closed_at − created_at ≥ min_hours
    SELECT count(*) INTO v FROM public.trades tr
     WHERE tr.user_id=_user_id
       AND tr.created_at >= _from AND tr.created_at < _to
       AND tr.amount >= v_min
       AND public.campaign_scope_matches(v_scope, tr.event_name)
       AND ( (tr.status='Filled' AND now() - tr.created_at >= make_interval(hours => v_hours::int))
          OR (tr.status='Closed' AND tr.closed_at IS NOT NULL AND tr.closed_at - tr.created_at >= make_interval(hours => v_hours::int)) );
  ELSIF _metric = 'referrals_qualified' THEN
    SELECT count(*) INTO v FROM public.referrals r
     WHERE r.referrer_id=_user_id AND r.status IN ('qualified','rewarded')
       AND r.qualified_at >= _from AND r.qualified_at < _to;
  END IF;
  RETURN coalesce(v,0);
END $$;
REVOKE EXECUTE ON FUNCTION public.campaign_metric_value(uuid,text,jsonb,timestamptz,timestamptz) FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2 · grant settlement — the ONLY place that credits USDC
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.campaign_settle_grant(
  _user_id uuid, _entry_id uuid, _key text, _value numeric, _target numeric, _reward jsonb, _label text
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_status text; v_cur numeric; v_new numeric;
  v_usdc numeric := coalesce((_reward->>'usdc')::numeric, 0);
  v_voucher numeric := coalesce((_reward->>'voucher')::numeric, 0);
BEGIN
  INSERT INTO public.campaign_grants (user_id, entry_id, task_key, progress, status)
  VALUES (_user_id, _entry_id, _key, jsonb_build_object('value',0,'current',0,'target',_target), 'not_started')
  ON CONFLICT (user_id, entry_id, task_key) DO NOTHING;

  SELECT g.status, coalesce((g.progress->>'value')::numeric,(g.progress->>'current')::numeric,0)
    INTO v_status, v_cur FROM public.campaign_grants g
   WHERE g.user_id=_user_id AND g.entry_id=_entry_id AND g.task_key=_key;

  v_new := GREATEST(coalesce(v_cur,0), coalesce(_value,0));   -- never regress (demo seeds, replays)

  IF v_status IN ('claimed','not_eligible') THEN
    UPDATE public.campaign_grants SET
      progress = coalesce(progress,'{}'::jsonb) || jsonb_build_object('value',round(v_new,2),'current',round(v_new,2),'target',_target),
      updated_at = now()
     WHERE user_id=_user_id AND entry_id=_entry_id AND task_key=_key;
    RETURN v_status;
  END IF;

  IF v_new >= _target AND v_usdc > 0 THEN
    UPDATE public.campaign_grants SET
      progress = coalesce(progress,'{}'::jsonb) || jsonb_build_object('value',round(v_new,2),'current',round(v_new,2),'target',_target,'credited_usdc',v_usdc,'credited_at',now()),
      status='claimed', updated_at=now()
     WHERE user_id=_user_id AND entry_id=_entry_id AND task_key=_key AND status <> 'claimed';
    IF FOUND THEN
      UPDATE public.profiles SET spot_balance = coalesce(spot_balance,0) + v_usdc, updated_at=now() WHERE user_id=_user_id;
      INSERT INTO public.transactions (user_id,type,amount,account,description,status)
      VALUES (_user_id,'bonus',v_usdc,'spot','Campaign reward · '||_label,'completed');
    END IF;
    RETURN 'claimed';
  END IF;

  v_status := CASE WHEN v_status='claimable' OR (v_new >= _target AND v_voucher > 0) THEN 'claimable'
                   WHEN v_new > 0 THEN 'in_progress' ELSE 'not_started' END;
  UPDATE public.campaign_grants SET
    progress = coalesce(progress,'{}'::jsonb) || jsonb_build_object('value',round(v_new,2),'current',round(v_new,2),'target',_target),
    status=v_status, updated_at=now()
   WHERE user_id=_user_id AND entry_id=_entry_id AND task_key=_key;
  RETURN v_status;
END $$;
REVOKE EXECUTE ON FUNCTION public.campaign_settle_grant(uuid,uuid,text,numeric,numeric,jsonb,text) FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3 · period helpers (UTC; weekly = ISO week starting Monday)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.campaign_period_key(_period text, _at timestamptz) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN _period='weekly' THEN to_char((_at AT TIME ZONE 'UTC'), 'IYYY-"W"IW')
              ELSE to_char((_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') END
$$;
CREATE OR REPLACE FUNCTION public.campaign_period_start(_period text, _at timestamptz) RETURNS timestamptz
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN _period='weekly' THEN date_trunc('week', _at AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
              ELSE date_trunc('day', _at AT TIME ZONE 'UTC') AT TIME ZONE 'UTC' END
$$;
CREATE OR REPLACE FUNCTION public.campaign_period_prev(_period text, _start timestamptz) RETURNS timestamptz
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN _period='weekly' THEN _start - interval '7 days' ELSE _start - interval '1 day' END
$$;

-- ---------------------------------------------------------------------------
-- 4 · recurring task — current period + streak bonus
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.campaign_recurring_apply(
  _user_id uuid, _entry_id uuid, _task jsonb, _at timestamptz, _joined_at timestamptz
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_key text := _task->>'task_key';
  v_name text := coalesce(_task->>'name', _task->>'task_key');
  v_period text := coalesce(_task->>'period','daily');
  v_metric text := coalesce(_task->>'metric','usd_volume');
  v_target numeric := coalesce((_task->>'target')::numeric, 1);
  v_max int := (_task->>'max_periods')::int;
  v_every int := (_task->'streak_bonus'->>'every')::int;
  v_bonus jsonb := _task->'streak_bonus'->'reward';
  v_start timestamptz := public.campaign_period_start(v_period, _at);
  v_end timestamptz;
  v_pkey text := public.campaign_period_key(v_period, _at);
  v_done int; v_val numeric; v_status text; v_streak int := 0; v_cursor timestamptz; v_ck text; v_st text;
BEGIN
  v_end := CASE WHEN v_period='weekly' THEN v_start + interval '7 days' ELSE v_start + interval '1 day' END;
  IF v_start < public.campaign_period_start(v_period, _joined_at) THEN RETURN; END IF;

  -- max_periods reached → no new period rows
  SELECT count(*) INTO v_done FROM public.campaign_grants g
   WHERE g.user_id=_user_id AND g.entry_id=_entry_id AND g.task_key LIKE v_key||'@%' AND g.status='claimed';
  IF v_max IS NOT NULL AND v_done >= v_max AND NOT EXISTS (
       SELECT 1 FROM public.campaign_grants g WHERE g.user_id=_user_id AND g.entry_id=_entry_id AND g.task_key=v_key||'@'||v_pkey)
  THEN RETURN; END IF;

  v_val := public.campaign_metric_value(_user_id, v_metric, _task, GREATEST(v_start,_joined_at), v_end);
  v_status := public.campaign_settle_grant(_user_id, _entry_id, v_key||'@'||v_pkey, v_val, v_target, _task->'reward',
                                           v_name||' · '||v_pkey);

  -- streak = consecutive done periods ending at the current one
  IF v_status='claimed' AND v_every IS NOT NULL AND v_every > 0 AND v_bonus IS NOT NULL THEN
    v_cursor := v_start;
    LOOP
      v_ck := v_key||'@'||public.campaign_period_key(v_period, v_cursor);
      SELECT g.status INTO v_st FROM public.campaign_grants g
       WHERE g.user_id=_user_id AND g.entry_id=_entry_id AND g.task_key=v_ck;
      EXIT WHEN v_st IS DISTINCT FROM 'claimed';
      v_streak := v_streak + 1;
      v_cursor := public.campaign_period_prev(v_period, v_cursor);
      EXIT WHEN v_streak > 400;
    END LOOP;
    IF v_streak > 0 AND v_streak % v_every = 0 THEN
      PERFORM public.campaign_settle_grant(_user_id, _entry_id, v_key||'#s'||(v_streak / v_every), 1, 1, v_bonus,
                                           v_name||' · '||v_streak||'-'||CASE WHEN v_period='weekly' THEN 'week' ELSE 'day' END||' streak');
    END IF;
  END IF;
END $$;
REVOKE EXECUTE ON FUNCTION public.campaign_recurring_apply(uuid,uuid,jsonb,timestamptz,timestamptz) FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5 · main driver (5-arg; 4-arg wrapper keeps the trades trigger unchanged)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_campaign_progress(
  _user_id uuid, _event_name text, _amount numeric, _at timestamptz, _metrics text[]
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  p record; t jsonb; tier jsonb;
  v_type text; v_metric text; v_key text; v_name text; v_target numeric; v_scope jsonb; v_val numeric;
  v_n int; n int := 0; v_volume numeric;
BEGIN
  IF _user_id IS NULL THEN RETURN 0; END IF;

  FOR p IN
    SELECT pa.entry_id, pa.joined_at, e.rules
    FROM public.campaign_participations pa
    JOIN public.campaign_entries e ON e.id = pa.entry_id
    JOIN public.campaigns c ON c.id = pa.campaign_id
    WHERE pa.user_id = _user_id AND pa.joined_at <= _at
      AND c.status = 'live' AND c.starts_at <= _at AND (c.ends_at IS NULL OR c.ends_at >= _at)
  LOOP
    FOR t IN SELECT jsonb_array_elements(coalesce(p.rules->'tasks','[]'::jsonb)) LOOP
      v_type := coalesce(t->>'type','threshold');
      v_metric := coalesce(t->>'metric','count');
      v_key := t->>'task_key'; v_name := coalesce(t->>'name', v_key);
      v_target := coalesce((t->>'target')::numeric, 1);
      v_scope := t->'scope';

      IF v_metric NOT IN ('usd_volume','count','active_days','hold_positions','referrals_qualified') THEN CONTINUE; END IF;
      IF _metrics IS NOT NULL AND NOT (v_metric = ANY(_metrics)) THEN CONTINUE; END IF;
      IF v_metric = 'count' AND v_scope IS NULL THEN CONTINUE; END IF;            -- non-trade count tasks stay manual
      -- trade-driven metrics only react to trades inside their scope
      IF v_metric IN ('usd_volume','count','active_days','hold_positions') AND _event_name IS NOT NULL
         AND NOT public.campaign_scope_matches(v_scope, _event_name) THEN CONTINUE; END IF;

      IF v_type = 'recurring' THEN
        PERFORM public.campaign_recurring_apply(_user_id, p.entry_id, t, _at, p.joined_at);
        n := n + 1; CONTINUE;
      END IF;

      v_val := public.campaign_metric_value(_user_id, v_metric, t, p.joined_at, 'infinity'::timestamptz);

      IF v_type = 'tiered' AND jsonb_typeof(t->'tiers')='array' AND jsonb_array_length(t->'tiers') > 0 THEN
        v_n := 0;
        FOR tier IN SELECT jsonb_array_elements(t->'tiers') LOOP
          v_n := v_n + 1;
          PERFORM public.campaign_settle_grant(_user_id, p.entry_id, v_key||'#t'||v_n, v_val,
                    coalesce((tier->>'target')::numeric,1), tier->'reward', v_name||' · Tier '||v_n);
        END LOOP;
        n := n + 1; CONTINUE;
      END IF;

      -- threshold
      PERFORM public.campaign_settle_grant(_user_id, p.entry_id, v_key, v_val, v_target, t->'reward', v_name);
      n := n + 1;
    END LOOP;
  END LOOP;

  -- referral qualification: $100 lifetime filled volume (unchanged; fires the referrals hook below)
  IF _event_name IS NOT NULL AND EXISTS (SELECT 1 FROM public.referrals r WHERE r.referee_id=_user_id AND r.status='pending') THEN
    SELECT coalesce(sum(tr.amount),0) INTO v_volume FROM public.trades tr
     WHERE tr.user_id=_user_id AND tr.status IN ('Filled','Closed');
    PERFORM set_config('app.progress_driver','on',true);
    UPDATE public.referrals r
       SET metadata = coalesce(r.metadata,'{}'::jsonb) || jsonb_build_object('volume', round(v_volume,2)),
           status = CASE WHEN v_volume >= 100 THEN 'qualified' ELSE r.status END,
           qualified_at = CASE WHEN v_volume >= 100 THEN coalesce(r.qualified_at, now()) ELSE r.qualified_at END,
           updated_at = now()
     WHERE r.referee_id=_user_id AND r.status='pending';
    PERFORM set_config('app.progress_driver','off',true);
  END IF;
  RETURN n;
END $$;
REVOKE EXECUTE ON FUNCTION public.apply_campaign_progress(uuid,text,numeric,timestamptz,text[]) FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.apply_campaign_progress(_user_id uuid, _event_name text, _amount numeric, _at timestamptz)
RETURNS integer LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT public.apply_campaign_progress(_user_id, _event_name, _amount, _at, NULL::text[]);
$$;
REVOKE EXECUTE ON FUNCTION public.apply_campaign_progress(uuid,text,numeric,timestamptz) FROM anon, authenticated;

-- trades trigger also fires on close (hold_positions) — replace the function body
CREATE OR REPLACE FUNCTION public.trades_campaign_progress() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'Filled' THEN
    PERFORM public.apply_campaign_progress(NEW.user_id, NEW.event_name, coalesce(NEW.amount,0), coalesce(NEW.created_at, now()));
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'Filled' AND OLD.status <> 'Filled' THEN
    PERFORM public.apply_campaign_progress(NEW.user_id, NEW.event_name, coalesce(NEW.amount,0), coalesce(NEW.created_at, now()));
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'Closed' AND OLD.status <> 'Closed' THEN
    PERFORM public.apply_campaign_progress(NEW.user_id, NEW.event_name, 0, now(), ARRAY['hold_positions']);
  END IF;
  RETURN NEW;
END $$;

-- ---------------------------------------------------------------------------
-- 6 · referrals hook: qualified → referrer's invite tasks; "counted toward" = no double reward
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.referrals_campaign_hook() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_c record;
BEGIN
  IF NEW.status <> 'qualified' OR OLD.status = 'qualified' THEN RETURN NEW; END IF;

  -- does the referrer currently sit in a live campaign with an invite task?
  SELECT c.id, c.name INTO v_c
    FROM public.campaign_participations pa
    JOIN public.campaign_entries e ON e.id = pa.entry_id
    JOIN public.campaigns c ON c.id = pa.campaign_id
   WHERE pa.user_id = NEW.referrer_id AND c.status='live'
     AND c.starts_at <= now() AND (c.ends_at IS NULL OR c.ends_at >= now())
     AND EXISTS (SELECT 1 FROM jsonb_array_elements(coalesce(e.rules->'tasks','[]'::jsonb)) t
                  WHERE t->>'metric' = 'referrals_qualified')
   ORDER BY pa.joined_at DESC LIMIT 1;

  IF v_c.id IS NOT NULL THEN
    -- one reward path only: this friend feeds the campaign task, the $5 per-friend voucher is skipped
    PERFORM set_config('app.progress_driver','on',true);
    UPDATE public.referrals SET status='rewarded', rewarded_at=now(),
           metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object('counted_toward', jsonb_build_object('campaign_id', v_c.id, 'campaign_name', v_c.name)),
           updated_at=now()
     WHERE id = NEW.id;
    PERFORM set_config('app.progress_driver','off',true);
    PERFORM public.apply_campaign_progress(NEW.referrer_id, NULL, 1, now(), ARRAY['referrals_qualified']);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_referrals_campaign_hook ON public.referrals;
CREATE TRIGGER trg_referrals_campaign_hook AFTER UPDATE OF status ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.referrals_campaign_hook();

-- ---------------------------------------------------------------------------
-- 7 · hourly hold sweep (open positions crossing min_hours without a close event)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.campaign_hold_sweep() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE u record; n int := 0;
BEGIN
  FOR u IN
    SELECT DISTINCT pa.user_id
      FROM public.campaign_participations pa
      JOIN public.campaign_entries e ON e.id = pa.entry_id
      JOIN public.campaigns c ON c.id = pa.campaign_id
     WHERE c.status='live' AND c.starts_at <= now() AND (c.ends_at IS NULL OR c.ends_at >= now())
       AND EXISTS (SELECT 1 FROM jsonb_array_elements(coalesce(e.rules->'tasks','[]'::jsonb)) t WHERE t->>'metric'='hold_positions')
  LOOP
    PERFORM public.apply_campaign_progress(u.user_id, NULL, 0, now(), ARRAY['hold_positions']);
    n := n + 1;
  END LOOP;
  RETURN n;
END $$;
REVOKE EXECUTE ON FUNCTION public.campaign_hold_sweep() FROM anon, authenticated;
SELECT cron.schedule('campaign-hold-sweep', '15 * * * *', $$SELECT public.campaign_hold_sweep()$$);
