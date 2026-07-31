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
  /** Source of truth for the side. Optional only for legacy rows where the
   *  side has to be inferred from a "No: " label prefix. */
  isYes?: boolean;
  /** Raw option label — multi-market events show this instead of Yes/No. */
  label: string;
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
  /** Multi-option events: the side cannot be inferred by comparing the option
   *  label to the Yes option — every option is its own market. Since the
   *  netting round, No legs are stored under the PLAIN option label, so the
   *  only side marker still available on the feed is the legacy "No: " prefix. */
  multi = false,
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
        (data || []).map((r) => {
          const label = r.option_label || "";
          return {
            id: r.id,
            isYes: multi
              ? splitMultiLabel(label).isYes
              : label.trim().toLowerCase() === yesLc,
            label,
            amount: Number(r.amount) || 0,
            boost: Number(r.boost) || 1,
            createdAt: r.created_at,
          };
        }),
      );
    })();
    return () => {
      alive = false;
    };
  }, [eventName, yesOptionLabel, tick, multi]);
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
  /** Multi-market events: name the option instead of a Yes/No side chip. */
  showOptionLabel?: boolean;
}

// Ledger grid: chips align with chips, amounts with amounts, multipliers always shown.
const ROW_GRID = "grid grid-cols-[minmax(48px,auto)_64px_48px_1fr] items-center gap-x-3";
// Multi-market ledger grid — frozen order: time | ACTION | context | amount.
// The option label NEVER leads the row (it reads like a username); it lives in
// the muted context column together with the boost multiplier.
const ROW_GRID_MULTI =
  "grid grid-cols-[44px_minmax(72px,auto)_minmax(0,1fr)_64px] items-center gap-x-3";

/** Strips the legacy "No: " display prefix. The prefix is ONLY a fallback side
 *  marker for legacy rows — `row.isYes` is the source of truth. */
const splitMultiLabel = (label: string): { isYes: boolean; option: string } => {
  const m = /^no:\s*/i.exec(label.trim());
  return m ? { isYes: false, option: label.trim().slice(m[0].length) } : { isYes: true, option: label.trim() };
};

export const LiteMarketActivity = ({
  rows,
  yesLabel,
  noLabel,
  maxRows = 6,
  showOptionLabel = false,
}: Props) => (
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
        {rows.slice(0, maxRows).map((r) => {
          if (showOptionLabel) {
            const legacy = splitMultiLabel(r.label);
            // `isYes` wins; the legacy prefix only fills in for rows without it.
            const isYes = r.isYes ?? legacy.isYes;
            const option = legacy.option;
            return (
              <li
                key={r.id}
                className={cn(ROW_GRID_MULTI, "rounded-lg px-2 py-1.5 hover:bg-muted/20")}
              >
                <span className="font-mono text-[11px] text-muted-foreground">
                  {relTime(r.createdAt)}
                </span>
                <span
                  className={cn(
                    "text-[11px] font-semibold",
                    isYes ? "text-yes" : "text-no",
                  )}
                >
                  Backed {isYes ? yesLabel : noLabel}
                </span>
                <span className="min-w-0 truncate text-[11px] text-muted-foreground">
                  {option}
                  {" · "}
                  {r.boost}×
                </span>
                <span className="text-right font-mono text-xs text-foreground">
                  ${r.amount.toFixed(0)}
                </span>
              </li>
            );
          }
          return (
          <li
            key={r.id}
            className={cn(ROW_GRID, "rounded-lg px-2 py-1.5 hover:bg-muted/20")}
          >
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
          );
        })}
      </ul>
    )}
  </div>
);

export default LiteMarketActivity;