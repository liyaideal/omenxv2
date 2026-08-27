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
  type StockEventRow,
  type Timeframe,
  useQuickRounds,
  useSecondTick,
} from "@/components/lite/intraday/intradayData";
import { buildDayStrip, useSportsMatches } from "@/components/lite/sports/sportsData";

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
  const tickSeconds = useSecondTick();
  const { currentFor, historyFor } = useQuickRounds(true);
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

/* ---------------- ③ Sports band ---------------- */

const SportsDemo = ({ pickDay = false }: { pickDay?: boolean }) => {
  const isMobile = useIsMobile();
  const { rows: matches } = useSportsMatches();
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
