/**
 * Portfolio · 状态字典（M6a-① 分区 Ⓐ–Ⓒ · PF-1…PF-7 · mock9 框架）。
 *
 * 每个 case = 生产组件 + SectionFrame 双帧（desktop 1280 在上 / mobile 375 在下）。
 * fixture 只注数据与状态；生产代码零改动。
 */
import { SectionWrapper, SubSection } from "../components/SectionWrapper";
import { SectionFrame, type SectionCase } from "../components/SectionFrame";

/* ---------------- Ⓐ 页面外壳 ---------------- */

const CHROME_CASES: SectionCase[] = [
  {
    key: "portfolio-lite-chrome",
    label: "PF-1 · Tabs 与双段 chips（PortfolioTabs · SegmentChips）",
    note: "两 tab 走 Rewards 开场 tab 制式（下划线 tabs）；chips 为单选分段，Boost / Standard 二选一。",
    spec: [
      {
        state: "Live 选中",
        when: 'tab === "live"',
        visual: "Live 字重 700 色 #F2F3F5，下方 2.5px 白条；Settled 字重 500 色 #6B7280",
        source: "PortfolioTabs value",
      },
      {
        state: "Settled 选中",
        when: 'tab === "settled"',
        visual: "同上镜像",
        source: "PortfolioTabs value",
      },
      {
        state: "Boost 段选中",
        when: 'segment === "boost"',
        visual: "该 chip 白底 #FFFFFF 黑字 #0B0D10 字重 700；另一枚 #14171C 底 + #262B33 边",
        source: "SegmentChips value",
      },
      {
        state: "Standard 段选中",
        when: 'segment === "standard"',
        visual: "同上镜像",
        source: "SegmentChips value",
      },
      {
        state: "计数为 0",
        when: "boostCount === 0 || standardCount === 0",
        visual: "chip 仍渲染，标签写 `Boost · 0` / `Standard · 0`，不隐藏、不禁用",
        source: "SegmentChips boostCount / standardCount",
      },
    ],
  },
  {
    key: "portfolio-lite-voucher-hairline",
    label: "PF-2 · 券发丝行（VoucherHairline）",
    note: "只统计 granted 状态的券；点右侧入口去 /rewards 领取，不在 portfolio 内领。",
    spec: [
      {
        state: "有可用券",
        when: "claimableVouchers > 0",
        visual:
          "上下 1px rgba(28,31,38,.8) 发丝线，左 7×7 volt 方点，文案 `{n} voucher(s) to claim`，右 `Claim in Rewards ›`",
        source: "VoucherHairline count",
      },
      {
        state: "单数 / 复数",
        when: "count === 1 / count > 1",
        visual: "`1 voucher to claim` / `{n} vouchers to claim`",
        source: "VoucherHairline 三元",
      },
      {
        state: "无券",
        when: "count <= 0",
        visual: "整行 return null，不占位、不留边框",
        source: "VoucherHairline count <= 0",
      },
    ],
  },
  {
    key: "portfolio-lite-select-entry",
    label: "PF-3 · Select 入口与选择工具条（SelectEntry · SelectToolbar）",
    note: "Select 与 SelectToolbar 在 chips 行右侧互斥占位：未进入选择模式时是 Select 文字按钮，进入后整块换成工具条。",
    spec: [
      {
        state: "入口可见",
        when: 'tab === "live" && rows.length > 0 && !selectMode',
        visual: "chips 行右端 `Select`，12.5px 字重 600 色 #33D6FF",
        source: "LitePortfolio chips 行",
      },
      {
        state: "入口隐藏 · 空列表",
        when: "rows.length === 0",
        visual: "右端不渲染任何东西",
        source: "同上",
      },
      {
        state: "入口隐藏 · Settled",
        when: 'tab === "settled"',
        visual: "右端不渲染",
        source: "同上",
      },
      {
        state: "选择模式工具条",
        when: "selectMode === true",
        visual:
          "`Select all`（#33D6FF 600）· `Clear`（#6B7280）· `{n} selected`（mono #6B7280）· `Cancel`（#C7CCD4）",
        source: "SelectToolbar",
      },
      {
        state: "窄屏收敛",
        when: "视口 < sm",
        visual: "`Clear` 与 `{n} selected` 隐藏（hidden sm:inline），只留 `Select all` + `Cancel`",
        source: "SelectToolbar 类名",
      },
    ],
  },
];

/* ---------------- Ⓑ KPI ---------------- */

const KPI_LIVE_NOTE =
  "KPI 恒全账户口径 —— 切换 Boost / Standard chip 时三值不变（生产连切四次实测确认；数值秒级漂动只来自实时价 tick）。桌面 3 列，移动强制 2 列并把 PROFIT 并进 NOW WORTH 的副行。";

