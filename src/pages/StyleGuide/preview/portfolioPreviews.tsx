// ============================================================
// /portfolio (Lite) previews — PRODUCTION components mounted with fixture
// rows. No hand-copied markup: every card/row/gauge below is the same
// component the page renders.
// ============================================================
import type { LiteLiveRow, LiteMonthGroup, LiteSettledRow } from "@/hooks/useLitePortfolio";
import {
  BoostCheckCard,
  BoostCheckBar,
  KpiCard,
  KpiGrid,
  SegmentChips,
  VoucherHairline,
  PortfolioTabs,
  VOLT,
  GREEN,
  RED,

  money,
  signedMoney,
} from "@/components/portfolio/lite/parts";
import { LiveCard, LiveRow, LiveRowHeader, PendingOrdersRow } from "@/components/portfolio/lite/LiveCards";
import { SelectEntry, SelectToolbar, BatchActionBar, BatchCashOutConfirm } from "@/components/portfolio/lite/BatchCashOut";
import { SettledList } from "@/components/portfolio/lite/SettledList";
import {
  SettlementDetailDesktop,
  SettlementDetailMobile,
  type SettlementDetailVM,
} from "@/components/portfolio/lite/SettlementDetailView";
import {
  SeriesDetailDesktop,
  SeriesDetailMobile,
  type SeriesDetailVM,
} from "@/components/portfolio/lite/SeriesDetailView";
import { PortfolioErrorBoundary } from "@/components/portfolio/lite/PortfolioErrorBoundary";
import {
  PortfolioSkeleton,
  PortfolioFetchError,
  PortfolioNotFound,
  PortfolioEmptyLive,
} from "@/components/portfolio/lite/PortfolioAsyncStates";
import { SettledRow } from "@/components/portfolio/lite/SettledList";
import { useIsMobile } from "@/hooks/use-mobile";
import { LiteAuthGate } from "@/components/portfolio/lite/LiteAuthGate";
import { MobileHeader } from "@/components/MobileHeader";
import { settledDayLabel, monthGroupLabel, monthKey } from "@/lib/settleLabel";
import { useState } from "react";

/** Fixture dates stay relative so settleLabel() output never goes stale. */
const inDays = (d: number, hour = 16, min = 0) => {
  const t = new Date();
  t.setDate(t.getDate() + d);
  t.setHours(hour, min, 0, 0);
  return t.toISOString();
};

/** Same thing, expressed backwards — "N days ago at hh:mm". */
const daysAgoAt = (daysAgo: number, hour = 12, min = 0) => inDays(-daysAgo, hour, min);

const base: LiteLiveRow = {
  id: "demo-1",
  eventId: "demo-event",
  eventName: "Bitcoin above $70,000",
  categoryLabel: "Crypto",
  settlesAt: inDays(2),
  sideWord: "Up",
  side: "yes",
  optionName: null,
  priceNow: 0.38,
  cost: 120,
  nowWorth: 158.4,
  profit: 38.4,
  leverageNum: 2,
  isVoucher: false,
  airdropTag: "none",
  segment: "boost",
  sizeNum: 480,
  ifWins: 480,
  autoClose: { kind: "level" as const, price: 0.34 },
  hot: false,
  tradePath: "/events",
};

const hotRow: LiteLiveRow = {
  ...base,
  id: "demo-hot",
  eventName: "Arsenal to beat Liverpool",
  categoryLabel: "Soccer",
  settlesAt: inDays(0, 22),
  sideWord: "ARS +1.5",
  side: "no",
  optionName: null,
  priceNow: 0.36,
  autoClose: { kind: "level" as const, price: 0.35 },
  hot: true,
  profit: -42.1,
  nowWorth: 77.9,
};


const voucherRow: LiteLiveRow = {
  ...base,
  id: "demo-voucher",
  eventName: "ETH above $4,000 today",
  categoryLabel: "Crypto",
  settlesAt: inDays(0, 23),
  isVoucher: true,
  airdropTag: "voucher",
  leverageNum: 1,
  autoClose: { kind: "none" as const },
  profit: 12.5,
  nowWorth: 62.5,
  cost: 50,
  ifWins: 125,
};

const standardRow: LiteLiveRow = {
  ...base,
  id: "demo-standard",
  eventName: "9988.HK closes up today",
  categoryLabel: "Stocks",
  settlesAt: inDays(0, 16),
  segment: "standard",
  leverageNum: 1,
  autoClose: { kind: "none" as const },
  cost: 250,
  profit: -18,
  nowWorth: 232,
  ifWins: 500,
  tradePath: "/spot",
};

const gauge = (riskRatio: number) => ({
  riskRatio,
  equity: 1240,
  imTotal: 930,
  untilAutoClose: 310,
});

export const PortfolioGaugeStatesPreview = () => (
  <div className="space-y-3 bg-background p-4">
    <BoostCheckCard data={gauge(42)} />
    <BoostCheckCard data={gauge(86)} />
    <BoostCheckCard data={gauge(97)} />
  </div>
);

export const PortfolioGaugeBarPreview = () => (
  <div className="space-y-3 bg-background p-4">
    <BoostCheckBar data={gauge(42)} />
    <BoostCheckBar data={gauge(86)} />
    <BoostCheckBar data={gauge(97)} />
  </div>
);

/* -------- PF-8 · Live 常规态（盈利 / 亏损 / 零盈亏 · 1×–5× 倍数梯度）-------- */
const pf8Rows: LiteLiveRow[] = [
  { ...base, id: "pf8-win", eventName: "Bitcoin above $70,000", profit: 38.4, nowWorth: 158.4, leverageNum: 2 },
  { ...base, id: "pf8-loss", eventName: "ETH above $4,000 today", profit: -42.1, nowWorth: 77.9, leverageNum: 2 },
  { ...base, id: "pf8-zero", eventName: "US CPI above 3% in September", categoryLabel: "Finance", settlesAt: inDays(6, 16), profit: 0, nowWorth: 120, leverageNum: 2 },
  { ...base, id: "pf8-2x", eventName: "Fed cuts in September", categoryLabel: "Finance", settlesAt: inDays(5, 16), profit: 22, nowWorth: 142, leverageNum: 2 },
  { ...base, id: "pf8-4x", eventName: "NVIDIA closes above $190", categoryLabel: "Stocks", settlesAt: inDays(1, 16), profit: 61.5, nowWorth: 181.5, leverageNum: 4 },
  { ...base, id: "pf8-5x", eventName: "Solana above $260 this week", categoryLabel: "Crypto", settlesAt: inDays(4, 16), profit: -12.75, nowWorth: 107.25, leverageNum: 5 },
  { ...base, id: "pf8-1x", eventName: "Arsenal to beat Liverpool", categoryLabel: "Soccer", settlesAt: inDays(0, 22), profit: 6.2, nowWorth: 126.2, leverageNum: 1, autoClose: { kind: "none" as const } },
];

