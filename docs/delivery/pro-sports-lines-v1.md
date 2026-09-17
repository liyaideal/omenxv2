# Pro 终端体育市场行（让分 / 大小球 / 单图市场）— 交付说明 v1

> 这份文档说的是 Pro 交易终端（`/trade` 桌面与手机）对体育"一场比赛多组市场"的兼容：此前 Lite 页已经把一场比赛做成 Winner + Handicap + Total（足球）或 Series lines + 每张地图的 Rounds handicap / Total rounds（电竞）的 board，但 Pro 终端只显示 Winner 一个市场，让分 / 大小球 / 单图市场在 Pro 里不可达，直接打开一条线的 id 还会显示 "Event Has Ended"。现在 Pro 页头下方用一根横向"市场行"承接这些市场：一个芯片一组，点开选线，选一条 = 整个终端切到那条 sibling event。给从未看过这块的人写；兄弟事件模型本身见 `sports-game-lines-spec.md`，本文只写 Pro 侧。

## 0. 读者须知

- 长什么样 → 生产页 `/trade?event=demo-prekick-cs2`（电竞 BO3）、任一足球 fixture；手机 `/trade`、`/trade/order` 同款
- 什么时候变成什么样 → `/style-guide` →「Pro — 交易终端」：SL-D1…SL-D3（桌面）、SL-M1 / SL-M2（手机）
- 数据模型（fixture / sibling / line / side_labels）→ `docs/delivery/sports-game-lines-spec.md`
- 设计法则 → `DESIGN.md` §Addendum 2026-09-17
- Lite 面 → 不变（fixture board 照旧）

## 1. 功能目标

1. Pro 用户能在同一场比赛内切换 Winner / Handicap / Total / 单图市场，不必回 Lite。
2. 从持仓、分享、Lite 带过来的 `/trade?event=<fixture>&line=<sibling>` 和直接的 `/trade?event=<sibling>` 在 Pro 下都能打开。
3. Pro 的持仓 / 挂单表里 sibling 上的仓位显示正确的两侧名（`AST −1.5` 而不是 `Yes`）。

## 2. 口径

| 项 | 口径 |
|---|---|
| 触发 | 当前事件属于一场比赛（自身是 Winner 且有 sibling，或自身是 sibling）→ 页头下方原来的 `Select Option` 行换成市场行；其他事件不受影响 |
| 市场行 | `MARKETS` 小标 + 一组芯片。芯片 = 组名小字 + 当前线位与 Yes 侧价格（`HANDICAP AST −1.5 · 34¢`）。足球：`Winner / Handicap / Total goals`（Total 词按 `scoringNoun`：goals / points）；电竞：`Winner / Handicap / Total maps ｜ Map 1 / Map 2 / Map 3`（每张地图一个分段组：Map n winner / Rounds handicap / Total rounds 三节）；MMA：`Winner / Total rounds / Method`。组名沿用 Lite board，Spread / Totals / O/U 全站禁 |
| 芯片状态 | 当前组：`--yes` 描边 + 淡青底（选择控件，不填充）；非当前单节组：显示默认线位（中位线）+ Yes 价，muted；非当前分段组：只显示组名 + ▾；单线组（Winner）无 ▾，点击直接切 |
| 选线 | 多线组点开：桌面 DropdownMenu / 手机 MobileDrawer；每节一个小标，行 = `AST −3.5 / HER +3.5` + 两侧价格（Yes 青 / No 荧光绿），当前行高亮。选一条 = `setSelectedEvent(sibling)` + 导航到 `?event=<fixture>&line=<sibling>`（Winner 则去掉 `line`）；手机在 Charts / Trade 子页都保留 `line` |
| 页头 | 标题恒为比赛名（Winner 事件的 name）；副行在 `Ends in` 前写当前市场 `Map handicap · AST −1.5`（手机写在倒计时行前） |
| 深链归一 | Pro 收到 `?event=<sibling>`（无 line）或 `event` 与 sibling 的 fixture 不符 → `replace` 成 `?event=<fixture>&line=<sibling>`；不再 "Event Has Ended" |
| 数据 | `useActiveEvents` 同一查询拉全部未结算事件，拆成 `events`（无 sibling，列表 / 选择器 / More markets 用）与 `siblingEvents`；`useEvents` 的 `selectedEvent` / `getEventById` / `getOptionsForEvent` 覆盖 sibling，`events` 列表仍不含 sibling；`useEventSideLabelsLookup` 覆盖 sibling → 持仓 / 挂单表两侧名正确 |
| 表格跳转 | 持仓 / 挂单 HoverCard 的 "Go to this event" 对 sibling 走 `?event=<fixture>&line=<id>` |
| 不动 | ES-1 事件选择器只列比赛不列线；Lite 页；结算引擎；sibling 数据模型 |

## 3. 实现指引

- 模型：`src/lib/fixtureMarkets.ts`（`buildFixtureMarkets` / `fixtureIdOf` / `fixtureLinePath` / `priceCents`），复用 `sportsData.groupFixtureMarkets` / `groupSegmentedMarkets` / `scoringNoun`。
- UI：`src/components/pro/MarketLineRow.tsx`（`variant="desktop" | "mobile"`，`previewOpenGroup` 字典用；Chip 必须 forwardRef——DropdownMenuTrigger asChild 靠它定位）。
- 挂载：`DesktopTrading.tsx`（`eventId = line ?? event`、`fixtureMarkets`、URL 归一 effect、`handleLineSelect`、`goToEvent`、subHeader 分支、页头标题 / 副行）；`MobileTradingLayout.tsx`（`PerpTradingLayout` 同上、`optionChips` 分支、`countdownLabel`、`useMobileTradingContext` 读 `line`、Charts ↔ Trade 保留 `line`）。
- 类型：`DatabaseEvent.metadata`、`TradingEvent.metadata`。
- 别名 binary 的当前 option 固定在 Yes 端：`eventUtils.resolveYesSideOption`（字面 yes → `side_labels.yes` 别名 → id 以 `-yes` 结尾 → 第一个 option），`useEvents` 在事件切换时调用。原因：Pro 终端对队名/盘口这类别名事件没有 option 选择器，Yes/No 切换 = 买/卖当前 option；而 sibling 的 options 按 id 排序 `-no` 在 `-yes` 前，之前默认选到 No 端，两端价格和 CTA 都反了。字面 Yes/No 事件不受影响（仍可选 No 端）。

## 4. 已知边界

- Winner 是三选一（足球 主 / 平 / 客）时，Winner 芯片带下拉列出三个 outcome（各一个价格）；选中 = 留在 Winner 事件、切换下单面板的 option（line id 形如 `<event>#<option>`，见 `outcomeLineId` / `parseLineId` / `currentLineId`）。市场行替换了原 `Select Option` 芯片行，所以三选一必须在这里可达。
- 芯片价格随 `RealtimePricesContext` 刷新（与图表同源）；Lite board 的"You hold"标记未搬到市场行（Pro 用持仓表看）。
- 现货线（`/spot`）没有 fixture 概念，不涉及。
- 手机 Pro `/trade/order` 表单（SL-P2，Liya 09-17 批）：别名 binary 的两钮文案读 `side_labels`（`AST −3.5` / `HER +3.5`），与桌面一致；机制不变（Yes 钮 = 买当前 option，No 钮 = 卖）。字典 CT-M7。
- 手机 Pro `/trade` 图表视图（SL-P2）：`Mark Price` 旁的侧别标与底部 dock 两钮同样读 `side_labels`（`TradingCharts` 用 `isSingleMarketBinary(options, selectedEvent)`）。
