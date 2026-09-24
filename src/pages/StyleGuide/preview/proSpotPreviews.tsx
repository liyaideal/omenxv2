// Pro /spot terminal (SP-1 · B2/B3) — every frame mounts the PRODUCTION
// components: src/components/pro/ProSpotPanel.tsx, ProTerminalLayout,
// ProBottomTabs. Fixture props only; no auth gate, no data fetching, so each
// key renders standalone for a signed-out visitor.
import { Fragment, useState } from "react";
import {
  ProSpotPanel,
  ProSpotAccountPanel,
  ProSpotOrderPreview,
  type ProSpotSide,
} from "@/components/pro/ProSpotPanel";
import type { ProOrderType } from "@/components/pro/OrderTypeDropdown";
import { ProTerminalLayout } from "@/components/pro/ProTerminalLayout";
import { ProBottomTabs } from "@/components/pro/ProBottomTabs";
import { winningCommission, SPOT_FEE_RATE } from "@/services/tradingService";
import { OptionChips } from "@/components/OptionChips";
import { CandlestickChart } from "@/components/CandlestickChart";
import { DesktopOrderBook } from "@/components/DesktopOrderBook";
import { ProSpotMobileDock } from "@/components/pro/ProSpotMobileDock";
import {
  SpotMobileMarkLine,
  SpotMobileStatsStrip,
  SpotMiniOrderBook,
  SpotOrdersTable,
  SpotPositionsTable,
  SpotEventInfoPanel,
} from "@/components/pro/ProSpotShared";
import type { SpotTerminal } from "@/hooks/useSpotTerminal";

const Rail = ({ children }: { children: React.ReactNode }) => (
  <div className="p-2" style={{ width: 280 }}>
    {children}
  </div>
);

type Fixture = {
  side?: ProSpotSide;
  orderType?: ProOrderType;
  heldYesQty?: number;
  heldNoQty?: number;
  amount?: string;
  available?: number;
  willBePending?: boolean;
  ctaLabel?: string;
  ctaDisabled?: boolean;
  /** Which outcome tile starts selected — Down-only holdings need `false`. */
  startIsYes?: boolean;
  /** Drop the 280px desktop rail — the mobile /spot/order body owns the width. */
  bare?: boolean;
  /** QO-1 · Buy tab amount unit ("units" = Shares). */
  amountMode?: "usdc" | "units";
  /** Slider position that matches `amount` (fixtures must not disagree). */
  sliderPct?: number;
  /** Explicit CTA layout for desktop-only fixtures; bare mode measures itself. */
  ctaLayout?: "row" | "stacked";
};

