/**
 * /trade（合约与多市场）· 状态字典（M2b · mock11 终版编号 TR-1 … TR-24）。
 *
 * 每个 case = 生产组件 + SectionFrame 双帧（desktop 1280 在上 / mobile 375 在下）。
 * fixture 只注数据与状态；不新增视觉方案，不手抄生产 JSX。
 */
import { SectionWrapper, SubSection } from "../components/SectionWrapper";
import { SectionFrame, type SectionCase } from "../components/SectionFrame";

/* ---------------- ① 页头与市场语境（TR-1…TR-4） ---------------- */

const HEAD_CASES: SectionCase[] = [
  {
    key: "trade-tr1",
    label: "TR-1 · 页头 · binary 事件（TradeHeading）",
    note: "eyebrow = 品类标签；多市场事件桌面追加 “· N markets”，sports fixture 追加 Winner / Handicap / Total goals 组名。",
    spec: [
      { state: "binary", when: "!isMulti && !hasLines", visual: "eyebrow `FINANCE` + 题名 + 收藏星标（桌面在标题右侧，移动在 MobileHeader）", source: "LiteContractTrade.QuestionBlock → TradeHeading" },
      { state: "多市场（桌面）", when: "isMulti && !isMobile", visual: "eyebrow 追加 ` · {options.length} markets`", source: "同上" },
      { state: "已收藏", when: "isWatched(event.id)", visual: "星标 trading-yellow 实心", source: "useWatchlist" },
    ],
  },
  {
    key: "trade-tr2",
    label: "TR-2 · crowd bar（LiteSentimentBar）",
    spec: [
      { state: "binary 唯一形态", when: "!boardMode（非多市场、非 game lines）", visual: "`WHAT THE CROWD THINKS` + Yes 94% / 6% No 双色条（yes=Pulse Blue，no=Volt）", source: "LiteSentimentBar" },
      { state: "移动紧凑", when: "isMobile", visual: "条高 44px → 38px", source: "compact prop" },
      { state: "多市场不渲染", when: "boardMode === true", visual: "本模块整体被 LiteMarketBoard / LiteCrowdOverview 取代", source: "LiteContractTrade BoardModule" },
    ],
  },
  {
    key: "trade-tr3",
    label: "TR-3 · odds chart（LiteContractChart）",
    note: "fixture 无 base_price、无 oddsHistory → 走确定性合成走势并打 `Sample data` 角标（生产同一分支）。",
    spec: [
      { state: "仅赔率视图", when: "event.base_price == null", visual: "`YES ODDS` + 1H / Today / 1W 切换 + 曲线", source: "LiteContractChart underlyingLabel=null" },
      { state: "sample 水印", when: "oddsHistory == null（无真实历史）", visual: "右上 `Sample data` 角标", source: "LiteContractChart" },
      { state: "有标的价", when: "event.base_price != null", visual: "多一个价格视图 + `Needed` 虚线水平线", source: "targetLabel=\"Needed\"" },
    ],
  },
  {
    key: "trade-tr4",
    label: "TR-4 · settle note（TradeRuleCard）",
    note:
      "逐字：`Settles on the NVDA closing market cap on the last trading day of the quarter. Winning shares pay $1 each, credited automatically at settlement.`",
    spec: [
      { state: "有 rules", when: "event.rules || event.description", visual: "ⓘ + 规则句 + 固定尾句 `Winning shares pay $1 each, credited automatically at settlement.`", source: "LiteContractTrade.ruleBody" },
      { state: "无 rules 兜底", when: "两者皆空", visual: "`Pays $1 a share to the winning side when this market resolves.` + 同尾句", source: "同上" },
      { state: "去重", when: "rules 已以 `Winning shares pay $1…` 结尾", visual: "该句被正则剥离，绝不出现两次", source: "ruleBody replace()" },
    ],
  },
];

/* ---------------- ② 下单面板（TR-5…TR-9） ---------------- */

