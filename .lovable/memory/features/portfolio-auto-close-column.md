---
name: Portfolio auto-close / if-wins column
description: Rules for the AUTO-CLOSE / IF WINS column in Lite Portfolio live rows and cards.
type: feature
---

# Portfolio auto-close / if-wins column

## Mobile card sentence

- Standard / no auto-close: `If it wins you get $X`
- Boost with auto-close price: `If it wins you get $X · auto-close ≈{c}¢`
- Boost without auto-close price: `If it wins you get $X` (no suffix)

## Desktop row merged column

- Standard / no auto-close: `If it wins → $X`
- Boost with auto-close price: `If it wins → $X · auto-close ≈{c}¢`
- Boost without auto-close price: `If it wins → $X` (no suffix)

## Hot state

When the current price is within 10% of the auto-close level, the entire payout sentence turns red (`RED`).

## Data guards

- Only Boost rows (`segment === "boost"` and `leverageNum > 1`) are eligible for an auto-close suffix.
- `autoCloseState === "none"` suppresses the suffix entirely.
- `autoClosePrice == null` suppresses the suffix; do not render a placeholder such as `auto-close —`.
