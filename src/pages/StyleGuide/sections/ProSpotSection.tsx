// Pro /spot terminal — state dictionary (SP-1 · B3).
// Every case mounts the production components (ProSpotPanel / ProSpotOrderPreview /
// ProTerminalLayout). Nothing here is hand-drawn.
import { SurfaceSwitchSection } from "./MobilePatternsSection";
import { SectionWrapper } from "../components/SectionWrapper";
import { SectionFrame, type SectionCase } from "../components/SectionFrame";

const PANEL_CASES: SectionCase[] = [
  {
    key: "pro-spot-panel-buy-market",
    label: "SP-B1 · Buy · Market（ProSpotPanel）",
    note: "面板唯一整宽选择器是 BinarySideToggle；Buy/Sell 为文字页签，订单类型收进右上角下拉。滑点 chip 选中态为中性 bg-muted text-foreground font-medium，禁止 trading-purple。",
    spec: [
      {
        state: "Buy · Market",
        when: 'side === "buy" && orderType === "Market"',
        visual: "汇总为 Cost / Est. fill @ x.xx / Shares / Fee (0.15%) / To win ⓘ，末行用上边线强调，无 Max loss",
        source: "ProSpotPanel props（SpotTrading 计算）",
      },
    ],
  },
  {
    key: "pro-spot-panel-buy-limit",
    label: "SP-B2 · Buy · Limit",
    spec: [
      {
        state: "Limit 价格输入",
        when: 'orderType === "Limit"',
        visual: "多出 Limit price 输入（USD，4 位小数）；隐藏 Max slippage 与 Est. fill 行",
        source: "ProSpotPanel.orderType",
      },
    ],
  },
  {
    key: "pro-spot-panel-sell-limit",
    label: "SP-B2b · Sell · Limit（持 40.512 shares，挂 20 shares）",
    spec: [
      { state: "Sell · Limit", when: 'side === "sell" && orderType === "Limit"', visual: "Limit price 输入（默认 mark）；卖出限价 > mark → Pending（份额**不锁定**：下单时校验持有 ≥ 数量，成交时再校验，不够则该单自动 Cancelled），mark 涨到 ≥ 限价时按限价成交、`Limit sell filled · $X to wallet` toast；撤单不退钱（没扣过）", source: "ProSpotPanel.orderType · useSpotTerminal（placeSpotLimitOrder / fillSpotLimitOrder）" },
    ],
  },
  {
    key: "pro-spot-panel-buy-shares",
    label: "SP-B1b · Buy · Shares 模式（QO-1）",
    note: "按数量下单：Amount 输入框的后缀本身是单位下拉 `USDC ▾ / Shares ▾`（不加独立切换图标、不加行）。Shares 模式下输入的是份额，Cost = 份额 × 预计成交价，滑杆 100% = 可用 ÷ 价格；切回 USDC 时把当前份额换算成金额带过去。模式按设备记忆，两个终端共用。Sell 页签不变。",
    spec: [
      {
        state: "Buy · Shares",
        when: 'side === "buy" && amountMode === "units"',
        visual: "输入框 `200 · Shares ▾` → 摘要 Cost $93 / Shares 200 / Fee / To win",
        source: "ProSpotPanel amountMode / AmountUnitDropdown",
      },
    ],
  },
  {
    key: "pro-spot-panel-sell-held",
    label: "SP-B3 · Sell · 单边持仓",
    spec: [
      {
        state: "未持有的一边禁用",
        when: 'side === "sell" && heldNoQty <= 0',
        visual: "该 tile opacity-40 pointer-events-none，价格条文案变 `0 shares`；金额单位变 shares；汇总为 Proceeds / Shares / Est. commission / You receive",
        source: "ProSpotPanel.heldYesQty / heldNoQty",
      },
      {
        state: "份额为小数",
        when: "heldQty 非整数（例 40.512）",
        visual: "Held 行与 Shares 行保留最多 3 位小数并去尾零，绝不四舍五入成整数",
        source: "ProSpotPanel.formatShares",
      },
    ],
  },
  {
    key: "pro-spot-panel-sell-held-down",
    label: "SP-B3b · Sell · 仅持有 Down（2,034.879 shares）",
    note: "回归护栏（SP-1-FIX3 Bug 1）：持有哪一边由持仓的 option_id 决定，与 Holdings 表 Outcome 列同源；Up tile 禁用显示 `0 shares`。数量全链路取精确值——Held 行、Amount 预填、滑杆 100%、校验与下单请求都是 2034.879。",
    spec: [
      {
        state: "Down-only 持仓",
        when: 'side === "sell" && heldYesQty === 0 && heldNoQty === 2034.879',
        visual: "Down tile 选中，Up tile 禁用 `0 shares`；`Held · 2,034.879 shares · Down`；Amount `2034.879`；CTA `Sell Down · You receive $X`",
        source: "SpotTrading heldYesQty / heldNoQty（经 side_labels 解析 option）",
      },
      {
        state: "全平吸附（FIX4）",
        when: "sell qty 与 heldQty 差 < 0.001，或 qty ≥ heldQty × 0.9995（滑杆 100%）",
        visual: "3 位小数字符串仅作展示；下单发送精确 heldQty，全平不留 <0.001 dust，也不因四舍五入超出持仓被拒",
        source: "SpotTrading orderQty（FIX4 snap）",
      },
    ],
  },

  {
    key: "pro-spot-panel-sell-none",
    label: "SP-B4 · Sell · 无持仓",
    spec: [
      {
        state: "两边都禁用",
        when: 'side === "sell" && heldYesQty <= 0 && heldNoQty <= 0',
        visual: "两个 tile 均禁用，下方出现 text-[11px] 提示 `No shares to sell yet`",
        source: "ProSpotPanel 派生 disabledSide === \"both\"",
      },
    ],
  },
  {
    key: "pro-spot-panel-insufficient",
    label: "SP-B5 · 余额不足",
    spec: [
      {
        state: "CTA 禁用",
        when: "ctaDisabled === true",
        visual: "TradeSubmitButton 置灰，文案由页面给出（例：Insufficient balance）",
        source: "SpotTrading ctaDisabled",
      },
    ],
  },
  {
    key: "pro-spot-panel-frozen",
    label: "SP-B8 · 市场已冻结（FIX5）",
    note: "下单封锁 = `isOrderingBlocked(dbLifecycle) || isFrozenByTime`。过了 freeze_time / end_date 的市场即便库里还写着 EXTENDED_TRADING 也不可下单：两个 tile 仍可点选（只为看价），CTA 置灰显示原因，预览弹窗打不开，提交与 Holdings 行 `Close` 均直接 toast 拦截。",
    spec: [
      {
        state: "Frozen by time",
        when: "now > freeze_time（或 end_date）",
        visual: "CTA 置灰，文案 `Market frozen`；tile 仍可切换查看价格",
        source: "SpotTrading blocked / blockedReason",
      },
    ],
  },
  {
    key: "pro-spot-panel-pending-limit",
    label: "SP-B6 · 限价将挂单",
    spec: [
      {
        state: "Pending 提示",
        when: "willBePending && !tickInvalid",
        visual: "黄色 10px 提示说明会挂为 Pending 并占用预留资金，金额为 cost + fee（含手续费）；CTA 文案变 `Place limit · Buy Up`",
        source: "ProSpotPanel.willBePending",
      },
    ],
  },
];

