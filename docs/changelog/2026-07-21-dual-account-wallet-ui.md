# 双账户改造 · 轮次 2b：钱包 UI（Dual-Account Wallet UI）— 交付说明

> 承接 2a 资金内核（`spot_balance` / `sim-transfer` / 现货余额源切换已交付）。
> 本轮做钱包 UI + 全站 Total Equity 口径统一 + 充提选账户 + 顶栏/首页/流水配套。
> 拍板日 2026-07-21，全部已定。

---

## 1. 全站 Total Equity 口径（唯一 source）

新增 helper `src/lib/equity.ts`：

```ts
export const computeTotalEquity = ({ spotBalance, balance, trialBalance }) =>
  (spotBalance ?? 0) + (balance ?? 0) + (trialBalance ?? 0);
```

**不含未实现 PnL。** 所有 UI（顶栏 Equity 胶囊、首页 Hero、/wallet Band 1、HoverCard 汇总）必须走该 helper，禁止再各处拼装。

## 2. /wallet 三段式重排（桌面 + 移动同构）

`src/pages/Wallet.tsx`。PageHeader + MaintenanceNoticeBanner 不动，其下：

| Band | 桌面 | 移动 |
|---|---|---|
| 1 · Total Equity | 全宽英雄渐变卡（DESIGN.md §5 例外：**Total Equity Card**）：`EST. TOTAL EQUITY` label + `computeTotalEquity` 主数字（`font-mono text-3xl font-bold`）+ 眼睛开关 + 副注行 `Spot + Futures + Trial Bonus · does not include unrealized PnL` + 右侧 Deposit / Withdraw / Transfer 三按钮 | 同构，纵向排列，副注行保留 |
| 2 · 双账户卡 | `grid-cols-2` Spot / Futures，均 `.stats-card`（不套英雄渐变）；卡内 Available 大数（Futures **仅 balance**，Trial 只出现在明细格）+ 明细 `p-3 rounded-lg bg-muted/20`；右上角 Transfer ghost 图标 | 纵向 Spot → Futures，同规格 |
| 3 · 活动区 | 12 栅格：`col-span-8` = PendingConfirmations + TransactionHistory；`col-span-4` = H2eRewardsCard + Saved Addresses | 纵向：H2E → Pending → Saved Addresses → Transactions |

**入口去重**：移动端 Deposit / Withdraw 走 `navigate('/deposit'|'/withdraw')`（Deposit/Withdraw Dialog 是桌面组件），旧 BalanceCard 组件已弃用。

**Futures 卡大数** = `balance`（**仅 Available**）。Trial Bonus 只作明细格出现；"账户合计"只存在于 Band 1 Total Equity 条。

## 3. Transfer 三件套（严格走 ClosePosition 范式）

- `src/components/wallet/TransferForm.tsx` — 表单主体
- `src/components/wallet/TransferDialog.tsx` — 桌面
- `src/components/wallet/TransferDrawer.tsx` — 移动（MobileDrawer，**移动出现 Dialog 即验收失败**，DESIGN.md §5 LOCKED）

要点：
- Direction 分段：Futures → Spot / Spot → Futures，`rounded-lg bg-muted p-0.5`
- From/To 卡：From `bg-muted/20`、To `border-primary/30 bg-primary/5`、中间 `w-9 h-9` ArrowDown 圆盘
- 金额 `text-2xl font-mono` + MAX + Available 行；**From=Futures 时 Available 仅显示 `balance`（Trial 不可划转），旁附 ⓘ tooltip "Bonus funds used first when trading. Cannot be withdrawn or transferred."**
- 错误透传：`useUserProfile.transferBetweenAccounts` 捕获 `FunctionsHttpError` 时读 `error.context.json()`，把 EF 的具体错误文案透传 toast（而非通用 non-2xx）

## 4. 充值 / 提现选账户

