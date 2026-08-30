/**
 * Events 列表 · 状态字典（M1a 分区①–④，mock10）。
 *
 * 每个 case = 生产组件 + SectionFrame 双帧（desktop 1280 在上 / mobile 375 在下）。
 * fixture 只注数据与状态；LiteEventCard 是 FROZEN 件，这里只摆放。
 */
import { SectionWrapper, SubSection } from "../components/SectionWrapper";
import { SectionFrame, type SectionCase } from "../components/SectionFrame";

/* ---------------- ① 页头与筛选行 ---------------- */

const HEADER_CASES: SectionCase[] = [
  {
    key: "events-ev1",
    label: "EV-1 · Hero（HomeHero · HP-1）",
    note: "静态开场，无数据依赖；插画走 /assets/desktop|mobile/hero-lynx.png，桌面移动各取各的资源。",
    spec: [
      {
        state: "桌面",
        when: "useIsMobile() === false",
        visual:
          "● LIVE MARKETS 药丸 + “What do you think happens next?” + 副行 “Pick a topic. Tap Yes or No. That's it.” + 右侧 lynx 插画",
        source: "HomeHero (src/components/lite/home/HomeHero.tsx)",
      },
      {
        state: "移动",
        when: "useIsMobile() === true",
        visual: "标题降级、插画换 mobile 资源；<390px 插画隐藏、留白收紧",
        source: "HomeHero isMobile",
      },
    ],
  },
  {
    key: "events-ev2",
    label: "EV-2 · 筛选行 · All 默认（LiteEventsFilterRow / MobileCategoryRow）",
    spec: [
      {
        state: "All 默认",
        when: 'sector === "all"',
        visual:
          "topic 胶囊 All…Social + Boost 切换 + 右侧 Watchlist / Calendar 入口",
        source: "LiteEventsFilterRow",
      },
      {
        state: "mobile 横向滚动",
        when: "useIsMobile() === true",
        visual: "同一组胶囊改为横滑轨，右端锁定 Watchlist / Calendar",
        source: "MobileCategoryRow",
      },
    ],
  },
  {
    key: "events-ev3",
    label: "EV-3 · 筛选行 · sector 选中（LiteEventsFilterRow）",
    spec: [
      {
        state: "sector 选中",
        when: 'sector === "sports"',
        visual: "选中胶囊白底反色，其余灰",
        source: "CategoryPill active",
      },
    ],
  },
  {
    key: "events-ev4",
    label: "EV-4 · 筛选行 · Boost ON（LiteEventsFilterRow）",
    note:
      "Boost ON 时生产页整条 Intraday band 隐藏（band 规则），网格只剩带 Boost 的事件；此处并列展示激活态胶囊与只剩 Boost 的网格。",
    spec: [
      {
        state: "Boost ON",
        when: "boostOnly === true",
        visual: "Boost 胶囊激活；网格只剩 Boost 事件；Intraday band 整体隐藏",
        source: "LiteEventsPage boostOnly / IntradayBand 显示条件",
      },
    ],
  },
];

/* ---------------- ② Intraday band ---------------- */

const INTRADAY_CASES: SectionCase[] = [
  {
    key: "events-ev5",
    label: "EV-5 · Crypto 卡默认（HomeCryptoCard · HP-1）",
    note:
      "fixture 冻结：tickSeconds=41（派生价恒定）、BTC/ETH/SOL 全档快照、倒计时由固定占比反推；禁运行时 fetch。",
    spec: [
      {
        state: "默认",
        when: "currentFor 有活轮",
        visual:
          "“● Intraday · Rolling rounds” + 卡右上模块级 ROUND dial [5m 15m 1h 4h 1D] + BTC 主 tile（现价 / 基线 / LAST 8 / Up·Down 钮）+ ETH·SOL 紧凑列",
        source: "HomeCryptoCard · useQuickRounds",
      },
    ],
  },
  {
    key: "events-ev6",
    label: "EV-6 · ROUND dial 选中 1h（HomeCryptoCard）",
    note: "dial 为模块级状态：三 tile 同步换档（不是 per-tile）。",
    spec: [
      {
        state: "非默认档",
        when: 'tf === "1h"（fixture initialTf）',
        visual: "三 tile 的倒计时 / 基线 / 赔率同时切到 1h，dial 高亮移到 1h",
        source: "HomeCryptoCard tf state",
      },
    ],
  },
  {
    key: "events-ev7",
    label: "EV-7 · Stocks 卡 · live（HomeStocksCard · ST-1）",
    note:
      "session 三态用 nowOverride 冻结（周三 11:00 本地）；生产不传该 prop = 实时钟，行为零变化。fixture 含 US 10 + HK 6 两组行集（HK tab 计数不为 0）；US 基准价按各标的真实量级（AAPL 232.85，不再与 META 量级错配）。",
    spec: [
      {
        state: "live",
        when: 'getStockSessionState(market).phase === "live"',
        visual: "实时价 + 当日 ±% + Closes in 倒计时；Up/Down 钮可点",
        source: "HomeStocksCard / StockRow",
      },
    ],
  },
  {
    key: "events-ev8",
    label: "EV-8 · Stocks 卡 · settling（HomeStocksCard · ST-1）",
    note: "nowOverride = 周三 16:22 → 收盘后 22 分，settling 窗口共 60 分。",
    spec: [
      {
        state: "settling",
        when: "now < lastCloseAt + 60min",
        visual:
          "Closed ↑/↓ + 收盘价；模块头 “Settled · next session in 38:00”；Up/Down 钮禁用",
        source: "HomeStocksCard settling 分支",
      },
    ],
  },
];

/* ---------------- ③ Sports band ---------------- */

const SPORTS_CASES: SectionCase[] = [
  {
    key: "events-ev9",
    label: "EV-9 · Sports 卡默认（HomeSportsCard · HP-1）",
    note:
      "fixture 确定性数据（17 场未开赛 + 1 场进行中），日期用相对偏移防腐烂；不依赖运行时 fetch。",
    spec: [
      {
        state: "默认",
        when: 'bucket === "all"',
        visual:
          "“SPORTS · MATCH WINNERS / Who wins the match?” + 7 日 day-rail（ALL n / FRI 28 n …）+ 三向 row（Juventus/Draw/Napoli 型）+ 两向 row（KC/BUF 型）",
        source: "SportsStageCard · useSportsMatches",
      },
    ],
  },
  {
    key: "events-ev9e",
    label: "EV-9e · Sports 卡空态（HomeSportsCard · matches=0 → 整卡 null）",
    note:
      "fixture 空行集（联赛间歇期）。移动端 MobileSportsModule 在无比赛时整块不渲染（生产行为），故 375 帧为空。",
    spec: [
      {
        state: "空态",
        when: "matches.length === 0",
        visual:
          "day-rail 只剩 “ALL 0” 单钮 + “No matches on this day” + 底部 “All days mixed · newest kickoff first” / “No further kickoffs scheduled” / “All 0 matches →”",
        source: "SportsStageCard 空行集分支",
      },
    ],
  },
  {
    key: "events-ev10",
    label: "EV-10 · day-rail 过滤（HomeSportsCard）",
    note: "fixture 只注初始 bucket（buildDayStrip 首个非 all 日），不传即生产默认 all。",
    spec: [
      {
        state: "选中某日",
        when: 'bucket === buildDayStrip(matches)[1].id',
        visual: "行集过滤为该日；rail 计数不变",
        source: "SportsStageCard initialBucket",
      },
    ],
  },
];