const DIALOG_CASES: SectionCase[] = [
  {
    key: "pro-spot-preview-dialog",
    label: "SP-B7 · Order preview 弹窗（ProSpotOrderPreview）",
    note: "与合约终端同一 Dialog 框架：事件名 + outcome chip + 两张 rounded-lg border-border/50 bg-muted/20 p-3 卡片 + TradeSubmitButton size=\"lg\"。不出现杠杆 / 保证金 / 强平 / Position impact。两个入口：面板 CTA，以及 Holdings 行的 `Close`（预置 Sell · 该 outcome · Market · 全量精确份额，直接开这个弹窗）。",
    spec: [
      {
        state: "Buy 预览",
        when: 'side === "buy"',
        visual: "第二张卡片为 Cost / Fee (0.15%) / To win",
        source: "ProSpotOrderPreview props",
      },
      {
        state: "Sell 预览",
        when: 'side === "sell"',
        visual: "第二张卡片为 Proceeds / Est. commission / You receive",
        source: "ProSpotOrderPreview props",
      },
    ],
  },
];

const TRADE_ORDER_LEVERAGE_CASES: SectionCase[] = [
  {
    key: "pro-trade-order-leverage",
    label: "CT-M5 · Leverage 抽屉（375）",
    note: "手机合约面板的杠杆选择走 MobileDrawer（DESIGN §5：移动端选择器一律抽屉）。原 `LVG 10x ▾` 是没有事件的死按钮，已替换。",
    spec: [
      {
        state: "Leverage 抽屉打开",
        when: "leverageOpen",
        visual: "标题 Leverage + 一句说明 → 大号 `10x` → Slider 1–上限 → 档位芯片（选中 bg-muted）→ Done。上限 = 品类 `category_boost_configs.max_leverage`（与 Lite Boost 同源，crypto 10× / sports 3× / macro 5×），档位 = `boostTiers(max)`",
        source: "TradeForm（MobileDrawer）· useCategoryBoostConfigs",
      },
    ],
  },
  {
    key: "pro-trade-order-leverage-20",
    label: "CT-M5b · Leverage 抽屉 · 品类上限 20×（档位 1 / 2 / 5 / 20）",
    spec: [
      { state: "max 20", when: "getConfig(category).maxBoost === 20", visual: "Slider 1–20；芯片 1x / 2x / 5x / 20x", source: "boostTiers(20)" },
    ],
  },
  {
    key: "pro-trade-order-leverage-locked",
    label: "CT-M5c · Leverage 抽屉 · 该品类未开 Boost（锁死 1×）",
    spec: [
      { state: "locked", when: "!getConfig(category).enabled（stocks / tech / politics …）", visual: "一行 `Boost not available for this category`，Slider 禁用停在 1x，芯片只有 1x", source: "TradeForm（leverageMax = 1）" },
    ],
  },
];

const EVENT_SELECTOR_CASES: SectionCase[] = [
  {
    key: "event-selector-standard",
    label: "ES-D1 · Standard 页签（现货线）",
    note: "两个终端共用一个选择器；页签 `Standard`（/spot）/ `Boost`（/trade），词与账户卡 `Standard Account / Boost Account` 同源。`Ends in` 列按剩余时间：<1m / 8m / 3h 12m / 2d 14h / 日期（≥7 天）/ Frozen（过 freeze 未到结束）；红 ≤15 分钟、黄 ≤1 小时，与终端 header 倒计时同阈。",
    spec: [
      {
        state: "Standard · 当前事件高亮",
        when: 'tab === "standard"',
        visual: "页签行 → 搜索 + ★ → 列头 Event / Ends in / Volume → 行（当前事件 bg-muted/30）；只列 product_lines 含 spot 的事件",
        source: "EventSelectorDropdown（EventSelectorPanel variant=dropdown）",
      },
    ],
  },
  {
    key: "event-selector-boost",
    label: "ES-D2 · Boost 页签（合约线）",
    note: "从现货终端切到 Boost：没有高亮行（当前事件不在这条线）。点任一行 → `/trade?event=…`，Lite/Pro 偏好不变。两条线都开的事件两个页签都出现。",
    spec: [
      {
        state: "Boost · 无当前行",
        when: 'tab === "boost" && currentEventId 不在列表',
        visual: "列 product_lines 含 futures / contract 的事件；收藏（★）两页签共用",
        source: "EventSelectorDropdown",
      },
    ],
  },
  {
    key: "event-selector-favorites-empty",
    label: "ES-D3 · 收藏为空",
    spec: [
      {
        state: "showFavoritesOnly && 无收藏",
        when: "★ 过滤开、该页签下无收藏事件",
        visual: "空态：★ 图标 + No favorites yet + View all events 链接",
        source: "EventSelectorPanel · Empty",
      },
    ],
  },
  {
    key: "event-selector-search-empty",
    label: "ES-D4 · 搜索无结果",
    spec: [
      {
        state: "search 无匹配",
        when: "搜索词在该页签下无事件",
        visual: "空态：Search 图标 + No events found + Try a different search term",
        source: "EventSelectorPanel · Empty",
      },
    ],
  },
];