export const PortfolioLiveCardsPreview = () => (
  <div className="flex flex-col gap-2 bg-background p-4">
    {pf8Rows.map((r) => (
      <LiveCard key={r.id} row={r} />
    ))}
  </div>
);

export const PortfolioDesktopRowsPreview = () => (
  <div className="bg-background py-4">
    <LiveRowHeader />
    {pf8Rows.map((r) => (
      <LiveRow key={r.id} row={r} />
    ))}
  </div>
);


/* ------------------------------- KPI ------------------------------- */

export const PortfolioKpiMobilePreview = () => (
  <div className="space-y-4 bg-background p-4">
    <div>
      <p className="pb-1.5 text-[11px] uppercase tracking-wide text-[#6B7280]">Live · 正</p>
      <KpiGrid cols={2}>
        <KpiCard label="COST" value={money(669.67)} sub="7 calls" />
        <KpiCard
          label="NOW WORTH"
          value={money(775.31)}
          sub={`${signedMoney(105.64)} · +15.8%`}
          subColor={VOLT}
        />
      </KpiGrid>
    </div>
    <div>
      <p className="pb-1.5 text-[11px] uppercase tracking-wide text-[#6B7280]">Live · 负</p>
      <KpiGrid cols={2}>
        <KpiCard label="COST" value={money(310)} sub="2 calls" />
        <KpiCard
          label="NOW WORTH"
          value={money(268.4)}
          sub={`${signedMoney(-41.6)} · -13.4%`}
          subColor={RED}
        />
      </KpiGrid>
    </div>
    <div>
      <p className="pb-1.5 text-[11px] uppercase tracking-wide text-[#6B7280]">Live · 零态</p>
      <KpiGrid cols={2}>
        <KpiCard label="COST" value={money(0)} sub="0 calls" />
        <KpiCard label="NOW WORTH" value={money(0)} sub={`${signedMoney(0)} · +0.0%`} />
      </KpiGrid>
    </div>
  </div>
);

export const PortfolioKpiDesktopPreview = () => (
  <div className="space-y-4 bg-background p-4">
    <div>
      <p className="pb-1.5 text-[11px] uppercase tracking-wide text-[#6B7280]">Live · 桌面 3 卡</p>
      <KpiGrid cols={3}>
        <KpiCard label="COST" value={money(669.67)} sub="7 calls" />
        <KpiCard label="NOW WORTH" value={money(775.31)} />
        <KpiCard label="PROFIT" value={signedMoney(105.64)} sub="+15.8%" subColor={VOLT} />
      </KpiGrid>
    </div>
    <div>
      <p className="pb-1.5 text-[11px] uppercase tracking-wide text-[#6B7280]">Live · 桌面 3 卡（负）</p>
      <KpiGrid cols={3}>
        <KpiCard label="COST" value={money(310)} sub="2 calls" />
        <KpiCard label="NOW WORTH" value={money(268.4)} />
        <KpiCard label="PROFIT" value={signedMoney(-41.6)} sub="-13.4%" subColor={RED} />
      </KpiGrid>
    </div>
  </div>
);

/** PF-1 · tabs + 双段 chips 本体（券发丝行拆去 PF-2，Select 入口拆去 PF-3）。 */
export const PortfolioChromePreview = () => {
  const [tab, setTab] = useState<"live" | "settled">("live");
  const [seg, setSeg] = useState<"boost" | "standard">("boost");
  const [seg2, setSeg2] = useState<"boost" | "standard">("standard");
  return (
    <div className="space-y-3 bg-background">
      <div className="px-4 pt-3">
        <PortfolioTabs value={tab} onChange={setTab} />
      </div>
      <div className="px-4">
        <SegmentChips value={seg} onChange={setSeg} boostCount={6} standardCount={1} />
      </div>
      <div className="px-4 pb-4">
        <SegmentChips value={seg2} onChange={setSeg2} boostCount={0} standardCount={0} />
        <p className="pt-2 text-[11px] text-[#6B7280]">
          ↑ 计数为 0 的 chips（两段都空时仍可切换、不禁用）。
        </p>
      </div>
    </div>
  );
};

/** PF-2 · 券发丝行三态（count>1 / count===1 / count<=0 整行 return null）。 */
export const PortfolioVoucherHairlinePreview = () => (
  <div className="space-y-3 bg-background py-3">
    <VoucherHairline count={2} />
    <VoucherHairline count={1} />
    {/* count<=0 renders nothing at all — no placeholder, no border. */}
    <VoucherHairline count={0} />
    <p className="px-4 text-[11px] text-[#6B7280]">↑ 第三行是 count=0：整行 return null，不占位。</p>
  </div>
);

/** PF-3 · Select 入口与选择工具条（挂真 SelectEntry + 真 SelectToolbar）。 */
export const PortfolioSelectEntryPreview = () => {
  const [seg, setSeg] = useState<"boost" | "standard">("boost");
  const [seg2, setSeg2] = useState<"boost" | "standard">("boost");
  return (
    <div className="space-y-4 bg-background p-4">
      <div>
        <p className="pb-1.5 text-[11px] uppercase tracking-wide text-[#6B7280]">
          入口可见（tab=live · rows&gt;0 · !selectMode）
        </p>
        <div className="flex items-center justify-between gap-3">
          <SegmentChips value={seg} onChange={setSeg} boostCount={6} standardCount={1} />
          <SelectEntry onEnter={() => {}} />
        </div>
      </div>
      <div>
        <p className="pb-1.5 text-[11px] uppercase tracking-wide text-[#6B7280]">
          入口隐藏（rows=0 或 tab=settled）
        </p>
        <div className="flex items-center justify-between gap-3">
          <SegmentChips value={seg} onChange={setSeg} boostCount={0} standardCount={0} />
        </div>
      </div>
      <div>
        <p className="pb-1.5 text-[11px] uppercase tracking-wide text-[#6B7280]">
          选择模式工具条（selectMode === true）
        </p>
        <div className="flex items-center justify-between gap-3">
          <SegmentChips value={seg2} onChange={setSeg2} boostCount={6} standardCount={1} />
          <SelectToolbar
            count={2}
            total={6}
            onSelectAll={() => {}}
            onClear={() => {}}
            onCancel={() => {}}
          />
        </div>
        <p className="pt-2 text-[11px] text-[#6B7280]">
          ↑ 窄屏（&lt; sm）时 Clear 与 N selected 隐藏，只留 Select all + Cancel。
        </p>
      </div>
    </div>
  );
};

