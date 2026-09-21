// ============================================================
// Pro /trade (contract) mobile order panel — style-guide fixtures.
//
// Mounts the PRODUCTION `TradeForm` (the /trade/order panel) with pure-display
// fixture props (`previewPositions` / `previewBalance` / `previewSellQty` /
// `previewOrderType`). None of those props are set in product code, so the
// production panel is visually unchanged.
//
// Fixture: held 40 ct · Up · 5x · entry 0.62, mark 0.68 (CT-1 spec).
// Desktop `/trade` panel: `ProContractPanel` (extracted 2026-09-21, 交易页收尾
// #9) mounted below with a small stateful fixture that only feeds numbers in.
// ============================================================
import { useState } from "react";
import { TradeForm } from "@/components/TradeForm";
import { ProSpotMobileDock } from "@/components/pro/ProSpotMobileDock";
import { AccountRiskDrawer, MobileRiskIndicator } from "@/components/MobileRiskIndicator";
import type { RiskMetrics } from "@/hooks/useRealtimeRiskMetrics";
import type { UnifiedPosition } from "@/hooks/usePositions";
import type { ProOrderType } from "@/components/pro/OrderTypeDropdown";
import { ProContractPanel } from "@/components/pro/ProContractPanel";
import { classifyOrderIntent, getIntentLabel } from "@/lib/positionIntent";
import { FUTURES_FEE_RATE, netWin } from "@/services/tradingService";

const EVENT = "Bitcoin — up or down? (Sep 15)";
const YES = "Up";
const NO = "Down";

const heldUp: UnifiedPosition = {
  id: "sg-pos-up",
  type: "long",
  event: EVENT,
  option: YES,
  displayOption: YES,
  optionId: "sg-up",
  entryPrice: "0.6200",
  markPrice: "0.6800",
  size: "40",
  sizeDisplay: "40",
  margin: "4.96",
  pnl: "2.40",
  pnlNum: 2.4,
  pnlPercent: "48.39",
  leverage: "5x",
  tp: "",
  sl: "",
  tpMode: "%",
  slMode: "%",
  fundingAccrued: 0,
  lastFundingAt: null,
  entryPriceNum: 0.62,
  markPriceNum: 0.68,
  sizeNum: 40,
  marginNum: 4.96,
  leverageNum: 5,
  createdAt: new Date(0).toISOString(),
  productLine: "futures",
  _source: "supabase",
};

const Phone = ({ children }: { children: React.ReactNode }) => (
  <div style={{ width: 375 }}>
    {children}
  </div>
);

type Fixture = {
  intent?: "buy" | "sell";
  positions?: UnifiedPosition[];
  sellQty?: number;
  orderType?: ProOrderType;
  leverageOpen?: boolean;
  amountMode?: "usdc" | "units";
  units?: string;
  /** 交易页收尾: category leverage cap (crypto fixture = 10×), Buy · Limit price, risk tier. */
  leverageMax?: number;
  limitPrice?: string;
  riskRatio?: number;
};

const PanelFixture = (f: Fixture) => {
  const [intent, setIntent] = useState<"buy" | "sell">(f.intent ?? "buy");
  const [isYes, setIsYes] = useState(true);
  return (
    <TradeForm
      selectedPrice="0.6800"
      eventName={EVENT}
      optionLabel={isYes ? YES : NO}
      side="buy"
      onSideChange={() => undefined}
      intent={intent}
      onIntentChange={setIntent}
      binaryMode={{
        yesLabel: YES,
        noLabel: NO,
        yesPrice: 0.68,
        noPrice: 0.32,
        isYesSelected: isYes,
        onSelectYes: () => setIsYes(true),
        onSelectNo: () => setIsYes(false),
      }}
      sideLabels={{ yes: YES, no: NO }}
      previewPositions={f.positions ?? []}
      previewBalance={500}
      previewSellQty={f.sellQty}
      previewOrderType={f.orderType}
      previewLeverageOpen={f.leverageOpen}
      previewAmountMode={f.amountMode}
      previewUnits={f.units}
      previewLeverageMax={f.leverageMax ?? 10}
      previewLimitPrice={f.limitPrice}
      previewRiskRatio={f.riskRatio ?? 7.13}
    />
  );
};

/** CT-M8 · Buy · Limit below mark — Price box + "will rest as Pending" line. */
export const ProTradeOrderBuyLimit = () => (
  <Phone>
    <PanelFixture orderType="Limit" limitPrice="0.6000" />
  </Phone>
);

