# 体育让分 / 大小球市场与 board 行交互（Sports Game Lines）— 交付说明 v1

> 本文档覆盖 2026-08-17/18 上线的两批改动：**A. Sports Game Lines v1 + v1.1**（足球比赛在 Lite 交易页新增 Handicap / Total goals 两组市场，线位滑轨，兄弟事件模型，全量足球 + 自动滚动引擎）；**B. LiteMarketBoard 行交互**（多市场 board 整行点击展开图表，Yes/No 芯片行为分端）。研发以本文档为准；已上线的 Winner（1X2 / 二选一）逻辑不变，本文只描述新增与修改。

---

## 0. 通俗导读

> 本节是给没读过正文的人的 3 分钟通俗解读；不替代正文、不构成需求依据，一切口径以正文为准。

### 0.1 一分钟看懂

旧版：一场足球比赛在 Lite 交易页只有"谁赢"一个市场（主胜 / 平 / 客胜）。
新版：同一场比赛下面有三组市场——**Winner**（谁赢）、**Handicap**（让分：主队 ±N.5 球后谁赢）、**Total goals**（大小球：全场总进球 Over/Under N.5）；后两组带一个"线位滑轨"，滑一下就切换到另一条线。

```
[比赛 board]
 ├─ WINNER        主胜 / 平 / 客胜        （原来的 3 行不变）
 ├─ HANDICAP      ARS +1.5 covers  [ARS +1.5 87¢][LIV −1.5 13¢]
 │                ‹  −2.5  −1.5  ●+1.5  +2.5  ›   ← 线位滑轨
 └─ TOTAL GOALS   Over 2.5 goals   [Over 2.5 48¢][Under 2.5 52¢]
                  ‹  0.5  1.5  ●2.5  3.5  4.5  ›
```

### 0.2 一条完整故事线

1. 小A 打开 Arsenal v Liverpool 的交易页，看到 Winner 三行下面多了 Handicap 和 Total goals 两组。
2. 她把让分滑轨从 +1.5 滑到 −1.5，行标题变成 "ARS −1.5 covers"，两枚芯片和价格一起换成这条线的市场。
3. 她点右侧 "ARS −1.5 13¢" 芯片：桌面右栏下单面板绑定到这个市场，副标写 "Arsenal v Liverpool · Handicap · ARS −1.5"；移动端则弹出交易抽屉。
4. 买入后，这一行出现 "You hold ARS −1.5" 芯片，board 下方多一张持仓卡，标题就是 "ARS −1.5"。
5. 比赛结束（演示环境按合成比分），Winner / Handicap / Total 用**同一个比分**一起结算，她的让分单按 "主队进球 + 线 > 客队进球" 判赢。
6. 结算后引擎把这场比赛整体推后一周重新开盘，三组市场跟着一起重排、重新定价——所以以后每一场足球赛都长期带着这三组。

### 0.3 概念词典

| 概念 | 是什么 | 解决什么问题 | 一句话类比 |
|---|---|---|---|
| fixture（比赛） | 一场具体比赛，以原来的 Winner 事件 id 作为 `fixture_id` | 把同一场比赛的多个市场归到一起 | 一场戏的剧目名 |
| 兄弟事件（sibling） | 同一 `fixture_id` 下的 Handicap / Total 市场，各自是一条独立的二元 event | 不改表结构就能挂多组市场 | 同一剧目的不同场次票 |
| 线位（line） | 让分 ±N.5 / 大小球 N.5 的那个数字 | 每条线一个独立市场，价格各不同 | 同一件商品的不同尺码 |
| 线位滑轨 | 行底部的离散点选条 | 在同组里切当前线位 | 尺码选择器 |
| side_labels | 二元 event 的两侧文案（"ARS +1.5" / "LIV −1.5"） | 芯片和持仓卡不写 Yes/No 而写队名 | 给 Yes/No 起的外号 |
| 行交互（B） | 整行可点展开图表；芯片才是下单入口 | 看图和下单两件事分开 | 点标题看详情、点按钮才付款 |

### 0.4 易混点辨析

