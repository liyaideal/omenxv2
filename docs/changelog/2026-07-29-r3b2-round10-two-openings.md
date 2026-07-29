# R3b-2 round 10 — Two-openings title system + Wallet standard frame

2026-07-29 · display layer only · no tradingService, no Pro terminal UI changes.

## 1 · Two openings (approved by Liya — replaces the PageHeader mandate)

| Opening | Pages | Treatment |
|---|---|---|
| DATA | Wallet, Portfolio, Portfolio/Settlements, Portfolio/Airdrops | No page title; the data hero (equity card / tabs + stats row) is the opening |
| TITLE | Events, Resolved, Vouchers, Rewards, Transparency, Settings, API Management | Single `<PageTitle>` display h1 — `font-display font-bold tracking-[-0.02em] leading-[1.05]`, `clamp(28px, 4vw, 40px)`, no purple bar, no subtitle |

Exemptions: Leaderboard neon hero; SEO pages under `SeoPageLayout`.

New component: `src/components/PageTitle.tsx` (optional right-aligned `actions`, `flex items-baseline justify-between`).

### PageHeader usages found and their disposition

| Page | Action |
|---|---|
| `Portfolio.tsx` | Removed (DATA opening) |
| `PortfolioSettlements.tsx` | Removed (DATA opening) |
| `PortfolioAirdrops.tsx` | Removed (DATA opening) |
| `Wallet.tsx` | Unused import removed (already DATA opening) |
| `EventsPage.tsx` | → `<PageTitle title="Explore Events" actions={<MarketStatusTabs/>} />` |
| `ResolvedPage.tsx` | → `<PageTitle title="Resolved Events" actions={<MarketStatusTabs/>} />` |
| `Vouchers.tsx` | → `<PageTitle title="Position Vouchers" />` |
| `Rewards.tsx` | → `<PageTitle title="Rewards Center" />` |
| `TransparencyPage.tsx` | → `<PageTitle title="On-Chain Transparency" />` |
| `Settings.tsx` | → `<PageTitle title="Account Settings" />` |
| `ApiManagement.tsx` | → `<PageTitle title="Keys & access" />` |
| `StyleGuide/sections/CommonUISection.tsx` | Kept as archive demo, marked DEPRECATED |

`src/components/PageHeader.tsx` kept (style-guide archive only) and marked `@deprecated`.

### Content titles

`LiteContractTrade` event h1 unified from fixed `isMobile ? 22 : 34` to `clamp(24px, 3.5vw, 34px)` — matches `LiteSpotTrade`.

## 2 · Wallet standard page frame

`Wallet.tsx` desktop `<main>`: `max-w-[1200px] px-6 py-8` → `max-w-7xl px-8 py-10`. `space-y-[18px]` band rhythm and every interior card unchanged. Mobile container untouched. Wallet stays title-less — correct by the DATA-opening rule.

## Docs

- `DESIGN.md` §4 title rule rewritten as "Two Openings"; PageHeader marked DEPRECATED.
- `.lovable/memory/design/two-openings-title-system.md` added.

No other inconsistencies were touched.