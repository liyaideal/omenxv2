# 用券之后：券单卡、平仓面板、平仓后引导（Lite Voucher call）— 交付说明 v1

> **通俗导读**：新 BD 反馈「用了 Position Voucher 之后不知道发生了什么」——兑完券被扔到交易页，持仓卡长得和自己花钱买的一样（还写着 Put in / Now worth），平仓弹窗有百分比滑杆，平完只有一条提示，没有任何下一步。这一轮把 Lite 上「用券之后」整条线重做：
> 1. 兑换成功：顶部提示写清「买了哪一边 + 是用券付的」，带 `View your call` 按钮（和普通下单同一套）。
> 2. 交易页上券单有自己的一张卡：券面值 / 现在平仓能拿多少 / 最多能拿多少 / 最晚什么时候自动平。
> 3. 平仓面板只有两种样子：有利润（一个大数字 + 一个按钮）和没利润（劝留 + `Close anyway`）；券单只能全平，没有比例。
> 4. 平仓之后出一个结果层：拿到多少、去哪找、下一步（充值 / 逛市场 / 回券页 / 再用一张）。
> 5. Portfolio 里券单那一行换成券的算法（不写 Now worth、不显示负数）。
> 6. 券兑在 Standard 事件上 = 按面值下的一笔现货单，全程不出现倍数。
> 7. 顺带两件：全站「Add money / add funds」统一成 `Top up`（6 条文案 × 7 语）；多盘口事件上普通买入的成功提示要写出是哪个选项。
>
> 范围：Lite 的 Boost 事件页 `/trade`、Standard 事件页 `/spot`、加密涨跌轮页、`/portfolio`、券兑换页。Pro 终端的券单平仓弹窗不变（只是 Standard 券单不再写 `5x`）。

## 改前改后

这一节给所有人看；后面的章节是给研发和测试的细则。

| 排 | 位置 | 改前 | 改后 |
|---|---|---|---|
| ① | 兑换成功后的提示 | `Voucher redeemed` / `Your position is now active.`，没有按钮 | `Bought 76ers` / `Paid with your $2.00 voucher` + `View your call` 按钮 |
| ② | 交易页上的券单 | 和普通持仓同一张卡：Put in / Now worth / Profit / Auto-close，还写着 `Can lose up to $10.11` | 独立的券卡：VOUCHER / PROFIT NOW / MAX PROFIT / CLOSES BY，标题带 VOUCHER 标 |
| ③ | 点 Cash out | 普通持仓的平仓确认：`You get back ≈ $2.08` + 25% / 50% / 100% | 两种面板：有利润 / 没利润 |
| ④ | 平仓之后 | 一条提示，页面停在原处 | 结果层：金额 + 去哪找 + 下一步按钮 |
| ⑤ | Portfolio 券单行 | 按普通持仓算：Now worth `$2.00`、`If it wins → +$10.44 · can lose up to $10.02` | Put in 下写 `voucher`、Now worth `—`、Profit 不为负、`If it wins → +$1.00` |
| ⑥ | 券兑在 Standard 事件上 | 仍按 5× 算，卡片和弹窗写倍数 | 按面值下现货单（1×），任何地方不写倍数，进 Portfolio 的 Standard 页签 |
| ⑦ | 余额不够的提示 | `Add money to your Boost balance…`、toast 按钮 `Add funds` | `Top up your Boost balance…`、按钮 `Top up` |
| ⑧ | 多盘口事件普通买入的提示 | `Bought Yes · $10.00`（看不出是哪个选项） | `Bought ↑$1.5T · Yes · $10.00` |

**① 兑换成功提示**

| 行 | 改前 | 改后 |
|---|---|---|
| 标题 | `Voucher redeemed` | `Bought {这一边}`，如 `Bought 76ers`；多盘口 `Bought Lakers · Yes` |
| 副行 | `Your position is now active.` | `Paid with your $2.00 voucher` |
| 按钮 | 没有 | `View your call`：滚到这张券卡并描边 1.5 秒 |
| 停留 | 约 4 秒 | 6 秒 |

**② 交易页券卡**

