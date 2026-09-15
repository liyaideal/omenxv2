// ============================================================
// ES-1 · Trading-terminal event selector — shared rules.
//
// One selector, two product tabs. `Standard` = the spot line (/spot),
// `Boost` = the contract line (/trade). Names follow the account cards
// (`Standard Account` / `Boost Account`), never the internal words.
// ============================================================

export type ProductTab = "standard" | "boost";

export const PRODUCT_TABS: ProductTab[] = ["standard", "boost"];

export const PRODUCT_TAB_LABEL: Record<ProductTab, string> = {
  standard: "Standard",
  boost: "Boost",
};

/** Which tab(s) an event belongs to, from its `product_lines`. Null/empty = futures only (legacy rows). */
export const eventOnTab = (productLines: string[] | null | undefined, tab: ProductTab): boolean => {
  const lines = productLines && productLines.length > 0 ? productLines : ["futures"];
  return tab === "standard" ? lines.includes("spot") : lines.includes("futures");
};

export type TerminalView = "charts" | "order";

/** Route for an event on a given product line, keeping the current view (charts ↔ order). */
export const terminalPath = (tab: ProductTab, eventId: string, view: TerminalView): string => {
  const base = tab === "standard" ? "/spot" : "/trade";
  return `${view === "order" ? `${base}/order` : base}?event=${encodeURIComponent(eventId)}`;
};

export type EndsInUrgency = "muted" | "yellow" | "red";

export interface EndsIn {
  text: string;
  urgency: EndsInUrgency;
  /** True once the freeze window has started (orders blocked, page still viewable). */
  frozen: boolean;
}

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/**
 * Relative "Ends in" for list rows. Quick-cycle events (8-minute rounds) need
 * minutes, long-dated ones a date — a bare `Sep 15` says nothing about a round
 * that ends in eight minutes.
 *
 *   < 1 min       `<1m`
 *   < 1 hour      `8m`
 *   < 24 hours    `3h 12m`
 *   < 7 days      `2d 14h`
 *   ≥ 7 days      `Sep 29`
 *   past freeze   `Frozen`
 *
 * Urgency mirrors the terminal header countdown: red ≤ 15 min, yellow ≤ 1 h.
 */
export const formatEndsIn = (
  endTime: Date | null | undefined,
  freezeTime: Date | null | undefined,
  now: number = Date.now(),
): EndsIn => {
  if (!endTime) return { text: "—", urgency: "muted", frozen: false };
  const end = endTime.getTime();
  const freeze = freezeTime?.getTime();
  if (freeze != null && now >= freeze && now < end) {
    return { text: "Frozen", urgency: "red", frozen: true };
  }
  const diff = end - now;
  if (diff <= 0) return { text: "Ended", urgency: "muted", frozen: false };
  const urgency: EndsInUrgency = diff <= 15 * MIN ? "red" : diff <= HOUR ? "yellow" : "muted";
  if (diff < MIN) return { text: "<1m", urgency, frozen: false };
  if (diff < HOUR) return { text: `${Math.floor(diff / MIN)}m`, urgency, frozen: false };
  if (diff < DAY) {
    const h = Math.floor(diff / HOUR);
    const m = Math.floor((diff % HOUR) / MIN);
    return { text: `${h}h ${m}m`, urgency, frozen: false };
  }
  if (diff < 7 * DAY) {
    const d = Math.floor(diff / DAY);
    const h = Math.floor((diff % DAY) / HOUR);
    return { text: `${d}d ${h}h`, urgency, frozen: false };
  }
  return {
    text: endTime.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    urgency,
    frozen: false,
  };
};
