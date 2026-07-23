# 2026-07-15 — Pro 现货（Spot）产品线上线：美股当日涨跌事件试点

> 本轮迭代把平台从"纯合约（futures）"扩为**多产品线引擎**。本轮试点仅上线现货一条子线——**美股当日涨跌**（US_STOCK_DAILY_UPDOWN_SPOT），共 3 个事件（NVDA / TSLA / AAPL）。合约端行为完全不变。这是 Pro/Lite 分层的第 2 步；第 1 步 schema 扩容已直接在数据库完成，本文只交付前端与规范。

## 1. 产品线模型

- `events.product_lines text[]`（默认 `{futures}`）：允许一个事件同时挂多个产品线（本轮试点事件为纯 spot）
- `events.event_subtype`：事件子类型标签；本轮值 `US_STOCK_DAILY_UPDOWN_SPOT`
- `events.lifecycle_status`：状态机（下方），默认 `TRADING`
- `events.base_price numeric`：结算基准价（前收），"平收 = Not Up" 规则以此为锚
- `trades.product_line` / `positions.product_line`：`futures` | `spot`，CHECK 已加
- `profiles.preferred_surface`：`lite` | `pro`（本轮不启用，占位 schema）
- `category_boost_configs`：本轮不用；后续 Boost 板块开关容器

## 2. 现货语义

- 每份 Yes/No 是 $0–1 之间的**份额**，价格即概率
- 结算：Yes 获胜每份付 $1；输方每份 $0
- 最大亏损 = 已付金额；无杠杆、无 TP/SL、无资金费、无强平价
- Sell = 减仓/平仓已持有的 Yes/No 份额；**禁止空头**（前端 + service 双校验）
- 落库契约：`leverage=1`、`fee=0`、`side='long'`（Buy）、`order_type='Limit'`、`status='Filled'`、`product_line='spot'`；Trial 优先扣（复用 `useUserProfile.deductBalance` 口径）

## 3. 状态机与时刻表

`events.lifecycle_status` 五态（badge 配色见 `src/lib/usStockSessions.ts` 的 `LIFECYCLE_BADGE`）：

| 状态 | 含义 | 允许下单 |
|---|---|---|
| `TRADING` | 常规交易时段 | ✅ |
| `EXTENDED_TRADING` | 盘前/盘后延长 | ✅ |
| `PRE_FREEZE` | 收盘前 15 分钟起（LP 报价可切 WIDE） | ❌ |
| `FROZEN` | 收盘前 5 分钟起 + 结算窗口 | ❌ |
| `CANCELED` | 停牌/取消 | ❌ |

**时刻表（4 值 PLACEHOLDER: pending confirmation，见 `src/lib/usStockSessions.ts`）**：

| 常量 | 值 | 状态 |
|---|---|---|
| `PRE_FREEZE_MINUTES_BEFORE_CLOSE` | 15 min | ⚠️ 占位待确认（仅驱动 "Closing soon" 提示，不禁单） |
| `FREEZE_MINUTES_BEFORE_CLOSE` | 5 min（15:55 ET） | ✅ CONFIRMED per PRD §4.1 — TRADING 全程至 close−5min，此时进入 FROZEN |
| `OPEN_COOLDOWN` | 09:30–09:35 ET | ⚠️ 占位待确认 |
| `SETTLEMENT_CREDIT_BY_ET` | ≤ 16:30 ET | ⚠️ 占位待确认 |

**倒计时同时展示 ET + 北京时间**（`formatDualTimezone`）。

## 4. /events 产品线一级切换

- 顶部新增 `Futures | Spot` 切换，默认 Futures；URL 参数 `?pl=spot` 深链
- Spot tab 下小字提示："Spot = buy outcome shares ($0–1). Winning shares pay $1. Max loss is what you pay."
- 分类 tab 与筛选自动跟随当前产品线的可用事件

## 5. 现货交易页 `/spot?event=xxx`

新页面 `src/pages/SpotTrading.tsx`：

- 头部：事件名 + 一句话规则（"Settles vs prior official close $X · flat close = Not Up"）+ 状态徽标 + 双时区倒计时
- 订单簿：前端模拟（10 档 / spread 0.02 / size 衰减 0.82 / 首档 ~200），左上角 `NORMAL` quote-mode 徽标
- 下单表单：Up/Not Up（渲染 `side_labels`）+ Buy/Sell + Limit price + Amount + 三行汇总（Cost / Max loss / Payout if right = qty × $1）
- **不渲染** 杠杆滑杆 / TP/SL / 资金费 / 强平价
- 状态非 TRADING/EXTENDED_TRADING 时按钮禁用并显示 "Market frozen"

