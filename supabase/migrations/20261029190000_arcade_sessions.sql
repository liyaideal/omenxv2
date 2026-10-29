-- ============================================================
-- Quick Play sessions for /portfolio (CPO 2026-10-29).
-- A session is one sitting: it ends after 30 minutes without a call. Pure
-- grouping over arcade_calls — nothing stored. The 30 minutes mirrors
-- ARCADE_SESSION_GAP_MIN in src/lib/arcade/session.ts; change both together.
-- Keys: epoch ms of the session's first call, spelled the same in the URL.
-- ============================================================

-- One row per session of the signed-in user, newest first. Only sessions
-- with at least one call past 'open' show up (an all-open session is still
-- "live" and lives in the cabinet, not in Settled).
CREATE OR REPLACE FUNCTION public.arcade_my_sessions(p_limit int DEFAULT 100)
RETURNS TABLE (
  session_key     text,
  started_at      timestamptz,
  ended_at        timestamptz,
  last_settled_at timestamptz,
  calls           int,          -- went to settlement (won + lost)
  won             int,
  lost            int,
  refunded        int,          -- void: no valid price, chip returned
  cancelled       int,          -- taken back inside the cancel window
  best_run        int,          -- longest run of wins, in call order
  staked          numeric,      -- chips on won + lost calls
  payout          numeric,      -- cash that came back from won + lost calls
  fees            numeric,      -- trading fees on won + lost, plus cancel fees
  commission      numeric,      -- winning commission
  pnl             numeric,      -- net over every settled call, cancel fees included
  biggest_win     numeric,
  min_stake       numeric,
  max_stake       numeric,
  active          boolean       -- last call < 30 min ago or a call still open
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  WITH mine AS (
    SELECT * FROM public.arcade_calls WHERE user_id = auth.uid()
  ), marked AS (
    SELECT m.*,
           CASE WHEN lag(m.created_at) OVER w IS NULL
                  OR m.created_at - lag(m.created_at) OVER w > interval '30 minutes'
                THEN 1 ELSE 0 END AS brk
    FROM mine m WINDOW w AS (ORDER BY m.created_at, m.id)
  ), g AS (
    SELECT *, sum(brk) OVER (ORDER BY created_at, id ROWS UNBOUNDED PRECEDING) AS sid FROM marked
  ), streaks AS (
    SELECT sid, max(len) AS best_run FROM (
      SELECT sid, grp, count(*) AS len FROM (
        SELECT sid, status,
               row_number() OVER (PARTITION BY sid ORDER BY created_at, id)
             - row_number() OVER (PARTITION BY sid, status ORDER BY created_at, id) AS grp
        FROM g WHERE status IN ('won', 'lost')
      ) r WHERE status = 'won' GROUP BY sid, grp
    ) l GROUP BY sid
  )
  SELECT
    (extract(epoch FROM min(g.created_at)) * 1000)::bigint::text,
    min(g.created_at),
    max(g.created_at),
    max(g.settled_at),
    count(*) FILTER (WHERE g.status IN ('won', 'lost'))::int,
    count(*) FILTER (WHERE g.status = 'won')::int,
    count(*) FILTER (WHERE g.status = 'lost')::int,
    count(*) FILTER (WHERE g.status = 'void')::int,
    count(*) FILTER (WHERE g.status = 'cancelled')::int,
    coalesce(max(s.best_run), 0)::int,
    coalesce(sum(g.gross) FILTER (WHERE g.status IN ('won', 'lost')), 0),
    coalesce(sum(g.gross + coalesce(g.pnl, 0)) FILTER (WHERE g.status IN ('won', 'lost')), 0),
    coalesce(sum(g.fee) FILTER (WHERE g.status IN ('won', 'lost')), 0)
      + coalesce(sum(g.cancel_fee) FILTER (WHERE g.status = 'cancelled'), 0),
    coalesce(sum(g.commission) FILTER (WHERE g.status = 'won'), 0),
    coalesce(sum(g.pnl) FILTER (WHERE g.status <> 'open'), 0),
    coalesce(max(g.pnl) FILTER (WHERE g.status = 'won'), 0),
    min(g.gross) FILTER (WHERE g.status IN ('won', 'lost')),
    max(g.gross) FILTER (WHERE g.status IN ('won', 'lost')),
    (max(g.created_at) > now() - interval '30 minutes' OR bool_or(g.status = 'open'))
  FROM g LEFT JOIN streaks s ON s.sid = g.sid
  GROUP BY g.sid
  HAVING count(*) FILTER (WHERE g.status <> 'open') > 0
  ORDER BY max(g.created_at) DESC
  LIMIT p_limit
$$;
GRANT EXECUTE ON FUNCTION public.arcade_my_sessions(int) TO authenticated;

-- The calls of one session (every status past 'open'), newest first, paged.
CREATE OR REPLACE FUNCTION public.arcade_my_session_calls(p_key text, p_limit int DEFAULT 30, p_offset int DEFAULT 0)
RETURNS SETOF public.arcade_calls
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  WITH mine AS (
    SELECT * FROM public.arcade_calls WHERE user_id = auth.uid()
  ), marked AS (
    SELECT m.id, m.created_at,
           CASE WHEN lag(m.created_at) OVER w IS NULL
                  OR m.created_at - lag(m.created_at) OVER w > interval '30 minutes'
                THEN 1 ELSE 0 END AS brk
    FROM mine m WINDOW w AS (ORDER BY m.created_at, m.id)
  ), g AS (
    SELECT id, created_at, sum(brk) OVER (ORDER BY created_at, id ROWS UNBOUNDED PRECEDING) AS sid FROM marked
  ), target AS (
    SELECT sid FROM g WHERE (extract(epoch FROM created_at) * 1000)::bigint = p_key::bigint LIMIT 1
  )
  SELECT c.* FROM public.arcade_calls c
  JOIN g ON g.id = c.id
  WHERE g.sid = (SELECT sid FROM target) AND c.status <> 'open'
  ORDER BY c.created_at DESC, c.id DESC
  LIMIT p_limit OFFSET p_offset
$$;
GRANT EXECUTE ON FUNCTION public.arcade_my_session_calls(text, int, int) TO authenticated;