/** PF-5 · Settled KPI 桌面三卡（数值照生产实测）。 */
export const PortfolioKpiSettledPreview = () => (
  <div className="space-y-4 bg-background p-4">
    <div>
      <p className="pb-1.5 text-[11px] uppercase tracking-wide text-[#6B7280]">Settled · 桌面 3 卡</p>
      <KpiGrid cols={3}>
        <KpiCard label="WIN RATE" value="39%" sub="19 of 49" />
        <KpiCard label="NET PROFIT" value={signedMoney(3777.81)} sub="49 settled" subColor={GREEN} />
        <KpiCard label="RECORD" value="19W 30L" sub="wins · losses" />
      </KpiGrid>
    </div>
    <div>
      <p className="pb-1.5 text-[11px] uppercase tracking-wide text-[#6B7280]">Settled · NET 为负</p>
      <KpiGrid cols={3}>
        <KpiCard label="WIN RATE" value="39%" sub="19 of 49" />
        <KpiCard label="NET PROFIT" value={signedMoney(-3777.81)} sub="49 settled" subColor={RED} />
        <KpiCard label="RECORD" value="19W 30L" sub="wins · losses" />
      </KpiGrid>
    </div>
    <div>
      <p className="pb-1.5 text-[11px] uppercase tracking-wide text-[#6B7280]">Settled · 零战绩</p>
      <KpiGrid cols={3}>
        <KpiCard label="WIN RATE" value="0%" sub="0 of 0" />
        <KpiCard label="NET PROFIT" value={money(0)} sub="0 settled" />
        <KpiCard label="RECORD" value="0W 0L" sub="wins · losses" />
      </KpiGrid>
    </div>
  </div>
);

/** PF-5 · Settled KPI 移动两卡（RECORD 桌面独有，移动帧不渲染）。 */
export const PortfolioKpiSettledMobilePreview = () => (
  <div className="space-y-4 bg-background p-4">
    <div>
      <p className="pb-1.5 text-[11px] uppercase tracking-wide text-[#6B7280]">Settled · 移动 2 卡</p>
      <KpiGrid cols={2}>
        <KpiCard label="WIN RATE" value="39%" sub="19 of 49" />
        <KpiCard label="NET PROFIT" value={signedMoney(3777.81)} sub="49 settled" subColor={GREEN} />
      </KpiGrid>
    </div>
    <div>
      <p className="pb-1.5 text-[11px] uppercase tracking-wide text-[#6B7280]">Settled · NET 为负</p>
      <KpiGrid cols={2}>
        <KpiCard label="WIN RATE" value="39%" sub="19 of 49" />
        <KpiCard label="NET PROFIT" value={signedMoney(-3777.81)} sub="49 settled" subColor={RED} />
      </KpiGrid>
    </div>
    <div>
      <p className="pb-1.5 text-[11px] uppercase tracking-wide text-[#6B7280]">Settled · 零战绩</p>
      <KpiGrid cols={2}>
        <KpiCard label="WIN RATE" value="0%" sub="0 of 0" />
        <KpiCard label="NET PROFIT" value={money(0)} sub="0 settled" />
      </KpiGrid>
    </div>
  </div>
);


/* Settled fixtures — every date is relative to "now" so the dictionary never
   rots, and every visible date string is derived through the production
   helpers (settledDayLabel / monthGroupLabel / monthKey) rather than typed. */
let settledSeq = 0;
const settled = (
  o: Partial<LiteSettledRow> & { daysAgo?: number; metaHead?: string[]; metaTail?: string[] },
): LiteSettledRow => {
  const { daysAgo = 16, metaHead = ["Up", "2× Boost"], metaTail = [], ...rest } = o;
  const closedAt = daysAgoAt(daysAgo, 14);
  return {
    id: `pf-settled-${++settledSeq}`,
    title: "Bitcoin above $70,000",
    metaParts: [...metaHead, settledDayLabel(closedAt), ...metaTail],
    remark: "none",
    net: 235,
    segment: "boost",
    closedAt,
    isSeries: false,
    won: true,
    ...rest,
  };
};

/** Group by real month so the group header can never disagree with its rows. */
const groupByMonth = (rows: LiteSettledRow[]): LiteMonthGroup[] => {
  const order: string[] = [];
  const map = new Map<string, LiteSettledRow[]>();
  rows.forEach((r) => {
    const k = monthKey(r.closedAt);
    if (!map.has(k)) {
      map.set(k, []);
      order.push(k);
    }
    map.get(k)!.push(r);
  });
  return order.map((key) => ({
    key,
    label: monthGroupLabel(map.get(key)![0].closedAt),
    rows: map.get(key)!,
  }));
};

const groups: LiteMonthGroup[] = groupByMonth([
  settled({ daysAgo: 16 }),
  settled({
    daysAgo: 19,
    title: "ETH above $4,000 today",
    metaHead: ["Up", "3× Boost"],
    metaTail: ["auto-closed"],
    remark: "auto_close",
    net: -88,
    won: false,
  }),
  settled({
    daysAgo: 22,
    title: "Arsenal to beat Liverpool",
    metaHead: ["ARS +1.5"],
    remark: "cashout",
    net: 42.5,
  }),
  settled({
    daysAgo: 25,
    title: "9988.HK closes up",
    metaHead: ["Series", "won 1 of 3"],
    remark: "none",
    net: -31,
    isSeries: true,
    seriesId: "9988.HK%20closes%20up",
    won: false,
  }),
  settled({
    daysAgo: 28,
    title: "US jobs report beats forecast",
    metaHead: ["Yes"],
    remark: "none",
    net: 0.002,
    segment: "standard",
    won: true,
  }),
  settled({ daysAgo: 45, title: "US CPI above 3%", metaHead: ["Yes"], net: 96 }),
]);


export const PortfolioSettledListPreview = () => (
  <div className="bg-background pb-4">
    <p className="px-4 pt-3 text-[11px] text-[#6B7280]">
      月份组头可点击折叠/展开（默认全展开）。试试点击 AUGUST 2026。
    </p>
    <SettledList groups={groups} />
  </div>
);

export const PortfolioEmptyStatesPreview = () => (
  <div className="space-y-6 bg-background p-4">
    <PortfolioEmptyLive />
    <SettledList groups={[]} />
  </div>
);

const AuthGateBody = () => (
  <div className="p-4">
    <KpiGrid cols={2}>
      <KpiCard label="COST" value={money(669.67)} sub="7 calls" />
      <KpiCard label="NOW WORTH" value={money(775.31)} sub={`${signedMoney(105.64)} · +15.8%`} subColor={VOLT} />
    </KpiGrid>
    <div className="pt-3">
      <LiveCard row={base} />
    </div>
  </div>
);

/** Signed-out /portfolio — blurred under-layer + sign-in overlay (forced for docs). */
export const PortfolioAuthGateSignedOutPreview = () => (
  <div className="bg-background">
    <LiteAuthGate forceSignedOut>
      <AuthGateBody />
    </LiteAuthGate>
  </div>
);

/** Signed-in /portfolio — the gate passes children straight through. */
export const PortfolioAuthGateSignedInPreview = () => (
  <div className="bg-background">
    <LiteAuthGate forceSignedIn>
      <AuthGateBody />
    </LiteAuthGate>
  </div>
);


const Boom = () => {
  throw new Error("style-guide: forced detail crash");
};

/** Detail views are wrapped by PortfolioErrorBoundary — never a white screen. */
export const PortfolioErrorBoundaryPreview = () => (
  <div className="bg-background p-4">
    <PortfolioErrorBoundary>
      <Boom />
    </PortfolioErrorBoundary>
  </div>
);

