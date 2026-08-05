// ============================================================
// VERTICAL FILTER TAGGERS — map an event row onto the taxonomy
// dimensions used by the Crypto and Finance vertical views.
// Pure string classification; no new data model, no migration.
// ============================================================
import type { EventRow } from "@/hooks/useMarketListData";
import type { Coin } from "@/components/lite/intraday/intradayData";

const hay = (m: EventRow) =>
  `${m.eventId} ${m.eventName} ${m.topMarket?.label ?? ""}`.toLowerCase();

/** Coin an event is about ("all" when it names none). */
export const coinOfEvent = (m: EventRow): Coin | null => {
  const s = hay(m);
  if (/\bbtc\b|bitcoin/.test(s)) return "btc";
  if (/\beth\b|ethereum|ether\b/.test(s)) return "eth";
  if (/\bsol\b|solana/.test(s)) return "sol";
  return null;
};

export type FinanceClass = "indices" | "stocks" | "commodities" | "fx";
export type FinanceRegion = "us" | "hk" | "kr";

/** Asset class for a Finance event — defaults to Stocks. */
export const financeClassOf = (m: EventRow): FinanceClass => {
  const s = hay(m);
  if (/gold|silver|copper|oil|brent|\bwti\b|crude|natural gas|wheat/.test(s))
    return "commodities";
  if (/\bfx\b|forex|usd\/|\beur\b|\bjpy\b|\bgbp\b|dollar index|\bdxy\b|yuan|yen/.test(s))
    return "fx";
  if (/index|indices|s&p|\bspx\b|nasdaq|\bndx\b|dow\b|russell|hang seng|\bhsi\b|kospi|nikkei/.test(s))
    return "indices";
  return "stocks";
};

/** Region for a Finance event — defaults to US. */
export const financeRegionOf = (m: EventRow): FinanceRegion => {
  const s = hay(m);
  if (/korea|kospi|\bkr\b|\bkrw\b|samsung|hyundai/.test(s)) return "kr";
  if (/hong kong|\bhk\b|\.hk|hang seng|\bhsi\b|china|chinese|shanghai|shenzhen|yuan|tencent|alibaba|baidu|meituan/.test(s))
    return "hk";
  return "us";
};
