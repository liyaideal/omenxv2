// ============================================================
// /style-guide → Events 列表（M1a 分区①–④）。
// 每个 case 都挂生产组件；fixture 只注数据与状态。
// LiteEventCard 是 FROZEN 件：这里只摆放，零改样式。
// ============================================================
import { useMemo, useState } from "react";
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
import {
  COINS,
  type Coin,
  type QuickEvent,
  type StockEventRow,
  TF_SECONDS,
  TIMEFRAMES,
  type Timeframe,
} from "@/components/lite/intraday/intradayData";
import { buildDayStrip, type SportsMatch } from "@/components/lite/sports/sportsData";

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
  fundingRate: 0,
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
  name: `${m.home} v ${m.away}`,
  league: m.league,
  home: m.home,
  away: m.away,
  homeAbbr: m.homeAbbr,
  awayAbbr: m.awayAbbr,
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
    live: { minute: 33, score: "1 – 0", phase: "1st half" },
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
