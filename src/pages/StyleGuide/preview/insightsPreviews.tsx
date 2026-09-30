/**
 * Insights (SEO/GEO) previews — IN-1…IN-8, 2026-09-28.
 *
 * Truth Rule §16.1.1：每个 case 挂生产组件本体（insightsSeo/parts · insightsFeed），fixture 注入。
 * 铁律 4 确定性：生产页面走 RPC 拉真数据，字典帧一律用下面的冻结 fixture，不 fetch。
 * 整页结构（title / canonical / JSON-LD / 9 节）在真路由 /insights 验收，字典不复制整页。
 */
import type { EventWithOptions } from "@/hooks/useActiveEvents";
import type { MarketRow, PlatformStats } from "@/lib/insights";
import { INSIGHTS_PATH, citeSentence } from "@/lib/insights";
import { SITE_URL } from "@/lib/site";
import { CategoryTable, CiteBlock, Empty, HowComputed, KpiStrip, MarketTable, MoverList, Opening, SectionHead } from "@/components/insightsSeo/parts";
import { InsightArticle, type InsightItem } from "@/components/insightsSeo/insightsFeed";

const AS_OF = "2026-09-28T08:00:00.000Z";
const Pad = ({ children }: { children: React.ReactNode }) => <div className="p-6">{children}</div>;

/* ---------------- fixtures（冻结） ---------------- */
const ev = (id: string, name: string, category: string, endDays: number, createdDaysAgo: number, opts: [string, number][], volume = 50_000): EventWithOptions =>
  ({
    id,
    name,
    category,
    event_subtype: null,
    status: "active",
    volume,
    created_at: new Date(Date.parse(AS_OF) - createdDaysAgo * 864e5).toISOString(),
    end_date: new Date(Date.parse(AS_OF) + endDays * 864e5).toISOString(),
    options: opts.map(([label, price], i) => ({ id: `${id}-o${i}`, event_id: id, label, price })),
  }) as unknown as EventWithOptions;

const row = (e: EventWithOptions, trades: number, volume: number, move: [number, number] | null, series: number[] = []): MarketRow => {
  const sorted = [...e.options].sort((a, b) => Number(b.price) - Number(a.price));
  const lead = { id: sorted[0].id, label: sorted[0].label, price: Number(sorted[0].price) };
  const other = e.options.length === 2 ? { id: sorted[1].id, label: sorted[1].label, price: Number(sorted[1].price) } : null;
  return { event: e, lead, other, probability: Math.round(lead.price * 100), activity: { trades, volume }, move: move ? { from: move[0], to: move[1], delta: (move[1] - move[0]) * 100 } : null, series };
};

const ROWS: MarketRow[] = [
  row(ev("in-1", "Will OpenAI ship a model branded GPT-6 this year?", "tech", 94, 30, [["Yes", 0.88], ["No", 0.12]], 210_000), 540, 58_300, [0.78, 0.88], [0.76, 0.78, 0.79, 0.81, 0.8, 0.83, 0.86, 0.88]),
  row(ev("in-2", "Fed cuts rates at the October 2026 meeting?", "macro", 31, 45, [["Yes", 0.61], ["No", 0.39]], 180_000), 412, 41_900, [0.55, 0.61], [0.54, 0.55, 0.57, 0.56, 0.58, 0.6, 0.61, 0.61]),
  row(ev("in-3", "Arsenal vs Liverpool — total goals 2.5", "sports", 1, 3, [["Over 2.5", 0.3], ["Under 2.5", 0.7]], 95_000), 388, 37_400, [0.85, 0.7], [0.85, 0.84, 0.8, 0.78, 0.75, 0.72, 0.7, 0.7]),
  row(ev("in-4", "Bitcoin above $150K on 31 Dec 2026?", "crypto", 94, 60, [["Yes", 0.42], ["No", 0.58]], 320_000), 1_020, 104_300, [0.44, 0.42], [0.46, 0.45, 0.44, 0.43, 0.44, 0.43, 0.42, 0.42]),
  row(ev("in-5", "Will TikTok raise its creator fund payout rate before 2027?", "tech", 60, 1, [["Yes", 0.96], ["No", 0.04]], 12_000), 96, 9_800, null, [0.95, 0.95, 0.96, 0.96, 0.96, 0.96, 0.96, 0.96]),
];

