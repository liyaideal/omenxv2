import { useState, useMemo, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { MobileDrawerActions } from "@/components/ui/mobile-drawer";
import { Loader2 } from "lucide-react";

export interface ClosePositionFormProps {
  option: string;
  side: "long" | "short";
  size: number;
  entryPrice: number;
  markPrice: number;
  margin: number;
  fullCloseOnly?: boolean;
  onConfirm: (closeQty: number) => void | Promise<void>;
  /** Optional cancel handler. When provided, renders a Cancel button alongside the destructive CTA. */
  onCancel?: () => void;
  isClosing?: boolean;
  /** Show the header (option + side + contracts). Drawer/Dialog hides it since their title already conveys context. */
  showHeader?: boolean;
}

const QUICK_RATIOS = [25, 50, 75, 100] as const;

/**
 * Shared Close Position form used by both ClosePositionDrawer (mobile) and
 * ClosePositionDialog (desktop). Visual spec follows DESIGN.md §5.1
 * "MobileDrawer 内容规范" — single source of truth for cards / typography /
 * buttons, no per-context size branches.
 */
export const ClosePositionForm = ({
  option,
  side,
  size,
  entryPrice,
  markPrice,
  margin,
  fullCloseOnly = false,
  onConfirm,
  onCancel,
  isClosing = false,
  showHeader = true,
}: ClosePositionFormProps) => {
  const safeSize = Math.max(1, Math.floor(size));
  const [closeQty, setCloseQty] = useState<number>(safeSize);

  useEffect(() => {
    setCloseQty(safeSize);
  }, [safeSize]);

  const clampedQty = Math.min(safeSize, Math.max(1, Math.floor(closeQty || 0)));
  const ratio = safeSize > 0 ? clampedQty / safeSize : 0;
  const ratioPct = Math.round(ratio * 100);

  const { realizedPnl, releasedMargin, remaining } = useMemo(() => {
    const priceDiff = markPrice - entryPrice;
    const pnl = (side === "long" ? priceDiff : -priceDiff) * clampedQty;
    return {
      realizedPnl: pnl,
      releasedMargin: margin * ratio,
      remaining: safeSize - clampedQty,
    };
  }, [markPrice, entryPrice, side, clampedQty, margin, ratio, safeSize]);

  const isFull = clampedQty === safeSize;
  const pnlPositive = realizedPnl >= 0;
  const fmtUsd = (n: number) => `${n >= 0 ? "" : "-"}$${Math.abs(n).toFixed(2)}`;
  const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
  const pnlPctOnMargin = margin > 0 ? (realizedPnl / margin) * 100 : 0;

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="text-xs text-muted-foreground truncate">
          {option} · <span className="font-mono">{safeSize.toLocaleString()}</span> contracts
        </div>
      )}

      {!fullCloseOnly && (
        <>
          <div className="grid grid-cols-4 gap-1.5">
            {QUICK_RATIOS.map((r) => {
              const qty = r === 100 ? safeSize : Math.max(1, Math.round((safeSize * r) / 100));
              const active = qty === clampedQty;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setCloseQty(qty)}
                  className={`h-9 text-xs font-medium rounded-md transition-colors ${
                    active
                      ? "bg-trading-red/20 text-trading-red border border-trading-red/40"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent"
                  }`}
                >
                  {r}%
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5">
            <Slider
              min={1}
              max={safeSize}
              step={1}
              value={[clampedQty]}
              onValueChange={(v) => setCloseQty(v[0])}
            />
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Quantity</span>
              <span className="font-mono text-foreground">
                {clampedQty.toLocaleString()}{" "}
                <span className="text-muted-foreground">({ratioPct}%)</span>
              </span>
            </div>
          </div>
        </>
      )}

      <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Close price (mark)</span>
          <span className="font-mono text-foreground">${markPrice.toFixed(4)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Realized PnL</span>
          <span className={`font-mono ${pnlPositive ? "text-trading-green" : "text-trading-red"}`}>
            {pnlPositive ? "+" : ""}
            {fmtUsd(realizedPnl)}{" "}
            <span className="opacity-70">({fmtPct(pnlPctOnMargin)})</span>
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Released margin</span>
          <span className="font-mono text-foreground">${releasedMargin.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Remaining size</span>
          <span className="font-mono text-foreground">
            {remaining.toLocaleString()} contracts
          </span>
        </div>
      </div>

      <MobileDrawerActions>
        <div className="flex gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-11"
              onClick={onCancel}
              disabled={isClosing}
            >
              Cancel
            </Button>
          )}
          <Button
            type="button"
            onClick={() => onConfirm(clampedQty)}
            disabled={isClosing || clampedQty < 1}
            className="flex-1 h-11 bg-trading-red text-white hover:bg-trading-red/90 disabled:opacity-60"
          >
            {isClosing && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
            {isFull ? "Close all" : `Close ${clampedQty.toLocaleString()} contracts`}
          </Button>
        </div>
      </MobileDrawerActions>
    </div>
  );
};
