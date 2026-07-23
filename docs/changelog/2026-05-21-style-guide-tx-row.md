# 2026-05-20 迭代 — 交付说明

> 本批次合并三个独立 feature：
> - **Recovery 流程简化**（v1→v2，状态机收敛）
> - **Settings 安全模块重构 + Withdraw 二次验证（2FA）接入**（新 feature）
> - **Transaction History 移动端排版重构**（含 Withdraw 流水落库修复）
>
> 研发以本文档为准。原 `SecurityCard` 已删除，原 `respondToQuote` 报价分支已废弃。

---

## 1. 功能目标

| 模块 | 目标 |
|---|---|
| Recovery v2 | 删除「报价 / 等待审核 / 中间态」流程，全部收敛到 `submitted / completed / rejected` |
| Withdraw 2FA | 用户可在 Settings 选择提现验证方式（Email / Authenticator / 双因子），提交提现前强制完成 |
| Transaction History 移动端 | 解决 390px 下信息全挤一行被截断的问题；同步把规范写入 DESIGN.md |
| Withdraw 流水 | 提交一笔提现立即出现在 /wallet Transaction History |

---

## 2. Recovery v2（简化）

详见独立文档《错链充值找回 — 交付说明 v2》。本批次的差量改动：

- `RecoveryForm`、`RecoveryStatusTimeline`、`useRecoveryRequests`、`RecoveryRequest`、`RecoveryRequestDetail` 全部按 v2 状态机重写
- 详情页 "Contact support" 由 mailto 改为跳 **Discord**（`discord.gg/qXssm2crf9`，新标签页）
- Style Guide 加入 Recovery Status playground

---

## 3. Withdraw 二次验证（2FA）

### 3.1 数据模型（migration `...094029_*.sql`）

`public.profiles` 新增 2 列：

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `totp_enabled` | boolean | false | 是否绑定了 Authenticator |
| `withdraw_2fa_mode` | text | `'email'` | `email` / `totp` / `both` |

### 3.2 Settings 卡片重构

旧的单张 `SecurityCard` 拆成两张职责清晰的卡片：

| 卡片 | 文件 | 职责 |
|---|---|---|
| Account Security | `AccountSecurityCard.tsx` | 账户级凭据。当前只暴露 TOTP 绑定 / 解绑；预留后续登录 2FA、改密、API Key |
| Withdrawal Verification | `WithdrawalVerificationCard.tsx` | 提现专属偏好，三选一 |

Email 绑定继续由 Settings 上方现有的 Email Address 卡片管理，**不复用到这两张新卡**。

#### Withdrawal Verification 选项规则

| 模式 | 前置条件 | 未满足时 |
|---|---|---|
| Email only | 已绑邮箱 | Toast 提示去上方 Email Address 卡绑邮箱 |
| Authenticator only | `totp_enabled = true` | 内联打开 `Setup2FADialog`，绑定成功后自动写回 |
| Email + Authenticator | 两者都满足 | 缺哪个补哪个 |

未配置任何凭据时，卡片顶部显示黄色 Warning bar，全部选项禁用。
TOTP 已启用时，Account Security 卡显示绿色 "Enabled" badge + Disable 按钮；
Disable 时若当前提现模式依赖 TOTP，自动回落到 `email` 并 Toast 告知。

### 3.3 Withdraw 验证流程

**入口：** `WalletWithdraw` 点击 Submit → 先读 `withdraw_2fa_mode` → 打开 `WithdrawVerifyDialog` → 验证通过后才真正提交。

**`WithdrawVerifyDialog.tsx`：**
- 桌面用 Dialog，移动端用 MobileDrawer（遵循 desktop-overlay-conventions）
- Header：标题 + subtitle（说明当前验证目的）+ 右上关闭按钮，**与 step 标题不重叠**
- 单因子模式只渲染 1 步；`both` 模式渲染 2 步进度
- 任一环节失败均不进入 `submitWithdrawal`

**Demo OTP：** `src/lib/demoOtp.ts` 暂用确定性 6 位码；生产环境替换为真实下发。

### 3.4 表单地址校验修正

- `WithdrawForm.tsx` + `useWithdraw.ts` + `types/withdraw.ts`：修复地址格式误报；表单提交携带 `network` 字段用于落库

---

## 4. Withdraw 流水落库（Transaction History 显示）

### 背景
旧 `useWithdraw.submitWithdrawal` 是 mock，只生成本地 `WithdrawRecord` 驱动 StatusTracker，**未写 `transactions` 表**，导致 /wallet 看不到流水。

### 修复
`useWithdraw.ts` 校验通过后向 `transactions` 表 insert：

| 字段 | 值 |
|---|---|
| type | `withdraw` |
| amount | `-amount`（负值出账） |
| description | `Withdrawal to wallet` |
| status | `processing` |
| network | 表单值 |
| tx_hash | `null` |

