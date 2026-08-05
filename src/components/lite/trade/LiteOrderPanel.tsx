// ============================================================
// Lite spot Order panel — used both as the desktop rail card AND
// as the body of the mobile buy-drawer. `variant` picks framing.
//
// P0 guardrails (see docs/changelog/2026-07-23-r3b1-lite-spot-trade.md):
//   1. Snapshot execution price into a `const` at submit — never re-read
//      the live price during the async call.
//   2. Cash leg mirrors SpotTrading: switch on the returned balanceDelta.
// ============================================================
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SideButton } from "@/components/lite/shared/SideButton";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { executeSpotTrade } from "@/services/tradingService";

type Side = "yes" | "no";

export interface LiteOrderPanelProps {
  eventName: string;
  eventId: string;
  countdownText: string;
  yesLabel: string;
  noLabel: string;
  yesPrice: number; // 0..1
  noPrice: number;
  yesOptionId: string;
  noOptionId: string;
  yesOptionLabel: string; // raw DB label
  noOptionLabel: string;
  blocked: boolean;
  blockedReason?: string;
  side: Side;
  onSideChange: (s: Side) => void;
  /** When true, the panel does not render its own Up/Down side buttons. */
  hideSideSelector?: boolean;
  amount: string;
  onAmountChange: (v: string) => void;
  onFilled?: () => void; // e.g. close drawer, refresh positions
  variant: "desktop" | "mobile"; // framing only
  onRequestAuth: () => void;
}

// Slippage cap for marketable-limit execution (matches SpotTrading default).
const SLIPPAGE_BPS = 50;

const PRESETS = [10, 25, 50, 100];

const money = (n: number) => `$${n.toFixed(2)}`;