const KPI_LIVE_SPEC: SectionCase["spec"] = [
  {
    state: "盈利",
    when: "liveKpi.profit > 0",
    visual: "PROFIT 数值 volt #CFFF4A，副行 +X.X% 同色",
    source: "livePnlColor()",
  },
  {
    state: "亏损",
    when: "liveKpi.profit < 0",
    visual: "PROFIT 数值红 #FF5C5C",
    source: "livePnlColor()",
  },
  {
    state: "零态",
    when: "isZeroMoney(profit)",
    visual: "显示 $0.00，色 #6B7280，不带正负号",
    source: "isZeroMoney() · pnlColor()",
  },
  {
    state: "桌面 3 列",
    when: "视口 ≥ lg",
    visual: "COST / NOW WORTH / PROFIT 三卡，grid-cols-3 gap-3",
    source: "KpiGrid cols={3}",
  },
  {
    state: "移动 2 列",
    when: "视口 < lg",
    visual: "COST / NOW WORTH 两卡，PROFIT 并入 NOW WORTH 副行 +$26.58 · +4.5%",
    source: "KpiGrid cols={2}",
  },
];

const KPI_SETTLED_NOTE =
  "Settled 口径与 Live 是两套卡：桌面 WIN RATE / NET PROFIT / RECORD 三卡，移动只有前两卡，RECORD 桌面独有。";

const KPI_SETTLED_SPEC: SectionCase["spec"] = [
  {
    state: "有战绩",
    when: "settledKpi.total > 0",
    visual:
      "`WIN RATE 39%` 副行 `19 of 49`；`NET PROFIT +$3,777.81` 副行 `49 settled`；`RECORD 19W 30L` 副行 `wins · losses`",
    source: "settledKpi",
  },
  {
    state: "NET 为正",
    when: "net > 0",
    visual: "数值绿 #3DD68C（settled 轴用 GREEN，不得漏用 Live 的 volt）",
    source: "pnlColor(n, GREEN)",
  },
  { state: "NET 为负", when: "net < 0", visual: "数值红 #FF5C5C", source: "pnlColor()" },
  {
    state: "零战绩",
    when: "settledKpi.total === 0",
    visual: "`0%` / `0 of 0` / `$0.00` / `0 settled` / `0W 0L`，全部 #6B7280",
    source: "settledKpi",
  },
  {
    state: "RECORD 单端",
    when: "视口 < lg",
    visual: "移动帧不渲染 RECORD 卡（只 2 列）",
    source: "KpiGrid cols",
  },
];

const KPI_CASES: SectionCase[] = [
  {
    key: "portfolio-lite-kpi-desktop",
    label: "PF-4 · Live KPI 卡（KpiCard · KpiGrid）",
    note: KPI_LIVE_NOTE,
    spec: KPI_LIVE_SPEC,
  },
  {
    key: "portfolio-lite-kpi-mobile",
    label: "PF-4 · Live KPI 卡（KpiCard · KpiGrid）",
    note: KPI_LIVE_NOTE,
    spec: KPI_LIVE_SPEC,
  },
  {
    key: "portfolio-lite-kpi-settled",
    label: "PF-5 · Settled KPI 卡（KpiCard · KpiGrid）",
    note: KPI_SETTLED_NOTE,
    spec: KPI_SETTLED_SPEC,
  },
  {
    key: "portfolio-lite-kpi-settled-mobile",
    label: "PF-5 · Settled KPI 卡（KpiCard · KpiGrid）",
    note: KPI_SETTLED_NOTE,
    spec: KPI_SETTLED_SPEC,
  },
];

/* ---------------- Ⓒ Boost check ---------------- */

const BOOST_NOTE =
  "riskRatio = imTotal / equity × 100，账户级跨仓共享一个池子。Standard 段整行不渲染。桌面眉线带 · shared across Boost calls 后缀，移动无该后缀 —— 双端文案差异是既定口径，不是 bug。";

const BOOST_SPEC: SectionCase["spec"] = [
  { state: "Healthy", when: "riskRatio < 80", visual: "词 `Healthy`，色 #3DD68C", source: "boostState()" },
  {
    state: "Getting tight",
    when: "80 <= riskRatio < 95",
    visual: "词 `Getting tight`，色 #FFC24B",
    source: "boostState()",
  },
  {
    state: "Auto-close soon",
    when: "riskRatio >= 95",
    visual: "词 `Auto-close soon`，色 #FF5C5C",
    source: "boostState()",
  },
  {
    state: "Standard 段不渲染",
    when: 'segment === "standard"',
    visual: "整行/整卡不出现，不留占位",
    source: "LitePortfolio 段门控",
  },
  {
    state: "桌面眉线后缀",
    when: "视口 ≥ lg",
    visual: "`{金额} until auto-close starts · shared across Boost calls`",
    source: "BoostCheckBar",
  },
  {
    state: "移动眉线",
    when: "视口 < lg",
    visual: "`{金额} until auto-close starts`（无后缀）",
    source: "BoostCheckCard",
  },
  {
    state: "金额格式",
    when: "整数金额",
    visual: "moneyAuto()：整数不带小数（$310 / $0），非整数走 money()",
    source: "moneyAuto()",
  },
];

