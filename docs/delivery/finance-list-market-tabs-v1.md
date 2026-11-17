# Finance 列表与 Intraday 列表：市场页签 + 一行开盘状态 — 交付说明 v1（2026-11-17）

> **通俗导读**：Events 页 Finance 列表右上角，原来每个正在开盘的市场各占一个胶囊（`KR session open  closes 14:30 · 1h 5m left`），两个市场同时开盘就排两个，再加市场会更挤。这次改成和首页 Stocks 模块同一种写法：一组带数量的市场页签，下面一行开盘状态。原来 Asset class、Region 两排筛选按钮不再显示。Intraday 列表（桌面）里股票那一段用的是同一种胶囊，也一起换成同一套页签和状态行。

## 改前改后

这一节给所有人看：原来什么样、现在什么样。后面的章节是给研发和测试的细则。

| 排 | 位置 | 改前 | 改后 |
| --- | --- | --- | --- |
| ① | 页头右上（桌面） | 每个开盘的市场一个胶囊：KR session open closes 14:30 · 1h 5m left，几个市场开盘排几个 | 市场页签 All 69 · US 50 · Hong Kong 12 · Korea 7（开盘的市场名前带橙点）+ 下面一行状态 |
| ② | 状态那一行 · 选 All | 没有 | 有市场开盘：2 markets open；都没开盘：Markets closed · Hong Kong opens in 3h 30m |
| ③ | 状态那一行 · 选了某个市场 | 没有 | 开盘：Market open · closes in 3h 30m · settles in 3h 45m；没开盘：Market opens in 10h 10m · settles in 16h 55m（和首页同一句） |
| ④ | 收盘时间的写法 | 写几点收盘 + 还剩多久（closes 14:30 · 1h 5m left） | 只写还剩多久 |
| ⑤ | Region 一排按钮（All regions / US / Hong Kong / China / Korea） | 页头下面单独一排 | 没有了，换成右上的市场页签；Hong Kong / China 写成 Hong Kong |
| ⑥ | Asset class 一排按钮（All / Indices / Stocks / Commodities / FX） | 页头下面单独一排 | 先隐藏（现在只有股票有市场），列表按 All 显示 |
| ⑦ | 列表底部那一行（Showing 2 of 4 Korea names、New York opens Tue 22:30） | 显示 | 整行不显示（页签上已有数量，状态行已写多久后开盘） |
| ⑧ | 手机 | 不显示任何开盘状态 | 状态那一行在页头副标题下面（有市场开盘时前面带橙点），页签在它下面单独一排 |
| ⑨ | 页头小标题和副标题那句 | 切了语言仍是英文 | 跟着语言走（用的是已有的翻译） |
| ⑩ | 从首页 Stocks 模块点 Show all 进来 | 页面滚到第一行股票，页头和选中的市场在屏幕上方看不到 | 页面滚到 Finance 页头，能看到选中的是哪个市场 |
| ⑪ | 选中的市场今天一轮都没有 | 页签下面一片空白 | 猞猁兜底图 + No Korea stock rounds today + 一句提示 |
| ⑫ | Intraday 列表 · 股票段右上（桌面） | 每个开盘的市场一个胶囊：HK session open closes 16:00 · 1h 22m left；所有市场的股票混在一起，不能按市场看 | 和 Finance 同一套：市场页签 + 一行状态；点页签只看该市场的股票 |
| ⑬ | Intraday 列表 · 分隔线 ASLEEP UNTIL THEIR MARKET OPENS | 线右边写 New York opens Tue 22:30 | 分隔线保留，右边不再写字 |
| ⑭ | Intraday 列表 · 股票段最底下一行 | 69 names · 19 trading now, 50 asleep. Crypto rounds never stop. | 不显示 |
| ⑮ | Intraday 列表 · 股票段副标题那句 | 切了语言仍是英文 | 跟着语言走 |
| ⑯ | 两个列表的股票行 · 窄桌面（约 1024 宽） | 两列并排，韩股那行的代码和价格叠在一起（005930.KR 压到 ₩196,962） | 每行不够 540px 宽时改成一列，代码和价格不再重叠；1200 宽以上仍是两列 |

截图在 Lark 交付文档的同一节。

## 0. 查什么去哪儿