## 6. Portfolio 条件渲染

- `positions.product_line='spot'` 行显示 `SPOT` 徽标；杠杆/Liq./Funding 相关列在该行留空或折叠
- 不拆分页面——同一个 /portfolio 按 `product_line` 条件渲染

## 7. 种子数据（3 个试点事件）

`category='stocks'`, `product_lines='{spot}'`, `event_subtype='US_STOCK_DAILY_UPDOWN_SPOT'`, `lifecycle_status='TRADING'`, `side_labels={yes:"Up", no:"Not Up"}`:

| 事件 id | base_price | Yes 初值 |
|---|---|---|
| `us-nvda-updown-20260715` | 182.45 | 0.58 |
| `us-tsla-updown-20260715` | 268.30 | 0.47 |
| `us-aapl-updown-20260715` | 231.10 | 0.52 |

## 8. Style Guide

`/style-guide` 新增 Spot section，覆盖：Lifecycle badges（5 态）/ 模拟订单簿 / Buy+Sell 两态下单表单 / SPOT 持仓行

## 9. 涉及文件

- 前端：`src/lib/usStockSessions.ts`（新）、`src/pages/SpotTrading.tsx`（新）、`src/pages/StyleGuide/sections/SpotSection.tsx`（新）、`src/hooks/useActiveEvents.ts` / `useMarketListData.ts` / `src/pages/EventsPage.tsx` / `src/components/events/MarketCardB.tsx` / `MarketListView.tsx` / `src/services/tradingService.ts`（`executeSpotTrade`）/ `src/App.tsx`
- 文档：本文 + `docs/backend-boundary.md`（append 一节）+ INDEX / STATUS 更新

## 10. 对研发的红线（引 backend-boundary）

- 新字段全部 🟡：语义（多产品线、状态机、结算基准价）是需求；`text[] + text` 的 schema 与 DB 硬编码的 lifecycle 值都是演示便利，正式版应有专门的产品线/状态表
- `category_boost_configs` 🟢：Boost 板块开关是运营规则，必须做成后台可配置
- 现货下单不入 orders 表（本仓库没有真实订单账本，见 backend-boundary 红线 §4）

---

## v1.1 增补（2026-07-15 同日发布）

两处增强，代码级已落地；仍是纯前端演示，正式版由撮合引擎替换。

### 11. 限价挂单演示态（前端模拟撮合）

- **可成交判定**：Buy 限价 ≥ 模拟盘口最优 ask → 即时成交（走 `executeSpotTrade`）；Buy 限价 < ask → `placeSpotLimitOrder` 落 Pending，前端立刻 `deductBalance(notional)` 预扣。Sell 同理，用最优 bid 判定；Sell Pending 不动持仓 shares，成交时二次校验。
- **Current Orders tab**：新增 Reserved 列（Buy 显示预扣金额，Sell 显示 —）；Cancel 按钮走 `cancelSpotLimitOrder` → status=Cancelled，Buy 的话 `addBalance` 退回预扣。
- **触价成交**：`SpotTrading.tsx` 内 `useEffect` 订阅 mark price（yesLive/noLive by option label），当 Buy Pending 的 mark ≤ limit 或 Sell Pending 的 mark ≥ limit 时，调用 `fillSpotLimitOrder` 建/加/平仓。所有相关代码带 `// DEMO-STATE: 触价成交由前端模拟，正式版由撮合引擎完成` 注释。
- **落库契约**：Pending 行 `status='Pending'` / `product_line='spot'`；Filled 时 `status='Filled' + closed_at`；Cancelled 时 `status='Cancelled'`。均为 `trades` 表合法枚举。
- **数据链路修复**：`useSupabaseOrders.SupabaseOrder` 与 `useOrders.UnifiedOrder` 补 `product_line` 字段，SpotTrading 的 `spotOrders` 过滤器由 `(o as any).product_line` 改为类型安全的 `o.productLine`。之前该字段永远读不到，导致 spot Pending 不显示。

### 12. Session 感知盘口（LP PRD §4.2/§6.1）

`src/lib/usStockSessions.ts` 新增：

