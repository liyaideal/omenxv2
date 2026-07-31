// ============================================================
// Lite contract (Boost) order card — desktop rail card AND the body
// of the mobile buy drawer (`variant` only changes framing).
//
// P0 guardrails:
//   1. Execution price is snapshotted into a const at submit; the async
//      handler never re-reads the live price.
//   2. Cash leg mirrors Pro: executeTrade() → res.balanceDelta →
//      deductBalance(Math.abs(delta)) / addBalance(delta). No self-math.
//   4. No dynamic Tailwind class strings.
// ============================================================
import { useCallback, useMemo, useState } from "react";
import { Info } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useRealtimeRiskMetrics } from "@/hooks/useRealtimeRiskMetrics";
import { executeTrade } from "@/services/tradingService";
import { estimateAutoClosePrice, formatCents } from "@/lib/autoClosePrice";
import { LiteBoostSelector } from "./LiteBoostSelector";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Side = "yes" | "no";

const FEE_RATE = 0.0005;
const PRESETS = [10, 25, 50, 100];
const money = (n: number) => `$${n.toFixed(2)}`;

export interface LiteContractOrderPanelProps {
  eventName: string;
  yesLabel: string;
  noLabel: string;
  yesPrice: number;
  noPrice: number;
  yesOptionId: string;
  noOptionId: string;
  yesOptionLabel: string;
  noOptionLabel: string;
  blocked: boolean;
  blockedReason?: string;
  side: Side;
  onSideChange: (s: Side) => void;
  amount: string;
  onAmountChange: (v: string) => void;
  boost: number;
  onBoostChange: (v: number) => void;
  boostEnabled: boolean;
  /** Config still loading — reserve an equal-height slot so the module
   *  never "pops in" and shoves the CTA down. */
  boostLoading?: boolean;
  boostMax: number;
  boostTiers: number[];
  countdownText: string;
  variant: "desktop" | "mobile";
  /** Consumer label of the side the user currently holds on this event, if
   *  any. When the selected side is the other one, the buy nets it down. */
  heldSideLabel?: string | null;
  /** Live cash value (put in + PnL) of that held side. Used only to soften the
   *  client-side balance pre-check when the buy nets the held leg down — the
   *  engine remains the final authority on funds. */
  heldCurrentValue?: number | null;
  /** Share quantity of that held opposite leg. The engine nets by SHARE
   *  QUANTITY (tryNetBinaryOppositeLeg), not by dollars, so every netting
   *  estimate below is derived from this. Without it we show no number. */
  heldQty?: number | null;
  /** Multi-market events: the option the side buttons are bound to. Shown
   *  above the side buttons so the rail always names the selected market. */
  marketContextLabel?: string | null;
  /** Multi-option events: the No side is submitted as a SELL on the SAME
   *  option (stored as a short), which is what lets the engine net the two
   *  sides against each other. Binary events leave this false and keep
   *  buying the opposite option. */
  noAsSell?: boolean;
  /** Suffix for the netting notice, e.g. "on this market". */
  nettingScopeLabel?: string;
  /** INTERIM GUARD (multi events): set when the user already backs the other
   *  side of THIS option. Disables submit and shows the notice verbatim.
   *  Remove once the engine's per-option netting extension ships. */
  blockNotice?: string | null;
  onFilled?: () => void;
  onRequestAuth: () => void;
}

