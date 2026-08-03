# Fix: Intraday dial stretches full width

## Problem
On the "All" stage Intraday card (State A), the timeframe dial (5m / 15m / 1h / 4h / 1D) renders as a block-level flex container inside a column layout, so its bordered background stretches to the full column width and leaves a large empty area to the right of the last option.

## Change
In `src/components/lite/allstage/IntradayStageCard.tsx`, the `module` variant of `Dial`:
- change the wrapper from `flex gap-[2px]` to `inline-flex w-fit self-start gap-[2px]` so the pill shrinks to the width of its five buttons.

No changes to the `card` variant (State B), to button sizes/padding, colors, or any other module. Style-guide presets pick the change up automatically since they render the same component.