- `SessionType = 'REGULAR' | 'EXTENDED_AFTER_HOURS' | 'OVERNIGHT' | 'PRE_MARKET'`
- `SESSION_PROFILES`：每个 session 定义 `levelsMin/levelsMax` / `spreadMult` / `sizeMult` / `quoteMode` / `tooltip`
- `getCurrentSession(now?)`：按 America/New_York 当前分钟数派生

时间轴（占位，与原 4 个 PLACEHOLDER 常量对齐）：

| Session | ET 窗口 | Levels | Spread × | Size × | Quote mode |
|---|---|---|---|---|---|
| REGULAR | 09:30–15:45 | 8..12 | 1.0 | 1.0 | NORMAL |
| EXTENDED_AFTER_HOURS | 15:45–20:00 | 3..7 | 2.0 | 0.4 | CONSERVATIVE |
| OVERNIGHT | 20:00–04:00 | 3 | 3.0 | 0.25 | CONSERVATIVE |
| PRE_MARKET | 04:00–09:30 | 3..7 | 2.0 | 0.4 | CONSERVATIVE |

SpotTrading 每分钟 `sessionTick` 重算 profile，`buildBook(mid, seed, profile)` 使用 profile 的 spread/size/depth；`DesktopOrderBook.quoteMode` 由 `sessionProfile.quoteMode` 驱动，tooltip 自动切换文案。

### 13. Style Guide 更新

`/style-guide` Spot section 新增：

- **Session-aware LP profiles**：4 张卡片，展示每个 session 的 levels / spread × / size × / 徽标（NORMAL 或 CONSERVATIVE）
- **Current Orders — Pending / Cancel**：Pending / Filled 两种行样式，Reserved 列，Cancel 按钮的可用/禁用态

### 14. 红线（引 backend-boundary）

- 🔴 现货挂单/撤单/触价成交均为前端模拟；生产环境需替换为撮合引擎（订单簿、成交回报、状态机推进都在服务端），前端只订阅事件流。
- 🟡 Session profile 常量沿用原 4 个 `PLACEHOLDER: pending confirmation`，PM 确认后与时刻表一次性 unlock。

---

## v1.2 增补（2026-07-15 同日 — 时刻表口径确认）

PM 依据 PRD §4.1 原表确认 freeze_time = close−5min（其余三个 PLACEHOLDER 保持占位）。本轮同步落地"冻结时自动撤销所有未成交订单"行为。

### 15. 时刻表口径

- `FREEZE_MINUTES_BEFORE_CLOSE = 5` 转正为 CONFIRMED（`usStockSessions.ts` 注释同步更新）：TRADING = 09:30 → close−5min；到 close−5min 或 `lifecycle_status='FROZEN'` 即进入 FROZEN。
- `PRE_FREEZE_MINUTES_BEFORE_CLOSE = 15` 仍为占位；含义收敛为"仅驱动 UI 'Closing soon' 徽标，不禁单"。终端顶部倒计时旁在剩余 ≤15 min 时显示黄色 `Closing soon` chip；下单允许集不变（EXTENDED_TRADING / OPEN_COOLDOWN / TRADING）。
- 其余 `OPEN_COOLDOWN` / `SETTLEMENT_CREDIT_BY_ET` 两个占位保持不动，等待 PM 后续确认。

### 16. FROZEN 自动撤单退款（前端模拟）

- `SpotTrading.tsx` 新增 `shouldFreeze = lifecycle==='FROZEN' || countdown ≤ 5min` 检测。触发后，遍历当前用户在该事件下的全部 `status='Pending'` 现货挂单，依次调用 `cancelSpotLimitOrder` + `addBalance(refund)`，并把 id 记入 `frozenCancelledIds` 集合。
- Orders 列表对这些 id 渲染 `"Cancelled · market frozen"` 而非普通 `Cancelled`，便于用户区分主动撤单与被冻结撤销。
- 代码带 `// DEMO-STATE: 冻结撤单由前端模拟，正式版由撮合引擎批量执行` 注释。
- Event Info 规则区自动追加一行 `"All open orders are automatically cancelled and refunded at freeze (5 min before close)."`，与后端行为保持契约。

### 17. 红线

- 🔴 冻结撤单为前端模拟：仅撤销当前浏览会话内可见的 Pending 挂单，且 refund 走 `addBalance` 直接进钱包；生产环境需由撮合/结算服务在 `freeze_time` 到达时批量撤销并按会计口径退款，前端只订阅事件流。
- 🟢 `FREEZE_MINUTES_BEFORE_CLOSE = 5` 已成为 PRD 硬性口径，任何调整必须先改 PRD §4.1 再改代码。
