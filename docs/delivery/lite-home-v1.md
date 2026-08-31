# Lite 主页（Home / Events 列表）— 交付说明 v1

> 本文档覆盖 Lite 主页 `/`（与 `/events` 同一 `LiteEventsPage`）2026-08-29 → 08-30 的全部七轮改动：HP-1 桌面改版（tape / hero / chips 通栏 / HomeStage 双栏 / 目录）、HP-1d sports 硬封顶、模块上方空白修复、HP-3 移动重排 + HP-3b + HP-3c（移动 stocks Up/Down 统一 crypto 规范）、ST-1 stocks 交易时段三态 + ST-1d seed 按交易日、SG-HP 状态字典轮（EV-1…EV-35 含 EV-9e，共 36 case + 几何总表）。
> Pro 面零改动。`LiteEventCard` / `src/lib/liteListBadges.ts` / 目录排序 / chips 语义顺序行为 / Footer 三行 FROZEN 均零改动。
> 研发以本文档为准；所有数值抄自代码常量并标注文件，无来源的一律进 §12「待核实」。

## 0. 读者须知

查什么去哪儿：
- 长什么样 → 生产页 `/`
- 什么时候变成什么样 → `/style-guide` → Lite → Events 列表 状态字典（每个 case 有「状态 / 触发条件 / 视觉 / 数据来源」表）
- 字段名、文案、公式、时间口径、术语 → `docs/copy-dictionary.md`（顶部有「Lite 术语对照表」）→ 本文档对应章节
- 设计法则（颜色轴、chip、overlay 对等）→ `DESIGN.md`
提问前先按上面顺序查一遍；查不到再提，提问时写明"我查了 X 没有"。

## 通俗导读

> 本节是给没读过正文的人的 3 分钟通俗解读；不替代正文、不构成需求依据，一切口径以正文为准。

### 一分钟看懂

旧版主页 = 一句问候语 + 一个 stage 组件 + 目录网格。新版 = 一条会滚的行情带 + 一块 hero + chips 通栏 + 四张卡的舞台 + 目录。

```text
桌面 1280                      移动 375（App.tsx max-w-md 壳）
┌──────── tape 42 ─────────┐   ┌──── tape 40 ────┐
│        hero 44px 标题     │   │ hero 文字 + lynx 带│
├──── chips 通栏（全出血）───┤   ├──── chips 通栏 ───┤
│ span8: Crypto  │ span4:  │   │ Crypto（3 卡纵排） │
│        Stocks  │ Sports  │   │ Stocks（5 行+展开）│
│        （吸高） │ Desk    │   │ Sports / Desk     │
├─── 目录 ALL MARKETS › ────┤   ├─ 目录横幅 110px ──┤
└─────── footer 三行 ───────┘   └───── footer ─────┘
```

### 一条完整故事线

1. 用户小 A 打开 `/`，最上面一条 tape 匀速左滚，依次是 BTC / ETH / SOL / NVDA / TSLA / AAPL / MSFT / META 的价格与涨跌。
2. 他点了 tape 上的 BTC，落到 `/spot?event=<roundId>`——tape 每个 cell 都是可点的。
3. 回到主页，hero 下面是 chips 通栏（All / Intraday / Sports … + Boost + Watchlist / Calendar），语义与旧版逐字节相同，只是换了个全出血深色容器。
4. 舞台第一张卡是 Crypto：一个模块级 ROUND dial 同时控制三个币（桌面 BTC 主 tile + ETH/SOL 副 tile，移动三张一样的 round 卡）。他按 `Up` → `/spot?event=…&side=up`。
5. 第二张卡是 Stocks · Closing today，有 US / HK 两个 tab。此刻是美股收盘后 30 分钟，行上写 `Closed ↑` 加一个禁用的 `Next session in 29:41`——这就是 settling 态，不能下单。
6. 再等半小时，同一行变成 `Last close $xxx` + `NEXT SESSION · opens 21:30` + 可点的 Up/Down——preSession，买的是**下一个**交易日那一轮。
7. 右栏是 Sports（最多 3 张 LiveCard + 预算内的行，其余全折进 `N more this week`）和 Editor's Desk（最多 3 条，0 条整卡不渲染）。
8. 最下面才是目录「Will it happen?」和 FROZEN 的三行 footer。

### 概念词典

