---
name: Lite list badges v2 + live sort
description: Two-track badge system (Ends soon / New / Trending + Boost) on Lite list cards and the three-step live list sort order; thresholds in src/lib/liteListBadges.ts
type: design
---

# Lite list badges v2 + live sort (LOCKED 2026-07-31)

Config-like thresholds live ONLY in `src/lib/liteListBadges.ts` → `LITE_LIST_CONFIG`.
All icons are Lucide components; emoji glyphs are forbidden in rendered DOM.

## Badges (image tile, top-left, horizontal stack, max 2)
Fill order: STATUS -> Intraday -> Boost. Anything past the 2-slot cap is dropped, Boost first.
| Track | Badge | Condition | Style | Icon |
|---|---|---|---|---|
| STATUS (max 1) | `Ends {Xh Ym}` | settles < 4h | amber `--trading-yellow`, ink `#241B00`, minute precision, 60s tick | Clock |
| STATUS | `New` | created < 24h | Pulse Blue `--yes`, ink `#04222c` | — |
| STATUS | `Trending` | 24h vol in top 20% of loaded live set; skipped if < 5 live events | white, ink `#0A0B0D` | Flame |
| ATTRIBUTE | `Intraday · {Xh Ym}` | opens and settles inside the same trading day (settle date == live date; `isDailyStockEvent` slug detector as fallback) | SOLID orange `--badge-intraday` (#FF8A3D), ink `#2A1200`; label carries its own countdown to settle, minute precision, 60s tick | Timer |
| ATTRIBUTE | `Boost {max}×` | contract events, maxBoost ≥ 2; spot never | Volt Green `--no`, ink `#1a2408` | Zap |

STATUS priority fixed and exclusive: Ends soon > New > Trending.

**Intraday exemption (v2, 2026-07-31):** intraday events are EXEMPT from `New` and `Ends soon` (a daily event is always new in the morning, always ends-soon in the afternoon). Their only allowed status is `Trending`. Assertion: amber Ends-soon and orange Intraday can NEVER co-occur. Lives in `statusBadgeFor()`, badge-rendering only — `sortLiteLiveList` still orders intraday events by real settle time under the <4h rule. Combos: [Trending + Intraday·countdown], [Intraday·countdown + Boost], [Intraday·countdown].

**Band amendment (2026-08-03):** the `Intraday` badge no longer appears in the list grid — intraday events are excluded from the grid and live only in the Intraday band (mem://design/lite-intraday-band). Its rules stay defined for any future intraday event that is not band-homed. `sortLiteLiveList` is unaffected.

Same logic on All / every sector filter / watchlist. Settled cards are NOT part of this system.

## Live list sort (`sortLiteLiveList`)
1. < 4h to settle first, ascending by time-to-settle.
2. Rest by 24h volume (fallback total volume) descending.
3. New (< 24h) events ranked below position 6 are lifted into the top 6, relative order preserved, never displacing an Ends-soon event.

Applies to "All" and to each sector filter (scoped to the filtered set). Watchlist keeps the user's own order. Settled list unchanged.
