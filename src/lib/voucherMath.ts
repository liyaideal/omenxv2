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
  /** Most this voucher can ever pay out. */
  cap: number;
  /** What closing now would credit: clamp(rawPnl, 0, cap). */
  credit: number;
}

export function voucherCredit(i: VoucherCreditInput): VoucherCredit {
  const entry = Math.max(i.entryPrice, 0.0001);
  const quantity = (i.faceValue * i.leverage) / entry;
  const rawPnl = (i.markPrice - i.entryPrice) * quantity * (i.side === "short" ? -1 : 1);
  const cap =
    i.redeemableCap != null
      ? i.redeemableCap
      : i.faceValue * (i.redeemableCapPct != null ? i.redeemableCapPct : VOUCHER_DEFAULT_CAP_PCT);
  return { quantity, rawPnl, cap, credit: Math.max(0, Math.min(rawPnl, cap)) };
}
