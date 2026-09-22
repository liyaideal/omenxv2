# 交易页 Lite / Pro 一体化 — 交付说明 v1

> 这份文档说的是全站仅有的两个交易页：`/trade`（合约，Boost 线）和 `/spot`（现货，Standard 线），以及它们在手机上的下单子页。登录用户在这两页上能看见一枚 `Lite · Pro` 开关：Lite 是简单下单卡；Pro 是专业终端——页头事件选择器、比赛市场行、Buy · Sell 面板（市价 / 限价、按金额或按张数）、订单簿、持仓与挂单表、账户风险卡。没动的是：首页、事件列表、组合、钱包等全部其他页面（它们只有一套外观，没有任何切换入口），以及 Lite 交易页除本文 §7 之外的一切。读法：先看 §0 知道去哪查，再看「通俗导读」建立概念，之后按 §2–§7 逐节对口径，数值与文案以 §5–§7 的表为准。

## 通俗导读

> 本节是给没读过正文的人的 5 分钟通俗解读；不替代正文、不构成需求依据，一切口径以正文为准。

### 一分钟看懂

旧版：「简单版 / 专业版」是整站设置，藏在头像菜单里，切一下首页、组合、钱包全换脸。新版：整站只剩一套外观，只有两个交易页保留两种看法，开关就长在交易页上。

```
/trade（合约 · Boost）        /spot（现货 · Standard）
 ├─ Lite：下单卡 + 图表         ├─ Lite：下单卡 + 图表
 └─ Pro：页头(选择器/市场行)     └─ Pro：页头(选择器)
       + Buy·Sell 面板 + 订单簿      + Buy·Sell 面板 + 订单簿
       + Positions/Orders + 风险卡    + Holdings/Orders + 账户卡
```

### 一条故事线（用户小A）

1. 小A 登录后打开 `/trade?event=demo-prekick-cs2`，看到 Lite 下单卡；卡片 CTA 下方一行 `Want to place a limit order? Pro ›`。
2. 点 `Pro ›`，页面就地换成 Pro 终端，下单类型已经是 `Limit`；页头下方多了一根 `MARKETS` 行（Winner / Handicap / Total maps / Map 1…）。
3. 小A 点 `Map 1` 芯片，选 `AST −3.5 / HER +3.5`，整个终端切到那条线，网址变成 `?event=demo-prekick-cs2&line=…`。
4. 在 Buy 页签填 Price（低于当前侧价）和金额，看到 `Limit below mark — order will rest as Pending until touched.`，确认后 Current Orders 多一行 `Pending`，账户扣了保证金 + 手续费。
5. 现价跌到限价，单子自动成交，toast `Limit buy filled at your price`，Positions 表出现仓位。
6. 小A 切到 Sell 页签，滑杆 50%，CTA 写 `Reduce Astralis`，确认后仓位减半、弹 `Cashed out · $X back`。
7. 账户风险卡 `Risk Ratio` 若冲到 95% 以上，Buy 页签 CTA 变灰 `Close-only · Risk 96%`，只能继续减仓。
8. 小A 点页头 `Lite` 回到简单卡；下次再来，入口脚注不再出现，只剩风险句。

### 概念词典

| 概念 | 是什么 | 判定表达式 | 一句话类比 |
|---|---|---|---|
| Lite / Pro | 同一交易页的两种看法；只改渲染不改路由与数据 | `useSurface().surface`；游客恒 `lite` | 同一间店的前台 / 后厨 |
| Standard / Boost | 现货线 / 合约线；选择器页签与账户卡同词 | `product_lines` 含 `spot` / 含 `futures`（旧值 `contract`） | 现金账户 / 保证金账户 |
| Boost check | Lite 组合页的账户级仪表，读 Pro 的 Risk Ratio，词不同 | `Healthy < 80` / `Getting tight 80–95` / `Auto-close soon ≥ 95` | 油表 |
| Risk Ratio | 维持保证金占权益的比例，100% 强平 | `MM / Equity × 100`，`MM = 50% × IM` | 水位线 |
| Series lines / 线位 | 一场比赛的让分 / 大小球各条线，各是一个 sibling event | `?event=<fixture>&line=<sibling>` | 同一场球的不同赔率盘 |
| contracts vs shares | 合约张数（整数）/ 现货份额（3 位小数），全词不缩写 | 合约 `Contracts`，现货 `Shares` | 期货手数 / 股票股数 |
| reduce-only | 只减少现有仓位的挂单，不动余额、不开反向 | `trades.reduce_only = true`，`margin 0 fee 0` | 只出不进的闸 |
| In orders / Reserved | 现货限价买单锁住的钱：份额 × 限价 + 0.15% 手续费 | `Σ Pending 买单 Reserved` | 预授权冻结 |
| Close-only | 账户风险 ≥ 95% 时禁止开仓 / 加仓 | `riskLevel ∈ {RESTRICTION, LIQUIDATION}` | 只许卸货不许装货 |
| Suspended | 事件停牌：两条线都只许撤单 | `lifecycle_status = SUSPENDED` | 暂停交易的股票 |

### 易混点辨析

1. 开关**不是**整站模式设置，**而是**交易页两页上的就地切换；其他页面没有任何切换入口。
2. Pro 的 Sell 页签**不是**开空单，**而是**只减仓 / 平仓当前净额仓位；数量超过持仓即钳到持仓。
3. 三选一事件的 No 侧 CTA**不是** `Sell Draw`，**而是** `Buy Not Draw`；别名事件的 No 侧则直接显示别名（`Buy Heroic`）。
4. Risk Ratio**不是** IM / Equity，**而是** MM / Equity；`Available` 仍是 `Equity − IM`，两者用途不同。
5. 现货限价卖单**不是**锁份额，**而是**下单时校验持有、成交时再校验；买单才预留 `notional + fee`。
6. 选线**不是**切换下单面板的选项，**而是**切换到另一个 sibling event（整个终端换事件）；只有三选一 Winner 例外——留在同一事件切 option。
7. 品类未开 Boost 时**不是**显示「1× 锁死」提示，**而是**整行 Leverage 不渲染。

### 用户视角

