# 交易页 Lite / Pro · 现货 / 合约 一体化 — 联合验收单 v1

> 2026-09-17。覆盖 2026-09-09 → 09-17 这一程的全部交付：Surface 开关（SW）、事件选择器（ES）、Pro 合约面板 Buy · Sell（CT）、按数量下单（QO）、Pro 现货（SP）、体育线（SL）、不可下单态（DK）。两人各验一遍，`我` 列是 Claude 的结果，`Liya` 列留给 Liya。全过即交付；任何一行不过 → 记在最后「问题」表，修完再回来打勾。
>
> 验收域：**生产 `omenxv2.lovable.app`**（已 Publish 到 `55b863b0`）。Pro 面需要登录；游客永远 Lite。手机 = 375 宽（Chrome devtools 或真机）。
>
> 图例：✅ 通过 · ❌ 不过（写进问题表）· ➖ 未验 / 不适用。Claude 列里 `✅p` = 在 preview 域用同一构建验过、生产域未登录没法验 Pro。

## A · Surface 开关（SW）

| # | 端 | 打开 | 应该看到 | 看什么 | 我 | Liya |
|---|---|---|---|---|---|---|
| A1 | 桌面 | 游客打开 `/trade?event=demo-prekick-cs2` | Lite 交易页（全站 header），**没有** Lite/Pro 开关 | 游客永远 Lite，开关不出现 | ✅ | |
| A2 | 桌面 | 登录后 `/trade` Lite | 全站 header 头像右侧一枚 `Lite · Pro` pill（26px 高） | pill 是 header 最右一项，贴页边距 | ✅ | |
| A3 | 桌面 | 点 pill 到 Pro | 轻终端 chrome，顶栏 ★ 右侧同尺寸 pill | 两面 pill 同尺寸、同角落（不追求同像素） | ✅ | |
| A4 | 桌面 | hover 任一 pill 的另一面 | Tooltip：`Pro: order book, limit orders, candlestick chart` / `Lite: simple trading view` | 一句话，无"one-tap" | ✅ | |
| A5 | 手机 | 登录后 `/trade` Lite 与 Pro | 底部 dock 最左 `⇄ Lite` / `⇄ Pro` 小方块 | 两面同位置 | ✅ | |
| A6 | 两端 | 切到 Pro 后刷新、换页再回 | 仍是 Pro | `profile.preferred_surface` 记住了 | ✅ | |
| A7 | 两端 | 退出登录 | 回到 Lite | 游客不保留 Pro | ➖ 退出登录会让我丢掉你帮我登的态，留给你验 | |

## B · Lite 面板 → Pro 定价入口（SW-2）

| # | 端 | 打开 | 应该看到 | 看什么 | 我 | Liya |
|---|---|---|---|---|---|---|
| B1 | 桌面 | **新账号**（本设备没进过 Pro）Lite `/trade` 合约，金额空 | CTA 下方一行 `Want to place a limit order? Pro ›` | 只有这一行，没有风险句 | ✅ | |
| B2 | 桌面 | 同上输入 $25 | 那一行变成 `Not guaranteed. You can lose your full $25.` | OR 关系，永不叠两行；清空金额入口回来 | ✅ | |
| B3 | 桌面 | Lite `/spot` 现货，金额空 / $50 | 空 → 入口；$50 → `Buys instantly at the current price (within 0.5%)` | 同 B2 | ✅ | |
| B4 | 桌面 | 点 `Pro ›` | 落到 Pro 终端，下单类型已是 `Limit` | 不是 Market | ✅ | |
| B5 | 手机 | Lite 抽屉点 `Pro ›` | 跳 `/trade/order`（现货 `/spot/order`），类型 `Limit` | 15 秒内落地都算 | ✅ | |
| B6 | 两端 | 进过 Pro 的账号回 Lite | 入口不再出现，只有风险句 | 按账号记，不按设备 | ✅ | |

## C · 事件选择器（ES）

| # | 端 | 打开 | 应该看到 | 看什么 | 我 | Liya |
|---|---|---|---|---|---|---|
| C1 | 桌面 | Pro `/trade` 点标题 | 下拉：顶部 `Standard` / `Boost` 页签，默认 `Boost` | 只列比赛不列让分线；已过期未结算的不列 | ✅ | |
| C2 | 桌面 | 切 `Standard` 选一个 | 跳到 `/spot?event=…` | 跨页签 = 换终端 | ✅ | |
| C3 | 桌面 | 看 `Ends in` 列 | `8m` / `3h 12m` / `2d 14h` / 日期；≤15 分红、≤1 小时黄 | 快轮看得出快到 | ✅ | |
| C4 | 桌面 | 点下拉外面 | 关闭 | | ✅ | |
| C5 | 手机 | Pro `/trade` 点标题 | 底部抽屉 `Select Event`，同两个页签 | | ✅ | |
| C6 | 两端 | Pro 现货页头 | **没有** `SPOT` 标 | 终端 header 不放产品 badge | ✅ | |

