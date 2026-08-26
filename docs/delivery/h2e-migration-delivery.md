# Hedge-to-Earn 迁移与空投可见性 — 交付说明 v1

> 本文档收口四轮改动：H2E 迁移进 Rewards、Airdropped positions 模块、状态一致性修复、演示数据滚动引擎（含 tiered 入账触发器）。
> 口径：**样式看生产组件、状态看 `/style-guide#lite-h2e`、本文档只写这两处看不到的东西**（数据口径、后端机制、已废弃项）。
> 本轮为归档轮，不含任何生产组件行为变更。

## 1. 功能目标

Hedge-to-Earn 从独立页面迁入 Rewards Center，`/rewards/campaign/h2e` 是唯一入口。
用户连接 Polymarket 钱包 → 合格仓位获得 $10 对冲空投 → 72h 内激活 → 结算收益进 H2E 收益池（cap $100），按交易量分档解锁提现。
本批解决三件事：空投在激活前不可见、演示 mock 污染记账、同一实体计数在两处不一致。

## 2. 空投生命周期与归属

| status | 住哪儿 | 计入徽标 | 计入 earnings |
|---|---|---|---|
| `pending` | H2E 详情页 Airdropped positions | ✅ | ❌ |
| `activated` | 同上 + `/portfolio` Live（pulse `Airdrop` 标） | ✅ | ❌ |
| `expired` | 同上（`opacity-55` 灰显） | ❌ | ❌ |
| `settled` | H2E 详情页 Recent settlements | ❌ | ✅（正 pnl） |

归属语法已写入 `DESIGN.md §Addendum 2026-08-26 A`：待动作住工具页、激活后进 portfolio 且必须带来源标、settled 归工具自己的 settlements。

## 3. 数据口径

### 3.1 计数（单一真相源）
```
liveAirdropCount = airdrops.filter(a =>
  a.source !== 'voucher' && (a.status === 'pending' || a.status === 'activated')
).length
```
消费方：模块徽标、`ConnectedAccountsCard` 的 Airdrops 计数、`H2eCampaignCard` s2Meta、`H2eRewardsCard` S2/S3。
**已废弃**：演示常量 `airdropsReceived`。

### 3.2 Earnings（`useH2eRewardsSummary`）
`totalEarned = Σ` 落库 `settled` 行的正 pnl，条件 `source !== 'voucher'` 且 `!id.startsWith('mock-')`；`earningsCap = 100`。
券收益走 `voucher_earnings` 独立池，绝不进 H2E cap。

### 3.3 $17.50 修复
mock 行曾被计入 earnings，导致 alex 的总额从 $11.00 漂到 $17.50。修复 = mock 行不落记账、`settled` mock 行从 hook 移除。现 alex 恒为 **$11.00**。

## 4. 数据库 / 后端

| 对象 | 说明 |
|---|---|
| `public.roll_demo_positions()` | 四步：结算过期仓 → 结算过期券仓/空投仓（守 $100 cap）→ 补开 alex 至 16 futures + 1 spot → cron 注册。幂等 |
| cron `roll-demo-positions` | 每日 05:20 UTC |
| futures 事件池 | `end_date > now() + interval '6 hours'` |
| spot 事件池 | `end_date > now() + interval '1 hour'`；排除 `CRYPTO_QUICK_UPDOWN_SPOT`；`lifecycle_status ∈ {NULL, ACTIVE, TRADING, EXTENDED_TRADING}` |
| `position_vouchers.tiered_credited_at` | tiered 入账幂等闩锁 |
| `trg_credit_tiered_voucher_settlement` | tiered 券仓 settled 时累加 `voucher_earnings.pending_amount` 并写 ledger（`type='accrual'`）。亏损/0 也落闩锁 |

**入账单一真相源 = 触发器**；`supabase/functions/close-trial-position` 中的 tiered 入账块已删除（防双记账）。instant 模式不变。

## 5. 前端自愈

`src/hooks/useAirdropPositions.ts` → `repointMocksToLiveEvents()`：运行时把 mock 空投指向活事件，避免演示行指向已结算事件。

## 6. 已删除 / 已废弃

| 项 | 说明 |
|---|---|
| `airdropsReceived` 演示常量 | 由 `liveAirdropCount` 取代 |
| 边缘函数 tiered 入账块 | 移到触发器 |
| `AirdropNotificationToast` | H2E 迁移轮已下线 |
| 取证目录 `public/qa-*-0825/0826`（本轮删除清单见交付回报） | 归档后清理 |

## 7. Style Guide

- `/style-guide#lite-h2e` —— H2E Campaign 节，5 个 case：网格卡、Connected accounts、Airdropped positions、进度卡、aside。每个 case 带「状态 / 触发条件 / 视觉结果 / 字段来源」表。
- `/style-guide#lite-portfolio` —— 新增 Live 行标枚举 case（桌面 LiveRow / 移动 LiveCard 各一）。
- 已知限制：H2E 模块状态全由 hook 判定、无 props，预览 iframe 无会话 → 活体渲染恒为 S0；S1/S2/S3 以状态表为准。

## 8. 涉及文件

**前端**：`src/components/h2e/{AirdroppedPositionsCard,ConnectedAccountsCard,H2eCampaignCard,H2eRewardsCard}.tsx`、`src/pages/lite/H2eCampaignDetailPage.tsx`、`src/hooks/{useAirdropPositions,useH2eRewardsSummary,useLitePortfolio}.ts`、`src/components/portfolio/lite/LiveCards.tsx`
**Style guide**：`src/pages/StyleGuide/sections/pages/{LiteH2ePage,LitePortfolioPage}.tsx`、`src/pages/StyleGuide/preview/{h2ePreviews,portfolioPreviews}.tsx`、`preview/registry.tsx`、`nav.tsx`
**数据库**：`roll_demo_positions()`、`trg_credit_tiered_voucher_settlement`、`position_vouchers.tiered_credited_at`、cron `roll-demo-positions`

## 9. 未变更项

CampaignCard / `sortCampaignViews` / Vouchers tab / Referral tab、钱包连接与 EIP-712 校验、voucher 收益池分档逻辑、instant 券入账路径 —— 本批零改动。