const STATS: PlatformStats = {
  as_of: AS_OF,
  total_volume: 4_800_000,
  open_interest: 612_000,
  active_markets: 261,
  resolved_markets: 1_180,
  volume_24h: 2_400_000,
  volume_prev_24h: 2_290_000,
  trades_24h: 22_512,
  trades_prev_24h: 21_600,
  volume_7d: 5_900_000,
  volume_30d: 21_000_000,
} as PlatformStats;

const ITEMS: InsightItem[] = [
  { id: "move-in-1", kind: "move", at: AS_OF, row: ROWS[0] },
  { id: "closing-in-3", kind: "closing", at: AS_OF, row: ROWS[2] },
  { id: "new-in-5", kind: "new", at: ROWS[4].event.created_at, row: ROWS[4] },
];

/* ---------------- cases ---------------- */

/** IN-1 · 开篇（eyebrow / H1 / lede / as-of） */
export const InsightsOpeningPreview = () => (
  <Pad>
    <Opening eyebrow="OmenX Insights · Daily" title="Prediction Market Digest — 28 Sept 2026" lede="1 probability move of 5 points or more, 1 newly listed market and 1 market settling within 48 hours, from OmenX outcome-market data." asOf={AS_OF} />
  </Pad>
);

/** IN-2 · KPI 条（5 格 · 24h 对比箭头） */
export const InsightsKpiPreview = () => (
  <Pad>
    <KpiStrip stats={STATS} />
  </Pad>
);

/** IN-3 · 市场表（编号 · 概率条 · 价格 pill · 24h 量 / 笔数 · 7d 折线 · 截止 · Trade） */
export const InsightsMarketTablePreview = () => (
  <Pad>
    <SectionHead n="01" title="Trending prediction markets" meta="Top 5" />
    <MarketTable rows={ROWS} caption="Trending prediction markets" />
  </Pad>
);

/** IN-3b · 市场表 · 无折线（Newest / Closing soon 列表形态） */
export const InsightsMarketTableNoSparkPreview = () => (
  <Pad>
    <SectionHead n="05" title="Markets closing soon" meta="Top 5" />
    <MarketTable rows={[ROWS[2], ROWS[1]]} showSpark={false} caption="Markets closing soon" />
  </Pad>
);

/** IN-4 · 涨跌榜（gainers / losers 两卡） */
export const InsightsMoversPreview = () => (
  <Pad>
    <div className="grid gap-4 md:grid-cols-2">
      <MoverList title="Biggest gainers" rows={[ROWS[0], ROWS[1]]} tone="up" />
      <MoverList title="Biggest losers" rows={[ROWS[2]]} tone="down" />
    </div>
  </Pad>
);

/** IN-4b · 涨跌榜 · 空态（阈值 ≥ 5 pts 内无变动） */
export const InsightsMoversEmptyPreview = () => (
  <Pad>
    <div className="grid gap-4 md:grid-cols-2">
      <MoverList title="Biggest gainers" rows={[]} tone="up" />
      <MoverList title="Biggest losers" rows={[]} tone="down" />
    </div>
  </Pad>
);

/** IN-5 · 分类表（每行链接到 /insights/category/{slug}） */
export const InsightsCategoryTablePreview = () => (
  <Pad>
    <CategoryTable rows={ROWS} />
  </Pad>
);

/** IN-6 · 洞察文章三型（move / closing / new），GEO 结构：h3 问题 · 答句带日期 · dl · time · Share */
export const InsightsArticlesPreview = () => (
  <Pad>
    <div className="space-y-3">
      {ITEMS.map((i) => <InsightArticle key={i.id} item={i} />)}
    </div>
  </Pad>
);

