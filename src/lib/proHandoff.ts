// ============================================================
// SW-2 · Lite → Pro handoff helpers.
//
// `omenx_pro_visited` — set the first time this device renders the Pro
// surface. The Lite "Want to place a limit order? Pro ›" line only shows
// while it is unset: people who already know Pro exists are not nagged.
//
// `omenx_open_limit` — one-shot (sessionStorage) flag written by that line and
// consumed by whichever Pro order panel mounts next, so the user lands with
// `Limit` already selected instead of hunting for it.
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
  try { sessionStorage.setItem(OPEN_LIMIT_KEY, "1"); } catch { /* ignore */ }
};

/** Read-and-clear. True exactly once after `requestOpenLimit()`. */
export const consumeOpenLimit = (): boolean => {
  try {
    const v = sessionStorage.getItem(OPEN_LIMIT_KEY) === "1";
    if (v) sessionStorage.removeItem(OPEN_LIMIT_KEY);
    return v;
  } catch {
    return false;
  }
};
