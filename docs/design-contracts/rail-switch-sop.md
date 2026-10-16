# Rail-switch SOP · event 现货 ↔ 合约切换怎么切才不丢东西

> 2026-10-16 · CPO 拍板。起因：10-09 加密快轮从现货轨搬到合约轨（§Addendum 2026-10-09 第 9 条）后，Pro `/trade` 的 `BTC price` 视图、Base 参考线和价格块副标题一起消失——不是漏传一个 prop，是业务层当时长在现货专属 hook 里，合约页没有通道拿到。本 SOP 把两层拆开，以后任何 event 切 rail 按清单走。

## 1 · 三条正交轴

| 轴 | 取值 | 决定什么 | 谁拥有 |
|---|---|---|---|
| **Surface** | Lite / Pro | 页面家族、措辞禁令、header 归属 | `SurfaceContext` |
| **Rail（产品层）** | Spot / Contract | 怎么交易这个东西 | `product_lines` |
| **Business（业务层）** | crypto 快轮 / 美股日线 / 体育 / 政治 … | 这个东西是什么 | `event_subtype` + id 形状 |

切任何一条轴，只许动那条轴拥有的东西。

## 2 · 产品层清单（切 rail 时**替换**）

| 元素 | Spot | Contract |
|---|---|---|
| 右侧下单栏 | `ProSpotPanel`（Buy / Sell · Shares · Proceeds） | `ProContractPanel`（Long/Short · Margin · Boost 档） |
| 账户 | Standard | Boost（Lite）/ 保证金账户（Pro） |
| 杠杆 | 无 | 1–10×，`category_boost_configs` 封顶 |
| 价格源开关 | 无 | `Last \| Mark`（`CandlestickChart priceSource`）+ 价格块 ⚑ mark |
| 持仓语义 | 份额 | 带符号净仓、auto-close、强平 |
| 费用行 | Proceeds / Est. commission | Trading Fee / WC / To win |
| 结算函数 | `settle_spot_event` | `settle_quick_contract_round` 等 |
| 路由 | `/spot` | `/trade`（`useQuickRailRedirect` 负责旧链接） |

## 3 · 业务层清单（切 rail 时**逐项保留**）

全部出自 `useEventBusinessMeta`（`src/hooks/useEventBusinessMeta.ts`）。

| 元素 | 字段 | 谁该有 |
|---|---|---|
| 标的 K 线视图 `Up \| {ticker} price` | `underlying` → `CandlestickChart underlying` | 价格参照型（crypto / stock），不分 rail |
| Base / Open 参考线 + 右轴标签 | `underlying.basePrice` / `baseWord` | 同上 |
| 价格块副标题 `Base $X ⓘ · as of …` / `Open $X ⓘ · 起–止` | `BaseSubline`（`baseWord` / `timeClause` / `settleRule`） | 同上；桌面两个 Pro 终端同一组件 |
| 移动 32px stats strip | `SpotMobileStatsStrip t={meta}` | 同上；`/spot` 与 `/trade` 同一原件 |
| 移动倒计时行时间子句 + ⓘ `· 15:30–15:45 ⓘ` / `· Base Fri 04:00 ⓘ` | `ScheduleInfo m={meta}`（`mobileClause` / `baseLine` / `settleRule` / `schedule`） | 同上；`/trade` 由 `MobileTradingLayout` 自动挂，`/spot` 经 `SpotScheduleInfo` |
| 页头实时价胶囊 `{TICKER} $x` | `indicative` / `indicativePct` | 桌面 `/trade` 页头；`/spot` 页头 `ProSpotHeader` |
| session 徽标 PRE / AH | `sessionTag` | stock |
| Up / Down 词 | `yesLabel` / `noLabel` | 价格参照型 |
| 默认周期 | `defaultTimeframe` → `CandlestickChart initialTimeframe` | 快轮 |
| 记分牌 / live 位 | `fixtureMarkets` | sports（不在本 hook，另一条业务线） |

## 4 · 四格矩阵（图表工具栏右侧）

| | 价格参照型 | 非价格型 |
|---|---|---|
| **Spot** | `[Up \| BTC price]` + 副标题 | 无 |
| **Contract** | `[Last \| Mark]` + `[Up \| BTC price]` + ⚑ + 副标题 | `[Last \| Mark]` |

标的视图下 `Last \| Mark` 置灰不可点（opacity-40 + pointer-events-none）。

## 5 · 切换检查单（每次 event 切 rail 必走）

1. **业务类型不变**：rail 切换不改 `event_subtype` / `base_price` / `start_date` / `end_date` / id 形状。
2. **替换产品层**：按 §2 逐行换面板 / 账户 / 价格源 / 结算函数 / 路由。
3. **保留业务层**：按 §3 逐行勾——新 rail 的页面是否把 `useEventBusinessMeta` 的每个字段都接上（桌面 `BaseSubline` + `underlying`；移动 strip + 倒计时行 `ScheduleInfo` + `underlying`；页头胶囊）。
4. **四格核对**：目标格的工具栏按 §4 长什么样，截图对照。
5. **style-guide**：目标格有新状态就加 case（Pro Spot 节 CH-D1…D5 / CH-M1…M3 是现成坐标），`npm run sg:audit` 过。
6. **alex_carter 演示数据**：新 rail 上至少一张持仓 + 一张已结算历史。
7. **验收**：逻辑取证（DOM 五个探针：`[data-base-subline]` / `[aria-label="Chart view"]` / `[aria-label="Price source"]` / `[data-spot-stats-strip]` / `[data-schedule-info]`）+ 设计师帽子视觉验收（桌面 1440 + 移动 375），两个 Pro 终端 + Lite 对等页都看。

## 6 · 禁止

- 在任一终端页面里自己拼 ticker / base / 前收时间 / round 窗口——只许从 hook 取。
- 给 `useEventBusinessMeta` 加产品层字段（杠杆、mark、费用）。
- 隐藏而不是置灰 `Last \| Mark`。
- 副标题写无时钟的日期或 `flat = Down`。

## 7 · 坐标

`src/hooks/useEventBusinessMeta.ts` · `src/components/pro/BaseSubline.tsx` · `src/components/pro/ContractPriceBlock.tsx` · `src/components/pro/ScheduleInfo.tsx` · `src/components/MobileTradingLayout.tsx`（`scheduleTail`） · `src/components/pro/ProSpotShared.tsx`（`SpotMobileStatsStrip` / `StatsStripSource`）· `src/components/CandlestickChart.tsx`（`underlying.baseWord` / `initialTimeframe` / 置灰）· `src/pages/DesktopTrading.tsx` · `src/pages/TradingCharts.tsx` · `src/pages/SpotTrading.tsx` · `src/hooks/useSpotTerminal.ts`（`business`）· `src/hooks/useEvents.ts`（`isUpDownPriceEventId` 守卫）· DESIGN.md §Addendum 2026-10-16 · `docs/copy-dictionary.md`「Chart price-block subline」。
