// ============================================================
// "Your call" card on the Lite contract page. Pure presentational — every
// figure is passed in, so the style-guide playground can drive all states.
// MONEY axis (trading-green/red) is used for profit only; MARKET axis
// (yes/no) only for the side identity in the header.
// ============================================================
import { cn } from "@/lib/utils";
import { ShareIconButton } from "@/components/lite/share/ShareIconButton";

interface Props {
  sideLabel: string;
  isYes: boolean;
  boost: number;
  putIn: number;
  nowWorth: number;
  profit: number;
  autoCloseText: string;
  /** Optional sub-line under the auto-close value. */
  autoCloseSub?: string;
  /** Price is within 10% of the auto-close level — render the value in red. */
  autoCloseHot?: boolean;
  compact?: boolean;
  /** When set, the Cash out button is disabled and shows this note instead. */
  cashOutDisabledText?: string;
  /** Style-guide fixture only (TR-12): mark the leg as voucher-funded.
   *  Production never passes this — pure display, no logic attached. */
  voucherTag?: boolean;
  onCashOut: () => void;
  /** Pure-display share entry (SH-b §1). Omitted = zero DOM change. */
  onShare?: () => void;

}

export const LitePositionCard = ({
  sideLabel,
  isYes,
  boost,
  putIn,
  nowWorth,
  profit,
  autoCloseText,
  autoCloseSub,
  autoCloseHot = false,
  compact = false,
  cashOutDisabledText,
  voucherTag = false,
  onCashOut,
  onShare,
}: Props) => {
  const heading = (
    <>
      <span className={isYes ? "text-yes" : "text-no"}>{sideLabel}</span>
      {boost > 1 && (
        <span className="text-foreground">
          {" · "}
          <span className="font-mono">{boost}×</span> Boost
        </span>
      )}
      {voucherTag && (
        <span className="text-foreground">
          {" · "}
          <span style={{ color: "#CFFF4A" }}>Voucher</span>
        </span>
      )}
    </>
  );

  return (
  <div className="rounded-2xl border border-border bg-card p-4">
    {onShare ? (
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-sm font-semibold">{heading}</div>
        <ShareIconButton onClick={onShare} />
      </div>
    ) : (
      <div className="mb-3 text-sm font-semibold">{heading}</div>
    )}

    <div
      className={cn(
        "grid gap-2 border-t border-border pt-3 text-xs",
        compact ? "grid-cols-2" : "grid-cols-4",
      )}
    >
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
        sub={autoCloseSub}
        tone={autoCloseHot ? "down" : undefined}
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
};


const PosCell = ({
  label,
  value,
  tone,
  sub,
}: {
  label: string;
  value: string;
  tone?: "up" | "down";
  sub?: string;
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
    {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
  </div>
);

export default LitePositionCard;