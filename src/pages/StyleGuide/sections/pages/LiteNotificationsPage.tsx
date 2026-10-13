/**
 * Notifications — /notifications + the bell / popover / entries as one
 * dictionary node (CPO 2026-10-13, mock v1 M1–M8). Every case mounts the
 * production component with display-only fixtures
 * (preview/notificationsPreviews.tsx). Truth Rule §16.1.1 — no hand-copied
 * markup. Numbering: NT-1… ; `b` = same state, other device.
 * Replaces the 2026-08-25 "Message Center (Backlog)" placeholder.
 */
import { LitePage } from "./shell";
import { SectionWrapper, SubSection } from "../../components/SectionWrapper";
import { SectionFrame, type SectionCase } from "../../components/SectionFrame";

type P = { isMobile: boolean };

/* ---------------- Ⓐ bell + badge ---------------- */

const BELL_CASES: SectionCase[] = [
  {
    key: "notif-bell-states",
    label: "NT-1 · 铃铛 · 角标三态 + 移动缩版",
    note: "桌面右簇顺序 = Equity → 🔔 → 头像 → (交易页 Lite/Pro)，登录态才渲染；游客右簇不变（🌐 EN → Sign In）。登录态的语言 chip 退役，语言收进头像菜单 `Language · EN ▸`（子菜单 = LanguageMenuItems）。登录态 header 本体需登录，看生产 alex_carter。",
    spec: [
      { state: "0 unread", when: "badge === 0", visual: "无角标；Bell 20 / 1.5 / muted；hover bg-muted/50 + 白", source: "NotificationBell.tsx · useNotificationCounts().badge" },
      { state: "1–99", when: "1 ≤ badge ≤ 99", visual: "右上 `min-w-[16px] h-4 px-1 rounded-full bg-primary font-mono text-[10px] 600` 数字", source: "BellBadge size=desktop" },
      { state: "99+", when: "badge ≥ 100", visual: "角标文字 `99+`", source: "badgeText()" },
      { state: "mobile", when: "variant=mobile", visual: "MobileHeaderIconButton 36 内同款铃铛，角标缩 14px / 9px；点击 → /notifications", source: "BellBadge size=mobile" },
      { state: "计数口径", when: "unread rows", visual: "badge = Trading + Account 未读 − `trade.*`（Buy / Cash out 不计，行保留未读样式）", source: "lib/notifications countsAsUnread()" },
    ],
  },
];

/* ---------------- Ⓑ popover ---------------- */

