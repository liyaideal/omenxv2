// ============================================================
// HA · 首页 All 改版（D2-S3 桌面 + M-* 手机，2026-11-09 定稿）— style-guide previews.
//
// 铁律：只挂生产组件；fixture 只注数据与状态（禁布局型 prop、禁运行时 fetch）。
// 时钟全部冻结在 FROZEN_NOW（倒计时、轮窗口、开球时间都由它反推），所以每次
// 打开画面都一样；canvas 图表在 nowOverride 下只画一帧、不跑动画。
// 每个 preview 用 useIsMobile() 分支，375 帧里自动走手机形态（M-* 板）。
// ============================================================
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { FROZEN_NOW } from "../frozenClock";
import { HomeHero } from "@/components/lite/home/HomeHero";
import { HomeSportsSection } from "@/components/lite/home/HomeSportsSection";
import { HomeCryptoSection } from "@/components/lite/home/HomeCryptoSection";
import { HomeStocksSection, type PrintMode } from "@/components/lite/home/HomeStocksSection";
import { HomeDeskSection } from "@/components/lite/home/HomeDeskSection";
import { HomeMoreSection } from "@/components/lite/home/HomeMoreSection";
import { HomeStage } from "@/components/lite/home/HomeStage";
import {
  COINS,
  HK_STOCK_SUBTYPE,
  KR_STOCK_SUBTYPE,
  TF_SECONDS,
  TIMEFRAMES,
  US_STOCK_SUBTYPE,
  type Coin,
  type QuickEvent,
  type StockEventRow,
  type Timeframe,
} from "@/components/lite/intraday/intradayData";
import type { SportsMatch } from "@/components/lite/sports/sportsData";
import type { EditorPick } from "@/components/lite/picks/editorialPicks";
import type { EventRow, MarketChildRow } from "@/hooks/useMarketListData";
import { NOW_US_LIVE, NOW_US_PRESESSION, NOW_US_SETTLING } from "./homeStagePreviews";

const MIN = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;
const STREAM_SRC = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

/** Plain wrapper — padding only (sg:audit forbids visual shells in preview files).
 *  The 375 frame already carries the page's 16px gutter, so mobile adds none. */
const Pad = ({ children }: { children: React.ReactNode }) => {
  const isMobile = useIsMobile();
  return <div style={{ padding: isMobile ? "8px 0" : 16 }}>{children}</div>;
};

/* ============================== Sports ============================== */

const sm = (
  o: Partial<SportsMatch> & Pick<SportsMatch, "id" | "league" | "home" | "away" | "homeAbbr" | "awayAbbr">,
  kickoffMin: number,
): SportsMatch => ({
  name: `${o.home} vs ${o.away}`,
  format: "1x2",
  kickoff: new Date(FROZEN_NOW + kickoffMin * MIN),
  endDate: new Date(FROZEN_NOW + (kickoffMin + 120) * MIN),
  live: kickoffMin <= 0 && kickoffMin > -115,
  minute: null,
  phase: null,
  score: null,
  streamUrl: null,
  volume: 900_000,
  options: [],
  ...o,
});
const h2h = (
  id: string,
  league: string,
  home: string,
  away: string,
  ha: string,
  aa: string,
  kickoffMin: number,
  extra: Partial<SportsMatch> = {},
) =>
  sm(
    {
      id,
      league,
      home,
      away,
      homeAbbr: ha,
      awayAbbr: aa,
      format: "h2h",
      options: [
        { id: `${id}-h`, label: home, price: extra.volume && extra.volume > 2_000_000 ? 0.58 : 0.46 },
        { id: `${id}-a`, label: away, price: extra.volume && extra.volume > 2_000_000 ? 0.42 : 0.54 },
      ] as SportsMatch["options"],
      ...extra,
    },
    kickoffMin,
  );

