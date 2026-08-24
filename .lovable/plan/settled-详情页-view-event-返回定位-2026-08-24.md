# Settled 详情页 "View event" 返回定位

## 问题

结算详情页（单仓 `/portfolio/settlement/:id`，以及系列详情 `/portfolio?tab=settled&series=...`）里的 **View event ›** 跳进交易页后，交易页左上角的返回按钮走的是默认目标（events 列表），而不是回到刚才那张结算详情页。

Live 持仓卡片已经通过 `state.from` + `savePortfolioScroll()` 解决了同样的问题；这两个入口没有接上。

## 改动

1. **单仓结算详情**（`src/pages/lite/LiteSettlementDetail.tsx`）
   - `onViewEvent` 跳转时带上 `fromState(当前完整路径，含 `?series=` 查询串)`，跳转前调用 `savePortfolioScroll()`。
   - 交易页读到 `state.from` 后，返回按钮回到这张结算详情页；该详情页自身的返回按钮再回到 settled 列表 / 系列页（现有逻辑不变）。

2. **系列结算详情**（`src/pages/lite/LitePortfolio.tsx` 的 `seriesActions.onViewEvent`）
   - 同样带 `fromState('/portfolio?tab=settled&series=<id>')`，并先存滚动位置。
   - 从交易页返回后落回系列详情，滚动位置由既有的 LitePortfolio 恢复逻辑处理。

3. 三个交易页（`LiteSpotTrade` / `LiteContractTrade` / `LiteQuickTrade`）已支持 `location.state?.from` 作为 `backHref`，无需改动 — 只做一次确认。

## 技术说明

- 复用 `src/lib/portfolioReturn.ts` 里现成的 `fromState()` 与 `savePortfolioScroll()`，不新增机制、不动业务逻辑。
- 只改导航参数，不动 `SettlementDetailView.tsx` / `SeriesDetailView.tsx` 的视觉与结构。
- 验证：在预览里从 settled 详情点 View event，确认交易页返回箭头回到同一张详情页；系列详情同理。
