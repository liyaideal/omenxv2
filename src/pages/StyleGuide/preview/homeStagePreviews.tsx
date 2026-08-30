// ============================================================
// SG-HP · 主页 stage（HP-1）+ /spot session 三态（ST-1）previews。
//
// 铁律：只挂生产组件；fixture 只注数据与状态（禁布局型 prop、禁运行时
// fetch、禁 Date.now 派生的可变文案）。二阶漂移全部冻结：
//   - tickSeconds = 41（固定），派生价因此恒定；
//   - session 三态用 nowOverride 冻结（生产不传 = 实时钟，行为零变化）；
//   - 日期一律相对偏移，倒计时值由冻结的 nowOverride 反推。
// ============================================================
import { useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { HomeHero } from "@/components/lite/home/HomeHero";
import { HomeTape, HomeTapeSkeleton, type TapeItem } from "@/components/lite/home/HomeTape";
import { HomeCryptoCard } from "@/components/lite/home/HomeCryptoCard";
import { HomeStocksCard } from "@/components/lite/home/HomeStocksCard";
import { HomeSportsCard } from "@/components/lite/home/HomeSportsCard";
import { HomeDeskCard } from "@/components/lite/home/HomeDeskCard";
import {
  CatalogueHeaderRow,
  CatalogueIdentityCard,
} from "@/pages/lite/LiteEventsPage";
import {
  LiteAllStageSkeleton,
  LiteMarketGridSkeleton,
  LiteMarketListSkeleton,
  LiteMobileStageSkeleton,
} from "@/components/lite/skeletons/LiteEventsSkeletons";
import {
  COINS,
  type Coin,
  HK_STOCK_SUBTYPE,
  type QuickEvent,
  type StockEventRow,
  TF_SECONDS,
  TIMEFRAMES,
  type Timeframe,
  US_STOCK_SUBTYPE,
} from "@/components/lite/intraday/intradayData";
import type { SportsMatch } from "@/components/lite/sports/sportsData";
import type { EditorPick } from "@/components/lite/picks/editorialPicks";
import { SpotSessionBanner } from "@/components/lite/trade/SpotSessionBanner";
import { LiteOrderPanel } from "@/components/lite/trade/LiteOrderPanel";
import {
  HK_STOCK_MARKET,
  US_STOCK_MARKET,
  getStockSessionState,
} from "@/lib/usStockSessions";
import { useState } from "react";

/* ------------------------------ shells ---------------------------------- */

const Stage = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[#0A0B0D] p-4">{children}</div>
);

/** Frozen second tick — the derived tile/tape price is a function of it. */
const TICK = 41;

/* --------------------------- frozen session clocks ----------------------- */

/**
 * Session fixtures are anchored to a fixed weekday/weekend instant in the
 * VIEWER's own zone, so the phase a case demonstrates never depends on when
 * the page is opened. Times are chosen against each market's local calendar.
 */
const tzOffsetMinutes = (d: Date, tz: string): number => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(d);
  const g = (t: string) => Number(parts.find((x) => x.type === t)?.value ?? 0);
  const asUtc = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour") % 24, g("minute"));
  return (asUtc - d.getTime()) / 60_000;
};

/** Fixed exchange wall-clock instant on the next given weekday. */
const atMarketClock = (tz: string, dow: number, h: number, m = 0): Date => {
  const base = Date.now();
  for (let i = 0; i < 8; i += 1) {
    const cand = new Date(base + i * 86_400_000);
    const off = tzOffsetMinutes(cand, tz);
    const local = new Date(cand.getTime() + off * 60_000);
    if (local.getUTCDay() === dow) {
      return new Date(
        Date.UTC(
          local.getUTCFullYear(),
          local.getUTCMonth(),
          local.getUTCDate(),
          h,
          m,
        ) -
          off * 60_000,
      );
    }
  }
  return new Date(base);
};

const US_TZ = US_STOCK_MARKET.tz;

/** US live: Wednesday 11:00 ET (inside 09:30–16:00). */
export const NOW_US_LIVE = atMarketClock(US_TZ, 3, 11, 0);
/** US settling: Wednesday 16:22 ET → 38:00 left of the 60-minute window. */
export const NOW_US_SETTLING = atMarketClock(US_TZ, 3, 16, 22);
/** US pre-session: Sunday 14:00 ET → next open is Monday 09:30 (weekend rule). */
export const NOW_US_PRESESSION = atMarketClock(US_TZ, 0, 14, 0);
/** SP-17: close + 15 min ET → 45:00 left. */
export const NOW_SPOT_SETTLING = atMarketClock(US_TZ, 3, 16, 15);

