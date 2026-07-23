---
name: home-feed-architecture
description: Home feed 3-tier visual hierarchy, same-kind degradation, and useHomeFeed scoring formulas
type: feature
---
# Home Feed Architecture

Home is a priority-sorted single-column information stream. All ordering lives in `useHomeFeed`; `HomeFeed.tsx` is a pure renderer mapping `kind` → Card.

## 3-Tier Visual Hierarchy (FeedCard props)

All cards share `rounded-2xl border-border/40 bg-card`. Differences:

| Tier | Who | Padding | Accent | Title |
|------|-----|---------|--------|-------|
| 1 personal | OnboardingCard, WelcomeBackCard, PositionAlertCard | p-4 + 2px left bar | accent bar (primary/green/red) | text-sm font-semibold |
| 2 opportunity | SettlingSoonCard, WatchlistMoveCard, AirdropOpportunityCard | p-4 | trading-yellow on meta only | text-sm font-medium |
| 3 browse | TrendingCard, NewListingCard, LearnCard | p-3.5 | none | text-[13px] not bold, prices text-foreground/80 |

**Tier 1 cap**: at most 1 visible at a time (highest score wins).

**Compact mode** (2nd+ consecutive same-kind item): `compact=true` → hide tag, `p-3`.

**Force first slot ≥ tier 2**: if top item is tier 3, promote highest tier-2 candidate; else upgrade first trending to `tier=2` visually.

## Scoring (useHomeFeed)

| Kind | Base | Weight |
|------|------|--------|
| positionAlert | 1000 | + severity × 100 (severity = floor(absPct/10), capped 5) |
| onboarding | 900 | only S0/S1 |
| welcomeBack | 850 | only S2/S3 |
| airdropOpportunity | 800 | when pendingAirdrops > 0 |
| settlingSoon | 600 | + (24 − hoursLeft) × 10 |
| watchlistMove | 500 | + log10(volume) × 5 (24h delta wiring later) |
| trending | 200 | + log10(volume) × 10 |
| newListing | 150 × decay | linear decay over 48h since created_at |
| learn | 50 | static fill, removed when feed has ≥ 8 real items |

## Triggers

- positionAlert: any `usePositions()` row with `|pnlPercent| ≥ 10%`
- settlingSoon: `end_date` within next 24h
- watchlistMove: event in `useWatchlist()`
- airdropOpportunity: `useAirdropPositions()` has rows with `status === "pending"`
- newListing: `created_at` within last 48h

## Caps

- Authed total: 12; Guest total: 8
- Same `eventId` only appears once across kinds (highest score wins via dedupe step)

## Rendering Contract

Every card accepts `compact?: boolean` and respects it. Cards render `null` when their data source disappears (defensive against stale items).
