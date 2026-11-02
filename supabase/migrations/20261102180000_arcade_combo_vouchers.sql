-- ============================================================
-- Quick Play · James feedback round (CPO 2026-11-02)
--  1. chips are $2 / $5 / $10 / $25 / $50 ($100 retired, $2 added)
--  2. every 3 wins in a row (×3, ×6, ×9 …) drops a $2 tiered Position Voucher,
--     at most $10 a UTC day per account. Server-authoritative: the streak is
--     rebuilt from the user's own settled calls (t1 order; void / cancelled
--     calls don't count; a 30-minute gap starts a new session = a new streak).
--     Idempotent: one voucher per completing call (unique source_arcade_call_id).
--  3. arcade_table_now() reports combo_today (USD of combo vouchers issued today)
-- ============================================================

-- params (read by the cabinet through arcade_table_now().params)
INSERT INTO public.arcade_params (key, num, note) VALUES
  ('combo_voucher_every', 3, 'a combo voucher drops at every N-th win in a row'),
  ('combo_voucher_face', 2, 'USD face value of a combo voucher'),
  ('combo_voucher_cap_day', 10, 'max USD of combo vouchers per account per UTC day')
ON CONFLICT (key) DO UPDATE SET num = EXCLUDED.num, note = EXCLUDED.note;

