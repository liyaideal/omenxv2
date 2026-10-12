# Insights（OmenX Insights · SEO/GEO 数据页）— 交付说明 v1（总文档）

> 这是 `/insights` 家族——给搜索引擎和 AI 引擎抓取的数据页，不是站内用户「逛」的发现流。它回答一个问题：**OmenX 交易者现在押什么，他们过去押得准不准。**
> 用户能看见的：首页一屏（平台四数 + 五节）、每个资产一页（BTC / ETH / SOL + 10 美股 + 6 港股，共 19 页）、加密 / 股票两个总览、运动页、命中率报告、每日日报、分类页；每页右上有 lynx 插画、页尾有「About this data」三块。
> 没动的：交易页、Events 列表、顶栏「Insights」入口位置；Insights 页不做面包屑、没有「← 返回」。
> 怎么读：先看 §0 / §0.1 知道去哪查，再看「通俗导读」；数值和口径在 §2–§4，研发要做的在 §9。

日期：2026-09-28 开工 · 2026-09-30 文案改人话 · 2026-10-12 品牌回流收官 · 决策：Liya（CPO）。本文合并了 `lite-insights-seo-v1.md`（事件榜单 / 日报 / 分类页）与 `lite-insights-seo-v2.md`（资产序列 / 运动 / 命中率），两份分轮文档只留档。

## 通俗导读

> 本节是给没读过正文的人的 5 分钟通俗解读；不替代正文、不构成需求依据，一切口径以正文为准。

**原来有什么**：主网 `/insights` 是一页事件榜单（Trending / Volume / 涨跌），只收录一次性事件和体育，平台主业——加密快轮、美股港股日盘——一条都没有。

**这次变成什么**：整个家族重建成七种页面，主角换成**资产**。库里每个 Up-or-Down 轮都存着结算前的人群价格和结果，所以每个资产都能回答两个数：人群这轮押哪边、过去押对多少次——这两个数全网只有 OmenX 有。

```
/insights ───────── 首页：平台四数 · 01 Crypto 下一轮 · 02 Stocks 今日盘 · 03 Sports 7 天 · 04 Events · 05 Is the crowd right?
├─ /insights/crypto ──── 加密总览（3 资产 × 5 轮长，按资产分组）
│   └─ /insights/crypto/bitcoin ─ 资产页模板（19 个 URL 共用）
├─ /insights/stocks ──── 股票总览（16 只，一只一行）
│   └─ /insights/stocks/aapl
├─ /insights/sports[/soccer] ── 运动页（一场比赛一行）
├─ /insights/accuracy[/2026-09] ── 命中率报告（GEO 主磁铁，月报月末冻结）
├─ /insights/daily/2026-10-11 ── 日报（事件类）
└─ /insights/category/politics ── 分类页（事件类）
```

**一条故事线**：小A 在 Google 搜 "bitcoin 5 minute up or down odds" → 落到 `/insights/crypto/bitcoin` → 第一屏就是正在跑的那一轮（Up 48¢ / Down 52¢，倒计时在走）和今天人群押对了多少次 → 往下是五种轮长各自此刻的多数派和 30 天押对率 → 再往下最近 10 轮逐条 ✓/✗ → 页尾一句可复制的引用句。ChatGPT 抓的就是那一句。

### 概念词典

见 `docs/copy-dictionary.md` → `Insights` 节（the crowd / Crowd was right / coin flip / Verdict / crowd favourite / upset / the line / Settles in）。本文只引用、不另做出处。

### 易混点辨析

