// ============================================================
// /spot（现货轮：crypto 快轮 + stocks 日内）状态字典 previews。
// 铁律同 TR 系列：只挂生产组件，数据一律 fixture 确定性注入
// （禁运行时 fetch / 禁 Date.now 派生的可变文案），倒计时与 round id 全部冻结。
//
// 缺口回报：SP-1 / SP-2 / SP-9 / SP-15 / SP-16 的目标区块在生产里是
// LiteSpotTrade / LiteQuickTrade 的内联 JSX，尚未抽成可复用组件；
// 在「生产零改动」前提下既不能挂载也不许手抄，故本文件不收录，
// 详见 SpotStatesSection 的缺口表。
// ============================================================
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { RoundTape } from "@/components/lite/shared/RoundTape";
import { LiteStockChart } from "@/components/lite/trade/LiteStockChart";
import { LiteOrderPanel } from "@/components/lite/trade/LiteOrderPanel";
import {
  SpotSentimentBar,
  SpotSettlementRail,
  SpotYourPosition,
} from "@/components/lite/trade/SpotBlocks";

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div className="space-y-4 bg-background p-4">{children}</div>
);

/* ------------------------- SP-3 / SP-4 round tape ------------------------- */

const ROUND_HISTORY: boolean[] = [true, false, true, true, false, true, false, true];

/** SP-3 · crypto 轮 round strip（RoundTape 唯一实现）。 */
export const Sp3Preview = () => {
  const isMobile = useIsMobile();
  return (
    <Frame>
      <RoundTape
        isMobile={!!isMobile}
        leftLabel={{ micro: "Round #6542 · AUG 28", value: "03:40–03:45" }}
        chips={ROUND_HISTORY.map((up, i) => ({
          key: String(i),
          up,
          tooltip: `03:${String(5 + i * 5).padStart(2, "0")}–03:${String(
            10 + i * 5,
          ).padStart(2, "0")} · ${up ? "Up" : "Down"} won`,
        }))}
        currentSlot={[{ kind: "countdown", text: "02:41" }, { kind: "next" }]}
        legend={
          <>
            Past rounds — <span style={{ color: "#33D6FF" }}>▲</span> Up won ·{" "}
            <span style={{ color: "#CFFF4A" }}>▼</span> Down won · a new round starts
            the moment one settles.
          </>
        }
      />
    </Frame>
  );
};

const DAY_HISTORY = [
  { id: "d1", label: "Aug 21", up: true },
  { id: "d2", label: "Aug 22", up: false },
  { id: "d3", label: "Aug 25", up: false },
  { id: "d4", label: "Aug 26", up: true },
  { id: "d5", label: "Aug 27", up: true },
];

/** SP-4 · stocks 日内 day strip（TODAY · 市场时段两行左标 + 橙色倒计时药丸）。 */
export const Sp4Preview = () => {
  const isMobile = useIsMobile();
  return (
    <Frame>
      <RoundTape
        isMobile={!!isMobile}
        leftLabel={{ micro: "TODAY · AUG 28", value: "09:30–16:00" }}
        chips={DAY_HISTORY.map((d) => ({
          key: d.id,
          up: d.up,
          active: d.id === "d5",
          onClick: () => undefined,
          tooltip: `${d.label} · ${d.up ? "Up" : "Down"} won`,
        }))}
        currentSlot={{
          kind: "countdown",
          text: "04:12:37",
          tooltip: "Today's round · closes at 16:00",
        }}
        legend={
          <>
            Past days — <span style={{ color: "#33D6FF" }}>▲</span> Up won ·{" "}
            <span style={{ color: "#CFFF4A" }}>▼</span> Down won · tap a day to see how
            it settled.
          </>
        }
      />
    </Frame>
  );
};

/* ------------------------------ SP-5 crowd ------------------------------- */

export const Sp5Preview = () => (
  <Frame>
    <SpotSentimentBar yesLabel="Up" noLabel="Down" yesPct={55} volText="$184.2K" />
  </Frame>
);

/* --------------------------- SP-6 / SP-7 chart --------------------------- */

const ROUND_START = "2026-08-28T03:40:00.000Z";
const ROUND_END = "2026-08-28T03:45:00.000Z";

/** SP-6 · 双 tab（`BTC price` / `{side} odds ¢`），odds 系列随所选 side 切换。 */
export const Sp6Preview = () => (
  <Frame>
    {(["yes", "no"] as const).map((s) => (
      <div key={s} className="space-y-2">
        <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          side = {s} （{s === "yes" ? "Up" : "Down"} odds ¢）
        </div>
        <LiteStockChart
          ticker="BTC"
          basePrice={61569.07}
          currentPrice={61712.4}
          upOdds={0.55}
          side={s}
          upLabel="Up"
          downLabel="Down"
          startDate={ROUND_START}
          endDate={ROUND_END}
          currency="$"
        />
      </div>
    ))}
  </Frame>
);

