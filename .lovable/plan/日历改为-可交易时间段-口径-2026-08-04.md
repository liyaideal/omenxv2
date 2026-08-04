# 日历改为“可交易时间段”口径

现在的日历把每个市场压成一个时间点（结算时刻），所以一个 7/1 开盘、9/30 结算的市场只在 9/30 那天出现一次，看起来“事件都不见了”。改成区间口径：市场是一条从开盘到停盘的横向通栏条，跨越它覆盖的所有日子。

## 口径

- 交易区间 = `start_date` → `end_date`（停盘一律以 `end_date` 为准）。
- 缺 `start_date` 时按“已开盘”处理，区间起点取窗口左边界。
- 单日事件（区间落在同一天内）仍按原来的点状 ticket 渲染，不变成通栏条。
- 体育比赛（开球时刻）与股票收盘钟（session close）本质是时间点，保持现在的点状卡片，不做通栏。

## Week 模式（桌面）

```text
        TODAY   WED 5   THU 6   FRI 7   SAT 8   SUN 9   MON 10
SPANS  [ Fed cuts rates in September ................ → ]
       [ ← Bitcoin above $150k ....................... → ]
       ------------------------------------------------------
DAY    09:30 US close   19:00 UCL      ...
       21:00 Arsenal…   ...
```

- 网格顶部新增 **Spans 泳道**：每条跨天市场一条通栏条，按覆盖的列数拉伸；被窗口截断时在对应端显示 `←` / `→`。
- 条上文字：市场名 + 右侧 `Closes 30 Sep`（若停盘在窗口内则显示具体时刻）。
- 泳道默认最多 5 条，多出折叠为 `+N more open markets`，点击展开。
- 下方按天分列的部分只保留“当天定生死”的点状项：体育开球、股票收盘钟、以及停盘就在那天的市场。
- 现有的第 8 列 “Later” 取消——长周期市场现在由 Spans 泳道承载，不再被挤到窗口外。

## Month 模式（新增）

Week/Day 分段控件增加第三档 **Month**。月视图为 6×7 日期网格，跨天市场以通栏条横跨所在周的若干格（跨周时按周切段，续接段带 `←`）；点状项在格子里以小圆点+计数呈现，点格进入 Day 模式。

## Day 模式

时钟主轴不变，顶部增加一行 **Open all day**：当天处于可交易状态但不在当天停盘的市场，作为通栏条列出，与主轴上的定点事件区分开。

## 移动端

保持 Week（单日列表）。列表顶部新增 `Open now` 分组，列出当天可交易的跨天市场（每条右侧标 `Closes 30 Sep`）；下方仍是当天的定点事件。日期条上的 `LATER` chip 移除。

## 技术要点

- `src/components/lite/calendar/calendarData.ts`：`CalItem` 增加 `from`/`to` 与 `spanning: boolean`；`buildCalendarItems` 用 `[start_date, end_date]` 与窗口做区间相交而不是点包含；新增 `buildSpanLanes(items, windowStart, days)` 做贪心排道，返回 `{ item, colStart, colSpan, clippedLeft, clippedRight }`；新增 `buildMonthGrid`。`horizonDays` / Later 相关分支删除。
- `useMarketListData` 的 `EventRow` 增加 `opensAt: Date | null`（映射 `events.start_date`）。
- `src/components/lite/calendar/CalendarBlocks.tsx`：新增 `SpanBar`（通栏条，沿用 Week ticket 的分类色轴：Intraday 橙 / Sports chalk / 其它中性 EdgeBar），新增 `SpanLane` 容器与 `MonthCell`。
- `src/components/lite/calendar/LiteCalendarView.tsx`：`mode` 扩为 `"day" | "week" | "month"`；Week 网格加泳道行；移动端加 `Open now` 分组。
- 全部条与格保持 CHK-8：点击直接进 `/trade` 或 `/spot`，不新建交易页。
- CHK-5：`/style-guide` 的 Lite · Calendar 区块补充 Spans 泳道（满/折叠/左右截断）、Month 模式、Day 模式 Open all day、移动端 Open now 共 6 个 preset，时钟仍冻结在 `2026-08-03T15:20:00Z`。
- `DESIGN.md` 日历章节改写为区间口径，并记录“结算点 vs 可交易区间”的判定规则。