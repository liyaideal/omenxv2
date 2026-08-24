# 从持仓进入市场后，返回应回到 Portfolio 原位

## 现状（已确认）

- Portfolio 持仓卡（`src/components/portfolio/lite/LiveCards.tsx`）点击后 `navigate(row.tradePath)`，不带任何来源信息。
- 三个 Lite 交易页移动端 header 都写死 `backTo="/events"`（`LiteSpotTrade.tsx:731`、`LiteContractTrade.tsx:1216`、`LiteQuickTrade.tsx:551`），所以无论从哪里进来，返回都跳 /events。
- Portfolio 的 Boost / Standard 分段（`segment`）是组件内 state、不在 URL 上；tab 在 URL 上。返回后分段与滚动位置都会丢。

## 方案

1. **带上来源**：持仓卡（Live 卡、Settled 行、挂单行等所有 `tradePath` 跳转）改为 `navigate(path, { state: { from: <当前 pathname+search> } })`。
2. **交易页返回按来源走**：三个 Lite 交易页把 `backTo="/events"` 换成 `location.state?.from ?? "/events"`。从 events 进来行为不变。
3. **停留在原位置**：
   - 离开 Portfolio 前把当前 `segment` 与 `window.scrollY` 写入 sessionStorage（单一 key，例如 `lite-portfolio-restore`）。
   - `LitePortfolio` 挂载时若存在该记录且是"返回"进入（来源为交易页/详情页），恢复 segment，并在列表渲染完成后恢复滚动位置，然后清除记录。
4. **一致性**：结算详情页 / 系列详情页已有的 `/portfolio?tab=settled` 返回行为保持不变，只补滚动恢复。

## 技术细节

- 只动前端导航与展示：`LiveCards.tsx`、`SettledList.tsx`（若同样跳交易页）、`LitePortfolio.tsx`、三个 Lite 交易页的 `backTo`。
- 不改 `liteTradePath` 语义、不改交易页其它逻辑、桌面端不受影响（桌面无 MobileHeader 返回键，仅滚动恢复共用）。
- 滚动恢复用 `requestAnimationFrame` + 一次性 effect，避免与列表异步加载竞争（数据 ready 后再滚）。

## 验收

移动端登录态：/portfolio → 滚到第 3 张持仓卡 → 点入市场 → 左上角返回 → 回到 /portfolio，仍在 Boost 分段且滚动在原来的卡片位置；从 /events 进入市场时返回仍回 /events。