const DETAILS_NOTE =
  "桌面走锚定 Popover（DESIGN §5 对等表：桌面绝不用底部抽屉），移动走 MobileDrawer。两端内容完全相同：一句说明 + 三行取值。";

const DETAILS_SPEC: SectionCase["spec"] = [
  {
    state: "折叠（默认）",
    when: "未点击",
    visual: "chips/眉线右侧只有 `Details ›`，12px 色 #6B7280",
    source: "DetailsPopover trigger",
  },
  {
    state: "桌面展开",
    when: "点击 `Details ›`",
    visual: "锚定 Popover，align=\"end\"，宽 320px，rounded-[12px] 边 #1D2026 底 #12151A p-4",
    source: "PopoverContent",
  },
  {
    state: "移动展开",
    when: "点击 `Details ›`",
    visual: "MobileDrawer 标题 `Boost check`",
    source: "DetailsDrawer",
  },
  {
    state: "说明句",
    when: "展开态",
    visual:
      "`Boost calls share one pool of backing. If it runs out, positions start closing automatically.`",
    source: "DETAILS_SENTENCE",
  },
  {
    state: "三行取值",
    when: "展开态",
    visual: "`Equity` / `Used by Boost calls` / `Until auto-close starts`，值走 moneyAuto()",
    source: "detailRows()",
  },
];

const BOOST_CASES: SectionCase[] = [
  {
    key: "portfolio-lite-gauge-bar",
    label: "PF-6 · Boost check 三态（BoostCheckBar · BoostCheckCard）",
    note: BOOST_NOTE,
    spec: BOOST_SPEC,
  },
  {
    key: "portfolio-lite-gauge-states",
    label: "PF-6 · Boost check 三态（BoostCheckBar · BoostCheckCard）",
    note: BOOST_NOTE,
    spec: BOOST_SPEC,
  },
  {
    key: "portfolio-lite-details-popover",
    label: "PF-7 · Boost check Details 展开（DetailsPopover · DetailsDrawer）",
    note: DETAILS_NOTE,
    spec: DETAILS_SPEC,
  },
  {
    key: "portfolio-lite-details-drawer",
    label: "PF-7 · Boost check Details 展开（DetailsPopover · DetailsDrawer）",
    note: DETAILS_NOTE,
    spec: DETAILS_SPEC,
  },
];

/* ---------------- Ⓓ Live 列表（PF-8 … PF-14） ---------------- */

const LIVE_BASE_SPEC = [
  { state: "盈利行", when: "profit > 0.005", visual: "PROFIT 列 volt #CFFF4A，带 `+` 号", source: "livePnlColor()" },
  { state: "亏损行", when: "profit < -0.005", visual: "PROFIT 列 red #FF5C5C，带 `−` 号", source: "livePnlColor()" },
  { state: "零盈亏行", when: "Math.abs(profit) < 0.005", visual: "PROFIT 列 muted `$0.00`，不带符号", source: "isZeroMoney()" },
  { state: "Boost 后缀", when: "leverageNum > 1", visual: "meta 行追加 `{n}× Boost`（整数不带 .0，加权倍数保留一位小数）", source: "boostSuffix()" },
  { state: "1× 不显示 Boost", when: "leverageNum <= 1", visual: "meta 行不追加任何 Boost 段（1× 在 Lite 等于「没开 Boost」）", source: "boostSuffix()" },
  { state: "进入市场", when: "selectMode === false 时点击整行 / 整卡", visual: "savePortfolioScroll() 后 navigate(row.tradePath)，返回时回到原滚动位", source: "useGoToMarket()" },
  { state: "单行 Cash out", when: "点击行内 Cash out", visual: "无确认层：stopPropagation 后交由 onCashOut，进入该市场交易页平仓", source: "LitePortfolio onCashOut" },
];

