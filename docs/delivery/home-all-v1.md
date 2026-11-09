# 首页 All 视图改版（Hero · Sports · Crypto · Stocks · Editor's Desk · More）— 交付说明 v1

> **研发交付用的唯一总文档。** 范围：Lite 首页 `/`（= `/events`，`sector = all`）桌面 1440 与手机 390 两套形态；品类视图（Intraday / Sports / Crypto / Finance）、Watchlist、Calendar、Boost 网格**一像素不动**。
> 决策：Liya（CPO）2026-11-05 起在 Design 画布逐模块定稿，2026-11-09 15:32 批「都批了」= 规则清单 + 手机版画板一起批准。规则原文 = `src/components/lite/home/homeAllRules.ts`（代码、字典台账 HA-R、本文 §2 同一份）。
> 状态：Lovable 已实装（桌面 + 手机）。Lovable 没有行情 tick 源，Crypto 图表与 Stocks 走势是按事件 id 播种的确定性模拟（§5 写了真平台换成什么）。

## 0. 读者须知

查什么去哪儿：
- 长什么样 → 生产页 `/`（桌面 + 手机）；Design 画布「规则稿 + 手机版（可批）」页（桌面 D2-S3 整页 / 手机 M-Full + M-* 分段板）是定稿原图
- 什么时候变成什么样 → `/style-guide` → Lite → **Events 列表** 节点 → 顶部小节「首页 All 视图 · 状态字典（HA-1 … HA-14 + HA-R）」
- 规则编号（H / S / C / K / E / M / G / MB）→ 本文 §2 或字典 HA-R，和组件注释里的编号一致
- 字段、接口 → 本文 §4 §5
- 设计法则 → `DESIGN.md` §Addendum 2026-11-09 · 首页 All 视图
提问前先按上面顺序查一遍；查不到再提，提问时写明"我查了 X 没有"。

## 0.1 字典怎么看

1. 打开 `/style-guide`，左栏 Lite 组点 **Events 列表**，第一个小节就是首页 All 视图。
2. 七组样张：HA-1 Hero · HA-2…5 Sports 四态 · HA-6/7 Crypto · HA-8…10 Stocks 三种时刻 · HA-11/12 Editor's Desk · HA-13 More 四种事件 · HA-14 整页。每组上面桌面 1280 帧、下面手机 375 帧；**手机帧是组件自己的手机形态**（和 M-* 画板一样），不是桌面压扁。
3. 每张样张 = 编号 + 状态名 + iframe 里的生产组件；下面的表固定「状态 / 触发条件 / 视觉 / 数据来源」，触发条件就是判定表达式，数据来源栏写着对应的规则编号。
4. 样张跑在冻结时钟上（`FROZEN_NOW`），倒计时不走、图表只画一帧；Stocks 三张用的是各自市场的冻结时刻（盘中 / 盘后 / 收盘无成交）。
5. 单张查看：`/style-guide/preview?c=home-ha6`（key = `home-ha` + 编号）。

只在字典里看得到的态：Sports 状态①（10 场 live、3 路直播切换）和状态③④、Stocks「收盘后没成交」（HA-10）、More 的互斥多档 + 长标题（HA-13）——演示库某一时刻通常只有其中一种。

## 通俗导读

**一分钟看懂**：首页从「几张卡片 + 一个目录网格」改成五段大字问句：**Who wins the match?**（Sports）→ **Will the price go up?**（Crypto）→ **Will it finish higher than it opened?**（Stocks）→ **What's worth watching?**（Editor's Desk）→ **Will it happen?**（长期事件）。每段 = 眉行 + 48px 问句 + 主块裸放 / 副块进面板，段与段之间一根细线。手机是单列重排，不是桌面缩小。

