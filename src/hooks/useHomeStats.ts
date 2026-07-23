import { useMemo } from "react";
import { useActiveEvents } from "@/hooks/useActiveEvents";
import { useMarketListData } from "@/hooks/useMarketListData";

/**
 * Aggregated home stats for guest header / hero.
 *
 * Reuses the same market list the rest of the home page already loads,
 * so this is essentially free (no extra requests).
 */
export const useHomeStats = () => {
  const { events, isLoading: loading } = useActiveEvents();
  const rows = useMarketListData(events);

  return useMemo(() => {
    const volume24h = rows.reduce((s, r) => s + (r.volume24h || 0), 0);
    const activeMarkets = rows.length;

    // Decorative sparkline: take the top 8 markets by 24h volume and
    // use their normalized volumes as a shape. Not a time series — just
    // a stable, data-derived silhouette so the card feels "alive".
    const top = [...rows]
      .sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0))
      .slice(0, 8)
      .map((r) => r.volume24h || 0);

    // Reverse so the biggest market lands on the right (visual upswing).
    const sparkPoints = top.length >= 2 ? top.reverse() : [];

    return {
      volume24h,
      activeMarkets,
      sparkPoints,
      isLoading: loading,
    };
  }, [rows, loading]);
};
