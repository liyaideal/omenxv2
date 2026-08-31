import { SubSection } from "../../components/SectionWrapper";
import { SectionFrame, type SectionCase } from "../../components/SectionFrame";
import { PortfolioStatesSection } from "../PortfolioStatesSection";
import { LitePage } from "./shell";


type P = { isMobile: boolean };

const PORTFOLIO_MOBILE_CASES: SectionCase[] = [
  {
    key: "portfolio-lite-settled",
    label: "Settled 列表",
    note: "按月份分组、按月懒加载。备注只有 auto-closed 一种；提前平仓（cashout）不做任何可见标注。",
    spec: [
      { state: "settlement", when: "closeReason === 'settlement'", visual: "无备注，正常结算行", source: "resolvedGrouping" },
      { state: "auto_close", when: "closeReason === 'auto_close'", visual: "行内红字备注 auto-closed", source: "closeReason" },
      { state: "cashout", when: "closeReason === 'cashout'", visual: "与 settlement 完全一致，无备注（`cashed out early` 已废弃）", source: "closeReason" },
      { state: "系列聚合行", when: "isSeries === true", visual: "一行代表整个系列，点进系列详情而非单仓详情", source: "isSeries" },
      { state: "零结果行", when: "Math.abs(net) < 0.005", visual: "muted $0.00，不带符号", source: "isZeroMoney" },
    ],
  },
  {
    key: "portfolio-lite-settled-loadmore",
    label: "Settled 月份懒加载（Load earlier months）",
    note: "懒加载是有可见控件的：首屏只渲染最近 2 个月份组，其余靠按钮逐次追加 2 组。不是滚动自动加载，也没有 spinner。",
    spec: [
      { state: "首屏", when: "visible = 2（初始）", visual: "只渲染 groups.slice(0,2)，其余月份完全不在 DOM", source: "SettledList" },
      { state: "按钮显示", when: "visible < groups.length", visual: "列表底部整宽描边按钮 `Load earlier months`（h-40px、#2A2F38 描边）", source: "SettledList" },
      { state: "点击追加", when: "点击按钮 → visible += 2", visual: "再追加 2 个月份组，无 loading 态（数据已在本地）", source: "SettledList" },
      { state: "按钮隐藏", when: "visible ≥ groups.length", visual: "按钮不渲染，列表到底", source: "SettledList" },
    ],
  },
  {
    key: "portfolio-lite-settled-collapse",
    label: "Settled 月份折叠（移动端 + 桌面端共用）",
    note: "月份组头是可点击按钮：点一下折叠该月全部行，再点展开。默认全部展开；折叠状态不持久化，切 tab / 刷新后恢复。",
    spec: [
      { state: "月份展开（默认）", when: "collapsed 不含该 g.key", visual: "组头标签 + 行数计数 `(N)`（font-mono #6B7280/60）+ 右侧 ChevronDown 朝下，组内行正常渲染", source: "SettledList" },
      { state: "月份折叠", when: "点击组头 → collapsed 加入 g.key", visual: "ChevronDown 旋转 180°（transition 200ms），组内行完全移出 DOM；组头仍可点击", source: "SettledList" },
      { state: "懒加载新增月份", when: "Load earlier months 追加的组", visual: "默认展开，不继承折叠状态", source: "SettledList" },
    ],
  },
  {
    key: "portfolio-lite-detail-won-mobile",
    label: "单仓结算详情 · 移动（settlement + won）",
    note: "移动端为纵列：概览 → Side/Avg price/Shares/Settled price/Cost/Fees/Payout/Placed/Settled → ACTIVITY。",
    spec: [
      { state: "won", when: "closeReason === 'settlement' && outcomeWon === true", visual: "眉线 SETTLED，`Won +$X` 绿", source: "SettlementDetailVM" },
      { state: "Payout 公式", when: "始终", visual: "Payout = max(0, Cost + PnL − Fees)", source: "settlementCopy" },
    ],
  },
  {
    key: "portfolio-lite-detail-autoclosed-mobile",
    label: "单仓结算详情 · 移动（auto_close）",
    spec: [
      { state: "auto_close", when: "closeReason === 'auto_close'", visual: "眉线 CLOSED；`Closed at 25¢ · auto-closed` 整值红；时间行 label 为 Closed", source: "closeReason" },
      { state: "零回收", when: "payout === 0", visual: "Payout $0.00 → 副行 `nothing returned`", source: "settlementCopy" },
    ],
  },
  {
    key: "portfolio-lite-detail-cashout-mobile",
    label: "单仓结算详情 · 移动（cashout）",
    note: "与桌面 cashout case 同一套 fixture 数值（cost $150 / fees $1.50 / exit 48¢ / net +$42.50）。",
    spec: [
      { state: "cashout", when: "closeReason === 'cashout'", visual: "`Closed at 48¢`（无备注）；结果行只有 Won / Lost；时间行 label 为 Closed；提前平仓不做任何可见标注", source: "closeReason" },
    ],
  },
  {
    key: "portfolio-lite-detail-lost-mobile",
    label: "单仓结算详情 · 移动（settlement + lost）",
    note: "与桌面 lost case 同一套 fixture 数值（cost $100 / fees $0.90 / exit $0.00 / net −$100）。",
    spec: [
      { state: "lost", when: "closeReason === 'settlement' && outcomeWon === false", visual: "`Settled at $0.00 · Up lost`；Payout $0.00 → `nothing returned`", source: "outcomeWon" },
    ],
  },
  {
    key: "portfolio-lite-series-mobile-page",
    label: "系列详情 · 移动独立整页",
    note: "移动端选中 series 时不是内嵌面板，而是自己的一页。",
    spec: [
      {
        state: "移动系列页",
        when: "isMobile && searchParams.series != null",
        visual: "MobileHeader variant='inner' + 返回 /portfolio?tab=settled；无 brand 头 / tabs / KPI / chips",
        source: "LitePortfolio",
      },
    ],
  },
  {
    key: "portfolio-lite-empty",
    label: "空态",
    spec: [
      { state: "Live 空", when: "live.length === 0 && !isLoading", visual: "`No live calls yet` + Browse events 主按钮", source: "LitePortfolio" },
      { state: "Settled 空", when: "settled.length === 0 && !isLoading", visual: "`Nothing settled yet`，无按钮", source: "LitePortfolio" },
    ],
  },
  {
    key: "portfolio-lite-auth-gate-out",
    label: "未登录门 LiteAuthGate · 未登录",
    note: "门高度锁定：移动 min/maxHeight 420px，桌面 400px，避免大片空白模糊区。",
    spec: [
      {
        state: "未登录",
        when: "user === null",
        visual:
          "children 层 blur-[3px] + opacity-70 + pointer-events-none；上覆 bg-background/40 遮罩：Lynx 100px + 标题 `Sign in to view your portfolio` + 描述 + Sign in（btn-primary）/ Create account（描边 pill）",
        source: "useAuth().user",
      },
      {
        state: "点击任一 CTA",
        when: "authOpen === true",
        visual: "isMobile → AuthSheet；!isMobile → AuthDialog。两个按钮打开同一个入口",
        source: "useIsMobile()",
      },
    ],
  },
  {
    key: "portfolio-lite-auth-gate-in",
    label: "未登录门 LiteAuthGate · 已登录",
    spec: [
      {
        state: "已登录",
        when: "user !== null",
        visual: "门直接 return children：无模糊、无遮罩、无高度锁定",
        source: "useAuth().user",
      },
    ],
  },

  {
    key: "portfolio-lite-error",
    label: "详情页错误边界",
    spec: [
      {
        state: "详情渲染抛错",
        when: "详情子树 throw",
        visual: "降级为 `Something went wrong` + Back to settled，不白屏",
        source: "PortfolioErrorBoundary",
      },
    ],
  },

];

