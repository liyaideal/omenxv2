# Fix: Watchlist button in Calendar view

## Problem
Watchlist and Calendar are two separate views of the events page, but they are tracked by two independent pieces of state (`sector === "watchlist"` and `calendarOn`). Clicking Watchlist while the calendar is open only changes `sector`; `calendarOn` stays true, so the calendar keeps rendering. The Watchlist chip lights up as active but the watchlist list never appears — the click looks broken.

## Fix (single file: `src/pages/lite/LiteEventsPage.tsx`)
Make the two views mutually exclusive:

- In `handleWatchlistClick`: if the calendar is open, close it (`setCalendarOn(false)`) and switch to the watchlist view in the same click.
- If the calendar is closed and watchlist is already active, keep the existing behaviour (toggle back to "All").
- When the Calendar chip is activated while watchlist view is on, drop the watchlist view back to "All" so the calendar shows the full set (and the Watchlist chip doesn't stay lit while the calendar renders).

No layout, copy, or styling changes; no other files touched.
