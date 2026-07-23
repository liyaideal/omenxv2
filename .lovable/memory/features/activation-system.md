---
name: activation-system
description: Mainnet user activation funnel — state machine + checklist + Logo MAINNET badge. Drives deposit→first-trade conversion.

type: feature
---

# Mainnet Activation System

## North-star metric
% of logged-in users completing first Deposit.

## State machine (`useActivationState`)
- `GUEST` — not logged in
- `S0_NEW` — logged in, no `transactions` row with `type=deposit, status=completed`
- `S1_DEPOSITED` — has completed deposit, no `trades.status=Filled` since `MAINNET_LAUNCH_START`
- `S2_TRADED` — has mainnet filled trade but volume < `FIRST_TRADE_VOLUME` ($5k)
- `S3_ACTIVE` — volume ≥ $5k → all activation UI hidden

State drives `nextStepHref` / `nextStepLabel` and component visibility.

## Surfaces
- **`ActivationChecklist`** — 3-step persistent card (verify ✓ / deposit / first trade). Mounted in `MobileHome` below CampaignBannerCarousel. Hidden for GUEST/S2/S3.

- **`DepositActivationHint`** — Thin success bar above Deposit page tabs, S0 only.
- **`MainnetBadge`** + `Logo.showMainnetBadge=true` — permanent brand signal in all headers, independent of activation state.

## Constraints
- No new modals — Checklist + Hub avoid stacking with H2E Welcome Gift / AirdropHomepageModal.
- No cash rewards (no first-deposit bonus). Hook value = unlocking Mainnet Launch Campaign tracking only.
- Reuses `useMainnetLaunchProgress`, `MAINNET_LAUNCH_START`, `FIRST_TRADE_VOLUME` — no schema changes.

## Future (PR2)
- `FirstTradeToast` (one-shot localStorage `first_trade_toast_seen_v1`) on filled-trade realtime event.
- "Step 0" card on `MainnetLaunch` before tier ladder.
- `useHomeModalQueueStore` to coordinate H2E + Airdrop modals.