## D · Pro 合约面板 Buy · Sell + 按数量（CT / QO）

| # | 端 | 打开 | 应该看到 | 看什么 | 我 | Liya |
|---|---|---|---|---|---|---|
| D1 | 桌面 | Pro `/trade` 面板 | 顶部 `Buy · Sell` 文字页签 + `Market ▾` | 与现货同一套 | ✅ | |
| D2 | 桌面 | Buy · Amount 后缀 | `USDC ▾` 可切 `Contracts ▾`；切换后数值换算不清空 | 摘要多一行 `Contracts` | ✅ | |
| D3 | 桌面 | Sell 页签、空仓 | 两侧禁用 `0 contracts`，CTA 禁用 | 永不反向开仓 | ✅ | |
| D4 | 桌面 | Sell 页签、有仓位 · Market | 摘要 `Close price (mark) / Contracts / Released margin / Realized PnL est. / Est. commission / You receive`，确认后仓位减少 | 只减仓 | ✅ | |
| D5 | 手机 | `/trade/order` Buy / Sell | 同 D1–D4；市价平仓弹 `ClosePositionDialog`，限价走 `/order-preview` | | ✅ | |
| D6 | 两端 | 单位词 | `contracts` / `shares` 全词，无缩写；`To win ⓘ` | | ✅ | |

## E · Pro 现货（SP）

| # | 端 | 打开 | 应该看到 | 看什么 | 我 | Liya |
|---|---|---|---|---|---|---|
| E1 | 桌面 | Pro `/spot?event=<现货事件>` | 图表块 = mark + session 涨跌 + Base 行；面板 `Buy · Sell` + `Market/Limit` | Limit 价格默认到分 | ✅ | |
| E2 | 桌面 | 挂一张不可成交限价 | Pending + 预留资金；撤单退款 | | ⚠️ 见问题 1、2 | |
| E3 | 桌面 | 底部 tab | `Holdings` 列 `Shares · Avg price · Price · Value · PnL`；`Payout by ~{time}` | | ✅ | |
| E4 | 手机 | `/spot` 图表页 → dock 两次点 | 第一次选边（描边 + 箭头），第二次跳 `/spot/order` | | ✅ | |
| E5 | 两端 | 账户卡 | `Standard Account`（合约页 `Boost Account`）；余额旁 ⇄ 划转 | | ✅ | |

## F · 体育线（SL-P）

| # | 端 | 打开 | 应该看到 | 看什么 | 我 | Liya |
|---|---|---|---|---|---|---|
| F1 | 桌面 | Pro `/trade?event=demo-prekick-cs2` | header 下一行 `MARKETS`：Winner · Handicap · Total maps · Map 1 · Map 2 · Map 3 | 芯片 = 组名 + 当前线 + Yes 侧价；副行 `Match winner` | ✅ | |
| F2 | 桌面 | 点 `Map 1` | 下拉三节：Map 1 winner / Rounds handicap / Total rounds，每行两侧价 | 菜单贴芯片正下方 | ✅ | |
| F3 | 桌面 | 选 `AST −3.5 / HER +3.5` | 整个终端切线，URL `?event=demo-prekick-cs2&line=demo-prekick-cs2-m1-rhcp-m3p5`；副行 `Map 1 · Rounds handicap · AST −3.5` | 切换钮 AST −3.5 ≈ 0.22 / HER +3.5 ≈ 0.78，CTA `Buy AST −3.5`，图表价 = 芯片价 | ✅ | |
| F4 | 桌面 | 直接打开 `/trade?event=demo-prekick-cs2-maphcp-m1p5` | 正常加载并归一 URL | 不再 "Event Has Ended" | ✅ | |
| F5 | 桌面 | `/trade?event=sp-ucl-mci-int`（曼城 vs 国米） | Winner · Handicap · Total goals；点 Winner → 主 / 平 / 客三行单价；选 Draw → 芯片 `Draw · xx¢`、CTA `Buy Draw` | 三选一可达 | ✅ | |
| F6 | 手机 | `/trade?event=demo-prekick-cs2&line=demo-prekick-cs2-m1-rhcp-m3p5` | 副行 + 横滑芯片行；`Mark Price` 旁标 `AST −3.5`；dock `AST −3.5 →` / `HER +3.5` | 不再 Yes/No | ✅ | |
| F7 | 手机 | 同上切 Trade 页签 | line 不丢；两钮 `AST −3.5 0.22xx` / `HER +3.5 0.77xx`；CTA `Buy AST −3.5` | | ✅ | |
| F8 | 桌面 | 持仓 HoverCard `Go to this event`（sibling 上的仓位） | 落到 `?event=<fixture>&line=<sibling>`，持仓行两侧名是 `AST −1.5` 不是 `Yes` | | ⚠️ 两侧名 ✅；`Go to this event` 不跳转，见问题 3 | |
| F9 | 桌面 | 事件选择器 | 只列比赛，不列让分线 | | ✅ | |

