// ============================================================
// Market activity — anonymised, ALL-user feed for one event.
// Backed by the dedicated `market_activity` table (public SELECT, and no
// user identity column at all), so it is real social proof rather than the
// viewer's own owner-scoped fills. Pure presentational: rows come from the
// caller.
// ============================================================
import { cn } from "@/lib/utils";

export interface MarketActivityRow {
  id: string;
  isYes: boolean;
  amount: number;
  boost: number;
  createdAt: string;
}

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
const ROW_GRID = "grid grid-cols-[minmax(48px,auto)_64px_48px_auto] items-center gap-x-3";

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
      <div className="rounded-lg bg-muted/20 py-6 text-center text-xs text-muted-foreground">
        No activity yet — be the first.
      </div>
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