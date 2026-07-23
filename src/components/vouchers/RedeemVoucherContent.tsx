import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePositionVouchers, type PositionVoucher } from "@/hooks/usePositionVouchers";
import { EventPickerList, type PickedOption } from "./EventPickerList";

interface RedeemVoucherContentProps {
  voucher: PositionVoucher;
  onClose?: () => void;
  /** dialog/drawer wrap actions in a footer; `inline` renders directly on the page */
  variant?: "dialog" | "drawer" | "inline";
}

export const RedeemVoucherContent = ({ voucher, onClose, variant = "dialog" }: RedeemVoucherContentProps) => {
  const [picked, setPicked] = useState<PickedOption | null>(null);
  const { redeem, isRedeeming } = usePositionVouchers();
  const navigate = useNavigate();
  const stickyBarRef = useRef<HTMLDivElement | null>(null);

  const cap = voucher.faceValue * voucher.redeemableCapPct;
  const size = picked ? voucher.faceValue / picked.price : 0;
  const isInline = variant === "inline";

  // When user picks an option in inline mode, scroll the sticky action bar into view.
  // On mobile we offset by the fixed BottomNav (~88px) so the bar isn't hidden behind it.
  useEffect(() => {
    if (!isInline || !picked) return;
    const el = stickyBarRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const bottomNavOffset = window.matchMedia("(max-width: 767px)").matches ? 96 : 16;
      const targetBottom = window.innerHeight - bottomNavOffset;
      const delta = rect.bottom - targetBottom;
      if (delta > 0) {
        window.scrollBy({ top: delta + 8, behavior: "smooth" });
      }
    });
  }, [picked?.optionId, picked?.side, isInline]);


  const handleSubmit = async () => {
    if (!picked) return;
    const res = await redeem(voucher.id, picked.eventId, picked.optionId, picked.side);
    if (res.success) {
      onClose?.();
      navigate(`/trade?event=${picked.eventId}`);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {!isInline && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Voucher code</span>
            <span className="font-mono">{voucher.code}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-muted-foreground">Face value</span>
            <span className="font-mono text-trading-green">${voucher.faceValue.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Max profit</span>
            <span className="font-mono">${cap.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Hold window</span>
            <span className="font-mono">{voucher.maxHoldingHours}h</span>
          </div>
        </div>
      )}

      <div>
        <div className="text-sm font-medium mb-2">Pick a market</div>
        <EventPickerList voucher={voucher} selected={picked} onSelect={setPicked} />
      </div>

      {!isInline && picked && (
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5">
          <div className="text-xs font-medium text-foreground">{picked.eventName}</div>
          <div className="text-xs text-muted-foreground">
            {picked.isBinary ? (
              <span className={picked.optionLabel.trim().toLowerCase() === "yes" ? "text-trading-green" : "text-trading-red"}>
                {picked.displayLabel}
              </span>
            ) : (
              <>
                {picked.optionLabel} ·{" "}
                <span className={picked.side === "long" ? "text-trading-green" : "text-trading-red"}>
                  {picked.side === "long" ? "Yes" : "No"}
                </span>
              </>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
            <div>
              <div className="text-[10px] text-muted-foreground">Entry</div>
              <div className="font-mono">${picked.price.toFixed(4)}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground">Size</div>
              <div className="font-mono">{size.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground">Max profit</div>
              <div className="font-mono text-trading-green">${cap.toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}

      {!isInline && (
        <div className="flex items-start gap-2 text-[11px] text-muted-foreground rounded-md bg-muted/30 p-2.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-trading-yellow" />
          <span>
            Profits are capped at ${cap.toFixed(2)}; losses don't affect your balance.
          </span>
        </div>
      )}

      {!isInline && (
        <div className={variant === "drawer" ? "flex gap-2 pt-2" : "flex justify-end gap-2 pt-2"}>
          <Button variant="outline" onClick={onClose} className={variant === "drawer" ? "flex-1 h-11" : ""}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!picked || isRedeeming}
            className={variant === "drawer" ? "flex-1 h-11" : ""}
          >
            {isRedeeming ? "Redeeming..." : "Confirm & open position"}
          </Button>
        </div>
      )}

      {isInline && (
        <div ref={stickyBarRef} className="sticky bottom-[88px] md:bottom-0 z-10 -mx-4 md:-mx-5 -mb-4 md:-mb-5 px-4 md:px-5 py-3 bg-background/95 backdrop-blur border-t border-border rounded-b-xl scroll-mt-4 scroll-mb-4">
          {picked ? (
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-xs text-foreground truncate">
                  <span className="font-medium">{picked.eventName}</span>
                  {picked.isBinary ? (
                    <>
                      <span className="text-muted-foreground"> · </span>
                      <span className={picked.optionLabel.trim().toLowerCase() === "yes" ? "text-trading-green" : "text-trading-red"}>
                        {picked.displayLabel}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-muted-foreground"> · {picked.optionLabel} · </span>
                      <span className={picked.side === "long" ? "text-trading-green" : "text-trading-red"}>
                        {picked.side === "long" ? "Yes" : "No"}
                      </span>
                    </>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 font-mono tabular-nums">
                  <span>Entry ${picked.price.toFixed(4)}</span>
                  <span>Size {size.toFixed(2)}</span>
                  <span className="text-trading-green">Max profit ${cap.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 md:shrink-0">
                <Button variant="ghost" size="sm" onClick={() => setPicked(null)}>
                  Reset
                </Button>
                <Button onClick={handleSubmit} disabled={isRedeeming} className="flex-1 md:flex-none h-10 md:h-9">
                  {isRedeeming ? "Redeeming..." : "Confirm & open position"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-3">
              <span className="text-xs text-muted-foreground">
                Select an outcome on a market above to continue.
              </span>
              <Button disabled className="w-full md:w-auto h-10 md:h-9">Confirm & open position</Button>

            </div>
          )}
        </div>
      )}
    </div>
  );
};
