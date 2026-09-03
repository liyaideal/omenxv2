# Wallet（Wallet · Lite/Pro 共用页）— 整体交付说明 v1

> 这份文档说的是钱包那几页：`/wallet`（余额、两个账户、流水、地址簿）、`/deposit`（充值）、`/withdraw`（提现）、`/wallet/recovery` 与 `/wallet/recovery/:id`（打错网络的找回申请）。
> 这一轮之后，研发只读这一份就能从旧版做出现在的钱包：每个区块长什么样、按什么顺序排、文案与色值逐字抄自代码，都在 §3 与 §4。
> 哪些是演示值、哪些等后端接真，集中在 §5，不要拿演示值当上线口径。
> 怎么读：先看 §0 知道去哪儿查，再按章节读；正文与旧 changelog 冲突时以本文为准，冲突处已就地标注。

## 0. 读者须知

查什么去哪儿：
- 长什么样 → 生产页 `/wallet` · `/deposit` · `/withdraw` · `/wallet/recovery` · `/wallet/recovery/:id`
- 什么时候变成什么样 → `/style-guide` → Lite → Wallet 状态字典（W-1…W-33，每个 case 有「状态 / 触发条件 / 视觉 / 数据来源」表）
- 字段名、文案、公式、时间口径、术语 → `docs/copy-dictionary.md`（`## Wallet` 节 + 顶部「Lite 术语对照表」）→ 本文档对应章节
- 设计法则（颜色轴、容器、DSH、overlay 对等、Transaction row）→ `DESIGN.md`
提问前先按上面顺序查一遍；查不到再提，提问时写明"我查了 X 没有"。

本文档并入的历史来源（以下五份自 2026-09-03 起只作历史底账，不再维护）：

| 历史文件 | 并入内容 |
|---|---|
| `docs/wallet-lite-revamp-delivery.md` | Wallet Lite R1 三批：未登录门 / 地址操作 / 流水规格 |
| `docs/changelog/2026-07-21-dual-account-core.md` | 双账户内核（Standard / Boost、Transfer、账本 `account` 字段） |
| `docs/changelog/2026-07-21-dual-account-wallet-ui.md` | `/wallet` 三段式 UI（Hero + 双账户卡 + 活动区） |
| `docs/changelog/2026-07-21-trial-bonus-sunset.md` | Trial Bonus 退役与 `computeTotalEquity` 单一口径 |
| `docs/changelog/2026-05-20-recovery-v2.md` | Recovery 3 态 + 固定 10% 手续费 |

## 1. 改版总览（历史压缩，只讲留下了什么）

| 阶段 | 留给现状的东西 |
|---|---|
| 双账户内核（dual-account-core） | 账户模型 `spot`=Standard / `futures`=Boost；`profiles.spot_balance` + `profiles.balance`；`transactions.account` 字段；`sim-transfer` 双腿账本写入 |
| `/wallet` 三段式 UI（dual-account-wallet-ui） | Band 1 Hero 总权益 → Band 2 双账户卡 → Band 3 活动区；移动端与桌面同构，仅堆叠方向不同 |
| Trial 退役（trial-bonus-sunset） | `computeTotalEquity({spotBalance, balance})` 成为总权益唯一口径，`trial_balance` 体系全站下线 |
| Recovery v2 | 状态收敛为 3 态（`submitted` / `completed` / `rejected`）+ 固定 10% 手续费，无报价流程，用户不可改 `status` |
| Wallet Lite R1 三批 | Lite 未登录门 `LiteAuthGate`；地址行 Copy + `⋯` 菜单（桌面 Popover / 移动 MobileDrawer）；流水行方向式转账描述与每行账户徽标 |
| M7 收敛 | 单资产单网络 USDC on Base；法币（Banxa）入口退役；提现地址仅 Base；充提未登录门；style-guide 归并为 W-1…W-33 |
| 品牌升级（R-W1…R-W4） | token 层 `--background 240 25% 5%` / `--card 220 14% 9%`、描边 `#1D2026`、hero 艺术底图与 lynx 空态插画、DSH v1 桌面子页页头、全站容器 `mx-auto w-full max-w-7xl px-4 py-10 lg:px-6` |

## 2. 路由与入口动线

实查 `src/App.tsx` L211–215，钱包域共五条路由：

