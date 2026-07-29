# R3b-2 round 13 — Resolved pathway

1. **W1 · Live / Settled switch on the Lite markets list.** New `src/components/lite/LiveSettledSwitch.tsx`
   (category-pill visual language). Mounted in `LiteEventsPage.tsx` on the same row as the sector rail:
   rail in a `min-w-0 flex-1 overflow-x-auto` child, switch as a `shrink-0` sibling. `Live` is always active;
   `Settled` navigates to `/resolved`.
2. **W2 · Lite daily up/down page renders the settled outcome card.** `LiteSpotTrade.tsx` gains a
   `resolved` branch mirroring the contract page: desktop main column renders `LiteOutcomeCard` only,
   aside keeps "More stocks closing today"; mobile renders the outcome card + more-stocks button and
   swaps the dual buy bar for a single `View in Portfolio →`. Winner derivation: `options.find(is_winner)`
   with a price ≥ 0.5 fallback. Holding passes `boost: 1` (card hides the chip at 1×). `See how it settled`
   routes to `/resolved/:id`. `LiteOutcomeCard` needed no new props.
3. **W3 · Permanent recovery door in Wallet.** Quiet muted link
   `Sent funds to the wrong network? Request recovery →` at the bottom of the Transaction History band
   (desktop) and the bottom of the mobile stack. Always rendered; the in-context PendingConfirmations
   link is unchanged.
4. **Style guide.** LiteSection: Live/Settled switch demo (both states), new `LiveSettledSwitch` row in
   "Where things live", and the `LiteOutcomeCard` row now notes it covers contract AND spot settled events.

No Pro terminal UI and no `tradingService.ts` changes.