**一条故事线**（用户周五晚打开首页）：① Hero 一句话「Prediction markets, with leverage.」；② Sports 段左边正在打的 Spirit vs MOUZ 在静音播直播，比分 1 – 0，两个价钮；下面四块「Up next」瓷砖，右边一张表「Big this week」3 行 + 「Next up」；③ 往下 Crypto 段一个大钟「This round closes in 02:44」，BTC 的 5 分钟轮在画图，Up 84¢ / Down 16¢；④ Stocks 段美股还没开盘，每只股票一条淡线，底下「Market opens in 9h 22m」；⑤ Editor's Desk 三条运营挑的；⑥ More 段一行一个长期事件，Anthropic 估值四档各一条 Yes/No 比例条。任何价钮 / 行 / 舞台位点一下都进交易页。

**易混点**：
- 不是「Boost 是一个品类」——它是筛选，挪到右边和 Watchlist / Calendar 一组；点了还是原来的 Boost 网格（H4 / H5）。
- 不是「首页能播放视频」——舞台位是预览，整块点进交易页，没有播放控件（S2）。
- 不是「Stocks 收盘后画一条平线」——港股 / 韩股收盘后没成交就不画图，价格旁写 **Base price**（K4 ③）。
- 不是「Editor's Desk 永远在」——运营没配就整段不出现（E2）。

## 1. 页面结构（自上而下）

| 段 | 出现条件 | 组件 | 字典 |
|---|---|---|---|
| 顶栏 · 行情 tape | 不变 | `HomeTape` | EV-33 |
| Hero | 永远 | `HomeHero` | HA-1 |
| chip 行（Boost 在右组） | 永远 | `LiteEventsFilterRow` / `MobileCategoryRow` | EV-2 |
| Quick Play 横幅 | All 视图 | `ArcadeEntryBanner`（不变） | Arcade 字典 |
| §1 Sports | 有体育场次 | `HomeSportsSection` | HA-2 … HA-5 |
| §2 Crypto | 有活轮 | `HomeCryptoSection` + `RoundCanvas` | HA-6 / HA-7 |
| §3 Stocks | 有股票日轮 | `HomeStocksSection` | HA-8 … HA-10 |
| §3b Editor's Desk | picks ≥ 1 | `HomeDeskSection` | HA-11 / HA-12 |
| §4 More markets | 有长期事件 | `HomeMoreSection` | HA-13 |
| 五段的组合 | — | `HomeStage`（`.hall` / `.hall-m`） | HA-14 |

某段无数据就整段不出，上下段之间的细线跟着少一根。Watchlist / Boost / 品类视图仍走原来的卡片网格（`LiteEventCard`），本次未动。

## 2. 规则清单（批准版 · 与 `homeAllRules.ts` 同文）

### H · 页头 · Hero · chip 行
- **H1** 顶栏 / 行情条不动。
- **H2** Hero = 1440×260 全宽横幅：设计师的猞猁键盘插画做整条底图（`/assets/desktop/hero-band@2x.png` 2880×520，右对齐、撑满高度），上压左浅右深暗色渐变。
- **H3** 文案：H1 两行 56px「Prediction markets, / with leverage.」（第二行柠檬 `#CFFF4A`），副标 15px「Think you know what happens next? Pick a topic, tap Yes or No.」，LIVE MARKETS 小标签。i18n key：`home_hero.heading_v2` / `sub_v2` / `sub_v2_mobile`。
- **H4** chip 行左边 = 品类；右边 = 视图开关 ⚡ Boost / ☆ Watchlist / ▦ Calendar。Boost 是筛选不是品类。
- **H5** Boost 行为不变（`boostOnly`）：只列能 Boost 的事件卡片、按品类分组；All 的五段不参与。
- **H6** Quick Play 横幅照生产组件（桌面 AB-1 / 手机 AB-2），不另画。