const PANEL_CASES: SectionCase[] = [
  {
    key: "trade-tr5",
    label: "TR-5 · 下单面板 · guest 零单默认（LiteContractOrderPanel）",
    note:
      "逐字：CTA `Buy Yes · To win $0.00 →`；脚注 `Not guaranteed. You can lose everything you put in.`。Est. auto-close 行的四态见 AC-T4 专案，本 case 不重复收录。",
    spec: [
      { state: "零单", when: "amountNum <= 0", visual: "`Make your call` + 倒计时 + Yes/No 50¢ + HOW MUCH + $10/$25/$50/$100/Max + Boost 1×…20×+Custom + Returns（win 净利 + ⓘ / auto-close 两行）+ CTA `Buy Yes · To win $0.00 →`", source: "LiteContractOrderPanel" },
      { state: "未登录", when: "!user", visual: "提交改为拉起登录（onRequestAuth），面板本身不变", source: "onRequestAuth" },
      { state: "Boost 不可用", when: "boostEnabled === false", visual: "Boost 模块整块不渲染；boostLoading 时渲染等高骨架防跳位", source: "boostEnabled / boostLoading" },
    ],
  },
  {
    key: "trade-tr6",
    label: "TR-6 · 下单面板 · No 侧选中",
    spec: [
      { state: "no 选中", when: 'side === "no"', visual: "No 按钮激活为 Volt 轴，Returns 与 CTA 全部改用 No 价与 No 文案", source: "SideButton / cta 分支" },
    ],
  },
  {
    key: "trade-tr7",
    label: "TR-7 · 下单面板 · Custom boost 展开态",
    note: "fixture-only prop `fixture.boostTrayOpen` 驱动（生产从不传）；值 7× 落在档位之外，Custom 胶囊显示 `7×`。",
    spec: [
      { state: "tray 展开", when: "fixture.boostTrayOpen === true（生产为用户点击 Custom）", visual: "档位行下方展开输入托盘", source: "LiteBoostSelector.defaultTrayOpen" },
      { state: "自定义值", when: "!tiers.includes(value)", visual: "Custom 胶囊改显 `{value}×` 并高亮", source: "LiteBoostSelector.isCustom" },
      { state: "Returns 区", when: "always", visual: "三行：`If you're right, you win` ⓘ + 净利（毛利 − 开仓费 − 5% 赢利佣金，2026-11-16 起也扣开仓费）；`If you're wrong, you lose`（1×）/ `… lose up to`（Boost）ⓘ + 金额；`Auto-close` 行。最多亏的封顶与红字见 TR-31 … TR-33", source: "LiteContractOrderPanel Returns block · netWinIfRight()" },
      { state: "auto-close = None 子态", when: "effBoost <= 1 → `None · nothing borrowed`；autoClose.kind === 'none' → `None · your balance covers it`", visual: "灰色 None + 子文案", source: "autoCloseRow" },
      { state: "派生行渲染条件", when: "effBoost > 1 && amountNum > 0", visual: "金额输入框内右侧同基线挂 `= {$输入×Boost} position`（本 case 为 `= $175.00 position`）；1× 或空输入时零 DOM；恒中性灰，不进方向/盈亏色轴", source: "LiteContractOrderPanel 金额输入块" },
    ],

  },
  {
    key: "trade-tr8",
    label: "TR-8 · 下单面板 · blockNotice 态",
    note: "逐字：`You already hold the other side of this market. Cash out first, or hold.`",
    spec: [
      { state: "blockNotice", when: "blockNotice != null（多市场同一 option 已持对侧）", visual: "CTA 上方灰色说明句，CTA 禁用", source: "LiteContractOrderPanel blockNotice" },
      { state: "blocked", when: "blocked === true（closed / in review / settled）", visual: "CTA 文案换成 blockedReason 且禁用", source: "blocked / blockedReason" },
    ],
  },
  {
    key: "trade-tr9",
    label: "TR-9 · 下单面板 · netting 句 + partial net",
    note:
      "逐字：`Buying Yes cashes out your No first.`（nettingScopeLabel 为空 → 无 “on this market” 后缀）。fixture：heldSideLabel=`No` / heldQty=40 / heldCurrentValue=$20 / 本单 $50 · 5× → 余量腿另起，auto-close 行的值引用 **AC-T5**（remainderAutoClose = none），两案同一组数值。",
    spec: [
      { state: "netting", when: 'heldSideLabel != null && heldSideLabel !== sideLabel', visual: "CTA 上方出现 `Buying {side} cashes out your {held} first.`", source: "LiteContractOrderPanel.nettingNotice" },
      { state: "全额对冲", when: "quantity <= heldQty", visual: "只显示 cash-out 回收额，不开新腿", source: "qtyNet / getBack" },
      { state: "partial net", when: "quantity > heldQty > 0", visual: "回收行 + 余量腿行（余量的 Est. auto-close 独立披露，非全单值）", source: "isPartialNet / remainderAutoClose" },
      { state: "无 heldQty", when: "heldQty == null", visual: "只出句子不出数字（引擎按份额净额，无份额则不估）", source: "canEstimateNet" },
    ],
  },
  {
    key: "trade-tr30",
    label: "TR-30 · 下单面板 · 余额不够下单（Max = 0）",
    note:
      "CPO 2026-11-05。已登录用户输入的金额永远不超过 Max（= floor(Boost balance)）：手输或点快捷金额超过 Max 时直接变成 Max。Max 算出来是 0（余额不到 $1）时，卡片就地说明，不再显示一个点什么都没反应的 $0.00。下单按钮与脚注**不变**；提示里的 Top up 可点（2026-11-12）：另一个账户 ≥ $1（floor）开划转，不足 $1 打开充值（2026-11-13）；余额旁的 ⇄ 照旧。手机抽屉同一张卡、同一行位。",
    spec: [
      { state: "超过 Max", when: "user && !isNetting && parseFloat(input) > floor(balance)", visual: "输入框里的数直接变成 Max（静默，无提示）", source: "LiteContractOrderPanel setAmountCapped" },
      { state: "余额不够", when: "user && !isNetting && floor(balance) < 1", visual: "输入框锁住只显示占位 `0`；输入框下一行 `Top up your Boost balance to make a call.`（text-xs，foreground/75），其中 `Top up` 是链接（primary、下划线、semibold）；$10/$25/$50/$100/Max 置灰不可点；CTA `Buy Yes · To win $0.00 →` 与脚注不变" , source: "LiteContractOrderPanel lowBalance · i18n trade.screen.lite.lite_contract_order_panel.low_balance_hint / low_balance_link" },
      { state: "余额不够 · 点 Top up", when: "点提示里的 Top up", visual: "Standard 余额 ≥ $1（floor）→ 打开划转（桌面 TransferDialog / 手机 TransferDrawer，方向 Standard → Boost）；不足 $1 → 打开充值（桌面弹 DepositDialog 预选 Boost，手机进 /deposit）。点下单弹的 toast 同一分叉：按钮 Transfer 或 Top up，Top up 走同一个充值（桌面弹窗，不再跳 /wallet）", source: "useInsufficientBalanceToast · CPO 2026-11-12 / 11-13" },
      { state: "对冲例外", when: "isNetting（买的是已持仓的另一边）", visual: "不封顶、不提示——这笔先用持仓换回的钱，钱包不是上限", source: "capApplies" },
      { state: "游客例外", when: "!user", visual: "不封顶、不提示——点 Buy 先拉起登录", source: "capApplies" },
    ],
  },
  {
    key: "trade-tr31",
    label: "TR-31 · 下单面板赢亏 · 1×",
    note: "CPO 2026-11-16（画布「Lite 交易展示 17 条」第 ① 排，CTO 回复后定稿）。1× 不写 up to：`If you're wrong, you lose $10.02`（投入 + 开仓费）；auto-close `None · nothing borrowed`；脚注 `Not guaranteed. You can lose your full $10.02.`。赢的数扣开仓费和 5% 佣金，与结算后 Portfolio 的 Result 是同一个数。",
    spec: [
      { state: "赢", when: "always", visual: "`If you're right, you win` ⓘ + netWinIfRight(价格, 份数)；CTA `To win $X →` 同一个数", source: "src/lib/liteWinLoss.ts" },
      { state: "亏", when: "effBoost <= 1", visual: "`If you're wrong, you lose` ⓘ + 投入 + 开仓费", source: "lossIfWrong" },
      { state: "空金额", when: "amountNum <= 0", visual: "两行都是 $0.00；脚注 `Not guaranteed. You can lose everything you put in.`", source: "footnote_empty" },
    ],
  },
  {
    key: "trade-tr32",
    label: "TR-32 · 下单面板赢亏 · 这一笔就能亏光",
    note: "最多亏 = 仓位 + 开仓费，但不超过 Boost 账户总值（现金 + 持仓投入 + 浮盈浮亏，CTO 2026-11-16）；超出部分不追缴。被封顶时金额写账户总值，下面一行红字 `That's everything you have in Boost.`——不写余额数，因为有持仓时账户总值和上方显示的 Boost balance 不是一个数。",
    spec: [
      { state: "封顶", when: "已登录 && 仓位 + 开仓费 > boostAccountValue", visual: "`If you're wrong, you lose up to` + `$25.00`；红字 11px trading-red", source: "lossCapped · risk.boostAccountValue" },
      { state: "游客", when: "!user", visual: "不封顶、不出红字", source: "accountValue undefined" },
    ],
  },
  {
    key: "trade-tr33",
    label: "TR-33 · 下单面板赢亏 · 几笔加起来超过",
    note: "这一笔的最多亏 + 其他 Boost 持仓跌到底还会亏的钱（多：份数 × 现价；空：份数 × (1 − 现价)）> Boost 账户总值时，在亏损行下面出红框：`If this and your other Boost calls all go wrong, you could lose everything you have in Boost.`。这一笔自己已经被封顶（TR-32）时不再出红框，避免两句红字说同一件事。",
    spec: [
      { state: "超额", when: "已登录 && !lossCapped && openCallsCouldLose > 0 && lossIfWrong + openCallsCouldLose > boostAccountValue", visual: "红框 rounded-lg bg-trading-red/10 11.5px trading-red，左右与行对齐", source: "overAccount · risk.openCallsCouldLose" },
      { state: "对冲部分平仓", when: "买对面、只抵掉一部分", visual: "最多亏只算新开那部分；全部抵掉时亏损行与红框都不出", source: "showLossRow · remainderQty" },
    ],
  },
  {
    key: "trade-tr34",
    label: "TR-34 · 手机下单抽屉顶部的时间行",
    note: "CTO 2026-11-16：体育倒数的是开赛（比赛中显示比赛时钟，逻辑不动）；加密轮次倒数的是本轮结束 `Closes in`；其他长期事件倒数的只是预计结束日期，过了还可能继续交易，所以写 `Expected to end in`。体育的概率写 `78% chance Magic wins`，其他写 `64% chance`。桌面下单卡右上同样的时间说法（不加概率，按钮上已有价格）。",
    spec: [
      { state: "体育赛前", when: "sportsClock.phase === 'upcoming'", visual: "`Kicks off in 16h 08m · 78% chance Magic wins`", source: "SportsClockLabel line · kicks_off_in" },
      { state: "体育比赛中", when: "phase === 'live'", visual: "`● LIVE · Q3 04:12 · 78% chance Magic wins`", source: "SportsClockLabel line" },
      { state: "加密轮次", when: "/UPDOWN/.test(event_subtype)", visual: "`Closes in 12:30 · 64% chance`", source: "LiteContractTrade ticketTimeLabel · LiteQuickTrade" },
      { state: "长期事件", when: "其他", visual: "`Expected to end in 45d 3h · 31% chance`", source: "ticketTimeLabel" },
    ],
  },
];

