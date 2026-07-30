# R3b-2 round 15 — M1 (Lite events list) closure

Scope: Lite live markets list + style guide + memory. No Pro pages, no tradingService, no data-layer change.

## 1. Mobile header → preset A
`LiteEventsPage` mobile rendered the non-canonical `<MobileHeader title="Markets" />` (logo + title). Now `<MobileHeader showLogo showBack={false} />`, identical to Pro `EventsPage` mobile.

## 2. Missing sector pills
`SECTOR_ORDER` gains `politics` / `finance` / `social` (labels Politics / Finance / Social) after the existing sectors. The rail was already data-aware (`availableSectors` counts live events per raw category) — a pill only renders with ≥1 live event.

## 3. ★ Watchlist pill
New pill at the end of the rail, immediately before the external "Sports ↗" pill. Renders for everyone (teaching moment).
- Signed-in: filters the grid to `useWatchlist().watchlist` (matched on `eventId`).
- Signed-out: opens `AuthDialog`.
- Empty (signed-in, nothing starred): dashed card "Nothing starred yet. Tap the ★ on any market and it'll show up here." + "See all markets" → resets to All.

## 4. Spacing system
Ad-hoc `mb-6` / `mt-8` replaced with a `space-y-6` stack on the page container; the Pro escape line keeps its 32px gap via `pt-2`. Pill classes consolidated into `PILL_BASE` / `PILL_ACTIVE` / `PILL_IDLE` constants (no dynamic class concat). Visual output unchanged.

## 5. Approved exception (recorded, not changed)
The footer line "Want charts, leverage and the order book? Switch to Pro mode" stays byte-identical. Recorded in `.lovable/memory/design/lite-forbidden-words-exceptions.md`.

## 6. Style guide (CHK-5)
`LiteSection` gains a "Markets list" subsection: `LiteEventCard` (default + closing-soon footer) and the sector rail with the new pills incl. ★ Watchlist active/idle. The Live | Settled switch is linked, not duplicated. "Where things live" gains `LiteEventCard`, sector rail and `LiteEventsPage` rows.

## Decisions recorded, no action
- No search box on the Lite list (approved).
- No campaign banner on the Lite list (approved).

## Files touched
- `src/pages/lite/LiteEventsPage.tsx`
- `src/pages/StyleGuide/sections/LiteSection.tsx`
- `.lovable/memory/design/lite-forbidden-words-exceptions.md` (new)
- `docs/changelog/2026-07-29-r3b2-round15-m1-closure.md` (new), `docs/changelog/STATUS.md`

`LiteEventCard.tsx` needed no change — its category microlabel/image maps already cover politics / finance / social.
