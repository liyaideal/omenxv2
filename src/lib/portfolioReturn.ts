// ============================================================
// Returning to /portfolio "where you left off".
// Live cards / settled rows stash the scroll offset before they navigate
// into a market; LitePortfolio restores it (plus the Boost/Standard
// segment) when the reader comes back via the header back button.
// ============================================================
const SCROLL_KEY = "lite-portfolio-scroll";
const SEGMENT_KEY = "lite-portfolio-segment";

export const savePortfolioScroll = () => {
  try {
    sessionStorage.setItem(SCROLL_KEY, String(Math.round(window.scrollY)));
  } catch {
    /* storage unavailable — restoration is best-effort */
  }
};

export const takePortfolioScroll = (): number | null => {
  try {
    const raw = sessionStorage.getItem(SCROLL_KEY);
    if (raw == null) return null;
    sessionStorage.removeItem(SCROLL_KEY);
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
};

export const savePortfolioSegment = (segment: string) => {
  try {
    sessionStorage.setItem(SEGMENT_KEY, segment);
  } catch {
    /* noop */
  }
};

export const readPortfolioSegment = (): string | null => {
  try {
    return sessionStorage.getItem(SEGMENT_KEY);
  } catch {
    return null;
  }
};

// The pending-Pro-orders row flips the reader into the Pro terminal. Remember
// that they came from Lite so the browser back button lands on the Lite
// portfolio again instead of the Pro one.
const RETURN_SURFACE_KEY = "lite-portfolio-return-surface";

export const savePortfolioReturnSurface = (surface: string) => {
  try {
    sessionStorage.setItem(RETURN_SURFACE_KEY, surface);
  } catch {
    /* noop */
  }
};

export const takePortfolioReturnSurface = (): string | null => {
  try {
    const v = sessionStorage.getItem(RETURN_SURFACE_KEY);
    if (v != null) sessionStorage.removeItem(RETURN_SURFACE_KEY);
    return v;
  } catch {
    return null;
  }
};

export const clearPortfolioReturnSurface = () => {
  try {
    sessionStorage.removeItem(RETURN_SURFACE_KEY);
  } catch {
    /* noop */
  }
};

/** Router state carried into a trade page so its back button can come home. */
export const fromState = (from: string) => ({ state: { from } });
