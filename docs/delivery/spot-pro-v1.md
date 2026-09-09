# 现货（Spot）费率 V4 与 Pro 现货终端 — 交付说明 v1

> 这份文档说的是「现货」这条产品线从此开始收费了。生产页有两处：Pro 终端 `/spot`，以及简版现货下单面板（日线 / 快速回合两页共用的那块下单区）。用户能看见的变化：下单摘要里多了一行 0.15% 的手续费，"能赢多少"那个数字改成了**扣完 5% 赢利佣金后的净利**，赢单结算或卖出时钱包里会多出一条「赢利佣金」记录，Pro 页右侧账户面板由 Spot Account 改叫 Standard Account。没动的是：Pro 现货的手机版布局、合约页、行情图、订单簿。读法：先看 §0，再按 §2 的算例把数字对一遍。

## 0. 读者须知

查什么去哪儿：
- 长什么样 → 生产页 `/spot`（桌面），简版下单面板在 `/spot` 的 Lite 视图
- 什么时候变成什么样 → `/style-guide` → Lite / Pro 状态字典
- 字段名、文案、公式、时间口径、术语 → `docs/copy-dictionary.md`
- 设计法则（颜色轴、chip、overlay 对等）→ `DESIGN.md`
- 合约侧同一套费率口径 → `docs/delivery/lite-order-returns-v1.md`、`docs/delivery/pro-trade-v4-cleanup-v1.md`

提问前先按上面顺序查一遍；查不到再提，提问时写明"我查了 X 没有"。

## 1. 功能目标

把 Fee System V4 从合约线推到现货线，让同一笔单在合约页与现货页、Lite 与 Pro 之间**费率与净利口径完全一致**：taker 15 bps 只在**买入**时收，赢利佣金 5% 只在**盈利平仓 / 赢单结算**时收，亏损不收。

## 2. 费率与算例

| 项 | 口径 |
|---|---|
| Taker fee | `TAKER_FEE_RATE = 0.0015`，`SPOT_FEE_RATE` / `FUTURES_FEE_RATE` 均为它的别名 |
| 收费时机 | 仅买入（开仓 / 加仓 / 限价买单成交）。卖出不收 |
| 赢利佣金 WC | `5% × max(realizedPnl − 已分摊开仓费, 0)`，亏损为 0 |
| 唯一实现 | `src/services/tradingService.ts`：`netWin()` / `winningCommission()` |

**算例：$25 市价买入 @ $0.68**

| 字段 | Pro `/spot` | Lite 简版面板 |
|---|---|---|
| 语义 | 输入 = 份额成本，费另收 | 输入 = 总花费预算，费含在内 |
| fee | `$0.04`（25 × 0.0015） | `$0.04`（25 × 0.0015） |
| shares | `36.76`（25 ÷ 0.68） | `36`（floor((25 − 0.04) ÷ 0.68)） |
| 钱包扣款 | `$25.04` | `$25.00` |
| 毛利 | `$11.76` | `$11.00` |
| WC | `$0.59` | `$0.55` |
| **To win（净利）** | **`$11.17`** | **`$10.45`** |

两页语义差异是刻意的：Pro 是专业下单票（数量口径），Lite 是"我最多花这么多"（预算口径）。两者都走同一个 `netWin()`。

## 3. 数据库

`public.settle_spot_event(p_event_id text)` 重写（本轮 migration）：

| 步骤 | 行为 |
|---|---|
| 匹配 | `product_line='spot'` + `status='Open'` + 事件名 + 建仓时间落在事件窗口内 |
| 分摊开仓费 | 取 `positions.trade_id` 对应 `trades.fee`；为 0（V4 之前的老仓）则按 `entry_price × size × 0.0015` 回推 |
| 赢利佣金 | `5% × max(profit − 分摊开仓费, 0)` |
| 入账 | `profiles.spot_balance += proceeds − WC` |
| 持仓 | `status='Closed'`、`mark_price` 1/0、`pnl`、`pnl_percent`、`winning_commission`、`close_reason='settlement'` |
| 流水 | `trade_profit` / `trade_loss`（带符号）+ 盈利时一条 `winning_commission`（负数），`account='spot'` |
| 幂等 | `WHERE status='Open'` 守卫；重跑不会重复入账 |

`supabase/functions/sim-settle-spot` 不再自己算钱：它只判定赢家、写 `event_options` 终值、调用 `settle_spot_event()`、退还挂单（**退款 = 冻结金额 + 手续费**）、置事件 SETTLED。

## 4. 用户端流程

### 4.1 Pro `/spot` 下单面板（SP-1-FIX1 重做）

面板结构自上而下（生产件 `src/components/pro/ProSpotPanel.tsx`）：

