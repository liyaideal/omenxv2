// ============================================================
// /style-guide → Events 列表（M1a 分区①–④）。
// 每个 case 都挂生产组件；fixture 只注数据与状态。
// LiteEventCard 是 FROZEN 件：这里只摆放，零改样式。
// ============================================================
import { useEffect, useMemo, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import type { EventRow } from "@/hooks/useMarketListData";
import { FROZEN_NOW, frozenIso } from "../frozenClock";
import {
  LiteEventsFilterRow,
  LiteEventsGreeting,
} from "@/components/lite/LiteEventsHeader";
import { MobileCategoryRow } from "@/components/lite/mobile/MobileCategoryRow";
import { LiteEventCard } from "@/components/lite/LiteEventCard";
import { IntradayStageCard } from "@/components/lite/allstage/IntradayStageCard";
import { MobileIntradayModule } from "@/components/lite/mobile/MobileIntradayModule";
import { SportsStageCard } from "@/components/lite/sports/SportsStageCard";
import { MobileSportsModule } from "@/components/lite/mobile/MobileSportsModule";
import { LiteSportsView } from "@/components/lite/categoryviews/LiteSportsView";
import {
  COINS,
  type Coin,
  type QuickEvent,
  type StockEventRow,
  TF_SECONDS,
  TIMEFRAMES,
  type Timeframe,
} from "@/components/lite/intraday/intradayData";
import { buildDayStrip, type SportsMatch,
  shortName,
} from "@/components/lite/sports/sportsData";
import { LiteCalendarView } from "@/components/lite/calendar/LiteCalendarView";
import { WatchlistChip, CalendarChip } from "@/components/lite/LiteListControls";
import { EmptyState } from "@/components/states";
import { AuthPromptHost } from "@/components/auth/AuthPromptHost";

/* ---------------- shared shells ---------------- */

const Stage = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[#0A0B0D] p-4">{children}</div>
);

const SECTOR_COUNTS = new Map<string, number>([
  ["crypto", 12],
  ["finance", 8],
  ["politics", 5],
  ["macro", 4],
  ["tech", 6],
  ["entertainment", 3],
  ["social", 2],
]);

const MOBILE_CATEGORIES = [
  { id: "all", label: "All" },
  { id: "intraday", label: "Intraday", dot: "#FF8A3D" },
  { id: "sports", label: "Sports", dot: "#FF3B4E", pulse: true },
  { id: "crypto", label: "Crypto" },
  { id: "finance", label: "Finance" },
  { id: "politics", label: "Politics" },
  { id: "macro", label: "Economy" },
  { id: "tech", label: "Tech" },
];

/** Both surfaces of the filter row, driven by the same viewport hook production uses. */
const FilterRowDemo = ({
  initialSector = "all",
  initialBoost = false,
}: {
  initialSector?: string;
  initialBoost?: boolean;
}) => {
  const isMobile = useIsMobile();
  const [sector, setSector] = useState(initialSector);
  const [boostOnly, setBoostOnly] = useState(initialBoost);
  const [calendarOn, setCalendarOn] = useState(false);
  const [watchlist, setWatchlist] = useState(false);

  if (isMobile) {
    return (
      <MobileCategoryRow
        categories={MOBILE_CATEGORIES}
        value={sector}
        onSelect={setSector}
        watchlistActive={watchlist}
        watchlistCount={3}
        onWatchlist={() => setWatchlist((v) => !v)}
        calendarActive={calendarOn}
        onCalendar={() => setCalendarOn((v) => !v)}
        boostActive={boostOnly}
        onBoost={() => setBoostOnly((v) => !v)}
      />
    );
  }
  return (
    <LiteEventsFilterRow
      sector={sector}
      onSelectSector={setSector}
      sectorCounts={SECTOR_COUNTS}
      sportsCount={9}
      sportsLive
      calendarOn={calendarOn}
      boostOnly={boostOnly}
      onToggleBoost={() => setBoostOnly((v) => !v)}
      watchlistActive={watchlist}
      watchlistCount={3}
      onWatchlist={() => setWatchlist((v) => !v)}
      onCalendar={() => setCalendarOn((v) => !v)}
    />
  );
};

/* ---------------- card fixtures ---------------- */

const H = 3_600_000;

const child = (id: string, label: string, price: number) => ({
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
});

/**
 * Card fixtures hang off the REAL clock, not the frozen one: LiteEventCard is
 * a FROZEN component and derives its badges from Date.now() internally, so a
 * frozen expiry would render every card as "Settled".
 */
const eventFixture = (o: {
  id: string;
  name: string;
  category: string;
  /** hours from the frozen instant */
  settlesInH: number;
  /** hours before the frozen instant */
  createdAgoH?: number;
  volume?: number;
  vol24h?: number;
  children?: EventRow["children"];
}): EventRow => ({
  id: o.id,
  eventId: o.id,
  eventName: o.name,
  eventIcon: "",
  category: o.category,
  categoryLabel: o.category,
  productLines: ["futures"],
  eventSubtype: null,
  lifecycleStatus: "active",
  basePrice: null,
  imageUrl: null,
  imageBlur: null,
  change1h: 0,
  change4h: 0,
  change24h: 0,
  volume1h: 0,
  volume4h: 0,
  volume24h: o.vol24h ?? 180_000,
  totalVolume: o.volume ?? 1_240_000,
  openInterest: 0,
  expiry: new Date(Date.now() + o.settlesInH * H),
  createdAt: new Date(Date.now() - (o.createdAgoH ?? 96) * H).toISOString(),
  isNew: false,
  isClosingSoon: false,
  topMarket: { label: "Yes" },
  childCount: o.children?.length ?? 2,
  children:
    o.children ?? [child("yes", "Yes", 0.62), child("no", "No", 0.38)],
});

const BINARY = () => eventFixture({
  id: "sg-ev-binary",
  name: "Will the Fed cut rates in September?",
  category: "macro",
  settlesInH: 96,
});

const MULTI = () => eventFixture({
  id: "sg-ev-multi",
  name: "Who wins the 2026 Best Picture?",
  category: "entertainment",
  settlesInH: 120,
  children: [
    child("a", "Dune: Part Three", 0.41),
    child("b", "The Brutalist II", 0.27),
    child("c", "Anora", 0.18),
    child("d", "Sinners", 0.14),
  ],
});

const ENDS_SOON = () => eventFixture({
  id: "sg-ev-ends-soon",
  name: "Will ETH close above $4K today?",
  category: "crypto",
  settlesInH: 3 + 12 / 60,
});

const NEW_EVENT = () => eventFixture({
  id: "sg-ev-new",
  name: "Will the next iPhone ship a foldable?",
  category: "tech",
  settlesInH: 120,
  createdAgoH: 3,
});

const TRENDING = () => eventFixture({
  id: "sg-ev-trending",
  name: "Who takes the box office crown this weekend?",
  category: "entertainment",
  settlesInH: 72,
  vol24h: 4_800_000,
});

const BOOSTED = () => eventFixture({
  id: "sg-ev-boost",
  name: "Will BTC close above $70K this week?",
  category: "crypto",
  settlesInH: 60,
});

/** Real daily up/down slug → the shipped intraday detector recognises it. */
const INTRADAY_TRENDING = () => eventFixture({
  id: "us-hood-updown-20260803",
  name: "Robinhood (HOOD) — will it close higher today?",
  category: "stocks",
  settlesInH: 1 + 20 / 60,
  vol24h: 5_200_000,
});

const Grid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid gap-[18px] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
    {children}
  </div>
);

