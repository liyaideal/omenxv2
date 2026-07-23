# 现货展示对齐（Round 4B）— 2026-07-22

> 承接 4A 的现货结算演示流。本轮只做**展示层对齐**，不动券体系 / 双账户 / 4A settle 主实现。视觉规格由产品拍板，本文档记录实施边界与不做项。

## 1. 产品线徽标统一（新增共享模块）

新增 `src/lib/productLineBadge.tsx` 作为全站产品线徽标的**唯一来源**：

- `ProductLineBadge`（React 组件）+ `PRODUCT_LINE_BADGE_CLASSES`（class 字典）
- SPOT: `border-blue-500/30 bg-blue-500/10 text-blue-400`；FUTURES: `border-primary/30 bg-primary/10 text-primary`
- 形状：`inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] font-semibold whitespace-nowrap`

引用点：
- `src/components/wallet/TransactionHistory.tsx` — 之前的 `ACCOUNT_BADGE_CONFIG` 改为引用共享 class（含 SPOT/FUTURES/TRANSFER 分派仍在本地，颜色 token 已收敛）
- `src/components/transparency/TradeVerification.tsx` — 修掉 4A 交付时的紫色版（当时 changelog 声称与流水一致，颜色实际错了），选择列表 + 结果头统一改为 `<ProductLineBadge line="spot" />`

**唯一豁免**：/spot 终端 header 的中性 outline SPOT 徽标（DESIGN.md §14 LOCKED）不动。豁免写入 DESIGN.md 新增小节。

## 2. Settlements 三分口径（`useSettlements` 重写 + 页面重构）

**修根子**：删除 `useSettlements` L66-67 `exitPrice = isWin ? 1.0 : 0.0` 伪造逻辑。新增 `kind` 字段（`settled` | `closed`）驱动 UI 分支：

| 场景 | 判定 | Exit Price | 徽标 |
|---|---|---|---|
| 到期结算（现货 + 期货） | 关联事件 `is_resolved=true` **且**最后一腿关仓价 ∈ {0, 1} | 固定 $1.00（win）/ $0.00（lose） | Settled + Win/Loss |
| 盘中平仓（期货） | 上述条件不成立 | 实际关仓价（trades.price） | Closed + Win/Loss |
| 盘中平仓（现货） | 上述条件不成立 | 实际关仓价（trades.price） | Closed + **仅 PnL 数字**（正绿负红），无 Win/Loss |

**trade↔event 关联**：`trades` 表没有 `event_id`，且 `sim-daily-seed` 每日复用同名事件，直接 `.in("name", …)` + `Map` last-write-wins 会把昨日已结算事件被今日同名活跃事件覆盖，误标全部前一日行。改法：拉取所有同名事件行，用 `[start_date, expected_settlement_time + 15min]` 时间窗匹配 `trade.closed_at ?? created_at`，多命中优先取 `is_resolved=true`；分组 key 额外拼入 `event.id`（无匹配时退化为 `settledAt` 日期），彻底隔离跨日合并。

**页面重构**：`PortfolioSettlements.tsx` 抽出 `SettlementRowDesktop` / `SettlementRowMobile` 两个内联组件（§16.1 LOCKED 前置要求，为 style-guide 真组件预览铺路）：

- 现货行的杠杆位替换为 SPOT 徽标（§1 统一款）
- 移动卡容器改 `rounded-xl border-border/40 p-4` + 165deg 渐变（替换原 `p-3` 无渐变），对齐 DESIGN.md §15
- 桌面行 Win/Loss / 现货 Closed 分支按上表条件渲染

**Win Rate 统计一行未改**（拍板：`result==="win"` 定义 = pnl>0，盘中卖出计入）。

## 3. Settlement Detail 现货分支

