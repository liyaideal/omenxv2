// ============================================================
// Lite win / loss figures — one source for every surface that tells a
// user how much a call can win or lose (CPO 2026-11-13, "Lite 交易展示
// 17 条"). Every figure is the same net number the settled record shows.
//
//   position P  = shares × entry price          (= put in × Boost)
//   entry fee F = P × fee rate                   (the environment's own rate)
//   win         = (1 − p) × shares − F − 5% × ((1 − p) × shares − F)
//   most it can lose = P + F                     (the price can only go to 0¢)
//
// Cross margin: anything past what was put in comes out of the Boost
// balance. The cap at the Boost balance (order ticket only) is pending
// CTO confirmation and is not applied here.
// ============================================================
import { FUTURES_FEE_RATE, netWin } from "@/services/tradingService";

/** Entry fee of a contract position worth `positionValue` at entry. */
export const entryFeeFor = (positionValue: number) => positionValue * FUTURES_FEE_RATE;

/** Most a contract position can lose: its value at entry plus the entry fee. */
export const maxLossFor = (positionValue: number) => positionValue + entryFeeFor(positionValue);

/** What a contract position wins if it settles at $1, after the entry fee and the winning commission. */
export const netWinIfRight = (entryPrice: number, shares: number) => {
  const fee = entryFeeFor(entryPrice * shares);
  return netWin((1 - entryPrice) * shares, fee) - fee;
};

export const usd = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
