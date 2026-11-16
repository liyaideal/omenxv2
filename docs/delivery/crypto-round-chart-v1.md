# 加密涨跌轮走势图：实时价 + 结算价 — 交付说明 v1（2026-11-16）

> **通俗导读**：BD 转来 affiliate 的反馈——BTC 5 分钟轮的走势图"看起来有延迟"：涨的报价已经从 10% 到 30%，图上的线才动。
> 数据其实没有延迟。图上那条线画的是**结算价**（Chainlink 的 60 秒平均价，输赢按它算），用户以为它是交易所那种实时价。实时价猛拉一下，60 秒平均价要过几十秒才慢慢跟上，而报价是大家盯着实时价报出来的，所以报价先动、线后动。
> 页面上原来没有任何地方说明这条线是什么。这次改成：
> 1. 走势线画**实时价**（用户本来就以为是这个）；
> 2. **结算价**画成一条白色横线，带标签，和 Price to beat 虚线上下一比就知道现在谁领先；
> 3. 图上方一行直接写结论（现在谁领先），图下方一句话说明结算价为什么比实时价慢。

## 0. 查什么去哪儿

- 长什么样 → 生产页：任意加密涨跌轮，例如 `/trade?event=crypto-btc-updown-5m-1`（会自动跳到当前这一轮）
- 什么时候变成什么样 → `/style-guide` → Lite → 现货交易页 → `SP-7` / `SP-7b` / `SP-7c`（SP-6 是页签切换）
- 字段、文案、术语 → `docs/copy-dictionary.md` 的 `Intraday rounds` 一节 → 本文；术语对照见词典顶部「Lite 术语对照表」
- 规范 → `DESIGN.md` §Addendum 2026-11-16 · 加密涨跌轮走势图

## 0.1 字典怎么看

| 步 | 做什么 | 看到什么 |
|---|---|---|
| 1 | 打开 `https://omenxv2.lovable.app/style-guide`（不用登录） | Lite 组里的现货交易页节点 |
| 2 | 页头搜索框敲 `SP-7` | 三张样张：前半轮 Down 领先 / 后半轮 Up 领先 / 本轮结束 |
| 3 | 每张样张 | 真组件，桌面一排、手机一排；下面的表写「状态 / 触发条件 / 视觉 / 数据来源」 |
| 4 | 单张看 | `/style-guide/preview?c=spot-sp7`（另有 `spot-sp7b`、`spot-sp7c`） |

字典里的三张是定住的画面；生产页上线会每秒往前长。

## 1. 范围

- 所有加密涨跌轮：5m / 15m / 1h / 4h / 1D，桌面和手机，合约（Boost）和现货两种下单方式的页面都一样。
- 只改走势图卡片的**价格页签**和页头的价格数字。`Up odds ¢` 页签不变。
- 股票日轮**不改**：它按收盘价算，没有平均价的问题。

## 2. 图上有什么

| 元素 | 规则 |
|---|---|
| 走势线 | 白色粗线 = **实时价**，从本轮开始画到现在；横轴是整轮的时间（用户本地时间），线没画到的右边留空。线末端每秒更新；整条线上的点数约 300 个（5 分钟轮一秒一个点，1D 轮约 5 分钟一个点） |
| 线末端 | 白点 + `Live price $64,468.68`；线走过图宽 55% 以后，这行字翻到白点左边 |
| 结算价 | 白色横线 + 白底标签 `Settlement price $64,498.94`。数值 = 最近 60 秒实时价的平均，所以它跟着实时价走、但慢一点 |
| Price to beat | 灰色虚线 + `Price to beat $64,501.47`，和原来一样；**手机上原来不带文字，这次带上**（两条横线要靠名字区分） |
| 两个横线标签的位置 | 线末端在图宽 55% 以内时都靠右，超过后都靠左（靠左时会盖在已经画过的线上，标签是实底的，字不受影响）；结算价在目标价上面时，结算价标签在自己那条线的上方、Price to beat 的字在虚线下方，反过来则相反——两个标签不会挤在一起 |
| 悬停（桌面） | 提示框显示那一刻的本地时间和 `Live price $x` |

## 3. 图上方的结论行

`Settlement price now` + 大号金额 + `$2.53 below the price to beat ·` + `Down is ahead`

- 结算价 > Price to beat → `above` + `Up is ahead`（青色）；否则 `below` + `Down is ahead`（柠檬色）。颜色和选边按钮一致。
- 两个价格印出来到分都一样时：`level with the price to beat · Down is ahead`（和结算规则一致：高于才算 Up），不写 `$0.00 below`。
- `Up` / `Down` 两个词用的是页面选边按钮上的词（Lovable 这两个按钮目前是英文；正式版按钮是什么词这里就是什么词）。
- 本轮结束后：`Final settlement price` + 金额 + `… ·` + `Up won` / `Down won`。

## 4. 图下方的说明

常驻一句：`The settlement price is a 60-second average of the price from Chainlink, so it follows the live price with a short delay. It decides Up or Down.`

## 5. 页头的价格