/* --------------------------- crypto fixtures ----------------------------- */

const COIN_FIXTURE: Record<Coin, { base: number; up: number; hist: string }> = {
  btc: { base: 61_982.48, up: 0.54, hist: "uuduuudu" },
  eth: { base: 2_984.11, up: 0.5, hist: "duuduudd" },
  sol: { base: 214.6, up: 0.56, hist: "udduuddu" },
};

const quickFixture = () => {
  const currentFor = new Map<string, QuickEvent>();
  const historyFor = new Map<string, ("up" | "down")[]>();
  const now = Date.now();
  for (const coin of COINS) {
    const cfg = COIN_FIXTURE[coin];
    for (const { id: tf } of TIMEFRAMES) {
      const key = `${coin}-${tf}`;
      const end = now + Math.floor(TF_SECONDS[tf] * 0.62) * 1000;
      const start = end - TF_SECONDS[tf] * 1000;
      currentFor.set(key, {
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
      historyFor.set(key, cfg.hist.split("").map((c) => (c === "u" ? "up" : "down")));
    }
  }
  return { currentFor, historyFor };
};

const QUICK = quickFixture();

const CryptoDemo = ({ initialTf }: { initialTf?: Timeframe }) => {
  const isMobile = useIsMobile();
  const [tf, setTf] = useState<Timeframe>(initialTf ?? "15m");
  return (
    <Stage>
      <HomeCryptoCard
        currentFor={QUICK.currentFor}
        historyFor={QUICK.historyFor}
        tf={tf}
        onSelectTf={setTf}
        tickSeconds={TICK}
        isMobile={!!isMobile}
      />
    </Stage>
  );
};

/** EV-5 · Crypto 默认（BTC 主 tile + ETH/SOL 紧凑列，模块级 ROUND dial）。 */
export const Ev5Preview = () => <CryptoDemo />;
/** EV-6 · 模块级 dial 选中 1h（三 tile 同步）。 */
export const Ev6Preview = () => <CryptoDemo initialTf="1h" />;

/* ---------------------------- stocks fixtures ---------------------------- */

const usRow = (
  ticker: string,
  base: number,
  up: number,
  n: number,
): StockEventRow => ({
  id: `us-${ticker.toLowerCase()}-updown-2026083${n % 10}`,
  name: `${ticker} — will it close higher today?`,
  base_price: base,
  start_date: new Date(Date.now() - 5 * 3_600_000).toISOString(),
  end_date: new Date(Date.now() + 3 * 3_600_000).toISOString(),
  freeze_time: null,
  event_subtype: US_STOCK_SUBTYPE,
  upPrice: up,
  downPrice: Number((1 - up).toFixed(2)),
});

const hkRow = (
  code: string,
  base: number,
  up: number,
  n: number,
): StockEventRow => ({
  id: `hk-${code}-updown-2026083${n % 10}`,
  name: `${code}.HK — will it close higher today?`,
  base_price: base,
  start_date: new Date(Date.now() - 5 * 3_600_000).toISOString(),
  end_date: new Date(Date.now() + 3 * 3_600_000).toISOString(),
  freeze_time: null,
  event_subtype: HK_STOCK_SUBTYPE,
  upPrice: up,
  downPrice: Number((1 - up).toFixed(2)),
});

/** 10 US rows (name-roll matches production) + 6 HK rows. */
const US_ROWS: StockEventRow[] = [
  usRow("AAPL", 232.85, 0.52, 1),
  usRow("NVDA", 182.45, 0.47, 2),
  usRow("TSLA", 268.3, 0.55, 3),
  usRow("MSFT", 445.2, 0.49, 4),
  usRow("AMZN", 218.75, 0.53, 5),
  usRow("META", 615.4, 0.46, 6),
  usRow("GOOGL", 195.8, 0.51, 7),
  usRow("AMD", 148.6, 0.44, 8),
  usRow("COIN", 302.15, 0.58, 9),
  usRow("HOOD", 42.3, 0.5, 0),
];

const HK_ROWS: StockEventRow[] = [
  hkRow("9988", 140.39, 0.54, 1),
  hkRow("0700", 402.6, 0.51, 2),
  hkRow("3690", 118.4, 0.47, 3),
  hkRow("1810", 24.85, 0.5, 4),
  hkRow("0005", 71.2, 0.45, 5),
  hkRow("1211", 96.55, 0.56, 6),
];

/** One row with no base_price → the single-row failure branch. */
const STALE_ROW: StockEventRow = { ...usRow("SNAP", 0, 0.5, 4), base_price: null };

const StocksDemo = ({
  rows,
  now,
  loading = false,
}: {
  rows: StockEventRow[];
  now?: Date;
  loading?: boolean;
}) => {
  const isMobile = useIsMobile();
  return (
    <Stage>
      <HomeStocksCard
        stockRows={rows}
        tickSeconds={TICK}
        isMobile={!!isMobile}
        loading={loading}
        nowOverride={now}
      />
    </Stage>
  );
};

/**
 * EV-7 · stocks live 态（实时价 + 当日% + Up/Down 可点）。
 * 行集含 US + HK 两组，HK tab 计数不再为 0（fixture 修账 HP-3 §6.2）。
 */
export const Ev7Preview = () => (
  <StocksDemo rows={[...US_ROWS, ...HK_ROWS]} now={NOW_US_LIVE} />
);
/** EV-8 · stocks settling 态（Closed 徽章 + Next session in 38:00 禁用钮）。 */
export const Ev8Preview = () => <StocksDemo rows={US_ROWS} now={NOW_US_SETTLING} />;
/** EV-27 · stocks preSession 态（Last close + NEXT SESSION · opens，可下单）。 */
export const Ev27Preview = () => <StocksDemo rows={US_ROWS} now={NOW_US_PRESESSION} />;
/**
 * EV-28 · US/HK tab 独立：同一时刻下 US 处于 preSession（周日），HK 因时区
 * 已进入周一交易时段 → 切 tab 时行集、模块头文案、货币格式全部独立切换。
 */
export const Ev28Preview = () => (
  <StocksDemo rows={[...US_ROWS, ...HK_ROWS]} now={NOW_US_PRESESSION} />
);
/** EV-29 · 移动形态（5 行 + Show all 10 → / 两层 meta 行）。 */
export const Ev29Preview = () => <StocksDemo rows={US_ROWS} now={NOW_US_PRESESSION} />;
/** EV-30 · 骨架（loading && rows=0）与单行失败（base_price=null）。 */
export const Ev30Preview = () => (
  <div className="flex flex-col">
    <StocksDemo rows={[]} loading now={NOW_US_LIVE} />
    <StocksDemo rows={[STALE_ROW, ...US_ROWS.slice(0, 3)]} now={NOW_US_LIVE} />
  </div>
);

/* ---------------------------- sports fixtures ---------------------------- */

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
  live?: { minute: number; score: string };
}): SportsMatch => ({
  id: m.id,
  name: `${m.home} vs ${m.away}`,
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
  phase: m.live ? "1st half" : null,
  score: m.live?.score ?? null,
  volume: 420_000,
  options: m.options,
});

