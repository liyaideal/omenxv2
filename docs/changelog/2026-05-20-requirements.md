# 需求交付文档 — 2026-05-20 迭代

> 范围：2026-05-20（本次发版批次）合并入主干的所有需求改动，已全部推送 GitHub。
> 涉及主题：账户找回 (Recovery)、Settings 安全模块、Withdraw 二次验证、Withdraw 流水入账、Transaction History 移动端排版。

---

## 1. Recovery（账户找回）流程简化

**目标**：把原本复杂的多步报价/客服流程简化为「提交申请 → 等待审核 → 结果」三步式。

### 改动点
- **`src/pages/RecoveryRequest.tsx`**：移除 "No Quote Needed" 文案块；保留极简表单。
- **`src/components/recovery/RecoveryForm.tsx`** + **`src/hooks/useRecoveryRequests.ts`**：精简表单字段与提交逻辑，去掉报价相关字段。
- **`src/components/recovery/RecoveryStatusTimeline.tsx`**：状态时间线重写，状态更聚焦 (Submitted / Reviewing / Approved / Rejected)。
- **`src/pages/RecoveryRequestDetail.tsx`**：详情页大幅瘦身；"联系客服" CTA 由邮件跳转改为 **Discord 跳转**（统一走社群支持渠道，与 `FloatingDiscordButton` 一致）。
- **数据库迁移**：新增 `supabase/migrations/...042031_*.sql`（recovery 表结构调整，研发请直接看 migration 文件确认字段）。
- **Style Guide**：在 `src/pages/StyleGuide/sections/DepositWithdrawSection.tsx` 中新增 **Recovery Status Playground**，方便后续 QA 直接预览各种状态 UI。

### 验收
- /recovery 入口：提交一次申请 → 列表/详情即时出现，状态时间线正确推进。
- 详情页 "Contact" 按钮点击后跳 Discord 邀请链接。
- Style Guide → Deposit & Withdraw 章节可见 Recovery Status 模块且可切换状态。

---

## 2. Settings 安全模块重构

**目标**：把原先混在一起的 `SecurityCard` 拆成两张职责清晰的卡片，区分「账户级凭据」与「提现专用二次验证偏好」。

### 改动点
- **删除**：旧 `src/components/settings/SecurityCard.tsx`。
- **新增**：
  - `src/components/settings/AccountSecurityCard.tsx` — 账户级凭据管理。目前只暴露 **Authenticator App (TOTP) 绑定**（Setup / Disable）。邮箱绑定继续由上方现有的 Email Address 卡片管理。架构上保留扩展位：未来登录 2FA、改密码、大额转账、API Key 都从这张卡片读凭据状态。
  - `src/components/settings/WithdrawalVerificationCard.tsx` — **提现专用** 二次验证偏好。
    - 三种模式：`Email only` / `Authenticator only` / `Email + Authenticator (both)`。
    - 自动根据凭据可用性禁用未就绪选项，并提示用户先去配置 (Email Address / Account security)。
    - 选 TOTP/Both 但未绑定 TOTP 时，内联打开 `Setup2FADialog`，绑定成功后自动写回选择。
  - `src/components/settings/Setup2FADialog.tsx` — TOTP 绑定向导（二维码 + 6 位码验证）。
- **数据**：`src/hooks/useUserProfile.ts` 暴露 `totp_enabled` / `withdraw_2fa_mode` / `enableTotp` / `disableTotp` / `updateWithdraw2faMode`；对应字段已在 `profiles` 表迁移（`...094029_*.sql`）。
- **辅助**：`src/lib/demoOtp.ts` — Demo/沙盒环境下生成确定性 6 位 OTP（生产环境替换为真实下发）。
- **Settings 页**：`src/pages/Settings.tsx` 中按 Email Address → Account Security → Withdrawal Verification 顺序排列。

### 验收
- 没有任何凭据时，Withdrawal Verification 卡片显示黄色提示，所有模式禁用。
- 仅绑定邮箱：只能选 Email only。
- 选 "Authenticator only" / "Email + Authenticator" 自动唤起 Setup 弹窗。
- Authenticator 已启用时，Account Security 卡片显示绿色 "Enabled" 徽章 + Disable 按钮；点击 Disable 且当前提现模式依赖 TOTP，会回落到 Email 并提示。

---

## 3. Withdraw 二次验证流程

**目标**：根据用户在 Settings 选择的 `withdraw_2fa_mode`，在提交提现前强制完成对应验证。

### 改动点
- **新增**：`src/components/withdraw/WithdrawVerifyDialog.tsx` —
  - 根据 mode 渲染 1 步（Email 或 TOTP 单因子）或 2 步（Email + TOTP）。
  - **Header 排版**：标题下方加 subtitle 描述当前验证目的；右上角统一关闭按钮（先前 step 文案与关闭按钮叠在一起的问题已修复）。
  - 移动端与桌面端共用同一组件，桌面用 Dialog，移动用 MobileDrawer。
  - 验证通过后回调上抛 → 触发实际提现提交；任一环节失败均不进入提交。
- **接入**：`src/components/withdraw/WalletWithdraw.tsx` 在用户点击 Submit 后，先读 profile 的 `withdraw_2fa_mode`，按需打开 `WithdrawVerifyDialog`；只有 Dialog 成功回调后才调 `submitWithdrawal`。
- **表单地址校验**：`src/components/withdraw/WithdrawForm.tsx` + `src/hooks/useWithdraw.ts` + `src/types/withdraw.ts`
  - 修正地址格式校验逻辑（之前有误报）。
  - 表单提交时携带 `network` 字段，用于流水落库。

