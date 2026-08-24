# 从 Lite Portfolio 跳进 Pro 交易页后，返回要回到 Lite Portfolio 原位

## 现状（已核对代码）

- Lite Portfolio 的持仓卡/结算行跳转已经会 `savePortfolioScroll()` 并带 `state.from`，返回能回到 `/portfolio` 且恢复分段 + 滚动位置。
- 但 `N orders waiting to fill · placed in Pro` 展开行走的是另一条路径：`PendingOrdersRow.openInPro()` 只做 `setSurface("pro")` + `navigate("/trade?event=...")`，既没有保存滚动位置，也没有记录"来时是 Lite"。
- Pro 交易页返回按钮是 `navigate(-1)`（桌面 `DesktopTrading`，仅 PUSH 进入时显示）。回退到 `/portfolio` 时 surface 仍是 `pro`，于是渲染的是 Pro 版 Portfolio，不是 Lite 的那一页，滚动位置也丢失。

## 要做的改动

1. **跳转前存好返回意图**（`PendingOrdersRow`）
   - 调 `savePortfolioScroll()`。
   - 在 `portfolioReturn.ts` 新增一个"返回 Lite"标记（sessionStorage，例如 `lite-portfolio-return-surface`），值为跳转前的 surface（`lite`）。

2. **回到 /portfolio 时自动切回 Lite**
   - 在 `PortfolioRoute` 里读取该标记：若标记为 `lite` 且当前 surface 是 `pro`，则 `setSurface("lite")` 并清除标记，随后按现有逻辑恢复分段与滚动位置（`LitePortfolio` 已有的恢复流程会接管）。
   - 标记只在这一条入口写入，一经消费即清除；用户若在 Pro 里手动切 surface，也一并清除，避免"莫名被传送回 Lite"。

3. **不改动的部分（红线）**
   - Pro 交易页（`DesktopTrading` / `TradingCharts`）的返回按钮逻辑不动，仍是 `navigate(-1)`。
   - Lite 三个交易页、既有 `state.from` 返回逻辑、Pro Portfolio 本身都不动。
   - 没有业务逻辑改动，纯导航状态。

## 验收

Playwright（移动 393×831，登录态）：Lite `/portfolio` 滚到中段 → 展开 pending orders → 点一条 → 落在 Pro `/trade?event=...` → 点返回 → 断言 URL 为 `/portfolio`、渲染的是 Lite 版、`window.scrollY` 与跳转前一致。

## 技术细节

- 新增导出：`savePortfolioReturnSurface()` / `takePortfolioReturnSurface()`，与现有 scroll/segment helper 同文件同写法（try/catch best-effort）。
- surface 切换发生在 `PortfolioRoute` 的 effect 中，切换后同一次渲染即命中 `LitePortfolio`，其 `takePortfolioScroll()` 的重试式恢复（最多 40 帧）足以覆盖 Lite 列表延迟撑高的情况。