const MARKET_ROW_CASES: SectionCase[] = [
  {
    key: "pro-market-row-esports",
    label: "SL-D1 · 比赛市场行 · 电竞（当前在 Map handicap AST −1.5）",
    note: "比赛类事件（有 fixture 兄弟事件）在 Pro 页头下方用市场行替代 `Select Option` 行：一个芯片 = 一组市场（Winner / Handicap / Total maps ｜ Map 1 / 2 / 3）。芯片 = 组名小字 + 当前线位与 Yes 侧价格；多条线的组右侧 ▾。选中芯片 `--yes` 描边（选择控件，不填充）。选一条线 = 整个终端切到那条 sibling event，URL `?event=<fixture>&line=<sibling>`。词汇沿用 Lite 组名，Spread / Totals / O/U 仍禁。",
    spec: [
      { state: "当前组", when: "currentId 属于该组", visual: "border-yes bg-yes/10，芯片显示当前线位 + Yes 价", source: "MarketLineRow · Chip active" },
      { state: "非当前组（单节）", when: "组只有一节", visual: "显示默认线位（中位线）+ Yes 价，muted", source: "MarketGroup.defaultId" },
      { state: "非当前组（分段）", when: "Map n 之类多节组", visual: "只显示组名 + ▾", source: "group.sections.length > 1" },
      { state: "单线组", when: "lineCount === 1（Winner）", visual: "无 ▾，点击直接切到该事件", source: "hasPicker=false" },
    ],
  },
  {
    key: "pro-market-row-esports-open",
    label: "SL-D2 · Map 1 下拉展开（分节：Map 1 winner / Rounds handicap / Total rounds）",
    spec: [
      { state: "下拉", when: "点带 ▾ 的芯片", visual: "DropdownMenu，每节一个小标 + 行；行 = `AST −3.5 / HER +3.5` + 两侧价格（Yes 青 / No 荧光绿）；当前行 bg-muted", source: "MarketLineRow · LineRows" },
    ],
  },
  {
    key: "pro-market-row-football",
    label: "SL-D3 · 足球（Winner / Handicap / Total goals），当前在 Winner",
    spec: [
      { state: "足球", when: "fixture 无 segments_key", visual: "三个芯片；Winner 为三选一事件（主 / 平 / 客），芯片显示当前 outcome（默认主队）+ 其价格，带 ▾", source: "buildFixtureMarkets · groupFixtureMarkets" },
    ],
  },
  {
    key: "pro-market-row-football-open",
    label: "SL-D4 · 足球 Winner 下拉展开（主 / 平 / 客 三个 outcome，单价）",
    spec: [
      { state: "三选一", when: "Winner 有 3 个 option", visual: "每行一个 outcome + 一个价格（无 No 价）；选中 = 留在 Winner 事件、切换 option（不换事件）", source: "MarketLineRow · LineRows（line.single）" },
    ],
  },
];

const MARKET_ROW_MOBILE_CASES: SectionCase[] = [
  {
    key: "pro-market-row-mobile",
    label: "SL-M1 · 手机市场行（375，横向滚动）",
    note: "贴在 header 倒计时之下，Charts 与 Trade 两个子页同一根；倒计时前写当前市场（`Map handicap · AST −1.5 · Ends in`）。",
    spec: [
      { state: "横滚", when: "isMobile", visual: "overflow-x-auto，芯片 h-8；无 `MARKETS` 小标", source: "MarketLineRow variant=mobile" },
    ],
  },
];

const MARKET_ROW_DRAWER_CASES: SectionCase[] = [
  {
    key: "pro-market-row-mobile-drawer",
    label: "SL-M2 · 手机线位抽屉（Handicap 组）",
    spec: [
      { state: "抽屉", when: "点带 ▾ 的芯片", visual: "MobileDrawer，标题 = 组名；行卡片 = 线位 + 两侧价；当前行 bg-primary/10 描边；选中即关闭并切事件", source: "MarketLineRow · MobileDrawer" },
    ],
  },
  {
    key: "pro-market-row-mobile-drawer-winner",
    label: "SL-M3 · 手机线位抽屉（足球 Winner 三选一：主 / 平 / 客）",
    spec: [
      { state: "三选一", when: "Winner 组 line.single", visual: "每行一个 outcome + 一个价格；选中留在同一事件、切 option（URL `line=<event>#<option>`）", source: "MarketLineRow · MobileDrawer（single）" },
    ],
  },
];

const EVENT_SELECTOR_MOBILE_CASES: SectionCase[] = [
  {
    key: "event-selector-drawer",
    label: "ES-M1 · Select Event 抽屉（375）",
    note: "手机两页（/spot、/trade）标题右侧 ▾ 打开同一个 MobileDrawer；现货页标题此前不可点。header 上不再有 SPOT 标，合约页也不加 Boost 标——产品身份只在这里的页签。",
    spec: [
      {
        state: "抽屉 · Standard",
        when: "onTitleClick",
        visual: "标题 Select Event → 页签行 → 搜索 + ★ → 卡片列表（当前事件 bg-primary/10 描边）；行内 `Ends in 8m · Volume: $803K`",
        source: "EventSelectorSheet（MobileDrawer + EventSelectorPanel variant=drawer）",
      },
    ],
  },
];

const TRADE_DOCK_CASES: SectionCase[] = [
  {
    key: "pro-trade-mobile-dock",
    label: "DK-M1 · /trade 手机图表页 sticky dock 五态（与 /spot 同一组件）",
    note: "TradingCharts 自绘的 dock 已换成 ProSpotMobileDock（DK-1），两条线一个组件。封锁四种原因：Closed / In review / Suspended · cancel only / Settled（交易页收尾 #5 起合约与现货同口径，SUSPENDED 只许撤单）。",
    spec: [
      { state: "default / 选中一边", when: "selected === 'yes' | 'no'（首屏始终一侧激活，无超时复位）", visual: "选中一边描边 + 箭头；点另一边 = 切边，再点同一边 = 跳 /trade/order", source: "ProSpotMobileDock（TradingCharts）" },
      { state: "closed / in review / suspended / settled", when: "useContractGate(event).blocked（isResolved → Settled；lifecycle REVIEW → In review；lifecycle SUSPENDED → Suspended · cancel only；过 freeze_time / end_date → Closed）", visual: "两钮收成一条禁用条，只印一次原因；`tap again to trade` 隐藏；Lite/Pro 开关保留", source: "ProSpotMobileDock · lib/contractGate" },
    ],
  },
];