/** IN-6b · 洞察文章 · compact（首页 B1 前 5 条形态） */
export const InsightsArticlesCompactPreview = () => (
  <Pad>
    <div className="space-y-3">
      {ITEMS.map((i) => <InsightArticle key={i.id} item={i} compact />)}
    </div>
  </Pad>
);

/** IN-7 · 页尾 GEO 块：How computed + Cite */
export const InsightsFooterBlocksPreview = () => (
  <Pad>
    <HowComputed asOf={AS_OF} />
    <CiteBlock sentence={citeSentence(ROWS[0], AS_OF)} url={`${SITE_URL}${INSIGHTS_PATH}`} />
  </Pad>
);

/** IN-8 · 空态 / 失败态 */
export const InsightsEmptyPreview = () => (
  <Pad>
    <div className="space-y-3">
      <Empty text="No markets in this window yet." />
      <Empty text="Couldn't load insights. Try again." />
    </div>
  </Pad>
);

/* ================= Insights v2 · series grammar (IN-9…IN-14, 2026-09-28 晚) ================= */
import { Chip, DataFooter, FavTag, FourTiles, LiveCard, LivePill, List, MajorityTag, Name, RightWrong, Row, SeriesOpening, SeriesSection, Strip, Table, Td, Th, UpDownPair, Hit } from "@/components/insightsSeo/seriesParts";
import type { LiveRound } from "@/lib/insights/series";

const LIVE: LiveRound = { event_id: "crypto-btc-updown-5m-x", mins: 5, start: "2026-09-28T10:15:00Z", end: "2099-01-01T00:00:00Z", freeze: null, up_price: 0.48, down_price: 0.52, volume: 1204 };

