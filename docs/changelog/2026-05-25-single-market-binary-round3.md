# Single-market binary 收敛（第三轮）— 交付说明

> 接续 `2026-05-25-single-market-binary-collapse.md`（第一轮：Market chip 折叠 + sideLabels schema）与 `2026-05-25-sidelabels-platform-wide.md` / `-round2.md`（第二轮：列表/详情/海报别名贯穿）。本轮聚焦 **Trade 页本体**：Yes/No 切换按钮的视觉与等高规范、`Market:`/`Select Option:` 行的彻底删除、以及 sideLabels 别名在 Trade 面板与所有方向 UI 的最后一公里。研发以本文档为准；前两轮规范继续生效，本文档对其中"Trade 页相关条款"做加固。

## 1. 功能目标

把单 market binary 事件（两个 option、labels 为 `Yes/No`）在 `/trade` 的所有"方向"表达完全收敛到：

- 顶部不再出现 `Market: Yes or No` 行，也不再有 `Select Option:` chip。
- 方向只通过 Trade 面板顶端的两个等高按钮切换；按钮文案在事件配置了 `sideLabels` 时显示别名（如球员/球队名）而非 `Yes / No`。
- 所有衍生方向位（提交按钮、Order Preview、Side 字段、跨事件聚合表的 side 列、Close/Cancel 弹窗）必须同步显示别名。

## 2. 关键改动对照

| 维度 | 第一/二轮 | 本轮（第三轮） |
|---|---|---|
| `Market:` 行 | 折叠成只读标签 | **完全删除**（既冗余又占空间） |
| `Select Option:` chip（binary） | 隐藏 yes/no chip 但保留容器 | 完全删除；多 outcome 事件保留 |
| Yes/No 按钮高度 | 各自计算，长别名会撑高单侧 | `grid items-stretch` + 按钮 `h-full` + 上层 `flex-1` 三层叠加，**两侧必须等高** |
| 价格条 | 同一卡片内排版 | `border-t` 分隔，选中态 `bg-trading-{green,red}/85`，未选中 `bg-muted-foreground/15` + `text-foreground/80` |
| 别名文案 | 列表/详情/海报 | 加上 **Trade 提交按钮 / OrderPreview / TradingCharts / 跨事件聚合表 / Close & Cancel 弹窗** |

## 3. UI 规范（写入 DESIGN.md §Single-Market Binary Trade Toggle）

### 3.1 高度自适应
- 容器用 `grid items-stretch`，按钮 `h-full`，上层 `flex-1`；长标签用 `line-clamp-2` 撑两行。
- **严禁**给按钮硬编码 `h-14` / `h-16`，也**严禁**省略 `flex-1` 或 `h-full`。否则短标签那侧会出现底部空隙、参差不齐。
- 一侧因长名撑高时，另一侧 label 区自动拉伸填齐，价格条始终对齐。

### 3.2 选中态视觉
- 选中：`bg-trading-green/85` / `bg-trading-red/85`
- 未选中：`bg-muted-foreground/15` + `text-foreground/80`
- 价格条用 `border-t` 与按钮主体分隔。

### 3.3 sideLabels 别名传播规则
事件配置 `sideLabels` 时，所有"方向"UI **必须**用别名替换 Yes/No。

**Mobile**（已在 round-3-mobile 完成）：
- Trade 面板切换按钮、提交按钮（`getIntentLabel(intent, side, sideLabels)`）。
- OrderPreview Side 字段与确认按钮。
- TradingCharts 方向 chip / 图例 / 底部 toggle。
- 持仓 / 订单卡片：当 `displayOption` 已是别名（`isBinaryAlias = displayOption !== option && (option === "Yes" || option === "No")`），**禁止**再挂冗余 Yes/No chip；详情面板 `"Yes/No + leverage"` → `"alias + leverage"`。

**Desktop `/trade`**（本轮新增）：
1. **当前事件作用域**（DesktopTrading 顶层 `binaryLabels` / `isBinarySingleMarket`）
   - Trade 提交按钮 + Order Preview 确认按钮：`getIntentLabel(orderIntent, side, isBinarySingleMarket ? binaryLabels : undefined)`
   - Order Preview 顶部 side chip 与 `orderDetails` Side 字段：`resolveBinarySideLabel(side === "buy" ? "yes" : "no", isBinarySingleMarket ? binaryLabels : undefined)`
2. **跨事件聚合表**（Open Orders / Positions / Airdrops 的 side 列、Close Position Dialog 的 Position 行、Cancel Order AlertDialog 的 Order Type 行）：通过 `useEventSideLabelsLookup()` 按行的 `event` 名解析对应 sideLabels，再 `resolveBinarySideLabel(...)`；非 single-market binary 或 lookup 失败回退 `Yes/No`。

**禁止**在 desktop 或 mobile 任何 binary 方向位置硬编码 `"Yes" / "No"` 字面量。

## 4. 数据 / Helper