看到：交易页头 / 手机 dock 上的 Lite·Pro 开关；Pro 页头标题 ▾ 的 Standard / Boost 事件选择器；比赛事件的 `MARKETS` 行；Buy · Sell 页签 + Market / Limit；Amount 后缀 `USDC ▾ / Contracts ▾`（现货 `Shares ▾`）；不可下单时印原因的灰 CTA；Current Orders 里红色 `Close` 徽标与 `Reduce-only` 标；风险卡与手机 `Risk x%` 方块。
看不到：头像菜单里的模式切换；页头 `SPOT` / `Boost` 徽标；Funding 费率；全仓 / 逐仓开关；`Max loss` 行；`Partial Filled`（蓝图引擎整单成交，生产不可达）。

## 0. 读者须知

查什么去哪儿：
- 长什么样 → 生产页：`/trade?event=demo-prekick-cs2`（7×24 常驻电竞 BO3）、`/trade?event=sp-ucl-mci-int`（足球三选一）、`/spot?event=<crypto-btc-updown-4h-…>`（现货，id 按当天轮次取）、手机 `/trade/order?event=demo-prekick-cs2`。Pro 需登录，演示账号 `alex_carter`；手机 = 375 宽。
- 什么时候变成什么样 → `/style-guide` → 「Pro — 交易终端」下三个节点：**合约终端 /trade**、**现货终端 /spot**、**两终端共用**；Lite 侧入口与 Close-only 在 **Lite 交易页** 节点。每个 case 有「状态 / 触发条件 / 视觉 / 数据来源」表，编号见 §10。
- 字段名、文案、公式、术语 → `docs/copy-dictionary.md`（顶部「Lite 术语对照表」+ §Trading）→ 本文 §5–§7
- 设计法则（颜色轴、chip、overlay 对等）→ `DESIGN.md`（§7 Account Risk Indicator 及 09-14 / 09-15 / 09-17 Addendum）
提问前先按上面顺序查一遍；查不到再提，提问时写明"我查了 X 没有"。

## 1. 功能目标

1. 全站只剩一套外观（原简单版）；只有 `/trade` 与 `/spot` 两页保留 Lite / Pro 两种看法，开关只在这两页上、登录后可见。
2. Pro 终端补齐专业能力：两条产品线共用的事件选择器、比赛多市场行、Buy · Sell 面板（Sell 只减仓）、按张数 / 份额下单、真正会挂会成交会退款的合约限价单、按品类的杠杆上限。
3. 合约与现货、Lite 与 Pro 四处对「什么时候不能下单」「费率与净利」「账户风险」口径一致。
4. Lite 交易页只加一个通往 Pro 的入口脚注和两条封锁文案，其余不动。

## 2. 全站结构与路由

Lite 是全站唯一外观；只有 `/trade` 与 `/spot` 两页按 `useSurface().surface` 分叉。游客恒为 Lite（会话确认为空即回落；localStorage 的 Pro 偏好保留，再登录恢复）；游客的 `setSurface` / `toggle` 均为 no-op。

| 路由 | 桌面 | 手机 |
|---|---|---|
| `/trade` | Lite 交易页 ／ Pro 合约终端 | Lite 交易页 ／ Pro 图表页 + dock |
| `/trade/order` | Pro 合约终端 | 手机 Pro 合约下单页；桌面 Pro 直接渲染桌面终端；Lite 下重定向到 `/trade`（同 `/spot/order` → `/spot`） |
| `/spot` | Lite 交易页 ／ Pro 现货终端 | Lite 交易页 ／ Pro 图表页 + dock |
| `/spot/order` | Pro 现货终端 | Pro 现货下单页；Lite 重定向 `/spot` |
| `/order-preview` | — | 手机合约下单预览页（Buy 与 reduce-only 两种） |

其余路由（`/`、`/events`、`/portfolio` 及子路由、`/resolved*`）恒 Lite 或重定向，没有 surface 分叉。头像菜单、Me 抽屉、底部导航都没有模式切换项。

## 3. Lite ↔ Pro 开关与入口

**SurfaceSwitch 五态**

| 状态 | 判定 | 视觉 |
|---|---|---|
| Lite 选中（页头） | `user != null && surface === "lite"` | 外壳 `h-[26px] rounded-lg border-border bg-muted/50 p-0.5`；段 `h-[20px] px-2.5 text-[11px]`；选中段 `bg-white` 字 `#0a0b0d` |
| Pro 选中（页头） | `user != null && surface === "pro"` | 镜像 |
| 游客 | `user == null` | 整件 `return null`，不占位 |
| 贴底方钮 · 在 Lite | `size="dock" && surface === "lite"` | 46px 方钮，`ArrowLeftRight` 14px + 10px 粗体标签 `Pro` |
| 贴底方钮 · 在 Pro | `size="dock" && surface === "pro"` | 同上，标签 `Lite` |

- 位置：Lite = 全站 header 最右一项（头像 / Sign In 之后）；Pro = 终端顶栏最右一项（★ 之后）。同一角落、同一尺寸，不追求同一像素。手机 Lite 多市场页无贴底栏 → 左下角浮钮（`left 12 / bottom 14 + safe-area`），任何抽屉打开时隐藏。
- hover 说明（只描述另一面）：在 Lite `Pro: order book, limit orders, candlestick chart`；在 Pro `Lite: simple trading view`。
- 无障碍：页头 `role="radiogroup"` + `aria-label="Trading view"`；方钮 `aria-label="Switch to Pro view" / "Switch to Lite view"`。
- 记忆：localStorage `omenx_surface` + `profiles.preferred_surface`（尽力写入，首次水合优先）。切换只改渲染，网址不变。

**Lite 下单卡 → Pro 入口（LimitOrderHint）**

| 项 | 规则 |
|---|---|
| 行位 | Lite 三种下单面板（合约 Binary / 合约多 market / 现货；桌面卡片与手机抽屉）CTA 下方只有一行脚注，OR 二选一，永不叠两行 |
| 金额为空 | `Want to place a limit order? Pro ›`（"limit order" 是 Lite 禁词的批准例外） |
| 金额 > 0 | 合约 `Not guaranteed. You can lose your full $X.`；现货 `Buys instantly at the current price (within 0.5%)` |
| 谁看得到 | 登录且该账号在本设备从未渲染过 Pro：localStorage `omenx_pro_visited:<user_id>`，按账号 + 按设备，换设备会再看到一次 |
| 点击 | 写 sessionStorage `omenx_open_limit` → `setSurface("pro")`；手机跳 `/trade/order` 或 `/spot/order` 带 `?event=`；Pro 面板 `orderType` 初值 = 15 s 内消费到标记则 `Limit` 否则 `Market`；过期落 Market 无提示 |