| 路由 | 组件 | 桌面 | 移动 |
|---|---|---|---|
| `/wallet` | `Wallet.tsx` | 完整三段式页面 | 纵向堆叠 + BottomNav |
| `/deposit` | `Deposit.tsx` | `useEffect` 内 `navigate('/wallet', { replace: true })` | 独立页 |
| `/withdraw` | `Withdraw.tsx` | 同上重定向 | 独立页 |
| `/wallet/recovery` | `RecoveryRequest.tsx` | DSH v1 页头 + 列表 | MobileHeader + 列表 |
| `/wallet/recovery/:id` | `RecoveryRequestDetail.tsx` | DSH v1 页头 + 2fr/1fr 双列 | 纵向 |

入口动线简表：

| 入口 | 桌面落点 | 移动落点 |
|---|---|---|
| Hero「Deposit」 | `DepositDialog`（弹窗） | `navigate('/deposit')` |
| Hero「Withdraw」 | `WithdrawDialog`（弹窗） | `navigate('/withdraw')` |
| Hero「Transfer ⇄」/ 账户卡右上 `ArrowLeftRight` | `TransferDialog` | `TransferDrawer` |
| `/wallet` 底部文字链 `Sent funds to the wrong network? Request recovery →` | `/wallet/recovery` | 同 |
| `PendingConfirmations` 内联链接（仅有待确认充值时挂载） | `/wallet/recovery` | 同 |

Transfer 无独立路由，只有 Dialog / Drawer 两件。

## 3. 页面结构逐区块规格

### 3.1 `/wallet` 桌面

容器逐字：`<main className="mx-auto w-full max-w-7xl px-4 py-10 lg:px-6 space-y-[18px]">`，外层 `EventsDesktopHeader`，整页包在 `WalletAuthGate`（见 §3.7）内，页尾 `SeoFooter`。顶部维护公告 `MaintenanceNoticeBanner`（读 `src/config/maintenanceNotices.ts`，空数组零高度）。

**Band 1 · `HeroEquityCard`**

| 部件 | 逐字规格 |
|---|---|
| 卡面 | `relative overflow-hidden rounded-[18px] border border-border bg-card`，桌面内距 `p-[34px_36px]` |
| 艺术底 | `heroThread`（`src/assets/wallet/hero-thread.webp`）`absolute inset-0 z-0 h-full w-full object-cover object-right`，`aria-hidden` + `pointer-events-none select-none`，`onError` 静默隐藏 |
| 标签 | `Est. Total Equity`，`text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground` |
| 眼睛开关 | `Eye` / `EyeOff` 4×4，`aria-label` 在 `Show balance` / `Hide balance` 间切换；隐藏态大数显示 `••••••` |
| 大数 | `font-display font-bold tabular-nums`，桌面 `text-[60px] leading-[0.96]`，值 = `computeTotalEquity({ spotBalance, balance })` 经 `formatEquityUsd` |
| 副注 | `Boost + Standard · {equityNote}`；Lite 传 `does not include open trade profit`，Pro 用默认 `does not include unrealized PnL` |
| 按钮组 | Deposit（`bg-[image:var(--gradient-button-primary)]` 胶囊）/ Withdraw（`variant="outline" bg-secondary`）/ Transfer（`variant="ghost"`，尾随 `⇄`），桌面 `py-3 px-[22px] rounded-full` |

**Band 2 · 双账户卡** — `<section className="grid grid-cols-2 gap-6">`，两卡同壳 `AccountCardShell`（`rounded-2xl border border-border bg-card p-6`）。

| 卡 | 徽标 | 徽标色 | Available 说明句 | 底注 |
|---|---|---|---|---|
| `SpotAccountCard` | `Standard` | `bg-primary/15 text-primary border border-primary/30` | Lite：`Cash you can trade or withdraw. Doesn't include open trade profit — money spent on shares sits in your positions.` | `Buy and sell shares at full price.` |
| `FuturesAccountCard` | `Boost` | `bg-accent/20 text-accent border border-accent/40` | Lite：`Cash you can trade or withdraw. Doesn't include open trade profit.` + `In use by open positions` / `Open trade profit` 两行（仅 `marginInUse > 0`） | `Put in a little to control a bigger trade — Boost up to {N}×` |

