// ============================================================
// Mobile-only crowd summary for multi-market events (3+ options).
// Pure display: one row per LIVE option with a track bar whose fill
// width equals that option's yes-price. Settled options are excluded.
// No interactions — the board below is the selector.
// ============================================================
import { cn } from "@/lib/utils";

export interface CrowdRow {
  id: string;
  label: string;
  /** 0..1 chance of this option resolving Yes. */
  yesPrice: number;
  /** Settled options are filtered out of the summary. */
  settled?: boolean;
}

interface Props {
  options: CrowdRow[];
  className?: string;
}

const clampPct = (p: number) => Math.max(1, Math.min(99, Math.round(p * 100)));

export const LiteCrowdOverview = ({ options, className }: Props) => {
  const live = options.filter((o) => !o.settled);
  if (live.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-[14px] border border-border bg-[hsl(var(--card))] px-3.5 py-3",
        className,
      )}
    >
      <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        What the crowd thinks
      </div>
      <div className="mt-2.5 space-y-2">
        {live.map((o) => {
          const pct = clampPct(o.yesPrice);
          return (
            <div key={o.id} className="flex items-center gap-2.5">
              <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-muted-foreground">
                {o.label}
              </span>
              <div
                className="w-[42%] shrink-0 overflow-hidden rounded-full bg-white/8"
                style={{ height: 8 }}
                aria-hidden
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    background:
                      "linear-gradient(90deg, hsl(var(--yes) / 0.55), hsl(var(--yes)))",
                  }}
                />
              </div>
              <span className="w-[38px] shrink-0 text-right font-mono text-[13px] font-bold text-foreground">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LiteCrowdOverview;
