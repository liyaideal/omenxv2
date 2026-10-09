/**
 * /spot · TABLE（5m / 15m 加密快轮 · 筹码上桌下单）· 状态字典（TB-1 … TB-6）。
 *
 * 规则（Liya 2026-10-09 拍板）：下单形态跟着周期走——5m / 15m 只有 Table，
 * 1h / 4h / 1d 只有 Classic，没有用户开关；发布开关见 src/lib/tableMode.ts
 * （内测期 ?table=1 / alex_carter 可见）。桌面专属，移动版另起一轮。
 * 框架同 SP 系列：生产组件 + fixture 确定性注入，倒计时 / 路单 / 时间窗冻结。
 */
import { SectionWrapper, SubSection } from "../components/SectionWrapper";
import { SectionFrame, type SectionCase } from "../components/SectionFrame";

const ROADS: SectionCase[] = [
  {
    key: "table-tb1",
    label: "TB-1 · ① 路单条（珠盘 + 大路 + 统计）",
    note:
      "标准读法：珠盘在左（原始时序，6 行，最新列在右），大路在右（同结果向下堆，变结果开新列，满 6 行换列），统计在最右。hover 任一格显示该轮时间窗 `HH:MM–HH:MM UTC · Up/Down won`。连 3 以上时大路标题旁出 streak 胶囊。无下三路（产品无和局，v1 不画）。",
    spec: [
      { state: "珠盘格", when: "history.slice(-36)", visual: "12px 圆点，Up = Pulse Blue · Down = Volt，各带 6px 同色微光", source: "TableRoads · BeadCell" },
      { state: "大路格", when: "bigRoadColumns(history)", visual: "12px 圆角方框 1.5px 描边 + 10% 同色底；最新一格结算时 zoom-in 300ms", source: "tableMath.bigRoadColumns" },
      { state: "streak 胶囊", when: "currentStreak(history).n >= 3", visual: "`Up ×N in a row` 同色 14% 底 + 1px 环 + 16px 外光", source: "tableMath.currentStreak" },
      { state: "虚线格", when: "always（大路最右）", visual: "12px 虚线框 = 本轮未开", source: "TableRoads" },
      { state: "我最近 10 局", when: "mine[]", visual: "14px 方块：赢 = 方向色 ✓，输 = #FF5C5C ✕；holding 时末尾加虚线格", source: "useTableToday" },
    ],
  },
];

const STAGE: SectionCase[] = [
  {
    key: "table-tb2",
    label: "TB-2 · ② 舞台图（中性价格线 + 开盘线 + 大数字）",
    note:
      "价格线固定中性白（#E6E8EC）+ 7px 14% 光晕，禁用方向色——方向只由面积渐变（涨蓝 / 跌黄）、末端光点和梯子表达，避免被读成「UP 的线」。开盘线中性灰横贯全图，标签 `OPEN · $价` 靠右；结算线橙色虚线在右缘。",
    spec: [
      { state: "涨态", when: "price >= open", visual: "面积渐变 rgba(51,214,255,.16)→0，末端光点蓝", source: "TableStage" },
      { state: "跌态", when: "price < open", visual: "面积渐变 rgba(207,255,74,.14)→0，末端光点黄", source: "同上" },
      { state: "大数字", when: "always", visual: "38px JetBrains Mono 700，白色 24px 柔光；下行 `▲ +$19.20 above open · market 62% Up` 走方向色 + 14px 同色光", source: "formatPrice" },
      { state: "sub-$1 币", when: "open < 1", visual: "价格走下标零写法 `$0.0₄1234`；偏离改百分比", source: "formatPrice / ladderUsesPct" },
    ],
  },
  {
    key: "table-tb2b",
    label: "TB-2b · 开奖帧（flash）",
    note: "轮次滚动瞬间叠 2.6s：72% 黑 + 4px 模糊，64px `UP ✓` 方向色，副行收盘价 / 偏离 / 你的盈亏；赢且 pnl > 0 出 `Share this win`（复用 LiteManualShareCard，state=settled）。",
    spec: [
      { state: "有仓赢", when: "flash.pnl > 0", visual: "副行 `You won +$93` Volt + Share 按钮", source: "LiteQuickTable · settle flash" },
      { state: "有仓输", when: "flash.pnl < 0", visual: "副行 `You lost −$50` #FF5C5C，无按钮", source: "同上" },
      { state: "空仓", when: "flash.pnl == null", visual: "只有结果 + 收盘价", source: "同上" },
    ],
  },
];