两卡共有：`Available (USDC)` 标签 + `Info` 3×3 Popover（`w-64 p-3`，底部 `View positions in Portfolio →`）；右上角 8×8 `ArrowLeftRight` 转账按钮（`aria-label` = `Transfer to Standard` / `Transfer to Boost`，`title="Transfer"`）；金额 `font-display font-bold tabular-nums text-4xl`，隐藏态 `••••`。

**Band 3 · 12 栅格** — `<div className="grid grid-cols-12 gap-6">`

- `col-span-8 space-y-6`：`PendingConfirmations` → `trading-card p-6` 内 `TransactionHistory`（取数失败换 `ErrorState`「Couldn't load transactions」+ 重试）→ recovery 文字链 `Sent funds to the wrong network? Request recovery →`（`text-[11px] text-muted-foreground underline underline-offset-2`）。
- `col-span-4 space-y-6`：Saved addresses 卡（`trading-card p-6`）——题头 `Saved addresses`（`text-[11px] uppercase tracking-[0.12em]`）+ 右侧计数 `{n} address(es)`；地址行 `SavedAddressRowView`（行间 `border-b border-[#1D2026]`），桌面行尾 Copy 图标 + `⋯`（Popover 菜单），菜单顺序 **Set as default（非默认才有）→ Copy address（仅移动）→ Delete address（红）**；末尾虚线钮 `Add address`（`border-[1.5px] border-dashed border-[#2B2F38] rounded-xl h-10`）；零地址时 `EmptyState variant="module" bordered={false}`，`title="No saved addresses"`，`illustrationSrc=lynx-empty-addresses.png`，`description="Save addresses for quick deposits and withdrawals."`。

弹层：`DepositDialog` / `WithdrawDialog` / `TransferDialog` / `AddAddressDialog` / 删除确认 `Dialog`（`Delete Address?` + `AlertTriangle`）。

### 3.2 `/wallet` 移动

`MobileHeader variant="brand" showBack={false}` → `px-4 py-6 space-y-4` 容器 → `MaintenanceNoticeBanner` → `HeroEquityCard compact` → 双账户卡纵向（`section space-y-3`，两卡 `compact`）→ `PendingConfirmations` → `SavedAddressesList`（`trading-card p-4`）→ 流水卡（`trading-card p-4`）→ recovery 文字链 → `SeoFooter`（外层 `marginBottom: var(--bottom-nav-h, 76px)`）→ `BottomNav`。

- Hero 移动底图：`hero-thread-mobile.png` 单张 `<img absolute inset-0 h-full w-full object-cover>`，卡面不再叠加任何渐变层（R-W2-FIX2 定稿）；大数 `text-[42px]`；按钮 `grid grid-cols-2 gap-2`，Transfer 占整行 `col-span-2`，全部 `h-11 rounded-full`。
- 地址行操作走 `MobileDrawer`（`SavedAddressActionsList`，项高 `py-[15px]`），删除确认走 `DeleteAddressDrawer`。
- Transfer 出 `TransferDrawer`。**红线保留：移动端 Transfer 出 Dialog 即验收失败。**

### 3.3 Deposit

移动页 `Deposit.tsx` 流程：

1. 未登录 → `MobileHeader title="Deposit"` + `WalletAuthGate` 包 `WalletGatePlaceholder`（惰性占位块，绝不请求地址）。
2. Step 1「Deposit to」：`AccountPickerRows` 选账户，说明句 `Pick which account will receive your funds. You can change this later.`。
3. 选定后顶部出现账户 crumb 条（`To: {ACCOUNT_LABEL[account]}` + `ChevronRight`），点击重开 `AccountPicker`。
4. Tabs 两页：`Address`（`WalletDeposit`）/ `Wallet`（`CrossChainDeposit`，bridge **仅充值方向**）。
5. 页尾支持链接 `Need help? Contact support`（`mailto:customerservice@omenx.com`）。

桌面 `DepositDialog` 同两 tab 结构（`Address` / `Wallet`），**无 Fiat tab**。

充值前拦截（`WalletDeposit`）：三段 checkbox 全勾才露出 QR + 地址，逐字为 `I am sending USDC (not USDT, ETH, BNB, or any other token)` / `I am using the Base network (not Ethereum, BSC, Polygon, Arbitrum, or any other chain)` / `I have double-checked the deposit address below before sending`；风险卡句 `Only send USDC on Base network.`。
**历史记录为 localStorage key `deposit-ack-v2`，现行实现为 `omenx:deposit:base-usdc-warning-ack-v2`（登录后再拼 `:{user.id}`），以现行为准。**