- 长什么样 → 生产页：`/events?sector=finance`（Events 页顶部品类选 Finance）、`/events?sector=intraday`（选 Intraday，往下到股票那一段）
- 什么时候变成什么样 → `/style-guide` → Events 列表 · 状态字典 → `EV-48` / `EV-48b` / `EV-48c` / `EV-48d` / `EV-48e` / `EV-48f`（Finance），`EV-49` / `EV-49b` / `EV-49c` / `EV-49d` / `EV-49e`（Intraday 股票段，只有桌面）
- 字段、文案、术语 → `docs/copy-dictionary.md` 的「Stocks · 交易时段」一节末尾 → 本文；术语对照见词典顶部「Lite 术语对照表」
- 规范 → `DESIGN.md` §Addendum 2026-11-17 · Finance 列表页头

## 0.1 字典怎么看

| 步 | 做什么 | 看到什么 |
|---|---|---|
| 1 | 打开 `https://omenxv2.lovable.app/style-guide`（不用登录） | 左侧选「Events 列表 · 状态字典」 |
| 2 | 页头搜索框敲 `EV-48` | 六张样张，桌面一排、手机一排 |
| 3 | 每张样张下面的表 | 「状态 / 触发条件 / 视觉 / 数据来源」 |
| 4 | 单张看 | `/style-guide/preview?c=events-ev48`（另有 `events-ev48b` … `events-ev48f`） |

这些样张的时间是定住的：EV-48 / 48e 是美股开盘、港股没开；EV-48b / 48d 是港股和韩股同时开盘；EV-48c 是都收盘；EV-48f 是选中 Korea、而当天 Korea 没有股票轮。

## 1. 市场页签

| 项 | 规则 |
|---|---|
| 有哪些页签 | 最前面一个 `All`，后面是今天有股票轮的市场，顺序固定 US → Hong Kong → Korea。今天一轮都没有的市场不出页签；例外：从首页「Show all」带着某个市场进来时，该市场即使 0 轮也显示（数量写 0） |
| 数量 | 选中该页签后下面列出的股票行数：一只股票算一行（同一只股票有多轮时只算当前这一轮），已收盘还没换到下一轮的也算；`All` = 各市场合计 |
| 橙点 | 市场正在开盘（有交易中的轮）时，名字前面一个 6px 橙点。`All` 不带 |
| 点页签 | 下面的股票行、以及更下面「What else could the markets do?」的长期事件，都只留该市场的；状态那一行换成该市场那句 |
| 默认 | `All`；从首页 Stocks 模块「Show all N」进来默认选中对应市场，页面滚到 Finance 页头（留出顶部导航的高度），不再滚到第一行股票。只滚这一次：之后再点顶部的 Finance 品类不会再滚。地址栏不带市场，刷新后回到 `All` |
| 一个股票轮都没有 | 页签和状态行都不出；如果当时选着某个市场，自动回到 `All` |
| 选中的市场今天 0 轮、别的市场有 | 该页签显示 0，没有状态行；下面放空态：猞猁兜底图（`empty-no-boost`）+ `No {{market}} stock rounds today` + `Pick another market above, or check back on the next trading day.`。该市场有长期事件可列时不出空态，直接列长期事件 |
| Boost 开关打开 | 页签不带数量，不出状态行（Boost 模式下股票行本来就不显示）；开盘市场的橙点仍在 |

## 2. 状态那一行

| 选中 | 条件 | 显示 |
|---|---|---|
| All | 至少一个市场开盘 | `1 market open` / `2 markets open`（只报数量） |
| All | 都没开盘 | `Markets closed · Hong Kong opens in 3h 30m`——报最先开盘的市场和还有多久 |
| 某个市场 | 开盘中 | `Market open · closes in 3h 30m · settles in 3h 45m` |
| 某个市场 | 没开盘 | `Market opens in 10h 10m · settles in 16h 55m` |
| 某个市场 | 该市场今天 0 轮 | 不显示 |

- 时间只写还剩多久：≥ 1 小时写 `3h 30m`，不足 1 小时写 `45m`。开盘 / 收盘时间按整分钟算，所以最后一分钟一直写 `1m`；结算时间精确到秒，不足 1 分钟写 `20s`。
- `settles in` = 该市场各轮结算时间里最近的一个（`expected_settlement_time`；没有该字段时按收盘 + 15 分钟）。都已经过了写 `· settling now`。和首页 Stocks 模块同一规则。
- 「开盘」的判定和下面股票行分「交易中 / 未开盘」用的是同一个（`groupStockRows` 的 `openSessions`），所以橙点、状态行、股票行三处不会对不上。交易所还在交易时间、但该市场今天的轮都已经结束时，按没开盘处理（没有橙点，写 `Market opens in …`）。
- 正常数据下结算时间一定在收盘之后；如果某一轮的结算时间早于收盘，状态行照实写，不做修正。