/** SP-7 · price-to-beat 虚线（stock tab 下的 baseline，值 = base_price）。 */
export const Sp7Preview = () => (
  <Frame>
    <LiteStockChart
      ticker="BTC"
      basePrice={61569.07}
      currentPrice={61712.4}
      upOdds={0.55}
      side="yes"
      upLabel="Up"
      downLabel="Down"
      startDate={ROUND_START}
      endDate={ROUND_END}
      currency="$"
    />
  </Frame>
);

/* --------------------------- SP-8 / SP-14 rail --------------------------- */

/** SP-8 · HOW IT SETTLES 时段时间轴（Trading now 蓝点脉冲）。 */
export const Sp8Preview = () => (
  <Frame>
    <SpotSettlementRail
      blocked={false}
      tradingNow
      nodes={[
        { key: "open", label: "Opened", time: "" },
        { key: "mkt", label: "Market open", time: "09:30" },
        { key: "now", label: "Trading", time: "now", now: true },
        { key: "close", label: "Closes", time: "15:55" },
        { key: "settle", label: "Settles", time: "16:00" },
      ]}
    />
  </Frame>
);

/** SP-14 · 结算瞬间与下一轮衔接（冻结瞬态：全节点完成 + Trading now 熄灭）。 */
export const Sp14Preview = () => (
  <Frame>
    <SpotSettlementRail
      blocked
      settled
      tradingNow={false}
      nodes={[
        { key: "open", label: "Opened", time: "" },
        { key: "mkt", label: "Market open", time: "09:30" },
        { key: "mid", label: "Trading", time: "closed" },
        { key: "close", label: "Closed", time: "15:55" },
        { key: "settle", label: "Settled", time: "16:00" },
      ]}
    />
    <RoundTape
      leftLabel={{ micro: "NEXT ROUND · AUG 29", value: "09:30–16:00" }}
      chips={[...DAY_HISTORY, { id: "d6", label: "Aug 28", up: true }].map((d) => ({
        key: d.id,
        up: d.up,
        tooltip: `${d.label} · ${d.up ? "Up" : "Down"} won`,
      }))}
      currentSlot={{ kind: "next", tooltip: "Next round · opens Aug 29, 09:30" }}
      legend={
        <>
          Past days — <span style={{ color: "#33D6FF" }}>▲</span> Up won ·{" "}
          <span style={{ color: "#CFFF4A" }}>▼</span> Down won · tap a day to see how
          it settled.
        </>
      }
    />
  </Frame>
);

/* ---------------------- SP-10 / SP-11 / SP-12 order ---------------------- */

const OrderPanel = ({
  side0 = "yes",
  amount0 = "",
}: {
  side0?: "yes" | "no";
  amount0?: string;
}) => {
  const isMobile = useIsMobile();
  const [side, setSide] = useState<"yes" | "no">(side0);
  const [amount, setAmount] = useState(amount0);
  return (
    <div className="bg-background p-4">
      <LiteOrderPanel
        eventName="Will BTC be higher at 03:45?"
        eventId="sp-preview"
        countdownText="02:41"
        yesLabel="Up"
        noLabel="Down"
        yesPrice={0.55}
        noPrice={0.45}
        yesOptionId="sp-yes"
        noOptionId="sp-no"
        yesOptionLabel="Up"
        noOptionLabel="Down"
        blocked={false}
        side={side}
        onSideChange={setSide}
        amount={amount}
        onAmountChange={setAmount}
        variant={isMobile ? "mobile" : "desktop"}
        onRequestAuth={() => undefined}
      />
    </div>
  );
};

/** SP-10 · Place your order 默认态（零单）。 */
export const Sp10Preview = () => <OrderPanel />;
/** SP-11 · Down 侧选中态。 */
export const Sp11Preview = () => <OrderPanel side0="no" />;
/** SP-12 · 有金额态（$50 → shares / You get if right / Potential profit 联动）。 */
export const Sp12Preview = () => <OrderPanel amount0="50" />;

/* ------------------------------ SP-13 持仓 ------------------------------- */

export const Sp13Preview = () => (
  <Frame>
    <SpotYourPosition
      sideLabel="Up"
      isYesSide
      sizeDisplay="92.59"
      pnl="+$12.40"
      pnlPercent="+24.8%"
      currentValue={62.4}
      avgCost="54¢"
      ifWinsLabel="If Up wins"
      ifWinsValue="$92.59"
      onCashOut={() => undefined}
    />
    <SpotYourPosition
      sideLabel="Down"
      isYesSide={false}
      sizeDisplay="108.70"
      pnl="-$8.10"
      pnlPercent="-16.2%"
      currentValue={41.9}
      avgCost="46¢"
      ifWinsLabel="If Down wins"
      ifWinsValue="$108.70"
      onCashOut={() => undefined}
    />
  </Frame>
);