链上配置写死单一路径：`USDC` / `Base` / `chainId 8453` / 合约 `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` / `decimals 6` / `confirmationBlocks 12` / `estimatedTime '< 2 minutes'` / `fee 0`。跨链 tab 的 Bridge fee 行逐字 `Varies by route`。

### 3.4 Withdraw

移动页 `Withdraw.tsx`：未登录同款 guest gate；登录后 `WithdrawSubmitProvider` 包裹 `WalletWithdraw`，页尾支持链接，底部 `StickyWithdrawBar`（CTA `Withdraw`，提交中 `Processing...`），再下是 `BottomNav`。桌面走 `WithdrawDialog`。

- 表单：金额 + From account 行（`spot` / `futures`）+ 地址选择。地址列表仅 Base 可选：非 Base 行 `disabled`，caption 逐字 `Base only — this address can't receive withdrawals`；新增地址 network 固定 `Base`（`EMPTY_FORM = { label: '', address: '', network: 'Base' }`），无网络选择器。
- 验证：`WithdrawVerifyDialog` 按 `profiles.withdraw_2fa_mode`（`email` / `totp` / `both`）与绑定状态派生步骤队列 `bind_email` → `email_otp` → `bind_totp` → `totp`。
- 扣款口径：`debitAccount === 'spot' ? deductSpotBalance(amount) : deductAvailableOnly(amount)`；Trial 退役后两个 helper 都是单源写，`deductAvailableOnly` 仅保留调用点语义。
- 账本：提交先经 `record-transaction` 写 `type: 'withdraw'`、`amount: -amount`、`status: 'processing'`、`account: debitAccount`，失败即抛错不扣款。
- 追踪：`WithdrawStatusTracker` 五步进度（§6.1）。

### 3.5 Transfer

三件套：`TransferForm`（内核）+ `TransferDialog`（桌面）+ `TransferDrawer`（移动）。

- 方向分段器两项逐字：`Boost → Standard`（`to_spot`）/ `Standard → Boost`（`to_futures`）；`fromLabel` / `toLabel` 用 `Boost Account` / `Standard Account`。
- 金额输入 + `Max`（取 `fromAvailable`）；`amount > fromAvailable` 判 insufficient，按钮禁用。
- 提交走 `transferBetweenAccounts(direction, amount)` → 边缘函数 `sim-transfer`（一借一贷 + 两行 `transactions`）。成功 toast 逐字 `Transferred $X to Standard|Boost`。
- 流水里两腿用方向式描述：`Transfer to Boost` / `Transfer from Boost` / `Transfer to Standard` / `Transfer from Standard`。

### 3.6 Recovery 列表与详情

**列表 `/wallet/recovery`**

- 桌面：`EventsDesktopHeader` → 容器 `mx-auto w-full max-w-7xl px-4 py-10 lg:px-6` → `DesktopSubpageHeader title="Recovery" onBack={() => navigate('/wallet')}`，右槽 `+ New request`（`size="sm" h-9 rounded-lg`）→ `mt-[22px] space-y-6` 内容。移动：`MobileHeader title="Recovery" showBack`，`New request` 按钮在「Your requests」行右侧。
- intro 卡：`rounded-xl border border-border/60 bg-muted/30 p-5`，黄色 `Info` 图标；标题 `Wrong-chain recovery service`；费率句中 `10% recovery fee` 为 `text-trading-yellow font-medium`；两枚描边 pill `10% flat fee` / `3–7 business days`。
- 列表：题头 `Your requests`；每行 = 金额（`font-mono`）+ `{token} on {network}` + `RecoveryStatusBadge` + 日期 + `ChevronRight`，点击进详情。
- 空态：lynx 插画（`lynx-empty-recovery.png`，`w-24 h-24 object-contain`，`aria-hidden`）**替换**默认图标（无 Inbox 图标）+ `No recovery requests yet` + `Submit a request if a deposit was sent to the wrong network.`。
- `showForm` 切换到「New recovery request」（`RecoveryForm`，桌面 `max-w-xl`，右上 `Cancel`）。

