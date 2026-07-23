> 本文档覆盖 2026-05-25 完成的安全扫描整改：基于 Lovable Security Scanner 的发现项，对 `transactions` 客户端 INSERT、`profiles.totp_secret` 明文存储、Realtime 通道授权三项高危发现执行硬化重构；同步新增多个 field-locking trigger 限制客户端直接修改关键字段。研发实施时务必跟随本文 §3 数据库、§4 Edge Functions、§5 客户端三块同步落地，单独落任意一层都会破坏安全闭环或导致前端调用失败。

## 1. 功能目标

- 关键写入路径全部收敛到 service_role（Edge Function），客户端只能 select 自己的数据。
- 关键状态字段（balance / points_awarded / claimed_at / status / 余额相关）禁止前端通过 RLS update 直接修改，由 trigger 拦截。
- TOTP secret 移出 `profiles` 表，迁到只有 service_role 可读写的 `user_security` 表。
- Realtime postgres_changes 仅授权给 authenticated 角色；anon 不能订阅。
- 内部 trigger 函数取消 PUBLIC / anon / authenticated 的 EXECUTE 权限。

## 2. 高危发现项处置状态

| 发现项 | 状态 | 处置方式 |
|---|---|---|
| `transactions` 缺少 update policy / 客户端可任意 INSERT | ✅ Fixed | 删除客户端 INSERT policy；改走 `record-transaction` Edge Function |
| `profiles.totp_secret` 明文暴露给客户端 | ✅ Fixed | 拆出 `user_security` 表，drop 列；改走 `totp-manage` Edge Function |
| `realtime.messages` 无 RLS | ✅ Fixed | 启用 RLS，只允许 authenticated 接收 postgres_changes |
| `points_account` 客户端可改 balance | ✅ Fixed | `enforce_points_account_user_update` trigger 拦截 |
| `user_tasks` 客户端可改 status / claimed_at | ✅ Fixed | `enforce_user_task_user_write` trigger 拦截 |
| `referrals` 客户端可改 status / 字段 | ✅ Fixed | `enforce_referral_user_update` trigger 拦截 |
| `points_redemptions` 客户端可直接 insert | ✅ Fixed | drop INSERT policy；改走 `redeem-points` Edge Function |
| 内部 trigger 函数 PUBLIC EXECUTE | ✅ Fixed | revoke EXECUTE from PUBLIC / anon / authenticated |

## 3. 数据库改动

### 3.1 新表 — `public.user_security`

| 字段 | 类型 | 说明 |
|---|---|---|
| `user_id` | uuid PK / FK auth.users(id) on delete cascade | 关联用户 |
| `totp_secret` | text nullable | TOTP 共享密钥，**只允许 service_role 访问** |
| `created_at` / `updated_at` | timestamptz | 标准时间字段 |

- 启用 RLS，**不创建任何 client policy** — 即 anon / authenticated 完全无法 select/insert/update/delete。
- 历史 `profiles.totp_secret` 数据通过 migration 一次性迁入。

### 3.2 `profiles` 表

- `DROP COLUMN totp_secret;`（迁完之后立即删除）。
- `totp_enabled`、`withdraw_2fa_mode` 字段保留（用于开关与提现验证模式）。

### 3.3 `transactions` 表

- DROP 客户端 `INSERT` policy。
- 保留 `SELECT` policy：仅 `auth.uid() = user_id` 可读自己的流水。
- 任何 INSERT 必须经由 `record-transaction` Edge Function（service_role）。

### 3.4 `points_redemptions` 表

- DROP 客户端 `INSERT` policy。
- 全部 redemption 必须经由 `redeem-points` Edge Function。

### 3.5 Field-locking triggers（新增）

| Trigger | 目标表 | 作用 |
|---|---|---|
| `enforce_points_account_user_update` | `points_account` | 非 service_role 的 UPDATE 若试图修改 `balance` / `lifetime_earned` 等关键字段则 RAISE EXCEPTION |
| `enforce_user_task_user_write` | `user_tasks` | 拦截 client 直接改 `status` / `claimed_at` / `points_awarded` |
| `enforce_referral_user_update` | `referrals` | 拦截 client 改 `status` 等关键字段 |

所有 trigger 都通过 `current_setting('request.jwt.claims', true)::jsonb ->> 'role'` 判断角色，service_role 通行，其他拒绝。

### 3.6 Realtime RLS

- `ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;`
- Policy：仅 `authenticated` 可接收 `postgres_changes`（实际行级权限仍由对应业务表 RLS 兜底）。
- anon 不能订阅任何 channel。

### 3.7 内部 trigger 函数权限

对 `handle_new_user`、`update_updated_at_column` 等内部函数：

```sql
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
```

仅 service_role / trigger context 可执行；公开调用入口（如 `has_role`、`lookup_referral_code`）按 SECURITY DEFINER 设计保留 authenticated EXECUTE。

