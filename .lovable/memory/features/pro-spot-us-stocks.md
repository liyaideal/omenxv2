---
name: Pro / Spot US stocks pilot
description: Multi-product-line engine — first Spot pilot (US stock daily up/down). 9-state event_status per 技术对接 v1.0, freeze_time / expected_settlement_time data-driven, SIGNED_YES_SHARE net position, tick 0.01 validation, event_pending_cash simplified for demo, LP session profiles, front-end limit-order Pending flow
type: feature

---


# Pro 现货（Spot）产品线 — 美股当日涨跌试点

## 上线范围（2026-07-15）

平台首次拆分产品线：`events.product_lines` / `trades.product_line` / `positions.product_line` = `futures` | `spot`（CHECK 已加）。合约端行为不变；本轮仅上线 3 个现货试点事件。

## 现货语义（与合约的关键差异）

- 每份 Yes/No = $0–1 之间的份额，价格即概率
- Yes 获胜每份付 $1；输方 $0；**最大亏损 = 已付金额**
- **无杠杆 / 无 TP/SL / 无资金费 / 无强平价**（UI 不渲染，service 强制 `leverage=1, fee=0`）
- Buy = 建/加 long；Sell = 减/平已持有 long；**禁止空头**（前端 + `executeSpotTrade` 双校验）
- Trial Bonus 优先扣（复用 `useUserProfile.deductBalance` 口径）

## 事件状态机（9 态，对齐技术对接 v1.0 §2）

`events.event_status` 枚举：
`CREATED / EXTENDED_TRADING / TRADING / FROZEN / SETTLING / SETTLED`，分支 `SUSPENDED / REVIEW / CANCELED`。

- **已删除** OPEN_COOLDOWN、CLOSE_MODE（QA-16：开盘直接进 TRADING，开盘保护由 quote profile 内部实现，不设独立状态）
- **允许下单**只有 `TRADING` / `EXTENDED_TRADING`；其余（含未知）一律禁单
- `CREATED` = 可预览不可交易，文案 "Not yet open"
- `SUSPENDED` = cancel-only：CTA 禁用文案 `Suspended · cancel only`，但 Current Orders 里 Pending 单保留 Cancel 按钮
- 未知状态徽标 fallback 为灰色 `Unknown` + 禁单，绝不 fallback 成 `Trading`
- 帮助函数：`getLifecycleBadge` / `isOrderingBlocked` / `getBlockedReason`

## LP 报价模式徽标

订单簿标题右侧渲染 `lp_quote_mode` 徽标：`NORMAL` / `CONSERVATIVE` / `HEDGE_ONLY` / `CANCEL_ONLY`，tooltip 一句话解释。

## 时间字段数据驱动（技术对接 §4.1 / §12.2）

- `events.freeze_time` 与 `events.expected_settlement_time` **由后端按交易所日历写入**；前端只消费字段
- `isPastFreeze(freezeAt, endDate)` 驱动冻结判定 + 自动撤单；`isInPreFreezeWindow(freezeAt, endDate)` 驱动 "Closing soon" 15 min 黄色 chip（display-only，不禁单）
- Event Info 与下单区显示 `expected_settlement_time` 双时区（ET / 北京），例 "Settles & credits by ~16:15 ET / 04:15 北京"
- `usStockSessions.ts` 保留 `FREEZE_MINUTES_BEFORE_CLOSE = 5` 与 `PRE_FREEZE_MINUTES_BEFORE_CLOSE = 15` 仅作 **fallback**（字段缺失时兜底），已删除 `OPEN_COOLDOWN_*` / `SETTLEMENT_CREDIT_BY_ET`
- 提前收盘日以后端字段值为准，禁止硬编码 16:00 / 16:30

## 净仓模型（SIGNED_YES_SHARE，技术对接 §7 / §8）

现货（`product_line='spot'`）采用**单净仓**（one-way net position），与合约的双向持仓不同：

- 同事件 Up / Not Up 至多一边有仓位
- 反向买入 x 份对面：`x ≤ q` → 冲减对面到 `q − x`（按 `1 − buyPrice` 结算实现盈亏并释放 margin）；`x > q` → 先平掉对面 q 份，再用剩余 `x − q` 开新仓 @ `buyPrice`
- Sell 只在持有同侧净仓时允许；持对面 → 报错 "Buy back to reduce, don't sell"
- 实现工具：`tradingService.ts` `fetchSpotSides` / `reduceOppositeLeg` / `openOrMergeSameSide`，被 `executeSpotTrade` 与 `fillSpotLimitOrder` BUY 分支共享
- 合约（futures）双向持仓逻辑完全不动