1. **"Crowd was right" 不是平台准不准**，而是押得多的那边最后赢没赢。5 分钟轮约 50%（掷硬币），4 小时轮 55–58%，Tesla 日盘只有 40%。坏数字不藏——数据页藏坏数字没人信。
2. **首页 01 Crypto 显示的不是固定轮长**，而是每个资产**最快要结算的那一轮**（通常 5m）；资产页 01 表的 Now 列才是五种轮长各自的多数派。
3. **人群不是"全押一边"**：每轮两边都有人押，the crowd 只是价格高于 50¢ 的那边。页面永远成对显示 `Up 48¢ ▬ Down 52¢`，Up 在左、Down 在右，从不只给一边。
4. **Lovable 上这些页面是客户端渲染的**，爬虫拿到的首 HTML 是空壳；title / canonical / JSON-LD 都做对了，但正式版必须 SSR 或预渲染（§9）。
5. **体育的结算历史在 Lovable 里是归档出来的**（演示引擎结算后立刻改期重跑），正式版直接读真实结算，不需要归档表（§3）。
6. **插画是整张扁平图**（渐隐烘进像素），不是代码画的渐变；换图只换文件（§6）。

### 用户视角

看到：每页「现在 → 过去 → 逐条 → 引用」四块；成对的 Up / Down 价格；倒计时；✓ right / ✗ wrong；页尾 About this data（OmenX 三行品牌句 · What these numbers mean · Quote this page + Copy）。
看不到：tab、加载更多、个人数据、面包屑 / 返回链接、单轮事件的独立页。

## 0. 读者须知

查什么去哪儿：
- 长什么样 → 生产页 `/insights`、`/insights/crypto/bitcoin`、`/insights/sports/soccer`、`/insights/accuracy`
- 什么时候变成什么样 → `/style-guide` → Lite → `Insights ✅` 状态字典（IN-1…IN-14，每个 case 有「状态 / 触发条件 / 视觉 / 数据来源」表）
- 字段名、文案、公式、术语 → `docs/copy-dictionary.md` → `Insights` 节 → 本文 §2–§4
- 设计法则（字体层级、插画位、Up/Down 颜色轴、表格语法）→ `DESIGN.md` §Addendum 2026-09-28（Insights 两段）与 §Addendum 2026-10-12
提问前先按上面顺序查一遍；查不到再提，提问时写明"我查了 X 没有"。

## 0.1 字典怎么看

1. 打开 `/style-guide`（不用登录），左栏树 `Lite` 组点 **`Insights ✅`**。
2. 节点顶部「本页目录」= 小节按产品页从上到下；右侧是编号范围，点了滚过去。
3. 小节顶部黄框「定位行」= 路由 / 词典节 / 交付文档。
4. 每张样张 = `编号 · 状态名（组件名）` + iframe 里的真组件（桌面 100% / 手机 375），可交互。
5. 样张下表列固定「状态 / 触发条件 / 视觉 / 数据来源」，触发条件就是判定表达式。
6. 页头搜索框敲 `IN-12` 或 "Crowd was right"，结果「编号 · 名 → 节点 › 小节」，点了落到样张。
7. 单张查看 / 截图：`/style-guide/preview?c=insights-series-table`（key 见 §7）。

编号规则：`IN-1…IN-8` 是事件类部件（日报 / 分类页的表格、榜单、文章、空态）；`IN-9…IN-14` 是资产序列语法（开篇、Live 卡、Up·Down 对、表格、移动列表、四数条 + 页尾）。没有 `-D / -M` 后缀，桌面 / 手机在同一张样张里切。

只在字典可见、生产暂时凑不出条件的态（是既定状态不是 bug）：IN-8 空态 / 失败态；IN-11 的 `✗ wrong · upset`（热门 ≥ 70¢ 输球，演示数据里最大热门 62¢）；IN-10 "Longest winning run today" 连赢 6 次（生产按当日实际）。

## 1. URL 与页面

