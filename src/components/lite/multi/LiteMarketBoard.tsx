// ============================================================
// Multi-market board — the selector AND the crowd view for events with
// 3+ options. Every option trades both sides independently, so each row
// carries its own Yes / No chips. Renders in place of LiteSentimentBar
// (binary-only) and in place of the standalone chart module: the selected
// row expands an inline accordion chart.
//
// Pure presentational — every figure is passed in so the style-guide
// playground can drive all states.
// ============================================================
import { cn } from "@/lib/utils";
import { LiteBoardChart } from "./LiteBoardChart";

export type BoardSide = "yes" | "no";

export interface BoardOption {
  id: string;
  label: string;
  /** 0..1 chance of this option resolving Yes. */
  yesPrice: number;
  /** Already settled ahead of the rest of the event. */
  settled?: boolean;
  /** Outcome of a settled option. */
  outcomeYes?: boolean;
  /** Side the user currently backs on this option, if any. */
  heldSide?: BoardSide | null;
}

interface Props {
  options: BoardOption[];
  volumeText: string;
  selectedId: string | null;
  selectedSide: BoardSide;
  onSelect: (optionId: string, side: BoardSide) => void;
  /** Mobile rows are denser and never open an inline order form. */
  compact?: boolean;
  /** Inline accordion chart under the selected row. Defaults to true. */
  showChart?: boolean;
  className?: string;
}

const cents = (p: number) => `${Math.round(p * 100)}¢`;
const pct = (p: number) => `${Math.max(1, Math.min(99, Math.round(p * 100)))}%`;

