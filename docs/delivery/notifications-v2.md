# 消息中心 v2 — Updates tab + 公告页 — 交付说明

> **已并入 [`message-center-v1.md`](./message-center-v1.md)（2026-10-15），本文只留档，研发交付只看那一份。**

> 这是消息中心的第二期：铃铛面板和 `/notifications` 多了第三个 tab **Updates**，装运营和系统要告诉所有人的事——公告、维护、新活动上线、活动快结束、你关注的赛事开盘了；另外新加了两个公开页面 `/announcements`（公告列表）和 `/announcements/:id`（公告正文），游客也能看。
> 这次用户能看见：Updates tab 里的五种新通知；点公告类通知进正文页，正文支持图片和表格（运营可以不做落地页、发一条公告就开一个活动）；维护类公告有一块黄色「时间窗口」卡；页脚 Resources 多了「Announcements」入口。
> 没动的：v1 的 Trading / Account 两个 tab、角标口径、已读规则、90 天保留；v1 的 35 种通知一字未改。
> 怎么读：先看 §0 查什么去哪儿，再看通俗导读；文案与字段在词典「Notifications」节（v2 补录）与「Announcements」节；状态看字典节点 Notifications（NT-20…NT-22）与 Announcements（AN-1…AN-13）。

## 0. 读者须知

查什么去哪儿：
- 长什么样 → 生产页 `/announcements`、`/announcements/:id`（游客可看）；Updates tab 登录 alex_carter 看铃铛
- 什么时候变成什么样 → `/style-guide` → Lite → **Announcements**（AN-1…AN-13）与 **Notifications**（NT-20…NT-22）
- 字段名、文案、公式、时间口径 → `docs/copy-dictionary.md`「Notifications」节（v2 补录 5 个 type）与「Announcements」节
- 设计法则（第三枚 tab、公告页布局、kind 双色、窗口卡、Markdown 子集、无面包屑）→ `DESIGN.md` §Addendum 2026-10-13 第 11–16 条
- 数据与投递边界 → `docs/backend-boundary.md`「2026-10-13 消息中心 v2」

提问前先按上面顺序查一遍；查不到再提，提问时写明"我查了 X 没有"。

## 0.1 字典怎么看

同 v1 §0.1。新节点 **Announcements** 在左栏 Lite 组 Notifications 之下；编号 `AN-n` 桌面或双端共用，`AN-nb` 同状态手机帧。单张查看：`/style-guide/preview?c=ann-detail-desktop-campaign`（key 见 §7）。
只在字典可见、生产凑不出条件的态：AN-3 / AN-3b 列表空态（生产已有公告）；AN-4 / AN-5 / AN-10 加载与出错；AN-9 / AN-9b 已撤回（生产没有撤回的公告，拿不存在的 id 也能看到同一页）；NT-20b Updates 空态。

## 通俗导读

> 本节是给没读过正文的人的 3 分钟通俗解读；不替代正文、不构成需求依据，一切口径以正文为准。

**一分钟看懂**——v1 的通知都是「你自己的事」（你的结算、你的到账）。v2 加的是「所有人的事」：运营写一条公告 → 发布 = 给每个账号各写一条通知 → 大家的铃铛都亮；点进去是一个能放图、放表格的正文页。活动上线、活动快结束、关注的赛事开盘，走的是同一条路。

```
运营写公告（announcements 表，status → published）
   └─ 触发器 ──► 每个 profile 一条 notify('system.announcement' | 'system.maintenance') ──► Updates tab
campaigns.status → live ──► 每个 profile 一条 'system.campaign_live'
cron */30：live 活动 ends_at 24h 内 ──► 只给参与过的人 'system.campaign_ending'
cron */5 ：user_watchlist × events.start_date 到点 ──► 'system.watchlist_live'
撤回（status → withdrawn）──► 删掉这条公告发出的所有通知；正文页变「已不可用」
```

**一条故事线**（用户小 A）：① 运营发了「Oct 15 维护」→ 小 A 的铃铛 +1，Updates tab 亮点，行是黄扳手；② 点进去看到黄色窗口卡「Oct 15, 02:00–04:00 UTC（10:00–12:00 your time）」和一个「Go to Wallet」钮；③ 下面「More announcements」里还有一条「Autumn Volume Ladder」，点开是一张奖励表和一张图，底下「Open Rewards」；④ 他星标了今晚的 Dodgers vs Yankees，开赛那一刻 Updates 里多一条「… is live」；⑤ 运营发现公告写错了，撤回 → 小 A 的那条通知消失，链接打开是「This announcement is no longer available」。