- 不是"一场比赛一条 event 挂三组 options"，而是"一场比赛 = 1 条 Winner event + 9 条兄弟 event"，靠 `metadata.fixture_id` 归组。
- 不是"滑轨在同一个 event 里改数字"，而是"滑轨切换到另一条兄弟 event"，价格、图表、下单目标全部跟着换。
- 兄弟 event 不是列表里的新卡片：/events、More markets、watchlist 全部过滤掉它们，**只在 fixture board 里可达**；深链到兄弟 id 会被 302 到 `?event=<fixture>&line=<sibling>`。
- 持仓卡标题不是 "ARS +1.5 · Yes"，而是 "ARS +1.5"：凡带 side_labels 的市场，侧名就是 side label 本身，Yes/No 只用于没有侧名的通用多选项事件。
- "1× Boost" 不存在：1× 就是无 Boost，只有 >1× 才带 "3× Boost" 后缀。
- 移动端点行不是下单，而是展开图表；点 Yes/No 芯片才弹交易抽屉。桌面点行是展开/收起，点芯片是切侧、不收起。

### 0.5 用户视角

看到：三组市场与组标题（Winner / Handicap / Total goals）、"Regulation time" 注记（点开解释加时点球不算）、线位滑轨、队名芯片、"You hold ARS +1.5"、持仓卡 "ARS +1.5"、眉标 "Sports · Winner · Handicap · Total goals"。
看不到：`fixture_id` / `market_type` / `line` 字段、兄弟 event 的独立卡片、"Spread / Totals / 1X2 / O/U / Moneyline" 字样、无符号线位、"1× Boost"。

---

## 1. 功能目标

- 让 Lite 交易页的足球比赛具备 **Winner / Handicap / Total goals** 三组市场，参照主流体育盘口的 Game Lines 形态，但沿用现有多市场 board 的行样式，不另起 UI 体系。
- 数据层不改 schema：以"兄弟 event"承载每条线，下单 / 结算 / 持仓链路零改动。
- 全部足球比赛（现有 9 场 + 未来手工新增）自动带三组，由结算-重排引擎维护；非足球（NBA / NFL / UFC…）暂不生成。
- 顺带统一 board 行交互：整行点击 = 看图，芯片 = 下单入口。

---

## 2. 数据模型

### 2.1 metadata 键（`events.metadata`，jsonb）

| 键 | 取值 | 说明 |
|---|---|---|
| `fixture_id` | text | 同一场比赛共用；= Winner event 自身 id（如 `sp-epl-ars-liv`） |
| `market_type` | `winner` / `handicap` / `total` | Winner 本体也打 `winner`；无此键或为 `winner` 视为普通事件 |
| `line` | numeric | Handicap 主队视角带符号（−2.5/−1.5/+1.5/+2.5）；Total 正数（0.5–4.5） |
| `sport` | text | 目前 `soccer`；由 `sports_league_map` 推断 |
| 其余 | 沿用 | `league / home / away / home_abbr / away_abbr / format / kickoff_at / live …` |

### 2.2 兄弟事件约定

| 项 | Handicap | Total |
|---|---|---|
| id | `<fixture>-hcp-<line>`（`-`→`m`，`.`→`p`：`-hcp-m1p5`、`-hcp-1p5`） | `<fixture>-tot-<line>`（`-tot-2p5`） |
| name | `{Home} vs {Away} — handicap ±L`（U+2212） | `{Home} vs {Away} — total goals L` |
| side_labels | `{yes:"{HABBR} +L", no:"{AABBR} −L"}` | `{yes:"Over L", no:"Under L"}` |
| options | `<id>-yes`（label = yes 侧）/ `<id>-no`（价 = 1 − yes） | 同左 |
| 其他 | `format:"h2h"`、`event_subtype='SPORTS_MATCH'`、`category='sports'`、start/end/freeze 与 Winner 相同 | 同左 |

真实样例：`sp-epl-ars-liv-hcp-1p5` → side_labels `{"yes":"ARS +1.5","no":"LIV −1.5"}`，options `…-yes` 0.97 / `…-no` 0.03；`sp-epl-ars-liv-tot-2p5` → `{"yes":"Over 2.5","no":"Under 2.5"}`。

