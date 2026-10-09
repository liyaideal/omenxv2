// ============================================================
// /spot · TABLE（5m/15m 加密快轮 · 筹码上桌下单）状态字典 previews。
// 铁律同 SP 系列：只挂生产组件，数据一律 fixture 确定性注入
// （禁运行时 fetch / 禁 Date.now 派生的可变文案），倒计时、路单序列、
// 轮次时间窗全部冻结。桌面专属（移动版另起一轮，按抽屉规范重做）。
// ============================================================
import { useState } from "react";
import { TableChip } from "@/components/lite/table/TableChip";
import { TableLadder } from "@/components/lite/table/TableLadder";
import { TableResult } from "@/components/lite/table/TableResult";
import { TableRoads } from "@/components/lite/table/TableRoads";
import { TableSideZone } from "@/components/lite/table/TableSide";
import { TableStage } from "@/components/lite/table/TableStage";
import { TableTray } from "@/components/lite/table/TableTray";
import { CHIP_VALUES, type Boost, type ChipValue, type TableSide } from "@/components/lite/table/tableMath";

const Frame = ({ children, h }: { children: React.ReactNode; h?: number }) => (
  <div className="relative" style={{ height: h }}>{children}</div>
);

/** Frozen fixtures */
const START = Date.UTC(2026, 9, 9, 8, 45);
const TF_MS = 5 * 60 * 1000;
const HISTORY: TableSide[] = (
  "ud uu d uuu dd u d uuuu d uuuuuu u dd uu d u ddd u dd uuu d u dd u".replace(/ /g, "")
)
  .split("")
  .map((c) => (c === "u" ? "up" : "down"));
const MINE = [true, true, false, true, false, true, true, true, false, true].map((won, i) => ({ won, side: (i % 3 === 0 ? "down" : "up") as TableSide }));

/* ------------------------- TB-1 roads ------------------------- */
export const Tb1Preview = () => (
  <Frame h={140}>
    <TableRoads history={HISTORY} currentStartMs={START} tfMs={TF_MS} mine={MINE} holding net={84.2} />
  </Frame>
);

/* ------------------------- TB-2 stage ------------------------- */
const POINTS = Array.from({ length: 121 }, (_, t) => ({ t, p: 67412 + Math.sin(t / 9) * 18 + t * 0.16 }));
export const Tb2Preview = () => (
  <Frame h={520}>
    <TableStage points={POINTS} open={67412} durationSec={300} price={POINTS[120].p} deviationText="▲ +$19.20 above open" deviationSide="up" marketUpPct={62} flash={null} />
  </Frame>
);
export const Tb2bPreview = () => (
  <Frame h={520}>
    <TableStage
      points={POINTS}
      open={67412}
      durationSec={300}
      price={POINTS[120].p}
      deviationText="▲ +$19.20 above open"
      deviationSide="up"
      marketUpPct={62}
      flash={{ side: "up", close: 67431.2, open: 67412, pnl: 93, pct: false }}
      onShareWin={() => {}}
    />
  </Frame>
);

/* ------------------------- TB-3 ladder ------------------------- */
const LadderBox = ({ children }: { children: React.ReactNode }) => <div style={{ width: 140, height: 520 }}>{children}</div>;
export const Tb3Preview = () => (
  <Frame h={520}>
    <div style={{ display: "flex", gap: 24 }}>
      <LadderBox>
        <TableLadder open={67412} deviation={19.2} pct={false} roundId="r1" remainingMs={252_000} durationMs={TF_MS} endMs={START + TF_MS} settling={false} />
      </LadderBox>
      <LadderBox>
        <TableLadder open={67412} deviation={-93.74} pct={false} roundId="r1" remainingMs={8_000} durationMs={TF_MS} endMs={START + TF_MS} settling={false} />
      </LadderBox>
      <LadderBox>
        <TableLadder open={0.00001234} deviation={-0.26} pct roundId="r1" remainingMs={0} durationMs={TF_MS} endMs={START + TF_MS} settling />
      </LadderBox>
    </div>
  </Frame>
);

