# R3a — Market-axis tokens + Lite/Pro Events fork

## Tokens
- Added `--yes` (Pulse Blue) and `--no` (Volt) HSL vars to `src/index.css`.
- Extended `tailwind.config.ts` with `yes` / `no` color objects
  (`DEFAULT` / `foreground` / `muted` / `bg`).

## Yes/No recolor (display-only, no schema change)
Repointed Yes/No **side-selection controls** from `bg-trading-green` /
`bg-trading-red` to `bg-yes` / `bg-no` in:

- `src/components/TradeForm.tsx` — binary toggle (Yes/No halves).
- `src/pages/DesktopTrading.tsx` — Trade panel Yes/No toggle.
- `src/pages/SpotTrading.tsx` — `YesNoToggle` and the submit CTA.
- `src/pages/TradingCharts.tsx` — mobile bottom action bar (Yes/No).

PnL, gain/loss, and success/failure semantics stay on
`--trading-green` / `--trading-red` (money-axis, unchanged).

## TradeSubmitButton (`src/components/trading/TradeSubmitButton.tsx`)
New `positionSide?: 'yes' | 'no'` prop. For BUY intents with `positionSide`
set, the CTA follows the market axis (Yes → blue, No → volt). Wired from
`TradeForm` (via `binaryMode.isYesSelected`) and `DesktopTrading` (via
`isBinarySingleMarket && isYesSelected`).

## Surface (Lite / Pro) infrastructure
- New `src/contexts/SurfaceContext.tsx` — `surface: 'lite' | 'pro'`, with
  `localStorage` persistence and best-effort sync to
  `profiles.preferred_surface`.
- `src/App.tsx` — wraps the tree in `<SurfaceProvider>`; `/` and `/events`
  render `LiteEventsPage` when `surface === 'lite'`.
- `src/components/EventsDesktopHeader.tsx` — new `SurfaceToggleMenuItem`
  in the user dropdown ("Switch to Simple / Pro mode").

## Lite Events page
- `src/pages/lite/LiteEventsPage.tsx` — plain-language intro, four sector
  pills (Stocks / Crypto / Macro / Entertainment) plus an external Sports
  link (`SPORTS_LINK`), grid of `LiteEventCard`.
- `src/components/lite/LiteEventCard.tsx` — category microlabel, display
  title, dual Yes/No price chips (`bg-yes/15` / `bg-no/15`), settlement
  footer derived from `market.expiry` (no hardcoded times). No trading
  jargon (margin, leverage, funding, chg%).

## Docs
- `DESIGN.md` §2 — added **Market Axis (Yes / No side semantics)** table
  and the `TradeSubmitButton.positionSide` contract.

## Guardrails observed
- No string-concatenated Tailwind classes; all conditional colors use full
  static class strings.
- No schema changes; `preferred_surface` column already existed.
- Settlement/expiry copy derives from `EventRow.expiry`.