/** One live panel driven by local state — the same props the page passes. */
const PanelFixture = (f: Fixture) => {
  const [side, setSide] = useState<ProSpotSide>(f.side ?? "buy");
  const [orderType, setOrderType] = useState<ProOrderType>(f.orderType ?? "Market");
  const [amount, setAmount] = useState(f.amount ?? "25.00");
  const [limitPrice, setLimitPrice] = useState("0.4400");
  const [slider, setSlider] = useState<number[]>([f.sliderPct ?? 25]);
  const [slippage, setSlippage] = useState(50);
  const [isYes, setIsYes] = useState(f.startIsYes ?? true);
  const [amountMode, setAmountMode] = useState<"usdc" | "units">(f.amountMode ?? "usdc");
  const buyInUnits = side === "buy" && amountMode === "units";

  const price = orderType === "Limit" ? parseFloat(limitPrice) || 0.44 : isYes ? 0.4649 : 0.5351;
  const amt = parseFloat(amount) || 0;
  const qty = side === "sell" || buyInUnits ? amt : price > 0 ? amt / price : 0;
  const cost = price * qty;
  const fee = cost * 0.0015;
  const grossWin = Math.max(0, qty - cost);
  const maxWin = Math.max(0, grossWin * 0.95 - fee);
  // Same helper as the page/ledger: entry fee is netted out of the base first.
  const sellCommission =
    side === "sell" ? winningCommission((price - 0.38) * qty, 0.38 * qty * SPOT_FEE_RATE) : 0;

  const heldYesQty = f.heldYesQty ?? 0;
  const heldNoQty = f.heldNoQty ?? 0;
  const heldQty = isYes ? heldYesQty : heldNoQty;

  const Shell = f.bare ? Fragment : Rail;

  return (
    <Shell>
      <ProSpotPanel
        chrome={f.bare ? "bare" : "card"}
        side={side}
        onSideChange={(s) => {
          setSide(s);
          setAmount(s === "sell" ? "12" : "25.00");
        }}
        orderType={orderType}
        onOrderTypeChange={setOrderType}
        yesLabel="Up"
        noLabel="Down"
        yesPrice={0.4649}
        noPrice={0.5351}
        isYesSelected={isYes}
        onSelectOutcome={(w) => setIsYes(w === "yes")}
        heldYesQty={heldYesQty}
        heldNoQty={heldNoQty}
        outcomeLabel={isYes ? "Up" : "Down"}
        available={f.available ?? 500}
        heldQty={heldQty}
        limitPrice={limitPrice}
        onLimitPriceChange={setLimitPrice}
        amount={amount}
        onAmountChange={setAmount}
        amountMode={amountMode}
        onAmountModeChange={setAmountMode}
        sliderValue={slider}
        onSliderChange={setSlider}
        sliderBase={side === "sell" ? heldQty : buyInUnits ? (f.available ?? 500) / price : f.available ?? 500}
        slippageBps={slippage}
        onSlippageChange={setSlippage}
        qty={qty}
        cost={cost}
        fee={fee}
        maxWin={maxWin}
        sellCommission={sellCommission}
        sellReceive={Math.max(0, cost - sellCommission)}
        bestAsk={0.47}
        bestBid={0.46}
        settleEtOnly="20:15"
        tickInvalid={false}
        willBePending={f.willBePending ?? false}
        ctaLabel={f.ctaLabel ?? `${side === "sell" ? "Sell" : "Buy"} ${isYes ? "Up" : "Down"}`}
        ctaDisabled={f.ctaDisabled ?? false}
        submitting={false}
        ctaLayout={f.ctaLayout}
        onSubmit={() => undefined}
      />
    </Shell>
  );
};

/** SP-B1 · Buy · Market — the default panel. */
export const ProSpotPanelBuyMarket = () => <PanelFixture />;

/** SP-B2 · Buy · Limit — limit price input + tick rules. */
export const ProSpotPanelBuyLimit = () => <PanelFixture orderType="Limit" />;
/** QO-1 · Buy · Shares mode — the Amount suffix is the unit picker, input holds shares. */
export const ProSpotPanelBuyShares = () => <PanelFixture amountMode="units" amount="200" sliderPct={19} />;

/** SP-B3 · Sell with shares on one side — the unheld tile is greyed to 0 sh.
 *  Share sizes are FRACTIONAL: the held line and Shares row keep 3 dp. */
export const ProSpotPanelSellHeld = () => (
  <PanelFixture side="sell" amount="40.512" heldYesQty={40.512} heldNoQty={0} />
);
/** SP-B2b · Sell · Limit — held shares, limit above mark: the sell rests as Pending, shares stay locked. */
export const ProSpotPanelSellLimit = () => (
  <PanelFixture side="sell" orderType="Limit" amount="20" heldYesQty={40.512} heldNoQty={0} />
);

/** SP-B3b · Sell a Down-only holding with a fractional size (2,034.879 sh).
 *  Guards SP-1-FIX3 Bug 1: the held side must follow the position's option,
 *  and no display may round the quantity that feeds the order. */
export const ProSpotPanelSellHeldDown = () => (
  <PanelFixture
    side="sell"
    startIsYes={false}
    amount="2034.879"
    heldYesQty={0}
    heldNoQty={2034.879}
    ctaLabel="Sell Down"
  />
);

/** SP-B4 · Sell with nothing held — both tiles disabled + helper line. */
export const ProSpotPanelSellNone = () => <PanelFixture side="sell" amount="0" />;

/** SP-B5 · Insufficient balance — CTA disabled. */
export const ProSpotPanelInsufficient = () => (
  <PanelFixture available={0} ctaLabel="Insufficient balance" ctaDisabled />
);

