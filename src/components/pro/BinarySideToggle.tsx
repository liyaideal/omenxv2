// ============================================================
// Shared Pro terminal atom — the two-layer binary side toggle.
// Extracted verbatim from the /spot panel (SP-1 · B1) so the futures
// terminal and the spot terminal can never drift apart again.
// Layer 1 = outcome label, layer 2 = live price. Colours follow the
// market axis (yes / no tokens), never the money axis.
// ============================================================
import { cn } from "@/lib/utils";

interface BinarySideToggleProps {
  yesLabel: string;
  noLabel: string;
  yesPrice: number;
  noPrice: number;
  isYesSelected: boolean;
  onSelect: (side: "yes" | "no") => void;
  /** Price decimals. Spot books quote to 4dp, futures to 2dp. */
  decimals?: number;
  /** Futures terminal shows a small glow dot on the active tile. */
  activeDot?: boolean;
  /** Greys out a tile and blocks interaction (Sell with nothing to sell). */
  disabledSide?: "yes" | "no" | "both";
  /** Overrides the bottom bar text (e.g. `0 sh` on an unheld side). */
  yesBarText?: string;
  noBarText?: string;
  className?: string;
}

// FIX5: `Segment` lives at module scope. Declaring it inside the component made
// it a brand-new component type on every render, so React unmounted/remounted
// both <button>s each render and a click could land between mousedown and
// mouseup. Markup and classes are unchanged.
const Segment = ({
  label,
  barText,
  active,
  tone,
  disabled,
  activeDot,
  onClick,
}: {
  label: string;
  barText: string;
  active: boolean;
  tone: "yes" | "no";
  disabled: boolean;
  activeDot: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    aria-pressed={active}
    disabled={disabled}
    className={cn(
      "relative flex flex-col h-full rounded-md overflow-hidden transition-all",
      disabled && "opacity-40 pointer-events-none",
    )}
  >
    <div
      className={cn(
        "relative flex-1 flex items-center justify-center min-h-[24px] py-1.5 px-2 text-[11px] font-semibold leading-tight line-clamp-2 text-center transition-colors",
        active
          ? tone === "yes"
            ? "bg-yes text-yes-foreground"
            : "bg-no text-no-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/80",
      )}
    >
      {label}
      {activeDot && active && (
        <span className="absolute top-1 right-1 w-1 h-1 rounded-full bg-current shadow-[0_0_4px_currentColor]" />
      )}
    </div>
    <div
      className={cn(
        "h-[22px] flex items-center justify-center text-[11px] font-mono border-t",
        active
          ? tone === "yes"
            ? "bg-yes/85 text-yes-foreground border-black/20"
            : "bg-no/85 text-no-foreground border-black/20"
          : "bg-muted-foreground/15 text-foreground/80 border-border/40",
      )}
    >
      {barText}
    </div>
  </button>
);

export const BinarySideToggle = ({
  yesLabel,
  noLabel,
  yesPrice,
  noPrice,
  isYesSelected,
  onSelect,
  decimals = 4,
  activeDot = false,
  disabledSide,
  yesBarText,
  noBarText,
  className,
}: BinarySideToggleProps) => {
  return (
    <div className={cn("grid grid-cols-2 gap-2 p-1 bg-muted/30 rounded-lg", className)}>
      <Segment
        label={yesLabel}
        barText={yesBarText ?? yesPrice.toFixed(decimals)}
        active={isYesSelected}
        tone="yes"
        disabled={disabledSide === "yes" || disabledSide === "both"}
        onClick={() => onSelect("yes")}
      />
      <Segment
        label={noLabel}
        barText={noBarText ?? noPrice.toFixed(decimals)}
        active={!isYesSelected}
        tone="no"
        disabled={disabledSide === "no" || disabledSide === "both"}
        onClick={() => onSelect("no")}
      />
    </div>
  );
};
