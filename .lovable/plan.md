# Alex 的 Ready to claim 券 + 头像入口收口

## 1. 给 alex_carter 发几张 Ready to claim 券

现状（已查库）：`alex.carter@gmail.com` 名下 10 张券，状态分布是 claimed / redeemed / settled / expired —— **一张 `granted` 都没有**，所以 /rewards → Vouchers 顶部的 "Ready to claim" 分区现在是空的。

新增 4 张 `granted` 券（进入 Ready to claim 分区，需用户点 Claim 才转 claimed）：

| 面值 | 来源 campaign | 收益模式 | 领取截止 |
|---|---|---|---|
| $10 | Starter Rewards | instant | 7 天后 |
| $25 | World Cup Qualifiers（KOL 专属入口）| tiered | 5 天后 |
| $50 | CPI Print Week | tiered | 10 天后 |
| $10 | July Warm-up | instant | 2 天后（用来看"临期"文案）|

每张挂 `source_entry_id`，这样券行第一行会显示 "From {campaign}" 而不是裸 code；`payout_mode` 混排，好验证"Ready 区不写收益模式"的规则。券码用现有 `gen_voucher_code()` 生成。

只写 alex 这一个账号的数据，不动配额池逻辑、不动任何其他用户。

## 2. 头像下拉里的 Position Vouchers 入口删除

Vouchers 已经并入 /rewards 的第二个 tab，头像菜单里再挂一条是重复入口：

- 桌面 `EventsDesktopHeader`：删掉 "Position Vouchers" 这一条（指向 `/rewards?tab=vouchers`），保留上面的 "Rewards"。
- 移动端 `BottomNav` 的 Me 抽屉：删掉 "Position Vouchers" 这一条（还指向已退役的 `/vouchers`），保留 "Rewards"。

`/vouchers` 路由本身保留为重定向（外部链接、旧 toast 还在用），只是不再从导航里露出。

## 技术备注

- 数据写入走一条 insert，目标表 `position_vouchers`，字段沿用默认的 `redeemable_cap_pct` / `max_holding_hours` / 价格区间。
- 代码改动仅 2 个文件：`src/components/EventsDesktopHeader.tsx`、`src/components/BottomNav.tsx`（各删一个菜单项，顺带清掉不再使用的 Ticket 图标 import）。
- 不碰 VouchersBody / 券组件族 / rewards 版式。