/** SP-B8 · Frozen market (FIX5): past freeze_time → CTA disabled with reason. */
export const ProSpotPanelFrozen = () => (
  <PanelFixture ctaLabel="Market frozen" ctaDisabled />
);

/** SP-B6 · Resting limit warning. */
export const ProSpotPanelPendingLimit = () => (
  <PanelFixture orderType="Limit" willBePending ctaLabel="Buy Up" />
);

/** SP-B7 · Order preview dialog (production Dialog, forced open). */
export const ProSpotPreviewDialog = () => (
  <div className="min-h-[420px]">
    <ProSpotOrderPreview
      open
      onOpenChange={() => undefined}
      eventName="Microsoft (MSFT) — will close higher today?"
      outcomeLabel="Up"
      side="buy"
      orderType="Market"
      price={0.4649}
      qty={53}
      cost={25}
      fee={0.04}
      maxWin={26.56}
      sellCommission={0}
      sellReceive={0}
      ctaLabel="Buy Up"
      submitting={false}
      isYesSelected
      onConfirm={() => undefined}
    />
  </div>
);

const Block = ({ label }: { label: string }) => (
  <div className="flex h-full w-full items-center justify-center text-[11px] font-mono text-muted-foreground">
    {label}
  </div>
);

/** SP-B8 · The shared Pro terminal skeleton — slot geometry only. */
export const ProTerminalSkeleton = () => (
  <div className="h-[520px]">
    <ProTerminalLayout
      className="h-full"
      chartMinHeightClass="min-h-[280px]"
      header={
        <div className="flex h-12 items-center px-4 text-[11px] font-mono text-muted-foreground">
          header — page-owned chrome (LOCKED)
        </div>
      }
      chart={<Block label="chart slot (flex-1)" />}
      orderBook={<Block label="orderBook slot (280px)" />}
      bottomTabs={
        <ProBottomTabs
          tabs={[
            { key: "Positions", label: "Positions", count: 0 },
            { key: "Orders", label: "Current Orders", count: 0 },
          ]}
          active="Positions"
          onChange={() => undefined}
          authTitle="Sign in to view spot positions"
          authDescription="Log in or create an account to view your open positions and orders."
          bodyClassName="h-[120px]"
          previewNoAuthGate
        >
          <Block label="bottomTabs slot" />
        </ProBottomTabs>
      }
      panel={
        <div style={{ height: 200 }}>
          <Block label="panel slot" />
        </div>
      }
      account={
        <ProSpotAccountPanel available={500} inOrders={25} openPositions={2} />
      }
    />
  </div>
);

/** SP-I · guest gate inside ProBottomTabs — production LiteAuthGate panel variant. */
export const ProBottomTabsGuest = () => (
  <div className="w-full">
    <ProBottomTabs
      tabs={[
        { key: "Positions", label: "Positions", count: 0 },
        { key: "Orders", label: "Current Orders", count: 0 },
      ]}
      active="Positions"
      onChange={() => undefined}
      authTitle="Sign in to view spot positions"
      authDescription="Track your open positions and orders by signing in to your account."
      bodyClassName="h-[120px]"
      previewForceSignedOut
    >
      <Block label="bottomTabs slot" />
    </ProBottomTabs>
  </div>
);

/** SP-J · Thin spot book: three real levels plus fixed blank slots per side. */
/** SP-J0 · normal-depth spot book (NORMAL, 9 levels a side) — what /spot looks like most of the day. */
export const ProSpotBookNormal = () => (
  <div style={{ height: 560, width: 280 }}>
    <DesktopOrderBook
      variant="spot"
      quoteMode="NORMAL"
      currentPrice="0.4936"
      markPrice="0.4936"
      isPositive={false}
      asks={[
        { price: "0.5200", amount: "5,769", total: "5,769" },
        { price: "0.5300", amount: "193", total: "5,962" },
        { price: "0.5400", amount: "3,177", total: "9,139" },
        { price: "0.5500", amount: "5,731", total: "14,870" },
        { price: "0.5700", amount: "18,945", total: "33,815" },
        { price: "0.5800", amount: "100", total: "33,915" },
        { price: "0.5900", amount: "494", total: "34,409" },
        { price: "0.6000", amount: "1,077", total: "35,486" },
        { price: "0.6100", amount: "640", total: "36,126" },
      ]}
      bids={[
        { price: "0.4600", amount: "9,221", total: "9,221" },
        { price: "0.4500", amount: "6,757", total: "15,978" },
        { price: "0.4400", amount: "4,139", total: "20,117" },
        { price: "0.4300", amount: "10,467", total: "30,584" },
        { price: "0.4200", amount: "8,781", total: "39,365" },
        { price: "0.4100", amount: "4,809", total: "44,174" },
        { price: "0.4000", amount: "3,117", total: "47,291" },
        { price: "0.3900", amount: "4,782", total: "52,073" },
        { price: "0.3800", amount: "3,600", total: "55,673" },
      ]}
    />
  </div>
);

