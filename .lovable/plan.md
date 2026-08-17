# 让 “session open” 点击后直达当日股票 rounds

## 现状问题
点击移动端 Intraday 的 “Tokyo/HK session open · N stock rounds” 行后，只是把类目切到 Finance。Finance 视图顶部是 vertical header + 两行筛选（Asset class / Region），当日 rounds 引擎排在这些 chrome 之下，且区域筛选仍是 “All regions”、资产类别 “All”，用户看不到自己刚点的那个市场的 rounds，落地后完全没有承接感。移动端的 Finance 头部也没有 SessionStatusChip（桌面才有），所以连“现在哪个市场开着”的上下文都没有。

## 要做的事

1. 把点击的市场带过去
   - `MobileIntradayModule` 的 `onOpenSession` 已经会回传 `market`，`LiteEventsPage` 目前把它丢掉了。改为记录该市场（如 `hk` / `us` / `kr`），切到 Finance 时作为落地意图。
   - `LiteFinanceView` 用这个意图初始化筛选：Asset class = Stocks，Region = 被点的市场。这样落地首屏就是那批当日 rounds，而不是混合目录。
   - 市场变更（用户再点别的 session 行）时同步更新，不是只在首次 mount 生效。

2. 落地后滚动到引擎
   - 切到 Finance 后，把 rounds 引擎区块滚进视野（`scrollIntoView`，尊重 sticky header 高度），让 rounds 成为首屏主体而不是被 header + 两行筛选顶下去。

3. 移动端补上 session 上下文
   - `LiteFinanceView` 在移动端也渲染 `SessionStatusChip`（放在 header 下方或 eyebrow 行，遵循移动端紧凑排版），让用户看到 “HK trading · closes 16:00” 这类状态，确认自己到对了地方。

4. 引擎为空时的兜底
   - 若带过来的区域此刻没有 rounds（例如刚好收市），显示一行说明并给 “See all regions” 的复位动作，而不是空白。

## 技术说明
- 涉及文件：`src/pages/lite/LiteEventsPage.tsx`（保存被点市场、传给 Finance 视图）、`src/components/lite/categoryviews/LiteFinanceView.tsx`（受控/同步的 initialClass+initialRegion、移动端 session chip、滚动锚点、空态）。
- 不动 `MobileIntradayModule` 的视觉与 SessionRow 版式；不动 Finance 目录网格、卡片、结算逻辑与任何数据层。
- Style Guide：Finance 视图为真组件会自动跟；如需覆盖“带区域落地”状态，在 finance demo 增加一个 preset（region 预选 + 移动端 session chip）。
- 验收：typecheck + build，移动视口点击 session 行确认落地即见对应市场的当日 rounds。
