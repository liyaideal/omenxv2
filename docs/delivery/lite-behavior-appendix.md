# Lite 行为附录（/events · /trade · /spot）— 研发交付

> 本文件是 Lite 三个面向用户的核心页面的**行为**附录，配合已有的 `lite-list-and-trade-spec` 使用：那份文档讲"长什么样、由哪些模块组成"，本文件只讲"点下去会发生什么"。每一节的结论均逐条对照当前代码核实，节标题后给出取证文件；UI 文案一律保留英文原样。

---

## 1. 下单状态机

### 1.1 现货面板 `LiteOrderPanel`
取证：`src/components/lite/trade/LiteOrderPanel.tsx`、`src/services/tradingService.ts`

| 项 | 实际行为 |
|---|---|
| 金额解析 | `parseFloat(amount)`，非有限或 ≤0 视为 0；输入框 `type="number"`，**无 max 属性** |
| 最小额 | 无固定下限，只有两道派生下限：`amountNum > 0`、`qtySnapshot > 0` |
| 最大额 | 只有余额上限；`Max` 预设按钮写入 `Math.floor(spotBalance)` |
| 精度 | 股数向下取整：`qtySnapshot = Math.floor(amountNum / priceSnapshot)`，不支持碎股 |
| 滑点 | `SLIPPAGE_BPS = 50`（0.5%），下单价 `priceSnapshot = clamp(sidePrice * (1 + 50/10000), 0.0001, 0.9999)` |
| 页脚文案 | `Buys instantly at the current price (within 0.5%)` |

校验顺序（任一命中即 return，不进入提交）：

| 顺序 | 条件 | 用户看到 |
|---|---|---|
| 1 | `!user` | 触发 `onRequestAuth()`（拉起登录） |
| 2 | `blocked` | `toast.error(blockedReason \|\| "Market unavailable")` |
| 3 | `amountNum <= 0` | `Enter an amount` |
| 4 | `amountNum > spotBalance` | `Not enough balance — add funds to continue` |
| 5 | `qtySnapshot <= 0` | `Amount too small to buy 1 share` |

- Buy 按钮禁用条件：`disabled={submitting \|\| blocked}`；被 block 时按钮文案变为 `blockedReason`，兜底 `Market closed`。
- 提交态：`submitting` 在调用 `executeSpotTrade` 前置 true，`finally` 复位。
- 成功：`toast.success(\`Bought ${qty} shares · ${sideLabel}\`)`，清空金额并回调 `onFilled?.()`；`balanceDelta < 0` 走 `deductSpotBalance`，`> 0` 走 `addSpotBalance`。
- 失败：统一 `toast.error(err.message)`，无 message 时 `Trade failed`。

### 1.2 合约面板 `LiteContractOrderPanel`
取证：`src/components/lite/contract/LiteContractOrderPanel.tsx`、`src/services/tradingService.ts`

计算链（全程浮点，提交前不做四舍五入）：

```
notional  = amountNum * effBoost
fee       = notional * FUTURES_FEE_RATE      // 0.001
quantity  = notional / sidePrice
```

| 顺序 | 条件 | 用户看到 |
|---|---|---|
| 1 | `!user` | 拉起登录 |
| 2 | `blockNotice` | `toast.error(blockNotice)` |
| 3 | `blocked` | `toast.error(blockedReason \|\| "Market unavailable")` |
| 4 | `amountNum <= 0` | `Enter an amount` |
| 5 | `cashNeeded + fee > balance` | `Not enough balance — add funds to continue` |
| 6 | `!(qtySnapshot > 0)` | `Amount too small` |

- Buy 按钮禁用条件：`disabled={submitting \|\| blocked \|\| !!blockNotice}`。提交中按钮只是 disabled + `opacity-50`，**文案不变**。
- 成功文案三种：
  - 反向净掉且有现金回流：`Cashed out {heldSideLabel} · ${x.xx} back`
  - 反向净掉无回流：`Cashed out {heldSideLabel}`
  - 常规开仓：`Backed {sideLabel} · ${x.xx}`
- 余额落账由面板执行：`balanceDelta < 0 → deductBalance`，`> 0 → addBalance`；`deductBalance` 失败抛 `Failed to update balance`。
- 失败兜底：`toast.error(err instanceof Error ? err.message : "Could not place that")`。引擎侧可见错误原样透出，例如 `Invalid margin calculation. Please try again.`、`Close existing position first before opening the opposite side.`、`Reduce and close orders must not require opening margin.`。

