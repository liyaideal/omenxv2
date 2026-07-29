# 2026-07-29 · R3b-2 round 7 — chart side-follow, market activity, style-guide clarity

## W-1 · Odds chart follows the selected side
- `src/components/lite/contract/LiteContractChart.tsx`: new `side` + `noLabel` props.
  The odds series for No is `100 − yesValue` per point; header, in-chart toggle
  label and line stroke all follow the selected side on the MARKET axis
  (`--yes` / `--no`, never both). Auto-domain (±8¢ pad, min 20¢ span, 0–100
  clamp) applies to whichever series is active. Underlying series untouched.
- `src/pages/lite/LiteContractTrade.tsx`: `side` wired from page state — the same
  `Chart` element is used on desktop and mobile, so flipping side is a prop
  change (no remount / flash).

## W-2 · Market activity
- Migration: `trg_record_market_activity_fill`, AFTER UPDATE on `trades`
  `WHEN (OLD.status='Pending' AND NEW.status='Filled' AND NEW.side='buy')`,
  reusing `record_market_activity()`. Pairing invariant documented in SQL:
  the INSERT trigger only records rows born `Filled`, the UPDATE trigger only the
  Pending→Filled transition — mutually exclusive, no double-recording.
- `src/components/lite/contract/LiteMarketActivity.tsx`: ledger grid
  `grid-cols-[minmax(48px,auto)_64px_1fr_auto]` — side chip / right-aligned mono
  amount / muted boost (empty at 1×) / right-aligned relative time. The
  "Backed …" sentence is gone; the chip carries the side.

## W-3 · Style-guide mobile clarity (LiteSection only)
- Every "shared" chip removed (including the section's platform badge).
  Replaced by three context chips: `Desktop · right rail`,
  `Mobile · bottom drawer`, `Desktop & Mobile · same component`.
- New "Where things live" table at the top of the section: component, desktop
  placement, mobile placement, opened by, number of states demoed.
- New "Mobile mounting contexts": 375px bordered frames for (a) the buy drawer
  composition (order panel `variant="mobile"` inside static MobileDrawer chrome —
  the real drawer portals to `<body>`), (b) the sticky dual buy bar, (c) the
  position card with `compact`.
- Chart demos now cover Yes-side and No-side, odds-only and odds+underlying.
  Market-activity demos include an alias pair (Up / Down) to prove alignment.

## Receipt
Files: `LiteContractChart.tsx`, `LiteMarketActivity.tsx`, `LiteContractTrade.tsx`,
`StyleGuide/sections/LiteSection.tsx`, `.lovable/memory/design/style-guide-ia.md`,
this changelog, `STATUS.md`, plus one DB migration.
No Pro terminal UI diffs. No `src/services/tradingService.ts` diff. No edits inside
any non-Lite style-guide section; the nav shell was not touched.