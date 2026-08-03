---
name: CHK-8 single trade-page discipline
description: Only two trade pages exist (/trade contract, /spot spot incl. quick-rounds variant); all categories are module additions inside those skeletons, no new pages or chart styles
type: constraint
---

# CHK-8 · Single trade-page discipline (LOCKED 2026-08-03, user-mandated)

Exactly two trade pages:
- **Contract** `/trade` — `LiteContractTrade` (Lite) + `DesktopTrading` (Pro)
- **Spot** `/spot` — `LiteSpotTrade` and same-skeleton variant branches (quick rounds = `LiteQuickTrade`) + `SpotTrading` (Pro)

Rules:
- Feature additions/removals and new market categories are **module add/remove inside these skeletons**, reusing `src/components/lite/trade/SpotBlocks.tsx` and `LiteStockChart` / `LiteContractChart`.
- **Forbidden:** a separate trade page, a new chart visual style, or a parallel visual system for any category.
- Any spec adding a category to the trade flow must first declare: contract or spot page, modules inherited, modules added/removed.
- Shared-block edits must keep every consumer (stock spot, quick rounds, contract) rendering correctly.

**2026-08-03:** quick-rounds trade view rebased onto the spot-page skeleton (LiteStockChart + shared sentiment bar / settlement rail / position card). `RoundPlot` remains only in the Intraday band tiles.
