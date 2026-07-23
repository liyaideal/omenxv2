---
name: World Cup 2026 portal
description: Persistent floating panel docked bottom-right during the World Cup window, linking to OmenX Sports station
type: feature
---

## Window
- **Start:** 2026-06-11 20:00 UTC (Mexico vs South Africa, Estadio Azteca kickoff)
- **End:** 2026-07-20 04:00 UTC (after the July 19 final)
- Constants in `src/lib/worldCup.ts` (`WC2026_START`, `WC2026_END`, `isWorldCupActive`).

## Component
- `src/components/world-cup/WorldCupPanel.tsx` — mounted at page level in `MobileHome.tsx` and `EventsPage.tsx`.
- Single state (no collapsed pill). Auto-hides when outside window OR dismissed.
- Visual: gold→green→blue gradient border, Bebas Neue title (gold gradient), Anton 4xl score, red LIVE pulse, broadcast lower-third energy. Locked spec — do not soften back into "finance terminal" minimalism.

## Link target
- `https://omenx-sports.lovable.app?ref=omenx-main&src=wc-panel`
- Opens in new tab via `window.open(..., "_blank", "noopener,noreferrer")`.

## Dismiss
- × button writes `wc2026-panel-dismissed = Date.now()` to localStorage.
- Re-appears after 24h TTL.

## Data
- Hardcoded `featuredMatches` in `WorldCupPanel.data.ts` for launch.
- Designed to be swapped for a fetch to OmenX Sports' public matches endpoint later.

## Playground
- `/style-guide` → World Cup tab — PresetRail covers: live+upcoming / pre-match / between-matches / single-live.

## Post-World-Cup
- Panel auto-hides after `WC2026_END`. The permanent Sports entry point is a separate follow-up (do not extend this panel to live past the tournament).
