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
## R3a-refine — LiteEventCard visual rebuild + sector filter fix

### LiteEventCard (`src/components/lite/LiteEventCard.tsx`)
Rebuilt to match the design-system "Markets" mock:

- 130px image tile at the top, using literal-mapped category → `/card-bg/*.jpg`
  (stocks/macro→finance, tech→tech, crypto→crypto, entertainment→entertainment,
  politics→politics, sports→sports, social→social). Missing categories fall back
  to the mock's diagonal stripe. Bottom-to-top scrim
  `linear-gradient(to top, rgba(10,11,13,0.85), transparent 60%)` layered over
  the image for legibility.
- Tag pill (top-left): `New` on Volt `#CFFF4A` when `market.isNew`, otherwise
  `Live` on Pulse `#33D6FF`. Text `#0A0B0D`.
- Category microlabel (10px, tracked, uppercase) derived from raw DB category.
- Title: `font-display` 17px/1.2 bold with `min-h-[42px]` so 1- and 2-line
  titles align across the grid.
- Yes/No chips: kept our tokens (`bg-yes/15 text-yes`, `bg-no/15 text-no`)
  which visually match the mock's blue/volt tints; format unchanged
  (`{price}¢`, No = 1 − Yes).
- Footer: `Vol ${compactUSD(totalVolume||volume24h)}` + data-derived
  settlement text (`Settles today HH:MM` for stocks/tech settling today).
- Card shell: `#131519` bg, `#1D2026` border, 16px radius, `.mkt-card` hover
  lift (translateY(-4px) + soft shadow) added to `src/index.css`. Reduced-motion
  users skip the transform.
- Whole card is a single button routing to `/spot?event=…` or `/trade?event=…`.

### LiteEventsPage (`src/pages/lite/LiteEventsPage.tsx`)
- Sector-filter bug fixed. Old code filtered on `categoryLabel` (Finance/Tech
  after `getCategoryInfo` normalization), which never matched DB categories
  `stocks`/`macro`/`tech`/`crypto` and caused "Stocks" to surface Tech events.
  New rail filters on the raw lowercase DB category directly.
- Rail is now data-driven: renders `All` + one pill per non-sports category
  that actually has events + external `Sports ↗`. Empty sectors are dropped
  automatically.
- Pill styling matches the mock: active = white solid (`bg-white
  text-[#0A0B0D]`), inactive = ghost border (`border-[1.5px]
  border-[#2B2F38] text-[#C9CED6]`).
- Headline promoted to `font-display` at `clamp(28px, 4vw, 40px)`, tight
  tracking. No marketing hero, no fabricated volume/CTAs.
- Grid gap tightened to 18px to match the mock spec.

### Guardrails preserved
- No string-concatenated Tailwind class names; category→image and tag→color
  are literal `Record` lookups.
- No schema/service changes; still pure display layer.
- Pro `EventsPage` / `MarketCardB` untouched.

## R3a-refine-2 — LiteEventCard Yes/No + settlement fixes
- Yes/No inversion fixed: resolve the affirmative child via `sideLabels.yes` (new field on `EventRow`) with fallback to literal "yes"/"up" labels, replacing the `children[0]` assumption that flipped us-*-updown cards.
- `settlementFooter` now uses calendar-day diff with buckets: today HH:MM / tomorrow / weekday / Mon D / Mon YYYY. Daily updown events now read "Settles tomorrow" instead of "Settles in 2d".