/* ---------------- ③ 持仓（TR-10…TR-12） ---------------- */

const POSITION_CASES: SectionCase[] = [
  {
    key: "trade-tr10",
    label: "TR-10 · 交易页持仓条 · 单仓（LitePositionCard）",
    note: "binary 单仓，5× Boost + hot auto-close。sideLabel 只传 `Yes` —— `· 5× Boost` 后缀由 LitePositionCard 依 boost prop 自加，生产接线即如此，手写会渲染成两次。auto-close 列三态见 AC-T1…T3。",
    spec: [
      { state: "单仓", when: "heldPos != null && !boardMode", visual: "一张卡：side 标签 + PUT IN / NOW WORTH / PROFIT / EST. AUTO-CLOSE + Cash out", source: "LiteContractTrade.YourPosition" },
      { state: "hot", when: "价格逼近 auto-close 位", visual: "auto-close 值 trading-red + `Close to current price`", source: "autoCloseHot" },
      { state: "In review", when: "inReview === true", visual: "Cash out 禁用并显示 IN_REVIEW_HOLD_LINE", source: "cashOutDisabledText" },
      { state: "移动紧凑", when: "isMobile", visual: "列标题 `Est. auto-close` → `Auto-close`", source: "compact prop" },
    ],
  },
  {
    key: "trade-tr11",
    label: "TR-11 · 交易页持仓条 · multiHeld 多仓列表",
    spec: [
      { state: "多仓", when: "boardMode && multiHeld.length > 0", visual: "每条腿一张卡，纵向堆叠；标题为 side-label 或 `{option} · Yes|No`", source: "LiteContractTrade.MultiPositions" },
      { state: "1× 腿", when: "boost === 1", visual: "标题不加 `1× Boost` 后缀（全站铁律）", source: "LitePositionCard boost>1 分支" },
      { state: "亏损腿", when: "profit < 0", visual: "PROFIT 走 trading-red 且前缀为 −", source: "PosCell tone" },
    ],
  },
  {
    key: "trade-tr12",
    label: "TR-12 · 交易页持仓条 · voucher 来源仓",
    note:
      "2026-11-18 起券单不再是「普通持仓卡 + Voucher 徽标」，改成独立的券卡 `LiteVoucherCard`（四格 VOUCHER / PROFIT NOW / MAX PROFIT / CLOSES BY）。本帧挂的就是那张券卡；全部状态见下面「③c 券单」TR-37 … TR-40。原来的 fixture prop `voucherTag` 已删除。",
    spec: [
      { state: "voucher 仓", when: "position.airdropSource === voucher", visual: "券卡（见 TR-37），不进普通持仓卡列表", source: "LiteVoucherLegs → LiteVoucherCard" },
      { state: "普通仓", when: "非 voucher", visual: "普通持仓卡（TR-10 / TR-11）", source: "LitePositionCard" },
    ],
  },
];

/* ---------------- ③b 下单成功提示 + 定位到持仓卡（TR-35 / TR-36 · CPO 2026-11-18） ---------------- */

const PLACED_CASES: SectionCase[] = [
  {
    key: "trade-tr35",
    label: "TR-35 · 下单成功提示 · Boost 2× 及以上（标题 + 副行 + View your call）",
    note: "帧内静态还原 sonner 提示（PlacedToastBody，与 showPlacedToast() 共用同一组文案）。提示样式沿用全站现有提示：页面同色底 + 细边框 + 白色实心对勾，按钮是白底黑字（24px 高）。Boost、Standard、加密快轮三种 Lite 交易页共用。",
    spec: [
      { state: "Boost ≥ 2×", when: "买入成交且 boost > 1", visual: "标题 `Bought {side} · {投入金额}`；副行 `{boost}× Boost · {仓位金额} position`；按钮 `View your call`", source: "LiteContractOrderPanel → showPlacedToast" },
      { state: "停留时间", when: "任何一次买入成功", visual: "6 秒后自动消失（全站其他提示仍是默认约 4 秒）；点按钮即关闭", source: "PLACED_TOAST_MS" },
      { state: "手机", when: "isMobile", visual: "下单抽屉先收起，提示出现在页面顶部，内容与桌面相同", source: "LiteContractTrade onFilled" },
      { state: "不变", when: "平仓 / 反向买入把持仓平掉", visual: "仍是原来的 `Cashed out …` 提示，没有按钮", source: "LiteContractOrderPanel reduce / close 分支" },
    ],
  },
  {
    key: "trade-tr35b",
    label: "TR-35b · 下单成功提示 · 1× 或 Standard（只有标题 + View your call）",
    note: "1× 没有 Boost 可说，Standard 没有 Boost，这两种情况不出副行。",
    spec: [
      { state: "Boost 1×", when: "买入成交且 boost === 1", visual: "标题 `Bought {side} · {投入金额}`，无副行", source: "LiteContractOrderPanel → showPlacedToast" },
      { state: "Standard", when: "Standard 交易页买入成交（新开或加仓）", visual: "标题 `Bought {side} · {投入金额}`（金额 = 实际从余额扣掉的钱，份数取整所以可能比输入少几分），无副行", source: "LiteOrderPanel → showPlacedToast" },
      { state: "Standard 反向买入", when: "买另一边、把手里的持仓冲掉（intent reduce / close）", visual: "仍是原来的 `Bought N shares · {side}`，没有按钮（没有新单可看）", source: "LiteOrderPanel" },
    ],
  },
  {
    key: "trade-tr35c",
    label: "TR-35c · 下单成功提示 · 多 market 事件（标题带选项名）",
    note: "多 market 事件里每个选项都能买 Yes / No，标题必须写出是哪个选项——写法和持仓卡标题一致。",
    spec: [
      { state: "多 market", when: "event.options.length > 2 的事件上买入成交", visual: "标题 `Bought {选项名} · {Yes|No} · {投入金额}`，如 `Bought Lakers · Yes · $10.00`；副行与按钮同 TR-35", source: "LiteContractOrderPanel.toastOptionName（LiteContractTrade multiPanelProps 传入）" },
      { state: "两边对打的事件", when: "球队 / Up-Down 等带 side labels 的事件", visual: "只写那一边（`Bought Magic · $10.00`），不变", source: "sideLabel" },
    ],
  },
  {
    key: "trade-tr36",
    label: "TR-36 · 点 View your call 之后 · 持仓卡描边 1.5 秒",
    note: "fixture-only prop `flashOpen` 让卡片一直保持描边态；生产里描边由 focusYourCall 加上、1.5 秒后去掉。Standard 与加密快轮页的持仓卡（SpotYourPosition）是同一条规则。",
    spec: [
      { state: "点了按钮", when: "点提示上的 View your call", visual: "页面平滑滚动，把这笔单的持仓卡滚到视窗中间；卡片出现主色描边 + 一圈淡光，停留 1.5 秒后淡出", source: "focusYourCall" },
      { state: "多盘口页", when: "boardMode 且有多条持仓", visual: "滚到刚买的那一条（按 option id 匹配）；等约 2 秒还匹配不到，才滚到页面上第一张持仓卡", source: "data-lite-your-call = optionId" },
      { state: "卡片还没出来", when: "成交后持仓列表还在刷新", visual: "最多等约 2 秒，卡片出现后再滚动描边；页面上一张持仓卡都没有就不动", source: "focusYourCall retry" },
    ],
  },
];

