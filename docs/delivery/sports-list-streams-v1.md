# Sports 列表 · 直播与直播预告（Sports 品类页顶部）— 交付说明 v1

> **研发交付用的唯一总文档。** 范围：Sports 品类页 `/events?sector=sports`（桌面 `LiteSportsView` + 手机 `MobileSportsModule`）顶部「直播舞台 · 直播预告排 · Remind me」+ 提醒后端 + 新通知类型 `system.stream_live`。下面的 day strip 与比赛列表**不在本次范围、一像素不动**；首页 Sports 模块不变。
> 决策：Liya（CPO）2026-11-04 逐条批：①直播样式 ②预告样式与优先级「直播 > 预告 > 一般比赛」③去掉「没有直播时的预告大卡」④Remind me 走后端 ⑤预告不设上限。口径：**LoL 与大的足球比赛都有直播**——有没有直播源由数据（`stream_url`）决定，前端不判断。
> 状态：Lovable 已上线（演示视频源是 mux 测试流）；提醒后端在 Lovable 库里真跑（表 + 每分钟 cron）。

## 0. 读者须知

查什么去哪儿：
- 长什么样 → 生产页 `/events?sector=sports`（桌面 + 手机）
- 什么时候变成什么样 → `/style-guide` → Lite → **Events 列表** 节点 → 小节「⑥b Sports 品类页 · 直播与直播预告（EV-36 … EV-45）」
- 字段名、文案、倒计时写法、术语 → `docs/copy-dictionary.md` 节「Sports 列表 · 直播与预告」（顶部「Lite 术语对照表」）；通知行在节「Notifications」的 `system.stream_live`
- 设计法则（尺寸、颜色、宽度规则）→ `DESIGN.md` §Addendum 2026-11-04 · Sports 列表直播与预告（14 条）
- 后端什么是需求、什么只是演示 → `docs/backend-boundary.md`「2026-11-04 Sports 列表 · 直播提醒」+ 本文 §5
提问前先按上面顺序查一遍；查不到再提，提问时写明"我查了 X 没有"。

## 0.1 字典怎么看

1. 打开 `/style-guide`（不用登录），左栏 Lite 组点 **Events 列表**，本页目录里找「⑥b Sports 品类页 · 直播与直播预告」。
2. 小节里三组样张：EV-36…39（直播舞台）、EV-40…44（预告排）、EV-45（游客点 Remind me，单独一帧，因为登录层是 fixed 浮层）。每组上面桌面 1280 帧、下面手机 375 帧。
3. 每张样张 = 编号 + 状态名 + iframe 里的生产组件；下面的表固定「状态 / 触发条件 / 视觉 / 数据来源」，触发条件就是判定表达式。
4. 样张跑在冻结时钟（`FROZEN_NOW` 2026-08-03 15:20 UTC）上，倒计时不走；视频是交易页直播用的同一条 mux 测试流。
5. 页头搜索框敲 `EV-42` 或文字，点结果落到样张；单张查看：`/style-guide/preview?c=events-ev42`（key = `events-ev` + 编号小写，见 §6）。

只在字典里看得到的态：多路直播 + 切换（EV-37 / 37b，Lovable 演示库同时只有一场直播中的比赛有流）、视频加载中（EV-38）、自动播放被拦（EV-39）、Remind me 已设（EV-43；生产页要看真数据，用演示号 alex_carter 登录：站内登录框 → Google → Alex Carter）。

## 通俗导读

> 给没读过正文的人的 2 分钟解读；不替代正文，一切以正文为准。

**一分钟看懂**：Sports 页以前顶部就是几张灰卡，正在打的和还没开打的长得差不多。现在顶部按重要性分三段——**能看直播的正在打的比赛**放进一块带视频的大舞台（边看边下单）；**48 小时内会直播的比赛**排成一排预告卡，带倒计时和「Remind me」；**其他正在打的比赛**还是原来的卡片。再往下的比赛列表不变。

**一条故事线**（用户小 B，周三中午打开 Sports 页）：① 顶部舞台在静音播 Spirit vs MOUZ，右边是比分和两个下注按钮，点视频进交易页继续看；② 下面一排「Coming up on stream · 3」：欧冠今晚 04:00 开、海报上写 `15h 20m`，她点了 `Remind me`（没登录 → 先弹登录，登录后再点一次变 `Reminder set`）；③ 凌晨 04:00 开赛，铃铛里多一条 `Manchester City vs Inter stream is live`，点进去就是带直播的交易页。

