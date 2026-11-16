# Lite 交易页 · 直播模块未开赛态 — 交付说明 v1（2026-11-16）

> **通俗导读**：交易页上方的直播模块，在比赛开打之前原来是一整块黑底，中间一行小字 `Stream starts at kickoff · in 2h 51m`，看起来像坏了。现在改成：
> 1. 铺一张兜底海报（所有比赛同一张，带 LIVE SOON 字样）；
> 2. 海报中间放一个倒计时胶囊，每秒跳；
> 3. 开赛时间到了但比赛还没开打（推迟、晚开）时，胶囊改写 `Stream starting soon`，不再掉进播放器外壳、挂着一个假的 LIVE 标。
>
> 直播中、加载、暂停、出错、地区不可看、未登录看直播这些状态都没动。

## 0. 查什么去哪儿

- 长什么样 → 生产页：`/trade?event=demo-prekick-cs2`（常驻待开赛的演示赛，有直播源）
- 什么时候变成什么样 → `/style-guide` → `Lite Sports · Live` → Ⓑ LiveStage 的 S6 / S6b / S6c / S6d
- 字段、文案、公式、术语 → `docs/copy-dictionary.md` 的 `Sports live stage` 一节 → 本文；术语对照见词典顶部「Lite 术语对照表」
- 规范 → `DESIGN.md` §Addendum 2026-11-16 · 交易页直播舞台 · 未开赛态

## 0.1 字典怎么看

| 步 | 做什么 | 看到什么 |
|---|---|---|
| 1 | 打开 `https://omenxv2.lovable.app/style-guide`（不用登录） | 节点 `Lite Sports · Live` |
| 2 | 小节 `Ⓑ LiveStage（S1 … S10，含 S6 未开赛四态）` | 桌面一排、手机一排 |
| 3 | 每张样张 | `编号 · 状态名` + iframe 里的真组件，倒计时是真的在跳 |
| 4 | 样张下面的表 | 「状态 / 触发条件 / 视觉 / 数据来源」 |
| 5 | 找编号 | 页头搜索框敲 `S6` |
| 6 | 单张看 | `/style-guide/preview?c=sports-stage-s6`（另有 `sports-stage-s6b` / `s6c` / `s6d`） |

只在字典可见的态：**S6b（超过 24 小时）、S6c（1 小时内）、S6d（到点还没开播）**——演示赛 `demo-prekick-cs2` 永远停在开赛前两小时左右，生产页上只看得到 S6。

## 1. 什么时候显示

- 这场比赛有直播源（`metadata.stream_url`），而且比赛还没开打（`matchPhase(event) === "upcoming"`）。
- 已登录和未登录看到的一样。开赛后未登录用户仍是原来的「Sign in to watch live」卡（S10）。
- 比赛结束、没有直播源时模块不出现（原来就是这样）。

## 2. 长什么样

| 部位 | 规则 |
|---|---|
| 画面 | 兜底海报 `/assets/streams/live-soon.jpg`，铺满 16:9 舞台，所有比赛同一张。海报本身就是 16:9，不会被裁 |
| 倒计时胶囊位置 | 水平居中，垂直中心在舞台高度 72.5%（海报 LIVE SOON 和 Who wins the match? 中间那条空黑带） |
| 胶囊内容 | 橙点 → `STREAM STARTS IN`（大小胶囊同一句，只缩字号）→ 竖线 → 数字 |
| 尺寸 | 大胶囊高 42、数字 20px；小胶囊高 20、数字 12px、标签字号 8px（文字和大胶囊一样）。**只按舞台宽度切换，不看设备**：舞台宽 < 560 用小胶囊（手机；800–1023 宽的桌面布局左栏约 360 宽时也是），≥ 560 用大胶囊（含 640–767 的平板）。中日韩标签字距收紧、字号 +1。细节见 DESIGN.md §Addendum 2026-11-16 |

## 3. 数字怎么显示

