// ============================================================
// Small presentational blocks of the Lite contract page (/trade).
// Extracted verbatim from LiteContractTrade so the style-guide mounts the
// PRODUCTION markup instead of a hand copy. Pure display — no data access.
// ============================================================
import type { Ref, ReactNode } from "react";
import { ChevronRight, Info } from "lucide-react";
import { EmptyState } from "@/components/states";

/** Eyebrow (category / group summary) + question title + optional star slot. */
export const TradeHeading = ({
  eyebrow,
  title,
  headingRef,
  rightSlot,
}: {
  eyebrow: ReactNode;
  title: string;
  headingRef?: Ref<HTMLHeadingElement>;
  rightSlot?: ReactNode;
}) => (
  <div>
    <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
      {eyebrow}
    </div>
    <div className="mt-2 flex items-start justify-between gap-3">
      <h1
        ref={headingRef}
        className="font-display font-bold leading-[1.05] tracking-[-0.02em] text-foreground"
        style={{ fontSize: "clamp(24px, 3.5vw, 34px)" }}
      >
        {title}
      </h1>
      {rightSlot && <div className="shrink-0">{rightSlot}</div>}
    </div>
  </div>
);

/** ⓘ settle note. `body` is already stripped of the trailing pay-$1 sentence. */
export const TradeRuleCard = ({ body }: { body: string }) => (
  <div className="flex gap-3 rounded-2xl border border-border bg-card p-4 text-xs">
    <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
    <p className="text-muted-foreground">
      {body}{" "}
      Winning shares pay <span className="font-mono text-foreground">$1</span> each,
      credited automatically at settlement.
    </p>
  </div>
);

export interface MoreMarketRow {
  id: string;
  name: string;
  yesPct: number;
}

/** Sibling-markets rail ("More markets" / "Still live" when settled). */
export const TradeMoreMarkets = ({
  title,
  rows,
  onOpen,
}: {
  title: string;
  rows: MoreMarketRow[];
  onOpen: (id: string) => void;
}) => (
  <div className="rounded-2xl border border-border bg-card p-4">
    <div className="mb-3 text-sm font-medium">{title}</div>
    {rows.length === 0 ? (
      <EmptyState
        variant="module"
        bordered={false}
        title="No other markets right now"
        illustrationSrc="/assets/desktop/empty-no-boost.png"
        description="New markets show up here as they open."
        className="px-0 py-1"
      />
    ) : (
      <ul className="space-y-1">
        {rows.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => onOpen(m.id)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/40"
            >
              <span className="flex-1 truncate text-xs">{m.name}</span>
              <span className="font-mono text-xs font-semibold text-yes">
                {m.yesPct}%
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>
    )}
  </div>
);