const POPOVER_CASES: SectionCase[] = [
  {
    key: "notif-popover-trading",
    label: "NT-2 · Popover · Trading tab · 混合未读",
    note: "点铃铛 → Popover align=end 400 × ≤560（纯信息无确认钮 → Popover 不用 Dialog）。头 `Notifications` 14/600 + 右 `Mark all read`（0 未读隐藏）；局部 tab 13.5px `Trading · Account`，有未读的 tab 右上 4px 圆点；按日分组 TODAY / YESTERDAY / OCT 10；最近 20 条；底 `See all` → /notifications。打开不改已读；点行 = 已读 + 跳 deep link + 关闭。",
    spec: [
      { state: "open", when: "bell click", visual: "默认落第一个有未读的 tab，全读落 Trading", source: "defaultTab(byTab)" },
      { state: "row click", when: "onOpen(row)", visual: "mark_notifications_read([id]) 乐观更新 → navigate(deep_link) → 关闭；无 deep_link 只标已读", source: "NotificationBell openRow" },
      { state: "Mark all read", when: "hasAnyUnread（含 trade.*）", visual: "文字钮 text-xs primary；点击全部变已读、角标归零、tab 圆点消失", source: "mark_notifications_read(null)" },
      { state: "See all", when: "state=ready && 本 tab 有行", visual: "底栏 13/500 primary，border-t #1D2026", source: "NotificationsPanel" },
    ],
  },
  { key: "notif-popover-account", label: "NT-3 · Popover · Account tab", spec: [{ state: "account", when: "tab=account", visual: "同壳；Funds / Rewards / Account 行", source: "tabOf(category)" }] },
  { key: "notif-popover-allread", label: "NT-4 · Popover · 全部已读（Mark all read 隐藏）", spec: [{ state: "all read", when: "!hasAnyUnread", visual: "头右槽空；tab 无圆点；行全部 muted", source: "NotificationsPanel" }] },
  { key: "notif-popover-empty", label: "NT-5 · Popover · 单 tab 空态（Trading 有未读）", spec: [{ state: "empty tab", when: "visible.length === 0", visual: "EmptyState section · 品牌猞猁插画 `empty-no-boost.png`（Account）/ `empty-celebrate.png`（Trading）· 'Nothing here yet' / 'Deposits, withdrawals, rewards and security alerts land here.'；无 See all", source: "NotificationEmpty · NOTIFICATION_EMPTY_ART" }] },
  { key: "notif-popover-empty-trading", label: "NT-5b · Popover · Trading 空态（全清 · empty-celebrate）", spec: [{ state: "empty trading", when: "tab=trading && visible.length === 0", visual: "品牌猞猁「撒彩纸」款 `empty-celebrate.png` · 'You're all caught up' / 'Results, auto-close alerts and trade confirmations land here.'", source: "NOTIFICATION_EMPTY_ART.trading" }] },
  { key: "notif-popover-loading", label: "NT-6 · Popover · 加载骨架", spec: [{ state: "loading", when: "query.isLoading", visual: "5 行骨架（圆 20 + 62% / 40% + 34px）；头右槽空", source: "NotificationSkeleton" }] },
  { key: "notif-popover-error", label: "NT-7 · Popover · 出错", spec: [{ state: "error", when: "query.isError", visual: "ErrorState 'Couldn't load notifications' / 'Check your connection and try again.' / 'Retry' → refetch", source: "states/ErrorState" }] },
  { key: "notif-panel-bare", label: "NT-8 · Popover 本体（无 portal，量宽用）", spec: [{ state: "bare", when: "—", visual: "w-[400px] max-w-[calc(100vw-24px)]；列表 max-h-[460px] overflow-y-auto", source: "NotificationsPanel" }] },
  {
    key: "notif-popover-updates",
    label: "NT-20 · Popover · Updates tab（v2）· 3 未读",
    note: "第三枚 tab = `system` category：公告 / 维护 / 活动上线 / 活动将结束 / 关注赛事开盘（CPO 2026-10-13 V1–V5）。全部计角标（V2）。默认 tab = 第一个有未读的（Trading → Account → Updates）。公告 / 维护行标题正文 = 公告的 title / summary 原样，不走模板。",
    spec: [
      { state: "icon 色", when: "type", visual: "announcement Megaphone / campaign_live Gift / watchlist_live Star = primary；maintenance Wrench / campaign_ending Hourglass = trading-yellow；不碰 green / red", source: "NOTIFICATION_TYPES system.*" },
      { state: "deep link", when: "row click", visual: "公告 → /announcements/:id（带 state.from=notifications → 详情页出 Back 钮）；活动 → /rewards/campaign/:id；关注 → /trade?event=", source: "notify() deep_link" },
    ],
  },
  { key: "notif-popover-updates-empty", label: "NT-20b · Popover · Updates 空态", spec: [{ state: "empty updates", when: "tab=updates && visible.length === 0", visual: "彩绘猞猁 `empty-no-starred-event.png` · 'Nothing new' / 'Campaign news and announcements land here.'", source: "NOTIFICATION_EMPTY_ART.updates" }] },
];

/* ---------------- Ⓒ page ---------------- */

const PAGE_DESKTOP: SectionCase[] = [
  {
    key: "notif-page-desktop-trading",
    label: "NT-9 · /notifications · desktop · Trading",
    note: "DSH v1 子页头（返回方钮 + 'Notifications' 17/600 + 右槽 Mark all read）→ 开场级 tab（font-display 24/30，选中 #F2F3F5 700，2.5px 白下划线）→ 列表（px-6 py-3 行）；无限滚动每页 30，服务端只留 90 天。游客 = LiteAuthGate 'Sign in to see your notifications'。",
    spec: [
      { state: "tab", when: "?tab= | 首个有未读 tab | Trading", visual: "切 tab 写 ?tab=（replace）", source: "NotificationsPage" },
      { state: "end", when: "!hasNextPage", visual: "列表底 mono 11 'That's everything from the last 90 days'", source: "NotificationsPage footer" },
      { state: "loading more", when: "isFetchingNextPage", visual: "'Loading more…'", source: "IntersectionObserver sentinel" },
    ],
  },
  { key: "notif-page-desktop-account", label: "NT-10 · /notifications · desktop · Account", spec: [{ state: "account", when: "tab=account", visual: "同壳", source: "—" }] },
  { key: "notif-page-desktop-updates", label: "NT-21 · /notifications · desktop · Updates（三枚开场级 tab）", spec: [{ state: "updates", when: "?tab=updates", visual: "第三枚 tab 同规格；`?tab=updates` 可直达", source: "NOTIFICATION_TABS" }] },
  { key: "notif-page-desktop-empty", label: "NT-11 · /notifications · desktop · 空态", spec: [{ state: "empty", when: "visible.length === 0", visual: "EmptyState section · 品牌猞猁插画（Account = `empty-no-boost.png`，Trading = `empty-celebrate.png` 全清）· 'Nothing here yet'；DSH 右槽无 Mark all read", source: "NotificationEmpty · NOTIFICATION_EMPTY_ART" }] },
];

