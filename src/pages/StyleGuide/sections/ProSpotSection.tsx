// Pro /spot terminal — state dictionary (SP-1 · B3).
// Every case mounts the production components (ProSpotPanel / ProSpotOrderPreview /
// ProTerminalLayout). Nothing here is hand-drawn.
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
        visual: "该 tile opacity-40 pointer-events-none，价格条文案变 `0 shares`；金额单位变 sh；汇总为 Proceeds / Shares / Est. commission / You receive",
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
    label: "SP-B3b · Sell · 仅持有 Down（2,034.879 sh）",
    note: "回归护栏（SP-1-FIX3 Bug 1）：持有哪一边由持仓的 option_id 决定，与 Holdings 表 Outcome 列同源；Up tile 禁用显示 `0 shares`。数量全链路取精确值——Held 行、Amount 预填、滑杆 100%、校验与下单请求都是 2034.879。",
    spec: [
      {
        state: "Down-only 持仓",
        when: 'side === "sell" && heldYesQty === 0 && heldNoQty === 2034.879',
        visual: "Down tile 选中，Up tile 禁用 `0 shares`；`Held · 2,034.879 sh Down`；Amount `2034.879`；CTA `Sell Down · You receive $X`",
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
        visual: "标题 Leverage + 一句说明 → 大号 `10x` → Slider 1–10 → 1x/2x/5x/7x/10x 芯片（选中 bg-muted）→ Done",
        source: "TradeForm（MobileDrawer）",
      },
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
    key: "pro-trade-order-sell",
    label: "CT-M2 · Sell · Market（持 40 ct Up 5x，全平）",
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
        visual: "第一次点选中（描边 + 箭头），第二次跳 /spot/order；frozen 全禁用",
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

interface Props {
  isMobile: boolean;
}

export const ProSpotSection = (_: Props) => (
  <div className="space-y-8">
    <SectionWrapper
      id="pro-spot-panel"
      title="Pro /spot 下单面板（SP-1 · B2）"
      description="生产件 src/components/pro/ProSpotPanel.tsx。方案 A：Buy/Sell 文字页签 + 订单类型下拉在同一行，整宽选择器只有 BinarySideToggle；汇总区不再有 Max loss，盈利口径统一为扣除 5% winning commission 后的 To win。"
    >
      <SectionFrame cases={PANEL_CASES} device="desktop" minHeight={520} />
    </SectionWrapper>

    <SectionWrapper
      id="pro-spot-book"
      title="Pro /spot 桌面订单簿（SP-3-DT1）"
      description="Spot 固定每侧 10 槽；薄深度只补空行，不补虚构价格。"
    >
      <SectionFrame cases={BOOK_CASES} device="desktop" minHeight={600} />
    </SectionWrapper>

    <SectionWrapper
      id="pro-spot-preview"
      title="Pro /spot 订单预览"
      description="CTA 先开预览弹窗，确认后才提交。"
    >
      <SectionFrame cases={DIALOG_CASES} device="desktop" minHeight={460} />
    </SectionWrapper>

    <SectionWrapper
      id="pro-terminal-skeleton"
      title="Pro 终端骨架（SP-1 · B1）"
      description="ProTerminalLayout / ProBottomTabs / OrderTypeDropdown / BinarySideToggle 四件套，/trade 与 /spot 共用。"
    >
      <SectionFrame cases={SKELETON_CASES} device="desktop" minHeight={560} />
    </SectionWrapper>

    <SectionWrapper
      id="pro-spot-mobile"
      title="Pro /spot 移动端（SP-2）"
      description="移动 Pro 现货重建在合约 Pro 移动骨架上：/spot 为 Charts 视图 + sticky dock，/spot/order 为下单子页（同一个 ProSpotPanel）。"
    >
      <SectionFrame cases={MOBILE_CASES} device="mobile" minHeight={560} />
    </SectionWrapper>

    <SectionWrapper
      id="pro-trade-order"
      title="Pro /trade/order 移动下单面板（CT-1 · Buy · Sell）"
      description="合约面板的 Buy · Sell 意图页签。Sell 只做当前净额仓位的减仓/平仓（方案 A），空仓禁用、永不开反向。桌面 /trade 面板与此同规格，但仍是页面内联 JSX，暂无法在字典挂载（见交付文档已知缺口）。"
    >
      <SectionFrame cases={TRADE_ORDER_CASES} device="mobile" minHeight={640} />
    </SectionWrapper>

    <SectionWrapper
      id="event-selector"
      title="交易终端事件选择器（ES-1 · Standard / Boost）"
      description="桌面 /trade 与 /spot 的标题下拉共用同一组件。页签 = 产品线；`Ends in` 用相对时间，快轮事件才看得出哪局马上结束。"
    >
      <SectionFrame cases={EVENT_SELECTOR_CASES} device="desktop" minHeight={520} />
    </SectionWrapper>

    <SectionWrapper
      id="event-selector-mobile"
      title="交易终端事件选择器 · 手机抽屉（ES-M1）"
      description="viewport 级 position:fixed 组件独占一帧。"
    >
      <SectionFrame cases={EVENT_SELECTOR_MOBILE_CASES} device="mobile" minHeight={640} />
    </SectionWrapper>

    <SectionWrapper
      id="pro-trade-order-leverage"
      title="Pro /trade/order · Leverage 抽屉（CT-M5）"
      description="viewport 级 position:fixed 组件独占一帧。"
    >
      <SectionFrame cases={TRADE_ORDER_LEVERAGE_CASES} device="mobile" minHeight={640} />
    </SectionWrapper>

  </div>
);