const LADDER: SectionCase[] = [
  {
    key: "table-tb3",
    label: "TB-3 · 梯子（动态量程 · $ / % 双单位 · 倒计时环）三态",
    note:
      "左：BTC +$19.20，量程 ±$40；中：BTC −$93.74，量程已跳到 ±$200、剩 8s 为 Closing（环脉冲）；右：PEPE −0.26%，百分比刻度，Settling。量程规则：开轮 = 开盘价 0.06%（或 0.06%）取整到档位；偏离超过量程 80% 跳到 ×1.25 的下一档；同轮只扩不缩；新轮重置。刻度与指针标签距离 < 40px 时刻度隐藏。",
    spec: [
      { state: "指针", when: "deviation", visual: "26px 平面圆片，方向色 + 4px 底环 + 5px 同色环 + 28px 外光，top 过渡 200ms", source: "TableLadder" },
      { state: "量程跳档", when: "|deviation| > range × 0.8", visual: "range = niceStep(|deviation| × 1.25)，刻度文字同步", source: "tableMath.nextLadderRange" },
      { state: "Closing", when: "remainingMs <= 10s && !settling", visual: "提示字橙色 `Closing`，环 animate-pulse", source: "TableLadder" },
      { state: "Settling", when: "remainingMs <= 0", visual: "提示字 `Settling · chips queue next round`，环归零", source: "同上" },
      { state: "% 单位", when: "open < 1", visual: "刻度 `+0.5% / +0.25% / −0.25% / −0.5%`，指针 `▼ −0.26%`", source: "ladderUsesPct" },
    ],
  },
];

const ZONES: SectionCase[] = [
  {
    key: "table-tb4",
    label: "TB-4 · ③ UP / DOWN 格 × 8 态",
    note:
      "从左到右、从上到下：空桌 · 拖拽悬停（虚线框）· 持仓（呼吸光 + 右上筹码堆 + `$200 position` 胶囊）· 翻面就绪（对侧有仓，70% 透明 + `you hold Up · a chip here flips to Down`，不拦截）· 待发（筹码转环 + `Filling $100 · boosted · tap chip to cancel`；翻面时 `Flipping · closes your Up ($X back) · then $100 boosted on Down`）· 结算期排队（虚线筹码 + `$125 queued · buys at next open`）· 赢（3px 同色内框）· 输（30% 透明）。UP 格左上角固定 `③ decide · drag a chip up or down`。",
    spec: [
      { state: "空桌", when: "!holding && !pending && !queued", visual: "渐变底 6%→16%，副行 `pays $1.00 / share · 2× boost`", source: "TableSideZone" },
      { state: "持仓", when: "holding != null", visual: "底 10%→26% + omx-breathe-up/down 2.4s + 54px 字 18px 光晕", source: "同上" },
      { state: "翻面就绪", when: "lockedBy(held) && lockedBy !== side && !settling", visual: "opacity .7 · 副行 `you hold X · a chip here flips to Y`；落筹 = 先全额平掉持有腿再开新腿", source: "useTableOrders.place · flip" },
      { state: "待发", when: "pending.length > 0", visual: "28px 筹码 + 白色转环（animate-spin 0.8s）· 点筹码撤回", source: "PENDING_MS = 1500" },
      { state: "排队", when: "settling && queued.length > 0", visual: "虚线筹码 55% · 胶囊 `$N next round`", source: "useTableOrders.queued" },
      { state: "赢 / 输", when: "result === 'won' | 'lost'", visual: "won: inset 0 0 0 3px 方向色；lost: opacity .3", source: "flash.side" },
    ],
  },
];

const TRAY: SectionCase[] = [
  {
    key: "table-tb5",
    label: "TB-5 · 筹码 × Boost 托盘 + 筹码件全态",
    note:
      "托盘坐在开盘线上（UP 与 DOWN 之间），上下 2px 50% 白边 = 开盘线本体。筹码 10 / 25 / 50 / 100 / 500 哑光 + 内圈双色边纹，选中上浮 4px + 白环；Boost 1 / 2 / 5 / 10 默认 2，选中白底。算式行 `$50×2 = $100 · 188 sh · fee $0.15` 读 quoteTableOrder。第二行：托盘筹码 ×5、选中、×5 徽标、28px 格上筹码（素 / ×2 / 待发 / 排队）。",
    spec: [
      { state: "选中", when: "value === chip", visual: "translateY(−4px) + 0 0 0 2px #141719, 0 0 0 3.5px #fff", source: "TableChip.selected" },
      { state: "Boost 徽标", when: "boost > 1", visual: "右上 `×N` 黑底白字 1px 40% 白边胶囊", source: "TableChip.boost" },
      { state: "拖拽", when: "pointermove ≥ 6px", visual: "44px 幽灵筹码跟随指针（portal 到 body），悬停格出虚线框", source: "TableTray · onDragOver" },
      { state: "落筹", when: "pointerup 在 [data-table-side] 上", visual: "→ useTableOrders.place(side)", source: "TableTray · onDrop" },
      { state: "算式", when: "chip / boost / quotePrice 变化", visual: "`$chip×boost = $notional · shares sh · fee $x`", source: "tableQuote.quoteTableOrder（合约口径）" },
    ],
  },
];

