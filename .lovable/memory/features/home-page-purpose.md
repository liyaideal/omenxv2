---
name: home-page-purpose
description: Home v3 — sportsbook-inspired layout. Greeting + search + Tournaments rail + Top Events with LIVE switch + D-class HomeMatchCard.
type: feature
---

## Home is a conversion funnel, not a dashboard

**Mission priority** (decides 80% of the viewport):
1. Guest → wants to sign up (after seeing real markets + social proof)
2. Authed without first trade → wants to place first trade
3. Authed with positions → bonus discoverability; not the main job

Active traders manage PnL/positions in **Portfolio**, not on home.

## Home v3 structure (mobile, top → bottom)

1. **`HomeGreeting`** — `Hello,` + uppercase display name + primary `+` button (guest → AuthSheet, authed → `/deposit`).
2. **`HomeSearchBar`** — pill that navigates to `/events`. UI-only, no inline input.
3. **`HomeStatusStrip`** — authed only, slim equity row.
4. **`PositionAlertCard`** — authed + has-positions only, top |pnl%|.
5. **`HomeTournamentsRail`** — horizontal snap carousel. Slot 1 = "All markets" (primary gradient + arrow), then one tile per non-empty category, sorted by 24h volume. Solid color blocks (no imagery), uppercase display labels, `N markets · $X` subline. Tap → `/events?category=...`.
6. **`OnboardingCard`** — authed only, between rail and Top Events.
7. **`HomeTopEvents`** — Title row with **LIVE switch** (default ON; filters to `isClosingSoon || volume24h > 100k`) and a horizontal **category chip rail** (`All` + categories sorted by volume, single-select). Renders up to 8 `HomeMatchCard`s sorted by 24h volume. Empty-state has a "Reset filters" button. Footer "Browse all markets →" links to `/events`. Guest sees `TrialCallout` slotted between card 2 and 3.

## D-class card: `HomeMatchCard`

Sportsbook score-and-odds layout, **isolated from MarketCardA/B/C** per `mem://constraint/card-style-isolation`.

- Header: ⭐ + category badge + `New` + countdown / time-left (right).
- Title: 1-2 lines, `text-[15px] font-semibold`.
- Binary events: `[ YES price chg ] [ 24h Vol ] [ NO price chg ]` 3-col grid. Yes/No are buttons styled with `trading-green/red` accents, currently navigate to `/trade?event=ID` (side preselect deferred).
- Multi-outcome (>2 children): falls back to a stacked outcome list (top 3 + "+N more") inside the same shell.
- Whole card click → `/trade?event=ID`.

## Removed / parked

- `LiveStatsStrip` — superseded by Tournaments rail data; component still exists but not mounted on Home.
- `HomeMarketsSections` (v2 three-section layout: Most traded / Closing soon / New) — not mounted on Home v3. Component preserved for potential reuse.
- Top `CampaignBannerCarousel` — still gone from Home top.
- Generic priority-sorted feed (`HomeFeed` + `useHomeFeed`) — not mounted by `MobileHome`.

## State branches

| State | Greeting subline | Equity | Position alert | Onboarding | Top Events title | Interlude |
|---|---|---|---|---|---|---|
| Guest | "Hello, there" | hidden | hidden | hidden | "Top Events" | `TrialCallout` between card 2 and 3 |
| Authed no positions | "Hello, USERNAME" | shown | hidden | shown | "Pick your first prediction" | none |
| Authed with positions | "Hello, USERNAME" | shown | shown (top) | shown | "Top Events" | none |

## Components

- `src/components/home/HomeGreeting.tsx`
- `src/components/home/HomeSearchBar.tsx`
- `src/components/home/HomeTournamentsRail.tsx`
- `src/components/home/HomeTopEvents.tsx`
- `src/components/home/HomeMatchCard.tsx` (D-class card)
- `HomeStatusStrip` — kept; authed-only.
