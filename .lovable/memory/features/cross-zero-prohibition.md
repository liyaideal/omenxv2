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
