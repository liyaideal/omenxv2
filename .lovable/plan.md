# SP-2-FIX6 — Mobile Pro spot Charts parity

## Goal
Align mobile Pro `/spot` Charts block-for-block with the frozen contract `/trade` Charts reference, preserving only the 32px spot stats strip, SPOT badge, and spot dock safe-area padding as intentional differences.

## Implementation
1. **Shared mobile shell and outcome state**
   - Add an optional `optionChips` slot to `MobileTradingLayout` and pass it through the spot shell without changing the perp branch.
   - Mount the production `OptionChips` in `SpotTradingCharts`, backed by the live Up/Down options; selecting a chip updates both the selected option and dock side.
   - Initialize the dock from the current selected spot outcome so one side is always active.

2. **Price, chart, trades, and book parity**
   - Rebuild `SpotMobileMarkLine` with the contract price/change/Mark Price/volume structure and classes, while keeping direction chips on the yes/no color axis.
   - Remove the spot-only chart timeframe override.
   - Match contract trade-history row states and labels exactly.
   - Normalize displayed order-book prices to four decimals while preserving the 0.01 tick.

3. **Orders, positions, and dock parity**
   - Replace mobile spot list rows with card markup matching `OrderCard` and `PositionCard` hierarchy, spacing, labels, footer, and actions, omitting perp-only metrics.
   - Match contract wrappers and empty-state copy.
   - Change dock guidance and outcome-only labels to the contract wording while retaining the safe-area inset.

4. **State dictionary and documentation**
   - Refresh the three Pro spot mobile Charts fixtures with chips, price/change/volume, representative order and position cards, and an always-selected dock side.
   - Record the parity rule and intentional exceptions in `DESIGN.md` §14 and the spot delivery note, including deferred contract color-axis and safe-area corrections.

## Validation
- Run TypeScript checks and `npm run sg:audit`.
- Capture a two-column 375px `/trade` versus `/spot` Charts comparison.
- Produce a block-level class comparison and report every remaining difference; expected differences are the stats strip, SPOT badge, and spot safe-area padding.
- Report the resulting commit SHA and audit total.

## Scope
Do not edit `TradingCharts.tsx`, the perp branch behavior in `MobileTradingLayout`, `OrderCard`, `PositionCard`, contract Pro pages, desktop spot, Lite, engine, or database code.
