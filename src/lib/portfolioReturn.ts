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

/** Router state carried into a trade page so its back button can come home. */
export const fromState = (from: string) => ({ state: { from } });
