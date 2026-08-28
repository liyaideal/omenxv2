# 2026-08-28 交付：M2 交易页字典 · SH 晒单 · F/E 系列修复

口径两句话：**样式看生产页，状态看 style-guide**；本文只写这两处都看不到的东西——并账清单、零视觉提取、判定口径与数据来源。

---

## 一、M2 · 交易页状态字典

### 1. 覆盖范围

| 分区 | 编号 | registry key | 落点 |
| --- | --- | --- | --- |
| /trade 合约与多市场 | TR-1 … TR-24 | `trade-tr{n}` | `LiteTradePage` → `TradeStatesSection` |
| /spot 现货轮 | SP-1 … SP-16 | `spot-sp{n}` | `LiteTradePage` → `SpotStatesSection` |
| auto-close 归档 | AC-T1 … AC-T5 | `autoclose-t{n}` | `AutoCloseTradeCases` |

所有 case 双帧（桌面 + 375 移动）渲染，数据一律 fixture 确定性注入，禁运行时 fetch；每 case 连刷 5 次指纹稳定。

### 2. 并账三清单（旧节已删除挂载，条目逐条并入新分区）

1. `LiteSection part="trade"` → 并入 TR-1…TR-8（页头 / crowd bar / chart / settle note）。
2. `LiteSpotSection` → 并入 SP-1…SP-16。
3. 结算态 DDP×7（Settlements · 4B）→ 并入 TR-14…TR-18 与 SP-13…SP-16；Wallet 页不再挂载该节。

### 3. 零视觉变化的组件提取

提取只为让 style-guide 挂生产件、消灭手抄碎屑，DOM 与样式逐元素不变：

- `LiteTradeBlocks.tsx`：`TradeHeading` / `TradeRuleCard` / `TradeMoreMarkets`。
- `SpotHeadBlocks.tsx`：crypto 与 stocks 页头、round switcher、pick card 壳、side rail、buy drawer header；`LiteQuickTrade` 与 `LiteSpotTrade` 改为引用。
- `LiteEventsHeader.tsx`：Events 列表页头。

### 4. fixture-only props（生产不传 = 零变化）

- `LiteContractOrderPanel`：`fixture.boostTrayOpen`、netting / auto-close 注入。
- `LitePositionCard`：`voucherTag`、`airdropTag`。
- 红线：任何 fixture prop 缺省时组件必须与改造前 DOM 完全一致。

---

## 二、SH · Lite 晒单分享

- `LitePnlPoster.tsx`：三态 × 输赢 —— `live` / `cashed` / `settled`。海报严禁出现 Leverage、voucher 等内部概念。
- `LiteShareFlow.tsx`：`ShareModal` + 海报的薄封装，**仅登录态可用**，游客 demo 仓位永不出分享卡。
- 自动弹：`LiteCashOutFlow` 平仓成功后自动打开分享流；全量平仓会卸载该 flow，故快照上抛由页面级 `LiteCashOutShareCard` 承载。
- 四入口：`LitePositionCard`（28px ghost Share2）、`LiteOutcomeCard`（仅 holding 分支的文字按钮）、Portfolio LiveRow / LiveCard（icon）、`LiteSettlementDetail`（桌面按钮 / 移动 icon）。四处均为 `onShare?` 可选 prop，不传 = 生产零变化。
- style-guide：SH-1 … SH-8（海报六态 + 弹窗 + 入口样张），海报出图口径固定 400px。
- `LitePositionCard` compact 态改 `grid-cols-2`（2×2）。

---

## 三、F3 · sports fixture 持仓三根因 + 事件命名

- 事件命名全库统一 `A vs B`（DB 已改名；本轮补掉组件拼接尾巴，见第七节）。
- `useLitePortfolio.ts` 正确读取 sports line 元数据（`market_type` / `line` / `fixture_id`），深链回市场。
- `LiteContractTrade` 用 `optionSideWord` 判定自定义 label 的方向，修掉 handicap / total 行的 side 误判。

---

## 四、E1 / E1b · win / lose 一律看净额符号（全站铁律）

- Wallet 流水、Portfolio、Settlement 详情的输赢文案与配色**一律由净额 P&L 符号推导**，不再看交易类型。
- E1b 补丁：`trade_profit` / `trade_loss` 两类型的行内小图标与圈底同样跟净额符号——`amount >= 0` → TrendingUp · trading-green；`amount < 0` → TrendingDown · trading-red。其余类型图标不变。

## 五、E4 · `fiat_buy` 进 Lite 流水

`fiat_buy` 不再被过滤，按 deposit 同款样式渲染（style-guide W-17）。

## 六、E3 · 类别映射补全

`categoryUtils.ts` 补 `stocks → Finance`、`macro → Macro`。

## 七、F1 / F2 / F3b · 清扫

- 旧版列表页下线：裸 `/spot` 重定向落到市场列表 `/`。
- `IntradayStageCard` 的 "Art slot 1" 占位注记清除。
- settled 空账本口径：已结算且无成交记录的市场，`LiteContractTrade` / `LiteSpotTrade` 不渲染 `MarketActivity` 模块。
- F3b：组件拼接处的 `" v "` 尾巴统一为 `" vs "`——`SportsStageCard`、`LiteSportsView`、style-guide `eventsPreviews` fixture 三处；只改拼接字面量。

## 八、实时 PnL 单一真相源

所有未结算仓位展示（交易页、Portfolio、分享海报）统一走 `useRealtimePositionsPnL`，不再各自算一份。

---

## 取证目录清理

`public/qa-sg-wallet-audit-0827/`、`public/qa-sg-events-0828/`、`public/qa-sg-trade-0828/`、`public/qa-share-0828/` 已删除（CPO 已签字）。
