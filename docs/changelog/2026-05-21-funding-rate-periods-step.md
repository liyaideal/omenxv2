# 2026-05-21 — 资金费率审计：新增"结算周期列表"中间页

> Transparency → "Am I Being Overcharged?" 流程改造：选完持仓后先进入该仓位的资金费率结算列表，再点选某一条结算进入单次核验详情；详情页补充结算窗口与时间字段。

## 背景

资金费率按固定周期结算，一个持仓常包含多次结算，每次结算的 rate、amount、window、settlementTs 都不同，理应作为独立核验事件。原流程"选持仓 → 直接核验"会让"View on BaseScan" 等动作失去对应关系，也无法表达多周期。

## 流程变化

旧：

```text
idle → select(持仓) → fetching → comparing → result(核验)
```

新：

```text
idle → select(持仓) → periods(结算周期列表) → fetching → comparing → result(单次结算核验)
```

回退：result → periods（换一条结算） → select（换持仓） → idle。

## 改动清单

### F1 `useFundingRateAudit` Hook 扩展

- 文件：`src/hooks/useFundingRateAudit.ts`
- `FundingRateStep` 加入 `"periods"`。
- 新增类型 `FundingPeriodRecord`（对接 `position_funding_ledger`）。
- 新增 state：`periods`、`selectedPeriod`。
- `selectPosition(pos)` 不再直接核验，改为切到 `periods` 并 `loadPeriods(pos.id)`。
- 新增 `selectPeriod(period)`：在 fetching → comparing 节奏后，基于该 ledger 行派生 `fundingRate / appliedAmount / direction / notional / windowStart / windowEnd / settledAt`；`eventId / outcomeId / txHash / blockNumber` 仍 mock（链上证据占位）。
- 新增 `backToPeriods()`：仅清 `audit + selectedPeriod`，回到列表。
- `openSelector / reset` 同步清理新 state。

### F2 Periods 列表页

- 文件：`src/components/transparency/FundingRateAudit.tsx`
- 顶部 `DesktopBackLink` 回到 `select`。
- 头部小卡复用 result 中的持仓信息样式。
- 列表每行：左列 `settledAt`（绝对时间，font-mono） + 窗口区间 `start – end`；右列 `appliedRate`（带符号色）+ `±amount USDC`。
- 列表 `max-h-[55vh] overflow-y-auto`，按 `created_at` 倒序，过滤 `amount = 0`，最多 200 条。
- 空态：`No funding settlements yet for this position.`
- 仅使用 Lucide 图标（Clock / Percent / RefreshCw），无 emoji。

### F3 Result 详情页字段扩展

- 新增 "Settlement Window" 卡：`settledAt / windowStart / windowEnd / notional`。
- "On-Chain Event Fields" 表追加：`windowStartTsMs / windowEndTsMs / settlementTsMs`（与对外字段表对齐）。
- "Verify Another" 拆为两个按钮：`Verify Another Settlement`（回 periods）+ `Change Position`（回 select）。

### F4 不改动

- `useFundingHistory`、`position_funding_ledger` 表结构、RLS 都已满足，无需迁移。
- 其他 transparency 模块、settings 路由、share/poster 流程。

## 字段映射对照

| 详情页字段 | 来源（`position_funding_ledger`） |
|---|---|
| `fundingRate` / `appliedRate` | `applied_rate` |
| `appliedAmount` | `abs(amount)` |
| `direction` | `amount < 0 ? "paid" : "received"` |
| `notional` | `notional` |
| `windowStart` / `windowStartTsMs` | `accrual_start` |
| `windowEnd` / `windowEndTsMs` | `accrual_end` |
| `settledAt` / `settlementTsMs` | `created_at` |

## QA 测试要点

- 选持仓后进入 periods 页，列表与 `position_funding_ledger` 一致（按持仓过滤、`amount ≠ 0`、按 `created_at` 倒序）。
- 点任一结算条目 → fetching → comparing → result，详情页 rate / amount / window / settledAt 与该行一致。
- result 上 `Verify Another Settlement` 回到 periods，`Change Position` 回到 select。
- 空 ledger 持仓显示空态，不报错。
- 桌面 1021×777 与移动窄屏均无横向滚动。

## 列表高度策略（更新）

Position 选择列表与 Periods 结算列表统一规则：

- 条目 **≤ 18** 时不设 `max-height`，卡片按内容撑开，无内部滚动条、无大块空白。
- 条目 **> 18** 时锁定 `max-height: min(70vh, 1100px)`（持仓）/ `min(70vh, 1000px)`（结算），仅此时出现内部滚动条。
- 不引入分页或虚拟列表；数据层查询上限保持 `positions ≤ 20` / `position_funding_ledger ≤ 200`。
