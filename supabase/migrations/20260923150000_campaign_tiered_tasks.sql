-- Tiered campaign tasks (type = "tiered") — 2026-09-23
--
-- rules.tasks[] entries may now carry `"type":"tiered"` + `"tiers":[{target,reward},…]`.
-- Every tier is its own grant row keyed `<task_key>#t<n>` (n from 1) so the
-- campaign_grants schema is untouched. All tiers share one progress value.
--   * USDC tiers are credited the moment they are reached: the grant row flips
--     straight to `claimed` (row-level latch), Standard balance
--     (`profiles.spot_balance`) is credited and a `bonus` transaction is written —
--     same pattern as pay_instant_voucher_settlement().
--   * Voucher tiers become `claimable` and are claimed through
--     claim-campaign-grant (which resolves `<task_key>#t<n>` → tiers[n-1].reward).
-- Threshold tasks (no `type`) keep the exact previous behaviour.
--
-- Executed on Lovable Cloud via query_database on 2026-09-23; this file is the record.

CREATE OR REPLACE FUNCTION public.apply_campaign_progress(_user_id uuid, _event_name text, _amount numeric, _at timestamp with time zone)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  p record;
  t jsonb;
  tier jsonb;
  v_type text;
  v_metric text;
  v_key text;
  v_name text;
  v_target numeric;
  v_scope jsonb;
  v_cur numeric;
  v_status text;
  v_new numeric;
  v_new_status text;
  v_tier_key text;
  v_tier_n int;
  v_tier_usdc numeric;
  v_tier_status text;
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
      v_type := coalesce(t->>'type', 'threshold');
      v_metric := coalesce(t->>'metric', 'count');
      v_key := t->>'task_key';
      v_name := coalesce(t->>'name', v_key);
      v_target := coalesce((t->>'target')::numeric, 1);
      v_scope := t->'scope';

      -- only trade-driven metrics are automated here
      IF v_metric NOT IN ('usd_volume', 'count') THEN CONTINUE; END IF;
      IF v_metric = 'count' AND v_scope IS NULL THEN CONTINUE; END IF;
      IF NOT public.campaign_scope_matches(v_scope, _event_name) THEN CONTINUE; END IF;

      IF v_type = 'tiered' AND jsonb_typeof(t->'tiers') = 'array' AND jsonb_array_length(t->'tiers') > 0 THEN
        -- ---- tiered: one shared value, one grant row per tier ----
        SELECT coalesce(max(coalesce((g.progress->>'value')::numeric, (g.progress->>'current')::numeric, 0)), 0)
          INTO v_cur
          FROM public.campaign_grants g
         WHERE g.user_id = _user_id AND g.entry_id = p.entry_id AND g.task_key LIKE v_key || '#t%';

        IF v_metric = 'usd_volume' THEN
          v_new := v_cur + _amount;
        ELSE
          v_new := GREATEST(v_cur, 1);
        END IF;

        v_tier_n := 0;
        FOR tier IN SELECT jsonb_array_elements(t->'tiers')
        LOOP
          v_tier_n := v_tier_n + 1;
          v_tier_key := v_key || '#t' || v_tier_n;
          v_target := coalesce((tier->>'target')::numeric, 1);
          v_tier_usdc := coalesce((tier->'reward'->>'usdc')::numeric, 0);

          INSERT INTO public.campaign_grants (user_id, entry_id, task_key, progress, status)
          VALUES (_user_id, p.entry_id, v_tier_key, jsonb_build_object('value', 0, 'current', 0), 'not_started')
          ON CONFLICT (user_id, entry_id, task_key) DO NOTHING;

          SELECT g.status INTO v_tier_status
            FROM public.campaign_grants g
           WHERE g.user_id = _user_id AND g.entry_id = p.entry_id AND g.task_key = v_tier_key;

          IF v_tier_status IN ('claimed', 'not_eligible') THEN
            -- keep the shared value current on settled rows too (front-end reads max())
            UPDATE public.campaign_grants
               SET progress = coalesce(progress, '{}'::jsonb)
                              || jsonb_build_object('value', round(v_new, 2), 'current', round(v_new, 2), 'target', v_target),
                   updated_at = now()
             WHERE user_id = _user_id AND entry_id = p.entry_id AND task_key = v_tier_key;
            CONTINUE;
          END IF;

          IF v_new >= v_target AND v_tier_usdc > 0 THEN
            -- USDC tier: reach = credit. Row-level latch: only the writer that
            -- flips the status pays; a retry / replay finds status = claimed.
            UPDATE public.campaign_grants
               SET progress = coalesce(progress, '{}'::jsonb)
                              || jsonb_build_object('value', round(v_new, 2), 'current', round(v_new, 2), 'target', v_target,
                                                    'credited_usdc', v_tier_usdc, 'credited_at', now()),
                   status = 'claimed',
                   updated_at = now()
             WHERE user_id = _user_id AND entry_id = p.entry_id AND task_key = v_tier_key
               AND status <> 'claimed';
            IF FOUND THEN
              UPDATE public.profiles
                 SET spot_balance = coalesce(spot_balance, 0) + v_tier_usdc,
                     updated_at = now()
               WHERE user_id = _user_id;
              INSERT INTO public.transactions (user_id, type, amount, account, description, status)
              VALUES (_user_id, 'bonus', v_tier_usdc, 'spot',
                      'Campaign reward · ' || v_name || ' · Tier ' || v_tier_n, 'completed');
            END IF;
          ELSE
            v_new_status := CASE
              WHEN v_tier_status = 'claimable' THEN 'claimable'
              WHEN v_new >= v_target THEN 'claimable'   -- voucher tier: user claims
              ELSE 'in_progress'
            END;
            UPDATE public.campaign_grants
               SET progress = coalesce(progress, '{}'::jsonb)
                              || jsonb_build_object('value', round(v_new, 2), 'current', round(v_new, 2), 'target', v_target),
                   status = v_new_status,
                   updated_at = now()
             WHERE user_id = _user_id AND entry_id = p.entry_id AND task_key = v_tier_key;
          END IF;
          n := n + 1;
        END LOOP;
        CONTINUE;
      END IF;

      -- ---- threshold (legacy) — unchanged ----
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
$function$;

REVOKE EXECUTE ON FUNCTION public.apply_campaign_progress(uuid, text, numeric, timestamptz) FROM anon, authenticated;