**易混点**：
- 不是「有直播的比赛从列表里搬走」，而是「挑出来在顶部重点展示」——预告里的比赛下面列表照样有一行。
- 不是「没有直播在播时顶部放一张预告大卡」——那版已被 CPO 否掉；没有直播在播时，顶部第一段就是预告排。
- 不是「Remind me 存在本地」——它是一条后端记录，换设备也在；游客点它只会弹登录。

## 1. 页面结构（自上而下）

| 段 | 出现条件 | 内容 |
|---|---|---|
| Live on stream · n | 至少一场正在打且有 `stream_url` | 直播舞台：一屏一路视频 + 记分牌 + 下注；多路时底部切换条 |
| Coming up on stream · n（Next 48 hours） | 至少一场未开赛、有 `stream_url`、48 小时内开赛 | 预告排（1 张宽卡铺满 / 2 张宽卡各半 / 3 张及以上竖卡横滑 + 箭头） |
| Playing now · n | 至少一场正在打且**没有** `stream_url` | 原有 live 卡：桌面样式不变；手机按 DESIGN 第 13 条给队名腾宽度，卡高不变；不再带 Watch live 芯片 |
| day strip + 列表 | 原规则 | 不变；有直播的未开赛比赛行带 `Stream at kickoff` |

三段各自计数，空段整段不渲染。体育筛选（Sport / League）对三段同样生效（同一个 `scoped` 集合）。

## 2. 判定与数据

| 概念 | 判定 | 来源 |
|---|---|---|
| 直播 | `isFixtureLive(e) && metadata.stream_url` 非空 | `useSportsMatches` → `SportsMatch.streamUrl` |
| 预告 | `!live && stream_url && 0 < kickoff − now ≤ 48h`，开赛时间升序，**不设上限** | `upcomingStreams()` |
| kickoff | `metadata.kickoff_at`，没有时回落 `events.start_date` | `sportsData.ts` |
| 舞台默认一路 | 直播按 `events.volume`（累计成交额）降序取第一；选中后不跟着成交额变化 | `LiteSportsView` / `MobileSportsModule` |
| 已提醒 | `stream_reminders` 里有 `(auth.uid(), event_id)` | `useStreamReminders` |

## 3. 直播舞台

- 桌面：左 58% 视频（16:9，静音自动播放），右栏联赛 · 段名 + 时钟 → 队徽 + 比分 → 下注按钮 → `$x traded` + `Open match →`。手机：视频满宽在上，下面切换条 → 联赛 / 时钟 → 记分牌 → 叠放下注按钮。
- 视频左上只写 `● LIVE`；时钟只在记分牌出现（一个数字一处渲染）。右下静音钮；静音记录与交易页直播画面共用。
- 点视频 / `Open match →` → `/trade?event=<id>`；点下注按钮 → `/trade?event=<id>&option=<optionId>`。
- 多路：一屏只放一路，切换条标签 `ARS 1 – 0 RMA 63'`，点了视频和记分牌一起换（同一个 `<video>` 换源，不并存两路）。
- 视频状态：加载 / 缓冲 = 中央转圈；自动播放被拦 / 暂停 = 中央橙色播放钮，点了从直播最新处接上（沿用 `useHlsVideo`）。
- 舞台上的比赛不再在 `Playing now` 单列。

## 4. 直播预告排

