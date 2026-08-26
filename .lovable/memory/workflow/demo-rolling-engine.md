---
name: Demo rolling engine
description: roll_demo_positions() 四步机制、cron 计划、演示号名单、事件池规则、tiered 入账触发器与 mock 自愈函数位置
type: feature
---

# 演示数据滚动引擎

演示号的仓位/事件引用必须始终指向活事件，否则 demo 页面会出现空列表或指向已结算事件的死行。

## `public.roll_demo_positions()`（SECURITY DEFINER）
1. **结算过期仓**：把已过期 / 已 resolve 的 Open 仓位落为 settled。
2. **结算工具仓**：过期 trial voucher 仓与 matched / welcome airdrop 仓一并结算，遵守 H2E **$100** cap。
3. **补开仓位**：把 alex 的 Open 仓补到 **16 futures + 1 spot**（体量守恒）。
4. cron 注册（见下）。

### 事件池规则
| 分支 | 过滤 |
|---|---|
| futures | `end_date > now() + interval '6 hours'` |
| spot | `end_date > now() + interval '1 hour'`，`event_subtype IS DISTINCT FROM 'CRYPTO_QUICK_UPDOWN_SPOT'`（排除分钟级快轮），`lifecycle_status IS NULL OR IN ('ACTIVE','TRADING','EXTENDED_TRADING')` |

排除快轮的原因：分钟级快轮几分钟内就被快轮引擎结算，补开后立刻归零。
放开 `EXTENDED_TRADING` 的原因：美股日内轮盘前时段就是这个状态，否则 spot 池为 0。

幂等：重复执行第二次 `opened_spot = 0`，不重复补开。

## Cron
`roll-demo-positions` —— 每日 **05:20 UTC**。

## 演示号
| 用户 | uuid |
|---|---|
| `alex_carter`（alex.carter@gmail.com） | `2faf9a43-1ab7-47b7-919b-978c8c02b5ff` |
| `mia_reyes`（mia.reyes@gmail.com） | `aed1c1c7-c692-452d-8d7e-1792ecf1e2af` |

## Tiered voucher 入账触发器
- `trg_credit_tiered_voucher_settlement`（AFTER UPDATE OF status，SECURITY DEFINER）
- 闩锁字段：`position_vouchers.tiered_credited_at`（抢锁后才记账；亏损 / 0 也落闩锁）
- 记账：`voucher_earnings.pending_amount += settled_pnl` + ledger `type='accrual'`
- **入账单一真相源 = 触发器**；`supabase/functions/close-trial-position` 里的 tiered 入账块已删除，避免双记账。instant 路径不变（结算即入 Standard 余额）。

## 客户端 mock 自愈
`src/hooks/useAirdropPositions.ts` → `repointMocksToLiveEvents`：运行时把 mock 空投行重新指向活事件。
`mock-` 前缀行永不计入 H2E earnings（见 `features/h2e/airdropped-positions`）。