/** CT-M5b · Leverage drawer · category cap 20× (ladder 1 / 2 / 5 / 20). */
export const ProTradeOrderLeverage20 = () => (
  <Phone>
    <PanelFixture leverageOpen leverageMax={20} />
  </Phone>
);

/** CT-M5c · Leverage drawer · Boost not available for this category (locked at 1×). */
export const ProTradeOrderLeverageLocked = () => (
  <Phone>
    <PanelFixture leverageOpen leverageMax={1} />
  </Phone>
);

/** RM-M3 · Buy tab close-only (Risk ≥ 95%): CTA disabled `Close-only · Risk 96%`. */
export const ProTradeOrderCloseOnly = () => (
  <Phone>
    <PanelFixture riskRatio={96} />
  </Phone>
);

/** CT-M1 · Buy tab — today's panel with the Buy · Sell row + type dropdown on top. */
export const ProTradeOrderBuy = () => (
  <Phone>
    <PanelFixture />
  </Phone>
);

/** CT-M2 · Sell · Market — held 40 ct Up 5x, closing all 40. */
export const ProTradeOrderSell = () => (
  <Phone>
    <PanelFixture intent="sell" positions={[heldUp]} sellQty={40} />
  </Phone>
);

/** CT-M3 · Sell · Limit — reduce-only limit close, partial (20 of 40). */
export const ProTradeOrderSellLimit = () => (
  <Phone>
    <PanelFixture intent="sell" positions={[heldUp]} sellQty={20} orderType="Limit" />
  </Phone>
);

/** CT-M6 · Buy · Contracts mode — the Amount suffix is the unit picker, input holds contracts. */
export const ProTradeOrderBuyContracts = () => (
  <Phone>
    <PanelFixture amountMode="units" units="50" />
  </Phone>
);

/** CT-M5 · Buy · Leverage drawer open (viewport-fixed overlay → own frame). */
export const ProTradeOrderLeverage = () => (
  <Phone>
    <PanelFixture leverageOpen />
  </Phone>
);

/** CT-M7 · alias binary (team names / lines) — no binaryMode; the Yes/No buttons read the side labels like desktop. */
export const ProTradeOrderAlias = () => {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [intent, setIntent] = useState<"buy" | "sell">("buy");
  return (
    <Phone>
      <TradeForm
        selectedPrice="0.2196"
        eventName="Astralis vs Heroic"
        optionLabel="AST −3.5"
        side={side}
        onSideChange={setSide}
        intent={intent}
        onIntentChange={setIntent}
        sideLabels={{ yes: "AST −3.5", no: "HER +3.5" }}
        previewPositions={[]}
        previewBalance={500}
        previewLeverageMax={3}
        previewRiskRatio={7.13}
      />
    </Phone>
  );
};

/** DK-M1 · /trade (mobile charts) sticky dock: default / side selected / closed (one inert bar). */
export const ProTradeMobileDockStates = () => (
  <div className="space-y-6" style={{ width: 375 }}>
    {[
      { k: "default (Yes selected)", selected: "yes" as const, reason: "" },
      { k: "No selected", selected: "no" as const, reason: "" },
      { k: "closed (past freeze / end)", selected: "yes" as const, reason: "Closed" },
      { k: "in review", selected: "yes" as const, reason: "In review" },
      { k: "suspended (cancel only)", selected: "yes" as const, reason: "Suspended · cancel only" },
      { k: "settled", selected: "yes" as const, reason: "Settled" },
    ].map((s) => (
      <div key={s.k}>
        <div className="px-3 pb-1 text-[10px] uppercase tracking-wide text-muted-foreground">{s.k}</div>
        <div className="relative h-[92px]">
          <ProSpotMobileDock
            available={0}
            yesLabel="Astralis"
            noLabel="Heroic"
            selected={s.selected}
            onTap={() => undefined}
            blocked={!!s.reason}
            blockedReason={s.reason}
            surfaceSwitchPreview={{ signedIn: true, active: "pro" }}
            className="absolute"
          />
        </div>
      </div>
    ))}
  </div>
);

