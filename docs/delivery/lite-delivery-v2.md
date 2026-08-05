# OmenX Lite 交付包 v2 — 事件列表 + 合约交易页 + 现货交易页

## 目录
1. 结构层 — Lite 事件列表 + 合约交易页 + 现货交易页 交付说明 v1（§1–§9）
2. 附录 B — 行为层（逐条代码核实）
3. 附录 G — 设计基准、红线与验收（治理层）
4. 视觉基准：`/style-guide` + `docs/design-contracts/master-components.html`
5. 分类唯一来源：`src/lib/taxonomy.ts` + `docs/taxonomy.md`
6. 工程债与验收清单见附录 G4 / G5

---

# Lite 事件列表 + 合约交易页 + 现货交易页 — 交付说明 v1

> 本文档覆盖三个线上面：Live 事件列表（`/events`，Lite surface）、合约交易页（`/trade`）、现货交易页（`/spot`，含快轮分支）。研发以本文档为准。三个页面遵守 CHK-8 单一交易页纪律：全站只有 `/trade` 与 `/spot` 两个交易页，新品类一律以模块增删接入，不得新建交易页或新图表画法。配套：附录 B（行为层，逐条代码核实）与附录 G（设计基准、红线与验收）。

## 1. 功能目标

- **Live 列表**：一屏内完成"选品类 → 选事件 → 进交易页"。品类即视图（category-as-view）：All / Intraday / Sports / Crypto / Finance / Politics / Economy / …，Boost 与 Watchlist、Calendar 是叠加在同一事件池上的正交筛选/透镜。
- **合约交易页**：Yes/No 与 Up/Down 事件的带 Boost（杠杆）下单，支持单市场与多市场（MarketBoard）两种形态。
- **现货交易页**：股票日内 up/down 与加密快轮的无杠杆、零手续费下单，带结算轨（Settlement rail）。

约束：Lite 文案禁词（Margin / Liquidation / Leverage / Long / Short / Order book / Limit 等）；UI 无 emoji，全部 Lucide 图标。

## 2. 页面与路由

| 路由 | 组件 | 说明 |
|---|---|---|
| `/events` | `LiteEventsPage` | Live 列表；Settled 切换跳 `/resolved` |
| `/trade` | `LiteContractTrade` | 合约（Boost）交易页 |
| `/spot` | `LiteSpotRoute` → `LiteSpotTrade` \| `LiteQuickTrade` | 现货页；`parseQuickId(eventId)` 命中即走快轮分支 |

## 3. 数据来源

| 来源 | 用途 |
|---|---|
| `events`（`is_resolved=false`，按 `end_date asc`） | 事件主体、`metadata.editorial`（Editor's picks）、`base_price`、`rules` |
| `event_options` | 每个 outcome 的 `price` / `final_price`；`option_id` 为价格追踪主键 |
| `positions` / `trades` / `profiles` | 持仓、成交、余额；由 `tradingService` 直接读写，无 edge function |
| `useActiveEvents` → `useMarketListData` | 列表事件池 `EventRow[]`（过滤已过期 `end_date`，派生 `categoryLabel` / `sideLabels` / `children` / 24h 指标） |
| `useWatchlist` / `useCategoryBoostConfigs` / `useSportsMatches` / `useQuickRounds` / `useIntradayStocks` / `useEditorPicks` | 收藏、Boost 配置、赛事、快轮、日内股票、编辑精选 |

结算（`is_resolved` / `is_winner` / `final_price`）由后端 cron 写入，交易页只读。

## 4. Live 列表页（`/events`）

### 4.1 模块顺序 — 桌面

`EventsDesktopHeader` → 标题区（H1 "What do you think happens next?" + "Pick a topic. Tap Yes or No. That's it." + 右上 `LiveSettledSwitch`）→ 筛选行 → 主体。

主体按状态互斥：

| 状态 | 渲染 |
|---|---|
| Calendar 开启 | `LiteCalendarView` 替换全部下方内容 |
| sector = all（非 Boost） | `LiteAllStage`（62% / 1fr：`IntradayStageCard` + `SportsStageCard`）→ `EditorPicksModule` → "Will it happen?" 目录区 |
| Intraday / Sports / Crypto / Finance | 对应整宽 `Lite*View`（各自带二级 Dimension 行） |
| 其他 sector | 直接 `CardGrid` |

页脚：`Want charts, leverage and the order book? Switch to Pro mode`（`mt-auto` 固定底部）。

### 4.2 模块顺序 — 移动端

