# /resolved 页面改版 — 交付说明

> 本文档覆盖 2026-05-21 16:11（UTC+8）之后落地的全部 /resolved 相关改动：列表 UI 改版、头部筛选结构对齐 /events、My Settled 视图数据回填、结算价口径修正。研发以本文档为准；旧 `ResolvedEventCard` 组件已删除，相关引用请同步清理。

## 1. 功能目标

- /resolved 列表从单层卡片升级为 **Event → Markets** 两级结构，与 /events 视觉与交互一致。
- 头部筛选区按 /events 的"Tabs + 内联筛选 + 移动 Drawer"三段结构拆开，去掉冗余筛选项。
- 详情页 Final Results 与 Price History 改为**二元合约价口径**（winner=$1.00，loser=$0.00），不引入概率/百分比。
- 列表与详情页都不再渲染原始 `event_options.final_price`（数据库口径混乱，会出现 `$83.29`、`$1.40` 这类异常值）。
- `My Settled` 视图首次有可演示数据：新用户注册即回填 4 笔已结算交易与对应持仓。

## 2. /resolved 列表改版

### 2.1 信息结构

| 层级 | 组件 | 内容 |
|---|---|---|
| Event 分组 | `ResolvedGroupedGrid` | 按 `eventName` 聚合，渲染分组标题 + 该分组下的 Markets 网格 |
| Market 卡片 | `ResolvedMarketCard` | 单个 option 的结算结果，无价格数字 |

- 分组逻辑统一在 `src/lib/resolvedGrouping.ts`，输入扁平 options 列表，输出 `{ eventName, markets[] }[]`。
- 单事件（如 binary YES/NO）也走相同分组结构，避免列表节奏不一致。

### 2.2 Market 卡片视觉规则

| 元素 | 规则 |
|---|---|
| 价格数字 | **不显示**（原 `$0.6234` / `$83.29` 全部移除） |
| Winner 标识 | 右上 `Winner` Badge（trading-green），loser 无 badge |
| 图标 | `Check`（winner）/ `X`（loser），Lucide React，禁止 emoji |
| 文案颜色 | Winner `text-trading-green font-medium`；其他 `text-muted-foreground` |

### 2.3 视图切换 — All Resolved / My Settled

- `ResolvedViewToggle` 改为 `EventTabs` 同款 tab 按钮：active = `bg-primary/15 text-primary`，inactive = `text-muted-foreground`，外层 `overflow-x-auto scrollbar-hide`。
- `My Settled` 通过 `trades.event_name = events.name` 关联（见 §4 数据回填）。

## 3. 头部筛选结构

对齐 /events 的三段式头部：

```text
┌────────────────────────────────────────────┐
│ Title 行                                    │
├────────────────────────────────────────────┤
│ Tabs 行（All Resolved / My Settled）         │← ResolvedViewToggle，独立一行
├────────────────────────────────────────────┤
│ 桌面筛选行（Search + Category Select）       │← ResolvedFilters，无 Card 包裹
└────────────────────────────────────────────┘
```

### 3.1 桌面端

- `ResolvedFilters` 退化为内联筛选 chip：`Search` 输入框 + `Category` Select。无 Card 容器，与 /events `FilterChips` 同款。
- View Toggle 不再嵌在 ResolvedFilters 内，由 `ResolvedPage` 单独渲染一行。

### 3.2 移动端

- `MobileResolvedFilterDrawer` 收纳全部筛选：View 切换、Search、Category、Reset/Apply。
- Drawer 内容遵循项目 MobileDrawer 规范：卡片 `rounded-lg border bg-muted/30 p-3`、正文 `text-xs`、表单控件 `text-sm`、底部 `MobileDrawerActions` + Cancel(Outline) + Apply(`h-11`)。

### 3.3 已废弃的筛选项

| 项 | 状态 | 原因 |
|---|---|---|
| Status 多状态 Select | 已删除 | 列表本身只有 Resolved 一种状态，过滤无意义 |
| Sort by Settlement Date | 已删除 | 默认按结算时间倒序，用户无需手选 |
| Search by tag | 已删除 | 列表元数据中不再展示 tag |
| ResolvedFilters 内嵌的 View Toggle | 已迁出 | 移到 ResolvedPage 顶部独立一行 |

## 4. My Settled 数据回填

为 `My Settled` 视图提供新用户默认演示数据，写入 `handle_new_user()` trigger（migration `20260521084556_*.sql`）。

### 4.1 新增的 settled 交易

| event_name | option | price | qty | pnl | closed_at |
|---|---|---|---|---|---|
| Will Bitcoin exceed $100K by end of 2024? | YES | 0.62 | 300 | +114.00 | -10d |
| Will Fed cut interest rates in December 2024? | Yes | 0.58 | 200 | +84.00 | -14d |
| Super Bowl LVIII Winner | San Francisco 49ers | 0.48 | 250 | −120.00 | -45d |
| Oscar Best Picture 2024 | Oppenheimer | 0.71 | 150 | +43.50 | -60d |