-- the call that completed the streak
ALTER TABLE public.position_vouchers
  ADD COLUMN IF NOT EXISTS source_arcade_call_id uuid UNIQUE REFERENCES public.arcade_calls(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.arcade_combo_vouchers(p_user uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  r record;
  v_day_start timestamptz := date_trunc('day', now() AT TIME ZONE 'utc') AT TIME ZONE 'utc';
  v_every int := coalesce(public.arcade_param('combo_voucher_every'), 3)::int;
  v_face numeric := coalesce(public.arcade_param('combo_voucher_face'), 2);
  v_cap numeric := coalesce(public.arcade_param('combo_voucher_cap_day'), 10);
  v_today numeric;
  v_run int := 0;
  v_prev timestamptz := NULL;
BEGIN
  IF p_user IS NULL THEN RETURN 0; END IF;
  -- one walk per user at a time: concurrent settlements wait and then see each other's rows
  PERFORM pg_advisory_xact_lock(hashtext('arcade_combo:' || p_user::text));

  SELECT coalesce(sum(face_value), 0) INTO v_today
    FROM public.position_vouchers
   WHERE user_id = p_user AND source_arcade_call_id IS NOT NULL AND issued_at >= v_day_start;

  FOR r IN
    SELECT id, status, t1, settled_at
      FROM public.arcade_calls
     WHERE user_id = p_user AND status IN ('won', 'lost') AND t1 >= v_day_start - interval '1 day'
     ORDER BY t1, id
  LOOP
    IF v_prev IS NOT NULL AND r.t1 - v_prev > interval '30 minutes' THEN v_run := 0; END IF;
    v_prev := r.t1;
    IF r.status = 'lost' THEN v_run := 0; CONTINUE; END IF;
    v_run := v_run + 1;
    IF v_run % v_every = 0 AND r.settled_at >= v_day_start AND v_today + v_face <= v_cap
       AND NOT EXISTS (SELECT 1 FROM public.position_vouchers WHERE source_arcade_call_id = r.id) THEN
      INSERT INTO public.position_vouchers (user_id, code, face_value, status, payout_mode, issued_at, expires_at, source_arcade_call_id)
      VALUES (p_user, public.gen_voucher_code(), v_face, 'granted', 'tiered', now(), now() + interval '30 days', r.id)
      ON CONFLICT (source_arcade_call_id) DO NOTHING;
      IF FOUND THEN v_today := v_today + v_face; END IF;
    END IF;
  END LOOP;
  RETURN v_today;
END; $function$;

REVOKE ALL ON FUNCTION public.arcade_combo_vouchers(uuid) FROM PUBLIC, anon, authenticated;

-- patch the live functions in place (text replace keeps every other line byte-identical)
DO $patch$
DECLARE d text; n text;
BEGIN
  -- 1 · chip set
  d := pg_get_functiondef('public.arcade_place(text,numeric,timestamptz)'::regprocedure);
  n := replace(d, $q$IF p_gross NOT IN (5, 10, 25, 50, 100) THEN RAISE EXCEPTION 'Chips are $5, $10, $25, $50 or $100'; END IF;$q$,
                  $q$IF p_gross NOT IN (2, 5, 10, 25, 50) THEN RAISE EXCEPTION 'Chips are $2, $5, $10, $25 or $50'; END IF;$q$);
  IF n = d THEN RAISE EXCEPTION 'arcade_place: chip line not found'; END IF;
  EXECUTE n;

  -- 2 · the simulated table uses the same chips
  d := pg_get_functiondef('public.arcade_sim_tick'::regproc);
  n := replace(d, 'ARRAY[5,5,5,10,10,25,50,100]', 'ARRAY[2,5,5,5,10,10,25,50]');
  IF n = d THEN RAISE EXCEPTION 'arcade_sim_tick: chip array not found'; END IF;
  EXECUTE n;

  -- 3 · settlement hands every user with a win to the combo walk
  d := pg_get_functiondef('public.arcade_settle_due(uuid)'::regprocedure);
  IF position('arcade_combo_vouchers' in d) = 0 THEN
    n := replace(d, E'  later boolean;\n', E'  later boolean;\n  v_users uuid[] := ''{}'';\n');
    n := replace(n, E'    done := done || jsonb_build_object(', E'    IF v_status = ''won'' THEN v_users := array_append(v_users, c.user_id); END IF;\n    done := done || jsonb_build_object(');
    n := replace(n, E'  END LOOP;\n  RETURN done;', E'  END LOOP;\n  PERFORM public.arcade_combo_vouchers(u) FROM (SELECT DISTINCT unnest(v_users) AS u) x;\n  RETURN done;');
    IF (length(n) - length(d)) < 150 THEN RAISE EXCEPTION 'arcade_settle_due: patch points not found'; END IF;
    EXECUTE n;
  END IF;
END $patch$;

-- 4 · the cabinet reads today's combo vouchers on its 1 Hz poll
CREATE OR REPLACE FUNCTION public.arcade_table_now()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  perform public.arcade_synth_tick();
  return jsonb_build_object(
    'tick', (select to_jsonb(t) - 'src_raw' from public.arcade_index_ticks t order by ts desc limit 1),
    'state', (select to_jsonb(s) from public.arcade_table_state s where id = 1),
    'params', (select jsonb_object_agg(key, num) from public.arcade_params),
    'now', clock_timestamp(),
    'my_open', (select coalesce(sum(gross), 0) from public.arcade_calls where user_id = auth.uid() and status = 'open'),
    'ack', (select accepted_at from public.arcade_acks where user_id = auth.uid()),
    'combo_today', (select coalesce(sum(face_value), 0) from public.position_vouchers
                     where user_id = auth.uid() and source_arcade_call_id is not null
                       and issued_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc')
  );
end;
$function$;

-- 5 · the 2-second undo fee is shown to 4 decimals ("undo costs $0.0075", CPO 2026-11-02),
--     so it is charged to 4 decimals too — a $2 chip costs $0.003 to take back, not $0.00
ALTER TABLE public.arcade_calls ALTER COLUMN cancel_fee TYPE numeric(12,4), ALTER COLUMN pnl TYPE numeric(12,4);
DO $patch$
DECLARE d text; n text;
BEGIN
  d := pg_get_functiondef('public.arcade_cancel'::regproc);
  n := replace(d, $q$v_fee := public.arcade_round_half_up(c.gross * public.arcade_param('cancel_fee_rate')::numeric, 2);$q$,
                  $q$v_fee := public.arcade_round_half_up(c.gross * public.arcade_param('cancel_fee_rate')::numeric, 4);$q$);
  IF n <> d THEN EXECUTE n; END IF;
END $patch$;

-- 6 · Lovable demo pace (CPO 2026-11-02 "结算跟 mock 一样"): the demo feed ticks every second and settlement
--     no longer waits for late data; the client shows the mock's 0.5–1.2 s "…" before the result.
--     Main-net spec keeps settle_wait_ms = 2000 and a 500 ms feed.
UPDATE public.arcade_params SET num = 0 WHERE key = 'settle_wait_ms';
SELECT cron.alter_job(job_id := (SELECT jobid FROM cron.job WHERE jobname = 'arcade_sim_feed'), schedule := '1 seconds');