/* ---------------- ④ 卡片网格 ---------------- */

const CARD_CASES: SectionCase[] = [
  {
    key: "events-ev11",
    label: "EV-11 · binary 卡 · 无徽标（LiteEventCard）",
    spec: [
      {
        state: "binary 无徽标",
        when: "children.length === 2 && 无 status/boost 命中",
        visual:
          "五段语法：艺术图区 + eyebrow + 标题 + Yes/No chip-t2（价右 #33D6FF / #CFFF4A）+ footer “Vol $X · Settles …”",
        source: "LiteEventCard（FROZEN）",
      },
    ],
  },
  {
    key: "events-ev12",
    label: "EV-12 · multi 卡 · 无徽标（LiteEventCard）",
    spec: [
      {
        state: "multi",
        when: "children.length > 2",
        visual:
          "top2 概率行（左标签右 %）+ eyebrow “· n markets” + footer “+n markets”",
        source: "LiteEventCard（FROZEN）",
      },
    ],
  },
  {
    key: "events-ev13",
    label: "EV-13 · 徽标 · Ends soon（LiteEventCard）",
    note: "生产当下无 <4h 事件，用 fixture 事件行造（settles = FROZEN_NOW + 3h12m）。",
    spec: [
      {
        state: "Ends soon",
        when: "0 < expiry − now < 4h（LITE_LIST_CONFIG.endsSoonMs）",
        visual: "amber Clock 徽标 “Ends Xh Ym”，分钟精度、绝不显示秒",
        source: "liteListBadges.isEndsSoon / formatEndsIn",
      },
    ],
  },
  {
    key: "events-ev14",
    label: "EV-14 · 徽标 · New（LiteEventCard）",
    spec: [
      {
        state: "New",
        when: "now − createdAt < 24h（LITE_LIST_CONFIG.newMs）",
        visual: "Pulse 蓝底 “New”",
        source: "liteListBadges.isNewEventRow",
      },
    ],
  },
  {
    key: "events-ev15",
    label: "EV-15 · 徽标 · Trending（LiteEventCard）",
    spec: [
      {
        state: "Trending",
        when: "volume24h ≥ trendingCutoff（24h vol top 20%，活事件 ≥ 5）",
        visual: "白底 Flame “Trending”",
        source: "liteListBadges.trendingThreshold",
      },
    ],
  },
  {
    key: "events-ev16",
    label: "EV-16 · 徽标 · Boost n×（LiteEventCard）",
    spec: [
      {
        state: "Boost",
        when: "合约事件 && boostMax ≥ 2",
        visual: "volt Zap 徽标 “Boost 5×”（1× 永不渲染）",
        source: "LiteEventCard boostMax",
      },
    ],
  },
  {
    key: "events-ev17",
    label: "EV-17 · 徽标组合 · 两枚上限（LiteEventCard）",
    note:
      "三张：Ends soon + Boost 5×、Trending + Boost 3×、intraday 事件（Trending + Intraday + Boost 三候选 → 超出丢 Boost）。",
    spec: [
      {
        state: "STATUS + Boost",
        when: "STATUS 命中 && boostMax ≥ 2",
        visual: "fill order STATUS → Boost，共 2 枚",
        source: "liteListBadges.statusBadgeFor",
      },
      {
        state: "超出 2 枚",
        when: "STATUS + Intraday + Boost 三候选同时命中",
        visual: "按 fill order 保留前两枚，丢掉 Boost",
        source: "LiteEventCard badge slice(0, 2)",
      },
      {
        state: "STATUS 互斥优先级",
        when: "多个 STATUS 同时成立",
        visual: "Ends soon > New > Trending，最多 1 枚",
        source: "liteListBadges.statusBadgeFor",
      },
    ],
  },
  {
    key: "events-ev18",
    label: "EV-18 · 网格断点（LiteEventCard grid）",
    note: "帧宽自证：desktop 帧 3 列 / mobile 帧 1 列；sm:2 列见附注（375/1280 两帧无法自证）。",
    spec: [
      {
        state: "断点",
        when: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        visual: "desktop 3 列 / mobile 1 列，gap 18px",
        source: "LiteEventsPage 网格容器",
      },
    ],
  },
];

/* ---------------- 附注表 A/B/C/D ---------------- */

