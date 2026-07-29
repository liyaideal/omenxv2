# R3b-2 round 8 — Lite SPOT parity sweep (2026-07-29)

Brings the Lite spot page (`/spot`, surface=lite) in line with rounds 6/7 of the
contract page. Display layer only — no Pro UI, no `tradingService.ts` diffs.

## W-1 · Chart follows the selected side
- `LiteStockChart` gains `side` / `upLabel` / `downLabel`. Odds series = `100 − Up`
  per point for the down side; underlying price series untouched.
- Toggle pill label, tooltip name and line stroke follow the side
  (`--yes` for up, `--no` for down, one at a time). Auto-domain applies to the
  active series. Wired from `LiteSpotTrade` page state — prop change, no remount.

## W-2 · Market activity is the shared anonymised all-user feed
- `useMarketActivityRows(eventName, yesOptionLabel, tick)` extracted from
  `LiteContractTrade` into `LiteMarketActivity`; both pages consume it.
- Spot's owner-scoped `usePulse` + local `relTime` + the "Someone backed …"
  block are deleted; the shared `LiteMarketActivity` ledger renders instead
  (4 rows mobile / 8 desktop, spot rows are 1×).

## W-3 · Spot position card gets Cash out
- "Manage in Portfolio →" removed; footer action row (`border-t mt-3 pt-3`) with
  `Cash out · $NN.NN` (live `markPrice × size`, font-mono) opens `LiteCashOutFlow`.
- **Cash path:** spot cash-out routes through the existing spot SELL path
  (`executeSpotTrade` side `sell` at the current mark, proceeds credited via
  `addSpotBalance`) rather than the generic position close, because only the spot
  path returns a `balanceDelta` that credits the cash balance. `LiteCashOutFlow`
  takes an optional `onConfirmCashOut` override; the contract page keeps
  close/partialClose unchanged. No new cash math was invented.

## Style guide
- Lite spot section: side-by-side Up/Down chart states, shared-module note.
- "Where things live": LiteCashOutFlow + LiteMarketActivity rows note spot reuse;
  new `LiteStockChart (spot)` row.
