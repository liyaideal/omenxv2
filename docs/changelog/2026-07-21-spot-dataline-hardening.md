# Pro 现货全站渗透 · 轮次 1 — 交付说明

> 本文档只覆盖"数据链路必修 + 仓位券排除现货"这一轮改动。/spot 交易页本身与 SIGNED_YES_SHARE 模型（见 2026-07-15 Pro/Spot 系列文档）不动，本轮只是把共享数据链路中把现货当合约的地方全部堵死。研发以本文档为准。

## 1. 功能目标

前置事实：`product_line ∈ { 'futures', 'spot' }` 已经落到 `events` / `trades` / `positions` / `airdrop_positions` 四张表，`/spot` 也已上线。但主站 /trade 桌面（`src/pages/DesktopTrading.tsx`）与移动（`src/pages/TradingCharts.tsx` 图表页 + `src/pages/TradeOrder.tsx` 下单页）三处 Positions / Current Orders 面板、Portfolio、Position 详情、撤单/撮合、Position Voucher 领用仍走同一份共享代码 → 现货行会以合约口径渲染、撤单不退款、fill 会给现货建 short 仓、Voucher 能在现货事件上被消费。本轮全部修掉。

> 注：仓库里还挂着一份 `src/components/DesktopPositionsPanel.tsx`，但 App.tsx 路由 `/trade` 桌面走 `DesktopTrading`、移动走 `TradingCharts`+`TradeOrder`，`DesktopPositionsPanel` 无任何挂载点，属死代码。收敛必须落到上述三个真实挂载点。

拍板原则（不可回退）：

- **持仓表按当前产品线展示**：`/trade` 桌面 + 移动两端只看 futures，`/spot` 只看 spot。禁止在同一张 Positions Tab 里混列两条产品线。
- **现货不允许净 short**：spot BUY 与减仓 SELL 均放行；`fillSpotLimitOrder` SELL 分支在会产生净 short 时拒绝，服务层是唯一净仓校验点。上层 hook 不再 blanket 抛错，避免误杀合法 reduce-only 挂单。
- **现货不支持仓位券**：Position vouchers 只能在 futures 事件上被消费；前端过滤 + 服务端拒绝双闸。

## 2. 变更总览

| # | 模块 | 类别 | 变更 |
|---|---|---|---|
| 1 | `DesktopTrading` / `TradingCharts` / `TradeOrder` | 视图过滤 | 三处 hook 边界过滤 `positions.filter(p => p.productLine !== 'spot')` 和 `orders.filter(o => (o.productLine ?? 'futures') !== 'spot')`；桌面 Positions / Current Orders 两个 Tab、移动 Positions / Orders 两个 Tab 均只见 futures |
| 2 | `useSupabaseOrders.fillOrder` | 分流 | spot 路由到 `fillSpotLimitOrder`（BUY / 减仓 SELL 都放行）；净 short 由服务层拒绝 |
| 3 | `useSupabaseOrders.cancelOrder` | 分流 | spot 路由到 `cancelSpotLimitOrder`，退回预扣款 |
| 4 | `PositionDetailContent` | 分支渲染 | spot 分支隐藏 leverage / liq / funding / est. close fee，改用 Shares / Avg cost / Current value / Cost basis |
| 5 | `Portfolio.handlePositionAction` | 路由 | 现货行 View → `/spot?event={event_id}`；futures 行保持原 `/trade` 深链 |
| 6 | `EventPickerList` | 过滤 | Voucher redeem 事件列表排除 `product_lines` 含 `'spot'` 的事件 |
| 7 | `redeem-position-voucher` | 服务端校验 | 读取 `events.product_lines`，含 `'spot'` 立即返回 `409 Position vouchers cannot be redeemed on spot markets` |
| 8 | `docs/backend-boundary.md` | 边界补录 | 新增"2026-07-21 现货数据链路收敛"章节，标注 4 条 🟢 硬规则 |
| 9 | `/style-guide` Spot section | 状态覆盖 | 新增 "Position detail — spot vs futures" side-by-side 预览 |