| 概念 | 是什么 | 判定表达式 | 一句话类比 |
|---|---|---|---|
| tape | 页面最顶的一条单行滚动行情带，数据只来自本页已有的两条流 | `buildTapeItems(currentFor, tf, stockRows, tickSeconds)`，`items.length === 0 → null` | 电视台底部的滚动股价条 |
| stage | hero 与目录之间的四卡舞台（Crypto / Stocks / Sports / Desk） | `HomeStage`，桌面 12 栅格 `span 8` + `span 4`，移动单列 | 报纸头版的四个版块 |
| round | 一个有开盘价、有截止时刻、二选一（Up/Down）的短周期市场 | crypto：`currentFor.get(`${coin}-${tf}`)`；stocks：一个交易日一轮 | 一局有闹钟的猜涨跌 |
| session 三态 | 股票市场此刻能不能下单、买的是哪一轮 | `getStockSessionState(market).phase ∈ {live, settling, preSession}` | 商场：营业中 / 打烊盘点 / 明天的号已经能取 |
| 预算封顶 | Sports 卡最多显示几条，超出一律折进计数 | `budget = max(2, 5 − pinned.length) + extraRows` | 货架只有固定格数，多的进仓库 |
| 弹性吸收者 | 桌面左栏唯一会长高去和右栏对齐的卡 | `HomeStocksCard` 挂 `flex:1`（`HomeStage.tsx`） | 只有一块海绵负责吸掉多余空间 |

### 易混点辨析

1. **不是「tape 自己拉行情」，而是「tape 复用页面已有的两条流」**。tape 没有任何轮询，`buildTapeItems` 只读 `currentFor` 与 `stockRows`（`HomeTape.tsx` 头部注释）。
2. **不是「收盘后股票行就消失」，而是「收盘后先 settling 60 分不可下单，再进 preSession 卖下一轮」**。`SETTLING_MINUTES = 60`（`src/lib/usStockSessions.ts:506`）。
3. **不是「preSession 不能下单」，而是「preSession 可下单，标的是下一时段的 market」**。`tradable: true`（`usStockSessions.ts` preSession 分支）。
4. **不是「6 场 live 就渲 6 张 LiveCard」，而是「最多 3 张 pinned，第 4 场起降级成行、再超出折进 N more」**。`LIVE_MAX = 3`（`HomeSportsCard.tsx:16`）。
5. **不是「Editor's Desk 空了留空卡」，而是「整卡 null，Sports 拿 extraRows=2 补位」**。`HomeStage.tsx` `extraRows={picks.length === 0 ? 2 : 0}`。
6. **不是「HK 时间跟着用户时区」，而是「HK 文案硬编码 HKT，US 随查看者时区」**。见 §8。

### 用户视角

用户看到什么：
- 一条恒滚的行情带、一句 `What do you think happens next?`、四张卡、目录、footer。
- 股票行会自己从「可买」变「Closed ↑ + 倒计时」再变「Last close + 下一场开盘时刻」，不用刷新。
- Sports 卡的高度永远一样，看不出后台到底有几场球。

用户看不到什么：
- 内部相位名 `preSession` / `settling`（文案只出现 `Next session` / `Settled`）。
- tape 里被跳过的币种/股票（缺数据静默跳过，不留占位）。
- 任何 Pro 面入口。

## 1. 功能目标

把 Lite 主页从「问候语 + 单一 stage」改成一个可扫读的门户：顶部一条恒滚行情带建立"活着"的感知，hero 一句话说清玩法，chips 通栏保持既有导航语义，舞台用四张卡覆盖 Crypto / Stocks / Sports / 编辑精选四条动线，目录仍是全量市场入口。给谁用：Lite 面全部用户（含未登录）。关键约束：全站只有 `/trade` 与 `/spot` 两个交易页，主页所有可点元素只能进这两个页；桌面与移动是同一组件的两个分支，不是两套实现；Footer 三行与 `LiteEventCard` 为 FROZEN。

## 2. 状态机

### 2.a ST-1 · `StockSessionPhase`（`src/lib/usStockSessions.ts`）

| 相位 | 窗口 | `tradable` | 卖的是哪一轮 |
|---|---|---|---|
| `live` | 开盘 ≤ now < 收盘（交易日） | `true` | 当前时段 market |
| `settling` | 收盘 ≤ now < 收盘 + `SETTLING_MINUTES` | `false` | 无 |
| `preSession` | 收盘 + `SETTLING_MINUTES` ≤ now < 下一开盘 | `true` | 下一时段 market |

判定表达式（`getStockSessionState`，`usStockSessions.ts:556`）：
- `live`：`isTradingDay(market, now) && openMin <= minutes < closeMin`
- `settling`：`now < lastCloseAt + SETTLING_MINUTES * 60000`
- `preSession`：其余

