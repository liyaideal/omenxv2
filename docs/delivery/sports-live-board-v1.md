# Sports Live Board（电竞 / MMA 分段盘口板 + 直播舞台）— 交付说明 v1

> 这份文档讲的是 `/trade` 上体育赛事的三块东西：顶部的记分牌、记分牌下面的直播播放器、以及再往下的盘口板。
> 这一轮用户能看见的变化：CS2 这类分地图的赛事，盘口不再是一长条，而是按「赛列 / Map 1 / Map 2 / Map 3」竖着分组，每组右侧写明这一段打完没有、比分多少；桌面端点记分牌的列头（M1 / M2 / M3）会滚到对应那一组。
> 足球盘口板、下单面板、记分牌本身的尺寸都没动。
> 读法：先看 §0 查什么去哪儿，再按章节读；每个数值都标了出处代码文件。

## §0 读者须知

- **长什么样** → 生产页：`/trade?event=demo-live-cs2`（CS2 直播示例，7×24 常驻）、`/trade?event=demo-prekick-cs2`（即将开赛示例，常驻）、`/trade?event=ufc-321-per-ank`（MMA）、`/trade?event=sp-epl-ars-liv`（足球，两个半场形态）。
- **什么时候变** → `/style-guide` 状态字典：直播舞台与记分牌看 `Sports · Live`（M1…M6 / U1…U4 / S1…S9 / C1…C4），分段板看 `/trade` 字典的 TR-25 / TR-26。
- **字段 / 文案 / 公式 / 术语** → `docs/copy-dictionary.md` 的 `Sports game lines` 与 `Sports live stage` 两节 + 本文档。
- Lite 词 ↔ 交易词的映射统一见 `docs/copy-dictionary.md` 顶部的「Lite 术语对照表」，本文档不复制。

## §1 兄弟事件模型

一场赛事在库里是 1 条主行 + N 条兄弟行，全部靠 `events.metadata` 串起来。

| 字段 | 谁写 | 谁读 | 含义 |
|---|---|---|---|
| `fixture_id` | seed / 引擎 | `sportsData.groupSegmentedMarkets` | 兄弟行指回主赛事 id |
| `market_type` | seed | 分组器、`isFixtureSibling` | `winner`（主行） / `handicap` / `total` / `mapwin` / `method` / `distance` |
| `line` | seed | 分组器、让分尺 | 盘口档位，升序排列 |
| `family` | seed | 分组器 | `main` = 赛列级；`seg` = 某一段内 |
| `segment_index` | 引擎（主行）/ seed（兄弟行） | 分组器、`buildModel` | 主行 = 当前进行到第几段；兄弟行 = 这条盘口属于第几段 |
| `segment_results` | `tick_live_matches()` / `tick_demo_showcase()` | `buildModel` | 每段比分数组，未开打为 `null` |
| `segments_key` | seed | `SPORT_SEGMENTS` 查表 | `IEM Cologne · BO3` / `UFC · main` 等，决定段数与决胜分 |

## §2 分段板分组规则

`groupSegmentedMarkets(fixture, siblings, currentSegment)`（`src/components/lite/sports/sportsData.ts`）输出 `BoardGroup[]`：

| 组 key | 标题 | segmentIndex | 内容 |
|---|---|---|---|
| `grp-series` | Series lines | `null` | 主行 winner + 当前段那一条 `mapwin` + `family==='main'` 的 handicap / total |
| `grp-seg-{n}` | `Map {n}` | `n` | `family==='seg' && segment_index===n` 的 handicap / total |
| `grp-fight` | Fight lines | `null` | 主行 winner + `market_type==='total'` |
| `grp-method` | Method | `null` | `market_type==='method'` 按 id 升序 + `distance` 一条 |

BO3 = 4 组 10 行：`grp-series` 4 行（winner + mapwin + handicap + total）+ 3 × `grp-seg-{n}` 各 2 行。
`mapwin` 只渲染 `currentSegment` 指向的那一条；`currentSegment` 为 `null` 时一条都不渲染。空组（无任何行）被过滤，不渲染组头。MMA 不产分段组（`decisiveThreshold === null`，回合不计分）。

## §2b 记分牌的运动形态

记分牌是一套表头跑多个项目：**队伍在行，分段在列**，左边那个大数字是这个项目里市场结算依据的单位。列数、列宽、表头词、大数字怎么算、右上角显示什么，全部由 `SegmentSpec` 决定。