/** IN-9 · 开篇 v2（display H1 + eyebrow + lede + as-of，SEO 页豁免） */
export const SeriesOpeningPreview = () => (
  <Pad><SeriesOpening eyebrow="OmenX Insights · Crypto · Up or down" title="Bitcoin Up or Down — Prediction Market Odds & Crowd Accuracy" lede="Every 5 minutes, 15 minutes, hour, 4 hours and day OmenX traders bet whether Bitcoin closes higher or lower." asOf={AS_OF} /></Pad>
);
/** IN-10 · Live 卡 + 今日四格（资产页 hero 5/7 栅格） */
export const SeriesHeroPreview = () => (
  <Pad><div className="grid gap-3 md:grid-cols-12 md:gap-4"><div className="md:col-span-5"><LiveCard eyebrow="Now · next to settle · 5-minute round" when="10:15 – 10:20 UTC" round={LIVE} sub={<>Right now more money is on <b className="font-semibold text-no">Down</b> — 48¢ vs 52¢, $1.2K traded so far.</>} foot={<>Settles in <b>1:42</b> · at 10:20 UTC</>} cta={{ label: "Trade this round", to: "#" }} /></div>
    <div className="md:col-span-7"><FourTiles tiles={[{ l: "Rounds today", v: "181", d: "all round lengths · 5m to 1d" }, { l: "Majority bet Up in", v: "44%", unit: "of rounds", d: <><b className="text-trading-red">a bearish day</b> — more rounds leaned Down</> }, { l: "Majority was right in", v: <Hit v={52} />, unit: "of rounds", d: <>30-day average <b>50%</b></> }, { l: "Longest winning run today", v: "6", unit: "rounds", d: "majority right 6× in a row · from 06:30 UTC" }]} /></div></div></Pad>
);
/** IN-11 · Up·Down 对（Up 永远左、Down 永远右、多数派加粗上色）+ 标签件 */
export const SeriesPairPreview = () => (
  <Pad><div className="space-y-3"><UpDownPair up={0.63} down={0.37} /><UpDownPair up={0.48} down={0.52} /><UpDownPair up={0.5} down={0.5} size="sm" /><div className="flex flex-wrap gap-2"><MajorityTag up={0.55} down={0.45} /><MajorityTag up={0.41} down={0.59} prefix="Now · " /><FavTag label="Arsenal" price={0.54} /><LivePill /><LivePill label="62′ · 1–1" /><span className="text-[13px]"><RightWrong ok /></span><span className="text-[13px]"><RightWrong ok={false} note="upset" /></span><Hit v={69} big /><Hit v={40} big /><Hit v={50} big /></div></div></Pad>
);
/** IN-12 · v7 表格语法（52px 行 · fixed 列宽 · 数字右对齐 · 整行可点 · 无箭头列） */
export const SeriesTablePreview = () => (
  <Pad><SeriesSection n="01" title="Crypto · next round to settle" more={{ label: "All crypto rounds", to: "#" }}><Table head={<><Th>Asset</Th><Th w={160}>Round (UTC)</Th><Th w={280}>Up · Down price</Th><Th w={100} r>Settles in</Th><Th w={130} r>Rounds today</Th><Th w={160} r>Majority right · today</Th><Th w={120} r>Traded 24h</Th></>}>
    <tr><Td><span className="inline-flex items-center gap-2"><span className="text-[13px] font-semibold">Bitcoin</span><Chip>5m round</Chip></span></Td><Td mono dim>10:15 – 10:20</Td><Td><UpDownPair up={0.48} down={0.52} /></Td><Td r mono>1:42</Td><Td r mono>181</Td><Td r><Hit v={52} /></Td><Td r mono>$512K</Td></tr>
    <tr><Td><span className="text-[13px] font-semibold">Ethereum</span></Td><Td mono dim>10:15 – 10:20</Td><Td><UpDownPair up={0.49} down={0.51} /></Td><Td r mono>1:42</Td><Td r mono>181</Td><Td r><Hit v={46} /></Td><Td r mono>$501K</Td></tr>
  </Table></SeriesSection></Pad>
);
/** IN-13 · 移动列表行（两行：名 + 右侧时间 / Up·Down 对 + 右侧准不准） */
export const SeriesListPreview = () => (
  <Pad><List><Row to="#" l1={<><Name chip="5m">Bitcoin</Name><span className="font-mono text-[12px] text-muted-foreground">settles in <span className="text-foreground">1:42</span></span></>} l2={<><UpDownPair up={0.48} down={0.52} size="sm" /><span className="font-mono text-[12px]"><Hit v={52} /> <span className="text-muted-foreground">right today</span></span></>} /><Row to="#" l1={<><Name sub="TSLA">Tesla</Name><span className="font-mono text-[12px] text-muted-foreground">settles 20:00 UTC</span></>} l2={<><UpDownPair up={0.63} down={0.37} size="sm" /><span className="font-mono text-[12px]"><Hit v={40} /> <span className="text-muted-foreground">right · 30d</span></span></>} /><Row to="#" l1={<><Name sub="Premier League">Arsenal vs Liverpool</Name><LivePill label="62′ · 1–1" /></>} l2={<><FavTag label="Arsenal" price={0.54} /><span className="font-mono text-[12px] text-muted-foreground">Under 2.5 · 70¢</span></>} /></List></Pad>
);
/** IN-14 · 平台四数条 + 平台句 + Cite */
export const SeriesStripPreview = () => (
  <Pad><Strip cells={[{ l: "Traded 24h", v: "$2.5M", d: <span className="text-trading-green">▲ +4.8%</span> }, { l: "Settled 24h", v: "543", d: "rounds" }, { l: "Live markets", v: "261", d: "19 assets · 14 matches" }, { l: "Majority right · today", v: <Hit v={49} />, d: "30d avg 50%" }]} /><div className="mt-4"><DataFooter legend={<>In every round, the side priced above 50¢ is the <b className="font-medium text-foreground">majority</b> — the side more money is on. <b className="font-medium text-foreground">Majority right</b> is how often that side actually won. All times are UTC.</>} sentence="According to OmenX prediction market data, the majority bet Up in 44% of Bitcoin rounds on 28 Sep 2026 and was right 52% of the time." url="https://omenx.com/insights/crypto/bitcoin" /></div></Pad>
);
