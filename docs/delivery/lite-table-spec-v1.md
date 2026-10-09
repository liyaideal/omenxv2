# 加密快轮「上桌下单」（Table）— 交付说明 v1

日期：2026-10-09 · 范围：Lite 下 `/spot` 的 5m / 15m 加密快轮页（桌面）· 决策：Liya（CPO）2026-10-09 拍板 · Lovable commit `13b9a2f9`（页面）/ `7f289be4`（字典）· 状态：**内测（发布开关关着，外部用户无变化）**

## 通俗导读

5m / 15m 的猜涨跌，用户要的是节奏和刺激，不是一张图表加一个表单。这轮把这两个周期的下单页整个换成**百家乐桌式的交互**：把筹码拖到 UP 或 DOWN 上就下单了，桌面上能看到过去几十局的走势（路单），一根梯子实时显示价格离开盘价多远，右下角一眼看到这局拿了多少、赢了能拿多少。

核心规则一句话：**下单形态跟着周期走**。5m / 15m 只有这种「桌」，1h / 4h / 1D 还是原来的页面（Classic）。没有「切换模式」的开关——两拨用户、两种形态，互不打扰。Lite / Pro 的开关、`/spot` 路由、Pro 终端、美股页全都没动。

页面按用户的阅读顺序分四行：

1. **看历史**（顶部）：珠盘 + 大路，就是过去 36 局和连涨连跌的走势，鼠标悬停显示那一局的时间段。
2. **看现在**（中间）：左边是本轮价格线（中性白色，开盘线横贯），中间一根 140px 的梯子，亮点随价格上下走，底下是倒计时环和收盘时间。
3. **做决定**（右列）：上 UP、下 DOWN，中间夹着筹码盘（10 / 25 / 50 / 100 / 500）和 Boost（1 / 2 / 5 / 10，默认 2）。拖筹码上去 = UP，拖下去 = DOWN；也可以先点筹码再点格子。
4. **看结果**（底部）：这一局持仓、实时盈亏、今天合计，右侧 Share 和 Cash out。

下单的手感：筹码落下去先转 1.5 秒（期间点一下能撤回），然后自动成交——**没有 Confirm 按钮**。一局只有一个仓，但反方向不拦：持有 Up 时把筹码放到 DOWN 就是「翻面」——先把 Up 全部市价平掉（钱回 Boost 账户），再用这枚筹码开 Down；待发那 1.5 秒里 DOWN 格会写清「closes your Up ($X back) · then $50×2 on Down」。每枚筹码可以带不同 Boost，同一边合并成一个仓；结算那几秒落的筹码排到下一局开盘成交。加密轮没有封盘秒数（代码已核）。

### 易混点辨析

1. **Table 不是第三个 surface**。Lite / Pro 切的是「信息密度」，所有市场都有两面；Table 是加密快轮 5m / 15m 这一种市场的专属下单形态。所以它不在 Lite / Pro 开关里，也不是用户可切的选项。
2. **快轮改成合约了（同日第二项决定）**：线上快轮本来就是合约；Lovable 原来走现货（没有杠杆）。这轮把加密快轮整个品类（5 档周期一起）切到合约轨：滚轮 job 开轮写 `product_lines = ['contract']`，结算用新函数 `settle_quick_contract_round`（保证金 + 盈亏、亏损封顶保证金、5% 赢单佣金、入 Boost 账户；**只认本轮的 option_id**，因为快轮每一轮同名）。切换前开的现货轮由旧函数结完。Table 落筹就是普通合约市价单（`executeTrade`，杠杆 = Boost），不再有任何现货补丁。
3. **快轮搬家到 `/trade`**：品类变了，Lite 路径跟着变——`/spot?event=crypto-…` 的旧链接（海报、持仓卡、书签）会自动跳到 `/trade?event=…`。Classic 快轮页长相不变（周期 tab + 轮次胶片 + 结算线图），只有下单区从现货面板换成 Boost 面板（档位由 crypto 品类配置决定，上限 10×，可自定义）。Pro 下快轮进 `/trade` 终端。盘中强平沿用合约路径的 auto-close 口径。
4. **价格线故意不上色**：之前比稿里图表只在一边有价格线会被读成「UP 的线」。现在线是白的，涨跌只靠面积渐变、末端光点和梯子亮点表达。
5. **梯子量程是动态的**：开局按币价的 0.06% 定（BTC 约 ±$40），价格走到量程 80% 外就跳到下一档，同一局只放大不缩小，新一局重置。小币（< $1）刻度改百分比，价格用 `$0.0₄1234` 这种下标零写法。
6. **「今天」统计**按 UTC 零点切，取该币种已结算的现货仓（同一个事件名跨轮次）。

### 用户视角