const three = (h: string, a: string, p: [number, number, number], id: string) => [
  opt(`${id}-h`, h, p[0]),
  opt(`${id}-d`, "Draw", p[1]),
  opt(`${id}-a`, a, p[2]),
];

const two = (h: string, a: string, p: [number, number], id: string) => [
  opt(`${id}-h`, h, p[0]),
  opt(`${id}-a`, a, p[1]),
];

const UP = (
  i: number,
  league: string,
  home: string,
  away: string,
  ha: string,
  aa: string,
  day: number,
  hour: number,
  minute: number,
  p: [number, number, number],
): SportsMatch =>
  match({
    id: `sg-hp-up-${i}`,
    league,
    home,
    away,
    homeAbbr: ha,
    awayAbbr: aa,
    kickoff: kick(day, hour, minute),
    options: three(home, away, p, `sg-hp-up-${i}`),
  });

/** 17 upcoming + 1 live (EV-9 / EV-10). */
const SPORTS: SportsMatch[] = [
  match({
    id: "sg-hp-live-1",
    league: "Premier League",
    home: "Arsenal",
    away: "Chelsea",
    homeAbbr: "ARS",
    awayAbbr: "CHE",
    kickoff: new Date(Date.now() - 33 * 60_000),
    live: { minute: 33, score: "1 – 0" },
    options: three("Arsenal", "Chelsea", [0.58, 0.24, 0.18], "sg-hp-live-1"),
  }),
  UP(1, "Serie A", "Juventus", "Napoli", "JUV", "NAP", 0, 20, 45, [0.4, 0.31, 0.29]),
  UP(2, "La Liga", "Real Madrid", "Sevilla", "RMA", "SEV", 0, 22, 0, [0.66, 0.2, 0.14]),
  UP(3, "Bundesliga", "Bayern", "Dortmund", "BAY", "BVB", 1, 18, 30, [0.55, 0.24, 0.21]),
  UP(4, "Ligue 1", "PSG", "Marseille", "PSG", "OM", 1, 20, 0, [0.62, 0.22, 0.16]),
  UP(5, "Premier League", "Man City", "Liverpool", "MCI", "LIV", 1, 21, 0, [0.44, 0.26, 0.3]),
  UP(6, "Serie A", "Inter", "Milan", "INT", "MIL", 1, 22, 30, [0.47, 0.27, 0.26]),
  UP(7, "MLS", "Inter Miami", "LAFC", "MIA", "LAF", 1, 23, 15, [0.5, 0.25, 0.25]),
  UP(8, "La Liga", "Atletico", "Barcelona", "ATM", "BAR", 2, 21, 0, [0.33, 0.26, 0.41]),
  UP(9, "Premier League", "Tottenham", "Newcastle", "TOT", "NEW", 2, 18, 0, [0.49, 0.25, 0.26]),
  UP(10, "Eredivisie", "Ajax", "PSV", "AJA", "PSV", 3, 19, 45, [0.45, 0.27, 0.28]),
  UP(11, "Primeira Liga", "Porto", "Benfica", "POR", "SLB", 3, 20, 15, [0.42, 0.28, 0.3]),
  UP(12, "Serie A", "Roma", "Lazio", "ROM", "LAZ", 3, 21, 45, [0.43, 0.3, 0.27]),
  UP(13, "Bundesliga", "Leipzig", "Leverkusen", "RBL", "B04", 4, 18, 30, [0.4, 0.27, 0.33]),
  UP(14, "Premier League", "Leicester", "Everton", "LEI", "EVE", 4, 19, 30, [0.38, 0.29, 0.33]),
  UP(15, "La Liga", "Valencia", "Betis", "VAL", "BET", 5, 20, 0, [0.39, 0.3, 0.31]),
  UP(16, "Ligue 1", "Lyon", "Monaco", "OL", "ASM", 5, 21, 0, [0.41, 0.28, 0.31]),
  UP(17, "Serie A", "Atalanta", "Fiorentina", "ATA", "FIO", 6, 20, 45, [0.48, 0.26, 0.26]),
];

