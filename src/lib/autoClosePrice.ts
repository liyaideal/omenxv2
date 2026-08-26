// ============================================================
// Account-level "Est. auto-close" solver for Lite Boost positions.
//
// Cross-collateral model (see useRealtimeRiskMetrics): the account
// triggers when equity(P) falls to imAfter. Direction matters:
//   long  → equity(P) = assetsAfter + pnlOther + (P − entry) × qty
//   short → equity(P) = assetsAfter + pnlOther + (entry − P) × qty
//
// TWO-STATE GRAMMAR (CPO 2026-08-26): the result is either a price or
// "none" — no null, no unknown. Degenerate/zero-size inputs and 1×
// positions are honest "none" (a zero or unlevered stake can never be
// auto-closed; loss is capped at the stake). If the account is already
// at/past the trigger at the current mark, the truthful level IS the
// mark (renders hot). Always an ESTIMATE — the UI keeps the "≈" prefix.
// ============================================================

export type AutoCloseResult =
  | { kind: "level"; price: number }
  | { kind: "none" };

export interface AutoCloseInput {
  entryPrice: number; // 0..1
  /** Position direction — shorts trigger ABOVE the mark, longs below. */
  side: "long" | "short";
  /** Current mark price (0..1) — domain bound + already-triggered check. */
  markPrice: number;
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

const NONE: AutoCloseResult = { kind: "none" };

export const estimateAutoClosePrice = (i: AutoCloseInput): AutoCloseResult => {
  if (!isFinite(i.entryPrice) || i.entryPrice <= 0) return NONE;
  if (!isFinite(i.quantity) || i.quantity <= 0) return NONE;
  // A ≤1× position carries no auto-close — loss is capped at the stake.
  if (!isFinite(i.boost) || i.boost <= 1) return NONE;

  const imTotalOther = i.hasOtherPositions ? i.imTotalOther : 0;
  const pnlOther = i.hasOtherPositions ? i.unrealizedPnLOther : 0;
  const assetsAfter =
    i.mode === "existing" ? i.totalAssets : i.totalAssets - i.amount - i.fee;
  const imAfter = imTotalOther + i.amount;

  const mark = Math.min(0.99, Math.max(0.01, isFinite(i.markPrice) ? i.markPrice : i.entryPrice));
  const dir = i.side === "short" ? -1 : 1;

  // Already at/past the trigger at the current mark → the truthful level
  // is the mark itself (the UI renders it hot).
  const equityNow = assetsAfter + pnlOther + dir * (mark - i.entryPrice) * i.quantity;
  if (equityNow <= imAfter) return { kind: "level", price: mark };

  // Solve equity(P) = imAfter for P, direction-aware.
  const p = i.entryPrice + dir * ((imAfter - (assetsAfter + pnlOther)) / i.quantity);
  if (!isFinite(p)) return NONE;

  // Legal domain: the level must sit on the LOSS side of the mark and
  // inside the market's (0,1) price range — otherwise it is a true "none".
  if (i.side === "short") {
    if (p <= mark || p >= 1) return NONE;
  } else {
    if (p >= mark || p <= 0) return NONE;
  }
  return { kind: "level", price: p };
};

/** |mark − level| / mark ≤ 10% → hot. */
export const isAutoCloseHot = (r: AutoCloseResult, markPrice: number): boolean =>
  r.kind === "level" && markPrice > 0 && Math.abs(markPrice - r.price) / markPrice <= 0.1;

export const formatCents = (p: number | null): string =>
  p == null ? "--" : `${Math.round(p * 100)}¢`;
