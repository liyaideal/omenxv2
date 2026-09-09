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
  className?: string;
}

export const BinarySideToggle = ({
  yesLabel,
  noLabel,
  yesPrice,
  noPrice,
  isYesSelected,
  onSelect,
  decimals = 4,
  className,
}: BinarySideToggleProps) => {
  const Segment = ({
    label,
    price,
    active,
    tone,
    onClick,
  }: {
    label: string;
    price: number;
    active: boolean;
    tone: "yes" | "no";
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      aria-pressed={active}
      className="relative flex flex-col rounded-md overflow-hidden transition-all"
    >
      <div
        className={cn(
          "flex-1 flex items-center justify-center min-h-[24px] py-1.5 px-2 text-[11px] font-semibold leading-tight",
          active
            ? tone === "yes"
              ? "bg-yes text-yes-foreground"
              : "bg-no text-no-foreground"
            : "bg-muted text-muted-foreground hover:bg-muted/80",
        )}
      >
        {label}
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
        {price.toFixed(decimals)}
      </div>
    </button>
  );

  return (
    <div className={cn("grid grid-cols-2 gap-2 p-1 bg-muted/30 rounded-lg", className)}>
      <Segment
        label={yesLabel}
        price={yesPrice}
        active={isYesSelected}
        tone="yes"
        onClick={() => onSelect("yes")}
      />
      <Segment
        label={noLabel}
        price={noPrice}
        active={!isYesSelected}
        tone="no"
        onClick={() => onSelect("no")}
      />
    </div>
  );
};