const Card = ({
  market,
  boostMax,
  cutoff,
}: {
  market: EventRow;
  boostMax?: number | null;
  cutoff?: number | null;
}) => (
  <LiteEventCard
    market={market}
    index={0}
    boostMax={boostMax ?? null}
    trendingCutoff={cutoff ?? null}
  />
);

/* ---------------- ① header & filter row ---------------- */

export const Ev1Preview = () => {
  const isMobile = useIsMobile();
  return (
    <Stage>
      <LiteEventsGreeting isMobile={!!isMobile} />
    </Stage>
  );
};

export const Ev2Preview = () => (
  <Stage>
    <FilterRowDemo />
  </Stage>
);

export const Ev3Preview = () => (
  <Stage>
    <FilterRowDemo initialSector="sports" />
  </Stage>
);

export const Ev4Preview = () => (
  <Stage>
    <div className="flex flex-col gap-4">
      <FilterRowDemo initialBoost />
      <Grid>
        <Card market={BOOSTED()} boostMax={5} />
        <Card market={BINARY()} boostMax={2} />
      </Grid>
    </div>
  </Stage>
);

/* ---------------- intraday fixture (deterministic) ---------------- */

/**
 * Style-guide rule: page-group cases are fixture-driven — never a runtime
 * fetch. The band takes its rounds as props in production too, so the guide
 * feeds it a frozen snapshot of live data instead of calling useQuickRounds.
 * Countdowns are fixture start values (they tick while the case is open, but
 * every open starts from the same remaining time).
 */
const COIN_FIXTURE: Record<Coin, { base: number; up: number; hist: string }> = {
  btc: { base: 111_240.5, up: 0.54, hist: "uuduuudu" },
  eth: { base: 4_182.3, up: 0.51, hist: "duuduudd" },
  sol: { base: 214.6, up: 0.47, hist: "udduuddu" },
};

/** Remaining time on the open round of each window, in seconds. */
const TF_REMAINING: Record<Timeframe, number> = {
  "5m": 192,
  "15m": 520,
  "1h": 2_465,
  "4h": 7_980,
  "1d": 26_760,
};

const quickFixture = (): {
  currentFor: Map<string, QuickEvent>;
  historyFor: Map<string, ("up" | "down")[]>;
} => {
  const currentFor = new Map<string, QuickEvent>();
  const historyFor = new Map<string, ("up" | "down")[]>();
  const now = Date.now();
  for (const coin of COINS) {
    const cfg = COIN_FIXTURE[coin];
    for (const { id: tf } of TIMEFRAMES) {
      const key = `${coin}-${tf}`;
      const end = now + TF_REMAINING[tf] * 1000;
      const start = end - TF_SECONDS[tf] * 1000;
      currentFor.set(key, {
        // Static id → static seed → identical derived price on every open.
        id: `crypto-${coin}-updown-${tf}-1`,
        name: `${coin.toUpperCase()} ${tf} round`,
        coin,
        tf,
        period: "1",
        base_price: cfg.base,
        start_date: new Date(start).toISOString(),
        end_date: new Date(end).toISOString(),
        volume: 184_000,
        is_resolved: false,
        options: [
          { id: `${key}-up`, label: "Up", price: cfg.up, is_winner: null },
          { id: `${key}-down`, label: "Down", price: 1 - cfg.up, is_winner: null },
        ],
      });
      historyFor.set(
        key,
        cfg.hist.split("").map((c) => (c === "u" ? "up" : "down")),
      );
    }
  }
  return { currentFor, historyFor };
};

const QUICK_FIXTURE = quickFixture();

/** Frozen second-tick fed to the band so prices/countdowns are static. */
const FIXTURE_TICK = 0;

/* ---------------- ② Intraday band ---------------- */

const US_ROWS: StockEventRow[] = [
  {
    id: "us-aapl-updown-20260803",
    name: "AAPL — will it close higher today?",
    base_price: 224.8,
    start_date: frozenIso(-210 * 60_000),
    end_date: frozenIso(95 * 60_000),
    freeze_time: null,
    event_subtype: "US_STOCK_DAILY_UPDOWN_SPOT",
    upPrice: 0.61,
    downPrice: 0.39,
  },
  {
    id: "us-nvda-updown-20260803",
    name: "NVDA — will it close higher today?",
    base_price: 118.4,
    start_date: frozenIso(-210 * 60_000),
    end_date: frozenIso(95 * 60_000),
    freeze_time: null,
    event_subtype: "US_STOCK_DAILY_UPDOWN_SPOT",
    upPrice: 0.44,
    downPrice: 0.56,
  },
  {
    id: "us-tsla-updown-20260803",
    name: "TSLA — will it close higher today?",
    base_price: 241.1,
    start_date: frozenIso(-210 * 60_000),
    end_date: frozenIso(95 * 60_000),
    freeze_time: null,
    event_subtype: "US_STOCK_DAILY_UPDOWN_SPOT",
    upPrice: 0.52,
    downPrice: 0.48,
  },
];

