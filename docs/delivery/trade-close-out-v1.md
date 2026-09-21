# 交易页收尾：合约 Buy · Limit / 三选一 No 侧 / 品类杠杆上限 / Suspended / Close-only / 桌面面板抽件 — 交付说明 v1

> 2026-09-21 交易页 Lite / Pro 一体化交付前做了一轮「研发冷读」（只用研发看得到的东西还原需求），列出 9 个口径缺口，Liya 逐条拍板后本轮一次收掉，之后交易页不再留尾巴。给从未看过这块的人写。本文只写口径；样式与布局看生产页，每个状态看字典。

## 0. 读者须知

- 长什么样 → `/style-guide` →「Pro — 交易终端 › 合约终端 /trade」：② 桌面面板 CT-D1…D6 / DK-D1 / RM-D1（新节，面板本体），② 手机 CT-M8（Buy · Limit）、CT-M5b / M5c（杠杆上限）、RM-M3（Close-only）、RM-M0（风险零态）、DK-M1（多一种 Suspended）；「两终端共用」④ OS-D1 / OS-M1（原 PF-D1 / PF-M1 改号）；Lite「交易页」TR-27c / TR-28
- 词 → `docs/copy-dictionary.md §Trading`：`Not {option}`、`Price（合约 Buy · Limit）`、`Close-only · Risk x%`、`Boost limit reached — close a position first`、`Suspended · cancel only`、`Boost not available for this category`、`In orders`、`Reserved`、`Tap to switch view · tap again to trade`、`价格格式（Pro）`、`Volume（选择器列表）`
- 前情 → `pro-trade-sell-v1.md`（Sell 只减仓）、`pro-order-gate-v1.md`（封锁）、`risk-ratio-mm-v1.md`（Risk Ratio）、`pro-sports-lines-v1.md`（市场行 / 三选一）

## 1. 口径（Liya 2026-09-21 批，逐条）

### #1 合约 Buy · Limit（桌面 `/trade` 面板 + 手机 `/trade/order` + `/order-preview`）

| 项 | 规则 |
|---|---|
| 之前 | 桌面 Price 框是摆设（输入不生效），挂单永远按现价记；手机没有 Price 框；挂上去的单永远不会成交；撤单不退预留（bug，本轮一并修） |
| 价格框 | `Limit` 时 Amount 上方一行 `Price`，默认 = 当前侧价（Yes 价或 1 − Yes 价），可改；手机同位同样式 |
| 数量 | `Contracts = 金额 × 杠杆 ÷ 限价`（不再按现价）；Contracts 模式反推 `Margin = 张数 × 限价 ÷ 杠杆` |
| 预留 | 下单即扣 `保证金 + 手续费`（`trades.margin + trades.fee`，手续费按 notional × 0.15%） |
| 挂 / 成交 | 限价 ≥ 现侧价 → 立即按**现价**成交（等同市价）；限价 < 现侧价 → `Pending`，Current Orders 一行；现价跌到 ≤ 限价时自动按**限价**成交，开仓 entry = 限价（已有同向仓位则加权合并、杠杆按 notional 混合），toast `Limit buy filled at your price` |
| 提示句 | 会挂单时 Price 框下方一行 `Limit below mark — order will rest as Pending until touched.` |
| 撤单 | Current Orders `Cancel` 退回 保证金 + 手续费（之前不退） |
| 不做 | 挂单不做净额对冲：`classifyOrderIntent` 已禁止跨零挂单，所以成交时不会有反向仓位；蓝图成交由前端 touch-fill 模拟（`useContractLimitFills`，桌面与手机 `/trade` 都挂），正式版撮合在后端 |

### #2 三选一 Winner 的 No 侧（Pro `/trade` 桌面 + 手机）

| 项 | 规则 |
|---|---|
| 切换钮 | 不变：`Yes / No`（与 Lite 每个选项下的 Yes / No 同款），价格 = 该选项价 / 1 − 该选项价 |
| CTA | Yes 侧 `Buy Draw`（不变）；No 侧 `Buy Not Draw`（之前 `Sell Draw`）。`Not {option}` 只用于无 side_labels 的多选项事件 |
| Side 字段 | 持仓表 / 平仓弹窗 / 预览 / Sell 页签的 Side 写 `Not Draw`（之前 `Short` / `No`） |