/* ---------------- ③c 券单（TR-37 … TR-40 · CPO 2026-11-18） ---------------- */

const VOUCHER_CASES: SectionCase[] = [
  {
    key: "trade-tr37",
    label: "TR-37 · 券单持仓卡 · Boost 页 · 赚着",
    note: "券单有自己的卡（LiteVoucherCard），不走普通持仓卡：没有 PUT IN / NOW WORTH / 自动平仓，也没有「最多会亏」那一行。数字全部来自 voucherCredit()（src/lib/voucherMath.ts）。",
    spec: [
      { state: "标题", when: "Boost 交易页上的券单", visual: "`{买的哪边} · 5× Boost` + VOUCHER 标（柠檬绿胶囊）。买的哪边按选边色（Yes 青 / No 柠檬绿）", source: "LiteVoucherLegs → LiteVoucherCard" },
      { state: "四格", when: "任何券单", visual: "VOUCHER = 券面值；PROFIT NOW = 现在平仓能拿到的利润；MAX PROFIT = 这张券的利润上限；CLOSES BY = 券单到期时间", source: "voucherCredit / voucherExpiresAt" },
      { state: "按钮 · 赚着", when: "现在平仓利润 > 0", visual: "`Cash out · keep +$0.04`", source: "CashOutKeepLabel" },
      { state: "可定位", when: "兑换后点提示上的 View your call", visual: "滚到这张卡并描边 1.5 秒（同 TR-36）", source: "data-lite-your-call = optionId" },
    ],
  },
  {
    key: "trade-tr37b",
    label: "TR-37b · 券单持仓卡 · Boost 页 · 没利润",
    spec: [
      { state: "PROFIT NOW", when: "现在平仓利润 = 0（打平或亏着）", visual: "`$0.00`，白字；价格低于买入价时下面多一行小字 `down right now`", source: "credit = clamp(rawPnl, 0, cap)" },
      { state: "按钮", when: "利润 = 0", visual: "只写 `Cash out`，不带金额", source: "LiteVoucherCard" },
    ],
  },
  {
    key: "trade-tr37c",
    label: "TR-37c · 券单持仓卡 · Standard 页（不写倍数）",
    note: "Standard 是现货：券在 Standard 事件上兑换 = 用券面值买一笔等额现货。标题绝不出现倍数或 Boost 字样（DESIGN.md §Addendum 2026-11-18）。",
    spec: [
      { state: "标题", when: "Standard 交易页 / 现货快轮页上的券单", visual: "`{买的哪边}` + VOUCHER 标，没有 `5× Boost`", source: "LiteVoucherLegs line=\"spot\" → boost=1" },
      { state: "算法", when: "券兑换在 Standard 事件上", visual: "份数 = 面值 ÷ 买入价；利润 = (现价 − 买入价) × 份数，仍受利润上限限制", source: "voucherLeverageFor(\"spot\") = 1" },
    ],
  },
  {
    key: "trade-tr37d",
    label: "TR-37d · 券单持仓卡 · 多 market（选项 · Yes / No）",
    spec: [
      { state: "多 market", when: "多 market 事件上的券单", visual: "标题 `{选项名} · {Yes|No} · 5× Boost` + VOUCHER 标；No 一边用柠檬绿", source: "legTitle(resolveLegSide())" },
    ],
  },
  {
    key: "trade-tr38",
    label: "TR-38 · 兑换成功提示（顶部 · 带 View your call）",
    note: "取代原来右下角那条 `Voucher redeemed / Your position is now active.`。和普通买入提示是同一个组件、同一个位置、同样停 6 秒。",
    spec: [
      { state: "文案", when: "券兑换成功并跳到交易页", visual: "标题 `Bought {买的哪边}`；副行 `Paid with your {面值} voucher`；按钮 `View your call`", source: "RedeemVoucherContent → showPlacedToast" },
      { state: "点按钮", when: "点 View your call", visual: "滚到这张券单卡并描边 1.5 秒（卡片还没渲染出来最多等约 2 秒）", source: "focusYourCall" },
    ],
  },
  {
    key: "trade-tr38b",
    label: "TR-38b · 兑换成功提示 · 多 market",
    spec: [
      { state: "多 market", when: "兑换在多 market 事件的某个选项上", visual: "标题 `Bought {选项名} · {Yes|No}`，如 `Bought Lakers · Yes`", source: "PickedOption.legTitle" },
    ],
  },
  {
    key: "trade-tr39",
    label: "TR-39 · 券单平仓面板 · 赚着",
    note: "帧内用 fixture-only prop `inline` 把弹层画在页面流里（生产是桌面居中 Dialog / 手机底部抽屉，壳样式在 VoucherLayer 里同一处定义）。券单只能全平：没有 25 / 50 / 100、没有滑杆、文案不写百分比。",
    spec: [
      { state: "标题行", when: "券单的平仓面板", visual: "`Cash out` + VOUCHER 标", source: "VoucherLayer titled" },
      { state: "主体", when: "现在平仓利润 > 0", visual: "一行 `Profit so far on your {买的哪边} call`（那一边粗体 + 选边色）→ 大号柠檬绿 `+$0.04` → `Cash out now and it's yours.`", source: "VoucherCashOutBody" },
      { state: "一行", when: "同上", visual: "左 `Keep it open and it can earn up to`，右 = 利润上限", source: "cap" },
      { state: "按钮", when: "同上", visual: "`Cash out · keep +$0.04`，点了整笔平掉", source: "closePosition(airdropId, { silent })" },
    ],
  },
  {
    key: "trade-tr39b",
    label: "TR-39b · 券单平仓面板 · 没利润",
    note: "面板只有两种状态，只看一个条件：现在平仓能不能拿到利润。打平和亏着是同一版，文字不随价格变。",
    spec: [
      { state: "主体", when: "现在平仓利润 = 0", visual: "大字 `No profit right now` → `on your {买的哪边} call` → 细线 → 说明：现在平什么都拿不到、余额不受影响；留着还有可能在结算前赚到", source: "VoucherCashOutBody" },
      { state: "按钮", when: "同上", visual: "`Keep it open`（关掉面板）/ `Close anyway`（整笔平掉）", source: "同上" },
    ],
  },
  {
    key: "trade-tr39c",
    label: "TR-39c · 券单平仓面板 · 多 market",
    spec: [
      { state: "多 market", when: "多 market 事件上的券单", visual: "那一行写 `{选项名} · {Yes|No}`，No 一边柠檬绿", source: "leg / isYes" },
    ],
  },
  {
    key: "trade-tr40",
    label: "TR-40 · 平仓之后 · 有利润 · 账户里没钱",
    note: "券单平掉后弹这一层，不再自动弹分享海报。这一层不说利润怎么提（有条件 / 无条件两种券都适用），那些在 Vouchers 页的 Voucher earnings 卡上。",
    spec: [
      { state: "主体", when: "这次平仓拿到利润", visual: "庆祝款猞猁插画 → 大号柠檬绿 `+$0.04` → `profit from this voucher` → `You can find it under Voucher earnings.`", source: "VoucherDoneBody" },
      { state: "引导句", when: "账户里没钱", visual: "`Ready for the next one? Top up and you're in.`", source: "funded = false" },
      { state: "主按钮", when: "账户里没钱（两个账户的余额向下取整都 < $1）", visual: "`Deposit`（桌面开充值弹窗，手机进 /deposit）", source: "funded" },
      { state: "副按钮", when: "有利润", visual: "`Go to Vouchers` → /vouchers", source: "won" },
    ],
  },
  {
    key: "trade-tr40b",
    label: "TR-40b · 平仓之后 · 有利润 · 账户里有钱",
    spec: [
      { state: "引导句", when: "任一账户余额向下取整 ≥ $1", visual: "只有前半句 `Ready for the next one?`，不提充值", source: "funded = true" },
      { state: "主按钮", when: "同上", visual: "`Browse markets` → /events", source: "funded" },
    ],
  },
  {
    key: "trade-tr40c",
    label: "TR-40c · 平仓之后 · 没利润 · 还有别的券",
    spec: [
      { state: "主体", when: "这次平仓利润 = 0", visual: "通用款猞猁插画 → `Voucher call closed` → `No profit this time.`", source: "VoucherDoneBody" },
      { state: "副按钮", when: "还有没领或没用的券", visual: "`Use another voucher` → /vouchers", source: "grantedVouchers + claimedVouchers" },
    ],
  },
  {
    key: "trade-tr40d",
    label: "TR-40d · 平仓之后 · 没利润 · 没有别的券 · 账户里没钱",
    spec: [
      { state: "副按钮", when: "没有别的券且账户里没钱", visual: "`Browse markets`（主按钮仍是 Deposit）", source: "hasOtherVoucher = false" },
    ],
  },
  {
    key: "trade-tr40e",
    label: "TR-40e · 平仓之后 · 没利润 · 没有别的券 · 账户里有钱",
    spec: [
      { state: "只有一个按钮", when: "没有别的券且账户里有钱", visual: "主按钮 `Browse markets`，不显示副按钮（不重复）", source: "secondary = null" },
    ],
  },
];