const PAGE_MOBILE: SectionCase[] = [
  {
    key: "notif-page-mobile-trading",
    label: "NT-9b · /notifications · mobile · Trading",
    note: "Variant B inner header（返回 + 'Notifications' + 右槽 CheckCheck = Mark all read，0 未读不渲染）→ 开场级 tab 19/26 sticky 贴页头 → 列表（px-4 py-2.5 行）→ BottomNav；移动端不做 Popover。",
    spec: [
      { state: "mark all", when: "hasAnyUnread", visual: "右槽 MobileHeaderIconButton CheckCheck 20/1.5", source: "NotificationsPage mobile" },
      { state: "sticky tabs", when: "scroll", visual: "`sticky top-[var(--mobile-header-h)] z-30 bg-background`", source: "NotificationTabs sticky" },
    ],
  },
  { key: "notif-page-mobile-account", label: "NT-10b · /notifications · mobile · Account", spec: [{ state: "account", when: "tab=account", visual: "同壳", source: "—" }] },
  { key: "notif-page-mobile-updates", label: "NT-21b · /notifications · mobile · Updates（三枚 19/26 在 375 放得下，gap 28）", spec: [{ state: "updates", when: "tab=updates", visual: "sticky tab 同壳", source: "—" }] },
  { key: "notif-page-mobile-empty", label: "NT-11b · /notifications · mobile · 空态 · 全读（无 CheckCheck）", spec: [{ state: "empty", when: "visible.length === 0 && !hasAnyUnread", visual: "品牌猞猁插画空态；右槽空", source: "—" }] },
  { key: "notif-page-mobile-empty-trading", label: "NT-11c · /notifications · mobile · Trading 空态（全清）", spec: [{ state: "empty trading", when: "tab=trading && visible.length === 0", visual: "`empty-celebrate.png` + 'You're all caught up'", source: "NOTIFICATION_EMPTY_ART.trading" }] },
  { key: "notif-page-mobile-loading", label: "NT-12b · /notifications · mobile · 加载骨架", spec: [{ state: "loading", when: "isLoading", visual: "5 行骨架", source: "NotificationSkeleton" }] },
  { key: "notif-page-mobile-error", label: "NT-13b · /notifications · mobile · 出错", spec: [{ state: "error", when: "isError", visual: "ErrorState + Retry", source: "—" }] },
];

/* ---------------- Ⓓ mobile entries ---------------- */

const MOBILE_ENTRIES: SectionCase[] = [
  {
    key: "notif-mobile-brandbar",
    label: "NT-14 · 入口 · 移动品牌栏 [🔔][🌐]",
    note: "brand bar 默认右槽：登录 = [🔔][🌐]，游客 = [🌐]（右槽契约 ≤2 icon button）。inner 页不放铃铛。页面自带 rightContent 时由页面自己组合。",
    spec: [{ state: "signed in", when: "user", visual: "两个 MobileHeaderIconButton，wrapper `flex items-center gap-1 -mr-2`；铃铛角标 14px", source: "MobileHeader renderRight" }],
  },
  {
    key: "notif-mobile-menu-row",
    label: "NT-15 · 入口 · Me 菜单 Notifications 行（Rewards 之后）",
    spec: [{ state: "row", when: "始终（登录态菜单）", visual: "Bell icon + 'Notifications' + 右值未读计数胶囊（0 隐藏）→ /notifications", source: "BottomNav · UnreadCountPill" }],
  },
];

/* ---------------- Ⓔ rows + 35 types ---------------- */

const ROW_CASES: SectionCase[] = [
  {
    key: "notif-row-states",
    label: "NT-16 · 行 · 未读 vs 已读",
    note: "结构 [6px 点][lucide 20][标题 14/500 单行截断 + 正文 13 muted ≤2 行][时间 mono 11]。未读：点 + 标题白 + icon 语义色；已读：点隐、标题 #9AA1AC、icon #5C636D。时间 notifTime()：今天 HH:mm / Yesterday HH:mm / Oct 3 / Oct 3, 2025（本地 24h，无时区）。",
    spec: [
      { state: "unread", when: "read_at IS NULL", visual: "dot bg-primary；title text-foreground；icon TONE_CLASS[tone]", source: "NotificationRow" },
      { state: "read", when: "read_at", visual: "dot transparent；title muted；icon #5C636D", source: "NotificationRow" },
      { state: "icon 色轴", when: "type", visual: "盈 / 入账 volt；亏 / 出账 muted；失败 / auto-close done / 安全类 red；tight yellow；Rewards primary（DESIGN §7 作用域扩到通知 icon）", source: "lib/notifications NOTIFICATION_TYPES" },
    ],
  },
  { key: "notif-row-unknown", label: "NT-17 · 行 · 未知 type（default 分支）", spec: [{ state: "unknown", when: "type ∉ NOTIFICATION_TYPES", visual: "Bell muted + 原样 type 作标题、无正文；不进任何语义色、不计角标口径之外", source: "notificationMeta() DEFAULT_META" }] },
  { key: "notif-types-trading", label: "NT-18 · Trading 全 type（9）· 未读 · 最长变体", spec: [{ state: "all", when: "—", visual: "settled.win / loss / flat / round_batch · autoclose.tight / soon / done · trade.bought / cashed_out", source: "copy-dictionary「Notifications」" }] },
  { key: "notif-types-account", label: "NT-19 · Account 全 type（26）· 未读 · 最长变体（标题单行 ellipsis 为设计；sg-overflow-scan 已排除 text-overflow: ellipsis）", spec: [{ state: "all", when: "—", visual: "funds ×7 · reward ×11 · account ×8", source: "copy-dictionary「Notifications」" }] },
  { key: "notif-types-updates", label: "NT-22 · Updates 全 type（5 · v2）· 未读", spec: [{ state: "all", when: "—", visual: "system.watchlist_live / maintenance / announcement / campaign_ending / campaign_live；campaign_live 无 ends_at 时正文不带 `· ends …` 尾巴", source: "copy-dictionary「Notifications」· notificationVars()" }] },
];

