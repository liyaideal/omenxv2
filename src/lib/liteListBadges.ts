// ============================================================
// Lite list — badge system v2 + live list sort order.
// SINGLE SOURCE OF TRUTH for every threshold used by the Lite markets
// list. EN copy only. Display/derivation layer: no engine, no DB writes.
//
// Max 2 badges per card. Fill order:
//   STATUS    (max 1): Ends soon > New > Trending
//   ATTRIBUTE        : Intraday (ghost pill) → Boost {max}×
// Whatever does not fit the 2-slot cap is dropped, Boost first.
// ============================================================
import type { EventRow } from "@/hooks/useMarketListData";
import { isDailyStockEvent } from "@/lib/dailyStockSeries";

/** Config-like constants — change thresholds HERE and nowhere else. */
export const LITE_LIST_CONFIG = {
  /** "Ends soon" when time-to-settle is under this. */
  endsSoonMs: 4 * 60 * 60 * 1000,
  /** "New" when the event was created within this window. */
  newMs: 24 * 60 * 60 * 1000,
  /** "Trending" = 24h volume in the top slice of the live set. */
  trendingTopFraction: 0.2,
  /** Below this many live events the Trending badge is skipped entirely. */
  trendingMinEvents: 5,
  /** New events are lifted so they appear within the first N cards. */
  newLiftWithin: 6,
} as const;

export type LiteStatusBadge = "ends-soon" | "new" | "trending";

/**
 * INTRADAY — the event opens and settles inside the same trading day.
 * Primary signal: the settle timestamp lands on the same calendar day the
 * event went live. Corroborating fallback: the daily up/down series
 * detector already used by the settled series view, which recognises slugs
 * like `us-hood-updown-20260724`.
 */
export const isIntradayEvent = (m: EventRow): boolean => {
  if (m.expiry && m.createdAt) {
    const live = new Date(m.createdAt);
    if (
      isFinite(live.getTime()) &&
      live.toDateString() === m.expiry.toDateString()
    ) {
      return true;
    }
  }
  return isDailyStockEvent({
    id: m.eventId,
    name: m.eventName,
    category: m.category || "",
  });
};

const volumeOf = (m: EventRow) => m.volume24h || m.totalVolume || 0;

export const msToSettle = (m: EventRow, now = Date.now()): number | null =>
  m.expiry ? m.expiry.getTime() - now : null;

export const isEndsSoon = (m: EventRow, now = Date.now()): boolean => {
  const ms = msToSettle(m, now);
  return ms !== null && ms > 0 && ms < LITE_LIST_CONFIG.endsSoonMs;
};

export const isNewEventRow = (m: EventRow, now = Date.now()): boolean => {
  if (m.isNew) return true;
  if (!m.createdAt) return false;
  const t = new Date(m.createdAt).getTime();
  return isFinite(t) && now - t < LITE_LIST_CONFIG.newMs;
};

/**
 * 24h-volume cutoff for the Trending badge, computed from the loaded live
 * set. Returns null when the set is too small to rank meaningfully.
 */
export const trendingThreshold = (rows: EventRow[]): number | null => {
  if (rows.length < LITE_LIST_CONFIG.trendingMinEvents) return null;
  const vols = rows.map(volumeOf).sort((a, b) => b - a);
  const idx = Math.max(
    0,
    Math.ceil(vols.length * LITE_LIST_CONFIG.trendingTopFraction) - 1,
  );
  const cut = vols[idx];
  return cut > 0 ? cut : null;
};

/**
 * The ONE status badge a card may show, or null. Priority is fixed.
 *
 * INTRADAY EXEMPTION (badge layer only): a same-day recurring event is
 * trivially "New" every morning and "Ends soon" every afternoon, so both
 * are pure noise for it. Intraday events may therefore ONLY carry
 * "Trending". ASSERTION: with this exemption the amber "Ends soon" badge
 * and the orange "Intraday" badge can NEVER co-occur on one card.
 * This does NOT touch ordering — `sortLiteLiveList` keeps using the raw
 * `isEndsSoon` settle-time rule for every event, intraday included.
 */
export const statusBadgeFor = (
  m: EventRow,
  cutoff: number | null,
  now = Date.now(),
): LiteStatusBadge | null => {
  if (isIntradayEvent(m)) {
    return cutoff !== null && volumeOf(m) >= cutoff ? "trending" : null;
  }
  if (isEndsSoon(m, now)) return "ends-soon";
  if (isNewEventRow(m, now)) return "new";
  if (cutoff !== null && volumeOf(m) >= cutoff) return "trending";
  return null;
};

/** "3h 12m" — minute precision, never seconds. */
export const formatEndsIn = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 60_000));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

/**
 * Live list default order (approved option A):
 *   1. Ends soon (< 4h) first, ascending by time-to-settle.
 *   2. Everything else by 24h volume (fallback total volume), descending.
 *   3. New events (< 24h) ranked below position 6 are lifted so they land
 *      within the top 6, preserving their relative order and never
 *      displacing an Ends-soon event. When the Ends-soon block already
 *      fills the top 6, injection is skipped entirely — that block owns
 *      the top of the list.
 * Pure function over the already-filtered set — the same rules apply to
 * "All" and to each sector filter.
 */
export const sortLiteLiveList = (rows: EventRow[], now = Date.now()): EventRow[] => {
  const soon: EventRow[] = [];
  const rest: EventRow[] = [];
  for (const m of rows) (isEndsSoon(m, now) ? soon : rest).push(m);

  soon.sort((a, b) => (msToSettle(a, now) ?? 0) - (msToSettle(b, now) ?? 0));
  rest.sort((a, b) => volumeOf(b) - volumeOf(a));

  const ordered = [...soon, ...rest];
  const limit = LITE_LIST_CONFIG.newLiftWithin;

  // The Ends-soon block owns the top slots; if it already fills them there
  // is nowhere to lift a New event without displacing one.
  if (soon.length >= limit) return ordered;

  // Lift new events that fall outside the first `limit` slots.
  const lifted = ordered.filter(
    (m, i) => i >= limit && !isEndsSoon(m, now) && isNewEventRow(m, now),
  );
  if (lifted.length === 0) return ordered;

  const liftedSet = new Set(lifted);
  const remaining = ordered.filter((m) => !liftedSet.has(m));
  // Insert directly after the Ends-soon block, never before it.
  const insertAt = Math.min(soon.length, remaining.length);
  return [...remaining.slice(0, insertAt), ...lifted, ...remaining.slice(insertAt)];
};
