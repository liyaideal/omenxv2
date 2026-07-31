---
name: Binary net position (futures) — supersedes cross-zero prohibition
description: Trading rule — on binary events a user holds one direction; buying the opposite side reduces the held side first, remainder opens
type: feature
---
Binary events (exactly 2 rows in `event_options`) are **net-position per user** on the futures product line.

1. Buy on the outcome you already hold → open / add (weighted-average entry).
2. Buy on the OTHER outcome → reduces the held leg first at `impliedOppMark = clamp(1 − price, 0.01, 0.99)`:
   `closeQty = min(qty, oppSize)`, `marginReleased = oppMargin × closeQty/oppSize`,
   `realizedPnl = (impliedOppMark − oppEntry) × closeQty`. Any `remainderQty` opens/merges a same-side long
   with `marginUsed = remainderQty × price / leverage`. Opening margin is validated against the remainder only.
   `balanceDelta = −(marginUsed + fee) + marginReleased + realizedPnl`. Intent is `close` when the opposite leg
   is flat and there is no remainder, otherwise `reduce`.
3. Same-option long-vs-short reduce/close rule is UNCHANGED: reverse orders may reduce up to current size,
   must carry zero opening margin, and may not cross zero.
4. Spot was already netted (`executeSpotTrade`); sell-side and multi-outcome events are out of scope.

The old "No maps to Yes-short, opposite side is blocked" model no longer applies to binary buys.
Margin semantics stay: traded notional (qty × clicked price) drives records/fees/display; opening margin comes
only from the net-risk-increasing slice.

## Multi-option events (>2 options) — per-option netting (Round 22)
`tryNetSameOptionOppositeSide` runs BEFORE the legacy same-option opposite block and only for events with
`event_options` count > 2, on BOTH buy and sell orders.
- Yes = buy → `long` (yes axis). No = sell → `short` (yes-axis complement, i.e. no axis), SAME `option_label`.
- Held leg closes at `impliedMark = clamp(1 − orderPrice, 0.01, 0.99)`; PnL is `(impliedMark − heldEntry) × closeQty`
  for BOTH sides, because each leg's entry is stored on its own axis and gains when that axis rises.
- FLIP ALLOWED: `remainderQty` opens/merges a leg on the order's side, `margin = remainderQty × price / leverage`
  (blended leverage on merge). Single `balanceDelta = −(remainderMargin + fee) + released + realizedPnl`.
  Intent `close` when fully closed with no remainder, else `reduce`.
- Binary (count === 2) and spot are byte-for-byte unchanged, including the Pro manual-sell cross-zero prohibition.

## Close-price axis conversion (bug fix, Round 22)
The legacy opposite-side reduce path used the raw order price against the held entry. Closing a LONG with a SELL
whose price sits on the no axis now converts: `closeMark = clamp(1 − sellPrice)`. Example: long 100 @ 0.10,
sell at 0.90 → closes at 0.10, realized PnL 0 (previously 0.90 → a phantom +$80). Short branch untouched.

## Schema
`positions.leverage` is `numeric(10,2)` — blended leverage (e.g. 2.67×) persists with decimals.
