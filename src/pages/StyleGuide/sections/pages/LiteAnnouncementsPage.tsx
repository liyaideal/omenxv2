/**
 * Announcements — /announcements + /announcements/:id as one dictionary node
 * (CPO 2026-10-13, Notifications v2 mock A1–A9). Every case mounts the
 * production views with display-only fixtures (preview/announcementsPreviews.tsx).
 * Truth Rule §16.1.1 — no hand-copied markup. Numbering: AN-1… ; `b` = same
 * state, other device.
 */
import { LitePage } from "./shell";
import { SectionWrapper, SubSection } from "../../components/SectionWrapper";
import { SectionFrame, type SectionCase } from "../../components/SectionFrame";

type P = { isMobile: boolean };

/* ---------------- Ⓐ list ---------------- */

const LIST_DESKTOP: SectionCase[] = [
  {
    key: "ann-list-desktop",
    label: "AN-1 · /announcements · desktop · 列表 + Load more",
    note: "公开内容页（游客可达，挂 SeoFooter）。入口两处：SeoFooter Resources『Announcements』、详情页右栏 See all；顶栏 / Me 菜单 / BottomNav 不加（登录用户走铃铛 Updates tab）。页头 = 内容页式标题 24/30 + 副题 14/20 muted，非 DSH。行 = kind icon 20（Megaphone primary / Wrench yellow）+ 标题 15/22 500 truncate + 摘要 13/18 muted ≤2 行 + 日期 mono 11『Oct 13, 2026』；每页 20。",
    spec: [
      { state: "ready", when: "rows.length > 0", visual: "行 `-mx-2 px-2 py-3.5 border-b border-border/60`，hover bg-muted/50；点行 → /announcements/:id", source: "AnnouncementRow size=lg" },
      { state: "load more", when: "hasNextPage", visual: "居中 outline 钮 `Load more`（rounded-[10px]）；isFetchingNextPage 时 disabled", source: "AnnouncementListView" },
      { state: "end", when: "!hasNextPage && rows ≥ 5", visual: "`That's everything` 12px muted/70；不足 5 行不显示底注", source: "AnnouncementListView" },
    ],
  },
  { key: "ann-list-desktop-end", label: "AN-2 · /announcements · desktop · 到底", spec: [{ state: "end", when: "!hasNextPage", visual: "`That's everything`", source: "—" }] },
  { key: "ann-list-desktop-empty", label: "AN-3 · /announcements · desktop · 空态", spec: [{ state: "empty", when: "rows.length === 0", visual: "EmptyState section · 彩绘猞猁 `empty-no-starred-event.png` · 'Nothing posted yet' / 'Product updates and maintenance notices will show up here.'", source: "AnnouncementEmpty" }] },
  { key: "ann-list-desktop-loading", label: "AN-4 · /announcements · desktop · 加载骨架", spec: [{ state: "loading", when: "isLoading", visual: "5 行骨架（圆 20 + 2/3 + 全宽 + 56px）", source: "AnnouncementListSkeleton" }] },
  { key: "ann-list-desktop-error", label: "AN-5 · /announcements · desktop · 出错", spec: [{ state: "error", when: "isError", visual: "ErrorState 'Couldn't load announcements' + Retry → refetch", source: "states/ErrorState" }] },
];

const LIST_MOBILE: SectionCase[] = [
  {
    key: "ann-list-mobile",
    label: "AN-1b · /announcements · mobile",
    note: "Variant B inner header（返回 + 'Announcements'）→ 行直接接页头分隔线（**移动不放副题**：页头就是标题，孤零零一行副题会被读成列表第一行——CPO 2026-10-14；同 /notifications 移动）→ 行同桌面（日期当年省年份『Oct 13』）→ 全宽 Load more 44h → SeoFooter。内容页不挂 BottomNav（同 /glossary）。",
    spec: [{ state: "date", when: "mobile && 当年", visual: "`Oct 13`；跨年 `Oct 13, 2025`", source: "annListDate(iso, compact)" }],
  },
  { key: "ann-list-mobile-empty", label: "AN-3b · /announcements · mobile · 空态", spec: [{ state: "empty", when: "rows.length === 0", visual: "彩绘猞猁空态", source: "AnnouncementEmpty" }] },
];

/* ---------------- Ⓑ detail ---------------- */