/**
 * The band, on real rolling-round data. `stockRows` decides the branch:
 * empty → coin-major cards (own dial per tile); non-empty inside an open
 * session → compact tiles + the "Stocks closing today" sub-band.
 */
const BandDemo = ({
  stockRows,
  sessionNow,
  initialTf,
}: {
  stockRows: StockEventRow[];
  sessionNow?: Date;
  initialTf?: Timeframe;
}) => {
  const isMobile = useIsMobile();
  // Fixture tick: the derived tile price is a function of the second tick, so
  // a live tick would make the case render differently on every open.
  const tickSeconds = FIXTURE_TICK;
  const { currentFor, historyFor } = QUICK_FIXTURE;
  const [tf, setTf] = useState<Timeframe>(initialTf ?? "15m");

  if (isMobile) {
    return (
      <MobileIntradayModule
        currentFor={currentFor}
        historyFor={historyFor}
        stockRows={stockRows}
        tf={tf}
        onSelectTf={setTf}
        tickSeconds={tickSeconds}
        onOpenIntraday={() => undefined}
      />
    );
  }
  return (
    <IntradayStageCard
      currentFor={currentFor}
      historyFor={historyFor}
      stockRows={stockRows}
      tickSeconds={tickSeconds}
      onOpenIntraday={() => undefined}
      sessionNow={sessionNow}
      initialTf={initialTf}
    />
  );
};

export const Ev5Preview = () => (
  <Stage>
    <BandDemo stockRows={[]} />
  </Stage>
);

export const Ev6Preview = () => (
  <Stage>
    <BandDemo stockRows={[]} initialTf="1h" />
  </Stage>
);

export const Ev7Preview = () => (
  <Stage>
    <BandDemo stockRows={US_ROWS} sessionNow={new Date(FROZEN_NOW)} />
  </Stage>
);

export const Ev8Preview = () => (
  <Stage>
    <BandDemo stockRows={[]} sessionNow={new Date(FROZEN_NOW)} />
  </Stage>
);

/* ---------------- sports fixture (deterministic) ---------------- */

/** Kickoff anchored to a day offset at a fixed local hour. */
const kick = (dayOffset: number, hour: number, minute = 0): Date => {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
};

const opt = (id: string, label: string, price: number) => ({ id, label, price });

const match = (m: {
  id: string;
  league: string;
  home: string;
  away: string;
  homeAbbr: string;
  awayAbbr: string;
  kickoff: Date;
  options: { id: string; label: string; price: number }[];
  live?: { minute: number; score: string; phase?: string };
}): SportsMatch => ({
  id: m.id,
  name: `${m.home} vs ${m.away}`,
  league: m.league,
  home: m.home,
  away: m.away,
  homeAbbr: m.homeAbbr,
  awayAbbr: m.awayAbbr,
  homeShort: shortName(m.home, { league: m.league }, m.options.map((o) => o.label)),
  awayShort: shortName(m.away, { league: m.league }, m.options.map((o) => o.label)),
  format: m.options.length === 3 ? "1x2" : "h2h",
  kickoff: m.kickoff,
  endDate: new Date(m.kickoff.getTime() + 2 * 3_600_000),
  live: !!m.live,
  minute: m.live?.minute ?? null,
  phase: m.live?.phase ?? null,
  score: m.live?.score ?? null,
  volume: 420_000,
  options: m.options,
});

const threeWay = (h: string, a: string, p: [number, number, number], id: string) => [
  opt(`${id}-h`, h, p[0]),
  opt(`${id}-d`, "Draw", p[1]),
  opt(`${id}-a`, a, p[2]),
];

/**
 * 17 upcoming matches (day-rail ALL 17) + 1 live block. Kickoffs are relative
 * to the current day so the strip never rots; counts per day are fixed.
 */