| 行 | 改前 | 改后 |
|---|---|---|
| 标题 | `76ers · 5× Boost` | Boost 页 `76ers · 5× Boost` + `VOUCHER` 标；Standard 页 `Up` + `VOUCHER` 标（不写倍数）；多盘口 `Lakers · No · 5× Boost` + 标 |
| 第 1 格 | `PUT IN $2.00` | `VOUCHER $2.00` |
| 第 2 格 | `NOW WORTH $2.08` | `PROFIT NOW +$0.04`；现在是跌的写 `$0.00`，下面小字 `down right now` |
| 第 3 格 | `PROFIT +$0.08`（可以是负数） | `MAX PROFIT $1.00` |
| 第 4 格 | `AUTO-CLOSE None`，下面 `Can lose up to $10.11` | `CLOSES BY Nov 21, 18:13` |
| 按钮 | `Cash out · $2.08` | 有利润 `Cash out · keep +$0.04`；没利润 `Cash out` |
| 位置 | 混在普通持仓卡里 | 排在普通持仓卡前面，单独一张 |

**③ 平仓面板**

| 行 | 改前 | 改后 · 有利润 | 改后 · 没利润 |
|---|---|---|---|
| 标题 | `Cash out` | `Cash out` + `VOUCHER` 标 | 同左 |
| 主体 | `Cashing out 100% of your … call.` / `You get back ≈ $2.08`（把券面值也算成能拿回的钱） | `Profit so far on your 76ers call` → 大字 `+$0.04` → `Cash out now and it's yours.` | `No profit right now` / `on your 76ers call` / 一段说明 |
| 第二行 | — | `Keep it open and it can earn up to` … `$1.00` | — |
| 按钮 | `Cancel` + `Cash out ≈ $2.08` | `Cash out · keep +$0.04` | `Keep it open` + `Close anyway` |
| 比例 | 25% / 50% / 100% | 没有比例（券单只能全平） | 同左 |

**④ 平仓之后**

| 行 | 改前 | 改后 · 有利润 | 改后 · 没利润 |
|---|---|---|---|
| 形式 | 一条提示 | 结果层（桌面居中弹窗 / 手机底部抽屉） | 同左 |
| 文案 | 普通平仓提示 | `+$0.10` / `profit from this voucher` / `You can find it under Voucher earnings.` | `Voucher call closed` / `No profit this time.` |
| 引导句 | — | 账户里没钱 `Ready for the next one? Top up and you're in.`；有钱 `Ready for the next one?` | 同左 |
| 主按钮 | — | 没钱 `Deposit`；有钱 `Browse events` | 同左 |
| 次按钮 | — | `Go to Vouchers` | 还有别的券 `Use another voucher`；没有且没钱 `Browse events`；没有且有钱不显示 |
| 分享海报 | — | 不自动弹 | 不弹 |

**⑤ Portfolio 券单行**

| 行 | 改前 | 改后 |
|---|---|---|
| PUT IN | `$2.00` | `$2.00`，下一行小字 `voucher` |
| NOW WORTH | `$2.00` | `—` |
| PROFIT | 按普通持仓算，可以是负数 | `+$0.04` / `$0.00`（不显示负数） |
| 赢了能拿 | `If it wins → +$10.44 · can lose up to $10.02` | `If it wins → +$1.00` |
| 页签 | 一律在 Boost | 券所在事件是 Standard → Standard 页签；否则 Boost |

## 0. 查什么去哪儿

- 长什么样 → 生产页：券页 `/rewards?tab=vouchers` 兑一张券 → 跳到的交易页；`/portfolio`
- 什么时候变成什么样 → `/style-guide` → Lite → `交易页`「③c 券单」TR-37 … TR-40、TR-35c；`Portfolio` PF-13b
- 字段名、文案、公式 → `docs/copy-dictionary.md` › Vouchers 表「Voucher call（Lite 券单）」一组、Trading 表「Top up」→ 本文
- 交易口径对照（杠杆 / 强平 / 保证金 ↔ Lite 的说法）只维护在 copy-dictionary 顶部「Lite 术语对照表」。

### 0.1 字典怎么看