## 4. 事件选择器

| 项 | 口径 |
|---|---|
| 入口 | 桌面：标题右侧 ▾ → 标题下方下拉（点外面关闭）。手机：标题右侧 ▾ → `Select Event` 底部抽屉。`/trade`、`/spot` 同一组件 |
| 页签 | `Standard`（现货线）/ `Boost`（合约线），与账户卡同词，不用 Spot / Futures。默认 = 当前终端；关闭后重置页签、清空搜索 |
| 列表 | 按 `product_lines` 过滤（两线都开的两页签都出现）；只列比赛不列线；已过 `end_date` 的不列；按结束时间升序。Volume 列 `$803K` / `$1.35M` 压缩 |
| 当前行 | 在自己那条线的页签高亮（桌面 `bg-muted/30`，手机描边卡片）；另一页签无高亮 |
| 跳转 | 同页签：原行为（replace 不入历史）。另一页签：`/spot?event=` ↔ `/trade?event=`，手机保持当前视图（Charts → Charts，Trade → order 子页），Lite/Pro 偏好不变 |
| `Ends in` | `<1m` / `8m` / `3h 12m` / `2d 14h` / `Sep 29`（≥7 天）；过 freeze 未到结束 `Frozen`（红）。≤15 分钟红、≤1 小时黄，其余 muted；每分钟刷新。桌面列头 `Ends in`；手机行内 `Ends in 8m · Volume: $803K`（Frozen 不带前缀） |
| 收藏 ★ | 搜索框 + ★ 过滤在页签下方；`/trade` 与页头 ★ 同一份（登录读写 `user_watchlist`）；`/spot` 选择器用本地 `trading_favorites`，登录后与页头 ★ 不是同一份（已知边界） |
| 空态 | 收藏无结果：★ + `No favorites yet` + `View all events`；搜索无结果：Search 图标 + `No events found` + `Try a different search term` |
| 页头标 | 手机现货页 `SPOT` 徽标删除，合约页不加 `Boost`；终端 header 只允许生命周期 badge |

生命周期 × 列表：

| lifecycle | 列 / 不列 | `Ends in` 显示 |
|---|---|---|
| TRADING / SUSPENDED / REVIEW / SETTLING | 列（未结算且未过结束时间） | 相对时间，同阈色 |
| FROZEN（`freeze_time ≤ now < end_date`） | 列 | `Frozen` 红 |
| 过 `end_date` / `is_resolved = true` | 不列 | — |

手机 `/trade/order` 跨线选中现货事件 → `/spot/order?event=`；Buy/Sell 页签按 `${eventId}:${optionId}` 分键，新事件落默认 Buy；单位模式（USDC / Contracts·Shares）按设备记忆、两终端共用。

## 5. Pro 合约终端 /trade

### 5.1 页头与比赛市场行

页头：标题 = 比赛名（Winner 事件的 name），右侧 ▾ 开选择器；数据条只有 24h Volume 与 OI；最多一个生命周期 badge。

| 项 | 口径 |
|---|---|
| 触发 | 当前事件属于一场比赛（自身是 Winner 且有 sibling，或自身是 sibling）→ 原 `Select Option` 行换成市场行 |
| 市场行 | `MARKETS` 小标 + 芯片。芯片 = 组名小字 + 当前线位与 Yes 侧价（`HANDICAP AST −1.5 · 34¢`）。足球 `Winner / Handicap / Total goals`；电竞 `Winner / Handicap / Total maps ｜ Map 1 / Map 2 / Map 3`（每图分段组：Map n winner / Rounds handicap / Total rounds）；MMA `Winner / Total rounds / Method`。Spread / Totals / O/U 全站禁 |
| 芯片状态 | 当前组 `--yes` 描边 + 淡青底；非当前单节组显示默认线位（中位线）+ Yes 价，muted；非当前分段组只显示组名 + ▾；单线组（Winner）无 ▾ 直接切 |
| 中位线 | 该组第一节的线按 `line` 升序，取下标 `Math.floor(lines.length / 2)`：奇数取正中，偶数取偏大的一条（4 条取第 3 条） |
| 选线 | 桌面 DropdownMenu / 手机 MobileDrawer；每节小标，行 = `AST −3.5 / HER +3.5` + 两侧价（Yes 青 / No 荧光绿）。选一条 = 切 sibling event，URL `?event=<fixture>&line=<sibling>`（Winner 去掉 `line`） |
| 三选一 Winner | Winner 芯片带下拉列三个 outcome（各一个价）；选中留在 Winner 事件、切下单面板 option，`line=<event>#<option>` |
| 副行 | `Ends in` 前写当前市场 `Map handicap · AST −1.5`（手机写在倒计时行前） |
| 深链归一 | 收到 `?event=<sibling>` 或 event 与 fixture 不符 → `replace` 成 `?event=<fixture>&line=<sibling>`，不再 "Event Has Ended" |
| 手机 | 同一根行横向滚动（`overflow-x-auto`，无 `MARKETS` 小标），Charts / Trade 子页都保留 `line` |

别名 binary（队名 / 盘口）当前 option 固定在 Yes 端（`resolveYesSideOption`）；Yes / No 切换钮、CTA、`Mark Price` 旁侧标、dock 两钮全部读 `side_labels`（`Astralis` / `Heroic`），不用 option label。

### 5.2 下单面板 · Buy

自上而下：`Buy · Sell` 文字页签 + `Market ▾ / Limit` 下拉 → Yes/No 切换 → Leverage → `Available (USDC)` + ⇄ 划转 → (Price，仅 Limit) → Amount + 单位下拉 → 滑杆 → TP/SL → 摘要 → CTA。桌面与手机同一套 markup，与 `/spot` 相同。