| 区 | 内容 |
|---|---|
| 顶栏 | `Trade` + `SPOT` 徽标 |
| 意图 | `Buy` / `Sell` 文字页签（不是分段按钮），右侧 `OrderTypeDropdown`（Market / Limit） |
| 方向 | 单个 `BinarySideToggle`（Up / Down 两档带价）。Sell 且该侧无持仓时该档禁用（`opacity-40 pointer-events-none`），档内文字换成 `0 sh` |
| 余额 | Buy 显示 `Available (USDC)`；Sell 显示持仓 `· N sh {outcome}` |
| 输入 | Limit 时多一行限价输入；金额输入 + 0/25/50/75/100% 滑杆 |
| 滑点 | 仅 Market。chip 为中性态，不用方向色 |
| 摘要 | Buy：`Cost / Est. fill / Shares / To win ⓘ / Fee (0.15%)`；Sell：`Shares / Est. fill / Proceeds / Fee (0.15%)`。**无 Max loss 行** |
| CTA | 生产件 `TradeSubmitButton`。Buy 副文案 `To win $X`，Sell 副文案 `You receive $X`（新增可选 prop `winPrefix`，不传时逐像素不变） |
| 账户 | `Standard Account`：Available (USDC) / In orders / Open positions |

下单前弹 `Order Preview` 对话框（生产件 `ProSpotOrderPreview`），两张卡：订单摘要 + 费用与净利。

顶栏（`ProSpotHeader`）从页面抽成生产件，class 逐字未改，字典直接挂它，不再手抄。

方向词：`Not Up` 已退役，Pro 现货与 Lite 共用 `liteSideName()` 改写为 `Down`。

### 4.2 Lite 简版现货面板
- 删除 `Max loss · what you pay` 与 `You get if right` 两行；Returns 区恒为一行 `If you're right, you win` + ⓘ。
- 快捷金额按钮上的小字改为该金额对应的净利。
- 下单时按 `shares = floor((amount − fee) / price)` 报数量并把 `fee` 显式传给服务层。

### 4.3 钱包
现货买入写一条 `fee`（负数），卖出 / 结算写 `trade_profit` 或 `trade_loss`，盈利再加一条 `winning_commission`（负数），`account='spot'`，走既有 `record-transaction`。

## 5. 已删除 / 已废弃

| 项 | 说明 |
|---|---|
| `SpotTrading.tsx` 局部 `SPOT_FEE_RATE = 0` | 删除，改 import `tradingService` 的常量 |
| `Max win` 行与 CTA 文案 | 改为 `To win`（净利） |
| `Spot Account` 标签 | 改为 `Standard Account` |
| `sim-settle-spot` 内部持仓结算循环 | 删除，改调 `settle_spot_event()` |

## 6. 涉及文件

前端（Part A）：`src/services/tradingService.ts`、`src/pages/SpotTrading.tsx`、`src/components/lite/trade/LiteOrderPanel.tsx`、`src/components/pro/BinarySideToggle.tsx`（新建）
前端（Part B / SP-1-FIX1）：`src/components/pro/ProTerminalLayout.tsx`、`ProBottomTabs.tsx`、`OrderTypeDropdown.tsx`、`ProSpotPanel.tsx`、`ProSpotHeader.tsx`（均新建）、`src/pages/DesktopTrading.tsx`（改走共享骨架，逐像素不变）、`src/pages/SpotTrading.tsx`、`src/components/trading/TradeSubmitButton.tsx`（新增可选 `winPrefix`）、`src/lib/liteSideName.ts`（注释）、`src/pages/StyleGuide/preview/proSpotPreviews.tsx`、`sections/ProSpotSection.tsx`、`sections/SpotSection.tsx`、`preview/registry.tsx`、`nav.tsx`
后端：`supabase/functions/sim-settle-spot/index.ts`
数据库：本轮 migration 重写 `public.settle_spot_event`

## 7. 未变更项

Pro 现货**移动端分支**、合约页（Lite / Pro）、`CandlestickChart` / `DesktopOrderBook`、Lite 日线现货页与快速回合页的页面结构、Lite 持仓 / 组合页。

## 8. 本轮未做（留 SP-2）

- Pro 现货**移动端**重设计（用户明确划出范围外）。移动端仍走同一份 `ProSpotPanel`，行为与桌面一致。
- 移动端 `ProTerminalLayout` 版本（该骨架目前只服务桌面终端）。

## 9. 状态字典

`/style-guide` → Pro Spot 节，八个 registry key，全部挂生产组件本体：

`pro-spot-panel-buy-market`、`pro-spot-panel-buy-limit`、`pro-spot-panel-sell-held`、`pro-spot-panel-sell-none`、`pro-spot-panel-insufficient`、`pro-spot-panel-pending-limit`、`pro-spot-preview-dialog`、`pro-terminal-skeleton`。

Spot 节原先手抄的终端顶栏已换成生产件 `ProSpotHeader`，CTA 例子换成生产件 `TradeSubmitButton`。

## 10. 真平台核对项

1. 现货 taker 15 bps 只在买入侧收，卖出零费——请确认真平台同口径。
2. 赢利佣金基数为「已实现盈利 − 已分摊开仓费」，亏损不收。
3. 挂单冻结金额为 `cost + fee`，撤单 / 事件结算退还两者之和。
