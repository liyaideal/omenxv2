# OmenX 近期上线需求汇总（提交研发）

> 整理人：Product / Design
> 范围：本轮迭代已合入预览/线上的改动，按优先级排序。
> v2 更新：H2E 阶梯由 5 档扩为 6 档（含 $0 Starter）；新增 Withdraw 最低额 UX 优化；Available for Withdraw 计算口径调整。

---

## 1. H2E Welcome Gift 兜底机制

**场景**
用户连接 Polymarket 钱包后，如果钱包里**有**符合 H2E 条件的仓位，但 OmenX 平台上**没有对应的 event** 可以匹配做对冲，原本流程会让用户什么都拿不到，体验断层。

**方案**
新增 Welcome Gift 兜底分支：以上情况下直接发放 **$10 的 OmenX 免费仓位**，与 Polymarket 仓位无绑定关系。

**规则**
- 终身每个用户限 **1 次**
- 不占用正常 matched 流程的额度
- UI 上独立 `WELCOME GIFT` 徽章（绿色），与 matched airdrop 视觉区分
- 走与 matched airdrop 同一套生命周期（pending → activate → settle）

---

## 2. Pending Airdrop 倒计时

**场景**
Airdrops 仓位的 pending（待 activate）状态原本没有时间提示，用户不知道什么时候会作废（72h 规则）。

**方案**
Activate 按钮**内部**集成倒计时，格式：

```
⚡ Activate · 46h        (默认，紫色)
⚡ Activate · 12m        (urgent，红色，剩余 < 1h)
```

**规则**
- 倒计时直接嵌入按钮，不额外占行
- `urgent`（剩余 < 1h）：按钮整体（或边框）变红，倒计时加粗
- 桌面 Portfolio / 移动卡片显示完整 `46h 47m`
- 交易页 PENDING 行因为列窄使用紧凑格式（`2d 1h` / `46h` / `12m`）
- 倒计时刷新频率自适应：≥1h 每 60s，<1h 每 10s，<1m 每 1s
- 激活中显示 `Activating…`，不显示倒计时
- Expired 后整个按钮隐藏（外层走既有逻辑）

**涉及文件**
`src/hooks/useCountdown.ts`、`src/components/ActivateAirdropButton.tsx`、`src/pages/PortfolioAirdrops.tsx`、`src/pages/DesktopTrading.tsx`、`src/components/AirdropPositionCard.tsx`

---

## 3. H2E 奖励按交易量阶梯解锁（v2：6 档）

**背景**
H2E airdrop 结算后的盈利会进入"冻结余额（Frozen Balance）"——可以继续在 OmenX 内部交易，但**不能直接提现**。需要用户通过实际交易达成累计交易量后，分阶段解锁可提现额度，把激励留在平台、避免薅完即走。

**位置**
钱包页 `Hedge Airdrop Rewards` 卡片。

**核心规则**

1. **单户奖励上限**：每个账户最多累计 **$100** H2E 收益（`Earned / Cap`），超出后不再发放新的 airdrop 收益。

2. **6 档解锁阶梯**（按累计平台交易量 `volumeCompleted`，含 0% 起点档）：

   | 累计交易量 | 解锁比例 | 备注 |
   |---|---|---|
   | $0       | 0%   | Starter 起点档（独立 +$5 starter unlock，见下） |
   | $10,000  | 10%  | |
   | $50,000  | 25%  | |
   | $100,000 | 50%  | |
   | $200,000 | 75%  | |
   | $400,000 | 100% | 全额解锁 |

3. **Starter Unlock = $5（独立赠送）**
   - 来源：现有 `trialBalance`（注册即赠），与 H2E `frozenBalance` **完全独立**
   - 在 0% 档位以绿色 `+$5 / Starter`（桌面节点）和 `Starter unlock +$5 / included`（移动时间线）展示
   - 视觉色：`text-trading-green`，与 H2E primary 色阶梯节点区分
   - 不参与 H2E `unlockedPercent` 公式，不进 frozenBalance

4. **解锁逻辑**（H2E frozen 部分）
   - `unlockedAmount = frozenBalance × unlockedPercent`
   - 未达 $10K 之前 `unlockedPercent = 0`，frozen 部分全部锁定（但 starter $5 不受影响）
   - 阶梯之间**不线性插值**，必须跨过下一档阈值才提升比例
   - 解锁是**累计制**，只看总交易量是否突破阈值

5. **UI 表现**（钱包页卡片）
   - 顶部双进度条：`Earned / Cap`（$6.50 / $100）+ `Withdrawal unlock progress`（$254.5 / 下一档阈值）
   - 桌面：6 个圆点节点（grid-cols-6），首档绿色 `+$5 Starter`，其余按 H2E primary 色
   - 移动：6 行时间线，首行 `Starter unlock +$5 / Free, independent of H2E / included`
   - 引导文案：`Trade $X more to unlock Y%`
   - 状态文案：`Current unlocked: 0% · Full unlock at $400,000`
   - 底部 `Recent Settlements` 列出最近 H2E 结算的事件 + 收益

6. **行为约束**
   - 冻结余额可参与下单、计入交易量（自循环：用 airdrop 收益交易 → 累计交易量 → 解锁更多 airdrop 收益）
   - 全额解锁后冻结余额清零并入可用余额