### S · Sports 段
- **S0** 细则以「Sports 规则稿 v2」为准：左 Live 模块 + 右一张表（Big this week 3 行 + Next up 填满）、四态、T3 瓷砖、日历条、一场只出现一次（舞台位 > 瓷砖 > Big this week > Next up）、直播标记一律橙色。
- **S1** 队标通用规则：所有队标都在同一个圆里（`TeamBadge`）。真队徽 contain 74% 不裁；数据源的纯色占位方块改画同色圆徽 + 白色短码；完全没图 = 灰底 + 短码。两队重叠 −5px。
- **S2** 舞台位不拉流（CPO 2026-11-09「点了才播」）：画面 = 一张静态图 + 橙色播放钮「Watch live」。点画面 = 播放：已登录 → 进该场交易页静音开播；游客 → 站内登录框（桌面弹窗 / 手机抽屉），登录成功后直接进该场交易页开播（含 Google 跳转回来），关掉登录框留在原页。比分、队名、价钮、Open match 照旧直接进交易页，不弹登录、不开播。Sports 品类页顶部舞台同此规则。交易页对游客不拉流，画面位放「Sign in to watch live」+ Sign in（登录后就地开播）。（字典 HA-15 / Sports 列表 EV-36 / 交易页 S10）
- **S3** 静态图按顺序取：① 直播截图——服务端对每路正在直播的流每 10 分钟截一帧，同一时段所有用户看同一张（字段 metadata.stream_thumb_url / stream_thumb_at）；② 还没截到 / 截图失败 → 这场赛事的封面图（events.image_url）；③ 封面也没有 → 深色底。三档都压暗、左上橙底 LIVE、不放队徽（下方比分行已有两队）。（字典 EV-38 封面兜底 / EV-39 深色兜底）

### C · Crypto 段
- **C1** 眉行「● Crypto · Up or Down · new round every 5 min」，后半句跟周期 tab：15 min / hour / 4 hours / day。
- **C2** 段头右侧：「This round closes in MM:SS」28px + 220px 进度条 ｜ 周期 tab 5m / 15m / 1h / 4h / 1D。三个币共用这一个钟。
- **C3** BTC 主卡（8 栏裸放）：₿ BTC · Round HH:MM → HH:MM · ● this round $x · 右上 Traded today；价格 84px；「+$x · +x.xx%」+「above/below the open · Up/Down wins if it closed now」。
- **C4** 图表（V1）：canvas；时间窗 = 过去 72% 轮长 + 未来 28%，随时间左移；NOW 竖虚线 + 未来淡区；收盘线进入窗口才出现（橙，closes HH:MM）；开盘虚线横贯，OPEN $ 标签最上层带底色；高于开盘青色面、低于开盘柠檬面；开盘前历史灰细线不算输赢；量程只看本轮；头点缓动 + 呼吸环；密点 3px 一桶平均；刻度 5m 每分钟 / 15m 3 分 / 1h 10 分 / 4h 1 小时 / 1D 3 小时。
- **C5** Up / Down 大钮 + 资金比例条（Up 青 / Down 柠檬）+ 两头百分比。
- **C6** Last 8 rounds：8 根小柱按结果上色，最新一根描边；右侧「Up won N · Down won N · last round Up/Down」。
- **C7** 右栏面板 ETH / SOL 两半等高：币 + 价格 + 涨跌 + closes HH:MM；小图 80px 同画法；Up ｜ 细比例条 ｜ Down。
- **C8** 到点结算：当前轮结束 → Last 8 推入结果 → 新一轮 open = 上轮收盘价，钟和进度条重置。

### K · Stocks 段
- **K1** 眉行「Stocks · Daily close · N markets today」，问句「Will it finish higher than it opened?」。
- **K2** 段头右侧：市场 tab 单行 US / Hong Kong / Korea（有数据才出，以后 CN 多一个），数量跟在名字后；下面一行状态：盘中「Market open · closes in X」、非盘中「Market opens in X」，后接「settles in Y」（Y = 下一个还没到的结算时间）；这一轮结算时间已过、引擎还没滚到下一轮时写「settling now」，不写「settles in 0s」。
- **K3** 清单：前 10，两列各 5，中间分隔线；每行 = 图标 26 · 代码 + 全名（不截断）· 走势小图 96×28 · 价格 + 相对 Base 涨跌 · Up / Down 88px。手机前 5、每只两行。
- **K4** 走势三种时刻：① 盘中实线；② 收盘后还在成交（美股盘后 / 夜盘）同色淡一半；③ 收盘后没成交（港股 / 韩股）不画图，价格旁写「Base price」。基准虚线 = 上次官方收盘价 = 这轮 Base。≤ 48 点。
- **K5** 涨 `#4ADE80` / 跌 `#F87171`，基准虚线橙。
- **K6** 底部：左「N of 10 trading above their base price right now」（没成交时不显示）；右「Show all N →」。

