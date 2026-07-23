> 本文档覆盖 2026-05-25 完成的"全站方向文案 Long/Short + Buy/Sell → Yes/No"统一改造。**仅改展示层文案**，底层数据模型（`side: 'long'|'short'`、`order.side: 'buy'|'sell'`、Supabase 列、PnL 公式、`long+short=1` 双价结构）一律保持不变。研发同步实现时请严格保留底层字段。

## 1. 功能目标

- 全站 UI 出现的 `Long / Short`、`Buy / Sell`（指代交易方向时）统一替换为 `Yes / No`。
- 解决之前 `long+short=1` 双价模型带来的"开空但价格涨却显示亏损"反直觉问题：底层本就是"Yes 的 Long / Yes 的 Short"，用 Yes/No 表达更贴合二元事件用户心智。
- 保留 `long+short=1` 的双价展示结构，只换列头和按钮文案。
- 底层 type / Supabase 字段 / PnL 公式 / 订单 `side` 一律不动，确保数据与既有逻辑兼容。

## 2. 文案映射表（仅展示层）

| 旧文案 | 新文案 |
|---|---|
| Long / Buy / Long Position | **Yes** |
| Short / Sell / Short Position | **No** |
| Buy Long / Sell Short | **Buy Yes / Buy No** |
| Close Long / Close Short | **Close Yes / Close No** |
| Reduce Long / Reduce Short | **Reduce Yes / Reduce No** |
| Long Price / Short Price | **Yes Price / No Price** |
| Long Order / Short Order | **Yes Order / No Order** |
| LONG / SHORT（审计徽章） | **YES / NO** |
| Longs pay Shorts | **Yes pays No** |
| Shorts pay Longs | **No pays Yes** |
| B / S（订单簿角标） | **Y / N**（颜色 green/red 不变） |

颜色映射不变：Yes = `trading-green`，No = `trading-red`。

## 3. 改造范围（A 类：必须改）

### 3.1 文案字典 / Intent 工具

- `src/lib/tradingTerms.ts` — `LONG: "Yes"`、`SHORT: "No"`、`BUY: "Yes"`、`SELL: "No"`；新增 `sideLabel(side)` 与 `orderSideLabel(orderSide)` helper，所有展示层均通过这两个 helper 取值。
- `src/lib/positionIntent.ts` — `getIntentLabel` 输出 `Buy Yes / Buy No / Close Yes / Reduce No` 等组合。

### 3.2 交易界面

- `TradeForm.tsx`、`DesktopTradeForm.tsx`、`OrderPreview.tsx` — Yes/No 切换按钮、CTA `Buy Yes / Buy No`、价格行 `Yes Price / No Price`。
- `OrderBook.tsx`、`DesktopOrderBook.tsx` — 列头与 buy/sell ratio 角标 `Y / N`（颜色不变）。

### 3.3 持仓 / 结算 / 分享

- `PositionCard.tsx`、`DesktopPositionsPanel.tsx`、`OrderCard.tsx`、`AirdropPositionCard.tsx`、`Portfolio.tsx`、`PortfolioAirdrops.tsx`、`SettlementDetail.tsx` — Side 列、Action 列、过滤器全部 Yes/No。
- `positions/ClosePositionForm.tsx`、`ClosePositionDialog.tsx`、`ClosePositionDrawer.tsx`、`PositionDetailContent.tsx` — 标题、Action 描述、按钮。
- `settlement/SettlementShareCard.tsx`、`share/SettlementPoster.tsx` — 分享卡片方向标签。

### 3.4 事件列表 / 首页

- `EventCard.tsx`、`events/MarketListView.tsx`、`home/HomeDiscover.tsx`、`home/feed/cards/PositionAlertCard.tsx`、`BinaryEventHint.tsx` — 价格列 tooltip、教育性提示文案。
- BinaryEventHint 说明文案改为：*"All positions on a binary event are displayed under the Yes outcome… P&L is always measured against Yes price moves."*

### 3.5 审计 / 透明度

- `useTradeVerification.ts`、`useLiquidationAudit.ts` — 把合约枚举（0/1 或 buy/sell）映射为 YES/NO 用于用户可见审计日志。
- `transparency/TradeVerification.tsx` — 链上交易验证徽章 `t.side === "buy" ? "YES" : "NO"`。
- `transparency/FundingRateAudit.tsx` — Position side 徽章、`Yes pays No / No pays Yes` 资金费方向描述。
- `pages/TradingCharts.tsx` — 图表上 side 标签。
- `services/tradingService.ts` — 用户可见的 toast / log 字符串。

### 3.6 Style Guide / Playground

- `StyleGuide.tsx` + `StyleGuide/sections/*`（Common UI / Forms / Trading / Transparency / MobileHome）— 所有 demo mock 数据。
- `CampaignStyleGuide/Playground.tsx` — 卡片标签 `Long → Yes`。

