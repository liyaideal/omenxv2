# sideLabels 平台级贯穿（第一轮）

把 single-market binary 事件的 sideLabels 别名（如 "Carlos Alcaraz" / "Jannik Sinner"）
从只在 /trade 顶部和 Trade 面板生效，扩展到列表卡片、Portfolio 持仓/订单/已结算等高频可见页面。

## 新增

- `src/lib/eventUtils.ts`
  - `parseSideLabels(raw)` — 把 DB JSON 形状解析为 `{yes,no} | undefined`
  - `getDisplayOptionLabel(label, options, sideLabels)` — 统一入口，多 outcome 或无 sideLabels 时安全回退
- `src/hooks/useEventDisplayLookup.ts` — 提供 `(eventName, optionLabel) => displayLabel`，
  供 usePositions / useOrders / settlements / airdrops 之类的数据层共用。

## 数据层

- `src/hooks/useMarketListData.ts` — `MarketChildRow` 增 `displayLabel`，构造时套用 helper；
  `EventRow.topMarket.label` 同步替换。
- `src/hooks/usePositions.ts` / `src/hooks/useOrders.ts` —
  `UnifiedPosition` / `UnifiedOrder` 增 `displayOption?`，hook 内部统一填充。

## UI

- `src/components/events/MarketCardB.tsx`、`src/components/events/MarketListView.tsx` —
  渲染 `displayLabel`（截图 2 的 NBA / UFC / Wimbledon 卡片直接受影响）。
- `src/components/PositionCard.tsx` —
  渲染 `displayOption`；同步移除已过时的"binary 持仓归到 Yes 轴"提示气泡
  （per memory `binary-event-no-as-native-position`，Yes/No 已是独立持仓）。
- `src/components/OrderCard.tsx` — 所有 `{option}` / toast 描述改为 `optionDisplay`。
- `src/components/DesktopPositionsPanel.tsx` — 持仓 + 订单 + Close/Edit 弹窗全部走 displayOption；
  同步移除"All positions unified under Yes"的 stale tooltip。
- `src/pages/Portfolio.tsx`、`src/pages/PortfolioSettlements.tsx` —
  positions/settlements 列表全部走 `displayOption` / `resolveDisplayOption`。

## 不动 / 保留语义

- DB schema、`option.label` 原值、`positions.option_id`、`side: long|short`、PnL 公式。
- 多 outcome 事件（>2 markets 或非 Yes/No）展示完全不变。
- Transparency 审计模块（SettlementAudit / TradeVerification）保留链上原 Yes/No 真值；
  待下一轮加例外注释。

## 待跟进（下一轮）

- Resolved 系列：`ResolvedEventDetail`、`RelatedEventCard`、`EventShareCard`、
  `PriceHistoryChart`、`ResolvedMarketCard`、`ResolvedFilters`
- Insights：`InsightsFeed`、`BiggestMovers`、`TrendingMarkets`
- Share/海报：`ShareModal`、`SettlementPoster`、`SettlementShareCard`
- HomeDiscover 个人持仓卡片中的 Yes/No 指示
- HomeTournamentsRail
- Style Guide / Playground 演示（per playground-state-coverage）
