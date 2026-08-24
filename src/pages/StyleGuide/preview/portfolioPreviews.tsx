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
import { useState } from "react";

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
};

const voucherRow: LiteLiveRow = {
  ...base,
  id: "demo-voucher",
  eventName: "ETH above $4,000 today",
  categoryLabel: "Crypto",
  settlesAt: inDays(0, 23),
  isVoucher: true,
  leverageNum: 1,
  autoClosePrice: null,
  autoCloseState: "none",
  profit: 12.5,
  nowWorth: 62.5,
  cost: 50,
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
    <LiveCard row={voucherRow} />
    <LiveCard row={standardRow} />
    <PendingOrdersRow orders={[{ id: "o1", event: "BTC above $70,000", size: "120", price: "41¢" }]} />
  </div>
);

export const PortfolioDesktopRowsPreview = () => (
  <div className="bg-background py-4">
    <LiveRowHeader />
    <LiveRow row={base} />
    <LiveRow row={hotRow} />
    <LiveRow row={standardRow} />
  </div>
);

export const PortfolioKpiPreview = () => (
  <div className="space-y-3 bg-background p-4">
    <KpiGrid cols={2}>
      <KpiCard label="COST" value={money(669.67)} sub="7 calls" />
      <KpiCard
        label="NOW WORTH"
        value={money(775.31)}
        sub={`${signedMoney(105.64)} · +15.8%`}
        subColor={VOLT}
      />
    </KpiGrid>
    <KpiGrid cols={3}>
      <KpiCard label="WIN RATE" value="58%" sub="7 of 12" />
      <KpiCard label="NET PROFIT" value={signedMoney(214)} sub="12 settled" subColor={VOLT} />
      <KpiCard label="RECORD" value="7W 5L" sub="wins · losses" />
    </KpiGrid>
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
);

export const PortfolioChromePreview = () => {
  const [tab, setTab] = useState<"live" | "settled">("live");
  const [seg, setSeg] = useState<"boost" | "standard">("boost");
  return (
    <div className="space-y-3 bg-background">
      <div className="px-4 pt-3">
        <PortfolioTabs value={tab} onChange={setTab} />
      </div>
      <VoucherHairline count={2} />
      <div className="px-4 pb-4">
        <SegmentChips value={seg} onChange={setSeg} boostCount={6} standardCount={1} />
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
        metaParts: ["ARS +1.5", "Aug 12", "cashed out early"],
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

export const SettlementDetailDesktopPreview = () => (
  <div className="bg-background p-6">
    <SettlementDetailDesktop vm={detailBase} actions={{ onViewEvent: () => {} }} />
  </div>
);

export const SettlementDetailMobilePreview = () => (
  <SettlementDetailMobile vm={detailBase} actions={{ onViewEvent: () => {} }} />
);

export const SettlementDetailAutoClosedPreview = () => (
  <div className="grid gap-4 bg-background p-4 lg:grid-cols-[380px_1fr]">
    <SettlementDetailMobile vm={detailAutoClosed} actions={{ onViewEvent: () => {} }} />
    <SettlementDetailDesktop vm={detailAutoClosed} actions={{ onViewEvent: () => {} }} />
  </div>
);

export const SettlementSeriesDetailPreview = () => (
  <div className="grid gap-4 bg-background p-4 lg:grid-cols-[380px_1fr]">
    <SeriesDetailMobile vm={seriesVm} actions={{ onViewEvent: () => {} }} />
    <SeriesDetailDesktop vm={seriesVm} actions={{ onViewEvent: () => {} }} />
  </div>
);