/* ------------------------- TB-4 zones ------------------------- */
const noop = () => {};
const ZoneBox = ({ children }: { children: React.ReactNode }) => (
  <div style={{ width: 420, height: 216, display: "grid" }}>{children}</div>
);
const zoneProps = {
  filled: [] as { value: ChipValue; boost: number }[],
  pending: [],
  queued: [],
  lockedBy: null,
  settling: false,
  over: false,
  result: null,
  boost: 2 as Boost,
  onTap: noop,
  onCancelPending: noop,
};
export const Tb4Preview = () => (
  <Frame>
    <div style={{ display: "grid", gridTemplateColumns: "420px 420px", gap: 16, padding: 16 }}>
      <ZoneBox>
        <TableSideZone side="up" price={0.62} holding={null} {...zoneProps} />
      </ZoneBox>
      <ZoneBox>
        <TableSideZone side="up" price={0.62} holding={null} {...zoneProps} over />
      </ZoneBox>
      <ZoneBox>
        <TableSideZone
          side="up"
          price={0.62}
          holding={{ margin: 100, notional: 200, shares: 379, profit: 179 }}
          {...zoneProps}
          filled={[{ value: 50, boost: 2 }, { value: 50, boost: 2 }]}
        />
      </ZoneBox>
      <ZoneBox>
        <TableSideZone side="down" price={0.38} holding={null} {...zoneProps} lockedBy="up" />
      </ZoneBox>
      <ZoneBox>
        <TableSideZone side="up" price={0.62} holding={null} {...zoneProps} pending={[{ id: 1, side: "up", value: 100, boost: 2, at: 0, flip: false }]} />
      </ZoneBox>
      <ZoneBox>
        <TableSideZone side="down" price={0.38} holding={null} {...zoneProps} settling queued={[{ id: 2, side: "down", value: 25, boost: 5 }]} />
      </ZoneBox>
      <ZoneBox>
        <TableSideZone side="up" price={0.62} holding={{ margin: 100, notional: 200, shares: 379, profit: 179 }} {...zoneProps} result="won" />
      </ZoneBox>
      <ZoneBox>
        <TableSideZone side="down" price={0.38} holding={null} {...zoneProps} result="lost" />
      </ZoneBox>
    </div>
  </Frame>
);

/* ------------------------- TB-5 tray + chips ------------------------- */
export const Tb5Preview = () => {
  const [chip, setChip] = useState<ChipValue>(50);
  const [boost, setBoost] = useState<Boost>(2);
  return (
    <Frame>
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ width: 420, height: 104, display: "grid" }}>
          <TableTray chip={chip} boost={boost} onChip={setChip} onBoost={setBoost} quotePrice={0.62} onDrop={noop} onDragOver={noop} />
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          {CHIP_VALUES.map((v) => (
            <TableChip key={v} value={v} />
          ))}
          <TableChip value={50} selected />
          <TableChip value={100} boost={5} />
          <TableChip value={25} size={28} />
          <TableChip value={25} size={28} boost={2} />
          <TableChip value={100} size={28} pending />
          <TableChip value={10} size={28} queued />
        </div>
      </div>
    </Frame>
  );
};

/* ------------------------- TB-6 result ------------------------- */
export const Tb6Preview = () => (
  <Frame>
    <div style={{ height: 104 }}>
      <TableResult holding={null} emptyText="Nothing on the table" net={0} won={0} lost={0} canCashOut={false} onCashOut={noop} onShare={noop} />
    </div>
    <div style={{ height: 104, borderTop: "1px solid #1C1F26" }}>
      <TableResult
        holding={{ side: "up", margin: 100, notional: 200, shares: 379, entry: 0.527, boosts: [2], livePnl: -5.72, currentValue: 194.28, profitIfWin: 179 }}
        emptyText=""
        net={84.2}
        won={7}
        lost={3}
        canCashOut
        onCashOut={noop}
        onShare={noop}
      />
    </div>
    <div style={{ height: 104, borderTop: "1px solid #1C1F26" }}>
      <TableResult holding={null} emptyText="Settling" net={-12.4} won={2} lost={4} canCashOut={false} onCashOut={noop} onShare={noop} />
    </div>
  </Frame>
);
