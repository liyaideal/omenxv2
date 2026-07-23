---
date: 2026-05-25
title: Single-market binary 事件 UI 收敛
slug: single-market-binary-collapse
type: feature
---

# Single-market binary 事件 UI 收敛

## 背景

binary 事件（options = [Yes, No]）本质 = 一个 market + 两个对立方向。
此前 `/trade` 页面同时存在两个方向切换器：
- 顶部 `Select Option:` 行（Yes / No 两个 chip）
- 右侧 Trade 面板（Yes / No 两个按钮）

入口重复，且未来体育类单 market 事件（"今天的德比谁夺冠？"）希望两端展示队名。

## 变更

### 1. 顶部 chip 行收敛
- **单 market binary**：折叠为只读 `Market: Yes or No` 标签
- **多 outcome**：保留 chip 切换器

### 2. 方向切换归口到 Trade 面板
binary 模式下，Yes/No 按钮点击：
- 都执行 `setSide("buy")`（两端都是 long 仓位）
- 同步切换 `selectedOption` 到对应 option ID
- K 线、订单簿、价格行自动联动到所选 market 的真实价格

### 3. 两端别名 sideLabels（基础设施）
`TradingEvent.sideLabels?: { yes; no }`：
- 缺省 → "Yes" / "No"
- 体育类可配 `{ yes: "上海申花", no: "山东鲁能" }`，按钮与顶部标签同步展示队名
- 底层 `option.label` 不变

DB schema 暂不动；待真实体育类事件接入再补迁移。

## 文件

- 新增 `src/lib/eventUtils.ts`（`isSingleMarketBinary` / `getBinarySideLabels` / `getYesNoOptions`）
- `src/hooks/useEvents.ts`：`TradingEvent` 增 `sideLabels?`
- `src/components/MobileTradingLayout.tsx`：chip 行分支 + 扩展 `TradingContextData.setSelectedOption`
- `src/pages/DesktopTrading.tsx`：chip 行分支 + Yes/No 按钮 onClick 同步切 option
- `src/components/TradeForm.tsx`：新增 `binaryMode` prop
- `src/pages/TradeOrder.tsx`：构造 `binaryMode` 传给 TradeForm

## 不变

- `side: 'long'|'short'` 持仓字段、PnL 公式、`order.side: 'buy'|'sell'`
- 多 outcome chip 行行为
- 顶部 header（事件标题、Current Price、Volume）
- 持仓存储结构、撮合/PnL 链路

## QA

- [ ] 单 market binary 进入 /trade：顶部仅 `Market: Yes or No`；右侧按钮 Yes/No；点击 No → 价格行变 0.5900、K 线/订单簿切到 No
- [ ] 模拟一个 `sideLabels = { yes:"上海申花", no:"山东鲁能" }`：顶部和按钮都显示队名
- [ ] 多 outcome 事件 chip 行不变
- [ ] 移动 + 桌面镜像验证

## 后续

- Style Guide / Playground：增加 binary 单 market（默认 + 自定义 sideLabels）和多 outcome 的 PresetRail 状态切换（per playground-state-coverage 规则）
- DB 迁移：体育类事件正式接入时给 events 表加 `side_labels jsonb` 列
