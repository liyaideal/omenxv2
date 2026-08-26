// ============================================================
// Auto-close 轮归档 previews — PRODUCTION components only, driven by
// fixture rows / fixture props. Field is permanent; value grammar has
// exactly two states (≈X¢ / None). See CPO mock7 v2.
// ============================================================
import { useState } from "react";
import type { LiteLiveRow } from "@/hooks/useLitePortfolio";
import { LiveCard, LiveRow, LiveRowHeader } from "@/components/portfolio/lite/LiveCards";
import { LitePositionCard } from "@/components/lite/contract/LitePositionCard";
import { LiteContractOrderPanel } from "@/components/lite/contract/LiteContractOrderPanel";
import type { AutoCloseResult } from "@/lib/autoClosePrice";

/** Fixture dates stay relative so settleLabel() output never goes stale. */
const inDays = (d: number, hour = 16, minute = 0) => {
  const t = new Date();
  t.setDate(t.getDate() + d);
  t.setHours(hour, minute, 0, 0);
  return t.toISOString();
};

const row = (o: Partial<LiteLiveRow> & { id: string }): LiteLiveRow => ({
  eventId: "demo-event",
  eventName: "Demo market",
  categoryLabel: "General",
  settlesAt: inDays(3),
  sideWord: "Yes",
  priceNow: 0.5,
  cost: 0,
  nowWorth: 0,
  profit: 0,
  leverageNum: 2,
  isVoucher: false,
  airdropTag: "none",
  segment: "boost",
  sizeNum: 0,
  ifWins: 0,
  autoClose: { kind: "none" },
  hot: false,
  tradePath: "/events",
  ...o,
});

/* --------------------------- §1 fixture rows --------------------------- */

const rowLevel = row({
  id: "ac-level",
  eventName: "Fed decision in September?",
  categoryLabel: "General",
  settlesAt: inDays(22, 2, 0),
  sideWord: "25 bps hike",
  priceNow: 0.05,
  cost: 43.25,
  nowWorth: 43.25,
  profit: 0,
  leverageNum: 2,
  ifWins: 1670,
  autoClose: { kind: "level", price: 0.02 },
});

const rowHot = row({
  id: "ac-hot",
  eventName: "Will NVIDIA close above $4T market cap this quarter?",
  categoryLabel: "Finance",
  settlesAt: inDays(31, 13, 35),
  sideWord: "Yes",
  priceNow: 0.93,
  cost: 48.41,
  nowWorth: 50.38,
  profit: 1.97,
  leverageNum: 5,
  ifWins: 259,
  autoClose: { kind: "level", price: 0.89 },
  hot: true,
});

const rowNone = row({
  id: "ac-none",
  eventName: "Will the Lakers reach the 2026 NBA Finals?",
  categoryLabel: "Sports",
  settlesAt: inDays(26, 11, 43),
  sideWord: "No",
  priceNow: 0.18,
  cost: 41.99,
  nowWorth: 41.99,
  profit: 0,
  leverageNum: 2,
  ifWins: 464,
  autoClose: { kind: "none" },
});

const rowNone1x = row({
  id: "ac-none-1x",
  eventName: "Which film tops the 2026 worldwide box office?",
  categoryLabel: "Entertainment",
  settlesAt: inDays(117, 18, 0),
  sideWord: "Avengers: Doomsday",
  priceNow: 0.09,
  cost: 17.35,
  nowWorth: 17.35,
  profit: 0,
  leverageNum: 1,
  ifWins: 741,
  autoClose: { kind: "none" },
});

const rowStandard = row({
  id: "ac-standard",
  eventName: "Bitcoin above $70,000",
  categoryLabel: "Crypto",
  settlesAt: inDays(2),
  sideWord: "Up",
  priceNow: 0.38,
  cost: 120,
  nowWorth: 158.4,
  profit: 38.4,
  leverageNum: 1,
  segment: "standard",
  ifWins: 316,
  autoClose: { kind: "none" },
});

/* ------------------------------ AC-P1..P3 ------------------------------ */

export const AutoCloseDesktopRowsPreview = () => (
  <div className="bg-background py-4">
    <LiveRowHeader />
    <LiveRow row={rowLevel} />
    <LiveRow row={rowHot} />
    <LiveRow row={rowNone} />
    <LiveRow row={rowNone1x} />
  </div>
);