### 1.3 四类失败路径的实际表现（重要，勿按直觉假设）

| 场景 | 实际行为 |
|---|---|
| 余额不足 | 客户端前置拦截，见上表；引擎侧无独立余额校验 |
| 价格偏离 / 行情跑掉 | **不存在**"价格已变动"这条错误。现货只做单向 +0.5% 加价快照；合约直接用快照价提交；`tradingService` 只做内部自洽校验（margin 1% 容差、fee 5% 容差），从不与实时价比对。行情跑掉的结果是按旧价成交，不报错 |
| 事件在下单途中过期 | 只有提交前的 `blocked` / `blockNotice` 闸门；`executeTrade` / `executeSpotTrade` 内**没有** freeze/end/resolved 服务端复核。已发出的请求不会因事件冻结被中止 |
| 网络错误 | 无专门分支。Postgrest 错误对象通常不是 `Error` 实例，因此实际落到兜底文案（合约 `Could not place that` / 现货 `Trade failed`） |

### 1.4 Boost 选择器
取证：`src/components/lite/contract/LiteBoostSelector.tsx`、`src/hooks/useCategoryBoostConfigs.ts`、`src/pages/lite/LiteContractTrade.tsx`

- 档位来源：`category_boost_configs`（`category / enabled / max_leverage`）。`enabled = !!r.enabled && max_leverage >= 2`，未知品类回落 `{ enabled: false, maxBoost: 1 }`。
- 档位算法：候选 `[2,3,5,10,20,50]` 过滤 ≤max；候选 ≤3 个时 `[1, ...c]`，否则 `[1, 2, m, L]`，`L = max(c)`、`m` 取最接近 `sqrt(2·max)` 的候选。
- Custom 托盘：滑杆 `min=2 max=maxBoost step=1`，在卡片内就地展开，不弹二级弹层；1× 基线时数字框为空并显示 `2–{max}` 占位。
- 默认值 `1`；重置触发**仅**品类变化：`useEffect(() => setBoost(1), [boostCategoryKey])`。refetch / realtime 不会重置用户手选。品类未开放 Boost 时 `effBoost` 强制为 1。
- 说明文案：`Bigger Boost, bigger win if you're right — and an earlier auto-close if the price moves against you.`

### 1.5 移动端抽屉
取证：`src/pages/lite/LiteContractTrade.tsx`、`src/pages/lite/LiteSpotTrade.tsx`

移动端底部条的 Buy 按钮只负责**打开 MobileDrawer**，抽屉内渲染的是同一个面板组件，所以上述全部校验、文案、禁用条件在移动端一字不差地复用；被 block 时底部条按钮直接 disabled，抽屉不打开。

---

## 2. Cash out 流程
取证：`src/components/lite/contract/LiteCashOutFlow.tsx`、`src/pages/lite/LiteContractTrade.tsx`、`src/hooks/usePositions.ts`

- 入口：只有 `LiteContractTrade` 渲染它，两处——单一二元持仓卡（`setCashOutOpen(true)`）与多市场每条腿（`setCashOutId(p.id)`）。桌面 Dialog（`sm:max-w-[380px]`）／移动 MobileDrawer，标题均为 `Cash out`。
- 步骤：选比例（快捷 chip `25 / 50 / 100`，滑杆 `1–100`）→ 读回款预估 → 确认。
- 文案：说明行 `Cashing out {pct}% of your {sideLabel} call.`，金额行 `You get back ≈ $x.xx`，CTA `Cash out ≈ $x.xx`。
- 部分 vs 全部：`qty = min(sizeNum, max(EPSILON, fraction * sizeNum))`，**不取整、不设 1 股下限**；`pct >= 100 → closePosition(positionId, positionIndex)`，否则 `partialClosePosition(positionId, positionIndex, qty)`。
- 现货复用：`onConfirmCashOut` 覆写口用于现货卖出腿（款项要进现货余额），合约页不传。
- 落库：登录用户经 `usePositions` → `useSupabasePositions` 写 `positions`（全平置 `Closed`，部分平减少 `size` / `margin` 并保持 `Open`）；游客态改本地 store。
- 结果反馈：`toast.success(\`Cashed out ≈ $x.xx\`)`，关闭浮层并回调 `onDone()`（合约页借此 bump `refetchTick`）；失败 `Could not cash out`。