### E · Editor's Desk
- **E1** 独立一段，Stocks 与 More 之间；眉行「✦ Editor's Desk · N picks」（柠檬），问句「What's worth watching?」；不写署名 / 更新时间。
- **E2** 数据 = 运营后台 featured-markets（≤ 3，每个带 whyThis）；没配整段不出现。
- **E3** 三列等高、无分割线、56px 间距 + 01 / 02 / 03 大号灰字；每列 = 编号 + 眉行「品类 · 时间」、标题 ≤ 2 行、引号里的 whyThis ≤ 3 行、下单钮贴底 36px。
- **E4** 下单钮跟事件类型：涨跌轮 Up / Down；比赛两队名 + 价；多档两档胶囊 + 「+N more」。

### M · More 段
- **M1** 眉行「More markets · N open」，问句「Will it happen?」48px；不放列表入口、不写说明句；一行一个事件。
- **M2** 每行左 = 封面 120×72 + 眉行「品类 · N markets · Boost n×」+ 标题 ≤ 2 行 +「Vol $x · settles 日期」；右 520px 档位区。
- **M3** 多档：每档一条青 / 黄绿 Yes-No 比例条 + Yes n¢ / No n¢ 66px 钮，最多 4 条 + 「+N more outcomes →」；互斥型加「Outcomes are mutually exclusive — exactly one pays $1.」。
- **M4** 二元（B1）：大数字「34%」+「chance of Yes」+ Yes / No 110px 钮，不画条。
- **M5** 临近结算（< 48h）眉行写「closes in Xh」。

### G · 全局
- **G1** 段头 = 眉行 + 48px 问句，不要第三行说明；主块裸放、副块进面板；段间一根细线。
- **G2** Up / Yes 青 `#33D6FF`，Down / No 柠檬 `#CFFF4A`，直播与倒计时橙 `#FF8A3D`，股票绿红；全站规则性文案不在首页重复。
- **G3** 所有价钮 / 行 / 舞台位点击 = 进对应事件交易页；首页不下单、不播放。
- **G4** 手机版按手机习惯重做（MB 组）。

### MB · 手机版（390）
- **MB1** Hero 按设计师手机稿：居中两行 26px 标题 → 副标「Pick a topic, tap Yes or No.」→ 358×89 插画条（`/assets/mobile/hero-band@3x.png`，设计师稿 203:91054 整块导出：面板底 + 插画，3×，紧贴副标下方）；无标签。
- **MB2** 品类 chip 横滑；Quick Play 用 AB-2。
- **MB3** Sports：日历条横滑 → 舞台位 → 2 列瓷砖 → 面板只留 Big this week 3 行 → 「+N more this week ｜ All N matches →」。不列 Next up。有直播标记的 live 瓷砖去掉联赛名。
- **MB4** Crypto：钟 + 进度条整行 → tab → BTC 卡（价 48 / 图 150）→「BTC · last 8」紧贴图下、在 Up / Down 之前 → 比例条 → ETH / SOL 两张半卡。
- **MB5** Stocks：tab + 状态行 → 前 5，每只两行 → 底注「N of 5 above their base price · Show all N →」。
- **MB6** Editor's Desk 三条竖叠；More 封面 + 标题一行，多档每档名字独占一行、下面 bar + 58px 钮，二元 = 大数字 + 两钮整行。

## 3. 四态与判定（Sports）