`MobileHeader` → 标题区 → 独立一行 `LiveSettledSwitch` → `MobileCategoryRow`（横滑：All / Intraday / Sports / sectors + Boost + Watchlist + Calendar）→ `LiteMobileAllStage`（`MobileIntradayModule` → `MobileSportsModule` → `EditorPicksModule`，22px 间距）或单模块 → 目录区 → 页脚 → `BottomNav`。

### 4.3 筛选与 chip

| 层级 | 名称 | 内容 |
|---|---|---|
| Tier-1 Category pill | 品类 | `TOP_CATEGORIES`（`src/lib/taxonomy.ts`）；仅渲染有事件的品类；Sports 需有 match |
| Trait chip | `Boost` | 原地过滤为 boost-capable 事件，按品类分组渲染 |
| Lens chip | `Watchlist` / `Calendar` | 替换主体；Watchlist 视图不参与排序，保留用户顺序 |
| Tier-2 Dimension row | 各 vertical 内的二级筛选 | Crypto: `Round`；Finance: `Class` / `Region`；Sports: `Sport` / `League` |

Round 档位选择器全站统一大写 **ROUND**（组件 `RoundDial`），不再出现 Window / Round length。

### 4.4 徽章与排序

徽章配置只在 `src/lib/liteListBadges.ts` → `LITE_LIST_CONFIG`。每卡最多 2 个，填充顺序 STATUS → Intraday → Boost（超出先丢 Boost）。

| Track | 徽章 | 条件 | 文案 |
|---|---|---|---|
| STATUS（唯一） | Ends soon | 距结算 < 4h | `Ends {Xh Ym}`，60s tick |
| STATUS | New | 创建 < 24h | `New` |
| STATUS | Trending | 24h 量在已加载 live 集前 20%，且 live 集 ≥ 5 | `Trending` |
| ATTRIBUTE | Intraday | 当日开当日结 | `Intraday · {Xh Ym}` |
| ATTRIBUTE | Boost | 合约事件且 maxBoost ≥ 2 | `Boost {n}×` |

Intraday 事件豁免 New / Ends soon，只能带 Trending；且 Intraday 事件不进主 grid（归 Intraday band / 模块）。

排序 `sortLiteLiveList`：① < 4h 结算优先，按剩余时间升序；② 其余按 24h 量降序；③ < 24h 的新事件若排在 6 位之后，提升进前 6，相对顺序不变，且不挤掉 Ends-soon。

### 4.5 空状态

| 场景 | 标题 / 描述 / 动作 |
|---|---|
| Watchlist 空 | `Nothing starred yet` / `Tap the ★ on any market and it'll show up here.` / `See all markets` |
| 通用空 | `No open markets here right now` / `New markets land in this topic as they open. Check back soon.` / `See all markets` |

## 5. 合约交易页（`/trade`）

### 5.1 模块顺序

| 形态 | 顺序 |
|---|---|
| 桌面 · 单市场 | QuestionBlock → SentimentBar → `LiteContractChart` → RuleCard → YourPosition → MarketActivity；右栏 `LiteContractOrderPanel` + MoreMarkets |
| 桌面 · 多市场 | QuestionBlock → `LiteMarketBoard` → RuleCard → MultiPositions → MarketActivity |
| 桌面 · 已结算 | QuestionBlock → `LiteOutcomeCard` |
| 移动 · 单市场 | QuestionBlock → Chart → SentimentBar → RuleCard → YourPosition → MarketActivity → MoreMarkets ＋ 底部固定 Buy 双键 ＋ `MobileDrawer` 下单面板 |
| 移动 · 多市场 | MultiMetaRow → QuestionBlock → CrowdOverview → MarketBoard → RuleCard → MultiPositions → MarketActivity → MoreMarkets（无固定 Buy 条） |

### 5.2 下单与 Boost

- 手续费：`FUTURES_FEE_RATE = 0.001`（`src/services/tradingService.ts`），全站唯一来源。
- 计算：`effBoost = boostEnabled ? boost : 1`；`notional = amount × effBoost`；`fee = notional × 0.001`；`quantity = notional / sidePrice`。杠杆只进 notional 与保证金，**绝不进 PnL 公式**。
- 切换品类时 boost 强制回落 1×（加杠杆必须是显式动作）。
- 执行：`executeTrade()`；直接写 `positions` / `trades`。
- 关键文案：`Make your call`、`Est. auto-close`、`Moves with your other positions`、`Not guaranteed. You can lose your full {amount}.`、`Buy {label} {cents}¢` + `{n}× BOOST`。
- RuleCard 尾句：`Winning shares pay $1 each, credited automatically at settlement.`