/* ---------------- ④ 侧栏与账本（TR-13 / TR-14） ---------------- */

const RAIL_CASES: SectionCase[] = [
  {
    key: "trade-tr13",
    label: "TR-13 · More markets 侧栏 rail（TradeMoreMarkets）",
    spec: [
      { state: "有兄弟市场", when: "more.length > 0", visual: "题名 + Yes% + chevron，整行点击进 `/trade?event={id}`", source: "LiteContractTrade.MoreMarkets" },
      { state: "空", when: "more.length === 0", visual: "EmptyState `No other markets right now` / `New markets show up here as they open.`", source: "EmptyState variant=module" },
      { state: "已结算事件", when: "resolved === true", visual: "标题改为 `Still live`", source: "MoreMarkets title" },
    ],
  },
  {
    key: "trade-tr14",
    label: "TR-14 · market activity 账本（有行态 + 空态两帧）",
    note:
      "同一 case 内两帧：上=有行，下=空态。空态逐字 `No activity yet` / `Trades on this market show up here as people buy in.`",
    spec: [
      { state: "有行", when: "rows.length > 0", visual: "行句式 `5m · Bought Yes · Jeonbuk · 1× · $121`；时间/动作/上下文/金额四列固定序", source: "LiteMarketActivity ROW_GRID" },
      { state: "空态", when: "rows.length === 0", visual: "`No activity yet` + `Trades on this market show up here as people buy in.`", source: "EmptyState variant=module" },
      { state: "binary 上下文", when: "showOptionLabel === false", visual: "上下文列只出 boost，不出 option 名（页面本身就是市场）", source: "context 分支" },
      { state: "settled 空态", when: "resolved === true && rows.length === 0", visual: "模块整体不渲染（已结算市场不会再有人买入，空态文案语境错误）；settled 但有历史成交行时照常渲染", source: "LiteContractTrade / LiteSpotTrade MarketActivity" },
    ],
  },
];

/* ---------------- ⑤ 终态与中间态（TR-15…TR-19） ---------------- */