export const LiteMarketBoard = ({
  options,
  volumeText,
  selectedId,
  selectedSide,
  onSelect,
  compact = false,
  showChart = true,
  className,
}: Props) => (
  <div className={cn("space-y-2", className)}>
    <div className="flex items-end justify-between gap-3">
      <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {compact
          ? "What the crowd thinks"
          : "What the crowd thinks · back either side of any market"}
      </div>
      <div className="shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
        {volumeText}
      </div>
    </div>

    <div className="space-y-2">
      {options.map((o) => {
        const isSelected = !o.settled && selectedId === o.id;
        const expanded = isSelected && showChart;
        const noPrice = 1 - o.yesPrice;
        return (
          <div key={o.id}>
            <div
              className={cn(
                "border bg-[hsl(var(--card))] transition-colors",
                compact ? "px-3 pb-2.5 pt-2.5" : "px-4 pb-2.5 pt-3",
                expanded ? "rounded-t-[14px] border-b-0" : "rounded-[14px]",
                isSelected ? "border-yes/55" : "border-border",
                o.settled && "opacity-50",
              )}
              style={{ borderWidth: 1.5 }}
            >
              {compact ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate font-display text-[13.5px] font-semibold text-foreground">
                      {o.label}
                      {o.heldSide && <HoldChip side={o.heldSide} />}
                    </span>
                    {o.settled ? (
                      <SettledMark outcomeYes={!!o.outcomeYes} />
                    ) : (
                      <span className="shrink-0 font-mono text-[15px] font-bold text-yes">
                        {pct(o.yesPrice)}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Chip
                      side="yes"
                      price={o.yesPrice}
                      selected={isSelected && selectedSide === "yes"}
                      settled={!!o.settled}
                      onClick={() => onSelect(o.id, "yes")}
                    />
                    <Chip
                      side="no"
                      price={noPrice}
                      selected={isSelected && selectedSide === "no"}
                      settled={!!o.settled}
                      onClick={() => onSelect(o.id, "no")}
                    />
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3">
                  <span className="min-w-0 font-display text-[15.5px] font-semibold leading-tight text-foreground">
                    {o.label}
                    {o.heldSide && <HoldChip side={o.heldSide} />}
                  </span>
                  {o.settled ? (
                    <div className="min-w-[74px] text-right">
                      <SettledMark outcomeYes={!!o.outcomeYes} stacked />
                    </div>
                  ) : (
                    <div className="min-w-[74px] text-right">
                      <div className="font-mono text-[17px] font-bold leading-none text-yes">
                        {pct(o.yesPrice)}
                      </div>
                      <div className="mt-1 text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">
                        Chance
                      </div>
                    </div>
                  )}
                  <Chip
                    side="yes"
                    price={o.yesPrice}
                    selected={isSelected && selectedSide === "yes"}
                    settled={!!o.settled}
                    onClick={() => onSelect(o.id, "yes")}
                  />
                  <Chip
                    side="no"
                    price={noPrice}
                    selected={isSelected && selectedSide === "no"}
                    settled={!!o.settled}
                    onClick={() => onSelect(o.id, "no")}
                  />
                </div>
              )}

              {/* Dual-tone strip — INSET within the row padding, rounded ends.
                  Never full-bleed. */}
              {!o.settled && (
                <div
                  className="mt-2.5 flex w-full overflow-hidden rounded-full"
                  style={{ height: compact ? 3 : 4 }}
                  aria-hidden
                >
                  <div
                    style={{
                      width: `${Math.max(1, Math.min(99, o.yesPrice * 100))}%`,
                      background: "hsl(var(--yes) / 0.75)",
                    }}
                  />
                  <div className="flex-1" style={{ background: "hsl(var(--no) / 0.4)" }} />
                </div>
              )}
            </div>

            {/* Inline accordion chart — exactly one row open at a time. */}
            <div
              className="overflow-hidden transition-all duration-300"
              style={{ maxHeight: expanded ? (compact ? 170 : 240) : 0 }}
            >
              {expanded && (
                <div
                  className="rounded-b-[14px] border border-t-0 border-yes/55 bg-[#0C1216] pt-1.5"
                  style={{ borderWidth: 1.5, borderTopWidth: 0 }}
                >
                  {/* NO divider line of any kind between row and chart (desktop
                      or compact). The boundary is expressed only by the shared
                      --yes/55 side borders, the darker panel background and the
                      ~6px of extra top padding here. */}
                  <LiteBoardChart
                    sideLabel={selectedSide === "yes" ? "Yes" : "No"}
                    isYes={selectedSide === "yes"}
                    chance={selectedSide === "yes" ? o.yesPrice : 1 - o.yesPrice}
                    seedKey={`${o.id}-${selectedSide}`}
                    height={compact ? 150 : 220}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const HoldChip = ({ side }: { side: BoardSide }) => (
  <span
    className={cn(
      "ml-2 inline-flex translate-y-[-1px] items-center rounded-full border px-1.5 py-[1px] align-middle text-[9.5px] font-semibold",
      side === "yes" ? "border-yes/45 text-yes" : "border-no/45 text-no",
    )}
  >
    You hold {side === "yes" ? "Yes" : "No"}
  </span>
);

const SettledMark = ({
  outcomeYes,
  stacked,
}: {
  outcomeYes: boolean;
  stacked?: boolean;
}) => (
  <div className={stacked ? "" : "text-right"}>
    <div className="text-[13px] font-semibold leading-none text-muted-foreground">Settled</div>
    <div className="mt-1 text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">
      Outcome: {outcomeYes ? "Yes" : "No"}
    </div>
  </div>
);

const Chip = ({
  side,
  price,
  selected,
  settled,
  onClick,
}: {
  side: BoardSide;
  price: number;
  selected: boolean;
  settled: boolean;
  onClick: () => void;
}) => {
  const label = `${side === "yes" ? "Yes" : "No"} ${cents(price)}`;
  if (settled) {
    return (
      <span className="flex min-w-[86px] items-center justify-center rounded-[10px] border border-dashed border-muted-foreground/40 py-[9px] text-center font-mono text-[12.5px] font-bold text-muted-foreground">
        {label}
      </span>
    );
  }
  const cls = selected
    ? side === "yes"
      ? "bg-yes text-[#04222c] border-transparent"
      : "bg-no text-[#1a2408] border-transparent"
    : side === "yes"
      ? "bg-yes/12 text-yes border-yes/25 hover:bg-yes/20"
      : "bg-no/12 text-no border-no/25 hover:bg-no/20";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-w-[86px] rounded-[10px] border py-[9px] text-center font-mono text-[12.5px] font-bold transition-colors",
        cls,
      )}
    >
      {label}
    </button>
  );
};

export default LiteMarketBoard;