## 3. 桌面和手机的位置

| | 桌面 | 手机 |
|---|---|---|
| 页签 | 页头右上，和标题同一块，右对齐 | 页头下面单独一排，左对齐，放不下可以横向滑 |
| 状态行 | 页签下面，右对齐，12.5px 灰字，不带橙点 | 页头里、副标题下面，11.5px 灰字；有市场开盘时前面带橙点；放不下自动折行 |

## 3.1 Intraday 列表里的股票段（桌面）

Intraday 列表上半部分是加密涨跌轮（不改），下面一段是股票日轮，标题 `Will the stock finish higher than it opened?`。这一段右上换成和 Finance 完全相同的市场页签和状态行（同一个模块，规则见 §1、§2），不同的只有下面几点：

| 项 | Intraday 股票段 |
|---|---|
| 默认 | 永远是 `All`（没有从别处带着市场进来的入口） |
| 点页签 | 只筛这一段里的股票；上面的加密轮不受影响 |
| 开盘 / 未开盘怎么排 | 开盘的股票在上；未开盘的在分隔线 `ASLEEP UNTIL THEIR MARKET OPENS` 下面。分隔线保留，线右边不再写 `New York opens Tue 22:30` |
| 选中的市场没开盘 | 上面没有可下单的股票，分隔线就是这一段的第一行（CPO 确认可以） |
| 选中的市场今天 0 轮 | 同一个猞猁空态（页签只列有股票轮的市场，所以只在选中后该市场的轮全部下架时出现） |
| 底部 | `N names · N trading now, N asleep. Crypto rounds never stop.` 那一行取消 |
| Boost 开关打开 | 整段不显示（原有行为） |
| 手机 | 手机上 Intraday 是另一个模块（`MobileIntradayModule`），这次没动：它那行 `Hong Kong session open · 12 stock rounds` 还在，点了进 Finance 列表并停在页头 |

## 4. 文案（7 种语言已入 `src/locales/*.json`）

| 用在哪 | key | en | zh-CN |
|---|---|---|---|
| All 页签 | `common.all`（已有） | All | 全部 |
| 市场名 | `events.screen.simple.home_all.stocks.market_us` / `_hk` / `_kr`（已有，和首页同一组） | US / Hong Kong / Korea | 美股 / 港股 / 韩股 |
| All · 有开盘 | `events.screen.simple.finance_view.finance_vertical.markets_open`（新；英文分 `_one` / `_other`） | {{count}} market open / {{count}} markets open | {{count}} 个市场交易中 |
| All · 都没开盘 | `…finance_vertical.markets_closed_opens`（新） | Markets closed · {{market}} opens in {{time}} | 休市中 · {{market}} {{time}} 后开盘 |
| 空态标题 / 提示 | `…finance_vertical.no_rounds_today` / `no_rounds_today_hint`（新） | No {{market}} stock rounds today / Pick another market above, or check back on the next trading day. | {{market}}今天没有股票轮 / 可以在上面换一个市场，或下个交易日再来看看。 |
| 某市场 · 开盘 / 没开盘 / 结算 | `…home_all.stocks.open_closes_in` / `opens_in` / `settles_in` / `settling_now`（已有，和首页同一组） | Market open · closes in {{time}} / Market opens in {{time}} / · settles in {{time}} / · settling now | 交易中 · {{time}} 后收盘 / {{time}} 后开盘 / … |

不再使用（key 留在文件里，没有地方引用）：`…finance_vertical.session_open`、`closes_in`、`time_left`、`session_opens`、`region`。

## 5. Lovable 和正式版的边界