- **Deposit**：三 Tab **之前**插「Deposit to」屏（`AccountPickerRows`），无默认预选、`useAccountPreference` 落 localStorage 记住上次；选完顶部一行可点回改的账户 crumb（"To: Spot Account ›"）。`DepositDialog`（桌）和 `Deposit.tsx`（移）同时接。
- **Withdraw**：`WalletWithdraw` 表单顶部（Base-USDC 条之下）加「From account」选择行，交互抄 `WithdrawAddressSelect` 桌面 Dialog / 移动 sheet；`useWithdraw` 根据所选账户 deduct + record-transaction 落 `account` 字段
- `record-transaction` EF 修 cors + 放行 `transfer_to_spot` / `transfer_to_futures` 类型 + 落 `account`

## 5. 顶栏 + 首页 Hero 口径统一

- **`EventsDesktopHeader`** Equity 胶囊：样式不变，数值改 `computeTotalEquity`；包 `HoverCard`（~260px）：三行明细（Spot Account / Futures Account / Trial Bonus）+ 分隔线 + Total Equity 行 + "Transfer ›" 文字链（打开 TransferDialog）。移动顶栏维持无余额。
- **`HomeEquityHero`** 主数字改 Total Equity，**不加账户明细副指标**。
- 记忆同步：`.lovable/memory/design/mobile-header-preset-d.md` 数据源改为 Total Equity 口径。

## 6. /spot 账户面板追认收编

`SpotTrading.tsx` AccountPanel 保留 2a 结构（Spot Account 单余额 + 提示句）。文案定稿：
> "Contract account & Trial Bonus do not fund spot trades. Transfer funds to your Spot Account to trade."

STATUS DAC5 注释由"待产品裁决"改为"已追认收编（2b）"。

## 7. 流水账户徽标

`TransactionHistory` 行加 `SPOT` / `FUTURES` 胶囊（`text-[10px] rounded-full border`）：
- 桌面：与描述同行显示
- 移动：**只进第二层**（DESIGN.md §8 Don't 沿用）
- `transfer_to_spot` / `transfer_to_futures` 类型注册 `ArrowLeftRight` 图标 + `Transfer` 胶囊
- 老流水 `account = NULL` 不显示徽标

## 8. DESIGN.md 六项 append（同轮，append-only）

1. §5 例外条款改写为 "Wallet **Total Equity** Card"（单数，账户 stats-card 不享英雄渐变例外）
2. §8 新增：双账户卡组规格、Transfer 三件套、流水 account 徽标、Band 1 副注行规格
3. §9 新增：充值 / 提现选账户步骤
4. §5 Overlay 对等表加 "Transfer 划转" 行；HoverCard 顶栏 Equity 明细内容规格
5. Total Equity 口径 definition（= spot_balance + balance + trial_balance，不含未实现 PnL）
6. §10 Preset D 数据源改为 `computeTotalEquity`

## 9. Style Guide（§16.1.1 Truth Rule，缺 mobile 即失败）

`WalletSection` 增量交付原则：**真组件为主 + WalletEquityBands / EquityHoverCard 两处为镜像预览（带同步义务注释）**，均 `DeviceFrame` + `preview/registry` 注册，desktop + mobile 逐一对应。

- **真组件**：`TransferForm`（4 态：正常 / 余额不足 / 金额 0 / Trial ⓘ，走 `demoOverride` props）、`AccountPickerRows`、`TransactionHistory`
- **镜像预览**（`walletPreviews.tsx`，文件顶部与各块内 `// MIRROR:` 注释指向生产源，改生产必改此处）：
  - `WalletEquityBandsPreview` ← `src/pages/Wallet.tsx` Band 1 Total Equity + Band 2 双账户卡
  - `EquityHoverCardPreview` ← `src/components/EventsDesktopHeader.tsx` Equity HoverCardContent
- **辅助**：`DepositToPickerPreview` / `AccountBadgeLegendPreview` 场景演示



## 10. 涉及文件

**新增**
- `src/lib/equity.ts`
- `src/components/wallet/TransferForm.tsx` / `TransferDialog.tsx` / `TransferDrawer.tsx`
- `src/components/wallet/AccountPicker.tsx`
- `src/hooks/useAccountPreference.ts`
- `docs/changelog/2026-07-21-dual-account-wallet-ui.md`（本文件）