**详情 `/wallet/recovery/:id`**

- 桌面：`DesktopSubpageHeader title="Request detail" onBack={back}`（右槽空）→ `mt-[22px] grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 items-start`；左列 Status+Timeline → payout → Admin note（`Message from OmenX`，仅有 `admin_note` 时），右列 Request details（可复制行，地址/哈希 `truncate` 为首 6 + 尾 6）+ Discord support footer。
- 移动：纵向 statusCard → payoutCard → detailsCard → adminCard → supportFooter。
- support footer 逐字 `Questions? Contact support`，跳 `https://discord.gg/qXssm2crf9`（新标签页 + `ExternalLink` 图标）。

### 3.7 未登录门

| surface | 组件 | 视觉 |
|---|---|---|
| Lite | `LiteAuthGate` | 底层模糊 + LynxFigure，标题 `Sign in to view your wallet`，描述 `Deposit, withdraw and move funds between your accounts by signing in.`，Sign in / Create account 两钮 |
| Pro | `AuthGateOverlay` | 同标题，描述 `Manage your funds and saved addresses by signing in.` |

`/deposit` 与 `/withdraw` 复用同一 `WalletAuthGate` + `WalletGatePlaceholder`。`/wallet/recovery` 未登录是独立屏：`AlertTriangle` + `Sign in required` + `Please sign in to submit or view your recovery requests.`。

## 4. 视觉与品牌落点

Token 层（`src/index.css`）：`--background: 240 25% 5%`、`--card: 220 14% 9%`、`--border: 222 15% 13%`；卡面渐变已平面化，`.trading-card` = `bg-card rounded-xl border border-[#1D2026]`，hover 描边 `#262A31`。

容器规范（全站一致）：`mx-auto w-full max-w-7xl px-4 py-10 lg:px-6`；`max-w-3xl` 仅限 Settings 类纯表单页。Recovery 两页 2026-09-03 已修正合规（原 `max-w-3xl` / `max-w-5xl` + `px-6 pt-8 pb-8`）。

DSH v1（`src/components/layout/DesktopSubpageHeader.tsx`，DESIGN.md §10）：

| 部件 | 逐字 |
|---|---|
| 条 | 56px 高，`border-b border-[#1D2026]`，`flex items-center gap-[10px]` |
| 返回钮（定稿 B） | 36×36，`border border-[#262A31] rounded-[10px]`，`ArrowLeft` 18px `text-[#A8AEB6]`，hover `border-[#2E333B]` + `text-[#E8EAED]`，`aria-label="Back"` |
| 页名 | Archivo（`font-sans`）17px/600 sentence case，与该路由移动端 MobileHeader 标题同词 |
| 右槽 | `children`，≤1 主动作，可空 |
| 副题 | 无 —— 说明性文字进开场卡 |
| 到内容 | 22px |

应用判定：父级在桌面顶栏导航（portfolio 详情、活动详情）→ 不挂，标题进首卡 / hero；父级不在顶栏（`/wallet/recovery` 及 `:id`）→ 必挂。

素材清单（`src/assets/wallet/`，登记于 style-guide Foundations「Brand assets · IP 插画」）：

| 文件 | 尺寸 | 落点 |
|---|---|---|
| `hero-thread.webp` | 1920×286 | `/wallet` 桌面 Hero 艺术底 |
| `hero-thread-mobile.png` | 1074×774 | `/wallet` 移动 Hero 整图 |
| `lynx-empty-activity.png` | 330×330 | 流水空态 |
| `lynx-empty-addresses.png` | 330×330 | Saved addresses 空态 |
| `lynx-empty-recovery.png` | 330×330 | Recovery 列表空态 |

徽标统一件：`src/lib/productLineBadge.tsx`（`STANDARD` primary 系 / `BOOST` accent 系），页面不得覆写。

## 5. 资金与状态边界（研发须知）

总原则：**服务端权威**。当前 `profiles.balance` / `profiles.spot_balance` 仍可被客户端写（RLS 未收敛），`sim-transfer` 已是双腿账本的权威写入点。生产目标：所有余额写入收敛到 EF，拒绝客户端直写。

演示值清单与切真开关位置：