| 步 | 做什么 | 看到什么 |
|---|---|---|
| 1 | 打开 `https://omenxv2.lovable.app/style-guide`（不用登录），搜 `TR-37` | 券卡四种：Boost 赚着 / Boost 没利润 / Standard / 多盘口 |
| 2 | `TR-38` / `TR-38b` | 兑换成功提示（两方事件 / 多盘口） |
| 3 | `TR-39` / `TR-39b` / `TR-39c` | 平仓面板：有利润 / 没利润 / 多盘口 |
| 4 | `TR-40` … `TR-40f` | 平仓之后六种按钮组合（见 §1.5 的表） |
| 5 | `TR-35c` | 多盘口事件普通买入的提示 |
| 6 | `PF-13b` | Portfolio 券单行（桌面行 + 手机卡） |
| 7 | 单张看 | `https://omenxv2.lovable.app/style-guide/preview?c=trade-tr37`，切语言加 `&lang=ru` |

弹层在字典里是画在页面里的（方便一页看全）；生产是桌面居中弹窗、手机底部抽屉。

## 1. 规则

### 1.1 这一边怎么叫（全程同一个写法）

| 事件 | 写法 | 例 |
|---|---|---|
| 两方事件（球队 / Up-Down / Yes-No） | 那一边的名字 | `76ers`、`Up`、`Yes` |
| 多盘口事件（一个事件多个选项，每个选项有 Yes / No） | `{选项} · Yes` 或 `{选项} · No` | `Lakers · No`、`↑$1.5T · Yes` |

颜色跟 Yes / No 走（Yes 侧青色、No 侧 lime，沿用交易页选边色）。提示、券卡、平仓面板、Portfolio 都用这一个写法。

### 1.2 兑换成功提示

1. 兑换成功后跳到该事件的交易页（Boost 事件 `/trade`，Standard 事件 `/spot`，沿用现有跳转），页面顶部出提示。
2. 标题 `Bought {这一边}`；副行 `Paid with your {面值} voucher`；按钮 `View your call`。
3. 样式、停留 6 秒、点按钮滚到卡片并描边 1.5 秒——和普通下单成功提示完全同一套（见 `placed-toast-view-call-v1.md`）。
4. 旧提示 `Voucher redeemed` 不再出现。

### 1.3 券卡

1. 券单不进普通持仓卡列表，单独一张卡，排在普通持仓卡前面。同一事件同时有券单和自己买的单时，两张卡都在。
2. 标题：Boost 事件 `{这一边} · 5× Boost` + `VOUCHER` 标；**Standard 事件只写 `{这一边}` + `VOUCHER` 标，不写倍数**。
3. 四格：

| 格 | 值 | 说明 |
|---|---|---|
| VOUCHER | 券面值 | 如 `$2.00` |
| PROFIT NOW | 现在平仓能拿到的钱（见 §2） | 有利润绿色 `+$0.04`；没有写 `$0.00`，下面小字 `down right now`（仅当现在是亏的） |
| MAX PROFIT | 这一笔最多能拿的钱 = 券的上限和「这一边全赢能赚到的数」里小的那个 | 一般是 `$1.00`；Standard 券单 80¢ 买入时全赢只有 $0.50，就写 `$0.50` |
| CLOSES BY | 券单自己的最晚时间和事件结束时间里早的那个 | 用户本地时区，`Nov 21, 18:13`；Standard 页手机上日期、时间分两行 |

4. 按钮：有利润 `Cash out · keep +$0.04`；没利润 `Cash out`。按钮下面没有说明句。
4b. 券卡的骨架跟同一页的普通持仓卡一致：Boost 事件页——这一边是彩色文字，手机上四格排成两行两列；Standard 事件页和加密涨跌轮页——这一边是小色块，四格永远排成一行（手机也是），手机上 CLOSES BY 的日期和时间分两行（日期、时间各自按当前语言格式化，不是把一整串拆开）。加密涨跌轮现在是合约轮（有 Boost），券单是 5×，色块后面照写 `5× Boost`（字典 TR-37e）；Standard 事件页不写倍数。
5. 没有 Put in / Now worth / Auto-close / 最多会亏（券单不花用户的钱，也不会亏）。
6. 加密涨跌轮页：只显示当前这一轮的券单。这一页的 Market activity 在合约轮照常写倍数，只有老的现货轮和 Standard 事件页不写。

