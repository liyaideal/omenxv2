# Campaign detail rewards-card CTA fix

## Problem
The right-rail rewards card on `/rewards/campaign/:id` always shows a single button: **"Open Position Vouchers →"** that navigates to `/vouchers`. This is inconsistent because campaigns can also award **USDC**, which is credited to the wallet, not the voucher page.

## Current state (verified)
- `useCampaignViews` exposes `rewardVoucherUpTo`, `rewardUsdcUpTo`, `voucherClaimed`, `usdcClaimed` per campaign.
- `GrantTaskRow` already distinguishes reward types: voucher tasks show a **"Claim voucher"** button; USDC tasks show **"Credited to Standard after review"**.
- The detail-page rewards card currently renders one white CTA regardless of the reward mix.

## Proposed change
Make the CTA context-aware based on the campaign's reward composition, while keeping the existing card layout and visual style.

```text
reward mix                CTA behaviour
---------------------------------------------------
only vouchers             "Open Position Vouchers →" → /vouchers
only USDC                 "Open Wallet →" → /wallet
both types                two stacked buttons:
                            "Open Position Vouchers →" → /vouchers
                            "Open Wallet →" → /wallet
no rewards (edge case)    hide the CTA row
```

- For signed-out users, keep the existing **Sign in prompt card** in the rail; do not show the CTA button.
- Keep the same white button styling (`bg-white`, `text-[#0A0B0D]`, `rounded-[10px]`, `min-h-[44px]`) for the primary action.
- When two buttons appear, the second button uses a secondary outline style (`border-[#2B2F38]`, transparent background) to avoid two competing white buttons.

## Files to change
- `src/pages/lite/LiteCampaignDetailPage.tsx` — update the rewards-card CTA block.

## Out of scope
- No change to the task-row claim flow or the underlying claim Edge Function.
- No change to `/vouchers` or `/wallet` pages themselves.
- No database/seed changes.
