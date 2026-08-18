# Fix: line scrubber collapses the chart instead of following the selection

## What's happening

On desktop, the whole market row is clickable (added last round). The line scrubber
(-2.5 / -1.5 / +1.5 / +2.5) is rendered **inside** that clickable row, via `renderFooter`.

So tapping a line value fires two things in order:

1. the scrubber's own `onChange` — which swaps to the sibling market and carries the
   selection to the new option (this part already works);
2. the click then **bubbles up** to the row's `onClick` — the row is currently selected,
   so it runs `onDeselect()` and collapses the chart.

The collapse is the bubbled row click, not a bug in the line switch itself.

## The fix

In `LiteMarketBoard`, wrap the `renderFooter(...)` output in a container that stops
click propagation, so scrubber interactions never reach the row toggle. The row click
behaviour (click to expand with Yes, click again to collapse) stays exactly as is.

After that, switching lines keeps the row selected, the inline chart stays open and
re-seeds to the new sibling, and the order rail rebinds — which is what the existing
`changeLine` handler in `LiteContractTrade` already intends.

## Technical detail

- `src/components/lite/multi/LiteMarketBoard.tsx`: the footer slot gets
  `onClick={(e) => e.stopPropagation()}` (same guard the Yes/No chips already use).
- No changes to `LiteLineScrubber`, `LiteContractTrade`, or any copy.
- Verify on `/trade?event=sp-ucl-mci-int`: expand the Handicap row, click `+2.5`, and
  confirm the row stays expanded with the chart and order rail following the new line.