## 卖出回款（demo 简化）

- 蓝图卖出直接回余额；toast 明示 `"Proceeds settle to balance (demo). Production: held as event pending cash until settlement."`
- 代码带 `// DEMO-STATE: event_pending_cash 简化`
- 正式版按 §7.2 应入 `event_pending_cash`，事件终态前不可提现

## 下单面板补充（技术对接 §10.1）

- 明细区行序：Cost / **Max win** / Max loss / Fee。Max win Buy = `qty − cost`；CTA 副标 `Max win $X`
- Limit price 按 tick **0.01** 校验，非法时红字提示 + CTA 禁用




## 盘口模拟参数（LP PRD §6.1）

`buildBook()`：`min_half_spread=0.02` / `quote_level_spread_step=0.01` / 每侧 8–12 档（默认 10）/ 首档 ~200 shares、每档 ×0.82 衰减、±15% 抖动 / 价格 clamp `(0.01, 0.99)` / 保持 `bid < mid < ask` 单调。

## 规则文案

Event Info 的 Rules 区必须读 `events.rules` 字段（按换行切分为 bullet），禁止在前端再写死一份 JSX 规则副本——防止双源漂移。数据库缺字段时降级为"Rules not yet published for this market."。

## 3 个种子事件（category='stocks'）

| id | base_price | Yes |
|---|---|---|
| us-nvda-updown-20260715 | 182.45 | 0.58 |
| us-tsla-updown-20260715 | 268.30 | 0.47 |
| us-aapl-updown-20260715 | 231.10 | 0.52 |

`side_labels = {yes:"Up", no:"Not Up"}` · `event_subtype='US_STOCK_DAILY_UPDOWN_SPOT'`。

## UI 入口

- `/events` 顶部 `Futures | Spot` 一级切换（默认 Futures），URL 参数 `?pl=spot`
- Spot 卡片路由到 `/spot?event=xxx`（不进 `/trade`）
- Style Guide 新增 Spot section（11 态 lifecycle 徽标 / LP quote-mode 徽标 / 模拟订单簿 / Buy+Sell 表单 / SPOT 持仓行 / SpotStatsHeader 三态）

## /spot 页面骨架

**定位原则**：/spot 是交易终端，不是简化落地页。以 `DesktopTrading` / `MobileTradingLayout` 为基底做**减法**。

- **终端 chrome**：不渲染全站导航 header；顶部只有 back + 事件名 + 红色脉冲倒计时（ET + 北京） + 右侧 stat 群 + 收藏星标
- **保留**：CandlestickChart、DesktopOrderBook（含 quoteMode 徽标）、Chart|Event Info tabs、Yes/No 双层切换器、Limit/Market tabs、Amount + 0–100% Slider、Available 余额行、底部 Positions|Orders tabs（filter product_line='spot'）、右下 Account 面板
- **删除**：Margin Mode、Leverage、TP/SL、Funding / Next Funding / OI / Index Price、强平价、Margin req.；费用明细区改 `Cost / Max loss / Payout if right / Fee`
- **CTA**：`Buy Up · To win $X →` 格式；Up→`trading-green`，Not Up→`trading-red`；**禁止 primary/紫色**；禁单时按 `getBlockedReason` 显示原因
- **右侧 stats**：`24h Volume` · `Prior Close $X` · `Last (indicative) $X ±X.XX%` · `Yes Price $X`（DEMO-STATE 前端漂移）
- Market 单 = marketable limit + 滑点上限（10 / 25 / 50 / 100 bps）

DESIGN.md §14 已把"交易页禁止渲染全站导航 header"和"spot=合约终端减法"固化为 Don't。

## 限价挂单演示态（v1.1）

`src/services/tradingService.ts` 三个新函数：`placeSpotLimitOrder` / `cancelSpotLimitOrder` / `fillSpotLimitOrder`（均 DEMO-STATE）。

