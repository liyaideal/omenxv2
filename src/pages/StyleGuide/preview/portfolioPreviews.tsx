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
  RED,
  money,
  signedMoney,
} from "@/components/portfolio/lite/parts";
import { LiveCard, LiveRow, LiveRowHeader, PendingOrdersRow } from "@/components/portfolio/lite/LiveCards";
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
import { LiteAuthGate } from "@/components/portfolio/lite/LiteAuthGate";
import { MobileHeader } from "@/components/MobileHeader";
import { useEffect, useRef, useState } from "react";

/** Fixture dates stay relative so settleLabel() output never goes stale. */
const inDays = (d: number, hour = 16) => {
  const t = new Date();
  t.setDate(t.getDate() + d);
  t.setHours(hour, 0, 0, 0);
  return t.toISOString();
};

const base: LiteLiveRow = {
  id: "demo-1",
  eventId: "demo-event",
  eventName: "Bitcoin above $70,000",
  categoryLabel: "Crypto",
  settlesAt: inDays(2),
  sideWord: "Up",
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
  autoClosePrice: 0.34,
  autoCloseState: "level",
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
  priceNow: 0.36,
  autoClosePrice: 0.35,
  autoCloseState: "level",
  hot: true,
  profit: -42.1,
  nowWorth: 77.9,
};

const safeBoostRow: LiteLiveRow = {
  ...base,
  id: "demo-safe",
  eventName: "Fed cuts in September",
  categoryLabel: "Finance",
  settlesAt: inDays(5, 16),
  sideWord: "Yes",
  priceNow: 0.55,
  autoClosePrice: null,
  autoCloseState: "none",
  hot: false,
  profit: 22,
  nowWorth: 142,
  cost: 120,
};

const missingBoostRow: LiteLiveRow = {
  ...base,
  id: "demo-missing",
  eventName: "BTC ETF approved this week",
  categoryLabel: "Crypto",
  settlesAt: inDays(3, 16),
  sideWord: "Yes",
  priceNow: 0.42,
  autoClosePrice: null,
  autoCloseState: "missing",
  hot: false,
  profit: 8,
  nowWorth: 108,
  cost: 100,
  ifWins: 250,
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
  autoClosePrice: null,
  autoCloseState: "none",
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
  autoClosePrice: null,
  autoCloseState: "none",
  cost: 250,
  profit: -18,
  nowWorth: 232,
  ifWins: 500,
  tradePath: "/spot",
};

/** Flat position — exercises isZeroMoney() (muted, unsigned $0.00). */
const flatRow: LiteLiveRow = {
  ...base,
  id: "demo-flat",
  eventName: "US CPI above 3% in September",
  categoryLabel: "Finance",
  settlesAt: inDays(6, 16),
  sideWord: "Yes",
  segment: "standard",
  leverageNum: 1,
  autoClosePrice: null,
  autoCloseState: "none",
  cost: 100,
  profit: 0,
  nowWorth: 100,
  ifWins: 210,
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
  <div className="bg-background p-4">
    <BoostCheckBar data={gauge(86)} />
  </div>
);

export const PortfolioLiveCardsPreview = () => (
  <div className="flex flex-col gap-2 bg-background p-4">
    <LiveCard row={base} />
    <LiveCard row={hotRow} />
    <LiveCard row={safeBoostRow} />
    <LiveCard row={missingBoostRow} />
    <LiveCard row={voucherRow} />
    <LiveCard row={standardRow} />
    <LiveCard row={flatRow} />
    <PendingOrdersRow orders={[{ id: "o1", event: "BTC above $70,000", size: "120", price: "41¢" }]} />
    {/* Empty orders → the dashed row renders nothing at all. */}
    <PendingOrdersRow orders={[]} />
    <p className="text-[11px] text-[#6B7280]">
      ↑ 最后一行是 orders=[] 的挂单行：不渲染任何 chrome。
    </p>
  </div>
);

