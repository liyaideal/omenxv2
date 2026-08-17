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
import { CalendarChip, WatchlistChip } from "@/components/lite/LiteListControls";
import { EventRow, MarketChildRow } from "@/hooks/useMarketListData";
import { SportsMatch } from "@/components/lite/sports/sportsData";
import { StockEventRow } from "@/components/lite/intraday/intradayData";
import { FROZEN_NOW } from "../frozenClock";
import { CategoryPill } from "@/components/lite/CategoryPill";
import { TOP_CATEGORIES } from "@/lib/taxonomy";

/* ---------------- Frozen mock clock ---------------- */
const NOW = FROZEN_NOW;
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

/* ---------------- Overflow variant ---------------- */
/** Today gets more than the 4-ticket column cap so "+N more" renders. */
const EVENTS_OVERFLOW: EventRow[] = [
  ...EVENTS,
  genericEvent("e-ov1", "Will BTC close above $90K today?", "crypto", "Crypto", 7 * 60, 512_000, 0.58),
  genericEvent("e-ov2", "Will the ECB hold rates today?", "economy", "Economy", 6 * 60, 274_000, 0.77),
  genericEvent("e-ov3", "Will the summit end with a joint statement?", "politics", "Politics", 8 * 60, 133_000, 0.36),
];

/* ---------------- Presets ---------------- */
const noop = () => undefined;

type Frame = {
  id: string;
  label: string;
  sector: string;
  data: { events: EventRow[]; matches: SportsMatch[]; stocks: StockEventRow[] };
  mode?: "day" | "week";
  dayOffset?: number;
  subType?: string;
  lanesOpen?: boolean;
  caption: string;
};

const ALL_DATA = { events: EVENTS, matches: MATCHES, stocks: STOCKS };
const EMPTY_DATA = { events: [], matches: [], stocks: [] };

const DESKTOP_FRAMES: Frame[] = [
  {
    id: "week",
    label: "Week (default)",
    sector: "all",
    data: ALL_DATA,
    mode: "week",
    caption:
      "7 columns from today. Category leads every ticket — filled badge + 3px edge bar (orange Intraday / chalk Sports / neutral otherwise). Live sports ticket keeps the red pulse dot. Tickets never open a trade page from week mode: a tap selects the day and switches to Day. The 'Open across days' lane sits BELOW the grid (final position).",
  },
  {
    id: "week-overflow",
    label: "Week · column overflow",
    sector: "all",
    data: { ...ALL_DATA, events: EVENTS_OVERFLOW },
    mode: "week",
    caption:
      "Columns cap at 4 tickets; the remainder collapses into a plain '+N more' line (10px, #6B7280). The count line in the column header still reports every market.",
  },
  {
    id: "week-intraday-ticket",
    label: "Week · Intraday tickets",
    sector: "intraday",
    data: ALL_DATA,
    mode: "week",
    caption:
      "Session tickets carry the flat label 'Intraday' in the orange badge; the market count moves to the second line as '8 HK stocks' / '12 US stocks'. Title reads '{HK|US} closing bell'.",
  },
  {
    id: "week-sports",
    label: "Week · Sports sub-types",
    sector: "sports",
    data: ALL_DATA,
    mode: "week",
    caption:
      "Sub-type chip row renders only when the category has sub-types — built data-driven from the real league list (All sports / Football / MMA · divider · league codes).",
  },
  {
    id: "week-sports-leaf",
    label: "Week · Sports · UCL selected",
    sector: "sports",
    data: ALL_DATA,
    mode: "week",
    subType: "league:uefa champions league",
    caption:
      "A leaf league chip active. Selected chip = #F2F3F5 fill on #0A0B0D ink; idle = 1px #23262D outline.",
  },
  {
    id: "week-lanes-open",
    label: "Week · spans expanded",
    sector: "all",
    data: ALL_DATA,
    mode: "week",
    lanesOpen: true,
    caption:
      "'Open across days' beyond 5 lanes collapses behind '+N more open markets'; expanded state swaps the control to 'Show fewer'. Bars clip with a flat edge when the window is cut by the frame.",
  },
  {
    id: "day",
    label: "Day · today",
    sector: "all",
    data: ALL_DATA,
    mode: "day",
    caption:
      "Clock spine: 66px time cell + rail. Live sports card (score + minute), aggregated session-close block with per-stock tiles (10-tile cap + overflow line), and generic cards. 'Open all day' spans sit BELOW the spine (final position). Date stepper: back arrow disabled on today.",
  },
  {
    id: "day-next",
    label: "Day · stepped forward",
    sector: "all",
    data: ALL_DATA,
    mode: "day",
    dayOffset: 1,
    caption:
      "Stepper moved one day forward: label drops the 'Today · ' prefix and the back arrow becomes enabled (floor is today — the calendar never steps into the past).",
  },
  {
    id: "empty",
    label: "Empty day",
    sector: "all",
    data: EMPTY_DATA,
    mode: "day",
    caption:
      "Standing intraday row stays; the shared lynx EmptyState (section tier, LynxFigure 100) states the next decision moment and offers the pill route back to the list — no hand-rolled panel, no blue text link.",
  },
];

