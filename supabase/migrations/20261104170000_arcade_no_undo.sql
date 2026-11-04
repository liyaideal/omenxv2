-- ============================================================
-- Quick Play · no undo (CPO 2026-11-04).
-- A simulation on ~67 h of the real index showed that "watch the first second, cancel if it goes
-- the wrong way" turns the player's edge positive: a 2-second cancel refunds the 3% entry fee and
-- costs only 0.15%, while the first second already leans towards the 30-second result.
-- The cabinet no longer shows an UNDO key; this closes the server side too, so the RPC can't be
-- called around the UI:
--   • cancel_window_ms → 0 (arcade_cancel raises 'Locked' for every call)
--   • EXECUTE on arcade_cancel revoked from every client role
-- arcade_cancel stays in the database for the record; past 'cancelled' calls are untouched.
-- Run AFTER the front end without the UNDO key is published, otherwise the old UI's UNDO errors.
-- ============================================================
UPDATE public.arcade_params SET num = 0, note = 'undo removed 2026-11-04 · arcade_cancel is closed' WHERE key = 'cancel_window_ms';
REVOKE EXECUTE ON FUNCTION public.arcade_cancel(uuid) FROM PUBLIC, anon, authenticated;
