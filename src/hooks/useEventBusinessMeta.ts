// ============================================================
// Event business layer (2026-10-16 · rail-switch SOP, CPO).
//
// Everything an event carries *because of what it is* (a crypto quick round,
// a US-stock daily up/down, a sports fixture …) rather than *how it trades*
// (spot vs contract) lives here, so both rails read one source:
//   ticker · base/open price · indicative last · prior-close / round window ·
//   session tag · Up/Down labels · chart default timeframe · settle rule copy.
//
// Product-layer things (Last | Mark, leverage, margin, fees) must NOT be added
// here — see docs/design-contracts/rail-switch-sop.md.
// ============================================================
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { liteSideName } from "@/lib/liteSideName";
import { parseSideLabels, isUpDownPriceEventId } from "@/lib/eventUtils";
import {
  resolveStockMarket,
  getCurrentSession,
  formatLocalTime,
  formatLocalStamp,
  formatLocalDate,
  type StockMarket,
} from "@/lib/usStockSessions";
import { deriveTickerFromEvent } from "@/components/SpotStatsHeader";
import { parseQuickId } from "@/components/lite/intraday/intradayData";

/** The slice of an `events` row the business layer reads. */
export interface BusinessEventRow {
  id: string;
  name: string;
  event_subtype?: string | null;
  base_price?: number | string | null;
  start_date?: string | null;
  end_date?: string | null;
  side_labels?: unknown;
  freeze_time?: string | null;
  expected_settlement_time?: string | null;
}

export type BusinessKind = "quick" | "stock" | "none";

export interface EventBusinessMeta {
  kind: BusinessKind;
  /** Price-referenced event: has an underlying ticker + base price. */
  isPriceRef: boolean;
  ticker: string;
  cur: string;
  market: StockMarket;
  basePrice: number | null;
  /** Mock walk around basePrice (DEMO-STATE) — the underlying's last price. */
  indicative: number | null;
  indicativePct: number;
  sessionTag: "pre-mkt" | "after-hrs" | null;
  yesLabel: string;
  noLabel: string;
  /** "Base" for daily events, "Open" for quick rounds. */
  baseWord: "Base" | "Open";
  /** Viewer-local time clause after the price: "as of Fri 04:00 (Oct 15 close)" / "14:05–14:10". */
  timeClause: string | null;
  /** Short form for the mobile countdown row (375, zero-truncation): "15:30–15:45" / "Base Fri 04:00". */
  mobileClause: string | null;
  /** "Base: $307.33 · as of Fri 04:00 (Oct 15 close)" — first line of the mobile ⓘ popover. */
  baseLine: string | null;
  /** Local clock strings for the schedule popover (trading ends = freeze, or close when no freeze window). */
  schedule: { tradingEnds: string | null; close: string | null; settle: string | null };
  /** Settle rule for the ⓘ next to the base price. */
  settleRule: string | null;
  /** Chart timeframe the page should open on (quick rounds: 5m/15m → 1m, 1h/4h → 5m, 1d → 15m). */
  defaultTimeframe: "1m" | "5m" | "15m";
  /** Props for `CandlestickChart.underlying` (null for non price-referenced events). */
  underlying: { ticker: string; basePrice: number; lastPrice: number | null; shareLabel: string; baseWord: "Base" | "Open" } | null;
}

// ---- Indicative last price (mock walk around base_price) — moved from useSpotTerminal ----
export const useIndicativeLast = (basePrice: number | null, seedKey: string) => {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 2500);
    return () => clearInterval(t);
  }, []);
  return useMemo(() => {
    if (!basePrice) return null;
    const seed = seedKey.length % 7;
    const drift = Math.sin(tick / 3 + seed) * 0.008;
    return basePrice * (1 + drift);
  }, [basePrice, tick, seedKey]);
};

