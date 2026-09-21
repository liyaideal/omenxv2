# Pro 下单面板按数量下单（USDC / Contracts / Shares）— 交付说明 v1

> 这份文档说的是 Pro 交易页下单面板的 Buy 页签多了一个"按数量输入"的方式：原来只能填花多少 USDC，现在也可以直接填要买多少张合约（合约页）或多少份额（现货页）。入口就是金额输入框右侧的那个小下拉，没有新增按钮或行。合约页 `/trade` `/trade/order`、现货页 `/spot` `/spot/order` 桌面和手机都有。Sell 页签本来就是按数量，不变。给从未看过这块的人写；读法：先看 §0，再按 §3 的算例对数字。

## 0. 读者须知

查什么去哪儿：
- 长什么样 → 生产页 `/trade`、`/spot`（桌面右栏）、`/trade/order`、`/spot/order`（手机）
- 什么时候变成什么样 → `/style-guide` →「Pro — 交易终端」：SP-B1b（现货桌面）、SP-M4b（现货手机）在「现货终端 /spot」节点，CT-M6（合约手机）在「合约终端 /trade」节点
- 字段名、文案、公式、术语 → `docs/copy-dictionary.md`（Trading 节）+ 本文档 §2 §3
- 设计法则 → `DESIGN.md` §Addendum 2026-09-15 第 6 则
- Lite 术语对照 → `docs/copy-dictionary.md` 顶部「Lite 术语对照表」（Lite 面不做本功能，只输金额）

## 1. 功能目标

让习惯按张数 / 份额下单的交易者不用心算，直接输数量；同时两个终端行为一致、控件一致。

## 2. 口径

| 项 | 口径 |
|---|---|
| 入口 | Buy 页签 Amount 输入框的后缀是一个两项下拉：合约 `USDC ▾ / Contracts ▾`，现货 `USDC ▾ / Shares ▾`。标签始终是 `Amount`。 |
| USDC 模式 | 原行为。合约：输入 = 保证金；现货：输入 = 花费。 |
| 数量模式 · 合约 | 输入 = 张数（整数）。Notional = 张数 × 价格；Margin = Notional ÷ 杠杆；Fee = Notional × 0.15%；Total = Margin + Fee。 |
| 数量模式 · 现货 | 输入 = 份额（3 位小数）。Cost = 份额 × 预计成交价（市价含滑点 / 限价为限价）；Fee = Cost × 0.15%。 |
| 滑杆 | USDC 模式 = 可用余额的 %；数量模式 = 最大可买数量的 %（合约 = 可用 × 杠杆 ÷ 价格取整；现货 = 可用 ÷ 价格）。 |
| 切换 | 切换单位时把当前输入换算过去，不清空（合约：张数 = 保证金 × 杠杆 ÷ 价格取整；现货：份额 = 金额 ÷ 价格）。 |
| 记忆 | 模式按设备记住（localStorage `omenx-amount-mode`），合约与现货共用同一偏好。 |
| 摘要 | 合约 Buy 摘要首行新增 `Contracts`（与现货的 `Shares` 行对等），其余行不变。 |
| 校验 | 数量模式下余额校验按换算后的 Margin / Cost 判断，提示同 `Insufficient balance.` |
| 不动的 | Sell 页签（本来就是数量）；引擎（合约 `executeTrade` 同时收 amount 与 quantity，现货只收 quantity，全部前端换算）；Lite 面。 |

## 3. 算例

- 合约：50 张 · 价格 0.68 · 10x → Notional 34.00 · Margin 3.40 · Fee 0.05 · Total 3.45。滑杆 100% = 500 × 10 ÷ 0.68 = 7,352 张。
- 现货：200 份额 · 预计成交 0.4649 → Cost 92.98 · Fee 0.14；滑杆 100% = 500 ÷ 0.4649 = 1,075.5 份额。

## 4. 已知边界

- 合约张数取整，滑杆拖动时四舍五入到整张；现货份额与 Sell 页签同精度（3 位小数）。
- 合约张数的精确取整规则（2026-09-21 按代码补记，`src/pages/DesktopTrading.tsx` L497-508 与 `src/components/TradeForm.tsx` L167-178 同一份逻辑）：
  - 手输：`u = Math.max(0, Math.floor(parseFloat(unitsInput) || 0))`——向下取整到整张，**下限是 0 不是 1**（输 `2.7` 按 2 张算，输 `0.9` / 空 / 非数字按 0 张，Margin 写回 `0.00`，走零金额 CTA 路径）；输入框本身不改写用户输入的字符串（`2.7` 仍显示 `2.7`，只是换算按 2）。输入框 `type="text" inputMode="decimal"`，不拦小数点。
  - 最大张数：`maxUnits = Math.floor(available × leverage ÷ price)`（价格 ≤ 0 时为 0）。
  - 滑杆：`unitsInput = String(Math.round(maxUnits × pct ÷ 100))`——四舍五入（`TradeForm.tsx` L637、`ProContractPanel.tsx` L252）。
  - USDC → Contracts 切换：`Math.floor(margin × leverage ÷ price)`，保证金或价格 ≤ 0 时清空为 `""`。
- 限价单在数量模式下按输入的限价换算，价格改了数量不变、金额随之变。
