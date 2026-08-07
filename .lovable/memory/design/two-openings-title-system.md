---
name: Page opening system v3
description: Site-wide page-opening rule (entity / data / control openings), no h1 on section pages, PageTitle + PageHeader retired, tab-vs-chip test
type: design
---

v3 (2026-08-07, CPO R3). Replaces v2 ("two openings" with PageTitle).

## Three openings — every page picks exactly one

**A) ENTITY OPENING** — the page is about a named thing. The entity name IS the
heading: Lite trade event stem (`/trade`, `/spot`, `clamp(24px, 3.5vw, 34px)`),
campaign name on `/rewards/campaign/:id`.

**B) DATA OPENING** — the page's own hero/stat module opens it, no title:
Wallet (equity card), Portfolio (tabs + stats row), Vouchers (earnings card),
Settings (profile card), API Management (tier answer + track).

**C) CONTROL OPENING** — the page opens on its controls: Events / Resolved
(status tabs + filter chips), Rewards (Campaigns/Referral tabs), Transparency.

**实体名才配标题** — only an entity earns a title. Section/browse pages carry NO h1.

## Retired
`src/components/PageTitle.tsx` and `src/components/PageHeader.tsx` are RETIRED —
style-guide archive only. Importing either into a product page is a defect.

Exemptions: Leaderboard neon hero; SEO pages under `SeoPageLayout`.

## Tabs vs chips — the "can it have All?" test
- **No All** (mutually exclusive states of one page: Campaigns/Referral,
  Active/Resolved) → **tab**: underline style, 2–4 items, never scrolls, no All.
  13.5px, active #F2F3F5 semibold + 2px white underline, inactive #9AA1AC,
  min-height 44px, bottom border #1D2026, sticky at top-44 on mobile.
- **Can have All** (filters a list: categories, sectors) → **chip**: capsule,
  horizontally scrollable, first item is All.
- Never mix shapes in one row. If a page needs both: tabs on top, chips below.
