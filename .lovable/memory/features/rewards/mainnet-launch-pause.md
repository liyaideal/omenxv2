---
name: Rewards mainnet launch pause (redemption only)
description: Only points→trial-balance redemption is paused before mainnet. All other rewards features (tasks, treasure drop, welcome modal, entry points) are LIVE again.
type: feature
---

# Rewards mainnet launch pause (redemption only)

The full rewards pause was lifted. Only **points redemption → trial balance** is still disabled while the Beta→Mainnet conversion ratio is finalized.

## What is paused

- **`supabase/functions/redeem-points/index.ts`** returns 403 with copy "Points redemption is paused for mainnet launch. Please check back soon." Defense-in-depth: keep this server-side stop even if the client UI calls it.

The `RedeemDialog` UI in `/rewards` stays in place — clicking redeem just surfaces the 403 toast.

## What is LIVE (do NOT re-pause)

- `/rewards` page (no pause Dialog overlay)
- `FloatingRewardsButton` — navigates to `/rewards`, shows claimable badge
- `RewardsWelcomeModal` — first-visit promo for new users
- `BottomNav` profile drawer → Rewards / Referral entries
- `EventsDesktopHeader` dropdown → Rewards / Referral entries
- `useTreasureDrop` hook + `claim-treasure` edge function (mystery box accrues points)
- `claim-task` edge function (task rewards accrue points)

## Do NOT

- Do not delete `points_accounts` / `points_ledger` / `user_tasks` rows — source of truth for the eventual Beta→Mainnet conversion.
- Do not re-introduce the global rewards pause toast / dialog without explicit instruction.
