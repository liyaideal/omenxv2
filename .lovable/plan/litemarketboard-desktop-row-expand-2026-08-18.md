# LiteMarketBoard desktop row expand

## Goal
Make the desktop (non-compact) rows in `LiteMarketBoard` clickable so clicking anywhere on the row expands the inline chart, while keeping the Yes/No chips as explicit side selectors.

## Scope
- Only desktop rows (`compact === false`) get the new behavior.
- Mobile compact rows remain unchanged per CPO call.
- Settled rows stay non-interactive and do not expand.

## Implementation

### 1. `LiteMarketBoard.tsx`
- Add optional prop `onDeselect?: () => void`.
- Wrap the desktop row inner grid in a clickable surface (the existing card div) and attach a row click handler:
  - If `o.settled`, ignore.
  - If `selectedId === o.id` (row already expanded), call `onDeselect?.()` to collapse.
  - Otherwise call `onSelect(o.id, "yes")` to expand with the Yes side selected.
- Add `stopPropagation()` to the `Chip` buttons so row click does not fire when the user explicitly taps a chip; chips continue to select their own side.
- Add `cursor-pointer` and a subtle hover state to the desktop row card.
- Keep compact/mobile rows untouched.

### 2. Parent consumers
- Update `LiteContractTrade.tsx` to pass `onDeselect={() => setSelectedOptId(null)}` (or equivalent) wherever `LiteMarketBoard` is rendered in desktop mode.
- Verify `LiteSpotTrade.tsx` / other `LiteMarketBoard` usages and pass the same deselect callback if they bind `selectedId`/`selectedSide`.

### 3. Verification
- Open `/trade?event=sp-lal-fcb-atm` (or any multi-option event) on desktop.
- Confirm:
  - Clicking the empty area of a row expands the inline chart with Yes selected.
  - Clicking the same expanded row collapses it.
  - Clicking Yes/No chips still selects that side and does not collapse unexpectedly.
  - Compact/mobile rows still require chip taps.
  - Settled rows do not expand.

## Skip
- No visual redesign of chips, strips, or chart panel.
- No changes to mobile compact layout or bottom-sheet behavior.
- No backend/data changes.