const SPORTS_FIXTURE: SportsMatch[] = [
  match({
    id: "sg-sp-live",
    league: "Premier League",
    home: "Arsenal",
    away: "Chelsea",
    homeAbbr: "ARS",
    awayAbbr: "CHE",
    kickoff: new Date(Date.now() - 33 * 60_000),
    live: { minute: 33, score: "1-0", phase: "LIVE" },
    options: threeWay("Arsenal", "Chelsea", [0.58, 0.24, 0.18], "sg-sp-live"),
  }),
  // today · 4
  match({
    id: "sg-sp-juv",
    league: "Serie A",
    home: "Juventus",
    away: "Napoli",
    homeAbbr: "JUV",
    awayAbbr: "NAP",
    kickoff: kick(0, 20, 45),
    options: threeWay("Juventus", "Napoli", [0.4, 0.31, 0.3], "sg-sp-juv"),
  }),
  match({
    id: "sg-sp-kc",
    league: "NFL",
    home: "Chiefs",
    away: "Bills",
    homeAbbr: "KC",
    awayAbbr: "BUF",
    kickoff: kick(0, 21, 20),
    options: [opt("sg-sp-kc-h", "Chiefs", 0.23), opt("sg-sp-kc-a", "Bills", 0.77)],
  }),
  match({
    id: "sg-sp-rma",
    league: "La Liga",
    home: "Real Madrid",
    away: "Sevilla",
    homeAbbr: "RMA",
    awayAbbr: "SEV",
    kickoff: kick(0, 22, 0),
    options: threeWay("Real Madrid", "Sevilla", [0.66, 0.2, 0.14], "sg-sp-rma"),
  }),
  match({
    id: "sg-sp-lal",
    league: "NBA",
    home: "Lakers",
    away: "Celtics",
    homeAbbr: "LAL",
    awayAbbr: "BOS",
    kickoff: kick(0, 23, 30),
    options: [opt("sg-sp-lal-h", "Lakers", 0.46), opt("sg-sp-lal-a", "Celtics", 0.54)],
  }),
  // +1 · 5
  match({
    id: "sg-sp-bay",
    league: "Bundesliga",
    home: "Bayern",
    away: "Dortmund",
    homeAbbr: "BAY",
    awayAbbr: "BVB",
    kickoff: kick(1, 18, 30),
    options: threeWay("Bayern", "Dortmund", [0.55, 0.24, 0.21], "sg-sp-bay"),
  }),
  match({
    id: "sg-sp-psg",
    league: "Ligue 1",
    home: "PSG",
    away: "Marseille",
    homeAbbr: "PSG",
    awayAbbr: "OM",
    kickoff: kick(1, 20, 0),
    options: threeWay("PSG", "Marseille", [0.62, 0.22, 0.16], "sg-sp-psg"),
  }),
  match({
    id: "sg-sp-mci",
    league: "Premier League",
    home: "Man City",
    away: "Liverpool",
    homeAbbr: "MCI",
    awayAbbr: "LIV",
    kickoff: kick(1, 21, 0),
    options: threeWay("Man City", "Liverpool", [0.44, 0.26, 0.3], "sg-sp-mci"),
  }),
  match({
    id: "sg-sp-gsw",
    league: "NBA",
    home: "Warriors",
    away: "Nuggets",
    homeAbbr: "GSW",
    awayAbbr: "DEN",
    kickoff: kick(1, 22, 30),
    options: [opt("sg-sp-gsw-h", "Warriors", 0.51), opt("sg-sp-gsw-a", "Nuggets", 0.49)],
  }),
  match({
    id: "sg-sp-phi",
    league: "NFL",
    home: "Eagles",
    away: "Cowboys",
    homeAbbr: "PHI",
    awayAbbr: "DAL",
    kickoff: kick(1, 23, 15),
    options: [opt("sg-sp-phi-h", "Eagles", 0.58), opt("sg-sp-phi-a", "Cowboys", 0.42)],
  }),
  // +2 · 2
  match({
    id: "sg-sp-int",
    league: "Serie A",
    home: "Inter",
    away: "Milan",
    homeAbbr: "INT",
    awayAbbr: "MIL",
    kickoff: kick(2, 20, 45),
    options: threeWay("Inter", "Milan", [0.47, 0.27, 0.26], "sg-sp-int"),
  }),
  match({
    id: "sg-sp-mia",
    league: "MLS",
    home: "Inter Miami",
    away: "LAFC",
    homeAbbr: "MIA",
    awayAbbr: "LAF",
    kickoff: kick(2, 23, 0),
    options: threeWay("Inter Miami", "LAFC", [0.5, 0.25, 0.25], "sg-sp-mia"),
  }),
  // +3 · 3
  match({
    id: "sg-sp-atl",
    league: "La Liga",
    home: "Atletico",
    away: "Barcelona",
    homeAbbr: "ATM",
    awayAbbr: "BAR",
    kickoff: kick(3, 21, 0),
    options: threeWay("Atletico", "Barcelona", [0.33, 0.26, 0.41], "sg-sp-atl"),
  }),
  match({
    id: "sg-sp-tot",
    league: "Premier League",
    home: "Tottenham",
    away: "Newcastle",
    homeAbbr: "TOT",
    awayAbbr: "NEW",
    kickoff: kick(3, 18, 0),
    options: threeWay("Tottenham", "Newcastle", [0.49, 0.25, 0.26], "sg-sp-tot"),
  }),
  match({
    id: "sg-sp-mem",
    league: "NBA",
    home: "Grizzlies",
    away: "Suns",
    homeAbbr: "MEM",
    awayAbbr: "PHX",
    kickoff: kick(3, 23, 30),
    options: [opt("sg-sp-mem-h", "Grizzlies", 0.55), opt("sg-sp-mem-a", "Suns", 0.45)],
  }),
  // +4 · 2
  match({
    id: "sg-sp-lei",
    league: "Premier League",
    home: "Leicester",
    away: "Everton",
    homeAbbr: "LEI",
    awayAbbr: "EVE",
    kickoff: kick(4, 19, 30),
    options: threeWay("Leicester", "Everton", [0.38, 0.29, 0.33], "sg-sp-lei"),
  }),
  match({
    id: "sg-sp-sfo",
    league: "NFL",
    home: "49ers",
    away: "Seahawks",
    homeAbbr: "SF",
    awayAbbr: "SEA",
    kickoff: kick(4, 22, 0),
    options: [opt("sg-sp-sfo-h", "49ers", 0.64), opt("sg-sp-sfo-a", "Seahawks", 0.36)],
  }),
  // +5 · 1
  match({
    id: "sg-sp-por",
    league: "Primeira Liga",
    home: "Porto",
    away: "Benfica",
    homeAbbr: "POR",
    awayAbbr: "SLB",
    kickoff: kick(5, 20, 15),
    options: threeWay("Porto", "Benfica", [0.42, 0.28, 0.3], "sg-sp-por"),
  }),
];

/** 网球抢七两态（供应商比分串原样喂入，展示层 formatter 负责上标）。 */
const TENNIS_FIXTURE: SportsMatch[] = [
  {
    ...match({
      id: "sg-sp-wta-tb-done",
      league: "WTA",
      home: "Tatiana Prozorova",
      away: "Sofia Costoulas",
      homeAbbr: "PRO",
      awayAbbr: "COS",
      kickoff: new Date(Date.now() - 96 * 60_000),
      options: [opt("sg-sp-wta-tb-done-h", "Tatiana Prozorova", 0.53), opt("sg-sp-wta-tb-done-a", "Sofia Costoulas", 0.47)],
      live: { minute: 96, score: "5-7, 7-6(7-2), 2-1", phase: "3rd set" },
    }),
    sport: "tennis",
  },
  {
    ...match({
      id: "sg-sp-wta-tb-live",
      league: "WTA",
      home: "Tamara Zidansek",
      away: "Kimberly Birrell",
      homeAbbr: "ZID",
      awayAbbr: "BIR",
      kickoff: new Date(Date.now() - 118 * 60_000),
      options: [opt("sg-sp-wta-tb-live-h", "Tamara Zidansek", 0.29), opt("sg-sp-wta-tb-live-a", "Kimberly Birrell", 0.71)],
      live: { minute: 118, score: "6-7(2-7), 6-6", phase: "3rd set" },
    }),
    sport: "tennis",
  },
  ...SPORTS_FIXTURE.slice(0, 2),
];

