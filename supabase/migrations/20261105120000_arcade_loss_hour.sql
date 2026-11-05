-- Quick Play · the 60-minute rolling loss limit gets its own pause reason (CPO 2026-11-05 批).
-- arcade_table_state.paused_reason = 'loss_hour' (set by the risk engine, like 'loss' for the day's limit);
-- the cabinet says "back within the hour" instead of "back tomorrow". Only the RAISE text in arcade_place changes.
DO $patch$
DECLARE d text; n text;
BEGIN
  d := pg_get_functiondef('public.arcade_place(text,numeric,timestamptz,uuid)'::regprocedure);
  IF position('loss_hour' in d) = 0 THEN
    n := replace(d,
      $q$WHEN 'loss' THEN 'Table paused · daily limit reached'$q$,
      $q$WHEN 'loss' THEN 'Table paused · daily limit reached'
                                              WHEN 'loss_hour' THEN 'Table paused · back within the hour'$q$);
    IF n = d THEN RAISE EXCEPTION 'arcade_place: loss line not found'; END IF;
    EXECUTE n;
  END IF;
END $patch$;