const LIVE_CASES: SectionCase[] = [
  {
    key: "portfolio-lite-desktop-rows",
    label: "PF-8 · Live 常规态（LiveRow · LiveCard）",
    note: "桌面列模板固定 `minmax(0,1fr) minmax(110px,200px) 96px 104px 100px 150px 170px`；移动为同一份数据的卡片形态。七行覆盖盈利 / 亏损 / 零盈亏与 1×–5× 倍数梯度，红只由 hot 决定（见 PF-11），与盈亏正负无关。",
    spec: LIVE_BASE_SPEC,
  },
  {
    key: "portfolio-lite-live-cards",
    label: "PF-8 · Live 常规态（LiveRow · LiveCard）",
    note: "移动卡：标题 14.5px/600、chip 右上、三宫格 COST / NOW WORTH / PROFIT、末行整宽 Cash out（h-40）。",
    spec: LIVE_BASE_SPEC,
  },
  {
    key: "portfolio-lite-side-chip",
    label: "PF-9 · SIDE chip 与选项名（resolveLegSide）",
    note: "方向轴唯一口径：chip 底色只认 side（yes=Pulse #33D6FF / no=Volt #CFFF4A），文案只认 sideWord。`type === 'short'` 恒翻转 side。多选腿才在 chip 下方补第二行选项名。",
    spec: [
      { state: "二元 Yes 腿", when: "resolveLegSide().side === 'yes' && optionName === null", visual: "chip 底 #33D6FF 黑字 `Yes {c}¢`，无第二行", source: "resolveLegSide()" },
      { state: "二元 No 腿", when: "resolveLegSide().side === 'no' && optionName === null", visual: "chip 底 #CFFF4A 黑字 `No {c}¢`，无第二行", source: "resolveLegSide()" },
      { state: "多选 Yes 腿", when: "optionName != null && side === 'yes'", visual: "chip `Yes {c}¢` + 第二行 11.5px #E5E7EB 选项名（桌面左对齐 / 移动右对齐）", source: "resolveLegSide().optionName" },
      { state: "多选 No 腿", when: "optionName != null && side === 'no'", visual: "chip `No {c}¢`（Volt）+ 第二行选项名", source: "resolveLegSide().optionName" },
      { state: "别名腿（side_labels）", when: "事件带 side_labels 且腿命中别名", visual: "chip 文案即别名（`ARS +1.5` / `Up` / `$55K–$65K`），optionName 为 null 无第二行", source: "legSideLabel()" },
      { state: "chip 溢出", when: "sideWord 宽度超过列宽", visual: "chip 单行 truncate，hover 出 tooltip 显示全文（移动端只截断不出 tooltip）", source: "LiveRow Tooltip" },
    ],
  },
  {
    key: "autoclose-desktop-rows",
    label: "PF-10 · auto-close 值语法（两态 · 常驻字段）",
    note: "Boost 段该字段常驻，值只有两态：有价 `≈{c}¢`，无价 `none`（灰 #4d5560 + hover 全句）。不存在 `—` 占位、不存在第三态。",
    spec: [
      { state: "level", when: "segment === 'boost' && autoClose.kind === 'level'", visual: "`If it wins → $X · auto-close ≈{c}¢`", source: "estimateAutoClosePrice()" },
      { state: "none", when: "autoClose.kind === 'none'", visual: "`· auto-close none`，none 为内联灰 #4d5560，hover tooltip 全句「亏损封顶本金」", source: "estimateAutoClosePrice()" },
      { state: "none · 1× Boost", when: "leverageNum === 1", visual: "恒 none 分支：无借贷敞口", source: "autoClosePrice boost ≤ 1" },
      { state: "移动卡句式", when: "移动帧", visual: "level → `… · auto-close ≈{c}¢`；none → `… · no auto-close, loss capped`", source: "LiveCards.LiveCard" },
    ],
  },
  {
    key: "autoclose-standard-row",
    label: "PF-10 · Standard 段不携带 auto-close",
    note: "Standard 不是「auto-close = none」，而是整段不存在：列内只有 `If it wins → $X`。",
    spec: [
      { state: "Standard", when: "segment === 'standard'", visual: "该列只有 `If it wins → $X`，不追加任何 auto-close 段", source: "LiveCards.LiveRow" },
    ],
  },
  {
    key: "autoclose-mobile-cards",
    label: "PF-10 · auto-close 值语法（移动卡三行）",
    note: "三张卡逐字对照 mock7 v2 §2：level / hot（红描边 + 红句）/ none。",
    spec: [
      { state: "level", when: "segment === 'boost' && autoClose.kind === 'level' && hot === false", visual: "句尾 `· auto-close ≈{c}¢`，整句 #6B7280", source: "LiveCards.LiveCard" },
      { state: "hot", when: "hot === true", visual: "整卡红描边 rgba(255,92,92,.55) + 整句 RED", source: "isAutoCloseHot" },
      { state: "none", when: "autoClose.kind === 'none'", visual: "`· no auto-close, loss capped`", source: "estimateAutoClosePrice()" },
    ],
  },
  {
    key: "portfolio-lite-hot",
    label: "PF-11 · hot 行（红只有这一个来源）",
    note: "hot 与盈亏正负完全无关：亏损但离 auto-close 还远的行不红，盈利但贴近 auto-close 的行也会红。三行依次为「亏损不红 / 亏损且红 / 盈利且红」。",
    spec: [
      { state: "不红", when: "hot === false", visual: "桌面无左轨无底色；移动无描边；句子 #6B7280", source: "useLitePortfolio.hot" },
      { state: "hot 行（桌面）", when: "autoClosePrice != null && Math.abs(priceNow − autoClosePrice) / priceNow <= 0.10", visual: "inset 3px 0 0 rgba(255,92,92,.7) 左轨 + rgba(255,92,92,.04) 底 + 该列整句 RED", source: "isAutoCloseHot" },
      { state: "hot 行（移动）", when: "同上", visual: "整卡 1px solid rgba(255,92,92,.55) 描边 + 整句 RED", source: "isAutoCloseHot" },
      { state: "hot 与盈利并存", when: "hot === true && profit > 0", visual: "行仍红；PROFIT 列仍按 livePnlColor 走 volt —— 红轨与绿/volt 数值同时存在是合法的", source: "livePnlColor() 与 hot 互不干涉" },
    ],
  },
  {
    key: "portfolio-lite-standard-live",
    label: "PF-12 · Standard 段 Live 行",
    note: "Standard 段没有 Boost 后缀、没有 auto-close 段；up/down 股票腿的 sideWord 走 Up / Down 别名，不写 Yes / No。",
    spec: [
      { state: "无 Boost 后缀", when: "segment === 'standard'（leverageNum === 1）", visual: "meta 行只有 `{category} · settles {…}`", source: "boostSuffix()" },
      { state: "无 auto-close 段", when: "segment === 'standard'", visual: "只有 `If it wins → $X`", source: "LiveCards.LiveRow" },
      { state: "Up 腿", when: "side === 'yes' 且事件 side_labels.yes === 'Up'", visual: "chip 底 #33D6FF 文案 `Up {c}¢`", source: "legSideLabel()" },
      { state: "Down 腿", when: "side === 'no' 且 side_labels.no 为 `Not Up`", visual: "chip 底 #CFFF4A 文案 `Down {c}¢`（`Not Up` 在 Lite 恒改写为 `Down`）", source: "liteSideName()" },
    ],
  },
  {
    key: "portfolio-lite-airdrop-tag-rows",
    label: "PF-13 · 来源标枚举（airdropTag）",
    note: "来源标只有三种取值；matched 与 welcome_gift 两种空投来源共用同一个 pulse `Airdrop` 标，不再细分来源。示例三行依次为 none / voucher / airdrop。",
    spec: [
      { state: "无标", when: "airdropTag === 'none'", visual: "meta 行尾不追加任何来源标（不画占位）", source: "useLitePortfolio.airdropTag" },
      { state: "Voucher 标", when: "airdropTag === 'voucher'", visual: "meta 行尾 volt #CFFF4A 文案 `Voucher`", source: "LiveCards VOLT" },
      { state: "Airdrop 标", when: "airdropTag === 'airdrop'（airdropSource ∈ {matched, welcome_gift}）", visual: "meta 行尾 pulse #33D6FF 文案 `Airdrop`", source: "LiveCards PULSE" },
      { state: "待激活空投", when: "airdrop.status === 'pending'", visual: "不进 portfolio —— 仍住 /rewards/campaign/h2e 的 Airdropped positions 模块", source: "DESIGN §运营工具仓位归属" },
    ],
  },
  {
    key: "portfolio-lite-airdrop-tag-cards",
    label: "PF-13 · 来源标枚举（移动卡）",
    note: "与桌面同一枚举，标追加在 meta 行尾。",
    spec: [
      { state: "无标", when: "airdropTag === 'none'", visual: "meta 行尾无追加", source: "useLitePortfolio.airdropTag" },
      { state: "Voucher 标", when: "airdropTag === 'voucher'", visual: "volt #CFFF4A `Voucher`", source: "LiveCards VOLT" },
      { state: "Airdrop 标", when: "airdropTag === 'airdrop'", visual: "pulse #33D6FF `Airdrop`", source: "LiveCards PULSE" },
    ],
  },
  {
    key: "portfolio-lite-settles-time",
    label: "PF-14 · settles 时间三分支 + 缺失",
    note: "全站唯一时间口径 settleLabel()：24 小时制、用户本地时区、不带时区后缀。调用方只负责前缀动词 `settles`。",
    spec: [
      { state: "今天", when: "settlesAt 与 now 同年同月同日", visual: "`settles today 16:00`", source: "settleLabel()" },
      { state: "同年异日", when: "settlesAt.getFullYear() === now.getFullYear() 且非同日", visual: "`settles Sep 5 04:30`（月 日 + 钟点）", source: "settleLabel()" },
      { state: "跨年", when: "settlesAt.getFullYear() !== now.getFullYear()", visual: "`settles Sep 7, 2027`（不带钟点）", source: "settleLabel()" },
      { state: "缺失", when: "settlesAt == null", visual: "meta 行不出现 settles 段（不画 `—` 占位）", source: "LiveCards.metaLine" },
    ],
  },
];

