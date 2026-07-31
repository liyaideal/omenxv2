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
  /** Source of truth for the side — comes from `market_activity.is_yes`.
   *  Optional only for legacy rows recorded before that column existed. */
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
  /** Multi-option events: the label can't identify the side (every option is
   *  its own market), so only the persisted `is_yes` column — or, for legacy
   *  rows, the "No: " prefix — can classify the row. */
  multi = false,
): MarketActivityRow[] => {
  const [rows, setRows] = useState<MarketActivityRow[]>([]);
  useEffect(() => {
    if (!eventName) {
      setRows([]);
      return;
    }
    let alive = true;
    const yesLc = yesOptionLabel.trim().toLowerCase();
    const toRow = (r: {
      id: string;
      option_label: string | null;
      amount: number | string | null;
      boost: number | string | null;
      created_at: string;
      is_yes: boolean | null;
    }): MarketActivityRow => {
      const label = r.option_label || "";
      const inferred = multi
        ? splitMultiLabel(label).isYes
        : label.trim().toLowerCase() === yesLc;
      return {
        id: r.id,
        isYes: r.is_yes ?? inferred,
        label,
        amount: Number(r.amount) || 0,
        boost: Number(r.boost) || 1,
        createdAt: r.created_at,
      };
    };
    (async () => {
      const { data } = await supabase
        .from("market_activity")
        .select("id, amount, boost, created_at, option_label, is_yes")
        .eq("event_name", eventName)
        .order("created_at", { ascending: false })
        .limit(30);
      if (!alive) return;
      setRows((data || []).map(toRow));
    })();

    // Live feed: new anonymised fills for THIS event stream in without a poll.
    const channel = supabase
      .channel(`market-activity-${eventName}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "market_activity" },
        (payload) => {
          const r = payload.new as {
            id: string;
            event_name: string | null;
            option_label: string | null;
            amount: number | string | null;
            boost: number | string | null;
            created_at: string;
            is_yes: boolean | null;
          };
          if (!r || r.event_name !== eventName) return;
          setRows((prev) => {
            if (prev.some((p) => p.id === r.id)) return prev;
            return [toRow(r), ...prev]
              .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
              .slice(0, 30);
          });
        },
      )
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(channel);
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

// UNIFIED ledger grid — frozen order for BOTH binary and multi surfaces:
// time | ACTION ("Backed {side}", market-axis colour) | context (muted) |
// amount (right). Binary context is the boost only — the page IS the market;
// multi context prepends the option label. No leading side chip anywhere.
const ROW_GRID =
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
          const legacy = splitMultiLabel(r.label);
          // `isYes` wins; the legacy prefix only fills in for rows without it.
          const isYes = r.isYes ?? (showOptionLabel ? legacy.isYes : false);
          // Single row renderer — the ONLY difference between surfaces is the
          // context column: multi names the option, binary shows boost only.
          const context = showOptionLabel
            ? `${legacy.option} · ${r.boost}×`
            : `${r.boost}×`;
          return (
            <li
              key={r.id}
              className={cn(ROW_GRID, "rounded-lg px-2 py-1.5 hover:bg-muted/20")}
            >
              <span className="font-mono text-[11px] text-muted-foreground">
                {relTime(r.createdAt)}
              </span>
              <span
                className={cn("text-[11px] font-semibold", isYes ? "text-yes" : "text-no")}
              >
                Backed {isYes ? yesLabel : noLabel}
              </span>
              <span className="min-w-0 truncate font-mono text-[11px] text-muted-foreground">
                {context}
              </span>
              <span className="text-right font-mono text-xs text-foreground">
                ${r.amount.toFixed(0)}
              </span>
            </li>
          );
        })}
      </ul>
    )}
  </div>
);

export default LiteMarketActivity;