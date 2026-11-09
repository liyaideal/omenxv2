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
    key: "events-ev2",
    label: "EV-2 · 筛选行 · All 默认（LiteEventsFilterRow / MobileCategoryRow）",
    spec: [
      {
        state: "All 默认",
        when: 'sector === "all"',
        visual:
          "左 = 品类胶囊 All…Social；右 = 视图开关 ⚡ Boost / ☆ Watchlist / ▦ Calendar（Boost 是筛选不是品类，H4 · 2026-11-09）",
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
// 首页 Crypto / Stocks 段 2026-11-09 改版后进「首页 All 视图」字典（HA-6 … HA-10）；旧 EV-5 … EV-8 并账删除。
const INTRADAY_CASES: SectionCase[] = [];

/* ---------------- ③ Sports band ---------------- */

const SPORTS_CASES: SectionCase[] = [
  {
    key: "events-ev9t",
    label: "EV-9t · 网球抢七比分串（LiteSportsView Playing now / MobileSportsModule）",
    note:
      "供应商 metadata.score 网球串形如 `5-7, 7-6(7-2), 6-6`，展示前必须经 tennisScore formatter，禁止原样渲染。抢七盘只在输方一侧上标（ATP/WTA 记法，赢方分可推导）；减号 U+2013。同一 formatter 也覆盖 SportsStageCard / HomeSportsCard / Calendar 行。",
    spec: [
      { state: "抢七盘已决", when: "sport === \"tennis\" && 该盘 7–6/6–7 且带括号点数", visual: "`5–7, 7–6², 2–1`——输方数字后上标输方点数；上标 = 主字号 ×0.5 / 600 / top −(主字号 ×0.35) / opacity .85", source: "TennisScoreText" },
      { state: "抢七进行中", when: "sport === \"tennis\" && 最后一盘 6–6", visual: "比分串写 `6–6`（点数不进列表），联赛行追加橙色 ` · Tiebreak`（#FF8A3D）", source: "isTennisTiebreakLive" },
      { state: "网球主字号", when: "sport === \"tennis\"", visual: "列表卡 32→26、舞台卡 24→20、移动卡 20→16；行内场景（Home / Calendar）不缩", source: "MatchScoreText tennisBase" },
      { state: "移动卡球员名", when: "MobileSportsModule Playing now", visual: "队徽 26、间距 6 / 8，`Prozorova` / `Costoulas` 完整显示不截断；多词长名放不下折两行，卡高保持 148（CPO 2026-11-04）", source: "MobileSportsModule LiveMatchCard" },
      { state: "非网球", when: "sport !== \"tennis\"", visual: "原样 `1 – 0`，零变化", source: "MatchScoreText" },
      { state: "解析失败", when: "parseTennisScore(score) === null", visual: "回退原串", source: "TennisScoreText" },
    ],
  },
  {
    key: "events-ev9t2",
    label: "EV-9t2 · 网球抢七进行中置顶（移动模块只置顶一场 live）",
    note: "同 EV-9t 数据，把最后一盘 6–6 的那场放到第一位——移动 MobileSportsModule 只渲染第一场 live，此帧专供看 `· Tiebreak` 联赛行与 16px 比分串。",
    spec: [
      { state: "抢七进行中置顶", when: "matches[0] 为 6–6 场", visual: "联赛行 `WTA · 3RD SET · TIEBREAK`（橙），比分串 `6²–7, 6–6`", source: "MobileSportsModule / LiteSportsView" },
    ],
  },
  {
    key: "events-ev9b",
    label: "EV-9b · 引擎原始值翻译：比分串 `0-1` → `0 – 1`、phase 枚举 → 人话",
    note:
      "Lovable 引擎往 metadata 写的是机器值：score = `0-1`（ASCII 连字符无空格）、phase = LIVE / BREAK / DECISION。列表面统一经 tennisScore.tsx 的 formatPlainScore / phaseLabel 翻译，禁止原样渲染——此前 Playing now 卡直出 `0-1` 与首页 `0 – 1` 两页两种写法、UFC 会出现 `UFC 321 · DECISION`。",
    spec: [
      { state: "比分串", when: "sport !== \"tennis\" && score 形如 `d-d` / `d–d` / `d:d`", visual: "`0 – 1`（U+2013 两侧空格）；解析不出回退原串；空值 `–`", source: "formatPlainScore" },
      { state: "phase = LIVE", when: "phase.toUpperCase() === \"LIVE\"", visual: "联赛行不追加任何词（LIVE 药丸已在）", source: "phaseLabel → null" },
      { state: "phase = BREAK", when: "phase === \"BREAK\"", visual: "`IEM Cologne · Break`", source: "phaseLabel" },
      { state: "phase = DECISION", when: "phase === \"DECISION\"", visual: "`UFC 321 · Decision`；格斗无比分串，中央位 `–`", source: "phaseLabel / formatPlainScore" },
      { state: "供应商人话", when: "其他字符串（`2nd half` / `3rd set`）", visual: "原样", source: "phaseLabel" },
    ],
  },
  {
    key: "events-ev9u",
    label: "EV-9u · 美式运动列表卡 live 位（NFL `Q3 8:42` / MLB `▼ 7th` / NHL `P2 12:07`）",
    note:
      "比赛分钟对有钟的运动没意义：列表卡 live 位改读 SportsMatch.liveLabel（sportsData.liveLabelFor 统一算出）——足球仍 `63'`，NFL / NBA / NHL 写 `节次 + 节钟`，棒球写 `半局箭头 + 局次`。子导航新增 Baseball / Hockey 组。",
    spec: [
      { state: "有钟运动", when: "spec.rightValue === \"clock\" && meta.clock != null", visual: "`Q3 8:42` / `P2 12:07`", source: "liveLabelFor" },
      { state: "棒球", when: "spec.rightValue === \"inning\" && meta.segment_index", visual: "`▼ 7th`（half 缺失则 `7th`）", source: "liveLabelFor" },
      { state: "足球 / 其他", when: "无 clock 形态", visual: "`63'`（不变）", source: "liveMinute" },
      { state: "比分串", when: "任意", visual: "`17 – 14` / `4 – 3`（formatPlainScore）", source: "MatchScoreText" },
      { state: "短名", when: "Winner 选项文案 ⊂ 全名 / 人名运动", visual: "`Chiefs` `Maple Leafs`；网球 `T. Prozorova`（见 EV-9t）；hover 出全名", source: "shortName → homeShort / awayShort" },
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
];

/* ---------------- 规则 9 · 版式几何契约（DESIGN.md §7.9）---------------- */

const GEO_HEAD = ["元素", "宽", "高", "定高?", "延伸方向与上限", "溢出处置"];

/** 页级「版式几何总表」——SG-HP 附录 F2 原表，数值 = 代码常量。 */
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

/* ---------------- 附注表 E / F / G（Stocks 分区尾）---------------- */

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


/* ---------------- ⑥b Sports 品类页 · 直播与直播预告（EV-36 … EV-46 · CPO 2026-11-04）---------------- */

const SRC_STREAMS = "DESIGN §Addendum 2026-11-04 · Sports 列表直播与预告";

const STREAM_CASES: SectionCase[] = [
  {
    key: "events-ev36",
    label: "EV-36 · 直播舞台 · 单路（LiveStreamStage / MobileLiveStreamStage）",
    note:
      "Sports 品类页顶部。页面优先级：Live on stream（本舞台）→ Coming up on stream（预告排）→ Playing now（正在打、没直播）→ 一般列表。只有一路直播时不出切换条。直播 = 正在打且 metadata.stream_url 非空；有没有直播源由数据决定，前端不判断联赛。",
    spec: [
      { state: "出现", when: "live.some(m => m.streamUrl)", visual: "区头 `● LIVE ON STREAM · n`（红点 LivePulse 6）+ 淡橙描边舞台；没有直播在播则整块不渲染", source: SRC_STREAMS },
      { state: "桌面布局", when: "useIsMobile() === false", visual: "左 58% 画面 16:9 = 直播截图（压暗）+ 橙色 64 播放钮 `Watch live`，不拉流（CPO 2026-11-09「点了才播」）；右栏：联赛 · 段名 / 时钟、队徽 48 + 比分 46、下注按钮、`$x traded` + `Open match →`", source: "LiteSportsView · LiveStreamStage · StreamPreview" },
      { state: "手机布局", when: "useIsMobile() === true", visual: "画面满宽在上（播放钮 48），下接联赛 / 时钟、队徽 34 + 比分 26、叠放下注按钮", source: "MobileSportsModule · MobileLiveStreamStage · StreamPreview" },
      { state: "画面", when: "始终", visual: "服务端每 10 分钟截一帧、同一时段所有人同一张（metadata.stream_thumb_url）；Lovable 没有截图服务，用演示直播的静帧按 10 分钟格轮换。左上橙底 `● LIVE`；比赛时钟只在记分牌出现一次", source: "streamPicture.ts" },
      { state: "点播放", when: "点画面任意处", visual: "已登录 → /trade?event=&play=1，交易页静音开播；游客 → 站内登录框（桌面弹窗 / 手机抽屉），登录成功后直接进该场交易页开播；关掉登录框留在原页", source: "usePlayStream · AuthPromptHost" },
      { state: "点其他地方", when: "Open match / 下注按钮", visual: "Open match → /trade?event=；下注按钮 → /trade?event=&option=（不弹登录、不开播）", source: "LiteSportsView open / pick" },
      { state: "不再单列", when: "isOnStream(m)", visual: "在舞台上的比赛不进下方 Playing now 卡片", source: "useStreamLineup streamed / others" },
      { state: "开赛那一秒", when: "liveAt(m, now) 每秒重算", visual: "比赛开赛即离开预告排、同一秒进舞台（舞台已有直播时进切换条）；时钟 / 比分在随后一次自动刷新补上，之前时钟位写 `LIVE`", source: "sportsData liveAt · useSportsMatches" },
      { state: "手机顶部芯片", when: "isMobile && filters", visual: "一段一枚、数字与区头一致：`● 1 on stream` `● 1 playing now` `3 this week`；某段为 0 不出那一枚，都为 0 写 `Nothing playing now`", source: "MobileSportsModule chips · useStreamLineup" },
      { state: "桌面列表今天日期头", when: "今天有正在打的比赛", visual: "`1 on stream · 1 playing now · 1 to come`：on stream = 舞台场数、playing now = Playing now 场数；没有直播时照旧 `n playing now · n to come`", source: "buildDayGroups isOnStream" },
    ],
  },
  {
    key: "events-ev37",
    label: "EV-37 · 直播舞台 · 多路 + 全页优先级（4 路直播 + 预告 + 其他正在打）",
    note: "一屏只放一路视频，其余直播进舞台底部切换条（手机在视频下方，横滑）。同一帧同时展示整页四段的上下顺序。",
    spec: [
      { state: "默认放哪一路", when: "streamed 按 volume（累计成交额）降序，相同按开赛早者优先", visual: "成交额最高的一场（本帧 Arsenal vs Real Madrid $4.2M）；选中后不跟着成交额变化", source: "streamLineup byStageOrder" },
      { state: "切换条", when: "streamed.length > 1", visual: "`LIVE STREAMS · n` + 每路一枚标签 `▶ ARS 1 – 0 RMA 63'`；当前一路淡橙底描边、其余灰描边", source: SRC_STREAMS },
      { state: "全页顺序", when: "同时存在", visual: "Live on stream → Coming up on stream → Playing now → day strip + 列表", source: SRC_STREAMS },
    ],
  },
  {
    key: "events-ev37b",
    label: "EV-37b · 直播舞台 · 切到另一路（点击切换条第三枚 T1 vs Gen.G）",
    note: "挂载后点击生产切换标签 `[data-stream-tab]`。视频与记分牌一起换；不同时开两路视频（同一个 <video> 换源）。",
    spec: [
      { state: "切换后", when: "activeId = 点中的标签", visual: "记分牌换成 `LCK` · `Game 2` · `1 – 0`，下注按钮两枚；被点标签变当前态", source: "LiveStreamStage setActiveId" },
    ],
  },
  {
    key: "events-ev38",
    label: "EV-38 · 直播舞台 · 还没有截图 → 赛事封面兜底（StreamPreview fixture=cover）",
    spec: [
      { state: "没有截图", when: "!thumbnailUrl（直播刚开 / 截图失败）&& coverUrl", visual: "画面位放这场赛事的封面图（events.image_url）压暗 + 播放钮；本帧用 Sports 品类底图示意", source: "streamPicture.ts" },
    ],
  },
  {
    key: "events-ev39",
    label: "EV-39 · 直播舞台 · 封面也没有 → 深色底 + 播放钮（StreamPreview fixture=none）",
    spec: [
      { state: "没截图也没封面", when: "!thumbnailUrl && !coverUrl", visual: "深色径向底 + `● LIVE` + 橙色播放钮 `Watch live`，不放队徽（右栏 / 下方记分牌已有两队）", source: "streamPicture.ts" },
    ],
  },
  {
    key: "events-ev47",
    label: "EV-47 · 队徽四种画法（Crest · 队徽从 omenx.com 同步 · CPO 2026-11-09）",
    note:
      "Sports 品类页、手机 Sports 模块、直播预告、舞台卡的队徽都是 Crest；首页 All 视图的同一规则在 TeamBadge（HA 字典 S1）。队徽地址来自主网同步的 metadata.home_logo / away_logo；美国四大联赛（NBA / NFL / NHL / MLB）的「队徽」其实是印着队名缩写的纯色方块，同步时取出方块颜色写进 metadata.home_tile / away_tile。",
    spec: [
      { state: "色块队徽", when: "home_tile / away_tile 有值", visual: "圆形底色 = 方块颜色，白字缩写（字号同代码徽）；不放那张方块图（本帧 CLE / CHA）", source: "Crest tileColor · mn_logo_tiles" },
      { state: "真队徽", when: "home_logo 有值且没有 tile", visual: "深色圆底 #1B2130，队徽图 contain 74% 居中（本帧 Rayo / Athletic；国家队旗方图同样 74% 居中：CZE / ESP）", source: "Crest logoUrl" },
      { state: "没有队徽", when: "home_logo 为空", visual: "原来的代码徽：浅底黑字缩写（本帧 NYR / EDM，以及演示直播样板赛）", source: "Crest abbr" },
      { state: "队徽加载失败", when: "图片 onError", visual: "退回代码徽（本帧 IND / DAL 指向不存在的图）", source: "Crest img onError" },
      { state: "叠放 / 弱化", when: "overlap / muted", visual: "叠放照旧 -10（舞台卡 -9）；muted 的图形徽整体 72% 不透明度", source: "Crest overlap / muted" },
    ],
  },
  {
    key: "events-ev40",
    label: "EV-40 · 预告排 · 1 场（横版宽卡铺满）",
    note: "预告 = 有直播、未开赛、48 小时内开赛（upcomingStreams）。不管有没有直播在播，预告都只用这排卡片，没有预告大卡。",
    spec: [
      { state: "出现", when: "upcomingStreams(scoped, now).length > 0", visual: "区头 `▶ COMING UP ON STREAM · n` + `Next 48 hours`", source: "UpcomingStreams · PREVIEW_WINDOW_MS" },
      { state: "1 场", when: "rail.length === 1", visual: "横版宽卡铺满整行：左 42%（≤360）海报，右侧联赛 · 开赛时间、比赛名、下注按钮、Remind me", source: "LiteSportsView PreviewCardWide" },
      { state: "手机 1 场", when: "isMobile && rail.length === 1", visual: "竖版卡铺满整行（不露下一张）", source: "MobileSportsModule rail" },
      { state: "海报", when: "始终", visual: "左上描边 `▶ STREAM`；两队队徽 40 对阵 `VS`；`STREAM STARTS IN` + 倒计时 22px", source: "StreamPoster" },
    ],
  },
  {
    key: "events-ev41",
    label: "EV-41 · 预告排 · 2 场（横版宽卡各占一半）",
    spec: [
      { state: "2 场", when: "rail.length === 2", visual: "两张横版宽卡各占半行；卡内开赛时间写短格式 `Today 16:00`（不截断）", source: "PreviewRail gridAutoColumns · kickoffShort" },
      { state: "手机 2 场", when: "isMobile && rail.length ≥ 2", visual: "竖版卡占内容区宽的 78% 横滑，露出下一张的边", source: "MobileSportsModule rail" },
    ],
  },
  {
    key: "events-ev42",
    label: "EV-42 · 预告排 · 3 场及以上（竖版卡 + 翻页箭头）+ 倒计时三种写法",
    note: "本帧 5 场有直播的未开赛比赛：4 场在 48 小时内进预告排，NAVI vs FaZe 在 60 小时后，只在下面列表里带 `Stream at kickoff`。预告不设上限。",
    spec: [
      { state: "3+ 场", when: "rail.length ≥ 3", visual: "竖版卡一屏 3 张，超出横滑；右上 ‹ › 箭头只在可滚时出现，到头那枚变灰", source: "PreviewRail" },
      { state: "排序", when: "始终", visual: "按开赛时间从近到远；同时开赛的成交额高者在前", source: "upcomingStreams sort" },
      { state: "< 1 小时", when: "kickoff − now < 1h", visual: "`37:53` 按秒跳，橙色", source: "streamCountdown soon" },
      { state: "1–24 小时", when: "1h ≤ kickoff − now < 24h", visual: "`5h 20m`，白色", source: "streamCountdown" },
      { state: "≥ 24 小时", when: "kickoff − now ≥ 24h", visual: "lead 改 `STREAM STARTS`，值写开赛时间 `Tomorrow 13:20` / `Wed 22:20`", source: "streamCountdown" },
      { state: "> 48 小时", when: "kickoff − now > 48h && streamUrl", visual: "不进预告排；列表行带描边 `▶ Stream at kickoff`", source: "upcomingStreams · StreamAtKickoffChip" },
      { state: "卡片按钮名", when: "始终", visual: "按位置取（option id 字典序）：第一个 = 主队缩写，最后一个 = 客队缩写，中间沿用选项原文（足球为 `Draw`）", source: "chipLabel" },
      { state: "列表不动", when: "始终", visual: "预告里的比赛照旧出现在下面列表（预告是挑出来重点展示，不是搬走）", source: SRC_STREAMS },
      { state: "手机列表长比赛名", when: "isMobile && 比赛名一行放不下", visual: "未开赛卡标题折成两行（`Barcelona vs Paris / Saint-Germain`），不用省略号；放得下的卡高度不变", source: "MobileSportsModule UpcomingMatchCard line-clamp-2" },
    ],
  },
  {
    key: "events-ev43",
    label: "EV-43 · Remind me · 已设提醒（RemindButton on）",
    note: "本帧 Barcelona vs PSG 与 Man United vs Tottenham 已设提醒（fixture，不碰库）。生产读 stream_reminders（本人行）；开赛时 notify_stream_reminders() 把提醒变成一条 `system.stream_live` 通知（消息中心 Updates，见 NT-22）。再点一次取消。",
    spec: [
      { state: "未设", when: "!reminders.has(id)", visual: "灰描边 `🔔 Remind me`，白字", source: "RemindButton" },
      { state: "已设", when: "reminders.has(id)", visual: "淡橙底 + 橙描边 `✓ Reminder set`，橙字；按钮高 34、撑满整行", source: "RemindButton · useStreamReminders" },
      { state: "写入", when: "点击", visual: "重复设置不报错（读取未完成时连点、多端同时设）；服务端只收有直播、未开赛、48 小时内开赛的比赛", source: "useStreamReminders upsert · RLS stream_reminders_insert_own" },
      { state: "到点", when: "kickoff ≤ now（30 分钟内）", visual: "通知 `{event} stream is live`，Tv 图标 primary，点开进 /trade?event=", source: "notify_stream_reminders · NOTIFICATION_TYPES system.stream_live" },
    ],
  },
  {
    key: "events-ev44",
    label: "EV-44 · 没有直播在播 · 只有预告（预告排在最上）",
    spec: [
      { state: "无直播在播", when: "streamed.length === 0 && rail.length > 0", visual: "页面顶部直接是预告排（与有直播时同一排卡片），下接 Playing now 与列表；不出现直播舞台", source: SRC_STREAMS },
    ],
  },
  {
    key: "events-ev45",
    label: "EV-45 · Remind me · 未登录点击 → 登录（AuthDialog / AuthSheet）",
    note: "挂载后点击第一枚 Remind me（`[data-remind]`，访客 fixture）。走全站公共登录开关 openPrompt()（自选星标同一条路）：桌面打开 AuthDialog，手机打开底部抽屉 AuthSheet，都是站内现有登录框原样；不在本地存任何提醒。",
    spec: [
      { state: "访客点击", when: "!user", visual: "站内标准登录框，不改文字：桌面 AuthDialog / 手机 AuthSheet；提醒不保存，登录后需再点一次", source: "useAuthFlowStore.openPrompt() → AuthPromptHost" },
    ],
  },
];

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
  ...STREAM_CASES,
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
    title="Events 列表 · 状态字典（EV-2 … EV-45；首页 All 视图五段见「首页 All 视图」字典 HA-1 … HA-14）"
    description="分区序 = 生产模块序：①行情 tape · ③筛选行 · ⑥b Sports 品类页直播与预告 · ⑥c 品类页比分与 live 位 · ⑧卡片网格 · ⑨Calendar · ⑩Watchlist · ⑪骨架与空态（Hero / Sports / Crypto / Stocks / Editor's Desk / More 五段 2026-11-09 起在「首页 All 视图」字典）。每个 case 双帧（desktop 1280 / mobile 375），fixture 只注数据与状态，且一律确定性注入（禁止运行时 fetch）。"
  >
    <div className="space-y-12">
      <SubSection title="① 行情 tape（EV-33）">
        <Pair cases={byKey("events-ev33")} desktopMin={320} mobileMin={320} />
        <div className="mt-6">
          <TapeGeometry />
        </div>
      </SubSection>

      <SubSection title="③ 筛选行（EV-2 … EV-4）">
        <Pair
          cases={byKey("events-ev2", "events-ev3", "events-ev4")}
          desktopMin={420}
          mobileMin={480}
        />
      </SubSection>

      <SubSection title="⑥b Sports 品类页 · 直播与直播预告（EV-36 … EV-46）">
        <Pair
          cases={byKey("events-ev36", "events-ev37", "events-ev37b", "events-ev38", "events-ev39")}
          desktopMin={1200}
          mobileMin={1400}
        />
        <div className="mt-6">
          <Pair
            cases={byKey("events-ev40", "events-ev41", "events-ev42", "events-ev43", "events-ev44")}
            desktopMin={1200}
            mobileMin={1400}
          />
        </div>
        <div className="mt-6">
          <Pair cases={byKey("events-ev47")} desktopMin={900} mobileMin={1100} />
        </div>
        {/* EV-45 opens a fixed sign-in layer — its own frame so it can't cover the cases above. */}
        <div className="mt-6">
          <Pair cases={byKey("events-ev45")} desktopMin={800} mobileMin={812} />
        </div>
      </SubSection>

      <SubSection title="⑥c Sports 品类页 · 比分与 live 位（EV-9t / EV-9t2 / EV-9b / EV-9u）">
        <Pair cases={byKey("events-ev9t", "events-ev9t2", "events-ev9b", "events-ev9u")} desktopMin={620} mobileMin={720} />
      </SubSection>

      <SubSection title="⑧ 卡片网格（EV-11 … EV-18 · LiteEventCard FROZEN · Watchlist / Boost / 品类目录用；All 视图的长期事件在首页字典 HA-13）">
        <Pair
          cases={byKey(
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
