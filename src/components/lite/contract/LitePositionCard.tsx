// ============================================================
// "Your call" card on the Lite contract page. Pure presentational — every
// figure is passed in, so the style-guide playground can drive all states.
// MONEY axis (trading-green/red) is used for profit only; MARKET axis
// (yes/no) only for the side identity in the header.
// ============================================================
import { cn } from "@/lib/utils";

interface Props {
  sideLabel: string;
  isYes: boolean;
  boost: number;
  putIn: number;
  nowWorth: number;
  profit: number;
  autoCloseText: string;
  compact?: boolean;
  /** When set, the Cash out button is disabled and shows this note instead. */
  cashOutDisabledText?: string;
  onCashOut: () => void;

}

export const LitePositionCard = ({
  sideLabel,
  isYes,
  boost,
  putIn,
  nowWorth,
  profit,
  autoCloseText,
  compact = false,
  cashOutDisabledText,
  onCashOut,
}: Props) => (

  <div className="rounded-2xl border border-border bg-card p-4">
    <div className="mb-3 text-sm font-semibold">
      <span className={isYes ? "text-yes" : "text-no"}>{sideLabel}</span>
      {boost > 1 && (
        <span className="text-foreground">
          {" · "}
          <span className="font-mono">{boost}×</span> Boost
        </span>
      )}
    </div>
    <div className="grid grid-cols-4 gap-2 border-t border-border pt-3 text-xs">
      <PosCell label="Put in" value={`$${putIn.toFixed(2)}`} />
      <PosCell label="Now worth" value={`$${nowWorth.toFixed(2)}`} />
      <PosCell
        label="Profit"
        value={`${profit >= 0 ? "+" : "−"}$${Math.abs(profit).toFixed(2)}`}
        tone={profit >= 0 ? "up" : "down"}
      />
      <PosCell
        label={compact ? "Auto-close" : "Est. auto-close"}
        value={autoCloseText}
      />
    </div>
    <div className="mt-3 border-t border-border pt-3">
      {cashOutDisabledText ? (
        <>
          <button
            type="button"
            disabled
            className="h-9 w-full rounded-lg bg-muted text-xs font-semibold opacity-50"
          >
            Cash out · <span className="font-mono">${nowWorth.toFixed(2)}</span>
          </button>
          <p className="mt-2 text-[11px] text-muted-foreground">{cashOutDisabledText}</p>
        </>
      ) : (
        <button
          type="button"
          onClick={onCashOut}
          className="h-9 w-full rounded-lg bg-muted text-xs font-semibold hover:bg-muted/80"
        >
          Cash out · <span className="font-mono">${nowWorth.toFixed(2)}</span>
        </button>
      )}
    </div>

  </div>
);

const PosCell = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "up" | "down";
}) => (
  <div>
    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    <div
      className={cn(
        "font-mono text-sm font-semibold",
        tone === "up"
          ? "text-trading-green"
          : tone === "down"
            ? "text-trading-red"
            : "text-foreground",
      )}
    >
      {value}
    </div>
  </div>
);

export default LitePositionCard;