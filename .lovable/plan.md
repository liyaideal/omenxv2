# Event "In review" 状态（Lite 交易页）

给事件加一个介于「交易结束」和「已结算」之间的中间态：结果还在核对，可能持续较久。数据来源复用后端已有的 `events.lifecycle_status = 'REVIEW'`，不新增字段、不动数据库。

## 行为口径

- 判定：`lifecycle_status === 'REVIEW'` 且事件尚未 `is_resolved`。已结算优先级最高（REVIEW + resolved → 走 settled）。
- 交易：禁止下单，按钮禁用文案 `In review · result pending`。
- 持仓：冻结——隐藏/禁用 Cash out，持仓卡下方补一行说明「Result is under review. Payout once confirmed.」价格与盈亏继续按当前 mark 显示，但标注为未定。
- 结算区：不渲染 `LiteOutcomeCard` / `How it settled`（还没有结果），改渲染一张 in-review 说明卡。

## 覆盖范围

仅两个 Lite 交易页 + Style Guide。事件列表卡、日历、Portfolio 本轮不动（Portfolio 的 Cash out 仍按现有逻辑，若需要一并冻结请说明，可作为下一轮）。

## 实现

新增共享组件 `src/components/lite/trade/InReviewCard.tsx`
- 用与 `HowItSettled` 同族的 rule-card 配方（同 panel 样式，不新造 chrome）。
- 内容：徽标 `In review · result pending`（橙 `#FF8A3D` 描边 pill，与 Intraday 身份色一致）、一句说明 `Result is under review. Payout once confirmed.`、若事件有 `source_name` 则补来源行。
- 无倒计时（时长不可预期），不显示预计时间。

`src/pages/lite/LiteContractTrade.tsx`
- 新增 `inReview = !resolved && event?.lifecycle_status === 'REVIEW'`。
- `blocked = resolved || inReview || pastEnd || pastFreeze`；`blockedReason` 在 inReview 时为 `In review · result pending`。
- 渲染分支：`inReview` 时渲染 `InReviewCard`（占原 OutcomeCard/Proof 位置），保留图表与持仓卡，不渲染 `CashOut` / `MultiCashOut`，持仓卡 `onCashOut` 不挂。

`src/pages/lite/LiteSpotTrade.tsx`
- 现有 `isOrderingBlocked(dbLifecycle)` 已把 `REVIEW` 算作禁单，只需补显示层：新增同样的 `inReview` 变量，settlement rail 末节点文案改为 `In review`，`Proof` / `OutcomeCard` 分支让位给 `InReviewCard`，`CashOut` 与 `YourPosition` 的平仓入口在 inReview 时隐藏。
- `getBlockedReason('REVIEW')` 的现有文案统一为 `In review · result pending`（`src/lib/usStockSessions.ts`），确保两页同一句。

Style Guide
- 在 lite-trade 节点新增 in-review 演示：合约页与现货页各一张，覆盖「有持仓」与「无持仓」两态，挂真组件（`InReviewCard` + 禁用态订单面板），不手抄复刻。
- nav/进度总览不动。

## 文案

- 徽标：`In review · result pending`
- 说明句：`Result is under review. Payout once confirmed.`
- 持仓提示：`Cash out is paused while the result is under review.`
- 不使用 Lite 禁词，无 Margin/Liquidation 等词。
