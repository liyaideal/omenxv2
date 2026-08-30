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
      "session 三态用 nowOverride 冻结（周三 11:00 本地）；生产不传该 prop = 实时钟，行为零变化。",
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
        visual: "全行展开；每行两层 meta（标的+价在上，session+钮在下）",
        source: "HomeStocksCard 移动分支",
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
    note: "复现 08-30 线上溢出：LIVE 置顶最多 3 条，其余降级进普通行并计入 “N more”。",
    spec: [
      {
        state: "live 溢出",
        when: "live.length > LIVE_MAX(3)",
        visual: "置顶 3 条 LIVE + 降级行 + 底部 “N more this week →”",
        source: "HomeSportsCard budget = max(2, 5 - live) + extraRows",
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

/* ---------------- 并账清单（旧六节 → EV-case）---------------- */

const Ledger = () => (
  <div className="space-y-3">
    <Table
      title="并账清单 · 旧六节逐条去向（M1b 删除挂载，section 文件保留仓库）"
      head={["原文位置", "去向"]}
      rows={[
        ["LiteSection part=events · “Loading — 首载模块骨架”", "并入 EV-24 / EV-25 spec + note（触发规则、渐进点亮、色值、CLS 全文照搬）"],
        ["LiteSection part=events · “Category pill · Sports live pulse”", "并入 EV-2 / EV-3（筛选行 case，live pulse 判定 useSportsMatches().rows.some(m => m.live)）"],
        ["LiteSection part=events · “Markets list”（卡 + badge 矩阵 + sort 注记）", "并入 EV-11 … EV-18 与附注表 A/B/C/D"],
        ["LiteAllStageSection · Chip tiers / Category row / IntradayStageCard / SportsStageCard / Coin tile plot / Category view 7A·7B / Sports sub-nav 13A", "并入 EV-2 … EV-10；其中 7A/7B 与 sub-nav 13A 已被生产超越（Intraday 为独立 topic tab，Sports 子维度行随之改造），依据 memory lite-intraday-band 2026-08-28 注记与 lite-list-badges-and-sort 2026-08-28 注记，随节消亡"],
        ["LiteVerticalViewsSection · Crypto view / Finance view", "已被生产超越：category-as-view 装配层不再存在（topic tab + band 结构取代），依据同上两条 memory 注记，随节消亡；其内 Last8Strip / DirectionButton 规范保留在 EV-5 … EV-8"],
        ["LiteCalendarSection · Chrome & controls 入口 chips", "并入 EV-19 note（Watchlist / Calendar 右对齐、互斥、Calendar 非品类故激活填白）"],
        ["LiteCalendarSection · Closes soon badge", "并入 EV-16（近截止徽标，24h 内停止交易，仅灰描边不上色）"],
        ["LiteCalendarSection · desktop frames / mobile frames", "并入 EV-19（Week）+ EV-20（Day / 空日）；as-built 像素契约仍指向 docs/design-contracts/calendar-asbuilt-notes.md"],
        ["LiteFinalTouchesSection · Editor's picks", "已被生产超越：/ 列表页当前不渲染 Editor's picks 模块，随节消亡"],
        ["LiteFinalTouchesSection · Mobile events page (390)", "并入 EV-5 / EV-9 / EV-9e 的 mobile 帧（无活赛 → “Nothing playing now”；两 session 全关 → 日历文案行）"],
        ["LiteFinalTouchesSection · Mobile category row 控件簇", "并入 EV-2（右端固定 Watchlist 计数 chip 与 Calendar chip，不随滚动）"],
        ["LiteFinalTouchesSection · Boost · in-place filter", "并入 EV-4（Boost 为筛选非品类，就地过滤当前列表，不新增路由）"],
        ["EventArtSection · 美术方向规范", "原文移入 Foundations 组（EventArtSection 挂载点改到 Foundations），Events 页不再挂"],
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

export const EventsStatesSection = () => (
  <SectionWrapper
    id="events-states"
    title="Events 列表 · 状态字典（EV-1 … EV-35，含 EV-9e · 共 36 case）"
    description="分区①Hero 与筛选行 · ②Crypto/Stocks 卡 · ③Sports 卡 · ④卡片网格 · ⑤Calendar · ⑥Watchlist · ⑦加载与空态 · ⑧主页 stage 与目录带（HP-1 / ST-1）。每个 case 双帧（desktop 1280 / mobile 375），fixture 只注数据与状态，且一律确定性注入（禁止运行时 fetch）。"
  >
    <div className="space-y-12">
      <SubSection title="① Hero 与筛选行（EV-1 … EV-4）">
        <Pair cases={HEADER_CASES} desktopMin={420} mobileMin={480} />
      </SubSection>

      <SubSection title="② Crypto / Stocks 卡（EV-5 … EV-8 · HP-1 / ST-1）">
        <Pair cases={INTRADAY_CASES} desktopMin={760} mobileMin={860} />
      </SubSection>

      <SubSection title="③ Sports 卡（EV-9 / EV-9e / EV-10）">
        <Pair cases={SPORTS_CASES} desktopMin={620} mobileMin={720} />
      </SubSection>

      <SubSection title="④ 卡片网格（EV-11 … EV-18 · LiteEventCard FROZEN）">
        <Pair cases={CARD_CASES} desktopMin={900} mobileMin={1200} />
        <div className="mt-8">
          <Footnotes />
        </div>
      </SubSection>

      <SubSection title="⑤ Calendar 视图（EV-19 / EV-20）">
        <Pair cases={CALENDAR_CASES} desktopMin={860} mobileMin={900} />
      </SubSection>

      <SubSection title="⑥ Watchlist（EV-21 … EV-23）">
        <Pair cases={WATCHLIST_CASES} desktopMin={620} mobileMin={780} />
      </SubSection>

      <SubSection title="⑦ 加载骨架与空态（EV-24 … EV-26）">
        <Pair cases={LOADING_CASES} desktopMin={900} mobileMin={1000} />
      </SubSection>

      <SubSection title="⑧ 主页 stage 与目录带（EV-27 … EV-35 · HP-1 / ST-1）">
        <Pair cases={STAGE_CASES} desktopMin={760} mobileMin={900} />
      </SubSection>

      <div className="mt-8">
        <Ledger />
      </div>
    </div>
  </SectionWrapper>
);
