import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * Site-wide scroll reset for SPA route changes.
 *
 * - Forward navigations (PUSH / REPLACE) with no `#hash` jump to the top —
 *   a footer link clicked at the bottom of one page must open the next page at its head.
 * - Back / forward (POP) is left alone so the browser's own restoration — and page-level
 *   restores such as Portfolio's "return to where you were" — keep working.
 * - Hash navigations are left alone so in-page anchors (`#earnings` …) still scroll to the target.
 */
export const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    if (navType === "POP" || hash) return;
    window.scrollTo(0, 0);
  }, [pathname, hash, navType]);

  return null;
};