### 1.4 平仓面板

1. 桌面居中弹窗，手机底部抽屉。标题行 `Cash out` + `VOUCHER` 标。
2. 只有两种样子，按「现在平仓能拿到的钱」四舍五入后够不够 1 美分来分（见第 6 条）：

| | 有利润 | 没利润 |
|---|---|---|
| 第一行 | `Profit so far on your {这一边} call`（这一边加粗、带色） | `No profit right now` |
| 大字 | `+$0.04` | — |
| 说明 | `Cash out now and it's yours.` | `on your {这一边} call` + `Close it now and you get nothing; your balance isn't touched. Keep it open and it can still end in profit before it settles.` |
| 一行对比 | `Keep it open and it can earn up to` … `$1.00` | — |
| 按钮 | `Cash out · keep +$0.04`（主色实心） | 两个并排：`Keep it open`（主色实心，关掉面板）+ `Close anyway`（描边，继续平仓） |

3. 券单只能全平：没有 25 / 50 / 100、没有滑杆、文案不写百分比。
4. 面板里的数字跟着价格实时变；最终入账以平仓那一刻的价格为准，可能和点按钮前看到的差几分钱。
5. 平仓失败（任何原因）：面板不关，出提示 `Could not cash out`，不把服务端报错原文给用户看。
6. 「有利润」的门槛是四舍五入后至少 1 美分；不到 1 美分按没利润处理（券卡、面板、结果层、Portfolio 同一个门槛），不会出现 `+$0.00`。

### 1.5 平仓之后

平仓成功后同一个位置换成结果层（桌面弹窗 / 手机抽屉）。**不再出旧的平仓提示，不自动弹分享海报。**

| 字典 | 结果 | 账户里有没有钱 | 还有没有别的券 | 文案 | 引导句 | 主按钮 | 次按钮 |
|---|---|---|---|---|---|---|---|
| TR-40 | 有利润 | 没有 | — | `+$0.10` / `profit from this voucher` / `You can find it under Voucher earnings.` | `Ready for the next one? Top up and you're in.` | `Deposit` | `Go to Vouchers` |
| TR-40b | 有利润 | 有 | — | 同上 | `Ready for the next one?` | `Browse events` | `Go to Vouchers` |
| TR-40c | 没利润 | 没有 | 有 | `Voucher call closed` / `No profit this time.` | `…Top up and you're in.` | `Deposit` | `Use another voucher` |
| TR-40d | 没利润 | 没有 | 没有 | 同上 | 同上 | `Deposit` | `Browse events` |
| TR-40e | 没利润 | 有 | 没有 | 同上 | `Ready for the next one?` | `Browse events` | 不显示 |
| TR-40f | 没利润 | 有 | 有 | 同上 | `Ready for the next one?` | `Browse events` | `Use another voucher` |

- 「账户里有钱」= Boost 余额或 Standard 余额任意一个向下取整 ≥ $1（和下单卡「余额不够」同一个门槛）。
- 「还有别的券」= 用户还有可领或可兑的券。
- `Browse events` 和 Portfolio 空态的按钮是同一个词（2026-11-19 统一，原来写 `Browse markets`）。
- `Deposit`：桌面原地弹充值弹窗，手机进 `/deposit`。`Browse events` → `/events`。`Go to Vouchers` / `Use another voucher` → 券页。
- 金额是实际入账的数。文案不区分即时到账券和分档到账券（两种都说 `You can find it under Voucher earnings.`）。

### 1.6 Portfolio

见「改前改后 ⑤」。补充：券单行不显示「最多会亏」；点 `Cash out` 进该事件的交易页，在券卡上平仓；Portfolio 的批量 Cash out 选不中券单行（券单只能在券卡上一张一张平）。

Portfolio 顶部的汇总数（Put in / Now worth / Profit）不算券单（券不是用户的钱）；`N calls` 的笔数仍包含券单。

### 1.7 券兑在 Standard 事件上

**规则只有一条：Standard 事件上的券 = 按券面值下的一笔现货单。** 没有杠杆，利润 = 份数 ×（现价 − 买入价），仍受这张券的最大利润封顶，亏了不扣用户的钱。券卡、平仓面板、结果层、Portfolio、提示里都不出现倍数或 Boost 字样。Boost 事件上的券仍是 5×。