常量与规则：
- `SETTLING_MINUTES = 60`（`usStockSessions.ts:506`）。
- `MARKET_HOLIDAYS: { us: [], hk: [], kr: [] }`（`usStockSessions.ts:509`）——交易所本地 `YYYY-MM-DD` 列表；空表时退化为纯周末规则。
- `isTradingDay`：`dow === 0 || dow === 6 → false`，否则查 `MARKET_HOLIDAYS[market.key]`。
- 周末：周五收盘 + 1h 起整个周末都是 `preSession`，`nextOpenAt` 走 `while (!isTradingDay(...)) fwd += 1` 落到下一个交易日开盘。
- 返回值字段：`phase / closeAt / lastCloseAt / settlingEndsAt / nextOpenAt / tradable`。
- 既有 `getMarketSession()` / `sessionWindowFor()` 语义零改动，Pro spot 与 `LiteStockChart` 不随 ST-1 变。

### 2.b Stocks 行四态（`HomeStocksCard.tsx`）

`const state: StockSessionPhase | "stale" = base == null ? "stale" : phase;`

| 态 | 触发 | 桌面行 | 移动行卡 |
|---|---|---|---|
| `live` | `phase === "live"` 且 `base != null` | 实时价 + 涨跌% + Up/Down（`minHeight 38`） | 价 + % + Up/Down（`minHeight 44`，grid 均分 gap 10） |
| `settling` | `phase === "settling"` | `Closed ↑/↓` 徽章 + 禁用 `Next session in {mm:ss}` | 同左，禁用条 `minHeight 34` |
| `preSession` | `phase === "preSession"` | `Last close {price}`（muted，无涨跌%）+ `NEXT SESSION · opens {HH:MM}` + 可点 Up/Down | `Last close` 小标 + 价 + Up/Down（行内不带 session 元信息，元信息在模块头） |
| `stale`（骨架 / 不可用） | `base == null` | 78×14 脉冲条 + `Unavailable` 禁用条 | `—` + `Unavailable` 禁用条 |

模块头 `settleLine` 六组合（`HomeStocksCard.tsx` `settleLine` memo）：

| 相位 | US | HK |
|---|---|---|
| live | `US settles at close {HH:MM}` | `HK settles at close 16:00 HKT` |
| settling | `Settled · next session in {mm:ss}` | 同 US（不分市场） |
| preSession | `Next session · US opens {HH:MM}` | `Next session · HK opens 09:30 HKT` |

桌面头右端渲染 `{total} stocks · {settleLine}`；移动渲染成一行 `● {settleLine}`（`●` 为 CYAN）。

### 2.c tape 三态（`HomeTape.tsx` + `LiteEventsPage.tsx`）

| 态 | 判定 | 渲染 |
|---|---|---|
| 首载骨架 | `tapeLoading = (roundsLoading && currentFor.size === 0) \|\| (stocksLoading && stockRows.length === 0)` | `HomeTapeSkeleton`，桌面 42 / 移动 40，与终态等高（零 CLS） |
| 部分缺数据 | 单个 coin 或 ticker `!ev \|\| base_price == null` → `continue` | 静默跳过该 cell，不留占位 |
| 全失败 | `items.length === 0` | `return null`，整条 tape 不渲染 |

固定内容序（非数据驱动）：`CRYPTO_ORDER = ["btc","eth","sol"]`、`EQUITY_ORDER = ["NVDA","TSLA","AAPL","MSFT","META"]`（`HomeTape.tsx:25-26`）。

### 2.d hero 断点态（`HomeHero.tsx`）

| 态 | 判定 | 形态 |
|---|---|---|
| 桌面 | `isMobile === false` | 左文右图，`/assets/desktop/hero-lynx.png`；h1 `fontSize 44 / lineHeight 1.08` |
| 移动 | `isMobile === true` | 居中文字栈 + 下方 `/assets/mobile/hero-lynx.png` 横带，带高 90；h1 `fontSize 27 / lineHeight 1.14` |
| 窄屏 | `window.innerWidth < 390`（`narrow`） | 同移动，横带高降为 78 |

### 2.e Sports 卡封顶（`HomeSportsCard.tsx`）