const PORTFOLIO_DESKTOP_CASES: SectionCase[] = [
  {
    key: "portfolio-lite-detail-won",
    label: "单仓结算详情 · 桌面（settlement + won）",
    note: "v1.17 §4b：back 链接 + 标题行 + meta + KPI 三卡 + DETAILS / ACTIVITY 双卡。",
    spec: [
      { state: "won", when: "closeReason === 'settlement' && outcomeWon === true", visual: "RESULT 卡 +$X 绿，副行 `Won · Up settled at $1.00`", source: "SettlementDetailVM" },
      { state: "Payout", when: "始终", visual: "max(0, Cost + PnL − Fees)，副行 `after $F fees`", source: "settlementCopy" },
      { state: "View event", when: "eventId != null", visual: "右上 `View event ›`，带 fromState 返回本详情页", source: "portfolioReturn" },
    ],
  },
  {
    key: "portfolio-lite-detail-autoclosed",
    label: "单仓结算详情 · 桌面（auto_close）",
    spec: [
      { state: "auto_close", when: "closeReason === 'auto_close'", visual: "眉线 CLOSED；`Closed at 25¢ · auto-closed` 整值红；时间行 label Closed", source: "closeReason" },
      { state: "零回收", when: "payout === 0", visual: "Payout $0.00 → 副行 `nothing returned`", source: "settlementCopy" },
    ],
  },
  {
    key: "portfolio-lite-detail-cashout",
    label: "单仓结算详情 · 桌面（cashout）",
    spec: [
      {
        state: "cashout",
        when: "closeReason === 'cashout'",
        visual: "`Closed at 48¢`（无备注），结果行只有 Won / Lost；时间行 label Closed；提前平仓不做可见标注",
        source: "closeReason",
      },
    ],
  },
  {
    key: "portfolio-lite-detail-lost",
    label: "单仓结算详情 · 桌面（settlement + lost）",
    spec: [
      {
        state: "lost",
        when: "closeReason === 'settlement' && outcomeWon === false",
        visual: "`Settled at $0.00 · Up lost`；Payout $0.00 → `nothing returned`",
        source: "outcomeWon",
      },
    ],
  },
  {
    key: "portfolio-lite-series-detail",
    label: "系列结算详情 · 桌面",
    note: "§4d：Net = Payout − Cost（费后）。",
    spec: [
      { state: "眉线", when: "始终", visual: "`SERIES · WON {wins} OF {rounds.length}`", source: "SeriesDetailVM" },
      { state: "轮次行", when: "rounds[]", visual: "每轮一行，可点进该轮单仓详情", source: "SeriesDetail" },
      { state: "auto-closed 轮", when: "round.autoClosed === true", visual: "该行追加红字 auto-closed", source: "round.autoClosed" },
    ],
  },
  {
    key: "portfolio-lite-series-extremes",
    label: "系列两极 + Standard/Boost 口径",
    spec: [
      { state: "全胜", when: "wins === rounds.length", visual: "`WON 2 OF 2`，Net 正", source: "SeriesDetailVM" },
      { state: "全败", when: "wins === 0", visual: "`WON 0 OF 2`，Payout $0.00", source: "SeriesDetailVM" },
      { state: "非日轮", when: "isDailyRounds === false", visual: "轮次文案改为按日期而非 Day n；segmentLabel 显示 Boost", source: "isDailyRounds" },
    ],
  },
];


