---
name: Lite M2 decision records
description: 铁律-4 three-way verdicts for Lite M2 (spot sell entry, limit orders, TP/SL, official close price gap)
type: constraint
---

# Lite M2 — decision records (LOCKED for this period)

## M2-b · Spot sell entry — DECIDED: not this period
No separate Sell entry in Lite. The sell path is **Cash out** on the position card
(market page). **Why:** one verb (Cash out) covers exit; a second entry point splits
the mental model.

## M2-c · Limit orders — EXCLUDED from Lite (final)
**Why:** waiting-order mechanics contradict the 10-second comprehension mission.
**Pro exit:** the existing "Switch to Pro mode" footer on the Lite events page.

## M2-d · TP/SL — NOT this period
Future Lite translation direction: "auto cash-out at a target price". For now Lite
only shows the read-only **Est. auto-close** price. **Pro exit:** Pro terminal has
full TP/SL.

## M2-e · Official close price not stored — data gap
Filed to the **M4 (Resolved / settlement)** module. Do not work around it in Lite
trade surfaces.

## M2-a · Netting payout wording (shipped Round 19)
When a buy nets an opposite-side holding, the payout row reads
"You'll get back ≈ $X" (full net) and adds "Then if the rest is right, you win $Y"
when a remainder opens. Non-netting orders keep "If you're right, you win $X".
Spot has no netting concept — the Lite spot order card is unchanged by design.