**概念词典**

| 概念 | 是什么 | 判定表达式 | 一句话类比 |
|---|---|---|---|
| Updates tab | 第三枚 tab，`system` category 的前端映射 | `TAB_OF_CATEGORY.system = "updates"` | 抽屉第三格 |
| announcement | 运营写的一条公告：`kind` 两种（announcement / maintenance） | `announcements` 表一行，`status = published` 才可见 | 公司内网一篇公告 |
| 发布 = 广播 | 发布那一刻给每个账号写一条通知，内容 = 公告的 title / summary | `trg_announcements_notify`，dedupe `ann:<id>` | 群发 |
| 撤回 | 公告下架 + 已发通知删除 | `status → withdrawn` | 撤回群发 |
| 窗口卡 | 维护公告的时间窗口 + 影响范围 | `window_starts_at / window_ends_at / affects / not_affected` | 停水通知的那一行 |
| 只给参与者 | 活动快结束只提醒参与过的人（A8） | `campaign_participations` 有记录 | 只提醒报了名的人 |
| 关注开盘 | 星标赛事到开赛时间 | `user_watchlist × events.start_date` 落在最近 10 分钟 | 比赛开始的推送 |

**易混点**
- 不是「公告类通知也走模板」，而是「标题正文 = 公告的 title / summary 原样」——公告是运营写的，不是机器事件。
- 不是「活动快结束广播全员」，而是「只发给参与过的」；活动上线才是全员。
- 不是「公告页在 Lovable 有后台」，而是「Lovable 阶段我用 SQL 手工插」；正式版需要运营后台（V3）。
- 不是「桌面公告页有返回链」，而是「没有」：桌面详情页禁放面包屑 / 返回文字链（DESIGN 规则，Insights 的 PD-6 同一条），去列表页靠右栏 See all 和页脚。
- 不是「Updates 的通知不计角标」，而是「全部计」（V2）；只有 `trade.*` 不计。

**用户视角**——看到：第三枚 tab、五种新 icon（扩音器 / 扳手 / 礼物 / 沙漏 / 星）、公告正文页（图、表、CTA、More announcements）、页脚 Announcements。看不到：`system` category、广播的 fan-out、撤回删行、Markdown 原文。

## 1. 功能目标

- 一个承接面收运营与系统广播：公告 / 维护 / 活动上线 / 活动将结束 / 关注赛事开盘，5 种 type（v2），全部计角标。
- 公告有正文页：公开、可分享、能放图和表格、可带一枚 CTA；维护类带时间窗口卡。
- 不改 v1 的任何行为。

## 2. 数据模型

### 2.1 `announcements` 表

| 列 | 说明 |
|---|---|
| `id` uuid | 深链 `/announcements/:id` |
| `kind` text | `announcement` / `maintenance` |
| `title` / `summary` text | 标题 / 导语；通知行标题正文同字段 |
| `body_md` text | 正文，Markdown 子集（§3.4） |
| `cta_label` / `cta_href` text | 可选一枚 CTA；缺一不渲染 |
| `window_starts_at` / `window_ends_at` timestamptz | 维护窗口（UTC 存，页面显示 UTC + 本地） |
| `affects` / `not_affected` text | 窗口卡第二行 |
| `status` text | `draft` / `published` / `withdrawn` |
| `locale` text | 默认 `en`（v2 只有英文正文；页面 chrome 走 i18n 7 语） |
| `published_at` timestamptz | 发布时间；发布时为空则触发器补 `now()` |

RLS：`status = 'published'` 对 anon + authenticated 可读；写只给 admin 角色（Lovable 阶段用 query_database）。

### 2.2 函数 / 触发器 / cron