| 项 | 现状（演示值） | 切真位置 |
|---|---|---|
| 提现限额 | min 20 / max 10,000 / 日限 50,000（`MOCK_WITHDRAW_LIMITS`） | `src/hooks/useWithdraw.ts` 的三个 `TODO: Replace with actual API call` |
| 提现历史 / 待处理 | 恒为空数组 | 同上 |
| 提现验证码 | demo 码 `111111`；TOTP demo secret 由 `generateDemoTotpSecret()` 造 | `src/lib/demoOtp.ts` |
| 冻结 / 解冻账务 | 仅 UI 文案（失败态写 `Your funds have been unfrozen and returned to your available balance.`），账务未实现 | 后端补 |
| 跨链 bridge | 前端演示语义，无真实路由与报价；fee 行 `Varies by route` | `CrossChainDeposit.tsx` |
| 充值地址 | `get-deposit-address` / `generate-deposit-address` 演示地址，不入账余额 | `WalletDeposit` 注释处 |
| Deposit-to 账户偏好 | localStorage（`omenx:deposit-account` / `omenx:withdraw-account`） | `src/hooks/useAccountPreference.ts` |

P0 处置口径五条：

1. 充值与提现页一律加登录门（`/deposit`、`/withdraw` 已与 `/wallet` 同门）。
2. bridge 线上**只支持 deposit 方向**，不支持 withdraw 跨链。
3. Banxa 法币入口已弃用并隐藏（bug 多）；后续换 MoonPay 另做流程，`BuyWithFiat.tsx` 留仓不挂载。
4. 资产收敛为 Base-only USDC，充提与地址簿皆按此校验。
5. 账户偏好待服务端化（08-31 拍板转研发）：链上到账任务按服务端偏好记入 Standard / Boost，单一充值地址，不按账户分地址。

Recovery 费率固定 10%、3–7 business days，全人工处理，无自动化。

## 6. 状态机

### 6.1 提现（`WithdrawRecord.status`）

| status | 含义 | 触发方 | UI |
|---|---|---|---|
| `REQUESTED` | 已提交 | 用户 | 进度条第 1 步 |
| `APPROVED` | 已审核 | 运营 / 自动 | 第 2 步 |
| `SENT` | 已广播 | 链上任务 | 第 3 步 |
| `CONFIRMED` | 已确认 | 链上任务 | 全绿 + `basescan.org/tx/{txHash}` |
| `FAILED` / `REJECTED` | 失败 / 驳回 | 系统 / 运营 | 红色 XCircle + 解冻返还句 |

### 6.2 Recovery（`recovery_requests.status`，3 态）

| status | 含义 | 触发方 | UI |
|---|---|---|---|
| `submitted` | 已提交，人工处理中 | 用户创建即默认 | 时间线第 1 步（`Loader2` 转圈）+「3–7 business days」 |
| `completed` | 已到账 | 运营 | 时间线两步全绿 + payout 卡（含 `processed_tx_hash`） |
| `rejected` | 驳回 | 运营 | 红框 `Request rejected` + `See note below for details.`，无 payout 卡 |

用户**不能修改** `status`（DB trigger `enforce_recovery_request_user_update` 封死）。v1 的 `reviewing / quoted / accepted / processing / unrecoverable` 五个中间态已废。

### 6.3 PendingConfirmations

拉 `transactions` 中 `type='deposit'` 且 `status ∈ (pending, processing)` 的行，`refetchInterval: 5000`；每行显示 `Confirming`、`{c}/{r} blocks` 与按网络估算的剩余时间（Base 默认块时间，Bitcoin 600s / Ethereum 12s / Solana 0.4s）；无待确认行时整块不挂载（因此 `/wallet` 底部另有常驻 recovery 文字链）。

## 7. 数据库与后端