/* ================= Settlement detail (v1.17 §4b/§4c/§4d) ================= */

const detailBase: SettlementDetailVM = {
  eventName: "Bitcoin above $70,000 on Aug 1",
  eventId: "demo-event",
  closeReason: "settlement",
  net: 235,
  cost: 120,
  fees: 1.2,
  shares: 355,
  avgPrice: 0.34,
  exitPrice: 1,
  leverage: 2,
  sideWord: "Up",
  outcomeWon: true,
  openedAt: daysAgoAt(34, 9, 12),
  closedAt: daysAgoAt(30, 14),
  trades: [
    { id: "t1", time: daysAgoAt(34, 9, 12), action: "Open", total: 80, price: 0.33 },
    { id: "t2", time: daysAgoAt(32, 11, 40), action: "Add", total: 40, price: 0.36 },
  ],
};

const detailAutoClosed: SettlementDetailVM = {
  ...detailBase,
  eventName: "Will the Fed cut rates in September?",
  closeReason: "auto_close",
  net: -105,
  cost: 60,
  fees: 5,
  shares: 300,
  avgPrice: 0.6,
  exitPrice: 0.25,
  leverage: 3,
  sideWord: "Yes",
  outcomeWon: false,
  openedAt: daysAgoAt(22, 10),
  closedAt: daysAgoAt(19, 16, 45),
  trades: [
    { id: "t1", time: daysAgoAt(22, 10), action: "Open", total: 30, price: 0.6 },
    { id: "t2", time: daysAgoAt(21, 12), action: "Add", total: 30, price: 0.6 },
  ],
};

const detailCashout: SettlementDetailVM = {
  ...detailBase,
  eventName: "Arsenal to beat Liverpool",
  closeReason: "cashout",
  net: 42.5,
  cost: 150,
  fees: 1.5,
  shares: 410,
  avgPrice: 0.37,
  exitPrice: 0.48,
  leverage: 2,
  sideWord: "ARS +1.5",
  outcomeWon: false,
  openedAt: daysAgoAt(20, 18),
  closedAt: daysAgoAt(19, 20, 10),
  trades: [{ id: "t1", time: daysAgoAt(20, 18), action: "Open", total: 150, price: 0.37 }],
};

const detailLost: SettlementDetailVM = {
  ...detailBase,
  eventName: "9988.HK closes up on Aug 14",
  closeReason: "settlement",
  net: -100,
  cost: 100,
  fees: 0.9,
  shares: 240,
  avgPrice: 0.42,
  exitPrice: 0,
  leverage: 1,
  sideWord: "Up",
  outcomeWon: false,
  openedAt: daysAgoAt(17, 1, 40),
  closedAt: daysAgoAt(17, 8),
  trades: [{ id: "t1", time: daysAgoAt(17, 1, 40), action: "Open", total: 100, price: 0.42 }],
};

const seriesVm: SeriesDetailVM = {
  seriesName: "Ethereum — up or down?",
  eventId: "demo-eth",
  isDailyRounds: true,
  segmentLabel: "Standard",
  rounds: [
    { id: "r3", closedAt: daysAgoAt(17, 12, 20), sideWord: "Up", autoClosed: false, net: -15.15 },
    { id: "r2", closedAt: daysAgoAt(18, 12, 20), sideWord: "Up", autoClosed: false, net: 17.85 },
    { id: "r1", closedAt: daysAgoAt(19, 12, 20), sideWord: "Up", autoClosed: true, net: -15.15 },
  ],
  cost: 45,
  fees: 0.45,
  payout: 32.55,
  net: -12.45,
  wins: 1,
};

const seriesAllWon: SeriesDetailVM = {
  ...seriesVm,
  seriesName: "Bitcoin — up or down?",
  rounds: [
    { id: "w2", closedAt: daysAgoAt(17, 12, 20), sideWord: "Up", autoClosed: false, net: 18.4 },
    { id: "w1", closedAt: daysAgoAt(18, 12, 20), sideWord: "Up", autoClosed: false, net: 21.1 },
  ],
  cost: 30,
  fees: 0.3,
  payout: 69.5,
  net: 39.5,
  wins: 2,
};

const seriesAllLost: SeriesDetailVM = {
  ...seriesVm,
  seriesName: "Solana — up or down?",
  rounds: [
    { id: "l2", closedAt: daysAgoAt(17, 12, 20), sideWord: "Down", autoClosed: true, net: -15 },
    { id: "l1", closedAt: daysAgoAt(18, 12, 20), sideWord: "Down", autoClosed: false, net: -15 },
  ],
  cost: 30,
  fees: 0.3,
  payout: 0,
  net: -30,
  wins: 0,
};

const seriesBoostWeekly: SeriesDetailVM = {
  ...seriesVm,
  seriesName: "Arsenal — weekly result",
  isDailyRounds: false,
  segmentLabel: "Boost",
  rounds: [
    { id: "b2", closedAt: daysAgoAt(19, 20), sideWord: "ARS +1.5", autoClosed: false, net: 24 },
    { id: "b1", closedAt: daysAgoAt(26, 20), sideWord: "ARS -0.5", autoClosed: false, net: -12 },
  ],
  cost: 60,
  fees: 0.6,
  payout: 72,
  net: 12,
  wins: 1,
};

/* --------------------------------------------------------------------------
 * Settlement details — STRICTLY one device per preview.
 * A desktop SectionFrame must never contain a mobile component: 双端对照靠两个
 * frame 并列，而不是一个 iframe 内左右并排。
 * ----------------------------------------------------------------------- */
const DetailDesktop = ({ vm }: { vm: SettlementDetailVM }) => (
  <div className="bg-background p-4">
    <SettlementDetailDesktop vm={vm} actions={{ onViewEvent: () => {} }} />
  </div>
);

const DetailMobile = ({ vm }: { vm: SettlementDetailVM }) => (
  <div className="bg-background p-4">
    <SettlementDetailMobile vm={vm} actions={{ onViewEvent: () => {} }} />
  </div>
);

export const SettlementDetailWonPreview = () => <DetailDesktop vm={detailBase} />;
export const SettlementDetailWonMobilePreview = () => <DetailMobile vm={detailBase} />;

export const SettlementDetailAutoClosedPreview = () => <DetailDesktop vm={detailAutoClosed} />;
export const SettlementDetailAutoClosedMobilePreview = () => <DetailMobile vm={detailAutoClosed} />;

export const SettlementDetailCashoutPreview = () => <DetailDesktop vm={detailCashout} />;
export const SettlementDetailCashoutMobilePreview = () => <DetailMobile vm={detailCashout} />;

export const SettlementDetailLostPreview = () => <DetailDesktop vm={detailLost} />;
export const SettlementDetailLostMobilePreview = () => <DetailMobile vm={detailLost} />;

export const SettlementSeriesDetailPreview = () => (
  <div className="bg-background p-4">
    <SeriesDetailDesktop vm={seriesVm} actions={{ onViewEvent: () => {} }} />
  </div>
);