/** 引擎 phase 枚举（LIVE / BREAK / DECISION）与引擎比分串 `0-1` 原样喂入，展示层负责翻译。 */
const PHASE_FIXTURE: SportsMatch[] = [
  {
    ...match({
      id: "sg-sp-cs2-break",
      league: "IEM Cologne · BO3",
      home: "Spirit",
      away: "MOUZ",
      homeAbbr: "SPIRIT",
      awayAbbr: "MOUZ",
      kickoff: new Date(Date.now() - 71 * 60_000),
      options: [opt("sg-sp-cs2-break-h", "Spirit", 0.55), opt("sg-sp-cs2-break-a", "MOUZ", 0.45)],
      live: { minute: 71, score: "0-1", phase: "BREAK" },
    }),
    sport: "esports",
  },
  {
    ...match({
      id: "sg-sp-ufc-decision",
      league: "UFC 321",
      home: "Pereira",
      away: "Ankalaev",
      homeAbbr: "PER",
      awayAbbr: "ANK",
      kickoff: new Date(Date.now() - 28 * 60_000),
      options: [opt("sg-sp-ufc-decision-h", "Pereira", 0.48), opt("sg-sp-ufc-decision-a", "Ankalaev", 0.52)],
      live: { minute: 28, score: "", phase: "DECISION" },
    }),
    sport: "mma",
  },
  ...SPORTS_FIXTURE.slice(0, 2),
];

/** 美式运动列表卡 live 位：有钟的写节次钟，棒球写半局 + 局次（liveLabel 由 sportsData 统一算出）。 */
const US_LIVE_FIXTURE: SportsMatch[] = [
  {
    ...match({
      id: "sg-sp-nfl-live",
      league: "NFL",
      home: "Kansas City Chiefs",
      away: "Buffalo Bills",
      homeAbbr: "KC",
      awayAbbr: "BUF",
      kickoff: new Date(Date.now() - 100 * 60_000),
      options: [opt("sg-sp-nfl-live-h", "Chiefs", 0.54), opt("sg-sp-nfl-live-a", "Bills", 0.46)],
      live: { minute: 100, score: "17-14", phase: "LIVE" },
    }),
    sport: "american_football",
    liveLabel: "Q3 8:42",
  },
  {
    ...match({
      id: "sg-sp-mlb-live",
      league: "MLB",
      home: "Los Angeles Dodgers",
      away: "New York Yankees",
      homeAbbr: "LAD",
      awayAbbr: "NYY",
      kickoff: new Date(Date.now() - 130 * 60_000),
      options: [opt("sg-sp-mlb-live-h", "Dodgers", 0.58), opt("sg-sp-mlb-live-a", "Yankees", 0.42)],
      live: { minute: 130, score: "4-3", phase: "LIVE" },
    }),
    sport: "baseball",
    liveLabel: "\u25BC 7th",
  },
  {
    ...match({
      id: "sg-sp-nhl-live",
      league: "NHL",
      home: "Toronto Maple Leafs",
      away: "Montreal Canadiens",
      homeAbbr: "TOR",
      awayAbbr: "MTL",
      kickoff: new Date(Date.now() - 60 * 60_000),
      options: [opt("sg-sp-nhl-live-h", "Maple Leafs", 0.51), opt("sg-sp-nhl-live-a", "Canadiens", 0.49)],
      live: { minute: 60, score: "2-1", phase: "LIVE" },
    }),
    sport: "hockey",
    liveLabel: "P2 12:07",
  },
  ...SPORTS_FIXTURE.slice(0, 1),
];

/** League break — no fixtures at all. */
const EMPTY_SPORTS_FIXTURE: SportsMatch[] = [];

/* ---------------- ③ Sports band ---------------- */

const SportsDemo = ({
  pickDay = false,
  matches = SPORTS_FIXTURE,
}: {
  pickDay?: boolean;
  matches?: SportsMatch[];
}) => {
  const isMobile = useIsMobile();
  const bucket = useMemo(() => {
    if (!pickDay) return undefined;
    const strip = buildDayStrip(matches);
    return strip.find((d) => d.id !== "all")?.id;
  }, [matches, pickDay]);

  if (isMobile) {
    return <MobileSportsModule matches={matches} onOpenAll={() => undefined} />;
  }
  return (
    <SportsStageCard
      key={bucket ?? "all"}
      matches={matches}
      onOpenAll={() => undefined}
      initialBucket={bucket}
    />
  );
};

export const Ev9Preview = () => (
  <Stage>
    <SportsDemo />
  </Stage>
);

export const Ev9ePreview = () => (
  <Stage>
    <SportsDemo matches={EMPTY_SPORTS_FIXTURE} />
  </Stage>
);

/** EV-9t · 网球抢七比分串：桌面 = 品类页 LiteSportsView「Playing now」，移动 = MobileSportsModule。 */
const TennisListDemo = ({ liveFirst = false }: { liveFirst?: boolean }) => {
  const isMobile = useIsMobile();
  // 移动模块只置顶一场 live，所以两态各给一个 case：默认抢七已决在前，liveFirst 把抢七进行中放到第一位。
  const rows = liveFirst
    ? [TENNIS_FIXTURE[1], TENNIS_FIXTURE[0], ...TENNIS_FIXTURE.slice(2)]
    : TENNIS_FIXTURE;
  if (isMobile) {
    return <MobileSportsModule matches={rows} onOpenAll={() => undefined} />;
  }
  return <LiteSportsView matches={rows} now={Date.now()} />;
};

/** EV-9b · 引擎 phase 枚举翻译 + 比分串统一格式（`0-1` → `0 – 1`）。 */
const PhaseListDemo = () => {
  const isMobile = useIsMobile();
  if (isMobile) {
    return <MobileSportsModule matches={PHASE_FIXTURE} onOpenAll={() => undefined} />;
  }
  return <LiteSportsView matches={PHASE_FIXTURE} now={Date.now()} />;
};

export const Ev9bPreview = () => (
  <Stage>
    <PhaseListDemo />
  </Stage>
);