| 名 | 作用 |
|---|---|
| `notif_announcement()` BEFORE INSERT / UPDATE OF status | → published：对 `profiles` 全员 `notify(system.announcement \| system.maintenance, {title, summary, kind}, 'announcement', id, '/announcements/<id>', 'ann:<id>')`；→ withdrawn：删 `entity_type='announcement' AND entity_id=id` 的通知 |
| `notif_campaign_live()` AFTER INSERT / UPDATE OF status ON campaigns | → live：全员 `system.campaign_live {campaign, task(第一条 entry 的第一个任务名), ends_at}`，deep link `/rewards/campaign/<id>`，dedupe `camp-live:<id>` |
| `notify_campaign_ending()` cron `*/30` | live 且 `ends_at` 在 24h 内 → `campaign_participations` 里的人 `system.campaign_ending`，dedupe `camp-end:<campaign>` |
| `notify_watchlist_live()` cron `*/5` | `user_watchlist × events`，`start_date` 落在最近 10 分钟且未结算 → `system.watchlist_live`，deep link `/trade?event=<id>`，dedupe `wl:<event>` |

`notification_category()` 的 `system` 分支在 v1 就预留了；`notify()` 不变。

## 3. 用户端

### 3.1 Updates tab

- `NOTIFICATION_TABS` 第三枚 `updates`；Popover 局部 tab 与全页开场级 tab 同规格；`?tab=updates` 可直达。
- 默认 tab = 第一个有未读的（Trading → Account → Updates），全读 Trading（`firstUnreadTab()`，V4）。
- 空态：彩绘猞猁 `empty-no-starred-event.png` · `Nothing new` / `Campaign news and announcements land here.`
- 5 个 type 的 icon / 色 / 深链见词典；icon 只有 primary / trading-yellow 两色。

### 3.2 `/announcements` 列表页（公开）

- 入口：SeoFooter Resources「Announcements」；详情页右栏「See all announcements →」；通知行 deep link 只到详情。顶栏 / Me 菜单 / BottomNav **不加**（A2）。
- 桌面：`EventsDesktopHeader` → `max-w-7xl px-4 lg:px-6 py-10` → 标题 font-display 24/30 + 副题 → 列表（行 = kind icon 20 + 标题 15/22 + 摘要 ≤2 行 + 日期 mono 11 `Oct 13, 2026`）→ `Load more`（每页 20）/ 到底 `That's everything`（≥5 行才显示）→ SeoFooter。
- 移动：inner header「Announcements」→ `px-4 pt-3` 副题 → 行（日期当年省年份）→ 全宽 Load more 44h → SeoFooter。不挂 BottomNav。
- 空态 / 骨架 / 出错：AN-3 / AN-4 / AN-5。

### 3.3 `/announcements/:id` 详情页（公开）

- 桌面：12 栅格 8 + 4。左 = 文章；右 = More announcements（最近 3 条排除当前 + See all；0 条整栏隐藏，左栏不拉宽）。**无面包屑 / 返回链**。
- 文章：kind chip（22px，Announcement = primary，Maintenance = trading-yellow）+ 发布时间 mono 12 `Oct 13, 2026 · 15:02` → 标题 24/30（移动 19/26）→ 导语 15/24 muted（移动 14/22）→ 窗口卡（仅 maintenance 且有 `window_starts_at`）→ 正文（1px 分隔 + 22px）→ CTA 行。
- 窗口卡：`Window · Oct 15, 02:00–04:00 UTC (10:00–12:00 your time)` / `Affects: … · Not affected: …`；浏览器时区 = UTC 时省括号；跨日 `Oct 15, 22:00 – Oct 16, 02:00 UTC`；无结束 `Oct 15, 02:00 UTC`。
- CTA 行：主钮 `btn-primary`（`cta_label` + ArrowRight；外链新开）；副钮 outline `Back to Notifications` 只在登录且从通知行进来（`navigate(deep_link, { state: { from: "notifications" } })`）时渲染；两钮都没有 → 整行不渲染。
- 移动：inner header 标题按 kind（`Announcement` / `Maintenance`，加载中 / 不可用回落 `Announcements`）→ `px-4 py-5` 单列 → CTA 竖排全宽 44h → More announcements → SeoFooter。
- 已撤回 / 不存在：同一页，彩绘猞猁 `empty-error.png` + `This announcement is no longer available` + 胶囊钮 `All announcements`；右栏隐藏；`document.title` 回落 `Announcements · OmenX`。

### 3.4 正文 Markdown 子集（A6 修订：含图片与表格）

`src/lib/markdownLite.ts`，零依赖、无 HTML 透传（`<script>` 按文本渲染），链接只放行 `http(s)://` / `/` / `mailto:`，其余降为 `#`。

