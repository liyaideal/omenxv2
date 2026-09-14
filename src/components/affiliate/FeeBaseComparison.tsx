import { cn } from "@/lib/utils";
import { FEE_BASE } from "./affiliateContent";

/**
 * "The fee base makes a difference." — CEX benchmark vs OmenX on identical
 * volume and commission rate. Two-row spec table with a headline multiple;
 * DOM only (was an SVG image on the original page). Marketing scale L.
 */
export const FeeBaseComparison = ({ stacked = false, className }: { stacked?: boolean; className?: string }) => {
  const { headline, rows, columns, caption } = FEE_BASE;
  const cols = [
    { key: "volume", label: columns.volume },
    { key: "fee", label: columns.fee },
    { key: "rate", label: columns.rate },
    { key: "commission", label: columns.commission },
  ] as const;

  return (
    <div className={cn("border-y border-border/40", className)}>
      <div
        className={cn(
          "grid",
          stacked ? "grid-cols-1 divide-y divide-border/40" : "md:grid-cols-[0.38fr_0.62fr] md:divide-x divide-border/40",
        )}
      >
        {/* Headline */}
        <div className={cn("flex flex-col justify-center", stacked ? "px-5 py-8" : "px-7 py-10")}>
          <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-muted-foreground">{headline.over}</span>
          <span
            className={cn(
              "font-mono font-bold leading-none text-accent tabular-nums mt-2",
              stacked ? "text-[80px]" : "text-[112px]",
            )}
          >
            {headline.multiple}
          </span>
          <span className="font-display font-medium tracking-[-0.01em] text-2xl text-foreground mt-4">{headline.tail}</span>
          <span className="text-[15px] text-muted-foreground mt-3">{caption}</span>
        </div>

        {/* Table */}
        <div className={cn(stacked ? "px-5 py-2" : "px-7 py-8")}>
          {!stacked && (
            <div className="grid grid-cols-[1.1fr_0.9fr_0.9fr_1.15fr_1.25fr] gap-4 pb-3 border-b border-border/40 text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground whitespace-nowrap">
              <span />
              {cols.map((c) => (
                <span key={c.key} className="text-right">
                  {c.label}
                </span>
              ))}
            </div>
          )}

          {rows.map((r) =>
            stacked ? (
              <div key={r.name} className="py-6 border-b border-border/30 last:border-b-0">
                <div className={cn("font-display text-lg font-medium mb-3", r.highlight ? "text-foreground" : "text-muted-foreground")}>
                  {r.name}
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
                  {cols.map((c) => (
                    <div key={c.key} className="flex flex-col">
                      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{c.label}</dt>
                      <dd
                        className={cn(
                          "font-mono tabular-nums mt-1",
                          c.key === "commission"
                            ? r.highlight
                              ? "text-accent font-bold text-3xl"
                              : "text-foreground/80 text-3xl"
                            : "text-foreground text-lg",
                        )}
                      >
                        {r[c.key]}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : (
              <div
                key={r.name}
                className={cn(
                  "grid grid-cols-[1.1fr_0.9fr_0.9fr_1.15fr_1.25fr] gap-4 items-center py-6 border-b border-border/30 last:border-b-0",
                  r.highlight && "bg-accent/[0.04] -mx-3 px-3 rounded-sm",
                )}
              >
                <span className={cn("font-display text-xl font-medium", r.highlight ? "text-foreground" : "text-muted-foreground")}>
                  {r.name}
                </span>
                <span className="font-mono text-lg text-foreground text-right tabular-nums">{r.volume}</span>
                <span className="font-mono text-lg text-foreground text-right tabular-nums">{r.fee}</span>
                <span className="font-mono text-lg text-foreground text-right tabular-nums">{r.rate}</span>
                <span
                  className={cn(
                    "font-mono text-right tabular-nums",
                    r.highlight ? "text-accent font-bold text-4xl" : "text-foreground/80 text-4xl",
                  )}
                >
                  {r.commission}
                </span>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
};