/** EV-9u · 美式运动 live 位（NFL / MLB / NHL）。 */
const UsListDemo = () => {
  const isMobile = useIsMobile();
  if (isMobile) {
    return <MobileSportsModule matches={US_LIVE_FIXTURE} onOpenAll={() => undefined} />;
  }
  return <LiteSportsView matches={US_LIVE_FIXTURE} now={Date.now()} />;
};

export const Ev9uPreview = () => (
  <Stage>
    <UsListDemo />
  </Stage>
);

export const Ev9tPreview = () => (
  <Stage>
    <TennisListDemo />
  </Stage>
);

export const Ev9t2Preview = () => (
  <Stage>
    <TennisListDemo liveFirst />
  </Stage>
);

export const Ev10Preview = () => (
  <Stage>
    <SportsDemo pickDay />
  </Stage>
);

/* ---------------- ④ card grid (FROZEN card) ---------------- */

export const Ev11Preview = () => (
  <Stage>
    <Grid>
      <Card market={BINARY()} />
    </Grid>
  </Stage>
);

export const Ev12Preview = () => (
  <Stage>
    <Grid>
      <Card market={MULTI()} />
    </Grid>
  </Stage>
);

export const Ev13Preview = () => (
  <Stage>
    <Grid>
      <Card market={ENDS_SOON()} />
    </Grid>
  </Stage>
);

export const Ev14Preview = () => (
  <Stage>
    <Grid>
      <Card market={NEW_EVENT()} />
    </Grid>
  </Stage>
);

export const Ev15Preview = () => (
  <Stage>
    <Grid>
      <Card market={TRENDING()} cutoff={1_000_000} />
    </Grid>
  </Stage>
);

export const Ev16Preview = () => (
  <Stage>
    <Grid>
      <Card market={BOOSTED()} boostMax={5} />
    </Grid>
  </Stage>
);

export const Ev17Preview = () => (
  <Stage>
    <Grid>
      <Card market={ENDS_SOON()} boostMax={5} />
      <Card market={TRENDING()} boostMax={3} cutoff={1_000_000} />
      <Card market={INTRADAY_TRENDING()} boostMax={5} cutoff={1_000_000} />
    </Grid>
  </Stage>
);

export const Ev18Preview = () => (
  <Stage>
    <Grid>
      <Card market={BINARY()} />
      <Card market={MULTI()} />
      <Card market={BOOSTED()} boostMax={5} />
    </Grid>
  </Stage>
);

/* ============================================================
 * M1b · 分区⑤ Calendar / ⑥ Watchlist / ⑦ 加载与空态 / ⑧ 页尾
 * 同 M1a 总则：全部 fixture 确定性注入，禁止运行时 fetch。
 * ============================================================ */

/** Day-offset expiry so the week strip never rots. */
const atDay = (dayOffset: number, hour: number, minute = 0): Date => {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
};

const calEvent = (o: {
  id: string;
  name: string;
  category: string;
  at: Date;
  children?: EventRow["children"];
}): EventRow => ({
  ...eventFixture({ id: o.id, name: o.name, category: o.category, settlesInH: 1 }),
  expiry: o.at,
  children: o.children ?? [child("yes", "Yes", 0.55), child("no", "No", 0.45)],
});

/** General + sports + intraday all land in the same week window. */
const CALENDAR_EVENTS: EventRow[] = [
  calEvent({
    id: "sg-cal-cpi",
    name: "Will August CPI come in above 3%?",
    category: "macro",
    at: atDay(0, 14, 30),
  }),
  calEvent({
    id: "sg-cal-fed",
    name: "Will the Fed cut rates in September?",
    category: "macro",
    at: atDay(1, 20, 0),
  }),
  calEvent({
    id: "sg-cal-btc",
    name: "Will BTC close above $120K this week?",
    category: "crypto",
    at: atDay(2, 23, 59),
  }),
  calEvent({
    id: "sg-cal-oscar",
    name: "Who wins the 2026 Best Picture?",
    category: "entertainment",
    at: atDay(3, 22, 0),
    children: [
      child("a", "Dune: Part Three", 0.41),
      child("b", "The Brutalist II", 0.27),
      child("c", "Anora", 0.18),
      child("d", "Sinners", 0.14),
    ],
  }),
  calEvent({
    id: "sg-cal-elec",
    name: "Will the midterm turnout beat 2022?",
    category: "politics",
    at: atDay(4, 19, 0),
  }),
  calEvent({
    id: "sg-cal-nvda",
    name: "Will NVDA beat earnings expectations?",
    category: "tech",
    at: atDay(5, 21, 30),
  }),
  calEvent({
    id: "sg-cal-eth",
    name: "Will ETH flip $5K before the month ends?",
    category: "crypto",
    at: atDay(6, 23, 0),
  }),
];

/** Stocks rows for the calendar's intraday standing row (relative to today). */
const CALENDAR_STOCKS: StockEventRow[] = US_ROWS.map((r, i) => ({
  ...r,
  start_date: atDay(0, 9, 30).toISOString(),
  end_date: atDay(0, 16, 0).toISOString(),
  id: `${r.id}-cal-${i}`,
}));

const CalendarDemo = ({ mode }: { mode: "day" | "week" }) => {
  const isMobile = useIsMobile();
  return (
    <Stage>
      <LiteCalendarView
        events={CALENDAR_EVENTS}
        matches={SPORTS_FIXTURE}
        stocks={CALENDAR_STOCKS}
        sector="all"
        isMobile={!!isMobile}
        onBackToList={() => undefined}
        onOpenIntraday={() => undefined}
        initialMode={mode}
      />
    </Stage>
  );
};

export const Ev19Preview = () => <CalendarDemo mode="week" />;
export const Ev20Preview = () => <CalendarDemo mode="day" />;

/* ---------------- ⑥ Watchlist ---------------- */

/** Guest entry state — the chip pair as it sits at the end of the filter row. */
export const Ev21Preview = () => {
  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <Stage>
        <MobileCategoryRow
          categories={MOBILE_CATEGORIES}
          value="all"
          onSelect={() => undefined}
          watchlistActive={false}
          watchlistCount={0}
          onWatchlist={() => undefined}
          calendarActive={false}
          onCalendar={() => undefined}
          boostActive={false}
          onBoost={() => undefined}
        />
      </Stage>
    );
  }
  return (
    <Stage>
      <div className="flex items-center justify-end gap-2">
        <WatchlistChip active={false} count={0} showLabel onClick={() => undefined} />
        <CalendarChip active={false} onClick={() => undefined} />
      </div>
    </Stage>
  );
};