const ORDER_STATUS_CASES: SectionCase[] = [
  {
    key: "pro-order-status-desktop",
    label: "OS-D1 · 桌面 Current Orders 状态标：Partial Filled hover 成交明细",
    note: "同一个 `OrderStatusBadge` 挂在桌面 /trade 与 /spot 的 Current Orders 表。蓝图引擎限价单整单成交，Partial Filled 态生产不可达，此处给研发看规格。",
    spec: [
      { state: "Partial Filled", when: 'status === "Partial Filled"', visual: "青色标，hover 弹 `Fill progress 480 / 1,200 (40%)` + 进度条 + `Filled` / `Remaining` 两行", source: "OrderStatusBadge variant=desktop（HoverCard）" },
      { state: "Pending / Filled / Cancelled", when: "其他状态", visual: "普通标（黄 / 绿 / 红），不弹", source: "OrderStatusBadge" },
    ],
  },
];

const ORDER_STATUS_MOBILE_CASES: SectionCase[] = [
  {
    key: "pro-order-status-mobile",
    label: "OS-M1 · 手机订单卡状态标：点一下弹成交明细（合约 OrderCard + 现货卡）",
    spec: [
      { state: "Partial Filled · 展开", when: "点状态标", visual: "Popover 同桌面内容；再点或点外面收起", source: "OrderStatusBadge variant=mobile（Popover）" },
    ],
  },
];

const RISK_MOBILE_CASES: SectionCase[] = [
  {
    key: "pro-risk-chip-mobile",
    label: "RM-M1 · 手机页头风险方块 `Risk x%` 四档（同桌面 Risk Ratio = MM / Equity）",
    note: "之前方块印的是 MM / Equity 而颜色按 IM / Equity 档位染——两个指标。RM-1 起全站一个指标：Risk Ratio = MM / Equity（DESIGN §7）。",
    spec: [
      { state: "SAFE / WARNING / RESTRICTION / LIQUIDATION", when: "riskRatio < 80 / 80–95 / 95–100 / ≥ 100", visual: "标签 `Risk`，数字按档位绿 / 黄 / 橙 / 红", source: "MobileRiskIndicator（previewMetrics）" },
    ],
  },
  {
    key: "pro-risk-drawer-mobile",
    label: "RM-M2 · 手机 Boost Account 抽屉 = 桌面卡内容",
    spec: [
      { state: "展开", when: "点页头方块", visual: "Margin Mode / Account Equity / Risk Ratio 进度条（80 / 95 / 100 刻度）/ Initial Margin $ / Maint. Margin $；不再有两条 Rate 进度条", source: "AccountRiskDrawer" },
    ],
  },
  {
    key: "pro-risk-chip-mobile-zero",
    label: "RM-M0 · 零态：无 Boost 持仓 / Equity = 0",
    spec: [
      { state: "hasPositions === false", when: "无合约持仓（Equity 可为任意值）", visual: "方块 `Risk 0%` 绿档；抽屉 Risk Ratio 0%、IM / MM 均 $0.00", source: "useRealtimeRiskMetrics（mmTotal = 0 → riskRatio = 0）" },
      { state: "equity ≤ 0", when: "余额 + 未实现盈亏 ≤ 0 且有持仓", visual: "riskRatio 记 100 → 红档 `Risk 100%`", source: "useRealtimeRiskMetrics" },
    ],
  },
  {
    key: "pro-trade-order-close-only",
    label: "RM-M3 · Buy 页签 Close-only（Risk ≥ 95%）",
    note: "DESIGN §7 RESTRICTION 档的行为落地（交易页收尾 #6）：账户 Risk Ratio ≥ 95% 时禁止开仓 / 加仓，只许减仓 / 平仓。Lite 合约卡同一条件写 `Boost limit reached — close a position first`（TR-28）。现货不受影响。",
    spec: [
      { state: "close-only", when: "riskLevel ∈ {RESTRICTION, LIQUIDATION} && orderIntent.kind ∈ {open, add}", visual: "Buy CTA 置灰写 `Close-only · Risk 96%`；Sell 页签与减仓不受影响", source: "TradeForm / ProContractPanel（buyBlockedReason）· useRealtimeRiskMetrics" },
    ],
  },
];

const CONTRACT_PANEL_CASES: SectionCase[] = [
  {
    key: "pro-contract-panel-buy",
    label: "CT-D1 · 桌面 /trade 面板 · Buy · Market（ProContractPanel）",
    note: "桌面右栏 280px 面板抽成 `ProContractPanel`（交易页收尾 #9，零视觉变化），字典挂本体。与手机 /trade/order 同规格：Buy · Sell 页签 + Market/Limit 下拉 → Yes/No 切换 → Leverage 滑杆 + 档位 → Available + ⇄ → (Price) → Amount + 单位 → 滑杆 → TP/SL → 摘要 → CTA。桌面 CTA 走 Order Preview 弹窗，手机走 /order-preview 页。",
    spec: [
      { state: "Buy · Market", when: 'intent === "buy"', visual: "Leverage 行 `5x` + Slider 1–上限 + 档位芯片；摘要 Contracts / Notional val. / Margin req. / Fee (est.) / Total / To win ⓘ；CTA `Buy Up · To win $X`", source: "ProContractPanel（DesktopTrading 传值）" },
    ],
  },
  {
    key: "pro-contract-panel-buy-contracts",
    label: "CT-D2 · Buy · Contracts 模式（QO-1 桌面）",
    spec: [
      { state: "units", when: 'amountMode === "units"', visual: "输入框 `50 · Contracts ▾`，Margin = 张数 × 价 ÷ 杠杆", source: "ProContractPanel（AmountUnitDropdown）" },
    ],
  },
  {
    key: "pro-contract-panel-buy-limit",
    label: "CT-D3 · Buy · Limit 低于现价 → 挂单（同 CT-M8）",
    spec: [
      { state: "will rest", when: 'orderType === "Limit" && limit < sidePrice', visual: "Price 框（默认现侧价，可改）+ `Limit below mark — order will rest as Pending until touched.`；Contracts 按限价算", source: "ProContractPanel（buyLimitPending）" },
    ],
  },
  {
    key: "pro-contract-panel-sell",
    label: "CT-D4 · Sell · 持 40 Up 5×，减仓 20（同 CT-M2 / M3）",
    spec: [
      { state: "Sell · reduce", when: 'intent === "sell" && heldSize > 0', visual: "Held 40 contracts · Up · 5x · entry 0.6200 → Amount（Contracts）→ 滑杆 → Close price (mark) / Contracts / Released margin / Realized PnL est. / Est. commission / You receive → CTA `Reduce Up`", source: "ProContractPanel sell branch" },
    ],
  },
  {
    key: "pro-contract-panel-sell-flat",
    label: "CT-D5 · Sell · 空仓（同 CT-M4）",
    spec: [
      { state: "flat", when: "!heldPositions.yes && !heldPositions.no", visual: "`No position to close yet`，两钮 `0 contracts` 40% 透明，CTA 禁用", source: "ProContractPanel（sellDisabledSide = both）" },
    ],
  },
  {
    key: "pro-contract-panel-leverage-locked",
    label: "CT-D6 · Leverage · 该品类未开 Boost（锁死 1×）",
    spec: [
      { state: "locked", when: "getConfig(category).maxBoost === 1", visual: "Leverage 行 `1x · Boost not available for this category`，Slider 禁用，只剩 1x 芯片", source: "ProContractPanel（leverageMax）· useCategoryBoostConfigs" },
    ],
  },
  {
    key: "pro-contract-panel-closed",
    label: "DK-D1 · 桌面不可下单（Closed / In review / Suspended · cancel only / Settled）",
    spec: [
      { state: "blocked", when: "useContractGate(event).blocked", visual: "Buy 与 Sell 的 CTA 都置灰印原因，其余表单照常", source: "ProContractPanel（buyBlockedReason / sellBlockedReason）· lib/contractGate" },
    ],
  },
  {
    key: "pro-contract-panel-close-only",
    label: "RM-D1 · Close-only（Risk ≥ 95%）",
    spec: [
      { state: "close-only", when: "riskLevel ∈ {RESTRICTION, LIQUIDATION} && orderIntent.kind ∈ {open, add}", visual: "Buy CTA 置灰 `Close-only · Risk 96%`；Sell 页签照常", source: "DesktopTrading（buyBlockedReason）" },
    ],
  },
];