export const ProSpotBookThin = () => (
  <div style={{ height: 560, width: 280 }}>
    <DesktopOrderBook
      variant="spot"
      quoteMode="CONSERVATIVE"
      currentPrice="0.4649"
      markPrice="0.4649"
      isPositive
      asks={[
        { price: "0.4700", amount: "420", total: "420" },
        { price: "0.4800", amount: "310", total: "730" },
        { price: "0.4900", amount: "205", total: "935" },
      ]}
      bids={[
        { price: "0.4600", amount: "380", total: "380" },
        { price: "0.4500", amount: "265", total: "645" },
        { price: "0.4400", amount: "190", total: "835" },
      ]}
    />
  </div>
);

/* ---------------- SP-2 · mobile Pro spot (375 px) ---------------- */

/** Minimal fixture standing in for the shared spot terminal hook. */
const spotFixture = (over: Partial<SpotTerminal> = {}) =>
  ({
    event: {
      id: "us-meta-updown-20260909",
      name: "Meta (META) — will close higher today?",
      base_price: 577.1755,
      description: "US-stock daily up/down (spot).",
      source_name: "databento",
      source_url: "",
    },
    outcomeLabel: "Up",
    outcomePrice: 0.4916,
    yesLabel: "Up",
    noLabel: "Down",
    yesLive: 0.4916,
    noLive: 0.5084,
    basePrice: 577.1755,
    cur: "$",
    ticker: "META",
    indicative: 579.0784,
    indicativePct: 0.33,
    sessionOpenMark: 0.4882,
    sessionTag: "pre-mkt",
    countdown: { text: "02:14:08", urgency: "muted" as const, diffMs: 8048000 },
    freezeEtOnly: "15:55",
    settleEtOnly: "16:15",
    endDate: null,
    freezeAt: null,
    blocked: false,
    blockedReason: null,
    ...over,
  }) as unknown as SpotTerminal;

const Phone = ({ children, width = 375 }: { children: React.ReactNode; width?: number }) => (
  <div style={{ width }}>{children}</div>
);

/** SP-2 · mobile Charts view — stats strip + mark line + sticky dock. */
const MobileChartsFrame = ({ width, terminal }: { width?: number; terminal?: Partial<SpotTerminal> }) => {
  const t = spotFixture({
    selectedOption: { id: "sg-up" },
    yesOpt: { id: "sg-up" },
    noOpt: { id: "sg-down" },
    isYesSelected: true,
    spotPositions: [{
      id: "sg-position",
      event: "Meta (META) — will close higher today?",
      option: "Up",
      optionId: "sg-up",
      entryPrice: "0.4620",
      markPrice: "0.4916",
      entryPriceNum: 0.462,
      markPriceNum: 0.4916,
      sizeNum: 2034.879,
      pnlNum: 60.23,
    }],
    spotOrders: [{
      id: "sg-order",
      event: "Meta (META) — will close higher today?",
      option: "Down",
      type: "sell",
      orderType: "Limit",
      price: "0.5200",
      amount: "250.000",
      total: "130.00",
      status: "Pending",
    }],
    frozenCancelledIds: new Set<string>(),
    isCancelling: false,
    closePosition: () => undefined,
    handleCancelSpotOrder: async () => undefined,
    ...terminal,
  } as unknown as Partial<SpotTerminal>);
  return (
    <Phone width={width}>
      {/* SP-2-FIX7: binary 事件不渲染市场 chip 行 */}

      <SpotMobileStatsStrip t={t} />
      <SpotMobileMarkLine t={t} />
      <div className="w-full min-w-0 overflow-hidden" style={{ height: 320 }}>
        <CandlestickChart basePrice={0.4916} side="buy" underlying={{ ticker: "META", basePrice: 577.1755, lastPrice: 579.0784, shareLabel: "Up" }} />
      </div>
      <SpotPositionsTable t={t} variant="mobile" />
      <SpotOrdersTable t={t} variant="mobile" />
      <div className="relative mt-4 h-[92px]">
        <ProSpotMobileDock
          available={14315.4}
          yesLabel="Up"
          noLabel="Down"
          yesPrice={0.4916}
          noPrice={0.5084}
          selected="yes"
          onTap={() => undefined}
          surfaceSwitchPreview={{ signedIn: true, active: "pro" }}
          className="absolute"
        />
      </div>
    </Phone>
  );
};

