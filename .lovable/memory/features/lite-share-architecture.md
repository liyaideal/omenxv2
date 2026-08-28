---
name: Lite 晒单分享架构
description: LitePnlPoster 三态海报 + LiteShareFlow 登录门 + 平仓自动弹 + 四处入口 + compact 2×2
type: feature
---

# 分享（SH 系列）

- `LitePnlPoster.tsx`：海报三态 `live` / `cashed` / `settled` × 输赢。**严禁出现 Leverage、voucher 等内部概念**。出图口径固定 400px。
- `LiteShareFlow.tsx`：`ShareModal` + 海报的薄封装。**仅登录态可用**，游客 demo 仓位永不出分享卡。
- **自动弹**：`LiteCashOutFlow` 平仓成功后自动打开分享流；全量平仓会卸载该 flow，故快照上抛由页面级 `LiteCashOutShareCard` 承载。
- **四入口**（均为可选 `onShare?`，不传 = 生产 DOM 零变化）：
  1. `LitePositionCard` — 28px ghost Share2 icon；
  2. `LiteOutcomeCard` — 仅 holding 分支渲染 Share 文字按钮；
  3. Portfolio `LiveRow` / `LiveCard` — share icon；
  4. `LiteSettlementDetail` — 桌面按钮 / 移动 icon。
- `LitePositionCard` compact 态用 `grid-cols-2`（2×2）。
- style-guide：SH-1 … SH-8，fixture 数值组以 CPO 已批 mock12 为唯一口径，禁擅改。
