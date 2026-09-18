import { cn } from "@/lib/utils";
import { HOW_YOU_EARN, type LedgerColumn } from "./affiliateContent";

/**
 * "How you earn with OmenX" — the illustrative monthly example rendered as
 * three ledger cards + a total strip (DOM, not an image). Numbers are frozen
 * copy from affiliateContent. Visual spec: Figma Omenx_Affiliate 42:11963 /
 * 42:12095 (desktop) and 46:12786 / 46:12903 (mobile, `stacked`).
 */
const ColumnCard = ({ col, index, stacked }: { col: LedgerColumn; index: number; stacked: boolean }) =>
  stacked ? (
    <article className="flex flex-col rounded-lg border border-[#1A1F27] bg-card px-4 pt-[18px] pb-5">
      <div className="flex items-center justify-between font-sans text-xs uppercase tracking-[1.5px] text-primary">
        <span>{col.who}</span>
        <span>0{index + 1}</span>
      </div>
      <h4 className="mt-[15px] font-display text-[22px] font-bold leading-tight text-foreground">{col.title}</h4>
      <p className="mt-[5px] font-sans text-xs leading-normal text-muted-foreground">{col.desc}</p>
      <dl className="mt-[22px]">
        {col.rows.map((r) => (
          <div key={r.label} className="flex items-end justify-between gap-4 border-b border-[#23262C] py-[11px]">
            <dt className="font-sans text-[11px] leading-4 text-[#8E949D]">{r.label}</dt>
            <dd className="shrink-0 font-sans text-[11px] font-bold leading-4 text-[#F4F5F7] tabular-nums">{r.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-[30px]">
        <div className="font-sans text-[10px] uppercase tracking-[1px] text-accent">{col.resultLabel}</div>
        <div className="mt-1 font-display text-[28px] font-bold leading-9 text-foreground tabular-nums">{col.resultValue}</div>
      </div>
    </article>
  ) : (
    <article className="flex min-h-[500px] flex-col rounded-lg bg-card p-6 shadow-[0_18px_25px_rgba(5,7,14,0.58)]">
      <div className="flex items-center justify-between font-sans text-[11px] uppercase leading-[13.5px] tracking-[1.44px] text-primary">
        <span>{col.who}</span>
        <span>0{index + 1}</span>
      </div>
      <h4 className="mt-7 font-display text-2xl font-medium leading-7 text-foreground">{col.title}</h4>
      <p className="mt-2 min-h-12 font-sans text-sm leading-5 text-muted-foreground">{col.desc}</p>
      <dl className="mt-7">
        {col.rows.map((r, i) => (
          <div
            key={r.label}
            className={cn(
              "flex items-end justify-between gap-4 border-b border-[rgba(249,250,251,0.06)] pb-3",
              i > 0 && "pt-3",
            )}
          >
            <dt className="max-w-[166px] font-sans text-xs leading-4 text-muted-foreground">{r.label}</dt>
            <dd className="shrink-0 font-sans text-sm font-medium leading-4 text-foreground tabular-nums">{r.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-auto pt-7">
        <div className="font-sans text-xs uppercase leading-[13.5px] tracking-[1.44px] text-accent">{col.resultLabel}</div>
        <div className="mt-2 font-display text-[30px] font-bold leading-9 text-foreground tabular-nums">{col.resultValue}</div>
      </div>
    </article>
  );

export const EarningsLedger = ({ stacked = false, className }: { stacked?: boolean; className?: string }) => {
  const { columns, totalLabel, totalValue, totalBreakdown } = HOW_YOU_EARN;
  return (
    <div className={className}>
      <div className={cn("grid", stacked ? "grid-cols-1 gap-3" : "grid-cols-3 gap-4")}>
        {columns.map((c, i) => (
          <ColumnCard key={c.who} col={c} index={i} stacked={stacked} />
        ))}
      </div>

      {/* Total strip */}
      {stacked ? (
        <div className="mt-3 rounded-lg border border-[#26331C] bg-[linear-gradient(90deg,#10170E_0%,#101311_100%)] p-5">
          <div className="font-sans text-[10px] font-semibold uppercase leading-[15px] tracking-[2px] text-accent">{totalLabel}</div>
          <div className="mt-[11px] font-sans text-[11px] leading-4 text-[#8F958D]">{totalBreakdown}</div>
          <div className="mt-3 font-display text-[44px] font-bold leading-[52px] text-accent tabular-nums">{totalValue}</div>
        </div>
      ) : (
        <div className="mt-5 flex items-center justify-between gap-8 rounded-lg bg-accent/[0.05] p-7 shadow-[0_0_0_1px_rgba(207,255,74,0.15)]">
          <div>
            <div className="font-sans text-xs uppercase leading-[15px] tracking-[2px] text-accent">{totalLabel}</div>
            <div className="mt-2 font-sans text-sm leading-5 text-muted-foreground">{totalBreakdown}</div>
          </div>
          <div className="font-display text-[64px] font-bold leading-[48px] text-accent tabular-nums">{totalValue}</div>
        </div>
      )}
    </div>
  );
};
