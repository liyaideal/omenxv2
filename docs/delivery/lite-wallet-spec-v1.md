# Wallet（Lite）— 交付说明 v1

> 这份文档说的是钱包那几页：`/wallet`（余额、两个账户、流水、地址簿）、`/deposit`（充值）、`/withdraw`（提现）、`/wallet/recovery`（打错网络的找回申请）。
> 这一轮用户能看到的变化：充值页不再有法币入口；提现只认 Base 网络的地址，其他链的地址在列表里点不动；跨链充值里的手续费行改成一句中性的说明。
> 页面骨架、底部导航、顶部头、余额算法都没动，不许碰。
> 怎么读：先看 §0 知道去哪儿查，再看正文；每个数值都标了它在哪个代码文件里。

## 0. 读者须知

查什么去哪儿：
- 长什么样 → 生产页 `/wallet` · `/deposit` · `/withdraw` · `/wallet/recovery`
- 什么时候变成什么样 → `/style-guide` → Lite → Wallet 状态字典（W-1…W-33，每个 case 有「状态 / 触发条件 / 视觉 / 数据来源」表）
- 字段名、文案、公式、时间口径、术语 → `docs/copy-dictionary.md`（顶部有「Lite 术语对照表」）→ 本文档对应章节
- 设计法则（颜色轴、chip、overlay 对等）→ `DESIGN.md`
提问前先按上面顺序查一遍；查不到再提，提问时写明"我查了 X 没有"。

## 1. 功能目标

Lite 钱包收敛为**单资产单网络**：USDC on Base。充值与提现均只走 Base；跨链只在**充值**方向以 bridge 形式存在（提现不支持跨链）。法币入口（Banxa）本轮退役，组件 `src/components/deposit/BuyWithFiat.tsx` 保留在仓库以备 MoonPay 轮重启，但页面与弹窗均不再挂载。

## 2. 本轮变更（v0 → v1）

| 维度 | 旧 | 新 |
|---|---|---|
| 法币入口 | `/deposit` 与 DepositDialog 有 Fiat tab（Banxa） | 入口移除；`BuyWithFiat.tsx` 留仓不挂载 |
| 跨链手续费行 | 写死数值 | 中性文案 `Varies by route` |
| 提现地址网络 | 多链可选 | 仅 Base；新增地址 network 固定 `Base`，无选择器 |
| 非 Base 已存地址 | 可选中 | 行 disabled，caption `Base only — this address can't receive withdrawals` |
| 未登录 `/deposit` `/withdraw` | 直接进流程 | 统一 guest gate |
| style-guide | `DepositWithdrawSection` + `WalletSection` 两节散落 | 全部并入 `WalletStatesSection`（W-1…W-33） |

## 3. 资金与状态边界（研发须知）

| 项 | 现状 | 待研发 |
|---|---|---|
| 提现冻结 | UI 文案已写 `Your funds have been unfrozen and returned to your available balance.`（失败态） | 冻结/解冻账务本身**未实现**，需后端补 |
| 提现限额 | 演示值：min 20 / max 10,000 / 日限 50,000 / fee 1（`src/hooks/useWithdraw.ts`） | 真值待运营给定 |
| Deposit-to 账户偏好 | localStorage（`useAccountPreference`） | 服务端化（08-31 拍板转研发），链上到账按偏好记入 Standard / Boost |
| 提现验证码 | demo 码 `111111`（`src/lib/demoOtp.ts`），TOTP 演示密钥 `OMENXDEMOSECRET234567` | 接真 OTP / TOTP |
| 跨链 bridge | 前端流程为演示语义 | 接真 bridge 路由与报价 |
| Recovery 费率 | 固定 10%，3–7 business days | 人工处理，无自动化 |

## 4. 状态机

### 4.1 提现（`WithdrawRecord.status`）

| status | 含义 | 触发方 | UI |
|---|---|---|---|
| `REQUESTED` | 已提交 | 用户 | 进度条第 1 步 |
| `APPROVED` | 已审核 | 运营 / 自动 | 第 2 步 |
| `SENT` | 已广播 | 链上任务 | 第 3 步 |
| `CONFIRMED` | 已确认 | 链上任务 | 全绿 + `basescan.org/tx/{txHash}` |
| `FAILED` / `REJECTED` | 失败 / 驳回 | 系统 / 运营 | 红色 XCircle + 解冻返还句 |

### 4.2 Recovery（`recovery_requests.status`，3 态，2026-05-20 定稿）

| status | 含义 | 触发方 | UI |
|---|---|---|---|
| `submitted` | 已提交，人工处理中 | 用户 | 时间线第 1 步 + 「typically takes 3–7 business days」 |
| `completed` | 已到账 | 运营 | 绿色 Funds credited 卡 + Message from OmenX |
| `rejected` | 驳回 | 运营 | 红框 Request rejected，无 payout 卡 |

