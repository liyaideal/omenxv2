import { describe, expect, it } from "vitest";
import {
  HK_STOCK_MARKET,
  US_STOCK_MARKET,
  formatSessionStamp,
  getMarketSession,
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
    expect(formatSessionStamp(hk.nextOpenAt, HK_STOCK_MARKET)).toBe(
      "Tue 09:30 HKT",
    );
  });

  it("HK open / US closed at 03:00 UTC (11:00 HKT, 23:00 ET prev day)", () => {
    const now = at("2026-08-03T03:00:00Z");
    const us = getMarketSession(US_STOCK_MARKET, now);
    const hk = getMarketSession(HK_STOCK_MARKET, now);
    expect(hk.open).toBe(true);
    expect(hk.closeAt?.toISOString()).toBe("2026-08-03T08:00:00.000Z"); // 16:00 HKT
    expect(us.open).toBe(false);
    expect(formatSessionStamp(us.nextOpenAt, US_STOCK_MARKET)).toBe(
      "Mon 09:30 ET",
    );
  });

  it("no session open at 22:00 UTC (18:00 ET, 06:00 HKT next day)", () => {
    const now = at("2026-08-03T22:00:00Z");
    expect(getMarketSession(US_STOCK_MARKET, now).open).toBe(false);
    expect(getMarketSession(HK_STOCK_MARKET, now).open).toBe(false);
    expect(
      formatSessionStamp(
        getMarketSession(US_STOCK_MARKET, now).nextOpenAt,
        US_STOCK_MARKET,
      ),
    ).toBe("Tue 09:30 ET");
  });

  it("weekend rolls to Monday", () => {
    const now = at("2026-08-08T15:25:00Z"); // Saturday
    const us = getMarketSession(US_STOCK_MARKET, now);
    expect(us.open).toBe(false);
    expect(formatSessionStamp(us.nextOpenAt, US_STOCK_MARKET)).toBe(
      "Mon 09:30 ET",
    );
  });
});