/** DK-M2 · /trade/order · closed — Buy CTA disabled, prints the reason. */
export const ProTradeOrderClosed = () => {
  const [intent, setIntent] = useState<"buy" | "sell">("buy");
  return (
    <Phone>
      <TradeForm
        selectedPrice="0.1215"
        eventName="Astralis vs Heroic"
        optionLabel="AST"
        side="buy"
        onSideChange={() => undefined}
        intent={intent}
        onIntentChange={setIntent}
        sideLabels={{ yes: "Astralis", no: "Heroic" }}
        blockedReason="Closed"
        previewPositions={[]}
        previewBalance={0}
        previewLeverageMax={3}
        previewRiskRatio={0}
      />
    </Phone>
  );
};

/* ---- RM-1 · risk metrics fixtures (MM / Equity) ---- */
const riskFixture = (ratio: number): RiskMetrics => {
  const equity = 2003.46;
  const mmTotal = (ratio / 100) * equity;
  const imTotal = mmTotal * 2;
  const riskLevel = ratio >= 100 ? "LIQUIDATION" : ratio >= 95 ? "RESTRICTION" : ratio >= 80 ? "WARNING" : "SAFE";
  return {
    totalAssets: 1586.03, totalExposure: imTotal * 8, equity, imTotal, mmTotal,
    imRate: (imTotal / equity) * 100, mmRate: ratio, riskRatio: ratio, riskLevel,
    availableMargin: Math.max(equity - imTotal, 0), distanceToLiquidation: Math.max(equity - mmTotal, 0),
    unrealizedPnL: 417.43, hasPositions: true,
  };
};

/** RM-M1 · mobile header chip `Risk x%` — four tiers. */
export const RiskChipStates = () => (
  <div className="flex items-center gap-3 p-4">
    {[7.13, 84, 96, 104].map((r) => (
      <MobileRiskIndicator key={r} previewMetrics={riskFixture(r)} />
    ))}
  </div>
);

/** RM-M0 · zero state: no Boost positions → `Risk 0%`; equity ≤ 0 with positions → `Risk 100%`. */
export const RiskChipZero = () => (
  <div className="flex items-center gap-3 p-4">
    <MobileRiskIndicator previewMetrics={{ ...riskFixture(0), hasPositions: false, imTotal: 0, mmTotal: 0, unrealizedPnL: 0 }} />
    <MobileRiskIndicator previewMetrics={{ ...riskFixture(100), equity: 0, availableMargin: 0, distanceToLiquidation: 0 }} />
  </div>
);

/** RM-M2 · mobile account drawer — mirrors the desktop card (Risk Ratio bar + IM / MM dollars). */
export const RiskDrawerMobile = () => (
  <div style={{ width: 375, height: 620 }}>
    <AccountRiskDrawer open onOpenChange={() => undefined} riskMetrics={riskFixture(7.13)} />
  </div>
);

/** CT-M4 · Sell · flat — nothing held on either side: both sides disabled. */
export const ProTradeOrderSellFlat = () => (
  <Phone>
    <PanelFixture intent="sell" positions={[]} />
  </Phone>
);


/* ============================================================
 * CT-D · desktop /trade panel — the PRODUCTION `ProContractPanel` with a
 * fixture that only owns the input state and the arithmetic the page does
 * (qty = margin × lev ÷ price, fee 0.15 %, To win net of 5 % commission).
 * ============================================================ */

type DesktopFixture = {
  intent?: "buy" | "sell";
  orderType?: ProOrderType;
  positions?: UnifiedPosition[];
  amount?: string;
  amountMode?: "usdc" | "units";
  units?: string;
  limitPrice?: string;
  leverageMax?: number;
  blockedReason?: string;
  riskRatio?: number;
  sellQty?: number;
};