## 3. 状态机 / 分流规则

### 3.1 撤单 (`useSupabaseOrders.cancelOrder`)

| product_line | 走向 | 副作用 |
|---|---|---|
| `spot` | `cancelSpotLimitOrder(userId, orderId)` | `refund > 0` 时调用 `addBalance(refund)` 退回预扣款 |
| `futures`（含 `null` 兼容旧行） | `UPDATE trades SET status='Cancelled'` | 无 |

### 3.2 撮合 (`useSupabaseOrders.fillOrder`)

| product_line | side | 走向 |
|---|---|---|
| `spot` | `buy` | `fillSpotLimitOrder`；返回的 `balanceDelta > 0` 走 `addBalance` |
| `spot` | `sell` | `fillSpotLimitOrder`；SELL 分支持有同侧净仓时减仓+回款；净 short 由服务层拒绝 |
| `futures` | `buy` / `sell` | 原逻辑：`UPDATE trades → INSERT positions`，`side = order.side === 'buy' ? 'long' : 'short'`，并显式写入 `product_line: 'futures'` |

### 3.3 Voucher redeem 拒绝路径

前端（`EventPickerList`）：`useActiveEvents` 结果过滤掉 `product_lines?.includes('spot')` 的事件，用户根本看不到现货选项。

服务端（`redeem-position-voucher`）：`select` 增加 `product_lines` 字段；若数组含 `'spot'`，返回 `409 { error: 'Position vouchers cannot be redeemed on spot markets' }`。前端 UI 已经过滤，服务端拒绝是防御性双闸——保证任何直接调用 API 的路径都无法绕过。

## 4. 用户端流程

### 4.1 /trade（合约主面板 — 桌面 + 移动）

三个真实挂载点在 hook 边界完成过滤，不再依赖任何下游 Tab 逐个 filter：

| 挂载点 | 位置 | 过滤实现 |
|---|---|---|
| 桌面 /trade | `src/pages/DesktopTrading.tsx` | `positions = useMemo(() => allPositions.filter(p => p.productLine !== 'spot'), [allPositions])`；`unifiedOrders = useMemo(() => allUnifiedOrders.filter(o => (o.productLine ?? 'futures') !== 'spot'), [...])`。下方 "Positions" / "Current Orders" 两个 Tab 直接消费过滤后的数组 |
| 移动 /trade（图表） | `src/pages/TradingCharts.tsx` | 同上，`positions` + `orders` 在 `useMemo` 里过滤，`Order Book / Trades history / Orders / Positions` 四个 Tab 沿用 |
| 移动 /trade/order（下单） | `src/pages/TradeOrder.tsx` | 同上，Orders / Positions 两个 Tab 沿用 |

死代码 `src/components/DesktopPositionsPanel.tsx` 保留自身 filter（防止后续误挂载），但不作为收敛点。

### 4.2 /spot（现货主面板）

不变。`SpotTrading.tsx` 已有本地 filter 逻辑（`positions.filter(p => p.productLine === 'spot')` + `orders.filter(o => o.productLine === 'spot')`），本轮不动。

### 4.3 Portfolio

Positions Tab 依旧混列两条产品线的持仓（这是 Portfolio 作为"总账户"的语义），但 View 按钮按行分流。`handlePositionAction(index)` 现在从 `sortedPositions[index]` 取 target（之前读 `positions[index]`，用户按 PnL/Qty 排序后会拿错行、spot ↔ futures 互相误路由）：

| 行类型 | 目标 |
|---|---|
| spot | `/spot?event={event_id}` — 通过 `useActiveEvents` 的 `event_name → id` 索引解析；解析不到则退回 `/spot` |
| futures | 桌面 `/trade` / 移动 `/trade/order`；`state.highlightPosition` 通过 `futuresPositions.findIndex(p => p.id === target.id)` 在 destination 的 futures-only 数组里重算，避免混列索引失配 |

