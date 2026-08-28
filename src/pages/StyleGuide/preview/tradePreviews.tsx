// ============================================================
// /trade（合约与多市场）状态字典 previews — TR-1 … TR-16。
// 铁律：只挂生产组件，数据一律 fixture 确定性注入（禁运行时 fetch），
// 日期用相对偏移。组件状态注不进的地方只加纯展示 fixture prop。
// ============================================================
import { useState } from "react";
import { Loader2, Star } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileHeaderIconButton } from "@/components/MobileHeader";
import {
  TradeHeading,
  TradeRuleCard,
  TradeMoreMarkets,
} from "@/components/lite/contract/LiteTradeBlocks";
import { LiteSentimentBar } from "@/components/lite/contract/LiteSentimentBar";
import { LiteContractChart } from "@/components/lite/contract/LiteContractChart";
import { LiteContractOrderPanel } from "@/components/lite/contract/LiteContractOrderPanel";
import { LitePositionCard } from "@/components/lite/contract/LitePositionCard";
import {
  LiteMarketActivity,
  type MarketActivityRow,
} from "@/components/lite/contract/LiteMarketActivity";
import { LiteMarketBoard, type BoardOption } from "@/components/lite/multi/LiteMarketBoard";
import { LiteOutcomeCard } from "@/components/lite/LiteOutcomeCard";
import { HowItSettled } from "@/components/lite/trade/HowItSettled";

/* ------------------------------ fixtures ------------------------------ */

const TITLE = "Will NVIDIA close above $4T market cap this quarter?";
const RULE_BODY =
  "Settles on the NVDA closing market cap reported by the exchange on the last trading day of the quarter.";

const minsAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div className="space-y-4 bg-background p-4">{children}</div>
);

const Star_ = (
  <MobileHeaderIconButton aria-label="Watchlist" className="text-trading-yellow">
    <Star className="h-5 w-5 fill-trading-yellow" strokeWidth={1.5} />
  </MobileHeaderIconButton>
);

/* ------------------------------- TR-1..4 ------------------------------ */

export const Tr1Preview = () => (
  <Frame>
    <TradeHeading eyebrow="Finance" title={TITLE} rightSlot={Star_} />
  </Frame>
);

export const Tr2Preview = () => (
  <Frame>
    <LiteSentimentBar yesLabel="Yes" noLabel="No" yesPct={94} />
  </Frame>
);

export const Tr3Preview = () => (
  <Frame>
    <LiteContractChart
      underlyingLabel={null}
      basePrice={null}
      currentPrice={null}
      yesOdds={0.94}
      yesLabel="Yes"
      noLabel="No"
      side="yes"
    />
  </Frame>
);

export const Tr4Preview = () => (
  <Frame>
    <TradeRuleCard body={RULE_BODY} />
  </Frame>
);

/* ------------------------------ TR-5..TR-8 ---------------------------- */

const Panel = ({
  side0 = "yes",
  amount0 = "",
  boost0 = 1,
  yesPrice = 0.5,
  blocked = false,
  blockedReason,
  blockNotice,
  boostTrayOpen,
}: {
  side0?: "yes" | "no";
  amount0?: string;
  boost0?: number;
  yesPrice?: number;
  blocked?: boolean;
  blockedReason?: string;
  blockNotice?: string | null;
  boostTrayOpen?: boolean;
}) => {
  const isMobile = useIsMobile();
  const [side, setSide] = useState<"yes" | "no">(side0);
  const [amount, setAmount] = useState(amount0);
  const [boost, setBoost] = useState(boost0);
  return (
    <div className="bg-background p-4">
      <LiteContractOrderPanel
        eventName={TITLE}
        yesLabel="Yes"
        noLabel="No"
        yesPrice={yesPrice}
        noPrice={Number((1 - yesPrice).toFixed(2))}
        yesOptionId="tr-yes"
        noOptionId="tr-no"
        yesOptionLabel="Yes"
        noOptionLabel="No"
        blocked={blocked}
        blockedReason={blockedReason}
        blockNotice={blockNotice}
        side={side}
        onSideChange={setSide}
        amount={amount}
        onAmountChange={setAmount}
        boost={boost}
        onBoostChange={setBoost}
        boostEnabled
        boostMax={20}
        boostTiers={[1, 2, 5, 10, 20]}
        countdownText="02:14:09"
        variant={isMobile ? "mobile" : "desktop"}
        fixture={boostTrayOpen ? { boostTrayOpen: true } : undefined}
        onFilled={() => undefined}
        onRequestAuth={() => undefined}
      />
    </div>
  );
};

export const Tr5Preview = () => <Panel />;
export const Tr6Preview = () => <Panel side0="no" amount0="25" />;
export const Tr7Preview = () => <Panel amount0="25" boost0={7} boostTrayOpen />;
export const Tr8Preview = () => (
  <Panel
    amount0="25"
    blockNotice="You already hold the other side of this market. Cash out first, or hold."
  />
);

/* -------------------------------- TR-9 -------------------------------- */