怎么判断：看券兑换到的事件的产品线，含现货 → 按现货算；否则按合约 5× 算。

### 1.8 Top up（6 条文案）

| key | 改前 | 改后 |
|---|---|---|
| `trade › screen.lite.lite_contract_order_panel.low_balance_hint` | `{{link}} to your Boost balance to make a call.` | `{{link}} your Boost balance to make a call.` |
| `trade › …low_balance_link` | `Add money` | `Top up` |
| `spot › screen.lite_spot_order_panel.low_balance_hint` | `{{link}} to your Standard balance to place an order.` | `{{link}} your Standard balance to place an order.` |
| `spot › …low_balance_link` | `Add money` | `Top up` |
| `wallet › insufficient_toast.message` / `.add_funds` | `Not enough balance — add funds to continue` / `Add funds` | `Not enough balance — top up to continue` / `Top up` |
| `notifications › autoclose.tight.body` / `autoclose.soon.body` | `Boost usage {{ratio}} · add funds or cash out` | `Boost usage {{ratio}} · top up or cash out` |

7 种语言都换了（中文「充值 / 儲值」、日文「入金」、韩文「입금」）。行为不变，只换词。按钮 `Deposit` 不变。

### 1.9 多盘口事件普通买入的提示

多盘口事件（一个事件多个选项）上普通买入，成功提示标题里的这一边写成 `{选项} · Yes|No`：`Bought ↑$1.5T · Yes · $10.00`。两方事件不变。副行、按钮、停留时间不变。字典 TR-35c。

## 2. 数字口径

现在平仓能拿到的钱（PROFIT NOW、面板大字、Portfolio 的 PROFIT 同一个数）：

```
份数     = 面值 × 倍数 ÷ 买入价          （Boost 事件倍数 = 5，Standard 事件倍数 = 1）
浮动盈亏 = 份数 × (现价 − 买入价)         （买入价、现价都是买的那一边的价格）
最大利润 = min(券的上限, 这一边全赢时的浮动盈亏)；券的上限 = 券上写的数，没写就是 面值 × 上限比例（默认 50%）；全赢 = 份数 × (1 − 买入价)
能拿到   = 浮动盈亏，小于 0 按 0，大于最大利润按最大利润
```

例：$2 券兑在 Boost 事件、买入价 0.5534、现价 0.5587 → 份数 18.07，浮动盈亏 +$0.0958，显示 `+$0.10`，最大利润 $1.00。

## 3. 文案

新增 27 条，命名空间 `vouchers`，前缀 `lite.`，7 语齐。主要几条：

| key | 英文 |
|---|---|
| `lite.mark` | `Voucher`（标，显示成大写） |
| `lite.card.voucher` / `profit_now` / `max_profit` / `closes_by` / `down_now` | `Voucher` / `Profit now` / `Max profit` / `Closes by` / `down right now` |
| `lite.cash_out_keep` | `Cash out · keep {{amount}}` |
| `lite.toast.bought` / `lite.toast.paid_with` | `Bought {{leg}}` / `Paid with your {{amount}} voucher` |
| `lite.panel.profit_on` / `yours` / `keep_open_up_to` | `Profit so far on your {{leg}} call` / `Cash out now and it's yours.` / `Keep it open and it can earn up to` |
| `lite.panel.no_profit` / `on_call` / `no_profit_body` | `No profit right now` / `on your {{leg}} call` / `Close it now and you get nothing; …` |
| `lite.panel.keep_open` / `close_anyway` | `Keep it open` / `Close anyway` |
| `lite.done.profit_from` / `find_it` | `profit from this voucher` / `You can find it under Voucher earnings.` |
| `lite.done.closed` / `no_profit` | `Voucher call closed` / `No profit this time.` |
| `lite.done.nudge_deposit` / `nudge_funded` | `Ready for the next one? Top up and you're in.` / `Ready for the next one?` |
| `lite.done.browse` / `go_to_vouchers` / `use_another` | `Browse events` / `Go to Vouchers` / `Use another voucher` |
| `lite.close_failed` | `Could not cash out` |