export const SettlementSeriesExtremesPreview = () => (
  <div className="space-y-4 bg-background p-4">
    <SeriesDetailDesktop vm={seriesAllWon} actions={{ onViewEvent: () => {} }} />
    <SeriesDetailDesktop vm={seriesAllLost} actions={{ onViewEvent: () => {} }} />
    <SeriesDetailDesktop vm={seriesBoostWeekly} actions={{ onViewEvent: () => {} }} />
  </div>
);

/** Mobile series是独立整页：inner header + 返回，无 tabs / KPI / chips。 */
export const SeriesMobilePagePreview = () => (
  <div className="min-h-[560px] bg-background">
    <MobileHeader variant="inner" title="Ethereum — up or down?" showBack backTo="/portfolio?tab=settled" />
    <div className="pt-4">
      <SeriesDetailMobile vm={seriesVm} actions={{ onViewEvent: () => {} }} />
    </div>
  </div>
);

/* ============ Boost check · Details 展开件（移动抽屉 / 桌面 Popover） ============
 * 生产件 DetailsDrawer / DetailsPopover 不对外导出，展开态只能由「点 Details ›」
 * 触发 —— 这里挂真 BoostCheckCard / BoostCheckBar，再在挂载后程序化点一次同一个
 * 按钮，展示的就是生产的展开态本体，没有任何手抄。
 */
/** Mobile: Details › 打开 MobileDrawer（底部抽屉）。 */
export const PortfolioDetailsDrawerPreview = () => (
  <div className="bg-background p-4" style={{ minHeight: 420 }}>
    <BoostCheckCard data={gauge(86)} defaultOpen />
  </div>
);

/** Desktop: 同一个 Details › 打开 320px 锚定 Popover，绝不是底部抽屉。 */
export const PortfolioDetailsPopoverPreview = () => (
  <div className="bg-background p-4" style={{ minHeight: 420 }}>
    <BoostCheckBar data={gauge(86)} defaultOpen />
  </div>
);

/* ---------------- 桌面挂单行（折叠 / 展开两态） ---------------- */
const pendingOrders = [
  { id: "o1", event: "Bitcoin above $70,000", eventId: "demo-event", size: "120", price: "41¢" },
  { id: "o2", event: "Arsenal to beat Liverpool", eventId: "demo-arsenal", size: "80", price: "36¢" },
];

export const PortfolioPendingDesktopPreview = () => (
  <div className="space-y-4 bg-background p-4">
    <div>
      <p className="pb-1.5 text-[11px] uppercase tracking-wide text-[#6B7280]">折叠态</p>
      <PendingOrdersRow orders={pendingOrders} />
    </div>
    <div>
      <p className="pb-1.5 text-[11px] uppercase tracking-wide text-[#6B7280]">展开态（逐单行 · 点击跳 Pro）</p>
      <PendingOrdersRow orders={pendingOrders} defaultOpen />
    </div>
    <div>
      <p className="pb-1.5 text-[11px] uppercase tracking-wide text-[#6B7280]">orders = []</p>
      <PendingOrdersRow orders={[]} />
      <p className="pt-1 text-[11px] text-[#6B7280]">↑ 组件 return null，桌面同样不占高度。</p>
    </div>
  </div>
);

/* ---------------- Settled 月份懒加载控件 ---------------- */
export const PortfolioSettledLoadMorePreview = () => (
  <div className="bg-background pb-4">
    <SettledList
      groups={[
        ...groups,
        ...groupByMonth([settled({ daysAgo: 75, title: "US CPI above 3%", metaHead: ["Yes"], net: 12 })]),
      ]}
    />
  </div>
);

/* ---------------- Live 行标枚举（airdropTag） ---------------- */
// none / voucher（volt "Voucher"）/ airdrop（pulse #33D6FF "Airdrop"）。
// matched 与 welcome_gift 两种来源共用同一个 "Airdrop" 标，不再细分。
const airdropTagRow: LiteLiveRow = {
  ...base,
  id: "demo-airdrop",
  eventName: "Fed cuts rates in June",
  categoryLabel: "Macro",
  settlesAt: inDays(3),
  isVoucher: false,
  airdropTag: "airdrop",
  leverageNum: 1,
  segment: "standard",
  autoClose: { kind: "none" as const },
  cost: 10,
  nowWorth: 13.2,
  profit: 3.2,
  ifWins: 25,
};

export const PortfolioAirdropTagRowsPreview = () => (
  <div className="bg-background py-4">
    <LiveRowHeader />
    <LiveRow row={{ ...base, id: "tag-none", airdropTag: "none", isVoucher: false }} />
    <LiveRow row={voucherRow} />
    <LiveRow row={airdropTagRow} />
  </div>
);

export const PortfolioAirdropTagCardsPreview = () => (
  <div className="flex flex-col gap-2 bg-background p-4">
    <LiveCard row={{ ...base, id: "tag-none-m", airdropTag: "none", isVoucher: false }} />
    <LiveCard row={voucherRow} />
    <LiveCard row={airdropTagRow} />
  </div>
);

/* --------------------- live batch cash-out select --------------------- */
export const PortfolioLiveSelectPreview = () => {
  const fixtureRows: LiteLiveRow[] = [base, hotRow, standardRow];
  const [selected, setSelected] = useState<Set<string>>(new Set([base.id]));
  const [confirmOpen, setConfirmOpen] = useState(false);
  const toggle = (r: LiteLiveRow) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(r.id)) next.delete(r.id);
      else next.add(r.id);
      return next;
    });
  const selectedRows = fixtureRows.filter((r) => selected.has(r.id));
  return (
    <div className="bg-background pb-4">
      <p className="px-4 pt-3 text-[11px] text-[#6B7280]">
        Select 模式交互预览：工具条内联在 Boost/Standard chips 行右侧；点卡片切换选中，动作条实时汇总；确认层仅演示 UI，不真实平仓。
      </p>
      <div className="flex items-center justify-between gap-3 px-4 pt-3">
        <SegmentChips value="standard" onChange={() => {}} boostCount={2} standardCount={1} />
        <SelectToolbar
          count={selectedRows.length}
          total={fixtureRows.length}
          onSelectAll={() => setSelected(new Set(fixtureRows.map((r) => r.id)))}
          onClear={() => setSelected(new Set())}
          onCancel={() => setSelected(new Set())}
        />
      </div>
      <div className="flex flex-col gap-2 px-4 pt-3">
        {fixtureRows.map((r) => (
          <LiveCard
            key={r.id}
            row={r}
            selectMode
            selected={selected.has(r.id)}
            onToggleSelect={toggle}
          />
        ))}
      </div>
      {/* Spacer matching the fixed BatchActionBar height so it never covers
          the last card; the bar itself pins to the bottom of this frame. */}
      {selectedRows.length > 0 && <div className="h-[76px]" aria-hidden="true" />}
      <BatchActionBar rows={selectedRows} onCashOut={() => setConfirmOpen(true)} />
      <BatchCashOutConfirm
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        rows={selectedRows}
        isMobile={true}
        closingLabel={null}
        onConfirm={() => setConfirmOpen(false)}
      />
    </div>
  );
};

