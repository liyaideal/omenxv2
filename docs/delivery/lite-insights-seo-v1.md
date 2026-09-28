# Insights SEO/GEO 数据页 — 交付说明 v1

日期：2026-09-28 · 范围：`/insights` 家族四类 URL · 决策：Liya（CPO）批「改吧」（SEO/GEO 帽子审稿 R1–R9 后的修订稿）· 规格来源：`SEO_P2_Insights_Page_Spec.md`（03-30）+ `omenx-seo-geo` 技能 · Lovable commit 见 changelog

## 通俗导读

Insights 不是给站内用户「逛」的发现流，是给 **Google / Bing 与 ChatGPT / Perplexity 一类 AI 引擎抓取** 的数据页：别人搜「prediction market odds Fed rate cut」或问 AI「OmenX 上 GPT-6 概率多少」，希望落到我们这里。所以它长得像数据报告，不像 Events 列表：

- **一份内容一个永久 URL**：首页之外，每天一页日报 `/insights/daily/2026-09-28`、每周一页周报 `/insights/weekly/2026-W39`、每个分类一页 `/insights/category/sports`。日报周报永不覆盖，越积越多，每页都是一个可被收录的落点。
- **没有 tab、没有「加载更多」**：爬虫不会点，所有榜单一次全在 DOM 里，平铺 9 节。
- **每条洞察写成「问题 → 带日期的答案 → 数字」**：标题就是市场问题本身，第一句就是答案（As of 28 Sept 2026, traders put an 88% probability on Yes…），下面一张 `<dl>` 数字表，同一组数字同时写进 JSON-LD。AI 引擎抄的就是这一句。
- **页尾两块给机器看的**：How computed（口径说明：概率 = 领先项价格、量 = 24h 成交、每小时快照、UTC）和 Cite（一句可直接复制的引用句 + 来源 URL）。

### 易混点辨析

1. **Lovable 是 Vite SPA，爬虫拿到的首 HTML 是空壳**。本轮把 title / canonical / JSON-LD / `<time>` 都做对了，但在 Lovable 上它们是客户端渲染的；**真平台必须 SSR 或预渲染**这四类 URL（见 §4 边界），否则 SEO 价值打折、GEO 基本为零。
2. **市场页没有 canonical URL**。Lovable 的市场链接是 `/trade?event={uuid}`，规格要的是 `/event/{slug}`。本轮所有市场链接与 JSON-LD `url` 走 `marketPath()` 一处，真平台改 `/event/{slug}` 时只改这一个函数（§4 第 2 条）。
3. **加密 15 分钟轮次不进任何榜单**（`CRYPTO_QUICK*`）：它们量大但对搜索毫无价值，会把 Trending 全占满。
4. **涨跌阈值 5 pts**：低于 5 个百分点的变动算噪音，不进涨跌榜也不生成洞察文章。
5. **概率只用 % 与 ¢**，不出现 `$0.62`——这是搜索词汇（"probability" / "odds"），不是交易词汇。

### 用户视角

看到：`/insights` 开篇 + KPI 五格 + 01–05 五张榜单 + 06 涨跌榜 + 07 分类表 + 08 今日洞察前 5（→ 日报）+ 09 周报入口 + How computed + Cite；日报 / 周报 / 分类页同一套件。移动端同结构，榜单横滑。
看不到：tab、无限滚动、个人数据、快速轮次。

## 0. 读者须知

- 本文是「怎么做的 + 边界」，不重复视觉规格；视觉见 DESIGN.md §Addendum 2026-09-28 · Insights 与字典 Lite › Insights（IN-1…IN-8）。
- 本轮**不含**站内 Insights 入口改动（顶栏 Insights 链接不变）。

## 1. URL 与页面

| URL | 页面 | title 模板 | 内容 |
|---|---|---|---|
| `/insights` | 首页 | `OmenX Insights — Live Prediction Market Data & Trends` | KPI · Trending / Volume / Active / Newest / Closing 各 Top 10 · 涨跌各 5 · 分类表 · 今日洞察 5 · 近 4 周周报链接 |
| `/insights/daily/{YYYY-MM-DD}` | 日报 | `Prediction Market Digest {d MMM yyyy} — OmenX Insights` | 当天窗口（00:00–24:00 UTC）全部洞察文章，前后日导航 |
| `/insights/weekly/{YYYY-Www}` | 周报 | `Prediction Market Weekly Recap {week} — OmenX` | 周量 / 笔数 / 新市场 / 已结算 · Top 5 by volume · 周涨跌 · 已结算清单 |
| `/insights/category/{slug}` | 分类页 | `{Category} Prediction Markets — Odds, Moves & Volume \| OmenX` | 独立 intro 段（每类一段，不复用）+ 该类 Trending / Volume / 涨跌 |