| 语法 | 渲染 |
|---|---|
| 段落 | `p 15/24 fg/86 mb-3.5`（移动 14/22） |
| `#` / `##` → h2；`###` → h3 | h2 `font-display 18/24 600 mt-6`；h3 `15/22 600 mt-[22px]` |
| `- ` / `1. ` 列表 | `ml-[18px] marker muted space-y-1`（一层） |
| `**粗**` `*斜*` `` `code` `` `[t](href)` | strong 600 白；code mono 13 `bg-muted/60 border`；a primary underline offset-3 |
| `![alt](src)` 独占一行 | figure：img `rounded-[10px] border max-w-full` + alt 作 12px 图注；行内图片无图注 |
| `\| a \| b \|` + `\|---\|---:\|` | `rounded-[10px] border` 外框 `overflow-x-auto`；th 11/600 uppercase muted `bg-muted/30`；td 14 tabular-nums；`---:` 右对齐 |
| `> ` | `border-l-2 pl-3 muted` |
| `---` | `hr my-5` |

不支持：嵌套列表、任务列表、脚注、原始 HTML、h4+。

### 3.5 状态

AN-1…AN-13（§7）。

## 4. Lovable / 正式版边界

| 项 | Lovable | 正式版 |
|---|---|---|
| `announcements` 表 / RLS | 演示引擎（🟡 B） | 字段语义照抄；运营后台负责 CRUD / 定时发布 / 撤回 / 预览 / 多语言副本 |
| 写公告 | **我用 query_database 手工插**（V3），没有后台页 | 运营后台（研发侧立项） |
| 发布 = 广播 | 触发器 fan-out 到 `profiles` 全员（53 人） | 消息服务 fan-out；大用户量改「一条广播 + 每人已读表」的拉模式，字段语义不变 |
| 撤回 | 删已发通知 | 同语义 |
| 活动两条 | campaigns 触发器 + cron | 活动服务在同一业务点发出 |
| 关注开盘 | cron */5 扫 `user_watchlist × events.start_date` | 赛事服务按 fixture kickoff 推 |
| 关注「临近结算」 | **本轮不做**（A9）。注：`events` 其实有 `end_date` / `expected_settlement_time`，技术上可做，等 CPO 要 | — |
| 公告多语言 | 只有 en 正文；chrome 7 语 | 正文按 locale 多副本 |

## 5. 演示数据

- `announcements` 6 条（已发布）：维护 Oct 15（今天 15:02）· Crypto 2 分钟结算（今天 11:30，含表格）· Autumn Volume Ladder（昨天，含图片 + 奖励表 + 有序列表，CTA → /rewards）· NFL/MLB/NHL（前天）· Payout tier 30 天（Oct 8）· 7 语（Sep 30）。
- 发布广播到 53 个账号；今天之前的已置已读。
- alex_carter Updates tab 9 行：今天 3 条未读（关注开盘 Dodgers vs Yankees 17:45 · 维护 · Crypto 结算）+ 活动将结束 CPI Print Week（昨天 23:59，已读）+ 活动上线 World Cup Qualifiers（Oct 1，已读）+ 4 条历史公告（已读）。
- alex 星标了 `demo-live-mlb`；他原本星标的 Alcaraz vs Sinner 今晚 18:00 UTC 开赛，`notify-watchlist-live` cron 会自然产生一条——这是生产者的活体验证。
- 重跑种子脚本幂等（先删后插）。

## 6. 实现偏离 mock（待 CPO 追认）

| # | mock | 实现 | 原因 |
|---|---|---|---|
| 1 | 桌面详情页左上「← Announcements」面包屑 | 删除 | DESIGN 桌面详情页规则 / PD-6（CPO 10-13 17:52 指出） |
| 2 | 列表页『Load more』始终显示 | 有下一页才显示；到底且 ≥5 行显示 `That's everything` | 6 条公告一页装完，常显 Load more 是死按钮 |
| 3 | 演示 5 条公告 | 6 条（多一条「Autumn Volume Ladder」） | 为 A6 修订专门做一条「公告即活动」样板，带图 + 表 |
| 4 | `campaign_ending` 正文 `claim before Oct 12, 23:59` | 同句式，时间 = 活动 `ends_at` | 无偏离，仅注明口径 |

## 7. 状态索引

