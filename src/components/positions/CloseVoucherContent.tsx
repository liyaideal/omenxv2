import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileDrawerActions } from "@/components/ui/mobile-drawer";

const VOUCHER_LEVERAGE = 5;

export interface CloseVoucherContentProps {
  optionLabel: string;
  side: "long" | "short";
  entryPrice: number;
  markPrice: number;
  faceValue: number;
  redeemableCap?: number | null;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  isClosing?: boolean;
  /** Layout variant: dialog uses inline footer; drawer uses MobileDrawerActions container. */
  variant?: "dialog" | "drawer";
}

const fmtUsd = (n: number) =>
  `${n < 0 ? "-" : ""}$${Math.abs(n).toFixed(2)}`;

/**
 * Shared body for the Close Voucher Position confirmation dialog/drawer.
 * Mirrors the canonical math in supabase/functions/close-trial-position:
 *   contracts = faceValue × 5 / entry
 *   rawPnl    = (mark − entry) × contracts × sideSign
 *   credit    = clamp(rawPnl, 0, cap)
 *   cap       = redeemableCap ?? faceValue × 0.5
 */
export const CloseVoucherContent = ({
  optionLabel,
  side,
  entryPrice,
  markPrice,
  faceValue,
  redeemableCap,
  onConfirm,
  onCancel,
  isClosing = false,
  variant = "dialog",
}: CloseVoucherContentProps) => {
  const safeEntry = Math.max(entryPrice, 0.0001);
  const contracts = (faceValue * VOUCHER_LEVERAGE) / safeEntry;
  const sideSign = side === "short" ? -1 : 1;
  const rawPnl = (markPrice - entryPrice) * contracts * sideSign;
  const cap = redeemableCap != null ? redeemableCap : faceValue * 0.5;
  const credit = Math.max(0, Math.min(rawPnl, cap));

  const isDrawer = variant === "drawer";

  const Actions = (
    <>
      {onCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isClosing}
          className={isDrawer ? "flex-1 h-11" : "h-11"}
        >
          Cancel
        </Button>
      )}
      <Button
        type="button"
        onClick={() => onConfirm()}
        disabled={isClosing}
        className={`bg-trading-red text-white hover:bg-trading-red/90 ${isDrawer ? "flex-1 h-11" : "h-11"}`}
      >
        {isClosing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Closing…
          </>
        ) : (
          "Close position"
        )}
      </Button>
    </>
  );

  return (
    <div className="space-y-4">
      {/* Position summary */}
      <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Position</span>
          <span className={side === "long" ? "text-trading-green" : "text-trading-red"}>
            {optionLabel} · {VOUCHER_LEVERAGE}x
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Contracts</span>
          <span className="font-mono">{Math.round(contracts).toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Entry price</span>
          <span className="font-mono">${entryPrice.toFixed(4)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Mark price</span>
          <span className="font-mono">${markPrice.toFixed(4)}</span>
        </div>
      </div>

      {/* PnL preview */}
      <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Raw PnL</span>
          <span className={`font-mono ${rawPnl >= 0 ? "text-trading-green" : "text-trading-red"}`}>
            {fmtUsd(rawPnl)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Max profit</span>
          <span className="font-mono">${cap.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-sm font-medium pt-1 border-t border-border/40 mt-1">
          <span>Credited to voucher earnings pool</span>
          <span className={`font-mono ${credit > 0 ? "text-trading-green" : "text-muted-foreground"}`}>
            +${credit.toFixed(2)}
          </span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Profits accrue to your voucher earnings pool. Claim to wallet once your lifetime
        filled-trades volume reaches 50,000 USDC. Losses are floored at $0 — your wallet
        is never debited.
      </p>

      {isDrawer ? (
        <MobileDrawerActions>
          <div className="flex gap-2">{Actions}</div>
        </MobileDrawerActions>
      ) : (
        <div className="flex justify-end gap-2 pt-2">{Actions}</div>
      )}
    </div>
  );
};
