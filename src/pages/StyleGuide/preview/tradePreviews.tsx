import { t } from "@/i18n";
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
import { LiteOrderDrawerHeader } from "@/components/lite/contract/LiteOrderDrawerHeader";
import { SportsClockLabel, type SportsClock } from "@/components/lite/sports/sportsClock";
import { LitePositionCard } from "@/components/lite/contract/LitePositionCard";
import { PlacedToastBody } from "@/components/lite/shared/placedToast";
import { LiteVoucherCard } from "@/components/lite/vouchers/LiteVoucherCard";
import {
  VoucherCashOutBody,
  VoucherDoneBody,
  VoucherLayer,
} from "@/components/lite/vouchers/LiteVoucherCashOut";
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
import { maxLossFor, usd } from "@/lib/liteWinLoss";

/* ------------------------------ fixtures ------------------------------ */

const TITLE = "Will NVIDIA close above $4T market cap this quarter?";
const RULE_BODY =
  "Settles on the NVDA closing market cap on the last trading day of the quarter.";

const minsAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div className="space-y-4 p-4">{children}</div>
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
  countdown = "Expected to end in 2h 14m",
  limitHint,
  lowBalance,
  yesLabel = "Yes",
  noLabel = "No",
  sportsClock,
  accountValue,
  couldLose,
  balance,
  autoCloseAt,
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
  /** 生产 formatClockCountdown(ms<=0) 钳为 00:00:00 —— 已过期事件必须传这个。 */
  countdown?: string;
  /** SW-2：强制显示 `Want to place a limit order? Pro ›` 脚注。 */
  limitHint?: boolean;
  /** TR-30：余额不够下单（Max = 0）。 */
  lowBalance?: boolean;
  /** TR-27c：多 market 选项名。 */
  yesLabel?: string;
  noLabel?: string;
  /** TR-29：体育比赛的时间位（生产 SportsClockLabel card 变体）。 */
  sportsClock?: SportsClock;
  /** TR-31…33：Boost 账户总值（现金 + 持仓现值）——传了才走封顶 / 超额规则。 */
  accountValue?: number;
  /** TR-33：其他 Boost 持仓跌到底还会亏的钱。 */
  couldLose?: number;
  /** HOW MUCH 旁显示的 Boost balance。 */
  balance?: number;
  /** 固定 auto-close 估算价（访客帧算不出真实账户的估算价）。 */
  autoCloseAt?: number;
}) => {
  const isMobile = useIsMobile();
  const [side, setSide] = useState<"yes" | "no">(side0);
  const [amount, setAmount] = useState(amount0);
  const [boost, setBoost] = useState(boost0);
  return (
    <div className="bg-background p-4">
      <LiteContractOrderPanel
        eventName={TITLE}
        yesLabel={yesLabel}
        noLabel={noLabel}
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
        countdownText={countdown}
        timeSlot={sportsClock ? <SportsClockLabel clock={sportsClock} variant="card" /> : undefined}
        variant={isMobile ? "mobile" : "desktop"}
        previewLimitHint={limitHint}
        previewLowBalance={lowBalance}
        heldSideLabel={heldSideLabel}
        heldCurrentValue={heldCurrentValue}
        heldQty={heldQty}
        fixture={{
          ...(boostTrayOpen ? { boostTrayOpen: true } : null),
          // Frames never read the viewer's own wallet: a signed-in viewer with
          // $0 would otherwise see the low-balance / "lose everything" states.
          boostAccountValue: accountValue ?? 10_000,
          openCallsCouldLose: couldLose ?? 0,
          balance: balance ?? (lowBalance ? 0 : 1_000),
          ...(autoCloseAt != null ? { autoClose: { kind: "level" as const, price: autoCloseAt } } : null),
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
/** TR-27 · Lite → Pro 定价入口脚注（SW-2）。 */
export const Tr27Preview = () => <Panel limitHint />;
/** TR-27b · 同一账号未进过 Pro，但已输入金额 → 入口让位给风险句（OR 规则）。 */
export const Tr27bPreview = () => <Panel limitHint amount0="25" />;
/** TR-27c · 多 market 事件（选项名非 Yes/No）同一行位的入口。 */
export const Tr27cPreview = () => <Panel limitHint yesLabel="Charles Leclerc" noLabel="Not Leclerc" />;
/** TR-28 · Boost limit reached（Pro RESTRICTION 档 Risk ≥ 95% 的 Lite 写法）：CTA 置灰。 */
export const Tr28Preview = () => <Panel amount0="25" blocked blockedReason="Boost limit reached — close a position first" />;

/** TR-30 · Boost 余额不够下单（Max = 0）：提示行 + 快捷金额置灰，CTA 不变。 */
export const Tr30Preview = () => <Panel lowBalance />;
/* TR-29 · sports fixtures: the time slot follows the match phase, never the estimated end (CPO 2026-11-04). */
const HOCKEY = { yesLabel: "Maple Leafs", noLabel: "Kraken" };
export const Tr29Preview = () => <Panel {...HOCKEY} yesPrice={0.34} sportsClock={{ phase: "upcoming", kickoffInMs: (2 * 60 + 10) * 60_000, liveClock: null }} />;
export const Tr29bPreview = () => <Panel {...HOCKEY} yesPrice={0.34} sportsClock={{ phase: "live", kickoffInMs: 0, liveClock: "P2 12:04" }} />;
export const Tr29cPreview = () => <Panel {...HOCKEY} yesPrice={0.41} sportsClock={{ phase: "live", kickoffInMs: 0, liveClock: "OT 3:21" }} />;
/** TR-29e · kickoff time passed, match not started (CPO 2026-11-16). */
export const Tr29ePreview = () => <Panel {...HOCKEY} yesPrice={0.34} sportsClock={{ phase: "upcoming", kickoffInMs: 0, liveClock: null }} />;
export const Tr29dPreview = () => <Panel {...HOCKEY} yesPrice={0.41} blocked blockedReason={IN_REVIEW_BADGE} sportsClock={{ phase: "final", kickoffInMs: 0, liveClock: null }} />;
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
        sideLabel="Yes"
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

/* TR-35 / TR-35b — success toast after a buy; TR-36 — the card it jumps to. */
export const Tr35Preview = () => (
  <Frame>
    <div className="flex justify-center py-2">
      <PlacedToastBody
        title={t("trade.screen.lite.winloss.toast_bought", { side: "Spirit", putIn: "$20.00" })}
        description={t("trade.screen.lite.winloss.toast_boost_line", { boost: 2, position: "$40.00" })}
      />
    </div>
  </Frame>
);

export const Tr35bPreview = () => (
  <Frame>
    <div className="flex justify-center py-2">
      <PlacedToastBody title={t("trade.screen.lite.winloss.toast_bought", { side: "Up", putIn: "$25.00" })} />
    </div>
  </Frame>
);

/* ---------- Voucher calls (TR-37 … TR-40, CPO 2026-11-18) ---------- */
const noop = () => undefined;

const VoucherCardFrame = (props: {
  sideLabel: string;
  boost: number;
  credit: number;
  rawPnl: number;
  isYes?: boolean;
}) => {
  const isMobile = useIsMobile();
  return (
    <Frame>
      <div className="p-2">
        <LiteVoucherCard
          sideLabel={props.sideLabel}
          isYes={props.isYes ?? true}
          boost={props.boost}
          faceValue={2}
          credit={props.credit}
          rawPnl={props.rawPnl}
          cap={1}
          closesBy="Nov 21, 13:36"
          compact={!!isMobile}
          surface={props.boost > 1 ? "boost" : "standard"}
          onCashOut={noop}
        />
      </div>
    </Frame>
  );
};

export const Tr37Preview = () => <VoucherCardFrame sideLabel="76ers" boost={5} credit={0.04} rawPnl={0.04} />;
export const Tr37bPreview = () => <VoucherCardFrame sideLabel="76ers" boost={5} credit={0} rawPnl={-0.2} />;
export const Tr37cPreview = () => <VoucherCardFrame sideLabel="Up" boost={1} credit={0.04} rawPnl={0.04} />;
export const Tr37dPreview = () => (
  <VoucherCardFrame sideLabel="Lakers · No" isYes={false} boost={5} credit={0.04} rawPnl={0.04} />
);

export const Tr38Preview = () => (
  <Frame>
    <div className="flex justify-center py-2">
      <PlacedToastBody
        title={t("vouchers.lite.toast.bought", { leg: "76ers" })}
        description={t("vouchers.lite.toast.paid_with", { amount: "$2.00" })}
      />
    </div>
  </Frame>
);

export const Tr38bPreview = () => (
  <Frame>
    <div className="flex justify-center py-2">
      <PlacedToastBody
        title={t("vouchers.lite.toast.bought", { leg: "Lakers · Yes" })}
        description={t("vouchers.lite.toast.paid_with", { amount: "$2.00" })}
      />
    </div>
  </Frame>
);

export const Tr35cPreview = () => (
  <Frame>
    <div className="flex justify-center py-2">
      <PlacedToastBody
        title={t("trade.screen.lite.winloss.toast_bought", { side: "Lakers · Yes", putIn: "$10.00" })}
        description={t("trade.screen.lite.winloss.toast_boost_line", { boost: 3, position: "$30.00" })}
      />
    </div>
  </Frame>
);

const VoucherPanelFrame = ({ credit, leg = "76ers", isYes = true }: { credit: number; leg?: string; isYes?: boolean }) => {
  const isMobile = useIsMobile();
  return (
    <Frame>
      <VoucherLayer open onOpenChange={noop} isMobile={!!isMobile} titled inline>
        <VoucherCashOutBody leg={leg} isYes={isYes} credit={credit} cap={1} onConfirm={noop} onKeepOpen={noop} />
      </VoucherLayer>
    </Frame>
  );
};

export const Tr39Preview = () => <VoucherPanelFrame credit={0.04} />;
export const Tr39bPreview = () => <VoucherPanelFrame credit={0} />;
export const Tr39cPreview = () => <VoucherPanelFrame credit={0.04} leg="Lakers · No" isYes={false} />;

const VoucherDoneFrame = (props: { credited: number; funded: boolean; hasOtherVoucher: boolean }) => {
  const isMobile = useIsMobile();
  return (
    <Frame>
      <VoucherLayer open onOpenChange={noop} isMobile={!!isMobile} titled={false} inline>
        <VoucherDoneBody
          {...props}
          isMobile={!!isMobile}
          onDeposit={noop}
          onBrowse={noop}
          onVouchers={noop}
        />
      </VoucherLayer>
    </Frame>
  );
};

export const Tr40Preview = () => <VoucherDoneFrame credited={0.04} funded={false} hasOtherVoucher />;
export const Tr40bPreview = () => <VoucherDoneFrame credited={0.04} funded hasOtherVoucher={false} />;
export const Tr40cPreview = () => <VoucherDoneFrame credited={0} funded={false} hasOtherVoucher />;
export const Tr40dPreview = () => <VoucherDoneFrame credited={0} funded={false} hasOtherVoucher={false} />;
export const Tr40ePreview = () => <VoucherDoneFrame credited={0} funded hasOtherVoucher={false} />;
export const Tr40fPreview = () => <VoucherDoneFrame credited={0} funded hasOtherVoucher />;

export const Tr36Preview = () => {
  const isMobile = useIsMobile();
  return (
    <Frame>
      <div className="p-2">
        <LitePositionCard
          sideLabel="Spirit"
          isYes
          boost={2}
          putIn={20}
          nowWorth={19.52}
          profit={-0.48}
          autoCloseText="34¢"
          compact={!!isMobile}
          flashOpen
          onCashOut={() => undefined}
        />
      </div>
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
        profitNote="Right after you buy, this starts a little below $0: you bought at 52¢, and selling right now gets 51¢. The $0.04 trading fee was charged when you bought."
        autoCloseSub={`Can lose up to ${usd(maxLossFor(25))}`}
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
        profitNote="Right after you buy, this starts a little below $0: you bought at 47¢, and selling right now gets 46¢. The $0.06 trading fee was charged when you bought."
        autoCloseSub={`Can lose up to ${usd(maxLossFor(40))}`}
        compact={!!isMobile}
        onCashOut={() => undefined}
      />
    </Frame>
  );
};

/** TR-12 · voucher 来源仓 — 2026-11-18 起券单有自己的卡（见 TR-37），这里挂同一张券卡。 */
export const Tr12Preview = () => <VoucherCardFrame sideLabel="Yes" boost={5} credit={0.04} rawPnl={0.04} />;

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
  <div className="space-y-4 p-4">
    <InReviewCard sourceName="Nasdaq official close" holding />
    <Panel amount0="" blocked blockedReason={IN_REVIEW_BADGE} countdown="Expected to end in 00:00" />
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
      <Panel amount0="" blocked blockedReason="Closed" countdown="Expected to end in 00:00" />
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

/* TR-31 … TR-34 · 下单面板赢亏（CPO 2026-11-16 画布第 ① 排，CTO 回复后定稿）。 */
const MAGIC = { yesLabel: "Bucks", noLabel: "Magic", yesPrice: 0.22, side0: "no" as const, amount0: "10" };
/** TR-31 · 1×：`If you're wrong, you lose $10.02`，auto-close `None · nothing borrowed`，脚注写满额。 */
export const Tr31Preview = () => <Panel {...MAGIC} boost0={1} balance={999.38} accountValue={999.38} />;
/** TR-32 · 3× · 这一笔就能亏光：Boost 里只有 $25，最多亏封顶 $25.00 + 红字。 */
export const Tr32Preview = () => <Panel {...MAGIC} boost0={3} balance={25} accountValue={25} autoCloseAt={0.52} />;
/** TR-33 · 3× · 几笔加起来超过：显示 $30 现金，账户总值 $66，另一笔跌到底还会亏 $96 → 红框。 */
export const Tr33Preview = () => <Panel {...MAGIC} boost0={3} balance={30} accountValue={66} couldLose={96} autoCloseAt={0.61} />;

/** TR-34 · 手机下单抽屉顶部的时间行（体育赛前 / 比赛中 / 加密轮次 / 长期事件）。 */
export const Tr34Preview = () => (
  <div className="space-y-4 p-4">
    <LiteOrderDrawerHeader side="no" sideLabel="Magic" contextLine="【NBA】Bucks vs. Magic" sidePrice={0.78}
      sportsClock={{ phase: "upcoming", kickoffInMs: (16 * 60 + 8) * 60_000, liveClock: null }} timeLabel="" />
    <LiteOrderDrawerHeader side="no" sideLabel="Magic" contextLine="【NBA】Bucks vs. Magic" sidePrice={0.78}
      sportsClock={{ phase: "live", kickoffInMs: 0, liveClock: "Q3 04:12" }} timeLabel="" />
    <LiteOrderDrawerHeader side="yes" sideLabel="Up" contextLine="Bitcoin — up or down? 15:00–15:15" sidePrice={0.64}
      sportsClock={null} timeLabel={t("trade.screen.lite.lite_contract_order_panel.closes_in", { time: "12:30" })} />
    <LiteOrderDrawerHeader side="yes" sideLabel="Yes" contextLine="Fed cuts rates in December?" sidePrice={0.31}
      sportsClock={null} timeLabel={t("trade.screen.lite.lite_contract_order_panel.expected_to_end_in", { time: "45d 3h" })} />
  </div>
);
