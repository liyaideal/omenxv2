// ============================================================
// 晒单分享 — SH-1…SH-8（SH-b §4）。海报出图口径 400px 恒定，双帧同卡。
// ============================================================
import { SubSection } from "../../components";
import { SectionFrame, type SectionCase } from "../../components/SectionFrame";

const POSTER_SOURCE = "LitePnlPoster（fixture 驱动，生产由 LiteShareFlow 传值）";

const POSTERS: SectionCase[] = [
  {
    key: "share-sh1",
    label: "SH-1 · 海报 · live 盈",
    note: "mock12 卡 A 组（+$13.89 / +28.7% / $48.41 → $62.30）。chip `LIVE CALL` · 徽章 `⚡ Winning!` · PnL 标签 `Profit so far` · 趣味文案 `✨ Well played!`（0 ≤ pnlPercent < 50 档）。",
    spec: [
      { state: "chip", when: "state === 'live'", visual: "`LIVE CALL`", source: POSTER_SOURCE },
      { state: "徽章", when: "pnl >= 0 && state === 'live'", visual: "`⚡ Winning!`", source: POSTER_SOURCE },
      { state: "PnL 标签", when: "pnl >= 0 && state === 'live'", visual: "`Profit so far`", source: POSTER_SOURCE },
      { state: "趣味文案", when: "0 <= pnlPercent < 50", visual: "`✨ Well played!`（本 case 命中档）", source: POSTER_SOURCE },
    ],
  },
  {
    key: "share-sh2",
    label: "SH-2 · 海报 · live 亏（sports 别名腿）",
    note: "卡 C 组：sports sideLine `ULS +1.5`（V6 语法）。chip `LIVE CALL` · 徽章 `💀 RIP` · PnL 标签 `Lost` · 趣味文案 `📉 We go again!`（−50 < pnlPercent < 0 档）。",
    spec: [
      { state: "sideLine", when: "sports 别名腿", visual: "`ULS +1.5`（不拼 Yes/No）", source: POSTER_SOURCE },
      { state: "徽章", when: "pnl < 0", visual: "`💀 RIP`", source: POSTER_SOURCE },
      { state: "PnL 标签", when: "pnl < 0", visual: "`Lost`（数值取绝对值）", source: POSTER_SOURCE },
      { state: "趣味文案", when: "-50 < pnlPercent < 0", visual: "`📉 We go again!`（本 case 命中档）", source: POSTER_SOURCE },
      { state: "主题", when: "pnl < 0", visual: "lose 主题色（posterThemes）", source: "getThemeForResult" },
    ],
  },
  {
    key: "share-sh3",
    label: "SH-3 · 海报 · cashed 盈",
    note: "卡 A 组同数值。chip = 日期 `Aug 28, 2026` · 徽章 `⚡ Winner!` · PnL 标签 `Profit` · 趣味文案 `✨ Well played!`（+28.7%）。",
    spec: [
      { state: "chip", when: "state !== 'live'", visual: "format(dateISO, 'MMM d, yyyy')", source: POSTER_SOURCE },
      { state: "徽章", when: "pnl >= 0 && state !== 'live'", visual: "`⚡ Winner!`", source: POSTER_SOURCE },
    ],
  },
  {
    key: "share-sh4",
    label: "SH-4 · 海报 · cashed 亏",
    note: "卡 C 组同数值（−$18.20 / −45.5% / $40.00 → $21.80）。chip = 日期 · 徽章 `💀 RIP` · PnL 标签 `Lost` · 趣味文案 `📉 We go again!`。",
    spec: [
      { state: "徽章", when: "pnl < 0", visual: "`💀 RIP`", source: POSTER_SOURCE },
      { state: "趣味文案", when: "-50 < pnlPercent < 0", visual: "`📉 We go again!`", source: POSTER_SOURCE },
    ],
  },
  {
    key: "share-sh5",
    label: "SH-5 · 海报 · settled 盈（Standard 词条）",
    note: "卡 D 组：sideLine `Up · Standard`（V7 词条）· +$48.41 / +100.0% / $48.41 → $96.82。chip 用结算日；趣味文案 `🔥 Absolute legend!`（pnlPercent ≥ 100 档）。",
    spec: [
      { state: "chip", when: "state === 'settled'", visual: "结算日期", source: POSTER_SOURCE },
      { state: "sideLine", when: "现货 Standard 仓", visual: "`Up · Standard`", source: POSTER_SOURCE },
      { state: "趣味文案", when: "pnlPercent >= 100", visual: "`🔥 Absolute legend!`（本 case 命中档）", source: POSTER_SOURCE },
      { state: "右值", when: "state === 'settled'", visual: "Paid out = markPrice × size", source: "LiteContractTrade.OutcomeCard" },
    ],
  },
  {
    key: "share-sh6",
    label: "SH-6 · 海报 · settled 亏（Paid out $0.00）",
    note: "输侧派彩为 0：右值 `$0.00`，Lost = 本金 $40.00，pnlPercent = −100。趣味文案 `😭 That's rough buddy...`（pnlPercent ≤ −50 档）。`💰 Nice gains!` 档（50 ≤ pnlPercent < 100）阈值记录于此：六案数值组未覆盖该档，表内注明。",
    spec: [
      { state: "Paid out", when: "outcomeWon === false", visual: "`$0.00`", source: "LiteOutcomeCard.holding.paidOut" },
      { state: "Lost", when: "outcomeWon === false", visual: "= putIn", source: "LiteOutcomeCard.holding.profit" },
      { state: "趣味文案", when: "pnlPercent <= -50", visual: "`😭 That's rough buddy...`（本 case 命中档）", source: POSTER_SOURCE },
      { state: "趣味文案（阈值）", when: "50 <= pnlPercent < 100", visual: "`💰 Nice gains!`（无 fixture 命中，仅阈值登记）", source: POSTER_SOURCE },
    ],
  },
];

