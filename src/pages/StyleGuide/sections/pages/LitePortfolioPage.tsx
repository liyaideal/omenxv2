import { SubSection } from "../../components";
import { SectionFrame, type SectionCase } from "../../components/SectionFrame";
import { LitePage } from "./shell";

type P = { isMobile: boolean };

const PORTFOLIO_MOBILE_CASES: SectionCase[] = [
  {
    key: "portfolio-lite-chrome",
    label: "Tabs · voucher 发丝行 · 双段 chips",
    note: "开场 chrome：Live / Settled 两 tab + voucher 发丝行 + Boost/Standard 双段 chips。",
    spec: [
      {
        state: "voucher 发丝行 · 显示",
        when: "voucherCount > 0",
        visual: "tabs 下一条 volt 发丝行，文案带券数",
        source: "VoucherHairline",
      },
      {
        state: "voucher 发丝行 · 隐藏",
        when: "voucherCount === 0",
        visual: "整行不渲染（不是占位空行）",
        source: "VoucherHairline",
      },
      {
        state: "chips 有计数",
        when: "boostLive.length > 0 || standardLive.length > 0",
        visual: "chip 文案后跟计数；选中 chip volt 底",
        source: "SegmentChips",
      },
      {
        state: "chips 计数为 0",
        when: "对应 segment 数组为空",
        visual: "chip 仍渲染并可点，计数显示 0",
        source: "SegmentChips",
      },
    ],
  },
  {
    key: "portfolio-lite-kpi-mobile",
    label: "KPI 卡 · 移动（Live 正 / Live 负 / 零态 / Settled 2 卡）",
    note: "移动端一律 2 列；3 列口径只在桌面成立（见桌面 frame）。KPI 永远是全账户口径，segment chips 不影响它。",
    spec: [
      { state: "Live 盈利", when: "profitTotal > 0.005", visual: "PROFIT 值 +$X，volt/green 色", source: "useLitePortfolio.kpi" },
      { state: "Live 亏损", when: "profitTotal < −0.005", visual: "PROFIT 值 −$X，红色", source: "useLitePortfolio.kpi" },
      {
        state: "零态",
        when: "Math.abs(value) < 0.005（isZeroMoney）",
        visual: "$0.00，不带 +/− 符号、不上色（muted）",
        source: "isZeroMoney",
      },
      { state: "Settled 移动 2 卡", when: "tab === 'settled' && 移动宽度", visual: "WIN RATE / NET PROFIT 两卡", source: "LitePortfolio" },
    ],
  },
  {
    key: "portfolio-lite-gauge-states",
    label: "Boost check 仪表三态",
    note: "口径：riskRatio = imTotal / equity × 100，账户级跨仓（不是单仓）；untilAutoClose = equity − imTotal。仪表只在账户存在 Boost 持仓时渲染，Standard-only 账户完全不画。",
    spec: [
      { state: "Healthy", when: "riskRatio < 80", visual: "绿字 Healthy + 绿色进度条", source: "boostState()" },
      { state: "Getting tight", when: "80 ≤ riskRatio < 95", visual: "琥珀字 Getting tight + 琥珀条", source: "boostState()" },
      { state: "Auto-close soon", when: "riskRatio ≥ 95", visual: "红字 Auto-close soon + 红条", source: "boostState()" },
      { state: "不渲染", when: "boostLive.length === 0", visual: "整张 Boost check 卡不出现", source: "LitePortfolio" },
    ],
  },
  {
    key: "portfolio-lite-live-cards",
    label: "持仓卡全状态 + 挂单行两态",
    note: "发红只有一个来源：hot。hot 与盈亏正负无关 —— 亏损但离 auto-close 还远的卡不红，盈利但贴近 auto-close 的卡也会红。",
    spec: [
      {
        state: "常规卡（不红）",
        when: "hot === false",
        visual: "卡片无描边；payout 句 #6B7280",
        source: "live[].hot",
      },
      {
        state: "热卡（整句发红）",
        when: "autoClosePrice != null && Math.abs(priceNow − autoClosePrice) / priceNow ≤ 0.10",
        visual: "卡片 1px solid rgba(255,92,92,.55)；payout 整句 RED（桌面行为 inset 3px 红左轨 + rgba(255,92,92,.04) 底）",
        source: "useLitePortfolio.hot",
      },
      {
        state: "追加 auto-close 后缀",
        when: "segment === 'boost' && leverageNum > 1 && autoCloseState === 'level' && autoClosePrice != null",
        visual: "主句后追加 ` · auto-close ≈{cents}`",
        source: "autoCloseState",
      },
      {
        state: "无后缀",
        when: "segment === 'standard' || autoCloseState === 'none' || autoCloseState === 'missing'",
        visual: "只有 `If it wins you get $X`，不画 `auto-close —` 占位",
        source: "autoCloseState",
      },
      { state: "voucher 行", when: "isVoucher === true", visual: "meta 行尾追加 volt 色 `Voucher`", source: "airdropSource === 'voucher'" },
      { state: "挂单行 · 有单", when: "orders.length > 0", visual: "虚线折叠行 `n orders waiting to fill · placed in Pro`，点开跳 Pro", source: "PendingOrdersRow" },
      { state: "挂单行 · 无单", when: "orders.length === 0", visual: "组件 return null，不占高度", source: "PendingOrdersRow" },
    ],
  },
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
    key: "portfolio-lite-kpi-desktop",
    label: "KPI 卡 · 桌面（Live 3 卡 · Settled 3 卡 + RECORD）",
    note: "3 列 KPI 只在桌面宽度成立，移动端强制 2 列（见移动 frame）。",
    spec: [
      { state: "Live 桌面", when: "tab === 'live' && ≥ md", visual: "COST / NOW WORTH / PROFIT 三卡", source: "LitePortfolio" },
      { state: "Settled 桌面", when: "tab === 'settled' && ≥ md", visual: "WIN RATE / NET PROFIT / RECORD 三卡，RECORD 格式 `7W 5L`", source: "LitePortfolio" },
      { state: "零态", when: "Math.abs(value) < 0.005", visual: "muted $0.00，无符号", source: "isZeroMoney" },
    ],
  },
  {
    key: "portfolio-lite-gauge-bar",
    label: "Boost check 条（桌面）",
    note: "与移动仪表同一套阈值与口径，只是排布为行内条。",
    spec: [
      { state: "Healthy", when: "riskRatio < 80", visual: "绿条", source: "boostState()" },
      { state: "Getting tight", when: "80 ≤ riskRatio < 95", visual: "琥珀条", source: "boostState()" },
      { state: "Auto-close soon", when: "riskRatio ≥ 95", visual: "红条", source: "boostState()" },
    ],
  },
  {
    key: "portfolio-lite-desktop-rows",
    label: "桌面行式网格（含 voucher 行 / 热行 / 零盈亏行）",
    note: "列模板：minmax(0,1fr) minmax(110px,200px) 96px 104px 100px 150px 170px。",
    spec: [
      {
        state: "热行",
        when: "hot === true（|priceNow − autoClosePrice| / priceNow ≤ 0.10）",
        visual: "inset 3px 0 0 rgba(255,92,92,.7) 左轨 + rgba(255,92,92,.04) 底 + payout 列整句 RED",
        source: "live[].hot",
      },
      {
        state: "AUTO-CLOSE / IF WINS 列",
        when: "始终显示主句；autoCloseState === 'level' 时追加",
        visual: "`If it wins → $X`，有价才追加 `· auto-close ≈{cents}`",
        source: "LiveRow",
      },
      { state: "voucher 行", when: "isVoucher === true", visual: "CALL 列 meta 尾部 volt `Voucher`", source: "airdropSource" },
      { state: "零盈亏行", when: "Math.abs(profit) < 0.005", visual: "PROFIT 列 muted $0.00", source: "isZeroMoney" },
      { state: "Side chip 溢出", when: "sideWord 过长", visual: "chip truncate + hover tooltip 显示全文", source: "LiveRow" },
    ],
  },
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

const READ_ME =
  "怎么读这一节：所有状态都由 useLitePortfolio 派生的字段驱动（segment / isVoucher / autoCloseState / hot / closeReason / isSeries / isZeroMoney）。每个 case 下方的表给出「触发条件 → 视觉结果 → 字段来源」，条件都是可判定表达式，可直接照抄进实现；表里没有列出的组合视为不存在，不要自行发挥。";

export const LitePortfolioPage = ({ isMobile }: P) => (
  <LitePage
    id="lite-portfolio"
    title="Portfolio"
    route="/portfolio · /portfolio?tab=settled · /portfolio/settlement/:id"
    status="done"
    note="2026-08-19 改版：Live / Settled 两 tab（Rewards 开场 tab 制式），KPI 卡、voucher 发丝行、Boost/Standard 双段 chips、Boost check 仪表、持仓卡 / 桌面行式网格、结算月份分组与系列聚合行。以下全部挂载生产组件（fixture 数据驱动状态），非手抄。"
  >
    <div className="rounded-lg border border-border/40 bg-muted/10 p-3 text-[11px] leading-relaxed text-muted-foreground">
      {READ_ME}
    </div>

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
  </LitePage>
);