| 离开赛 | 显示 | 例 |
|---|---|---|
| ≥ 24 小时 | 写小时（不换算成天）+ 分，不显示秒 | `52h 12m` |
| 1 – 24 小时 | 时:分:秒，每秒跳 | `02:51:12` |
| < 1 小时 | 分:秒，每秒跳 | `51:12` |
| 已到开赛时间、比赛还没开打 | 不显示数字，标签换成 `STREAM STARTING SOON`（大小胶囊同一句），橙点闪烁 | — |

比赛一开打（`matchPhase` 变成 `live`）模块就换成直播画面；用户不用刷新页面（舞台每秒重算一次）。

## 4. 和下面记分牌的数对得上

记分牌右上的 `Starts in 2h 51m` 和舞台的 `02:51:12` 读的是同一个时钟（`useSharedNow`）。舞台在页面上时，这个共享时钟 1 秒一跳；平时 30 秒一跳。两处只是精度不同（分钟 / 秒），不会出现一个 51 分、一个 52 分。

> 改动前的问题：舞台那行 `in 2h 51m` 只在页面打开时算一次、之后不更新，记分牌 30 秒更新一次，所以截图里会看到一个 51、一个 52。

## 5. 文案（7 种语言已入 `src/locales/*.json`）

| 用在哪 | key | en | zh-CN |
|---|---|---|---|
| 胶囊标签（大小同一句） | `events.screen.simple.sports_view.sports_streams.starts_in`（已有，和 Sports 列表预告卡同一条） | Stream starts in | 距直播开始 |
| 胶囊 · 到点未开播 | `events.screen.simple.sports_view.sports_streams.stream_starting_soon`（新） | Stream starting soon | 直播即将开始 |
| 记分牌 / 下单卡 / 列表 · 到点未开打 | `events.screen.simple.sports_clock.starting_soon`（新） | Starting soon | 随时开赛（避开同卡 UPCOMING 药丸的「即将开始」） |
| 首页舞台标签 · 到点未开打 | `events.screen.simple.home_all.sports.biggest_starting_soon`（新） | Biggest this week · starting soon | 本周最大一场 · 随时开赛 |

数字里的 `d` `h` `m` 各语言都不翻译（与记分牌一致）。

## 6. Lovable 和正式版的边界

- 兜底海报是静态资源，正式版放到自己的 CDN，路径常量 `STAGE_POSTER`。
- 以后要按比赛换海报（赛事封面），换的只是图片地址；倒计时胶囊的位置是按这张海报的空白带定的，换图时要重新确认 72.5% 那条带上没有字。
- 海报上的 LIVE SOON / Who wins the match? / SPORTS · MATCH WINNERS 是画在图里的英文，切换语言不会变；让分、大小分等盘口页也显示同一张图（CPO 定：先全部用这张兜底图）。

## 7. 代码位置

| 内容 | 文件 |
|---|---|
| 未开赛态、倒计时格式 `stageCountdown`、海报常量 | `src/components/lite/sports/LiveStage.tsx` |
| 共享时钟 `useSharedNow` | `src/components/lite/sports/matchboardModel.ts` |
| 海报 | `public/assets/streams/live-soon.jpg` |
| 字典帧 | `src/pages/StyleGuide/preview/sportsLivePreviews.tsx`、`sections/LiteSportsLiveSection.tsx` |

## 8. 测试用例

| # | 操作 | 应该看到 |
|---|---|---|
| 1 | 打开 `/trade?event=demo-prekick-cs2`（桌面） | 海报 + 居中胶囊 `● STREAM STARTS IN │ 0X:XX:XX`，秒在跳 |
| 2 | 同上，手机宽度 | 胶囊缩小，标签仍是 `STREAM STARTS IN`；下面 Hide stream 折叠条还在 |
| 3 | 对照下方记分牌 `Starts in …` | 分钟数和胶囊的分钟数一致 |
| 4 | 退出登录再看 | 和登录时一样 |
| 5 | 把一场有直播源的比赛 kickoff 改到 2 天后 | 数字 `4xh xxm`（写小时），不显示秒；记分牌 `Starts in 4xh xxm`、下单卡 `Kicks off in 4xh xxm` |
| 6 | kickoff 改到 50 分钟后 | `50:xx` |
| 7 | kickoff 改到过去、`match_status = scheduled` | 舞台 `STREAM STARTING SOON`，橙点闪，没有数字，左上没有 LIVE 标；记分牌 `UPCOMING` + `Starting soon`；下单卡 `Starting soon`；Sports 预告排排在最前写 `Starting soon`；首页 / 列表不算正在打 |
| 8 | 切 7 种语言（俄语、越南语重点看） | 胶囊不折行、不溢出 |
| 9 | `match_status = final`、未结算、end_date 未到、有 `stream_url` | 舞台是正常播放器（在播），不是黑底挂 LIVE |
| 10 | 同上，把 `stream_url` 清空 | 舞台不出现，记分牌留在原位 |

