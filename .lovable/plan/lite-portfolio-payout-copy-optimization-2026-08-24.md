# Lite Portfolio payout copy optimization

## Current state

In `src/components/portfolio/lite/LiveCards.tsx`, the live position payout sentence repeats the outcome/side that is already shown in the dedicated **SIDE** column (desktop) or outcome chip (mobile):

- Mobile card: `If {side} wins you get {money}`
- Desktop row: `If {side} wins → {money}`
- Auto-close suffixes still append after the sentence.

The selected element shows: `If $55K–$65K wins → $8.39 · auto-close —`.

## Goal

Remove the redundant side/outcome from the payout sentence while preserving clarity, the auto-close suffix behavior, and the hot-state red styling.

## Proposed copy changes

1. **Mobile card sentence**
   - Without auto-close: `If it wins you get {money}`
   - With auto-close: `If it wins you get {money} · auto-close` (render `≈{cents}` when price is available, otherwise `—`)

2. **Desktop row merged column**
   - `If it wins → {money}`
   - With auto-close: append `· auto-close` (render `≈{cents}` when price is available, otherwise `—`)

3. **Hot state stays unchanged**: the whole sentence turns red when the price is within 10% of auto-close.

## Files to update

- `src/components/portfolio/lite/LiveCards.tsx` — update `winSentence` (mobile) and the `mergedCol` inline template (desktop).
- `docs/copy-dictionary.md` — update the **Portfolio (Lite)** canonical strings.
- `mem://features/portfolio-auto-close-column.md` — update the canonical sentence examples.
- `src/pages/StyleGuide/preview/portfolioPreviews.tsx` — update `safeBoostRow` / `missingBoostRow` fixtures if they contain the old sentence.
- `src/pages/StyleGuide/sections/pages/litePages.tsx` — update any hard-coded demo strings that mirror the old copy.

## Verification

- Build passes (`bun run build`).
- `/style-guide` Portfolio live-card/row demos render the new copy.
- The selected element in `/portfolio` no longer repeats the side in the payout sentence.