const FrameDemo = ({
  frames,
  width,
  minWidth,
  isMobile,
}: {
  frames: Frame[];
  width?: number;
  minWidth?: number;
  isMobile: boolean;
}) => {
  const [id, setId] = useState<string>(frames[0].id);
  const p = frames.find((x) => x.id === id) ?? frames[0];
  return (
    <div className="space-y-3">
      <PresetRail presets={frames} activeId={id} onSelect={setId} />
      <Canvas width={width}>
        {/* Remount per preset so injected initial state applies. */}
        <div key={id} style={{ minWidth }}>
          <LiteCalendarView
            events={[...p.data.events]}
            matches={[...p.data.matches]}
            stocks={[...p.data.stocks]}
            sector={p.sector}
            isMobile={isMobile}
            nowOverride={NOW}
            initialMode={p.mode}
            initialDayOffset={p.dayOffset}
            initialSubType={p.subType}
            initialLanesOpen={p.lanesOpen}
            onBackToList={noop}
            onOpenIntraday={noop}
          />
        </div>
      </Canvas>
      <Caption>{p.caption}</Caption>
    </div>
  );
};

const MOBILE_FRAMES: Frame[] = [
  {
    id: "m-week",
    label: "Mobile · Week",
    sector: "all",
    data: ALL_DATA,
    mode: "week",
    caption:
      "390 unfocused state. Mobile has no Day|Week control — the day strip is the only mode control. Chips scroll horizontally (label + market count); tapping one focuses that day. With no day focused, a ticket tap focuses its day rather than opening the market. 'Open all day' spans render at the bottom of the list.",
  },
  {
    id: "m-day",
    label: "Mobile · Day focused",
    sector: "all",
    data: ALL_DATA,
    mode: "day",
    caption:
      "A day chip is pre-selected (defaults to today) so the list shows that day only. Ticket taps now open the market. Tapping the active chip again clears the focus and returns to the whole week.",
  },
  {
    id: "m-empty",
    label: "Mobile · Empty week",
    sector: "all",
    data: EMPTY_DATA,
    mode: "week",
    caption:
      "Shared lynx EmptyState (section tier) with the pill route back to the list; footer count reads 0.",
  },
];

/* ---------------- Chrome & controls ---------------- */

const EntryChipsDemo = () => (
  <div className="space-y-3">
    <Canvas>
      <div className="flex flex-col" style={{ gap: 14 }}>
        <div className="flex items-center gap-3">
          <WatchlistChip active={false} count={6} showLabel onClick={noop} />
          <WatchlistChip active count={6} showLabel onClick={noop} />
          <CalendarChip active={false} onClick={noop} />
          <CalendarChip active onClick={noop} />
        </div>
        {/* As-built placement: right-aligned tail of the category filter row. */}
        <div className="flex items-center" style={{ gap: 8 }}>
          {TOP_CATEGORIES.slice(0, 5).map((c, i) => (
            <CategoryPill key={c.id} label={c.label} dot={c.dot} active={i === 0} onClick={noop} />
          ))}
          <span className="ml-auto flex items-center" style={{ gap: 8 }}>
            <WatchlistChip active={false} count={6} showLabel onClick={noop} />
            <CalendarChip active onClick={noop} />
          </span>
        </div>
      </div>
    </Canvas>
    <Caption>
      Watchlist + Calendar are no longer in the page header cluster — they live
      right-aligned (ml-auto) at the end of the desktop category filter row, and
      they are mutually exclusive: activating Watchlist closes the calendar, and
      activating the calendar while Watchlist is on resets the category to All.
      The Calendar lens is not a category, so its active fill is plain white.
    </Caption>
  </div>
);

const ClosesSoonDemo = () => (
  <div className="space-y-3">
    <Canvas>
      <ClosesSoonBadge />
    </Canvas>
    <Caption>
      Near-deadline badge — final copy "Closes soon", shown when a market stops
      trading within 24h. Muted outlined text only, never coloured. It marks the
      end of the tradeable window, not a settlement result.
    </Caption>
  </div>
);

export const LiteCalendarSection = () => (
  <SectionWrapper
    id="lite-calendar"
    title="Lite · Calendar"
    platform="shared"
    description="Calendar lens on the Lite events page (a view state, not a route). As-built baseline. Every preset uses fixed mock data plus a frozen mock now (2026-08-03 15:20 UTC) and injected initial UI state — nothing here reads the database. Addendum: docs/design-contracts/calendar-asbuilt-notes.md"
  >
    <div className="space-y-10">
      <Card>
        <CardContent className="space-y-4 p-6">
          <SubSection
            title="Chrome & controls · entry chips"
            description="Desktop category filter row · inactive + active"
          >
            <EntryChipsDemo />
          </SubSection>
          <SubSection title="Closes soon badge" description="Desktop & Mobile">
            <ClosesSoonDemo />
          </SubSection>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <SubSection
            title="Calendar · desktop frames"
            description="Week (default / overflow / intraday / sports / spans) · Day (today / stepped) · Empty day"
          >
            <FrameDemo frames={DESKTOP_FRAMES} minWidth={1040} isMobile={false} />
          </SubSection>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <SubSection
            title="Calendar · mobile frames"
            description="Mobile 390 · Week / Day (locked) / Empty"
          >
            <FrameDemo frames={MOBILE_FRAMES} width={390} isMobile />
          </SubSection>
        </CardContent>
      </Card>
    </div>
  </SectionWrapper>
);

export default LiteCalendarSection;
