# 双账户改造 · 轮次 2a：资金内核（Dual-Account Core）— 交付说明

> 本轮（2a）只做资金内核：schema、划转函数、现货链路余额源切换、风控口径。
> /wallet 分区、Transfer 弹窗 UI、充值/提现选账户、顶栏 Total Equity、style-guide 增量、Sports 子站余额源、结算入账演示流**一律不做**（下一轮 2b 与后续轮次）。
> 拍板日 2026-07-21，全部已定，不再讨论。

## 1. 功能目标

平台把资金拆成**现货账户 / 合约账户**（CEX 式，对齐 Binance/Bybit 范式）。账户是资金维度，与 Pro/Lite surface 无关。

- **合约账户** = 现有 `profiles.balance`（Available）+ `profiles.trial_balance`（Trial Bonus）。所有奖励（券收益 claim、任务、宝箱、积分兑换、referral、H2E 空投）继续入合约账户，一行不改。
- **现货账户** = 新增 `profiles.spot_balance`（Available）。**只**用于 /spot 交易，不与 Trial Bonus 混用。
- 两账户可通过 `sim-transfer` 双向划转；`Total Equity = balance + trial_balance + spot_balance`。
- 新注册用户两账户 **$0** 起步（不再发演示金）；存量用户余额不动。

## 2. 账户定义

| 账户 | 列 | 用途 | 谁能加钱 | 谁能扣钱 |
|---|---|---|---|---|
| 合约账户 · Available | `profiles.balance` | /trade 保证金、券 redeem 冻结、奖励入账、划转目标 | 充值、Trial 到期转正、所有奖励 / claim、`sim-transfer` to_futures | /trade 开仓保证金、`sim-transfer` to_spot、提现 |
| 合约账户 · Trial Bonus | `profiles.trial_balance` | 合约开仓时**优先扣**（不进现货） | 首充 gift、welcome gift | /trade 开仓时优先耗用；到期归零 |
| 现货账户 · Available | `profiles.spot_balance` | /spot 下单 / 预扣 / 撤单退款 / 卖出回款 | `sim-transfer` to_spot、（未来）现货结算入账、（未来）现货充值 | /spot 买入或限价预扣、`sim-transfer` to_futures |

## 3. 数据库

### 3.1 Schema 变更

| 字段 / 类型 | 说明 |
|---|---|
| `profiles.spot_balance NUMERIC NOT NULL DEFAULT 0` | 现货账户 Available |
| `profiles.balance` 默认值 `13530 → 0` | 新用户不发演示金（此前默认 13530 与 `handle_new_user` 内 `v_initial_balance := 13530` 一致） |
| `transactions.account TEXT NULL CHECK (account IN ('spot','futures'))` | 账户归属；历史行留空 |
| `transactions.type` 允许新增 `transfer_to_spot` / `transfer_to_futures` | 划转两侧流水类型 |

### 3.2 Trigger 变更

`handle_new_user`：`v_initial_balance` 由 `13530` → `0`；**移除**所有演示 transactions / positions / trades 的批量插入；vouchers（每日池发放）和 `points_accounts` 保留。新账号注册后 profiles 两列均 0、transactions 表 0 行。

### 3.3 RLS（DEMO-STATE）

> DEMO-STATE：当前演示实现下，`balance` / `spot_balance` / `trial_balance` 三列仍**可由客户端直改**（RLS 未收敛），这是本仓库作为 Demo Engine 的现状。正式版目标：三列写入全部收敛到服务端 Edge Function，客户端直改被 RLS 拒绝（对齐 `record-transaction` 口径）。`sim-transfer` 走服务端已符合正式版口径。

## 4. Edge Function：`sim-transfer`

| 项 | 值 |
|---|---|
| 路径 | `supabase/functions/sim-transfer/index.ts` |
| 入参 | `{ direction: 'to_spot' \| 'to_futures', amount: number }` |
| 校验 | amount > 0；来源账户余额 ≥ amount；否则返回 400 明确错误 |
| 副作用 | 原子改两列（+/-）+ 写两条 transactions（type=`transfer_to_spot` / `transfer_to_futures`，account 分别标注来源与目标）|
| 权限 | Authorization Bearer；使用 SUPABASE_SERVICE_ROLE_KEY 服务端更新 |

## 5. 前端切换

### 5.1 `useUserProfile`

