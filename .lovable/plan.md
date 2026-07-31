## Problem

The mobile header on `/spot?event=us-coin-updown-20260731` shows "US" instead of "Coinbase".

Confirmed cause (`src/components/SpotStatsHeader.tsx`, `deriveTickerFromEvent`):
1. It first looks up a hardcoded `STOCK_NAME` map that only contains NVDA, TSLA, AAPL, MSFT, GOOGL, META, AMZN — COIN, HOOD, AMD etc. are missing.
2. It then falls back to the first `[A-Z]{2,5}` word in `"<id> <name>"`, which for `us-coin-updown-...` is the `US` prefix.

The database confirms every US-stock event name already carries the canonical ticker in parentheses, e.g. `Coinbase (COIN) — will close higher today?`, and ids follow `us-<ticker>-updown-<yyyymmdd>`. So the ticker is reliably derivable; the current heuristic just reads the wrong token.

Same wrong value leaks into other copy on the page: the settlement sentence ("Wins Up if **US**'s 4:00 PM ET close beats …"), the "Buy US" order button, the other-markets list, and `LiteSettledSeriesCard` series grouping (which already has a comment noting the "US" fallback bug).

## Fix (display layer only)

**`src/components/SpotStatsHeader.tsx`**
- Rewrite `deriveTickerFromEvent` with an explicit precedence:
  1. `id` match on `^us-([a-z]{1,5})-updown-` → uppercase that capture group.
  2. `name` match on `\(([A-Z]{1,5})\)` → that capture group.
  3. known-ticker map lookup (unchanged behaviour for legacy ids).
  4. generic `[A-Z]{2,5}` scan, but with `US` (and `ET`, `AM`, `PM`) excluded as stopwords.
  5. `"STOCK"` fallback.
- Extend `STOCK_NAME` to cover the tickers actually seeded: COIN → Coinbase, HOOD → Robinhood, AMD → AMD, plus keep existing entries. Unknown tickers keep falling back to the ticker itself (no fabricated company name).

**`src/pages/lite/LiteSpotTrade.tsx`**
- Delete the duplicated local `STOCK_NAME` map and import the canonical one (export it from `SpotStatsHeader`), so the Lite page, the "other closing stocks" list, and the settled series card all read the same names. No layout or copy-structure changes — only the resolved value.

Everything else (Pro `SpotTrading.tsx`, `LiteSettledSeriesCard.tsx`) already calls `deriveTickerFromEvent`, so they get corrected automatically.

## Verification

Load `/spot?event=us-coin-updown-20260731` on a mobile viewport and confirm: header title "Coinbase", settlement sentence "Wins Up if COIN's 4:00 PM ET close…", buy button "Buy COIN". Spot-check an AAPL and a HOOD event for no regression.

## Not in scope

No DB/schema changes, no new deps, no changes to pricing, netting, or layout.