const TRADE_ORDER_CASES: SectionCase[] = [
  {
    key: "pro-trade-order-buy",
    label: "CT-M1 · /trade/order · Buy（TradeForm）",
    note: "合约面板顶部新增 Buy · Sell 页签 + Market/Limit 下拉（与 /spot/order 同一套 markup）。Buy 页签 = 原面板，行为未变。",
    spec: [
      {
        state: "Buy · Market",
        when: 'intent === "buy"',
        visual: "Buy · Sell 文字页签（选中 text-foreground border-foreground）+ OrderTypeDropdown ml-auto → Yes/No 切换 → Leverage 10x ▾ → Available (USDC) + ⇄ Transfer → Amount → 滑杆 → TP/SL → 摘要（Notional / Margin req. / Fee / Total / To win ⓘ）→ CTA",
        source: "TradeForm（/trade/order）",
      },
    ],
  },
  {
    key: "pro-trade-order-alias",
    label: "CT-M7 · 别名 binary（队名 / 盘口）· 两钮读 side_labels（SL-P2）",
    note: "队名 / 让球 / 大小球这类事件 option 不是字面 Yes/No，面板走 side 模式：Yes 钮 = 买当前 option，No 钮 = 买对面那一方（底层做空 Yes 端 option，`short` 只在后端）。两钮文案与桌面一致取 side_labels；CTA `Buy AST −3.5` / `Buy HER +3.5`；持仓表 / Sell 页签 / 预览的 Side 全站同样显示别名（`Heroic`），永不显示 `Short`。三选一（曼城 / 平 / 国米）无别名：切换钮仍是 Yes / No，No 侧 CTA 与 Side 写 `Buy Not Draw` / `Not Draw`。",
    spec: [
      { state: "别名 binary", when: "isSingleMarketBinary(options, event) 且 label 非字面 Yes/No", visual: "两钮 `AST −3.5 0.2196` / `HER +3.5 0.7804`（价格 = 当前 option 价 / 1 − 价），其余与 CT-M1 相同", source: "TradeForm（sideLabels）· TradeOrder" },
    ],
  },
  {
    key: "pro-trade-order-closed",
    label: "DK-M2 · /trade/order · 不可下单（Closed / In review / Settled）",
    note: "合约终端之前完全不封锁（Lite 合约页有）。DK-1 起：已结算 → Settled；lifecycle REVIEW → In review；过 freeze_time 或 end_date → Closed。Buy / Sell 两个 CTA 都禁用并印原因，与桌面 /spot 现有口径一致。",
    spec: [
      { state: "closed", when: "contractGate(event).blocked", visual: "CTA 60% 不透明、文案 = 原因、`To win $0` 读数保留；Sell 页签同样禁用", source: "TradeForm（blockedReason）· lib/contractGate" },
    ],
  },
  {
    key: "pro-trade-order-buy-contracts",
    label: "CT-M6 · Buy · Contracts 模式（QO-1）",
    note: "合约按张数下单：后缀 `USDC ▾ / Contracts ▾`；Contracts 模式下 Notional = 张数 × 价格、Margin = Notional ÷ 杠杆，滑杆 100% = 可用 × 杠杆 ÷ 价格取整。Buy 摘要首行新增 `Contracts`，与现货的 `Shares` 行对等。",
    spec: [
      {
        state: "Buy · Contracts（375）",
        when: 'intent === "buy" && amountMode === "units"',
        visual: "输入框 `50 · Contracts ▾` → 摘要 Contracts 50 / Notional / Margin req. / Fee / Total / To win ⓘ",
        source: "TradeForm（amountMode，store useAmountModeStore）",
      },
    ],
  },
  {
    key: "pro-trade-order-buy-limit",
    label: "CT-M8 · Buy · Limit 低于现价 → 挂单（交易页收尾 #1）",
    note: "合约 Buy · Limit 之前是摆设（价格框不生效、挂单永不成交）。现在：Price 框默认 = 当前侧价，可改；张数按限价算；下单即扣 保证金 + 手续费；限价 ≥ 现侧价 → 立即按现价成交（同市价），限价 < 现侧价 → Pending，现价跌到 ≤ 限价时自动按限价成交、entry = 限价，toast `Limit buy filled at your price`；撤单退回 保证金 + 手续费。",
    spec: [
      { state: "will rest", when: 'orderType === "Limit" && limit < sidePrice', visual: "Price 框下一行 `Limit below mark — order will rest as Pending until touched.`；摘要 Contracts = 金额 × 杠杆 ÷ 限价", source: "TradeForm（buyLimitPending）· useContractLimitFills · tradingService.fillContractLimitOrder" },
      { state: "executes now", when: "limit ≥ sidePrice", visual: "无提示行，按现价成交", source: "execPrice = sidePrice" },
    ],
  },
  {
    key: "pro-trade-order-sell",
    label: "CT-M2 · Sell · Market（持 40 contracts Up 5x，全平）",
    note: "Sell = 只减仓/平仓当前净额仓位，永不开反向。Leverage 与 TP/SL 隐藏；数量单位为 contracts（全词，不缩写），滑杆基数 = 持仓数量；CTA 红色，全平文案 Close {outcome}，部分平 Reduce {outcome}。市价 → 打开 ClosePositionDialog，走与 Positions 表 Close 同一条 partialClosePosition（含 5% 胜利佣金）。",
    spec: [
      {
        state: "Sell · Market · 全平",
        when: 'intent === "sell" && heldSize > 0 && sellQty >= heldSize',
        visual: "Held 40 contracts · Up · 5x · entry 0.6200 → Amount 40 Contracts → 摘要 Close price (mark) / Contracts / Released margin / Realized PnL est. / Est. commission / You receive（加粗末行）→ CTA `Close Up · You receive $X`",
        source: "TradeForm sell branch",
      },
    ],
  },
  {
    key: "pro-trade-order-sell-limit",
    label: "CT-M3 · Sell · Limit（减仓 20/40）",
    note: "限价平仓 = reduce-only 挂单：trades 行 side=sell、order_type=Limit、margin=0、fee=0、reduce_only=true，下单不动余额；DEMO-STATE touch-fill 在 mark 触及限价时走 partialClosePosition。",
    spec: [
      {
        state: "Sell · Limit · 部分",
        when: 'intent === "sell" && orderType === "Limit" && sellQty < heldSize',
        visual: "Close price 输入框（默认 mark）→ pending 提示 `Limit above/below mark — order will rest as Pending until touched.` → CTA `Reduce Up`",
        source: "TradeForm sell branch → /order-preview（reduce-only）",
      },
    ],
  },
  {
    key: "pro-trade-order-sell-flat",
    label: "CT-M4 · Sell · 空仓",
    spec: [
      {
        state: "Sell · flat",
        when: 'intent === "sell" && !heldPos && !otherSideHeld',
        visual: "两侧 disabledSide=\"both\"，价格条显示 `0 contracts`，一行 `No position to close yet`；CTA 禁用",
        source: "TradeForm sellDisabledSide",
      },
    ],
  },
];

