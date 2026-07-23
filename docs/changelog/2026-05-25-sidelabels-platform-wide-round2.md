# sideLabels 平台级贯穿（第二轮）

接续第一轮，把别名渗透到 Resolved 详情/列表、Insights、Share 海报、HomeDiscover。

## 数据层

- `src/hooks/useResolvedEvents.ts` — `ResolvedEvent` 增 `sideLabels?: {yes,no}`，
  通过 `parseSideLabels(event.side_labels)` 填充。
- `src/hooks/useResolvedEventDetail.ts` —
  - 顶层增 `sideLabels?`
  - `options[i]` 增 `displayLabel: string`（hook 内统一用 `getDisplayOptionLabel` 预算）
  - `RelatedEvent.winning_option_label` 改为已套别名的展示文案（拉取 related events 时
    多 select 一个 `side_labels` 字段供 helper 使用）
- `src/hooks/useSettlementDetail.ts` —
  `SettlementData` 增 `sideLabels?`；查询 event 时多 select `side_labels`。

## UI

- `src/components/resolved/ResolvedMarketCard.tsx` — winner.label → `getDisplayOptionLabel(...)`
- `src/pages/ResolvedEventDetail.tsx` —
  - mobile + desktop 的 Final Results 渲染 `option.displayLabel`
  - `SettlementEvidenceCard.winningOptionLabel` 改为 `winningOption.displayLabel`
- `src/components/resolved/PriceHistoryChart.tsx` —
  `options[]` 类型增可选 `displayLabel?`；图例和 tooltip 优先使用 displayLabel。
- `src/components/home/HomeDiscover.tsx` —
  `CompactMarketCard` 内每个 option 走 `getDisplayOptionLabel`。
- `src/components/insights/InsightsFeed.tsx`、`BiggestMovers.tsx`、`TrendingMarkets.tsx` —
  生成 insight 标题/正文与 movers 行 / trending 行的 option 名称统一走 helper。
- `src/components/share/SettlementPoster.tsx` 与
  `src/components/settlement/SettlementShareCard.tsx` —
  新增可选 `sideLabels?` prop；side badge 文案由 `isLong ? sideLabels.yes : sideLabels.no` 派生，
  其它事件 fallback "Yes"/"No"。
- `src/pages/SettlementDetail.tsx` —
  `<SettlementPoster sideLabels={settlement.sideLabels} />`。

## 不动 / 保留语义

- DB schema、`option.label` 原值、`positions.option_id`、`side: long|short`、PnL 公式。
- 多 outcome 事件展示完全不变。
- Transparency 审计模块（SettlementAudit / TradeVerification）保留链上原 Yes/No 真值，
  这是 by design，仍按上一轮决定不改。
- `EventShareCard` 当前无调用方，暂不动；后续如接入再补 `sideLabels` 入参。

## 待跟进

- Style Guide / Playground 中相关 Demo（per `playground-state-coverage`）补 sideLabels 状态。