```text
pinned    = live.slice(0, LIVE_MAX)                      // LIVE_MAX = 3
budget    = max(2, 5 − pinned.length) + extraRows        // extraRows: picks=0 → 2
liveRows  = live.slice(LIVE_MAX, LIVE_MAX + budget)      // 降级 live 优先占行
rows      = upcoming.slice(0, max(0, budget − liveRows.length))
shown     = pinned.length + liveRows.length + rows.length
more      = max(0, weekTotal + live.length − shown)      // → "N more this week"
```
`weekTotal = strip.find(d => d.id === "all")?.count ?? upcoming.length`。空态：`weekTotal === 0 && live.length === 0 → return null`（整卡不渲染，即 EV-9e）。因为 pinned 上限 3、budget 下限 2，**6 场同时 live 与 3 场 live 的卡高相等**。

### 2.f Editor's Desk

`HomeDeskCard` 首行 `if (picks.length === 0) return null;`；条数上限 `MAX_PICKS = 3`（`src/components/lite/picks/editorialPicks.ts:25`）；数据来源 `events.metadata.editorial`。整卡缺席时 Sports 拿 `extraRows = 2` 补位（`HomeStage.tsx`）。

## 3. 数据源与后端语义

| 流 | Hook / 函数 | 说明 |
|---|---|---|
| crypto 快轮 | `useQuickRounds(stageActive)` | `currentFor: Map<"{coin}-{tf}", QuickEvent>`、`historyFor: Map<key, ("up"\|"down")[]>` |
| 日收盘股票 | `useIntradayStocks(stageActive)` | `rows: StockEventRow[]`，按 `event_subtype` 分 US / HK |
| 体育 | `useSportsMatches()` | `rows: SportsMatch[]`（live / kickoff / options） |
| 编辑精选 | `useEditorPicks()` | 读 `events.metadata.editorial`，`MAX_PICKS = 3` |
| 目录 | `useActiveEvents()` | 挂载一次，无轮询 |

tape 不自带数据源：crypto 用快轮流、equity 用日收盘股票事件（`HomeTape.tsx` 文件头注释「No polling of its own」）。`stageActive = true` 常开（`LiteEventsPage.tsx:347`），因为 tape 在任何视图下都需要这两条流。

`sim-daily-seed`（`supabase/functions/sim-daily-seed/index.ts`）：
- 下一时段 market 的 `start_date = 上一交易日收盘 + 1h`（`const openStart = new Date(prevClose.getTime() + 3600_000)`，第 173 行；写入见第 231 行），与 `SETTLING_MINUTES = 60` 对齐 → 每天只有收盘后 1 小时不可交易。
- 非交易日跳过（周末 + `MARKET_HOLIDAYS` 钩子，US 日历），周末不产市场；跨周末时窗口自然拉长。

前端需要后端保证的字段（不在此定义接口）：`event_subtype`（US / HK 股票分流与目录排除赛果类）、`start_date` / `end_date` / `freeze_time`（轮次窗口与倒计时）、`lifecycle_status`（下单可用性）、`metadata.editorial`（Editor's Desk）、`side_labels`（Yes/No 侧命名）。

## 4. 用户端流程

### 4.1 桌面模块序（`LiteEventsPage.tsx`）

1. `EventsDesktopHeader`
2. `HomeTape`（全出血，高 42）
3. `HomeHero`（全出血）
4. chips 通栏条（全出血深色鞍 `#08090D`，上下 1px 分隔，内容 `max-w-7xl` + `px-4 lg:px-6`，`paddingTop/Bottom 8`）
5. `HomeStage` 12 栅格 `gap 24 / marginTop 16`：
   - 左 `span 8`：`HomeCryptoCard`（`flex:none`）→ `marginTop 24` → `HomeStocksCard`（`flex:1`，唯一吸高者）
   - 右 `span 4`（`gap 24`）：`HomeSportsCard` → `HomeDeskCard`
6. 目录板头 `CatalogueHeaderRow`（`ALL MARKETS ›` + 右端 `{n} open`）+ 目录网格
7. Footer 三行（FROZEN）

### 4.2 移动模块序

1. `MobileHeader variant="brand"`
2. `HomeTape`（高 40）
3. `HomeHero`：文字栈在上、lynx 横带在下（90 / <390 时 78）
4. chips 通栏条（`px-4`）
5. `HomeStage` 单列 `gap 14 / marginTop 10`：
   - `HomeCryptoCard`：三张同版式 round 卡纵排（`gap 10`），每卡头右侧橙色 `Closes` 标 + `mm:ss` 倒计时（`Closes` 由 `textTransform: uppercase` 呈现为大写）
   - `HomeStocksCard`：行卡默认 5 行（`MOBILE_ROWS = 5`）+ `Show all {n} →` / `Show less`
   - `HomeSportsCard`：day-strip + LiveCard + 移动 kickoff 左列卡片行 + stacked 赔率钮
   - `HomeDeskCard`
