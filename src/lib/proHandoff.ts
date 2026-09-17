// ============================================================
// SW-2 · Lite → Pro handoff helpers.
//
// `omenx_pro_visited:<userId>` — set the first time THIS ACCOUNT renders the
// Pro surface on this device. The Lite "Want to place a limit order? Pro ›"
// line only shows while it is unset: people who already know Pro exists are
// not nagged. Keyed per account (Liya, 2026-09-17): a fresh sign-up on a
// browser that has seen Pro must still get the doorway.
//
// `omenx_open_limit` — timestamp (sessionStorage) written by that line; any
// Pro order panel mounting within 15 s opens on `Limit`, so the user lands
// with it already selected instead of hunting for it.
// ============================================================

const VISITED_KEY = "omenx_pro_visited";
const OPEN_LIMIT_KEY = "omenx_open_limit";

const visitedKey = (userId: string) => `${VISITED_KEY}:${userId}`;

export const markProVisited = (userId: string | null | undefined): void => {
  if (!userId) return;
  try { localStorage.setItem(visitedKey(userId), "1"); } catch { /* ignore */ }
};

export const hasVisitedPro = (userId: string | null | undefined): boolean => {
  if (!userId) return false;
  try { return localStorage.getItem(visitedKey(userId)) === "1"; } catch { return false; }
};

export const requestOpenLimit = (): void => {
  try { sessionStorage.setItem(OPEN_LIMIT_KEY, String(Date.now())); } catch { /* ignore */ }
};

/**
 * True while a Lite → Pro limit handoff is fresh (15 s window). Not cleared on
 * read: on mobile the charts view can mount before the order sub-page does,
 * and both may legitimately ask — a time window beats a one-shot flag here.
 */
export const consumeOpenLimit = (): boolean => {
  try {
    const ts = Number(sessionStorage.getItem(OPEN_LIMIT_KEY) ?? 0);
    return ts > 0 && Date.now() - ts < 15_000;
  } catch {
    return false;
  }
};
