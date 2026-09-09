# Lite 下单面板 Returns 区（净利）— 交付说明 v1

> 这份文档说的是 Lite 合约下单面板（生产页 `/trade`）里「Returns」那一小块到底显示什么。结论：**面板只显示两行——赢了实拿多少（已扣 5% 赢利佣金）和预计自动平仓价**，原来的「最多亏多少」那一行已删除。写给第一次接手这块的研发 / 测试 / 真平台对接方看，不需要任何前置背景。读法：先看 §0，再按 §2 的算例把数字对一遍，然后用 §3 §4 做对照。

## 0. 读者须知

查什么去哪儿：
- 长什么样 → 生产页 `/trade` 的下单面板
- 什么时候变成什么样 → `/style-guide` → Lite → 交易页 状态字典（TR-5…TR-9 为下单面板，每个 case 有「状态 / 触发条件 / 视觉 / 数据来源」表）
- 字段名、文案、公式、时间口径、术语 → `docs/copy-dictionary.md` → 本文档对应章节
- 设计法则（颜色轴、chip、overlay 对等）→ `DESIGN.md`
- 三行定位（这份仓库里文档怎么分层）→ `docs/README.md`

提问前先按上面顺序查一遍；查不到再提，提问时写明"我查了 X 没有"。

本文档只讲 Returns 区；输入框语义见 `docs/delivery/lite-order-input-v1.md`，auto-close 取值规则见 `docs/delivery/autoclose-v1.md`。

## 1. 定稿形态

Returns 区恒为两行，没有第三行，也没有「最多亏」行：

| 行 | 左侧逐字 | 右侧 |
|---|---|---|
| 1 | `If you're right, you win` + ⓘ | 净利金额，例 `$55.89` |
| 2 | `Est. auto-close`（下方常驻小字 `Moves with your other positions`） | `≈ {c}¢` 或 `None · {子文案}` |

对冲（netting）分支下第 1 行改为 `You'll get back ≈`，余量腿另起 `Then if the rest is right, you win`（同样是净利）与 `Est. auto-close (new position)`。

ⓘ tooltip 逐字（静态文案，永不插值）：

> **What you win**
> Shown after the 5% winning commission on profit. Trading fee (0.15%) is charged when you buy. Nothing is taken if you lose.

auto-close 的 `None` 子文案三态逐字：`None · enter an amount`（未输入金额）/ `None · nothing borrowed`（1×）/ `None · can't be reached`（0¢–100¢ 之间碰不到线）。

## 2. 算例：$25 · 5× · Yes 68¢

| 字段 | 数值 | 算法 |
|---|---|---|
| 仓位规模 notional | `$125.00` | 25 × 5 |
| 份数 qty | `183.82` | 125 ÷ 0.68 |
| 开仓手续费 entry fee | `$0.19` | 125 × 0.0015 |
| 毛利 gross win | `$58.82` | (1 − 0.68) × 183.82 |
| 赢利佣金 WC | `$2.93` | 5% × (58.82 − 0.19) |
| **净利 net win（面板与 CTA 显示）** | **`$55.89`** | 58.82 − 2.93 |
| 赢了到手总额 payout | `$80.89` | 25 + 55.89 |

唯一实现：`src/services/tradingService.ts` 的 `netWin(grossProfit, entryFee)`。任何「you win」「To win」数字都必须走这个函数，禁止另写一份。

## 3. 字段响应表

| 字段 | 改输入时 | 切 Boost 时 | 切 side 时 |
|---|---|---|---|
| 净利 win 行 | 线性跟随 | 线性放大 | 按新 side 的价格重算 |
| CTA 金额 | 跟随 win | 跟随 win | 跟随 win |
| Est. auto-close | 重算 | 重算；1× 恒为 `None · nothing borrowed` | 重算（多市场 No 为 short 解） |
| 手续费 | 随 notional 变 | 随 Boost 变 | 不变 |
| 底部脚注 `Not guaranteed. You can lose your full $X.` | 跟随输入 | **不动** | 不动 |

## 4. 给真平台研发的三个核对项

1. **Lite 市价单恒为 taker**：费率 15 bps（`0.0015`），基数为经济 notional（输入 × Boost）。Lite 没有挂单口径，请确认真平台侧同口径。
2. **净利公式**：`netWin = 毛利 − 5% × max(毛利 − 开仓手续费, 0)`，亏损单不收佣金。请用 §2 算例逐项对数（125 / 183.82 / 0.19 / 58.82 / 2.93 / 55.89 / 80.89）。
3. **滑点保护**：Lite Boost 下单目前无滑点上限（现货侧有 0.5%）。请确认真平台的市价单保护机制并回话。

## 5. 验收清单

- `/style-guide/preview?c=trade-tr5` 与 `?c=trade-tr7`：Returns 区恰好两行，无 `Max loss` 行；win 行带 ⓘ，tooltip 文案与 §1 逐字一致。
- TR-7 fixture（$25 · 7× · 50¢）win 行显示 `$166.26`。
- 1× 下单：auto-close 显示 `None · nothing borrowed`；未输入金额时显示 `None · enter an amount`。
- 演示号下单后，`/wallet` 流水出现一条 `Fees` 行（`Fee` 徽章、Receipt 图标、负数金额），在「All」与「Trades」两个筛选下都能看到。


## 6. R2 · 平仓/结算现金回流（2026-09）

- 平仓与结算都走同一口径：`cashBack = releasedMargin + realizedPnl − winningCommission`，
  `winningCommission = 5% × max(realizedPnl − allocatedEntryFee, 0)`（亏损为 0）。
  单一实现在 `src/services/tradingService.ts`：`winningCommission()` / `netWin()` / `cashBackOnClose()`。
- 客户端平仓（`useSupabasePositions`）在同一 mutation 内写库 + 记 `profiles.balance`，
  toast 改为 `Cashed out · $X back`；并 fire-and-forget 写 `trade_profit`/`trade_loss` 与 `winning_commission` 流水。
- 合约结算由 `public.settle_futures_event()` / `settle_futures_sweep()`（5 分钟 cron 对账）完成，逻辑与客户端一致，按 `Open` 幂等。
- Cash-out 面板预览金额已减佣金，所见即到账（`pnlAtPrice` / `entryFee` 两个新 prop）。
- Wallet 历史新增 `winning_commission` 行（Percent 图标、红色、归入 Trades 筛选）；
  结算详情 Fees 行下新增副行拆分 Trading fee / Winning commission。
