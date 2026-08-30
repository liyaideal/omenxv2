# Plan: Unify mobile Stocks Up/Down buttons with Crypto spec

## Goal
Make the mobile `HomeStocksCard` Up/Down buttons render with the same layout, sizing, and spacing as the mobile `HomeCryptoCard` buttons, so labels and prices no longer collapse together.

## Current state
- `HomeStocksCard.tsx` `MobileStockRow` renders the button pair in a flex span with `layout="centered"`, `minHeight={34}`, `gap={5}`, `padding="0 9px"`.
- The selected element text reads `Up49¢Down51¢`, showing the label and price are hugged and adjacent buttons lack clear separation.
- `HomeCryptoCard.tsx` `MobileRoundCard` uses the canonical spec: default `split` layout, `minHeight={44}`, `labelSize={14.5}`, `priceSize={14.5}`, `gap={8}`, inside a `grid` with `repeat(2, minmax(0,1fr))` and outer gap `10`.

## Change
1. In `src/components/lite/home/HomeStocksCard.tsx`, update `MobileStockRow`'s Up/Down pair:
   - Replace the `flex` wrapper with a `grid` using `gridTemplateColumns: "repeat(2, minmax(0,1fr))"` and `gap: 10`.
   - Remove `layout="centered"` (default to `split`).
   - Set `minHeight={44}`, `labelSize={14.5}`, `priceSize={14.5}`, `gap={8}`.
   - Remove custom `padding` so the default split padding applies.
2. Leave desktop `StockRow` and all other `HomeStocksCard` logic untouched.

## Verification
- Run `tsgo --noEmit -p tsconfig.app.json`.
- Capture a 375 px mobile screenshot of the homepage Stocks module and confirm the Up/Down buttons show label-left / price-right with visible internal and external gaps, and no clipped text.
- Confirm the Crypto module buttons still render identically.
