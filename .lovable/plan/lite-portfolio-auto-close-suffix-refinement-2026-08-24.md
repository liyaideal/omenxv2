# Lite Portfolio auto-close suffix refinement

## Current state

After the payout copy optimization, the live position payout sentence renders the auto-close suffix in two Boost cases:

- With a real price: `If it wins you get $X · auto-close ≈34¢`
- Without a price: `If it wins you get $X · auto-close —`

## Goal

Only show the auto-close suffix when an estimated price exists. When a Boost position has no `autoClosePrice`, fall back to the plain payout sentence with no suffix.

## Proposed changes

1. **`src/components/portfolio/lite/LiveCards.tsx`**
   - Mobile `autoCloseSuffix`: return `null` when `autoClosePrice == null` (remove the `missing`/`—` branch).
   - Desktop `autoCloseSecondLine`: return `null` when `autoClosePrice == null`.
   - Keep the `segment !== "boost" || leverageNum <= 1` guard and the `autoCloseState === "none"` guard.

2. **`docs/copy-dictionary.md`**
   - Remove or demote the `auto-close —` entry; keep only `auto-close ≈{c}¢`.

3. **`mem://features/portfolio-auto-close-column.md`**
   - Update canonical examples to show the suffix only with a real price.

4. **`src/pages/StyleGuide/sections/pages/litePages.tsx`**
   - Update descriptions if they mention the placeholder state.

5. **`src/pages/StyleGuide/preview/portfolioPreviews.tsx`**
   - Keep `safeBoostRow` (`autoCloseState: "none"`) and `missingBoostRow` fixtures; the latter will now visually show no suffix, which is the desired "missing price" state.

## Verification

- `bun run build` passes.
- `/style-guide` Portfolio live-card/row demos show:
  - Standard: `If it wins you get $X`
  - Boost with price: `If it wins you get $X · auto-close ≈34¢`
  - Boost without price: `If it wins you get $X` (no suffix)