const RESULT: SectionCase[] = [
  {
    key: "table-tb6",
    label: "TB-6 · ④ 结果行三态（空桌 / 持仓 / 结算中）",
    note: "This round · Live · Today 三块 + 右侧 Share / Cash out。Cash out 走现有 LiteCashOutFlow（onConfirmCashOut = cashOutTable：保证金 + 盈亏 − 5% wc）；Share 走 LiteManualShareCard（state=live）。",
    spec: [
      { state: "空桌", when: "holding == null", visual: "`—` + 副文案（Nothing on the table / Filling… / Queued for next round / Settling）；两按钮 35% 禁用", source: "TableResult.emptyText" },
      { state: "持仓", when: "holding != null", visual: "`Up · $200 position` 方向色 + 14px 光；副行 margin · boost · sh @ ¢ · value；Live 盈亏色走收益轴（Volt / #FF5C5C）", source: "TableResult" },
      { state: "Cash out 可用", when: "holding && !settling", visual: "红边按钮可点 → LiteCashOutFlow", source: "LiteQuickTable" },
      { state: "Today", when: "always", visual: "当天该桌已结算仓合计（positions.closed_at ≥ 今日 UTC 0 点）+ `N won · M lost`", source: "useTableToday" },
    ],
  },
];

const Desk = ({ cases, min }: { cases: SectionCase[]; min: number }) => (
  <div className="space-y-3">
    <SectionFrame cases={cases} device="desktop" minHeight={min} />
  </div>
);

export const TableStatesSection = () => (
  <SectionWrapper
    id="table-states"
    title="/spot · Table（5m / 15m 加密快轮 · 筹码上桌）· 状态字典（TB-1 … TB-6）"
    description="下单形态跟着周期走：5m / 15m 只有 Table，1h 以上只有 Classic，无用户开关。四行动线 ① 看历史（路单）→ ② 看现在（舞台图 + 梯子）→ ③ 做决定（UP · 筹码×Boost · DOWN）→ ④ 看结果。桌面专属；内测期由 src/lib/tableMode.ts 控（?table=1 或 alex_carter）。文案全部占位，待合规措辞轮统一。"
  >
    <div className="rounded-lg border border-[#FF8A3D]/30 bg-[#FF8A3D]/5 px-3 py-2 text-[12px] text-foreground">
      交互契约：落筹 = 1.5s 待发可撤（无 Confirm）· 一轮一仓、反向落筹 = 翻面（先平后开）· 每枚筹码各自 Boost、同向合并一仓 · 结算期落筹排下一轮 · 加密轮无封盘秒数。
      快轮 2026-10-09 起走<b>合约</b>（`product_lines = ['contract']`，Boost 账户）：落筹 = <code className="font-mono">executeTrade(leverage = boost)</code>，
      平仓走通用 close，结算 <code className="font-mono">settle_quick_contract_round</code>（只认本轮 option_id；migration <code className="font-mono">20261009180000</code>）。
    </div>
    <SubSection title="① 路单（TB-1）">
      <Desk cases={ROADS} min={160} />
    </SubSection>
    <SubSection title="② 舞台图 + 开奖帧（TB-2 / TB-2b）">
      <Desk cases={STAGE} min={560} />
    </SubSection>
    <SubSection title="② 梯子（TB-3）">
      <Desk cases={LADDER} min={560} />
    </SubSection>
    <SubSection title="③ UP / DOWN 格（TB-4）">
      <Desk cases={ZONES} min={960} />
    </SubSection>
    <SubSection title="③ 筹码 × Boost 托盘（TB-5）">
      <Desk cases={TRAY} min={260} />
    </SubSection>
    <SubSection title="④ 结果行（TB-6）">
      <Desk cases={RESULT} min={360} />
    </SubSection>
    <SubSection title="附注 · 本轮不做">
      <ul className="list-disc space-y-1 pl-5 text-[12px] text-muted-foreground">
        <li>移动端 Table（按抽屉规范另做）；移动端 5m / 15m 继续 Classic。</li>
        <li>memecoin / 1m 周期：前端下拉 + 格式化已就绪，等 roll_crypto_quick_rounds 加币种 / 周期。</li>
        <li>下三路（大眼仔 / 小路 / 曱甴路）与问路预览。</li>
        <li>盘中强平：Lovable 合约路径沿用现有 auto-close 口径（TR 系列），真平台由风控引擎负责。</li>
        <li>措辞 / 合规终稿；i18n key 接入。</li>
      </ul>
    </SubSection>
  </SectionWrapper>
);
