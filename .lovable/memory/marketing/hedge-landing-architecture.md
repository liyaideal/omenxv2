---
name: H2E landing page architecture
description: /hedge page section order, retro-poster World Cup theme, page-scoped tokens, copy contract
type: design
---

`/hedge` is the **World Cup 2026 Hedge-to-Earn** campaign, Retro Football Poster aesthetic. It is NOT generic dark-app UI — it intentionally breaks out of the product shell visually while keeping `EventsDesktopHeader` / `MobileHeader` / `SeoFooter` intact.

## Section order (do not reorder, do not re-add deleted sections)

1. `HedgeHero` — poster frame, headline + subhead + CTA + LIVE stats strip (distributed / claimed / spots left)
2. `HedgeUpsetsStrip` — 4 hardcoded upset cards (Spain 0-0 Cape Verde / Brazil 1-1 Morocco / Belgium 1-1 Egypt / Netherlands 2-2 Japan) + "This time, give your pick a hedge" kicker. Scores marked pending business verification
3. `HedgeHowItWorks` — "A hedge for every pick" intro + two outcome cards (pick wins / pick misses) + Reassurance line + "Hedge in 3 steps" (Connect / Open your hedge / Redeem)
4. `HedgeKeyRules` — Eligibility (size ≥ 20U, held ≥ 1 day) + matching rule + caps (3 hedges, 500U total)
5. `HedgeRewardTiers` — Tier 1 / Tier 2 / Top tier (up to 500U), each with `*not guaranteed` footnote
6. `HedgeFAQ` — 4 questions: free money / what if hedge loses / 500U guaranteed / why connect Polymarket
7. `HedgeFinalCTA` — sticker CTA + campaign window + full Disclaimer block

## Deleted — do NOT recreate

`HedgeRecentActivity.tsx`, `HedgeFoundersNote.tsx`, `HedgeSocialProof.tsx`, `HedgeLiveExample.tsx`, `HedgeTrustBar.tsx`, `HedgeCampaignRules.tsx`.

## Page-scoped design tokens (NOT in tailwind/index.css)

| Token | Hex | Use |
|---|---|---|
| Paper | `#FDFCF0` | Page + frame bg |
| Ink | `#0E0E0E` | Borders, body type, scoreboard bg |
| Sticker red | `#E11D48` | Urgency stickers, top-tier accent, hero red shadow |
| Field blue | `#1D4ED8` | CTA fill, trust accents, headline accent |
| Flag yellow | `#FACC15` | Step badges, secondary shadow, highlights |

Font: `Archivo Black` (`@fontsource/archivo-black`) via Tailwind `font-display`. Body stays Inter.

Hard-shadow spec — desktop `8px` ink border + `12px/12px` offset; mobile `4px` border + `6px/6px` offset. Shadow color encodes section identity (red = urgency, blue = trust, yellow = reward).

Shared container: `HedgePosterFrame` with `shadow` ∈ red/yellow/blue/ink, `size` ∈ lg/sm, `noise` boolean.

## Copy contract

Headline / Subhead / CTA / pain / steps / rules / tiers / FAQ / disclaimer are 1:1 from `OmenX_WorldCup_H2E_LandingCopy.md`. Every monetary figure (500U, each tier cap) MUST carry a `*not guaranteed` footnote — locked by Core rule.

CTA label: `Connect Wallet & Open Your Hedge` (guest) / `Open Your Hedge` (authed) / `View My Hedges` (has hedges). Loading + Campaign-ended states exist in `HedgeCTAButton` via `stateOverride` (playground only) or runtime auth.

## Style Guide coverage

`/campaign-style-guide` → Playground → "Retro Poster · WC H2E" tab exhaustively covers: tokens, PosterFrame (shadow×size×noise), CTA (5 states), Reward Tier (3 states). Any new state added in production MUST be mirrored there — Core rule.