export const PortfolioDesktopRowsPreview = () => (
  <div className="bg-background py-4">
    <LiveRowHeader />
    <LiveRow row={base} />
    <LiveRow row={hotRow} />
    <LiveRow row={safeBoostRow} />
    <LiveRow row={missingBoostRow} />
    <LiveRow row={voucherRow} />
    <LiveRow row={standardRow} />
    <LiveRow row={flatRow} />
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
    <div>
      <p className="pb-1.5 text-[11px] uppercase tracking-wide text-[#6B7280]">Settled · 移动 2 卡</p>
      <KpiGrid cols={2}>
        <KpiCard label="WIN RATE" value="58%" sub="7 of 12" />
        <KpiCard label="NET PROFIT" value={signedMoney(214)} sub="12 settled" subColor={VOLT} />
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
    <div>
      <p className="pb-1.5 text-[11px] uppercase tracking-wide text-[#6B7280]">Settled · 桌面 3 卡</p>
      <KpiGrid cols={3}>
        <KpiCard label="WIN RATE" value="58%" sub="7 of 12" />
        <KpiCard label="NET PROFIT" value={signedMoney(214)} sub="12 settled" subColor={VOLT} />
        <KpiCard label="RECORD" value="7W 5L" sub="wins · losses" />
      </KpiGrid>
    </div>
    <div>
      <p className="pb-1.5 text-[11px] uppercase tracking-wide text-[#6B7280]">Settled · 零态</p>
      <KpiGrid cols={3}>
        <KpiCard label="WIN RATE" value="0%" sub="0 of 0" />
        <KpiCard label="NET PROFIT" value={signedMoney(0)} sub="0 settled" />
        <KpiCard label="RECORD" value="0W 0L" sub="wins · losses" />
      </KpiGrid>
    </div>
  </div>
);

export const PortfolioChromePreview = () => {
  const [tab, setTab] = useState<"live" | "settled">("live");
  const [seg, setSeg] = useState<"boost" | "standard">("boost");
  const [seg2, setSeg2] = useState<"boost" | "standard">("standard");
  return (
    <div className="space-y-3 bg-background">
      <div className="px-4 pt-3">
        <PortfolioTabs value={tab} onChange={setTab} />
      </div>
      <VoucherHairline count={2} />
      {/* count=0 renders nothing — the hairline is conditional chrome. */}
      <VoucherHairline count={0} />
      <div className="px-4">
        <SegmentChips value={seg} onChange={setSeg} boostCount={6} standardCount={1} />
      </div>
      <div className="px-4 pb-4">
        <SegmentChips value={seg2} onChange={setSeg2} boostCount={0} standardCount={0} />
        <p className="pt-2 text-[11px] text-[#6B7280]">
          ↑ 计数为 0 的 chips（两段都空时仍可切换）。上方 voucher 发丝行只有 count &gt; 0 才渲染。
        </p>
      </div>
    </div>
  );
};

const settled = (o: Partial<LiteSettledRow>): LiteSettledRow => ({
  id: Math.random().toString(36).slice(2),
  title: "Bitcoin above $70,000 on Aug 1",
  metaParts: ["Up", "2× Boost", "Aug 1"],
  remark: "none",
  net: 235,
  segment: "boost",
  closedAt: "2026-08-01T14:00:00Z",
  isSeries: false,
  won: true,
  ...o,
});

const groups: LiteMonthGroup[] = [
  {
    key: "2026-08",
    label: "AUGUST 2026",
    rows: [
      settled({}),
      settled({
        title: "ETH above $4,000 today",
        metaParts: ["Up", "3× Boost", "Aug 9", "auto-closed"],
        remark: "auto_close",
        net: -88,
        won: false,
      }),
      settled({
        title: "Arsenal to beat Liverpool",
        metaParts: ["ARS +1.5", "Aug 12"],
        remark: "cashout",
        net: 42.5,
      }),
      settled({
        title: "9988.HK closes up",
        metaParts: ["Series", "won 1 of 3", "Aug 14"],
        remark: "none",
        net: -31,
        isSeries: true,
        seriesId: "9988.HK%20closes%20up",
        won: false,
      }),
      settled({
        title: "US jobs report beats forecast",
        metaParts: ["Yes", "Aug 15"],
        remark: "none",
        net: 0.002,
        segment: "standard",
        won: true,
      }),
    ],
  },
  {
    key: "2026-07",
    label: "JULY 2026",
    rows: [settled({ title: "US CPI above 3%", metaParts: ["Yes", "Jul 22"], net: 96 })],
  },
];

export const PortfolioSettledListPreview = () => (
  <div className="bg-background pb-4">
    <SettledList groups={groups} />
  </div>
);

