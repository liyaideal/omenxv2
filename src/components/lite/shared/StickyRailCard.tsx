// ============================================================
// Desktop trade-page rail: the order card floats with the page (CPO 2026-11-05).
//
// Wraps whatever sits at the top of the right rail (order card, outcome card,
// quick-round pick card + order card) so it stays in view while the left
// column scrolls — on a long multi-market board the user can pick a market
// far down the list and still see the card that buys it.
//
// Rules (same on every Lite trade page, Boost and Standard, one market or many):
//   1. Sticks 16px under the sticky site header.
//   2. When the card is taller than the space under the header, it pins by its
//      BOTTOM instead (16px above the window edge), so the buy button is never
//      cut off; the top of the card scrolls away first.
//   3. Nothing else lives in the rail below it — "More markets" / "More stocks"
//      / "Also live now" move to the bottom of the left column, otherwise they
//      would scroll up underneath the floating card.
// ============================================================
import { useEffect, useRef, useState, type ReactNode } from "react";

const GAP = 16;
const FALLBACK_HEADER = 64;

export const StickyRailCard = ({ children }: { children: ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(FALLBACK_HEADER + GAP);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const header = document.querySelector("header");
      const headerH = header ? header.getBoundingClientRect().height : FALLBACK_HEADER;
      const preferred = headerH + GAP;
      const cardH = el.getBoundingClientRect().height;
      // Too tall for the space under the header → pin by the bottom edge.
      setTop(Math.min(preferred, window.innerHeight - cardH - GAP));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div ref={ref} className="sticky z-10 space-y-4" style={{ top }}>
      {children}
    </div>
  );
};

export default StickyRailCard;