/* ============================================================
   Ⓔ 区补齐 · PF-9 / PF-11 / PF-12 / PF-14 / PF-15 移动挂单
   全部挂生产 LiveCard / LiveRow / PendingOrdersRow，只换 fixture。
   ============================================================ */

/** PF-9 · SIDE chip 六态（二元 / 多选 / 别名 · 长文截断）。 */
const sideChipRows: LiteLiveRow[] = [
  { ...base, id: "pf9-bin-yes", eventName: "Bitcoin above $70,000", side: "yes", sideWord: "Yes", optionName: null, priceNow: 0.73 },
  { ...base, id: "pf9-bin-no", eventName: "ETH above $4,000 today", side: "no", sideWord: "No", optionName: null, priceNow: 0.58 },
  { ...base, id: "pf9-multi-yes", eventName: "Fed decision in September", categoryLabel: "Finance", side: "yes", sideWord: "Yes", optionName: "25 bps hike", priceNow: 0.05 },
  { ...base, id: "pf9-multi-no", eventName: "Which film tops the 2026 worldwide box office?", categoryLabel: "Social", side: "no", sideWord: "No", optionName: "Avengers: Doomsday", priceNow: 0.09 },
  { ...base, id: "pf9-alias", eventName: "Argentina vs Brazil", categoryLabel: "Soccer", side: "yes", sideWord: "ARS +1.5", optionName: null, priceNow: 0.87 },
  { ...base, id: "pf9-alias-long", eventName: "Borussia Dortmund vs Bayern", categoryLabel: "Soccer", side: "no", sideWord: "Borussia Dortmund +1.5 asian handicap", optionName: null, priceNow: 0.44 },
];

export const PortfolioSideChipPreview = () => (
  <div className="bg-background py-4">
    <LiveRowHeader />
    {sideChipRows.map((r) => (
      <LiveRow key={r.id} row={r} />
    ))}
  </div>
);

export const PortfolioSideChipMobilePreview = () => (
  <div className="flex flex-col gap-2 bg-background p-4">
    {sideChipRows.map((r) => (
      <LiveCard key={r.id} row={r} />
    ))}
  </div>
);

/** PF-11 · hot 只由 auto-close 距离决定，与盈亏正负无关。 */
const hotRows: LiteLiveRow[] = [
  { ...base, id: "pf11-normal", eventName: "Bitcoin above $70,000", hot: false, profit: -18.4, nowWorth: 101.6, autoClose: { kind: "level" as const, price: 0.12 } },
  { ...base, id: "pf11-hot-loss", eventName: "NVIDIA closes above $190", categoryLabel: "Stocks", hot: true, profit: -42.1, nowWorth: 77.9, autoClose: { kind: "level" as const, price: 0.35 } },
  { ...base, id: "pf11-hot-win", eventName: "Arsenal to beat Liverpool", categoryLabel: "Soccer", hot: true, profit: 26.4, nowWorth: 146.4, autoClose: { kind: "level" as const, price: 0.35 } },
];

export const PortfolioHotPreview = () => (
  <div className="bg-background py-4">
    <LiveRowHeader />
    {hotRows.map((r) => (
      <LiveRow key={r.id} row={r} />
    ))}
  </div>
);

export const PortfolioHotMobilePreview = () => (
  <div className="flex flex-col gap-2 bg-background p-4">
    {hotRows.map((r) => (
      <LiveCard key={r.id} row={r} />
    ))}
  </div>
);

/** PF-12 · Standard 段：meta 无 Boost 后缀，句子无 auto-close 段。 */
const standardRows: LiteLiveRow[] = [
  {
    ...base,
    id: "pf12-up",
    eventName: "Tencent (0700.HK) — will it close higher today?",
    categoryLabel: "Stocks",
    settlesAt: inDays(0, 16),
    segment: "standard",
    leverageNum: 1,
    autoClose: { kind: "none" as const },
    side: "yes",
    sideWord: "Up",
    optionName: null,
    priceNow: 0.53,
    cost: 200,
    nowWorth: 214,
    profit: 14,
    ifWins: 380,
    tradePath: "/spot",
  },
  {
    ...base,
    id: "pf12-down",
    eventName: "9988.HK closes up today",
    categoryLabel: "Stocks",
    settlesAt: inDays(0, 16),
    segment: "standard",
    leverageNum: 1,
    autoClose: { kind: "none" as const },
    side: "no",
    sideWord: "Down",
    optionName: null,
    priceNow: 0.47,
    cost: 250,
    nowWorth: 232,
    profit: -18,
    ifWins: 500,
    tradePath: "/spot",
  },
];

export const PortfolioStandardLivePreview = () => (
  <div className="bg-background py-4">
    <LiveRowHeader />
    {standardRows.map((r) => (
      <LiveRow key={r.id} row={r} />
    ))}
  </div>
);

export const PortfolioStandardLiveMobilePreview = () => (
  <div className="flex flex-col gap-2 bg-background p-4">
    {standardRows.map((r) => (
      <LiveCard key={r.id} row={r} />
    ))}
  </div>
);

/** PF-14 · settleLabel() 三分支 + 缺失分支。 */
const settlesRows: LiteLiveRow[] = [
  { ...base, id: "pf14-today", eventName: "Bitcoin above $70,000", settlesAt: inDays(0, 16) },
  { ...base, id: "pf14-sameyear", eventName: "Fed cuts in September", categoryLabel: "Finance", settlesAt: inDays(21, 4, 30) },
  { ...base, id: "pf14-crossyear", eventName: "Who wins the 2027 Super Bowl?", categoryLabel: "Social", settlesAt: inDays(400, 12) },
  { ...base, id: "pf14-missing", eventName: "Will Apple announce a foldable iPhone?", categoryLabel: "Tech", settlesAt: null },
];

export const PortfolioSettlesTimePreview = () => (
  <div className="bg-background py-4">
    <LiveRowHeader />
    {settlesRows.map((r) => (
      <LiveRow key={r.id} row={r} />
    ))}
  </div>
);

export const PortfolioSettlesTimeMobilePreview = () => (
  <div className="flex flex-col gap-2 bg-background p-4">
    {settlesRows.map((r) => (
      <LiveCard key={r.id} row={r} />
    ))}
  </div>
);

