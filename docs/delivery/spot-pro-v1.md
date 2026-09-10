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
| 余额 | `Available (USDC)` **恒显示**；Sell 时在其下多一行 `Held · N sh {outcome}` |
| 输入 | Limit 时多一行限价输入；金额输入 + 0/25/50/75/100% 滑杆 |
| 滑点 | 仅 Market。chip 为中性态，不用方向色 |
| 摘要 | Buy：`Cost`（Market 时下方附 `Est. fill @ X`）`/ Shares / To win ⓘ / Fee (0.15%)`；Sell：`Proceeds / Shares / Est. commission / You receive`。**无 Max loss 行**。`Est. commission` 走 `winningCommission(realizedPnl, entryPrice × qty × SPOT_FEE_RATE)`，与预览弹窗、toast、账本同一口径 |
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

## SP-1-FIX3 (2026-09-09) — 持仓侧识别 / 精确份额 / Close 直接确认

1. **Held side**：`/spot` 的 `yesOpt` / `noOpt` 过去用 `find(/yes$/) || options[0]`。日内涨跌市场的 option label 是 `Up` / `Down`，正则永不命中，于是 Yes 档位被绑到数据库返回的第一行——只持有 Down 时面板会报成持有 Up。现在两条腿都先经 `side_labels` 别名解析（`isYesLabel` / `isNoLabel`），再退回顺序兜底；Positions 表 Outcome 列同样按 `optionId` 判定，两处同源。
2. **精确份额**：`formatShares()`（最多 3 位小数、去尾零）用于 Held 行与 Shares 行；`sharesInputValue()` 用于 Amount 预填与滑杆写回。展示值不再喂给订单，`Close` 预填与卖出请求都取 `p.sizeNum` 原值。
3. **Close = 确认并平仓**：Positions 行 `Close` 现在预置 Sell · 该 outcome · Market · 全量精确份额，并**立即打开 `ProSpotOrderPreview`**；确认走与面板同一条卖出路径，成交 toast 为 `Cashed out · $X back`。部分平仓仍可在面板改 Amount。移动端分支共用同一张表，行为一致。
4. **文案**：限价挂单提示的预留金额改为 `cost + fee`（含 0.15% 手续费）。
5. **状态字典**：新增 `pro-spot-panel-sell-held-down`（仅持 Down、2,034.879 sh）；`pro-spot-panel-sell-held` fixture 改为小数份额。

## SP-1-FIX4 (2026-09-09) — 全平吸附（full-close snap）

`sharesInputValue()` 只保留 3 位小数：36.7647… 持仓的 `Close` 预填 `36.765` 会**超出持仓**被校验拒绝，向下取整又留下 0.0007 sh 永远平不掉的 dust。现在 sell 路径（面板提交与 `Close` → 预览确认共用）在 `|qty − heldQty| < 0.001` 或 `qty ≥ heldQty × 0.9995`（滑杆 100%）时吸附为**精确 heldQty** 发送给 `executeSpotTrade` / `placeSpotLimitOrder`；3 位小数字符串仅作输入展示。无引擎改动。状态字典 `pro-spot-panel-sell-held-down` 已补该规则。

## SP-1-FIX5 (2026-09-10) — 渲染死循环 / Up 档点不动 / 过期仍可下单

1. **渲染死循环**：`SpotTrading.tsx` 的 `endDate` / `freezeAt` / `settleAt` 过去每次渲染都 `new Date(...)`，倒计时 effect 依赖这个新对象 → 每渲染重跑 → `setState` 新对象 → 无限循环（jsdom 复现 500ms 内约 1,085 次渲染）。现在三者按 ISO 字符串 `useMemo`，倒计时 effect 依赖 `endTime?.getTime()`，`tick` 用函数式 `setState` 在值未变时返回 `prev`。`DesktopTrading.tsx` 的同名 hook 同样改为按时间戳取依赖。
2. **Up 档点不动**：`BinarySideToggle` 的 `Segment` 原本声明在组件内部，每渲染都是新组件类型 → 两个 `<button>` 每渲染卸载重挂，光标下的按钮在 mousedown 与 mouseup 之间被替换，点击落到外层 div。现已提到模块作用域并加 `key`，DOM 结构与 class 逐字未变。
3. **时间也封锁下单**：`blocked = isOrderingBlocked(dbLifecycle) || isFrozenByTime`，原因文案 `Market frozen`。封锁时两个 tile 仍可点选看价，CTA 置灰、预览弹窗打不开、`handleSubmit` 与 Positions 行 `Close` 直接 toast 拦截。
4. **状态字典**：新增 `pro-spot-panel-frozen`（SP-B8）。