export const LiteContractOrderPanel = (props: LiteContractOrderPanelProps) => {
  const {
    eventName,
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
    amount,
    onAmountChange,
    boost,
    onBoostChange,
    boostEnabled,
    boostLoading,
    boostMax,
    boostTiers,
    countdownText,
    variant,
    heldSideLabel,
    heldCurrentValue,
    heldQty,
    marketContextLabel,
    noAsSell,
    nettingScopeLabel,
    blockNotice,
    onFilled,
    onRequestAuth,
  } = props;

  const { user } = useAuth();
  const { balance, deductBalance, addBalance } = useUserProfile();
  const risk = useRealtimeRiskMetrics();
  const [submitting, setSubmitting] = useState(false);

  const effBoost = boostEnabled ? boost : 1;
  const sidePrice = side === "yes" ? yesPrice : noPrice;
  const sideLabel = side === "yes" ? yesLabel : noLabel;
  const oppositeLabel = side === "yes" ? noLabel : yesLabel;
  const isNetting = !!heldSideLabel && heldSideLabel !== sideLabel;

  const amountNum = useMemo(() => {
    const n = parseFloat(amount);
    return isFinite(n) && n > 0 ? n : 0;
  }, [amount]);

  // Math copied verbatim from the Pro contract path.
  const notional = amountNum * effBoost;
  const fee = notional * FEE_RATE;
  const quantity = sidePrice > 0 ? notional / sidePrice : 0;
  const potentialWin = (1 - sidePrice) * quantity;

  // Netting display math — mirrors the engine, which nets by SHARE QUANTITY
  // (qtyToNet = min(orderQty, oppositeQty)). A dollar-for-dollar model diverges
  // badly once Boost is involved. Estimates only; the engine is authoritative.
  const heldValue = isNetting ? Math.max(0, heldCurrentValue ?? 0) : 0;
  const heldQtyNum = isNetting ? Math.max(0, heldQty ?? 0) : 0;
  const canEstimateNet = isNetting && heldQtyNum > 0;
  const qtyNet = canEstimateNet ? Math.min(quantity, heldQtyNum) : 0;
  const getBack = canEstimateNet ? heldValue * (qtyNet / heldQtyNum) : 0;
  const remainderQty = canEstimateNet ? Math.max(0, quantity - qtyNet) : 0;
  const remainderWin = (1 - sidePrice) * remainderQty;
  const isPartialNet = canEstimateNet && remainderQty > 0;
  const remainderMarginEst = effBoost > 0 ? (remainderQty * sidePrice) / effBoost : 0;
  const remainderFee = remainderMarginEst * effBoost * FEE_RATE;

  const autoClose = useMemo(
    () =>
      estimateAutoClosePrice({
        entryPrice: sidePrice,
        boost: effBoost,
        amount: amountNum,
        fee,
        quantity,
        hasOtherPositions: risk.hasPositions,
        imTotalOther: risk.imTotal,
        totalAssets: risk.totalAssets,
        unrealizedPnLOther: risk.unrealizedPnL,
        mode: "new",
      }),
    [sidePrice, effBoost, amountNum, fee, quantity, risk],
  );

  // Reinforcement: when the order flips (partial net), the freshly opened leg
  // stands on the remainder's margin alone — disclose ITS auto-close, not the
  // full-order one.
  const remainderAutoClose = useMemo(
    () =>
      isPartialNet
        ? estimateAutoClosePrice({
            entryPrice: sidePrice,
            boost: effBoost,
            amount: remainderMarginEst,
            fee: remainderFee,
            quantity: remainderQty,
            hasOtherPositions: risk.hasPositions,
            imTotalOther: risk.imTotal,
            totalAssets: risk.totalAssets,
            unrealizedPnLOther: risk.unrealizedPnL,
            mode: "new",
          })
        : null,
    [
      isPartialNet,
      sidePrice,
      effBoost,
      remainderMarginEst,
      remainderFee,
      remainderQty,
      risk,
    ],
  );

  const handleSubmit = useCallback(async () => {
    if (!user) return onRequestAuth();
    if (blockNotice) return toast.error(blockNotice);
    if (blocked) return toast.error(blockedReason || "Market unavailable");
    if (amountNum <= 0) return toast.error("Enter an amount");
    // When netting, the held leg's cash comes back first, so only the
    // shortfall has to be funded from the wallet.
    // Same quantity model as the display: the netted shares refund cash, the
    // remainder only needs its own margin. Conservative estimate — the engine
    // is the final authority on funds.
    const remainderMargin =
      effBoost > 0 ? (remainderQty * sidePrice) / effBoost : 0;
    const cashNeeded = canEstimateNet
      ? Math.max(0, remainderMargin - getBack)
      : amountNum;
    if (cashNeeded + fee > balance)
      return toast.error("Not enough balance — add funds to continue");

    // P0 #1 — snapshot everything price-derived at click time.
    const priceSnapshot = sidePrice;
    const boostSnapshot = effBoost;
    const amountSnapshot = amountNum;
    const notionalSnapshot = amountSnapshot * boostSnapshot;
    const qtySnapshot = notionalSnapshot / priceSnapshot;
    const feeSnapshot = notionalSnapshot * FEE_RATE;
    const optionIdSnapshot = side === "yes" ? yesOptionId : noOptionId;
    const optionLabelSnapshot = side === "yes" ? yesOptionLabel : noOptionLabel;
    // Multi events: No is a SELL on the same option so the engine nets it.
    const orderSideSnapshot: "buy" | "sell" =
      noAsSell && side === "no" ? "sell" : "buy";
    if (!(qtySnapshot > 0)) return toast.error("Amount too small");

    setSubmitting(true);
    try {
      const res = await executeTrade(user.id, {
        eventName,
        optionLabel: optionLabelSnapshot,
        optionId: optionIdSnapshot,
        side: orderSideSnapshot,
        orderType: "Market",
        price: priceSnapshot,
        amount: amountSnapshot,
        quantity: qtySnapshot,
        leverage: boostSnapshot,
        margin: amountSnapshot,
        fee: feeSnapshot,
      });

      // P0 #2 — cash leg exactly as the Pro path applies it.
      if (res.balanceDelta < 0) {
        const ok = await deductBalance(Math.abs(res.balanceDelta));
        if (!ok) throw new Error("Failed to update balance");
      } else if (res.balanceDelta > 0) {
        await addBalance(res.balanceDelta);
      }

      if (res.intent === "reduce" || res.intent === "close") {
        toast.success(
          res.balanceDelta > 0
            ? `Cashed out ${heldSideLabel ?? oppositeLabel} · ${money(res.balanceDelta)} back`
            : `Cashed out ${heldSideLabel ?? oppositeLabel}`,
        );
      } else {
        toast.success(`Backed ${sideLabel} · ${money(amountSnapshot)}`);
      }
      onAmountChange("");
      onFilled?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not place that");
    } finally {
      setSubmitting(false);
    }
  }, [
    user,
    blocked,
    blockedReason,
    blockNotice,
    amountNum,
    fee,
    balance,
    isNetting,
    canEstimateNet,
    remainderQty,
    getBack,
    heldSideLabel,
    oppositeLabel,
    sidePrice,
    effBoost,
    side,
    yesOptionId,
    noOptionId,
    yesOptionLabel,
    noOptionLabel,
    eventName,
    sideLabel,
    deductBalance,
    addBalance,
    onAmountChange,
    onFilled,
    onRequestAuth,
  ]);

  const ctaClass =
    side === "yes"
      ? "bg-gradient-to-r from-yes to-[#5FE0FF] text-[#04222c] hover:brightness-105"
      : "bg-gradient-to-r from-no to-[#E4FF88] text-[#1a2408] hover:brightness-105";

  // The Est. auto-close row always occupies its slot — a null estimate means
  // "cushioned", not "unknown", so we say so instead of unmounting the row.
  const autoCloseText =
    amountNum <= 0
      ? "—"
      : effBoost <= 1
        ? "None"
        : autoClose != null
          ? `≈ ${formatCents(autoClose)}`
          : "None at this balance";

  const nettingNotice =
    isNetting
      ? `You're backing ${sideLabel}. This cashes out your ${heldSideLabel} first.`
      : null;

  const wrapClass =
    variant === "desktop"
      ? "space-y-4 rounded-2xl border border-border bg-card p-5"
      : "space-y-4";

  return (
    <div className={wrapClass}>
      {variant === "desktop" && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Make your call</h3>
          <span className="font-mono text-[11px] text-muted-foreground">
            {countdownText} left
          </span>
        </div>
      )}

      {/* Side */}
      {marketContextLabel && (
        <div className="rounded-xl border border-border bg-muted/20 px-3 py-2">
          <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Market · change in the list ←
          </div>
          <div className="mt-0.5 font-display text-[14px] font-semibold text-foreground">
            {marketContextLabel}
          </div>
        </div>
      )}
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

      {/* Amount */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            How much
          </div>
          <div className="font-mono text-[11px] text-muted-foreground">
            Balance {money(balance)}
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
            return (
              <button
                key={p}
                type="button"
                onClick={() => onAmountChange(String(p))}
                className={cn(
                  "rounded-lg border py-1.5 font-mono text-[11px] font-semibold transition-colors",
                  active
                    ? "border-transparent bg-white text-[#0A0B0D]"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                ${p}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => onAmountChange(String(Math.max(0, Math.floor(balance))))}
            className="rounded-lg border border-border py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Max
          </button>
        </div>
      </div>

      {/* Boost — hidden entirely when the category is not enabled */}
      {boostLoading ? (
        // Isomorphic skeleton: mirrors LiteBoostSelector's real structure
        // (10px label row → h-10 chip row → two 10px caption lines) so the
        // module swaps in without shifting the CTA.
        <div className="space-y-2">
          <div className="h-[10px] w-28 animate-pulse rounded bg-muted/30" />
          <div className="h-10 w-full animate-pulse rounded-xl bg-muted/20" />
          <div className="space-y-1">
            <div className="h-[10px] w-full animate-pulse rounded bg-muted/20" />
            <div className="h-[10px] w-2/3 animate-pulse rounded bg-muted/20" />
          </div>
        </div>
      ) : boostEnabled ? (
        <LiteBoostSelector
          maxBoost={boostMax}
          tiers={boostTiers}
          value={boost}
          onChange={onBoostChange}
          variant={variant}
        />
      ) : null}

      {/* Returns */}
      <div className="space-y-1.5 rounded-xl border border-border bg-muted/20 p-3 text-xs">
        <div className="flex items-center justify-between px-2">
          <span className="text-muted-foreground">Max loss · what you put in</span>
          <span className="font-mono font-semibold text-foreground">
            {money(amountNum)}
          </span>
        </div>
        {canEstimateNet ? (
          <>
            <div className="mt-0.5 flex items-center justify-between border-t border-border/60 px-2 pt-1.5">
              <span className="text-xs text-muted-foreground">You'll get back ≈</span>
              <span className="font-mono text-lg font-semibold text-foreground">
                {money(getBack)}
              </span>
            </div>
            {isPartialNet && (
              <div className="flex items-center justify-between px-2 pt-0.5">
                <span className="text-xs text-muted-foreground">
                  Then if the rest is right, you win
                </span>
                <span className="font-mono font-semibold text-foreground">
                  {money(remainderWin)}
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="mt-0.5 flex items-center justify-between border-t border-border/60 px-2 pt-1.5">
            <span className="text-xs text-muted-foreground">If you're right, you win</span>
            <span className="font-mono text-lg font-semibold text-foreground">
              {money(potentialWin)}
            </span>
          </div>
        )}
        <div className="flex items-start justify-between px-2 pt-0.5">
          <div>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              Est. auto-close
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" aria-label="About auto-close">
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-[240px] text-xs">
                  An estimate of the price at which this call would be closed
                  automatically. It shifts as your other positions move.
                </TooltipContent>
              </Tooltip>
            </span>
            <div className="text-[10px] text-muted-foreground/70">
              Moves with your other positions
            </div>
          </div>
          <span className="font-mono font-semibold text-muted-foreground">
            {autoCloseText}
          </span>
        </div>
      </div>

      {/* CTA */}
      {blockNotice ? (
        <p className="text-[11px] text-muted-foreground">{blockNotice}</p>
      ) : nettingNotice ? (
        <p className="text-[11px] text-muted-foreground">{nettingNotice}</p>
      ) : null}
      <button
        type="button"
        disabled={submitting || blocked || !!blockNotice}
        onClick={handleSubmit}
        className={cn(
          "flex h-14 w-full items-center justify-between rounded-xl px-4 font-display font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50",
          ctaClass,
        )}
      >
        <span className="flex flex-col items-start leading-tight">
          <span className="text-sm">
            {blocked ? blockedReason || "Market closed" : `Buy ${sideLabel}`}
          </span>
          {!blocked && boostEnabled && effBoost > 1 && (
            <span className="font-mono text-[11px] opacity-80">{effBoost}× BOOST</span>
          )}
        </span>
        {!blocked && (
          <span className="font-mono text-sm">{money(potentialWin)} →</span>
        )}
      </button>
      <p className="text-center text-[10px] text-muted-foreground/70">
        {amountNum > 0
          ? `Not guaranteed. You can lose your full ${money(amountNum)}.`
          : "Not guaranteed. You can lose everything you put in."}
      </p>
    </div>
  );
};

const SideButton = ({
  active,
  tone,
  label,
  price,
  onClick,
}: {
  active: boolean;
  tone: "yes" | "no";
  label: string;
  price: number;
  onClick: () => void;
}) => {
  const pct = Math.round(price * 100);
  const yesActive = "bg-yes text-[#04222c] border-transparent";
  const noActive = "bg-no text-[#1a2408] border-transparent";
  const yesGhost = "bg-yes/12 text-yes border-[1.5px] border-yes/25";
  const noGhost = "bg-no/12 text-no border-[1.5px] border-no/25";
  const cls = active
    ? tone === "yes"
      ? yesActive
      : noActive
    : tone === "yes"
      ? yesGhost
      : noGhost;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center rounded-xl px-3 py-4 transition-all",
        cls,
      )}
    >
      <span className="text-base font-bold">
        {label} {pct}¢
      </span>
    </button>
  );
};

export default LiteContractOrderPanel;
