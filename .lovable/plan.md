# 修复：limit order 行有时跳进 Lite 交易页（应始终进 Pro）

## 诊断

`PendingOrdersRow.openInPro()` 在同一个点击里做了三件事：`savePortfolioReturnSurface("lite")` → `setSurface("pro")` → `navigate("/trade?event=...")`。

问题出在上一轮新加的 `PortfolioRoute` effect：它的依赖是 `[surface]`，只要 `/portfolio` 在路由切换提交之前先以 `surface="pro"` 重渲染一次，这个 effect 就会立刻消费掉刚写下的 `lite` 标记并把 surface 又切回 `lite`——于是 `/trade` 渲染成 Lite 的 `LiteContractTrade`，而 Lite 没有挂单模块。

（沙盒里这次竞态没复现，落在了 Pro 终端；但代码路径确实存在，且与实机现象一致。）

## 修复

只改 `src/pages/PortfolioRoutes.tsx`：

- 用 `useNavigationType()` 判定：**只有** `POP`（浏览器返回）到达 `/portfolio` 时才消费 `lite` 返回标记并切回 Lite。
- `PUSH` / `REPLACE`（也就是点击跳出去的那一瞬间的重渲染）一律不读取、不清除标记。
- 消费后照旧清除标记，`LitePortfolio` 现有的分段 + 滚动恢复流程不变。

其余全部不动：`LiveCards` 的 `openInPro`、`portfolioReturn.ts` helper、Pro 终端、Lite 三个交易页、手动切 surface 时清标记的逻辑都保留。

Lite 侧的 limit order 展示模块按你说的另开一轮规划，本轮不做。

## 验收

Playwright 移动 393×831 登录态：Lite `/portfolio` → 展开 `orders waiting to fill` → 点一条 → 截图确认落在 **Pro 终端**（Order book / Trades history / Positions 标签可见）→ 浏览器返回 → 确认回到 Lite `/portfolio` 且滚动位置恢复。
