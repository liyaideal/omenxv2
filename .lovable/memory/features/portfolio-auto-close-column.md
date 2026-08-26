---
name: Auto-close field — two-state value grammar
description: Auto-close is a permanent field across Lite Boost surfaces; its value has exactly two states (a price or None).
type: feature
---

# Auto-close field — two-state value grammar

The field is always rendered on Lite Boost surfaces. It never unmounts and never
shows a transient placeholder. The value has exactly two states:

- `≈{c}¢` — a solved level (`AutoCloseResult.kind === "level"`).
- `None` — no level (`kind === "none"`): 1× position, cushioned account, or missing data.

`None at this balance` is retired site-wide.

## Solver (`src/lib/autoClosePrice.ts`)

- Side-aware: long levels sit BELOW the mark, short levels ABOVE it.
- Account-level (cross-collateralised), never the isolated-margin helper.
- Returns `AutoCloseResult`, never `null`.
- `isAutoCloseHot(result, mark)` — true when within 10% of the mark.

## Surface copy

- Order panel: `None · enter an amount` before an amount is typed; otherwise the two states.
- Portfolio mobile card: `If it wins you get $X · auto-close ≈{c}¢` or `… · no auto-close, loss capped`.
- Portfolio desktop row: `If it wins → $X · auto-close ≈{c}¢` or `… · auto-close none`; `none` is inline lowercase and its tooltip is `No auto-close within this market's price range — your loss is capped at what you put in.`.
- Hot state turns the payout sentence / auto-close value red.
- Standard (non-Boost) spot rows carry no auto-close field. Pro side unchanged.
