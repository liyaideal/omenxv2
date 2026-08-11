# Sports stage card — cap the height

## Problem
On the desktop All view, the right-hand Sports card renders **every** live match (currently 17) with no limit, so the card grows far taller than the Intraday card next to it and stretches the whole stage. Only the non-live "upcoming" rows are capped (1 or 3); live rows are not.

## Fix (stage variant only)
In `src/components/lite/sports/SportsStageCard.tsx`:

- Introduce a single row budget for `variant === "stage"`: **max 4 match rows total**.
- Fill the budget live-first: show up to 3 live blocks, then fill any remaining slots with upcoming rows from the selected day bucket. If there are no live matches, show 4 upcoming rows.
- The `LIVE NOW · N` counter keeps showing the true total (e.g. 17), so nothing is hidden from the user — the overflow is simply reachable via the footer.
- Footer stays as-is: `All {matches.length} matches →` routes to the Sports category page, which keeps rendering everything (`variant === "full"` is untouched).
- Day-strip counts stay full counts (unchanged).

Result: the sports card settles at a stable height comparable to the Intraday card instead of expanding with live-match volume.

## Not touched
- `variant="full"` (Sports category page) — still lists all matches.
- `MobileSportsModule` — mobile layout is a separate vertical feed and was not part of this report.
- Any styling, spacing, colours, or copy.

## Files
- `src/components/lite/sports/SportsStageCard.tsx`
