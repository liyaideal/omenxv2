// ============================================================
// /style-guide → "Lite · Calendar".
// Playground registration ONLY for the calendar lens on the Lite
// events page. Every preset feeds the shipped LiteCalendarView
// fixed mock data plus a frozen mock "now" — no database reads.
// Pixel contract: docs/design-contracts/calendar-final.html
// ============================================================
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { SectionWrapper, SubSection } from "../components/SectionWrapper";
import { LiteCalendarView } from "@/components/lite/calendar/LiteCalendarView";
import { ClosesSoonBadge } from "@/components/lite/calendar/CalendarBlocks";
import { CalendarChip } from "@/components/lite/LiteListControls";
import { EventRow, MarketChildRow } from "@/hooks/useMarketListData";
import { SportsMatch } from "@/components/lite/sports/sportsData";
import { StockEventRow } from "@/components/lite/intraday/intradayData";

/* ---------------- Frozen mock clock ---------------- */
const NOW = new Date("2026-08-03T15:20:00Z").getTime();
const MIN = 60_000;
const HOUR = 60 * MIN;
const iso = (ms: number) => new Date(NOW + ms).toISOString();

/* ---------------- Preset rail ---------------- */
const PresetRail = <T extends { id: string; label: string }>({
  presets,
  activeId,
  onSelect,
}: {
  presets: readonly T[];
  activeId: string;
  onSelect: (id: string) => void;
}) => (
  <div className="flex gap-2 overflow-x-auto pb-1">
    {presets.map((p) => (
      <button
        key={p.id}
        type="button"
        onClick={() => onSelect(p.id)}
        className={cn(
          "shrink-0 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
          p.id === activeId
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-muted text-muted-foreground hover:text-foreground",
        )}
      >
        {p.label}
      </button>
    ))}
  </div>
);

const Caption = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs text-muted-foreground">{children}</p>
);

/** Dark canvas — the calendar lives on the Lite page's #0A0B0D surface. */
const Canvas = ({
  width,
  children,
}: {
  width?: number;
  children: React.ReactNode;
}) => (
  <div
    style={{
      background: "#0A0B0D",
      borderRadius: 14,
      padding: 20,
      width,
      maxWidth: "100%",
      overflowX: "auto",
    }}
  >
    {children}
  </div>
);

/* ---------------- Generic event mocks ---------------- */
const child = (id: string, label: string, price: number): MarketChildRow => ({
  id,
  optionLabel: label,
  displayLabel: label,
  markPrice: price,
  change1h: 0,
  change4h: 0,
  change24h: 0,
  volume1h: 0,
  volume4h: 0,
  volume24h: 0,
  totalVolume: 0,
  openInterest: 0,
  fundingRate: 0,
});

const genericEvent = (
  id: string,
  name: string,
  category: string,
  categoryLabel: string,
  minutesFromNow: number,
  volume: number,
  yes = 0.62,
): EventRow => ({
  id,
  eventId: id,
  eventName: name,
  eventIcon: "",
  category,
  categoryLabel,
  productLines: ["contract"],
  eventSubtype: null,
  lifecycleStatus: "open",
  basePrice: null,
  change1h: 0,
  change4h: 0,
  change24h: 0,
  volume1h: 0,
  volume4h: 0,
  volume24h: 0,
  totalVolume: volume,
  openInterest: 0,
  expiry: new Date(NOW + minutesFromNow * MIN),
  createdAt: iso(-6 * 24 * HOUR),
  isNew: false,
  isClosingSoon: minutesFromNow < 24 * 60,
  topMarket: null,
  childCount: 2,
  children: [
    child(`${id}-yes`, "Yes", yes),
    child(`${id}-no`, "No", Number((1 - yes).toFixed(2))),
  ],
});

const EVENTS: EventRow[] = [
  genericEvent("e-fed", "Will the Fed cut rates in September?", "economy", "Economy", 5 * 60, 1_284_000, 0.62),
  genericEvent("e-cpi", "Will US CPI come in under 2.6%?", "economy", "Economy", 20 * 60, 402_000, 0.41),
  genericEvent("e-vote", "Will the infrastructure bill pass this week?", "politics", "Politics", 30 * 60, 918_000, 0.55),
  genericEvent("e-launch", "Will Starship reach orbit before Friday?", "tech", "Tech", 52 * 60, 233_000, 0.34),
  genericEvent("e-oil", "Will Brent close above $90?", "economy", "Economy", 74 * 60, 156_000, 0.48),
  genericEvent("e-film", "Will the sequel top $200M opening weekend?", "culture", "Culture", 96 * 60, 88_000, 0.71),
  genericEvent("e-ai", "Will GPT-6 ship before October?", "tech", "Tech", 120 * 60, 640_000, 0.29),
  genericEvent("e-elect", "Will turnout exceed 60%?", "politics", "Politics", 141 * 60, 310_000, 0.66),
];

/* ---------------- Sports mocks ---------------- */
const opt = (id: string, label: string, price: number) => ({ id, label, price });

