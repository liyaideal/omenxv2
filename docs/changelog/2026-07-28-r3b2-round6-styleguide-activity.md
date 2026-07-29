# R3b-2 round 6 — Style-guide restructure, market activity, round-5 tails

## W-A · /style-guide IA (navigation shell only)

`src/pages/StyleGuide/index.tsx` no longer owns a flat tab list. Groups live in the new
`src/pages/StyleGuide/nav.tsx` registry; **no existing section file's internals were edited**
(sections are living specs and were only imported / re-registered).

| Group | Sections |
| --- | --- |
| Foundations | DesignTokensSection, TypographySection, AnimationsSection |
| Core UI | CommonUISection, FormsSection, UserIdentitySection |
| Trading — Pro | TradingSection, TradingHeaderPlayground, SpotSection, TransparencySection |
| Lite (consumer surface) | **LiteSection (new)**, LiteSpotSection |
| Wallet & Money | WalletSection, DepositWithdrawSection, VouchersSection |
| Mobile | MobilePatternsSection, MobileHomeSection |
| Misc / Legacy | ApiSection, StatesSection, WorldCupSection (labelled legacy) |

- Desktop: sticky grouped sidebar with group headers; mobile: horizontal pill rail.
- Deep links keep working: the selected section is written to the hash (`/style-guide#lite`),
  and `resolveSectionId` maps legacy ids (`home` → `mobile-home`, `mobile` → `mobile-patterns`).
- `/campaign-style-guide` stays a separate page; cross-linked from the sidebar footer.

### LiteSection playground states
Boost selector (ladders max 2/5/10/20/50, custom 7×, tray open at 1× baseline, mobile variant) ·
contract order card (empty / 1× / 5× / netting notice / blocked Closed / blocked Settled /
boost-loading skeleton) + the four Est. auto-close texts · position card (profit, loss, 1× None,
None at this balance) with Cash out footer · LiteCashOutFlow (100%, partial 37%, busy CTA) ·
LiteOutcomeCard (won / lost / no holding) · LiteContractChart (odds-only, odds+underlying) ·
LiteSentimentBar (8 / 52 / 94%) · LiteMarketActivity (populated / empty) · Lite spot order card
(empty / filled / blocked) · MobileHeader preset-B note linking to Mobile patterns.

Two additive, playground-only props were added rather than refactoring production code:
`LiteBoostSelector.defaultTrayOpen`, `LiteCashOutFlow.defaultPct` / `forceBusy`.

## W-B · Market activity = anonymised all-user feed

- Table `market_activity` (no user identity column of any kind): public `SELECT` for everyone,
  no client INSERT/UPDATE/DELETE policies.
- `AFTER INSERT` trigger on `trades` (side='buy' AND status='Filled') writes the anonymised row
  through a SECURITY DEFINER function.
- DEMO-STATE `sim_market_activity_tick()` runs on pg_cron every 5 minutes: 0–3 rows per unresolved
  event, side sampled by current option price, amount log-skewed $5–$500, boost from the category's
  real tier ladder (1× when the category is disabled); same job deletes rows older than 48h.
  Production replaces this with the trigger-only feed.
- UI: `LiteMarketActivity` (new, presentational) renders `Backed {side} · $25 · 5× Boost · 2m`,
  side chip on the MARKET axis, empty state "No activity yet — be the first.".
  The owner-scoped `usePulse` query and its RLS comment are gone; polling is driven by `refetchTick`.
- ~100 rows backfilled across currently-active events.

## W-C · Round-5 tails (UI/copy only — engine untouched)

1. `LiteCashOutFlow` partial quantity is exact `fraction * sizeNum` clamped to (0, sizeNum]; no
   rounding, no 1-share floor.
2. Position-card button is live: `Cash out · $144.00` (Now worth), shown at a loss too.
3. Netting toast: intent `reduce`/`close` → `Cashed out {heldSideLabel}` (+ cash back when
   balanceDelta > 0); `Backed {side} · $X` only for open/add.
4. Netting balance pre-check uses `max(0, amount − heldCurrentValue) + fee`; engine stays authority.
5. Boost custom tray at 1×: numeric input empty with `2–{max}` placeholder, slider parks at 2.

## Files touched

New: `src/components/lite/contract/LiteMarketActivity.tsx`,
`src/components/lite/contract/LitePositionCard.tsx`,
`src/components/lite/contract/LiteSentimentBar.tsx`,
`src/pages/StyleGuide/sections/LiteSection.tsx`, `src/pages/StyleGuide/nav.tsx`, this changelog.

Edited: `src/components/lite/contract/LiteBoostSelector.tsx`,
`src/components/lite/contract/LiteCashOutFlow.tsx`,
`src/components/lite/contract/LiteContractOrderPanel.tsx`,
`src/pages/lite/LiteContractTrade.tsx`, `src/pages/StyleGuide/index.tsx`,
`src/pages/StyleGuide/sections/index.ts`, `docs/changelog/STATUS.md`.

No Pro terminal UI diffs. No `src/services/tradingService.ts` diff this round.
