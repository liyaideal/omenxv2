import { SubSection } from "../../components";
import { SectionFrame, type SectionCase } from "../../components/SectionFrame";
import { PortfolioStatesSection } from "../PortfolioStatesSection";
import { LitePage } from "./shell";


type P = { isMobile: boolean };

const PORTFOLIO_MOBILE_CASES: SectionCase[] = [
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
      { state: "settles 时间 · 今天", when: "settlesAt 与 now 同年同月同日", visual: "`settles today 16:00`（24 小时制、用户本地、无时区标）", source: "settleLabel()" },
      { state: "settles 时间 · 同年异日", when: "settlesAt.getFullYear() === now.getFullYear() 且非同日", visual: "`settles Aug 21 16:00`", source: "settleLabel()" },
      { state: "settles 时间 · 跨年", when: "settlesAt.getFullYear() !== now.getFullYear()", visual: "`settles Jan 12, 2027`（不带钟点）", source: "settleLabel()" },
      { state: "settles 缺失", when: "settlesAt == null", visual: "meta 行不出现 settles 段（不画 `—` 占位）", source: "LiveCards.metaLine" },
      { state: "Cash out 点击", when: "点击卡内 Cash out 按钮", visual: "无确认弹层、无中间态：直接 navigate(row.tradePath) 进入该市场交易页；平仓在交易页完成", source: "LitePortfolio onCashOut" },
      { state: "SIDE chip · Yes/Up 腿", when: "row.side === 'yes'", visual: "chip 底 #33D6FF（Pulse Blue）黑字；文案 `{sideWord} {c}¢`", source: "resolveLegSide().side · DESIGN §2 Market Axis" },
      { state: "SIDE chip · No/Down 腿", when: "row.side === 'no'（含 type==='short' 翻转）", visual: "chip 底 #CFFF4A（Volt）黑字", source: "resolveLegSide().side · DESIGN §2 Market Axis" },
      { state: "多选腿 · 选项名第二行", when: "row.optionName != null", visual: "chip 正下方 11.5px #E5E7EB 选项名（桌面左对齐 / 移动右对齐），二元与别名腿无此行", source: "resolveLegSide().optionName" },
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
    key: "portfolio-lite-live-select",
    label: "Live 多选批量平仓（移动端 + 桌面端共用）",
    note: "Boost/Standard chips 行右侧 `Select` 进入选择模式（不单独占行）：行内圆形勾选点、单行 Cash out / 分享隐藏、点整卡整行切换选中。选择模式下工具条 Select all / Clear / N selected / Cancel 同样内联在 chips 行右侧；吸底动作条汇总并 `Cash out N`；确认层桌面 Dialog / 移动 MobileDrawer，串行逐仓平仓。选择状态不持久化，切 tab / segment / 完成即清空。",
    spec: [
      { state: "非选择模式（默认）", when: "selectMode === false", visual: "行 DOM 与原来完全一致（无勾选列）；`Select`（12.5px Pulse）入口在 chips 行右侧", source: "LiveCards / LitePortfolio" },
      { state: "选择模式 · 未选中", when: "selectMode && !selected", visual: "行首圆形空勾选点（18px，#2A2F38 描边）；单行 Cash out 与分享隐藏；点击整行 = 选中", source: "CheckDot / LiveCard / LiveRow" },
      { state: "选择模式 · 已选中", when: "selectMode && selected", visual: "勾选点 Pulse 填充打勾；行 Pulse 描边/左竖条 + 淡蓝底（hot 行红轴优先）", source: "LiveCard / LiveRow" },
      { state: "工具条", when: "selectMode", visual: "内联 chips 行右侧：`Select all`（Pulse）/ `Clear` / `N selected`（font-mono）/ `Cancel`；<sm 窄屏隐藏 `Clear` 与计数（计数由动作条承担），只留 `Select all` / `Cancel`", source: "SelectToolbar" },
      { state: "动作条（N≥1）", when: "selectedRows.length > 0", visual: "fixed 贴底圆角条（移动端钉在 BottomNav（实测 77px 高，含 1px border）上方 bottom-[84px]（留 7px 呼吸缝），桌面 lg:bottom-4，内层 max-w-7xl px-4 lg:px-6 与页容器对齐；页面流内同步渲染 h-[76px] 占位防遮末行）：`N selected` + `Now worth $X · Profit ±$Y` + 主按钮 `Cash out N`；N=0 不渲染", source: "BatchActionBar / LitePortfolio" },
      { state: "确认层", when: "点击动作条按钮", visual: "桌面 Dialog / 移动 MobileDrawer（§5.1 规范）：标题 `Cash out N positions`；正文 `space-y-4`，卡片 `rounded-lg border bg-muted/30 p-3` 内行距 `space-y-1.5`，逐行 `{event} · {side} · {now worth}`（值 font-mono）+ `You get about` 合计 + 免责句；灰色一律 `text-muted-foreground`", source: "BatchCashOutConfirm" },
      { state: "确认层按钮", when: "提交型 + 不可逆", visual: "移动端 `MobileDrawerActions className=\"flex gap-2 space-y-0\"`；Cancel(outline h-11 flex-1) + `Cash out`（destructive 红 `bg-trading-red text-white hover:bg-trading-red/90`，h-11 flex-1）；桌面 Dialog 共用同一 Actions 组件，同样红钮", source: "Actions / MobileDrawerActions" },
      { state: "执行中", when: "确认后串行 closePosition", visual: "主按钮禁点并显示 `Closing i / N…`，Cancel 禁用", source: "LitePortfolio.closeBatch" },
      { state: "结果", when: "全部 / 部分失败", visual: "汇总 toast：全成 `Cashed out N positions`；部分失败 `Cashed out K of N — M failed, still open below`；全败 `Couldn't cash out — please try again`", source: "LitePortfolio.closeBatch" },
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
  {
    key: "portfolio-lite-airdrop-tag-cards",
    label: "Live 行标枚举 · 移动 LiveCard（none / Voucher / Airdrop）",
    note: "行标枚举 airdropTag：来源标只有三种取值，matched 与 welcome_gift 两种空投来源共用同一个 pulse `Airdrop` 标，不再细分来源。示例三行依次为 none / voucher / airdrop。",
    spec: [
      { state: "无标", when: "airdropTag === 'none'", visual: "meta 行尾不追加任何来源标（不画占位）", source: "useLitePortfolio.airdropTag" },
      { state: "Voucher 标", when: "airdropTag === 'voucher'（airdropSource === 'voucher'）", visual: "meta 行尾 volt #CFFF4A 文案 `Voucher`", source: "LiveCards VOLT" },
      { state: "Airdrop 标", when: "airdropTag === 'airdrop'（airdropSource ∈ {matched, welcome_gift}）", visual: "meta 行尾 pulse #33D6FF 文案 `Airdrop`", source: "LiveCards PULSE" },
      { state: "待激活空投", when: "airdrop.status === 'pending'", visual: "不进 portfolio —— 仍住 /rewards/campaign/h2e 的 Airdropped positions 模块；激活开仓后才作为 airdropTag='airdrop' 的 Live 行出现", source: "DESIGN §运营工具仓位归属" },
    ],
  },

  {
    key: "autoclose-mobile-cards",
    label: "AC-P3 · 移动卡 · 三态句式",
    note: "auto-close 字段常驻，值只有两态。三张卡逐字对照 mock7 v2 §2：level / hot（红描边 + 红句）/ none。",
    spec: [
      { state: "level", when: "segment === 'boost' && autoClose.kind === 'level' && hot === false", visual: "句尾 `If it wins you get $1,670.00 · auto-close ≈2¢`", source: "LiveCards.LiveCard" },
      { state: "hot", when: "hot === true（|mark − level| / mark ≤ 10%）", visual: "整卡红描边 + 红句 `If it wins you get $259.00 · auto-close ≈89¢`", source: "isAutoCloseHot" },
      { state: "none", when: "autoClose.kind === 'none'（含 boost ≤ 1）", visual: "`If it wins you get $464.00 · no auto-close, loss capped`", source: "estimateAutoClosePrice" },
      { state: "加载中", when: "数据未到达", visual: "骨架占位，不是值语法", source: "useLitePortfolio.isLoading" },
    ],
  },
];

const PORTFOLIO_DESKTOP_CASES: SectionCase[] = [
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
      { state: "SIDE chip · Yes/Up 腿", when: "row.side === 'yes'", visual: "chip 底 #33D6FF（Pulse Blue）黑字；文案 `{sideWord} {c}¢`", source: "resolveLegSide().side · DESIGN §2 Market Axis" },
      { state: "SIDE chip · No/Down 腿", when: "row.side === 'no'（含 type==='short' 翻转）", visual: "chip 底 #CFFF4A（Volt）黑字", source: "resolveLegSide().side · DESIGN §2 Market Axis" },
      { state: "多选腿 · 选项名第二行", when: "row.optionName != null", visual: "chip 正下方 11.5px #E5E7EB 选项名（桌面左对齐 / 移动右对齐），二元与别名腿无此行", source: "resolveLegSide().optionName" },
    ],
  },
  {
    key: "portfolio-lite-pending-desktop",
    label: "桌面挂单行（折叠 / 展开两态）",
    note: "桌面与移动共用同一个 PendingOrdersRow：桌面挂在行式网格下方（px-4 pt-3），且只在 segment === 'boost' 时渲染。展开态是生产实态，不是移动独有。",
    spec: [
      { state: "折叠（默认）", when: "orders.length > 0 && open === false", visual: "虚线描边行（1px dashed #2A2F38）`n orders waiting to fill · placed in Pro` + 右侧 ›", source: "PendingOrdersRow" },
      { state: "展开", when: "点击折叠行 → open === true", visual: "行下逐单展开：左事件名 truncate、右 `size @ price` 等宽字 + ›，hover 底 rgba(255,255,255,.04)", source: "PendingOrdersRow" },
      { state: "点单跳 Pro", when: "点击任一单行", visual: "savePortfolioScroll() → setSurface('pro') → /trade?event={eventId}；改单/撤单只在 Pro 存在。返回时回到 Lite portfolio 原位", source: "savePortfolioReturnSurface('lite')" },
      { state: "无单", when: "orders.length === 0", visual: "组件 return null，桌面同样不占高度", source: "PendingOrdersRow" },
      { state: "Standard 段", when: "segment === 'standard'", visual: "整个挂单行不渲染（只有 Boost 段挂）", source: "LitePortfolio" },
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
  {
    key: "portfolio-lite-airdrop-tag-rows",
    label: "Live 行标枚举 · 桌面 LiveRow（none / Voucher / Airdrop）",
    note: "行标枚举 airdropTag：来源标只有三种取值，matched 与 welcome_gift 两种空投来源共用同一个 pulse `Airdrop` 标，不再细分来源。示例三行依次为 none / voucher / airdrop。",
    spec: [
      { state: "无标", when: "airdropTag === 'none'", visual: "meta 行尾不追加任何来源标（不画占位）", source: "useLitePortfolio.airdropTag" },
      { state: "Voucher 标", when: "airdropTag === 'voucher'（airdropSource === 'voucher'）", visual: "meta 行尾 volt #CFFF4A 文案 `Voucher`", source: "LiveCards VOLT" },
      { state: "Airdrop 标", when: "airdropTag === 'airdrop'（airdropSource ∈ {matched, welcome_gift}）", visual: "meta 行尾 pulse #33D6FF 文案 `Airdrop`", source: "LiveCards PULSE" },
      { state: "待激活空投", when: "airdrop.status === 'pending'", visual: "不进 portfolio —— 仍住 /rewards/campaign/h2e 的 Airdropped positions 模块；激活开仓后才作为 airdropTag='airdrop' 的 Live 行出现", source: "DESIGN §运营工具仓位归属" },
    ],
  },
  {
    key: "autoclose-desktop-rows",
    label: "AC-P1 · 桌面行 · 三态同列（level / hot / none · 含 1×）",
    note: "四行逐字对照 mock7 v2 §1：① Fed decision in September?（2× Boost）② NVIDIA $4T（5× Boost, hot）③ Lakers 2026 NBA Finals?（2× Boost, none）④ Which film tops the 2026 worldwide box office?（1× Boost, none）。日期为相对 fixture，避免 settleLabel 过期。",
    spec: [
      { state: "level", when: "segment === 'boost' && autoClose.kind === 'level' && hot === false", visual: "`If it wins → $1,670.00 · auto-close ≈2¢`", source: "LiveCards.LiveRow" },
      { state: "hot", when: "hot === true", visual: "整行红轨（inset 左边框）+ 红字 `· auto-close ≈89¢`", source: "isAutoCloseHot" },
      { state: "none", when: "autoClose.kind === 'none'", visual: "`· auto-close none`，none 为内联灰 #4d5560 小写，悬停 tooltip 全句", source: "estimateAutoClosePrice" },
      { state: "none · 1× Boost", when: "leverageNum === 1（boost ≤ 1 恒 none）", visual: "同 none 分支；无借贷敞口，亏损封顶本金", source: "autoClosePrice boost ≤ 1" },
    ],
  },
  {
    key: "autoclose-standard-row",
    label: "AC-P2 · Standard 行 · 无 auto-close 段",
    note: "Standard 段不携带该字段：列内只有 `If it wins → $X`，不追加 auto-close 段（不是显示 None）。",
    spec: [
      { state: "Standard", when: "segment === 'standard'", visual: "该列只有 `If it wins → $316.00`", source: "LiveCards.LiveRow" },
    ],
  },
];


const PortfolioLegacyCases = () => (
  <>
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