const TAIL_CASES: SectionCase[] = [
  {
    key: "trade-tr15",
    label: "TR-15 · settled 终态 · 未持有（LiteOutcomeCard）",
    note:
      "逐字：`You didn't hold this market.` + summary 句 + CTA `Browse live markets →`。终态页的 Market activity 若无历史成交行则整个模块不渲染（见 TR-14 settled 空态行）。",
    spec: [
      { state: "resolved", when: "event.is_resolved === true", visual: "下单面板整体撤下，页顶换成结果卡；移动底栏 CTA 变 `View in Portfolio →`", source: "LiteContractTrade resolved 分支" },
      { state: "未持有", when: "heldPos == null", visual: "虚线框 `You didn't hold this market.` + Browse CTA", source: "LiteOutcomeCard 非 holding 分支" },
      { state: "无赔率历史", when: "!isMulti && oddsHistory.length < 2 && base_price == null", visual: "图表模块整体隐藏，绝不补合成数据", source: "hideSettledChart" },
    ],
  },
  {
    key: "trade-tr16",
    label: "TR-16 · settled 终态 · 持仓派彩（LiteOutcomeCard.holding）",
    note:
      "派彩句式逐字（生产 LiteOutcomeCard holding 分支）：`Settled` + 结果两行 `Yes $1.00` / `No $0.00`；`Your result` + side 徽标 + `5× Boost` 徽标；三格 `You put in` / `Paid out` / `Profit`；尾行 `Settled from Nasdaq · see evidence`。生产 /trade 不传 resultLine，故无附加说明句。",
    spec: [
      { state: "持有获胜腿", when: "heldPos != null && 胜方", visual: "Your result 三格 + Profit 走 trading-green", source: "LiteOutcomeCard.holding" },
      { state: "Boost 徽标", when: "holding.boost > 1", visual: "Volt→Pulse 渐变 `5× Boost` 胶囊；1× 不渲染", source: "holding.boost 分支" },
      { state: "有来源", when: "source_name != null", visual: "`Settled from {source} · see evidence ↗`", source: "sourceName / sourceUrl" },
    ],
  },
  {
    key: "trade-tr17",
    label: "TR-17 · HOW IT SETTLED 证明卡（HowItSettled）",
    note:
      "上帧逐字两句：`Resolved YES. Winning shares pay $1 each, credited automatically at settlement.` + `Settled by the OmenX team from the official result.`（后者是 sourceName 为空时的生产兜底句）。下帧为有数值判据 + 有来源的形态。",
    spec: [
      { state: "无来源", when: "sourceName == null", visual: "结尾句 `Settled by the OmenX team from the official result.`", source: "HowItSettled 兜底分支" },
      { state: "有数值判据", when: "base_price != null && close_price != null", visual: "Needed / Actual 两行 + `Settled from {source} · Official result ↗`", source: "HowItSettled.criterion" },
      { state: "引擎词改写", when: "summary 含 `Not Up`", visual: "改写为 `didn't go up`", source: "consumerText()" },
    ],
  },
  {
    key: "trade-tr18",
    label: "TR-18 · In review · result pending（InReviewCard + 面板 blocked）",
    note:
      "逐字：徽标 `In review`；`Result is under review. Payout once confirmed.`；持仓时追加 `Cash out is paused while the result is under review.`；`Result comes from Nasdaq official close.`；面板 CTA 变 `In review` 且禁用。",
    spec: [
      { state: "in review", when: "!is_resolved && lifecycle_status === 'REVIEW'（end_date 已过）", visual: "规则位换成橙轴 InReviewCard，面板 blocked", source: "LiteContractTrade.inReview" },
      { state: "持有", when: "heldPos != null || multiHeld.length > 0", visual: "追加 cash-out 暂停句；持仓卡 Cash out 禁用", source: "holding prop / cashOutDisabledText" },
      { state: "blockedReason", when: "inReview === true", visual: "CTA 文案 = IN_REVIEW_BADGE（`In review`）", source: "blockedReason 分支" },
      { state: "倒计时", when: "已过期（remaining ms <= 0）", visual: "面板头钳为 `00:00:00`，绝不显示剩余时间", source: "formatClockCountdown" },
    ],
  },
  {
    key: "trade-tr19",
    label: "TR-19 · 交易页 loading 骨架",
    spec: [
      { state: "loading", when: "loading === true（事件与选项未到达）", visual: "整屏居中 Loader2 旋转，无内容占位", source: "LiteContractTrade loading 分支" },
      { state: "无 event 参数", when: "!eventId", visual: "重定向 /events（不是死链）", source: "Navigate to /events" },
      { state: "查无事件", when: "notFound || !event", visual: "ExpiredEventFallback", source: "ExpiredEventFallback" },
    ],
  },
];

/* ---------------- ⑥ 多市场与 game lines（TR-20…TR-23） ---------------- */

const MULTI_CASES: SectionCase[] = [
  {
    key: "trade-tr20",
    label: "TR-20 · sports 多市场组 · WINNER 组（LiteBoardGroupHeader + LiteMarketBoard）",
    spec: [
      { state: "组标题", when: "event.options.length > 1", visual: "`WINNER / REGULATION TIME` + ⓘ 释义", source: "LiteBoardGroupHeader" },
      { state: "行未选中", when: "selectedId !== option.id", visual: "每行：题名 + CHANCE% + Yes¢ / No¢ 双 chip（Ulsan 19 / Draw 23 / Jeonbuk 58）", source: "LiteMarketBoard" },
      { state: "行选中", when: "selectedId === option.id", visual: "行下方手风琴展开 `YES · CHANCE OVER TIME` 图（Sample data）", source: "LiteBoardChart" },
      { state: "行已结算", when: "option.settled", visual: "该行沉到板底并标出结果", source: "ordered / outcomeYes" },
    ],
  },
  {
    key: "trade-tr21",
    label: "TR-21 · 两把尺 · HANDICAP + TOTAL GOALS（LiteLineScrubber）",
    note: "HANDICAP −2.5 / −1.5 / +1.5 / +2.5，行题 `ULS +1.5 covers`；TOTAL 0.5…4.5，行题 `Over 2.5 goals`。",
    spec: [
      { state: "选中一档", when: "value === line", visual: "尺上该档高亮，行价格与图随之切换", source: "LiteLineScrubber value" },
      { state: "换档保持选中", when: "切换后同侧兄弟事件存在", visual: "选中跳到新兄弟的 option id，手风琴图不收起", source: "LiteContractTrade.changeLine" },
      { state: "compact 窗口", when: "compact === true（移动帧）", visual: "只显示 4 档窗口，可横向滚动到边缘", source: "LiteLineScrubber compact" },
    ],
  },
  {
    key: "trade-tr22",
    label: "TR-22 · sports 进行中比赛（kickoff 已过）",
    note:
      "偏差回报：生产 /trade **不渲染分钟 / 比分 / phase**——live 脉冲与比分只存在于 /events 的 SportsStageCard。交易页对「进行中」的唯一真身是 freeze_time（= kickoff）已过 → blocked，CTA 文案 `Closed`。本 case 照生产真身收录，不新造 live 头。",
    spec: [
      { state: "kickoff 已过", when: "freeze_time <= now && !is_resolved", visual: "板照常可读，下单面板 CTA `Closed` 且禁用", source: "pastFreeze / blockedReason" },
      { state: "板仍可浏览", when: "任何未结算态", visual: "组标题 + 行 + 手风琴图不受 blocked 影响", source: "LiteMarketBoard" },
      { state: "分钟/比分", when: "—", visual: "交易页不渲染（见上方偏差回报）", source: "SportsStageCard（/events 侧）" },
      { state: "倒计时", when: "kickoff 已过（remaining ms <= 0）", visual: "面板头钳为 `00:00:00`", source: "formatClockCountdown" },
    ],
  },
  {
    key: "trade-tr23",
    label: "TR-23 · 非 sports 多市场板（LiteMarketBoard · showChart）",
    spec: [
      { state: "通用多市场", when: "isMulti && !hasLines", visual: "eyebrow `· 4 markets` + 单板四行 + 选中行手风琴图", source: "LiteContractTrade.MarketBoard" },
      { state: "行内 Yes/No", when: "任意行", visual: "每行两个 chip，点击即绑定订单侧", source: "onSelect / onRowSelect" },
    ],
  },
  {
    key: "trade-tr25",
    label: "TR-25 · sports 分段板 · CS2 BO3（Series lines + Map 1/2/3）",
    note:
      "分组由生产函数 groupSegmentedMarkets() 算出；BO3 = 4 组 10 行。fixture 取 segment_index: 2，因此同帧覆盖三种分组注记：Map 1 已打完（终比分）、Map 2 进行中（LIVE + 现比分）、Map 3 未开打。每组让分尺的档位状态互相独立。",
    spec: [
      { state: "Series lines 组", when: "sport === \"esports\" && segments_key 命中 SPORT_SEGMENTS", visual: "组头 `SERIES LINES / {HOME} VS {AWAY} · {联赛} · BO3` + Match winner / Map {当前段} winner / Map handicap / Total maps 四行", source: "groupSegmentedMarkets → grp-series" },
      { state: "当前段 mapwin 唯一", when: "currentSegment != null", visual: "Series lines 组里只出一条 mapwin 行，题名跟随当前段", source: "series.mapwin（id 后缀 -mapwin-{n}）" },
      { state: "分段组 · 已打完", when: "results[n-1] != null && n < idx", visual: "组头 `MAP {n}` + 右侧终比分注记", source: "segmentAnnotation(n)" },
      { state: "分段组 · 进行中", when: "n === idx && status === \"live\"", visual: "组头 `MAP {n}` + LIVE 药丸 + 现比分注记", source: "segmentAnnotation(n) / AnnotLivePill" },
      { state: "分段组 · 未开打", when: "results[n-1] == null && n > idx", visual: "组头 `MAP {n}` + `NOT PLAYED YET`", source: "segmentAnnotation(n)" },
      { state: "让分尺各组独立", when: "segLines[grp-seg-1] !== segLines[grp-seg-2]", visual: "改 Map 1 的档位，Map 2 / Map 3 的档位与行题不动", source: "LiteContractTrade.segLines（按 group.key 分键）" },
    ],
  },
  {
    key: "trade-tr26",
    label: "TR-26 · sports 分段板 · MMA（Fight lines + Method）",
    note:
      "MMA 没有分段组：SPORT_SEGMENTS 的 decisiveThreshold 为 null，回合不计分，因此只有 grp-fight 与 grp-method 两组共 5 行。退款口径句落在 TradeRuleCard，不在组头。",
    spec: [
      { state: "Fight lines 组", when: "sport === \"mma\"", visual: "组头 `FIGHT LINES / {赛事} · 5 ROUNDS` + Fight winner + Total rounds 两行", source: "groupSegmentedMarkets → grp-fight" },
      { state: "Method 组", when: "method/distance 兄弟存在", visual: "组头 `METHOD / HOW THE FIGHT ENDS` + Goes the distance / Won by KO/TKO / Won by submission 三行", source: "groupSegmentedMarkets → grp-method" },
      { state: "退款口径", when: "segGroups.some(g => g.key === \"grp-method\")", visual: "规则卡追加 `A draw or No Contest voids the Method markets — those stakes are refunded in full.`", source: "LiteContractTrade.methodRefundLine" },
      { state: "无分段组", when: "spec.decisiveThreshold === null", visual: "不渲染任何 `MAP n` / `ROUND n` 分组头", source: "groupSegmentedMarkets（mma 分支不产 seg 组）" },
    ],
  },
];

