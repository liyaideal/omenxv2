/**
 * /trade（合约与多市场）· 状态字典（M2a · TR-1 … TR-16）。
 *
 * 每个 case = 生产组件 + SectionFrame 双帧（desktop 1280 在上 / mobile 375 在下）。
 * fixture 只注数据与状态；不新增视觉方案，不手抄生产 JSX。
 */
import { SectionWrapper, SubSection } from "../components/SectionWrapper";
import { SectionFrame, type SectionCase } from "../components/SectionFrame";

/* ---------------- ① 页头与市场语境 ---------------- */

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
      "逐字：`Settles on the NVDA closing market cap reported by the exchange on the last trading day of the quarter. Winning shares pay $1 each, credited automatically at settlement.`",
    spec: [
      { state: "有 rules", when: "event.rules || event.description", visual: "ⓘ + 规则句 + 固定尾句 `Winning shares pay $1 each, credited automatically at settlement.`", source: "LiteContractTrade.ruleBody" },
      { state: "无 rules 兜底", when: "两者皆空", visual: "`Pays $1 a share to the winning side when this market resolves.` + 同尾句", source: "同上" },
      { state: "去重", when: "rules 已以 `Winning shares pay $1…` 结尾", visual: "该句被正则剥离，绝不出现两次", source: "ruleBody replace()" },
    ],
  },
];

/* ---------------- ② 下单面板 ---------------- */

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
];

/* ---------------- ③ 持仓与侧栏 ---------------- */

const POSITION_CASES: SectionCase[] = [
  {
    key: "trade-tr9",
    label: "TR-9 · 交易页持仓条 · 单仓 / multiHeld 多仓（LitePositionCard）",
    note: "左：binary 单仓（5× Boost，hot auto-close）；右：多市场每条腿一张卡。auto-close 列三态见 AC-T1…T3。",
    spec: [
      { state: "单仓", when: "heldPos != null && !boardMode", visual: "一张卡：side 标签 + PUT IN / NOW WORTH / PROFIT / EST. AUTO-CLOSE + Cash out", source: "LiteContractTrade.YourPosition" },
      { state: "多仓", when: "boardMode && multiHeld.length > 0", visual: "每条腿一张卡；标题为 side-label 或 `{option} · Yes|No`，1× 不加 Boost 后缀", source: "LiteContractTrade.MultiPositions" },
      { state: "In review", when: "inReview === true", visual: "Cash out 禁用并显示 IN_REVIEW_HOLD_LINE", source: "cashOutDisabledText" },
      { state: "移动紧凑", when: "isMobile", visual: "compact 排版", source: "compact prop" },
    ],
  },
  {
    key: "trade-tr10",
    label: "TR-10 · More markets 侧栏 rail（TradeMoreMarkets）",
    spec: [
      { state: "有兄弟市场", when: "more.length > 0", visual: "题名 + Yes% + chevron，整行点击进 `/trade?event={id}`", source: "LiteContractTrade.MoreMarkets" },
      { state: "空", when: "more.length === 0", visual: "EmptyState `No other markets right now` / `New markets show up here as they open.`", source: "EmptyState variant=module" },
      { state: "已结算事件", when: "resolved === true", visual: "标题改为 `Still live`", source: "MoreMarkets title" },
    ],
  },
];

/* ---------------- ④ 多市场与 game lines ---------------- */

const MULTI_CASES: SectionCase[] = [
  {
    key: "trade-sports-lines-default",
    label: "TR-11 · sports 多市场组 · WINNER 组（LiteMarketBoard + LiteBoardGroupHeader）",
    note:
      "复用既有 key `trade-sports-lines-default`（fixture 队伍为 Arsenal / Draw / Liverpool 47/26/27，与 mock 里 Ulsan 19 / Draw 23 / Jeonbuk 58 只是队名与数值不同，结构与状态完全一致；沿用既有 fixture 以免同一 key 两份数据）。",
    spec: [
      { state: "组标题", when: "event.options.length > 1", visual: "`WINNER / REGULATION TIME` + ⓘ 释义", source: "LiteBoardGroupHeader" },
      { state: "行未选中", when: "selectedId !== option.id", visual: "每行：题名 + CHANCE% + Yes¢ / No¢ 双 chip", source: "LiteMarketBoard" },
      { state: "行选中", when: "selectedId === option.id", visual: "行下方手风琴展开 `YES · CHANCE OVER TIME` 图（Sample data）", source: "LiteBoardChart" },
      { state: "行已结算", when: "option.settled", visual: "该行沉到板底并标出结果", source: "ordered / outcomeYes" },
    ],
  },
  {
    key: "trade-sports-lines-handicap-selected",
    label: "TR-12a · line scrubber · HANDICAP（LiteLineScrubber）",
    note: "尺面 −2.5 / −1.5 / +1.5 / +2.5；行题 `ARS +1.5 covers`，chip 为两侧 side label。",
    spec: [
      { state: "选中一档", when: "value === line", visual: "尺上该档高亮，行价格与图随之切换", source: "LiteLineScrubber value" },
      { state: "换档保持选中", when: "切换后同侧兄弟事件存在", visual: "选中跳到新兄弟的 option id，手风琴图不收起", source: "LiteContractTrade.changeLine" },
      { state: "持有该腿", when: "multiHeld 命中该 fixture 事件", visual: "行内 held 标记 + 下方持仓卡（1× 无 Boost 后缀）", source: "BoardOption.heldSideLabel" },
    ],
  },
  {
    key: "line-scrubber",
    label: "TR-12b · line scrubber · TOTAL GOALS 与边缘窗口",
    spec: [
      { state: "TOTAL 尺", when: "values = [0.5…4.5]", visual: "行题 `Over 2.5 goals` + Over/Under chip", source: "LiteLineScrubber format" },
      { state: "compact 窗口", when: "compact === true", visual: "只显示 4 档窗口，可横向滚动到边缘", source: "LiteLineScrubber compact" },
    ],
  },
  {
    key: "trade-tr16",
    label: "TR-16 · 多市场事件通用形态（非 sports · box office）",
    note: "与 sports 板同构，差异仅在组标签：非 fixture 事件没有 Winner / Handicap / Total 分组头，只有一块 LiteMarketBoard。",
    spec: [
      { state: "多选项板", when: "event.options.length > 2 && !hasLines", visual: "单块 board，行 = 选项，Yes/No 双 chip，选中行内嵌图", source: "LiteContractTrade.MarketBoard" },
      { state: "移动端", when: "isMobile", visual: "board 紧凑态；上方另有 LiteCrowdOverview 汇总条", source: "compact / LiteCrowdOverview" },
    ],
  },
];