| 状态 | 判定 | 舞台位 | 瓷砖 | 右表 / 手机面板 |
|---|---|---|---|---|
| ① 多场 live、多路直播 | `live.filter(streamUrl).length > 1` | 第一路直播 + ‹ Stream i / N › | Also live ≤ 4（▶ Stream 标）+ See all N live → | Big 3 + Next up 填满 / Big 3 |
| ② 1 场 live 有直播 | `streams.length === 1` | 直播预览（桌面静音播，手机品牌舞台）| Up next 4 | 同上 |
| ③ live 都没直播 | `live.length > 0 && streams.length === 0` | 无视频面，对阵 + 比分 | Also live N + Up next 补到 4 | 同上 |
| ④ 0 live | `live.length === 0` | 本周最大场（成交额）+ 开球倒计时 + ☆ Remind me | Up next 4 | 同上 |

`live` = `liveAt(m, now)`（每秒重算）；`upcoming` 按开球升序；Big this week = 剩余池按成交额前 3；Next up = 剩余池按开球；日历条只筛右表。

「Next up 填满」= 让右表和左栏一样高，按舞台位形态定行数：有视频面 8 行（再出「See all N live」整行钮时 9 行）；有 live 但没视频面 5 行；0 live 4 行。手机不列 Next up（MB3）。舞台位直播画面只在这场**有直播源**时出现（桌面静音播 / 手机与播放失败时品牌舞台）；live 但没有直播源的场次没有画面块，直接对阵 + 比分（状态③）。

## 4. 字段来源（Lovable 蓝本）

| 段 | hook / 表 | 字段 |
|---|---|---|
| Sports | `useSportsMatches()` → `events` + `metadata` | `kickoff_at / live / score / liveLabel / stream_url / volume / options[].price / home_abbr / away_abbr` |
| Crypto | `useQuickRounds()`（`CRYPTO_QUICK_UPDOWN_SPOT`） | `base_price`（open）/ `start_date` / `end_date` / `volume` / `event_options[].price`；`historyFor` = 已结算轮 `is_winner` |
| Crypto 现价 | `useArcadeLivePrices()`（Quick Play 流） | 用来把图表头锚到行情条同一个数 |
| Stocks | `useIntradayStocks()`（US / HK / KR 日轮） | `base_price` / `end_date` / `event_subtype` / `upPrice` / `downPrice`；盘别 `getStockSessionState(market, now)` |
| Editor's Desk | `useEditorPicks()`（`metadata.editorial.pick = true`） | `note`（whyThis）/ `rank` / `category` / `end_date`（新增进 select）/ `side_labels` / `event_options` |
| More | `useMarketListData()` 过滤 | 非 `SPORTS_MATCH`、非日轮 / 快轮、非 `ARCADE_UPDOWN_SPOT`（Quick Play 轮不进目录）；`children[]`（档位）/ `totalVolume` / `expiry` / `imageUrl` |
| Boost n× | `useCategoryBoostConfigs()` | `enabled && maxBoost ≥ 2` |

## 5. 真平台对接（后端 / 数据边界）

| 蓝本里的模拟 | 真平台换成 | 备注 |
|---|---|---|
| Crypto 价格路径 `roundSeries()`（按事件 id 播种的随机游走） | `/pub/event/crypto/rounds/current?interval=5m…1d` 的 `underlyingTrendPoints`（5s）+ `underlying.open / current` + `recentResults` | 画法 `RoundCanvas` 不变；5m 接口一币两轮（当前 + 下一轮），取 `startTime` 最早的一轮 |
| Stocks 走势 `printsFor()`（确定性游走）| `/pub/event/underlying/bars?assetCode=X&range=SINCE_CLOSE`（1 分钟收盘价） | 有 bars → 实线 / 淡线；bars 为空 → 「Base price」；美股盘后有 bars、港韩收盘后没有 |
| 市场列表 / 结算时间 | `/pub/event/daily-close/rounds/current`（`availableTotal` / `currentSessionCloseAt`）| tab 数量 = `availableTotal` |
| Traded today | 当前活轮 `volume` 之和 | 真平台取 `tradedTodayU` |
| Editor's Desk | `/pub/event/featured-markets`（`whyThis / imageUrl / category / event`） | ≤ 3，空则整段不出 |
| 直播截图（S3 ①） | **要新增**：直播服务对每路正在直播的流每 10 分钟截一帧存 CDN，赛事数据给 `metadata.stream_thumb_url`（图片地址）+ `stream_thumb_at`（截图时间）；所有用户共用同一张，用户端不碰直播流 | Lovable 没有截图服务：演示比赛都用同一路演示直播，`public/assets/streams/demo-01…11.jpg` 是从这路直播里截好的静帧，前端按「现在落在哪个 10 分钟格」挑图，效果同主网（`streamPicture.ts`）。没截图用 `events.image_url` 封面，再没有用深色底 |
| 直播只对已登录开放（S2 / R5） | 主网直播接口对游客不返回播放地址（或返回 401） | Lovable 前端判断：游客不请求流，交易页显示 Sign in to watch live |
| 队徽（S1） | 真队徽 URL；占位方块需后端给 `tileColor` 或前端四角采样 | 蓝本数据没有图，全部是短码圆徽 |

