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

## Style Guide sync
3. In `src/pages/StyleGuide/sections/EventsStatesSection.tsx`:
   - Update `EV-29` expanded-state visual to describe the new mobile Up/Down button shape: label-left / price-right, 44px height, 8px internal gap, grid gap 10, matching `HomeCryptoCard` mobile round cards.
   - Update `StocksGeometry` table: add a dedicated row for "移动行 · Up/Down 钮" with the same spec as Crypto mobile (`flex 均分（gap 10）`, `minHeight 44`, `label 左 / 价右两端对齐，gap ≥ 8，窄宽不粘连`), and remove or correct the outdated "Up/Down 钮 · 禁用钮" row that conflates desktop/mobile.

## Verification
- Run `tsgo --noEmit -p tsconfig.app.json`.
- Capture a 375 px mobile screenshot of the homepage Stocks module and confirm the Up/Down buttons show label-left / price-right with visible internal and external gaps, and no clipped text.
- Re-capture affected Style Guide frames (`EV-29-mobile`, `EV-7-mobile`) into `public/qa-sg-home-0830/` and confirm 5-refresh DOM fingerprint stability.
- Confirm the Crypto module buttons still render identically.
