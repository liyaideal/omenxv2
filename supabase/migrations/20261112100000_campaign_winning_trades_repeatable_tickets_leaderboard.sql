-- 2026-11-12 · Campaign task parts (executed on the Lovable DB via query_database the same day)
--
-- Four independent parts, combinable with everything that already exists:
--   1. metric  `winning_trades`  — positions that ended in profit (settled or cashed out), own stake >= min_stake,
--                                  Quick Play wins included unless the task is limited to categories,
--                                  each market once unless once_per_market = false
--   2. type    `repeatable`      — one reward every time the metric grows by `target`; grant keys <task_key>#r<n>;
--                                  optional `max_times`
--   3. reward  `ticket`          — third reward unit: a count inside the campaign, nothing credited to a balance
--   4. entry   `rules.leaderboard` — get_campaign_leaderboard(): ranks the campaign's participants by one task
-- Plus `rules.eligibility` (new_users_only / allow_user_ids) via campaign_entry_eligible().
--
-- campaign_metric_value / campaign_settle_grant / apply_campaign_progress are full replacements of the
-- 20260925100000 versions with the additions marked NEW.

CREATE OR REPLACE FUNCTION public.campaign_metric_value(_user_id uuid, _metric text, _task jsonb, _from timestamp with time zone, _to timestamp with time zone)
 RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v numeric := 0;
  v_scope jsonb := _task->'scope';
  v_min numeric := coalesce((_task->>'min_notional')::numeric, (_task->'hold'->>'min_notional')::numeric, 0);
  v_hours numeric := coalesce((_task->'hold'->>'min_hours')::numeric, 24);
  v_stake numeric := coalesce((_task->>'min_stake')::numeric, 0);                                   -- NEW
  v_once boolean := coalesce((_task->>'once_per_market')::boolean, true);                           -- NEW
  v_products jsonb := coalesce(_task->'scope'->'products', '["markets","quick_play"]'::jsonb);      -- NEW
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
  ELSIF _metric = 'winning_trades' THEN                                                             -- NEW
    -- A win = a position that ended in profit after the winning commission, whether it settled or was
    -- cashed out early, opened inside the window with at least min_stake of the user's own money
    -- (margin, not the boosted size). Quick Play calls count when scope.products includes quick_play
    -- and the task is not limited to categories. once_per_market (default) counts each market once:
    -- a market = the event behind the position's option (so every 5-minute round is its own market);
    -- a Quick Play market = the 30-second window the call was opened in.
    WITH w AS (
      SELECT coalesce(eo.event_id::text, p.event_name) AS mk
        FROM public.positions p
        LEFT JOIN public.event_options eo ON eo.id::text = p.option_id::text
       WHERE v_products ? 'markets'
         AND p.user_id=_user_id AND p.status='Closed'
         AND p.created_at >= _from AND p.created_at < _to
         AND coalesce(p.pnl,0) - coalesce(p.winning_commission,0) > 0
         AND coalesce(p.margin,0) >= v_stake
         AND public.campaign_scope_matches(v_scope, p.event_name)
      UNION ALL
      SELECT 'quick_play:' || floor(extract(epoch FROM a.t0) / 30)::bigint::text
        FROM public.arcade_calls a
       WHERE v_products ? 'quick_play'
         AND NOT (coalesce(v_scope,'{}'::jsonb) ? 'categories')
         AND a.user_id=_user_id AND a.status='won'
         AND a.t0 >= _from AND a.t0 < _to
         AND a.gross >= v_stake
    )
    SELECT CASE WHEN v_once THEN count(DISTINCT mk) ELSE count(*) END INTO v FROM w;
  END IF;
  RETURN coalesce(v,0);
END $function$;

CREATE OR REPLACE FUNCTION public.campaign_settle_grant(_user_id uuid, _entry_id uuid, _key text, _value numeric, _target numeric, _reward jsonb, _label text)
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_status text; v_cur numeric; v_new numeric;
  v_usdc numeric := coalesce((_reward->>'usdc')::numeric, 0);
  v_voucher numeric := coalesce((_reward->>'voucher')::numeric, 0);
  v_ticket numeric := coalesce((_reward->>'ticket')::numeric, 0);                                   -- NEW
