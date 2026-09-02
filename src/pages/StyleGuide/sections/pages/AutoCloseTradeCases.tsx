// ============================================================
// Auto-close 轮归档 — 交易页侧 5 个 case（AC-T1…AC-T5）+ 节尾两张附注表
// （求解器契约 / 面×态矩阵，1:1 搬运 CPO mock7 v2 §0 与 §6）。
// ============================================================
import { SubSection } from "../../components";
import { SectionFrame, type SectionCase } from "../../components/SectionFrame";

const CASES: SectionCase[] = [
  {
    key: "autoclose-position-none",
    label: "AC-T1 · 持仓条 · None",
    note: "mock7 v2 §3 上条：Yes · 5× Boost · PUT IN $48.41 / NOW WORTH $48.41 / PROFIT +$0.00 / EST. AUTO-CLOSE `None` + 副行 `Loss capped at your stake`。",
    spec: [
      { state: "none", when: "autoClose.kind === 'none'（含 boost ≤ 1）", visual: "值 `None` 白字 + 灰副行 `Loss capped at your stake`", source: "LiteContractTrade.autoCloseDisplayFor" },
    ],
  },
  {
    key: "autoclose-position-hot",
    label: "AC-T2 · 持仓条 · hot",
    note: "mock7 v2 §3 下条：同卡 $48.41 / $50.38 / +$1.97，红 `≈ 89¢` + 红副行 `Close to current price`。",
    spec: [
      { state: "hot", when: "isAutoCloseHot(result, mark)（|mark − level| / mark ≤ 10%）", visual: "值与副行同为 trading-red", source: "autoClosePrice.isAutoCloseHot" },
    ],
  },
  {
    key: "autoclose-position-level",
    label: "AC-T3 · 持仓条 · level 非 hot",
    note: "矩阵 §6 第三行：`≈ 62¢` 白字、无副行。",
    spec: [
      { state: "level", when: "autoClose.kind === 'level' && !hot", visual: "值 `≈ 62¢`，不渲染副行（不是空占位）", source: "LitePositionCard.autoCloseSub" },
    ],
  },
  {
    key: "autoclose-order-panel-states",
    label: "AC-T4 · 下单面板 Est. auto-close 行 · 四态",
    note: "视觉焦点 = Returns 块的 `Est. auto-close ⓘ` 行 + 常驻小字 `Moves with your other positions`。四个实例（2×2）逐字对照 mock7 v2 §4：① 零单 `None · enter an amount` ② `≈ 62¢` ③ `None · loss capped` ④ 红 `≈ 89¢ · close to entry`。值由 fixture prop 驱动（生产从不传）。",
    spec: [
      { state: "零单（瞬态，不进值语法）", when: "amountNum <= 0", visual: "`None` 白 + 副词 `enter an amount`", source: "LiteContractOrderPanel.autoCloseRow" },
      { state: "level", when: "effBoost > 1 && autoClose.kind === 'level' && !hot", visual: "`≈ 62¢`", source: "estimateAutoClosePrice" },
      { state: "none", when: "effBoost <= 1 || autoClose.kind === 'none'", visual: "`None · loss capped`", source: "estimateAutoClosePrice" },
      { state: "hot", when: "isAutoCloseHot(autoClose, sidePrice)", visual: "红 `≈ 89¢ · close to entry`", source: "isAutoCloseHot" },
      { state: "加载中", when: "数据未到达", visual: "骨架占位，不是文字值", source: "useRealtimeRiskMetrics" },
    ],
  },
  {
    key: "autoclose-order-panel-partial-net",
    label: "AC-T5 · 下单面板 · partial-net 新仓行",
    note: "netting props（持仓在对侧、heldQty 小于本单 qty）使 `Est. auto-close (new position)` 行出现，语法与主行一致；fixture.remainderAutoClose = none → `None · loss capped`。",
    spec: [
      { state: "partial-net 行出现", when: "isPartialNet === canEstimateNet && remainderQty > 0", visual: "Returns 块多出 `Est. auto-close (new position)` 行", source: "LiteContractOrderPanel.isPartialNet" },
      { state: "none", when: "remainderAutoClose.kind === 'none' || effBoost <= 1", visual: "`None · loss capped`", source: "remainderAutoClose" },
    ],
  },
];

