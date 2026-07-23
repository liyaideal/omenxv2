---
name: Voucher granted frosted reveal
description: Layout rules for the granted-state voucher card — scarcity bar in the top zone plus a frosted-blur bottom zone with a floating Tap to claim CTA
type: design
---

## When

Applies ONLY to `VoucherCard` `compact` mode with `voucher.status === "granted"`. Claimed / redeemed / settled / expired cards are unaffected.

## Top zone

- Face value (`font-mono text-4xl`) left, `Expires {countdown}` chip right (`Clock` icon + muted mono)
- Scarcity row directly below (see `mem://features/voucher-daily-pool` for tier rules):
  - Line 1: `{remaining} / {total} left today` (left) + `Resets in {Xh Ym}` (right), both `text-[10px] font-mono`
  - Line 2: `h-1` progress bar, width = `remaining / total`, tier-colored
- Sold out: progress bar replaced with single centered line `Lock + "Sold out today · resets in {Xh Ym}"`

## Perforation

Unchanged from claimed state — dashed border with two background-colored circles as side notches.

## Bottom zone (frosted reveal)

- Symmetric two-column layout: `Voucher code` (left) + `Max profit` (right), mirroring claimed-state layout
- BOTH values rendered but with `blur-[5px] select-none opacity-70` — they're visually present but unreadable, giving "about to unlock" feel
- Centered floating pill button overlays the blurred row:
  - Default: `bg-primary text-primary-foreground` + `Gift` icon + `Tap to claim` + `shadow-[0_0_24px_hsl(var(--primary)/0.45)]`
  - Claiming: same shell, label `Claiming…`, disabled
  - Sold out: `bg-muted text-muted-foreground border border-border` + `Lock` icon + `Sold out`, disabled, no glow
- Pill uses `pointer-events-auto` inside a `pointer-events-none` absolute wrapper so the blurred values don't intercept clicks

## Why not show the code outright?

The frosted blur creates a "sealed gift" ritual — the user pays attention to the claim action because the reward is one tap away from being revealed. Showing the code upfront flattens the moment.

## Anti-patterns (do NOT do)

- Don't render the granted card with the same bottom layout as claimed (no blur) — that defeats the reveal
- Don't move the scarcity bar to the bottom zone — it belongs above the perforation as a "supply context" signal
- Don't add a second CTA outside the pill — the floating pill is the single conversion point
- Don't animate the pill on hover with scale transforms — only the glow shadow intensifies
