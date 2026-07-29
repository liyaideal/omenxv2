// ============================================================
// Lite "Cash out" flow — Dialog on desktop, MobileDrawer on mobile.
// Deliberately NOT a reuse of Pro's PositionCard / ClosePositionDrawer:
// those render terms from the Lite forbidden-word list. Cash math is not
// reinvented — 100% routes to closePosition, partial to partialClosePosition.
// ============================================================
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MobileDrawer, MobileDrawerActions } from "@/components/ui/mobile-drawer";
import { usePositions } from "@/hooks/usePositions";

const CHIPS = [25, 50, 100];

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  isMobile: boolean;
  positionId: string;
  positionIndex: number;
  /** Cash currently attached to this position (put in + live profit). */
  currentValue: number;
  sizeNum: number;
  sideLabel: string;
  onDone: () => void;
  /** Playground-only: initial slider position (defaults to 100%). */
  defaultPct?: number;
  /** Playground-only: pin the CTA in its submitting/disabled state. */
  forceBusy?: boolean;
}

export const LiteCashOutFlow = ({
  open,
  onOpenChange,
  isMobile,
  positionId,
  positionIndex,
  currentValue,
  sizeNum,
  sideLabel,
  onDone,
  defaultPct = 100,
  forceBusy = false,
}: Props) => {
  const { closePosition, partialClosePosition } = usePositions();
  const [pct, setPct] = useState(defaultPct);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setPct(defaultPct);
  }, [open, defaultPct]);

  const fraction = pct / 100;
  const payout = useMemo(
    () => Math.max(0, fraction * currentValue),
    [fraction, currentValue],
  );

  const confirm = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (pct >= 100) {
        await closePosition(positionId, positionIndex);
      } else {
        // Sizes are fractional — never round to whole shares and never floor
        // at 1. Clamp into (0, sizeNum] so 100% still routes to closePosition.
        const qty = Math.min(sizeNum, Math.max(Number.EPSILON, fraction * sizeNum));
        await partialClosePosition(positionId, positionIndex, qty);
      }
      toast.success(`Cashed out ≈ $${payout.toFixed(2)}`);
      onOpenChange(false);
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not cash out");
    } finally {
      setBusy(false);
    }
  };

  const body = (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/30 p-3">
        <div className="text-xs text-muted-foreground">
          Cashing out {pct}% of your {sideLabel} call.
        </div>
        <div className="mt-1 font-mono text-lg font-semibold text-foreground">
          You get back ≈ ${payout.toFixed(2)}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {CHIPS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setPct(c)}
            className={cn(
              "h-9 rounded-lg border font-mono text-xs font-semibold transition-colors",
              pct === c
                ? "border-transparent bg-foreground text-background"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {c}%
          </button>
        ))}
      </div>

      <input
        type="range"
        min={1}
        max={100}
        step={1}
        value={pct}
        onChange={(e) => setPct(Number(e.target.value))}
        aria-label="How much to cash out"
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border accent-yes"
      />
    </div>
  );

  const disabled = busy || forceBusy;
  const cta = (
    <Button className="h-11 w-full" disabled={disabled} onClick={confirm}>
      Cash out ≈ ${payout.toFixed(2)}
    </Button>
  );

  if (isMobile) {
    return (
      <MobileDrawer open={open} onOpenChange={onOpenChange} title="Cash out">
        {body}
        <MobileDrawerActions>
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {cta}
        </MobileDrawerActions>
      </MobileDrawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>Cash out</DialogTitle>
        </DialogHeader>
        {body}
        <div className="pt-2">{cta}</div>
      </DialogContent>
    </Dialog>
  );
};

export default LiteCashOutFlow;
