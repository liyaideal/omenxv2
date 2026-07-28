// ============================================================
// "Est. auto-close" price for a Lite contract position.
//
// The account is cross-collateralised (see useRealtimeRiskMetrics:
// imTotal = Σ margin, equity = totalAssets + unrealizedPnL,
// riskRatio = imTotal / equity × 100, ≥ 100 triggers). So:
//   • no other open positions → the isolated single-position estimate;
//   • with other positions   → solve for the price at which the
//     ACCOUNT risk ratio reaches 100 once this position is included.
// Always an ESTIMATE — the UI must keep the "≈" prefix.
// ============================================================
import { calcLiqPrice } from "@/lib/tradingUtils";

export interface AutoCloseInput {
  entryPrice: number; // 0..1
  boost: number; // multiplier
  amount: number; // cash put in = margin
  fee: number;
  quantity: number; // notional / entryPrice
  /** Account snapshot (excluding this prospective position). */
  hasOtherPositions: boolean;
  imTotalOther: number;
  totalAssets: number;
  unrealizedPnLOther: number;
}

const clamp01 = (n: number) => Math.max(0.0001, Math.min(0.9999, n));

/** Returns the estimated auto-close price (0..1) or null when unknown. */
export const estimateAutoClosePrice = (i: AutoCloseInput): number | null => {
  if (!isFinite(i.entryPrice) || i.entryPrice <= 0) return null;
  if (!isFinite(i.quantity) || i.quantity <= 0) return null;

  if (!i.hasOtherPositions) {
    // Isolated single-position estimate (same shape as calcLiqPrice).
    const parsed = parseFloat(calcLiqPrice(i.entryPrice, i.boost, "long").replace("$", ""));
    return isFinite(parsed) ? clamp01(parsed) : null;
  }

  // Account-level: equity(P) = imTotal(after) at the trigger point.
  //   equity(P) = (totalAssets − amount − fee) + pnlOther + (P − entry) × qty
  //   imTotal(after) = imTotalOther + amount
  const assetsAfter = i.totalAssets - i.amount - i.fee;
  const imAfter = i.imTotalOther + i.amount;
  const p =
    i.entryPrice + (imAfter - (assetsAfter + i.unrealizedPnLOther)) / i.quantity;
  if (!isFinite(p)) return null;
  return clamp01(p);
};

export const formatCents = (p: number | null): string =>
  p == null ? "--" : `${Math.round(p * 100)}¢`;