/* ---------------- Ⓔ 挂单行（PF-15） ---------------- */

const PENDING_SPEC = [
  { state: "折叠（默认）", when: "orders.length > 0 && open === false", visual: "1px dashed #2A2F38 虚线行 `n orders waiting to fill · placed in Pro` + 右侧 ›", source: "PendingOrdersRow" },
  { state: "展开", when: "点击折叠行 → open === true", visual: "行下逐单展开：左事件名 truncate、右 `size @ price` 等宽字 + ›，hover 底 rgba(255,255,255,.04)", source: "PendingOrdersRow" },
  { state: "点单跳 Pro", when: "点击任一单行", visual: "savePortfolioScroll() → savePortfolioReturnSurface('lite') → setSurface('pro') → /trade?event={eventId}；改单/撤单只在 Pro 存在", source: "PendingOrdersRow.openInPro" },
  { state: "单数 / 复数", when: "orders.length === 1 / > 1", visual: "`1 order waiting to fill` / `{n} orders waiting to fill`", source: "PendingOrdersRow 三元" },
  { state: "无单", when: "orders.length === 0", visual: "组件 return null，两端都不占高度", source: "PendingOrdersRow" },
  { state: "Standard 段", when: "segment === 'standard'", visual: "整个挂单行不渲染（只有 Boost 段挂）", source: "LitePortfolio" },
];