### 验收
- Settings 切换三种模式后，进入 /withdraw 提交：
  - Email only → 1 步邮件 OTP。
  - Authenticator only → 1 步 TOTP。
  - Both → 第一步 Email、第二步 TOTP，进度指示清晰。
- 关闭按钮与 step 标题在桌面/移动端均不重叠。
- 地址格式不合法时按钮禁用并显示错误提示。

---

## 4. Withdraw 流水落库（Transaction History 显示问题修复）

**目标**：用户提交一笔提现后，应立即出现在 /wallet 的 Transaction History 中。

### 背景
原 `useWithdraw.submitWithdrawal` 只生成本地 `WithdrawRecord` 驱动 `StatusTracker`，**没有写 `transactions` 表**，导致 /wallet 看不到该笔流水（页面只读 `transactions`）。

### 改动点
- **`src/hooks/useWithdraw.ts`**：校验通过后向 `transactions` 表插入：
  - `type: 'withdraw'`
  - `amount: -amount`（负值表示出账）
  - `description: 'Withdrawal to wallet'`
  - `status: 'processing'`
  - `network`、`tx_hash: null`
- 使用 insert 返回的 `id` 替换本地 `wd-${Date.now()}`。
- `queryClient.invalidateQueries(['wallet-fund-transactions'])` 使 /wallet 立即刷新。
- 提交失败不写库。

### 验收
- 提交一笔提现 → /wallet Transaction History 顶部立即出现 `Withdrawal to wallet`，状态 `processing`，金额负值红色。

---

## 5. Transaction History 移动端排版重构 + 设计规范补齐

**目标**：解决 390px 下交易行图标 / 描述 / 类型徽章 / 状态图标 / 金额 / chevron 全挤同一行的问题。

### 改动点
- **`src/components/wallet/TransactionHistory.tsx`** — `isMobile` 分支改为两层结构（桌面保持单行不变）：
  - 第一行：`icon (40×40)` + 描述 `text-sm font-medium truncate flex-1` + 金额 `text-sm font-semibold font-mono shrink-0 text-right`
  - 第二行：与描述左对齐 (`pl-[52px]`)，`text-xs text-muted-foreground flex items-center flex-wrap gap-1.5`，依次 `日期 · 类型徽章 · 状态图标`；右侧 chevron（仅可展开时显示）。
- **`DESIGN.md` §8**：把原本一句话的 "Transaction Card Layout" 扩展为完整 **Transaction History Row Spec**，明确：
  - Desktop 单行结构与对齐规则。
  - Mobile 两层结构、`pl-[52px]` 缩进对齐、字号 `text-xs`。
  - 共用原子：徽章 `inline-flex rounded-full border px-1.5 py-0 text-[10px] font-semibold`；状态图标 `w-3.5 h-3.5`，`processing` 加 `animate-spin`；金额按正负绿/红 + `font-mono`；chevron 仅 `hasDetails(tx)` 时显示并使整行可点击展开。
- **`mem://index.md`** 与 **`mem://design/transaction-history-row-spec`** 新增对应核心规则与详细 spec，作为后续 PR 的硬性约束。

### 验收
- 390px：描述完整可读（不被截成 `Bri...`），金额对齐右侧不被遮挡，日期/徽章/状态落在第二行。
- 桌面端布局未变。
- 新规范与实现一致；DESIGN.md §8 与组件代码相互印证。

---

## 文件清单（按模块归类）

| 模块 | 文件 |
|---|---|
| Recovery | `src/pages/RecoveryRequest.tsx`, `src/pages/RecoveryRequestDetail.tsx`, `src/components/recovery/RecoveryForm.tsx`, `src/components/recovery/RecoveryStatusTimeline.tsx`, `src/hooks/useRecoveryRequests.ts`, `supabase/migrations/...042031_*.sql`, `src/pages/StyleGuide/sections/DepositWithdrawSection.tsx` |
| Settings 安全 | `src/components/settings/AccountSecurityCard.tsx` (新), `src/components/settings/WithdrawalVerificationCard.tsx` (新), `src/components/settings/Setup2FADialog.tsx` (新), `src/components/settings/SecurityCard.tsx` (删), `src/pages/Settings.tsx`, `src/hooks/useUserProfile.ts`, `src/lib/demoOtp.ts`, `src/integrations/supabase/types.ts`, `supabase/migrations/...094029_*.sql` |
| Withdraw 验证 | `src/components/withdraw/WithdrawVerifyDialog.tsx` (新), `src/components/withdraw/WalletWithdraw.tsx`, `src/components/withdraw/WithdrawForm.tsx`, `src/hooks/useWithdraw.ts`, `src/types/withdraw.ts` |
| Transaction History | `src/components/wallet/TransactionHistory.tsx`, `DESIGN.md`, `mem://index.md`, `mem://design/transaction-history-row-spec` |

---

## QA 自测路径建议

1. **Settings**：未配置任何凭据 → 配置邮箱 → 配置 TOTP → 切换三种 Withdrawal Verification 模式。
2. **Withdraw**：在每种模式下分别走一次提现验证 + 提交。
3. **/wallet Transaction History**：提交后立即查看流水；分别在桌面 (≥md) 和移动端 (390px) 检查排版。
4. **Recovery**：提交 → 详情页时间线 → Contact 按钮跳 Discord；Style Guide 内 Recovery Status 模块预览所有状态。
