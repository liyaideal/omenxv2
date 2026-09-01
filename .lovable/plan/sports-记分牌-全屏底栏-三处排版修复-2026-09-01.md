# Sports 记分牌 / 全屏底栏 三处排版修复

只改展示层，不动数据、模型与结算逻辑。CS2 / UFC / 足球 / 篮球 / 网球 / MOBA 的已批常规形态渲染保持不变。

## 1. M6 · 表外赛事退化：总数贴边

现状：没有 `spec` 时，网格只有 `1fr + 62px` 两列，总数列右对齐，后面没有正常形态里那 18px 的间隔列，所以数字紧贴卡片右边框。

改法：`Matrix` 里总数单元格在「无分段矩阵」时补右内边距（与表头一致的 16px），让 `MAPS` 表头与两行数字都从右边框内缩。有矩阵的形态保持现状（间隔列已经存在），像素零变化。

## 2. M2 / U3 / F2 · 未开赛：移动条看不清

现状：`MobileBar` 高度固定 62/45，右侧 `Starts in 2h 14m` 没有 `nowrap`，在窄宽度里换行并被裁掉；同时未开赛仍渲染 `0 – 0` 两个大比分，把队名压成 `N…` / `Per…` / `P…`。

改法（只针对 `status === "upcoming"`）：
- 右侧 `Starts in …` 加 `whiteSpace: nowrap` 与 `flexShrink: 0`，不再换行。
- 未开赛不渲染 `0 – 0` 大比分与分隔符（无意义），改为队伍缩写 + `vs` + 队伍缩写（与 MMA 分支同一写法），把腾出的宽度给队名。
- 队名容器允许收缩（`minWidth: 0`），必要时才 truncate。

其他状态（live / break / finished / settled）分支不动。

## 3. C3 · 全屏底栏（S10）排版

现状：底栏是单行 flex，`delayPill` 可被压缩且没有 `nowrap`，在预览这种窄容器里被挤成 5 行；两个 `minWidth: 120` 的价格 chip 溢出右边界。

改法：
- `delayPill` 加 `whiteSpace: nowrap`，`flexShrink: 0`。
- 底栏容器允许换行（`flexWrap: wrap`，`rowGap`），窄宽度时提示行在上、两个 chip 成一行在下；宽屏仍是「提示靠左、chips 靠右」的一行，与已批画布一致。
- chip 的 `minWidth` 改为在容器不够宽时可收缩（`minWidth: 0` + `flex: 0 1 120px`），避免溢出被裁。

## 技术说明

改动文件仅两个：
- `src/components/lite/sports/LiveMatchboard.tsx`（`Matrix.totalCell`、`MobileBar` 的 upcoming 分支与右值样式）
- `src/components/lite/sports/LiveStage.tsx`（`delayPill`、`chip`、`chrome === "full"` 底栏容器）

验收：在 `/style-guide#lite-sports-live` 逐项截图 M6 / M2 / U3 / F2 / C3，并回证 M1、M7、U1、F1、B1、T1、G1、C1、C2 渲染无变化。
