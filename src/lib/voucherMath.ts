// ============================================================
// Voucher position math — one source of truth for every surface
// (Lite cards / cash-out panel, Pro close panel, Portfolio) and mirrored by
// supabase/functions/close-trial-position.
//
// CPO 2026-11-18: a voucher redeemed on a Standard (spot) event opens a spot
// order worth the voucher's face value — no multiplier. Only vouchers
// redeemed on Boost (contract) events are 5×.
// ============================================================

export type VoucherLine = "spot" | "futures";

/** Boost (contract) voucher positions are 5×; Standard (spot) ones are 1×. */
export const VOUCHER_BOOST_LEVERAGE = 5;

/** Fallback cap ratio when the voucher carries no redeemable_cap_pct (DB default today). */
export const VOUCHER_DEFAULT_CAP_PCT = 0.5;

/** Same rule the redeem picker routes by: any event that lists `spot` is Standard. */
export const voucherLineFor = (productLines: readonly string[] | null | undefined): VoucherLine =>
  (productLines ?? []).includes("spot") ? "spot" : "futures";

export const voucherLeverageFor = (line: VoucherLine | null | undefined): number =>
  line === "spot" ? 1 : VOUCHER_BOOST_LEVERAGE;

export interface VoucherCreditInput {
  entryPrice: number;
  markPrice: number;
  side: "long" | "short";
  faceValue: number;
  leverage: number;
  redeemableCap?: number | null;
  redeemableCapPct?: number | null;
}

export interface VoucherCredit {
  /** Shares / contracts = faceValue × leverage ÷ entry. */
  quantity: number;
  /** Unclamped PnL at the mark price. */
  rawPnl: number;
  /** Most this call can actually pay out: the voucher's cap, or less when even a
   *  full win cannot reach it (a 1× call bought at 80¢ wins at most 25% of its face). */
  cap: number;
  /** What closing now would credit: clamp(rawPnl, 0, cap). */
  credit: number;
}

export function voucherCredit(i: VoucherCreditInput): VoucherCredit {
  const entry = Math.max(i.entryPrice, 0.0001);
  const quantity = (i.faceValue * i.leverage) / entry;
  const rawPnl = (i.markPrice - i.entryPrice) * quantity * (i.side === "short" ? -1 : 1);
  const voucherCap =
    i.redeemableCap != null
      ? i.redeemableCap
      : i.faceValue * (i.redeemableCapPct != null ? i.redeemableCapPct : VOUCHER_DEFAULT_CAP_PCT);
  // PnL if this side wins outright (its price goes to $1; a short's reference price to $0).
  const fullWin = quantity * (i.side === "short" ? entry : Math.max(0, 1 - entry));
  const cap = Math.min(voucherCap, fullWin);
  return { quantity, rawPnl, cap, credit: Math.max(0, Math.min(rawPnl, cap)) };
}

/** A voucher "has profit" only once it rounds to at least one cent — a sub-cent
 *  credit would otherwise render as a winning "+$0.00". Every surface (card, panel,
 *  result layer, Portfolio row) uses this one test. */
export const hasVoucherProfit = (credit: number | null | undefined): boolean =>
  Math.round((credit ?? 0) * 100) >= 1;

