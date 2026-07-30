---
name: Empty state standard + lynx mascot
description: Site-wide EmptyState anatomy (page/module), copy bans, pill-not-link rule, and the locked lynx mascot usage rules
type: design
---

# Empty states (site-wide, round 16)

Single primitive: `src/components/states/EmptyState.tsx`. Never hand-roll an empty state.

- `variant="page"` (default): dashed hairline `rounded-2xl` card, `px-6 py-8`, `LynxFigure size={100}`, title `font-display` 15px semibold (`mt-3`), description `font-sans` 12px muted `max-w-[360px]` (`mt-[5px]`), optional pill action (`mt-4`).
- `variant="module"`: horizontal row, `LynxMark size={40} strokeWidth={3.4}` + text block; `bordered={false}` when inside an already-bordered card.
- Props: `title`, `description`, `variant`, `mascot="figure"|"mark"|"none"`, `actionLabel` + `onAction`/`href`, `bordered`, `className`. Legacy `icon`/`variant="card"|"inline"` accepted for compatibility but icons are never rendered — the mascot replaces them.
- **Copy:** line 1 = fact, line 2 = method. No "Oops", no exclamation marks, no apologies, no illustration other than the lynx.
- **Pill, not link:** blue underlined text links inside empty states are abolished site-wide.

# Lynx mascot

`src/components/brand/LynxMark.tsx` + `LynxFigure.tsx` — hand-authored approved line art, coordinates LOCKED (shared geometry in `lynxArt.tsx`).

1. Mono stroke, `currentColor` only, defaults to `--muted-foreground`. Componentised, never an image, never a hex.
2. Expression locked — only this grumpy face, no variants.
3. Minimum LynxMark render size 40px (`strokeWidth ≈ 3.4` at ≤48).
4. Never stretch, rotate, add shadow/gradient or recolor; the mascot never participates in the MARKET/MONEY axes.

# Migrated files (round 16)

LiteEventsPage, LiteSettledPage (list + series), LiteMarketActivity, LiteSpotTrade (More stocks), LiteContractTrade (More markets), wallet TransactionHistory, Wallet (saved addresses ×2), Portfolio (positions / settlements / airdrops), PortfolioSettlements, PortfolioAirdrops, Vouchers, Rewards, ApiManagement, PointsHistoryList.
Style guide: `src/pages/StyleGuide/sections/EmptyStatesSection.tsx` (registered under Core UI).