## 9. 2026-11-16 追加（CPO 批验收待定的四条）

1. **到了开赛时间、比赛还没开打，整页一个说法**。判定只有一个：`matchPhase === "upcoming"` 且 kickoff ≤ now（数据源 `match_status` 仍是 scheduled / postponed）。

   | 位置 | 以前 | 现在 |
   |---|---|---|
   | 交易页舞台 | 落进播放器外壳、挂 LIVE | `STREAM STARTING SOON`（本文 §3） |
   | 记分牌 | 当成打完：`FINISHED` · `In review · result pending` | `UPCOMING` + 右上 `Starting soon` |
   | 下单卡 / 手机抽屉 / Pro 页头 / 赛事下拉 | `Kicks off in 00:00` | `Starting soon` |
   | 首页 Sports | 当成正在打，出 `Watch live`；舞台标签 `kicks off in 0s` | 不算正在打；舞台标签 `Biggest this week · starting soon`；眉行不写 next kickoff |
   | Sports 品类页 | 当成正在打；从列表消失 | 不算正在打；预告排排在最前写橙色 `Starting soon`；列表照常列出 |

   这类比赛在 Sports 列表、日期条、首页里**算在今天**（`listDayOf`），不会因为过了午夜多出一个「昨天」分组；日历照常列出。

   代码：`sportsData.ts` 行上新增 `notStarted`、`isLateKickoff()`、`listDayOf()`，`liveAt` / `isUpcoming` / 分组读它；`matchboardModel.ts` 的状态改读 `matchPhase`；`sportsClock.tsx`、`UpcomingStreams.tsx`、`HomeSportsSection.tsx` 处理 kickoff ≤ 0。字典 M2b / TR-29e / EV-42b。
2. **超过 24 小时一律写小时**（`52h 12m`），不换算成天，和首页 R5 一致。只改**开赛**倒计时：舞台 `stageCountdown`、记分牌 `startsIn`（顺带接上多语言）、下单卡与赛事下拉 `kickoffInShort`。非体育事件下单卡的「Expected to end in / Closes in」仍按天写（`43d 0h`，`endInShort`），Pro 页头的 `kickoffInClock`（`2d 03:10:00`）没动。
3. **大小胶囊同一句话**：小胶囊也写 `Stream starts in` / `Stream starting soon`，只缩字号。原来小胶囊借用的 `Starts in`（距开赛）不再用在舞台上；`sports_streams.starting_soon` 删除。
4. **比赛不是「未开始」之后，舞台跟着直播走**：比赛在打（含已过预计结束时间的加时）、打完还没结算、或者没有开赛时间——只要 `stream_url` 还在就是正常播放器（会拉流）；预计结束时间 `end_date` 不再让舞台消失，只有「已结算」或 `stream_url` 被清掉才收起。Pro 终端的「▶ Watch live」同一规则（打完未结算、直播还在时也出现）；直播结束由直播源服务清掉 `stream_url`，舞台随之不出现（原 S9 规则）。以前「打完未结算 / 没有开赛时间」是黑底播放器外壳 + LIVE 标，且不拉流。**正式版要求**：直播源服务在直播真正结束时清掉 `stream_url`（或给出等价的「直播已结束」字段），前端只认这一个信号。

