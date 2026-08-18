# 移动端 compact 行：点击整行只展开图表，不弹交易抽屉

## 现状
- 桌面：点击整行 → 选中该 option（默认 Yes）并展开内联图表；再点收起。
- 移动：整行不可点（`if (compact || o.settled) return;`），只有 Yes/No chip 可点，而 chip 会 `setDrawerOpen(true)`，所以想看 K 线必须先开抽屉再关掉。

## 目标行为（移动 compact 行）
- 点击行内空白区域（标签/百分比/强度条区域）：
  - 未选中 → 选中该行，side 取"当前已选 side"（同一行已有 side 时沿用，否则默认 `yes`），展开内联图表，**不打开交易抽屉**。
  - 已选中 → 收起图表并取消选中（与桌面一致）。
- 点击 Yes / No chip：保持现有行为 —— 选中该行该 side 并打开交易抽屉；若行已展开，图表 seedKey 随 side 切换。
- 行脚（line scrubber）继续 `stopPropagation`，不触发展开/收起。
- 已结算行仍不可点。

## 技术要点
- `src/components/lite/multi/LiteMarketBoard.tsx`
  - 去掉行 `onClick` 里的 `compact` 早退；compact 与桌面共用同一 toggle 逻辑。
  - 新增可选 prop `onRowSelect?: (optionId: string, side: BoardSide) => void`；行点击优先调用它，未传时回落到 `onSelect`。行点击传入的 side = 该行已选中时的 `selectedSide`，否则 `"yes"`。
  - compact 行加上 `cursor-pointer`/按压反馈（与桌面 `hover:bg-muted/10` 对齐，移动用 `active:bg-muted/10`），并保证触控区不小于现有行高。
  - chip 的 `onClick` 已在 button 内，补 `e.stopPropagation()` 防止冒泡到行 toggle 导致二次切换。
- `src/pages/lite/LiteContractTrade.tsx`
  - 拆分两个 handler：`selectMarket`（chip 用，保留 `setDrawerOpen(true)`）与新的 `selectMarketRow`（行用，只 `setSelectedOptId` + `setSide`，不开抽屉）。
  - 三处 `LiteMarketBoard`（主板、group 板、fixture 板）统一传 `onRowSelect={selectMarketRow}`。
- 其他使用 `LiteMarketBoard` 的页面（如 style-guide demo）不传新 prop 时行为不变；style-guide 的 compact demo 同轮补一条"行点击展开图表"的说明状态。

## 交付后验证
- 393px 视口 `/trade?event=sp-ucl-mci-int`：点击 Handicap 行空白 → 图表展开、抽屉未弹；点 chip → 抽屉弹出；滑轴切换盘口 → 行保持展开、图表跟随。
- typecheck + build。
