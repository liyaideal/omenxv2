# 移动端 Redeem voucher —— 修掉三层头

## 现状（已核实代码）
`/rewards` 移动端点进 Redeem 后，屏幕上同时叠了三层头：

```text
MobileHeader  "Rewards"  ← LiteRewardsPage.tsx:132（固定 44px）
Tabs  Campaigns|Vouchers|Referral ← 同文件 sticky top-[44px]，redeem 时仍在
"< Redeem voucher"  ← VouchersBody.tsx:170 自己再画一条 header
```

根因：redeem 屏只是 `VouchersBody` 内部的一个分支（`mobileRedeeming` 局部 state），渲染在 Rewards 页面的 body 里，所以外层页面壳（页头 + tab 条）照旧存在，它自己又补了一条标题栏。

## 要做的改动
把移动端 redeem 变成真正的全屏子页面，只留一层头。

1. **状态提升到 URL**：redeem 态改用 `?tab=vouchers&redeem=<voucherId>` 记录，`VouchersBody` 读写这个参数替代内部 `mobileRedeeming`。这样系统返回键、页面刷新都能正常工作，`LiteRewardsPage` 也能知道当前处于 redeem 屏。
2. **页头收成一层**：移动端处于 redeem 时，`MobileHeader` 标题改为 `Redeem voucher`，返回键回到券列表（清掉 `redeem` 参数）而不是退出 `/rewards`。
3. **隐藏 tab 条**：redeem 屏不渲染 Campaigns/Vouchers/Referral。
4. **删掉内层自绘 header**：`VouchersBody.tsx:170-184` 那条 `< Redeem voucher` 整块移除，屏幕直接从 `VoucherDeskHeader`（$25 券面卡）开始。
5. 桌面端与 style-guide demo 走的都是同一分支参数，保持现状不变；桌面双栏 desk 布局零改动。

## 技术细节
- 改动文件：`src/pages/lite/LiteRewardsPage.tsx`、`src/components/vouchers/VouchersBody.tsx`。
- `VouchersBody` 增加可选 prop（如 `onRedeemScreenChange` 或直接共用 `useSearchParams`），避免页面与 body 各存一份状态。
- 底部 `RedeemSummaryBar` 悬浮位置与 BottomNav 关系不动。
- 完成后在 375px 真机视口截图核对：只有一层 `Redeem voucher` 头、返回可回列表。