const DesktopPanelFixture = (f: DesktopFixture) => {
  const yesPrice = 0.68;
  const noPrice = 0.32;
  const available = 500;
  const [intent, setIntent] = useState<"buy" | "sell">(f.intent ?? "buy");
  const [orderType, setOrderType] = useState<ProOrderType>(f.orderType ?? "Market");
  const [isYes, setIsYes] = useState(true);
  const [leverage, setLeverage] = useState(Math.min(5, f.leverageMax ?? 10));
  const [limitPrice, setLimitPrice] = useState(f.limitPrice ?? "");
  const [amountMode, setAmountMode] = useState<"usdc" | "units">(f.amountMode ?? "usdc");
  const [unitsInput, setUnitsInput] = useState(f.units ?? "");
  const [amount, setAmount] = useState(f.amount ?? "0.00");
  const [sliderValue, setSliderValue] = useState([0]);
  const [tpsl, setTpsl] = useState(false);
  const [tpValue, setTpValue] = useState("");
  const [slValue, setSlValue] = useState("");
  const [tpMode, setTpMode] = useState<"pct" | "price">("pct");
  const [slMode, setSlMode] = useState<"pct" | "price">("pct");
  const [sellOutcome, setSellOutcome] = useState<"yes" | "no">("yes");
  const [sellQtyInput, setSellQtyInput] = useState(String(f.sellQty ?? 0));
  const [sellSlider, setSellSlider] = useState([0]);
  const [sellLimitPrice, setSellLimitPrice] = useState("");

  const sidePrice = isYes ? yesPrice : noPrice;
  const lim = parseFloat(limitPrice) || 0;
  const buyLimitPending = orderType === "Limit" && lim > 0 && lim < sidePrice - 1e-9;
  const price = buyLimitPending ? lim : sidePrice;
  const leverageMax = f.leverageMax ?? 10;
  const margin = amountMode === "units" ? ((parseFloat(unitsInput) || 0) * price) / leverage : parseFloat(amount) || 0;
  const amountStr = margin > 0 ? margin.toFixed(2) : "0.00";
  const notional = margin * leverage;
  const quantity = price > 0 ? notional / price : 0;
  const fee = notional * FUTURES_FEE_RATE;
  const potentialWin = netWin((1 - price) * quantity, fee);
  const maxUnits = price > 0 ? Math.floor((available * leverage) / price) : 0;
  const positions = f.positions ?? [];
  const optionLabel = isYes ? YES : NO;
  const orderIntent = classifyOrderIntent({ positions, eventName: EVENT, optionLabel, side: "buy", quantity, clickedPrice: price, leverage });
  const riskRatio = f.riskRatio ?? 7.13;
  const closeOnly = riskRatio >= 95 && (orderIntent.kind === "open" || orderIntent.kind === "add");
  const buyBlockedReason = f.blockedReason ?? (closeOnly ? `Close-only · Risk ${Math.round(riskRatio)}%` : "");

  const heldYes = positions.find((p) => p.option === YES) ?? null;
  const heldNo = positions.find((p) => p.option === NO) ?? null;
  const heldPos = sellOutcome === "yes" ? heldYes : heldNo;
  const heldSize = heldPos ? Math.floor(heldPos.sizeNum) : 0;
  const sellDisabledSide = !heldYes && !heldNo ? "both" : !heldYes ? "yes" : !heldNo ? "no" : undefined;
  const sellMark = sellOutcome === "yes" ? yesPrice : noPrice;
  const sellClosePrice = orderType === "Limit" ? parseFloat(sellLimitPrice) || sellMark : sellMark;
  const sellQty = Math.min(parseInt(sellQtyInput) || 0, heldSize);
  const ratio = heldSize > 0 ? sellQty / heldSize : 0;
  const sellReleasedMargin = heldPos ? heldPos.marginNum * ratio : 0;
  const sellRealizedPnl = heldPos ? (sellClosePrice - heldPos.entryPriceNum) * sellQty : 0;
  const sellCommission = Math.max(0, sellRealizedPnl) * 0.05;
  const sellCashBack = sellReleasedMargin + sellRealizedPnl - sellCommission;

  return (
    <div style={{ width: 280 }}>
      <ProContractPanel
        intent={intent}
        setIntent={setIntent}
        orderType={orderType}
        setOrderType={setOrderType}
        binaryLabels={{ yes: YES, no: NO }}
        yesPrice={yesPrice}
        noPrice={noPrice}
        isYesSelected={isYes}
        sellOutcome={sellOutcome}
        sellDisabledSide={sellDisabledSide}
        heldPositions={{ yes: heldYes, no: heldNo }}
        onSelectSide={(w) => (intent === "sell" ? setSellOutcome(w) : setIsYes(w === "yes"))}
        side="buy"
        leverage={leverage}
        setLeverage={setLeverage}
        available={available}
        limitPrice={limitPrice}
        setLimitPrice={setLimitPrice}
        sidePrice={sidePrice}
        amountMode={amountMode}
        setAmountMode={setAmountMode}
        unitsInput={unitsInput}
        setUnitsInput={setUnitsInput}
        amount={amountStr}
        setAmount={setAmount}
        sliderValue={sliderValue}
        setSliderValue={setSliderValue}
        maxUnits={maxUnits}
        tpsl={tpsl}
        setTpsl={setTpsl}
        tpValue={tpValue}
        setTpValue={setTpValue}
        tpMode={tpMode}
        setTpMode={setTpMode}
        slValue={slValue}
        setSlValue={setSlValue}
        slMode={slMode}
        setSlMode={setSlMode}
        tpslCalculations={{ tpPrice: "0.0000", slPrice: "0.0000", tpPnL: "0.00", slPnL: "0.00" }}
        orderCalculations={{ quantity: quantity.toFixed(0), potentialWin: potentialWin.toFixed(0) }}
        displayCalculations={{ notionalValue: notional.toFixed(2), marginRequired: margin.toFixed(2), estimatedFee: fee.toFixed(2), total: (margin + fee).toFixed(2) }}
        orderIntent={orderIntent}
        buyBlockedReason={buyBlockedReason}
        buyCtaLabel={getIntentLabel(orderIntent, "buy", { yes: YES, no: NO })}
        buyLimitPending={buyLimitPending}
        leverageMax={leverageMax}
        leverageTiers={leverageMax >= 20 ? [1, 2, 5, 20] : leverageMax >= 10 ? [1, 2, 5, 10] : leverageMax >= 3 ? [1, 2, 3] : [1]}
        onPreview={() => undefined}
        onCloseAndContinue={() => undefined}
        isBinarySingleMarket
        heldPos={heldPos}
        heldSize={heldSize}
        sellOutcomeLabel={sellOutcome === "yes" ? YES : NO}
        sellLimitPrice={sellLimitPrice}
        setSellLimitPrice={setSellLimitPrice}
        sellMark={sellMark}
        sellLimitPending={orderType === "Limit" && Math.abs(sellClosePrice - sellMark) > 1e-9}
        sellClosePrice={sellClosePrice}
        sellQtyInput={sellQtyInput}
        setSellQtyInput={setSellQtyInput}
        sellSlider={sellSlider}
        setSellSlider={setSellSlider}
        sellQty={sellQty}
        sellReleasedMargin={sellReleasedMargin}
        sellRealizedPnl={sellRealizedPnl}
        sellCommission={sellCommission}
        sellCashBack={sellCashBack}
        sellBlockedReason={f.blockedReason ?? ""}
        sellCtaLabel={heldSize > 0 && sellQty >= heldSize ? `Close ${sellOutcome === "yes" ? YES : NO}` : `Reduce ${sellOutcome === "yes" ? YES : NO}`}
        sellSubmitDisabled={!heldPos || sellQty <= 0}
        onSellPreview={() => undefined}
      />
    </div>
  );
};

