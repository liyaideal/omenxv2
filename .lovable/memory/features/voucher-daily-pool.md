---
name: Voucher daily pool
description: Every UTC day each face value has a fixed quota of vouchers that can be granted to new users; powers the scarcity bar on granted voucher cards
type: feature
---

## Pool quotas (per UTC day)

| Face value | Daily quota |
|---|---|
| $10 | 1000 |
| $25 | 500 |
| $50 | 100 |

Hard-coded inside `public.ensure_voucher_pool_today()`. To change quotas, edit that function via migration.

## Reset

Resets at UTC 00:00 every day. No cron needed — `ensure_voucher_pool_today()` is called lazily by `get_voucher_pool_today()` and `consume_daily_voucher_pool()`, which auto-inserts today's rows on first touch.

## Consumption

`handle_new_user` loops over `[10, 25, 50]`. For each face value it calls `consume_daily_voucher_pool(face_value)` which atomically does `UPDATE ... SET claimed_count = claimed_count + 1 WHERE claimed_count < total_quota`. If the update affects 0 rows (pool exhausted), the voucher is **skipped** for that user — no fallback, no replenish. New users may receive 0, 1, 2, or 3 vouchers depending on what's left that day.

## Reading the pool

Frontend uses `useVoucherDailyPool()` hook:
- Calls RPC `get_voucher_pool_today` (publicly executable)
- Subscribes to `voucher_daily_pools` Realtime channel
- Refetches every 60s as a safety net
- Exposes `byFaceValue(faceValue)` → `{ remaining, totalQuota, resetsAt, ... }`

## Scarcity tiers (drives `VoucherCard` granted bar styling)

| Remaining ratio | Tier | Bar color | Text tone |
|---|---|---|---|
| `> 50%` | comfortable | `bg-muted-foreground/60` | `text-muted-foreground` |
| `25% – 50%` | warning | `bg-foreground` | `text-foreground` |
| `< 25%` | urgent | `bg-trading-red` + `animate-pulse` | `text-trading-red` |
| `= 0` | soldOut | (bar replaced by `Lock + "Sold out today · resets in Xh Ym"`) | `text-muted-foreground` |

Tier logic centralised in `getScarcityTier()` in `useVoucherDailyPool.ts`.

## CTA behaviour when sold out

`Tap to claim` pill swaps to disabled `Lock + Sold out`. Card opacity drops to 80%, border softens to `border-border/60`. Claimed-state vouchers (already granted to other users) are not affected — pool only gates new granting.
