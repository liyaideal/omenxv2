import { describe, expect, it } from "vitest";
import { estimateAutoClosePrice, isAutoCloseHot } from "@/lib/autoClosePrice";

const base = {
  entryPrice: 0.5,
  markPrice: 0.5,
  boost: 5,
  amount: 20,
  fee: 0,
  quantity: 200,
  hasOtherPositions: false,
  imTotalOther: 0,
  totalAssets: 60,
  unrealizedPnLOther: 0,
  mode: "existing" as const,
};

describe("estimateAutoClosePrice", () => {
  it("returns none for a 1× position", () => {
    expect(estimateAutoClosePrice({ ...base, side: "long", boost: 1 })).toEqual({ kind: "none" });
  });

  it("solves a long level below the mark", () => {
    const r = estimateAutoClosePrice({ ...base, side: "long" });
    expect(r.kind).toBe("level");
    if (r.kind === "level") expect(r.price).toBeLessThan(base.markPrice);
  });

  it("solves a short level above the mark", () => {
    const r = estimateAutoClosePrice({ ...base, side: "short" });
    expect(r.kind).toBe("level");
    if (r.kind === "level") expect(r.price).toBeGreaterThan(base.markPrice);
  });

  it("is symmetric: long and short levels mirror around entry", () => {
    const l = estimateAutoClosePrice({ ...base, side: "long" });
    const s = estimateAutoClosePrice({ ...base, side: "short" });
    if (l.kind === "level" && s.kind === "level") {
      expect(l.price + s.price).toBeCloseTo(2 * base.entryPrice, 10);
    } else {
      throw new Error("expected both sides to solve");
    }
  });

  it("returns none when the account cushion pushes the level out of range", () => {
    expect(
      estimateAutoClosePrice({ ...base, side: "long", totalAssets: 100_000 }),
    ).toEqual({ kind: "none" });
  });

  it("flags hot only within 10% of the mark", () => {
    expect(isAutoCloseHot({ kind: "level", price: 0.48 }, 0.5)).toBe(true);
    expect(isAutoCloseHot({ kind: "level", price: 0.2 }, 0.5)).toBe(false);
    expect(isAutoCloseHot({ kind: "none" }, 0.5)).toBe(false);
  });
});
