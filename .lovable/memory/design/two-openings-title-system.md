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
  Two tiers:
  - **Opening-level tab** (top of a control-opening page): font-display,
    mobile 19px/26px, desktop 24px/30px, −0.01em; active #F2F3F5 w700 with a
    2.5px rounded #F2F3F5 underline, inactive #6B7280 w500; min-height 48/56px,
    pb 8/12px, gap 28/36px, items-end on the 1px #1D2026 divider, sticky top-44.
    控件开场的分区 tab 使用开场级 display 字号，承担页面字号锚点
    (2026-08-07 CPO 定稿, ref 6a5875a2 · LiteRewardsPage).
  - **Local tab** (nested, inside a panel): 13.5px, active #F2F3F5 semibold +
    2px white underline, inactive #9AA1AC, min-height 44px, border #1D2026.
- **Can have All** (filters a list: categories, sectors) → **chip**: capsule,
  horizontally scrollable, first item is All.
- Never mix shapes in one row. If a page needs both: tabs on top, chips below.
