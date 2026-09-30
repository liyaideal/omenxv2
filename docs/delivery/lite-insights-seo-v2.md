# Insights v2 — 资产序列 / 运动 / 命中率报告 交付说明

日期：2026-09-28（晚）· 决策：Liya（CPO）批统一方案稿 `insights-ia-mock` v3 + 移动稿 · 取代同日上午的 v1（`lite-insights-seo-v1.md`，其日报 / 分类页部件仍在用；周报已删）

## 通俗导读

上午那版 Insights 把平台主业排除在外——榜单里全是一次性事件和体育，BTC / ETH / SOL 的快轮、美股港股日盘一条都没有，因为"单轮 15 分钟就死，没有收录价值"。判断没错，结论错了：**SEO 的单位不是"轮"，是"资产"**。库里 BTC 有 1,400 多轮已结算、每只美股 60 多个交易日，每轮都存着结算前的人群价格和结果——**人群每轮押哪边、押对多少次，全网只有 OmenX 有**。v2 就围绕这两个数字重建。

**整个站只回答一个问题：「OmenX 交易者现在押什么，他们过去押得准不准」。** 每页三块顺序固定：现在 → 过去 → 逐条 → 引用。全站只用一个词 **Majority**（多数派）= 投注截止时价格高于 50¢ 的一边；每轮两边都有人押，多数派只是押得多的那边。

### 六种页面

| URL | 页 | 回答 |
|---|---|---|
| `/insights` | 首页 | 全平台的"现在"一屏：平台四数 · 01 Crypto 下一轮 · 02 Stocks 今日盘 · 03 Sports 进行中 + 24h · 04 Events 最大变动 · 05 Is the crowd right? |
| `/insights/crypto/{bitcoin}` `/insights/stocks/{aapl}` | 资产页（**一个模板，19 个 URL**：3 crypto · 10 美股 · 6 港股，新上资产自动多一页） | Live 卡（下一轮要结算的）+ 今日四格 → 01 全部轮长（Now + 30 天命中率）→ 02 最近 10 轮 → 03 其他资产 → 引用 |
| `/insights/crypto` `/insights/stocks` | 家族 hub | 一个资产一行 |
| `/insights/sports` `/insights/sports/{soccer}` | 运动页（一场比赛一行） | Live 比赛卡 + 本周四格 → 01 未来 7 天热门 → 02 已结算热门对错 → 引用 |
| `/insights/accuracy` `/insights/accuracy/{2026-09}` | 命中率报告（GEO 主磁铁；月报月末冻结） | 四数 → 01 按资产（最可靠 / 最不可靠）→ 02 按轮长 → 03 往期 |
| `/insights/daily/{date}` `/insights/category/{slug}` | 日报 / 分类页（v1 保留，降为附属） | 事件类 |

### 平台特点怎么露

- 快轮：资产页"现在"永远是**正在跑的那一轮**，倒计时在页上；引用句自带 "5-minute round"
- 可做空：所有价格成对 `Up 48¢ ▬ Down 52¢`，Up 永远在左、Down 永远在右，多数派加粗；从不只给 Yes
- 杠杆 / 链：每页页尾固定一行 *OmenX · Trade Up or Down with up to 10× Boost · settles on the reference index · USDC on Base · How it works →*（与 llms.txt 品牌句一致）
- 美股 / 港股日盘：独立家族 `/insights/stocks/*`，标题直接用 "Apple (AAPL) Up or Down Today"

### 易混点

1. **"Crowd was right" 不是平台准不准**，是多数派押的那边最后赢没赢。5 分钟轮约 50%（掷硬币），1 小时轮 55–56%，Tesla 日盘只有 40%。坏数字不藏——数据页藏坏数字反而没人信。
2. 首页 Crypto 行显示的是**最快要结算的那一轮**（通常 5m），不是某个固定轮长；资产页 01 表的 Now 列才是五种轮长各自此刻的多数派。
3. Lovable 的体育演示引擎结算后立刻把比赛改期重跑，结算历史本来留不下来。2026-09-30 起结算前先归档一份（`SPORTS_RESULT` 行，含胜者盘 + 最接近 2.5 的大小球线），Insights 只读归档行，公共 Resolved 列表不显示它们；另种了 18 场（14 足球 + 4 电竞，`res-seed-*`）作 30 天历史。正式版直接用真实结算记录，不需要归档表。
4. 演示赛事 `end_date = 2126` 已在数据层排除（`buildRows` + `buildFixtures` 都过滤 > 1 年）。

## 1. 数据层（`supabase/migrations/20260928200000_insights_series_v1.sql`，已在 Lovable Cloud 执行）

