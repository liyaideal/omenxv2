# Pro 交易页费率 V4 清理（Pro Trade · Fee System V4 Cleanup）— 交付说明 v1

> 这份文档说的是 Pro 合约交易页（生产页 `/trade` 的 Pro 视图、以及移动端下单页 `/trade/order`）这一轮删掉了什么、留下什么。用户能看见的变化只有三处：页头那排数据里不再有资金费率与倒计时，下单区不再有「全仓 / 逐仓」选择（永远全仓），确认弹窗里也不再有对应那一行；CTA 上的「To win」金额从毛利改成扣完 5% 赢利佣金后的净利，和 Lite 面板同一笔单显示同一个数。Pro 现货页、Lite 各页这轮完全没动。读法：先看 §0，再按 §2 把数字对一遍，§3 是给真平台对接方的核对项。

## 0. 读者须知

查什么去哪儿：
- 长什么样 → 生产页 `/trade`（Pro 视图）、`/trade/order`
- 什么时候变成什么样 → `/style-guide` → 交易页状态字典（每个 case 有「状态 / 触发条件 / 视觉 / 数据来源」表）
- 字段名、文案、公式、时间口径、术语 → `docs/copy-dictionary.md`（Trading 节）→ 本文档对应章节
- 净利算例与唯一实现 → `docs/delivery/lite-order-returns-v1.md` §2
- 设计法则（颜色轴、chip、overlay 对等）→ `DESIGN.md`

提问前先按上面顺序查一遍；查不到再提，提问时写明"我查了 X 没有"。

## 1. 删了什么

| 项 | 位置 | 说明 |
|---|---|---|
| `Funding Rate +0.05%` / `Next Funding 28min` | `DesktopTrading.tsx` 页头数据条 | 删除，保留 24h Volume 与 OI |
| `Funding -0.01% · 28m` | `TradeOrder.tsx` 数据条 | 删除，保留 Vol / OI |
| `{ label: "Funding Rate" }` | `tradingUtils.ts` `tradingStats` | 删除 |
| Funding Rate Audit 场景卡 + 页面 | `TransparencyPage.tsx`、`components/transparency/FundingRateAudit.tsx`、`hooks/useFundingRateAudit.ts` | 整块删除（文件已删） |
| 平仓前的 `accrue-funding` 调用 | `useSupabasePositions.ts` | 删除；平仓算式里 `fundingPaid` 恒为 0 |
| `Cross / Isolated (Not Supported)` 开关 | `DesktopTrading.tsx`、`TradeForm.tsx` | 删除，`marginType` 变常量 `"Cross"` |
| 确认弹窗 `Margin` 行 / 移动端 `Margin type` 行 | `DesktopTrading.tsx` 预览块、`OrderPreview.tsx` | 删除；其余行（Type / Leverage / Price / Order cost / Traded notional / Opening notional / Margin required / Liq. price / TP/SL / Position impact）不变 |

未删（兼容期保留，仅不再使用）：数据库 `funding_accrued` / `funding_paid` 列、`accrue-funding` edge function 文件、仓位详情里的资金费率展示组件 `PositionDetailContent`（其 hook `useFundingHistory` / `useOptionFundingRate` 仍被它引用，因此保留）。

## 2. 费率与 To win 口径

| 维度 | 取值 | 来源 |
|---|---|---|
| 合约 taker 费率 | 15 bps（0.0015，按经济名义额） | `FUTURES_FEE_RATE` |
| 赢利佣金 WC | 净实现利润的 5% | `WINNING_COMMISSION_RATE` |
| To win | `netWin(grossWin, entryFee)` | `src/services/tradingService.ts` |

算例（$25 · 5× · Yes 68¢）逐字见 `docs/delivery/lite-order-returns-v1.md` §2：entry fee `$0.19`、gross win `$58.82`、WC `$2.93`、**net win `$55.89`**。Pro 桌面 CTA、Pro 确认弹窗 CTA、移动端 TradeForm / OrderPreview CTA 全部走同一个 `netWin()`，同一笔单与 Lite 面板显示同一个数，禁止任何本地毛利算法。

Pro 下单摘要 `Total` 行下方新增一行灰字（本轮唯一新增文案）：`To win shows profit after the 5% winning commission.`

## 3. 真平台核对项

| # | 核对项 | 期望 |
|---|---|---|
| 1 | Funding 字段兼容期 | 接口 / 定时任务返回的资金费一律 0；前端不再展示任何资金费 |
| 2 | 保证金模式 | 全仓唯一；下单接口不再接受 `margin_mode`（传了要报错或忽略） |
| 3 | To win | Pro 与 Lite 同一 `netWin()`；同一笔单两端金额必须一致到分 |

## 4. 验收清单

- [ ] `/trade` Pro 页头只有 24h Volume 与 OI
- [ ] `/trade/order` 数据条只有 Vol 与 OI
- [ ] 下单区无全仓/逐仓控件；确认弹窗无 `Margin` / `Margin type` 行
- [ ] `Fee (est.)` 与余额不足校验都读 `FUTURES_FEE_RATE = 0.0015`
- [ ] Pro CTA `To win` 与 Lite 同单一致（用 §2 算例复核 `$55.89`）
- [ ] `Total` 下方灰字逐字为 `To win shows profit after the 5% winning commission.`
- [ ] Transparency 页只剩三个场景卡，无 Funding Rate Audit
- [ ] 平仓不再触发 `accrue-funding`，平仓回款不含资金费扣减

## 5. 未变更项

Pro 现货页 `SpotTrading.tsx`、全部 Lite 页面、`/trade/order` 的其余模块、数据库结构、盘口与图表逻辑本轮均未改动。参考事实：Pro 现货 `SPOT_FEE_RATE = 0`，`settle_spot_event` 结算既不收手续费也不收赢利佣金。