export const AutoCloseStandardRowPreview = () => (
  <div className="bg-background py-4">
    <LiveRowHeader />
    <LiveRow row={rowStandard} />
  </div>
);

export const AutoCloseMobileCardsPreview = () => (
  <div className="flex flex-col gap-2 bg-background p-4">
    <LiveCard row={rowLevel} />
    <LiveCard row={rowHot} />
    <LiveCard row={rowNone} />
  </div>
);

/* ------------------------------ AC-T1..T3 ------------------------------ */

const positionCard = (extra: {
  nowWorth: number;
  profit: number;
  autoCloseText: string;
  autoCloseSub?: string;
  autoCloseHot?: boolean;
}) => (
  <LitePositionCard
    sideLabel="Yes"
    isYes
    boost={5}
    putIn={48.41}
    onCashOut={() => undefined}
    {...extra}
  />
);

export const AutoClosePositionNonePreview = () => (
  <div className="bg-background p-4">
    {positionCard({
      nowWorth: 48.41,
      profit: 0,
      autoCloseText: "None",
      autoCloseSub: "Loss capped at your stake",
    })}
  </div>
);

export const AutoClosePositionHotPreview = () => (
  <div className="bg-background p-4">
    {positionCard({
      nowWorth: 50.38,
      profit: 1.97,
      autoCloseText: "≈ 89¢",
      autoCloseSub: "Close to current price",
      autoCloseHot: true,
    })}
  </div>
);

export const AutoClosePositionLevelPreview = () => (
  <div className="bg-background p-4">
    {positionCard({
      nowWorth: 48.41,
      profit: 0,
      autoCloseText: "≈ 62¢",
    })}
  </div>
);

/* ------------------------------ AC-T4 / T5 ----------------------------- */

const OrderPanelCase = ({
  amount0,
  boost0 = 5,
  yesPrice = 0.5,
  fixture,
  heldSideLabel,
  heldCurrentValue,
  heldQty,
}: {
  amount0: string;
  boost0?: number;
  yesPrice?: number;
  fixture?: { autoClose?: AutoCloseResult; remainderAutoClose?: AutoCloseResult };
  heldSideLabel?: string | null;
  heldCurrentValue?: number | null;
  heldQty?: number | null;
}) => {
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState(amount0);
  const [boost, setBoost] = useState(boost0);
  return (
    <LiteContractOrderPanel
      eventName="Playground market"
      yesLabel="Yes"
      noLabel="No"
      yesPrice={yesPrice}
      noPrice={Number((1 - yesPrice).toFixed(2))}
      yesOptionId="pg-yes"
      noOptionId="pg-no"
      yesOptionLabel="Yes"
      noOptionLabel="No"
      boostEnabled
      boostMax={20}
      boostTiers={[1, 2, 5, 10, 20]}
      countdownText="02:14:09"
      variant="desktop"
      blocked={false}
      side={side}
      onSideChange={setSide}
      amount={amount}
      onAmountChange={setAmount}
      boost={boost}
      onBoostChange={setBoost}
      heldSideLabel={heldSideLabel}
      heldCurrentValue={heldCurrentValue}
      heldQty={heldQty}
      fixture={fixture}
      onFilled={() => undefined}
      onRequestAuth={() => undefined}
    />
  );
};

export const AutoCloseOrderPanelStatesPreview = () => (
  <div className="grid grid-cols-2 gap-4 bg-background p-4">
    <OrderPanelCase amount0="" />
    <OrderPanelCase amount0="50" fixture={{ autoClose: { kind: "level", price: 0.62 } }} />
    <OrderPanelCase amount0="50" fixture={{ autoClose: { kind: "none" } }} />
    <OrderPanelCase
      amount0="50"
      yesPrice={0.94}
      fixture={{ autoClose: { kind: "level", price: 0.89 } }}
    />
  </div>
);

export const AutoCloseOrderPanelPartialNetPreview = () => (
  <div className="bg-background p-4">
    <OrderPanelCase
      amount0="50"
      heldSideLabel="No"
      heldCurrentValue={20}
      heldQty={40}
      fixture={{ remainderAutoClose: { kind: "none" } }}
    />
  </div>
);