const money2 = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Prior trading-day close instant: the event's close clock on the previous weekday. */
export const priorCloseInstant = (endDate: Date | null, market: StockMarket): Date | null => {
  if (!endDate) return null;
  const dowFmt = new Intl.DateTimeFormat("en-US", { timeZone: market.tz, weekday: "short" });
  let d = new Date(endDate.getTime() - 24 * 3600 * 1000);
  for (let i = 0; i < 4; i += 1) {
    const w = dowFmt.format(d);
    if (w !== "Sat" && w !== "Sun") break;
    d = new Date(d.getTime() - 24 * 3600 * 1000);
  }
  return d;
};

/** Market-local calendar date of a close ("Oct 15") — the trading day the base belongs to. */
const marketDateLabel = (d: Date, market: StockMarket) =>
  new Intl.DateTimeFormat("en-US", { timeZone: market.tz, month: "short", day: "numeric" }).format(d);

const sameLocalDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Round window clause: "14:05–14:10" within one local day, "Thu 08:00 – Fri 08:00" across days. */
export const roundWindowClause = (start: Date | null, end: Date | null): string | null => {
  if (!start || !end) return null;
  return sameLocalDay(start, end)
    ? `${formatLocalTime(start)}–${formatLocalTime(end)}`
    : `${formatLocalStamp(start)} – ${formatLocalStamp(end)}`;
};

/** Chart opens on a timeframe that fits the round length; daily events keep the chart's own default. */
export const quickDefaultTimeframe = (id: string | null | undefined): "1m" | "5m" | "15m" => {
  const q = id ? parseQuickId(id) : null;
  if (!q) return "15m";
  if (q.tf === "5m" || q.tf === "15m") return "1m";
  if (q.tf === "1h" || q.tf === "4h") return "5m";
  return "15m";
};

export const deriveBusinessKind = (row: BusinessEventRow | null | undefined): BusinessKind => {
  if (!row) return "none";
  const id = row.id.toLowerCase();
  const subtype = (row.event_subtype ?? "").toUpperCase();
  if (parseQuickId(row.id) || subtype === "CRYPTO_QUICK_UPDOWN_SPOT") return "quick";
  if ((isUpDownPriceEventId(id) && !id.startsWith("crypto-")) || /_STOCK_DAILY_UPDOWN/.test(subtype)) return "stock";
  return "none";
};

/**
 * Pure derivation — give it the row (and the live indicative price) and it
 * returns the whole business layer. `useEventBusinessMeta` wraps it with the
 * indicative walk + an optional fetch by id.
 */