## 6. 现货交易页（`/spot`）

### 6.1 模块顺序

| 形态 | 顺序 |
|---|---|
| 桌面 · live | QuestionBlock → SentimentBar → `LiteStockChart` → SettlementRail → RuleCard → YourPosition → MarketActivity → CashOut；右栏 `LiteOrderPanel` + MoreStocks |
| 移动 · live | QuestionBlock → CountdownLine → Chart → SentimentBar → RuleCard → SettlementRail → YourPosition → MarketActivity → CashOut → `More stocks closing today · See all →` ＋ 固定 Buy 双键 ＋ `MobileDrawer` 下单面板 |
| 已结算 | QuestionBlock → `LiteOutcomeCard`（+ 移动端 More stocks 链接） |

### 6.2 共享区块与快轮分支

- 共享自 `src/components/lite/trade/SpotBlocks.tsx`：`SpotSentimentBar`（"What the crowd thinks"）、`SpotSettlementRail`（"How it settles"，节点 Opened / Market open / Trading NOW / Closes / Settles）、`SpotYourPosition`。
- `LiteQuickTrade`（加密快轮）复用同一套 SpotBlocks + `LiteStockChart` + `LiteOrderPanel`，属于现货页骨架的变体分支，不是独立页面。
- 快轮页当前**不提供收藏**（币种×档位动态组合，按 CPO 决定保持现状）。

### 6.3 下单

- 无杠杆、无手续费；用 `SLIPPAGE_BPS = 50`（0.5%）做可成交限价快照。
- 执行：`executeSpotTrade()`。
- 面板底部文案：`Buys instantly at the current price (within 0.5%)`。
- 市场感知：美股 `$` / ET，港股 `HK$` / HKT（`src/lib/usStockSessions.ts` + `market.currency`）。
- RuleCard：`Wins {yesLabel} if {ticker}'s {closeLabel} close beats {basePrice}. A flat close counts as {noLabel}. Each winning share pays $1, credited automatically at settlement.`

## 7. 两页共有约定

| 维度 | 规则 |
|---|---|
| 移动端 Header | `MobileHeader` 不透明；`title = event.name`（line-clamp-2）；`titleHidden = !scrolledOut`（`useHeadingScrolledOut`，H1 滚出后 150ms 淡入） |
| 收藏星 | 移动端在 header `rightContent`；桌面在 H1 旁 |
| 成交流水 | 两页同一个 `LiteMarketActivity` + `useMarketActivityRows`，`maxRows` 移动 4 / 桌面 8 |
| 抽屉 | `MobileDrawer`，`showHandle hideCloseButton`，底部 `pb-[calc(env(safe-area-inset-bottom,0px)+16px)]` |
| Chip Law | 方向对（Up/Down）才用 Tier-1 着色按钮；任何 Yes/No 对一律 Tier-2 中性容器，只有价格带方向色 |

## 8. 涉及文件

**列表**
`src/pages/lite/LiteEventsPage.tsx`；`src/lib/taxonomy.ts`、`src/lib/liteListBadges.ts`、`src/lib/categoryUtils.ts`；`src/components/lite/LiteEventCard.tsx`、`LiveSettledSwitch.tsx`、`LiteListControls.tsx`；`src/components/lite/allstage/*`、`mobile/*`、`categoryviews/*`、`sports/*`、`intraday/*`、`picks/*`、`calendar/*`；`src/hooks/useActiveEvents.ts`、`useMarketListData.ts`、`useWatchlist.ts`、`useCategoryBoostConfigs.ts`

**合约页**
`src/pages/lite/LiteContractTrade.tsx`；`src/components/lite/trade/LiteContractOrderPanel.tsx`、`LiteContractChart`、`LitePositionCard`、`LiteOutcomeCard`、`LiteCrowdOverview`、`multi/LiteMarketBoard.tsx`

**现货页**
`src/pages/lite/LiteSpotTrade.tsx`、`LiteQuickTrade.tsx`；`src/components/lite/trade/SpotBlocks.tsx`、`LiteOrderPanel.tsx`、`LiteStockChart`、`LiteCashOutFlow`；`src/lib/usStockSessions.ts`

**共用**
`src/components/MobileHeader.tsx`、`EventsDesktopHeader.tsx`、`BottomNav.tsx`、`src/hooks/useHeadingScrolledOut.ts`、`src/components/lite/shared/primitives.tsx`、`SideButton.tsx`、`src/services/tradingService.ts`、`src/contexts/SurfaceContext.tsx`

## 9. 未变更 / 明确不做