**涉及文件**
`src/hooks/useH2eRewardsSummary.ts`（业务逻辑 + 6 档常量 + `starterUnlock` 字段）、`src/pages/Wallet.tsx`（UI）、`src/pages/StyleGuide/sections/WalletSection.tsx`（设计稿样例）

---

## 4. Available for Withdraw 计算口径调整（新）

**场景**
原 `Available for Withdraw = balance − h2e.lockedAmount`，未把 Starter（trialBalance $5）算进可提现，与「Starter 即赠即可提现」的产品定位不符。

**方案**
钱包页 + 提现页统一改为：

```
Available for Withdraw = max(0, balance + trialBalance − h2e.lockedAmount)
```

**含义**
- Starter $5 始终计入可提现（与 H2E 解锁阶梯无关）
- H2E `frozenBalance` 中尚未解锁部分（`lockedAmount`）继续锁定提现
- 总权益展示（Total Equity = `balance + trialBalance`）不变

**涉及文件**
`src/pages/Wallet.tsx`、`src/components/withdraw/WalletWithdraw.tsx`、`src/components/withdraw/WithdrawForm.tsx`

---

## 5. Withdraw 最低额提示前置 + 实时校验（新）

**场景**
USDC/USDT 最低提现额为 **20**，但原 UI 只在 Summary 块里以「Minimum: 20 USDC」隐藏展示，用户在金额输入框看不到提示，且只有点 Submit 后才会触发后端校验报错。

**方案**（仅前端 UX 优化，后端校验不动）

1. **Placeholder 提示**：金额输入框 placeholder 由 `0.00` 改为 `Min 20`
2. **Available 同行展示 Min**：输入框下方原 `Available: X.XX USDC` 改为 flex 两端布局：
   ```
   Available: 12.50 USDC          Min 20 USDC
   ```
3. **实时 inline 校验**：输入金额 > 0 且 < 最低额时，立即在输入框下方红字提示 `Minimum withdrawal is 20 USDC`，输入框边框变红
4. **Submit 按钮禁用**：`disabled` 条件追加 `parseFloat(amount) < minAmount`，无效金额无法点击提交

**不动**
- `WITHDRAW_MINIMUMS` 数值（USDT/USDC 保持 20）
- Summary 块内 `Minimum` 行（保留作为最终复核）
- `useWithdraw.ts` 后端校验

**涉及文件**
`src/components/withdraw/WalletWithdraw.tsx`、`src/components/withdraw/WithdrawForm.tsx`

---

## 5b. Withdraw 弹窗移除 H2E 文案模块（新）

**场景**
原 Withdraw 弹窗在 Available 行下方追加了一行 H2E 锁定提示（`$X.XX locked (H2E — N% already withdrawable; trade $Y more to unlock M%)`），与 Wallet 页面的 H2E 解锁阶梯模块信息重复，造成视觉冗余。

**方案**
- 删除 `WalletWithdraw.tsx` 与 `WithdrawForm.tsx` 中的 H2E 锁定文案块
- H2E 解锁进度统一由 Wallet 页面承担展示

**不动**
- `availableBalance = max(0, rawAvailable - h2e.lockedAmount)` 余额扣减逻辑保留：H2E frozen 部分仍受提现限制，用户无法绕过
- Wallet 页面的 6 档解锁阶梯 UI 不动

**涉及文件**
`src/components/withdraw/WalletWithdraw.tsx`、`src/components/withdraw/WithdrawForm.tsx`

---

## 6. Demo 账号常驻入口（QA / 演示）

**场景**
QA 与对外演示需要可重复、可对比地预览"已匹配仓位"和"Welcome Gift"两种 H2E 状态，原匿名登录用完即丢、不可回访。

**方案**
登录页常驻两个固定 demo 账号入口（演示阶段始终可见）：

| 账号 | 邮箱 | 内容 |
|---|---|---|
| Matched | `demo.matched@omenx.dev` | 4 个已匹配 airdrop 卡片，无 welcome gift |
| Welcome Gift | `demo.welcome@omenx.dev` | 1 个 welcome gift 卡片 |

- 共享密码（内部）：`OmenxDemo!2026`
- 通过 `ensure-demo-user` edge function 幂等创建账号（`verify_jwt = false`，`email_confirm: true`）
- 前端按登录邮箱分发 mock airdrop 数据
- `useConnectedAccounts` 已按 user-id 维度隔离，两账号自动独立 connected-account 状态

**涉及文件**
`supabase/functions/ensure-demo-user/index.ts`、`src/components/auth/AuthContent.tsx`、`src/hooks/useAirdropPositions.ts`

---

## 验收清单

- [ ] Polymarket 连接后无匹配仓位 → 收到 $10 Welcome Gift（一生 1 次）
- [ ] Pending airdrop 按钮显示倒计时，<1h 转红，过期自动消失
- [ ] 交易页 PENDING 行按钮不再折行
- [ ] 钱包页阶梯节点为 **6 档**（含 $0 Starter 绿色档），首档显示 `+$5 Starter`
- [ ] 冻结余额可下单、计入交易量、解锁后并入可用余额
- [ ] 钱包页 `Available for Withdraw` 包含 Starter $5（即使 balance=0、无 H2E 也显示 $5）
- [ ] 提现页输入框 placeholder 显示 `Min 20`，下方同行显示 Min 20 USDC
- [ ] 输入金额 < 20 时立即红字报错，Submit 按钮禁用
- [ ] 登录页两个 demo 入口可重复登录，两账号数据互不干扰