/** PF-15 移动帧 · 与桌面同一个 PendingOrdersRow。 */
export const PortfolioPendingMobilePreview = () => (
  <div className="space-y-4 bg-background p-4">
    <div>
      <p className="pb-1.5 text-[11px] uppercase tracking-wide text-[#6B7280]">折叠态</p>
      <PendingOrdersRow orders={pendingOrders} />
    </div>
    <div>
      <p className="pb-1.5 text-[11px] uppercase tracking-wide text-[#6B7280]">展开态（逐单行 · 点击跳 Pro）</p>
      <PendingOrdersRow orders={pendingOrders} defaultOpen />
    </div>
    <div>
      <p className="pb-1.5 text-[11px] uppercase tracking-wide text-[#6B7280]">orders = []</p>
      <PendingOrdersRow orders={[]} />
      <p className="pt-1 text-[11px] text-[#6B7280]">↑ 组件 return null，移动端同样不占高度。</p>
    </div>
  </div>
);

/* ============================================================
   Ⓕ 区 · 批量平仓 PF-16 桌面 / PF-17 动作条 / PF-18 确认层两态
   ============================================================ */

const batchRows: LiteLiveRow[] = [
  { ...base, id: "pf-batch-1", eventName: "Bitcoin above $70,000", nowWorth: 158.4, profit: 38.4 },
  { ...base, id: "pf-batch-2", eventName: "ETH above $4,000 today", nowWorth: 77.9, profit: -42.1, side: "no", sideWord: "No" },
  { ...base, id: "pf-batch-3", eventName: "Arsenal to beat Liverpool", categoryLabel: "Soccer", sideWord: "ARS +1.5", nowWorth: 146.4, profit: 26.4 },
  { ...base, id: "pf-batch-4", eventName: "NVIDIA closes above $190", categoryLabel: "Stocks", nowWorth: 181.5, profit: 61.5 },
  { ...base, id: "pf-batch-5", eventName: "US CPI above 3% in September", categoryLabel: "Finance", nowWorth: 120, profit: 0 },
];

/** PF-16 桌面帧 · 选择模式下的行式网格（勾选列 + 单行按钮隐藏）。 */
export const PortfolioLiveSelectDesktopPreview = () => {
  const [selected, setSelected] = useState<Set<string>>(new Set(["pf-batch-1", "pf-batch-3"]));
  const [confirmOpen, setConfirmOpen] = useState(false);
  const toggle = (r: LiteLiveRow) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(r.id)) next.delete(r.id);
      else next.add(r.id);
      return next;
    });
  const rows = batchRows.slice(0, 3);
  const selectedRows = rows.filter((r) => selected.has(r.id));
  return (
    <div className="bg-background pb-4">
      <div className="flex items-center justify-between gap-3 px-4 pt-3">
        <SegmentChips value="boost" onChange={() => {}} boostCount={3} standardCount={1} />
        <SelectToolbar
          count={selectedRows.length}
          total={rows.length}
          onSelectAll={() => setSelected(new Set(rows.map((r) => r.id)))}
          onClear={() => setSelected(new Set())}
          onCancel={() => setSelected(new Set())}
        />
      </div>
      <div className="pt-3">
        <LiveRowHeader selectMode />
        {rows.map((r) => (
          <LiveRow
            key={r.id}
            row={r}
            selectMode
            selected={selected.has(r.id)}
            onToggleSelect={toggle}
          />
        ))}
      </div>
      {selectedRows.length > 0 && <div className="h-[76px]" aria-hidden="true" />}
      <BatchActionBar rows={selectedRows} onCashOut={() => setConfirmOpen(true)} />
      <BatchCashOutConfirm
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        rows={selectedRows}
        isMobile={false}
        closingLabel={null}
        onConfirm={() => setConfirmOpen(false)}
      />
    </div>
  );
};

/** PF-17 · 吸底动作条本体（N=1 / N=3；N=0 不渲染）。 */
const BarStack = () => (
  <>
    <div className="space-y-2 px-4 pt-3 text-[11px] text-[#6B7280]">
      <p>N = 0 → BatchActionBar return null（下方无任何 chrome）。</p>
      <BatchActionBar rows={[]} onCashOut={() => {}} />
      <p>N = 1 / N = 3 见帧底吸底条（两条叠加仅为字典陈列）。</p>
    </div>
    <div className="h-[160px]" aria-hidden="true" />
    <div className="pb-[76px]">
      <BatchActionBar rows={batchRows.slice(0, 1)} onCashOut={() => {}} />
    </div>
    <BatchActionBar rows={batchRows.slice(0, 3)} onCashOut={() => {}} />
  </>
);

export const PortfolioBatchBarPreview = () => (
  <div className="bg-background pb-4">
    <BarStack />
  </div>
);

export const PortfolioBatchBarMobilePreview = () => (
  <div className="bg-background pb-4">
    <BarStack />
  </div>
);

/** PF-18 · 确认层空闲态（桌面 Dialog / 移动 MobileDrawer）。 */
export const PortfolioBatchConfirmPreview = () => (
  <div className="min-h-[520px] bg-background p-4">
    <BatchCashOutConfirm
      open
      onOpenChange={() => {}}
      rows={batchRows}
      isMobile={false}
      closingLabel={null}
      onConfirm={() => {}}
    />
  </div>
);

export const PortfolioBatchConfirmMobilePreview = () => (
  <div className="min-h-[520px] bg-background p-4">
    <BatchCashOutConfirm
      open
      onOpenChange={() => {}}
      rows={batchRows}
      isMobile
      closingLabel={null}
      onConfirm={() => {}}
    />
  </div>
);

/** PF-18 · 确认层执行中（两个按钮均禁用，主按钮显示进度）。 */
export const PortfolioBatchClosingPreview = () => (
  <div className="min-h-[520px] bg-background p-4">
    <BatchCashOutConfirm
      open
      onOpenChange={() => {}}
      rows={batchRows}
      isMobile={false}
      closingLabel="Closing 2 / 5…"
      onConfirm={() => {}}
    />
  </div>
);

export const PortfolioBatchClosingMobilePreview = () => (
  <div className="min-h-[520px] bg-background p-4">
    <BatchCashOutConfirm
      open
      onOpenChange={() => {}}
      rows={batchRows}
      isMobile
      closingLabel="Closing 2 / 5…"
      onConfirm={() => {}}
    />
  </div>
);

/* ================= Ⓖ–Ⓚ · PF-19…PF-38 新增 case ================= */

/** PF-20 单仓结算行 — settlement / auto_close / cashout / close_reason=null / 零结果。 */
export const PortfolioSettledRowPreview = () => (
  <div className="bg-background pb-4">
    <SettledRow row={settled({ daysAgo: 3, net: 235 })} />
    <SettledRow
      row={settled({
        daysAgo: 4,
        title: "ETH above $4,000 today",
        metaHead: ["Up", "3× Boost"],
        metaTail: ["auto-closed"],
        remark: "auto_close",
        net: -88,
        won: false,
      })}
    />
    <SettledRow
      row={settled({
        daysAgo: 5,
        title: "Arsenal to beat Liverpool",
        metaHead: ["ARS +1.5"],
        remark: "cashout",
        net: 42.5,
      })}
    />
    <SettledRow
      row={settled({
        daysAgo: 6,
        title: "TSLA closes up",
        metaHead: ["Up"],
        remark: "none",
        segment: "standard",
        net: 18.4,
      })}
    />
    <SettledRow
      row={settled({
        daysAgo: 7,
        title: "US jobs report beats forecast",
        metaHead: ["Yes"],
        remark: "none",
        net: 0.002,
        won: true,
      })}
    />
  </div>
);

