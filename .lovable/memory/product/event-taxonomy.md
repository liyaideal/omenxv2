---
name: Event taxonomy
description: Canonical category tree (top level, Sports leagues, Crypto/Finance dimensions, props buckets) — src/lib/taxonomy.ts is the single source of truth
type: feature
---

# Event taxonomy

`src/lib/taxonomy.ts` is the SINGLE SOURCE OF TRUTH; `docs/taxonomy.md` is its
human-readable mirror (keep in lockstep). Every category chip, sub-type row and
group header reads ORDER + GROUPING from it. **Visibility stays data-driven** —
a node renders only when it has live markets.

- Top level, in order: All · Intraday · Sports · Crypto · **Finance** ·
  Politics · Economy · other generic categories (Tech / Entertainment / Social)
  · divider · **Boost** (filter, not a category).
- Finance replaces the old top-level "Stocks" chip. DB keys unchanged
  (`stocks` + `finance` both fold into Finance); "Stocks" survives as an
  asset-class leaf.
- Sports = two levels only. Esports is flattened: LPL/LCK carry a data-model
  `parent: "LOL"` that never renders.
- Crypto: timeframes [5m, 15m, 1h, 4h, Daily] × coins [BTC, ETH, SOL].
- Finance: asset classes [Indices, Stocks, Commodities, FX] × regions
  [US, Hong Kong / China, Korea].
- League → timezone mapping lives in `sportsData.ts` but is keyed by taxonomy
  league codes, never free text.
- Props buckets are internal names — never render "Props" (see
  `mem://design/lite-banned-words`).

**Boost = in-place filter.** Tapping the Boost chip filters the current list to
boost-capable contract events, grouped by category with small headers in
taxonomy order; tapping again exits. Composes with a selected category (then
flat, no headers). No new page, no route. Hidden inside module/channel views.
