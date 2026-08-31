# Live 列表：多选 + 全选批量平仓

在 Lite `/portfolio` 的 Live 列表加入"选择模式"，可勾选多条持仓（含全选），一次性按市价平掉。移动端与桌面端共用同一套状态，视觉分别沿用现有卡片 / 行骨架。

## 交互设计

**入口**
- Live 列表上方（KPI 与列表之间）右对齐加一个文字按钮 `Select`。未进入选择模式时，列表 DOM 与现在完全一致。
- 进入后按钮变 `Cancel`；左侧出现 `Select all` / `Clear` 与已选计数 `N selected`。

**选择态**
- 移动端：卡片左上角出现圆形勾选框，点击卡片主体 = 切换勾选（不再跳转交易页）；`Cash out` 单条按钮在选择模式下隐藏。
- 桌面端：行首插入一列 28px 勾选框，点击整行 = 切换勾选；行尾单条 `Cash out` 与分享按钮在选择模式下隐藏。
- 已选行加高亮描边（Pulse Blue 半透明 border + 极淡底色）。

**底部操作条**（选择模式且 N ≥ 1 时出现）
- 移动端：sticky 在底部导航之上；桌面端：sticky 在列表底部。
- 左侧两行：`N selected` + `Now worth $X · Profit ±$Y`（选中项汇总）。
- 右侧主按钮：`Cash out N`（禁用态 N = 0）。

**确认层**（遵循项目 overlay 约定）
- 桌面 Dialog / 移动 MobileDrawer，标题 `Cash out N positions`。
- 列出每条：市场名 + side chip 文案 + `Now worth`；底部合计 `You get about $X`。
- 说明句：`Prices move while we close — the final amount can differ slightly.`
- 按钮：Cancel（Outline）+ `Cash out`（Primary，h-11）。

**执行与结果**
- 逐条调用现有统一平仓入口，串行执行并显示进度 `Closing 2 / 5…`（按钮内文案，期间禁用）。
- 全部成功：toast `Cashed out N positions`，退出选择模式，列表刷新。
- 部分失败：toast 提示 `M of N closed`，失败项保留勾选并在行上标红，可重试。
- 空 Live 列表时不显示 `Select` 按钮。

## 技术细节

- `src/components/portfolio/lite/LiveCards.tsx`：`LiveCard` / `LiveRow` / `LiveRowHeader` 新增可选 props `selectMode?: boolean`、`selected?: boolean`、`onToggleSelect?: (row) => void`。全部为可选，未传时渲染结果与现在逐像素一致（防止 Style Guide 指纹漂移）。桌面表头在 selectMode 下 grid 模板前置 `28px` 列。
- `src/pages/lite/LitePortfolio.tsx`：新增 `selectMode` 与 `selectedIds: Set<string>` 状态；切 tab / 切 segment / 行消失时自动清空。汇总数值由当前 `rows` 过滤计算。
- 平仓走 `usePositions().closePosition(positionId, index)`；`index` 通过在 `positions` 数组中按 id 查找得到（游客 localStorage 分支需要）。`airdrop-` 前缀 id 由该函数内部自行路由，无需特殊处理。串行 await，逐条捕获异常记录失败集合。
- 新增 `src/components/portfolio/lite/BatchCashOut.tsx`：底部操作条 + 确认 Dialog/MobileDrawer（复用 `MobileDrawerActions` 规范）。
- Style Guide（强制项）：在 `LitePortfolioPage.tsx` 新增 `portfolio-lite-live-select` spec 段，穷尽状态——非选择模式 / 选择模式 0 选 / 部分选中 / 全选 / 执行中 / 部分失败；在 `portfolioPreviews.tsx` 增加可交互 preview 并注册到 registry。
- 文档：`docs/delivery/lite-portfolio-spec-v2.md` 补一节交互说明与 preview key；`docs/changelog/STATUS.md` 增条目；`docs/copy-dictionary.md` 登记新文案（`Select` / `Select all` / `N selected` / `Cash out N` / `Cashed out N positions`）。

## 不动的部分

- Pro `/portfolio`、Settled 列表、Series 视图、KPI 计算、PnL / mark 口径。
- 单条 `Cash out` 的现有行为（仍跳转交易页）。
- `LiteEventCard`、Rewards 冻结画布、`usePositions` 内部平仓逻辑。
