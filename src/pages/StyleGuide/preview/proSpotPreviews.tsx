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
import { ProSpotMobileDock } from "@/components/pro/ProSpotMobileDock";
import {
  SpotMobileMarkLine,
  SpotMobileStatsStrip,
  SpotMiniOrderBook,
  SpotOrdersTable,
  SpotPositionsTable,
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

  const price = orderType === "Limit" ? parseFloat(limitPrice) || 0.44 : isYes ? 0.4649 : 0.5351;
  const amt = parseFloat(amount) || 0;
  const qty = side === "sell" ? amt : price > 0 ? amt / price : 0;
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
        spotBalance={f.available ?? 500}
        limitPrice={limitPrice}
        onLimitPriceChange={setLimitPrice}
        amount={amount}
        onAmountChange={setAmount}
        sliderValue={slider}
        onSliderChange={setSlider}
        sliderBase={side === "sell" ? heldQty : f.available ?? 500}
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

/** SP-B3 · Sell with shares on one side — the unheld tile is greyed to 0 sh.
 *  Share sizes are FRACTIONAL: the held line and Shares row keep 3 dp. */
export const ProSpotPanelSellHeld = () => (
  <PanelFixture side="sell" amount="40.512" heldYesQty={40.512} heldNoQty={0} />
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
  <PanelFixture orderType="Limit" willBePending ctaLabel="Place limit · Buy Up" />
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
            { key: "Orders", label: "Orders", count: 0 },
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
        { key: "Orders", label: "Orders", count: 0 },
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
      <div className="w-full min-w-0 overflow-hidden" style={{ height: 280 }}>
        <CandlestickChart basePrice={0.4916} side="buy" />
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

/** SP-2 · mobile Charts view, market frozen — both dock buttons disabled. */
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

/** SP-2 · the sticky dock alone: default / side selected / frozen. */
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