### 2.3 兄弟价格派生（`soccer_line_prices`）

以 Winner 当前 1X2 价 `p_home / p_draw / p_away` 为输入，`s = p_home − p_away`：
- Handicap 主队 +L 盖过盘口的 yes 价 = clamp[0.03, 0.97]( 0.5 + 0.5·tanh(0.9·L + 1.6·s) )
- Total Over L 的 yes 价 = clamp( 1 − PoissonCDF(⌊L⌋; λ=2.6) )（0.5≈.93 → 4.5≈.10）
- no 价 = 1 − yes；每次重排 / 一次性修复时重算。

---

## 3. 数据库

### 3.1 新表 `public.sports_league_map`

| 字段 | 类型 | 说明 |
|---|---|---|
| `league` | text PK | 联赛名，与 `metadata.league` 一致 |
| `sport` | text | soccer / basketball / football / hockey / baseball / tennis / motorsport / mma |

RLS 开启，公开只读（anon / authenticated select）。种子 21 行（12 个足球联赛 + NBA/WNBA/EuroLeague/NFL/NHL/MLB/ATP Finals/F1 Qatar GP/UFC 321）。

### 3.2 SQL 函数

| 函数 | 作用 |
|---|---|
| `sim_poisson(λ) → int` | Poisson 采样（Knuth），用于合成比分 |
| `soccer_line_prices(ph, pd, pa) → table(market_type, line, yes_price)` | §2.3 的 9 条线定价 |
| `soccer_winner_prices(fixture_id) → (ph, pd, pa)` | 按 label = home / Draw / away 读 Winner 三价（缺则按 id 顺序兜底） |
| `reprice_soccer_lines(fixture_id) → int` | 用上两者重写该 fixture 未结算兄弟的 yes/no 价 |
| `ensure_soccer_lines(fixture_id) → int` | 幂等：判定足球（`sport='soccer'` OR `format='1x2'` OR league 映射为 soccer）→ 给 Winner 补 `fixture_id/market_type/sport` → 创建缺失的 4 让分 + 5 大小球兄弟（按 §2.2） |
| `roll_sports_matches() → jsonb` | 重写，见 §3.3 |
| `sim_price_tick() → int` | 多选项事件抖动后归一化到和为 1（原先保持旧和） |

### 3.3 `roll_sports_matches()`（pg_cron `roll-sports-matches`，`*/10 * * * *`）

1. 只遍历 `SPORTS_MATCH` 且 `market_type ∈ {null, winner}` 且 `end_date <= now()` 的事件（兄弟不单独遍历）。
2. 未结算的足球比赛：合成比分 `gh ~ Poisson(1.3 + 1.2·max(0,s))`、`ga ~ Poisson(1.3 + 1.2·max(0,−s))`；Winner 按比分判胜（平局 = Draw）；每条兄弟按同一比分判：Handicap yes 赢 ⇔ `gh + line > ga`，Total yes 赢 ⇔ `gh + ga > line`；写 `is_winner / final_price / settled_at / lifecycle_status='SETTLED' / metadata.score`，并 `settle_spot_event`。非足球沿用按价加权随机。
3. 重排：Winner 与全部兄弟一起 `start += 7d`（直到 > now()+2h）、`end = start + 原时长`，重置结算字段与 `kickoff_at`。
4. 重置价：3 选项 → `draw = 0.22 + rand·0.12`，剩余按 `q = 0.35 + rand·0.30` 拆主客，**和恒为 1**；2 选项 → `p / 1−p`；足球随后 `reprice_soccer_lines`。
5. 循环结束后对**所有**足球 Winner 调 `ensure_soccer_lines`——新手工种入的足球赛在下一 tick 自动长出三组。
6. 返回 `{settled, rescheduled, positions_paid, scores[]}`。

一次性迁移已完成：所有 3 选项 Winner 价格按比例归一（原先和为 1.26–1.61）；9 场足球全部补齐 9 兄弟并重定价。

---

## 4. 用户端流程

### 4.1 交易页 `/trade?event=<fixture>`（`LiteContractTrade`）