const PortfolioLegacyCases = () => (
  <>
    <div className="rounded-md border border-trading-yellow/25 bg-trading-yellow/5 px-3 py-2 text-xs leading-5 text-trading-yellow">
      ⚠️ 以下为旧版节 —— 已被上方 PF 编号分区逐步接管，仅作并账基线保留，<strong>不可作为研发规格</strong>。已迁移的模块请看上方对应 PF 编号；本节将在 M6b 并账完成后整体删除。
    </div>
    {/* ── 以下为旧版节（并账后删除）── */}
    <SubSection
      title="移动端全状态（375 · 单 iframe）"
      description="整节移动端案例合并在一个 375px iframe 里按顺序纵向排列，每段上方有 label 分隔线；下方按 case 给出触发条件表。本 frame 内只有移动端组件。"
    >
      <SectionFrame device="mobile" minHeight={900} cases={PORTFOLIO_MOBILE_CASES} />
    </SubSection>

    <SubSection
      title="桌面端全状态（单 iframe）"
      description="整节桌面端案例合并在一个桌面宽 iframe 里，且只包含桌面组件（双端对照请对照上方移动 frame）。3 列 KPI、行式网格与结算详情只在桌面宽度成立。"
    >
      <SectionFrame device="desktop" minHeight={900} cases={PORTFOLIO_DESKTOP_CASES} />
    </SubSection>
  </>
);

export const LitePortfolioPage = ({ isMobile }: P) => (
  <LitePage
    id="lite-portfolio"
    title="Portfolio"
    route="/portfolio · /portfolio?tab=settled · /portfolio/settlement/:id"
    status="done"
    note="本页 = 产品页 /portfolio 的状态字典 · 样式与布局看生产页，状态与判定看本页。"
  >
    <div className="space-y-1 rounded-lg border border-[#CFFF4A]/30 bg-[#CFFF4A]/5 px-3 py-2 text-[12px] text-foreground">
      <div>
        本页 = 产品页 <code className="font-mono">/portfolio</code> 的状态字典 ·
        样式与布局 → 生产页；状态与判定 → 本页
      </div>
      <div>
        字段名 / 文案 / 公式 / 术语 → <code className="font-mono">docs/copy-dictionary.md</code>（顶部有 Lite 术语对照表）
      </div>
      <div>
        流程 / 口径 / 前后端分工 → <code className="font-mono">docs/delivery/lite-portfolio-spec-v2.md</code>
      </div>
    </div>

    <PortfolioStatesSection />

    {/* ── 以下为旧版节（并账后删除）── */}
    <PortfolioLegacyCases />
  </LitePage>
);