- 卡片 = 海报（左上 `▶ STREAM`、两队队徽 `VS`、`STREAM STARTS IN` + 倒计时）+ 联赛 · 开赛时间 + 比赛名 + 下注按钮 + `Remind me`。
- 宽度按数量：1 张铺满、2 张各半（横版宽卡：海报左 42%，≤ 360px）；3 张及以上竖版卡一屏 3 张、横滑，右上箭头只在能滚时出现。手机：竖卡占内容区宽（屏宽 − 32）的 78%，横滑，只有 1 张时铺满。
- 倒计时：< 1 小时 `37:53` 按秒跳、橙色；1–24 小时 `5h 20m`；≥ 24 小时写开赛时间 `Tomorrow 19:14` / `Fri 19:00`。卡片 meta 行写短格式 `Today 12:55` / `Tmrw 10:15` / `Fri 19:15`。
- 下注按钮名按位置：第一个 = 主队缩写、最后一个 = 客队缩写、中间沿用选项原文（足球为 `Draw`）。位置 = 选项按 option id 字典序排（`sportsData.ts`，与列表行同序）。
- 点卡片 → 交易页（开赛前就能交易）；点下注按钮 → 交易页并选好结果。
- 开赛后：预告排按秒判定，开赛即移除；舞台跟数据刷新（每 30 秒）收进，所以 Lovable 上最长约 30 秒两边都不显示。只有仍在打、仍有 `stream_url` 的比赛进得了舞台（舞台已有直播时进切换条）。

## 5. Remind me（前端 + 后端）

**前端**（`src/hooks/useStreamReminders.ts`）：登录用户读本人 `stream_reminders`；点击乐观切换 `Remind me ⇄ Reminder set`，写库失败回滚 + toast `Couldn't update the reminder`。游客点击 = 调全站公共登录开关 `useAuthFlowStore.openPrompt()`，由 `AuthPromptHost`（`App` 挂一次）打开站内标准登录框（桌面 `AuthDialog` / 手机 `AuthSheet`，原样不改文字）；不在本地存，登录后需再点一次。自选星标走同一条路（原来只弹 toast、不开登录的问题同轮修掉，toast 删除）。

**后端**（`supabase/migrations/20261104130000_stream_reminders.sql`）：
- 表 `stream_reminders(user_id, event_id, created_at, notified_at)`，主键 `(user_id, event_id)`，RLS 只读写本人行（select / insert / delete）。
- `notify_stream_reminders()`，cron `notify-stream-reminders` 每分钟：kickoff 已过且在 30 分钟内、未结算、仍有 `stream_url` 的未发提醒 → `notify(user, 'system.stream_live', {event_name, event_id, home, away, league}, 'event', NULL, '/trade?event=<id>', 'stream:<id>')` → 盖 `notified_at`。kickoff 过 30 分钟仍没发的直接盖章，不迟发。
- 幂等：已实测连跑三次只产生一条通知（`notified_at` + dedupe key 双保险）。

**通知** `system.stream_live`：category `system`（消息中心 Updates tab，计角标）；icon `Tv`、tone primary；标题 `{{event}} stream is live`，正文 `the stream you asked to be reminded about just started · tap to watch and trade`（7 语已入 `src/locales`）；点开 → 交易页。字典 NT-22 / NT-23 已同步。

## 5.1 现行做法补充（Lovable 实现即口径）

研发冷读时问到、但只写在代码里的做法，统一记在这里。正式版照此实现；与这里不同的要先找 CPO。

| 项 | 现行做法 | 出处 |
|---|---|---|
| 数据刷新 | 列表数据每 30 秒重拉、重判直播 / 预告；倒计时每 1 秒按设备时钟重算 | `useSportsMatches`（`sportsData.ts`）、`useNowTick` |
| 时间写法 | 用户本地时区、24 小时制、不带时区后缀（同词典「Lite 术语对照表」）；`5h 20m` 的分钟两位补零（`5h 05m`） | `streamCountdown` / `kickoffShort` |
| 断点 | `useIsMobile`：宽 < 768 = 手机布局，≥ 768 = 桌面布局，中间没有档位 | `src/hooks/use-mobile.tsx` |
| 舞台换路 | 当前那一路打完、结算或被撤 `stream_url` 后，下次数据刷新移出舞台，自动回落到成交额最高的那一路；被撤流但仍在打的比赛进 `Playing now` | `LiteSportsView` / `MobileSportsModule` |
| `$x traded` | `compactVolume`：≥ 1M 保留一位小数 `$4.2M`；≥ 1K 取整 `$482K`；其余取整 `$950` | `sportsData.ts` |
| 记分牌时钟 | 与交易页同一套写法 `liveLabel` | `docs/delivery/sports-live-board-v1.md` §4.8 |
| 视频状态（列表舞台） | `idle` / `loading` / `buffering` → 中央转圈；`blocked` / `paused` → 中央橙色播放钮；`playing` → 无遮罩；`error` / `forbidden` → 目前只剩黑底 + `● LIVE` 角标。与交易页中文态对应：`error` = 断流、`forbidden` = 地区限制（`sports-live-board-v1.md` §5.4） | `ListStreamVideo` + `useHlsVideo` |
| Remind me 读失败 | 静默按「没设」显示，不弹错 | `useStreamReminders` |
| 通知参数 | 模板 `{{event}}` = `params.event_name`；`home` / `away` / `league` 一并写入供以后模板用，现模板不用；`entity_type = 'event'`、`entity_id = NULL`（`events.id` 是 text，不是 uuid）；去重按 `(user_id, dedupe_key)`，`dedupe_key = 'stream:<event_id>'` | `notify_stream_reminders()` |
| 改期 | 提醒按触发那一刻的最新 kickoff 判定：kickoff 被改晚，就在新时间发 | 同上 |
| 演示账号 | `alex_carter`（`968a2b3a-3913-4acb-948b-c78cc828a125`）：站内登录框 → Google → Alex Carter | — |

