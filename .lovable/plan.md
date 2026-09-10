# SP-3-DT1 — Desktop Pro spot parity

## Goal
Make desktop Pro `/spot` visually match desktop `/trade`, removing only spot-inapplicable perp fields while preserving all mobile and Lite surfaces.

## Implementation
1. **Header and chart**
   - Remove the SPOT badge and Base stat from `ProSpotHeader`; retain lifecycle, countdown, volume, and underlying price.
   - Make the chart tab row tabs-only.
   - Rebuild the desktop spot price row with outcome price, session change, contract-style yellow mark tooltip, and one Base/date/flat subline.

2. **Desktop order book**
   - Move the quote-mode badge into the tick selector row and prevent tab wrapping.
   - For spot only, render exactly 10 ask and 10 bid slots, padding with inert blank rows in the specified directions.
   - Show the yellow mark in every mid-price row, including spot; leave contract depth at 12.

3. **Trade and account panels**
   - Remove the SPOT title badge and duplicate account hint.
   - Match contract neutral chip geometry and flat summary anatomy.
   - Keep the CTA enabled at zero; clicking focuses Amount and shows `Enter an amount` without opening preview.
   - Match compact account-card spacing and title treatment.

4. **Contract and bottom-tab wording**
   - Change only desktop contract leverage chip selection styling to the neutral shared control style.
   - Rename spot `Orders` to `Current Orders`; align desktop empty-state spacing and copy.

5. **State dictionary and documentation**
   - Add the production `pro-spot-book-thin` preview using a three-level spot book.
   - Update Pro Spot section specifications, `DESIGN.md`, spot delivery notes, and STATUS SP-J.
   - Confirm existing production-component previews inherit the panel changes without copied chrome.

## Validation
- Run TypeScript checks and `npm run sg:audit`.
- Inspect the desktop `/spot` production page and the new thin-book preview for fixed slots, non-wrapping tabs, mark row, and panel fit.
- Report A–H file/line references, requested final class strings and gating expression, and audit total.

## Scope constraints
No mobile page/component edits, no Lite changes, no fee/settlement changes, no `ProTerminalLayout` changes, and no contract changes beyond leverage-chip classes.