const MOBILE_CASES: SectionCase[] = [
  {
    key: "pro-spot-mobile-charts",
    label: "SP-M1 · 移动 Charts 视图（375）",
    note: "移动 Pro 现货长在 MobileTradingLayout variant=\"spot\" 上：price/mark、图表、tabs 与卡片逐块复用 /trade 规格；市场 chip 行是多 market 专属，binary 事件（含 Up/Down 别名）不渲染；仅保留 32px spot strip 与 dock 安全区；底部页签为 Orders / Holdings（现货持有的是份额，不叫仓位；行内不再有 SPOT 标）。",

    spec: [
      {
        state: "Charts 默认",
        when: "isMobile && surface === pro && !blocked",
        visual: "32px strip → price/change/Mark Price/24h Volume → 450px 图表 → contract-class cards → dock（Lite/Pro + Up / Down）；无市场 chip 行",
        source: "SpotMobileStatsStrip / SpotMobileMarkLine / ProSpotMobileDock",
      },
    ],
  },
  {
    key: "pro-spot-mobile-charts-360",
    label: "SP-M1b · 移动 Charts 视图（360 · 无截断）",
    note: "SP-2-FIX3：360px 最坏数据用 $57,907.84。PRE/AH 徽标在 Base 格；涨跌按 strip 容器宽度隐藏，价格与标的永不截断。",
    spec: [
      {
        state: "360px 极窄",
        when: "viewport < 375",
        visual: "左格 `BASE $577.18 PRE`；右格 `META $57,907.84`；页头标题走短名 `META · Up or down?`",
        source: "SpotMobileStatsStrip / spotMobileTitle",
      },
    ],
  },
  {
    key: "pro-spot-mobile-charts-frozen",
    label: "SP-M2 · 移动 Charts · 已冻结",
    spec: [
      {
        state: "Frozen",
        when: "blocked === true",
        visual: "倒计时 00:00:00；两个 dock 按钮禁用，文案 `Market frozen`",
        source: "useSpotTerminal blocked / blockedReason",
      },
    ],
  },
  {
    key: "pro-spot-mobile-order-buy",
    label: "SP-M3 · /spot/order · Buy",
    note: "SP-2-FIX5：下单子页挂生产 ProSpotPanel chrome=\"bare\"，零额外卡片与标题；表单直接长在页面上，右侧为完整 120px / 10+10 档盘口。此页永不出现 Lite/Pro 切换。",
    spec: [
      {
        state: "Buy · Market",
        when: 'activeTab === "Trade" && side === "buy"',
        visual: "左侧无卡片外壳表单 + 右 120px 迷你盘口（10 asks / mid / 10 bids / Depth 0.1）；摘要为 plain kv rows",
        source: "SpotTradePanel（ProSpotPanel）",
      },
    ],
  },
  {
    key: "pro-spot-mobile-order-buy-shares",
    label: "SP-M4b · /spot/order · Buy · Shares 模式（QO-1）",
    spec: [
      {
        state: "Buy · Shares（375）",
        when: 'side === "buy" && amountMode === "units"',
        visual: "同桌面：后缀 `Shares ▾`，bare 摘要 Cost / Fee / Total / To win",
        source: "ProSpotPanel（bare）",
      },
    ],
  },
  {
    key: "pro-spot-mobile-order-sell-held",
    label: "SP-M4 · /spot/order · Sell（持有 Down）",
    note: "SP-2-FIX5：与 Buy 共用 bare chrome；CTA 默认 row，只在真实测量放不下时自动 stacked。",
    spec: [
      {
        state: "Sell 全平",
        when: 'side === "sell" && heldNoQty > 0',
        visual: "Up tile 禁用 `0 shares`；数量走 FIX4 精确吸附；Proceeds / Est. commission / You receive 为无底色 kv rows",
        source: "useSpotTerminal orderQty",
      },
    ],
  },
  {
    key: "pro-spot-mobile-dock",
    label: "SP-M5 · Sticky dock 四态",
    spec: [
      {
        state: "default / 选中一边 / frozen",
        when: "selected === null | 'yes' | blocked",
        visual: "第一次点选中（描边 + 箭头），第二次跳 /spot/order；blocked = 两钮收成一条禁用条（bg-muted/40 灰字）只印一次原因，右上角 `tap again to trade` 隐藏，开关保留（DK-1）",
        source: "ProSpotMobileDock",
      },
      {
        state: "Lite/Pro 在最前",
        when: "showSurfaceSwitch（生产默认）",
        visual: "SurfaceSwitch size=\"dock\" 是这一行的第一个子元素，两个方向键仍平分剩余宽度",
        source: "ProSpotMobileDock（预览用 surfaceSwitchPreview 置为惰性）",
      },
    ],
  },
];

