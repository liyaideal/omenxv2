# 2026-07-28 · R3b-2 round 5 — Boost selector, auto-close slots, binary netting

## W1 · Boost selector
- `LiteBoostSelector`: single-line chips (no `none` sub-label, no invisible spacer), caption is now `Up to {maxBoost}×`, `categoryLabel` prop removed (leverage is no longer conceptually tied to category).
- Custom tray replaced the up-to-50-button grid with a slider (2..maxBoost) + numeric input, two-way synced and clamped. Tray still expands in place.
- `boostTiers(max)` rewritten around the fixed pool `[2,3,5,10,20,50]`: ≤3 candidates → `[1,...C]`, otherwise `[1, 2, m, L]` with `m` closest to `sqrt(2·max)`. Fixtures documented in-code (2→[1,2] … 50→[1,2,10,50]).

## W2 · Est. auto-close never vanishes
- Order card row always rendered: `—` (no amount) / `None` (1×) / `≈ price` / `None at this balance`.
- Your-position 4th cell always rendered; grid stays `grid-cols-4`. `mode:"existing"` math untouched.

## W3 · Binary net position (APPROVED ENGINE CHANGE — `tradingService.executeTrade`)
- New buy-side-only branch `tryNetBinaryOppositeLeg`: triggers only for binary events (2 `event_options`) where the user holds an open **futures** long on the other outcome. Reduces that leg at `1 − price`, releases proportional margin, realizes PnL, and opens/merges the remainder. Opening margin validated against the remainder only; fee unchanged. `balanceDelta = −(marginUsed + fee) + marginReleased + realizedPnl`.
- **Pro buy-flow on binary events now nets too** (approved). Sell path, same-option long-vs-short reduce logic, spot, and multi-outcome events are byte-for-byte unchanged.
- Lite order panel shows a quiet notice when the selected side is opposite the held side.
- Memory `features/cross-zero-prohibition.md` rewritten to match.

## W4 · Visual fixes
- Lite contract + Lite spot desktop containers now use the header geometry `mx-auto w-full max-w-7xl px-4 lg:px-6`; right rail fixed at 380px.
- "If you're right, you win" row: tint removed, hairline separator, value promoted to 18px mono semibold.
- Orphaned `{yesLabel} {yesPct}¢` context line under the h1 deleted (duplicate of the sentiment bar).

## W5 · YourPosition rework
- Header pills and "Manage in Portfolio →" replaced by a single `{side} · {n}× Boost` title line.
- Footer `Cash out` button opens the new `LiteCashOutFlow` (Dialog desktop / MobileDrawer mobile) with 25/50/100 chips + slider, live `You get back ≈ $X`, routed to `closePosition` / `partialClosePosition`.
- `heldPos` picks the largest-margin open futures leg when legacy hedged data exists.