---

## 3. 实时行为

取证：`src/contexts/RealtimePricesContext.tsx`、`src/components/lite/intraday/intradayData.ts`、`src/components/lite/contract/LiteMarketActivity.tsx`、`src/pages/lite/LiteSpotTrade.tsx`、`src/pages/lite/LiteQuickTrade.tsx`、`src/hooks/useActiveEvents.ts`

| 节奏 | 值 | 位置 |
|---|---|---|
| 价格真值 | Supabase Postgres realtime 订阅 + 挂载时一次性 `fetchPrices()` | `RealtimePricesContext` |
| 价格展示抖动 | 3000ms，振幅 0.006 | `JITTER_MS / JITTER_AMP` |
| /spot 合成价漂移 | 2500ms tick | `LiteSpotTrade` |
| 倒计时 | 1000ms（`useTradeCountdown` / `useSecondTick`） | `intradayData.ts` |
| 快轮列表刷新 | 20000ms + 1s 到期看门狗 | `intradayData.ts` |
| 体育 live/upcoming 重算 | 30000ms | `sportsData.ts` |
| 成交流水 | realtime INSERT 订阅 + 2–8s 随机 drip-feed 逐条揭示 | `LiteMarketActivity` |

边界行为：

- **快轮倒计时归零（/spot 快轮分支）**：`remaining <= 0` 时面板 block，理由文案 `Settling`；同时 bump `refetchTick` 并由 1s 看门狗触发一次刷新；`useQuickRounds` 返回新一轮后自动 `navigate('/spot?event=…&side=…', { replace: true })` 换轮，页面不跳走。
- **股票倒计时归零（/spot 日内股）**：无专门事件回调，`isPastFreeze(freezeAt, endDate)` 翻 true 后按钮转 disabled 并显示 `blockedReason`；倒计时文本停在 `00:00:00`。
- **交易时段收盘时仍停在 /spot**：不会跳转、不会自动重查。下单闸门读的是 DB 的 `lifecycle_status` / `freeze_time` / `end_date`（挂载与 `refetchTick` 时取），`usStockSessions` 只负责展示层。
- **事件在 /trade 上结算**：页面**没有**订阅 `events` 表的 `is_resolved` 变更。`resolved` 来自本地 `event` state，只有 `refetchTick`（用户自己成交 / cash out）或重新进入页面才会更新。已结算时按钮理由为 `Settled`，过期 / 冻结为 `Closed`。
- **列表中的事件过期**：`useActiveEvents` 只在挂载时拉一次，无轮询、无订阅；过期行由 `useMarketListData` 用 `Date.now()` 客户端过滤（`end_date` 已过则隐藏）。该 memo 只依赖 `[events]`，所以页面挂着不动时不会自动清理，需 `refetch()` 或重新进入。

---

## 4. 加载 / 错误状态

| 页面 | 状态 | 渲染方 |
|---|---|---|
| /events | 加载 | `Loader2` 居中 spinner（`LiteEventsPage`，`py-20`） |
| /events | 收藏为空 | `EmptyState variant="page"` — `Nothing starred yet` / `Tap the ★ on any market and it'll show up here.` / `See all markets` |
| /events | 通用为空 | `EmptyState variant="page"` — `No open markets here right now` / `New markets land in this topic as they open. Check back soon.` |
| /events | Boost 筛选为空 | 各纵向视图自渲染 `Nothing boosted here yet — check back soon.` |
| /events | 查询失败 | **无 UI**。`useActiveEvents` 暴露 `error` 但页面未消费，仅 `console.error`，表现等同空列表 |
| /trade | 首次加载 | `Loader2` 全屏（`isFirstLoad` 把关，后续 refetch 不闪屏） |
| /trade | 无 event 参数 | `<Navigate to="/events" replace />` |
| /trade | 事件不存在 / 缺 option | `<ExpiredEventFallback eventId={eventId} />` |
| /trade | Boost 配置加载中 | 面板内同构骨架（标签行 + chip 行 + 两行说明） |
| /trade | 流水为空 | `No activity yet` / `Trades on this market show up here as people back a side.` |
| /trade | 更多市场为空 | `No other markets right now` / `New markets show up here as they open.` |
| /spot | 加载 | `Loader2` 全屏 |
| /spot | 无 event 参数 | `<Navigate to="/events" replace />` |
| /spot | 事件不存在 | `<ExpiredEventFallback />` |
| /spot | 更多股票为空 | `No other markets right now` / `More stocks open here at the start of each trading day.` |
| 全部 | 下单 / 平仓错误 | 一律 `sonner` toast，无专用错误组件 |