/** 6 live at once — the 08-30 production incident, replayed (EV-31). */
const SPORTS_MANY_LIVE: SportsMatch[] = [
  ...[
    ["Arsenal", "Chelsea", "ARS", "CHE", 78, "2 – 1"],
    ["Bayern", "Dortmund", "BAY", "BVB", 63, "1 – 1"],
    ["PSG", "Marseille", "PSG", "OM", 55, "0 – 0"],
    ["Inter", "Milan", "INT", "MIL", 41, "1 – 0"],
    ["Real Madrid", "Sevilla", "RMA", "SEV", 27, "0 – 1"],
    ["Man City", "Liverpool", "MCI", "LIV", 12, "0 – 0"],
  ].map((r, i) =>
    match({
      id: `sg-hp-live6-${i}`,
      league: "Live league",
      home: r[0] as string,
      away: r[1] as string,
      homeAbbr: r[2] as string,
      awayAbbr: r[3] as string,
      kickoff: new Date(Date.now() - (r[4] as number) * 60_000),
      live: { minute: r[4] as number, score: r[5] as string },
      options: three(r[0] as string, r[1] as string, [0.5, 0.26, 0.24], `sg-hp-live6-${i}`),
    }),
  ),
  ...SPORTS.slice(1, 9),
];

const SportsDemo = ({
  matches,
  extraRows = 0,
}: {
  matches: SportsMatch[];
  extraRows?: number;
}) => {
  const isMobile = useIsMobile();
  return (
    <Stage>
      <HomeSportsCard
        matches={matches}
        isMobile={!!isMobile}
        extraRows={extraRows}
        onOpenAll={() => undefined}
      />
    </Stage>
  );
};

