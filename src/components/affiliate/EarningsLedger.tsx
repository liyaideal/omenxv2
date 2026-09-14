import { cn } from "@/lib/utils";
import { HOW_YOU_EARN, type LedgerColumn } from "./affiliateContent";

/**
 * "How you earn with OmenX" — the illustrative monthly example rendered as a
 * live ledger (DOM, not an image). Numbers are frozen copy from affiliateContent.
 *
 * Marketing scale L (DESIGN.md §19.4): result figures are the protagonists.
 * Desktop: three shared-border columns + a total strip.
 * Mobile (`stacked`): the same three columns stacked vertically.
 */
const ColumnBlock = ({ col, index, stacked }: { col: LedgerColumn; index: number; stacked: boolean }) => (
  <div className={cn("flex flex-col", stacked ? "px-5 py-7" : "px-7 py-9")}>
    <div className="flex items-center justify-between gap-3 mb-5">
      <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary">{col.who}</span>
      <span aria-hidden className="font-mono text-3xl leading-none text-muted-foreground/[0.14] select-none">
        0{index + 1}
      </span>
    </div>
    <h4 className="font-display font-medium tracking-[-0.01em] text-2xl text-foreground">{col.title}</h4>
    <p className="text-[15px] text-muted-foreground mt-2 leading-relaxed">{col.desc}</p>

    <dl className="mt-7 border-t border-border/40">
      {col.rows.map((r) => (
        <div key={r.label} className="flex items-baseline justify-between gap-4 py-3 border-b border-border/30">
          <dt
            className={cn(
              "text-sm text-muted-foreground",
              r.kind === "formula" && "font-mono text-[13px] text-muted-foreground/80",
            )}
          >
            {r.label}
          </dt>
          <dd
            className={cn(
              "font-mono text-base tabular-nums shrink-0",
              r.kind === "input" ? "text-foreground" : "text-foreground/80",
            )}
          >
            {r.value}
          </dd>
        </div>
      ))}
    </dl>

    <div className="mt-auto pt-7 flex items-end justify-between gap-4">
      <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground max-w-[9rem] leading-snug">{col.resultLabel}</span>
      <span className="font-mono font-bold text-[40px] leading-none text-accent tabular-nums">{col.resultValue}</span>
    </div>
  </div>
);

export const EarningsLedger = ({ stacked = false, className }: { stacked?: boolean; className?: string }) => {
  const { columns, totalLabel, totalValue, totalBreakdown } = HOW_YOU_EARN;
  return (
    <div className={cn("border-y border-border/40", className)}>
      <div
        className={cn(
          "grid divide-border/40",
          stacked ? "grid-cols-1 divide-y" : "md:grid-cols-3 md:divide-x divide-y md:divide-y-0",
        )}
      >
        {columns.map((c, i) => (
          <ColumnBlock key={c.who} col={c} index={i} stacked={stacked} />
        ))}
      </div>

      {/* Total strip */}
      <div className="relative border-t border-border/40">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-border via-border to-accent" />
        <div
          className={cn(
            "flex gap-3",
            stacked ? "flex-col px-5 py-7" : "flex-row items-end justify-between px-7 py-8",
          )}
        >
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-muted-foreground">{totalLabel}</div>
            <div className="text-[15px] text-muted-foreground mt-2">{totalBreakdown}</div>
          </div>
          <div className={cn("font-mono font-bold leading-none text-foreground tabular-nums", stacked ? "text-5xl" : "text-[64px]")}>
            {totalValue}
          </div>
        </div>
      </div>
    </div>
  );
};