6. 目录 `CatalogueMobileBanner`（高 110）+ 目录列表
7. Footer 三行（FROZEN）

### 4.3 可点元素去向表

| 元素 | 去向 |
|---|---|
| tape cell | `/spot?event={id}` |
| Crypto 卡 Up / Down（桌面 tile、移动 round 卡） | `/spot?event={id}&side=up\|down` |
| Stocks 行整行 / Enter 键 | `/spot?event={id}` |
| Stocks 行 Up / Down | `/spot?event={id}&side=up\|down` |
| Sports LiveCard / 行 赔率钮 | `/trade?event={id}&option={optionId}` |
| Sports `All N matches →` | 页内 `setSector("sports")`（不离开 `/`） |
| Editor's Desk 单侧钮 | `pickHref(pick, optionId)` → `/trade` 或 `/spot`（由 `editorialPicks.ts` 判定） |
| Editor's Desk `+N markets →` | `pickHref(pick)` |
| 目录卡 | 既有 `LiteEventCard` 行为（FROZEN，零改动） |

全部落点只有 `/trade` 与 `/spot` 两个交易页，符合单一交易页纪律。

### 4.4 chips 通栏条

chips 的内容、顺序、回调逐字节不变（`chipsRow` 变量整体复用，桌面 `LiteEventsFilterRow`、移动 `MobileCategoryRow`），本轮只把它包进一个全出血深色容器。语义不动：品类 pill → 分隔竖线 → `Boost` TraitChip（`calendarOn` 时隐藏）→ 右端 `WatchlistChip` + `CalendarChip`。

## 5. 版式几何契约

几何数值不在本文复述，只索引：`/style-guide` → Lite → Events 列表页的「版式几何总表」与五张模块几何表——

| 模块 | 几何表 |
|---|---|
| 行情 tape | EV-33 几何表 · `HomeTape` |
| Crypto 卡 | EV-5 几何表 · `HomeCryptoCard` |
| Stocks 卡 | EV-7 几何表 · `HomeStocksCard`（全页唯一弹性吸收者） |
| Sports 卡 | EV-9 / EV-31 几何表 · `HomeSportsCard` |
| Editor's Desk | EV-32 几何表 · `HomeDeskCard` |
| 目录带头 | EV-34 / EV-35 几何表 · `CatalogueHeaderRow` / `CatalogueIdentityCard` / `CatalogueMobileBanner` |

判据宽度：桌面 1280、移动 375。移动壳为 `App.tsx:76` 的 `max-w-md mx-auto`（footer 用 `[&_footer]:w-screen` 破壳全宽）。`isMobile` 判定 = `useIsMobile()`，断点 `MOBILE_BREAKPOINT = 768`（`src/hooks/use-mobile.tsx:3`），初值 `undefined` 防竞态。

## 6. 已删除 / 已废弃

| 项 | 状态 | 研发动作 |
|---|---|---|
| `LiteAllStage` | 主页不再挂载，由 `HomeStage` 取代 | 不要新增引用 |
| `LiteMobileAllStage`（`src/components/lite/mobile/LiteMobileAllStage.tsx`） | 主页不再挂载 | 文件仍在仓库，视为历史；不要新增引用 |
| `LiteEventsGreeting`（`LiteEventsHeader.tsx`） | 被 `HomeHero` 取代 | 不要恢复问候语条 |
| All 视图独立 `EditorPicksModule` 挂载 | 由 `HomeDeskCard` 取代 | 精选只走 `HomeDeskCard` |
| `IntradayBand` | 文件已不存在 | memory `lite-intraday-band.md` 仅作历史 |
| 旧 home feed（`home-feed-architecture.md` / `home-page-purpose.md`） | 已退役 | 不作为需求依据 |
| ASLEEP 态 | 不采纳 | 股票只有 live / settling / preSession / stale |
| `Not up` | 已退役词 | 一律写 `Down` |
| 现网旧文案 `US settles at close 21:30` | 已消失（改由 `session.closeAt` 推导） | 禁止硬编码收盘钟点（HK `16:00 HKT` 除外，见 §8） |

## 7. 状态索引

模块 → `/style-guide` Lite → Events 列表 的 preview key（key 抄自 `src/pages/StyleGuide/preview/registry.tsx`；`homeStage` = `homeStagePreviews.tsx`，`events` = `eventsPreviews.tsx`，`liteEvents` = `liteEventsPreviews.tsx`）。