/* upcoming pool shared by every state — 22 fixtures over the week */
const UPCOMING: SportsMatch[] = [
  h2h("ha-up-01", "Premier League", "Nottingham Forest FC", "Manchester City FC", "NOT", "MCF", 26 * 60, { sport: "soccer", volume: 19_400 }),
  h2h("ha-up-02", "LaLiga", "Valencia CF", "Real Madrid CF", "VAL", "RMC", 28 * 60 + 30, { sport: "soccer", volume: 17_300 }),
  h2h("ha-up-03", "Worlds", "Invictus Gaming", "Gen.G", "IG", "GEN", 30 * 60 + 30, { sport: "lol", volume: 17_200 }),
  h2h("ha-up-04", "NHL", "Sabres", "Blue Jackets", "BUF", "CBJ", 8 * 60 + 40, { sport: "hockey", volume: 3_400 }),
  h2h("ha-up-05", "NBA", "Hawks", "Wizards", "ATL", "WAS", 8 * 60 + 40, { sport: "basketball", volume: 5_000 }),
  h2h("ha-up-06", "NBA", "Cavaliers", "76ers", "CLE", "PHI", 9 * 60 + 10, { sport: "basketball", volume: 14_100 }),
  h2h("ha-up-07", "NBA", "Grizzlies", "Thunder", "MEM", "OKC", 9 * 60 + 40, { sport: "basketball", volume: 8_800 }),
  h2h("ha-up-08", "NBA", "Bucks", "Raptors", "MIL", "TOR", 9 * 60 + 40, { sport: "basketball", volume: 4_000 }),
  h2h("ha-up-09", "NHL", "Flames", "Ducks", "CAL", "ANA", 9 * 60 + 40, { sport: "hockey", volume: 3_200 }),
  h2h("ha-up-10", "NHL", "Wild", "Sharks", "MIN", "SJ", 10 * 60 + 10, { sport: "hockey", volume: 2_500 }),
  h2h("ha-up-11", "NBA", "Mavericks", "Jazz", "DAL", "UTA", 10 * 60 + 40, { sport: "basketball", volume: 2_500 }),
  h2h("ha-up-12", "Premier League", "Everton FC", "Coventry City", "EVE", "COV", 4 * 60 + 40, { sport: "soccer", volume: 6_100 }),
  h2h("ha-up-13", "LaLiga", "Sevilla FC", "Alavés", "SEV", "ALA", 4 * 60 + 40, { sport: "soccer", volume: 5_400 }),
  h2h("ha-up-14", "Worlds", "Karmine Corp", "T1", "KC", "T1", 6 * 60 + 40, { sport: "lol", volume: 7_900 }),
  h2h("ha-up-15", "NBA", "Hornets", "Celtics", "CHA", "BOS", 8 * 60 + 40, { sport: "basketball", volume: 5_800 }),
  h2h("ha-up-16", "WTA Finals", "Anastasia Prozorova", "Coco Gauff", "", "", 50 * 60, { sport: "tennis", volume: 1_900, homeShort: "A. Prozorova", awayShort: "C. Gauff" }),
  h2h("ha-up-17", "UFC 321", "Pereira", "Ankalaev", "PER", "ANK", 52 * 60, { sport: "mma", volume: 1_900 }),
  h2h("ha-up-18", "K League 1", "Ulsan", "Jeonbuk", "ULS", "JBH", 54 * 60, { sport: "soccer", volume: 5_100 }),
  h2h("ha-up-19", "Serie A", "Juventus", "Napoli", "JUV", "NAP", 75 * 60, { sport: "soccer", volume: 5_500 }),
  h2h("ha-up-20", "UCL", "Bayern", "Real Madrid", "BAY", "RMA", 98 * 60, { sport: "soccer", volume: 6_000 }),
  h2h("ha-up-21", "IEM Cologne", "Vitality", "G2", "VITA", "G2", 100 * 60, { sport: "esports", volume: 2_100, streamUrl: STREAM_SRC }),
  h2h("ha-up-22", "ATP Finals", "Carlos Alcaraz", "Jannik Sinner", "", "", 122 * 60, { sport: "tennis", volume: 2_000, homeShort: "C. Alcaraz", awayShort: "J. Sinner" }),
];