标题下面那个价格数字改成**实时价**（和走势线末端是同一个数）；旁边的涨跌百分比按实时价相对本轮开盘价算。结算价不再出现在页头，它在图上方的结论行里。

## 6. 文案（7 种语言已入 `src/locales/*.json`，都在 `spot` 下）

| key（前缀 `screen.lite_underlying_price_chart.`） | en | zh-CN |
|---|---|---|
| `settlement_now` | Settlement price now | 当前结算价 |
| `settlement_final` | Final settlement price | 最终结算价 |
| `settlement_tag` | Settlement price {{price}} | 结算价 {{price}} |
| `live_price` / `live_tag` | Live price / Live price {{price}} | 实时价 / 实时价 {{price}} |
| `price_to_beat_tag` | Price to beat {{price}} | 目标价 {{price}} |
| `below_price_to_beat` / `above_price_to_beat` | {{amount}} below / above the price to beat | 比目标价低 / 高 {{amount}} |
| `level_with_price_to_beat` | level with the price to beat | 与目标价持平 |
| `side_ahead` / `side_won` | {{side}} is ahead / {{side}} won | {{side}} 领先 / {{side}} 获胜 |
| `settlement_note` | 见 §4 | 结算价是 Chainlink 的 60 秒平均价，所以会比实时价慢一点跟上。涨跌按结算价判定。 |

## 7. Lovable 和正式版的边界

| 项 | Lovable | 正式版 |
|---|---|---|
| 实时价 | 演示数据（`demoLiveAt`，按轮次固定的一条波动线） | 接真实的实时行情（Chainlink 即时价或交易所价，研发定来源并在本文补一行） |
| 结算价 | 演示实时价最近 60 秒的平均（`demoSettlementAt`） | Chainlink 60 秒平均价，也就是现在走势图用的那个数 |
| Price to beat | `events.base_price` | 不变（开盘那一刻的 60 秒平均价） |
| 判输赢 | 演示引擎给每轮随机定结果，和图上的演示结算价**不是同一个来源**——所以一轮结束到换下一轮的那一两秒，图上的 `Final … won` 可能和上方轮次条、实际派奖对不上。这是演示数据的限制 | 不变：到点那一刻的结算价和 Price to beat 比；`Final settlement price` 必须用后端返回的那个结算价，不要前端自己算 |
| 卡片右上 `1H / Today / 1W` | 涨跌轮上不显示（那是股票日图的档位） | 同左 |

**正式版要保证的一件事**：结论行里的"谁领先"、白色横线的位置、最后的判定，三者用的是**同一个结算价**。实时价只用来画线和页头数字，不参与判定。

## 8. 代码位置

| 内容 | 文件 |
|---|---|
| 价格页签（走势线、两条横线、结论行、底注） | `src/components/lite/trade/RoundPricePanel.tsx` |
| 演示实时价 / 结算价 | `src/components/lite/trade/roundLivePrice.ts` |
| 走势图卡片（传了 `round` 就走上面那套，不传就是原来的股票图） | `src/components/lite/trade/LiteStockChart.tsx` |
| 页面接线、页头价格 | `src/pages/lite/LiteQuickTrade.tsx` |

## 9. 测试用例

| # | 操作 | 应该看到 |
|---|---|---|
| 1 | 打开 BTC 5 分钟轮 | 走势线每秒往右长一点，末端白点旁写 `Live price`；白色横线带 `Settlement price` 标签；虚线带 `Price to beat` |
| 2 | 看结论行 | 金额等于白色横线标签上的金额；白线在虚线上面时写 `Up is ahead`，下面时写 `Down is ahead` |
| 3 | 页头价格 | 等于线末端 `Live price` 的金额 |
| 4 | 线末端过图宽 55% | 两个横线标签从右边换到左边，`Live price` 字翻到白点左边 |
| 5 | 等这一轮结束 | 结论行变成 `Final settlement price … Up won / Down won` |
| 6 | 切到 `Up odds ¢` 页签再切回来 | odds 页签和原来一样；切回来还是新的价格图 |
| 7 | 手机宽度 | 同上；Price to beat 虚线带文字 |
| 8 | 15m / 1h / 4h / 1D 轮、ETH / SOL 等其他币 | 同一套 |
| 9 | 股票日轮页面 | 没有变化 |
| 10 | 切 7 种语言 | 结论行放不下时自动换行，不溢出；图上的标签不被裁掉 |

## 10. 这次没动、但相关的地方（已知）

| 位置 | 现状 | 说明 |
|---|---|---|
| 首页行情条、首页 / Crypto 品类页的币卡、手机 Intraday 模块 | 各自的演示价，和轮次页页头的实时价不是同一条 | Lovable 的演示数据各算各的；正式版这些地方和轮次页页头应接同一个实时行情 |
| 百家乐桌面模式（`LiteQuickTable`，5m / 15m 开关打开时） | 仍是原来的走势，没有结算价横线 | 这次范围是普通轮次页；桌面模式要不要同样处理待定 |
| 轮次页下方规则卡 `Settles Up if BTC's price at the end of the round is above the round open` | 没改 | 建议改成用 settlement price / price to beat 两个词，待 CPO 定文案 |