/** SP-2 · mobile Charts view — stats strip + mark line + sticky dock (375 px). */
export const ProSpotMobileCharts = () => <MobileChartsFrame />;

/** SP-2-FIX3 · 360 px worst case: five-digit price + PRE pill. */
export const ProSpotMobileCharts360 = () => (
  <MobileChartsFrame width={360} terminal={{ indicative: 57907.84, sessionTag: "pre-mkt" }} />
);

/** SP-2 · mobile Charts view, market frozen — dock collapses to one inert bar (DK-1). */
export const ProSpotMobileChartsFrozen = () => {
  const t = spotFixture({
    countdown: { text: "00:00:00", urgency: "red", diffMs: 0 },
    blocked: true,
    blockedReason: "Market frozen",
  } as Partial<SpotTerminal>);
  return (
    <Phone>
      <SpotMobileStatsStrip t={t} />
      <SpotMobileMarkLine t={t} />
      <div className="relative mt-4 h-[92px]">
        <ProSpotMobileDock
          available={14315.4}
          yesLabel="Up"
          noLabel="Down"
          yesPrice={0.4916}
          noPrice={0.5084}
          selected="yes"
          onTap={() => undefined}
          blocked
          blockedReason="Market frozen"
          surfaceSwitchPreview={{ signedIn: true, active: "pro" }}
          className="absolute"
        />
      </div>
    </Phone>
  );
};

const BOOK_ASKS = [
  { price: "0.4720", amount: "1,204" },
  { price: "0.4710", amount: "860" },
  { price: "0.4700", amount: "2,410" },
  { price: "0.4680", amount: "540" },
  { price: "0.4670", amount: "1,905" },
  { price: "0.4660", amount: "720" },
];
const BOOK_BIDS = [
  { price: "0.4640", amount: "980" },
  { price: "0.4630", amount: "1,510" },
  { price: "0.4620", amount: "430" },
  { price: "0.4600", amount: "2,220" },
  { price: "0.4580", amount: "615" },
  { price: "0.4560", amount: "1,140" },
];

/** The real `/spot/order` body: flex-1 panel + the production 120px mini book. */
const OrderBodyFixture = (f: Fixture) => (
  <Phone>
    <div className="flex">
      <div className="flex-1 min-w-0">
        <PanelFixture {...f} bare />
      </div>
      <SpotMiniOrderBook asks={BOOK_ASKS} bids={BOOK_BIDS} price={0.4649} />
    </div>
  </Phone>
);

/** SP-2 · /spot/order — Buy tab (same ProSpotPanel as desktop, 375 px). */
export const ProSpotMobileOrderBuy = () => <OrderBodyFixture />;
/** QO-1 · /spot/order — Buy · Shares mode. */
export const ProSpotMobileOrderBuyShares = () => <OrderBodyFixture amountMode="units" amount="200" sliderPct={19} />;

/** SP-2 · /spot/order — Sell tab with a Down-only holding. */
export const ProSpotMobileOrderSellHeld = () => (
  <OrderBodyFixture
    side="sell"
    heldNoQty={2034.879}
    startIsYes={false}
    amount="2034.879"
    sliderPct={100}
  />
);