| URL | 页 | title 模板 | 一屏顺序 |
|---|---|---|---|
| `/insights` | 首页 | `Prediction Market Data — What OmenX Traders Are Betting Right Now` | 开篇（插画）→ 四数条 → 01 Crypto next round → 02 Stocks today's session → 03 Sports live & next 7 days → 04 Events most traded / biggest moves 24h → 05 Is the crowd right? → About this data → 日报链接 |
| `/insights/crypto/{slug}` `/insights/stocks/{slug}` | 资产页（一个模板，19 URL） | `Bitcoin Up or Down — Prediction Market Odds & Crowd Accuracy` / `Apple (AAPL) Up or Down Today — Prediction Market Odds` | 开篇 → Live 卡（下一轮）+ 今日四格 → 01 全部轮长（Now + 30 天）→ 02 最近 10 轮 → 03 其他资产 → About → sticky CTA（手机） |
| `/insights/crypto` `/insights/stocks` | 家族总览 | `Crypto Up or Down — Live Prediction Market Odds` / `Stock Up or Down Today — Prediction Market Odds` | 开篇 → 01 表（加密按资产分组 3×5 行；**股票按 US / HK 分两张表，组内按 24h 成交额排序，页顶市场 chips 跳转；有多少只列多少只，无上限**）→ About |
| `/insights/sports[/{sport}]` | 运动页 | `{Sport} Prediction Market Odds — Who the Crowd Backs` | 开篇 → 运动 chips（All + 各运动 + 计数）→ Live 卡 + 三格（本周场次 / 热门赢率 / 大球占比）+ Biggest upset 卡 → 01 未来 7 天 → 02 已结算 30 天 → About |
| `/insights/accuracy[/{YYYY-MM}]` | 命中率报告 | `How Accurate Is the Prediction Market Crowd? — OmenX, Last 30 Days` | 开篇 → 四数条 → 01 Which markets does the crowd call right?（两张卡）→ 02 Does a longer round help the crowd?（轮长表）→ 03 往期月报 → About |
| `/insights/daily/{date}` | 日报 | `Prediction Market Digest {d MMM yyyy} — OmenX Insights` | 前后日翻页 → 开篇 → 三格快照（变动 / 新上 / 将结算）→ 当日洞察文章（每篇一张卡：问题 + 带日期答句 + 四指标）→ About |
| `/insights/category/{slug}` | 分类页 | `{Category} Prediction Markets — Odds, Moves & Volume` | 开篇 → 01 Trending → 02 by volume → 03 涨跌 → 04 closing soon → About |

slug：资产由名字派生（`Apple (AAPL)` → `aapl`，`Tencent (0700.HK)` → `0700-hk`，`Bitcoin` → `bitcoin`）；分类 = crypto / finance / politics / macro / tech / entertainment / social / sports。`/insights/weekly/*` 已删，301 到 `/insights/accuracy`。

## 2. 口径

| 项 | 口径 |
|---|---|
| the crowd | 投注截止时价格 ≥ 50¢ 的一边（`up_price >= 0.5`） |
| Crowd was right | 已结算轮里人群那边赢的比例；今日 = 当天 UTC 已结算；30d = 滚动 30 天；报告页资产榜要求 ≥ 5 轮，轮长表 < 20 轮不判 |
| Verdict | `< 20` 轮 too few rounds to judge · `> 52%` better than a coin flip · `48–52%` no better than a coin flip · `< 48%` worse than a coin flip |
| 首页 01 | 每资产取 `end_date` 最近的未结算轮；资产页 Live 卡同口径；01 表 Now 列每种轮长各取一个 |
| 资产页主轮长 | 加密 15m / 股票日盘；02 最近 10 轮只看主轮长 |
| 体育热门 | 开赛时胜者盘价格最高的非平局选项；平局算热门输；upset = 热门 ≥ 70¢ 输球；the line = 最接近 2.5 的大小球，Went over the line = Over 胜占比 |
| 首页 03 | live + 7 天内开赛，最多 10 行；首页 04 有 ≥ 3 条 |Δ| ≥ 5 pts 的变动时显示 biggest moves，否则 most traded |
| 时间 | 全部 UTC；"As of" = 聚合 RPC 的 `as_of`；数据条 60s 轮询，报告页 5 min，冻结月报不轮询 |
| 股票总览 | 35 天内有过日盘的股票全部列出（正式版 100+ 只）；按 `family` 分 US / HK 两组，组内 `vol_24h` 降序；组头写该市场的结算时刻 |
| 日报日期 | 只到今天（UTC）；未来日期的 URL 301 到今天；"下一天"链接只在明天 ≤ 今天时出现 |
| 排除 | `end_date` 超过 1 年的演示事件；分类页 / 日报不收加密快轮 |