const SKELETON_CASES: SectionCase[] = [

  {
    key: "pro-terminal-skeleton",
    label: "SP-C1 · Pro 终端骨架（ProTerminalLayout + ProBottomTabs）",
    note: "`src/components/pro/` 是搭建 Pro 桌面终端的唯一方式：/trade 与 /spot 共用同一套槽位，宽度与间距不得各写一份。",
    spec: [
      {
        state: "槽位几何",
        when: "always",
        visual: "header / chart(flex-1) / orderBook(280px) / bottomTabs / 右栏 280px（panel + account, gap-2 m-1）",
        source: "ProTerminalLayout",
      },
    ],
  },
  {
    key: "pro-bottom-tabs-guest",
    label: "SP-I · 未登录门（ProBottomTabs → LiteAuthGate panel）",
    note: "SP-2-FIX8：未登录用户恒为 Lite，理论上到不了 Pro；万一到了，底部面板用站点唯一的 LiteAuthGate（panel 变体），不再有旧的 AuthGateOverlay（Log In / Sign Up）。",
    spec: [
      {
        state: "未登录",
        when: "!user",
        visual: "bg-card 纯色（无模糊）+ 72px lynx + 单行标题 + Sign in / Create account 同排，总高 ≤ 220px",
        source: "LiteAuthGate variant=\"panel\"",
      },
    ],
  },
];

const BOOK_CASES: SectionCase[] = [
  {
    key: "pro-spot-book-thin",
    label: "SP-J · Spot 薄深度订单簿（10 + 10 固定槽）",
    note: "生产 DesktopOrderBook variant=spot。fixture 每侧仅 3 档；asks 顶部与 bids 底部使用无文字、无深度条、无 hover 的空槽补齐，不制造价格。",
    spec: [
      {
        state: "Thin book · CONSERVATIVE",
        when: "spot aggregated levels < 10",
        visual: "tab 行只含 tabs；CONSERVATIVE 在 tick row 左侧；10 asks + mark row + 10 bids 固定位置；mark 行显示黄色 ⚑",
        source: "DesktopOrderBook variant=spot / quoteMode",
      },
    ],
  },
];

const Locate = ({ route, dict, docs, extra }: { route: React.ReactNode; dict: string; docs: string[]; extra?: React.ReactNode }) => (
  <div className="rounded-lg border border-[#CFFF4A]/30 bg-[#CFFF4A]/5 px-3 py-2 text-[12px] leading-relaxed text-foreground">
    <div>本页 = {route} 的状态字典 · 样式与布局 → 生产页；状态与判定 → 本页。</div>
    <div className="text-muted-foreground">
      字段名 / 文案 / 公式 → <code className="font-mono">docs/copy-dictionary.md</code> {dict}；流程与口径 →{" "}
      <code className="font-mono">docs/delivery/</code> {docs.join(" · ")}
    </div>
    {extra && <div className="text-muted-foreground">{extra}</div>}
  </div>
);

interface Props {
  isMobile: boolean;
}

/** Pro 合约终端 /trade（桌面）· /trade + /trade/order（手机）。小节顺序 = 页面从上到下。 */
export const ProTradeTerminalPage = (_: Props) => (
  <div className="space-y-8">
    <Locate
      route={<><code className="font-mono">/trade</code>（桌面）与 <code className="font-mono">/trade</code> · <code className="font-mono">/trade/order</code>（手机）</>}
      dict="§Trading"
      docs={["pro-trade-sell-v1", "pro-order-units-v1", "pro-sports-lines-v1", "pro-order-gate-v1", "risk-ratio-mm-v1"]}
      extra={<>页头的事件选择器、订单状态标、Lite / Pro 开关 → 「两终端共用」节点；Lite 侧下单面板的 <code className="font-mono">Pro ›</code> 入口 → Lite「交易页」TR-27 / SP-19。</>}
    />
    <SectionWrapper
      id="pro-market-row"
      title="① 比赛市场行 · 桌面（SL-P · Winner / Handicap / Total · Map n）"
      description="体育比赛在 Pro 终端的让分 / 大小球 / 单图市场入口。Lite 的 fixture board 在 Pro 里压成一根横向市场行；选线 = 切 sibling event。"
    >
      <SectionFrame cases={MARKET_ROW_CASES} device="desktop" minHeight={360} />
    </SectionWrapper>

    <SectionWrapper
      id="pro-market-row-mobile"
      title="① 比赛市场行 · 手机（SL-M1）"
      description="header 之下横向滚动的同一根行。"
    >
      <SectionFrame cases={MARKET_ROW_MOBILE_CASES} device="mobile" minHeight={160} />
    </SectionWrapper>

    <SectionWrapper
      id="pro-market-row-mobile-drawer"
      title="① 比赛市场行 · 手机线位抽屉（SL-M2）"
      description="viewport 级 position:fixed 组件独占一帧。"
    >
      <SectionFrame cases={MARKET_ROW_DRAWER_CASES} device="mobile" minHeight={560} />
    </SectionWrapper>

    <SectionWrapper
      id="pro-contract-panel"
      title="② 下单面板 · 桌面右栏（CT-D · DK-D1 · RM-D1）"
      description="桌面 /trade 的 280px 下单面板本体（ProContractPanel）。Buy · Sell 页签、Sell 只减仓、Contracts 模式、Buy · Limit 挂单、品类杠杆上限、封锁与 Close-only 都在这里；手机 /trade/order 同规格见下一节。"
    >
      <SectionFrame cases={CONTRACT_PANEL_CASES} device="desktop" minHeight={620} />
    </SectionWrapper>

    <SectionWrapper
      id="pro-trade-order"
      title="② 下单面板 Buy · Sell · 按数量（CT-1 / QO-1 · 手机 /trade/order）"
      description="合约面板的 Buy · Sell 意图页签。Sell 只做当前净额仓位的减仓/平仓（方案 A），空仓禁用、永不开反向。桌面面板见上一节（同规格）。"
    >
      <SectionFrame cases={TRADE_ORDER_CASES} device="mobile" minHeight={640} />
    </SectionWrapper>

    <SectionWrapper
      id="pro-trade-order-leverage"
      title="② 下单面板 · Leverage 抽屉（CT-M5）"
      description="viewport 级 position:fixed 组件独占一帧。"
    >
      <SectionFrame cases={TRADE_ORDER_LEVERAGE_CASES} device="mobile" minHeight={640} />
    </SectionWrapper>

    <SectionWrapper
      id="pro-trade-mobile-dock"
      title="③ 手机图表页 sticky dock · 不可下单态（DK-1）"
      description="合约手机图表页的底部 dock 改用现货同一组件 ProSpotMobileDock；不可下单时两钮收成一条灰色禁用条只印一次原因（/spot 之前把原因印了两遍）。"
    >
      <SectionFrame cases={TRADE_DOCK_CASES} device="mobile" minHeight={560} />
    </SectionWrapper>

    <SectionWrapper
      id="pro-risk-mobile"
      title="④ 账户风险 · 手机方块与抽屉（RM-1 · Risk Ratio = MM / Equity）"
      description="页头方块和抽屉与桌面账户卡同一个指标、同一套行；Lite 的 Boost check 也读同一个数（见 Portfolio 节）。"
    >
      <SectionFrame cases={RISK_MOBILE_CASES} device="mobile" minHeight={640} />
    </SectionWrapper>

  </div>
);

