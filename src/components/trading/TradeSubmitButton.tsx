import { Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TradeSubmitButtonProps {
  side: "buy" | "sell" | string;
  label: string;
  potentialWin: number | string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  /**
   * Market-axis position side. When provided AND intent is BUY, the CTA
   * follows the market axis (Yes = Pulse Blue, No = Volt) instead of the
   * money-axis green/red. Reduce / Sell intents always stay on trading-red
   * so a "close" action never visually competes with the outcome color.
   */
  positionSide?: "yes" | "no";
  /**
   * Secondary readout prefix. Defaults to "To win"; Sell intents pass
   * "You receive". Purely a label — no layout change.
   */
  winPrefix?: string;
  /**
   * SP-2-FIX2: `"row"` (default, contract Pro unchanged) keeps label and
   * readout on one line. `"stacked"` puts the readout on a second line so
   * neither string can ever be truncated at 360 px.
   */
  layout?: "row" | "stacked";
}

/**
 * Unified trade CTA button.
 * Two-line layout: action label (Yes/No) + secondary "To win $X" mono readout.
 * Buy → trading-green, Sell → trading-red. Gradient + subtle shadow + hover lift.
 */
export const TradeSubmitButton = ({
  side,
  label,
  potentialWin,
  onClick,
  disabled,
  loading,
  loadingText = "Processing...",
  size = "md",
  className,
  positionSide,
  winPrefix = "To win",
  layout = "row",
}: TradeSubmitButtonProps) => {
  const isBuy = side === "buy";
  const stacked = layout === "stacked";
  const sizeClasses = stacked
    ? "h-12 px-3"
    : size === "sm" ? "py-2 px-3" : size === "lg" ? "py-3.5 px-4" : "py-2.5 px-4";
  const labelClass =
    size === "sm" ? "text-[13px]" : "text-sm";
  const winClass =
    size === "sm" ? "text-[10px]" : "text-[11px]";

  const win = typeof potentialWin === "number"
    ? potentialWin.toLocaleString()
    : potentialWin;

  // Market-axis palette for BUY intents; fall back to money-axis for SELL.
  const useYes = isBuy && positionSide === "yes";
  const useNo = isBuy && positionSide === "no";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "group relative w-full rounded-lg font-semibold transition-all duration-200",
        "active:scale-[0.98] hover:-translate-y-[1px]",
        "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0",
        "shadow-[0_4px_14px_-4px_hsl(var(--background))]",
        useYes
          ? "bg-gradient-to-b from-yes to-yes/85 text-yes-foreground hover:shadow-[0_8px_20px_-6px_hsl(var(--yes)/0.55)]"
          : useNo
          ? "bg-gradient-to-b from-no to-no/85 text-no-foreground hover:shadow-[0_8px_20px_-6px_hsl(var(--no)/0.55)]"
          : isBuy
          ? "bg-gradient-to-b from-trading-green to-trading-green/85 text-trading-green-foreground hover:shadow-[0_8px_20px_-6px_hsl(var(--trading-green)/0.55)]"
          : "bg-gradient-to-b from-trading-red to-trading-red/85 text-foreground hover:shadow-[0_8px_20px_-6px_hsl(var(--trading-red)/0.55)]",
        sizeClasses,
        className,
      )}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className={labelClass}>{loadingText}</span>
        </span>
      ) : stacked ? (
        <span className="flex flex-col items-start justify-center leading-tight">
          <span className="text-sm font-semibold whitespace-nowrap">{label}</span>
          <span className="flex items-center gap-1 text-[11px] font-mono opacity-85 whitespace-nowrap">
            {winPrefix} <span className="font-semibold">${win}</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </span>
      ) : (
        <span className="flex items-center justify-between gap-3">
          <span className={cn("flex-1 text-left truncate", labelClass)}>
            {label}
          </span>
          <span className="flex items-center gap-1.5 shrink-0 opacity-90">
            <span className={cn("font-mono tracking-tight", winClass)}>
              {winPrefix} <span className="font-semibold">${win}</span>
            </span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </span>
      )}
    </button>
  );
};
