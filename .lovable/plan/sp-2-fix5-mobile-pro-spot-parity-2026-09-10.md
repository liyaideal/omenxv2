# SP-2-FIX5 — Mobile Pro spot parity

## Goal
Make mobile `/spot/order` use the same unboxed page-grown form language as mobile `/trade/order`, while leaving desktop `/spot`, contract Pro pages, Lite, and trading logic unchanged.

## Implementation
1. **Bare mobile spot panel**
   - Add `chrome="card" | "bare"` to `ProSpotPanel`, defaulting to `card` so desktop remains unchanged.
   - In `bare`, remove the bordered/background shell and `Trade SPOT` heading; retain the form with the same `px-3 pb-2 space-y-2` rhythm as `TradeForm`.
   - Pass `chrome="bare"` only from mobile `/spot/order` and its production-component Style Guide fixtures.

2. **Form parity**
   - Match `TradeForm` label/value sizes, control spacing, slider rail, and active-dot outcome tiles.
   - Keep Buy/Sell intent and Market/Limit controls, but render mobile max slippage as one key/value row with a compact dropdown containing 0.10%, 0.25%, 0.50%, and 1.00%; desktop retains four chips.
   - Render mobile summaries as unboxed key/value rows:
     - Buy: Cost, Fee (0.15%), bold Total, To win ⓘ.
     - Sell: Proceeds, Est. commission, bold You receive.
   - Keep the winning-commission helper below the rows; move the settlement note directly above the CTA; remove the duplicate Standard Account balance hint only from bare mode.

3. **CTA fit and order-book parity**
   - Use the contract CTA size and row layout by default.
   - Add container-width measurement inside the spot panel so only an actual overflow switches the mobile CTA to stacked; verify both long Buy and Sell labels at 360/375/390.
   - Restore the inline book to the contract width (`w-[120px]`), show ten levels per side plus the midpoint, and add the `Depth 0.1` selector.
   - Ensure the spot mock book always supplies at least ten display levels without changing execution/fee behavior.

4. **Tabs and Charts parity**
   - Match the contract Orders/Positions tab classes, count badges, active underline, spacing, and compact sign-in gate exactly. Because `TradeOrder.tsx` is explicitly frozen, the spot page will mirror its existing tab contract without editing the reference page.
   - Compare `/spot` and `/trade` Charts at 375px. Align shared price/mark, tabs, and dock classes where spot has drifted; retain the 32px spot stats strip as the sole intentional spot-specific block.

5. **State dictionary and documentation**
   - Update `pro-spot-mobile-order-buy` and `pro-spot-mobile-order-sell-held` to mount the bare production panel and full 120px book; add the optional side-by-side case only if it can mount production views without copied visual chrome.
   - Update Pro Spot section notes, DESIGN §14, and the SP-2 delivery notes with the locked mobile parity rule.
   - Run the Style Guide audit after all preview changes.

## Validation
- Type-check the project and run `npm run sg:audit`.
- Capture 375px `/trade/order` and `/spot/order` Buy/Sell-held screenshots side by side.
- Measure CTA content/layout at 360, 375, and 390px for:
  - `Buy Down · To win $1,073.14`
  - `Sell Down · You receive $1,073.14`
- Verify `/spot` and `/trade` Charts at 375px, no horizontal overflow, and no contract-page visual changes.
- Report the current commit SHA, screenshot paths, measurements, audit total, Charts drift found/fixed, and Style Guide synchronization.

## Technical scope
Expected edits are limited to the spot panel/shared mobile spot components, `/spot/order` and `/spot` mobile pages, their Style Guide production previews/section notes, `DESIGN.md`, and `docs/delivery/spot-pro-v1.md`. No engine, SQL, Lite, desktop spot terminal, or contract Pro page changes.