NT-20 `notif-popover-updates` · NT-20b `notif-popover-updates-empty` · NT-21 `notif-page-desktop-updates` · NT-21b `notif-page-mobile-updates` · NT-22 `notif-types-updates` · AN-1…5 `ann-list-desktop / -end / -empty / -loading / -error` · AN-1b/3b `ann-list-mobile / -empty` · AN-6…10 `ann-detail-desktop-maintenance / -announcement / -campaign / -unavailable / -loading` · AN-6b/8b/9b `ann-detail-mobile-maintenance / -campaign / -unavailable` · AN-11 `ann-kind-chips` · AN-12 `ann-window-card` · AN-13 `ann-markdown-sink`。

## 8. 涉及文件

- 数据库：`supabase/migrations/20261013180000_notifications_updates.sql`
- 前端：`src/lib/notifications.ts`（+5 type、`firstUnreadTab`、`EMPTY_BY_TAB`）· `src/lib/announcements.ts` · `src/lib/markdownLite.ts` · `src/hooks/useAnnouncements.ts` · `src/components/announcements/*`（Parts / Article / Views / MarkdownBody）· `src/pages/AnnouncementsPage.tsx` · `src/pages/AnnouncementPage.tsx` · `App.tsx` · `SeoFooter.tsx` · `NotificationBell.tsx` / `NotificationsPage.tsx`（navigate state）· `NotificationList.tsx`（updates 空态图）
- i18n：`notifications` +14 key，新命名空间 `announcements` 20 key，`legal.footer.links.announcements`（×7 语）
- 字典：`preview/announcementsPreviews.tsx` · `sections/pages/LiteAnnouncementsPage.tsx` · `notificationsPreviews.tsx` / `LiteNotificationsPage.tsx`（NT-20…22）· `nav.tsx` · `registry.tsx`
- 另：移动 `/notifications` sticky tab 修复（tab 与列表同容器，b940d85c）

## 8.1 mainnet 验收补记（2026-10-14）

- 全项通过（桌面 Popover 三 tab / 默认 tab / Updates 行 / 公告详情无面包屑 + 表格 + Back / 图片 + 奖励表 / 列表 6 条 + 页脚入口 / 移动 sticky tab / 移动详情 + 窗口卡 / 已撤回态）。
- 活体：`notify-watchlist-live` 在 Alcaraz vs Sinner 开赛时刻（10-13 18:00:00 UTC）准点写入，dedupe 正常。
- 修一处 v1 遗留：演示引擎 `roll_demo_campaign_daily`（00:02 UTC）每晚删除并重插 alex 的 12 条「Trade every day」历史 bonus 交易（新 id）→ `notif_transaction` 每晚发 12 条 `funds.credit`。加**回填守卫**：INSERT 且 `created_at` 早于 1 小时 → 不发（`20261014060000_notifications_backfill_guard.sql`），已清掉当晚 12 条。正式版语义：批量回填 / 重放 / 迁移永不触发用户通知。

## 8.2 v2.1 修订（2026-10-14，CPO 桌面终验后 ① + N1–N3）

| # | 改动 | 落点 |
|---|---|---|
| ① | 桌面 `/notifications` 去掉 DSH 返回方钮，改内容页式标题行（`Notifications` 24/30 + 右侧 Mark all read），与 Announcements 同级 | `NotificationsPage.tsx`；DESIGN §Addendum 第 17 条；字典 NT-9 |
| N1 | 分类型保留期：`trade.*` 7 天，其余 90 天；Trading tab 到底句写明双口径 | `purge_notifications()`（migration `20261014070000`）；`notifications.endOfList.trading` ×7 语；词典「90 天 / 7 天」 |
| N2 | 桌面无限滚动 → `Load more` 钮（每次 30，**按 tab 分页**：服务端 `category IN (…)`）；移动端保留自动加载 | `useNotificationPages(tab)`、`CATEGORIES_OF_TAB`、`NotificationLoadMore` / `NotificationEndNote`；字典 NT-9 / NT-9c |
| N3 | Popover 不变（最近 20 + See all） | — |

不做页码分页的理由：通知是 feed，没人翻到第 7 页；撑爆列表的是交易回执，回执的正本在 Portfolio——所以用保留期而不是分页解决。

## 8.3 设计师验收修订（2026-10-14，两批）

