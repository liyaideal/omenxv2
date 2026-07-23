import { useMemo } from "react";
import { EventRow } from "@/hooks/useMarketListData";

export type HotBucket = "all" | "trending" | "closingSoon";

/**
 * Single source of truth for "hot" market classification used by both the
 * /events Hot tab (`HotShelf`) and the Home Top Events module.
 *
 * Buckets:
 * - all          → every market sorted by 24h volume desc
 * - justLaunched → created within the last 48h
 * - closingSoon  → expires within the next 48h, sorted by open interest desc
 * - trending     → not in the above two buckets, with 24h volume > $10k,
 *                  sorted by 24h volume desc
 */
export function useHotMarkets(markets: EventRow[]) {
  return useMemo(() => {
    const now = Date.now();
    const h48 = 48 * 3600000;

    const justLaunched = markets.filter(
      (m) => now - new Date(m.createdAt).getTime() <= h48,
    );
    const closingSoon = markets
      .filter(
        (m) => m.expiry && m.expiry.getTime() - now <= h48 && m.expiry.getTime() > now,
      )
      .sort((a, b) => b.openInterest - a.openInterest);

    const launchedIds = new Set(justLaunched.map((m) => m.id));
    const closingIds = new Set(closingSoon.map((m) => m.id));

    const trending = markets
      .filter(
        (m) =>
          !launchedIds.has(m.id) && !closingIds.has(m.id) && m.volume24h > 10_000,
      )
      .sort((a, b) => b.volume24h - a.volume24h);

    // Rank by 24h volume desc — closing-soon users use the dedicated chip.
    const all = [...markets].sort((a, b) => b.volume24h - a.volume24h);

    return { all, trending, closingSoon, justLaunched };
  }, [markets]);
}
