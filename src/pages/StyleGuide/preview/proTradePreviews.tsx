// ============================================================
// Pro /trade (contract) mobile order panel — style-guide fixtures.
//
// Mounts the PRODUCTION `TradeForm` (the /trade/order panel) with pure-display
// fixture props (`previewPositions` / `previewBalance` / `previewSellQty` /
// `previewOrderType`). None of those props are set in product code, so the
// production panel is visually unchanged.
//
// Fixture: held 40 ct · Up · 5x · entry 0.62, mark 0.68 (CT-1 spec).
// Desktop `/trade` panel is inline JSX inside DesktopTrading.tsx and cannot be
// mounted here yet — see docs/delivery/pro-trade-sell-v1.md §已知缺口.
// ============================================================
import { useState } from "react";
import { TradeForm } from "@/components/TradeForm";
import { ProSpotMobileDock } from "@/components/pro/ProSpotMobileDock";
import type { UnifiedPosition } from "@/hooks/usePositions";
import type { ProOrderType } from "@/components/pro/OrderTypeDropdown";

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
    />
  );
};

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
      />
    </Phone>
  );
};

/** CT-M4 · Sell · flat — nothing held on either side: both sides disabled. */
export const ProTradeOrderSellFlat = () => (
  <Phone>
    <PanelFixture intent="sell" positions={[]} />
  </Phone>
);