const Table = ({
  title,
  head,
  rows,
}: {
  title: string;
  head: string[];
  rows: string[][];
}) => (
  <div className="space-y-2">
    <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground/80">
      {title}
    </div>
    <div className="overflow-x-auto rounded-md border border-border/40">
      <table className="w-full min-w-[560px] border-collapse text-left text-[11px]">
        <thead>
          <tr className="bg-muted/20 text-[10px] uppercase tracking-wider text-muted-foreground/70">
            {head.map((h) => (
              <th key={h} className="px-2 py-1.5 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]} className="border-t border-border/30 align-top">
              {r.map((c, i) => (
                <td
                  key={i}
                  className={
                    i === 0
                      ? "px-2 py-1.5 font-medium text-foreground/90"
                      : "px-2 py-1.5 text-muted-foreground"
                  }
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const Footnotes = () => (
  <div className="space-y-6">
    <Table
      title="A · badge 阈值与组合规则（来源 src/lib/liteListBadges.ts · LITE_LIST_CONFIG）"
      head={["规则", "阈值 / 判定", "说明"]}
      rows={[
        ["Ends soon", "0 < expiry − now < 4h", "endsSoonMs = 4 * 60 * 60 * 1000"],
        ["New", "now − createdAt < 24h", "newMs = 24 * 60 * 60 * 1000"],
        [
          "Trending",
          "volume24h ≥ 24h vol top 20% 的切分值",
          "trendingTopFraction = 0.2，活事件数 < 5（trendingMinEvents）时整枚跳过",
        ],
        [
          "intraday 豁免",
          "isIntradayEvent(m) === true",
          "同日事件只可能带 Trending，New 与 Ends soon 一律不发",
        ],
        [
          "max 2 · fill order",
          "STATUS（最多 1）→ Intraday → Boost",
          "超出 2 枚按 fill order 截断，Boost 先丢",
        ],
      ]}
    />
    <Table
      title="B · 排序三步（来源 sortLiteLiveList）"
      head={["步骤", "规则", "说明"]}
      rows={[
        ["1", "Ends soon（<4h）置顶，按 time-to-settle 升序", "该块独占列表顶部"],
        ["2", "其余按 24h vol 降序（回退 totalVolume）", "All 与各品类视图同一套规则"],
        [
          "3",
          "New（<24h）提升进前 6（newLiftWithin）",
          "保持相对顺序，绝不顶掉 Ends-soon；Ends-soon 块已占满前 6 时整步跳过",
        ],
        ["例外", "watchlist 视图", "收藏视图不套用本排序"],
      ]}
    />
    <Table
      title="C · Settles 文案时态（footer 右侧）"
      head={["时态", "文案"]}
      rows={[
        ["当日", "Settles today HH:MM"],
        ["次日", "Settles tomorrow"],
        ["本周内", "Settles {Wkd}"],
        ["本年内", "Settles {Mon D}"],
        ["跨年", "Settles {Mon YYYY}"],
      ]}
    />
    <Table
      title="D · FROZEN 卡五段语法"
      head={["引用", "位置"]}
      rows={[
        [
          "五段语法正文不在此重抄",
          "见 memory `lite-event-card-frozen`（.lovable/memory/design/lite-event-card-frozen.md）",
        ],
      ]}
    />
  </div>
);

/* ---------------- ⑤ Calendar 视图（EV-19 / EV-20）---------------- */

const CALENDAR_CASES: SectionCase[] = [
  {
    key: "events-ev19",
    label: "EV-19 · Calendar · Week（LiteCalendarView）",
    note:
      "Calendar 是 Events 页的一个 view state，不是独立路由。fixture 事件集用相对日偏移（今天 +0 … +6），确定性注入；intraday 提示卡为静态文案。并账：旧「Lite · Calendar」节的 as-built 基线与 docs/design-contracts/calendar-asbuilt-notes.md 附录仍为唯一像素契约。",
    spec: [
      {
        state: "Week（默认）",
        when: 'mode === "week"',
        visual:
          "“What's coming up?” + Day/Week 切换（Week 激活）+ intraday 提示卡（“Crypto rounds never stop — trade Intraday anytime” / “Rolling 5m to 1D rounds have no fixed date…” / “Open Intraday →”）+ 七列日期 + SPORTS / INTRADAY / GENERAL 三类 mini-card（含本地时间）",
        source: "LiteCalendarView initialMode='week' · buildWeekColumns",
      },
      {
        state: "单列溢出",
        when: "该日 items.length > WEEK_TICKET_CAP(4)",
        visual: "列内只渲染前 4 张 ticket，其余折成 “+N” 计数行",
        source: "WEEK_TICKET_CAP",
      },
      {
        state: "空日",
        when: "该日 items.length === 0",
        visual: "列体留空，仅保留日期头",
        source: "buildCalendarItems",
      },
    ],
  },
  {
    key: "events-ev20",
    label: "EV-20 · Calendar · Day（LiteCalendarView）",
    spec: [
      {
        state: "Day",
        when: 'mode === "day"',
        visual: "单日时间轴形态：SpineRow 时间脊 + 当日 ticket 按 localTime 排布",
        source: "LiteCalendarView initialMode='day' · SpineRow",
      },
      {
        state: "Day · 空日",
        when: "当日 items.length === 0",
        visual: "站内 EmptyState 件（不是自绘空白）",
        source: "EmptyState (src/components/states)",
      },
    ],
  },
];

/* ---------------- ⑥ Watchlist（EV-21 … EV-23）---------------- */

const WATCHLIST_CASES: SectionCase[] = [
  {
    key: "events-ev21",
    label: "EV-21 · Watchlist · 未登录（入口态）",
    note:
      "未登录点击 Watchlist 不进入视图，而是 setAuthOpen(true) 拉起登录弹层；弹层本体收录在「登录 / 注册」页（AU-* 系列），此处不重复。",
    spec: [
      {
        state: "guest 入口",
        when: "!user",
        visual: "Watchlist 胶囊常亮可点，计数为空；点击后拉起登录弹层，视图不切换",
        source: "LiteEventsPage onWatchlist → setAuthOpen(true)",
      },
    ],
  },
  {
    key: "events-ev22",
    label: "EV-22 · Watchlist · 空（EmptyState）",
    spec: [
      {
        state: "登录 0 收藏",
        when: "user && watchlist.length === 0",
        visual:
          "“Nothing starred yet” / “Tap the ★ on any market and it'll show up here.” / 「See all markets」回列表",
        source: "EmptyState variant='page'",
      },
    ],
  },
  {
    key: "events-ev23",
    label: "EV-23 · Watchlist · 有内容（LiteEventCard FROZEN）",
    note: "卡片本体 FROZEN，此处只摆放。",
    spec: [
      {
        state: "有收藏",
        when: "user && watchlist.length > 0",
        visual: "FROZEN 卡网格，形态与主列表一致",
        source: "LiteEventCard",
      },
      {
        state: "排序例外",
        when: "view === 'watchlist'",
        visual:
          "保持用户收藏顺序，**不套 sortLiteLiveList**（主列表的 trending/ends-soon 排序在此不生效）",
        source: "LiteEventsPage watchlist 分支",
      },
    ],
  },
];

/* ---------------- ⑦ 加载骨架与空态（EV-24 … EV-26）---------------- */

const LOADING_CASES: SectionCase[] = [
  {
    key: "events-ev24",
    label: "EV-24 · 列表首载骨架（LiteEventsSkeletons）",
    note:
      "registry key 沿用既有 `lite-events-loading`（旧深链兼容），编号改挂 EV-24。并账自旧「Lite · Loading」子节。",
    spec: [
      {
        state: "首载",
        when: "hook loading === true && 无缓存数据",
        visual:
          "All stage（intraday + sports）+ 目录骨架；桌面网格 / 移动列表两形态；色块只用 #171A1F / #15181C，与终态逐模块同尺寸（CLS≈0）",
        source: "LiteAllStageSkeleton / LiteMarketGridSkeleton / LiteMarketListSkeleton",
      },
      {
        state: "有缓存",
        when: "切 tab / 返回且已有缓存",
        visual: "直接渲染真内容，不闪骨架；各模块独立判断 loading，先到先实底",
        source: "LiteEventsPage 渐进点亮",
      },
      {
        state: "品类 rail",
        when: "恒真",
        visual: "静态内容，首载即实底，不骨架",
        source: "LiteEventsFilterRow",
      },
    ],
  },
  {
    key: "events-ev25",
    label: "EV-25 · 目录首载骨架（LiteEventsSkeletons）",
    note: "registry key 沿用既有 `lite-events-loading-catalogue`，编号改挂 EV-25。",
    spec: [
      {
        state: "sector / watchlist 首载",
        when: "sector !== 'all' && loading === true",
        visual: "只渲染目录骨架，无 stage 骨架",
        source: "LiteMarketGridSkeleton / LiteMarketListSkeleton",
      },
    ],
  },
  {
    key: "events-ev26",
    label: "EV-26 · sector 空态（EmptyState）",
    spec: [
      {
        state: "该 sector 0 活事件",
        when: "sector !== 'all' && list.length === 0 && !loading",
        visual:
          "“No open markets here right now” / “New markets land in this topic as they open. Check back soon.” / 「See all markets」",
        source: "EmptyState variant='page'",
      },
    ],
  },
];

/* ---------------- ⑧ 主页 stage 与目录带（EV-27 … EV-35 · HP-1 / ST-1）---------------- */

const STAGE_CASES: SectionCase[] = [
  {
    key: "events-ev27",
    label: "EV-27 · Stocks 卡 · preSession（HomeStocksCard · ST-1）",
    note: "nowOverride = 周日 14:00 → 三态机跳周末，下一开盘为周一 09:30。",
    spec: [
      {
        state: "preSession",
        when: "settling 结束 && now < nextOpenAt",
        visual:
          "Last close 参考价（不跳动、无 “% today”）+ “NEXT SESSION · Opens 09:30”；Up/Down 可下单",
        source: "HomeStocksCard preSession 分支",
      },
      {
        state: "preSession · 移动行内 meta",
        when: "isMobile && phase === \"preSession\"",
        visual:
          "行内第二行不再写 session，改为公司名行（ticker 上 / 公司名下，来自 STOCK_NAME）；价格上方小字 “Last close”，无 “% today”；session 信息只在模块头 “●” 状态行出现",
        source: "MobileStockRow（HomeStocksCard 移动分支）/ STOCK_NAME",
      },
      {
        state: "模块头 ● 状态行 · 六组合逐字",
        when: "tab ∈ {us, hk} × phase ∈ {live, settling, preSession}",
        visual:
          "US live “US settles at close 16:00” / US settling “Settled · next session in mm:ss” / US preSession “Next session · US opens 09:30”；HK live “HK settles at close 16:00 HKT” / HK settling “Settled · next session in mm:ss” / HK preSession “Next session · HK opens 09:30 HKT”",
        source: "HomeStocksCard settleLine（移动端渲染在 ● 行，桌面渲染在标题行右端）",
      },
    ],
  },
  {
    key: "events-ev28",
    label: "EV-28 · US / HK tab 独立（HomeStocksCard）",
    note:
      "同一冻结时刻：US 处 preSession（周日），HK 依交易所本地日历自判 → 两 tab 的行集、模块头文案、货币格式互不串。",
    spec: [
      {
        state: "US tab",
        when: 'tab === "us"',
        visual: "US 行集 + $ 格式 + US 日历派生的 session 文案",
        source: "HomeStocksCard tab / US_STOCK_MARKET",
      },
      {
        state: "HK tab",
        when: 'tab === "hk"',
        visual: "HK 行集 + HK$ 格式 + HK 日历派生的 session 文案（与 US 可不同态）",
        source: "HomeStocksCard tab / HK_STOCK_MARKET",
      },
    ],
  },
  {
    key: "events-ev29",
    label: "EV-29 · Stocks 移动形态（HomeStocksCard isMobile）",
    note: "移动帧才是本 case 的主体；桌面帧为对照。",
    spec: [
      {
        state: "折叠",
        when: "isMobile && !expanded",
        visual: "先 5 行 + “Show all 10 →”",
        source: "HomeStocksCard 移动分支",
      },
      {
        state: "展开",
        when: "点 Show all",
        visual:
          "全行展开；每行为两层卡片——上层 40px logo + ticker/公司名 + 价格（preSession 加 “Last close” 小字，live/settling 加 ±%），下层整幅动作区（live/preSession 为 Up/Down 对，settling 为 “Closed ↑/↓” + 禁用 “Next session in mm:ss”，无价为 “Unavailable”）；行内不出现 session 文案",
        source: "MobileStockRow（HomeStocksCard 移动分支）",
      },
    ],
  },
  {
    key: "events-ev30",
    label: "EV-30 · Stocks 骨架 / 单行失败（HomeStocksCard）",
    spec: [
      {
        state: "骨架",
        when: "loading === true && rows.length === 0",
        visual: "行位骨架条（#171A1F / #15181C），与终态同尺寸",
        source: "HomeStocksCard loading 分支",
      },
      {
        state: "单行失败",
        when: "row.base_price == null",
        visual: "该行降级为无价读数，其余行照常渲染（不整卡塌陷）",
        source: "StockRow 缺价分支",
      },
    ],
  },
  {
    key: "events-ev31",
    label: "EV-31 · Sports 预算封顶（HomeSportsCard · 6 场同时 live）",
    note: "硬封顶：置顶 LiveCard ≤3，降级 live 与 upcoming 共用同一行数预算，超出（含 live）一律折进 “N more this week”。模块高度不随 live 数增长。",
    spec: [
      {
        state: "live 溢出",
        when: "live.length > LIVE_MAX(3)",
        visual:
          "置顶 3 条 LIVE + 降级 live 行（绿点）优先占预算 + 剩余预算填 upcoming + 底部 “N more this week →”",
        source:
          "HomeSportsCard：budget = max(2, 5 − pinned) + extraRows；liveRows = live.slice(3, 3 + budget)；rows = upcoming.slice(0, budget − liveRows)",
      },
    ],
  },
  {
    key: "events-ev32",
    label: "EV-32 · Editor's Desk（HomeDeskCard）",
    spec: [
      {
        state: "有 picks",
        when: "picks.length > 0（最多 MAX_PICKS=3）",
        visual: "“✦ Editor's Desk / What's worth watching” + 每条 note 截断 + Yes/No 价",
        source: "HomeDeskCard",
      },
      {
        state: "无 picks",
        when: "picks.length === 0",
        visual: "整卡不渲染；Sports 卡以 extraRows=2 补位保持双列齐平",
        source: "HomeDeskCard 早退 / HomeSportsCard extraRows",
      },
    ],
  },
  {
    key: "events-ev33",
    label: "EV-33 · 行情 tape（HomeTape · HP-1c 恒滚）",
    note: "恒定线速 ~30px/s（duration = scrollWidth / 60，下限 20s）；prefers-reduced-motion 静止。",
    spec: [
      {
        state: "常态",
        when: "items.length > 0",
        visual: "双份拼接无缝循环，涨绿跌红，点击进 /spot",
        source: "HomeTape",
      },
      {
        state: "加载",
        when: "loading === true",
        visual: "骨架条（桌面 42 / 移动 40）",
        source: "HomeTapeSkeleton",
      },
      {
        state: "空",
        when: "items.length === 0",
        visual: "整条 null，不占位",
        source: "HomeTape 早退",
      },
    ],
  },
  {
    key: "events-ev34",
    label: "EV-34 · 目录板头（CatalogueHeaderRow · HP-1b）",
    spec: [
      {
        state: "stage 视图",
        when: 'sector === "all" && !watchlist',
        visual:
          "“ALL MARKETS ›”（font-display 700 / 15px / 0.10em 大写）+ 右端 mono “{n} open”，n = filtered.length",
        source: "CatalogueHeaderRow (LiteEventsPage)",
      },
    ],
  },
  {
    key: "events-ev35",
    label: "EV-35 · 目录身份卡（CatalogueIdentityCard · HP-1b）",
    note: "网格首格；不可点、aria-hidden，不计入 open 数。",
    spec: [
      {
        state: "stage 视图首格",
        when: 'sector === "all" && !watchlist',
        visual: "will-it-happen 插画（桌面/移动各取各资源）+ “Buy Yes or No…” 身份文案",
        source: "CatalogueIdentityCard (LiteEventsPage)",
      },
    ],
  },
];

/* ---------------- 规则 9 · 版式几何契约（DESIGN.md §7.9）---------------- */

const GEO_HEAD = ["元素", "宽", "高", "定高?", "延伸方向与上限", "溢出处置"];

/** 页级「版式几何总表」——SG-HP 附录 F2 原表，数值 = 代码常量。 */
const StageGeometry = () => (
  <div className="space-y-2">
    <Table
      title="版式几何总表 · 主页 stage（SG-HP 附录 F2 原文；数值 = 代码常量，无「大约」）"
      head={GEO_HEAD}
      rows={[
        [
          "页内容容器",
          "max 1280（max-w-7xl），gutter 移动 16 / 桌面 16→24（px-4 lg:px-6）",
          "—",
          "—",
          "纵向随内容",
          "—",
        ],
        [
          "行情 tape",
          "全出血 100%",
          "桌面 42 / 移动 40",
          "定高",
          "不延伸",
          "内容超宽 = 恒滚，永不折行",
        ],
        [
          "stage 栅格（桌面）",
          "12 列，gap 24，marginTop 16",
          "两列 items-stretch 底部平齐",
          "—",
          "整体随两列中较高者",
          "—",
        ],
        [
          "左栏（span 8）· Crypto 卡",
          "栅格 8/12",
          "内容自然高（flex:none）",
          "定高（不参与吸收）",
          "不延伸",
          "—",
        ],
        [
          "左栏 · Stocks 卡",
          "同上，与 Crypto 间距 24",
          "flex:1 吸收左栏剩余全部高度",
          "否——全页唯一弹性吸收者",
          "向下延伸至与右栏底平齐",
          "行集 space-evenly 均布行距；行数固定（US 10 / HK 6），行高不定死、行距伸缩",
        ],
        [
          "右栏（span 4）· Sports 卡",
          "栅格 4/12，栏内 gap 24",
          "内容自然高 = 全页高度主",
          "否，但行数预算封顶",
          "上限 = LiveCard ≤3 + 降级行与未开赛行合计 ≤ max(2, 5−live) + extraRows",
          "超出折进 “N more this week” 计数行——数据再多也不再向下延伸",
        ],
        [
          "右栏 · Editor's Desk 卡",
          "同上",
          "内容自然高",
          "否，条数定额 ≤3",
          "不超 3 条",
          "picks=0 → 整卡不渲染，Sports extraRows=2 扩容补位调平",
        ],
        [
          "左右调平机制",
          "平衡靠行数预算而非组件拉伸",
          "右栏用预算参数（LIVE_MAX=3、基础预算 5、extraRows=2）控高",
          "—",
          "左栏 stocks 用行距伸缩吸收残差",
          "任何一侧禁止「数据驱动无限增高」",
        ],
        [
          "移动（App 壳 max-w 448）",
          "单列，gap 14",
          "全部自然高",
          "—",
          "无对齐契约",
          "stocks 5 行 + “Show all 10 →” 折叠；sports 同一预算公式；desk 同额",
        ],
        [
          "移动 stage 起始",
          "单列容器 px-4",
          "marginTop 10",
          "—",
          "纵向随内容",
          "—",
        ],
      ]}
    />
    <div className="text-[11px] leading-relaxed text-muted-foreground/80">
      来源常量：<code>HomeStage.tsx</code>（gap 24 / marginTop 16 / span 8·4 / 移动 gap 14
      marginTop 10）、<code>HomeTape.tsx</code>（height 42 / 40）、
      <code>HomeSportsCard.tsx</code>（LIVE_MAX = 3、budget = max(2, 5 − pinned) + extraRows）、
      <code>editorialPicks.ts</code>（MAX_PICKS = 3）、<code>LiteEventsPage.tsx</code>
      （max-w-7xl、px-4 lg:px-6）。
    </div>
    <div className="text-[11px] leading-relaxed text-muted-foreground/80">
      指纹例外（0830 验收实测，连刷 5 次）：EV-1…EV-35 / SP-1…SP-18 共 112 帧中 111
      帧 DOM 指纹恒定；唯 <code>EV-13</code> 因目录卡倒计时按真实钟走分钟位（
      <code>Ends 3h 11m → 3h 12m</code>）在跨分钟时变一位。该行由 FROZEN 的
      <code>LiteEventCard</code> 渲染、不接 <code>nowOverride</code>，本轮不改动，按分钟粒度例外挂账。
    </div>

  </div>
);

const TapeGeometry = () => (
  <Table
    title="EV-33 几何表 · 行情 tape（HomeTape）"
    head={GEO_HEAD}
    rows={[
      ["tape 轨道", "全出血 100%", "桌面 42 / 移动 40", "定高", "不延伸", "overflow hidden，单行永不折行"],
      ["cell 间距", "内容宽（auto）", "行内 = 轨道高", "跟随轨道", "水平", "gap 桌面 40 / 移动 24"],
      ["轨道内缩", "paddingLeft/Right 桌面 24 / 移动 16", "—", "—", "—", "—"],
      ["cell 内部", "auto", "—", "—", "水平", "gap 8，fontSize 13，tabular-nums"],
      ["骨架条", "100%", "桌面 42 / 移动 40", "定高", "不延伸", "与终态等高，零 CLS"],
      ["滚动", "双份 cells 拼接", "—", "—", "translateX(−50%) 无缝", "--duration = scrollWidth / 60（≈30px/s），下限 20s"],
    ]}
  />
);

const CryptoGeometry = () => (
  <Table
    title="EV-5 几何表 · Crypto 卡（HomeCryptoCard）"
    head={GEO_HEAD}
    rows={[
      ["HomeCard", "左栏 span 8 满宽", "内容自然高（flex:none）", "定高（不吸收）", "不延伸", "radius 20 / 边 1px rgba(148,163,184,0.14)"],
      ["卡 padding", "桌面 26×30 / 移动 16", "—", "—", "—", "—"],
      ["内部栅格", "7fr : 5fr，gap 16，marginTop 20", "两列", "—", "随较高列", "移动改单列 + 2 列副 tile 网格 gap 10"],
      ["BTC 主 tile", "7fr", "图表 176（移动 compact 132）", "图表定高", "不延伸", "padding 22×24（compact 14×14）"],
      ["ETH/SOL 副 tile", "5fr 列内堆叠", "图表 72", "图表定高", "不延伸", "padding 16×18（compact 12×12），网格 gap 8（compact 6）"],
      ["Up/Down 钮", "flex 均分", "主 tile minHeight 44（compact 46）/ 副 tile 38（compact 44）", "定高", "不延伸", "label 左 / 价右，gap ≥ 8，窄宽不粘连"],
    ]}
  />
);

const StocksGeometry = () => (
  <Table
    title="EV-7 几何表 · Stocks 卡（HomeStocksCard）——全页唯一弹性吸收者"
    head={GEO_HEAD}
    rows={[
      ["HomeCard", "左栏 span 8 满宽", "flex:1 吸收左栏残差", "否", "向下延伸至与右栏底平齐", "radius 20 / 边 1px"],
      ["卡 padding", "桌面 22×28 / 移动 18×16", "—", "—", "—", "—"],
      ["行集容器", "100%", "flex-1", "否", "space-evenly 均布（移动 flex-start）", "行距伸缩吸收残差，行高不定死"],
      ["行", "100%", "内容自然高", "否", "不延伸", "padding 8×0（移动 7×0）"],
      ["行数", "US 10 / HK 6", "—", "定额", "不随数据增长", "移动 5 行 + “Show all 10 →” 折叠"],
      ["Up/Down 钮 · 禁用钮", "内容宽", "minHeight 38", "定高", "不延伸", "settling 文案 tabular-nums，桌面 13.5 / 移动 12"],
      ["骨架行", "100%", "38（margin 8×0）", "定高", "不延伸", "桌面 10 条 / 移动 5 条，等高不塌陷"],
      ["settleLine 模块头", "ml-auto 右对齐", "行内 fontSize 桌面 13.5 / 移动 12", "—", "不延伸", "行内 settle 文案；标题行同排右端"],
    ]}
  />
);

const SportsGeometry = () => (
  <Table
    title="EV-9 / EV-31 几何表 · Sports 卡（HomeSportsCard）——预算封顶，禁数据驱动增高"
    head={GEO_HEAD}
    rows={[
      ["HomeCard", "右栏 span 4 满宽", "内容自然高", "否，行数预算封顶", "恒 = LiveCard ≤3 + 行数 ≤ max(2, 5 − pinned) + extraRows（降级 live 优先占行）", "含溢出 live 在内一律折进 “N more this week”"],
      ["卡 padding", "桌面 26×28 / 移动 18×16", "—", "—", "—", "—"],
      ["day strip", "100%", "内容自然高", "—", "水平", "gap 6，marginTop 桌面 18 / 移动 14；pill padding 桌面 7×8 / 移动 6×12"],
      ["LiveCard", "100%", "内容自然高", "否，条数 ≤ LIVE_MAX 3", "不延伸", "padding 14×14×16，marginTop 12"],
      ["UpcomingRow", "100%", "内容自然高", "否，受预算钳制", "不延伸", "padding 16×0 + 底分隔线 1px"],
      ["Monogram", "30×30", "30", "定高", "—", "第二枚 marginLeft −9 重叠"],
      ["OddsButton 行", "flex", "内容自然高", "—", "水平", "gap 8，marginTop 12"],
      ["footer 计数行", "100%", "内容自然高", "—", "不延伸", "marginTop 16；“N more this week” / “All N matches →”"],


    ]}
  />
);

const DeskGeometry = () => (
  <Table
    title="EV-32 几何表 · Editor's Desk（HomeDeskCard）"
    head={GEO_HEAD}
    rows={[
      ["HomeCard", "右栏 span 4 满宽", "内容自然高", "否，条数定额 ≤ MAX_PICKS 3", "不超 3 条", "picks=0 → 整卡 null，Sports extraRows=2 补位"],
      ["卡 padding", "桌面 26×28 / 移动 18×16", "—", "—", "—", "—"],
      ["pick 行", "100%", "内容自然高", "否", "不延伸", "padding 15×0 + 底分隔线 1px；序号列 gap 14"],
      ["note 行", "行内", "单行", "—", "不延伸", "斜体 “{note}”，超长截断不换段"],
      ["行内钮组", "flex", "内容自然高", "—", "水平", "gap 8，marginTop 10"],
    ]}
  />
);

/* ---------------- 附注表 E / F / G（Stocks 分区尾）---------------- */

const StocksFootnotes = () => (
  <div className="space-y-6">
    <Table
      title="E · session 状态机（来源 src/lib/usStockSessions.ts · getStockSessionState）"
      head={["态", "判定（交易所 wall clock）", "US 窗口", "HK 窗口", "tradable"]}
      rows={[
        [
          "live",
          "交易日 && open ≤ now < close",
          "09:30–16:00 ET",
          "09:30–16:00 HKT",
          "true（当前时段 market）",
        ],
        [
          "settling",
          "now < lastClose + SETTLING_MINUTES(60)",
          "16:00–17:00 ET",
          "16:00–17:00 HKT",
          "false",
        ],
        [
          "preSession",
          "lastClose + 60min ≤ now < 下一开盘钟",
          "17:00 ET → 次开盘 09:30",
          "17:00 HKT → 次开盘 09:30",
          "true（下一时段 market）",
        ],
        [
          "周末 / 假日顺延",
          "isTradingDay() 逐日前后走查（dow 0/6 或命中 MARKET_HOLIDAYS 即跳过）",
          "周五 16:00 + 1h → preSession 跨周末指向周一 09:30",
          "同 US 规则",
          "preSession = true",
        ],
        [
          "MARKET_HOLIDAYS 挂账",
          "`{ us: [], hk: [], kr: [] }` 当前为空表",
          "交易所假日尚未灌入，节假日会误判为交易日",
          "同左",
          "挂账：待交易所日历接入",
        ],
      ]}
    />
    <Table
      title="F · settleLine 6 组合矩阵（HomeStocksCard settleLine · 仅桌面渲染，移动不渲染此行）"
      head={["态", "US 逐字", "HK 逐字"]}
      rows={[
        [
          "live",
          "US settles at close 04:00（`US settles at close ${formatLocalTime(closeAt)}`，查看者本地钟）",
          "HK settles at close 16:00 HKT（常量文案）",
        ],
        [
          "settling",
          "Settled · next session in mm:ss",
          "Settled · next session in mm:ss（US/HK 同一句，不带市场名）",
        ],
        [
          "preSession",
          "Next session · US opens 21:30（`US opens ${formatLocalTime(nextOpenAt)}`，查看者本地钟）",
          "Next session · HK opens 09:30 HKT（常量文案）",
        ],
      ]}
    />
    <Table
      title="G · 词条引用与 Pro 边界"
      head={["项", "内容"]}
      rows={[
        [
          "词条来源",
          "docs/copy-dictionary.md「Stocks · 交易时段（ST-1）」区为唯一词条源，此处不重抄全文",
        ],
        [
          "Pro spot 不接三态",
          "有意决策：ST-1 三态只落 Lite（HomeStocksCard / LiteSpotTrade）；Pro `SpotTrading.tsx` 保持既有生命周期口径，本轮零改动",
        ],
      ]}
    />
  </div>
);

/* ---------------- 并账清单（旧六节 → EV-case）---------------- */

const Ledger = () => (
  <div className="space-y-6">
    <Table
      title="并账清单 · 旧六节逐条去向（M1b 删除挂载，section 文件保留仓库）"
      head={["原文位置", "去向"]}
      rows={[
        ["LiteSection part=events · “Loading — 首载模块骨架”", "并入 EV-24 / EV-25 spec + note（触发规则、渐进点亮、色值、CLS 全文照搬）"],
        ["LiteSection part=events · “Category pill · Sports live pulse”", "并入 EV-2 / EV-3（筛选行 case，live pulse 判定 useSportsMatches().rows.some(m => m.live)）"],
        ["LiteSection part=events · “Markets list”（卡 + badge 矩阵 + sort 注记）", "并入 EV-11 … EV-18 与附注表 A/B/C/D"],
        ["LiteAllStageSection · Chip tiers / Category row / IntradayStageCard / SportsStageCard / Coin tile plot / Category view 7A·7B / Sports sub-nav 13A", "并入 EV-2 … EV-10；其中 sub-nav 13A 已被生产超越，随节消亡；7A/7B 见下方 memory 更正注记②"],
        ["LiteVerticalViewsSection · Crypto view / Finance view", "装配层 category-as-view 不再是 Events 页结构（topic tab + band 取代）；组件本身仍存续，见 memory 更正注记②；其内 Last8Strip / DirectionButton 规范保留在 EV-5 … EV-8"],
        ["LiteCalendarSection · Chrome & controls 入口 chips", "并入 EV-19 note（Watchlist / Calendar 右对齐、互斥、Calendar 非品类故激活填白）"],
        ["LiteCalendarSection · Closes soon badge", "并入 EV-16（近截止徽标，24h 内停止交易，仅灰描边不上色）"],
        ["LiteCalendarSection · desktop frames / mobile frames", "并入 EV-19（Week）+ EV-20（Day / 空日）；as-built 像素契约仍指向 docs/design-contracts/calendar-asbuilt-notes.md"],
        ["LiteFinalTouchesSection · Editor's picks", "该「随节消亡」判定已被 HP-1 反超，见 memory 更正注记①（现落 EV-32）"],
        ["LiteFinalTouchesSection · Mobile events page (390)", "并入 EV-5 / EV-9 / EV-9e 的 mobile 帧（无活赛 → “Nothing playing now”；两 session 全关 → 日历文案行）"],
        ["LiteFinalTouchesSection · Mobile category row 控件簇", "并入 EV-2（右端固定 Watchlist 计数 chip 与 Calendar chip，不随滚动）"],
        ["LiteFinalTouchesSection · Boost · in-place filter", "并入 EV-4（Boost 为筛选非品类，就地过滤当前列表，不新增路由）"],
        ["EventArtSection · 美术方向规范", "原文移入 Foundations 组（EventArtSection 挂载点改到 Foundations），Events 页不再挂"],
      ]}
    />
    <Table
      title="重写列账表 · 同号重写 case 的旧 spec 去向（SG-HP 第 5 条）"
      head={["case", "旧 spec 原文位置", "去向 / 消亡依据"]}
      rows={[
        ["EV-1", "EventsStatesSection HEADER_CASES «EV-1 · 页头（LiteEventsHeader）» — 站内 logo 行 + 标题 “Markets” 三行结构", "去向：整条被 HP-1 生产超越——生产页头改 HomeHero（LIVE MARKETS 药丸 + lynx 插画）。旧 spec 消亡依据：HomeHero 上线后 LiteEventsHeader 不再渲染标题块"],
        ["EV-4", "HEADER_CASES «EV-4 · Boost ON» — 仅描述“Boost 胶囊激活 + 网格只剩 Boost 事件”", "去向：并入本轮 EV-4（新增 sector=all 分组头 / sector+Boost 扁平网格 / 身份卡与板头不渲染三条）。旧 spec 未消亡，被扩写"],
        ["EV-5", "INTRADAY_CASES «EV-5 · Intraday band 默认（IntradayStageCard）» — 三 tile 横排 + per-tile dial", "去向：被 HP-1 生产超越——IntradayStageCard 不再挂主页，改 HomeCryptoCard（7fr:5fr + 模块级 dial）"],
        ["EV-6", "INTRADAY_CASES «EV-6 · per-tile 档位切换» — 每个 tile 各自 dial", "去向：消亡（生产改模块级 dial，三 tile 同步）；差异写进本轮 EV-6 note"],
        ["EV-7", "INTRADAY_CASES «EV-7 · Stocks 行（FinanceStageCard）» — 单一 live 形态，无 session 概念", "去向：被 ST-1 三态超越，重写为 live 态 case；settling / preSession 另立 EV-8 / EV-27"],
        ["EV-8", "INTRADAY_CASES «EV-8 · Stocks 收盘» — “Closed” 静态文案，无倒计时", "去向：重写为 settling 态（60 分窗口 + mm:ss 倒计时 + Closed ↑/↓ 徽章）"],
        ["EV-9", "SPORTS_CASES «EV-9 · Sports band 默认（SportsStageCard）» — 三向 / 两向 row 描述", "去向：被 HP-1 生产超越——改 HomeSportsCard（day strip + LiveCard + UpcomingRow + footer 计数行）"],
        ["EV-9e", "SPORTS_CASES «EV-9e · Sports 空态» — “day-rail 只剩 ALL 0 + No matches on this day”", "去向：行为反转——HomeSportsCard 空行集**整卡不渲染（null）**；旧空态文案随 SportsStageCard 消亡"],
        ["EV-10", "SPORTS_CASES «EV-10 · day-rail 过滤（SportsStageCard）»", "去向：同 EV-9，承接件换 HomeSportsCard，判定与行集规则原样保留"],
        ["EV-24", "LOADING_CASES «EV-24 · 首载骨架（LiteAllStageSkeleton）» — 只覆盖 stage 骨架", "去向：重写触发式为 stageFirstLoad =（rounds 空&&loading）||（stocks 空&&loading）|| sportsFirstLoad，并追加 tape 骨架条；“有缓存不闪骨架 / 渐进点亮”原文保留"],
        ["EV-25", "LOADING_CASES «EV-25 · 目录骨架» — 未与 stage 骨架区分触发式", "去向：重写为 eventsFirstLoad 独立触发（只渲目录骨架，stage 已点亮）"],
      ]}
    />
    <Table
      title="memory 更正注记（SG-HP 第 5 条 a / b）"
      head={["注记", "原记载", "更正"]}
      rows={[
        [
          "① Editor's picks",
          "M1b 并账记「LiteFinalTouchesSection · Editor's picks 随节消亡（/ 列表页当前不渲染）」",
          "已被 HP-1 反超：生产主页现渲染 Editor's Desk（HomeDeskCard，MAX_PICKS=3），本轮落案 EV-32。原「随节消亡」判定作废",
        ],
        [
          "② 7A / 7B category-as-view",
          "M1b 并账记「category-as-view 装配层不再存在，随节消亡」",
          "厘清：装配层作为 **Events 页结构** 已消亡，但组件以 LiteIntradayView / LiteSportsView / LiteCryptoView / LiteFinanceView 在品类路由下继续存续；本轮不为其立新 case，仅更正表述",
        ],
      ]}
    />
  </div>
);

/* ---------------- section ---------------- */

const Pair = ({
  cases,
  desktopMin,
  mobileMin,
}: {
  cases: SectionCase[];
  desktopMin?: number;
  mobileMin?: number;
}) => (
  <>
    <SectionFrame cases={cases} device="desktop" minHeight={desktopMin ?? 360} />
    <div className="mt-3">
      <SectionFrame cases={cases} device="mobile" minHeight={mobileMin ?? 420} />
    </div>
  </>
);

/* 分区按生产模块序装配；case 编号与 key 一个都不改。 */
const ALL_CASES: SectionCase[] = [
  ...HEADER_CASES,
  ...INTRADAY_CASES,
  ...SPORTS_CASES,
  ...CARD_CASES,
  ...CALENDAR_CASES,
  ...WATCHLIST_CASES,
  ...LOADING_CASES,
  ...STAGE_CASES,
];

const byKey = (...keys: string[]): SectionCase[] =>
  keys.map((k) => {
    const hit = ALL_CASES.find((c) => c.key === k);
    if (!hit) throw new Error(`EventsStatesSection: unknown case key ${k}`);
    return hit;
  });

export const EventsStatesSection = () => (
  <SectionWrapper
    id="events-states"
    title="Events 列表 · 状态字典（EV-1…EV-35（含 EV-9e）· 共 36 case）"
    description="分区序 = 生产模块序：①行情 tape · ②Hero · ③筛选行 · ④Crypto · ⑤Stocks 三态 · ⑥Sports · ⑦Editor's Desk · ⑧目录（板头/身份卡/网格）· ⑨Calendar · ⑩Watchlist · ⑪骨架与空态。每个 case 双帧（desktop 1280 / mobile 375），fixture 只注数据与状态，且一律确定性注入（禁止运行时 fetch）。"
  >
    <div className="space-y-12">
      <StageGeometry />

      <SubSection title="① 行情 tape（EV-33）">
        <Pair cases={byKey("events-ev33")} desktopMin={320} mobileMin={320} />
        <div className="mt-6">
          <TapeGeometry />
        </div>
      </SubSection>

      <SubSection title="② Hero（EV-1）">
        <Pair cases={byKey("events-ev1")} desktopMin={420} mobileMin={480} />
      </SubSection>

      <SubSection title="③ 筛选行（EV-2 … EV-4）">
        <Pair
          cases={byKey("events-ev2", "events-ev3", "events-ev4")}
          desktopMin={420}
          mobileMin={480}
        />
      </SubSection>

      <SubSection title="④ Crypto 卡（EV-5 / EV-6）">
        <Pair cases={byKey("events-ev5", "events-ev6")} desktopMin={760} mobileMin={860} />
        <div className="mt-6">
          <CryptoGeometry />
        </div>
      </SubSection>

      <SubSection title="⑤ Stocks 三态（EV-7 / EV-8 / EV-27 … EV-30 · ST-1）">
        <Pair
          cases={byKey(
            "events-ev7",
            "events-ev8",
            "events-ev27",
            "events-ev28",
            "events-ev29",
            "events-ev30",
          )}
          desktopMin={760}
          mobileMin={900}
        />
        <div className="mt-6 space-y-6">
          <StocksGeometry />
          <StocksFootnotes />
        </div>
      </SubSection>

      <SubSection title="⑥ Sports 卡（EV-9 / EV-9e / EV-10 / EV-31）">
        <Pair
          cases={byKey("events-ev9", "events-ev9e", "events-ev10", "events-ev31")}
          desktopMin={620}
          mobileMin={720}
        />
        <div className="mt-6">
          <SportsGeometry />
        </div>
      </SubSection>

      <SubSection title="⑦ Editor's Desk（EV-32）">
        <Pair cases={byKey("events-ev32")} desktopMin={420} mobileMin={480} />
        <div className="mt-6">
          <DeskGeometry />
        </div>
      </SubSection>

      <SubSection title="⑧ 目录：板头 / 身份卡 / 卡片网格（EV-34 / EV-35 + EV-11 … EV-18 · LiteEventCard FROZEN）">
        <Pair
          cases={byKey(
            "events-ev34",
            "events-ev35",
            "events-ev11",
            "events-ev12",
            "events-ev13",
            "events-ev14",
            "events-ev15",
            "events-ev16",
            "events-ev17",
            "events-ev18",
          )}
          desktopMin={900}
          mobileMin={1200}
        />
        <div className="mt-8">
          <Footnotes />
        </div>
      </SubSection>

      <SubSection title="⑨ Calendar 视图（EV-19 / EV-20）">
        <Pair cases={byKey("events-ev19", "events-ev20")} desktopMin={860} mobileMin={900} />
      </SubSection>

      <SubSection title="⑩ Watchlist（EV-21 … EV-23）">
        <Pair
          cases={byKey("events-ev21", "events-ev22", "events-ev23")}
          desktopMin={620}
          mobileMin={780}
        />
      </SubSection>

      <SubSection title="⑪ 骨架与空态（EV-24 … EV-26）">
        <Pair
          cases={byKey("events-ev24", "events-ev25", "events-ev26")}
          desktopMin={900}
          mobileMin={1000}
        />
      </SubSection>

      <div className="mt-8">
        <Ledger />
      </div>
    </div>
  </SectionWrapper>
);