const DETAIL_DESKTOP: SectionCase[] = [
  {
    key: "ann-detail-desktop-maintenance",
    label: "AN-6 · /announcements/:id · desktop · maintenance · 窗口卡 + CTA + Back（从通知进入）",
    note: "12 栅格 8 + 4：左 = 文章，右 = More announcements（最近 3 条排除当前 + See all announcements →；0 条整栏隐藏，左栏不拉宽）。**桌面无面包屑 / 返回链**（DESIGN 桌面详情页规则 / PD-6）。文章：kind chip 22px + 发布时间 mono 12『Oct 13, 2026 · 15:02』→ 标题 font-display 24/30 700 → 导语 15/24 muted → 窗口卡（仅 maintenance）→ 正文（1px 分隔 + 22px）→ CTA 行。",
    spec: [
      { state: "window card", when: "kind=maintenance && window_starts_at", visual: "`rounded-[10px] border-trading-yellow/30 bg-trading-yellow/10` + TriangleAlert 20 yellow；第一行 `Window · {UTC 区间 mono} ({本地区间} your time)`，浏览器时区 = UTC 时省括号；第二行 `Affects: … · Not affected: …`（空项省略）", source: "WindowCard · annWindowUtc / annWindowLocal" },
      { state: "CTA", when: "cta_label && cta_href", visual: "主钮 btn-primary 40h + ArrowRight；外链 target=_blank；缺一不渲染", source: "AnnouncementArticle" },
      { state: "Back to Notifications", when: "user && location.state.from === 'notifications'", visual: "outline 钮，在主钮右侧；两钮都无 → 整行不渲染", source: "AnnouncementArticle · NotificationBell / NotificationsPage navigate(state)" },
      { state: "rail", when: "recent.length > 0", visual: "眉线 11/600 uppercase muted；行 icon 20 + 标题 14/20 truncate + 摘要 13/18 truncate + 日期 mono 11；底 `See all announcements →` 13/500 primary", source: "MoreAnnouncements · AnnouncementRow size=sm" },
    ],
  },
  { key: "ann-detail-desktop-announcement", label: "AN-7 · /announcements/:id · desktop · announcement · 仅 CTA（游客，无 Back）", spec: [{ state: "announcement", when: "kind=announcement", visual: "无窗口卡；chip primary", source: "KindChip" }] },
  {
    key: "ann-detail-desktop-campaign",
    label: "AN-8 · /announcements/:id · desktop · 公告直接开活动（图片 + 奖励表 + 有序列表 + 引用）",
    note: "CPO 2026-10-13 A6 修订：正文 Markdown 子集含图片与表格——运营可以不做落地页、发一条公告就开活动。",
    spec: [
      { state: "image", when: "`![alt](src)` 独占一行", visual: "figure：img `rounded-[10px] border border-border max-w-full`，alt 作 12px muted 图注；行内图片无图注", source: "MarkdownBody image" },
      { state: "table", when: "GFM `| a | b |` + 对齐行", visual: "`rounded-[10px] border` 外框 overflow-x-auto；th 11/600 uppercase muted bg-muted/30；td 14 tabular-nums，`---:` 右对齐", source: "MarkdownBody table" },
      { state: "safe", when: "任意正文", visual: "无 HTML 透传（`<script>` 按文本渲染）；链接只放行 http(s) / 站内 / mailto，其余降为 `#`", source: "markdownLite safeHref" },
    ],
  },
  { key: "ann-detail-desktop-unavailable", label: "AN-9 · /announcements/:id · desktop · 已撤回 / 不存在", spec: [{ state: "unavailable", when: "status=withdrawn ∨ id 不存在（RLS 只放 published）", visual: "EmptyState section · 彩绘猞猁 `empty-error.png` · 'This announcement is no longer available' + 胶囊钮 `All announcements` → /announcements；右栏隐藏", source: "AnnouncementUnavailable" }] },
  { key: "ann-detail-desktop-loading", label: "AN-10 · /announcements/:id · desktop · 加载骨架", spec: [{ state: "loading", when: "isLoading", visual: "chip 行 + 标题 + 导语 + 3 行正文骨架", source: "AnnouncementDetailView ArticleSkeleton" }] },
];

const DETAIL_MOBILE: SectionCase[] = [
  {
    key: "ann-detail-mobile-maintenance",
    label: "AN-6b · /announcements/:id · mobile · maintenance",
    note: "inner header 标题按 kind（'Maintenance' / 'Announcement'）→ px-4 py-5 单列：chip + 时间 → 标题 19/26 → 导语 14/22 → 窗口卡 → 正文 14/22 → CTA 全宽 44h 竖排（主钮在上）→ More announcements → SeoFooter。",
    spec: [{ state: "cta", when: "mobile", visual: "`flex-col gap-2.5`，两钮 `h-11 w-full`", source: "AnnouncementArticle mobile" }],
  },
  { key: "ann-detail-mobile-campaign", label: "AN-8b · /announcements/:id · mobile · 图片 + 表格", spec: [{ state: "table", when: "表宽 > 容器", visual: "外框横向滚动，页面不横滚", source: "MarkdownBody table overflow-x-auto" }] },
  { key: "ann-detail-mobile-unavailable", label: "AN-9b · /announcements/:id · mobile · 已撤回", spec: [{ state: "unavailable", when: "—", visual: "同桌面；header 标题回落 'Announcements'", source: "—" }] },
];

