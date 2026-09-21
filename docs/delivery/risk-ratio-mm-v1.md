# 风险指标统一为 MM / Equity（RM-1）— 交付说明 v1

> 2026-09-21 联合验收时 Liya 发现三处比例口径不一：桌面账户卡 `Risk Ratio 14.25%`（IM / Equity）、手机页头方块 `MM 7.11%`（MM / Equity，却按 IM 档位染色）、手机抽屉多两条 `Initial Margin Rate` / `Maintenance Margin Rate`（前者与 Risk Ratio 重复），Lite 的 Boost check 只有美元没有比例。她定：全站一个指标，并且口径换成交易所（Binance / Bybit 全仓）的 **MM / Equity → 100% 强平**。给从未看过这块的人写。

## 0. 读者须知

- 长什么样 → `/style-guide`：「手机风险指示 RM-M1 / RM-M2」、桌面 `AccountRiskIndicator` 节、Portfolio 节 Boost check 三态
- 公式 → `DESIGN.md` §7「Account Risk Indicator」（已改写）
- Lite 面 → Boost check 读同一个数，只是词不同（`Healthy · 7%`、`Boost usage 7.13%`）

## 1. 口径（Liya 09-21 批）

| 项 | 规则 |
|---|---|
| 指标 | `Risk Ratio = MM / Equity × 100`，`MM = 50% × IM`（`MM_RATIO`），`Equity = 余额 + 未实现盈亏`。之前是 IM / Equity |
| 档位 | 不变：SAFE < 80 / WARNING 80–95 / RESTRICTION 95–100 / LIQUIDATION ≥ 100，按新指标 |
| 距强平 | `Until auto-close starts` / `distanceToLiquidation = Equity − MM`（之前 Equity − IM） |
| Lite 估算价 | `Est. auto-close ≈` 解 `equity(P) = 交易后 MM`（之前 = 交易后 IM）；1× 仓位仍是 none |
| 单仓强平价 | Pro 持仓表 / 下单预览 `Liq. Price = entry × (1 ∓ (1 − MM_RATIO) / 杠杆)`（之前系数 0.9，隐含 MM = 10% IM） |
| Available | 仍 = `Equity − IM`（开新仓可用） |
| 手机页头方块 | `MM x%` → `Risk x%`，数字 = Risk Ratio，颜色按档位 |
| 手机抽屉 | 与桌面卡同一套行：Margin Mode / Account Equity / Risk Ratio 进度条 / Initial Margin $ / Maint. Margin $；删两条 Rate 进度条 |
| Lite Boost check | 状态词后加整数百分比 `Healthy · 7%`；Details 加一行 `Boost usage 7.13%`；不出现 Risk Ratio / Margin 字样 |

## 2. 用户看到的变化

同一账户（Equity $2,003、IM $285.59）：Risk Ratio 14.25% → **7.13%**；`Until auto-close starts` $1,721 → **$1,864**；每个 Boost 仓位的 `Est. auto-close ≈` 离现价更远；Pro 表里 10× 仓位的 Liq. Price 从 ±9% 变 ±5%。

## 3. 实现指引

- 唯一常数 `MM_RATIO = 0.5`（`src/lib/autoClosePrice.ts`），`useRealtimeRiskMetrics`、`tradingUtils.calcLiqPrice`、`DesktopTrading` / `TradeForm` 的预览 liq 都引它。
- `MobileRiskIndicator`：方块读 `riskMetrics.riskRatio`；`AccountRiskDrawer` 导出，接 `riskMetrics` 可挂字典；`previewMetrics` 仅字典用。
- `portfolio/lite/parts.tsx`：`BoostCheckCard` / `BoostCheckBar` 状态词后 `· {round(riskRatio)}%`；`detailRows` 加 `Boost usage`；`LitePortfolio` 的 `untilAutoClose` 改读 `distanceToLiquidation`。
- 测试 `autoClosePrice.test.ts` 6 条通过（触发点换成 mmAfter 后方向 / 对称 / none 规则不变）。

## 4. 研发边界

- 蓝图里没有自动强平引擎（没有任何函数按比例平仓），本轮只改显示与估算。真平台强平线按 **MM / Equity = 100%** 实现；MM 比例（50% IM）是蓝图假设，研发按风控参数配置。
