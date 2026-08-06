---
name: Lite order panel parity
description: Two Lite order panels only (contract + spot); deliberate contract/spot differences; quick-round PickCard exception; SideButton is the single side-selection control
type: design
---
# Lite order panels — parity ruling (2026-08-06, CPO)

## (a) Exactly two implementations
- Contract: `LiteContractOrderPanel`
- Spot: `LiteOrderPanel` — shared by daily stocks (`LiteSpotTrade`) and quick rounds (`LiteQuickTrade`)

Their skeletons (amount input, preset row, balance line, CTA chrome) are byte-identical.
No third order panel may be created for any new category.

## (b) Contract vs spot differences are DELIBERATE — do not "unify"
- Title: "Make your call" (contract) vs "Place your order" (spot)
- Summary-row wording
- CTA layout
- Footnote: risk (contract) vs execution (spot)
- Boost module + Est. auto-close: contract only
- win-$ preset sublabels: spot only

## (c) The ONLY structural difference allowed inside spot
The quick-round page keeps its `YOUR PICK` question card with side selection
outside the panel (desktop `hideSideSelector`) because quick rounds roll every
few minutes with a fresh threshold price and deadline — the per-round question
("BTC higher than $X at HH:MM?") must stay visible and actionable at the top.
Daily stocks are one round per day, so side selection lives in-panel.

## (d) One side-selection control
All side selection (panels, PickCard, boards) uses the single
`src/components/lite/shared/SideButton.tsx`. Density via props (`size="compact"`).
No bespoke chip styling, no re-drawn lookalikes.

## (e) Banned copy
"% say Up/Down" sublabels are banned — duplicate of the crowd/sentiment bar.
