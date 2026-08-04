# Calendar — as-built notes (addendum to `calendar-final.html`)

> `docs/design-contracts/calendar-final.html` stays frozen and is NOT edited. This file records the
> shipped behaviour after the CPO's live-edit rounds and is the authoritative baseline for the next
> design round. Where the two disagree, this file wins.
> Style-guide registration: `/style-guide` → **Lite · Calendar** (frozen clock `2026-08-03T15:20:00Z`).

## 1. Semantic rule — tradeable window, not settlement moment

The calendar answers "when can I trade this", not "when does it settle".

| Concept | Source | Behaviour |
|---|---|---|
| Window open | `start_date` (`row.opensAt`); missing = already open | Market appears from this day onward |
| 停盘 / window close | `end_date` (`row.expiry`) | The day the market stops trading — its "point" placement |
| Spanning market | open day < close day | Rendered as a continuous bar, present on every day in between |
| Point market | opens and closes on the same day | Rendered as a ticket in that day's column |

Consequences: a market opened in July closing in September is on every day of the week grid, not only
its last day. Rolling Intraday crypto rounds are excluded from the grid entirely and live in the
standing orange row above the timeline; they are also excluded from all footer counts.

## 2. "Open across days" module

- Desktop **Week**: lane-packed Gantt bars (`buildSpanLanes`, greedy packing, no overlap per lane),
  caption `Open across days` + `{N} markets tradeable now`. **Position: BELOW the week grid** (moved
  from above during live edits). Cap 5 lanes, then `+N more open markets` / `Show fewer`.
- Desktop **Day**: same bars under the caption `Open all day`, **below the clock spine**.
- Mobile: `Open all day` group at the **bottom** of the day list.
- Bars clip flat at the frame edge (`clippedLeft` / `clippedRight`) and carry a `Closes …` stamp
  (`Closes 21:00` same day, otherwise `Closes 30 Sep`).

## 3. Entry chips relocated

Watchlist and Calendar are no longer in the page header cluster. On desktop they sit **right-aligned
(`ml-auto`) at the end of the category filter row**. They are mutually exclusive:
activating Watchlist turns the calendar off; activating the calendar while Watchlist is active resets
the category to `all`. Calendar is a lens, not a category — its active fill is plain white `#FFFFFF`
with `#0A0B0D` ink, no category colour.

## 4. Date stepper (Day mode, desktop)

- Label `Today · Mon 3 Aug` on today, `Tue 4 Aug` on any other day.
- Forward arrow: unbounded.
- Backward arrow: **enabled**, but floored at today (`Math.max(k - DAY_MS, todayKey)`) — you can step
  back to today, never into the past, and the arrow renders disabled (opacity .4) while on today.
  (Earlier build had backward permanently disabled; that was the reported bug.)
- Week-grid column headers and week tickets both act as day pickers: they set the day and switch to
  Day mode. No trading from Week mode.
- Mobile has no stepper: the Day|Week pill plus the day strip do the job. In Day the strip chip
  cannot be toggled off — one day always stays focused (default today).

## 5. Intraday ticket label + count format

- Badge label is the flat word **`Intraday`** (was `X HK closes`).
- Title: `HK closing bell` / `US closing bell`.
- Market count moved to the **second line** of the ticket: `8 HK STOCKS`, `12 US STOCKS`
  (uppercase, 8px, `#6B7280`) — same slot the sports league short code uses.
- Session items are aggregated per market × close-minute; never one ticket per stock.

## 6. Near-deadline badge

Final copy: **`Closes soon`** (muted outlined text, `#C9CED6` on `1px #23262D`, never coloured),
shown when a market stops trading within 24h. Renamed away from "session close"-style wording because
readers parsed "close" as "about to finish / already over" instead of "the trading window ends".
For the same reason the session block copy reads `HK closing bell · 8 names settle when the market
closes` — the bell is a moment, not a countdown.

## 7. Other net deltas vs the frozen html

| Area | Frozen html | As built |
|---|---|---|
| Modes | Day / Week / Month | **Month removed** — Day \| Week only (mobile included) |
| Week grid | 7 columns + "Later" 8th bucket | 7 columns; the Later bucket is gone, long-dated markets are spans instead |
| Span lane position | top of the frame | below the grid (week) / below the spine (day) / bottom of list (mobile) |
| Column tickets | uncapped | cap 4, then `+N more` (10px `#6B7280`); header count still reports every market |
| Category legibility | plain neutral tickets | filled category badge + 3px `EdgeBar` (orange Intraday / chalk Sports / neutral) and sports league short codes (`UCL`, `EPL`, `UFC`, …) |
| Mobile Day mode | not built | built — locks the list to one day |
| Footer (week) | close count only | `{N} markets close in the next 7 days…` + `{M} more stay open across the week — the bars below the grid.` + `Rolling Intraday rounds are not counted.` |
| Footer (mobile) | close count only | adds `{M} more stay open past today.` |
| Horizon | 7 days | point items collected to 730 days so spans always resolve; only spans survive past the 7-day frame |
| Timezone | contract sample shows ET | viewer's own tz abbrev (`Times in {tz}`) |
| Empty state | single copy | two: `Nothing scheduled this day` (desktop day, with next-decision stamp) and `Nothing scheduled this week` (mobile) |
| Sub-type row | static | data-driven from the live league list: `All sports` + sport groups + divider + league leaves |

## 8. Style-guide injection contract

`LiteCalendarView` accepts presentation-only overrides used exclusively by the style guide:
`nowOverride`, `initialMode`, `initialDayOffset`, `initialSubType`, `initialLanesOpen`.
No preset reads the database.