用返回的 `id` 替换本地 `wd-${Date.now()}`，并 `queryClient.invalidateQueries(['wallet-fund-transactions'])` 立即刷新列表。提交失败不写库。

---

## 5. Transaction History 移动端排版

### 5.1 行结构

| 视口 | 结构 |
|---|---|
| 桌面 (≥md) | 单行：`icon + 描述 + 类型徽章 + 状态图标` ←→ `金额 + chevron` |
| 移动 (<md) | 两层 |

移动端两层：
- **第 1 行**：icon (40×40) + 描述 `text-sm font-medium truncate flex-1` + 金额 `text-sm font-semibold font-mono shrink-0 text-right`
- **第 2 行**（`pl-[52px]` 与描述左对齐）：`text-xs text-muted-foreground flex items-center flex-wrap gap-1.5` 依次 `日期 · 类型徽章 · 状态图标`，chevron 右对齐

### 5.2 共用原子
- 徽章 `inline-flex rounded-full border px-1.5 py-0 text-[10px] font-semibold`
- 状态图标 `w-3.5 h-3.5`，`processing` 加 `animate-spin`
- 金额按正负绿/红 + `font-mono`
- chevron 仅在 `hasDetails(tx)` 时显示且整行可点击展开

### 5.3 规范同步
- `DESIGN.md §8` 由原一句话扩展为完整 "Transaction History Row Spec"
- `mem://design/transaction-history-row-spec` 新建
- `mem://index.md` Core 新增 Transaction Rows 条目

---

## 6. 已删除 / 已废弃

| 项 | 说明 |
|---|---|
| `src/components/settings/SecurityCard.tsx` | 已删，能力拆到两张新卡 |
| Recovery `quoted / accepted / processing / reviewing / unrecoverable` 5 个中间态 | 已收敛 |
| `respondToQuote` mutation | 已移除 |
| `RecoveryRequest` "No Quote Needed" 文案 | 已删 |
| Recovery 详情页 mailto 客服链接 | 改 Discord |
| Withdraw step 标题被关闭按钮遮挡的旧排版 | 已重排 |

---

## 7. Style Guide

`/style-guide → Deposit & Withdraw`：
- Recovery Request Status playground（3 个 Badge + 3 个 Timeline 状态）
- Withdraw 验证 dialog 预览入口（沿用既有规范）
- **Transaction History Row**（新增，紧跟 Transaction Status Badges）
  - Desktop 单行示例：deposit completed / withdraw processing / cross-chain in
  - Mobile 两层示例：`max-w-[390px]` 容器内演示 `pl-[52px]` 对齐与 chevron 条件渲染
  - 附 `CodePreview` 给出 mobile row 结构片段，便于 QA 与后续维护对照

---

## 8. 涉及文件

**前端 — Settings 与 2FA**
- `src/components/settings/AccountSecurityCard.tsx`（新）
- `src/components/settings/WithdrawalVerificationCard.tsx`（新）
- `src/components/settings/Setup2FADialog.tsx`（新）
- `src/components/settings/SecurityCard.tsx`（删）
- `src/pages/Settings.tsx`
- `src/hooks/useUserProfile.ts`
- `src/lib/demoOtp.ts`

**前端 — Withdraw**
- `src/components/withdraw/WithdrawVerifyDialog.tsx`（新）
- `src/components/withdraw/WalletWithdraw.tsx`
- `src/components/withdraw/WithdrawForm.tsx`
- `src/hooks/useWithdraw.ts`
- `src/types/withdraw.ts`

**前端 — Recovery**
- `src/pages/RecoveryRequest.tsx`、`RecoveryRequestDetail.tsx`
- `src/components/recovery/RecoveryForm.tsx`、`RecoveryStatusTimeline.tsx`
- `src/hooks/useRecoveryRequests.ts`
- `src/pages/StyleGuide/sections/DepositWithdrawSection.tsx`

**前端 — Wallet**
- `src/components/wallet/TransactionHistory.tsx`

**前端 — Style Guide**
- `src/pages/StyleGuide/sections/WalletSection.tsx`（新增 Transaction History Row section）

**数据库**
- `...042031_*.sql`（Recovery v2 状态约束 + trigger）
- `...094029_*.sql`（profiles 新增 `totp_enabled` / `withdraw_2fa_mode`）

**设计规范**
- `DESIGN.md` §8 Transaction History Row Spec

---

## 9. 未变更项

- /withdraw 路由与整体页面骨架
- `transactions` 表结构（仅新增数据，无 schema 变更）
- 桌面端 Transaction History 排版
- Recovery 的 `fee_percent` 默认值（10%）与失败不退手续费策略
- Email Address 卡片（独立于本次安全重构）