看到（内测账号）：`/spot?event=crypto-btc-updown-5m-…` 变成四行的桌；币种下拉（BTC / ETH / SOL，列表超过 5 个才出搜索框）；周期 tab 只有 5m / 15m；顶栏与页脚照旧。
看不到：任何「模式切换」按钮；1h 以上周期的页面变化；移动端变化（5m / 15m 在手机上仍是 Classic）；外部用户在开关打开前看到的任何变化。

## 0. 读者须知

- 长什么样 → 生产（内测）：登录 `alex_carter`，或任意页面 URL 后加 `?table=1`，打开任一 BTC / ETH / SOL 的 5m 或 15m 轮。
- 什么时候变成什么样 → `/style-guide` → **Lite** 组 **交易页** 节点 → **Table（TB-1 … TB-6）**，桌面帧。
- 字段名、文案 → `docs/copy-dictionary.md`「Intraday rounds › Table」（全部占位，待合规措辞轮）。
- 设计法则 → `DESIGN.md` §Addendum 2026-10-09。
- Lovable / 正式版边界 → 本文 §5。

### 0.1 字典怎么看

- 网址：https://omenxv2.lovable.app/style-guide
- 节点：左栏 **Lite** → `交易页 ✅` → 页内目录到 **Table（TB-1 … TB-6）**。只有 Desktop 帧（移动版另起一轮）。
- 一张样张怎么读：TB-1 路单读法与 hover 时间窗；TB-2 / 2b 舞台图涨跌态与开奖帧；TB-3 梯子三态（$ 量程 / 跳档 + Closing / % 单位 + Settling）；TB-4 UP / DOWN 格八态；TB-5 托盘与筹码件；TB-6 结果行三态。
- 单张预览：`/style-guide/preview?c=table-tb1` … `table-tb6`（`table-tb2b` 为开奖帧）。

## 1. 行为规则（CPO 已批）

| # | 规则 | 落点 |
|---|---|---|
| 1 | `5m / 15m`（未来 `1m`）→ 只有 Table；`1h / 4h / 1d` → 只有 Classic；无用户开关 | `tableMode.ts` `TABLE_TIMEFRAMES`；`LiteQuickTrade.tsx` 顶部分叉 |
| 2 | 插入点 = `LiteQuickTrade` 内部按 tf 分叉；`/spot` 路由、Lite/Pro、美股页、Pro 终端不动 | 同上 |
| 3 | Pro 不变：Pro 下 5m/15m 仍是 CLOB 终端 | `App.tsx SpotRoute` 未改 |
| 4 | 发布开关 ≠ 用户开关：`TABLE_PUBLIC=false` 时仅 `?table=1` / 白名单（`alex_carter`）可见 | `tableMode.ts` |
| 5 | 移动端分开翻：桌面先；`isMobile` 一律 Classic | 分叉条件含 `!isMobile` |
| 6 | 数据层：不新建表；落筹 = 合约市价单（`executeTrade`，leverage = Boost，Boost 账户）；1.5s 待发纯前端；路单读已结算轮次 | `tableQuote` / `useTableOrders` / `useQuickRounds.historyFor` |
| 7 | Table 内周期选择器只列 5m / 15m；1h 以上入口在事件列表 | `LiteQuickTable` 头部 |
| 8 | 文案占位 | `copy-dictionary.md` |
| 9 | 梯子量程：开局 0.06% 取档；超 80% 跳 ×1.25 档；同局只扩不缩；新局重置 | `tableMath.initialLadderRange / nextLadderRange` |
| 10 | 价格格式：≥ $1 两位小数；< $1 下标零 4 位有效；< $1 梯子与偏离改 % | `formatPrice.ts` |
| 11 | 币种选择 = 下拉（> 5 出搜索）；周期 tab 平铺 | `CoinSelect.tsx` |
| 12 | 题目旁小字 = 本轮时间窗 · 成交量；不显示轮号 | `LiteQuickTable` 头部 |

## 2. 模块对照（Classic → Table）

| Classic 模块 | Table 里 | 处置 |
|---|---|---|
| SpotCryptoHead（币 / 24h / vol） | 题目 + 小字（时间窗 · vol）+ 币种下拉 | 换形态 |
| SpotRoundSwitcher 周期 | 头部 5m / 15m tab | 只列两档 |
| RoundTape 近 10 轮 + 倒计时 + NEXT | 路单（珠盘 + 大路）+ 倒计时环 | 换形态 |
| LiteStockChart | 舞台图 + 梯子 | 换形态 |
| SpotSentimentBar | 图上 `market 62% Up` | 压缩 |
| SpotPickCard + LiteOrderPanel | UP / DOWN 格 + 筹码×Boost 托盘 | 换形态 |
| SpotSettlementRail | 倒计时环 + OPEN 胶囊 + `closes HH:MM UTC` | 压缩 |
| SpotYourPosition | ④ 结果行 | 换形态 |
| LiteCashOutFlow | ④ Cash out 按钮 → 同一 flow（自定义 onConfirmCashOut） | 复用 |
| 分享海报（Manual / CashOut） | ④ Share · 开奖帧 `Share this win` | 复用 |
| AuthDialog | 未登录落筹弹出；登录后自动放下那枚筹码 | 复用 |
| RuleCard | 题目旁 ⓘ title | 压缩 |
| LiteMarketActivity | 不要（后续可做「桌上有 $X」） | 删 |
| Also live now / Max / Watch star | 不要 | 删 |
| EventsDesktopHeader / SeoFooter | 原件照挂 | 复用 |

