---
name: Revert scope and frozen components
description: Revert rolls back an entire commit (all files in that round), plus the list of frozen components that must not be touched without an explicit instruction
type: constraint
---

## Revert is whole-round
A revert in Lovable rolls back an ENTIRE commit, not one file. Any unrelated
change that happened to ship in the same round disappears with it (2026-08-06:
a revert of the settled-surface round also took the BottomNav restyle).
After any revert, re-check the reverted commit's file list and restore the
still-wanted parts explicitly — never assume only the complained-about change
was undone.

## Frozen components — do not modify without an explicit instruction
Touching these "while nearby" is an incident, not an optimisation:
- `src/components/BottomNav.tsx` (Lite items: Events / Portfolio / Wallet / Me)
- All `/rewards` surfaces as shipped 2026-08-07 — `LiteRewardsPage`,
  `LiteCampaignDetailPage`, `CampaignCard`, `CampaignKeyVisual`, `GrantTaskRow`,
  `TaskRowShell`, `ReferralPanel`, `EndedCampaignsArchive` — especially their
  mobile layouts, which the CPO authored by hand.
