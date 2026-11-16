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
| 胶囊内容 | 橙点 → `STREAM STARTS IN`（小胶囊 `STARTS IN`）→ 竖线 → 数字 |
| 尺寸 | 大胶囊高 42、数字 20px；小胶囊高 20、数字 12px、标签用短的 `STARTS IN`。**只按舞台宽度切换，不看设备**：舞台宽 < 560 用小胶囊（手机；800–1023 宽的桌面布局左栏约 360 宽时也是），≥ 560 用大胶囊（含 640–767 的平板）。中日韩标签字距收紧、字号 +1。细节见 DESIGN.md §Addendum 2026-11-16 |

## 3. 数字怎么显示

| 离开赛 | 显示 | 例 |
|---|---|---|
| ≥ 24 小时 | 天 时 分，不显示秒 | `2d 4h 12m` |
| 1 – 24 小时 | 时:分:秒，每秒跳 | `02:51:12` |
| < 1 小时 | 分:秒，每秒跳 | `51:12` |
| 已到开赛时间、比赛还没开打 | 不显示数字，标签换成 `STREAM STARTING SOON`（手机 `STARTING SOON`），橙点闪烁 | — |

比赛一开打（`matchPhase` 变成 `live`）模块就换成直播画面；用户不用刷新页面（舞台每秒重算一次）。

## 4. 和下面记分牌的数对得上

记分牌右上的 `Starts in 2h 51m` 和舞台的 `02:51:12` 读的是同一个时钟（`useSharedNow`）。舞台在页面上时，这个共享时钟 1 秒一跳；平时 30 秒一跳。两处只是精度不同（分钟 / 秒），不会出现一个 51 分、一个 52 分。

> 改动前的问题：舞台那行 `in 2h 51m` 只在页面打开时算一次、之后不更新，记分牌 30 秒更新一次，所以截图里会看到一个 51、一个 52。

## 5. 文案（7 种语言已入 `src/locales/*.json`）

| 用在哪 | key | en | zh-CN |
|---|---|---|---|
| 桌面标签 | `events.screen.simple.sports_view.sports_streams.starts_in`（已有，和 Sports 列表预告卡同一条） | Stream starts in | 距直播开始 |
| 手机标签 | `events.screen.simple.sports_clock.starts_in_lead`（已有） | Starts in | 距开赛 |
| 桌面 · 到点未开播 | `events.screen.simple.sports_view.sports_streams.stream_starting_soon`（新） | Stream starting soon | 直播即将开始 |
| 手机 · 到点未开播 | `events.screen.simple.sports_view.sports_streams.starting_soon`（新） | Starting soon | 即将开始 |

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
| 2 | 同上，手机宽度 | 胶囊缩小，标签 `STARTS IN`；下面 Hide stream 折叠条还在 |
| 3 | 对照下方记分牌 `Starts in …` | 分钟数和胶囊的分钟数一致 |
| 4 | 退出登录再看 | 和登录时一样 |
| 5 | 把一场有直播源的比赛 kickoff 改到 2 天后 | 数字 `2d …h …m`，不显示秒 |
| 6 | kickoff 改到 50 分钟后 | `50:xx` |
| 7 | kickoff 改到过去、`match_status = scheduled` | `STREAM STARTING SOON`，橙点闪，没有数字；左上没有 LIVE 标 |
| 8 | 切 7 种语言（俄语、越南语重点看） | 胶囊不折行、不溢出 |