/* ---------------- Ⓒ parts ---------------- */

const PART_CASES: SectionCase[] = [
  { key: "ann-kind-chips", label: "AN-11 · kind chip 两种", spec: [{ state: "chip", when: "kind", visual: "`h-[22px] px-2 rounded-full text-[11px] 600 uppercase tracking-[0.04em] border` + 12px 同名 icon；Announcement = primary/35 边 + primary/8 底；Maintenance = trading-yellow 同配比。只此两色。", source: "ANNOUNCEMENT_KIND" }] },
  { key: "ann-window-card", label: "AN-12 · 窗口卡三变体（同日 / 跨日 / 只有开始）", spec: [{ state: "range", when: "window_ends_at", visual: "同日 `Oct 15, 02:00–04:00 UTC`；跨日 `Oct 15, 22:00 – Oct 16, 02:00 UTC`；无结束 `Oct 15, 02:00 UTC`", source: "annWindowUtc" }] },
  { key: "ann-markdown-sink", label: "AN-13 · Markdown 子集全枚举（h2 / h3 / p / 粗斜 / code / 链接 / ul / ol / 引用 / 表格 / hr / 图片 / HTML 转义）", spec: [{ state: "prose", when: "—", visual: "p 15/24 fg/86 mb-3.5；h2 font-display 18/24 600；h3 15/22 600 mt-[22px]；ul/ol ml-[18px] marker muted；a primary underline offset-3；code mono 13 bg-muted/60；quote border-l-2 muted；hr my-5", source: "MarkdownBody" }] },
];

export const LiteAnnouncementsPage = (_: P) => (
  <LitePage
    id="lite-announcements"
    title="Announcements"
    route="/announcements · /announcements/:id（公开内容页；入口 = SeoFooter Resources + 通知行 deep link）"
    status="done"
    note="本页 = 公告列表 + 公告阅读页的状态字典（CPO 2026-10-13 消息中心 v2 mock A1–A9；A6 修订：正文支持图片与表格）。样式与布局看生产页，状态与判定看本页。"
  >
    <div className="mb-6 space-y-1 rounded-lg border border-[#CFFF4A]/30 bg-[#CFFF4A]/5 px-3 py-2 text-[12px] text-foreground">
      <div>
        本页 = 生产 <code className="font-mono">/announcements</code> 两页的状态字典 · 样式与布局 → 生产页；状态与判定 → 本页；表里没有列出的组合视为不存在
      </div>
      <div>
        数据与发布（announcements 表、发布 = 广播、撤回、Lovable 阶段手工发）→ <code className="font-mono">docs/delivery/notifications-v2.md</code>；通知行 type（system.announcement / maintenance）→ Notifications 节 NT-20…NT-22
      </div>
    </div>

    <SectionWrapper
      id="announcements-cases"
      title="Announcements · 状态字典（AN-1…AN-13 · Ⓐ–Ⓒ 区）"
      platform="shared"
      description="Ⓐ列表（桌面 / 移动）· Ⓑ详情（桌面 / 移动，含图片表格 + 已撤回）· Ⓒ部件（kind chip / 窗口卡 / Markdown 全枚举）。每个 case 挂载生产视图（preview 夹具只定初态，禁运行时 fetch）。"
    >
      <div className="space-y-12">
        <SubSection title="Ⓐ /announcements 列表（AN-1 … AN-5）" platform="shared">
          <SectionFrame cases={LIST_DESKTOP} device="desktop" minHeight={560} />
          <div className="mt-3">
            <SectionFrame cases={LIST_MOBILE} device="mobile" minHeight={560} />
          </div>
        </SubSection>

        <SubSection title="Ⓑ /announcements/:id 详情（AN-6 … AN-10）" platform="shared">
          <SectionFrame cases={DETAIL_DESKTOP} device="desktop" minHeight={720} />
          <div className="mt-3">
            <SectionFrame cases={DETAIL_MOBILE} device="mobile" minHeight={720} />
          </div>
        </SubSection>

        <SubSection title="Ⓒ 部件（AN-11 … AN-13）" platform="shared">
          <SectionFrame cases={PART_CASES} device="desktop" minHeight={160} />
        </SubSection>
      </div>
    </SectionWrapper>
  </LitePage>
);
