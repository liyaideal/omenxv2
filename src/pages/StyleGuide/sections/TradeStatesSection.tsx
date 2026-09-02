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
      "逐字：CTA `Buy Yes $0.00 →`；脚注 `Not guaranteed. You can lose everything you put in.`。Est. auto-close 行的四态见 AC-T4 专案，本 case 不重复收录。",
    spec: [
      { state: "零单", when: "amountNum <= 0", visual: "`Make your call` + 倒计时 + Yes/No 50¢ + HOW MUCH + $10/$25/$50/$100/Max + Boost 1×…20×+Custom + Returns + CTA `Buy Yes $0.00 →`", source: "LiteContractOrderPanel" },
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
      "voucher 来源无法从既有 props 推出 → 新增 **fixture-only 纯展示 prop `voucherTag`**（生产从不传）。徽标沿用 Portfolio 的 Volt 口径 `Voucher`（#CFFF4A），不新造视觉。",
    spec: [
      { state: "voucher 仓", when: "position.source === voucher（生产由 vouchers 关联判定）", visual: "side 标签后追加 ` · Voucher`（Volt）", source: "LitePositionCard.voucherTag（fixture-only）" },
      { state: "普通仓", when: "非 voucher", visual: "无徽标，其余排版一致", source: "同上" },
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

export const TradeStatesSection = () => (
  <SectionWrapper
    id="trade-states"
    title="/trade · 合约与多市场 · 状态字典（TR-1 … TR-26）"
    description="24 个 case，全部挂生产组件 + fixture 确定性数据（禁运行时 fetch，日期一律相对偏移）。fixture-only props 共三个：LiteContractOrderPanel.fixture（boostTrayOpen / remainderAutoClose）与 LitePositionCard.voucherTag。"
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
  </SectionWrapper>
);

export default TradeStatesSection;