export const LiteOrderPanel = (props: LiteOrderPanelProps) => {
  const {
    eventName,
    eventId,
    countdownText,
    yesLabel,
    noLabel,
    yesPrice,
    noPrice,
    yesOptionId,
    noOptionId,
    yesOptionLabel,
    noOptionLabel,
    blocked,
    blockedReason,
    side,
    onSideChange,
    hideSideSelector = false,
    amount,
    onAmountChange,
    onFilled,
    variant,
    onRequestAuth,
  } = props;

  const { user } = useAuth();
  const { spotBalance, deductSpotBalance, addSpotBalance } = useUserProfile();
  const [submitting, setSubmitting] = useState(false);

  const sidePrice = side === "yes" ? yesPrice : noPrice;
  const sideLabel = side === "yes" ? yesLabel : noLabel;
  const amountNum = useMemo(() => {
    const n = parseFloat(amount);
    return isFinite(n) && n > 0 ? n : 0;
  }, [amount]);

  // Shares user would receive at the current side price.
  const shares = sidePrice > 0 ? Math.floor(amountNum / sidePrice) : 0;
  const potentialProceeds = shares; // each winning share pays $1
  const potentialProfit = Math.max(0, potentialProceeds - amountNum);

  const handlePreset = useCallback(
    (v: number | "max") => {
      const target = v === "max" ? Math.floor(spotBalance) : v;
      if (!isFinite(target) || target <= 0) return;
      onAmountChange(String(target));
    },
    [onAmountChange, spotBalance],
  );

  const handleSubmit = useCallback(async () => {
    if (!user) return onRequestAuth();
    if (blocked) return toast.error(blockedReason || "Market unavailable");
    if (amountNum <= 0) return toast.error("Enter an amount");
    if (amountNum > spotBalance) return toast.error("Not enough balance — add funds to continue");

    // P0 #1 — snapshot the execution price at submit time. Never re-read
    // sidePrice / yesPrice / noPrice inside the async handler below.
    const priceSnapshot = Math.min(
      0.9999,
      Math.max(0.0001, sidePrice * (1 + SLIPPAGE_BPS / 10_000)),
    );
    const qtySnapshot = Math.floor(amountNum / priceSnapshot);
    if (qtySnapshot <= 0) return toast.error("Amount too small to buy 1 share");

    const optionIdSnapshot = side === "yes" ? yesOptionId : noOptionId;
    const optionLabelSnapshot = side === "yes" ? yesOptionLabel : noOptionLabel;

    setSubmitting(true);
    try {
      const res = await executeSpotTrade(user.id, {
        eventName,
        optionLabel: optionLabelSnapshot,
        optionId: optionIdSnapshot,
        side: "buy",
        price: priceSnapshot,
        quantity: qtySnapshot,
      });

      // P0 #2 — cash leg exactly as SpotTrading applies it.
      if (res.balanceDelta < 0) await deductSpotBalance(-res.balanceDelta);
      else if (res.balanceDelta > 0) await addSpotBalance(res.balanceDelta);

      toast.success(`Bought ${qtySnapshot} shares · ${sideLabel}`);
      onAmountChange("");
      onFilled?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Trade failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }, [
    user,
    blocked,
    blockedReason,
    amountNum,
    spotBalance,
    sidePrice,
    side,
    yesOptionId,
    noOptionId,
    yesOptionLabel,
    noOptionLabel,
    eventName,
    sideLabel,
    deductSpotBalance,
    addSpotBalance,
    onAmountChange,
    onFilled,
    onRequestAuth,
  ]);

  const cta =
    side === "yes"
      ? "bg-gradient-to-r from-yes to-[#5FE0FF] text-[#04222c] hover:brightness-105"
      : "bg-gradient-to-r from-no to-[#E4FF88] text-[#1a2408] hover:brightness-105";

  const wrapClass =
    variant === "desktop"
      ? "space-y-4 rounded-2xl border border-border bg-card p-5"
      : "space-y-4";

  return (
    <div className={wrapClass}>
      {variant === "desktop" && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Place your order</h3>
          <span className="font-mono text-[11px] text-muted-foreground">
            {countdownText} left
          </span>
        </div>
      )}

      {/* YOUR CALL */}
      {!hideSideSelector && (
        <div className="space-y-2">
          <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Your call
          </div>
          <div className="grid grid-cols-2 gap-2">
            <SideButton
              active={side === "yes"}
              tone="yes"
              label={yesLabel}
              price={yesPrice}
              onClick={() => onSideChange("yes")}
            />
            <SideButton
              active={side === "no"}
              tone="no"
              label={noLabel}
              price={noPrice}
              onClick={() => onSideChange("no")}
            />
          </div>
        </div>
      )}

      {/* HOW MUCH */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            How much
          </div>
          <div className="font-mono text-[11px] text-muted-foreground">
            Balance {money(spotBalance)}
          </div>
        </div>
        <div className="rounded-xl bg-muted/40 p-3">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-foreground">$</span>
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              placeholder="0"
              className="w-full bg-transparent font-mono text-2xl font-bold text-foreground outline-none placeholder:text-muted-foreground/40"
            />
          </div>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {PRESETS.map((p) => {
            const active = amountNum === p;
            const winAt = sidePrice > 0 ? Math.floor(p / sidePrice) : 0;
            return (
              <button
                key={p}
                type="button"
                onClick={() => handlePreset(p)}
                className={cn(
                  "flex flex-col items-center justify-center rounded-lg border py-1.5 text-[11px] transition-colors",
                  active
                    ? "border-transparent bg-white text-[#0A0B0D]"
                    : "border-border bg-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="font-mono font-semibold">${p}</span>
                <span
                  className={cn(
                    "text-[9px]",
                    active ? "text-[#0A0B0D]/70" : "text-muted-foreground",
                  )}
                >
                  win ${winAt}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => handlePreset("max")}
            className="rounded-lg border border-border py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Max
          </button>
        </div>
      </div>

      {/* Payout summary */}
      <div className="space-y-1.5 rounded-xl border border-border bg-muted/20 p-3 text-xs">
        <SummaryRow
          label="Max loss · what you pay"
          value={money(amountNum)}
        />
        <div
          className={cn(
            "flex items-center justify-between rounded-lg px-2 py-1.5",
            side === "yes" ? "bg-yes/5 text-yes" : "bg-no/5 text-no",
          )}
        >
          <span className="text-muted-foreground">
            You get if right · {shares.toLocaleString()} × $1
          </span>
          <span className="font-mono font-semibold">{money(potentialProceeds)}</span>
        </div>
        <SummaryRow
          label="Potential profit"
          value={money(potentialProfit)}
          valueClass={side === "yes" ? "text-yes" : "text-no"}
        />
      </div>

      {/* CTA */}
      <button
        type="button"
        disabled={submitting || blocked}
        onClick={handleSubmit}
        className={cn(
          "flex h-14 w-full flex-col items-center justify-center rounded-xl font-display font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50",
          cta,
        )}
      >
        <span className="text-sm leading-tight">
          {blocked ? blockedReason || "Market closed" : `Buy ${sideLabel}`}
        </span>
        {!blocked && (
          <span className="text-[11px] font-medium leading-tight opacity-80">
            To win {money(potentialProceeds)} →
          </span>
        )}
      </button>
      <p className="text-center text-[10px] text-muted-foreground">
        Buys instantly at the current price (within 0.5%)
      </p>

      {/* eventId retained for potential deep-linking; keep referenced */}
      <span className="hidden" data-event-id={eventId}>{""}</span>
    </div>
  );
};

// SideButton is the shared order-panel primitive (see shared/SideButton).

const SummaryRow = ({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) => (
  <div className="flex items-center justify-between px-2">
    <span className="text-muted-foreground">{label}</span>
    <span className={cn("font-mono font-semibold text-foreground", valueClass)}>{value}</span>
  </div>
);

export default LiteOrderPanel;