| 项 | 规则 |
|---|---|
| Yes/No | 字面 Yes/No 事件可选 No 端；别名事件两钮读 `side_labels`；三选一切换钮仍是 `Yes / No`，价格 = 选项价 / 1 − 选项价。价格四位小数 `0.2196` |
| Leverage 上限 | `category_boost_configs.max_leverage`（与 Lite Boost 同源）：crypto 10× · macro / social / stocks / finance / tech / politics / entertainment / economy 5× · sports 3×；未配置 1×。上限要调只改表 |
| 档位 | `boostTiers(max)`：20 → 1 / 2 / 5 / 20；10 → 1 / 2 / 5 / 10；5 → 1 / 2 / 3 / 5；3 → 1 / 2 / 3。手机 `Leverage 10x ▾` 开抽屉（滑杆 + 档位 + Done） |
| 上限 < 2× | Leverage 行整个不渲染（桌面标签 / 滑杆 / 档位，手机整行），下单按 1×；切品类时当前杠杆 > 新上限 → 压到上限 |
| Amount 单位 | 后缀 `USDC ▾ / Contracts ▾`，标签恒 `Amount`。USDC = 保证金；Contracts = 整数张。切换时换算不清空：张数 = `floor(保证金 × 杠杆 ÷ 价格)`。按设备记忆 `omenx-amount-mode` |
| 取整 | 手输 `floor`，下限 0（`2.7` 按 2，`0.9` 按 0，输入串不改写）；`maxUnits = floor(可用 × 杠杆 ÷ 价格)`；滑杆 = `round(maxUnits × pct)`；USDC 模式滑杆 = 可用余额 % |
| Price（Limit） | 默认 = 当前侧价，可改。`Contracts = 金额 × 杠杆 ÷ 限价`；Contracts 模式 `Margin = 张数 × 限价 ÷ 杠杆`。下单即扣 `保证金 + 手续费`。限价 ≥ 现侧价 → 立即按现价成交；限价 < 现侧价 → `Pending` + 提示 `Limit below mark — order will rest as Pending until touched.`；现价 ≤ 限价时按限价成交，entry = 限价（同向已有仓位加权合并），toast `Limit buy filled at your price`。撤单退回保证金 + 手续费。挂单不做净额对冲（跨零挂单已被禁止） |
| TP/SL | 保留（Buy 页签），Sell 页签隐藏 |
| 摘要 | `Contracts` = 张数 · `Notional` = 张数 × 价格 · `Margin` = Notional ÷ 杠杆 · `Fee (0.15%)` = Notional × 0.0015 · `Total` = Margin + Fee · `To win ⓘ` = `netWin()`（扣 5% 赢利佣金后的净利，5% 基数 = 毛利 − 开仓费）。算例 $25 · 5× · Yes 68¢：fee `$0.19`、gross `$58.82`、WC `$2.93`、net `$55.89`，与 Lite 同单同数 |
| 余额不足 | 按换算后 Margin 校验，`Insufficient balance.` |

CTA 文案（优先级自上而下）：

| 情形 | CTA |
|---|---|
| 封锁（§5.5） | `Settled` / `In review` / `Suspended · cancel only` / `Closed` |
| Risk ≥ 95% 且开仓 / 加仓 | `Close-only · Risk 96%`（取整，不显示 `To win`） |
| 持有反向仓位再买（跨零被禁） | `Close existing position first`（CTA 禁用；上方红框提示 `You hold N long/short shares. Close it before opening the opposite side.` + `Close & Continue` 链接把金额填成正好平掉那一仓） |
| 买反向减仓 | `Reduce {label}` / `Close {label}` |
| 开仓 / 加仓 · 字面或别名 | `Buy {Yes别名}` / `Buy {No别名}`（`Buy Astralis` / `Buy Heroic`）；副文案 `To win $X` |
| 开仓 · 三选一 No 侧 | `Buy Not {option}`（`Buy Not Draw`） |
| 金额 0 | 可点，聚焦输入框并提示 `Enter an amount` |

确认：桌面 `Order Preview` 弹窗，行 = Type / Leverage / Price / Order cost / Traded notional / Opening notional / Margin required / Liq. price / TP/SL / Position impact（无 Margin 行）；手机跳 `/order-preview` 页，同组行（无 `Margin type` 行）。

### 5.3 下单面板 · Sell

Sell = reduce-only：只减仓 / 平仓当前结果上已持有的仓位（一个交易对一个仓位，同向加仓合并）；数量上限 = 持仓数量，超出钳到全平；永不开反向。

| 项 | 规则 |
|---|---|
| 空仓 | 两侧禁用、价格条 `0 contracts`、一行 `No position to close yet`、CTA 禁用；只持一侧则另一侧禁用 |
| 结构 | Yes/No 切换 → `Held {size} contracts · {outcome} · {leverage}x · entry {price}` → Available + ⇄ → (`Close price` 输入框，Limit，默认 mark) → Amount（后缀 `Contracts`）+ 滑杆 25/50/75/100%（100% = 精确持仓） → 摘要 → CTA。无 Leverage、TP/SL |
| 摘要 | `Close price (mark)`（限价按输入价）· `Contracts` · `Released margin` = 持仓保证金 × 张数 / 持仓张数 · `Realized PnL est.` = (mark − entry) × 张数 × 方向 · `Est. commission` = 5% × max(PnL − 已分摊开仓费, 0) · **`You receive`** = Released + PnL − commission |
| 算例 | 持 40 · Up · 5× · entry 0.6200 · 保证金 4.96，mark 0.6800 全平：Released 4.96、PnL +2.40、开仓费 0.0372、commission 0.12、You receive **7.24**；减仓 20 各项 × 1/2 |
| CTA | 红色；`sellQty >= heldSize` → `Close {outcome}`，否则 `Reduce {outcome}`；副文案 `You receive $X`；数量 0 可点提示 `Enter an amount` |
| 市价 | 与持仓表 Close 同一路径（`partialClosePosition`）：桌面预览弹窗 → 确认；手机开 `ClosePositionDialog`（按 Sell 页签数量预填）。成交 toast `Cashed out · $X back` |
| 限价 | 生成 reduce-only 挂单：`side = sell`、`order_type = Limit`、`margin = 0`、`fee = 0`、`reduce_only = true`，`amount` = 张数 × 限价；下单不动余额。偏离 mark 提示 `Limit above/below mark — order will rest as Pending until touched.`；手机走 `/order-preview`（Position / Order `Limit · Reduce-only` / Close price / Contracts / Released margin / Realized PnL est. / Est. commission / You receive）。撤单只改状态无退款；触及时同市价路径成交，附加 toast `Limit close filled · N contracts` |

Buy · Sell 页签与 Yes/No 一样按 `事件:结果` 记忆，`/trade` ↔ `/trade/order` 往返不丢。已知引擎不一致：Buy 页签买反向触发的自动减仓走 `executeTrade` 不扣赢利佣金，Sell / 持仓表 Close 扣；正式版统一为扣。