/** SP-2 · the sticky dock alone: default / side selected / frozen (one bar, DK-1). */
export const ProSpotMobileDockStates = () => (
  <div className="space-y-6" style={{ width: 375 }}>
    {[
      { k: "default", selected: null as "yes" | "no" | null, blocked: false },
      { k: "up selected", selected: "yes" as const, blocked: false },
      { k: "frozen", selected: null as "yes" | "no" | null, blocked: true },
      { k: "lite/pro switch first", selected: null as "yes" | "no" | null, blocked: false, sw: true },
    ].map((s: { k: string; selected: "yes" | "no" | null; blocked: boolean; sw?: boolean }) => (
      <div key={s.k}>
        <div className="px-3 pb-1 text-[10px] uppercase tracking-wide text-muted-foreground">{s.k}</div>
        <div className="relative h-[92px]">
          <ProSpotMobileDock
            available={14315.4}
            yesLabel="Up"
            noLabel="Down"
            yesPrice={0.4916}
            noPrice={0.5084}
            selected={s.selected}
            onTap={() => undefined}
            blocked={s.blocked}
            blockedReason="Market frozen"
            showSurfaceSwitch={!!s.sw}
            surfaceSwitchPreview={{ signedIn: true, active: "pro" }}
            className="absolute"
          />
        </div>
      </div>
    ))}
  </div>
);

/* ---- PF-1 · order status badge (partial fill detail) — production tables ---- */
const PF_ORDERS = [
  { id: "sg-pf-1", event: "Bitcoin — up or down?", option: "Up", type: "buy", orderType: "Limit", price: "$0.1800", amount: "1,200", filledAmount: "480", remainingAmount: "720", total: "$216.00", status: "Partial Filled" },
  { id: "sg-pf-2", event: "Ethereum — up or down?", option: "Up", type: "buy", orderType: "Limit", price: "$0.4500", amount: "22.222", total: "$10.00", status: "Pending" },
  { id: "sg-pf-3", event: "Solana — up or down?", option: "Down", type: "sell", orderType: "Limit", price: "$0.5200", amount: "300", total: "$156.00", status: "Cancelled" },
];

/** OS-D1 · desktop /spot Current Orders with a Partial Filled row (hover the badge). */
export const OrderStatusDesktop = () => {
  const t = spotFixture({ spotOrders: PF_ORDERS, frozenCancelledIds: new Set<string>(), isCancelling: false, handleCancelSpotOrder: async () => undefined } as unknown as Partial<SpotTerminal>);
  return (
    <div style={{ width: 1000 }}>
      <SpotOrdersTable t={t} variant="desktop" />
    </div>
  );
};

/** OS-M1 · mobile order cards with a Partial Filled row (tap the badge). */
export const OrderStatusMobile = () => {
  const t = spotFixture({ spotOrders: PF_ORDERS, frozenCancelledIds: new Set<string>(), isCancelling: false, handleCancelSpotOrder: async () => undefined } as unknown as Partial<SpotTerminal>);
  return (
    <Phone>
      <SpotOrdersTable t={t} variant="mobile" />
    </Phone>
  );
};


/* ---------------- 研发问题 18 条 (2026-09-24) · new cases ---------------- */

/** HD-D1 · desktop /spot Holdings — Close is the same bordered button as the contract table (研发问题 #10b). */
export const SpotHoldingsDesktop = () => {
  const t = spotFixture({
    closePosition: () => undefined,
    spotPositions: [
      { id: "sg-h1", event: "Solana — up or down?", option: "Down", optionId: "sg-down", entryPrice: "$0.4602", markPrice: "$0.4632", entryPriceNum: 0.4602, markPriceNum: 0.4632, sizeNum: 18.091, pnlNum: 0.05 },
      { id: "sg-h2", event: "Meta (META) — will close higher today?", option: "Up", optionId: "sg-up", entryPrice: "$0.4620", markPrice: "$0.4916", entryPriceNum: 0.462, markPriceNum: 0.4916, sizeNum: 2034.879, pnlNum: 60.23 },
    ],
  } as unknown as Partial<SpotTerminal>);
  return (
    <div style={{ width: 1000 }}>
      <SpotPositionsTable t={t} variant="desktop" />
    </div>
  );
};