| 项 | 类型 | 说明 |
|---|---|---|
| `useEventSideLabelsLookup()` | hook | 新增，遍历 `useActiveEvents()`，返回 `(eventName) => { isBinary, labels }`，供跨事件聚合表按行解析 |
| `resolveBinarySideLabel(side, labels)` | util | 新增，`(yes|no, {yes,no} | undefined) => string`；labels 缺省回退 `"Yes" / "No"` |
| `getIntentLabel(intent, side, sideLabels?)` | 既有，扩参 | 第二轮已加 `sideLabels` 形参；本轮在 desktop 全部调用点补传 |
| `isSingleMarketBinary(options)` / `getBinarySideLabels(event)` / `parseSideLabels(raw)` | 既有 | 无改动 |

未改动：`TradingEvent.sideLabels` schema、`positionIntent` 公式、`option_id` 主键、Yes/No 独立持仓模型（详见 `binary-event-no-as-native-position`）。

## 5. 用户端流程

### 5.1 Mobile `/trade`
- 顶部 chip 行：单 market binary 完全不渲染 `<OptionChips>`；多 outcome 正常渲染。
- Trade 面板：Yes/No 按钮等高、显示别名；提交按钮文案随别名变化。
- 提交后跳 `/trade/preview`：Side 字段 + 确认按钮均显示别名。
- 持仓/订单/Charts：方向相关 chip 与文字均走 `displayOption` / sideLabels。

### 5.2 Desktop `/trade`
- 主 Trade 面板与 Order Preview Dialog：与 mobile 一致的别名规则。
- 下方 Open Orders / Positions / Airdrops 三张表的 "Side" 列：按行 lookup 自己事件的 sideLabels。
- Close Position Dialog 与 Cancel Order AlertDialog：同上。

## 6. 已删除 / 已废弃

| 项 | 说明 |
|---|---|
| `Market: Yes or No` 行（binary 单 market） | DesktopTrading 与 MobileTradingLayout 均移除 |
| `Select Option:` chip（binary 单 market） | 同上；多 outcome 仍保留 |
| 硬编码 `"Yes" / "No"` 字面量（任何方向 UI） | desktop `/trade` 共 9 处已替换；mobile 已在 round-3-mobile 替换 |
| 按钮固定高度 `h-14` / `h-16`（binary 切换器） | 禁用；改 `h-full + flex-1` 自适应 |

## 7. Style Guide

- `/style-guide` → Trading Section：单 market binary 切换器 playground 已更新，演示等高、别名、选中态。
- 文档与规范同步：`mem://design/single-market-binary-ui` 已覆盖 mobile + desktop 双端规则。

## 8. 涉及文件

**前端 — Hook / Util（新增）**
- `src/hooks/useEventSideLabelsLookup.ts`（新增 hook + `resolveBinarySideLabel` 工具）

**前端 — Trade 主流程**
- `src/pages/DesktopTrading.tsx`（9 处 Yes/No 字面量 → helper / lookup；提交按钮、Preview、Side 字段、聚合表 side 列、Close/Cancel 弹窗）
- `src/components/MobileTradingLayout.tsx`（删除 Market 行 / OptionChips 折叠分支）
- `src/components/TradeForm.tsx`（`sideLabels` prop 与 `binaryMode.{yes,no}Label`）
- `src/pages/TradeOrder.tsx`（注入 `sideLabels`）
- `src/pages/OrderPreview.tsx`（Side 字段 + 确认按钮 + 路由 state 透传）
- `src/pages/TradingCharts.tsx`（方向 chip / 图例 / 底部 toggle）

**前端 — 持仓/订单**
- `src/components/PositionCard.tsx`、`src/components/OrderCard.tsx`、`src/components/positions/ClosePositionDialog.tsx`、`src/pages/Portfolio.tsx`（`isBinaryAlias` 收敛冗余 chip）

**Lib**
- `src/lib/positionIntent.ts`（`getIntentLabel` 接 `sideLabels`）

**文档 / 规范**
- `DESIGN.md` §Single-Market Binary Trade Toggle（高度规范 + sideLabels 传播规则）
- `mem://design/single-market-binary-ui`
- `src/pages/StyleGuide/sections/TradingSection.tsx`

**未涉及**
- DB schema、`positionIntent` 公式、PnL、Yes/No 独立持仓模型、`tradingService` 写入逻辑、glossary / ToS / Hedge 落地页文案。

## 9. QA 验收要点

- 单 market binary 体育事件（如 Wimbledon 2026 Final）：Trade 面板按钮显示球员名而非 Yes/No，**提交按钮** "Buy {Player} - to win $X" 而非 "Buy No"。
- 长球员名（两行）触发等高：两侧底边对齐、价格条对齐、无底部空隙。
- 切到非 binary（多 outcome）事件：`Select Option:` chip 仍渲染，方向文案保持原逻辑。
- 跨事件聚合表：含多个不同事件的持仓/订单时，每行 side 列分别按各自事件解析（一行显示球员名、另一行显示 Yes/No）。
- Close Position / Cancel Order 弹窗：文案与所选行一致。