| Case | 模块 | preview key | 来源文件 |
|---|---|---|---|
| EV-1 | Hero（HomeHero · HP-1） | `events-ev1` | homeStagePreviews `Ev1Preview` |
| EV-2 | 筛选行 · All 默认 | `events-ev2` | eventsPreviews `Ev2Preview` |
| EV-3 | 筛选行 · sector 选中 | `events-ev3` | eventsPreviews `Ev3Preview` |
| EV-4 | 筛选行 · Boost ON | `events-ev4` | eventsPreviews `Ev4Preview` |
| EV-5 | Crypto 卡默认 | `events-ev5` | homeStagePreviews `Ev5Preview` |
| EV-6 | ROUND dial 选中 1h | `events-ev6` | homeStagePreviews `Ev6Preview` |
| EV-7 | Stocks 卡 · live | `events-ev7` | homeStagePreviews `Ev7Preview` |
| EV-8 | Stocks 卡 · settling | `events-ev8` | homeStagePreviews `Ev8Preview` |
| EV-9 | Sports 卡默认 | `events-ev9` | homeStagePreviews `Ev9Preview` |
| EV-9e | Sports 卡空态（整卡 null） | `events-ev9e` | homeStagePreviews `Ev9ePreview` |
| EV-10 | day-rail 过滤 | `events-ev10` | homeStagePreviews `Ev10Preview` |
| EV-11 | binary 卡 · 无徽标 | `events-ev11` | eventsPreviews `Ev11Preview` |
| EV-12 | multi 卡 · 无徽标 | `events-ev12` | eventsPreviews `Ev12Preview` |
| EV-13 | 徽标 · Ends soon | `events-ev13` | eventsPreviews `Ev13Preview` |
| EV-14 | 徽标 · New | `events-ev14` | eventsPreviews `Ev14Preview` |
| EV-15 | 徽标 · Trending | `events-ev15` | eventsPreviews `Ev15Preview` |
| EV-16 | 徽标 · Boost n× | `events-ev16` | eventsPreviews `Ev16Preview` |
| EV-17 | 徽标组合 · 两枚上限 | `events-ev17` | eventsPreviews `Ev17Preview` |
| EV-18 | 网格断点 | `events-ev18` | eventsPreviews `Ev18Preview` |
| EV-19 | Calendar · Week | `events-ev19` | eventsPreviews `Ev19Preview` |
| EV-20 | Calendar · Day | `events-ev20` | eventsPreviews `Ev20Preview` |
| EV-21 | Watchlist · 未登录 | `events-ev21` | eventsPreviews `Ev21Preview` |
| EV-22 | Watchlist · 空 | `events-ev22` | eventsPreviews `Ev22Preview` |
| EV-23 | Watchlist · 有内容 | `events-ev23` | eventsPreviews `Ev23Preview` |
| EV-24 | 列表首载骨架 | `events-ev24`（旧深链 `lite-events-loading` 保留） | homeStagePreviews `Ev24Preview` / liteEventsPreviews `LiteEventsLoadingPreview` |
| EV-25 | 目录首载骨架 | `events-ev25`（旧深链 `lite-events-loading-catalogue` 保留） | homeStagePreviews `Ev25Preview` / liteEventsPreviews `LiteEventsCatalogueLoadingPreview` |
| EV-26 | sector 空态 | `events-ev26` | eventsPreviews `Ev26Preview` |
| EV-27 | Stocks 卡 · preSession | `events-ev27` | homeStagePreviews `Ev27Preview` |
| EV-28 | US / HK tab 独立 | `events-ev28` | homeStagePreviews `Ev28Preview` |
| EV-29 | Stocks 移动形态 | `events-ev29` | homeStagePreviews `Ev29Preview` |
| EV-30 | Stocks 骨架 / 单行失败 | `events-ev30` | homeStagePreviews `Ev30Preview` |
| EV-31 | Sports 预算封顶（6 场同时 live） | `events-ev31` | homeStagePreviews `Ev31Preview` |
| EV-32 | Editor's Desk | `events-ev32` | homeStagePreviews `Ev32Preview` |
| EV-33 | 行情 tape（HP-1c 恒滚） | `events-ev33` | homeStagePreviews `Ev33Preview` |
| EV-34 | 目录板头 | `events-ev34` | homeStagePreviews `Ev34Preview` |
| EV-35 | 目录身份卡 | `events-ev35` | homeStagePreviews `Ev35Preview` |