const SOLVER_ROWS: [string, string][] = [
  ["tooltip 全文", 'AC-TT1 统一解释层：唯一实现 AutoCloseTooltipBody（静态文案不插值，"≈ 62¢" 为冻结示例值）——面板 ⓘ / Your call 卡 label ⓘ / Portfolio 桌面行 level+none 值片段虚线触发；移动卡无触发；上述 case 走生产组件自动带上，不新增 case'],
  ["返回", '{ kind: "level", price } | { kind: "none" }——值只有两态，瞬态不进值语法'],
  ["long 解", "p = entry − (equityOther + assets − imAfter) / qty；合法域 0 < p < markPrice；出域 → none"],
  ["short 解", "p = entry + (…)/qty（方向取反）；合法域 markPrice < p < 1；出域 → none"],
  ["boost ≤ 1", "恒 none（无借贷敞口，亏损封顶本金）"],
  ["equity ≤ 0", "level = markPrice，恒 hot 红态"],
  ["数据加载中", "不是值：骨架占位"],
  ["恒等式", 'hot：|mark − level| / mark ≤ 10% → 红态；保留 "≈"；"Moves with your other positions" 随字段常驻'],
];

const MATRIX_ROWS: string[][] = [
  ["下单面板", "≈X¢", "红 ≈X¢ · close to entry", "None · loss capped", "零单=None · enter an amount；加载=骨架", "Standard 无此行"],
  ["下单面板 partial-net 行", "≈X¢", "红", "None · loss capped", "零单=None", "—"],
  ["交易页持仓条", "≈ X¢", "红 + Close to current price", "None + Loss capped at your stake", "加载=骨架", "无此列"],
  ["Portfolio 桌面行", "· auto-close ≈X¢", "整行红轨+红字", "· auto-close none", "加载=骨架", "不加段"],
  ["Portfolio 移动卡", "句尾 · auto-close ≈X¢", "红句", "· no auto-close, loss capped", "加载=骨架", "不加"],
  ["Pro 侧", "本轮不动（挂账④ 另轮统一到同一求解器）", "—", "—", "—", "—"],
];

export const AutoCloseTradeCases = () => (
  <section className="scroll-mt-20">
    <div className="mb-4 border-b border-border pb-2">
      <h2 className="text-xl font-semibold text-foreground">Auto-close 字段 — 两态值语法（AC-T1…AC-T5）</h2>
    </div>
    <p className="mb-6 max-w-3xl text-sm text-muted-foreground">
      字段常驻（永不卸载），值只有两态：<code>≈X¢</code> 或 <code>None</code>；瞬态（零单、加载骨架）不进值语法。
      求解器 side-aware，单一真相源 <code>estimateAutoClosePrice</code>。Standard 现货不带此字段，Pro 侧本轮不动。
    </p>

    <SubSection
      title="AC-T1…AC-T5（桌面 · 单 iframe）"
      description="持仓条三态 + 下单面板四态 + partial-net 新仓行，全部挂生产组件，值由 fixture 驱动。"
    >
      <SectionFrame device="desktop" minHeight={900} cases={CASES} />
    </SubSection>

    <div className="mt-8 space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-foreground">附注 A · 求解器契约</h3>
        <div className="overflow-x-auto rounded-md border border-border/40">
          <table className="w-full min-w-[640px] border-collapse text-left text-[11px]">
            <tbody>
              {SOLVER_ROWS.map(([k, v]) => (
                <tr key={k} className="border-t border-border/30 align-top">
                  <td className="w-40 px-2 py-1.5 font-medium text-foreground/90">{k}</td>
                  <td className="px-2 py-1.5 font-mono text-[10.5px] text-muted-foreground">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-foreground">附注 B · 面 × 态矩阵</h3>
        <div className="overflow-x-auto rounded-md border border-border/40">
          <table className="w-full min-w-[900px] border-collapse text-left text-[11px]">
            <thead>
              <tr className="bg-muted/20 text-[10px] uppercase tracking-wider text-muted-foreground/70">
                {["面", "level", "hot", "none", "瞬态", "Standard"].map((h) => (
                  <th key={h} className="px-2 py-1.5 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MATRIX_ROWS.map((r) => (
                <tr key={r[0]} className="border-t border-border/30 align-top">
                  <td className="px-2 py-1.5 font-medium text-foreground/90">{r[0]}</td>
                  {r.slice(1).map((c, i) => (
                    <td key={i} className="px-2 py-1.5 text-muted-foreground">{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
);