const LIVE_STREAMED = [
  h2h("ha-lv-01", "IEM Cologne", "Spirit", "MOUZ", "SPIRIT", "MOUZ", -40, { sport: "esports", live: true, liveLabel: "Map 1 · 12:04", score: "1-0", streamUrl: STREAM_SRC, volume: 150_200 }),
  h2h("ha-lv-02", "NBA", "Cavaliers", "76ers", "CLE", "PHI", -70, { sport: "basketball", live: true, liveLabel: "Q2 8:12", score: "54-61", streamUrl: STREAM_SRC, volume: 14_100 }),
  h2h("ha-lv-03", "NBA", "Grizzlies", "Thunder", "MEM", "OKC", -60, { sport: "basketball", live: true, liveLabel: "Q2 3:40", score: "48-52", streamUrl: STREAM_SRC, volume: 8_800 }),
];
const LIVE_PLAIN = [
  h2h("ha-lv-04", "NBA", "Hornets", "Celtics", "CHA", "BOS", -30, { sport: "basketball", live: true, liveLabel: "Q3 9:05", score: "71-80", volume: 5_800 }),
  h2h("ha-lv-05", "NBA", "Hawks", "Wizards", "ATL", "WAS", -35, { sport: "basketball", live: true, liveLabel: "Q3 11:21", score: "66-70", volume: 5_000 }),
  h2h("ha-lv-06", "NHL", "Sabres", "Blue Jackets", "BUF", "CBJ", -50, { sport: "hockey", live: true, liveLabel: "P3 14:02", score: "2-1", volume: 3_400 }),
  h2h("ha-lv-07", "NFL", "Chiefs", "Bills", "KC", "BUF", -45, { sport: "football", live: true, liveLabel: "Q4 5:00", score: "38-27", volume: 9_000 }),
  h2h("ha-lv-08", "MLB", "Dodgers", "Yankees", "LAD", "NYY", -80, { sport: "baseball", live: true, liveLabel: "▲ 5th", score: "5-3", volume: 4_200 }),
  h2h("ha-lv-09", "WTA", "Anastasia Prozorova", "Elena Cos", "", "", -90, { sport: "tennis", live: true, liveLabel: "118'", score: "5-7, 7-6(7-2), 6-6", volume: 1_200, homeShort: "A. Prozorova", awayShort: "E. Cos" }),
  h2h("ha-lv-10", "NHL", "Wild", "Sharks", "MIN", "SJ", -20, { sport: "hockey", live: true, liveLabel: "P1 6:33", score: "0-1", volume: 2_500 }),
];
/** A fixture that is live in a state is dropped from the upcoming pool (same pairing). */
const dedupe = (live: SportsMatch[]) => [...live, ...UPCOMING.filter((m) => !live.some((l) => l.home === m.home && l.away === m.away))];
/** ① 10 live, 3 on stream (Sat 09:20). */
export const SPORTS_S1 = dedupe([...LIVE_STREAMED, ...LIVE_PLAIN]);
/** ② 1 live with a stream (tonight). */
export const SPORTS_S2 = dedupe([LIVE_STREAMED[0]]);
/** ③ 3 live, none on stream (Sat 08:10). */
export const SPORTS_S3 = dedupe(LIVE_PLAIN.slice(0, 3));
/** ④ nothing live — the biggest upcoming match takes the stage. */
export const SPORTS_S4 = dedupe([]);

const SportsDemo = ({ matches }: { matches: SportsMatch[] }) => {
  const isMobile = useIsMobile();
  return (
    <Pad>
      <div className={isMobile ? "hall hall-m" : "hall"}>
        <HomeSportsSection matches={matches} isMobile={!!isMobile} onOpenAll={() => undefined} nowOverride={FROZEN_NOW} />
      </div>
    </Pad>
  );
};
export const HaSports1Preview = () => <SportsDemo matches={SPORTS_S1} />;
export const HaSports2Preview = () => <SportsDemo matches={SPORTS_S2} />;
export const HaSports3Preview = () => <SportsDemo matches={SPORTS_S3} />;
export const HaSports4Preview = () => <SportsDemo matches={SPORTS_S4} />;

/* ============================== Crypto ============================== */

