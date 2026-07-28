// ============================================================
// "Est. auto-close" price for a Lite contract position.
//
// The account is cross-collateralised (see useRealtimeRiskMetrics:
// imTotal = Σ margin, equity = totalAssets + unrealizedPnL,
// riskRatio = imTotal / equity × 100, ≥ 100 triggers). There is exactly
// ONE code path: solve for the price at which the ACCOUNT risk ratio
// reaches 100 with this position included. With no other positions the
// "other" terms are simply 0 — we deliberately do NOT fall back to the
// isolated-margin calcLiqPrice helper (its own comments admit it is not
// an account-level threshold).
// Always an ESTIMATE — the UI must keep the "≈" prefix.
// ============================================================

export interface AutoCloseInput {
  entryPrice: number; // 0..1
  boost: number; // multiplier
  amount: number; // cash put in = margin
  fee: number;
  quantity: number; // notional / entryPrice
  /** Account snapshot. */
  hasOtherPositions: boolean;
  imTotalOther: number;
  totalAssets: number;
  unrealizedPnLOther: number;
  /**
   * 'new'      — prospective position: its margin + fee are still in
   *              totalAssets and must be deducted.
   * 'existing' — already-open position: caller passes a pre-open snapshot
   *              (margin added back, own PnL excluded), so no deduction.
   */
  mode?: "new" | "existing";
}

/** Returns the estimated auto-close price (0..1) or null when unknown. */
export const estimateAutoClosePrice = (i: AutoCloseInput): number | null => {
  if (!isFinite(i.entryPrice) || i.entryPrice <= 0) return null;
  if (!isFinite(i.quantity) || i.quantity <= 0) return null;
  // A 1× position carries no auto-close.
  if (!isFinite(i.boost) || i.boost <= 1) return null;

  const imTotalOther = i.hasOtherPositions ? i.imTotalOther : 0;
  const pnlOther = i.hasOtherPositions ? i.unrealizedPnLOther : 0;

  // equity(P)  = assetsAfter + pnlOther + (P − entry) × qty
  // imAfter    = imTotalOther + amount
  // trigger when equity(P) === imAfter
  const assetsAfter =
    i.mode === "existing" ? i.totalAssets : i.totalAssets - i.amount - i.fee;
  const imAfter = imTotalOther + i.amount;
  const p = i.entryPrice + (imAfter - (assetsAfter + pnlOther)) / i.quantity;

  if (!isFinite(p)) return null;
  if (p < 0 || p > 1) return null;
  return p;
};

export const formatCents = (p: number | null): string =>
  p == null ? "--" : `${Math.round(p * 100)}¢`;
