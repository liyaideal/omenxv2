// ============================================================
// /trade（合约与多市场）状态字典 previews — TR-1 … TR-24（mock11 终版编号）。
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
import { LiteBoardGroupHeader } from "@/components/lite/multi/LiteBoardGroupHeader";
import { LiteLineScrubber } from "@/components/lite/multi/LiteLineScrubber";
import { formatSignedLine } from "@/components/lite/sports/sportsData";
import { LiteOutcomeCard } from "@/components/lite/LiteOutcomeCard";
import { HowItSettled } from "@/components/lite/trade/HowItSettled";
import { InReviewCard, IN_REVIEW_BADGE } from "@/components/lite/trade/InReviewCard";

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

/* --------------------------- TR-5..TR-9 面板 --------------------------- */

const Panel = ({
  side0 = "yes",
  amount0 = "",
  boost0 = 1,
  yesPrice = 0.5,
  blocked = false,
  blockedReason,
  blockNotice,
  boostTrayOpen,
  heldSideLabel,
  heldCurrentValue,
  heldQty,
  remainderAutoCloseNone,
}: {
  side0?: "yes" | "no";
  amount0?: string;
  boost0?: number;
  yesPrice?: number;
  blocked?: boolean;
  blockedReason?: string;
  blockNotice?: string | null;
  boostTrayOpen?: boolean;
  heldSideLabel?: string | null;
  heldCurrentValue?: number | null;
  heldQty?: number | null;
  remainderAutoCloseNone?: boolean;
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
        heldSideLabel={heldSideLabel}
        heldCurrentValue={heldCurrentValue}
        heldQty={heldQty}
        fixture={{
          ...(boostTrayOpen ? { boostTrayOpen: true } : null),
          ...(remainderAutoCloseNone
            ? { remainderAutoClose: { kind: "none" as const } }
            : null),
        }}
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

/** TR-9 · netting 句 + partial-net 行（数值与 AC-T5 同一组）。 */
export const Tr9Preview = () => (
  <Panel
    amount0="50"
    boost0={5}
    heldSideLabel="No"
    heldCurrentValue={20}
    heldQty={40}
    remainderAutoCloseNone
  />
);

/* ---------------------- TR-10 / TR-11 / TR-12 持仓 ---------------------- */

export const Tr10Preview = () => {
  const isMobile = useIsMobile();
  return (
    <Frame>
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
    </Frame>
  );
};

export const Tr11Preview = () => {
  const isMobile = useIsMobile();
  return (
    <Frame>
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
    </Frame>
  );
};

/** TR-12 · voucher 来源仓（fixture-only `voucherTag`，生产从不传）。 */
export const Tr12Preview = () => {
  const isMobile = useIsMobile();
  return (
    <Frame>
      <LitePositionCard
        sideLabel="Yes"
        isYes
        boost={1}
        putIn={10}
        nowWorth={13.6}
        profit={3.6}
        autoCloseText="None"
        autoCloseSub="Loss capped at your stake"
        voucherTag
        compact={!!isMobile}
        onCashOut={() => undefined}
      />
    </Frame>
  );
};

/* ------------------------------- TR-13 -------------------------------- */

export const Tr13Preview = () => (
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

/* ------------------------------- TR-14 -------------------------------- */

const ACTIVITY: MarketActivityRow[] = [
  { id: "a1", isYes: true, label: "Jeonbuk", amount: 121, boost: 1, createdAt: minsAgo(5) },
  { id: "a2", isYes: false, label: "Ulsan", amount: 64, boost: 5, createdAt: minsAgo(12) },
  { id: "a3", isYes: true, label: "Draw", amount: 240, boost: 10, createdAt: minsAgo(48) },
  { id: "a4", isYes: false, label: "Jeonbuk", amount: 18, boost: 1, createdAt: minsAgo(126) },
];

export const Tr14Preview = () => (
  <Frame>
    <LiteMarketActivity rows={ACTIVITY} yesLabel="Yes" noLabel="No" showOptionLabel />
    <LiteMarketActivity rows={[]} yesLabel="Yes" noLabel="No" />
  </Frame>
);

/* --------------------- TR-15 / TR-16 / TR-17 终态 ---------------------- */

/** TR-15 · settled 终态 · 未持有分支。 */
export const Tr15Preview = () => (
  <Frame>
    <LiteOutcomeCard
      settledAt={minsAgo(180)}
      winnerLabel="Yes"
      winnerIsYes
      loserLabel="No"
      sourceName="Nasdaq"
      sourceUrl="https://www.nasdaq.com"
      summary="NVDA closed the quarter at a $4.21T market cap, above the $4T threshold."
      onBrowse={() => undefined}
    />
  </Frame>
);

/** TR-16 · settled 终态 · 持有派彩分支。 */
export const Tr16Preview = () => (
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
  </Frame>
);

/** TR-17 · HOW IT SETTLED 证明卡（无 source → 团队署名句）。 */
export const Tr17Preview = () => (
  <Frame>
    <HowItSettled summary="Resolved YES. Winning shares pay $1 each, credited automatically at settlement." />
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

/* ------------------------------- TR-18 -------------------------------- */

/** TR-18 · In review（end_date 已过、is_resolved=false、lifecycle REVIEW）。 */
export const Tr18Preview = () => (
  <div className="space-y-4 bg-background p-4">
    <InReviewCard sourceName="Nasdaq official close" holding />
    <Panel amount0="" blocked blockedReason={IN_REVIEW_BADGE} />
  </div>
);

/* ------------------------------- TR-19 -------------------------------- */

export const Tr19Preview = () => (
  <div className="flex min-h-[240px] items-center justify-center bg-background">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

/* --------------------- TR-20 / TR-21 / TR-22 sports -------------------- */

const REG_TIP =
  "Settles on the regulation-time result. Extra time and penalties don't count.";
const VOL = "Vol $550.1K";

const WINNER_ROWS: BoardOption[] = [
  { id: "w-uls", label: "Ulsan", yesPrice: 0.19 },
  { id: "w-draw", label: "Draw", yesPrice: 0.23 },
  { id: "w-jbh", label: "Jeonbuk", yesPrice: 0.58 },
];

const HCP_LINES = [-2.5, -1.5, 1.5, 2.5];
const HCP_PRICE: Record<number, number> = { [-2.5]: 0.06, [-1.5]: 0.13, 1.5: 0.87, 2.5: 0.94 };
const TOT_LINES = [0.5, 1.5, 2.5, 3.5, 4.5];
const TOT_PRICE: Record<number, number> = { 0.5: 0.93, 1.5: 0.8, 2.5: 0.58, 3.5: 0.34, 4.5: 0.1 };

/** TR-20 · WINNER 组（sports 多市场板）。 */
export const Tr20Preview = () => {
  const isMobile = useIsMobile();
  const [sel, setSel] = useState<string | null>(null);
  const [side, setSide] = useState<"yes" | "no">("yes");
  return (
    <div className="space-y-2 bg-background p-4">
      <LiteBoardGroupHeader title="Winner" note="Regulation time" tip={REG_TIP} />
      <LiteMarketBoard
        options={WINNER_ROWS}
        volumeText={VOL}
        selectedId={sel}
        selectedSide={side}
        onSelect={(id, s) => {
          setSel(id);
          setSide(s);
        }}
        onDeselect={() => setSel(null)}
        compact={!!isMobile}
        hideHeader
      />
    </div>
  );
};

/** TR-21 · 两把尺（HANDICAP + TOTAL GOALS）。 */
export const Tr21Preview = () => {
  const isMobile = useIsMobile();
  const [hcp, setHcp] = useState(1.5);
  const [tot, setTot] = useState(2.5);
  const [sel, setSel] = useState<string | null>(`hcp-1.5`);
  const [side, setSide] = useState<"yes" | "no">("yes");
  const pick = (id: string, s: "yes" | "no") => {
    setSel(id);
    setSide(s);
  };
  return (
    <div className="space-y-2 bg-background p-4">
      <LiteBoardGroupHeader
        title="Handicap"
        note="Regulation time"
        tip={`A team covers when its regulation-time score plus the line beats the opponent. ${REG_TIP}`}
      />
      <LiteMarketBoard
        options={[
          {
            id: `hcp-${hcp}`,
            label: `ULS ${formatSignedLine(hcp)} covers`,
            yesPrice: HCP_PRICE[hcp],
            yesChipLabel: `ULS ${formatSignedLine(hcp)}`,
            noChipLabel: `JBH ${formatSignedLine(-hcp)}`,
          },
        ]}
        volumeText={VOL}
        selectedId={sel}
        selectedSide={side}
        onSelect={pick}
        onDeselect={() => setSel(null)}
        compact={!!isMobile}
        hideHeader
        renderFooter={() => (
          <LiteLineScrubber
            values={HCP_LINES}
            value={hcp}
            onChange={setHcp}
            compact={!!isMobile}
          />
        )}
      />
      <LiteBoardGroupHeader
        title="Total goals"
        note="Regulation time"
        tip={`Counts both teams' goals in regulation time. ${REG_TIP}`}
      />
      <LiteMarketBoard
        options={[
          {
            id: `tot-${tot}`,
            label: `Over ${tot} goals`,
            yesPrice: TOT_PRICE[tot],
            yesChipLabel: `Over ${tot}`,
            noChipLabel: `Under ${tot}`,
          },
        ]}
        volumeText={VOL}
        selectedId={sel}
        selectedSide={side}
        onSelect={pick}
        onDeselect={() => setSel(null)}
        compact={!!isMobile}
        hideHeader
        renderFooter={() => (
          <LiteLineScrubber
            values={TOT_LINES}
            value={tot}
            onChange={setTot}
            format={(n) => String(n)}
            compact={!!isMobile}
          />
        )}
      />
    </div>
  );
};

/** TR-22 · 进行中比赛（kickoff 已过 → freeze，面板 blocked=Closed）。 */
export const Tr22Preview = () => {
  const isMobile = useIsMobile();
  const [sel, setSel] = useState<string | null>("w-jbh");
  const [side, setSide] = useState<"yes" | "no">("yes");
  return (
    <div className="space-y-2 bg-background p-4">
      <TradeHeading
        eyebrow="Sports · Winner · Handicap · Total goals"
        title="Ulsan vs Jeonbuk — who wins?"
        rightSlot={Star_}
      />
      <LiteBoardGroupHeader title="Winner" note="Regulation time" tip={REG_TIP} />
      <LiteMarketBoard
        options={WINNER_ROWS}
        volumeText={VOL}
        selectedId={sel}
        selectedSide={side}
        onSelect={(id, s) => {
          setSel(id);
          setSide(s);
        }}
        onDeselect={() => setSel(null)}
        compact={!!isMobile}
        hideHeader
      />
      <Panel amount0="" blocked blockedReason="Closed" />
    </div>
  );
};

/* ------------------------------- TR-23 -------------------------------- */

const BOX_OFFICE: BoardOption[] = [
  { id: "bo-1", label: "Avengers: Doomsday", yesPrice: 0.46 },
  { id: "bo-2", label: "Avatar: Fire and Ash", yesPrice: 0.31 },
  { id: "bo-3", label: "Super Mario Galaxy", yesPrice: 0.14 },
  { id: "bo-4", label: "Any other film", yesPrice: 0.09 },
];

export const Tr23Preview = () => {
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

/* ------------------------------- TR-24 -------------------------------- */

/** TR-24 · Boost selector 全档态 — 五档各一帧 + Custom 展开帧。 */
export const Tr24Preview = () => (
  <div className="grid gap-4 bg-background p-4 md:grid-cols-2">
    {[1, 2, 5, 10, 20].map((t) => (
      <BoostFrame key={t} boost={t} label={`${t}× selected`} />
    ))}
    <BoostFrame boost={7} label="Custom tray open · 7×" trayOpen />
  </div>
);

const BoostFrame = ({
  boost,
  label,
  trayOpen,
}: {
  boost: number;
  label: string;
  trayOpen?: boolean;
}) => (
  <div className="space-y-2">
    <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
      {label}
    </div>
    <Panel amount0="25" boost0={boost} boostTrayOpen={trayOpen} />
  </div>
);