### 5.4 手机 /trade 图表页 dock 与 /trade/order

- 图表页底部 sticky dock = Lite/Pro 方钮 + Yes / No 两钮（binary 只印 outcome 名，不带价格）；右上角提示 `Tap to switch view · tap again to trade`；上方 `Available … USDC` 行。
- 两步点击：首屏始终一侧激活（无超时复位）；点另一边 = 切边（描边 + 箭头）；再点同一边 = 跳 `/trade/order`。
- `/trade/order` 顶部 `Charts / Trade` 页签往返；`line` 参数两子页都保留；此页不挂 Lite/Pro 开关；未登录用 `LiteAuthGate variant="panel"`。

### 5.5 不可下单态

`contractGate(event, now)`（15 s 重算一次），优先级 **Settled > In review > Suspended · cancel only > Closed**：

| 原因 | 判定 |
|---|---|
| `Settled` | `is_resolved = true` |
| `In review` | `lifecycle_status === "REVIEW"` |
| `Suspended · cancel only` | `lifecycle_status === "SUSPENDED"` |
| `Closed` | `freeze_time ≤ now` 或 `end_date ≤ now` |

其他 lifecycle（含 SETTLING）不封锁，与 Lite 合约页一致。形态：桌面 / `/trade/order` 面板 Buy 与 Sell 两个 CTA 都置灰只印原因（`To win $0` 读数保留），预览打不开、提交兜底 toast；手机图表页 dock 两钮收成一条禁用条（`bg-muted/40 text-muted-foreground`，`role="status"`，不可点）只印一次原因，提示句隐藏，开关与 Available 行保留。Current Orders 的 `Cancel` 在任何封锁态仍可点。

### 5.6 Positions / Current Orders 表

| 项 | 规则 |
|---|---|
| Side 列 | 字面事件 `Yes / No`；别名事件显示别名（`Heroic`，`short` 只在后端）；三选一 No 侧 `Not {option}`；sibling 上的仓位显示 `AST −1.5` 而非 `Yes`；reduce-only 挂单 Side 红色 `Close` 徽标（`bg-trading-red/20 text-trading-red`）+ 类型列 `Reduce-only` 标（`text-[10px] bg-muted`） |
| 列头 | 桌面持仓表 `Qty` / `Liq. Price` 缩写保留（Liya 09-18 定，不改） |
| Liq. Price | `entry × (1 ∓ (1 − MM_RATIO) / 杠杆)`，`MM_RATIO = 0.5`（10× → ±5%）；预览弹窗同式 |
| Go to this event | 持仓 / 挂单 HoverCard 里的按钮；sibling 走 `?event=<fixture>&line=<id>` |
| 状态标 | `OrderStatusBadge`：Pending 黄 / Filled 绿 / Cancelled 红 / Partial Filled 青。仅 `Partial Filled` 可展开：桌面 hover（HoverCard）、手机点一下（Popover，再点或点外收起），内容 `Fill progress  480 / 1,200 (40%)` + 进度条 + `Filled` / `Remaining` 两行；filled 缺省 = amount − remaining |
| Cancel 退款 | 合约 Buy · Limit：退 `margin + fee`；合约 reduce-only：无退款；现货买单：退 `Reserved`（notional + fee）；现货卖单：无（没扣过）。`Partial Filled` 行 Cancel 可点 |

### 5.7 账户风险

| 项 | 规则 |
|---|---|
| 指标 | `Risk Ratio = MM / Equity × 100`；`MM = 50% × IM`（`MM_RATIO`）；`Equity = 余额 + 未实现盈亏` |
| 档位 | SAFE < 80 / WARNING 80–95 / RESTRICTION 95–100 / LIQUIDATION ≥ 100；颜色绿 / 黄 / 橙 / 红 |
| 距强平 | `Until auto-close starts` = `Equity − MM` |
| Available | `Equity − IM`（开新仓可用） |
| 零态 | 无合约持仓 → `Risk 0%` 绿，IM / MM `$0.00`；Equity ≤ 0 且有持仓 → 100 红 |
| 桌面卡 | `Boost Account`：Margin Mode / Account Equity / Risk Ratio 进度条（80 / 95 / 100 刻度）/ Initial Margin $ / Maint. Margin $ |
| 手机 | 页头方块 `Risk x%` 按档位染色；点开抽屉 = 桌面卡同一套行，无 Rate 进度条 |
| Close-only | `riskLevel ∈ {RESTRICTION, LIQUIDATION}` 且 `orderIntent.kind ∈ {open, add}`：Pro Buy CTA `Close-only · Risk 96%`；Sell / 减仓 / 现货不受影响。Lite 合约卡 `Boost limit reached — close a position first`（优先级低于四种封锁），手机 dock 两钮不置灰。蓝图只在 UI 禁，后端不拦 |
| Lite Boost check | 同一个数：条上 `Healthy · 7%`（整数）/ `Getting tight` / `Auto-close soon`；Details 四行 Equity / Used by Boost calls / `Boost usage 7.13%` / Until auto-close starts；不出现 Risk Ratio / Margin 字样。`Est. auto-close ≈` 解 `equity(P) = 交易后 MM`，1× 仓位为 none |

同一账户（Equity $2,003、IM $285.59）：Risk Ratio 7.13%，`Until auto-close starts` $1,864。蓝图无自动强平引擎，只改显示与估算；正式版强平线按 MM / Equity = 100%，MM 比例由风控配置。

## 6. Pro 现货终端 /spot