共 36 case（EV-1…EV-35 + EV-9e）。工单提到的「EV-36」在代码里不存在，见 §12。

## 8. 时间与时区口径

- 全站 R1–R3（`usStockSessions.ts` 注释）：R1 每个展示给用户的钟点用查看者本地时区、**无时区后缀**（`formatLocalTime`，24h）；R2 场所名词（`HK close` / `US session`）保留；R3 星期词从同一本地时间戳再派生（`formatLocalStamp` / `formatLocalDate`）。
- ST-1 例外：HK 文案硬编码 `HKT`（`HK settles at close 16:00 HKT` / `Next session · HK opens 09:30 HKT`），US 随查看者时区由 `formatLocalTime(session.closeAt / session.nextOpenAt)` 推导。详见 `docs/copy-dictionary.md` §「Stocks · 交易时段（ST-1）」与 `/style-guide` Foundations §5。
- 倒计时与时长不涉时区：`formatMinuteCountdown()` 输出 `mm:ss`（`usStockSessions.ts:615`），crypto 卡 `Closes` 用 `formatCountdown()`。
- 三态每秒 tick 重算：`useSecondTick()` 驱动 `tickSeconds`，`getStockSessionState()` 每次重算，态间自动翻转无需刷新，只切换受影响字段。
- Sports 日期胶囊：`TODAY` / `{WEEKDAY} {D}`（`buildDayStrip`，`sportsData.ts:248-249`），weekday 由本地时间派生。

## 9. 实时刷新口径

| 源 | 节奏 | 代码 |
|---|---|---|
| tape 循环动画 | `--duration = max(20, scrollWidth / 60)` 秒，`linear infinite`，`translateX(0 → −50%)` | `HomeTape.tsx`；`.lite-tape-rail` / `@keyframes lite-tape-scroll`（`src/index.css:739-748`），`prefers-reduced-motion: reduce → animation: none` |
| crypto 快轮 | 20s 轮询 + 到期看门狗（1s 检查 `end_date <= now` 触发一次重取） | `intradayData.ts:128` / `:137` |
| sports | 30s | `sportsData.ts:119` |
| stocks 状态机 | 1s tick（`useSecondTick`） | `intradayData.ts:403` |
| 目录 `useActiveEvents` | 挂载一次，无轮询 | `src/hooks/useActiveEvents.ts` |

行为细节以 `docs/delivery/lite-behavior-appendix.md` §3 为准。

## 10. 涉及文件

前端（新增）
- `src/components/lite/home/HomeTape.tsx`
- `src/components/lite/home/HomeHero.tsx`
- `src/components/lite/home/homeShell.tsx`
- `src/components/lite/home/HomeCryptoCard.tsx`
- `src/components/lite/home/HomeStocksCard.tsx`
- `src/components/lite/home/HomeSportsCard.tsx`
- `src/components/lite/home/HomeDeskCard.tsx`
- `src/components/lite/home/HomeStage.tsx`

前端（修改）
- `src/pages/lite/LiteEventsPage.tsx`（tape / hero / chips 通栏 / HomeStage / `CatalogueHeaderRow` / `CatalogueMobileBanner` / `stageActive = true`）
- `src/lib/usStockSessions.ts`（ST-1 状态机、`SETTLING_MINUTES`、`MARKET_HOLIDAYS`、`formatMinuteCountdown`）
- `src/pages/lite/LiteSpotTrade.tsx`（股票事件三态：settling 禁单 + 结算横幅；preSession 可下单 + `NEXT SESSION` 标）
- `src/components/lite/picks/editorialPicks.ts`（新增 `optionCount`）
- `src/index.css`（`lite-tape-scroll` keyframes + reduced-motion）

Style Guide（本轮只读引用，不在本单改动）
- `src/pages/StyleGuide/sections/EventsStatesSection.tsx`
- `src/pages/StyleGuide/preview/homeStagePreviews.tsx` / `eventsPreviews.tsx` / `liteEventsPreviews.tsx` / `registry.tsx`
- `src/pages/StyleGuide/sections/pages/LiteEventsPage.tsx`

文档
- `docs/delivery/lite-home-v1.md`（本文）
- `docs/copy-dictionary.md`（新增「Home (`/`, Lite)」节）
- `docs/changelog/INDEX.md` / `docs/changelog/STATUS.md`

Supabase
- `supabase/functions/sim-daily-seed/index.ts`（`start_date = 上一交易日收盘 + 1h`，非交易日跳过）

## 11. QA 验收 checklist

