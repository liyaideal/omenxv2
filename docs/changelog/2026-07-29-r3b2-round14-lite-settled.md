# R3b-2 round 14 — Lite settled experience

Two new Lite-only pages behind the existing `/resolved` URLs. Pro surface untouched.

## Routing
`src/App.tsx` — new `ResolvedRoute` / `ResolvedDetailRoute` surface forks:
- `/resolved` → lite ? `LiteSettledPage` : `ResolvedPage`
- `/resolved/:eventId` → lite ? `LiteSettledEventDetail` : `ResolvedEventDetail`

## New files
- `src/components/lite/LiteSettledCard.tsx` — LiteEventCard variant: result/neutral tag pill,
  single winner row (market axis, 14/86 tint), past-tense "Settled …" footer.
  Negative-alias winners render "No — didn't go up"; "Not Up" never reaches the DOM.
- `src/pages/lite/LiteSettledPage.tsx` — LiteEventsPage scaffold, `value="settled"` switch,
  sector rail, `All | My results` scope pills (`?view=mine`, AuthDialog when signed out),
  time-grouped grid (Today / Yesterday / This week / Earlier, participated first),
  20-per-page Load more, three empty states, no search box.
- `src/pages/lite/LiteSettledEventDetail.tsx` — single centred `max-w-2xl` reading column:
  header + meta, LiteOutcomeCard hero (See how it settled → smooth-scroll, no navigation),
  "How it settled" card with source line and a collapsed "The fine print",
  owner-scoped "Your activity" ledger + payout row, neutral full-width CTA.
  Not-yet-settled ids get a live-market link; unknown ids get ExpiredEventFallback.

## Additive edits (no forks)
- `useResolvedEvents` — maps `image_url` to `imageUrl` (optional; Pro pages ignore it).
- `LiteOutcomeCard` — optional `resultLine` prop rendered under "Your result".
- `LiteSection` (style guide) — four LiteSettledCard states + three "Where things live" rows.

## Copy audit
Zero occurrences on the two new pages of: "Resolved", "Not Up", "PnL", "Position",
"Margin", "Leverage", "Long", "Short", "Order book".