| 表 | 字段（实查 information_schema） | 说明 |
|---|---|---|
| `recovery_requests` | `id` / `user_id` / `tx_hash` / `wrong_network` / `wrong_token` / `claimed_amount` / `sender_address` / `user_note` / `status` / `fee_percent` / `estimated_return` / `admin_note` / `processed_tx_hash` / `created_at` / `updated_at` / `quoted_at` / `accepted_at` / `completed_at` | RLS：SELECT/INSERT 限 `auth.uid() = user_id`；UPDATE 由 trigger 限制（admin 放行，用户改关键字段与 `status` 一律拦截）；无 DELETE 策略；`has_role(auth.uid(),'admin')` 全开。`fee_percent` 固定 10，`estimated_return = claimed_amount × 0.9`。`quoted_at` / `accepted_at` 为 v1 残留字段，UI 零渲染，v2 仅 `completed_at` 写入 |
| `transactions` | `id` / `user_id` / `type` / `amount` / `description` / `created_at` / `updated_at` / `tx_hash` / `network` / `status` / `confirmations` / `required_confirmations` / `account` | `account ∈ {spot, futures}`，缺省行在 UI 兜底为 `spot`；写入统一走 `record-transaction` |
| `profiles` | `balance`（Boost 可用）/ `spot_balance`（Standard 可用）/ `withdraw_2fa_mode` / `totp_enabled` / `email` | 总权益 = `computeTotalEquity({spotBalance, balance})`；2FA 字段决定提现验证步骤队列 |

边缘函数：

| EF | 职责 | 口径 |
|---|---|---|
| `sim-transfer` | 账户间转账：一借一贷 + 两行 `transactions` | 校验 `direction ∈ {to_spot,to_futures}`、`amount` 正数且 ≤ 1,000,000；Bearer JWT 校验；服务端权威写 |
| `record-transaction` | 写账本行 | 白名单 `type`（deposit / withdraw / card_deposit / cross_chain_in / cross_chain_out / fiat_buy / fiat_sell / trade_profit / trade_loss / transfer_to_spot / transfer_to_futures）、`status`（completed / processing / pending / failed / rejected）、`account`（spot / futures）；历史上曾因 CORS 子路径 import 导致 boot 失败，现改为本地 `corsHeaders` 常量，已修复 |
| `get-deposit-address` / `generate-deposit-address` | 演示充值地址 | 不入账余额 |

演示数据：仅 `alex.carter@gmail.com` 注入流水与 recovery 演示行，其他账号不得出现。

## 8. 文案与词典口径

唯一出处 `docs/copy-dictionary.md` → `## Wallet (/wallet, 2026-08-25)`。改字前先改那张表。关键术语摘录：

| Canonical | 含义 |
|---|---|
| `Standard` / `Boost` | 两个账户名（对应 `spot` / `futures`），账户全称 `Standard Account` / `Boost Account` |
| `Est. Total Equity` | Hero 大数标签，值取 `computeTotalEquity` |
| `does not include open trade profit` / `does not include unrealized PnL` | Lite / Pro 的 equity 副注 |
| `Available (USDC)` | 两张账户卡的余额标签 |
| `Transfer to / from Boost｜Standard` | 转账两腿的方向式流水描述 |
| `Saved addresses` / `Default` / `Set as default` / `Copy address` / `Delete address` | 地址簿区块与菜单项 |
| `Sent funds to the wrong network? Request recovery →` | `/wallet` 底部 recovery 文字链 |
| `A flat 10% recovery fee applies` / `10% flat fee` / `3–7 business days` | Recovery 费率与时长（en dash） |
| `Varies by route` | 跨链 Bridge fee 行 |
| `Base only — this address can't receive withdrawals` | 非 Base 地址行 disabled caption |
| `Pending confirmations` / `Confirming` / `{c}/{r} blocks` | 待确认充值区块 |

## 9. 状态索引

`/style-guide` → Lite → Wallet 状态字典（`WalletStatesSection.tsx`）：

| 模块 | style-guide case |
|---|---|
| 待确认充值（桌面 / 移动） | W-1、W-2 |
| 交易流水（空 / 筛选空 / 五种 status / 未知 type / 展开 / 平台入账 / fiat 净额） | W-3、W-4、W-6、W-7、W-8、W-17、W-20 |
| Saved addresses 空态 | W-10 |
| Hero 金额隐藏 | W-11 |
| Deposit 弹窗（清单 / 地址 / Fiat 存档 / 跨链） | W-12、W-13、W-14（已退役存档）、W-15 |
| Withdraw 桌面表单 | W-16 |
| Wallet 组合层（桌面 / 移动） | W-18 |
| 登录门 | W-19 |
| 充值流（前屏 / 清单 / 地址 QR / 跨链） | W-21、W-22、W-23、W-24 |
| 提现流（表单 / 地址选择 / 新增地址 / 四种验证 / 状态追踪 / sticky） | W-25、W-26、W-26b、W-27a–d、W-28、W-29 |
| Recovery（入口与表单 / 列表 / 三态详情） | W-30、W-31、W-32a–c |
| 维护横幅 | W-33 |