/** Pro 现货终端 /spot（桌面）· /spot + /spot/order（手机）。 */
export const ProSpotTerminalPage = (_: Props) => (
  <div className="space-y-8">
    <Locate
      route={<><code className="font-mono">/spot</code>（桌面）与 <code className="font-mono">/spot</code> · <code className="font-mono">/spot/order</code>（手机）</>}
      dict="§Trading"
      docs={["spot-pro-v1", "pro-order-units-v1", "pro-order-gate-v1"]}
      extra={<>页头的事件选择器、订单状态标、Lite / Pro 开关 → 「两终端共用」节点。</>}
    />
    <SectionWrapper
      id="pro-spot-panel"
      title="① 下单面板（SP-1 · B2）"
      description="生产件 src/components/pro/ProSpotPanel.tsx。方案 A：Buy/Sell 文字页签 + 订单类型下拉在同一行，整宽选择器只有 BinarySideToggle；汇总区不再有 Max loss，盈利口径统一为扣除 5% winning commission 后的 To win。"
    >
      <SectionFrame cases={PANEL_CASES} device="desktop" minHeight={520} />
    </SectionWrapper>

    <SectionWrapper
      id="pro-spot-book"
      title="② 桌面订单簿（SP-3-DT1）"
      description="Spot 固定每侧 10 槽；薄深度只补空行，不补虚构价格。"
    >
      <SectionFrame cases={BOOK_CASES} device="desktop" minHeight={600} />
    </SectionWrapper>

    <SectionWrapper
      id="pro-spot-preview"
      title="③ 订单预览弹窗"
      description="CTA 先开预览弹窗，确认后才提交。"
    >
      <SectionFrame cases={DIALOG_CASES} device="desktop" minHeight={460} />
    </SectionWrapper>

    <SectionWrapper
      id="pro-spot-mobile"
      title="④ 手机端 · Charts 视图 + sticky dock + /spot/order（SP-2）"
      description="移动 Pro 现货重建在合约 Pro 移动骨架上：/spot 为 Charts 视图 + sticky dock，/spot/order 为下单子页（同一个 ProSpotPanel）。"
    >
      <SectionFrame cases={MOBILE_CASES} device="mobile" minHeight={560} />
    </SectionWrapper>

  </div>
);

/** 两终端共用：/trade 与 /spot 都长着的件。 */
export const ProSharedTerminalPage = (_: Props) => (
  <div className="space-y-8">
    <Locate
      route={<><code className="font-mono">/trade</code> 与 <code className="font-mono">/spot</code> 共用的件</>}
      dict="§Surface switch（交易页）· §Trading"
      docs={["surface-switch-v1", "event-selector-v1", "order-status-partial-fill-v1"]}
      extra={<>Lite 侧下单面板的 <code className="font-mono">Want to place a limit order? Pro ›</code> 入口 → Lite「交易页」节点 TR-27 / TR-27b（合约）、SP-19 / SP-19b（现货）。</>}
    />
    <SurfaceSwitchSection />

    <SectionWrapper
      id="event-selector"
      title="② 事件选择器 · 桌面下拉（ES-1 · Standard / Boost）"
      description="桌面 /trade 与 /spot 的标题下拉共用同一组件。页签 = 产品线；`Ends in` 用相对时间，快轮事件才看得出哪局马上结束。"
    >
      <SectionFrame cases={EVENT_SELECTOR_CASES} device="desktop" minHeight={520} />
    </SectionWrapper>

    <SectionWrapper
      id="event-selector-mobile"
      title="② 事件选择器 · 手机抽屉（ES-M1）"
      description="viewport 级 position:fixed 组件独占一帧。"
    >
      <SectionFrame cases={EVENT_SELECTOR_MOBILE_CASES} device="mobile" minHeight={640} />
    </SectionWrapper>

    <SectionWrapper
      id="pro-terminal-skeleton"
      title="③ 终端骨架（SP-1 · B1）"
      description="ProTerminalLayout / ProBottomTabs / OrderTypeDropdown / BinarySideToggle 四件套，/trade 与 /spot 共用。"
    >
      <SectionFrame cases={SKELETON_CASES} device="desktop" minHeight={560} />
    </SectionWrapper>

    <SectionWrapper
      id="pro-order-status"
      title="④ 订单状态标 · 部分成交明细（PF-1）"
      description="桌面 hover / 手机点一下；四个挂载点（桌面合约表、桌面现货表、手机合约卡、手机现货卡）共用一个组件。"
    >
      <SectionFrame cases={ORDER_STATUS_CASES} device="desktop" minHeight={260} />
      <SectionFrame cases={ORDER_STATUS_MOBILE_CASES} device="mobile" minHeight={380} />
    </SectionWrapper>

  </div>
);
