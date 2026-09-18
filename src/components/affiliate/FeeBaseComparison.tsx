import { cn } from "@/lib/utils";
import { FEE_BASE } from "./affiliateContent";

/**
 * "The fee base makes a difference." — CEX benchmark vs OmenX on identical
 * volume and commission rate. DOM only (was an SVG image on the original page).
 * Visual spec: Figma Omenx_Affiliate 42:12126 (desktop card) / 46:12919 (mobile `stacked`).
 */
export const FeeBaseComparison = ({ stacked = false, className }: { stacked?: boolean; className?: string }) => {
  const { headline, rows, columns, caption } = FEE_BASE;

  if (stacked) {
    return (
      <div className={cn("rounded-lg border border-[#1C2027] bg-card px-4 py-[22px]", className)}>
        <div className="font-sans text-[10px] font-semibold uppercase leading-[15px] tracking-[2px] text-[#89909A]">{headline.over}</div>
        <div className="font-display text-[68px] font-bold leading-[72px] text-accent tabular-nums">{headline.multiple}</div>
        <div className="mt-1.5 font-sans text-[17px] font-bold leading-tight text-foreground">{headline.tail}</div>
        <div className="mt-1.5 font-sans text-sm leading-[22px] text-muted-foreground">{caption}</div>

        <div className="mt-[22px]">
          <div className="grid grid-cols-[119px_76px_76px] gap-2 px-2.5 py-[13px] font-sans text-[8px] uppercase tracking-[0.8px] text-[#9EA4AD]">
            <span />
            <span>{columns.volume}</span>
            <span>{columns.commission}</span>
          </div>
          {rows.map((r) => (
            <div
              key={r.name}
              className={cn(
                "grid grid-cols-[119px_76px_76px] items-center gap-2 rounded-md px-2.5 py-[13px] font-sans text-[11px] leading-4",
                r.highlight ? "bg-[#192018] text-foreground" : "text-[#9EA4AD]",
              )}
            >
              <span>{r.name}</span>
              <span className="tabular-nums">
                {r.volume} · {r.fee} · {r.rate}
              </span>
              <span className={cn("tabular-nums", r.highlight && "text-base font-bold text-accent")}>{r.commission}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const cols = "grid-cols-[1.87fr_1.28fr_0.94fr_1.35fr_2fr]";
  return (
    <div className={cn("grid grid-cols-[406px_1fr] overflow-hidden rounded-xl border border-border/60 bg-card px-6", className)}>
      {/* Headline */}
      <div className="flex flex-col justify-center pb-8 pr-6 pt-10">
        <span className="font-display text-[11px] uppercase leading-[17.6px] tracking-[2.42px] text-muted-foreground">{headline.over}</span>
        <span className="mt-2 font-display text-[112px] font-bold leading-[123px] text-accent tabular-nums">{headline.multiple}</span>
        <span className="mt-4 font-display text-2xl font-medium leading-[26.4px] tracking-[-0.24px] text-foreground">{headline.tail}</span>
        <span className="mt-3 font-sans text-[15px] leading-6 text-muted-foreground">{caption}</span>
      </div>

      {/* Table */}
      <div className="border-l border-border/40 py-8 pl-6">
        <div className={cn("grid gap-4 border-b border-border/40 pb-3 font-display text-[10px] uppercase leading-4 tracking-[1.2px] text-muted-foreground", cols)}>
          <span />
          <span className="text-right">{columns.volume}</span>
          <span className="text-right">{columns.fee}</span>
          <span className="text-right">{columns.rate}</span>
          <span className="pr-6 text-right">{columns.commission}</span>
        </div>
        {rows.map((r) => (
          <div
            key={r.name}
            className={cn(
              "grid items-center gap-4 py-6",
              cols,
              r.highlight ? "rounded-lg bg-accent/[0.04]" : "border-b border-border/25",
            )}
          >
            <span className={cn("pl-6 font-display text-xl font-medium leading-8 tracking-[-0.4px]", r.highlight ? "text-foreground" : "text-muted-foreground")}>
              {r.name}
            </span>
            {[r.volume, r.fee, r.rate].map((v, i) => (
              <span key={i} className={cn("text-right font-display text-lg leading-[28.8px] tabular-nums", r.highlight ? "text-foreground" : "text-foreground/80")}>
                {v}
              </span>
            ))}
            <span
              className={cn(
                "pr-6 text-right font-display text-4xl leading-[57.6px] tracking-[-0.72px] tabular-nums",
                r.highlight ? "font-bold text-accent" : "text-foreground/80",
              )}
            >
              {r.commission}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