BEGIN
  INSERT INTO public.campaign_grants (user_id, entry_id, task_key, progress, status)
  VALUES (_user_id, _entry_id, _key, jsonb_build_object('value',0,'current',0,'target',_target), 'not_started')
  ON CONFLICT (user_id, entry_id, task_key) DO NOTHING;

  SELECT g.status, coalesce((g.progress->>'value')::numeric,(g.progress->>'current')::numeric,0)
    INTO v_status, v_cur FROM public.campaign_grants g
   WHERE g.user_id=_user_id AND g.entry_id=_entry_id AND g.task_key=_key;

  v_new := GREATEST(coalesce(v_cur,0), coalesce(_value,0));

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

  -- NEW · tickets are a count inside the campaign: nothing is credited to a balance, the grant itself is the ticket.
  IF v_new >= _target AND v_ticket > 0 AND v_voucher = 0 THEN
    UPDATE public.campaign_grants SET
      progress = coalesce(progress,'{}'::jsonb) || jsonb_build_object('value',round(v_new,2),'current',round(v_new,2),'target',_target,'credited_ticket',v_ticket,'credited_at',now()),
      status='claimed', updated_at=now()
     WHERE user_id=_user_id AND entry_id=_entry_id AND task_key=_key AND status <> 'claimed';
    RETURN 'claimed';
  END IF;

  v_status := CASE WHEN v_status='claimable' OR (v_new >= _target AND v_voucher > 0) THEN 'claimable'
                   WHEN v_new > 0 THEN 'in_progress' ELSE 'not_started' END;
  UPDATE public.campaign_grants SET
    progress = coalesce(progress,'{}'::jsonb) || jsonb_build_object('value',round(v_new,2),'current',round(v_new,2),'target',_target),
    status=v_status, updated_at=now()
   WHERE user_id=_user_id AND entry_id=_entry_id AND task_key=_key;
  RETURN v_status;
END $function$;