slug = `TOP_CATEGORIES` 中 `kind: sector` 的项 + `sports`（crypto / finance / politics / macro / tech / entertainment / social / sports）。

每页：`<link rel=canonical>`、`hreflang` 7 语（同 URL + `?lang=`，一期占位）、`og:type`、JSON-LD（首页 `Dataset` + 各榜 `ItemList`；文章 `Article`/`Dataset` 子项），所有时间 `<time datetime>` UTC。

## 2. 数据层（只读、聚合、无个人数据）

迁移 `supabase/migrations/20260928160000_insights_seo_v1.sql`：

| RPC | 输入 | 输出 |
|---|---|---|
| `insights_platform_stats()` | — | as_of · total_volume · open_interest · active_markets · resolved_markets · volume_24h / prev · trades_24h / prev · volume_7d · volume_30d |
| `insights_event_activity(p_from, p_to)` | 窗口 | 每个事件的 trades / volume（来自公共 `market_activity` 账本） |
| `insights_movers(p_from, p_to)` | 窗口 | 每个选项的首末价（来自 `price_history`） |
| `insights_series(p_option_ids, p_from, p_to)` | 选项集 + 窗口 | 折线序列 |
| `insights_snapshot_prices()` | — | 写 `price_history` 快照；pg_cron `insights-snapshot-prices` 每小时 |

全部 `SECURITY DEFINER`，只返回聚合；前端 `useInsightsSeo(win)` 一次拉齐 → `buildRows()` 出统一 `MarketRow`，各榜单只是不同排序（`rankTrending / rankVolume / rankActive / rankNew / rankClosing / gainers / losers`）。

首轮 7 天历史由一次性 SQL 回填（不在迁移里）；真平台上线时由研发按真实成交回填。

## 3. GEO 文章格式（`InsightArticle`）

```
<article data-market-id>
  eyebrow: {Market insight | Closing soon | New market} · <time datetime>
  <h3><a href=marketPath>{市场问题}</a></h3>
  <p>{答句：As of {date}, OmenX traders put a {p}% probability on {label}[, up from {from}%] on {vol} across {n} trades.}</p>
  <dl> Probability · Vol 24h · Trades · 24h change / Closes </dl>
  View market → · Share（复制 citeSentence）
```
三型触发：move（|Δ| ≥ 5 pts）· new（窗口内上架）· closing（窗口末 48h 内结算）。排序权重 move > closing > new，同型按量。

## 4. Lovable / 正式版边界（研发必读）

1. **SSR / 预渲染**：四类 URL 必须服务端出完整 HTML（含 title / canonical / JSON-LD / 榜单 DOM）。日报周报是静态可缓存页（按日 / 周生成一次即可）；首页与分类页缓存 15 分钟。Lovable 不做。
2. **市场 canonical URL**：改 `/trade?event={uuid}` → `/event/{slug}`；Lovable 端一处 `marketPath()`；JSON-LD `url` 随之。老 URL 301。
3. **sitemap**：Lovable 只放静态核心（`public/sitemap.xml`：首页 / events / insights / 8 个分类页 / 内容页）。真平台需动态输出：每日追加 `/insights/daily/{date}`、每周追加 `/insights/weekly/{week}`、每个市场页；`lastmod` 用 as_of。
4. **hreflang**：一期 7 语指向同 URL `?lang=`；真平台多语言路由定型后改成真实 URL。
5. **快照频率**：Lovable 每小时；真平台建议 15 分钟（页面文案已写 "Updated every 15 minutes"）。
6. **未平仓口径**：`open_interest` 当前按持仓表 notional 聚合，真平台按引擎口径出。

## 5. 文案 key

`insights.*` 150 条已入 `en.json`（namespace `insights`），其余 6 语待并入总表 `OMENX-i18n.xlsx` 的追加批（见 i18n 交付 §8）。SEO title / description 也是 key（`insights.seo.*`），多语言上线时每语各写、不机翻。

## 6. 验收

Localhost 已验：首页 title / canonical / JSON-LD 1 Dataset + ItemList、9 个 H2、65 篇 `<article>`、58 个 `<time>`；日报 / 周报 / 分类页 title 各自正确；375 宽榜单横滑、KPI 两列。主网验收表随 deploy 出。

## 7. 待删文件（Lovable 端无删权限，请 Liya 顺手删）

`src/pages/InsightsPage.tsx`（旧页，已无引用）、`src/components/insights/`（BiggestMovers / CategoryBreakdown / InsightsFeed / InsightsKpiDashboard / TrendingMarkets / index，已无引用）。