## 3. 数据层（Lovable Cloud，已执行）

| 迁移 | RPC | 用途 |
|---|---|---|
| `20260928160000_insights_seo_v1.sql` | `insights_platform_stats()` | 平台四数（24h 量 / 笔数、活跃市场、未平仓） |
| 同上 | `insights_event_activity(p_from,p_to)` · `insights_movers(p_from,p_to)` · `insights_series(ids,…)` · `insights_snapshot_prices()`（pg_cron 每小时） | 事件榜单 / 涨跌 / 折线 / 价格快照 |
| `20260928200000_insights_series_v1.sql` | `insights_updown_rounds(p_from)` | 基表：每个 Up-or-Down 轮一行（family / asset / ticker / slug / mins / up_price / up_won / volume） |
| 同上 | `insights_series_list()` · `insights_series_detail(p_slug)` · `insights_accuracy(p_from,p_to)` | 首页 / 总览 · 资产页 · 报告页 |
| `20260930100000_insights_sports_results.sql` | `archive_sports_result(p_id)` | 体育结算归档为 `SPORTS_RESULT` 行（演示引擎专用） |

全部 `SECURITY DEFINER` 聚合，只读 `events` + `event_options` + 公共账本，无个人数据。

## 4. 页面模块（按用户看到的顺序）

- **开篇**：蓝 eyebrow → H1（首页关键词蓝色）→ lede → 右侧插画（手机：插画全宽在 lede 下）→ As of。
- **四数条**：桌面一张卡四格大数，手机 2×2 四张卡。首页：Traded 24h / Settled 24h / Live markets / Crowd was right · today；报告页：Rounds settled / Crowd was right / Best crypto round length / Assets tracked。
- **章节头**：蓝「01 CRYPTO」→ 标题 → 一句导语 → 蓝链接「All crypto rounds →」；右侧章节插画（首页五节）；无插画的节右上是 meta 胶囊（手机落到导语下）。
- **表格**（桌面）：52px 行、第一列吃剩余宽、数字右对齐、整行可点、无箭头列；**列表**（手机）：两行一条（名 + 右侧时间 / Up·Down 对 + 右侧准不准）。
- **Live 卡**：eyebrow（Next · 5m round）/ 时间 → 大字 `Up 52% · Down 48%` → 一句 "more money is on Up" → 蓝绿条 → 成交 + CTA。
- **About this data**：分隔线 → 「06 · DATA & METHODOLOGY」→ 两卡（OmenX 三行 + How it works ‖ What these numbers mean + Full methodology）→ 引用卡（固定导语 + 等宽引用句 + Copy，复制成功变绿 Copied 1.6s）。
- **准确率模块导语**（首页 05、报告 01、资产页 01）：固定一句，见词典。

## 5. GEO 结构

每页：`<link rel=canonical>`、hreflang 7 语（同 URL + `?lang=`，占位）、`og:type`、JSON-LD（`Dataset` + `ItemList` / 资产页 `PropertyValue` 四项 / 运动页 `SportsEvent` 列表）、所有时间 `<time datetime>`、单 `<h1>`（手机 header 标题是 `<div>`）。引用句格式与 `llms.txt` 一致：*According to OmenX prediction market data, the crowd leaned Up in 51% of Bitcoin rounds on 12 Oct 2026 and was right 46% of the time. Source: {url}*。没有 tab、没有懒加载列表，榜单全在首屏 DOM。

## 6. 视觉与插画（2026-10-12 品牌回流）

稿源 Figma omenx_lite pc `1004:3314` / mobile `1004:3315`，规格与复验基线见 `DESIGN.md` §Addendum 2026-10-12。全部落在四个共享件（`SeriesOpening / SeriesSection / Strip / DataFooter`），七种页面共用。插画 20 张 `src/assets/insights/*.webp`（Figma 帧整张导出 2×，渐隐烘进像素，WebP q86 共 296K），索引 `src/lib/insights/art.ts`（每张记 node id + 1× 尺寸）；页面按 1× 尺寸渲染，装饰性 `aria-hidden`，加载失败静默隐藏。保持全站规范不照稿：容器 `py-10`、手机 `px-4`、底色 / 卡色走 token。