重试：三页均**无自动重试、无退避**。唯一的恢复手段是用户操作触发的 `refetchTick` 或重新进入页面。

---

## 5. 数据契约

### 5.1 `events.metadata` 实际被读到的字段

三处互不相干的形状，Lite 这三个面上没有统一的 metadata schema。

```jsonc
// 1. 编辑精选 — src/components/lite/picks/editorialPicks.ts
{ "editorial": { "pick": true, "rank": 1, "note": "…", "updated_at": "2026-08-05T…Z" } }
// 查询条件：.filter("metadata->editorial->>pick", "eq", "true")，pick !== true 直接丢弃

// 2. 体育赛事 — src/components/lite/sports/sportsData.ts
{ "league": "EPL", "home": "…", "away": "…", "home_abbr": "…", "away_abbr": "…",
  "format": "…", "kickoff_at": "2026-08-05T18:00:00Z",
  "live": true, "minute": 63, "phase": "2H", "score": "1-0" }
// kickoff_at 缺失时回落 events.start_date
```

- **`metadata.coin` / `metadata.timeframe` 不存在也未被读取。** 币种由 `coinOfEvent()` 对 `eventId + eventName + topMarket.label` 做正则匹配（`btc|bitcoin` / `eth|ethereum|ether` / `sol|solana`）；快轮周期由事件 id 模式 `crypto-{coin}-updown-{tf}-{period}` 解析。
- `metadata.league` 同时被 `taxonomy.ts` 的 `leagueCodeFor()` 用于联赛归类。

### 5.2 `event_subtype` 取值与作用

| 取值 | 驱动什么 |
|---|---|
| `CRYPTO_QUICK_UPDOWN_SPOT` | 加密快轮引擎；`/spot` 上由 `parseQuickId(eventId)` 命中后改渲染 `LiteQuickTrade` |
| `US_STOCK_DAILY_UPDOWN_SPOT` | 美股日内涨跌轮；同时供 `usStockSessions` 判定所属市场 |
| `HK_STOCK_DAILY_UPDOWN_SPOT` | 港股日内涨跌轮，同上（HK$ / HKT 终端） |
| 以上三者合集 `INTRADAY_SUBTYPES` | 从常规 open-markets 网格中**排除**日内引擎行；日历视图据此打 intraday 标记 |
| `SPORTS_MATCH` | 全部体育赛事数据集（`useSportsMatches`） |

### 5.3 价格与 option 语义

- `event_options.price` 是活跃报价（0–1 概率轴），`final_price` 只在结算后写入，`is_winner` 标胜出腿。
- `option_id` 是价格追踪主键：realtime 价格按 `option_id` 分发（`getPrice(optionId)`），下单时随 `TradeData.optionId` 落到 `trades.option_id` / 持仓，供结算回溯。
- 合约 fee 单一真值 `FUTURES_FEE_RATE = 0.001`；现货 fee 恒为 0（`executeSpotTrade` 写入 `fee: 0`）。

### 5.4 boost-capable 判定（逐字）

品类级判定，**没有** per-event 的 boost 字段：

```ts
// src/hooks/useCategoryBoostConfigs.ts
enabled: !!r.enabled && Number(r.max_leverage) >= 2,
maxBoost: Math.max(1, Number(r.max_leverage) || 1),

// src/pages/lite/LiteEventsPage.tsx
if (boostOnly) {
  set = set.filter((m) => {
    const cfg = getBoostConfig(m.category);
    return cfg.enabled && cfg.maxBoost >= 2;
  });
}
```

### 5.5 `getMarketSession` 语义

