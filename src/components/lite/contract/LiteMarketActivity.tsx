// ============================================================
// Market activity — anonymised, ALL-user feed for one event.
// Backed by the dedicated `market_activity` table (public SELECT, and no
// user identity column at all), so it is real social proof rather than the
// viewer's own owner-scoped fills. Pure presentational: rows come from the
// caller.
// ============================================================
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState } from "@/components/states";

export interface MarketActivityRow {
  id: string;
  isYes: boolean;
  amount: number;
  boost: number;
  createdAt: string;
}

// `market_activity` is an anonymised, all-user feed (public SELECT, no user
// identity column), so this is genuine market-wide social proof. Polled on
// `tick` — no realtime subscription needed. Shared by the Lite contract page
// and the Lite spot page; do not fork a second copy.
export const useMarketActivityRows = (
  eventName: string | null,
  yesOptionLabel: string,
  tick: number,
): MarketActivityRow[] => {
  const [rows, setRows] = useState<MarketActivityRow[]>([]);
  useEffect(() => {
    if (!eventName) {
      setRows([]);
      return;
    }
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("market_activity")
        .select("id, amount, boost, created_at, option_label")
        .eq("event_name", eventName)
        .order("created_at", { ascending: false })
        .limit(30);
      if (!alive) return;
      const yesLc = yesOptionLabel.trim().toLowerCase();
      setRows(
        (data || []).map((r) => ({
          id: r.id,
          isYes: (r.option_label || "").trim().toLowerCase() === yesLc,
          amount: Number(r.amount) || 0,
          boost: Number(r.boost) || 1,
          createdAt: r.created_at,
        })),
      );
    })();
    return () => {
      alive = false;
    };
  }, [eventName, yesOptionLabel, tick]);
  return rows;
};

export const relTime = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return `${Math.max(1, Math.floor(diff / 1000))}s`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  return `${Math.floor(diff / 86_400_000)}d`;
};

interface Props {
  rows: MarketActivityRow[];
  yesLabel: string;
  noLabel: string;
  maxRows?: number;
}

// Ledger grid: chips align with chips, amounts with amounts, multipliers always shown.
const ROW_GRID = "grid grid-cols-[minmax(48px,auto)_64px_48px_1fr] items-center gap-x-3";

export const LiteMarketActivity = ({ rows, yesLabel, noLabel, maxRows = 6 }: Props) => (
  <div className="rounded-2xl border border-border bg-card p-4">
    <div className="mb-3 flex items-center gap-1.5 text-sm font-medium">
      <span
        className="h-1.5 w-1.5 animate-pulse rounded-full"
        style={{ background: "#6B7280" }}
      />
      Market activity
    </div>
    {rows.length === 0 ? (
      <EmptyState
        variant="module"
        bordered={false}
        title="No activity yet"
        description="Trades on this market show up here as people back a side."
        className="px-0 py-2"
      />
    ) : (
      <ul className="space-y-1.5">
        {rows.slice(0, maxRows).map((r) => (
          <li key={r.id} className={cn(ROW_GRID, "rounded-lg px-2 py-1.5 hover:bg-muted/20")}>
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-center text-[11px] font-semibold",
                r.isYes ? "bg-yes/13 text-yes" : "bg-no/13 text-no",
              )}
            >
              {r.isYes ? yesLabel : noLabel}
            </span>
            <span className="text-right font-mono text-xs text-foreground">
              ${r.amount.toFixed(0)}
            </span>
            <span
              className={cn(
                "text-xs font-mono",
                r.boost > 1 ? "text-muted-foreground" : "text-muted-foreground/50",
              )}
            >
              {r.boost}×
            </span>
            <span className="text-right font-mono text-[11px] text-muted-foreground">
              {relTime(r.createdAt)}
            </span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

export default LiteMarketActivity;