- [ ] 1280 桌面：tape → hero → chips 通栏 → 左栏 Crypto+Stocks / 右栏 Sports+Desk → 目录板头 → footer，顺序与 §4.1 一致。
- [ ] 1280：左右两栏底部齐平（Stocks 卡为唯一吸高者）。
- [ ] 375 移动：模块序与 §4.2 一致；Crypto 三卡等版式；Stocks 默认 5 行且 `Show all {n} →` 可展开可收起。
- [ ] tape：匀速左滚无跳帧；`prefers-reduced-motion: reduce` 下静止。
- [ ] tape：断掉某一币种数据 → 该 cell 静默消失，其余顺序不变；全部无数据 → 整条不渲染；首载显示等高骨架。
- [ ] Stocks live 态：可点 Up/Down，模块头 `US settles at close {HH:MM}` / `HK settles at close 16:00 HKT`。
- [ ] Stocks settling 态：`Closed ↑/↓` 徽章 + 禁用 `Next session in {mm:ss}`，倒计时逐秒走；模块头 `Settled · next session in {mm:ss}`。
- [ ] Stocks preSession 态：`Last close {price}`（无涨跌%）+ `NEXT SESSION · opens {HH:MM}` + Up/Down 可点。
- [ ] 周末态：周五收盘 +1h 后全程 preSession，`opens` 指向下一个交易日开盘。
- [ ] Sports：3 场 live 与 6 场 live 卡高一致；溢出（含 live 溢出）全部计入 `N more this week`。
- [ ] Editor's Desk 0 条 → 整卡不渲染，Sports 多出 2 行补位。
- [ ] 全部可点元素落点符合 §4.3（只进 `/trade` 或 `/spot`）。
- [ ] chips 语义、顺序、回调与改版前逐项一致。
- [ ] Footer 三行逐字与 FROZEN 稿一致。
- [ ] 禁词扫描：页面无 `Margin` / `Liquidation` / `Funding` / `Leverage` / `Long` / `Short` / `Order book` / `Limit`（账户名词场景豁免），无 `Not up`，无 ` v `（用 ` vs `），无 `Back`（下注义）。

## 12. 待决策 / 未实现

| # | 项 | 状态 |
|---|---|---|
| 1 | `MARKET_HOLIDAYS` 为空表（`us/hk/kr: []`），仅退化为周末规则 | 等 CPO 给 US / HK 休市日历后填入 |
| 2 | `live` / `settling` 两态未在真实时钟窗口内截图取证（取证时段恰为 preSession） | 待盘中复测 |
| 3 | `picks = 0` 空态与盘中收盘瞬间的翻转未做真实实测 | 待复测 |
| 4 | preSession 下单的归属（落到下一时段 market）未做端到端实验 | 待验证 |
| 5 | 真平台仍出现已退役词 `Not up` | 待定位并清理 |

待核实（工单给的口径与代码不一致，未按工单值写入正文）：

| 项 | 工单说法 | 代码实际 | 处置 |
|---|---|---|---|
| stocks 行第二态文案 | `Opens in H:MM` | `NEXT SESSION · opens {HH:MM}`（桌面）/ 行内无 session 文案（移动，元信息在模块头） | 正文按代码写，`Opens in H:MM` 未在代码中出现 |
| EV 编号上限 | `EV-1…36` | 代码只有 EV-1…EV-35 + EV-9e = 36 个 case，无 `EV-36` 这一编号 | 正文按 case 总数 36 描述 |
| tape equity 序列 | `NVDA→TSLA→AAPL→MSFT→META`（HP-1 纪要同） | 同左，`EQUITY_ORDER`（`HomeTape.tsx:26`） | 一致 |
| tape 循环时长 | 「45 秒恒滚」 | `duration = max(20, scrollWidth / 60)`，随轨宽变动（注释标 ≈45s/圈） | 正文按公式写，不写固定 45s |

## 13. 未变更项

- Pro 面（`/trade` DesktopTrading、`/spot` SpotTrading）零改动；Pro spot 有意不同步 ST-1。
- `LiteEventCard`、`src/lib/liteListBadges.ts`、目录排序与筛选逻辑零改动。
- chips 的内容、顺序、回调零改动（仅换容器）。
- Footer 三行 FROZEN 未触碰。
- `getMarketSession()` / `sessionWindowFor()` 语义零改动；`LiteStockChart`、`MobileIntradayModule` 等共享消费方行为不变。
- Watchlist / Calendar 视图、空态文案零改动。
- 未新增任何 guest 可见的 Pro 入口。