| 步骤 | 行为 |
|---|---|
| 检测 | `metadata.fixture_id` 存在 → 拉取同 `fixture_id` 的全部 event，按 `market_type` 分组，组内按 `line` 升序 |
| 渲染顺序 | 桌面 "What the crowd thinks / Vol"（移动端由 CrowdOverview 承担）→ **Winner** 组（原有行）→ **Handicap** 组（1 行 + 滑轨）→ **Total goals** 组（1 行 + 滑轨；篮球词为 Total points）→ 规则卡 → 持仓卡 → Market activity → More markets |
| 组标题 | `LiteBoardGroupHeader`：10px 大写标题 + 右侧 "Regulation time" 注记（移动 Popover / 桌面 Tooltip：Settles on the regulation-time result. Extra time and penalties don't count.） |
| 行内容 | 标题 `ARS +1.5 covers` / `Over 2.5 goals`；chance = yes 价；芯片文案 = 该兄弟 `side_labels`；双色条不变 |
| 默认线位 | 深链 `?line=<sibling>` 指定则用之；否则取中间值（让分 +1.5，大小球 2.5） |
| 滑轨 | `LiteLineScrubber`：离散点选、窗口居中（移动 4 格 / 桌面 6 格）、两端翻页、←/→ 键盘、单线不渲染、无拖拽。换线 = 切换该组激活兄弟：标题 / 芯片 / chance / 条 / 图表同步；若该行原本选中，选中态跳到新兄弟同侧 |
| 眉标 | `Sports · Winner · Handicap · Total goals`（只列存在的组） |
| 深链 | `?event=<sibling id>` → 302 到 `?event=<fixture>&line=<sibling>`，并预选该组线位 |
| 下单绑定 | 桌面右栏 / 移动抽屉绑定到选中兄弟：副标 `Arsenal v Liverpool · Handicap · ARS +1.5`；CTA `Buy ARS +1.5`（label 左 / 价格右）；toast `Bought ARS +1.5 · $X` |
| 规则卡 | `{rules 去掉尾句 "Winning shares pay $1."} Winning shares pay $1 each, credited automatically at settlement.`（不再重复） |
| 持仓 | 行内 `You hold ARS +1.5`；持仓卡标题 = 侧名（`ARS +1.5`；>1× 追加 `· 3× Boost`；1× 无后缀）；Cash out 抽屉同规则 |

### 4.2 board 行交互（B，`LiteMarketBoard`，所有多市场 / fixture 页生效）

| 动作 | 桌面 | 移动（compact） |
|---|---|---|
| 点行体（未选中） | 选中该行、side = Yes、展开内联图表，右栏重绑 | 选中该行、side = Yes、展开内联图表；**不**弹抽屉 |
| 点行体（已选中） | 收起图表、清空选中 | 同左 |
| 点 Yes/No 芯片 | 选中该行并切侧；已展开不收起，图表随侧切换 | 同左 + **弹出交易抽屉** |
| 点滑轨 | 只换线，不触发展开/收起 | 同左 |
| 已结算行 | 不可点 | 不可点 |

移动端 board 模式下没有底部 sticky Buy 双按钮，下单唯一入口是芯片 → 抽屉。

### 4.3 列表与可达性

兄弟事件不出现在 /events 各视图、More markets、watchlist、sports ledger（`useActiveEvents` / `useMoreMarkets` 查询侧 `NON_SIBLING_FILTER` + 客户端 `isFixtureSibling`；`useSportsMatches` 只取 winner）。唯一入口 = fixture board。

---

## 5. 文案口径（Lite）

| 允许 | 禁止 |
|---|---|
| Winner · Handicap · Total goals / Total points · Over / Under · covers · Regulation time | Moneyline · Spread(s) · Totals · 1X2 · O/U · Match odds · Line betting |
| 线位带符号，负号 U+2212（`ARS −1.5`），正号 `+` | 无符号线位（"1.5 / 2.5"） |
| 侧名 = side_labels（`ARS +1.5`） | 带 side_labels 的市场写 Yes/No |
| `3× Boost`（仅 >1×） | `1× Boost` |

已落档：`docs/copy-dictionary.md`「Sports game lines」节、`.lovable/memory/design/lite-banned-words.md`、`DESIGN.md` §7「Sports game lines（2026-08-17）」与「Priced buttons (site-wide, Lite)」。