`quoted_at` / `accepted_at` 为 schema 残留字段，UI 无任何渲染。

## 5. 数据库

| 表 | 字段（节选） | 说明 |
|---|---|---|
| `recovery_requests` | `tx_hash` / `wrong_network` / `wrong_token` / `claimed_amount` / `sender_address` / `user_note` / `status` / `fee_percent` / `estimated_return` / `admin_note` / `processed_tx_hash` | RLS：用户仅可读写自己的行；`fee_percent` 固定 10 |
| `profiles` | `withdraw_2fa_mode` / `totp_enabled` / `email` | 决定提现验证步骤队列 |
| 演示数据 | 仅 `alex.carter@gmail.com` 注入流水与 recovery 演示行 | 其他账号不得出现 |

## 6. 用户端流程

### 6.1 `/wallet`
桌面三段：Hero（满宽）→ 双账户卡 `grid-cols-2` → 12 栅格 8（流水 / recovery 文字链）+ 4（Saved addresses）。移动纵向堆叠。`Mainnet` chip 属 header chrome（`MainnetBadge` via `Logo`），不属 wallet 组合层。顶部维护公告位读 `src/config/maintenanceNotices.ts`，空数组时零高度。

### 6.2 `/deposit`
`Deposit to` 前屏选账户 → Address tab（三项安全清单全勾后露出 QR + 地址）→ Wallet tab（跨链充值）。Fiat tab 已退场。

### 6.3 `/withdraw`
金额 + 地址 → 验证弹窗（按 `withdraw_2fa_mode` 派生 email OTP / 绑定邮箱 / TOTP / 绑定验证器）→ 状态追踪。CTA 为 sticky 底栏（`StickyWithdrawBar`，偏移 `var(--bottom-nav-h, 76px)` + safe-area）。

### 6.4 `/wallet/recovery`
intro（10% flat fee · 3–7 business days）→ 表单（zod 校验）→ 列表 → 详情。未登录显示 `Sign in required`。

## 7. 状态索引

| 模块 | style-guide case |
|---|---|
| 组合层 / Hero / 账户 / Transfer / 流水 | W-1…W-20 |
| 充值流（前屏 / 清单 / 地址 / 跨链 / Fiat 存档） | W-21…W-24、W-14 |
| 提现流（表单 / 地址 / 验证四模式 / 状态 / sticky） | W-25…W-29 |
| Recovery（入口 / 列表 / 三态详情） | W-30…W-32c |
| 维护公告 | W-33 |

## 8. 涉及文件

前端：`src/pages/Wallet.tsx`、`Deposit.tsx`、`Withdraw.tsx`、`RecoveryRequest.tsx`、`RecoveryRequestDetail.tsx`；`src/components/deposit/*`、`src/components/withdraw/*`、`src/components/wallet/*`、`src/components/recovery/*`
Hooks/配置：`src/hooks/useWithdraw.ts`、`useDeposit.ts`、`useWallets.ts`、`useRecoveryRequests.ts`、`src/config/maintenanceNotices.ts`、`src/lib/demoOtp.ts`
字典：`src/pages/StyleGuide/sections/WalletStatesSection.tsx`、`src/pages/StyleGuide/preview/fundingPreviews.tsx`、`walletLitePreviews.tsx`、`preview/registry.tsx`

## 9. Typography 口径（自旧 style-guide 手抄表移交）

| 元素 | 规格 |
|---|---|
| Amount input | `text-2xl font-mono`（24px） |
| CTA button | `text-sm font-semibold`（14px） |
| Balance display | `text-xs font-mono` |
| Wallet address | `text-xs font-mono` |
| Status step label | `text-sm`（14px） |
| Result amount | `text-3xl font-mono font-bold` |

## 10. 已删除 / 已废弃

| 项 | 说明 |
|---|---|
| `DepositWithdrawSection` | style-guide 不再挂载，内容并入 W-21…W-33；文件留仓 |
| `WalletSection` | 同上，Maintenance Notice 四 preset 并入 W-33 |
| Fiat / Banxa 入口 | 退役；`BuyWithFiat.tsx` 留仓 |
| Funding assets 手抄卡 | 退场（Banxa 已退役） |
| Typography Standards 手抄表 | 退场 → 本文 §9 |

## 11. 未变更项

BottomNav / MobileHeader / LiteEventCard 三件 FROZEN 零触碰；余额算法（`computeTotalEquity`）、Transfer 语义、交易历史行规格（DESIGN.md §8）、registry 旧 key 一字未改。