## 6. 字典 case 索引

| 编号 | 状态 | preview key |
|---|---|---|
| EV-36 | 直播舞台 · 单路 | `events-ev36` |
| EV-37 | 直播舞台 · 多路 + 全页优先级 | `events-ev37` |
| EV-37b | 切到另一路 | `events-ev37b` |
| EV-38 | 视频加载中 | `events-ev38` |
| EV-39 | 自动播放被拦 | `events-ev39` |
| EV-40 | 预告 1 场（宽卡铺满） | `events-ev40` |
| EV-41 | 预告 2 场（宽卡各半） | `events-ev41` |
| EV-42 | 预告 3 场及以上 + 倒计时三种写法 + >48h 只在列表 | `events-ev42` |
| EV-43 | Remind me 已设 | `events-ev43` |
| EV-44 | 没有直播在播 · 只有预告 | `events-ev44` |
| EV-45 | 游客点 Remind me → 登录 | `events-ev45` |

## 7. Lovable / 正式版边界

| 项 | Lovable | 正式版 |
|---|---|---|
| 直播源 `stream_url` | 演示赛事种 mux 测试流（`demo-live-cs2` / `demo-prekick-cs2` / `sp-ucl-mci-int` / `sp-sea-juv-nap`） | 直播源服务提供；LoL 与大的足球比赛都有 |
| 提醒存储 + 到点发送 | `stream_reminders` + 每分钟 cron 轮询 | 提醒服务按「直播开始」事件推，不必轮询；规则（一人一场一条、只发一次、不迟发）照抄 |
| 通知 | `notify()` 写 `notifications` | 消息服务同一 type / 参数 / deep link |
| 播放器 | hls.js + Safari 原生（`useHlsVideo`） | 可替换；状态集与列表舞台各态的样子见 §5.1「视频状态」 |
| 演示 | alex 一条待开播提醒（欧冠 MCI vs INT）+ 一条已发通知（Spirit vs MOUZ）；种子 `supabase/migrations/20261104130500_stream_demo_seed.sql`，清理 SQL 在文件末尾注释 | — |

## 8. 已知事项

- 本节新增界面文案（区头、`Remind me`、海报倒计时上方那行小字等）目前只有英文；区头 `Playing now · n` 在两个组件里也是硬编码英文，`src/locales` 里原有的 `sports_vertical.playing_now_other`（7 语）没有接上。通知文案已有 7 语。
- 首页 Sports 模块的 `Watch live` / `Stream at kickoff` 芯片不变（`HomeSportsCard`）；三种直播入口已抽成公共组件 `src/components/lite/sports/streamChips.tsx`。
- Lovable 演示库同时只有一场「直播中且有流」的比赛，生产页看不到多路切换；切换条的样子以字典 EV-37 / 37b 为准。
- 同日追加：手机列表未开赛卡的长比赛名折成两行、不再用省略号；手机 Playing now 卡队徽 30→26、间距收紧，网球长比分串旁的球员名不再被截（卡高不变，多词长名才折两行）（DESIGN §Addendum 2026-11-04 第 13 条，字典 EV-9t / EV-42 手机帧）；功能入口要登录统一走公共登录开关（第 14 条）。