## 7. 状态索引

| 模块 | 编号 | preview key |
|---|---|---|
| 开篇 v2 | IN-9 | `insights-series-opening` |
| Live 卡 + 今日四格 | IN-10 | `insights-series-hero` |
| Up·Down 对 / 标签件 | IN-11 | `insights-series-pair` |
| 表格语法 + 章节头 | IN-12 | `insights-series-table` |
| 移动列表行 | IN-13 | `insights-series-list` |
| 四数条 + About this data | IN-14 | `insights-series-strip` |
| 事件榜单表 / 涨跌榜 / 分类表 / 洞察文章 / 空态 | IN-3 … IN-8 | `insights-market-table` … `insights-empty` |

## 8. 涉及文件

- 页面 `src/pages/insights/`：`InsightsPage`（首页）· `InsightsAssetPage` · `InsightsFamilyPage` · `InsightsSportsPage` · `InsightsAccuracyPage` · `InsightsDailyPage` · `InsightsCategoryPage`；路由 `src/App.tsx`
- 共享件 `src/components/insightsSeo/`：`seriesParts.tsx`（v2 语法 + 回流）· `parts.tsx`（事件类表格 / 榜单）· `insightsFeed.tsx`（洞察文章）· `InsightsShell.tsx`
- 数据 `src/lib/insights/`：`index.ts`（事件榜单）· `series.ts`（轮 / 口径 / 引用句）· `sports.ts`（比赛聚合）· `art.ts`（插画索引）；`src/hooks/useInsightsSeo.ts` · `useInsightsSeries.ts`
- 资产 `src/assets/insights/`（20 webp）；`public/sitemap.xml`（静态 41 条）
- 数据库：§3 三份迁移

## 9. Lovable / 正式版边界（研发必读）

1. **SSR / 预渲染**所有 `/insights*` URL（含 title / canonical / JSON-LD / 榜单 DOM）：日报、月报按日 / 月生成一次即可；首页、资产页、总览、运动页缓存 15 分钟。
2. **市场 canonical** `/trade?event={uuid}` → `/event/{slug}`：Lovable 端 `marketPath()` / `roundTradePath()` 各一处，老 URL 301。
3. **sitemap 动态**：19 资产页 + 总览 + 运动页 + 每月报告 + 每日日报，`lastmod` 用 as_of。
4. **hreflang**：真实多语言路由定型后改真实 URL。
5. **快照 / 缓存**：价格快照 15 分钟；`insights_series_*` 基表扫 35 天，正式版按量物化或缓存 60s。
6. **体育结算**：直接读真实结算记录；`SPORTS_RESULT` 归档与 `res-seed-*` 种子是演示专用。
7. **插画**：静态资源随前端发；无后端改动。

## 10. 文案 / i18n

`insights.*` 事件类文案 150 条已在 `en.json`；资产序列 / 运动 / 报告页文案目前硬编码英文，随 i18n 二期并入 `OMENX-i18n.xlsx` 追加批。SEO title / description 多语言上线时每语各写、不机翻。

## 11. 已删除

`InsightsWeeklyPage.tsx`、旧 `src/pages/InsightsPage.tsx`、`src/components/insights/`（2026-09-30）；分类页 / 日报的 v1 开篇 / 页尾部件（`Opening / SectionHead / HowComputed / CiteBlock`）已退役（2026-10-12）。

## 轮次代号 ↔ 章节

| 代号 | 白话 | 本文 |
|---|---|---|
| IS-1…10 | 事件榜单 / 日报 / 分类页首版 | §1 §3 §9 |
| IS2-1…10 | 资产序列 / 运动 / 命中率 | §1–§4 |
| IS2-11 | 文案改人话（Majority → the crowd） | §2、词典 |
| IS2-12 / 13 | 品牌回流 + 分类页 / 日报换皮 + 运动 chips | §6 |