| 项 | 说明 |
|---|---|
| 交易页数量 | 仍是 2 个（`/trade` `/spot`），本轮不新增 |
| 快轮收藏 | 不实现，保持线上现状 |
| Spot 手续费 | 恒为 0，不接入 `FUTURES_FEE_RATE` |
| Intraday 事件进主 grid | 不进，只在 Intraday 模块/band |
| Pro 面 | `/events` Pro 版仅新增 Lite 逃生口页脚，其余未动 |

---

# 附录 B — 行为层（逐条代码核实）

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

---

# 附录 G — 设计基准、红线与验收（治理层）

## G1. 视觉唯一基准（强制）

研发实现与验收的视觉基准只有两个，按优先级：

1. **`/style-guide`（线上 Style Guide）** — 六个 Lite 区块全部直接渲染线上组件（非手抄稿），全部预设挂在统一冻结时钟 `FROZEN_NOW = 2026-08-03T15:20:00Z` 上，任意两次打开渲染一致（唯一例外：LivePulse 呼吸动画相位；如需像素回归对比，请要求前端提供 animation-pause 查询参数）。每个区块的描述里标注了组件的正式名称与变体名。
2. **`docs/design-contracts/master-components.html`（Master Components）** — 组件字典，与线上代码、style-guide 三方一致。所有组件命名、尺寸、变体以此为准。

历史定稿合同存于 `docs/design-contracts/`（category-views-7 / calendar-final + calendar-asbuilt-notes / list-final-touches-11 + asbuilt-notes / vertical-views-12 / sports-subnav-13）。**冲突时优先级：线上代码 = style-guide = Master ＞ 历史合同稿**。历史稿是设计过程记录，不作实现依据；其中日历以 `calendar-asbuilt-notes.md` 为准。

## G2. 组件命名与变体（研发沟通用语）

| 正式名 | 变体 | 出处 |
|---|---|---|
| Category pill（`PILL_BASE`） | — | 顶部一级品类行专用 |
| Dimension pill（`DimensionPill`） | desktop / mobile(44px) | 各 vertical 的二级筛选行 |
| DirectionButton（Tier-1） | split / centered / stacked | 方向对按钮唯一实现 |
| Tier-2 outcome chip（`chip-t2`） | row / stacked / 58px card-face / COMPACT | 所有 Yes/No 与多结果 |
| SideButton | — | 交易面板选边控件（两面板共享） |
| Last8Strip | squares(11px) / strip(9px) / bars | 历史条唯一实现 |
| RoundPlot | 桌面96 / 移动84 | 币种回合图表唯一画法 |
| Dial | module / card / stage | 回合时长切换器 |
| MobileRoundSwitcher | — | 390 端回合切换 |
| Crest | 默认 / muted | 球队徽章唯一实现 |
| LivePulse | 6px(intraday) / 5px(sports) / 4px(calendar compact) | 脉冲点唯一实现 |
| SessionStatusChip | — | 开市状态胶囊 |
| EmptyState | page 等 | 空态唯一实现 |

**禁止新画**：以上对象在任何新需求中不得重新实现；密度差异用变体 prop 表达。

## G3. 不可违背的设计法则

1. **Chip 法则（绝对，2026-08-05 裁定）**：染色 Tier-1 只给方向对（Up/Down、Up/Not-up）；任何 Yes/No 对一律 Tier-2 中性容器（中性底 + 1px #23262D 描边，仅价格带方向色 Yes #33D6FF / No #CFFF4A），全站无豁免。唯一另案：交易面板 SideButton 暂保持染色，待单独裁定，不得外推。
2. **色轴令**：方向色 = Pulse Blue #33D6FF（Up/Yes）/ Volt #CFFF4A（Down/No）；标的涨跌 ±% = trading token `hsl(74 100% 65%)` / `hsl(0 100% 68%)`（两套色永不混用）；橙 #FF8A3D 仅 Intraday 身份（表盘/倒计时/身份点）；红点仅表示 live；chalk #F2F3F5 为 Sports 身份。禁止新增字面量色，#E6E9EE 已收敛为 `CHALK_SOFT` token。
3. **词汇红线（Lite UI 禁词）**：Margin、Liquidation、Funding、Leverage、Long、Short、Spot、Futures、Order book、Limit、Moneyline、Props。替换口径：Leverage→Boost、强平价→Est. auto-close、本金→Put in、当前市值→Now worth；用户动词只有 Back（买入）与 Cash out（拿回）。
4. **页面网格**：桌面 1280 内容区 3 卡/行、16px 间距（禁 4 列）、左右 24px；移动 390、16px 边距、单列、22px 模块间距、触控目标 ≥44px。
5. **CHK-8 单一交易页**：全站只有 `/trade` 与 `/spot`，任何新品类以模块接入，禁止新建交易页面或新图表画法。
6. **Intraday 事件不进主 grid**；Boost 是就地筛选（组合于当前视图，不开新页）；分类的顺序与层级唯一来源是 `src/lib/taxonomy.ts`（可见性数据驱动）。