const COIN_FIXTURE: Record<Coin, { base: number; up: number; hist: string }> = {
  btc: { base: 74_081, up: 0.55, hist: "uuduudud" },
  eth: { base: 2_128.7, up: 0.52, hist: "duuduudd" },
  sol: { base: 86.49, up: 0.53, hist: "udduuddu" },
};
const quickFixture = () => {
  const currentFor = new Map<string, QuickEvent>();
  const historyFor = new Map<string, ("up" | "down")[]>();
  for (const coin of COINS) {
    const cfg = COIN_FIXTURE[coin];
    for (const { id: tf } of TIMEFRAMES) {
      const key = `${coin}-${tf}`;
      const dur = TF_SECONDS[tf] * 1000;
      const start = FROZEN_NOW - Math.floor(dur * 0.62);
      const end = start + dur;
      currentFor.set(key, {
        id: `crypto-${coin}-updown-${tf}-ha`,
        name: `${coin.toUpperCase()} ${tf} round`,
        coin,
        tf,
        period: "1",
        base_price: cfg.base,
        start_date: new Date(start).toISOString(),
        end_date: new Date(end).toISOString(),
        volume: tf === "5m" ? 1_240 : 184_000,
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

const CryptoDemo = ({ initialTf }: { initialTf: Timeframe }) => {
  const isMobile = useIsMobile();
  const [tf, setTf] = useState<Timeframe>(initialTf);
  return (
    <Pad>
      <div className={isMobile ? "hall hall-m" : "hall"}>
        <HomeCryptoSection currentFor={QUICK.currentFor} historyFor={QUICK.historyFor} tf={tf} onSelectTf={setTf} isMobile={!!isMobile} nowOverride={FROZEN_NOW} />
      </div>
    </Pad>
  );
};
export const HaCrypto5mPreview = () => <CryptoDemo initialTf="5m" />;
export const HaCrypto1hPreview = () => <CryptoDemo initialTf="1h" />;

/* ============================== Stocks ============================== */

const stock = (id: string, name: string, base: number, subtype: string, up: number, endInH: number): StockEventRow => ({
  id,
  name,
  base_price: base,
  start_date: null,
  // Relative to the fixture clock the demo renders with (see stockRowsAt).
  end_date: String(endInH),
  freeze_time: null,
  event_subtype: subtype,
  upPrice: up,
  downPrice: 1 - up,
});
export const STOCK_ROWS: StockEventRow[] = [
  stock("us-sndk-daily", "Sandisk — higher than it opened?", 832.78, US_STOCK_SUBTYPE, 0.47, 15.9),
  stock("us-mu-daily", "Micron — higher than it opened?", 688.8, US_STOCK_SUBTYPE, 0.48, 15.9),
  stock("us-nvda-daily", "NVIDIA — higher than it opened?", 178.43, US_STOCK_SUBTYPE, 0.17, 15.9),
  stock("us-spcx-daily", "SpaceX — higher than it opened?", 136.85, US_STOCK_SUBTYPE, 0.6, 15.9),
  stock("us-mstr-daily", "Strategy — higher than it opened?", 125.12, US_STOCK_SUBTYPE, 0.34, 15.9),
  stock("us-googl-daily", "Alphabet — higher than it opened?", 288.6, US_STOCK_SUBTYPE, 0.56, 15.9),
  stock("us-tsla-daily", "Tesla — higher than it opened?", 360.93, US_STOCK_SUBTYPE, 0.55, 15.9),
  stock("us-aapl-daily", "Apple — higher than it opened?", 344.3, US_STOCK_SUBTYPE, 0.56, 15.9),
  stock("us-amzn-daily", "Amazon — higher than it opened?", 262.01, US_STOCK_SUBTYPE, 0.57, 15.9),
  stock("us-ibm-daily", "IBM — higher than it opened?", 247.28, US_STOCK_SUBTYPE, 0.59, 15.9),
  stock("hk-0700-daily", "Tencent — higher than it opened?", 612.5, HK_STOCK_SUBTYPE, 0.52, 20),
  stock("hk-9988-daily", "Alibaba — higher than it opened?", 154.2, HK_STOCK_SUBTYPE, 0.49, 20),
  stock("hk-3690-daily", "Meituan — higher than it opened?", 98.65, HK_STOCK_SUBTYPE, 0.45, 20),
  stock("hk-1810-daily", "Xiaomi — higher than it opened?", 41.3, HK_STOCK_SUBTYPE, 0.53, 20),
  stock("hk-0005-daily", "HSBC — higher than it opened?", 112.9, HK_STOCK_SUBTYPE, 0.5, 20),
  stock("hk-1211-daily", "BYD — higher than it opened?", 356.4, HK_STOCK_SUBTYPE, 0.47, 20),
  stock("kr-005930-daily", "Samsung Electronics — higher than it opened?", 98_400, KR_STOCK_SUBTYPE, 0.51, 19),
  stock("kr-000660-daily", "SK hynix — higher than it opened?", 412_000, KR_STOCK_SUBTYPE, 0.56, 19),
  stock("kr-035420-daily", "NAVER — higher than it opened?", 218_500, KR_STOCK_SUBTYPE, 0.44, 19),
];
/** The session fixtures run on the exchange calendar (NOW_US_*), so settle times hang off that clock. */
export const stockRowsAt = (now: Date): StockEventRow[] =>
  STOCK_ROWS.map((r) => ({
    ...r,
    start_date: new Date(now.getTime() - 10 * HOUR).toISOString(),
    end_date: new Date(now.getTime() + Number(r.end_date) * HOUR).toISOString(),
  }));
const StocksDemo = ({ mode, now }: { mode: PrintMode; now: Date }) => {
  const isMobile = useIsMobile();
  return (
    <Pad>
      <div className={isMobile ? "hall hall-m" : "hall"}>
        <HomeStocksSection stockRows={stockRowsAt(now)} isMobile={!!isMobile} onOpenAll={() => undefined} nowOverride={now} printModeOverride={mode} />
      </div>
    </Pad>
  );
};
/** K4 ① regular session (US Wed 11:00 ET). */
export const HaStocksRegularPreview = () => <StocksDemo mode="regular" now={NOW_US_LIVE} />;
/** K4 ② closed, still printing (US after-hours / overnight). */
export const HaStocksExtendedPreview = () => <StocksDemo mode="extended" now={NOW_US_SETTLING} />;
/** K4 ③ closed, no prints yet → no chart, "Base price". */
export const HaStocksNonePreview = () => <StocksDemo mode="none" now={NOW_US_PRESESSION} />;

/* =========================== Editor's Desk =========================== */

const pick = (o: Partial<EditorPick> & Pick<EditorPick, "id" | "name" | "note" | "rank" | "category">): EditorPick => ({
  imageUrl: null,
  updatedAt: null,
  volume: 1_240_000,
  isSpot: false,
  yesLabel: "Yes",
  noLabel: "No",
  yesPrice: 0.62,
  noPrice: 0.38,
  yesOptionId: `${o.id}-yes`,
  noOptionId: `${o.id}-no`,
  optionCount: 2,
  endDate: new Date(FROZEN_NOW + 9 * HOUR),
  ...o,
});
export const PICKS: EditorPick[] = [
  pick({ id: "ha-pick-1", rank: 1, category: "crypto", name: "BTC — above $75,786 at the daily close?", note: "Opened the day $1,164 above where it trades now. Down is 82¢ — the crowd is leaning one way, which is usually when the other side pays.", yesLabel: "Up", noLabel: "Down", yesPrice: 0.18, noPrice: 0.82 }),
  pick({ id: "ha-pick-2", rank: 2, category: "stocks", name: "NVDA — higher than it opened?", note: "Down 4.4% in the overnight session after the export-rule headline. Up is 17¢: cheap if you think the cash session buys the dip.", yesLabel: "Up", noLabel: "Down", yesPrice: 0.17, noPrice: 0.83, endDate: new Date(FROZEN_NOW + 6 * HOUR) }),
  pick({ id: "ha-pick-3", rank: 3, category: "sports", name: "Vikings vs Bills — who wins?", note: "Biggest sports book on the site this week. Bills opened at 58¢ and have drifted to 62¢ with the weather report.", yesLabel: "Bills", noLabel: "Vikings", yesPrice: 0.62, noPrice: 0.39, endDate: new Date(FROZEN_NOW + DAY + 2 * HOUR) }),
];
export const PICKS_MULTI: EditorPick[] = [
  PICKS[0],
  pick({ id: "ha-pick-4", rank: 2, category: "politics", name: "Which party controls the US House after the 2026 midterms?", note: "Generic ballot has moved four points since the shutdown; the market hasn't.", yesLabel: "Democrats", noLabel: "Republicans", yesPrice: 0.37, noPrice: 0.61, optionCount: 3, endDate: new Date(FROZEN_NOW + 30 * DAY) }),
  PICKS[2],
];
const DeskDemo = ({ picks }: { picks: EditorPick[] }) => {
  const isMobile = useIsMobile();
  return (
    <Pad>
      <div className={isMobile ? "hall hall-m" : "hall"}>
        <HomeDeskSection picks={picks} isMobile={!!isMobile} nowOverride={FROZEN_NOW} />
      </div>
    </Pad>
  );
};
export const HaDeskPreview = () => <DeskDemo picks={PICKS} />;
export const HaDeskMultiPreview = () => <DeskDemo picks={PICKS_MULTI} />;

/* ============================== More ============================== */

const child = (id: string, label: string, p: number): MarketChildRow => ({
  id,
  optionLabel: label,
  displayLabel: label,
  markPrice: p,
  change1h: 0,
  change4h: 0,
  change24h: 0,
  volume1h: 0,
  volume4h: 0,
  volume24h: 0,
  totalVolume: 0,
  openInterest: 0,
});
const ev = (o: {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  volume: number;
  expiryDays: number;
  children: MarketChildRow[];
  sideLabels?: { yes: string; no: string };
}): EventRow => ({
  id: o.id,
  eventId: o.id,
  eventName: o.name,
  eventIcon: "",
  category: o.category,
  categoryLabel: o.categoryLabel,
  productLines: ["contract"],
  eventSubtype: null,
  lifecycleStatus: "TRADING",
  basePrice: null,
  imageUrl: null,
  sideLabels: o.sideLabels,
  change1h: 0,
  change4h: 0,
  change24h: 0,
  volume1h: 0,
  volume4h: 0,
  volume24h: 0,
  totalVolume: o.volume,
  openInterest: 0,
  expiry: new Date(FROZEN_NOW + o.expiryDays * DAY),
  createdAt: new Date(FROZEN_NOW - 30 * DAY).toISOString(),
  isNew: false,
  isClosingSoon: o.expiryDays < 2,
  topMarket: null,
  childCount: o.children.length,
  children: o.children,
});
export const MORE_EVENTS: EventRow[] = [
  ev({ id: "ha-more-1", name: "Will Anthropic's valuation hit __ by December 31?", category: "finance", categoryLabel: "Finance", volume: 82_100_000, expiryDays: 52,
    children: [child("a1", "↑ $1.5T", 0.71), child("a2", "↑ $1.75T", 0.47), child("a3", "↑ $2.0T", 0.28), child("a4", "↑ $2.5T", 0.12), child("a5", "↑ $3.0T", 0.05), child("a6", "↑ $4.0T", 0.02)] }),
  ev({ id: "ha-more-2", name: "Fed decision at the December meeting", category: "macro", categoryLabel: "Macro", volume: 12_800_000, expiryDays: 31,
    children: [child("f1", "Hold", 0.54), child("f2", "Cut 25 bps", 0.38), child("f3", "Cut 50 bps", 0.05), child("f4", "Hike 25 bps", 0.03)] }),
  ev({ id: "ha-more-3", name: "Will Bitcoin close 2026 above $100,000?", category: "crypto", categoryLabel: "Crypto", volume: 3_400_000, expiryDays: 52, children: [child("b1", "Yes", 0.34), child("b2", "No", 0.66)] }),
  ev({ id: "ha-more-4", name: "Which party controls the US House after the 2026 midterms — and does the Speaker keep the gavel through January?", category: "politics", categoryLabel: "Politics", volume: 83_200_000, expiryDays: 1,
    children: [child("p1", "Democrats", 0.37), child("p2", "Republicans", 0.61), child("p3", "Exact tie", 0.02)] }),
];
const MoreDemo = ({ events }: { events: EventRow[] }) => {
  const isMobile = useIsMobile();
  return (
    <Pad>
      <div className={isMobile ? "hall hall-m" : "hall"}>
        <HomeMoreSection events={events} getBoostMax={(c) => (c === "crypto" ? null : c === "finance" ? 3 : 5)} isMobile={!!isMobile} nowOverride={FROZEN_NOW} />
      </div>
    </Pad>
  );
};
export const HaMorePreview = () => <MoreDemo events={MORE_EVENTS} />;

/* ============================== Hero / Stage ============================== */

export const HaHeroPreview = () => {
  const isMobile = useIsMobile();
  return <HomeHero isMobile={!!isMobile} />;
};

/** The whole All view body as production composes it (HomeStage), state ② sports. */
export const HaStagePreview = () => {
  const isMobile = useIsMobile();
  const [tf, setTf] = useState<Timeframe>("5m");
  return (
    <Pad>
      <HomeStage
        currentFor={QUICK.currentFor}
        historyFor={QUICK.historyFor}
        stockRows={stockRowsAt(new Date(FROZEN_NOW))}
        matches={SPORTS_S2}
        picks={PICKS}
        events={MORE_EVENTS}
        getBoostMax={(c) => (c === "crypto" ? null : 5)}
        tf={tf}
        onSelectTf={setTf}
        isMobile={!!isMobile}
        onOpenSports={() => undefined}
        onOpenFinance={() => undefined}
        nowOverride={FROZEN_NOW}
      />
    </Pad>
  );
};