-- NEW · entries can be limited to people who signed up through the entry's link: the account must have been
-- created no earlier than 24h before it was bound to the entry by link. allow_user_ids take part regardless
-- (the KOL's own account, demo accounts).
CREATE OR REPLACE FUNCTION public.campaign_entry_eligible(_user_id uuid, _rules jsonb, _joined_at timestamptz, _source text)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN NOT coalesce((_rules->'eligibility'->>'new_users_only')::boolean, false) THEN true
    WHEN coalesce(_rules->'eligibility'->'allow_user_ids','[]'::jsonb) ? _user_id::text THEN true
    ELSE coalesce(_source,'') = 'link' AND EXISTS (
      SELECT 1 FROM public.profiles pr WHERE pr.user_id = _user_id AND pr.created_at >= _joined_at - interval '24 hours')
  END;
$function$;

CREATE OR REPLACE FUNCTION public.apply_campaign_progress(_user_id uuid, _event_name text, _amount numeric, _at timestamp with time zone, _metrics text[])
 RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  p record; t jsonb; tier jsonb;
  v_type text; v_metric text; v_key text; v_name text; v_target numeric; v_scope jsonb; v_val numeric;
  v_n int; n int := 0; v_volume numeric; v_units int; v_have int; i int;
BEGIN
  IF _user_id IS NULL THEN RETURN 0; END IF;

  FOR p IN
    SELECT pa.entry_id, pa.joined_at, pa.source, e.rules, c.starts_at
    FROM public.campaign_participations pa
    JOIN public.campaign_entries e ON e.id = pa.entry_id
    JOIN public.campaigns c ON c.id = pa.campaign_id
    WHERE pa.user_id = _user_id AND pa.joined_at <= _at
      AND c.status = 'live' AND c.starts_at <= _at AND (c.ends_at IS NULL OR c.ends_at >= _at)
  LOOP
    IF NOT public.campaign_entry_eligible(_user_id, p.rules, p.joined_at, p.source) THEN CONTINUE; END IF;  -- NEW
    FOR t IN SELECT jsonb_array_elements(coalesce(p.rules->'tasks','[]'::jsonb)) LOOP
      v_type := coalesce(t->>'type','threshold');
      v_metric := coalesce(t->>'metric','count');
      v_key := t->>'task_key'; v_name := coalesce(t->>'name', v_key);
      v_target := coalesce((t->>'target')::numeric, 1);
      v_scope := t->'scope';

      IF v_metric NOT IN ('usd_volume','count','active_days','hold_positions','referrals_qualified','winning_trades') THEN CONTINUE; END IF;
      IF _metrics IS NOT NULL AND NOT (v_metric = ANY(_metrics)) THEN CONTINUE; END IF;
      IF v_metric = 'count' AND v_scope IS NULL THEN CONTINUE; END IF;
      IF v_metric IN ('usd_volume','count','active_days','hold_positions','winning_trades') AND _event_name IS NOT NULL
         AND NOT public.campaign_scope_matches(v_scope, _event_name) THEN CONTINUE; END IF;

      IF v_type = 'recurring' THEN
        PERFORM public.campaign_recurring_apply(_user_id, p.entry_id, t, _at, p.joined_at);
        n := n + 1; CONTINUE;
      END IF;

      -- NEW · repeatable: one reward every time the metric grows by `target`; grant keys <task_key>#r<n>.
      -- Counts from the later of joining and the campaign start; `max_times` caps the number of rewards.
      IF v_type = 'repeatable' THEN
        IF v_target <= 0 THEN CONTINUE; END IF;
        v_val := public.campaign_metric_value(_user_id, v_metric, t, GREATEST(p.joined_at, p.starts_at), 'infinity'::timestamptz);
        v_units := floor(v_val / GREATEST(v_target, 0.000001))::int;
        IF (t->>'max_times') IS NOT NULL THEN v_units := LEAST(v_units, (t->>'max_times')::int); END IF;
        SELECT count(*) INTO v_have FROM public.campaign_grants g
         WHERE g.user_id=_user_id AND g.entry_id=p.entry_id
           AND starts_with(g.task_key, v_key||'#r') AND g.status IN ('claimed','claimable');
        FOR i IN v_have+1 .. v_units LOOP
          PERFORM public.campaign_settle_grant(_user_id, p.entry_id, v_key||'#r'||i, v_val, v_target*i, t->'reward', v_name);
        END LOOP;
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

      PERFORM public.campaign_settle_grant(_user_id, p.entry_id, v_key, v_val, v_target, t->'reward', v_name);
      n := n + 1;
    END LOOP;
  END LOOP;

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
END $function$;

-- NEW · drivers: a position closing, or a Quick Play call being won, re-counts winning_trades tasks.
-- Wrapped so a campaign error can never block settlement.
CREATE OR REPLACE FUNCTION public.positions_campaign_wins() RETURNS trigger
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  BEGIN
    PERFORM public.apply_campaign_progress(NEW.user_id, NEW.event_name, 0, now(), ARRAY['winning_trades']);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'positions_campaign_wins: %', SQLERRM;
  END;
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS trg_positions_campaign_wins ON public.positions;
CREATE TRIGGER trg_positions_campaign_wins AFTER UPDATE OF status ON public.positions
  FOR EACH ROW WHEN (NEW.status = 'Closed' AND OLD.status IS DISTINCT FROM 'Closed')
  EXECUTE FUNCTION public.positions_campaign_wins();

CREATE OR REPLACE FUNCTION public.arcade_calls_campaign_wins() RETURNS trigger
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  BEGIN
    PERFORM public.apply_campaign_progress(NEW.user_id, NULL, 0, now(), ARRAY['winning_trades']);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'arcade_calls_campaign_wins: %', SQLERRM;
  END;
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS trg_arcade_calls_campaign_wins ON public.arcade_calls;
CREATE TRIGGER trg_arcade_calls_campaign_wins AFTER UPDATE OF status ON public.arcade_calls
  FOR EACH ROW WHEN (NEW.user_id IS NOT NULL AND NEW.status = 'won' AND OLD.status IS DISTINCT FROM 'won')
  EXECUTE FUNCTION public.arcade_calls_campaign_wins();

-- NEW · entry leaderboard: ranks the campaign's participants by one task (rules.leaderboard.task_key).
-- Every entry of the same campaign that ranks by the same task shares one board (e.g. an English and a
-- Spanish entry). Ties: whoever reached the score first. Returns the top `_limit` rows plus the caller's
-- own row when it falls outside them.
CREATE OR REPLACE FUNCTION public.get_campaign_leaderboard(_entry_id uuid, _limit integer DEFAULT 10)
 RETURNS TABLE(rank integer, username text, value numeric, is_me boolean)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_rules jsonb; v_campaign uuid; v_key text; v_task jsonb; v_type text; v_mult numeric := 1; v_uid uuid := auth.uid();
BEGIN
  SELECT e.rules, e.campaign_id INTO v_rules, v_campaign FROM public.campaign_entries e WHERE e.id = _entry_id;
  v_key := v_rules->'leaderboard'->>'task_key';
  IF v_key IS NULL THEN RETURN; END IF;
  SELECT x INTO v_task FROM jsonb_array_elements(coalesce(v_rules->'tasks','[]'::jsonb)) x WHERE x->>'task_key' = v_key LIMIT 1;
  IF v_task IS NULL THEN RETURN; END IF;
  v_type := coalesce(v_task->>'type','threshold');
  IF v_type = 'repeatable' THEN v_mult := coalesce(nullif((v_task->'reward'->>'ticket')::numeric,0), 1); END IF;

  RETURN QUERY
  WITH ent AS (
    SELECT e.id FROM public.campaign_entries e
     WHERE e.campaign_id = v_campaign AND e.rules->'leaderboard'->>'task_key' = v_key
  ), s AS (
    SELECT g.user_id,
           CASE WHEN v_type = 'repeatable'
                THEN count(*) FILTER (WHERE starts_with(g.task_key, v_key||'#r') AND g.status = 'claimed') * v_mult
                ELSE max(coalesce((g.progress->>'value')::numeric, 0)) END AS val,
           CASE WHEN v_type = 'repeatable'
                THEN max(g.created_at) FILTER (WHERE starts_with(g.task_key, v_key||'#r') AND g.status = 'claimed')
                ELSE max(g.updated_at) END AS reached_at
      FROM public.campaign_grants g
     WHERE g.entry_id IN (SELECT id FROM ent)
       AND (g.task_key = v_key OR starts_with(g.task_key, v_key||'#') OR starts_with(g.task_key, v_key||'@'))
     GROUP BY g.user_id
  ), r AS (
    SELECT s.user_id, s.val, (row_number() OVER (ORDER BY s.val DESC, s.reached_at ASC NULLS LAST, s.user_id))::int AS rk
      FROM s WHERE s.val > 0
  )
  SELECT r.rk, coalesce(pr.username, 'Trader'), r.val, (r.user_id = v_uid)
    FROM r LEFT JOIN public.profiles pr ON pr.user_id = r.user_id
   WHERE r.rk <= GREATEST(1, LEAST(coalesce(_limit,10), 100)) OR r.user_id = v_uid
   ORDER BY r.rk;
END $function$;

REVOKE ALL ON FUNCTION public.get_campaign_leaderboard(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_campaign_leaderboard(uuid, integer) TO anon, authenticated;

-- NEW · the first repeat reward locks the participation to its entry (same lock a voucher claim sets),
-- so switching between two links of one campaign cannot earn the same wins twice.
CREATE OR REPLACE FUNCTION public.campaign_lock_entry_on_repeat_reward() RETURNS trigger
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.campaign_participations SET locked_at = now(), updated_at = now()
   WHERE user_id = NEW.user_id AND entry_id = NEW.entry_id AND locked_at IS NULL;
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS trg_campaign_grants_lock_entry ON public.campaign_grants;
CREATE TRIGGER trg_campaign_grants_lock_entry AFTER INSERT OR UPDATE OF status ON public.campaign_grants
  FOR EACH ROW WHEN (NEW.status = 'claimed' AND NEW.task_key LIKE '%#r%')
  EXECUTE FUNCTION public.campaign_lock_entry_on_repeat_reward();