export const Tr9Preview = () => {
  const isMobile = useIsMobile();
  return (
    <div className="grid gap-4 bg-background p-4 md:grid-cols-2">
      <LitePositionCard
        sideLabel="Yes · 5× Boost"
        isYes
        boost={5}
        putIn={48.41}
        nowWorth={50.38}
        profit={1.97}
        autoCloseText="≈ 89¢"
        autoCloseSub="Close to current price"
        autoCloseHot
        compact={!!isMobile}
        onCashOut={() => undefined}
      />
      <div className="space-y-3">
        <LitePositionCard
          sideLabel="Ulsan · Yes"
          isYes
          boost={1}
          putIn={25}
          nowWorth={31.4}
          profit={6.4}
          autoCloseText="None"
          autoCloseSub="Loss capped at your stake"
          compact={!!isMobile}
          onCashOut={() => undefined}
        />
        <LitePositionCard
          sideLabel="Jeonbuk · No"
          isYes={false}
          boost={1}
          putIn={40}
          nowWorth={36.2}
          profit={-3.8}
          autoCloseText="None"
          autoCloseSub="Loss capped at your stake"
          compact={!!isMobile}
          onCashOut={() => undefined}
        />
      </div>
    </div>
  );
};

/* ------------------------------- TR-10 -------------------------------- */

export const Tr10Preview = () => (
  <Frame>
    <TradeMoreMarkets
      title="More markets"
      rows={[
        { id: "m1", name: "Will the Fed cut rates in September?", yesPct: 62 },
        { id: "m2", name: "Bitcoin above $120,000 this month?", yesPct: 38 },
        { id: "m3", name: "Will Apple ship a foldable this year?", yesPct: 12 },
      ]}
      onOpen={() => undefined}
    />
    <TradeMoreMarkets title="More markets" rows={[]} onOpen={() => undefined} />
  </Frame>
);

/* ------------------------------- TR-13 -------------------------------- */

const ACTIVITY: MarketActivityRow[] = [
  { id: "a1", isYes: true, label: "Jeonbuk", amount: 121, boost: 1, createdAt: minsAgo(5) },
  { id: "a2", isYes: false, label: "Ulsan", amount: 64, boost: 5, createdAt: minsAgo(12) },
  { id: "a3", isYes: true, label: "Draw", amount: 240, boost: 10, createdAt: minsAgo(48) },
  { id: "a4", isYes: false, label: "Jeonbuk", amount: 18, boost: 1, createdAt: minsAgo(126) },
];


export const Tr13Preview = () => (
  <Frame>
    <LiteMarketActivity rows={ACTIVITY} yesLabel="Yes" noLabel="No" showOptionLabel />
  </Frame>
);

/* ------------------------------- TR-14 -------------------------------- */

export const Tr14Preview = () => (
  <Frame>
    <LiteOutcomeCard
      settledAt={minsAgo(180)}
      winnerLabel="Yes"
      winnerIsYes
      loserLabel="No"
      sourceName="Nasdaq"
      sourceUrl="https://www.nasdaq.com"
      summary="NVDA closed the quarter at a $4.21T market cap, above the $4T threshold."
      holding={{
        sideLabel: "Yes",
        isYesSide: true,
        boost: 5,
        putIn: 48.41,
        paidOut: 96.82,
        profit: 48.41,
      }}
      onBrowse={() => undefined}
    />
    <HowItSettled
      summary="NVDA closed the quarter at a $4.21T market cap, above the $4T threshold."
      criterion={{
        neededLabel: "Needed",
        neededValue: "$4,000,000,000,000",
        actualLabel: "Actual",
        actualValue: "$4,210,000,000,000",
      }}
      sourceName="Nasdaq"
      sourceUrl="https://www.nasdaq.com"
    />
  </Frame>
);

/* ------------------------------- TR-15 -------------------------------- */

export const Tr15Preview = () => (
  <div className="flex min-h-[240px] items-center justify-center bg-background">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

/* ------------------------------- TR-16 -------------------------------- */

const BOX_OFFICE: BoardOption[] = [
  { id: "bo-1", label: "Avengers: Doomsday", yesPrice: 0.46 },
  { id: "bo-2", label: "Avatar: Fire and Ash", yesPrice: 0.31 },
  { id: "bo-3", label: "Super Mario Galaxy", yesPrice: 0.14 },
  { id: "bo-4", label: "Any other film", yesPrice: 0.09 },
];

export const Tr16Preview = () => {
  const isMobile = useIsMobile();
  const [sel, setSel] = useState<string | null>("bo-1");
  const [side, setSide] = useState<"yes" | "no">("yes");
  return (
    <Frame>
      <TradeHeading
        eyebrow="Entertainment · 4 markets"
        title="Which film tops the 2026 worldwide box office?"
        rightSlot={Star_}
      />
      <LiteMarketBoard
        options={BOX_OFFICE}
        volumeText="Vol $312.8K"
        selectedId={sel}
        selectedSide={side}
        onSelect={(id, s) => {
          setSel(id);
          setSide(s);
        }}
        onRowSelect={(id, s) => {
          setSel(id);
          setSide(s);
        }}
        onDeselect={() => setSel(null)}
        compact={!!isMobile}
        showChart
      />
    </Frame>
  );
};