## 6. 验收表（Liya / 测试）

| # | 打开 | 应该看到 | 看什么 |
|---|---|---|---|
| 1 | `/` 桌面 1440 | Hero 整条横幅 + 两行标题；chip 行 Boost 在右边三个开关里 | 底图不糊、文案与 H3 一致、Boost 点开仍是网格 |
| 2 | `/` 往下 Sports 段 | 左舞台位 + 2×2 瓷砖，右面板 Big 3 + Next up；日历条在段头右 | 一场不重复；有直播时桌面在静音播、点视频进交易页 |
| 3 | Crypto 段 | 段头右钟 + 5 个 tab；BTC 84px 价、canvas 图在动；ETH / SOL 面板 | 切 tab 眉行文案变；OPEN 标签压在线上；Last 8 柱色 |
| 4 | Stocks 段 | US / Hong Kong tab + 一行状态；10 行两列；底注 | 美股盘中实线 / 盘后淡线；港股收盘后无图 + Base price |
| 5 | Editor's Desk / More | 三列等高；More 一行一个事件，多档条 + 二元大数字 | picks 没配时整段消失；Quick Play 30s / 1m 轮不在 More 里 |
| 6 | 手机 390 `/` | Hero 居中稿；Sports 单列无 Next up；Stocks 5 行两行式；BTC · last 8 在图下 | 没有省略号截断、没有横向滚动 |
| 7 | `/style-guide` → Events 列表 → 首页 All 视图 | HA-1…14 桌面 + 375 两帧；HA-R 台账 | 四栏表每行能对到规则编号 |

## 7. 代码坐标

- 样式：`src/components/lite/home/home-all.css`（`.hall` 桌面 / `.hall-m` 手机，字面量 = 画布 mock）
- 共用件：`homeAllShell.tsx`（SectionHead / Up / Down / Odds 钮 / TeamBadge / SportIcon）
- 五段：`HomeSportsSection.tsx` · `HomeCryptoSection.tsx` + `RoundCanvas.tsx` + `roundSeries.ts` · `HomeStocksSection.tsx` · `HomeDeskSection.tsx` · `HomeMoreSection.tsx`；组合 `HomeStage.tsx`
- 页面：`src/pages/lite/LiteEventsPage.tsx`（All 视图挂 `HomeStage`，长期事件传 `filtered`）；Hero `HomeHero.tsx`；chip 行 `LiteEventsHeader.tsx`
- 字典：`src/pages/StyleGuide/sections/HomeAllSection.tsx` + `preview/homeAllPreviews.tsx`；台账 `components/HomeRulesLedger.tsx`
- 骨架：`LiteEventsSkeletons.tsx`（首载 = Sports + Crypto 两段的骨架）
- 已删除：`HomeCryptoCard / HomeStocksCard / HomeSportsCard / HomeDeskCard`、目录板头 / 身份卡（`CatalogueHeaderRow / CatalogueIdentityCard / CatalogueMobileBanner`）