const HOSTS: SectionCase[] = [
  {
    key: "share-sh7",
    label: "SH-7 · ShareModal 弹窗本体（内嵌 SH-3 卡）",
    note: "纯展示挂载：`isOpen` 固定 true、`onClose` 空函数、`isDataReady=false` 关掉出图副作用。ShareModal 用 createPortal 挂到 iframe 自身 document.body，双帧各自独立。",
    spec: [
      { state: "主按钮", when: "始终", visual: "`More Options` = Volt #CFFF4A 底", source: "ShareModal（SH-a §3）" },
      { state: "四宫格", when: "始终", visual: "`rounded-xl` + `border border-border`", source: "ShareModal" },
      { state: "出图", when: "isDataReady === false", visual: "不触发 html-to-image（字典口径）", source: "ShareModal.useEffect" },
    ],
  },
  {
    key: "share-sh8",
    label: "SH-8 · 入口态样张 · LitePositionCard 头行",
    note: "上帧传 onShare（头行右侧 28px ghost Share2，hover #33D6FF）；下帧不传 = 生产默认，DOM 与改前逐字一致。",
    spec: [
      { state: "有入口", when: "typeof onShare === 'function'", visual: "头行右侧 28px ghost icon（aria-label=\"Share\"）", source: "LitePositionCard + ShareIconButton" },
      { state: "无入口", when: "onShare === undefined", visual: "零变化（不渲染任何按钮、不改头行结构）", source: "LitePositionCard（红线）" },
      { state: "In review", when: "cashOutDisabledText 存在", visual: "Cash out 禁用，share icon 照常可点", source: "LiteContractTrade" },
    ],
  },
];

export const ShareCases = () => (
  <section className="scroll-mt-20">
    <div className="mb-4 border-b border-border pb-2">
      <h2 className="text-xl font-semibold text-foreground">分享（SH-1…SH-8）</h2>
    </div>
    <p className="mb-6 max-w-3xl text-sm text-muted-foreground">
      Lite 晒单卡 <code>LitePnlPoster</code> 三态 × 盈亏两向 + 弹窗本体 + 入口态样张。
      海报出图口径 400px 恒定（双帧同卡，不随断点缩放）。卡上严禁出现 Leverage/杠杆字样与 voucher 徽标；
      guest 永不晒单（<code>LiteShareFlow</code> 在 <code>!user</code> 时返回 null）。
    </p>

    <SubSection
      title="SH-1…SH-6 · 海报三态 × 盈亏"
      description="固定 400px；chip / 徽章 / PnL 标签 / 趣味文案阈值全部见每个 case 的 spec 表。"
    >
      <div className="space-y-4">
        <SectionFrame device="desktop" minHeight={620} cases={POSTERS} />
        <SectionFrame device="mobile" minHeight={620} cases={POSTERS} />
      </div>
    </SubSection>

    <SubSection
      title="SH-7…SH-8 · 弹窗与入口"
      description="ShareModal 纯展示挂载；入口态与无入口态上下对照。"
    >
      <div className="space-y-4">
        <SectionFrame device="desktop" minHeight={620} cases={HOSTS} />
        <SectionFrame device="mobile" minHeight={620} cases={HOSTS} />
      </div>
    </SubSection>
  </section>
);

export default ShareCases;
