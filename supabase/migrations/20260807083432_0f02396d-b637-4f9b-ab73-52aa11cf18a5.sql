REVOKE EXECUTE ON FUNCTION public.apply_campaign_progress(uuid, text, numeric, timestamptz) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.campaign_scope_matches(jsonb, text) FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.backfill_campaign_progress()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  p record; t jsonb;
  v_metric text; v_key text; v_target numeric; v_scope jsonb;
  v_val numeric; v_cur numeric; v_status text; v_new numeric; n int := 0;
BEGIN
  FOR p IN
    SELECT pa.user_id, pa.entry_id, pa.joined_at, e.rules
    FROM public.campaign_participations pa
    JOIN public.campaign_entries e ON e.id = pa.entry_id
  LOOP
    FOR t IN SELECT jsonb_array_elements(coalesce(p.rules->'tasks', '[]'::jsonb))
    LOOP
      v_metric := coalesce(t->>'metric','count');
      v_key := t->>'task_key';
      v_target := coalesce((t->>'target')::numeric, 1);
      v_scope := t->'scope';
      IF v_metric NOT IN ('usd_volume','count') THEN CONTINUE; END IF;
      IF v_metric = 'count' AND v_scope IS NULL THEN CONTINUE; END IF;

      IF v_metric = 'usd_volume' THEN
        SELECT coalesce(sum(tr.amount),0) INTO v_val FROM public.trades tr
         WHERE tr.user_id = p.user_id AND tr.status IN ('Filled','Closed')
           AND tr.created_at >= p.joined_at
           AND public.campaign_scope_matches(v_scope, tr.event_name);
      ELSE
        SELECT CASE WHEN count(*) > 0 THEN 1 ELSE 0 END INTO v_val FROM public.trades tr
         WHERE tr.user_id = p.user_id AND tr.status IN ('Filled','Closed')
           AND tr.created_at >= p.joined_at
           AND public.campaign_scope_matches(v_scope, tr.event_name);
      END IF;

      IF v_val <= 0 THEN CONTINUE; END IF;

      INSERT INTO public.campaign_grants (user_id, entry_id, task_key, progress, status)
      VALUES (p.user_id, p.entry_id, v_key, jsonb_build_object('value',0,'current',0), 'not_started')
      ON CONFLICT (user_id, entry_id, task_key) DO NOTHING;

      SELECT coalesce((g.progress->>'value')::numeric, (g.progress->>'current')::numeric, 0), g.status
        INTO v_cur, v_status
        FROM public.campaign_grants g
       WHERE g.user_id = p.user_id AND g.entry_id = p.entry_id AND g.task_key = v_key;

      IF v_status IN ('claimed','not_eligible') THEN CONTINUE; END IF;

      v_new := GREATEST(coalesce(v_cur,0), v_val);
      UPDATE public.campaign_grants
         SET progress = coalesce(progress,'{}'::jsonb) || jsonb_build_object('value', round(v_new,2), 'current', round(v_new,2), 'target', v_target),
             status = CASE WHEN v_status = 'claimable' OR v_new >= v_target THEN 'claimable' ELSE 'in_progress' END,
             updated_at = now()
       WHERE user_id = p.user_id AND entry_id = p.entry_id AND task_key = v_key;
      n := n + 1;
    END LOOP;
  END LOOP;
  RETURN n;
END;
$$;

DO $$ DECLARE r int; BEGIN
  SELECT public.backfill_campaign_progress() INTO r;
  RAISE NOTICE 'backfilled % grant rows', r;
END $$;

DROP FUNCTION public.backfill_campaign_progress();