export const Ev22Preview = () => (
  <Stage>
    <EmptyState
      variant="page"
      title="Nothing starred yet"
      description="Tap the ★ on any market and it'll show up here."
      actionLabel="See all markets"
      onAction={() => undefined}
    />
  </Stage>
);

/** Starred set keeps the user's own order — sortLiteLiveList is NOT applied. */
const WATCHLIST_FIXTURE: EventRow[] = [
  MULTI(),
  BINARY(),
  BOOSTED(),
];

export const Ev23Preview = () => (
  <Stage>
    <Grid>
      {WATCHLIST_FIXTURE.map((m) => (
        <Card key={m.id} market={m} />
      ))}
    </Grid>
  </Stage>
);

/* ---------------- ⑦ 空态 ---------------- */

export const Ev26Preview = () => (
  <Stage>
    <EmptyState
      variant="page"
      title="No open markets here right now"
      description="New markets land in this topic as they open. Check back soon."
      actionLabel="See all markets"
      onAction={() => undefined}
    />
  </Stage>
);


/* ================================================================
 * ⑨ Sports 列表 · 直播与直播预告（EV-36 … EV-45，CPO 2026-11-04）
 * 桌面帧 = 品类页 LiteSportsView，375 帧 = MobileSportsModule filters（品类页手机形态）。
 * 全部挂冻结时钟 FROZEN_NOW；视频用 SP-L 同一条测试流；Remind me 用 fixture（不碰库）。
 * ================================================================ */
const MIN_MS = 60_000;
const STREAM_SRC = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

const sm = (
  o: Partial<SportsMatch> & Pick<SportsMatch, "id" | "league" | "home" | "away" | "homeAbbr" | "awayAbbr">,
  kickoffMin: number,
): SportsMatch => ({
  name: `${o.home} vs ${o.away}`,
  format: "1x2",
  kickoff: new Date(FROZEN_NOW + kickoffMin * MIN_MS),
  endDate: new Date(FROZEN_NOW + (kickoffMin + 120) * MIN_MS),
  live: kickoffMin <= 0,
  minute: null,
  phase: null,
  score: null,
  streamUrl: null,
  volume: 900_000,
  options: [],
  ...o,
});

/* live, on stream */
const SL_ARS = sm({ id: "sg-sl-ars-rma", league: "UEFA Champions League", home: "Arsenal", away: "Real Madrid", homeAbbr: "ARS", awayAbbr: "RMA", sport: "soccer", minute: 63, phase: "2nd half", score: "1-0", streamUrl: STREAM_SRC, volume: 4_200_000,
  options: [opt("sg-sl-ars-h", "Arsenal", 0.68), opt("sg-sl-ars-d", "Draw", 0.21), opt("sg-sl-ars-a", "Real Madrid", 0.11)] }, -63);
const SL_T1 = sm({ id: "sg-sl-t1-gen", league: "LCK", home: "T1", away: "Gen.G", homeAbbr: "T1", awayAbbr: "GEN", sport: "lol", format: "h2h", liveLabel: "Game 2", score: "1-0", streamUrl: STREAM_SRC, volume: 2_600_000,
  options: [opt("sg-sl-t1-h", "T1", 0.61), opt("sg-sl-t1-a", "Gen.G", 0.39)] }, -55);
const SL_LIV = sm({ id: "sg-sl-liv-mci", league: "Premier League", home: "Liverpool", away: "Manchester City", homeAbbr: "LIV", awayAbbr: "MCI", awayShort: "Man City", sport: "soccer", minute: 24, phase: "1st half", score: "0-0", streamUrl: STREAM_SRC, volume: 3_100_000,
  options: [opt("sg-sl-liv-h", "Liverpool", 0.39), opt("sg-sl-liv-d", "Draw", 0.3), opt("sg-sl-liv-a", "Man City", 0.31)] }, -24);
const SL_SPI = sm({ id: "sg-sl-spi-mouz", league: "IEM Cologne · BO3", home: "Spirit", away: "MOUZ", homeAbbr: "SPIRIT", awayAbbr: "MOUZ", sport: "esports", format: "h2h", liveLabel: "Map 2", score: "1-0", streamUrl: STREAM_SRC, volume: 482_000,
  options: [opt("sg-sl-spi-h", "SPIRIT", 0.7), opt("sg-sl-spi-a", "MOUZ", 0.3)] }, -40);
/* live, no stream */
const SL_NFL = sm({ id: "sg-sl-nfl", league: "NFL", home: "Kansas City Chiefs", away: "Buffalo Bills", homeAbbr: "KC", awayAbbr: "BUF", homeShort: "Chiefs", awayShort: "Bills", sport: "american_football", format: "h2h", liveLabel: "Q3 8:42", score: "17-14", volume: 1_100_000,
  options: [opt("sg-sl-nfl-h", "Chiefs", 0.56), opt("sg-sl-nfl-a", "Bills", 0.44)] }, -95);
/* upcoming, on stream (countdown variants: < 1h · < 24h · ≥ 24h · > 48h) */
const UP_BAR = sm({ id: "sg-up-bar-psg", league: "UEFA Champions League", home: "Barcelona", away: "Paris Saint-Germain", homeAbbr: "BAR", awayAbbr: "PSG", awayShort: "PSG", sport: "soccer", streamUrl: STREAM_SRC, volume: 3_900_000,
  options: [opt("sg-up-bar-h", "Barcelona", 0.46), opt("sg-up-bar-d", "Draw", 0.26), opt("sg-up-bar-a", "PSG", 0.28)] }, 38);
const UP_BLG = sm({ id: "sg-up-blg-jdg", league: "LPL", home: "Bilibili Gaming", away: "JD Gaming", homeAbbr: "BLG", awayAbbr: "JDG", homeShort: "BLG", awayShort: "JDG", sport: "lol", format: "h2h", streamUrl: STREAM_SRC, volume: 1_400_000,
  options: [opt("sg-up-blg-h", "BLG", 0.57), opt("sg-up-blg-a", "JDG", 0.43)] }, 320);