| 区 | 口径 |
|---|---|
| 页头 | 标题只写 `Trade`，无 `SPOT` 徽标、无 Base stat；右侧仅 Volume 与标的价格；badge 只在 `lifecycle !== "TRADING"`（`Extended hours` + tooltip；crypto 24/7 无 PRE/AH）；ⓘ 里 `Trading ends` / `Payout:` |
| Buy 面板 | `Buy · Sell` 页签 + Market / Limit → `BinarySideToggle`（Up / Down 带价）→ `Available (USDC)` + ⇄ → (Limit price) → Amount 后缀 `USDC ▾ / Shares ▾`（份额 3 位小数）+ 滑杆 → 滑点（仅 Market，中性 chip）→ 摘要 `Cost`（Market 下附 `Est. fill @ X`）/ `Shares` / `Fee (0.15%)` / `To win ⓘ`；无 Max loss。CTA 副文案 `To win $X`；零金额可点提示 `Enter an amount` |
| 费率 | 输入 = 份额成本，费另收：$25 @ 0.68 → fee $0.04、shares 36.76、扣款 $25.04、To win $11.17（Lite 预算口径同单 $10.45） |
| 限价买 | 价格 tick `$0.01`，默认 = mark 四舍五入到分；不合法报 `Limit price must be a multiple of $0.01`。≥ 最优卖价即时成交 toast `Limit buy filled immediately at $x`；否则 `Pending`，提示预留 `cost + fee`，CTA `Place limit · Buy Up`。预留 = `notional + fee`，账户卡 `In orders` = Σ Pending 买单 Reserved；撤单退全额 |
| Sell | 下方 `Held · N shares {outcome}`；未持有侧禁用 `0 shares`，两侧皆无 `No shares to sell yet`。份额不锁定：下单时校验持有 ≥ 数量，成交时再校验，不够则自动 Cancelled；限价卖 > mark 挂单，触及成交 toast `Limit sell filled · $X to wallet`；撤单不退钱。全平吸附：`|qty − held| < 0.001` 或 `qty ≥ held × 0.9995` → 发精确 held。摘要 `Proceeds / Shares / Est. commission / You receive`，CTA 副文案 `You receive $X` |
| 订单簿 | 每侧固定 10 槽，薄深度补空槽不虚构价格；中间行只有 `↑ / ↓ 现价`，无 ⚑ 标记价，tooltip `Last traded price of the outcome share. Shares settle at $1 (win) or $0 (lose).`；tick 行左侧报价模式徽标 NORMAL 灰 / CONSERVATIVE 黄 / HEDGE_ONLY / CANCEL_ONLY |
| 底部页签 | `Current Orders` / `Holdings`；Holdings 列 `Market · Outcome · Shares · Avg price · Price · Value · PnL`，空态 `No holdings yet` / `No open orders`；行内无 `SPOT` 标；Holdings 行 `Close` 预置 Sell · 该 outcome · Market · 全量精确份额并直接开预览 |
| 预览弹窗 | `Order Preview`：事件名 + outcome chip + 两张卡；Buy 第二卡 Cost / Fee (0.15%) / To win，Sell 为 Proceeds / Est. commission / You receive；无杠杆 / 保证金 / 强平 |
| 账户卡 | `Standard Account`：Available (USDC) / In orders / Holdings；`Payout by ~{time}` |
| 冻结 | `blocked = isOrderingBlocked(lifecycle) || isFrozenByTime`，文案 `Market frozen`（SETTLING 内部态用户仍看 `Market frozen` 直到 `Settled`）；tile 仍可点看价，CTA 置灰、预览打不开、Holdings `Close` toast 拦截。冻结巡检 `freeze_expired_events()` 每 5 分钟；结算时退还挂单 `冻结金额 + 手续费`；被冻结撤掉的挂单状态标 `Cancelled · market frozen` |
| 轮次 | 加密涨跌事件按固定轮次开局 / 结算：5m · 15m · 1h · 4h（事件 id 形如 `crypto-btc-updown-4h-<YYYYMMDDHHmm>`）；每轮到点结算、下一轮自动开局，选择器里只列未结束的轮 |
| 手机 | `/spot` = 32px stats strip + 图表 + Orders / Holdings 卡 + dock（Lite/Pro 方钮 + Up / Down 两步点按，同 §5.4）；`/spot/order` = 同一 `ProSpotPanel` bare chrome + 120px 迷你盘口（10 + 10 档 + `Depth 0.1`）；日内涨跌页头短名 `META · Up or down?` |

## 7. Lite 交易页本轮改动

| 项 | 规则 | 字典 |
|---|---|---|
| Pro 入口脚注 | §3 的 `Want to place a limit order? Pro ›` OR 规则，三种面板 + 手机抽屉同一行位 | TR-27 / 27b / 27c · SP-19 / 19b |
| Suspended | `lifecycle_status = SUSPENDED` → CTA 置灰 `Suspended`（Lite 无挂单，不写 cancel only） | — |
| Risk ≥ 95% | CTA 置灰 `Boost limit reached — close a position first`，优先级低于 Settled / In review / Suspended / Closed；手机 dock 不置灰，抽屉里才见 | TR-28 |
| Boost 上限 | 跟 `category_boost_configs`（同 §5.2 值表，美股 / 科技 / 政治类开到 `Up to 5×`）；品类未开 Boost → 无档位行 | — |
| Boost check | `Healthy · 7%` + Details `Boost usage`（§5.7） | Portfolio 节 |

其余 Lite 一律不动：布局、图表、下单卡结构、持仓卡 `Cash out`、事件列表入口。

## 8. 数据与后端边界

| 表 / 字段 | 说明 |
|---|---|
| `trades.side` | `buy` / `sell`（reduce-only 平仓单为 sell） |
| `trades.order_type` | `Market` / `Limit`（市价即时成交按真实类型记） |
| `trades.status` | `Pending` / `Partial Filled` / `Filled` / `Cancelled`；蓝图整单成交，`Partial Filled` 不出现；无已成交数量字段 |
| `trades.reduce_only` | `boolean not null default false`，限价平仓单 true |
| `trades.margin` / `trades.fee` | 合约 Buy · Limit 预留 = 两者之和，撤单退回；reduce-only 均 0 |
| `trades.amount` | 名义额（库约束 > 0） |
| `trades.product_line` | `spot` / `futures` |
| `positions` | 用到 `size` / `entry_price` / `leverage` / `margin` / `option_id` / `trade_id` / `status` / `mark_price` / `pnl` / `pnl_percent` / `winning_commission` / `close_reason`；一交易对一行 |
| `profiles.preferred_surface` | `lite` / `pro`，尽力写入；`profiles.balance`（Boost）/ `profiles.spot_balance`（Standard） |
| `category_boost_configs.max_leverage` | Pro 杠杆上限与 Lite Boost 同源；本轮只改数据 |
| `events.lifecycle_status` | TRADING / EXTENDED_TRADING / FROZEN / SUSPENDED / REVIEW / SETTLING / SETTLED；`is_resolved`、`freeze_time`、`end_date`、`product_lines`、`side_labels`、`metadata`（fixture / sibling） |