### 4.4 Position detail 面板

同一个 `PositionDetailContent` 组件被桌面 Dialog 和移动 Drawer 共用，本轮加 `isSpot = position.productLine === 'spot'` 分支：

| 区块 | futures | spot |
|---|---|---|
| Header | Outcome chip + leverage | Outcome chip + "SPOT" 标签，无 leverage |
| PnL 大数 | pricePnl − fundingPaid，含 % | (mark − avg) × shares，含 % |
| 关键字段 | Entry / Mark / Size / Margin / Leverage / Liq / Est. close fee / Funding accrued | Shares / Avg cost / Mark price / Current value / Cost basis |
| 底部注记 | Funding history 表 | "Each winning share pays $1 at settlement. No leverage, no funding, no liquidation." |

### 4.5 Voucher redeem 流程

Redeem drawer 打开 → `EventPickerList` 拉 `useActiveEvents` → 客户端过滤 spot → 用户只能选 futures 事件。若用户绕过 UI 调用 API：服务端二次校验拒绝，前端 toast 显示服务端错误文案 `Position vouchers cannot be redeemed on spot markets`。

## 5. Style Guide

`/style-guide` → **Spot** → **Position detail — spot vs futures**：side-by-side 渲染 `PositionDetailContent`，左 spot 右 futures，各字段差异一眼可见。回归判定：spot 面板出现 Liq. price 或 Funding 区块 = 数据链路 bug。

## 6. 已废弃 / 不再合法的写法

| 项 | 说明 |
|---|---|
| 在共享面板里遍历 `allOrders`/`allPositions` 不过滤产品线 | 全站已收敛到 hook 层过滤，新增消费方必须继续沿用 |
| 直接 `UPDATE trades SET status='Cancelled'` 撤 spot 挂单 | 不退款、破坏 SIGNED_YES_SHARE 会计，禁止；必须走 `cancelSpotLimitOrder` |
| 给 spot 建净 short 的 position 行 | 现货不支持净 short；`fillSpotLimitOrder` SELL 分支必须拒绝任何会导致净 short 的成交（服务层是唯一净仓校验点，上层 hook 不 blanket 抛错） |
| `redeem-position-voucher` 不校验 `product_lines` | 现在服务端硬拒 |
| `EventPickerList` 用 `useActiveEvents` 全量列表 | 必须先按 `product_lines` 过滤 spot |

## 7. 涉及文件

**前端**
- `src/pages/DesktopTrading.tsx`（真实挂载点，hook 边界过滤）
- `src/pages/TradingCharts.tsx`（移动 /trade 图表，hook 边界过滤）
- `src/pages/TradeOrder.tsx`（移动 /trade/order，hook 边界过滤）
- `src/components/DesktopPositionsPanel.tsx`（死代码，保留自身 filter 防误挂载，非收敛点）
- `src/hooks/useSupabaseOrders.ts`
- `src/components/positions/PositionDetailContent.tsx`
- `src/pages/Portfolio.tsx`
- `src/components/vouchers/EventPickerList.tsx`
- `src/pages/StyleGuide/sections/SpotSection.tsx`

**后端**
- `supabase/functions/redeem-position-voucher/index.ts`

**文档**
- `docs/backend-boundary.md`（append-only 补录 2026-07-21 章节）
- `docs/changelog/2026-07-21-spot-dataline-hardening.md`（本文）

## 8. 未变更项

- `/spot` 页本身的交易面板、下单流程、SIGNED_YES_SHARE 模型 — 不动
- `SpotTrading.tsx` 的本地 filter — 不动（本地已经正确）
- `positions` / `trades` / `events` schema — 不动（`product_line` 已在，本轮零 migration）
- Portfolio Positions Tab 的混列语义 — 不动（这是"总账户"预期行为，只有 View 目标分流）
- Airdrop / Voucher earnings / 结算流水 — 不动
