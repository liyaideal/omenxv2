# In review — 补上交易面板的禁用态演示

现在 Style Guide 的 "In review — result pending" 小节只演示了说明卡、持仓卡和结算轨，**没有**演示两个交易页的订单面板在 in-review 时长什么样。补上。

## 现状

- 合约页面板 demo：`LiteSection.tsx` 的 `OrderCardDemo`，已有 `Blocked · Closed` / `Blocked · Settled` 两个禁用样例，缺 in-review。
- 现货页面板 demo：`LiteSpotSection.tsx` 的 `PRESETS`，只有 `Market closed` 一个禁用预设，缺 in-review。
- 生产逻辑已经正确：两页 `blocked` 都包含 `inReview`，`blockedReason` 为 `In review · result pending`，按钮显示该文案并禁用。

## 改动

1. `src/pages/StyleGuide/sections/LiteSection.tsx`
   - 在 in-review 小节内追加一组真实 `LiteOrderPanel`（合约配置，desktop + mobile 两个 variant），`blocked` + `blockedReason="In review · result pending"`，标注挂载位置 chip。
   - 顺带在既有 Order card 状态矩阵里加一条 `Blocked · In review`，与 Closed/Settled 并列。
2. `src/pages/StyleGuide/sections/LiteSpotSection.tsx`
   - `PRESETS` 新增 `in-review` 预设：`blocked: true`、`blockedReason: "In review · result pending"`，与现有 `Market closed` 同族，切换后订单卡与图表同步呈现禁用态。
   - `SpotSettlementRail` 演示补一条末节点为 `In review` 的现货版（合约版已在 LiteSection 演示）。
3. 小节描述改写，明确「买入按钮为禁用态并显示 In review · result pending」，去掉过时的 "renders without the onCashOut prop" 说法（实际用的是 `cashOutDisabledText`）。

只动 Style Guide 两个 section 文件，不碰生产组件与交易页。