它是一个纯挂钟日历函数：以市场自身 IANA 时区（`Intl.DateTimeFormat`）算出当地星期与分钟数，周一至周五 09:30–16:00 为开市，返回 `{ market, open, closeAt, nextOpenAt }`，`nextOpenAt` 向前跨越周六周日滚到下一个交易日 09:30。它**绝不**从任何 event 行的时间窗反推交易时段（源码注释明写 "Session resolution must NEVER be inferred from event rows"），因此事件数据缺失或错配都不会污染时段判断。

### 5.6 深链

| 链接 | 行为 |
|---|---|
| `/trade?event={id}` | `LiteContractTrade` 唯一入参；缺失 → 重定向 `/events` |
| `/spot?event={id}` | `LiteSpotTrade`；若 `parseQuickId(eventId)` 命中则改渲染 `LiteQuickTrade` |
| `/spot?event={id}&side=up\|down` | `up → yes`、`down → no`。股票页用 effect 持续同步该参数；快轮页只在挂载时读一次，之后由换轮逻辑 `replace` 重写 URL |
| `/trade` 或 `/spot` 裸路径 | `<Navigate to="/events" replace />` |

Surface 路由本身由 `App.tsx` 分流：`surface === "lite"` 时 `/trade` → `LiteContractTrade`、`/spot` → `LiteSpotTrade`，Pro 则走 `DesktopTrading` / `SpotTrading`。

---

## 6. 分页面状态清单

| 页面 | 状态 | 渲染组件 |
|---|---|---|
| /events | loading | `LiteEventsPage` 内 `Loader2` |
| /events | live（有数据） | `CardGrid` / `LiteAllStage` / 各纵向视图 / `LiteCalendarView` |
| /events | asleep-session（无开市股票） | `IntradayStageCard` 返回 `null`（整块不渲染） |
| /events | empty | `EmptyState variant="page"`（收藏 / 通用两套文案） |
| /events | boost-empty | 各纵向视图内 `EmptyState variant="module"` |
| /events | settled | `LiveSettledSwitch` 切至 `LiteSettledPage` / `LiteSettledCard` |
| /events | error | 无专用渲染，退化为 empty |
| /trade | loading | `Loader2` 全屏（仅首次） |
| /trade | live | `LiteContractChart` + `LiteContractOrderPanel` + `LitePositionCard` + `LiteMarketActivity` |
| /trade | asleep / closed | 面板 CTA disabled，文案 `Closed` |
| /trade | empty（无其他市场 / 无流水） | `EmptyState variant="module"` ×2 |
| /trade | settled | `LiteOutcomeCard`（不是 `ExpiredEventFallback`），CTA 文案 `Settled` |
| /trade | error（事件不存在 / 缺 option） | `ExpiredEventFallback` |
| /spot | loading | `Loader2` 全屏 |
| /spot | live | `LiteStockChart` + `SpotBlocks`（`SentimentBar` / `SettlementRail` / `YourPosition`）+ `LiteOrderPanel` |
| /spot | asleep-session | 面板 disabled + `blockedReason`（`Closing soon` / `Market closed`）；快轮为 `Settling` |
| /spot | empty | `EmptyState variant="module"` — `No other markets right now` |
| /spot | settled | 事件行 `lifecycle_status` 驱动的结算展示 + 面板 block |
| /spot | error | `ExpiredEventFallback`；无 event 参数则重定向 |

---

## 7. 已知限制（上真钱之前必须解决）

当前这三个面的资金链路**完全跑在浏览器里**：手续费在前端按 `FUTURES_FEE_RATE` 算好后连同 margin、quantity 一起提交；`tradingService.executeTrade` / `executeSpotTrade` 是客户端直连 Supabase 的表写入（`trades` / `positions`），没有任何 edge function 或 RPC 把关；服务端只有 Zod 形状校验加两条自洽性校验（margin 1% 容差、fee 5% 容差），它们校验的是"客户端提交的这几个数字彼此对不对得上"，而不是"这个价格现在是否真实"；余额则由页面在拿到 `balanceDelta` 后自行调用 `deductBalance` / `addBalance` 落账，成交与扣款是两笔互不原子的写入。同时不存在服务端的事件冻结／结算复核，也不存在真正的滑点拒绝（0.5% 只是客户端单向加价快照）。因此在接入真实资金之前，必须把撮合、计费、余额变更与结算整体迁移到服务端权威执行路径（edge function 或数据库函数 + 事务），并由服务端读取实时价格做偏离与时窗校验。

---

_Generated on 2026-08-05._