export const LiteNotificationsPage = (_: P) => (
  <LitePage
    id="lite-notifications"
    title="Notifications"
    route="/notifications（+ 顶栏铃铛 / 品牌栏铃铛 / Me 菜单行）"
    status="done"
    note="本页 = 消息中心（Notifications）的状态字典（CPO 2026-10-13 方案 v0 + mock v1）· 样式与布局看生产页，状态与判定看本页。取代 2026-08-25 的 Message Center（Backlog）占位节。"
  >
    <div className="mb-6 space-y-1 rounded-lg border border-[#CFFF4A]/30 bg-[#CFFF4A]/5 px-3 py-2 text-[12px] text-foreground">
      <div>
        本页 = 生产 <code className="font-mono">/notifications</code> + 铃铛入口的状态字典 · 样式与布局 → 生产页；状态与判定 → 本页；表里没有列出的组合视为不存在
      </div>
      <div>
        40 个 type（35 v1 + 5 v2 Updates）的标题 / 正文 / 触发 / 深链 / 计角标 → <code className="font-mono">docs/copy-dictionary.md</code>「Notifications」；数据与投递 → <code className="font-mono">docs/delivery/notifications-v1.md</code>
      </div>
    </div>

    <SectionWrapper
      id="notifications-cases"
      title="Notifications · 状态字典（NT-1…NT-22 · Ⓐ–Ⓔ 区）"
      platform="shared"
      description="Ⓐ铃铛与角标 · ⒷPopover 六态 · Ⓒ全页（桌面 / 移动）· Ⓓ移动入口 · Ⓔ行组件 + 40 type 全枚举（含 v2 Updates 5 个）。每个 case 挂载生产组件（preview 夹具只定初态，禁运行时 fetch）。"
    >
      <div className="space-y-12">
        <SubSection title="Ⓐ 铃铛 + 角标（NT-1）" platform="shared">
          <SectionFrame cases={BELL_CASES} device="desktop" minHeight={120} />
        </SubSection>

        <SubSection title="Ⓑ Popover（NT-2 … NT-8，NT-20）· portal 弹层一帧一 case" platform="desktop">
          {POPOVER_CASES.map((c, i) => (
            <div key={c.key} className={i === 0 ? undefined : "mt-3"}>
              <SectionFrame cases={[c]} device="desktop" minHeight={c.key === "notif-panel-bare" ? 620 : 800} />
            </div>
          ))}
        </SubSection>

        <SubSection title="Ⓒ /notifications 全页（NT-9 … NT-13，NT-21）" platform="shared">
          <SectionFrame cases={PAGE_DESKTOP} device="desktop" minHeight={560} />
          <div className="mt-3">
            <SectionFrame cases={PAGE_MOBILE} device="mobile" minHeight={560} />
          </div>
        </SubSection>

        <SubSection title="Ⓓ 移动入口（NT-14 … NT-15）" platform="mobile">
          <SectionFrame cases={MOBILE_ENTRIES} device="mobile" minHeight={120} />
        </SubSection>

        <SubSection title="Ⓔ 行组件 + 40 type 全枚举（NT-16 … NT-19，NT-22）" platform="shared">
          <SectionFrame cases={ROW_CASES.slice(0, 2)} device="desktop" minHeight={200} />
          <div className="mt-3">
            <SectionFrame cases={ROW_CASES.slice(2)} device="desktop" minHeight={900} />
          </div>
          <div className="mt-3">
            <SectionFrame cases={ROW_CASES.slice(2)} device="mobile" minHeight={900} />
          </div>
        </SubSection>
      </div>
    </SectionWrapper>
  </LitePage>
);
