import { describe, it, expect } from "vitest";
import { entryFeeFor, maxLossFor, netWinIfRight, usd } from "@/lib/liteWinLoss";
import { FUTURES_FEE_RATE, WINNING_COMMISSION_RATE } from "@/services/tradingService";

// Delivery doc docs/delivery/lite-winloss-display-v1.md §1 — the 2026-11-13 case:
// $10 put in at 3× Boost, bought at 78¢.
const putIn = 10;
const boost = 3;
const price = 0.78;
const position = putIn * boost;
const shares = position / price;

describe("liteWinLoss", () => {
  it("entry fee is the fee rate on the whole position", () => {
    expect(entryFeeFor(position)).toBeCloseTo(position * FUTURES_FEE_RATE, 10);
  });

  it("max loss = position + entry fee (cross margin)", () => {
    expect(maxLossFor(position)).toBeCloseTo(position * (1 + FUTURES_FEE_RATE), 10);
    expect(usd(maxLossFor(position))).toBe(usd(30 + 30 * FUTURES_FEE_RATE));
  });

  it("net win = gross − fee − commission on (gross − fee)", () => {
    const fee = position * FUTURES_FEE_RATE;
    const gross = (1 - price) * shares;
    const expected = gross - fee - WINNING_COMMISSION_RATE * (gross - fee);
    expect(netWinIfRight(price, shares)).toBeCloseTo(expected, 6);
  });

  it("no commission when the win does not cover the fee", () => {
    const p = 0.9995;
    const q = 1000;
    const fee = p * q * FUTURES_FEE_RATE;
    const gross = (1 - p) * q;
    expect(gross).toBeLessThan(fee);
    expect(netWinIfRight(p, q)).toBeCloseTo(gross - fee, 10);
  });

  it("zero shares → zero, never NaN", () => {
    expect(netWinIfRight(0, 0)).toBe(0);
    expect(maxLossFor(0)).toBe(0);
  });
});
