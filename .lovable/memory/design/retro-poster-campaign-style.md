---
name: Retro Poster campaign style
description: Page-scoped retro football poster tokens & primitives used on /hedge (World Cup H2E). Hard ink borders, offset hard shadows, ink stickers, display type, paper bg.
type: design
---

Reserved for **cultural-moment / sports / seasonal** campaigns that need to escape the dark-app default (currently only `/hedge`).

## Palette (NEVER add to tailwind/index.css)

- `#FDFCF0` Paper · page + frame bg
- `#0E0E0E` Ink · all borders, body type, scoreboard bg
- `#E11D48` Sticker red · urgency, top-tier accent, red hard-shadow
- `#1D4ED8` Field blue · primary CTA, trust accents, headline accent
- `#FACC15` Flag yellow · step badges, secondary hard-shadow

## Typography

- Display: `Archivo Black` via `font-poster` (Tailwind), `@fontsource/archivo-black`. Always UPPERCASE, tight tracking.
- Body: Inter (project default)
- Mono caps: JetBrains Mono, `text-[10-12px] uppercase tracking-[0.2em]`

## Border + hard-shadow spec

| Surface | Border | Offset | Default shadow color |
|---|---|---|---|
| Hero / Final CTA (desktop) | 8px ink | 12/12 | red |
| Outcome / tier cards (desktop) | 8px ink | 12/12 | alternate blue / yellow |
| Any frame (mobile) | 4px ink | 6/6 | inherit desktop |

Pressed buttons flatten: `border-b-[10px]` → 3 + `translate-y-[7px] translate-x-[7px]`.

## Primitives (page-scoped — do not export to product)

- `HedgePosterFrame` — container; `shadow`/`size`/`noise` props
- `HedgeCTAButton` — push-button with 5 states (`connect` / `open-hedge` / `view-hedges` / `loading` / `ended`)
- `HedgeRewardTierCard` — tier card with 3 states (`locked` / `unlocked` / `claimed`)

## Hero composition (locked)

- Asymmetric Split Poster: desktop two-column upper band — **65% copy / 35% graphic** — with a full-width black stats strip pinned to the bottom of the poster frame.
- Right graphic column uses `bg-[#F3F2E7]` + radial-dot texture (`#0E0E0E` at ~20% opacity, 18px grid) so the target/football graphic never floats on dead space.
- Below `lg` breakpoint: hide the graphic column entirely; copy + CTA stack and the stats strip stays 3-up.
- Stats strip is a sibling of the upper band, NOT nested inside the copy column.

## Evidence strip (locked) — `HedgeUpsetsStrip`

- **Two-layer narrative, never duplicate data dimensions.**
  - Ticker = "what happened" — 4 upset scores, auto-scrolling black bar, mono yellow on `#0E0E0E`, height 40px, `@keyframes hedge-ticker` (40s linear infinite, translateX 0 → -50%, content duplicated for seamless loop).
  - Ledger = "how bad" — 4 newspaper-style rows of *different* metrics (liquidated $, positions wiped, odds collapse, favorite win %). Layout: `grid md:grid-cols-[200px_1fr_1fr]`, `border-b border-[#0E0E0E]/15`, red mono label / `#1D4ED8` display number / mono note.
- **No `HedgePosterFrame` here** — frames signal "tappable poster"; this module is editorial evidence only. No `onClick`, no link, no hover state.
- Mobile: ticker stays full-width, ledger collapses to single-column rows stacked label → number → note.

## Anti-patterns (do NOT)

- Use these tokens in any product page outside `/hedge`
- Replace with Web3 purple gradients, dark stacked cards, emoji, AI-rendered illustrations, glassmorphism
- Skip the `*not guaranteed` footnote on any monetary figure
- Add a state to any retro primitive without mirroring it in `/campaign-style-guide` → Retro Poster tab
- Repeat the same data dimension across ticker + ledger in `HedgeUpsetsStrip` — they must be complementary (event vs. consequence)
- Wrap `HedgeUpsetsStrip` rows in `HedgePosterFrame` or any clickable surface