规格从两张表里取，优先级：先按赛事的 `metadata.segments_key` 查 `SPORT_SEGMENTS`；查不到再按 `metadata.sport` 查 `SPORT_FALLBACK`。**两张都查不到才退化**成「只有队名列 + 一个总数列」的形态（字典 M6 就是这一态）。有兜底表的意义是：新开一个足球联赛不必往 `SPORT_SEGMENTS` 加一行。

| 项目 | 取自 | 分段单位 | 列头 | 列宽 | 大数字表头词 | 大数字怎么算 | 右上角 |
|---|---|---|---|---|---|---|---|
| CS2 BO3 / BO5 | `SPORT_SEGMENTS["IEM Cologne · BO3" / "· BO5"]` | 地图 | `M1` `M2` `M3`… | 62 | `maps` | 赢下的地图数（段内达到 13 回合才算打完） | 当前图比分 |
| UFC 主赛 / 前战 | `SPORT_SEGMENTS["UFC · main" / "· prelim"]` | 回合 | `R1`…`R5` | 48 | 不渲染总数列 | —— | 回合钟 `2:30` |
| 足球 | `SPORT_FALLBACK.soccer` | 半场 | `1H` `2H` | 70 | `goals` | 两个半场进球**相加** | 比赛分钟 `63′` |

两条容易踩的口径：

1. **大数字有两种算法**。CS2 是「赢下的段数」（`totalsRule: "won"`），足球是「各段值相加」（`totalsRule: "sum"`）。拿 CS2 的算法去看足球会得出 1–0 应该显示成「赢了 1 个半场」，那是错的。
2. **足球的当前半场是推出来的**，不是库里的字段。足球赛事没有 `metadata.segment_index`，开赛超过 45 分钟即判为下半场。因此足球不进 `BREAK` 态——中场休息本轮没做。

设计画布上还画了**篮球（四节 + OT，单位 `pts`）、网球（盘/局/分三层，单位 `sets`）、LOL·Dota（局，格子写 W/L，单位 `games`）**三个项目，本轮**未实现**：它们的赛事目前不入库，实现前会掉进退化态。

## §3 分组头注记三态

| 态 | 判定表达式 | 渲染 |
|---|---|---|
| 已打完 | `results[n-1] != null && max(home,away) >= decisiveThreshold` | `Final 13–8` |
| 进行中 | `n === model.idx && (status === "live" \|\| status === "break")` | LIVE 药丸 + 现比分（橙 `#FF8A3D`） |
| 未开打 | 以上都不成立 | `Not played yet` |

约束（红线）：注记**只能**由 `boardGroupAnnotation(model, key, segmentIndex)` 产出，`model` 来自 `useMatchboardModel(fixture)`。生产页与 style-guide 共用这**一份**实现（导出自 `src/pages/lite/LiteContractTrade.tsx`）。任何第二处自算比分都是缺陷。

## §4 兄弟事件的可见性边界

`isFixtureSibling()` 覆盖 `handicap` / `total` / `mapwin` / `method` / `distance`；`NON_SIBLING_FILTER` 只放行 `market_type` 为 `null` 或 `winner` 的行。因此这五类兄弟行**永远**不出现在 `/events` 列表、More markets、账本、自选、结算台——它们只能从盘口板进入。

## §5 直播播放器

- 真直播判定：`useHlsVideo` 读 `video.duration === Infinity`（点播源会给有限值，因此不会被误判为直播）。
- 九态 S1…S9 见 style-guide `Sports · Live`，覆盖加载 / 缓冲 / 断流 / 无源 / 结束等。
- 迷你播放器固定 300×229，滚动出舞台后自动接管，`<video>` 元素**不重挂**（页面上始终只有一个 `video`）。
- 全屏是**页面级 CSS 全屏**（`position: fixed; inset: 0; z-index: 60`），**不是** Fullscreen API：预览 iframe 会以 `Permissions check failed` 拒绝 `requestFullscreen()`。ESC 退出，全屏期间锁 `body` 滚动。

## §6 滚动联动

桌面记分牌列头在存在分段组时渲染为 `<button>`，点击 → `document.getElementById("grp-seg-{n}").scrollIntoView({ behavior: "smooth", block: "start" })`。让位量来自 `LiteBoardGroupHeader` 的 `scrollMarginTop: calc(var(--mobile-header-h, 56px) + 56px)` = 112px；实测点击 M2 后 `grp-seg-2` 的 `top` = 112.0px。目标组不存在时静默 no-op。UFC 与足球没有分段组，列头保持 `<div>`，零变化。

