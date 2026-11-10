// ============================================================
// Daily up/down stock series helpers. Slug/ticker/company derivation for
// events like `us-hood-updown-20260724`. Shared by the Lite list badge
// system and the Lite spot trade page's past-days strip.
// ============================================================
import { deriveTickerFromEvent, stockCompanyName } from "@/components/SpotStatsHeader";


/**
 * Daily up/down slugs look like `us-hood-updown-20260724`. The shared
 * deriveTickerFromEvent fallback would read "US" out of that, which would
 * merge every stock into one series — so read the slug first and only fall
 * back to the shared derivation.
 */
export const DAILY_STOCK_SLUG = /^(us|hk|kr)-([a-z0-9]{1,6})-updown\b/i;

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
    const mkt = m[1].toLowerCase();
    return mkt === "hk" ? `${code}.HK` : mkt === "kr" ? `${code}.KR` : code;
  }
  return deriveTickerFromEvent(e.id, e.name);
};

/** Company short name — rides in the event name ("Robinhood (HOOD) — …"), see stockCompanyName. */
export const companyOf = (ticker: string, e?: { name: string } | null): string => stockCompanyName(ticker, e?.name);

/** `us-hood-updown-20260724` → the slug prefix shared by every day. */
export const seriesPrefixOf = (eventId: string): string | null => {
  const m = eventId.match(/^((?:us|hk|kr)-[a-z0-9]{1,6}-updown)-\d{8}$/i);
  return m ? m[1] : null;
};

/** `us-hood-updown-20260724` → Date at that calendar day. */
export const seriesDayOf = (eventId: string): Date | null => {
  const m = eventId.match(/-(\d{4})(\d{2})(\d{2})$/);
  if (!m) return null;
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00Z`);
  return isNaN(d.getTime()) ? null : d;
};