| 项 | Lovable | 正式版 |
|---|---|---|
| 市场 | US / Hong Kong / Korea 三个；A 股在 Lovable 里没有单独市场 | 加 CN 市场时在页签里多一个即可，版式不用改（页签数量不限，状态行永远一行） |
| 开盘 / 收盘时间 | 前端按各交易所的工作日时钟算（演示；这一页不看节假日表，首页 Stocks 模块看——节假日当天两处可能不一致，是 Lovable 的演示限制） | 用后端的交易时段状态；首页、Finance 列表的状态行、橙点、股票行必须读同一个状态 |
| 结算时间 | `expected_settlement_time` | 不变 |
| Asset class 一排 | 代码里一个开关 `SHOW_ASSET_CLASS_ROW = false` | 指数 / 商品 / 外汇有市场后把这一排放回来；放在页头下面、列表上面 |

## 6. 代码位置

| 内容 | 文件 |
|---|---|
| 市场页签、状态行的算法（Finance 和 Intraday 共用） | `src/components/lite/categoryviews/marketHeader.tsx`（`MarketTabs`、`buildMarketHeader`） |
| Finance 列表装配、Asset class 开关、空态、落点 | `src/components/lite/categoryviews/LiteFinanceView.tsx` |
| Intraday 列表股票段 | `src/components/lite/categoryviews/LiteIntradayView.tsx` |
| 页头多一个「副标题下面」的位置（手机状态行用） | `src/components/lite/categoryviews/verticalChrome.tsx` 的 `VerticalHeader` `below` |
| 开盘判定 | `src/components/lite/categoryviews/verticalBlocks.tsx` `groupStockRows`；`src/lib/usStockSessions.ts` `getMarketSession` |
| 字典帧 | `src/pages/StyleGuide/preview/eventsPreviews.tsx`（`Ev48Preview` …）、`sections/EventsStatesSection.tsx`、夹具在 `sections/LiteVerticalViewsSection.tsx` |

原来的胶囊组件 `SessionStatusChip` 还在 `verticalBlocks.tsx` 里，已经没有地方用。

## 7. 测试用例

| # | 操作 | 应该看到 |
|---|---|---|
| 1 | 桌面打开 Events → Finance | 右上一组页签 `All N · US N · Hong Kong N · Korea N`，下面一行状态；页头下面直接是股票行，没有 Asset class / Region 两排按钮 |
| 2 | 看页签数量 | 每个市场的数 = 选中该市场后下面股票行的行数；All = 各市场之和 |
| 3 | 有市场开盘时看 All | 状态行 `N markets open`，N = 带橙点的页签个数 |
| 4 | 点一个正在开盘的市场 | 状态行 `Market open · closes in … · settles in …`；下面只剩该市场的股票 |
| 5 | 点一个没开盘的市场 | 状态行 `Market opens in … · settles in …`；该页签不带橙点；股票行是未开盘样式 |
| 6 | 所有市场都收盘的时间打开 | All 状态行 `Markets closed · X opens in …`，X 是最先开盘的市场；没有橙点 |
| 7 | 首页 Stocks 模块点「Show all N」 | 进 Finance 时对应市场的页签已选中，页面停在 Finance 页头（标题和页签都在屏幕里） |
| 8 | 手机宽度 | 状态行在副标题下面；页签在它下面一排；有市场开盘时状态行前有橙点 |
| 9 | 切 7 种语言（俄语、越南语重点看） | 桌面状态行不折行、不压到标题；手机状态行放不下时折成两行，橙点停在第一行 |
| 10 | 打开 Boost 开关 | 页签没有数量、没有状态行 |
| 11 | 选一个今天没有股票轮的市场（生产上页签只列有股票轮的市场，所以要在选中某市场后把它的轮全部下架才能看到；平时看字典 EV-48f / EV-49e） | 页签写 0；下面是猞猁图 + `No … stock rounds today` + 提示句 |
| 12 | 滚到股票列表最底 | 没有 `Showing … names`、`New York opens …` 那一行 |
| 13 | 桌面打开 Events → Intraday，滚到股票那一段 | 右上是市场页签 + 一行状态，没有 `XX session open` 胶囊 |
| 14 | 在这一段点一个市场页签 | 只剩该市场的股票；上面的加密轮不变；状态行换成该市场那句 |
| 15 | 点一个没开盘的市场 | 第一行是 `ASLEEP UNTIL THEIR MARKET OPENS` 分隔线，线右边没有字；下面是未开盘的股票 |
| 16 | 这一段滚到底 | 没有 `N names · N trading now…` 那一行 |
| 17 | 浏览器拉到 1024 宽，看 Finance 和 Intraday 的股票行（最好有韩股） | 股票行是一列，代码完整显示、不压到价格；拉回 1280 宽恢复两列 |