- 可成交判定：Buy 限价 ≥ 模拟盘最优 ask → 即时；否则落 Pending，前端 `deductBalance(notional)` 预扣。Sell 用最优 bid 判定。
- Pending 落 `trades.status='Pending' + product_line='spot'`；触价成交（`SpotTrading` 内 useEffect 订阅 yesLive/noLive）走 `fillSpotLimitOrder`；Cancel 走 `cancelSpotLimitOrder` 全额退回 Buy 的预扣。
- **数据链路修复**：`SupabaseOrder` / `UnifiedOrder` 补 `product_line` 字段；SpotTrading 的 `spotOrders` 由 `(o as any).product_line` 改为 `o.productLine`。
- 红线：正式版由撮合引擎替换。

## Session 感知盘口（v1.1，LP PRD §4.2/§6.1）

`usStockSessions.ts` 新增 `SessionType` / `SESSION_PROFILES` / `getCurrentSession()`：

| Session | ET | Levels | Spread × | Size × | Quote mode |
|---|---|---|---|---|---|
| REGULAR | 09:30–15:45 | 8..12 | 1.0 | 1.0 | NORMAL |
| EXTENDED_AFTER_HOURS | 15:45–20:00 | 3..7 | 2.0 | 0.4 | CONSERVATIVE |
| OVERNIGHT | 20:00–04:00 | 3 | 3.0 | 0.25 | CONSERVATIVE |
| PRE_MARKET | 04:00–09:30 | 3..7 | 2.0 | 0.4 | CONSERVATIVE |

SpotTrading 每分钟重算 profile；`buildBook(mid, seed, profile)` 用 profile 的 spread/size/depth；`DesktopOrderBook.quoteMode` 由 `sessionProfile.quoteMode` 驱动。窗口沿用原 4 个 PLACEHOLDER 常量待 PM 确认。

## FROZEN 自动撤单退款（v1.2，DEMO-STATE）

- 触发条件：`lifecycle_status='FROZEN'` **或** 倒计时剩余 ≤ `FREEZE_MINUTES_BEFORE_CLOSE`（= 5 min）。
- 行为：`SpotTrading.tsx` 遍历当前用户该事件下全部 `Pending` 现货挂单，调 `cancelSpotLimitOrder` + `addBalance(refund)`，id 记入本地 `frozenCancelledIds` 集合。
- Orders 列表对这些 id 渲染 `"Cancelled · market frozen"`；其它撤单渲染 `Cancelled`。
- Event Info 规则区自动追加行 "All open orders are automatically cancelled and refunded at freeze (5 min before close)."（数据库有 rules 时才拼接）。
- 红线：仅撤销当前会话内可见 Pending 挂单，refund 直接进 `addBalance`；正式版由撮合/结算服务在 `freeze_time` 批量撤销并按会计口径退款，前端只订阅事件流。


## 头部信息架构（v1.3，LOCKED — DESIGN.md §7）

**桌面**：`SpotTrading.tsx` DesktopChrome 单行时间栏 = `● Trading ends in {countdown} · until {HH:MM} ET` + 尾部 ⓘ Tooltip；不再渲染 `formatDualTimezone` 的 ET/北京 chip，不再渲染第二行 "Settles at HH:MM ET · credits by …"。ⓘ tooltip 内容固定 5 行 英文：Opens（after prior close）/ Trading ends / Official close / Credits by / Your time（`Intl.DateTimeFormat` + `getTimezoneOffset` 派生 `GMT±X`，纯英文）。

**右区统计**：三位收敛 —— `Volume` / `Base ({priorDate} close)` / `{TICKER} $x.xx ±% [· pre-mkt|after-hrs]`。Yes Price 从头部下线（交易面板 + 图表已覆盖）。`priorCloseDateLabel` 由 `end_date` 在 ET 时区回推 1 天并跳过周末；`sessionTag` 由 `getCurrentSession()` 派生。

**移动端**：`grid-cols-2` = Base + {TICKER}；Volume 移入 Event Info（`InfoCell label="Volume"`）；ⓘ 用 `Popover`（tap 弹出）替代 hover Tooltip。

**禁止**（DESIGN.md §7 Don't）：header 出现第二条时间行、Yes 价、非英文字符（中文/北京 chip）、`24h Volume` 前缀；本地时区不得直接展示，只能进 ⓘ tooltip 且自动检测。