const PENDING_CASES: SectionCase[] = [
  {
    key: "portfolio-lite-pending-desktop",
    label: "PF-15 · 挂单行两态（PendingOrdersRow · 桌面）",
    note: "桌面与移动共用同一个组件；桌面挂在行式网格下方（px-4 pt-3），且只在 Boost 段渲染。展开态是生产实态，不是移动独有。",
    spec: PENDING_SPEC,
  },
  {
    key: "portfolio-lite-pending-mobile",
    label: "PF-15 · 挂单行两态（PendingOrdersRow · 移动）",
    note: "同一个组件、同一套文案；移动端挂在卡片列表末尾。",
    spec: PENDING_SPEC,
  },
];

/* ---------------- Ⓕ 批量平仓（PF-16 … PF-18） ---------------- */

const SELECT_SPEC = [
  { state: "非选择模式", when: "selectMode === false", visual: "行 / 卡 DOM 与常规态完全一致（无勾选列）；入口是 chips 行右侧的 `Select`（见 PF-3）", source: "LiveCards / LitePortfolio" },
  { state: "未选中", when: "selectMode && !selected", visual: "行首 18px 圆形空勾选点（1.5px #2A2F38 描边）；单行 Cash out 与分享按钮隐藏；点击整行 = 选中", source: "CheckDot" },
  { state: "已选中", when: "selectMode && selected", visual: "勾选点 #33D6FF 填充 + 黑勾；桌面 inset 3px 0 0 rgba(51,214,255,.7) 左轨 + rgba(51,214,255,.04) 底，移动 1px rgba(51,214,255,.45) 描边", source: "LiveRow / LiveCard" },
  { state: "hot 行优先级", when: "selectMode && selected && hot", visual: "红轨优先：hot 分支先命中，选中态的蓝轨不覆盖红轨", source: "LiveRow style 三元顺序" },
  { state: "列模板变化", when: "selectMode === true", visual: "桌面网格前置 28px 勾选列（`28px ${DESKTOP_GRID}`），表头同步前置空列", source: "gridFor()" },
  { state: "工具条", when: "selectMode", visual: "内联 chips 行右侧：`Select all`（Pulse）/ `Clear` / `N selected`（font-mono）/ `Cancel`；<sm 窄屏隐藏 `Clear` 与计数，只留 `Select all` / `Cancel`", source: "SelectToolbar" },
];

