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

const ALL_CASES: SectionCase[] = [...CHROME_CASES, ...KPI_CASES, ...BOOST_CASES];

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
    title="Portfolio · 状态字典（PF-1…PF-7 · Ⓐ–Ⓒ 区）"
    description="分区序 = 生产模块序：Ⓐ页面外壳 · ⒷKPI · ⒸBoost check（ⒹLive 列表 · Ⓔ挂单行 · Ⓕ批量平仓下一单接入）。每个 case 双帧（desktop 1280 / mobile 375），同一编号两帧各挂各端生产真组件；fixture 只注数据与状态，一律确定性注入（禁止运行时 fetch、禁止绝对日期、禁止随机 id）。"
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
    </div>
  </SectionWrapper>
);
