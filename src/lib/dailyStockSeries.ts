// ============================================================
// Daily up/down stock series helpers. Slug/ticker/company derivation for
// events like `us-hood-updown-20260724`. Shared by the Lite list badge
// system and the Lite spot trade page's past-days strip.
// ============================================================
import { deriveTickerFromEvent } from "@/components/SpotStatsHeader";

export const STOCK_COMPANY: Record<string, string> = {
  NVDA: "NVIDIA",
  TSLA: "Tesla",
  AAPL: "Apple",
  MSFT: "Microsoft",
  GOOGL: "Alphabet",
  META: "Meta Platforms",
  AMZN: "Amazon",
  "0700.HK": "Tencent",
  "9988.HK": "Alibaba",
  "3690.HK": "Meituan",
  "1810.HK": "Xiaomi",
  "1211.HK": "BYD",
  "0005.HK": "HSBC",
};

/**
 * Daily up/down slugs look like `us-hood-updown-20260724`. The shared
 * deriveTickerFromEvent fallback would read "US" out of that, which would
 * merge every stock into one series — so read the slug first and only fall
 * back to the shared derivation.
 */
export const DAILY_STOCK_SLUG = /^(us|hk)-([a-z0-9]{1,5})-updown\b/i;

export const isDailyStockEvent = (e: {
  id: string;
  name: string;
  category: string;
}): boolean => {
  if ((e.category || "").toLowerCase() !== "stocks") return false;
  if (DAILY_STOCK_SLUG.test(e.id)) return true;
  return deriveTickerFromEvent(e.id, e.name) !== "STOCK";
};

export const tickerOf = (e: { id: string; name: string }) => {
  const m = e.id.match(DAILY_STOCK_SLUG);
  if (m) {
    const code = m[2].toUpperCase();
    return m[1].toLowerCase() === "hk" ? `${code}.HK` : code;
  }
  return deriveTickerFromEvent(e.id, e.name);
};

/** Company name: lookup first, else the "Robinhood (HOOD) — …" name prefix. */
export const companyOf = (
  ticker: string,
  e?: { name: string } | null,
): string => {
  if (STOCK_COMPANY[ticker]) return STOCK_COMPANY[ticker];
  const m = e?.name.match(/^(.+?)\s*\(/);
  if (m && m[1].trim()) return m[1].trim();
  return ticker;
};

/** `us-hood-updown-20260724` → the slug prefix shared by every day. */
export const seriesPrefixOf = (eventId: string): string | null => {
  const m = eventId.match(/^((?:us|hk)-[a-z0-9]{1,5}-updown)-\d{8}$/i);
  return m ? m[1] : null;
};

/** `us-hood-updown-20260724` → Date at that calendar day. */
export const seriesDayOf = (eventId: string): Date | null => {
  const m = eventId.match(/-(\d{4})(\d{2})(\d{2})$/);
  if (!m) return null;
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00Z`);
  return isNaN(d.getTime()) ? null : d;
};