/** CT-D1 · Buy · Market — default desktop panel ($25 · 5×). */
export const ProContractPanelBuy = () => <DesktopPanelFixture amount="25.00" />;
/** CT-D2 · Buy · Contracts mode — Amount suffix is the unit picker. */
export const ProContractPanelBuyContracts = () => <DesktopPanelFixture amountMode="units" units="50" />;
/** CT-D3 · Buy · Limit below mark — Price box live, order will rest as Pending. */
export const ProContractPanelBuyLimit = () => <DesktopPanelFixture orderType="Limit" limitPrice="0.6000" amount="25.00" />;
/** CT-D4 · Sell · held 40 Up 5× — reduce-only close (20 of 40). */
export const ProContractPanelSell = () => <DesktopPanelFixture intent="sell" positions={[heldUp]} sellQty={20} />;
/** CT-D5 · Sell · flat — both sides `0 contracts`, CTA disabled. */
export const ProContractPanelSellFlat = () => <DesktopPanelFixture intent="sell" positions={[]} />;
/** CT-D6 · Leverage · Boost not available for this category (locked 1×). */
export const ProContractPanelLeverageLocked = () => <DesktopPanelFixture leverageMax={1} amount="25.00" />;
/** DK-D1 · Closed — Buy and Sell CTAs print the gate reason. */
export const ProContractPanelClosed = () => <DesktopPanelFixture blockedReason="Closed" amount="25.00" />;
/** RM-D1 · Close-only (Risk ≥ 95 %) — Buy CTA disabled, Sell tab untouched. */
export const ProContractPanelCloseOnly = () => <DesktopPanelFixture riskRatio={96} amount="25.00" />;