蓝图在前端模拟、正式版必须在后端做：

| 项 | 蓝图 | 正式版 |
|---|---|---|
| 限价触发成交 | `useContractLimitFills`（桌面 + 手机 `/trade`）、`useSpotTerminal`（现货）按页面打开时的 mark 触发，离页不成交 | 后端撮合，给出 filled 数量 |
| 冻结撤单 / 退款 | `freeze_expired_events()` + `sim-settle-spot` | 后端 |
| Close-only | 只在 UI 禁开仓 | 服务端同样校验 |
| 自动强平 | 无引擎，只显示 | MM / Equity = 100% 强平 |
| 赢利佣金 | `partialClosePosition` 扣，`executeTrade` 自动减仓不扣 | 统一为扣 |
| 保证金模式 | 恒全仓；Funding 恒 0 | 接口不接受 `margin_mode`，资金费一律 0 |

## 9. 已删除 / 已废弃

| 项 | 说明 |
|---|---|
| 全站 Simple / Pro 模式设置 | 头像菜单 / Me 抽屉项、Pro 四项底部导航、`MobileHeader.PRO_ROOTS` 删除；`MobileHome` / `EventsPage` / `ResolvedPage` 等文件保留不挂路由 |
| `Select Option` 行（比赛事件） | 换成市场行 |
| `SPOT` 徽标 / Base stat / ET 时区覆盖（crypto） | 页头删除；crypto 用 24/7 profile |
| `Amount ⇄ Qty` 假切换 | 从未接入计算，删除；改为单位下拉 |
| Funding Rate / Next Funding | 页头、数据条、Transparency 审计页全部删除；`funding_*` 列与 `accrue-funding` 文件兼容保留不用 |
| Cross / Isolated 开关 | 删除，恒 `Cross`；预览 `Margin` / `Margin type` 行删除 |
| IM / Equity 口径 | Risk Ratio 改 MM / Equity；手机抽屉两条 Rate 进度条删除 |
| `Boost not available for this category` | 已废（09-22），改为不渲染 Leverage 行 |
| `Sell {option}` CTA | 三选一 No 侧改 `Buy Not {option}`；别名事件改 `Buy {别名}` |
| `ct` / `sh` 缩写 | 单位全词 `contracts` / `shares` |
| `Max loss` / `Max win` 行 | 净利口径由 `To win` 单行承担 |
| `Spot Account` / `Not Up` / `Positions`（现货） | 改 `Standard Account` / `Down` / `Holdings` |
| `To win shows profit after the 5% winning commission.` 平铺句 | 改为 `To win ⓘ` tooltip |
| `Settles & credits by ~{time}` | 改 `Payout by ~{time}` |
| 现货订单簿 ⚑ 标记价行 | 删除，只留现价 |
| 老 `AuthGateOverlay`（交易面） | 换 `LiteAuthGate variant="panel"` |
| `PF-D1 / PF-M1` 编号 | 改 `OS-D1 / OS-M1` |

## 10. 状态索引

| 模块 | 字典节点 › 小节 | case |
|---|---|---|
| Lite / Pro 开关 | 两终端共用 › Surface switch | SS-1 Lite 选中 · SS-2 Pro 选中 · SS-3 游客隐藏 · SS-4 方钮在 Lite · SS-5 方钮在 Pro · SS-6 左下角浮钮 |
| Lite → Pro 入口（合约） | Lite 交易页 › ⑦ | TR-27 入口 · TR-27b 有金额风险句 · TR-27c 多 market 面板 |
| Lite → Pro 入口（现货） | Lite 交易页（现货） | SP-19 入口 · SP-19b 有金额原句 |
| Lite Close-only | Lite 交易页 › ⑦ | TR-28 |
| 事件选择器 · 桌面 | 两终端共用 › ② | ES-D1 Standard · ES-D2 Boost · ES-D3 收藏为空 · ES-D4 搜索无结果 |
| 事件选择器 · 手机 | 两终端共用 › ② | ES-M1 抽屉 |
| 终端骨架 | 两终端共用 › ③ | SP-C1 骨架 · SP-I 未登录门 |
| 订单状态标 | 两终端共用 › ④ | OS-D1 桌面 hover · OS-M1 手机点开 |
| 市场行 · 桌面 | 合约终端 › ① | SL-D1 电竞 · SL-D2 Map 1 下拉 · SL-D3 足球 · SL-D4 Winner 三选一下拉 |
| 市场行 · 手机 | 合约终端 › ① | SL-M1 横滚 · SL-M2 线位抽屉 · SL-M3 Winner 三选一抽屉 |
| 桌面面板 | 合约终端 › ② 桌面右栏 | CT-D1 Buy · Market · CT-D2 Contracts · CT-D3 Buy · Limit · CT-D4 Sell 减仓 · CT-D5 Sell 空仓 · CT-D6 无 Leverage 行 · DK-D1 封锁 · RM-D1 Close-only |
| 手机 `/trade/order` | 合约终端 › ② 手机 | CT-M1 Buy · CT-M2 Sell Market · CT-M3 Sell Limit · CT-M4 Sell 空仓 · CT-M6 Contracts · CT-M7 别名 binary · CT-M8 Buy · Limit · DK-M2 封锁 |
| 手机 Leverage 抽屉 | 合约终端 › ② | CT-M5 抽屉 · CT-M5b 上限 20× · CT-M5c 无 Leverage 行 |
| 手机 dock | 合约终端 › ③ | DK-M1 五态 |
| 账户风险 · 手机 | 合约终端 › ④ | RM-M0 零态 · RM-M1 方块四档 · RM-M2 抽屉 · RM-M3 Close-only |
| 现货面板 | 现货终端 › ① | SP-B1 Buy Market · SP-B1b Shares · SP-B2 Buy Limit · SP-B2b Sell Limit · SP-B3 单边持仓 · SP-B3b 仅持 Down · SP-B4 无持仓 · SP-B5 余额不足 · SP-B6 限价将挂单 · SP-B8 冻结 |
| 现货订单簿 | 现货终端 › ② | SP-J0 正常深度 · SP-J 薄深度 |
| 现货预览弹窗 | 现货终端 › ③ | SP-B7 |
| 现货手机 | 现货终端 › ④ | SP-M1 Charts · SP-M1b 360 · SP-M2 冻结 · SP-M3 order Buy · SP-M4 order Sell · SP-M4b Shares · SP-M5 dock 四态 |