/** EV-9 · Sports 默认（17 未开赛 + 1 live）。 */
export const Ev9Preview = () => <SportsDemo matches={SPORTS} />;
/** EV-9e · Sports 空态 → 整卡返回 null（375/1280 两帧皆空）。 */
export const Ev9ePreview = () => <SportsDemo matches={[]} />;
/** EV-10 · day-rail 选中：strip 里选择某日（默认 all，此处呈现 rail 与过滤契约）。 */
export const Ev10Preview = () => <SportsDemo matches={SPORTS.slice(1, 12)} />;
/** EV-31 · 6 场 live 堆叠：预算封顶自证（LIVE ≤3 置顶 + 降级行 + N more）。 */
export const Ev31Preview = () => <SportsDemo matches={SPORTS_MANY_LIVE} />;

/* ------------------------------ desk fixture ----------------------------- */

const pick = (o: {
  id: string;
  name: string;
  note: string;
  rank: number;
  optionCount?: number;
  yes?: number;
}): EditorPick => ({
  id: o.id,
  name: o.name,
  category: "macro",
  imageUrl: null,
  rank: o.rank,
  note: o.note,
  updatedAt: null,
  volume: 1_240_000,
  isSpot: false,
  yesLabel: "Yes",
  noLabel: "No",
  yesPrice: o.yes ?? 0.62,
  noPrice: 1 - (o.yes ?? 0.62),
  yesOptionId: `${o.id}-yes`,
  noOptionId: `${o.id}-no`,
  optionCount: o.optionCount ?? 2,
});

const PICKS: EditorPick[] = [
  pick({
    id: "sg-hp-pick-1",
    name: "Will the Fed cut rates in September?",
    note: "Two soft CPI prints in a row — the market has front-run the cut.",
    rank: 1,
    yes: 0.62,
  }),
  pick({
    id: "sg-hp-pick-2",
    name: "Will BTC close above $70K this week?",
    note: "Spot ETF inflows turned positive again on Wednesday.",
    rank: 2,
    yes: 0.41,
  }),
  pick({
    id: "sg-hp-pick-3",
    name: "Who wins the 2026 Best Picture?",
    note: "Guild season starts next week — the field is still wide open.",
    rank: 3,
    optionCount: 5,
    yes: 0.34,
  }),
];

/** EV-32 · Editor's Desk（3 条 picks；picks=0 → 整卡不渲染，Sports extraRows=2）。 */
export const Ev32Preview = () => {
  const isMobile = useIsMobile();
  return (
    <div className="flex flex-col">
      <Stage>
        <HomeDeskCard picks={PICKS} isMobile={!!isMobile} />
      </Stage>
      <Stage>
        <div className="flex flex-col" style={{ gap: 12 }}>
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            picks = 0 → desk 整卡不渲染，Sports extraRows=2 补位
          </div>
          <HomeDeskCard picks={[]} isMobile={!!isMobile} />
          <HomeSportsCard
            matches={SPORTS}
            isMobile={!!isMobile}
            extraRows={2}
            onOpenAll={() => undefined}
          />
        </div>
      </Stage>
    </div>
  );
};

/* -------------------------------- EV-1 hero ------------------------------ */

/** EV-1 · Hero（LIVE MARKETS 药丸 + 标题 + 副行 + lynx 插画）。 */
export const Ev1Preview = () => {
  const isMobile = useIsMobile();
  return <HomeHero isMobile={!!isMobile} />;
};

/* -------------------------------- EV-33 tape ----------------------------- */

const TAPE_ITEMS: TapeItem[] = [
  { key: "btc", symbol: "BTC", price: "$61,982", pct: 0.42, href: "/spot?event=btc" },
  { key: "eth", symbol: "ETH", price: "$2,984.11", pct: -1.42, href: "/spot?event=eth" },
  { key: "sol", symbol: "SOL", price: "$214.60", pct: 0.86, href: "/spot?event=sol" },
  { key: "NVDA", symbol: "NVDA", price: "$182.45", pct: 1.24, href: "/spot?event=nvda" },
  { key: "TSLA", symbol: "TSLA", price: "$268.30", pct: -0.63, href: "/spot?event=tsla" },
  { key: "AAPL", symbol: "AAPL", price: "$583.37", pct: 0.18, href: "/spot?event=aapl" },
  { key: "MSFT", symbol: "MSFT", price: "$445.20", pct: -0.24, href: "/spot?event=msft" },
  { key: "META", symbol: "META", price: "$615.40", pct: 0.77, href: "/spot?event=meta" },
];