## SP-2 (2026-09-10) — 冻结巡检 + Pro 现货移动端重建

**Part A · freeze-sweep**：新增 `public.freeze_expired_events()`（幂等：`TRADING`/`EXTENDED_TRADING` 且未结算、过了 `freeze_time`，无 freeze_time 则看 `end_date` → `FROZEN`），pg_cron `freeze-sweep` `*/5 * * * *`。首次手动执行翻转 0 行。`settle_prior_stock_session` 只按 `end_date <= now()` 取未结算行，不过滤生命周期，`FROZEN` 仍会照常结算；`isOrderingBlocked` 已把 `FROZEN` 列为不可下单，文案沿用 `Market frozen`。

**Part B · 移动端**
- `src/hooks/useSpotTerminal.ts`（B5）：现货终端唯一逻辑源，桌面 `/spot`、移动 Charts、移动 order 三处共用。FIX3 / FIX4 / FIX5 行为逐字保留。
- `src/components/pro/ProSpotShared.tsx`：共享渲染块（面板 / 预览弹窗 / 账户 / 事件信息 / 持仓与挂单表桌面与移动两态 / 底部页签 / 移动 strip / mark 行 / 日程 ⓘ / 表头事件适配）。
- `src/components/pro/ProSpotMobileDock.tsx`：sticky dock（Lite/Pro dock 开关 + Buy Up / Buy Down 两段式点按 + 封锁态）。
- `src/pages/SpotTradingCharts.tsx`（`/spot` 移动）、`src/pages/SpotTradeOrder.tsx`（`/spot/order` 移动）。
- `src/pages/SpotTrading.tsx` 变成**桌面专用**，旧移动分支（MobileChrome / 内联面板 / 头部 SurfaceSwitch）删除。
- `src/components/MobileTradingLayout.tsx` / `MobileHeader.tsx` 泛化（basePath / variant / 事件直传 / 倒计时文案与紧急度 / 标题徽章 / 页头右侧与事件信息插槽），合约页默认值不变。
- 路由：`/spot` → Lite | 移动 Pro Charts | 桌面 Pro；新增 `/spot/order` → Lite 重定向 `/spot` | 移动 Pro 下单页 | 桌面 Pro 终端。

**字典**：新增 `pro-spot-mobile-charts`、`pro-spot-mobile-charts-frozen`、`pro-spot-mobile-order-buy`、`pro-spot-mobile-order-sell-held`、`pro-spot-mobile-dock`，全部挂生产件本体，375 DeviceFrame，登出可渲染。

**不在范围**：桌面面板 / 顶栏视觉、`DesktopTrading`、Lite 各页、`tradingService` 费率逻辑。

### SP-2-FIX2 (2026-09-10) — 移动现货零截断

产品负责人：「整体各种截断实在有点丑」。本轮把 360 / 375 / 390 三档下的省略号全部消灭，规则写进 DESIGN §Addendum SP-2-FIX2。

- `SpotMobileStatsStrip`：`PRE` / `AH` 9px 徽标移入 Base 左格；右格只放标的、价格、涨跌。`ResizeObserver` 按 strip 自身宽度控制涨跌，仅在达到 340px 时显示，不再错误依赖浏览器 viewport；根节点 `overflow-hidden` 只作末级防护，价格与徽标永不裁切。
- `spotMobileTitle(t)`（`ProSpotShared.tsx`）：日内涨跌盘移动页头显示 `META · Up or down?`；完整名留在 Event info。桌面页头未动。
- `TradeSubmitButton` 新增 `layout`（默认 `"row"`）；`ProSpotPanel` / `SpotTradePanel` 新增 `ctaLayout`，只有 `/spot/order` 传 `"stacked"`。金额走千分位。
- 面板细项：迷你盘口 `w-[104px]`、滑点四格 grid `text-[10px]`、摘要 `text-[11px]`、Held 行改为 `2,034.879 sh · Down`。
- 移动持仓 / 挂单表事件名改 `line-clamp-2`。
- 字典：新增 `pro-spot-mobile-charts-360`（SP-M1b）；`pro-spot-mobile-charts` 改用长名 `Meta (META) — will close higher today?`；sell-held fixture 滑块与数量对齐 100%。

验证：360 / 375 / 390 三档 × `$579.08` / `$57,907.84` 两种价格，文本节点均无 `scrollWidth > clientWidth`，右格末项均未越过 cell 右边界；360 字典 fixture 固定展示 `$57,907.84` + 左格 `PRE`。