`useSettlementDetail` 返回值增 `productLine`。`SettlementDetail.tsx`：
- 顶部 Leverage chip → SPOT 徽标
- P&L Breakdown 隐藏 Position Value（×leverage）行
- 隐藏 Funding Fee 行（现货无资金费）
- `SettlementPoster` 新增 `productLine` prop，Direction chip 里的 `{leverage}x` 现货时替换为 `SPOT`

## 4. /resolved 现货展示

`useResolvedEvents` select 增 `product_lines`，返回值透传 `productLines: string[]`。`ResolvedMarketCard` 顶行 badges 组按 `productLines.includes("spot")` 追加 SPOT 徽标。userPnl 计算逻辑不变（单线事件即整卡口径）。

## 5. 搜索 / 收藏跨产品线

`EventsPage.tsx`：新增 `isFullCatalog = search.trim() !== "" || activeTab === "watchlist"`。

- `filteredMarkets`：`isFullCatalog` 时跳过 `productLine` 过滤（全量搜索/全量收藏），其余路径不变
- 顶部 Futures|Spot 切换在 `isFullCatalog` 时**整块隐藏**（含 Spot 副注），退出即恢复
- 结果行/卡的产品线徽标：`MarketCardB` 顶行 category 旁 + `MarketListView` Event 单元格内 → 均加 `<ProductLineBadge line="spot" />`（futures 不显示、避免噪音）
- 点击路由已 spot-aware（既有实现），未改动
- `HomeSearchBar` 未改（保留 futures-only 快搜行为，未来另议）

**双线事件预留规则**（DESIGN.md §16 记录但本轮不实现）：一个事件同时含 spot + futures 时，结果层每条产品线一行、各自带徽标 + 独立路由。

## 6. Style Guide（真组件双端）

在 `WalletSection` 新增 `settlements-4b` 章节，通过 `DualDevicePreview` 挂载全部 9 个真组件预览：
- 结算行三态双端：`settlement-row-{futures-win,spot-settled,spot-closed}-{desktop,mobile}` — 引用 `PortfolioSettlements.tsx` 抽出的 `SettlementRowDesktop / SettlementRowMobile`；
- `resolved-market-card-spot` — 真 `ResolvedMarketCard` + mock `ResolvedEvent`；
- `market-search-row-spot` — 真 `MarketCardB` + mock `EventRow`；
- `product-line-badge-legend` — 徽标一览。

## 7. 4A 遗留清理

- `sim-settle-spot`：Pending 撤销 SQL 现拥有对称时间窗 `.gte("created_at", ev.start_date)`（4B 修复轮新增，防同名次日事件误伤）+ `.lte("created_at", ev.expected_settlement_time)`（4B 收尾轮新增，防同名次日事件在结算后开的新单被扫入），配合原 `event_name` 过滤形成三重定位
- credit→close 微窗口在函数内加 DEMO-STATE 长注释：现货 settle 的 `spot_balance += proceeds` 与 `positions.status='Closed'` 是**两次写**（非事务）；**如实说明**——如果崩溃发生在 credit 之后、close 之前，重试会再次进入循环并第二次入账（step 0 的 SETTLING guard 不覆盖该窗口，`status='Open'` guard 也仅在 close 已成功时才幂等）；demo/testnet 可接受，生产必须迁至单事务 RPC

## 8. DESIGN.md 同步

- 新增「产品线徽标」小节：颜色 token + 场景清单 + /spot 终端豁免
- §7 追加「Settlements 三分口径」子节
- §15 命名修正：ResolvedEventCard → ResolvedMarketCard；追加 Settlements 移动卡收编
- §16 追加「全量视图开关规则」（search / Watchlist tab bypass）
- §16 页面对照表增 PortfolioSettlements 行

## 9. 明确不做

- 不改 Win Rate 统计逻辑
- 不动点击路由、券体系、双账户、4A settle 主实现（除本文点名的 TradeVerification 徽标颜色与 sim-settle 两条遗留）
- 无 schema 变更
- 无移动端 nav 改动