/* ---------------- ⑤ 账本、终态与加载 ---------------- */

const TAIL_CASES: SectionCase[] = [
  {
    key: "trade-tr13",
    label: "TR-13 · Market activity feed（LiteMarketActivity）",
    note: "行句式逐字：`5m · Bought Yes · Jeonbuk · 1× · $121`（时间 / 动作 / 语境 / 金额四列栅格，无前导 side chip）。",
    spec: [
      { state: "有成交", when: "rows.length > 0", visual: "至多 maxRows 行（桌面 8 / 移动 4）", source: "LiteMarketActivity maxRows" },
      { state: "多市场语境", when: "showOptionLabel === true", visual: "语境列前置 option 名", source: "showOptionLabel" },
      { state: "Boost 徽标", when: "boost > 1", visual: "语境列出现 `5×`；1× 不渲染倍数", source: "boostSuffix 规则" },
      { state: "空", when: "rows.length === 0", visual: "EmptyState `No activity yet` / `Trades on this market show up here as people buy in.`", source: "EmptyState" },
    ],
  },
  {
    key: "trade-tr14",
    label: "TR-14 · 已结算事件 · 交易页终态（LiteOutcomeCard + HowItSettled）",
    spec: [
      { state: "resolved", when: "event.is_resolved === true", visual: "下单面板整体撤下，页顶换成结果卡；移动底栏 CTA 变 `View in Portfolio →`", source: "LiteContractTrade resolved 分支" },
      { state: "持有", when: "heldPos != null", visual: "结果卡多出 Your result（put in / paid out / profit）", source: "LiteOutcomeCard.holding" },
      { state: "有数值判据", when: "base_price != null && close_price != null", visual: "HowItSettled 渲染 Needed / Actual 两行 + 来源链接", source: "HowItSettled.criterion" },
      { state: "无赔率历史", when: "!isMulti && oddsHistory.length < 2 && base_price == null", visual: "图表模块整体隐藏，绝不补合成数据", source: "hideSettledChart" },
    ],
  },
  {
    key: "trade-tr15",
    label: "TR-15 · 交易页 loading 骨架",
    spec: [
      { state: "loading", when: "loading === true（事件与选项未到达）", visual: "整屏居中 Loader2 旋转，无内容占位", source: "LiteContractTrade loading 分支" },
      { state: "无 event 参数", when: "!eventId", visual: "重定向 /events（不是死链）", source: "Navigate to /events" },
      { state: "查无事件", when: "notFound || !event", visual: "ExpiredEventFallback", source: "ExpiredEventFallback" },
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
    title="/trade · 合约与多市场 · 状态字典（TR-1 … TR-16）"
    description="16 个 case，全部挂生产组件 + fixture 确定性数据。TR-11 / TR-12 复用既有 sports lines preview key。"
  >
    <SubSection title="① 页头与市场语境（TR-1 … TR-4）">
      <Pair cases={HEAD_CASES} desktopMin={420} mobileMin={480} />
    </SubSection>

    <SubSection title="② 下单面板（TR-5 … TR-8）">
      <Pair cases={PANEL_CASES} desktopMin={900} mobileMin={1000} />
    </SubSection>

    <SubSection title="③ 持仓与侧栏（TR-9 / TR-10）">
      <Pair cases={POSITION_CASES} desktopMin={520} mobileMin={640} />
    </SubSection>

    <SubSection title="④ 多市场与 game lines（TR-11 / TR-12 / TR-16）">
      <Pair cases={MULTI_CASES} desktopMin={900} mobileMin={1000} />
    </SubSection>

    <SubSection title="⑤ 账本、终态与加载（TR-13 … TR-15）">
      <Pair cases={TAIL_CASES} desktopMin={700} mobileMin={820} />
    </SubSection>
  </SectionWrapper>
);

export default TradeStatesSection;