### 3.7 法律 / 术语

- `data/glossaryTerms.ts` — Glossary 词条改为 `Yes (Long)` / `No (Short)` 双标，SEO anchor ID 保留。
- `pages/TermsOfServicePage.tsx` — 用户可见操作描述更新；法律映射条款保留 Long/Short 解释性文字（见 §4）。

### 3.8 样式 token

- `src/index.css` — 同步注释里指向 trading-green/trading-red 的 Yes/No 用途说明。

## 4. 保留 Long/Short 的位置（B 类：明确不动）

| 位置 | 原因 |
|---|---|
| `src/components/hedge/HedgeLiveExample.tsx`、`HedgeKeyRules.tsx`、`HedgeSocialProof.tsx` | Hedge 落地页讲"Polymarket 多头 ↔ OmenX 空头"的对冲叙事，强行改 Yes/No 会让对照逻辑读不通 |
| `src/data/glossaryTerms.ts` 教学映射条目 | 教育用户底层语义需要保留双标 |
| `src/pages/TermsOfServicePage.tsx` 法律映射段 | 法律文档需保留术语对照说明 |
| `src/components/withdraw/SellToFiat.tsx` "Sell USDC" | 指法币卖出，与交易方向无关 |
| `OrderBook.tsx` 内代码注释 | 不影响 UI |

## 5. 底层不变项（C 类：禁止动）

以下属于数据模型 / 业务逻辑，**研发实现时必须保留**：

- TS 类型 `side: 'long' | 'short'`、`order.side: 'buy' | 'sell'`。
- Supabase `positions.side`、`orders.side`、`trades.side` 列值。
- `tradingTerms.ts` 内部 enum、`positionIntent.ts` 规范化逻辑。
- `orderUtils.ts`、`stores/*`、`hooks/*` 的底层字段访问。
- PnL 公式 `pricePnl = (mark − entry) × size × side`（详见 `mem://technical/pnl-formula-canonical`）。
- 双价结构 `noPrice = 1 − yesPrice`。

## 6. Style Guide 参考

- `/style-guide` Trading section — Yes/No 按钮配色与 CTA 文案对照。
- `/style-guide` Common UI section — Position card、Order card 的 Side badge。
- `mem://design/yes-no-terminology` — 渲染层映射规则记忆。

## 7. 涉及文件

**前端（约 37 个）**
- `src/lib/tradingTerms.ts`、`src/lib/positionIntent.ts`、`src/lib/orderUtils.ts`
- `src/components/TradeForm.tsx`、`DesktopTradeForm.tsx`、`OrderBook.tsx`、`DesktopOrderBook.tsx`、`EventCard.tsx`、`OrderCard.tsx`、`PositionCard.tsx`、`DesktopPositionsPanel.tsx`、`AirdropPositionCard.tsx`、`BinaryEventHint.tsx`
- `src/components/events/MarketListView.tsx`
- `src/components/home/HomeDiscover.tsx`、`home/feed/cards/PositionAlertCard.tsx`
- `src/components/positions/ClosePositionDialog.tsx`、`ClosePositionDrawer.tsx`、`ClosePositionForm.tsx`、`PositionDetailContent.tsx`
- `src/components/settlement/SettlementShareCard.tsx`、`share/SettlementPoster.tsx`
- `src/components/transparency/TradeVerification.tsx`、`FundingRateAudit.tsx`
- `src/pages/DesktopTrading.tsx`、`OrderPreview.tsx`、`Portfolio.tsx`、`PortfolioAirdrops.tsx`、`SettlementDetail.tsx`、`TradingCharts.tsx`、`TermsOfServicePage.tsx`
- `src/pages/StyleGuide.tsx` + `StyleGuide/sections/CommonUISection.tsx`、`FormsSection.tsx`、`TradingSection.tsx`、`TransparencySection.tsx`、`MobileHomeSection.tsx`
- `src/pages/CampaignStyleGuide/Playground.tsx`
- `src/hooks/useLiquidationAudit.ts`、`useTradeVerification.ts`
- `src/services/tradingService.ts`
- `src/data/glossaryTerms.ts`
- `src/index.css`

**记忆**
- `mem://design/yes-no-terminology.md`（新增）
- `mem://index.md` Core 增 Direction labels 规则

## 8. 未变更项

- 所有 TS 类型、Supabase schema、PnL 公式、订单结构、双价生成逻辑。
- 颜色 token、卡片布局、按钮形态。
- 移动端/桌面端整体布局节奏。
- Hedge 落地页（按 §4 B 类规则保留）。
- 充值 / 提现 / 设置 / 钱包等非交易方向页面。
