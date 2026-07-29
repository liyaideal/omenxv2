---
name: Two openings title system
description: Site-wide page-opening rule — account pages have no title (data hero opens), browse pages use a single display h1 via PageTitle; PageHeader deprecated
type: design
---

Approved by Liya (R3b-2 round 10). Replaces the old "every page MUST use PageHeader" mandate.

Every product page opens in exactly one of two ways:

**A) DATA OPENING** — account pages (Wallet, Portfolio + subpages): NO page title.
The page's own data hero (Wallet equity card / Portfolio tabs + stats row) is the opening.
Wallet having no title is correct by rule — never add one.

**B) TITLE OPENING** — browse/utility pages (Events, Resolved, Vouchers, Rewards,
Transparency, Settings, API Management): a single display h1 via
`src/components/PageTitle.tsx` — `font-display font-bold tracking-[-0.02em]
leading-[1.05]`, `fontSize: clamp(28px, 4vw, 40px)`. No purple bar, no subtitle,
no eyebrow, no icon. Optional right-aligned `actions`, baseline-aligned.

Exemptions: Leaderboard neon hero; SEO pages under `SeoPageLayout`.

`src/components/PageHeader.tsx` is DEPRECATED (style-guide archive only).

Content titles (Lite trade event names) are distinct from page titles and use
`clamp(24px, 3.5vw, 34px)` on both `/spot` and `/trade`.