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
    label: "EV-1 · 页头 greeting（LiteEventsGreeting）",
    note: "静态开场，无数据依赖；生产由 LiteEventsPage 直接渲染同一组件。",
    spec: [
      {
        state: "静态",
        when: "恒真（无状态分支）",
        visual:
          "标题 “What do you think happens next?” + 副行 “Pick a topic. Tap Yes or No. That's it.”",
        source: "LiteEventsGreeting (src/components/lite/LiteEventsHeader.tsx)",
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
    label: "EV-5 · band 默认 · 三 coin tile（IntradayStageCard / MobileIntradayModule）",
    note:
      "fixture 确定性数据（BTC/ETH/SOL 三窗口全档快照）；倒计时为 fixture 起始值，不依赖运行时 fetch。LOCKED 容器：1px rgba(255,138,61,.18) / 3px #FF8A3D 左轨。",
    spec: [
      {
        state: "默认",
        when: "currentFor 有活轮 && stockRows 无开放 session",
        visual:
          "“INTRADAY · ROLLING ROUNDS / Will the price go up?” + BTC/ETH/SOL tile：AssetAvatar + 现价 + CLOSES 倒计时 + 每 tile 独立 dial [5m 15m 1h 4h 1D] + round open 虚线基线 + ±% + LAST 8 + Up/Down 分币 chips",
        source: "IntradayStageCard · useQuickRounds(true)",
      },
    ],
  },
  {
    key: "events-ev6",
    label: "EV-6 · tile · dial 选中非默认窗口（IntradayStageCard）",
    note: "dial 为 per-tile 状态；fixture 只注初始窗口 initialTf=\"1h\"，不传即生产默认 5m。",
    spec: [
      {
        state: "非默认窗口",
        when: 'tf === "1h"（fixture initialTf）',
        visual: "同一 tile 的时钟 / 价格 / 基线随窗口切换，dial 高亮移到 1h",
        source: "IntradayStageCard initialTf → MajorCoinCard tf state",
      },
    ],
  },
  {
    key: "events-ev7",
    label: "EV-7 · stocks 子带 · 有 session（IntradayStageCard）",
    note:
      "偏差说明：生产 band 的股票子带渲染的是「Stocks closing today」列表 + 该 session 的收盘倒计时；mock10 写的 US/HK session tabs 位于品类视图 LiteIntradayView，band 内不存在该控件，本 case 如实呈现生产形态。",
    spec: [
      {
        state: "有开放 session",
        when: "groupStockRows(stockRows, sessionNow).sessionMarket != null",
        visual:
          "币 tile 收窄为紧凑态 + “Stocks closing today” 行集，行 → /spot?event=…&side=…",
        source: "IntradayStageCard · groupStockRows",
      },
    ],
  },
  {
    key: "events-ev8",
    label: "EV-8 · stocks 子带 · 空 session（IntradayStageCard）",
    spec: [
      {
        state: "无活 session",
        when: "sessionOpen === false",
        visual:
          "底部两句：“Stocks return when the next session opens” + “Open Intraday →”",
        source: "IntradayStageCard footer",
      },
    ],
  },
];

/* ---------------- ③ Sports band ---------------- */

const SPORTS_CASES: SectionCase[] = [
  {
    key: "events-ev9",
    label: "EV-9 · Sports 默认（SportsStageCard / MobileSportsModule）",
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
    label: "EV-9e · Sports band · 空态（SportsStageCard / MobileSportsModule）",
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
    label: "EV-10 · day-rail 选中某日（SportsStageCard）",
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
    title="Events 列表 · 状态字典（EV-1 … EV-18，含 EV-9e）"
    description="分区①页头与筛选行 · ②Intraday band · ③Sports band · ④卡片网格。每个 case 双帧（desktop 1280 / mobile 375），fixture 只注数据与状态，且一律确定性注入（禁止运行时 fetch）。"
  >
    <div className="space-y-12">
      <SubSection title="① 页头与筛选行（EV-1 … EV-4）">
        <Pair cases={HEADER_CASES} desktopMin={420} mobileMin={480} />
      </SubSection>

      <SubSection title="② Intraday band（EV-5 … EV-8）">
        <Pair cases={INTRADAY_CASES} desktopMin={760} mobileMin={860} />
      </SubSection>

      <SubSection title="③ Sports band（EV-9 / EV-9e / EV-10）">
        <Pair cases={SPORTS_CASES} desktopMin={620} mobileMin={720} />
      </SubSection>

      <SubSection title="④ 卡片网格（EV-11 … EV-18 · LiteEventCard FROZEN）">
        <Pair cases={CARD_CASES} desktopMin={900} mobileMin={1200} />
        <div className="mt-8">
          <Footnotes />
        </div>
      </SubSection>
    </div>
  </SectionWrapper>
);