const UP_MUN = sm({ id: "sg-up-mun-tot", league: "Premier League", home: "Manchester United", away: "Tottenham", homeAbbr: "MUN", awayAbbr: "TOT", homeShort: "Man United", sport: "soccer", streamUrl: STREAM_SRC, volume: 2_300_000,
  options: [opt("sg-up-mun-h", "Man United", 0.41), opt("sg-up-mun-d", "Draw", 0.27), opt("sg-up-mun-a", "Tottenham", 0.32)] }, 22 * 60);
const UP_HLE = sm({ id: "sg-up-hle-dk", league: "LCK", home: "Hanwha Life", away: "Dplus KIA", homeAbbr: "HLE", awayAbbr: "DK", homeShort: "HLE", awayShort: "DK", sport: "lol", format: "h2h", streamUrl: STREAM_SRC, volume: 900_000,
  options: [opt("sg-up-hle-h", "HLE", 0.64), opt("sg-up-hle-a", "DK", 0.36)] }, 31 * 60);
const UP_NAVI = sm({ id: "sg-up-navi-faze", league: "IEM Cologne · BO3", home: "NAVI", away: "FaZe", homeAbbr: "NAVI", awayAbbr: "FAZE", sport: "esports", format: "h2h", streamUrl: STREAM_SRC, volume: 610_000,
  options: [opt("sg-up-navi-h", "NAVI", 0.45), opt("sg-up-navi-a", "FaZe", 0.55)] }, 60 * 60);
/* upcoming, no stream */
const UP_JUV = sm({ id: "sg-up-juv-nap", league: "Serie A", home: "Juventus", away: "Napoli", homeAbbr: "JUV", awayAbbr: "NAP", sport: "soccer", volume: 1_700_000,
  options: [opt("sg-up-juv-h", "Juventus", 0.38), opt("sg-up-juv-d", "Draw", 0.3), opt("sg-up-juv-a", "Napoli", 0.32)] }, 26 * 60);

const STREAMS_SINGLE = [SL_SPI, SL_NFL, UP_JUV];
const STREAMS_MULTI = [SL_SPI, SL_ARS, SL_T1, SL_LIV, SL_NFL, UP_BAR, UP_BLG, UP_MUN, UP_HLE, UP_NAVI, UP_JUV];
const PREVIEW_ONE = [SL_SPI, SL_NFL, UP_BAR, UP_JUV];
const PREVIEW_TWO = [SL_SPI, SL_NFL, UP_BAR, UP_BLG, UP_JUV];
const PREVIEW_MANY = [SL_SPI, SL_NFL, UP_BAR, UP_BLG, UP_MUN, UP_HLE, UP_NAVI, UP_JUV];
const PREVIEW_NO_LIVE_STREAM = [SL_NFL, UP_BAR, UP_BLG, UP_MUN, UP_JUV];

/** Click one production control after mount — opens the state the case documents. */
const ClickAfterMount = ({ selector, children }: { selector: string; children: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const id = window.setTimeout(() => {
      (ref.current?.querySelector(selector) as HTMLElement | null)?.click();
    }, 400);
    return () => window.clearTimeout(id);
  }, [selector]);
  return <div ref={ref}>{children}</div>;
};

const StreamsDemo = ({
  matches,
  reminded,
  guest,
  streamFixture,
}: {
  matches: SportsMatch[];
  reminded?: string[];
  guest?: boolean;
  streamFixture?: "loading" | "blocked";
}) => {
  const isMobile = useIsMobile();
  const fx = reminded ?? [];
  if (isMobile) {
    return (
      <MobileSportsModule
        matches={matches}
        filters
        onOpenAll={() => undefined}
        now={FROZEN_NOW}
        remindedFixture={fx}
        remindGuestFixture={guest}
        streamFixture={streamFixture}
      />
    );
  }
  return (
    <LiteSportsView
      matches={matches}
      now={FROZEN_NOW}
      remindedFixture={fx}
      remindGuestFixture={guest}
      streamFixture={streamFixture}
    />
  );
};

export const Ev36Preview = () => <Stage><StreamsDemo matches={STREAMS_SINGLE} /></Stage>;
export const Ev37Preview = () => <Stage><StreamsDemo matches={STREAMS_MULTI} /></Stage>;
/** EV-37b · click the third switcher tab (T1 vs Gen.G) — the stage swaps video + scoreboard. */
export const Ev37bPreview = () => (
  <Stage>
    <ClickAfterMount selector='[data-stream-tab="sg-sl-t1-gen"]'>
      <StreamsDemo matches={STREAMS_MULTI} />
    </ClickAfterMount>
  </Stage>
);
export const Ev38Preview = () => <Stage><StreamsDemo matches={STREAMS_SINGLE} streamFixture="loading" /></Stage>;
export const Ev39Preview = () => <Stage><StreamsDemo matches={STREAMS_SINGLE} streamFixture="blocked" /></Stage>;
export const Ev40Preview = () => <Stage><StreamsDemo matches={PREVIEW_ONE} /></Stage>;
export const Ev41Preview = () => <Stage><StreamsDemo matches={PREVIEW_TWO} /></Stage>;
export const Ev42Preview = () => <Stage><StreamsDemo matches={PREVIEW_MANY} /></Stage>;
export const Ev43Preview = () => <Stage><StreamsDemo matches={PREVIEW_MANY} reminded={[UP_BAR.id, UP_MUN.id]} /></Stage>;
export const Ev44Preview = () => <Stage><StreamsDemo matches={PREVIEW_NO_LIVE_STREAM} /></Stage>;
/** EV-45 · guest taps Remind me → AuthDialog (desktop) / AuthSheet (mobile). */
export const Ev45Preview = () => (
  <Stage>
    <ClickAfterMount selector="[data-remind]">
      <StreamsDemo matches={PREVIEW_ONE} guest />
    </ClickAfterMount>
    {/* login step locked: a signed-in viewer would otherwise jump to Create your wallet */}
    <AuthPromptHost previewStep="login" />
  </Stage>
);