/* ---------------- ⑦ Boost 全档（TR-24） ---------------- */

const BOOST_CASES: SectionCase[] = [
  {
    key: "trade-tr27",
    label: "TR-27 · Lite → Pro 定价入口（LimitOrderHint · SW-2）",
    note:
      "CTA 下方**只有一行**脚注（OR 规则）：金额为空 → `Want to place a limit order? Pro ›`；金额 > 0 → 原来的风险句 `Not guaranteed. You can lose your full $X.`，两者永不叠两行。\"limit order\" 是 Lite 禁词的批准例外（通往 Pro 的入口可点名 Pro 概念，同事件页脚 escape hatch）。入口只给登录且**该账号**在本设备从未渲染过 Pro 的读者看（localStorage `omenx_pro_visited:<uid>`）；点击 = 切 Pro + 保留事件 + Pro 面板落在 `Limit`（sessionStorage `omenx_open_limit` 15 s 窗口）。手机抽屉同位。",
    spec: [
      { state: "入口", when: "user != null && !hasVisitedPro(user.id) && amountNum === 0", visual: "脚注行 text-[10px] muted，`Pro ›` 为 text-primary 粗体；风险句不显示", source: "LimitOrderHint" },
      { state: "风险句", when: "amountNum > 0（不论是否满足入口条件）|| 游客 || 该账号渲染过 Pro", visual: "同一行位显示风险句，入口不渲染", source: "LimitOrderHint fallback" },
      { state: "点击", when: "onClick", visual: "桌面：同路由切 Pro；手机：跳 /trade/order?event=；Pro 面板 orderType 初始为 Limit", source: "requestOpenLimit / consumeOpenLimit" },
    ],
  },
  {
    key: "trade-tr27b",
    label: "TR-27b · 同账号未进过 Pro · 已输入 $25 → 风险句顶替入口",
    spec: [
      { state: "有金额", when: "amountNum > 0", visual: "1×：`Not guaranteed. You can lose your full $25.04.`（金额 = 最多亏，含开仓费）；Boost：`Not guaranteed. With Boost you can lose more than you put in.`；入口消失，清空金额入口回来", source: "LimitOrderHint amountEntered" },
    ],
  },
  {
    key: "trade-tr27c",
    label: "TR-27c · 多 market 面板（选项名非 Yes/No）· 同一行位的入口",
    note: "Lite 三种下单面板（合约 Binary / 合约多 market / 现货）与手机抽屉共用 LimitOrderHint，行位、字号、灰度一致。入口记在 localStorage `omenx_pro_visited:<uid>`（按账号 + 按设备）：换一台设备会再看到一次，属既定口径。15 s 窗口过期后 Pro 面板落在 Market，无提示。",
    spec: [
      { state: "入口（多 market）", when: "同 TR-27 条件", visual: "选项名 `Charles Leclerc / Not Leclerc` 两钮，CTA 下同一行 `Want to place a limit order? Pro ›`", source: "LimitOrderHint（LiteContractOrderPanel 多 market 分支）" },
    ],
  },
  {
    key: "trade-tr28",
    label: "TR-28 · Boost limit reached（账户 Risk ≥ 95%，Pro 的 Close-only 在 Lite 的写法）",
    note: "与 Pro RM-D1 / RM-M3 同一条件（useRealtimeRiskMetrics.riskLevel ∈ {RESTRICTION, LIQUIDATION}）。Lite 词：不出现 Risk / Margin。手机 dock 两钮不置灰（点开抽屉后 CTA 置灰印这句），Boost check 已是 `Auto-close soon`。",
    spec: [
      { state: "close-only", when: "risk.riskLevel === 'RESTRICTION' || 'LIQUIDATION'", visual: "CTA 置灰 `Boost limit reached — close a position first`（优先级低于 Settled / In review / Closed）", source: "LiteContractTrade blockedReason · BOOST_LIMIT_REACHED" },
    ],
  },
  {
    key: "trade-tr24",
    label: "TR-24 · Boost selector 全档态（1× / 2× / 5× / 10× / 20× + Custom 展开）",
    note:
      "Where things live：档位行始终在 HOW MUCH 与 Returns 之间；Custom 胶囊固定为行尾第 6 位；托盘就地展开在同一张卡内，绝不弹二级 dialog / drawer。",
    spec: [
      { state: "档位选中", when: "value === tier", visual: "Volt→Pulse 渐变底 + 内描边，数字走 yes 轴", source: "LiteBoostSelector.SELECTED_STYLE" },
      { state: "1× 基线", when: "value < 2", visual: "托盘输入为空 + 占位区间，滑杆停在 2×", source: "atBaseline / trayValue" },
      { state: "Custom 展开", when: "fixture.boostTrayOpen（生产为点击）", visual: "行下就地展开输入 + 滑杆，Custom 胶囊显示 `7×`", source: "defaultTrayOpen / isCustom" },
      { state: "上限提示", when: "任何状态", visual: "行右上 `Up to 20×`", source: "maxBoost" },
    ],
  },
];

