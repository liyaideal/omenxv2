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
  /** Side the user currently holds on this option, if any. */
  heldSide?: BoardSide | null;
  /** Sports game lines: chip words become the side labels ("KAL +1.5"). */
  yesChipLabel?: string;
  noChipLabel?: string;
}

interface Props {
  options: BoardOption[];
  volumeText: string;
  selectedId: string | null;
  selectedSide: BoardSide;
  onSelect: (optionId: string, side: BoardSide) => void;
  /** Called when an already-expanded desktop row is clicked again to collapse it. */
  onDeselect?: () => void;
  /** Mobile rows are denser and never open an inline order form. */
  compact?: boolean;
  /** Inline accordion chart under the selected row. Defaults to true. */
  showChart?: boolean;
  /** Rendered under every row's strip — the line scrubber on game lines. */
  renderFooter?: (option: BoardOption) => React.ReactNode;
  /** Suppresses the "What the crowd thinks" caption (group boards own it). */
  hideHeader?: boolean;
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
  onDeselect,
  compact = false,
  showChart = true,
  renderFooter,
  hideHeader = false,
  className,
}: Props) => {
  // Settled options sink to the BOTTOM of the board; live options keep their
  // natural event order, settled ones keep their own relative order.
  const ordered = [
    ...options.filter((o) => !o.settled),
    ...options.filter((o) => o.settled),
  ];
  return (
  <div className={cn("space-y-2", className)}>
    {!hideHeader && (
    <div className="flex items-end justify-between gap-3">
      <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        What the crowd thinks
      </div>
      <div className="shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
        {volumeText}
      </div>
    </div>
    )}

    <div className="space-y-2">
      {ordered.map((o) => {
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
                !compact && !o.settled && "cursor-pointer hover:bg-muted/10",
              )}
              onClick={() => {
                if (compact || o.settled) return;
                if (isSelected) {
                  onDeselect?.();
                } else {
                  onSelect(o.id, "yes");
                }
              }}
              // Inline borderWidth overrides the `border-b-0` class, so the
              // bottom border must be zeroed inline too when expanded —
              // otherwise a solid --yes/55 line sits between row and chart.
              style={{ borderWidth: 1.5, ...(expanded ? { borderBottomWidth: 0 } : {}) }}
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
                      label={o.yesChipLabel}
                      selected={isSelected && selectedSide === "yes"}
                      settled={!!o.settled}
                      onClick={() => onSelect(o.id, "yes")}
                    />
                    <Chip
                      side="no"
                      price={noPrice}
                      label={o.noChipLabel}
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
                    label={o.yesChipLabel}
                    selected={isSelected && selectedSide === "yes"}
                    settled={!!o.settled}
                    onClick={() => onSelect(o.id, "yes")}
                  />
                  <Chip
                    side="no"
                    price={noPrice}
                    label={o.noChipLabel}
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

              {renderFooter?.(o)}
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
};

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

/**
 * Board Yes/No capsule — the COMPACT named size of the Yes/No pair
 * (12.5px label, py-[9px]). The order panels ship the standard size
 * (shared/SideButton); this density is board-only and intentional.
 */
const Chip = ({
  side,
  price,
  label: labelOverride,
  selected,
  settled,
  onClick,
}: {
  side: BoardSide;
  price: number;
  /** Replaces the "Yes"/"No" word — sports game lines pass "KAL +1.5". */
  label?: string;
  selected: boolean;
  settled: boolean;
  onClick: () => void;
}) => {
  const sideLabel = labelOverride || (side === "yes" ? "Yes" : "No");
  const accent = side === "yes" ? "#33D6FF" : "#CFFF4A";
  const label = `${sideLabel} ${cents(price)}`;
  if (settled) {
    return (
      <span className="flex min-w-[86px] items-center justify-center rounded-[10px] border border-dashed border-muted-foreground/40 py-[9px] text-center font-mono text-[12.5px] font-bold text-muted-foreground">
        {label}
      </span>
    );
  }
  if (selected) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className={cn(
          "min-w-[86px] rounded-[10px] border border-transparent py-[9px] text-center font-mono text-[12.5px] font-bold transition-colors",
          side === "yes" ? "bg-yes text-[#04222c]" : "bg-no text-[#1a2408]",
        )}
      >
        {label}
      </button>
    );
  }
  // Tier-2 neutral at rest — neutral container, only the price is coloured.
  return (
    <button
      type="button"
      onClick={onClick}
      className="chip-t2 flex min-w-[86px] items-center justify-between gap-2 px-2.5 py-[9px] text-[12.5px]"
      style={{ borderRadius: 10, ["--chip-accent" as string]: accent }}
    >
      <span className="text-[11px] text-[#9AA1AC]">{sideLabel}</span>
      <span className="font-mono font-bold" style={{ color: accent }}>
        {cents(price)}
      </span>
    </button>
  );
};

export default LiteMarketBoard;