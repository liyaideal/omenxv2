---
name: Voucher earnings unlock tiers (5 阶)
description: 5-tier unlock ladder gating claim-to-wallet for voucher earnings pool; T0 free, T1 deposit, T2/T3/T4 volume
type: feature
---

Voucher 仓位的平仓盈利只进 `voucher_earnings.pending_amount`，claim-to-wallet 走 5 档解冻：

| Tier | 解冻条件 | 累计可解冻 cap |
| --- | --- | --- |
| T0 | 无门槛（默认） | $2 |
| T1 | 链上充值累计 ≥ $10 | $5 |
| T2 | 已完成交易量 ≥ $1,000 | $10 |
| T3 | 已完成交易量 ≥ $10,000 | $20 |
| T4 | 已完成交易量 ≥ $50,000 | $50 |

规则：
- 解冻条件按数组顺序判定，凡满足的 tier 都视为已解锁，取最高 unlocked 作为 current。
- `claimable = min(pending, current.maxClaim − lifetimeCredited)`。
- 不再有 Unlimited 档；T4 后 cap 锁死 $50。

实现入口：
- `src/lib/voucherTiers.ts`（`VOUCHER_TIERS`、`deriveVoucherTierState(volume, pending, lifetimeCredited, depositTotal)`）
- `src/hooks/useVoucherEarnings.ts`（汇总 `trades(status=Filled).amount` 与 `transactions(type=deposit,status=completed).amount`）
- `supabase/functions/claim-voucher-earnings/index.ts`（服务端必须复用同样配置）
- `/style-guide` → Vouchers → Earnings card playground 穷举每档
