# 交易终端事件选择器（Standard / Boost）— 交付说明 v1

> 这份文档说的是 Pro 交易页标题上那个"Select Event"选择器：以前只有合约页有，列的是所有事件不分产品线；现货页标题不能点。现在两个终端共用一个选择器，顶部分 `Standard`（现货线）/ `Boost`（合约线）两个页签，从另一个页签选事件会直接跳到对应终端。列表里的结束时间改成相对时间（`8m` / `3h 12m` / `2d 14h` / 日期），快轮事件才看得出哪局马上结束。同时删掉手机现货页标题旁的 `SPOT` 标——产品身份只在选择器页签里出现，合约页也不加 `Boost` 标。给从未看过这块的人写；读法：先看 §0，再按 §2 的口径逐条对。

## 0. 读者须知

查什么去哪儿：
- 长什么样 → 生产页 `/trade`、`/spot`（桌面标题 ▾）、`/trade`、`/spot`、`/trade/order`、`/spot/order`（手机标题 ▾）
- 什么时候变成什么样 → `/style-guide` →「Pro — 交易终端」：ES-D1…ES-D4（桌面下拉）、ES-M1（手机抽屉）
- 字段名、文案、时间格式 → `docs/copy-dictionary.md`（Trading 节 `Standard / Boost（选择器页签）`、`Ends in（列表）`、`Frozen`）+ 本文档 §2
- 设计法则 → `DESIGN.md` §Addendum 2026-09-15 第 7 则
- Lite 面 → 不适用（Lite 交易页没有事件选择器，入口在事件列表）

## 1. 功能目标

1. 让用户在交易终端里直接切换两条产品线的事件，而不是退回列表页再进。
2. 合约选择器不再混入只有现货线的事件（点进去会在合约终端打开一个不该有合约的事件）。
3. 快轮事件（8 分钟一局的加密涨跌）在列表里看得出剩多久，不是只看到一个日期。

## 2. 口径

| 项 | 口径 |
|---|---|
| 入口 | 桌面：标题右侧 ▾，点开在标题下方展开下拉（`/trade` 原有下拉、`/spot` 新增，同一组件）。手机：标题右侧 ▾，点开 `Select Event` 底部抽屉（`/trade` 原有、`/spot` 新增，同一组件）。 |
| 页签 | 顶部两项 `Standard` / `Boost`，与账户卡 `Standard Account` / `Boost Account` 同一套词；不用 Spot / Futures。默认页签 = 当前终端（/spot → Standard，/trade → Boost）。关闭后重置回默认页签、清空搜索。 |
| 列表口径 | 按事件的 `product_lines` 过滤：Standard 只列含 `spot`，Boost 只列含 `futures`（为空视为 futures）。两条线都开的事件两个页签都出现。排序沿用活跃事件默认（结束时间升序）。 |
| 当前行 | 当前事件在自己那条线的页签里高亮（桌面 `bg-muted/30`，手机描边卡片）；切到另一页签没有高亮行。 |
| 选中跳转 | 同页签：原行为（合约页替换 URL 不入历史）。另一页签：跳到对应终端 `/spot?event=` ↔ `/trade?event=`，手机保持当前视图（Charts → Charts，Trade → order 子页）；Lite/Pro 偏好不变。 |
| 搜索 / 收藏 | 搜索框 + ★ 过滤在页签下方；收藏（`trading_favorites`）两页签共用、与合约页 header 的 ★ 同一份。 |
| `Ends in` 列 | 相对时间：<1 分钟 `<1m`；<1 小时 `8m`；<24 小时 `3h 12m`；<7 天 `2d 14h`；≥7 天日期 `Sep 29`；过 freeze 未到结束 `Frozen`；已过结束 `Ended`（列表通常不会出现）。每分钟刷新一次。颜色与终端 header 倒计时同阈：≤15 分钟红、≤1 小时黄、其余 muted。桌面列头 `Ends in`；手机行内 `Ends in 8m · Volume: $803K`（Frozen 时不带 `Ends in` 前缀）。 |
| 空态 | 收藏过滤无结果：★ + `No favorites yet` + `View all events`；搜索无结果：Search 图标 + `No events found`。 |
| header 标 | 手机现货页标题旁的 `SPOT` badge 删除；合约页不加 `Boost` badge。终端 header 上只允许生命周期 badge（DESIGN 09-10 规则：最多一个）。 |
| 不动的 | 事件列表页 `/events`、Lite 的各入口、引擎、`useEvents` 的选中态与 `trading_last_event` 记忆（现货页仍不写入）。 |

## 3. 实现指引

- 规则与格式：`src/lib/eventSelector.ts`（`eventOnTab` / `terminalPath` / `formatEndsIn`）。
- 状态：`src/hooks/useEventSelector.ts`（页签、搜索、收藏、分钟时钟、过滤后列表；合约页把 `useEvents` 的收藏传进来共用）。
- UI：`src/components/EventSelectorPanel.tsx`（`variant="dropdown" | "drawer"`，`EventSelectorDropdown` = 桌面外框）；手机壳 `src/components/EventSelectorSheet.tsx`。
- 挂载：`DesktopTrading.tsx`（替换原内联下拉）、`SpotTrading.tsx` + `ProSpotHeader`（新增 `onTitleClick / selectorOpen / selector` props）、`MobileTradingLayout.tsx`（合约壳改用新 hook；现货壳新增 `onTitleClick` + 抽屉）。
- `TradingEvent` 新增可选 `productLines` / `freezeTime`；`spotHeaderEvent` 适配器补齐。

## 4. 已知边界

- 桌面下拉点外面关闭（两页一致，合约页此前没有）。
- 列表每分钟刷新，`<1m` 之后不会秒级倒数（列表不是倒计时器，header 才是）。
- 事件很多时列表不分页，与原有一致。
