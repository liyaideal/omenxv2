# R3b-2 round 14b — Lite settled corrections

Three approved product corrections on top of round 14. Pro surface untouched.

## 1 · Public vs personal separation (doctrine)
`src/pages/lite/LiteSettledEventDetail.tsx` — the "Your activity" fills ledger and payout
row are DELETED. The page is now a public event page: outcome hero (LiteOutcomeCard
summary), evidence, and one quiet "See this in your Portfolio →" link (only when the
viewer held the market). Owner-scoped fills are still read, but only to derive the
compact result summary. Deep personal accounting lives in the Portfolio settlement pages.

## 2 · Daily stock events are SERIES
- New `src/components/lite/LiteSettledSeriesCard.tsx` — series card (ticker mono chip,
  "{Company} ({TICKER}) — daily close", latest settled day line in MARKET-axis colour,
  "N settled days", chevron, optional MONEY-axis result chip) plus
  `LiteSettledSeriesDayRow` for the series view, and the shared helpers
  `isDailyStockEvent` / `tickerOf` / `companyOf` / `dayLabel`.
  `tickerOf` reads the `us-{ticker}-updown-YYYYMMDD` slug first, because the shared
  `deriveTickerFromEvent` fallback would read "US" and merge every stock into one series.
- `src/pages/lite/LiteSettledPage.tsx` — daily stock events are partitioned out of the
  card grid and collapse into a `DAILY STOCKS` section above the time groups. Tapping a
  series sets `?series={TICKER}` on the same route and swaps to SERIES VIEW: "← All
  settled" back link, series title, day rows newest-first, 20 per page. `My results`
  hides zero-participation series in list view and filters to traded days in series view.

## 3 · The day's chart is back on daily stock details
`LiteSettledEventDetail` renders a "How the day went" card between the outcome hero and
"How it settled" — **daily stock events only**; contract events still have no chart.
It mounts `LiteStockChart` in a static read-only state: price line + price-to-beat dashed
baseline (`events.base_price`), odds toggle locked to the WINNING side's MARKET colour,
`price_history` rows when present, else the existing deterministic synth (DEMO-STATE).
`useResolvedEventDetail` gained additive `base_price` / `productLines` fields.

## Style guide
`LiteSection` — new "Daily-stock series" subsection (series card with/without result chip
+ a three-row series-view day-row demo) and updated "Where things live" rows.

## Copy audit
Zero occurrences on the two Lite settled pages of: "Resolved", "Not Up", "PnL", "Position".