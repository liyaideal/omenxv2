---
name: Win/lose 一律看净额符号
description: 全站输赢文案、配色与行内图标由净额 P&L 符号推导，不看交易类型；含 fiat_buy 进流水与 sports 命名 vs
type: feature
---

# 全站铁律

1. **Win / Lose 判定**：Wallet 流水、Portfolio、Settlement 详情的输赢文案（Won / Lost）与配色**一律由净额 P&L 符号推导**，不再看 `type`（`trade_profit` / `trade_loss`）。
2. **行内图标同源（E1b）**：`trade_profit` / `trade_loss` 两类型的小图标与圈底也跟净额符号——`amount >= 0` → TrendingUp · `text-trading-green` · `bg-trading-green/20`；`amount < 0` → TrendingDown · `text-trading-red` · `bg-trading-red/20`。其余类型图标由 type 决定，零变化。
3. **`fiat_buy` 进 Lite 流水**：不再被过滤，按 deposit 同款样式渲染（style-guide W-17）。
4. **Sports 事件命名**：一律 `A vs B`。DB 名与所有组件拼接（`SportsStageCard` / `LiteSportsView` / style-guide fixture）均用 `" vs "`，禁止 `" v "`。
5. **settled 空账本**：已结算且无成交记录的市场，交易页不渲染 `MarketActivity` 模块。
6. **实时 PnL 单一真相源**：所有未结算仓位展示统一走 `useRealtimePositionsPnL`。
