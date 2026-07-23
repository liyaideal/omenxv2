import { useMemo } from "react";
import { useActiveEvents } from "@/hooks/useActiveEvents";
import { useMarketListData } from "@/hooks/useMarketListData";

const formatUSD = (val: number): string => {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val.toFixed(0)}`;
};

/**
 * Guest-facing live activity strip — shown above the markets grid.
 *
 * Replaces the "Sign in to trade" capsule for guests. Communicates the
 * platform is alive (N markets live, $X traded today) without any
 * promotional copy. Pure social proof.
 */
export const LiveStatsStrip = () => {
  const { events } = useActiveEvents();
  const rows = useMarketListData(events);

  const { marketCount, volume24h } = useMemo(() => {
    return {
      marketCount: rows.length,
      volume24h: rows.reduce((s, r) => s + r.volume24h, 0),
    };
  }, [rows]);

  return (
    <div className="flex items-center gap-3 px-1 py-1">
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-trading-green opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-trading-green" />
        </span>
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-trading-green">
          Live
        </span>
      </div>
      <span className="text-muted-foreground/40">·</span>
      <span className="font-mono text-[12px] text-foreground">
        <span className="font-semibold tabular-nums">{marketCount || "—"}</span>{" "}
        <span className="text-muted-foreground">markets</span>
      </span>
      <span className="text-muted-foreground/40">·</span>
      <span className="font-mono text-[12px] text-foreground">
        <span className="font-semibold tabular-nums">{formatUSD(volume24h)}</span>{" "}
        <span className="text-muted-foreground">traded today</span>
      </span>
    </div>
  );
};