## G4. 已知工程债（接手必读）

| # | 项 | 严重度 | 说明 |
|---|---|---|---|
| 1 | **钱路在客户端** | 🔴 上真钱前必改 | 手续费计算与余额增减（deductBalance/addBalance）全部发生在浏览器，直接写 positions/trades/profiles，无 edge function、无服务端权威；服务端仅有形状校验与自洽容差（margin 1%、fee 5%），不校验实时价格与时窗。真实资金前必须改为服务端撮合+结算，客户端只读。详见行为附录 §7。 |
| 2 | 结算由后端 cron 写入 | 🟡 | 前端只读 is_resolved/final_price；结算延迟时页面停留在 live 态。 |
| 3 | 快轮/行情为模拟派生 | 🟡 | 价格由 seed+base_price 派生（derivedPrice/smoothWalk），接真实行情时替换数据层即可，组件契约不变。 |
| 4 | Boost 型短周期回合数据未上线 | 🟢 | UI 契约已定（混排 + 荧光绿 Boost pill + CHK-8 路由），见 docs/taxonomy.md「Boost」节。 |
| 5 | Wallet/Portfolio 未含在本次交付 | 🟢 | Portfolio 按 M5 规划另行交付，style-guide 届时补充对应区块。 |

## G5. 验收清单（QA DoD）

**通用（每页）**
- [ ] 1280 与 390 双端渲染与 style-guide 对应预设一致（组件、间距、字号）
- [ ] 禁词扫描通过（G3.3 全表，含空态/错误/toast 文案）
- [ ] 无新增色字面量；±% 用 trading token；Yes/No 无染色容器
- [ ] 触控目标 ≥44px（移动端全部可点元素）
- [ ] 空态/加载/错误三态齐备且与 EmptyState 语法一致

**/events 列表**
- [ ] 品类 chip 按 taxonomy key 数据驱动亮灯（有 stocks/finance 事件时 Finance 亮）
- [ ] Intraday/Sports/Crypto/Finance 四个 vertical 视图可进可出，二级 Dimension 行行为正确（Sports 单联赛隐藏 League 行；9 联赛换行不横滑；Crypto/Finance 带 All 选项）
- [ ] Boost chip 在四个视图内就地过滤，空时显示 "Nothing boosted here yet — check back soon." 且筛选行保留
- [ ] 徽章每卡 ≤2、填充顺序与豁免规则正确；排序三段规则正确
- [ ] 开市判断走 getMarketSession（改系统时间到休市/开市各验一次；三个入口一致）
- [ ] Watchlist/Calendar 透镜互斥、右侧固定；日历行为以 calendar-asbuilt-notes 为准

**/trade 合约页**
- [ ] fee = notional × 0.001（`FUTURES_FEE_RATE` 唯一来源）；杠杆只进 notional，不进 PnL
- [ ] 切品类 boost 回落 1×；风险文案完整（"Not guaranteed. You can lose your full {amount}."）
- [ ] 单市场/多市场/已结算三形态；移动端固定 Buy 双键 + 抽屉

**/spot 现货页**
- [ ] 零手续费；滑点 0.5% 快照；面板底 "Buys instantly at the current price (within 0.5%)"
- [ ] 结算轨五节点正确；市场感知（$/ET vs HK$/HKT）
- [ ] 快轮分支复用同一骨架，倒计时归零翻轮行为正确（见行为附录 §3）
- [ ] Cash out 全流/分步正确（见行为附录 §2）

## G6. 交付物索引

| 物 | 位置 |
|---|---|
| 本文档（结构层+治理层+行为层） | 本文件 |
| Style Guide | `/style-guide`（六个 Lite 区块） |
| Master Components | `docs/design-contracts/master-components.html` |
| 历史定稿合同 | `docs/design-contracts/*.html` + `*-asbuilt-notes.md` |
| 分类唯一来源 | `src/lib/taxonomy.ts` + `docs/taxonomy.md` |
| 交易所日历 | `src/lib/usStockSessions.ts`（含 vitest 用例） |
| 冻结卡备忘 | `.lovable/memory/design/lite-event-card-frozen.md` |