export const PortfolioEmptyStatesPreview = () => (
  <div className="space-y-6 bg-background p-4">
    <div className="py-10 text-center text-[13px] text-[#6B7280]">No live calls yet</div>
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
    <AuthGateBody />
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
  openedAt: "2026-07-28T09:12:00Z",
  closedAt: "2026-08-01T14:00:00Z",
  trades: [
    { id: "t1", time: "2026-07-28T09:12:00Z", action: "Open", total: 80, price: 0.33 },
    { id: "t2", time: "2026-07-30T11:40:00Z", action: "Add", total: 40, price: 0.36 },
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
  openedAt: "2026-08-09T10:00:00Z",
  closedAt: "2026-08-12T16:45:00Z",
  trades: [
    { id: "t1", time: "2026-08-09T10:00:00Z", action: "Open", total: 30, price: 0.6 },
    { id: "t2", time: "2026-08-10T12:00:00Z", action: "Add", total: 30, price: 0.6 },
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
  openedAt: "2026-08-11T18:00:00Z",
  closedAt: "2026-08-12T20:10:00Z",
  trades: [{ id: "t1", time: "2026-08-11T18:00:00Z", action: "Open", total: 150, price: 0.37 }],
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
  openedAt: "2026-08-14T01:40:00Z",
  closedAt: "2026-08-14T08:00:00Z",
  trades: [{ id: "t1", time: "2026-08-14T01:40:00Z", action: "Open", total: 100, price: 0.42 }],
};

const seriesVm: SeriesDetailVM = {
  seriesName: "Ethereum — up or down?",
  eventId: "demo-eth",
  isDailyRounds: true,
  segmentLabel: "Standard",
  rounds: [
    { id: "r3", closedAt: "2026-08-14T12:20:00Z", sideWord: "Up", autoClosed: false, net: -15.15 },
    { id: "r2", closedAt: "2026-08-13T12:20:00Z", sideWord: "Up", autoClosed: false, net: 17.85 },
    { id: "r1", closedAt: "2026-08-12T12:20:00Z", sideWord: "Up", autoClosed: true, net: -15.15 },
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
    { id: "w2", closedAt: "2026-08-14T12:20:00Z", sideWord: "Up", autoClosed: false, net: 18.4 },
    { id: "w1", closedAt: "2026-08-13T12:20:00Z", sideWord: "Up", autoClosed: false, net: 21.1 },
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
    { id: "l2", closedAt: "2026-08-14T12:20:00Z", sideWord: "Down", autoClosed: true, net: -15 },
    { id: "l1", closedAt: "2026-08-13T12:20:00Z", sideWord: "Down", autoClosed: false, net: -15 },
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
    { id: "b2", closedAt: "2026-08-12T20:00:00Z", sideWord: "ARS +1.5", autoClosed: false, net: 24 },
    { id: "b1", closedAt: "2026-08-05T20:00:00Z", sideWord: "ARS -0.5", autoClosed: false, net: -12 },
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
const AutoOpenDetails = ({
  children,
  minHeight,
}: {
  children: React.ReactNode;
  minHeight: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      const btn = Array.from(ref.current?.querySelectorAll("button") ?? []).find(
        (b) => b.textContent?.trim().startsWith("Details"),
      );
      (btn as HTMLButtonElement | undefined)?.click();
    }, 120);
    return () => clearTimeout(t);
  }, []);
  return (
    <div ref={ref} className="bg-background p-4" style={{ minHeight }}>
      {children}
    </div>
  );
};

/** Mobile: Details › 打开 MobileDrawer（底部抽屉）。 */
export const PortfolioDetailsDrawerPreview = () => (
  <AutoOpenDetails minHeight={420}>
    <BoostCheckCard data={gauge(86)} />
  </AutoOpenDetails>
);

/** Desktop: 同一个 Details › 打开 320px 锚定 Popover，绝不是底部抽屉。 */
export const PortfolioDetailsPopoverPreview = () => (
  <AutoOpenDetails minHeight={420}>
    <BoostCheckBar data={gauge(86)} />
  </AutoOpenDetails>
);

/* ---------------- 桌面挂单行（折叠 / 展开两态） ---------------- */
const pendingOrders = [
  { id: "o1", event: "Bitcoin above $70,000", eventId: "demo-event", size: "120", price: "41¢" },
  { id: "o2", event: "Arsenal to beat Liverpool", eventId: "demo-arsenal", size: "80", price: "36¢" },
];

const AutoExpand = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const t = setTimeout(() => ref.current?.querySelector("button")?.click(), 120);
    return () => clearTimeout(t);
  }, []);
  return <div ref={ref}>{children}</div>;
};

export const PortfolioPendingDesktopPreview = () => (
  <div className="space-y-4 bg-background p-4">
    <div>
      <p className="pb-1.5 text-[11px] uppercase tracking-wide text-[#6B7280]">折叠态</p>
      <PendingOrdersRow orders={pendingOrders} />
    </div>
    <div>
      <p className="pb-1.5 text-[11px] uppercase tracking-wide text-[#6B7280]">展开态（逐单行 · 点击跳 Pro）</p>
      <AutoExpand>
        <PendingOrdersRow orders={pendingOrders} />
      </AutoExpand>
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
        { key: "2026-06", label: "JUNE 2026", rows: [settled({ title: "US CPI above 3%", metaParts: ["Yes", "Jun 12"], net: 12 })] },
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
  autoClosePrice: null,
  autoCloseState: "none",
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