- 每笔交易在 `trades` 表写一行 `status='Filled'`，同时在 `positions` 表写一行配套 `status='Closed'`，`mark_price` 用 1.00 / 0.00 体现结算结果。
- 关联方式：`trades.event_name` 与 `events.name` 完全一致即可匹配；不引入新字段。

### 4.2 trigger 行为约束

- `handle_new_user` 触发时间 = 注册成功瞬间。
- 已存在用户不回填（无补丁脚本，按"新用户体验数据"定位）。
- `profiles` 沿用 `ON CONFLICT DO UPDATE`；trades/positions 直接 INSERT，不去重。

## 5. 详情页：Final Results + Price History 口径

### 5.1 Final Results 卡片

| 选项类型 | 渲染 |
|---|---|
| Winner | `Check` 图标 + 选项名（trading-green）+ `$1.00`（font-mono, trading-green）|
| Loser | `X` 图标 + 选项名（muted）+ `$0.00`（font-mono, muted）|

- 桌面：`grid-cols-2` 双列；移动：单列堆叠。
- 不再读取 `option.final_price`；只根据 `is_winner` 决定 $1.00 / $0.00。
- 全程不出现概率/百分比（如 `83%`、`Closing X%`）。

### 5.2 Price History Chart

- 全部价格归一化到 **0–1 美元二元合约价区间**；y 轴 grid label 统一 `$0.xx`。
- 真实价格序列：若数值 > 1，按 `value / 100` 归一；序列末点强制对齐 winner=1 / loser=0。
- Mock 数据（无真实历史时）：起点用 `option.price`（已为 0–1），随机游走 ±0.08，clamp `[0.01, 0.99]`，最后 30% 区间向 target 收敛，末点 = target。
- Tooltip 内的"涨跌幅 %"（`+12.3%`）保留，那是变化率不是概率，对齐 /events 列表 chg 列习惯。

## 6. 已删除 / 已废弃

| 项 | 说明 |
|---|---|
| `src/components/ResolvedEventCard.tsx` | 旧版整事件卡片，被 `ResolvedGroupedGrid` + `ResolvedMarketCard` 替代 |
| ResolvedEventCard 内的 `${final_price}` 文案 | 列表层不再展示价格 |
| ResolvedFilters 内嵌 View Toggle | 上移至 ResolvedPage |
| Status / Sort / Tag 筛选 | 见 §3.3 |
| PriceHistoryChart 中 `option.final_price ?? option.price * 100` 缩放逻辑 | 改为统一 0–1 归一化 |
| ResolvedEventDetail Final Results 中的 `(final_price ?? price).toFixed(4)` | 改为 `is_winner ? "1.00" : "0.00"` |

## 7. Style Guide 参考

- /events `EventTabs`、`FilterChips`：tabs + 内联筛选的视觉基准。
- DESIGN.md §5.1 Mobile Drawer：`MobileResolvedFilterDrawer` 排版与按钮规范。
- 项目 Core memory：font-mono 用于价格数字；图标使用 Lucide，禁用 emoji。

## 8. 涉及文件

**前端**
- `src/pages/ResolvedPage.tsx` — 头部三段式结构、tab/filter 分离、Mobile Drawer 接线
- `src/pages/ResolvedEventDetail.tsx` — Final Results 渲染口径
- `src/components/ResolvedFilters.tsx` — 桌面筛选 + Mobile Drawer
- `src/components/resolved/ResolvedViewToggle.tsx` — All Resolved / My Settled tabs
- `src/components/resolved/ResolvedGroupedGrid.tsx` — Event 分组渲染（新增）
- `src/components/resolved/ResolvedMarketCard.tsx` — Market 卡片（新增，无价格）
- `src/components/resolved/PriceHistoryChart.tsx` — 0–1 价格归一化
- `src/lib/resolvedGrouping.ts` — 分组工具函数（新增）
- `src/hooks/useResolvedEvents.ts` — 跟随 Filter 精简同步移除冗余参数

**数据库**
- `supabase/migrations/20260521084556_f4204021-bfae-49cd-ab9a-b232bd9adbf3.sql` — `handle_new_user` 回填 4 笔 settled trades + 4 条 closed positions

**已删除**
- `src/components/ResolvedEventCard.tsx`

## 9. 未变更项

- `event_options.final_price` 字段本身、列结构、写入逻辑（仅停止读取展示）。
- `useResolvedEventDetail` hook 数据契约。
- `EventStatisticsCard` / `SettlementEvidenceCard` / `EventRulesCard` / `RelatedEventCard` / `SettlementTimeline` 组件。
- /portfolio、/wallet 相关结算页面。
- 首页、/events 列表、详情页交易区。
- 移动端与桌面端整体布局节奏未变（仅头部按 §3 重排）。