## G · 不可下单态（DK-1）

| # | 端 | 打开 | 应该看到 | 看什么 | 我 | Liya |
|---|---|---|---|---|---|---|
| G1 | 手机 | Pro `/trade?event=fed-decision-sept-2026`（已到期未结算） | dock = `⇄ Lite` + 一条灰色 `Closed` 条；无 Yes/No 钮；右上角 `tap again to trade` 没了；`Available` 行在 | 条点不动 | ✅ | |
| G2 | 手机 | `/trade/order?event=fed-decision-sept-2026` | Buy CTA `Closed · To win $0` 置灰；Sell 页签 CTA `Closed · You receive $0.00` 置灰 | | ✅ | |
| G3 | 桌面 | `/trade?event=fed-decision-sept-2026` | 面板 CTA `Closed` 置灰，点不出预览 | | ✅ | |
| G4 | 手机 | 活的事件 `/trade?event=demo-prekick-cs2` | dock 正常两钮 + 提示句 | 没被误伤 | ✅ | |
| G5 | 手机 | `/spot` 到冻结时 | 同一条灰条 `Market frozen`，**不再印两遍** | 需要等一个真冻结窗口 | ➖ | |

## H · 字典（/style-guide）

| # | 打开 | 应该看到 | 我 | Liya |
|---|---|---|---|---|
| H1 | `/style-guide` →「Pro — 交易终端」 | ES-D1…D4 / ES-M1、CT-M1…M7、SP-B1b / SP-M4b / SP-M5、SL-D1…D4 / SL-M1…M2、DK-M1 / DK-M2 全部挂生产组件 | ✅ | |
| H2 | 「Lite 交易状态」 | TR-27 / TR-27b、SP-19 / SP-19b（定价入口 OR 两态） | ✅ | |
| H3 | 「Foundations」 | SS-1…SS-6 开关六态 | ✅ | |

## 已知缺口（不阻塞交付，已列入下一轮）

1. 桌面 `/trade` 面板仍是 `DesktopTrading.tsx` 内联 JSX，字典挂不上（CT-D / DK-D 卡缺）。下一轮 `ProContractPanel` 提取（纯重构、行为不变）后补。
2. HK / KR 事件 session 仍按纽约时钟。
3. `mock24hVolume` 对 crypto 快轮全算出 $803K。
4. 引擎：Buy 页签买反向触发的自动减仓不扣 WC（QA 已记）。

## 问题（验收中发现的）

| # | 行号 | 谁发现 | 现象 | 处理 |
|---|---|---|---|---|
| 1 | E2 | Claude（生产，alex_carter） | 挂 Limit 后 `Current Orders` 行 Reserved `$10.00` 正确，但账户卡 `In orders` 一直 `$0.00`。原因：`useSpotTerminal.reservedInOrders` 对 `o.price`（`"$0.1000"`）直接 `parseFloat` → 0 | 待修：改用行里同一个 `total`（去 `$` 再算） |
| 3 | F8 | Claude（生产） | 持仓表 HoverCard 里的 `Go to this event` 是 `href="#"` + `preventDefault`，点了不跳（挂单表那一个是好的）。SL-P 之前就如此 | 待修：接挂单表同一个 `goToEvent`（按 event 名在 events/siblings 里找） |
| 4 | D6 | Claude（生产） | 桌面 `/trade` 持仓表列头 `Qty` / `Liq. Price` 是缩写（面板内单位词已全词）；手机 `/trade/order` 合约 Winner 事件 CTA `Buy AST` 用 option label，切换钮用 side_labels `Astralis`——两处口径不一，`demo-prekick-cs2` 的 side_labels（Astralis/Heroic）与 option label（AST/HER）本来就不同 | 不阻塞；要不要改列头、CTA 是否统一读 side_labels，等 Liya 定 |
| 2 | E2 | Claude（生产） | 挂单只扣了 notional `$10.00`（`deductSpotBalance(price × qty)`），撤单却退 `amount + fee = $10.02`；成交时"从预留里消费手续费"实际没预留过 → 用户每张限价单少付一次手续费、撤单多退 `$0.02` | 待修：下单扣 `res.reservedAmount`（notional + fee）与 service 口径对齐 |

## 进度（2026-09-18 生产域联合验收，Claude 侧 · 完成）

- 生产域（alex_carter）45 行：✅ 41 行；⚠️ 2 行（E2 问题 1/2，F8 问题 3）；➖ 2 行（A7 退出登录留给 Liya；G5 要等真冻结窗口）。
- 验收过程中在 alex_carter 上开了又平了一张 `AST −3.5` 130 contracts 的仓（D4），挂了又撤了一张 `Up @0.10` 100 shares 的现货限价单（E2）。
- 问题 1–3 都是这次之前就有的（SP-L / 持仓表旧代码），不是本轮改出来的；修法都在一两行，等 Liya 点头一起修再复验 E2 / F8。