移动端不做跳转（明写不做，不是漏掉）：移动记分牌是降级横条，没有列矩阵；`CellTrack` 单元高 3px，做成可点击命中区低于 44px 触达底线。不为此新造移动端跳转控件。

## §7 常驻演示夹具（运维必读）

| 赛事 | 作用 |
|---|---|
| `demo-live-cs2` | 7×24 直播中示例 |
| `demo-prekick-cs2` | 7×24 待开赛示例 |

- 这两条主行**故意不带 `metadata.family`**，所以 `tick_live_matches()` 的 WHERE 选不中它们，不会被常规引擎结算。
- `tick_demo_showcase()` 每 5 分钟跑一次：推进比分、换段结算、然后**先结算再立刻重开**，并把 `start_date` 重置为 `now()`——因为 `settle_spot_event()` 按 `pos.created_at >= ev.start_date` 圈仓，不重置会把上一轮的仓位算进来。
- 换段时会连 36 条 sibling 的 `metadata.score` 一起清空。

## §8 已知数据缺口台账（等真实赛事源）

| 缺口 | 现状 |
|---|---|
| 地图名 | 组头只有 `Map 1` / `Map 2` / `Map 3`，无 `Map 2 · Mirage`；不编造 |
| UFC 结算结果上下文 | 无 `Won by KO/TKO · R2 3:41` 行 |
| 移动降级条 | FINISHED / SETTLED 态没有 `In review` 徽标 |
| 移动降级条 | 结算后仍显示 `MAP 3` 段签 |
| 足球半场比分 | 库里 `segment_results` 为空，`1H` / `2H` 两格恒为 `·`，`goals` 大数字恒为 0；等真实赛事源 |
| 足球中场休息 | 不进 `BREAK` 态，本轮未做 |
| 移动端全屏 | 移动内联舞台右下只有静音键，**没有全屏入口**（桌面内联右下与迷你条上才有）；是否要补待定 |
| 篮球 / 网球 / LOL·Dota | 画布已定形态，未实现 |

## §9 状态索引

| 模块 | style-guide case |
|---|---|
| CS2 分段板（Series lines + Map 1/2/3） | `/trade` 字典 TR-25 |
| MMA 分段板（Fight lines + Method） | `/trade` 字典 TR-26 |
| 记分牌 | `Sports · Live` M1…M6 |
| 待开赛 | `Sports · Live` U1…U4 |
| 直播舞台九态 | `Sports · Live` S1…S9 |
| 迷你窗 / 全屏 | `Sports · Live` C1…C4 |
| 足球记分牌（进行中 / 未开赛） | `Sports · Live` F1 / F2 |
| 移动 sticky 记分条 | `Sports · Live` M7 |
| 表外赛事退化 | `Sports · Live` M6 |

## §10 涉及文件

**前端**
- `src/components/lite/sports/LiveMatchboard.tsx`（列头 `onSegmentSelect`）
- `src/components/lite/sports/matchboardModel.ts`（共享模型 + 共享时钟）
- `src/components/lite/sports/LiveStage.tsx` / `src/hooks/useHlsVideo.ts`
- `src/components/lite/sports/sportsData.ts`（`groupSegmentedMarkets` / `isFixtureSibling`）
- `src/components/lite/multi/LiteBoardGroupHeader.tsx`（`anchorId` / `annotation`）
- `src/pages/lite/LiteContractTrade.tsx`（分段板渲染 + 注记单一实现 + 滚动联动）
- `src/pages/StyleGuide/preview/sportsLinesPreviews.tsx`、`preview/registry.tsx`、`sections/TradeStatesSection.tsx`
- `src/lib/sportSegments.ts`（`SegmentSpec` / `SPORT_SEGMENTS` / `SPORT_FALLBACK`）

**数据库**
- `tick_live_matches()` / `tick_demo_showcase()` / `roll_sports_matches()`
- `src/lib/sportSegments.ts`（`SPORT_SEGMENTS` 静态表）

## §11 未变更项

- 足球盘口板（Winner / Handicap / Total goals）：桌面 828 宽 / 移动 343 宽、组头高 15.25、x = 24 / 16，与本轮前一致。
- 记分牌几何：桌面 828 × 138.4（live 态）未动。
- 下单面板、Boost 档位、账本、`HomeSportsCard` 未动。

> 修订：2026-09-01 补足球两个半场形态（SP-L4d）、字典 F1 / F2 / M7、§2b 运动形态表。