/** OS-D2 · desktop /spot Cancel → confirmation dialog before the order is pulled (研发问题 #10c). */
export const OrderCancelConfirmDesktop = () => {
  const t = spotFixture({ spotOrders: PF_ORDERS, frozenCancelledIds: new Set<string>(), isCancelling: false, handleCancelSpotOrder: async () => undefined } as unknown as Partial<SpotTerminal>);
  return (
    <div style={{ width: 1000, minHeight: 420, position: "relative" }}>
      <SpotOrdersTable t={t} variant="desktop" previewCancelIndex={1} />
    </div>
  );
};

/** OS-M2 · mobile /spot Cancel → the same confirmation dialog (研发问题 #10c). */
export const OrderCancelConfirmMobile = () => {
  const t = spotFixture({ spotOrders: PF_ORDERS, frozenCancelledIds: new Set<string>(), isCancelling: false, handleCancelSpotOrder: async () => undefined } as unknown as Partial<SpotTerminal>);
  return (
    <Phone>
      <div style={{ minHeight: 520, position: "relative" }}>
        <SpotOrdersTable t={t} variant="mobile" previewCancelIndex={1} />
      </div>
    </Phone>
  );
};

const cryptoFixture = (over: Partial<SpotTerminal> = {}) =>
  spotFixture({
    event: {
      id: "crypto-eth-updown-15m-202609240400",
      name: "Ethereum — up or down?",
      base_price: 3350.04,
      description: "Quick 15m round on Ethereum. Up settles $1 if the price at the end of the round is above the round open ($3350.04).",
      source_name: "databento",
      source_url: "",
      rules: "Settles Up if the price at the end of the round is above the round open ($3350.04); otherwise Down. A new round starts the moment this one settles.",
    },
    ticker: "ETH",
    basePrice: 3350.04,
    market: { key: "crypto", tz: "UTC", label: "UTC", short: "CRYPTO", currency: "$" },
    marketKey: "crypto",
    countdown: { text: "00:13:07", urgency: "yellow" as const, diffMs: 787000 },
    freezeEtOnly: "04:15",
    settleEtOnly: "04:16",
    freezeLabel: "04:15",
    ...over,
  } as unknown as Partial<SpotTerminal>);

/** EI-D1 · /spot Event Info for a crypto quick round — ONE grid, nothing listed twice (研发问题 #18 / #14). */
export const SpotEventInfoCrypto = () => (
  <div style={{ width: 720 }}>
    <SpotEventInfoPanel t={cryptoFixture()} />
  </div>
);

/** CH-S1 · spot up/down chart — `Share | BTC` view switch (Liya 09-24 B 方案). */
export const SpotChartViews = () => (
  <div className="space-y-4">
    <div style={{ width: 760, height: 360 }}>
      <CandlestickChart remainingDays={1} basePrice={0.5367} side="buy" underlying={{ ticker: "BTC", basePrice: 72066.13, lastPrice: 72410.5, shareLabel: "Up" }} />
    </div>
    <div style={{ width: 760, height: 360 }}>
      <CandlestickChart remainingDays={1} basePrice={0.5367} side="buy" previewView="underlying" underlying={{ ticker: "BTC", basePrice: 72066.13, lastPrice: 72410.5, shareLabel: "Up" }} />
    </div>
  </div>
);

/** CH-S2 · spot up/down chart on the phone (375) — `Up | BTC price`, BTC view selected. */
export const SpotChartViewsMobile = () => (
  <div className="space-y-3">
    <div style={{ width: 375, height: 360 }}>
      <CandlestickChart remainingDays={1} basePrice={0.5367} side="buy" underlying={{ ticker: "BTC", basePrice: 72066.13, lastPrice: 72410.5, shareLabel: "Up" }} />
    </div>
    <div style={{ width: 375, height: 360 }}>
      <CandlestickChart remainingDays={1} basePrice={0.5367} side="buy" previewView="underlying" underlying={{ ticker: "BTC", basePrice: 72066.13, lastPrice: 72410.5, shareLabel: "Up" }} />
    </div>
  </div>
);