const match = (
  o: Partial<SportsMatch> & {
    id: string;
    league: string;
    home: string;
    away: string;
  },
): SportsMatch =>
  ({
    name: `${o.home} vs ${o.away}`,
    homeAbbr: o.home.slice(0, 3).toUpperCase(),
    awayAbbr: o.away.slice(0, 3).toUpperCase(),
    format: "1x2",
    kickoff: new Date(NOW + 90 * MIN),
    endDate: new Date(NOW + 210 * MIN),
    live: false,
    minute: null,
    phase: null,
    score: null,
    volume: 412_000,
    options: [
      opt(`${o.id}-h`, o.home, 0.44),
      opt(`${o.id}-d`, "Draw", 0.27),
      opt(`${o.id}-a`, o.away, 0.29),
    ],
    ...o,
  }) as SportsMatch;

const MATCHES: SportsMatch[] = [
  match({
    id: "m-live",
    league: "UEFA Champions League",
    home: "Arsenal",
    away: "Inter",
    kickoff: new Date(NOW - 37 * MIN),
    endDate: new Date(NOW + 70 * MIN),
    live: true,
    minute: 37,
    phase: "1H",
    score: "1 - 0",
    volume: 1_902_000,
  }),
  match({
    id: "m-ucl-2",
    league: "UEFA Champions League",
    home: "Real Madrid",
    away: "Porto",
    kickoff: new Date(NOW + 4 * HOUR),
    endDate: new Date(NOW + 6 * HOUR),
  }),
  match({
    id: "m-ufc",
    league: "UFC",
    home: "Makhachev",
    away: "Oliveira",
    format: "h2h",
    kickoff: new Date(NOW + 27 * HOUR),
    endDate: new Date(NOW + 29 * HOUR),
    volume: 764_000,
    options: [opt("m-ufc-h", "Makhachev", 0.68), opt("m-ufc-a", "Oliveira", 0.32)],
  }),
  match({
    id: "m-csl",
    league: "CSL",
    home: "Shanghai Port",
    away: "Beijing Guoan",
    kickoff: new Date(NOW + 50 * HOUR),
    endDate: new Date(NOW + 52 * HOUR),
    volume: 121_000,
  }),
  match({
    id: "m-kl",
    league: "K League 1",
    home: "Ulsan HD",
    away: "Jeonbuk",
    kickoff: new Date(NOW + 74 * HOUR),
    endDate: new Date(NOW + 76 * HOUR),
    volume: 96_000,
  }),
  match({
    id: "m-ucl-3",
    league: "UEFA Champions League",
    home: "Bayern",
    away: "PSV",
    kickoff: new Date(NOW + 100 * HOUR),
    endDate: new Date(NOW + 102 * HOUR),
  }),
];

/* ---------------- Stock (session close) mocks ---------------- */
const usStock = (
  ticker: string,
  base: number,
  upPrice: number,
  msFromNow: number,
): StockEventRow => ({
  id: `us-${ticker.toLowerCase()}-updown-20260803`,
  name: `${ticker} — will it close higher today?`,
  base_price: base,
  start_date: iso(-3 * HOUR),
  end_date: iso(msFromNow),
  freeze_time: null,
  event_subtype: "US_STOCK_DAILY_UPDOWN_SPOT",
  upPrice,
  downPrice: Number((1 - upPrice).toFixed(2)),
});

const US_TICKERS = [
  "AAPL", "NVDA", "TSLA", "MSFT", "AMZN", "META", "GOOGL", "AMD", "NFLX", "COIN", "PLTR", "UBER",
];

/** One 16:00 ET bell today, one tomorrow — aggregated per close moment. */
const hkStock = (
  ticker: string,
  base: number,
  upPrice: number,
  msFromNow: number,
): StockEventRow => ({
  id: `hk-${ticker.toLowerCase()}-updown-20260803`,
  name: `${ticker} — will it close higher today?`,
  base_price: base,
  start_date: iso(-6 * HOUR),
  end_date: iso(msFromNow),
  freeze_time: null,
  event_subtype: "HK_STOCK_DAILY_UPDOWN_SPOT",
  upPrice,
  downPrice: Number((1 - upPrice).toFixed(2)),
});

const HK_TICKERS = ["0700", "9988", "3690", "1810", "0005", "1211", "0388", "2318"];

const STOCKS: StockEventRow[] = [
  ...HK_TICKERS.map((t, i) => hkStock(t, 60 + i * 12.5, 0.44 + (i % 4) * 0.05, 21 * HOUR)),
  ...US_TICKERS.map((t, i) => usStock(t, 100 + i * 9.4, 0.42 + (i % 5) * 0.06, 5 * HOUR)),
  ...US_TICKERS.slice(0, 8).map((t, i) => ({
    ...usStock(t, 100 + i * 9.4, 0.5, 29 * HOUR),
    id: `us-${t.toLowerCase()}-updown-20260804`,
  })),
];

