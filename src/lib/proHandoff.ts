// ============================================================
// SW-2 · Lite → Pro handoff helpers.
//
// `omenx_pro_visited` — set the first time this device renders the Pro
// surface. The Lite "Want to place a limit order? Pro ›" line only shows
// while it is unset: people who already know Pro exists are not nagged.
//
// `omenx_open_limit` — timestamp (sessionStorage) written by that line; any
// Pro order panel mounting within 15 s opens on `Limit`, so the user lands
// with it already selected instead of hunting for it.
// ============================================================

const VISITED_KEY = "omenx_pro_visited";
const OPEN_LIMIT_KEY = "omenx_open_limit";

export const markProVisited = (): void => {
  try { localStorage.setItem(VISITED_KEY, "1"); } catch { /* ignore */ }
};

export const hasVisitedPro = (): boolean => {
  try { return localStorage.getItem(VISITED_KEY) === "1"; } catch { return false; }
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