新增导出：`spotBalance` / `updateSpotBalance` / `deductSpotBalance` / `addSpotBalance` / `transferBetweenAccounts`。合约账户方法 `deductBalance` / `addBalance` / `updateBalance` 保留原语义（只动 `balance`），不受影响。

### 5.2 现货链路

| 挂载点 | 变更 |
|---|---|
| `src/pages/SpotTrading.tsx` | 下单校验、买入扣款、限价预扣、撤单退款、卖出回款全部改用 `spotBalance` / `deductSpotBalance` / `addSpotBalance` |
| `src/pages/SpotTrading.tsx` Account 面板 | 标题改 "Spot Account"；只显示 Available (USDC) + Open positions + 提示句 "Contract account & Trial Bonus do not fund spot trades. Transfer from /wallet."；移除 Equity / Trial bonus / Cash 三行拆分 |
| `src/hooks/useSupabaseOrders.ts` | spot 分支的 `fillOrder` / `cancelOrder` 入账改 `addSpotBalance`；futures 分支不动 |

**契约变更（不向后兼容）**：现货明确**不再**使用"Trial 优先扣、Available 兜底"的双余额模型。用户如需在 /spot 交易，必须先从 /wallet Transfer to Spot（UI 在 2b 交付）。

**切换时点口子（存量 Pending 挂单跨账户漂移）**：2a 之前的现货限价单是走合约账户预扣（Trial 优先）落库的；2a 切换后，这些遗留 Pending 单一旦成交或撤单，退款/回款会进 `spot_balance`，产生跨账户资金漂移。**已查库确认切换时点存量现货 Pending = 0**，无实际敞口，因此不做数据迁移；此口子仅存在于假设"切换时点仍有未成交现货挂单"的情形下，不再复现。

### 5.3 风控口径

`src/hooks/useRealtimeRiskMetrics.ts` 输入 positions 增加 `product_line !== 'spot'` 过滤。现货持仓 / 现货余额 **完全不进** IM / MM / Risk Ratio / close-only 判定。修复此前现货虚高 Risk Ratio 的 bug。

### 5.4 合约链路 / 奖励链路

**一行不改**。/trade、TradeOrder、券 claim / redeem、任务、宝箱、积分兑换、referral、H2E 入账仍走 `balance` + `trial_balance`。

### 5.5 Guest

Guest 匿名会话本来就不持久化任何余额（代码库从未在 localStorage 写入 `10000` / `13530` 演示金），本轮无改动，Guest 侧默认 $0。

## 6. 明确不做（本轮范围外）

| 项 | 归属 |
|---|---|
| /wallet 页分现货 / 合约两节 | 轮次 2b |
| Transfer 弹窗 UI（选择方向 + 金额输入） | 轮次 2b |
| 充值 / 提现流程选择账户 | 轮次 2b |
| 顶栏 Total Equity 展示 | 轮次 2b |
| Style-guide 双账户 section | 随 2b 的 UI 一起交 |
| Sports 子站余额源接入 | 后续轮次 |
| 现货结算入账 → `spot_balance` 演示流 | 轮次 4（本文档已写死目标账户） |

## 7. 涉及文件

**数据库**
- migration：`profiles.spot_balance` / `profiles.balance` 默认值 / `transactions.account` / `handle_new_user` 触发器

**后端**
- `supabase/functions/sim-transfer/index.ts`（新）

**前端**
- `src/hooks/useUserProfile.ts`
- `src/pages/SpotTrading.tsx`
- `src/hooks/useSupabaseOrders.ts`
- `src/hooks/useRealtimeRiskMetrics.ts`

**文档**
- `docs/backend-boundary.md`（2026-07-21 双账户 append-only 章节）
- `docs/changelog/INDEX.md`
- `docs/changelog/STATUS.md`

## 8. 未变更项

- 合约账户资金流（/trade 开平仓、TP/SL、Funding、Liq、券收益 claim、任务、宝箱、积分兑换、referral、H2E）
- 现货交易语义（SIGNED_YES_SHARE 净仓、反向买入对冲、卖出禁空、session-aware 盘口、9 态 lifecycle）—— 轮次 1 已定
- 出入金 UI（`/wallet` 主界面、Deposit / Withdraw 流程）
- Trial Bonus 生命周期（首充 gift、welcome gift、到期归零）
- 风控四态（SAFE / WARNING / RESTRICTION / LIQUIDATION）阈值与文案