**历史记录为「W-5 / W-9 两个 case」，现行 style-guide 无此两键（已并入相邻 case），以现行为准。**

## 10. 涉及文件

页面：`src/pages/Wallet.tsx`、`Deposit.tsx`、`Withdraw.tsx`、`RecoveryRequest.tsx`、`RecoveryRequestDetail.tsx`
组件：`src/components/wallet/*`（`TransactionHistory` / `PendingConfirmations` / `TransferForm` / `TransferDialog` / `TransferDrawer` / `AccountPicker` / `AddAddressDialog` / `DeleteAddressDrawer` / `ColoredAddress` / `MaintenanceNoticeBanner` / `AccountBalanceLine`）、`src/components/deposit/*`（`WalletDeposit` / `CrossChainDeposit` / `DepositDialog` / `DepositDetails` / `BuyWithFiat`（留仓不挂载））、`src/components/withdraw/*`（`WalletWithdraw` / `WithdrawDialog` / `WithdrawAddressSelect(+Dialog)` / `WithdrawVerifyDialog` / `WithdrawStatusTracker` / `StickyWithdrawBar` / `WithdrawSubmitContext` / `CrossChainWithdraw`）、`src/components/recovery/*`（`RecoveryForm` / `RecoveryStatusTimeline`）、`src/components/layout/DesktopSubpageHeader.tsx`、`src/components/portfolio/lite/LiteAuthGate.tsx`、`src/components/AuthGateOverlay.tsx`
Hooks / 库 / 配置：`src/hooks/useWithdraw.ts`、`useDeposit.ts`、`useWallets.ts`、`useRecoveryRequests.ts`、`useAccountPreference.ts`、`useUserProfile.ts`、`src/lib/equity.ts`、`src/lib/demoOtp.ts`、`src/lib/productLineBadge.tsx`、`src/config/maintenanceNotices.ts`、`src/types/withdraw.ts`、`src/types/deposit.ts`
资产：`src/assets/wallet/hero-thread.webp`、`hero-thread-mobile.png`、`lynx-empty-activity.png`、`lynx-empty-addresses.png`、`lynx-empty-recovery.png`
字典 / 文档件：`src/pages/StyleGuide/sections/WalletStatesSection.tsx`、`src/pages/StyleGuide/preview/fundingPreviews.tsx`、`walletLitePreviews.tsx`、`preview/registry.tsx`、`docs/copy-dictionary.md`、`DESIGN.md` §8 / §10
边缘函数：`supabase/functions/sim-transfer`、`record-transaction`、`get-deposit-address`、`generate-deposit-address`、`simulate-confirmations`

## 11. 已删除 / 已废弃 + 未变更项

| 项 | 说明 |
|---|---|
| 法币入口（Banxa / Fiat tab） | 退役，`/deposit` 与 `DepositDialog` 均不挂载；`BuyWithFiat.tsx` 留仓待 MoonPay 轮 |
| `trial_balance` 体系 | 全站下线，总权益只由 `computeTotalEquity` 出 |
| Recovery 五个中间态与 quote 卡 | `respondToQuote` mutation、Accept / Decline 按钮、"Wait for quote" 文案全部移除 |
| 用户改 `status` 的能力 | DB trigger 封死 |
| 多链提现地址 | 仅 Base；非 Base 已存地址行 disabled |
| 旧 style-guide 节（`DepositWithdrawSection` / `WalletSection` / `WalletLiteR1Section` 的 16 preview 键索引） | 不再作为索引入口，内容并入 W-1…W-33；文件留仓 |
| Recovery 空态默认 Inbox 图标 | 由 lynx 插画替换（非叠加） |
| 桌面 recovery 旧「← Wallet」返回行 + 大标题 + 副题句 | 由 DSH v1 取代 |

未变更项：`BottomNav` / `MobileHeader` / `LiteEventCard` 三件 FROZEN 零触碰；认证逻辑与状态机；余额算法 `computeTotalEquity`；Transfer 语义；交易历史行规格（`DESIGN.md` §8：桌面单行、移动两层 `pl-[52px]`）；流水排序 / 分页 / 筛选；registry 旧 key。