## 4. Edge Functions

### 4.1 `record-transaction`（新增）

- 入参（POST body）：`{ type, amount, status, network?, tx_hash?, metadata? }`
- 校验：`type ∈ {deposit, withdraw, fiat_buy, fiat_sell, cross_chain_in, cross_chain_out}`；`status ∈ {pending, processing, completed, failed}`；`amount` 数值合法。
- 内部用 service_role 执行 INSERT，并返回新行 `id` 给前端用作状态追踪。
- 失败返回 4xx，不写库。

### 4.2 `totp-manage`（新增）

- 入参（POST body）：`{ action: 'enable' | 'disable', secret?, otp? }`
- `enable`：校验 6 位 OTP；写入 `user_security.totp_secret`；同步 `profiles.totp_enabled = true`。
- `disable`：清除 `user_security.totp_secret`；同步 `profiles.totp_enabled = false`；若 `withdraw_2fa_mode` 依赖 TOTP，自动回落 Email。
- 全程 service_role；客户端永不接触 secret。

### 4.3 `redeem-points`、`claim-task`、`claim-treasure`

- 已存在；本次只是关闭客户端直接 INSERT 的旁路，保证唯一入口。

## 5. 客户端改动

### 5.1 提交流水（取代直 INSERT）

- `src/hooks/useWithdraw.ts` — `submitWithdrawal` 校验通过后改 `supabase.functions.invoke('record-transaction', { body: { type: 'withdraw', amount: -X, status: 'processing', network, ... } })`，用返回的 `id` 替代本地 `wd-${Date.now()}`，并 `queryClient.invalidateQueries(['wallet-fund-transactions'])`。
- `src/components/TopUpDialog.tsx` — 同样改走 `record-transaction`。
- 其他直 insert transactions 的地方（`PendingConfirmations` 等）一并迁移；前端不再直接 INSERT。

### 5.2 TOTP 流程

- `src/hooks/useUserProfile.ts` — `Profile` 类型移除 `totp_secret`；`enableTotp` / `disableTotp` 改 `supabase.functions.invoke('totp-manage', { body: { action, otp, secret } })`。
- `src/components/settings/AccountSecurityCard.tsx`、`Setup2FADialog.tsx`、`WithdrawalVerificationCard.tsx` — 全部通过 hook，不直接访问 secret。

### 5.3 类型同步

- `src/integrations/supabase/types.ts` — Supabase 自动重生成；`profiles` 不再有 `totp_secret`，新增 `user_security` 表类型，研发同步引用即可。

## 6. 已删除 / 已废弃

| 项 | 说明 |
|---|---|
| `profiles.totp_secret` 列 | 拆到 `user_security`，禁止再用 |
| `transactions` 客户端 `INSERT` policy | 全部走 `record-transaction` |
| `points_redemptions` 客户端 `INSERT` policy | 全部走 `redeem-points` |
| 客户端直接 `from('transactions').insert(...)` 任何调用 | 改 `functions.invoke('record-transaction')` |
| 客户端直接读 `totp_secret` 任何调用 | 通过 `totp-manage` 间接操作 |
| 公共角色对内部 trigger 函数的 EXECUTE 权限 | 已 REVOKE |

## 7. Style Guide 参考

本次为后端 / 安全加固，不引入新 Style Guide playground。已有的 `/style-guide` Wallet / Forms section 不受影响。

## 8. 涉及文件

**Edge Functions**
- `supabase/functions/record-transaction/index.ts`（新增）
- `supabase/functions/totp-manage/index.ts`（新增）
- `supabase/functions/redeem-points/index.ts`（已存在，明确为唯一入口）

**数据库 Migrations**
- `supabase/migrations/20260525032849_*.sql` — field-locking triggers + revoke EXECUTE
- `supabase/migrations/20260525032901_*.sql` — `points_redemptions` INSERT policy 收紧
- `supabase/migrations/20260525033424_*.sql` — `user_security` 表 + 数据迁移 + drop `profiles.totp_secret` + `transactions` INSERT policy 收紧 + `realtime.messages` RLS

**前端**
- `src/hooks/useWithdraw.ts`
- `src/hooks/useUserProfile.ts`
- `src/components/TopUpDialog.tsx`
- `src/integrations/supabase/types.ts`（自动生成）

**记忆**
- `security-memory` 更新：服务端唯一入口规则、`user_security` 表设计、关键状态转换必须经 Edge Function 的约束。

## 9. 未变更项

- `has_role` / `lookup_referral_code` 等 SECURITY DEFINER 函数对外暴露形态未变。
- RLS SELECT policy（用户读自己数据）未变。
- 业务表结构（`transactions` 列、`profiles` 其他列、`user_tasks` 字段等）未变。
- 余额结算、PnL、订单流程等业务逻辑零改动。
- Withdraw 二次验证（Email / TOTP / Both）流程未变；本次只是把 transactions 入库改成 service_role。
