# 让 “session open” 点击后直达当日股票 rounds

## 现状问题
点击移动端 Intraday 的 “HK session open · N stock rounds” 行后，只是把类目切到 Finance，页面停在顶部。Finance 视图顶部是 vertical header + 两行筛选（Asset class / Region），当日 rounds 引擎排在这些 chrome 之下，用户落地看不到自己刚点的东西，没有承接感。

## 要做的事（仅一项）

切到 Finance 后，把 rounds 引擎区块滚进视野。
- 在 `LiteFinanceView` 的引擎区块上加一个 ref 锚点。
- 由 session 行点击触发的这次进入（一次性意图，不是每次进 Finance 都滚），在渲染出引擎后 `scrollIntoView({ behavior: "smooth", block: "start" })`，并留出 sticky header 的高度，避免标题被压在头部下面。
- 若此刻引擎没有任何 rounds（收市等情况），不滚动，保持页面顶部，让用户正常从头浏览。

## 明确不做
- 不预设 Asset class / Region 筛选（会让用户误以为只有这些 event，且不知道要清空筛选）。
- 不改移动端 Finance header、不加 session chip。
- 不改 `MobileIntradayModule` 的 SessionRow 视觉，不动目录网格、卡片、数据层与结算逻辑。

## 技术说明
- 涉及文件：`src/pages/lite/LiteEventsPage.tsx`（记录“来自 session 点击”的一次性意图并下传）、`src/components/lite/categoryviews/LiteFinanceView.tsx`（引擎锚点 + 滚动效果，用后清除意图）。
- 验收：typecheck + build，移动视口点击 session 行确认落地后引擎区块位于首屏，筛选保持 All / All regions。