export const deriveBusinessMeta = (
  row: BusinessEventRow | null | undefined,
  indicative: number | null,
  now: Date = new Date(),
): EventBusinessMeta => {
  const market = resolveStockMarket(row ?? null);
  const kind = deriveBusinessKind(row);
  const sideLabels = parseSideLabels(row?.side_labels);
  const yesLabel = sideLabels?.yes ? liteSideName(sideLabels.yes) : "Up";
  const noLabel = sideLabels?.no ? liteSideName(sideLabels.no) : "Down";
  const basePrice = row?.base_price != null ? Number(row.base_price) : null;
  const isPriceRef = kind !== "none" && basePrice != null;
  const ticker = row ? deriveTickerFromEvent(row.id, row.name) : "";
  const cur = market.currency;
  const indicativePct = basePrice && indicative ? ((indicative - basePrice) / basePrice) * 100 : 0;

  let sessionTag: EventBusinessMeta["sessionTag"] = null;
  if (kind === "stock") {
    const s = getCurrentSession(market, now);
    if (s.session === "PRE_MARKET") sessionTag = "pre-mkt";
    else if (s.session === "EXTENDED_AFTER_HOURS" || s.session === "OVERNIGHT") sessionTag = "after-hrs";
  }

  const start = row?.start_date ? new Date(row.start_date) : null;
  const end = row?.end_date ? new Date(row.end_date) : null;

  let timeClause: string | null = null;
  let mobileClause: string | null = null;
  let settleRule: string | null = null;
  const baseWord: EventBusinessMeta["baseWord"] = kind === "quick" ? "Open" : "Base";
  if (isPriceRef && basePrice != null) {
    const px = `${cur}${money2(basePrice)}`;
    if (kind === "quick") {
      timeClause = roundWindowClause(start, end);
      mobileClause = timeClause;
      settleRule = `Settles ${yesLabel} if ${ticker || "the price"} ends the round above ${px}. Equal or below settles ${noLabel}.`;
    } else {
      const prior = priorCloseInstant(end, market);
      timeClause = prior ? `as of ${formatLocalStamp(prior)} (${marketDateLabel(prior, market)} close)` : null;
      mobileClause = prior ? `Base ${formatLocalStamp(prior)}` : null;
      settleRule = `Settles ${yesLabel} if ${ticker || "the price"} closes above ${px}. Equal or below settles ${noLabel}.`;
    }
  }

  const freeze = row?.freeze_time ? new Date(row.freeze_time) : null;
  const settle = row?.expected_settlement_time ? new Date(row.expected_settlement_time) : null;
  const schedule = {
    tradingEnds: freeze ? formatLocalTime(freeze) : end ? formatLocalTime(end) : null,
    close: end ? formatLocalTime(end) : null,
    settle: settle ? formatLocalTime(settle) : null,
  };
  const baseLine =
    isPriceRef && basePrice != null && timeClause
      ? `${baseWord}: ${cur}${money2(basePrice)} · ${timeClause}`
      : null;

  return {
    kind,
    isPriceRef,
    ticker,
    cur,
    market,
    basePrice,
    indicative: isPriceRef ? indicative : null,
    indicativePct,
    sessionTag,
    yesLabel,
    noLabel,
    baseWord,
    timeClause,
    mobileClause,
    baseLine,
    schedule,
    settleRule,
    defaultTimeframe: quickDefaultTimeframe(row?.id),
    underlying:
      isPriceRef && basePrice != null
        ? { ticker, basePrice, lastPrice: indicative, shareLabel: yesLabel, baseWord }
        : null,
  };
};

const SELECT = "id, name, event_subtype, base_price, start_date, end_date, side_labels, freeze_time, expected_settlement_time";

/**
 * Business layer for an event. Pass a row when the page already has one
 * (spot terminal), or an id and the hook fetches the slice it needs (contract
 * terminal, which only holds the transformed `TradingEvent`).
 */
export const useEventBusinessMeta = (
  source: BusinessEventRow | string | null | undefined,
  /** The selected outcome's label for the chart's share view (defaults to yesLabel). */
  shareLabel?: string,
): EventBusinessMeta => {
  const id = typeof source === "string" ? source : source?.id ?? null;
  const given = typeof source === "string" ? null : source ?? null;
  const [fetched, setFetched] = useState<BusinessEventRow | null>(null);

  useEffect(() => {
    if (given || !id) {
      setFetched(null);
      return;
    }
    let alive = true;
    (async () => {
      const { data } = await supabase.from("events").select(SELECT).eq("id", id).maybeSingle();
      if (alive) setFetched((data as BusinessEventRow | null) ?? null);
    })();
    return () => {
      alive = false;
    };
  }, [id, given]);

  // Until the fetch lands, derive what the id alone can tell (kind / default timeframe)
  // so the chart opens on the right timeframe without a flash.
  const row = given ?? fetched ?? (id ? { id, name: "" } : null);
  const basePrice = row?.base_price != null ? Number(row.base_price) : null;
  const indicative = useIndicativeLast(basePrice, row?.id || "");

  return useMemo(() => {
    const m = deriveBusinessMeta(row, indicative);
    if (shareLabel && m.underlying) m.underlying = { ...m.underlying, shareLabel };
    return m;
  }, [row, indicative, shareLabel]);
};

/** Display helper shared by the desktop sublines: "Base $82,621.56" / "Open $82,621.56". */
export const basePriceText = (m: EventBusinessMeta) =>
  m.basePrice != null ? `${m.cur}${money2(m.basePrice)}` : "—";

export { formatLocalDate };