### #3 别名事件（Astralis / Heroic）No 侧的 Side 字段

不动代码——持仓表、平仓弹窗、Sell 页签、预览上轮已经全部显示别名 `Heroic`。本轮只改字典 CT-M7 note（原写"No 钮 = 卖"）和词典：**别名 binary 的 No 侧全站显示别名，`short` 只在后端。**

### #4 Pro 杠杆上限跟品类

| 项 | 规则 |
|---|---|
| 上限 | `category_boost_configs.max_leverage`（与 Lite Boost 同源）。当前库：crypto 10× · macro 5× · social 5× · sports 3×；stocks / finance / tech / politics / entertainment / economy 未开 → 1× |
| 之前 | 桌面 + 手机固定 1–10×，快捷钮 1 / 2 / 5 / 7 / 10 |
| 1× 品类 | 滑杆锁死；桌面 Leverage 行 `1x · Boost not available for this category`，手机抽屉同句；档位只剩 `1x` |
| 档位 | `boostTiers(max)`：20 → 1 / 2 / 5 / 20，10 → 1 / 2 / 5 / 10，5 → 1 / 2 / 5，3 → 1 / 2 / 3 |
| 切品类 | 当前杠杆 > 新上限时自动压到上限 |
| **注意** | 演示常驻的电竞 / 足球事件是 sports → Pro 最高 3×；美股 / 科技 / 政治类合约在 Pro 只能 1×。这是"跟品类"的直接后果，要放开改表不改代码 |

### #5 `SUSPENDED` 统一 cancel only

| 项 | 规则 |
|---|---|
| 条件 | `lifecycle_status === "SUSPENDED"`（`contractGate` 新增第三种原因，优先级 Settled > In review > Suspended > Closed） |
| Pro 合约 | 与 Closed 同形态：CTA 置灰、手机 dock 一条灰条、Sell 同禁；文案 `Suspended · cancel only`（现货已用同句） |
| 撤单 | Current Orders Cancel 仍可点 |
| Lite 合约页 | 同条件置灰，写 `Suspended`（Lite 没有挂单，不写 cancel only） |

### #6 RESTRICTION 档禁开仓（Risk Ratio ≥ 95%）

| 项 | 规则 |
|---|---|
| 条件 | `useRealtimeRiskMetrics().riskLevel ∈ {RESTRICTION, LIQUIDATION}`（DESIGN §7 表里的 Close-only 行为，本轮落地） |
| Pro | Buy 页签开仓 / 加仓（`orderIntent.kind ∈ {open, add}`）CTA 置灰写 `Close-only · Risk 96%`（取整），不显示 `To win` 读数；Sell 页签、减仓不受影响；现货不受影响 |
| Lite | 合约下单卡 CTA 置灰写 `Boost limit reached — close a position first`（优先级低于 Settled / In review / Suspended / Closed）；手机 dock 两钮不置灰（点开抽屉才看到原因）；Boost check 此时已是 `Auto-close soon` |
| 顺带修 | `riskRatio`：Equity ≤ 0 且有持仓 → 100（之前算成 0 = 安全）；无持仓 → 0 |

### #7 部分成交 case 改号

`PF-D1 / PF-M1` → `OS-D1 / OS-M1`（与 Portfolio 的 `PF-1…7` 撞前缀）。preview key 不动（`pro-order-status-desktop` / `-mobile`）。

### #8 Lite `Pro ›` 入口的记忆范围

localStorage `omenx_pro_visited:<uid>` = 按账号 **+ 按设备**：换一台设备会再看到一次入口。Liya 定：可以，不改。15 s 窗口过期后 Pro 面板落在 Market，无提示。

### #9 桌面下单面板抽件 `ProContractPanel`

`DesktopTrading` 内联 458 行面板 JSX 原样抽成 `src/components/pro/ProContractPanel.tsx`（纯展示，所有数字 / 文案 / 封锁判断由页面算好传入），生产逐像素不变；字典新节「② 下单面板 · 桌面右栏」挂本体：CT-D1 Buy · Market、CT-D2 Contracts 模式、CT-D3 Buy · Limit 挂单、CT-D4 Sell 减仓、CT-D5 Sell 空仓、CT-D6 杠杆锁死、DK-D1 封锁、RM-D1 Close-only。