const Pair = ({
  cases,
  desktopMin,
  mobileMin,
}: {
  cases: SectionCase[];
  desktopMin?: number;
  mobileMin?: number;
}) => (
  <div className="space-y-6">
    <SectionFrame cases={cases} device="desktop" minHeight={desktopMin ?? 360} />
    <SectionFrame cases={cases} device="mobile" minHeight={mobileMin ?? 420} />
  </div>
);

/* TR-29 · sports fixtures · time slot (CPO 2026-11-04) */
const SRC_CLOCK = "DESIGN §Addendum 2026-11-04b · 体育比赛的交易时间";
const SPORTS_CLOCK_CASES: SectionCase[] = [
  {
    key: "trade-tr29",
    label: "TR-29 · 体育下单卡 · 开赛前（SportsClockLabel · upcoming）",
    note: "体育比赛（metadata.kickoff_at 存在，含让分 / 大小分子盘）的下单卡右上不再写倒计时（2026-11-16 起开赛前写 `Kicks off in …`，非体育见 TR-34）：比赛打没打完只听比赛状态，预计结束时间 end_date 不显示、不关交易。四态见 TR-29 … 29d；手机同一句在下单抽屉标题下一行（LiteContractTrade，line 变体），Pro 页头与赛事下拉同口径（ES-D5 / ES-M2）。",
    spec: [
      { state: "开赛前", when: 'matchPhase(e) === "upcoming"（match_status scheduled / postponed，或 kickoff > now）', visual: "`Kicks off in 2h 10m`（2026-11-16 起，原 `Starts in`）（≥ 24 小时也写小时 `26h 10m`，2026-11-16 起，原 `2d 19h`；<1 小时 `38:12` 按秒跳），mono 11 muted；可以交易", source: "sportsClock.tsx kickoffInShort · " + SRC_CLOCK },
    ],
  },
  {
    key: "trade-tr29b",
    label: "TR-29b · 体育下单卡 · 比赛中（● LIVE · 比赛时钟）",
    spec: [
      { state: "比赛中", when: 'matchPhase(e) === "live"（kickoff 已过、数据源未报结束、未过兜底）', visual: "红点脉动 + `LIVE · P2 12:04`；时钟与记分牌同一个值（liveLabelFor），数据源没给时钟只写 `● LIVE`；可以交易", source: "SportsClockLabel card · liveLabelFor" },
    ],
  },
  {
    key: "trade-tr29c",
    label: "TR-29c · 体育下单卡 · 比赛中、已过预计结束（加时 / 拖延）",
    note: "这就是原来出 `00:00 left` 的情况。end_date 过了但数据源仍报在打 → 照样是 TR-29b 的样子，照样能交易。演示赛：Toronto Maple Leafs vs Seattle Kraken（demo-live-ot-nhl，加时中、预计结束已过 20 分钟）。",
    spec: [
      { state: "过了预计结束", when: 'now > end_date && matchPhase(e) === "live"', visual: "`● LIVE · OT 3:21`；任何时候都不会出现 00:00", source: SRC_CLOCK },
      { state: "兜底", when: "now > end_date + 3 小时 且仍没收到结束信号", visual: "自动按打完处理 → TR-29d（防数据源掉线时交易一直开着）", source: "sportsData SPORTS_WATCHDOG_MS" },
    ],
  },
  {
    key: "trade-tr29d",
    label: "TR-29d · 体育下单卡 · 打完等结果（Final · In review）",
    spec: [
      { state: "打完等结果", when: 'matchPhase(e) === "final"（lifecycle REVIEW、match_status final / cancelled、或兜底）', visual: "右上 `Final ·` + 描边胶囊 `IN REVIEW`；CTA 置灰印 `In review`，页面下单区换成 InReviewCard（TR-18 同一张）", source: "LiteContractTrade inReview · contractGate" },
      { state: "已结算", when: "is_resolved", visual: "现有 Settled 结算卡，不变", source: "TR-15 / TR-16" },
    ],
  },
  {
    key: "trade-tr29e",
    label: "TR-29e · 体育下单卡 · 到了开赛时间、比赛还没开打（Starting soon）",
    note: "CPO 2026-11-16：整页说法统一——舞台 S6d、记分牌 M2b、下单卡、Sports 列表与首页都写 Starting soon，列表也不把它算成正在打。以前这里会写 `Kicks off in 00:00`。",
    spec: [
      { state: "到点未开打", when: 'matchPhase(e) === "upcoming" && kickoff ≤ now（match_status scheduled / postponed）', visual: "右上 `Starting soon`（mono 11 muted）；手机抽屉标题下同一句；Pro 页头同；可以交易", source: "SportsClockLabel · sports_clock.starting_soon" },
    ],
  },
];

export const TradeStatesSection = () => (
  <SectionWrapper
    id="trade-states"
    title="/trade · 合约与多市场 · 状态字典（TR-1 … TR-40）"
    description="58 个 case，全部挂生产组件 + fixture 确定性数据（禁运行时 fetch，日期一律相对偏移）。fixture-only props 共四个：LiteContractOrderPanel.fixture（boostTrayOpen / remainderAutoClose）、LitePositionCard.flashOpen（TR-36）、VoucherLayer.inline（把券单弹层画在页面流里，TR-39 / TR-40）。"
  >
    <SubSection title="① 页头与市场语境（TR-1 … TR-4）">
      <Pair cases={HEAD_CASES} desktopMin={420} mobileMin={480} />
    </SubSection>

    <SubSection title="② 下单面板（TR-5 … TR-9）">
      <Pair cases={PANEL_CASES} desktopMin={900} mobileMin={1000} />
    </SubSection>

    <SubSection title="③ 持仓（TR-10 … TR-12）">
      <Pair cases={POSITION_CASES} desktopMin={420} mobileMin={520} />
    </SubSection>

    <SubSection title="③b 下单成功提示 + 定位到持仓卡（TR-35 … TR-36）">
      <Pair cases={PLACED_CASES} desktopMin={420} mobileMin={480} />
    </SubSection>

    <SubSection title="③c 券单：持仓卡 · 兑换提示 · 平仓面板 · 平仓之后（TR-37 … TR-40）">
      <Pair cases={VOUCHER_CASES} desktopMin={5200} mobileMin={6400} />
    </SubSection>

    <SubSection title="④ 侧栏与账本（TR-13 / TR-14）">
      <Pair cases={RAIL_CASES} desktopMin={520} mobileMin={620} />
    </SubSection>

    <SubSection title="⑤ 终态与中间态（TR-15 … TR-19）">
      <Pair cases={TAIL_CASES} desktopMin={640} mobileMin={760} />
    </SubSection>

    <SubSection title="⑥ 多市场与 game lines（TR-20 … TR-26）">
      <Pair cases={MULTI_CASES} desktopMin={1400} mobileMin={1700} />
    </SubSection>

    <SubSection title="⑦ Boost 全档（TR-24）">
      <Pair cases={BOOST_CASES} desktopMin={1200} mobileMin={1400} />
    </SubSection>

    {/* Desktop only: the mobile order panel has no header row — the same words sit in the order drawer title line. */}
    <SubSection title="⑧ 体育比赛的时间位（TR-29 … TR-29d · 只有桌面帧）">
      <SectionFrame cases={SPORTS_CLOCK_CASES} device="desktop" minHeight={900} />
    </SubSection>
  </SectionWrapper>
);

export default TradeStatesSection;