`Deposit`、`Cash out`、`View your call` 沿用已有 key。

## 4. 研发核对清单

| # | 改什么 | 详见 | 字典 |
|---|---|---|---|
| 1 | 兑换成功提示换成 `Bought … / Paid with your $X voucher` + `View your call`，旧提示去掉 | §1.2 | TR-38 / TR-38b |
| 2 | 交易页券卡（Boost / Standard / 加密涨跌轮三种页）；券单不进普通持仓卡列表 | §1.3 | TR-37 … TR-37d |
| 3 | Standard 页券卡不写倍数 | §1.3、§1.7 | TR-37c |
| 4 | 平仓面板两种样子，没有比例 | §1.4 | TR-39 … TR-39c |
| 5 | 平仓之后的结果层 + 六种按钮组合；不出旧提示、不弹海报 | §1.5 | TR-40 … TR-40f |
| 6 | 这一边的写法（多盘口 `{选项} · Yes/No`）全程一致 | §1.1 | TR-37d / TR-38b / TR-39c |
| 7 | Portfolio 券单行；Standard 券单进 Standard 页签 | §1.6 | PF-13b |
| 8 | ⚠ 后端：Standard 事件上的券按面值下现货单（不是 5×），结算与平仓入账同口径 | §1.7、§2 | — |
| 8b | Portfolio 顶部汇总不算券单；MAX PROFIT 取上限与全赢里小的；CLOSES BY 取券到期与事件结束里早的 | §1.3、§1.6、§2 | TR-37 / PF-13b |
| 9 | Top up 6 条 × 7 语 | §1.8 | TR-30 |
| 10 | 多盘口事件普通买入提示带选项名 | §1.9 | TR-35c |
| 11 | 27 条新文案 7 语 | §3 | — |

## 5. 边界（哪些是 Lovable 的演示写法，正式版不用照搬）

- Lovable 里券单的开仓、估值、平仓入账是演示模拟（前端按 §2 算、演示函数 `close-trial-position` 和演示定时任务按同一公式结算）。正式版按真实撮合与结算实现，**只需要保证 §1.7 那条规则和 §2 的封顶口径**。
- 平仓面板上的数字是前端按现价估的；正式版入账以成交为准。
- Lovable 演示里买 No 侧的券单是拿 Yes 侧价格反着算的（份数按 Yes 价），份数在 Pro 面还会取整；所以 Lovable 上 No 侧券单的「全赢能赚到的数」恒等于 面值 × 倍数，MAX PROFIT 永远显示券的上限——这是演示算法的副作用。正式版按 §2 用买的那一边的真实价格和真实份数（例：No 侧 90¢ 买入的 $2 现货券，MAX PROFIT 应是 $0.22），不用照搬。
- Pro 终端的旧券单平仓弹窗没有「全赢」这层封顶（仍只按券上限），和 Lite 可能差一点；这轮没动 Pro。
- 查不到券所在事件时 Lovable 默认按 5× 算；正式版券单本身就带产品线，不存在这个兜底。
- Pro 现货终端和加密涨跌轮的桌面模式不把券单算进「可卖持仓」。
- 「账户里有钱」的门槛（≥ $1）沿用下单卡现有约定。
- Pro 终端的券单平仓弹窗这轮没改样子，只是 Standard 券单不再写 `5x`。

## 6. 这轮没做

- 券页（`/rewards?tab=vouchers`）和兑换选事件页本身没改。
- 没有首单 / 首券庆祝弹窗，没有自动分享海报。
- 「离结算太近的事件不能用券」的规则已取消（和正式版一致）；Lovable 里字段 `min_hours_to_settlement` 保留、值一律 0。
- 开平仓手续费：券单不收（§2 里没有费用项）。

## 附：内部编号对照

| 编号 | 是什么 |
|---|---|
| TR-37 … TR-37d | 券卡四种 |
| TR-38 / TR-38b | 兑换成功提示 |
| TR-39 … TR-39c | 平仓面板 |
| TR-40 … TR-40f | 平仓之后 |
| TR-35c | 多盘口普通买入提示 |
| TR-12 | 原「Voucher 徽标持仓卡」，现指向券卡 |
| PF-13b | Portfolio 券单行 |
