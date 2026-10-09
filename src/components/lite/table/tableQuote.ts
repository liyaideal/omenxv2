// ============================================================
// TABLE order quote — the contract (Boost) math, copied from
// LiteContractOrderPanel so the tray, the zones, the toast and the result
// row all show the same numbers the engine will book.
//   notional = chip × boost · fee = notional × rate (paid on top)
//   shares   = notional / price (fractional) · win = (1 − price) × shares
//   win shown NET of the 5 % winning commission (netWin), like every Lite win.
// ============================================================
import { FUTURES_FEE_RATE, netWin } from "@/services/tradingService";

export interface TableOrderQuote {
  margin: number;
  boost: number;
  notional: number;
  fee: number;
  shares: number;
  /** Net profit if this side wins. */
  profit: number;
  /** Cash that leaves the wallet: margin + fee. */
  cashNeeded: number;
}

export const quoteTableOrder = (margin: number, boost: number, price: number): TableOrderQuote => {
  const notional = margin * boost;
  const fee = Math.round(notional * FUTURES_FEE_RATE * 100) / 100;
  const shares = price > 0 ? notional / price : 0;
  const profit = Math.round(netWin((1 - price) * shares, fee) * 100) / 100;
  return { margin, boost, notional, fee, shares, profit, cashNeeded: margin + fee };
};
