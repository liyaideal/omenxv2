// Pro /spot terminal (SP-1 · B2/B3) — every frame mounts the PRODUCTION
// components: src/components/pro/ProSpotPanel.tsx, ProTerminalLayout,
// ProBottomTabs. Fixture props only; no auth gate, no data fetching, so each
// key renders standalone for a signed-out visitor.
import { useState } from "react";
import {
  ProSpotPanel,
  ProSpotAccountPanel,
  ProSpotOrderPreview,
  type ProSpotSide,
} from "@/components/pro/ProSpotPanel";
import type { ProOrderType } from "@/components/pro/OrderTypeDropdown";
import { ProTerminalLayout } from "@/components/pro/ProTerminalLayout";
import { ProBottomTabs } from "@/components/pro/ProBottomTabs";

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
};

/** One live panel driven by local state — the same props the page passes. */
const PanelFixture = (f: Fixture) => {
  const [side, setSide] = useState<ProSpotSide>(f.side ?? "buy");
  const [orderType, setOrderType] = useState<ProOrderType>(f.orderType ?? "Market");
  const [amount, setAmount] = useState(f.amount ?? "25.00");
  const [limitPrice, setLimitPrice] = useState("0.4400");
  const [slider, setSlider] = useState<number[]>([25]);
  const [slippage, setSlippage] = useState(50);
  const [isYes, setIsYes] = useState(true);

  const price = orderType === "Limit" ? parseFloat(limitPrice) || 0.44 : isYes ? 0.4649 : 0.5351;
  const amt = parseFloat(amount) || 0;
  const qty = side === "sell" ? amt : price > 0 ? amt / price : 0;
  const cost = price * qty;
  const fee = cost * 0.0015;
  const grossWin = Math.max(0, qty - cost);
  const maxWin = Math.max(0, grossWin * 0.95 - fee);
  const sellCommission = side === "sell" ? Math.max(0, (price - 0.38) * qty) * 0.05 : 0;

  const heldYesQty = f.heldYesQty ?? 0;
  const heldNoQty = f.heldNoQty ?? 0;
  const heldQty = isYes ? heldYesQty : heldNoQty;

  return (
    <Rail>
      <ProSpotPanel
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
        onSubmit={() => undefined}
      />
    </Rail>
  );
};

/** SP-B1 · Buy · Market — the default panel. */
export const ProSpotPanelBuyMarket = () => <PanelFixture />;

/** SP-B2 · Buy · Limit — limit price input + tick rules. */
export const ProSpotPanelBuyLimit = () => <PanelFixture orderType="Limit" />;

/** SP-B3 · Sell with shares on one side — the unheld tile is greyed to 0 sh. */
export const ProSpotPanelSellHeld = () => (
  <PanelFixture side="sell" amount="12" heldYesQty={40} heldNoQty={0} />
);

/** SP-B4 · Sell with nothing held — both tiles disabled + helper line. */
export const ProSpotPanelSellNone = () => <PanelFixture side="sell" amount="0" />;

/** SP-B5 · Insufficient balance — CTA disabled. */
export const ProSpotPanelInsufficient = () => (
  <PanelFixture available={0} ctaLabel="Insufficient balance" ctaDisabled />
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