---

## 6. 已删除 / 已变更

| 项 | 说明 |
|---|---|
| `roll_sports_matches()` 旧版 3 选项定价 `p / 1−p / 1−p` | 已替换为和恒为 1 的 draw + 主客拆分；历史数据已归一 |
| `sim_price_tick()` 多选项"保持旧和" | 改为归一化到 1.0 |
| 持仓卡 / HoldChip 的 `{option} · Yes` 拼装（带 side_labels 市场） | 改为侧名本身（`legSideLabel`） |
| 任何 `1× Boost` 文案 | 不再产生（`boostSuffix`） |
| 规则卡重复的 "Winning shares pay $1." | 去重 |
| board 行仅芯片可点 | 整行可点（§4.2） |
| 带价按钮居中排版（`SideButton`、Spot/QuickTrade CTA） | label 左 / 价格右（v1.1 顺带，DESIGN §7 LOCKED） |

---

## 7. Style Guide

`/style-guide` → Lite → 交易页 → **Sports game lines**（真组件 + 375 iframe / 桌面双端）：

| key | 展示 |
|---|---|
| `trade-sports-lines-default` | Winner 3 行 + Handicap +1.5 + Total 2.5，未选中 |
| `trade-sports-lines-handicap-selected` | ARS +1.5 Yes 选中、内联图表展开；行内 "You hold ARS +1.5"；Total 组之后一张持仓卡 `ARS +1.5`（1× 无后缀） |
| `trade-sports-lines-scrubbed` | 让分滑到 −2.5，未选侧 |
| `trade-sports-lines-single-line` | Total 组单线 → 无滑轨 |
| `trade-sports-lines-settled` | Winner 已结算、Handicap 仍 live |
| `line-scrubber` | 独立滑轨：桌面 6 格 / compact 4 格、边缘翻页 |

Multi-market states 子区两个 Cell 已按 §4.2 行交互更新（移动 Cell 标注 "row tap opens chart (chips open the drawer)"）。

---

## 8. 涉及文件

前端：`src/components/lite/multi/LiteMarketBoard.tsx`、`LiteLineScrubber.tsx`（新）、`LiteBoardGroupHeader.tsx`（新）、`src/components/lite/sports/sportsData.ts`、`src/lib/liteSideName.ts`、`src/pages/lite/LiteContractTrade.tsx`、`src/hooks/useActiveEvents.ts`、`src/components/lite/shared/SideButton.tsx`、`src/pages/lite/LiteSpotTrade.tsx`、`src/pages/lite/LiteQuickTrade.tsx`。
Style-guide：`src/pages/StyleGuide/preview/sportsLinesPreviews.tsx`（新）、`preview/registry.tsx`、`sections/LiteSection.tsx`、`sections/LiteSpotSection.tsx`、`sections/pages/litePages.tsx`。
数据库：`supabase/migrations/20260817111335_*`（v1 手工种子）、`20260817111353_*` / `20260817113258_*`（demo 仓位）、`20260818032303_*`（league map + 函数）、`20260818032402_*`（roll / price tick 重写）、`20260818032421_*`（一次性归一 + 全量补线）、`20260818032637_*`（首跑）。
文档：`DESIGN.md`、`docs/copy-dictionary.md`、`.lovable/memory/design/lite-banned-words.md`、`.lovable/memory/product/lite-multimarket.md`。

---

## 9. 未变更项

- 下单 / 结算 / 持仓 / Cash out 链路、`positions` / `trades` / `event_options` 表结构：未动。
- Winner（1X2 / 二选一）行的样式与逻辑、非体育多市场事件的 board DOM：未动（行交互 §4.2 是通用增强）。
- 非足球赛事（NBA / NFL / NHL / MLB / UFC / F1 / ATP）：不生成让分 / 大小球，Winner 结算仍按价加权随机。
- Sports 纵向列表 / 日历：仍只展示 Winner；"+N markets" 露出、Exact score / Halves / Corners 等二级分组：本期不做。
- cron 作业清单与时刻表：未改（仅 `roll_sports_matches` 函数体重写）。