| # | 发现 | 改法 | 落点 |
|---|---|---|---|
| D1 | Trading 到底句一句 100 字符 mono 长话，375 在「Buy /」处折行，像一段正文 | 拆两行短句：`That's everything from the last 90 days` / `Buy / Cash out confirmations are kept for 7 days` | `NotificationEndNote`；`notifications.endOfList.tradingNote` ×7 语 |
| D2 | Announcements 底注一处 sans 一处 mono；移动公告列表与页头之间无分隔；正文图片竖向占满一屏；See all 用文字 `→` | 底注统一 mono 11 muted；移动列表加顶分隔线；图片桌面封顶 `md:max-h-[480px]`；箭头换 lucide `ArrowRight` | `AnnouncementViews` / `MarkdownBody` / `MoreAnnouncements` |
| D3 | 桌面「标题 + 副题」平铺到移动端，副题孤零零一行被读成列表第一行 | 移动端不下放副题，inner header 即标题，列表直接接页头 | `AnnouncementViews` 移动分支；DESIGN 第 13 条 |
| D4 | 移动端标题 `…` 截断，桌面能展示全的事件名在 375 被吃掉 | 先改 `line-clamp-2`；并排复验发现右侧时间列（`Yesterday 21:00` 占行宽 45%）仍把库里最长的结算标题挤到 4 行——改成移动换行结构：标题占满列宽 ≤3 行、正文、时间落到行底一行（Binance / Bybit 通知列表式，CPO 批） | `NotificationRow` `mobile` prop；DESIGN 第 6 条；字典 NT-9 移动 case。**10-15 补**：Announcements 列表行 + 详情 rail 行移动端同一结构（CPO："notification 和 announcement 是一起搞的需求，怎么老是只照顾一边"）——`AnnouncementRow` 移动分支，字典 AN-1b，DESIGN 第 6 / 13 条 |

取证口径从这一轮起：桌面 1280 与移动 375 并排看同一行，用库里最长的真标题，不用 mock 样例标题（流程 ④ 设计师清单 ⑧–⑩）。

## 8.4 icon 台账（2026-10-15，CPO）

「什么 type 用什么 icon / 什么颜色」原来只活在 `src/lib/notifications.ts` 的 `NOTIFICATION_TYPES` 和 DESIGN 第 7 条的一句话里，字典 NT-18 / 19 / 22 只是把 40 行渲染出来、没标 type 键——研发看行猜 icon，等于没规范。补：

- **字典 NT-23**：40 type → lucide 组件名（渲染在自己的 tone 里）→ tone 键 / 条件规则，外加 tone 图例与 default 行；**直接读 `NOTIFICATION_TYPES` 渲染**，新增 type 改一处表自动跟上，不会漂。
- **copy-dictionary「Notifications」表**加 `icon · 色` 列，由同一张表生成。
- 三个条件色（`settled.round_batch` / `trade.cashed_out` / `funds.recovery_update`）在源表加 `toneRule` 文字，台账与词典原样展示。

- **字典 AN-14**（Announcements 同款）：kind → 列表行 icon → 详情页 chip（实渲）→ 广播成的 `system.<kind>` 通知 icon，读 `ANNOUNCEMENT_KIND` + `NOTIFICATION_TYPES`；词典「概念 › kind」行补 icon · 色。

研发问「这个 type 用什么 icon」→ 指 NT-23（公告 kind → AN-14）；问「为什么是这个颜色」→ 指 DESIGN §Addendum 2026-10-13 第 7 / 12 条。

## 9. 未变更项

v1 的 35 个 type 与模板；Trading / Account tab；角标与已读规则；90 天保留；Settings 邮件开关；交易 / 钱包 / 奖励业务逻辑；Pro 终端；游客顶栏。

## 轮次代号 ↔ 章节

| 代号 | 白话 | 章节 |
|---|---|---|
| V1–V5 | 2026-10-13 批的 v2 范围：5 个 type / 全计角标 / 公告手工发 / 默认 tab / 演示数据 | §1 §3.1 §5 |
| A1–A9 | 公告页 mock 批点：路由公开 / 入口只页脚 / 8+4 / 两种 kind / CTA / Markdown 含图表 / 撤回 / 只给参与者 / 不做临近结算 | §3.2 §3.3 §3.4 §4 |
| A6 修订 | 正文要支持图片和表格（公告即活动） | §3.4 |
| PD-6 | Insights 那轮被打回的「← INSIGHTS」返回链——同一条规则 | §3.3 |
