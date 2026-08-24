# 结算详情页返回按钮死循环

## 问题（已确认）

`src/pages/lite/LiteSettlementDetail.tsx` 的移动端头部是 `<MobileHeader variant="inner" title={s.event} />`，没有传 `backTo`。`MobileHeader` 在没有 `backTo` 时走 `navigate(-1)`，也就是浏览器历史回退。

于是流程变成：结算详情 → View event → 交易页 → 交易页返回（跳回结算详情，是一次新的前进）→ 结算详情返回 = 历史后退一步 = 又回到交易页，来回打转。

同一页面里 `actions.onBack` 已经算好了正确目标（`/portfolio?tab=settled` 或 `?series=<id>`），但只有纯展示组件用得到，头部没有接上。系列详情页（LitePortfolio）已经显式传了 `backTo`，所以没有这个问题。

## 改动

`src/pages/lite/LiteSettlementDetail.tsx`：给两处 `MobileHeader`（加载态与正文态）加上 `showBack` 与 `backTo`，目标与 `actions.onBack` 一致：

- 带 `?series=<id>` 时 → `/portfolio?tab=settled&series=<id>`
- 否则 → `/portfolio?tab=settled`

这样返回始终是"回到列表/系列页"的确定目标，不再依赖历史栈。

## 技术说明

- 只改导航目标，不动数据层、不动 `SettlementDetailView.tsx` 的视觉与结构。
- 桌面端无 MobileHeader 返回键，不受影响。
- 验证：结算详情 → View event → 交易页返回 → 结算详情返回，落在 settled 列表（或系列详情），不再回到交易页。