## 3. 文件清单

新增：`src/components/lite/table/{tableMath,useTableOrders,TableChip,TableRoads,TableStage,TableLadder,TableSide,TableTray,TableResult,CoinSelect}`、`src/pages/lite/LiteQuickTable.tsx`、`src/lib/tableMode.ts`、`src/lib/formatPrice.ts`、`src/components/lite/table/tableQuote.ts`、`src/components/lite/intraday/useQuickRailRedirect.ts`、`supabase/migrations/20261009180000_quick_rounds_contract.sql`、`src/pages/StyleGuide/{preview/tablePreviews.tsx,sections/TableStatesSection.tsx}`。
修改：`src/pages/lite/LiteQuickTrade.tsx`（顶部分叉包装 + 合约轨：面板按轮次 rail 切换 `LiteContractOrderPanel` / `LiteOrderPanel`，`/spot` 上的合约轮跳 `/trade`）、`src/App.tsx`（`/trade` Lite 下快轮 id 渲染快轮页；`/spot` 先过 `useQuickRailRedirect`）、`src/components/lite/intraday/intradayData.ts`（`QuickEvent.rail`）、style-guide 注册三处、`DESIGN.md`、`docs/copy-dictionary.md`。

## 4. 验证方法

1. 不带 `?table=1`、非白名单账号打开 5m 轮 → 与今天完全一致（Classic）。
2. 加 `?table=1` 打开 BTC 5m → 四行桌；切 15m / 切币种均落到该币种该周期的当前轮；1h 以上周期不在 tab 里。
3. 未登录拖筹码到 UP → 弹登录；登录后那枚筹码自动放下、1.5s 后成交，toast 写明赢多少。
4. 已持 UP 时 DOWN 格 70% 透明、副行提示翻面；放一枚筹码到 DOWN → 待发 1.5s（可撤）→ Up 全额平掉、Down 开仓，toast 带 `Flipped · Up closed ±$X`；同边再放一枚不同 Boost 的筹码 → 合并成一仓，结果行 `boosts` 显示 `2/5×`。
5. 倒计时归零 → 梯子提示 Settling、Cash out 禁用；此时落筹 → 排队（虚线筹码）；新轮开盘自动成交并 toast `filled at the open`。
6. 轮次滚动 → 开奖帧 2.6s；有仓且赢 → `Share this win` 出海报。
7. 持仓中点 Cash out → 现有合约 cash-out 流程；确认后 Boost 账户回「保证金 + 盈亏 − 5% wc」。
9. 旧链接 `/spot?event=crypto-…` → 自动到 `/trade?event=…`；1h 以上周期在 `/trade` 上是 Classic 快轮页 + Boost 面板。
8. `/style-guide` 交易页 → Table 六张样张全部有图；`npm run sg:audit` 绿。

## 5. Lovable / 正式版边界与待办

- **后端（已批，Lovable 数据库接口恢复后执行）**：migration `20261009180000_quick_rounds_contract.sql`（新结算函数 + 滚轮 job 改合约 + 未结轮次翻 `['contract']`）；`category_boost_configs` crypto `max_leverage = 10`（D4）。
- 正式版：快轮本来就是合约，Boost = 杠杆，盘中强平、保证金、ADL 由风控引擎负责；本文只定交互与展示。
- 下一轮：移动端 Table（抽屉规范）；memecoin / 1m（后端加币种 / 周期即可，前端已备）；合规措辞 + i18n key；下三路 / 问路；「桌上有 $X」热度展示；翻默认（`TABLE_PUBLIC`）看内测数据。

## 附录 · 代号对照

| 代号 | 含义 |
|---|---|
| TB-1 … TB-6 | style-guide Table 节六张样张 |
| H8 | 比稿画布里被选中的排布（动线版 · H2 梯 · 筹码+Boost 在开盘线上） |
| OmenX Table v23 | 独立可玩原型最终版（artifact） |
| Classic | 原加密快轮页（`LiteQuickTradeClassic`） |
| 待发 | 落筹后 1.5s 可撤窗口（`PENDING_MS`） |
| wc | winning commission，V4 赢单 5% |
