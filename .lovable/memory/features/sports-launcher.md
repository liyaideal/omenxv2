---
name: Sports launcher (floating cross-product entry)
description: Desktop-only floating bottom-left pill linking to OmenX Sports during the World Cup window. Mobile entry is owned by BottomNav.
type: feature
---

## Purpose
Persistent floating CTA so **desktop** users on the main OmenX site can jump to OmenX Sports
without changing the header. Header (including the MAINNET chip) is intentionally untouched.

## Desktop / mobile split (hard rule)
- **Desktop (≥md)**: SportsLauncher (left-bottom pill) + WorldCupPortal (right-bottom Teaser/Live panel) both render.
- **Mobile (<md)**: NEITHER renders. The mobile Sports entry is owned by `BottomNav` and is maintained separately. Do NOT add a mobile-collapsed variant to SportsLauncher, and do NOT mount WorldCupPortal on a mobile-only page.
- Enforcement:
  - `SportsLauncher` container has `hidden md:block`.
  - `WorldCupPortal` wraps its phase output in `<div className="hidden md:block">`.

## Component
- `src/components/SportsLauncher.tsx`
- Fixed `bottom-6 left-6`, z-40, glass card (`bg-card/70 backdrop-blur-xl`).
- 56px tall, 210px min-width pill. No collapsed variant.
- Gold radial-gradient circle wrapping `src/assets/soccer-ball.png` + red `animate-ping` LIVE dot.
- Two-line label: `OmenX Sports` (15px bold) / `WORLD CUP · LIVE` (10px font-mono trading-yellow).
- Hover: `-translate-y-0.5`, border → `trading-yellow/40`, amber glow shadow.

## Visibility
- `isWorldCupActive()` from `src/lib/worldCup.ts` (auto-hides after 2026-07-20).
- `localStorage["sports-launcher-dismissed"]` 24h TTL (mirrors `wc2026-panel-dismissed`).
- Playground-only props: `forceShow`, `ephemeral`.

## Link target
- `https://omenx-sports.lovable.app?ref=omenx-main&src=launcher`
- Opens in new tab via `window.open(..., "_blank", "noopener,noreferrer")`.

## Mount
- Global, inside `ResponsiveLayout` in `src/App.tsx` so it appears on every main-app page
  (not on `/hedge`, `/mainnet-launch`, `/campaign-style-guide` which are landing pages).
- Desktop-only via component-level `hidden md:block`.

## Playground
- `/style-guide` → World Cup tab → "Sports launcher" section.
- PresetRail: default · hovered · dismissed. (No mobile-collapsed preset — desktop-only component.)
- Playground container overrides `hidden` so the launcher demos remain visible at any preview viewport.

## Post-tournament
- Auto-hides after `WC2026_END`. Decide then whether to repurpose as a permanent Sports
  entry point or remove. Do NOT extend this launcher to be always-on without a new design pass.
