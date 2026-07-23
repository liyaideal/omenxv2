# Trial Bonus 全面下线 — 交付说明

> 本轮将 `profiles.trial_balance` 从代码路径中全面移除。列本身保留，由产品侧另行清零/drop。Position Voucher / voucher_earnings / 体验仓（`close-trial-position`）全链路零改动。

## 1. 背景

- **从未真正上线**：Trial Bonus 是早期"$10 免充值试玩"的方案，UI 引导 `TrialCallout` 从未挂到任何生产入口，落地页也未做过对应活动。
- **发放源已死**：`handle_new_user` 已在 2a 轮次改为两账户 $0 起步；`redeem-points` 唯一的在途兑换发放路径在 mainnet 上线时被 403 硬停。
- **存量**：21 户合计 $3,317，均为早期演示金残留，由产品侧另行清零。
- **券体系零依赖**：Position Voucher、`voucher_earnings`（含 T1–T4 阶梯）、体验仓 `close-trial-position`、`claim-voucher-earnings` 逐函数审计确认，均无 `trial_balance` 读写。

## 2. 新口径

```
Total Equity = spot_balance + balance
             (不含未实现 PnL)
```

- 合约账户扣款：只动 `balance`（`deductBalance` / `deductAvailableOnly` 合并语义）
- 现货账户扣款：只动 `spot_balance`（无变化）
- 顶栏 Equity 胶囊 / HoverCard / Hero / /wallet Band 1 / style-guide 镜像全部走 `computeTotalEquity({ spotBalance, balance })`

## 3. 资金逻辑改动（`src/hooks/useUserProfile.ts` 等）

| 项 | 前 | 后 |
|---|---|---|
| `computeTotalEquity` 签名 | `{ spotBalance, balance, trialBalance }` | `{ spotBalance, balance }` |
| `deductBalance` | Trial 优先混合扣 | 纯 `balance` 扣款（与 `deductAvailableOnly` 同义，名字保留以减少调用方改动） |
| `deductBalanceWithDetails` | 返回 trial/real 拆分 | 删除 |
| `updateTrialBalance` / `addTrialBalance` | 存在 | 删除（全站无发放调用方） |
| `totalBalance` 导出 | `balance + trialBalance` | 删除 |
| `trialBalance` 导出 | 存在 | 删除 |

## 4. UI 触点

- `src/pages/Wallet.tsx`：桌面 + 移动 Futures 卡"Trial Bonus"明细格删除；Band 1 副注改为 "Spot + Futures · does not include unrealized PnL"
- `src/components/EventsDesktopHeader.tsx`：HoverCard "Trial Bonus" 行删除（剩 Spot / Futures / Total 三行）
- `src/components/wallet/TransferForm.tsx`：`TrialHint` 组件与 From=Futures 的 ⓘ 提示删除
- `src/pages/SpotTrading.tsx`：Account 面板提示改为 "Spot and Futures accounts are funded separately. Transfer funds to your Spot Account to trade."
- `src/pages/OrderPreview.tsx`：紫色 "Trial Bonus / From Trial Bonus / Total Available" breakdown 条件段删除
- `src/components/home/HomeEquityHero.tsx` / `src/components/BottomNav.tsx` / `src/components/wallet/AccountPicker.tsx` / `src/components/wallet/TransferDialog.tsx`：同步 Trial 相关口径
- **删除**：`src/components/home/TrialCallout.tsx`、`src/components/rewards/RedeemDialog.tsx`（及 `src/components/rewards/index.ts` 导出）

## 5. Edge Functions

| 函数 | 改动 |
|---|---|
| `redeem-points` | 顶部 mainnet-launch 403 硬停保留；其后 unreachable 的 `trial_balance` 写入段删除 |
| `close-trial-position` | **不改名**，文件头加护栏注释澄清："'trial' here = Trial Position (voucher-funded demo position; Position Voucher domain). Unrelated to the retired wallet-level `trial_balance`." |

## 6. Style Guide 镜像同步

- `src/pages/StyleGuide/preview/walletPreviews.tsx`：`DEMO.trial` 删除、Band 1 副注同步、HoverCard 改两行、Futures 卡 Trial 格删除
- `src/pages/StyleGuide/preview/registry.tsx`：`TransferFormTrialHintPreview` 注册项删除
- `src/pages/StyleGuide/sections/WalletSection.tsx`：TransferForm SubSection 由 4 态改 3 态（normal / insufficient / zero）

## 7. 禁止

- 券体系全链路零改动（Position Voucher、`voucher_earnings`、`claim-voucher-earnings`、体验仓、T1–T4 阶梯）
- `points_accounts` / `points_ledger` / `user_tasks` 零改动
- 不做 UI 重设计（纯删除 + 文案替换）
- 不动 `profiles.trial_balance` 列本身（列的清零 / drop 由产品侧另行执行）

## 8. QA 要点

- 有 `trial_balance > 0` 的用户开合约仓：扣款只走 `balance`，`trial_balance` 不变
- 顶栏 Equity 胶囊 / Hero 主数 / /wallet Band 1 三处数值一致，且都 = `spot_balance + balance`
- 券兑换、体验仓开平、`voucher_earnings` T1–T4 claim 全链路回归：与下线前完全一致
- /style-guide WalletSection 双端预览无残留 Trial 元素
- OrderPreview 页无紫色 Trial breakdown 条

## 9. 语义变化说明（产品侧已确认）

- **BottomNav "Me" 抽屉 Equity 卡**：数字从 `balance + trialBalance` 改为 `spot_balance + balance`（全站 Total Equity 统一口径）。这是**有意的语义变化**——之前该卡片只算合约侧总额（含 Trial），下线后统一为跨账户 Total Equity，与顶栏胶囊 / Hero / /wallet Band 1 完全一致。产品侧已确认此变更可接受。