/** PF-21 系列聚合行 — 全胜 / 部分 / 全败，点进系列详情。 */
export const PortfolioSeriesRowPreview = () => (
  <div className="bg-background pb-4">
    <SettledRow
      row={settled({
        daysAgo: 3,
        title: "Bitcoin — up or down?",
        metaHead: ["Series", "won 2 of 2"],
        net: 39.5,
        isSeries: true,
        seriesId: "bitcoin-up-or-down",
      })}
    />
    <SettledRow
      row={settled({
        daysAgo: 4,
        title: "Ethereum — up or down?",
        metaHead: ["Series", "won 1 of 3"],
        net: -12.45,
        isSeries: true,
        seriesId: "ethereum-up-or-down",
        won: false,
      })}
    />
    <SettledRow
      row={settled({
        daysAgo: 5,
        title: "Solana — up or down?",
        metaHead: ["Series", "won 0 of 2"],
        net: -30,
        isSeries: true,
        seriesId: "solana-up-or-down",
        won: false,
      })}
    />
  </div>
);

/** PF-22 Standard 段 settled 行 — Up / Down / Series，永不带杠杆后缀。 */
export const PortfolioStandardSettledPreview = () => (
  <div className="bg-background pb-4">
    <SettledRow
      row={settled({ daysAgo: 1, title: "TSLA closes up", metaHead: ["Up"], segment: "standard", net: 22.4 })}
    />
    <SettledRow
      row={settled({
        daysAgo: 4,
        title: "9988.HK closes up",
        metaHead: ["Down"],
        segment: "standard",
        net: -13.6,
        won: false,
      })}
    />
    <SettledRow
      row={settled({
        daysAgo: 6,
        title: "AAPL — up or down?",
        metaHead: ["Series", "won 2 of 5"],
        segment: "standard",
        net: -8.2,
        isSeries: true,
        seriesId: "aapl-up-or-down",
        won: false,
      })}
    />
  </div>
);

/** PF-28 Standard/spot 单仓详情 — Up/Down 词轴 + ACTIVITY 无成交。 */
const detailStandard: SettlementDetailVM = {
  ...detailBase,
  eventName: "TSLA closes up",
  closeReason: "settlement",
  net: 22.4,
  cost: 100,
  fees: 0.8,
  shares: 260,
  avgPrice: 0.38,
  exitPrice: 1,
  leverage: 1,
  sideWord: "Up",
  outcomeWon: true,
  openedAt: daysAgoAt(6, 9, 35),
  closedAt: daysAgoAt(5, 21),
  trades: [],
};

export const SettlementDetailStandardPreview = () => {
  const isMobile = useIsMobile();
  return (
    <div className="bg-background p-4">
      {isMobile ? (
        <SettlementDetailMobile vm={detailStandard} actions={{ onViewEvent: () => {} }} />
      ) : (
        <SettlementDetailDesktop vm={detailStandard} actions={{ onViewEvent: () => {} }} />
      )}
    </div>
  );
};

/** PF-30 轮次行 — 正 / 负 / auto-closed 三种，都可点进该轮单仓详情。 */
export const SettlementSeriesRoundPreview = () => {
  const isMobile = useIsMobile();
  const vm: SeriesDetailVM = {
    ...seriesVm,
    rounds: [
      { id: "r3", closedAt: daysAgoAt(3, 12, 20), sideWord: "Up", autoClosed: false, net: 17.85 },
      { id: "r2", closedAt: daysAgoAt(4, 12, 20), sideWord: "Down", autoClosed: false, net: -15.15 },
      { id: "r1", closedAt: daysAgoAt(5, 12, 20), sideWord: "Up", autoClosed: true, net: -15.15 },
    ],
  };
  return (
    <div className="bg-background p-4">
      {isMobile ? (
        <SeriesDetailMobile vm={vm} actions={{ onViewEvent: () => {} }} />
      ) : (
        <SeriesDetailDesktop vm={vm} actions={{ onViewEvent: () => {} }} />
      )}
    </div>
  );
};

/** PF-32 Standard 系列详情 — Series · Standard，DETAILS `N · daily rounds`。 */
export const SettlementSeriesStandardPreview = () => {
  const isMobile = useIsMobile();
  const vm: SeriesDetailVM = {
    ...seriesVm,
    seriesName: "TSLA — up or down?",
    segmentLabel: "Standard",
    isDailyRounds: true,
    rounds: [
      { id: "s3", closedAt: daysAgoAt(3, 21), sideWord: "Up", autoClosed: false, net: 12.2 },
      { id: "s2", closedAt: daysAgoAt(4, 21), sideWord: "Down", autoClosed: false, net: -10 },
      { id: "s1", closedAt: daysAgoAt(5, 21), sideWord: "Up", autoClosed: false, net: 6.4 },
    ],
    cost: 60,
    fees: 0.6,
    payout: 68.6,
    net: 8.6,
    wins: 2,
  };
  return (
    <div className="bg-background p-4">
      {isMobile ? (
        <SeriesDetailMobile vm={vm} actions={{ onViewEvent: () => {} }} />
      ) : (
        <SeriesDetailDesktop vm={vm} actions={{ onViewEvent: () => {} }} />
      )}
    </div>
  );
};

/** PF-35 首载骨架 — tabs / chips 是实底 chrome，不骨架。 */
export const PortfolioLoadingPreview = () => {
  const isMobile = useIsMobile();
  return (
    <div className="bg-background pb-4">
      <PortfolioTabs value="live" onChange={() => {}} />
      <PortfolioSkeleton cols={isMobile ? 2 : 3} part="kpi" />
      <div className="px-4 pt-3">
        <SegmentChips value="boost" onChange={() => {}} boostCount={3} standardCount={2} />
      </div>
      <PortfolioSkeleton cols={isMobile ? 2 : 3} part="rows" />
    </div>
  );
};

/** PF-36 列表请求失败 — KPI 三值 `—`，列表区一句话 + Retry。 */
export const PortfolioFetchErrorPreview = () => {
  const isMobile = useIsMobile();
  return (
    <div className="bg-background pb-4">
      <PortfolioTabs value="live" onChange={() => {}} />
      <div className="px-4 pt-3.5">
        <KpiGrid cols={isMobile ? 2 : 3}>
          <KpiCard label="COST" value="—" />
          <KpiCard label="NOW WORTH" value="—" />
          {!isMobile && <KpiCard label="PROFIT" value="—" />}
        </KpiGrid>
      </div>
      <PortfolioFetchError onRetry={() => {}} />
    </div>
  );
};

/** PF-37 详情 Not found — id 不存在与越权 id 渲染逐字相同。 */
export const SettlementDetailNotFoundPreview = () => (
  <div className="bg-background p-4">
    <PortfolioNotFound />
  </div>
);
