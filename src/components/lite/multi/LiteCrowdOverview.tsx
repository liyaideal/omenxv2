// ============================================================
// Mobile-only crowd overview for multi-market events: a compact
// "what the crowd thinks" card listing every live option's chance as a
// filled bar. Display only — selection happens on the board rows below.
// ============================================================
import { cn } from "@/lib/utils";

export interface CrowdRow {
  id: string;
  label: string;
  /** 0..1 */
  yesPrice: number;
}

export const LiteCrowdOverview = ({
  rows,
  className,
}: {
  rows: CrowdRow[];
  className?: string;
}) => (
  <div className={cn("rounded-2xl border border-border bg-card p-4", className)}>
    <div className="mb-3 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
      What the crowd thinks
    </div>
    <ul className="space-y-2">
      {rows.map((r) => {
        const p = Math.max(1, Math.min(99, Math.round(r.yesPrice * 100)));
        return (
          <li key={r.id} className="grid grid-cols-[minmax(0,1fr)_84px_36px] items-center gap-2">
            <span className="truncate text-[12px] text-muted-foreground">{r.label}</span>
            <span className="h-2 overflow-hidden rounded-full bg-muted/40">
              <span
                className="block h-full rounded-full bg-gradient-to-r from-yes/50 to-yes"
                style={{ width: `${p}%` }}
              />
            </span>
            <span className="text-right font-mono text-[12px] font-bold text-foreground">
              {p}%
            </span>
          </li>
        );
      })}
    </ul>
  </div>
);

export default LiteCrowdOverview;