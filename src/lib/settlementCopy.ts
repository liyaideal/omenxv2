// ============================================================
// Settlement-detail copy grammar (CPO v1.17 §4b/§4c).
// ONE place decides SETTLED vs CLOSED, the price-row label and the payout
// formula, so the mobile page, the desktop page and the style guide can never
// drift apart.
// ============================================================
export type CloseReason = "settlement" | "cashout" | "auto_close";

export const centsLabel = (p: number) => `${Math.round(p * 100)}¢`;

/** Eyebrow verb — a resolution says SETTLED, everything else says CLOSED. */
export const eyebrowWord = (reason: CloseReason) =>
  reason === "settlement" ? "SETTLED" : "CLOSED";

/** Row label for the exit price. */
export const exitRowLabel = (reason: CloseReason) =>
  reason === "settlement" ? "Settled price" : "Closed at";

/** Row label for the exit timestamp. */
export const exitTimeLabel = (reason: CloseReason) =>
  reason === "settlement" ? "Settled" : "Closed";

/** Payout is money returned — it can be zero, it can never be negative. */
export const payoutOf = (cost: number, pnl: number, fees: number) =>
  Math.max(0, cost + pnl - fees);