/** EV-33 · 行情 tape（8 项固定顺序 + 恒滚 + loading 骨架 + items=0 → null）。 */
export const Ev33Preview = () => {
  const isMobile = useIsMobile();
  return (
    <div className="flex flex-col" style={{ background: "#0A0B0D" }}>
      <HomeTape items={TAPE_ITEMS} loading={false} isMobile={!!isMobile} />
      <div className="px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        loading = true → 骨架条（桌面 42 / 移动 40）
      </div>
      <HomeTapeSkeleton height={isMobile ? 40 : 42} />
      <div className="px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        items = 0 → 整条 null（下方无元素）
      </div>
      <HomeTape items={[]} loading={false} isMobile={!!isMobile} />
    </div>
  );
};

/* --------------------------- EV-34 / EV-35 目录 -------------------------- */

/** EV-34 · 目录板头（ALL MARKETS › + mono 计数，仅 stage 视图）。 */
export const Ev34Preview = () => (
  <Stage>
    <CatalogueHeaderRow openCount={38} />
  </Stage>
);

/** EV-35 · 身份卡（stage 视图 && 非 watchlist；aria-hidden、不计 open 数）。 */
export const Ev35Preview = () => {
  const isMobile = useIsMobile();
  return (
    <Stage>
      <div className="grid gap-[18px] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <div style={{ minHeight: 320 }}>
          <CatalogueIdentityCard isMobile={!!isMobile} />
        </div>
      </div>
    </Stage>
  );
};

/* --------------------------- EV-24 / EV-25 骨架 -------------------------- */

/** EV-24 · 首载 stage 骨架（tape 骨架条 + stage 骨架）。 */
export const Ev24Preview = () => {
  const isMobile = useIsMobile();
  return (
    <div style={{ background: "#0A0B0D" }}>
      <HomeTapeSkeleton height={isMobile ? 40 : 42} />
      <div className="p-4">
        {isMobile ? <LiteMobileStageSkeleton /> : <LiteAllStageSkeleton />}
      </div>
    </div>
  );
};

/** EV-25 · 目录首载骨架（eventsFirstLoad，只有目录，无 stage）。 */
export const Ev25Preview = () => {
  const isMobile = useIsMobile();
  return <Stage>{isMobile ? <LiteMarketListSkeleton /> : <LiteMarketGridSkeleton />}</Stage>;
};

/* ------------------------- SP-17 / SP-18 session ------------------------- */

const SpotSessionDemo = ({ now }: { now: Date }) => {
  const isMobile = useIsMobile();
  const session = useMemo(() => getStockSessionState(US_STOCK_MARKET, now), [now]);
  const settling = session.phase === "settling";
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState("");
  return (
    <Stage>
      <div className="flex flex-col" style={{ gap: 14 }}>
        <SpotSessionBanner
          session={session}
          market={US_STOCK_MARKET}
          closePrice={583.37}
          pctToday={settling ? 0.42 : 0}
          nowOverride={now}
        />
        <LiteOrderPanel
          eventName="Apple (AAPL) — will close higher today?"
          eventId="us-aapl-updown-sg"
          countdownText={settling ? "00:00:00" : "12:50:01"}
          yesLabel="Up"
          noLabel="Down"
          yesPrice={0.41}
          noPrice={0.59}
          yesOptionId="sg-aapl-up"
          noOptionId="sg-aapl-down"
          yesOptionLabel="Up"
          noOptionLabel="Down"
          blocked={settling}
          blockedReason={settling ? "Settled" : undefined}
          side={side}
          onSideChange={setSide}
          amount={amount}
          onAmountChange={setAmount}
          variant={isMobile ? "mobile" : "desktop"}
          onRequestAuth={() => undefined}
        />
      </div>
    </Stage>
  );
};

/** SP-17 · SessionBanner settling + 禁单（收盘 +15 分 → Next session in 45:00）。 */
export const Sp17Preview = () => <SpotSessionDemo now={NOW_SPOT_SETTLING} />;
/** SP-18 · SessionBanner preSession（周日 → Opens 周一开盘；下单可用）。 */
export const Sp18Preview = () => <SpotSessionDemo now={NOW_US_PRESESSION} />;

/** HK market export kept for the SP/EV notes that reference the HK calendar. */
export const HK_MARKET_REF = HK_STOCK_MARKET;