const BATCH_CASES: SectionCase[] = [
  {
    key: "portfolio-lite-live-select-desktop",
    label: "PF-16 · 选择模式（桌面行式网格）",
    note: "选择状态不持久化：切 tab / 切 segment / 完成后即清空。",
    spec: SELECT_SPEC,
  },
  {
    key: "portfolio-lite-live-select",
    label: "PF-16 · 选择模式（移动卡列表）",
    note: "移动端点整卡切换选中；单卡 Cash out 在选择模式下隐藏，避免与批量动作冲突。",
    spec: SELECT_SPEC,
  },
  {
    key: "portfolio-lite-batch-bar",
    label: "PF-17 · 吸底动作条（BatchActionBar）",
    note: "动作条是 fixed 贴底，不随列表滚动；页面流内同时渲染 h-[76px] 占位，防止遮住最后一行。",
    spec: [
      { state: "不渲染", when: "rows.length === 0", visual: "组件 return null：无占位、无空条", source: "BatchActionBar" },
      { state: "渲染", when: "rows.length > 0", visual: "圆角条 #12151A/95 + backdrop-blur + 1px #2A2F38；内层 max-w-7xl px-4 lg:px-6 与页容器对齐", source: "BatchActionBar" },
      { state: "定位（移动）", when: "移动端", visual: "bottom-[84px] —— 钉在 BottomNav（实测 77px 含 1px border）上方，留 7px 呼吸缝", source: "BatchActionBar" },
      { state: "定位（桌面）", when: "lg 断点及以上", visual: "lg:bottom-4", source: "BatchActionBar" },
      { state: "汇总数值", when: "始终", visual: "`N selected` + `Now worth $X · Profit ±$Y`（Profit 走 livePnlColor）", source: "BatchActionBar reduce" },
      { state: "主按钮", when: "始终", visual: "shadcn Button h-10 rounded-[10px] px-5，文案 `Cash out N`", source: "BatchActionBar" },
    ],
  },
  {
    key: "portfolio-lite-batch-confirm",
    label: "PF-18 · 确认层空闲态（桌面 Dialog）",
    note: "确认层遵 DESIGN §5.1：桌面 Dialog（sm:max-w-[420px]）/ 移动 MobileDrawer，正文与按钮两端共用同一套 ConfirmBody / Actions。",
    spec: [
      { state: "标题", when: "始终", visual: "`Cash out N positions`", source: "BatchCashOutConfirm" },
      { state: "明细卡", when: "始终", visual: "`rounded-lg border bg-muted/30 p-3`，内行距 space-y-1.5，逐行 `{event}`（truncate）· `{sideWord}`（font-mono muted）· `{now worth}`（font-mono 粗）", source: "ConfirmBody" },
      { state: "合计行", when: "始终", visual: "上 1px border-border/50 分隔，左 `You get about`（muted）右合计（font-mono bold）", source: "ConfirmBody" },
      { state: "免责句", when: "始终", visual: "`Prices move while we close — the final amount can differ slightly.`（text-xs muted）", source: "ConfirmBody" },
      { state: "按钮", when: "提交型 + 不可逆", visual: "Cancel（outline h-11 flex-1）+ `Cash out`（destructive `bg-trading-red text-white hover:bg-trading-red/90` h-11 flex-1）", source: "Actions" },
    ],
  },
  {
    key: "portfolio-lite-batch-confirm-mobile",
    label: "PF-18 · 确认层空闲态（移动 MobileDrawer）",
    note: "移动端按钮区必须是 `MobileDrawerActions className=\"flex gap-2 space-y-0\"`，与桌面共用同一个 Actions 组件。",
    spec: [
      { state: "容器", when: "isMobile === true", visual: "MobileDrawer + title `Cash out N positions`；正文与桌面逐字相同", source: "BatchCashOutConfirm" },
      { state: "按钮区", when: "始终", visual: "MobileDrawerActions 横排 gap-2，Cancel 与红色 Cash out 各占一半", source: "MobileDrawerActions" },
    ],
  },
  {
    key: "portfolio-lite-batch-closing",
    label: "PF-18 · 确认层执行中（桌面）",
    note: "串行逐仓平仓，进度写在主按钮上；两个按钮同时禁用，不可中途取消。",
    spec: [
      { state: "执行中", when: "closingLabel !== null", visual: "主按钮文案换成 `Closing i / N…` 并 disabled；Cancel 同步 disabled", source: "Actions closingLabel" },
      { state: "全部成功", when: "失败数 === 0", visual: "关闭确认层 + toast `Cashed out N positions`", source: "LitePortfolio.closeBatch" },
      { state: "部分失败", when: "0 < 失败数 < N", visual: "toast `Cashed out K of N — M failed, still open below`，失败仓保留在列表", source: "LitePortfolio.closeBatch" },
      { state: "全部失败", when: "失败数 === N", visual: "toast `Couldn't cash out — please try again`，选择状态保留", source: "LitePortfolio.closeBatch" },
    ],
  },
  {
    key: "portfolio-lite-batch-closing-mobile",
    label: "PF-18 · 确认层执行中（移动）",
    note: "与桌面同一套禁用与进度规则。",
    spec: [
      { state: "执行中", when: "closingLabel !== null", visual: "抽屉内主按钮 `Closing i / N…` disabled，Cancel disabled", source: "Actions closingLabel" },
    ],
  },
  {
    key: "portfolio-lite-batch-bar-mobile",
    label: "PF-17 · 吸底动作条（移动）",
    note: "同一个组件；移动端定位 bottom-[84px]。",
    spec: [
      { state: "不渲染", when: "rows.length === 0", visual: "组件 return null", source: "BatchActionBar" },
      { state: "渲染", when: "rows.length > 0", visual: "贴底圆角条 + `Cash out N` 主按钮", source: "BatchActionBar" },
    ],
  },
];

/**
 * Ⓓ 区移动帧镜像：与桌面 case 同一份 spec，只换 preview key 与 label 后缀。
 */
const LIVE_MOBILE_MIRRORS: SectionCase[] = (
  [
    ["portfolio-lite-side-chip", "portfolio-lite-side-chip-mobile"],
    ["portfolio-lite-hot", "portfolio-lite-hot-mobile"],
    ["portfolio-lite-standard-live", "portfolio-lite-standard-live-mobile"],
    ["portfolio-lite-settles-time", "portfolio-lite-settles-time-mobile"],
  ] as const
).map(([from, key]) => {
  const base = LIVE_CASES.find((c) => c.key === from)!;
  return { ...base, key, label: `${base.label}（移动）` };
});

const ALL_CASES: SectionCase[] = [
  ...CHROME_CASES,
  ...KPI_CASES,
  ...BOOST_CASES,
  ...LIVE_CASES,
  ...LIVE_MOBILE_MIRRORS,
  ...PENDING_CASES,
  ...BATCH_CASES,
];


const byKey = (...keys: string[]): SectionCase[] =>
  keys.map((k) => {
    const hit = ALL_CASES.find((c) => c.key === k);
    if (!hit) throw new Error(`PortfolioStatesSection: unknown case key ${k}`);
    return hit;
  });

