# Pro 终端不可下单态（冻结 / 结算中 / 已结算）— 交付说明 v1

> 这份文档说的是 Pro 交易终端在**市场不可下单**时长什么样：手机图表页底部的 dock、`/trade/order` 与桌面 `/trade` 的下单 CTA。之前两条线各有各的问题：`/spot` 手机 dock 把原因印在两个按钮上（`Market frozen` × 2）；`/trade` 整条线（手机图表页、`/trade/order`、桌面面板）根本没有封锁，冻结或结算后按钮照常可点，点进面板提交才失败。现在两条线用同一个 dock 组件、同一种封锁形态。给从未看过这块的人写。

## 0. 读者须知

- 长什么样 → `/style-guide` →「Pro — 交易终端」：DK-M1（手机 dock 五态）、DK-M2（`/trade/order` 封锁）、SP-M5（现货 dock，冻结态已换新形态）
- 现货的封锁条件本身（lifecycle / freeze_time）→ `spot-pro-v1.md`
- Lite 面 → 不变（Lite 合约页原本就封锁，本文的合约口径就是照它抄的）

## 1. 功能目标

1. 不可下单时，用户一眼看到"为什么不能下"，且只看到一次。
2. Pro 合约线和 Pro 现货线、Lite 合约页三者对"什么时候不能下单"口径一致。

## 2. 口径（2026-09-17 Liya 批，六条）

| 条 | 规则 |
|---|---|
| A 形态 | 手机图表页封锁时，dock = Lite/Pro 开关 + **一条禁用条**（`bg-muted/40` · `text-muted-foreground` · 无箭头 · 不可点）；两个 Yes/No 钮消失；右上角 `Tap to switch view · tap again to trade` 隐藏；`Available … USDC` 行保留。`/spot` 与 `/trade` 用同一个组件 `ProSpotMobileDock` |
| B 文案 | 禁用条与下单 CTA 只印原因，不新造词。现货：`Market frozen` / `Settling` / `Settled` / `Suspended · cancel only` / `In review` / `Market unavailable`（`getBlockedReason`）。合约：`Settled`（已结算）/ `In review`（lifecycle REVIEW）/ `Closed`（过 freeze_time 或 end_date）——与 Lite 合约页相同 |
| C 条件 | `/spot`：现有判断不变（`useSpotTerminal.blocked`）。`/trade`：新增 `lib/contractGate.ts` — `is_resolved` → Settled；`lifecycle_status === "REVIEW"` → In review；`freeze_time ≤ now` 或 `end_date ≤ now` → Closed。其他 lifecycle 不封锁（同 Lite 合约） |
| D 点击 | 禁用条不响应点击；`/trade/order` 面板 Buy / Sell 两个 CTA 禁用并印原因；桌面 `/trade` 面板 Buy / Sell CTA 同样禁用印原因（桌面 `/spot` 原本如此），`handlePreview` / `handleSellPreview` 兜底 toast |
| E 不动 | `SUSPENDED` 仍可撤单；Lite 两页不动；引擎不动；`/spot` 的封锁条件不动 |
| F 字典 | SP-M5 冻结态换新形态；新增 DK-M1（`/trade` 手机 dock：默认 / No 选中 / Closed / In review / Settled）、DK-M2（`/trade/order` Closed）。桌面 `/trade` 面板仍是页面内联 JSX，字典挂不上（已知缺口，随 `ProContractPanel` 提取一起补） |

## 3. 实现指引

- `src/lib/contractGate.ts`：`contractGate(event, now)` 纯函数 + `useContractGate(event)`（15 s 重算一次，冻结点落在页面打开期间也能收口）。`TradingEvent` 新增 `lifecycle` / `isResolved`（来自 `lifecycle_status` / `is_resolved`）。
- `ProSpotMobileDock`：`blocked` 时渲染单条 `role="status"` 的禁用条；`yesPrice` / `noPrice` 改为可选。`TradingCharts` 删除自绘 dock，改挂它。
- `TradeForm` 新增 `blockedReason` prop：Buy CTA `label = blockedReason ?? …`、`disabled`；Sell 分支封锁时不再包 `ClosePositionDialog`，直接渲染禁用 CTA。`TradeOrder` 传 `gate.reason`。
- `DesktopTrading`：`gate = useContractGate(selectedEvent)`；Buy / Sell 面板 CTA `label` / `disabled` 接 gate；两个 preview handler 先判 gate。

## 4. 已知边界

- 结算中（`SETTLING`）的合约事件不封锁——Lite 合约页也不封锁，口径一致；要改需两面同改。
- 冻结期间已有持仓不能从 Pro 面板减仓（Sell 也禁）；现货同样。持仓卡上的平仓入口不在本轮范围。