**编辑**
- `src/pages/Wallet.tsx`（三段式桌面 + 移动同构）
- `src/hooks/useUserProfile.ts`（`transferBetweenAccounts` 错误透传）
- `src/components/EventsDesktopHeader.tsx`（Equity HoverCard）
- `src/components/home/HomeEquityHero.tsx`
- `src/components/deposit/DepositDialog.tsx` · `src/pages/Deposit.tsx`
- `src/components/withdraw/WalletWithdraw.tsx` · `src/hooks/useWithdraw.ts` · `src/types/withdraw.ts`
- `src/components/wallet/TransactionHistory.tsx`
- `supabase/functions/record-transaction/index.ts`（cors 修 + 放行 transfer 类型 + 落 account）
- `supabase/functions/sim-transfer/index.ts`（头注释更新为 DEMO-STATE 口径）
- `DESIGN.md`（六项 append）
- `.lovable/memory/design/mobile-header-preset-d.md`（Total Equity 口径同步）
- `docs/changelog/INDEX.md` / `STATUS.md`

## 11. Batch 2 验收追加修复（本轮同批交付）

### 11.1 [P0 资金红线] Futures 提现禁止扣 Trial Bonus

`useWithdraw.submitWithdrawal` futures 侧此前调用 `deductBalance(amount)`——该函数遵循"Trial 优先、混合扣"语义，会在 `balance < amount` 时先扣 `trial_balance`，等于**把 Trial Bonus 提走**，直接违反"Trial 不可提现、提现只动 Available"的 2b 拍板口径（余额校验用 `balance` 是对的，扣款路径错了）。

修复：
- `useUserProfile` 新增 `deductAvailableOnly(amount)`——**仅**动 `profiles.balance`，`balance < amount` 直接 false，绝不触碰 `trial_balance`
- `useWithdraw` futures 分支切到 `deductAvailableOnly`，注释锁死"Never call deductBalance here"

**QA 用例**：Trial `$10` + Available `$100` → 提现 `$50` 完成后 `trial_balance` 必须仍为 `$10`（此前会被清零到 $0，Available 变 $60）。

### 11.2 充值三 Tab account 贯通

`account` 从 `DepositDialog` / `pages/Deposit.tsx` 的 `useAccountPreference('deposit')` 下发到三个子面板：
- `WalletDeposit` / `CrossChainDeposit` / `BuyWithFiat` 新增 `account?: 'spot' \| 'futures'` prop
- 三个 sub-panel 目前均为演示 UI（不真实入账），prop 以 `_account` 接收 + JSDoc 锁死："如接入真实入账路径，必须传给 `record-transaction` 的 `account` 字段"
- `record-transaction` EF 服务端已支持 `account` 字段（2b 主 batch），前端下水管本轮打通，账户选择不再是纯 UI 状态

### 11.3 `record-transaction` 修复的历史影响

此前 `record-transaction/index.ts` `import` 的 cors 路径不存在，函数 boot 即失败——意味着**在生产/预发布环境提现流水从未真正落库**（客户端 mutation 会收到 500 并抛错，扣款理论上不会发生，但如果曾以 mock 数据绕过或旁路手动补，可能有静默漂移）。本轮修复后首次可用。

**QA 需全链路重验**：
- Futures 提现 → 校验 `transactions` 有新 row、`account='futures'`、`type='withdraw'`、`status='processing'`
- Spot 提现 → 同上但 `account='spot'`
- Withdraw `deductAvailableOnly` 结合 §11.1 用例复验 Trial 保留

## 12. 涉及文件（append 于 §10）

**编辑**
- `src/hooks/useUserProfile.ts`（新增 `deductAvailableOnly` 导出）
- `src/hooks/useWithdraw.ts`（futures 侧扣款切 `deductAvailableOnly`）
- `src/components/deposit/WalletDeposit.tsx` · `BuyWithFiat.tsx` · `CrossChainDeposit.tsx`（新增 `account` prop）
- `src/components/deposit/DepositDialog.tsx` · `src/pages/Deposit.tsx`（下发 `account`）

## 13. 明确不做（后续轮）

- Sports 子站余额源接入
- 现货结算入账演示流（轮次 4，目标账户已在 2a 文档写死 = `spot_balance`）