const Pair = ({
  cases,
  mobileCases,
  desktopMin,
  mobileMin,
}: {
  cases: SectionCase[];
  /** 两端是不同生产组件时，mobile 帧挂这组；缺省与 desktop 帧同组。 */
  mobileCases?: SectionCase[];
  desktopMin?: number;
  mobileMin?: number;
}) => (
  <>
    <SectionFrame cases={cases} device="desktop" minHeight={desktopMin ?? 360} />
    <div className="mt-3">
      <SectionFrame cases={mobileCases ?? cases} device="mobile" minHeight={mobileMin ?? 420} />
    </div>
  </>
);

const READ_ME =
  "怎么读这一节：所有状态都由 useLitePortfolio 派生的字段驱动（segment / isVoucher / autoCloseState / hot / closeReason / isSeries / isZeroMoney）。每个 case 下方的表给出「触发条件 → 视觉结果 → 字段来源」，条件都是可判定表达式，可直接照抄进实现；表里没有列出的组合视为不存在，不要自行发挥。";

export const PortfolioStatesSection = () => (
  <SectionWrapper
    id="portfolio-states"
    title="Portfolio · 状态字典（PF-1…PF-18 · Ⓐ–Ⓕ 区）"
    description="分区序 = 生产模块序：Ⓐ页面外壳 · ⒷKPI · ⒸBoost check · ⒹLive 列表 · Ⓔ挂单行 · Ⓕ批量平仓（PF-19 起的结算/详情/空态仍在下方旧节，M6b 并账）。每个 case 双帧（desktop 1280 / mobile 375），同一编号两帧各挂各端生产真组件；fixture 只注数据与状态，一律确定性注入（禁止运行时 fetch、禁止绝对日期、禁止随机 id）。"
  >
    <div className="space-y-12">
      <div className="rounded-lg border border-border/40 bg-muted/10 p-3 text-[11px] leading-relaxed text-muted-foreground">
        {READ_ME}
      </div>

      <SubSection title="Ⓐ 页面外壳（PF-1 … PF-3）">
        <Pair
          cases={byKey(
            "portfolio-lite-chrome",
            "portfolio-lite-voucher-hairline",
            "portfolio-lite-select-entry",
          )}
          desktopMin={640}
          mobileMin={720}
        />
      </SubSection>

      <SubSection title="Ⓑ KPI 卡（PF-4 … PF-5）">
        <Pair
          cases={byKey("portfolio-lite-kpi-desktop", "portfolio-lite-kpi-settled")}
          mobileCases={byKey("portfolio-lite-kpi-mobile", "portfolio-lite-kpi-settled-mobile")}
          desktopMin={720}
          mobileMin={860}
        />
      </SubSection>

      <SubSection title="Ⓒ Boost check（PF-6 … PF-7）">
        <Pair
          cases={byKey("portfolio-lite-gauge-bar", "portfolio-lite-details-popover")}
          mobileCases={byKey("portfolio-lite-gauge-states", "portfolio-lite-details-drawer")}
          desktopMin={720}
          mobileMin={860}
        />
      </SubSection>

      <SubSection title="Ⓓ Live 列表（PF-8 … PF-14）">
        <Pair
          cases={byKey(
            "portfolio-lite-desktop-rows",
            "portfolio-lite-side-chip",
            "autoclose-desktop-rows",
            "autoclose-standard-row",
            "portfolio-lite-hot",
            "portfolio-lite-standard-live",
            "portfolio-lite-airdrop-tag-rows",
            "portfolio-lite-settles-time",
          )}
          mobileCases={byKey(
            "portfolio-lite-live-cards",
            "portfolio-lite-side-chip-mobile",
            "autoclose-mobile-cards",
            "portfolio-lite-hot-mobile",
            "portfolio-lite-standard-live-mobile",
            "portfolio-lite-airdrop-tag-cards",
            "portfolio-lite-settles-time-mobile",
          )}
          desktopMin={900}
          mobileMin={1000}
        />
      </SubSection>

      <SubSection title="Ⓔ 挂单行（PF-15）">
        <Pair
          cases={byKey("portfolio-lite-pending-desktop")}
          mobileCases={byKey("portfolio-lite-pending-mobile")}
          desktopMin={420}
          mobileMin={460}
        />
      </SubSection>

      <SubSection title="Ⓕ 批量平仓（PF-16 … PF-18）">
        <Pair
          cases={byKey(
            "portfolio-lite-live-select-desktop",
            "portfolio-lite-batch-bar",
            "portfolio-lite-batch-confirm",
            "portfolio-lite-batch-closing",
          )}
          mobileCases={byKey(
            "portfolio-lite-live-select",
            "portfolio-lite-batch-bar-mobile",
            "portfolio-lite-batch-confirm-mobile",
            "portfolio-lite-batch-closing-mobile",
          )}
          desktopMin={900}
          mobileMin={900}
        />
      </SubSection>
    </div>
  </SectionWrapper>
);
