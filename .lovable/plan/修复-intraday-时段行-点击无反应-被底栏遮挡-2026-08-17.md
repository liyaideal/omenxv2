# 修复 Intraday 时段行：点击无反应 + 被底栏遮挡

## 问题 1：「Hong Kong session open · 6 stock rounds / Open →」点了没反应

这一行来自 `MobileIntradayModule` 的 `SessionRow`，它的 `onOpen` 在 `/events` 移动端 Intraday 视图里被接成 `setSector("intraday")` —— 而用户此刻已经在 intraday 视图，所以是自我跳转、界面纹丝不动。行里还带着 `Open →` 的行动承诺，属于死按钮。

修复：让这一行真的把当天该交易所的股票 round 打开。

- `SessionRow` / `MobileIntradayModule` 增加一个按交易所回传的回调（`onOpenSession(market)`），不再复用页面级的 `onOpenIntraday`。
- 在 `LiteEventsPage` 的移动端 Intraday 分支里接上：切到 Finance（股票）视图并把该交易所的 round 列表带出来（intraday 视图当前只渲染 coin 卡，股票行不在场，所以必须换视图才有内容可看）。
- 「All」移动端 stage 的现有行为不动（那里 `onOpenIntraday` 本来就是有效跳转）。
- 桌面 intraday/finance 视图里的同类 session 文案是纯信息行，不加点击，不动。

## 问题 2：内容被底部导航遮挡

`LiteEventsPage` 移动端外壳只有 `pb-24`（96px），而 `BottomNav` 是 fixed，实高约 90–96px 再加 iOS 安全区，所以最后一张卡片正好压在底栏下。

修复：把移动端底部留白提到能容下底栏 + 安全区（`padding-bottom: calc(112px + env(safe-area-inset-bottom))` 量级），只改这一处外壳内边距，不动任何卡片自身版式。

## 技术说明

- 涉及文件：`src/components/lite/mobile/MobileIntradayModule.tsx`、`src/pages/lite/LiteEventsPage.tsx`。
- 只改展示层与导航接线，不碰 round 调度、结算逻辑、时间口径。
- 交付前 typecheck + build，并在 393px 视口确认 session 行可点、末尾卡片不再被底栏压住。
