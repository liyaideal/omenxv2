---
name: Empty state standard + lynx mascot
description: Site-wide EmptyState anatomy (page/module), copy bans, pill-not-link rule, and the locked lynx mascot usage rules
type: design
---

# Empty states (site-wide, rounds 16 + 17)

Single primitive: `src/components/states/EmptyState.tsx`. Never hand-roll an empty state.

Three tiers, default `section`. Legacy `card` → section, `inline` → module.

| Tier | Assignment | Scale |
| --- | --- | --- |
| `page` | main list/content area entirely empty | `flex-1 min-h-[420px]` centered (parent must be flex column; fallback `min-h-[55vh]`), LynxFigure 150, title 19px `mt-[22px]`, desc 13.5px `max-w-[420px]` `mt-2`, pill 14px `px-[22px] py-2.5` `mt-[22px]` |
| `section` | a section within a populated page | `px-6 py-8`, LynxFigure 100, title 15px `mt-3`, desc 12px `max-w-[360px]`, pill 13px `px-[18px] py-2` |
| `module` | in-card row | LynxMark 40 / sw 3.4, `px-5 py-4`, `bordered={false}` inside a bordered card |

- Props: `title`, `description`, `variant`, `mascot="figure"|"mark"|"none"`, `actionLabel` + `onAction`/`href`, `bordered`, `className`. Legacy `icon` accepted but never rendered — the mascot replaces it.
- **Copy:** line 1 = fact, line 2 = method. No "Oops", no exclamation marks, no apologies, no illustration other than the lynx.
- **Pill, not link:** blue underlined text links inside empty states are abolished site-wide.

## Page-tier call sites (round 17)

LiteEventsPage (watchlist empty, sector/filter empty) and LiteSettledPage (settled list / "My results" empty, series-view empty). Every other migrated call site stays `section` (default) or `module`.

# Lynx mascot

`src/components/brand/LynxMark.tsx` + `LynxFigure.tsx` — hand-authored approved line art, coordinates LOCKED (shared geometry in `lynxArt.tsx`).

1. Mono stroke, `currentColor` only, defaults to `--muted-foreground`. Componentised, never an image, never a hex.
2. Expression locked — only this grumpy face, no variants.
3. Minimum LynxMark render size 40px (`strokeWidth ≈ 3.4` at ≤48).
4. Never stretch, rotate, add shadow/gradient or recolor; the mascot never participates in the MARKET/MONEY axes.

# Migrated files (round 16)

LiteEventsPage, LiteSettledPage (list + series), LiteMarketActivity, LiteSpotTrade (More stocks), LiteContractTrade (More markets), wallet TransactionHistory, Wallet (saved addresses ×2), Portfolio (positions / settlements / airdrops), PortfolioSettlements, PortfolioAirdrops, Vouchers, Rewards, ApiManagement, PointsHistoryList.
Style guide: `src/pages/StyleGuide/sections/EmptyStatesSection.tsx` (registered under Core UI).
