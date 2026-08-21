Update In review badge copy

Change the In review badge text from "In review · result pending" to just "In review" everywhere it appears, so the component, blocked-reason labels, and Style Guide demos stay consistent.

Files to edit:
1. `src/components/lite/trade/InReviewCard.tsx`
   - Change `export const IN_REVIEW_BADGE = "In review · result pending";` to `export const IN_REVIEW_BADGE = "In review";`.
2. `src/lib/usStockSessions.ts`
   - Update the hardcoded return string `"In review · result pending"` to `"In review"`.
3. `src/pages/lite/LiteContractTrade.tsx`
   - No change needed if it imports `IN_REVIEW_BADGE`; confirm it still uses the constant.
4. `src/pages/StyleGuide/sections/LiteSection.tsx`
   - Replace hardcoded `"In review · result pending"` strings with the `IN_REVIEW_BADGE` constant (or `"In review"` inline) so demos match production.
5. `src/pages/StyleGuide/sections/LiteSpotSection.tsx`
   - Replace hardcoded `"In review · result pending"` with `"In review"`.

Verification: open `/style-guide#lite-trade` and check the In review badge reads only "In review".