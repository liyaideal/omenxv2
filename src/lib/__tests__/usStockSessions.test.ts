import { describe, expect, it } from "vitest";
import {
  HK_STOCK_MARKET,
  KR_STOCK_MARKET,
  US_STOCK_MARKET,
  getMarketSession,
  resolveStockMarket,
} from "@/lib/usStockSessions";

// 2026-08-03 is a Monday.
const at = (iso: string) => new Date(iso);

describe("market session resolution", () => {
  it("US open / HK closed at 15:25 UTC (11:25 ET, 23:25 HKT)", () => {
    const now = at("2026-08-03T15:25:00Z");
    const us = getMarketSession(US_STOCK_MARKET, now);
    const hk = getMarketSession(HK_STOCK_MARKET, now);
    expect(us.open).toBe(true);
    expect(us.closeAt?.toISOString()).toBe("2026-08-03T20:00:00.000Z"); // 16:00 ET
    expect(hk.open).toBe(false);
    // 09:30 HKT next day = 01:30 UTC (display renders it viewer-local).
    expect(hk.nextOpenAt.toISOString()).toBe("2026-08-04T01:30:00.000Z");
  });

  it("HK open / US closed at 03:00 UTC (11:00 HKT, 23:00 ET prev day)", () => {
    const now = at("2026-08-03T03:00:00Z");
    const us = getMarketSession(US_STOCK_MARKET, now);
    const hk = getMarketSession(HK_STOCK_MARKET, now);
    expect(hk.open).toBe(true);
    expect(hk.closeAt?.toISOString()).toBe("2026-08-03T08:00:00.000Z"); // 16:00 HKT
    expect(us.open).toBe(false);
    // 09:30 ET same day = 13:30 UTC.
    expect(us.nextOpenAt.toISOString()).toBe("2026-08-03T13:30:00.000Z");
  });

  it("no session open at 22:00 UTC (18:00 ET, 06:00 HKT next day)", () => {
    const now = at("2026-08-03T22:00:00Z");
    expect(getMarketSession(US_STOCK_MARKET, now).open).toBe(false);
    expect(getMarketSession(HK_STOCK_MARKET, now).open).toBe(false);
    expect(
      getMarketSession(US_STOCK_MARKET, now).nextOpenAt.toISOString(),
    ).toBe("2026-08-04T13:30:00.000Z");
  });

  it("weekend rolls to Monday", () => {
    const now = at("2026-08-08T15:25:00Z"); // Saturday
    const us = getMarketSession(US_STOCK_MARKET, now);
    expect(us.open).toBe(false);
    expect(us.nextOpenAt.toISOString()).toBe("2026-08-10T13:30:00.000Z");
  });

  it("KR runs 09:00-15:30 KST and overlaps HK", () => {
    const now = at("2026-08-03T05:00:00Z"); // 13:00 HKT / 14:00 KST
    const kr = getMarketSession(KR_STOCK_MARKET, now);
    const hk = getMarketSession(HK_STOCK_MARKET, now);
    expect(kr.open).toBe(true);
    expect(hk.open).toBe(true);
    // KR closes 15:30 KST = 06:30 UTC, before HK's 16:00 HKT = 08:00 UTC.
    expect(kr.closeAt?.toISOString()).toBe("2026-08-03T06:30:00.000Z");
    expect(kr.closeAt!.getTime()).toBeLessThan(hk.closeAt!.getTime());
  });

  it("KR opens before HK (00:30 UTC = 09:30 KST / 08:30 HKT)", () => {
    const now = at("2026-08-03T00:30:00Z");
    expect(getMarketSession(KR_STOCK_MARKET, now).open).toBe(true);
    expect(getMarketSession(HK_STOCK_MARKET, now).open).toBe(false);
  });

  it("resolves KR events by id prefix and subtype", () => {
    expect(resolveStockMarket({ id: "kr-005930-updown-20260803" }).key).toBe("kr");
    expect(
      resolveStockMarket({ event_subtype: "KR_STOCK_DAILY_UPDOWN_SPOT" }).key,
    ).toBe("kr");
  });
});
