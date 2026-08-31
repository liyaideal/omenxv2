# Portfolio Live 列表：Select 并入 Boost/Standard 切换行

## 目标
去掉 Live 列表上方单独一行的 `Select` 入口，把它放到 Boost/Standard segment chips 同一行的右侧，节省纵向空间；选中态的工具条（Select all / count / Cancel）同样收到该行右侧。

## 改动

### 1. `src/pages/lite/LitePortfolio.tsx`
- Segment chips 区块（现 452–461 行）改为一行 flex：`SegmentChips` 居左，右侧按状态渲染：
  - `tab === "live"` 且非 selectMode 且 `rows.length > 0` → 右侧 `Select` 文本按钮（样式沿用现有 `text-[12.5px] font-semibold text-[#33D6FF]`）。
  - `tab === "live"` 且 selectMode → 右侧内联 select 工具条（Select all / Clear / `N selected` / Cancel）。
  - `tab === "settled"` → 右侧不渲染任何内容，chips 行保持原样。
- 删除 `liveBody` 里独立的 Select 入口行（现 369–377 行）和 selectMode 分支的 `SelectToolbar` 块（现 357–367 行）；`BatchActionBar`、确认层、串行平仓逻辑全部不动。
- `selectMode` 下点击 chips 切换 segment 仍会清空选择（既有 `useEffect` 已处理，无需改）。

### 2. `src/components/portfolio/lite/BatchCashOut.tsx`
- `SelectToolbar` 改为适配行内使用：去掉自身的 `px-4 lg:px-0 pb-1 pt-2` 外距（由父行容器控制），保持现有字号/颜色/gap；`Cancel` 不再需要 `ml-auto`（父行右侧容器本身就是右对齐），可保留 flex 结构仅移除外距。

### 3. 行高与对齐
- chips 按钮高 `py-[7px]`，右侧文字按钮用 `py-[7px]` 对齐基线，整行 `min-h` 不高于原 chips 行 + Select 行的总和——净省一行。
- 移动端 390px 验证：chips + Select 一行不折行；selectMode 下 `Select all · Clear · N selected · Cancel` 在 390px 宽内一行放得下（必要时 `Clear` 可与 `N selected` 合并间距压缩，但不改文案）。

### 4. 文档 / Playground（强制项）
- `src/pages/StyleGuide/preview/portfolioPreviews.tsx` + `registry.tsx` + `sections/pages/LitePortfolioPage.tsx`：更新 `portfolio-lite-live-select` 规格说明与交互预览，体现 Select 位于 chips 行。
- `docs/delivery/lite-portfolio-spec-v2.md`：批量平仓章节更新入口位置描述。
- `docs/changelog/STATUS.md`：追加一条变更记录。

## 不改
- `BatchActionBar`、`BatchCashOutConfirm`、`LiveCards.tsx`（CheckDot/选中样式）、`usePositions`、Settled 列表、Pro Portfolio。
- 非 selectMode 下既有 DOM 结构除入口位置外不变。

## 验证
- `bunx tsc --noEmit`（或 tsgo）通过。
- Playwright 390px + 1280px：chips 行右侧出现 Select；点击进入 selectMode 后同行变为 Select all/Cancel；`aria-expanded` 类断言不适用，改为断言行数与按钮可见性；无 pageerror。
