# List final touches (11) — as-built notes

Addendum to `docs/design-contracts/list-final-touches-11.html`. The frozen HTML stays
untouched; **where the two disagree, this file wins**.

## a) CPO post-build spacing edits

| Item | Final value (in code) |
| --- | --- |
| Divider above "What's worth watching?" | **Removed** — `EditorPicksModule` section no longer sets `borderTop: 1px solid #1D2026` |
| Picks section box | `display:flex; flex-direction:column; gap:16` — no `marginTop` / `paddingTop` of its own |
| Gap above the picks module | `24px` (`<div style={{ marginTop: 24 }}>` wrapper in `LiteEventsPage`), equal to the `mt-6` (24px) above the "Will it happen?" grid area |
| Picks H1 | `font-display`, `fontWeight 700`, `fontSize 26`, `letterSpacing -0.02em`, `#fff` — matches the other module titles |
| "Will it happen?" title | Raised to the same spec: `fontSize 26`, `letterSpacing -0.02em`, teach line `fontSize 13 / #9AA1AC`, header column `gap 7px` |

## b) Declared build deviations from the contract

1. **TopicSheet retired on mobile.** The mobile category row (`MobileCategoryRow`) carries
   the sector pills inline, so the old bottom-sheet topic selector is no longer reachable.
   The mount was removed from `src/pages/lite/LiteEventsPage.tsx`; the component file
   `src/components/lite/LiteListControls.tsx#TopicSheet` is kept (still exported, unused by
   the events page).
2. **Coin-card sparkline tint.** Strokes are tinted by the round's Up odds (Pulse Blue when
   up-leaning, Volt when down-leaning) instead of the contract's fixed accent stroke.

## c) Editor's picks data convention

Ops-curated, no schema migration — `events.metadata` is `jsonb`:

```json
"editorial": { "pick": true, "rank": 1, "note": "reason text", "updated_at": "ISO" }
```

Rules:
- Max **3** picks, ordered by `rank` ascending.
- `pick: true` with an **empty/missing `note` is skipped** (the reason is mandatory by
  design) and logs a `console.warn`.
- With **zero valid picks the module is not rendered at all** (desktop and mobile).
- The header "Updated {relative}" derives from the **max** `editorial.updated_at` across
  the valid picks.

Ops SQL to set a pick:

```sql
UPDATE public.events
SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
  'editorial', jsonb_build_object(
    'pick', true,
    'rank', 1,
    'note', 'Talks restarted this week and the year-end deadline is hard.',
    'updated_at', now()
  )
)
WHERE id = '<event-uuid>';
```

To unpick: `SET metadata = metadata - 'editorial'`.

## Style-guide mocks

`Lite · Final touches (11)` mocks all five round windows (5m/15m/1h/4h/1D) for all three
coins; round `end_date` is offset from the wall clock so the CLOSES countdown reads a
believable mid-round value (5m → 02:14, 15m → 08:41, 1h → 41:07, …) instead of 00:00.