## 11. 验收记录

- 2026-09-17 → 09-18 生产域（`alex_carter`）45 行联合验收：43 行通过；A7（退出登录回 Lite）Liya 亲验通过；验收中修掉 `In orders` 恒 $0、现货限价只扣 notional、持仓表 `Go to this event` 死链、CTA 与切换钮 side_labels 不一致四项并复验。
- 2026-09-21 研发冷读 9 项口径缺口（合约 Buy · Limit、三选一 No 侧、别名 Side、品类杠杆上限、Suspended、Close-only、case 改号、入口记忆范围、桌面面板抽件）全部收掉；PF-1 部分成交标、RM-1 风险口径做完并在生产复验（三处百分比一致）。
- **Liya 2026-09-21 验收通过，进入交付。**
- 未在生产亲验、靠字典交付的三项：限价自动成交（`useContractLimitFills`）、Close-only、Suspended。
- 仍开放：G5 现货冻结灰条 `Market frozen` 只印一次——等真冻结窗口，不阻塞。

## 12. 涉及文件

**页面**：`src/pages/DesktopTrading.tsx`、`TradingCharts.tsx`、`TradeOrder.tsx`、`OrderPreview.tsx`、`SpotTrading.tsx`、`SpotTradingCharts.tsx`、`SpotTradeOrder.tsx`、`lite/LiteContractTrade.tsx`、`lite/LiteSpotTrade.tsx`、`lite/LiteQuickTrade.tsx`、`App.tsx`、`PortfolioRoutes.tsx`
**组件**：`src/components/surface/SurfaceSwitch.tsx`、`EventsDesktopHeader.tsx`、`MobileTradingLayout.tsx`、`MobileHeader.tsx`、`BottomNav.tsx`、`EventSelectorPanel.tsx`、`EventSelectorSheet.tsx`、`TradeForm.tsx`、`pro/ProContractPanel.tsx`、`pro/ProSpotPanel.tsx`、`pro/ProSpotHeader.tsx`、`pro/ProSpotShared.tsx`、`pro/ProSpotMobileDock.tsx`、`pro/ProTerminalLayout.tsx`、`pro/ProBottomTabs.tsx`、`pro/OrderTypeDropdown.tsx`、`pro/BinarySideToggle.tsx`、`pro/MarketLineRow.tsx`、`trading/OrderStatusBadge.tsx`、`trading/TradeSubmitButton.tsx`、`trading/OrderCard.tsx`、`lite/shared/LimitOrderHint.tsx`、`lite/LiteContractOrderPanel.tsx`、`lite/trade/LiteOrderPanel.tsx`、`MobileRiskIndicator`（`AccountRiskDrawer`）、`portfolio/lite/parts.tsx`
**hook / store**：`src/hooks/useEventSelector.ts`、`useActiveEvents.ts`、`useEvents.ts`、`useSpotTerminal.ts`、`useContractLimitFills.ts`、`useSupabaseOrders.ts`、`useSupabasePositions.ts`、`useRealtimeRiskMetrics.ts`、`useCategoryBoostConfigs`、`useWatchlist.ts`、`contexts/SurfaceContext.tsx`、`stores/useTradeSideStore.ts`、`stores/useAmountModeStore.ts`
**lib / service**：`src/lib/contractGate.ts`、`eventSelector.ts`、`fixtureMarkets.ts`、`positionIntent.ts`、`proHandoff.ts`、`autoClosePrice.ts`（`MM_RATIO`）、`tradingUtils.ts`、`liteSideName.ts`、`eventUtils.ts`、`services/tradingService.ts`（`netWin` / `winningCommission` / `fillContractLimitOrder`）
**字典**：`src/pages/StyleGuide/sections/ProSpotSection.tsx`、`TradeStatesSection.tsx`、`SpotStatesSection.tsx`、`MobilePatternsSection.tsx`、`preview/proTradePreviews.tsx`、`proSpotPreviews.tsx`、`surfacePreviews.tsx`、`registry.tsx`、`scripts/sg-audit-baseline.json`
**后端**：无新表、无新函数；`trades.reduce_only` 列（`supabase/migrations/20260910105544_*.sql`）、`settle_spot_event` 重写、`freeze_expired_events()` + pg_cron 为前序轮次已落；本程序只改 `category_boost_configs` 数据。

## 13. 轮次代号 ↔ 章节

| 代号 | 白话含义 | 本文章节 | 原文档（已并入本文，仅留档） |
|---|---|---|---|
| SW / SW-2 / FIX8 | Lite·Pro 开关、路由收敛、游客恒 Lite、Pro 入口脚注 | §2 §3 | `docs/delivery/surface-switch-v1.md` |
| ES | Standard / Boost 事件选择器 | §4 | `docs/delivery/event-selector-v1.md` |
| SL / SL-P2 | 比赛市场行、线位、别名 side_labels | §5.1 | `docs/delivery/pro-sports-lines-v1.md` |
| CT | 合约面板 Buy · Sell（Sell 只减仓） | §5.2 §5.3 | `docs/delivery/pro-trade-sell-v1.md` |
| QO | 按张数 / 份额下单 | §5.2 §6 | `docs/delivery/pro-order-units-v1.md` |
| DK | 不可下单态、dock 禁用条 | §5.4 §5.5 | `docs/delivery/pro-order-gate-v1.md` |
| PF → OS | 订单状态标、部分成交明细 | §5.6 | `docs/delivery/order-status-partial-fill-v1.md` |
| RM | Risk Ratio = MM / Equity | §5.7 | `docs/delivery/risk-ratio-mm-v1.md` |
| SP（SP-1…SP-3、FIX、SP-L） | 现货费率 V4、Pro 现货终端桌面与手机 | §6 | `docs/delivery/spot-pro-v1.md` |
| V4 清理 | Funding / Isolated 删除、To win 净利 | §5.2 §9 | `docs/delivery/pro-trade-v4-cleanup-v1.md` |
| TC（交易页收尾 #1–#10） | 合约 Buy · Limit、三选一 No 侧、品类杠杆、Suspended、Close-only、面板抽件 | §5.2 §5.5 §5.7 §7 | `docs/delivery/trade-close-out-v1.md`（口径冲突时以此为准） |
| 验收 | 联合验收单 | §11 | `docs/delivery/trade-lite-pro-acceptance-v1.md` |