## 2. 用户看到的变化（一句话版）

Pro 合约挂单真的会挂、会成交、撤单退钱；三选一 No 侧不再写 `Sell Draw`；杠杆上限跟 Lite 一样按品类；停牌事件两条线都只许撤单；账户 Risk ≥ 95% 时只许平仓；桌面面板终于在字典里。

## 3. 实现指引（蓝图 = 参考实现）

- `src/lib/contractGate.ts`：+ `SUSPENDED → "Suspended · cancel only"`。
- `src/lib/positionIntent.ts`：`getIntentLabel(intent, uiSide, sideLabels, multiOutcome)` 第四参；多选项 No 侧 → `Buy Not {label}`。
- `src/pages/DesktopTrading.tsx`：`execPrice`（限价 < 侧价才生效）、`buyLimitPending`、`leverageMax` / `leverageTiers`（`useCategoryBoostConfigs`）、`closeOnly`（`useRealtimeRiskMetrics`）、`buyBlockedReason`；持仓表非 binary 短仓 Side = `Not {option}`；预览 Side 同；挂 `useContractLimitFills`。
- `src/components/TradeForm.tsx`（手机）：同一套（`eventCategory` 由 `TradeOrder` 传入）；Price 框；`previewLeverageMax` / `previewLimitPrice` / `previewRiskRatio` 仅字典用，不传零变化。
- `src/pages/TradingCharts.tsx`：挂 `useContractLimitFills`（手机图表页也能成交）。
- `src/hooks/useContractLimitFills.ts` + `tradingService.fillContractLimitOrder`：mark ≤ limit → 建仓 / 合并，trade → Filled，不动余额。
- `src/hooks/useSupabaseOrders.ts`：合约 Buy · Limit 撤单退 `margin + fee`。
- `src/hooks/useEvents.ts`：`TradingEvent.category`。
- `src/hooks/useRealtimeRiskMetrics.ts`：Equity ≤ 0 → 100。
- `src/pages/lite/LiteContractTrade.tsx`：`suspended` / `closeOnly` 进 `blockedReason`；`BOOST_LIMIT_REACHED` 常量在 `LiteContractOrderPanel.tsx`。
- `src/components/trading/TradeSubmitButton.tsx`：`hideWin`（Close-only 用）。
- 字典：`ProSpotSection.tsx`（CT-D 节、CT-M8、CT-M5b/c、RM-M0、RM-M3、SP-B2b、SL-M3、DK-M1、CT-M7 note、OS 改号）、`TradeStatesSection.tsx`（TR-27c、TR-28）、preview `proTradePreviews.tsx`（`ProContractPanel` 桌面 fixture）等。

## 4. 已知边界

| 项 | 说明 |
|---|---|
| 成交模拟 | 合约 / 现货限价单成交都由前端在页面打开时按 mark 触发；离开页面不成交。正式版撮合在后端 |
| 限价单不净额 | 合约挂单成交只开仓 / 加仓，不对冲反向仓位（放单时已禁止跨零） |
| Close-only 与引擎 | 蓝图只在 UI 禁开仓；后端不拦。正式版服务端要同样校验 |
| 杠杆上限来源 | 只读 `category_boost_configs`；品类未配置 = 1× |
| G5 现货冻结灰条 | 仍等真冻结窗口在生产亲验 |

## 5. 状态索引

| 模块 | 字典 |
|---|---|
| 桌面面板全态 | CT-D1…D6 / DK-D1 / RM-D1 |
| 手机 Buy · Limit | CT-M8 |
| 杠杆上限 | CT-M5 / M5b / M5c · CT-D6 |
| Close-only | RM-D1 / RM-M3（Pro）· TR-28（Lite） |
| Suspended | DK-M1 / DK-D1 / DK-M2 |
| 风险零态 | RM-M0 |
| 三选一 No 侧 | SL-D4 / SL-M3（切换）· CT-D1 note（CTA / Side 词） |
| 部分成交 | OS-D1 / OS-M1 |
| Lite 入口 | TR-27 / 27b / 27c · SP-19 / 19b |