| RPC | 用途 |
|---|---|
| `insights_updown_rounds(p_from)` | 基表：每个 Up-or-Down 轮一行（family / asset / ticker / slug / mins / up_price / up_won / volume），slug 由名字派生（`Apple (AAPL)` → `aapl`，`Tencent (0700.HK)` → `0700-hk`，`Bitcoin` → `bitcoin`） |
| `insights_series_list()` | 首页 / hub：每资产的下一轮 + 今日 / 30 天命中率 + 24h 量 |
| `insights_series_detail(p_slug)` | 资产页：live（每种轮长各一）· today · longest_run_today · by_len（30d）· recent 10（主轮长：crypto 15m / 股票日盘） |
| `insights_accuracy(p_from, p_to)` | 报告页 + 首页 05：总命中、按资产（≥5 轮）、按轮长（crypto） |
| `archive_sports_result(p_id)`（迁移 `20260930100000`） | 体育结算归档：`roll_sports_matches` 改期前调用，复制胜者盘 + 大小球线为 `SPORTS_RESULT` 行 |

全部 `SECURITY DEFINER` 聚合，只读 `events` + `event_options`，无个人数据。前端 60s 轮询（报告页 5 min，冻结月报不轮询）。

## 2. 前端

- `src/lib/insights/series.ts`（类型 / slug / 轮长文案 / 引用句）· `src/lib/insights/sports.ts`（比赛聚合：fixture_id 分组，热门 = winner 市场最高价，线 = 最接近 2.5 的 total）· `src/hooks/useInsightsSeries.ts`
- `src/components/insightsSeo/seriesParts.tsx`：SeriesOpening / LiveCard / FourTiles / Strip / UpDownPair / MajorityTag / FavTag / Hit / Table·Th·Td / List·Row·Name·Chip / PlatformLine / HowComputed / Cite / StickyCta
- 页面：`InsightsPage`（重写）· `InsightsAssetPage` · `InsightsFamilyPage` · `InsightsSportsPage` · `InsightsAccuracyPage`；`InsightsWeeklyPage` 已删，路由 301 到 `/insights/accuracy`
- v1 `MarketTable` 按 v7 语法重排（无 Price 列 / 无折线 / 无箭头列，`+9% today`，移动端列表行）；`PricePills` 第二枚改 `--no`（修 CHK-3）
- `MobileHeader` 新增 `titleAs="div"`：Insights 路由下标题不再是第二个 `<h1>`（G1）
- 引用句冠词 `an 87%`（G3）

## 3. 验收（localhost，deploy 后主网复验）

| 页 | 看什么 |
|---|---|
| `/insights` | 六节 H2；01 三行 BTC/ETH/SOL 倒计时在走；02 16 只股票；05 最可靠 BYD 69% / 最不可靠 TSLA 40% |
| `/insights/crypto/bitcoin` | Live 卡显示 5m 轮 + 倒计时；01 表 Now 列五个 tag；02 最近 10 轮 ✓/✗；375 宽 sticky "Trade this round" |
| `/insights/stocks/aapl` | "Today's session" 20:00 UTC；02 表按交易日 |
| `/insights/sports/soccer` | 一场一行；热门 tag；"过去"块 Lovable 无数据显示 no settled |
| `/insights/accuracy` | 4,425 轮 49%；按资产两张卡；按轮长表；往期三个月链接 |
| 移动 375 | 全部页面单 h1、无表格、无横向溢出 |

## 4. 正式版边界（研发）

1. SSR / 预渲染六种页面（v1 §4 第 1 条不变）；`/insights/accuracy/{month}` 月末生成一次静态即可
2. 市场 canonical `/event/{slug}`；Lovable 端 `roundTradePath()` / `marketPath()` 各一处
3. sitemap 动态：19 个资产页 + 运动页 + 每月报告 + 每日日报
4. 快照 15 分钟（v1 §4 第 5 条）；`insights_series_*` 建议物化或缓存 60s（基表扫 35 天，Lovable 上 ~4k 行没问题，正式版按量评估）
5. 体育结算历史：`favouriteWon` 取 winner 市场的 `is_winner`，平局算热门输；"Went over the line" 取大小球线的胜方是否为 Over。正式版无需 `SPORTS_RESULT` 归档，直接读真实结算

## 5. 已删（2026-09-30）

`src/pages/insights/InsightsWeeklyPage.tsx`、`src/pages/InsightsPage.tsx`（旧）、`src/components/insights/` 已从仓库移除；`/insights/weekly/:week` 路由保留 301 到 `/insights/accuracy`。
