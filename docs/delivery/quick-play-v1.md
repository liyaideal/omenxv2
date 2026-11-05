# Quick Play 专区（/arcade · BTC 30 秒合约）— 交付说明 v1

> **研发交付用的唯一总文档。** 范围：`/arcade` 整页（桌面 + 移动）· 下单 / 结算后端 · 价格指数与报价（正式版规格）· Events「All」入口横幅 · 按「场」分享的海报 · Portfolio › Settled 一场一行 + 场次详情页。
> 决策：Liya（CPO）2026-10 至 2026-11-04 拍板；依据研发稿《BTCUSDT_30秒与1分钟涨跌产品设计_v1.0》+ CPO 修订。
> **风控参数的正式值（熔断阈值、亏损上限、全桌最坏赔付、准备金、关联账户、异常胜率）与合规上线要求，一律以《BTCUSDT_30秒与1分钟涨跌产品设计_v1.0》为准，本文档不写数值。** 本文只写用户看得到的行为和产品口径。
> 状态：Lovable 内测可玩、真下单真记账；Lovable 的行情是模拟的（正式版接真实三所指数，见 §3.3）；文案为英文，未进 i18n。

## 0. 读者须知

查什么去哪儿：
- **长什么样** → 生产页 `/arcade`（机柜）、`/events`（All 页顶部入口横幅）、`/portfolio?tab=settled`（场次行）、`/portfolio/quick-play/<key>`（场次详情）。
- **什么时候变成什么样** → `/style-guide`（不用登录）左栏 Lite → **交易页**，页内小节「/arcade · Quick Play」（AR-1…AR-69 · AB-1 / AB-2 · AS-1…AS-4）；Portfolio 节点的 Ⓛ 区（PF-39…PF-41）。每帧下面一张「状态 / 触发条件 / 视觉 / 数据来源」表。
- **字段、文案、公式、术语** → `docs/copy-dictionary.md` 顶部「Lite 术语对照表」+ 节「Quick Play（/arcade · BTC 30 秒合约 · 流式舞台）」→ 本文档对应章节。
- **视觉规范** → `DESIGN.md` 的 Quick Play 各节；先看「§Quick Play 现行条目索引」，它标明哪几条已被后来的轮次取代。
- **后端哪些是需求、哪些只是演示** → 本文档 §3 + `docs/backend-boundary.md` 的 Quick Play 补录（以最新一节为准）。
- **风控数值 / 合规** → 《BTCUSDT_30秒与1分钟涨跌产品设计_v1.0》。

提问前先按上面顺序查一遍；查不到再提，提问时写明「我查了 X 没有」。

## 0.1 字典怎么看

1. 打开 `/style-guide`，左栏 Lite 组点 **交易页**，本页目录里找「/arcade · Quick Play」；场次行与详情页在 **Portfolio** 节点的 Ⓛ 区。
2. 节点顶部「本页目录」= 小节按产品页从上到下排，右侧是编号范围，点了滚过去。
3. 小节顶部黄框「定位行」= 路由 / 词典节 / 本文档。
4. 每张样张 = 编号 + 状态名 + iframe 里的真组件。桌面机柜按 1440 宽缩到 72% 放进 1040 的框（所以桌面帧都是「≤ 1120 窄桌面」的样子：01 的题牌隐藏、不显示 `$5 SELECTED`），手机帧 375 宽。机柜帧跑的是生产引擎的 fixture 模式（时钟冻结、零网络），可以点：点 UP / DOWN 会提示 `Preview only · play it on /arcade`，点 ⓘ / 路单格 / RULES / 窥条都是真反应。
5. 样张下的表固定四列「状态 / 触发条件 / 视觉 / 数据来源」，触发条件就是判定表达式。
6. 页头搜索框敲 `AR-8` / `PF-40` 或文字，结果「编号 · 名 → 节点 › 小节」，点了落到样张。
7. 单张查看 / 截图：`/style-guide/preview?c=<key>`（key 见 §6）。

编号规则：`AR-n` 机柜（桌面、移动各自编号，§6 写了每个编号是哪一端）；`AB-n` 入口横幅；`AS-n` 分享海报与分享弹层；`PF-39…41` Portfolio 场次，每个带 `-mobile` 手机帧。

**只在字典里看得到的态**（生产凑不出条件）：AR-3 桌子暂停 + 猞猁跑酷（演示桌不会自己暂停，见 §3.3）；AR-1 / AR-11 免责门（每个账号只弹一次）；AR-14 $500 上限；AR-25 / AR-26 券计量条加载中（只有约 1 秒）；AB-1 / AB-2 的「指数无效」；PF-41 跨零点的一场。

## 通俗导读

> 给没读过正文的人的 3 分钟解读；不替代正文，口径以正文为准。

**一分钟看懂**：这不是「一局 30 秒、大家一起等开奖」的轮次产品。**没有「局」，每一枚筹码就是一张自己的 30 秒合约**：你什么时候点下去，就从服务端接单那一刻开始数 30 秒，到点各自结算。

1. **图是一条时间轴**：左边是过去 45 秒的价格，右边 30 秒是未来。每张合约在图上 = 入场小菱形 + 开盘价虚线 + 右边到期时刻一根小杆（到期时间挨近的几张共用一个写着还剩几秒的标签）。到点杆顶翻成实心点（赢）/ 灰空心圈（输）/ 灰横杠（平局退款），原地飘 `+$4.29` / `−$5.00`，筹码飞进余额。**开盘价、收盘价、结算只认指数**；图上的线是为了手感画得更密，见易混点 4。
2. **右边一栏**：这一场第一笔之前看 `LIVE TABLE`（全桌其他人正在跑的单，用户名打码）；第一笔之后换成 `YOUR CALLS`（Open ｜ Settled 两个页签），下面一块 `04 / YOUR RESULT` 记分板。30 分钟没下单，这一场结束，右栏回到 LIVE TABLE。
3. **点下去就锁定，没有撤销、没有提前平仓**。键上的筹码塔 = 这一边正在跑的合约。结算过程中 UP / DOWN 照样能点。
4. **反馈分级**：每张 = 翻牌 + 飘字 + 筹码飞；连赢 2 张出 `COMBO ×2` 小框；连赢 3 / 5 / 6 / 8 / 9 / 12… 张出大字 + 金币雨；**每连赢满 3 张掉一张 $2 仓位券**（每人每天最多 $10）。连输什么都不显示。
5. **记账单位是「一场」**：坐下来玩的这一把，两次下单间隔超过 30 分钟就算下一场。机柜 04 的 SESSION / LAST 10 / SHARE、分享海报、Portfolio 的一行，三处同一条规则。
6. **价格**：BTC 指数 = Binance / Hyperliquid / Coinbase 三家中间价（换算成 USDT 计价）的中位数，机柜上常显三家来源价。

```
用户点 UP ── arcade_place(side, gross, quote_ts) ──► arcade_calls（open；t0 = 接单时刻，t1 = t0 + 30 s；报价与派彩当场锁定）
指数 tick（arcade_index_ticks）──► arcade_settle_due()：S0 = t0 之后第一条有效指数，S1 = t1 及之前最近一条有效指数
                                   └──► won（入账 = 派彩 − 5% 利润佣金）/ lost / void（全额退回）──► transactions + spot_balance
                                   └──► 赢了 → arcade_combo_vouchers(user)：每连赢满 3 张发一张 $2 仓位券
Portfolio：arcade_my_sessions() 按 30 分钟间隔把合约切成「场」──► Settled › Standard 一场一行 ──► /portfolio/quick-play/<key>
```

**一条故事线**（用户小 A）：① 第一次进 `/arcade`，先过四行免责门，点 `I GET IT · START PLAYING`，以后不再弹；② 选 $5 点 UP，筹码立刻进键上的塔，键底注 `Placed ✓ · locked in, settles in 30s`，右栏变成 YOUR CALLS，多一行 `$5 · to win $9.29` / `@ 50.9¢ · open … · 30s`（开仓价要等服务端接单后第一条指数，约 1 秒内填上），右侧第一秒起写 `ahead` / `behind`，图上一个菱形 + 一根杆；③ 点下去就撤不了；④ 再点一张 UP，行尾显示 `ahead`；⑤ 30 秒到，杆顶翻成实心点，`+$4.29` 飘出来、筹码飞进余额，LAST 10 打一个勾；⑥ 连赢三张，金币雨 + 大字 `×3 COMBO` + `+$2 VOUCHER` 飞到券计量条；⑦ 去吃饭，40 分钟后回来再下一单 → toast `New session`，04 的板子归零；⑧ 晚上在 Portfolio › Settled 看到带 QUICK PLAY 小牌的场次行，点进去是三张卡 + 每一张合约的明细；⑨ 点 Share，海报写 `7 of 10 right · Profit +$31.20`。

**概念词典**（每条在 copy-dictionary 有定义行）

| 概念 | 是什么 | 判定表达式 | 一句话类比 |
|---|---|---|---|
| call（一张合约） | 一枚筹码 = 一张自己的 30 秒二元合约 | `arcade_calls` 一行；`t1 = t0 + 30 s` | 一张单独计时的彩票 |
| 报价 p | 买 Up 或 Down 一侧的价格，三位小数，Up + Down = $1.00 | 模型算出 `p_up`，钳在 0.40–0.60；`p_down = 1 − p_up`（§3.1.3） | 赔率 |
| S0 / S1 | 开盘价 = 服务端接单后第一条有效指数；收盘价 = 到期时刻及之前最近一条有效指数 | §3.1.6 | 裁判看的两张照片 |
| to win | 赢了拿回的钱，含本金、已扣 5% 利润佣金 | §3.1.5 的 credit | 彩票面值 |
| void（退款） | 平局或没有有效价，整枚筹码连手续费全退 | `s0 IS NULL OR s1 IS NULL OR s0 = s1` | 比赛取消退票 |
| 一场 session | 坐下来玩的这一把 | 相邻两张下单间隔 `> 30 min` 断场 | 一局麻将 |
| calls / staked / payout / pnl（场） | 到期结算的张数 / 这些张的筹码 / 这些张拿回的现金 / 这一场的净额 | §2.2 | 一局的进出账 |
| best run | 场内按顺序的最长连赢 | 只看 won / lost，void 跳过 | 连胜纪录 |
| COMBO ×n | 当前连赢数，≥ 2 才显示 | 按结算顺序数连续 won；lost 清零；void 跳过不清零；新一场清零 | 跳舞机连击 |
| combo 券 | 每连赢满 3 张掉一张 $2 有门槛仓位券，每人每天 ≤ $10 | §3.1.9 | 连击奖励 |
| 路单 | 每 30 秒一格的 BTC 涨跌记录（珠盘 + 大路），桌子的路，不是个人胜负 | `arcade_road(120)`：格 = 墙钟 :00 / :30，取格内指数开 / 收 | 百家乐路单 |
| LIVE TABLE | 全桌其他人正在跑的单（匿名） | `arcade_table_feed()`；用户名打码 §3.1.10 | 牌桌 |

### 一句话规则

- 进来先过一次免责门（每个账号只弹一次）。RULES 键 / `How the price and odds are made →` 打开七段完整规则。手机上免责门与 RULES 都是**底部抽屉**。
- 选筹码（$2 / 5 / 10 / 25 / 50）→ 点 UP 或 DOWN → 服务端按你看到的那个报价成交；筹码里含 3% 开仓费。
- **没有撤销，没有提前平仓**：点下去就是一张合约，跑满 30 秒。
- 30 秒后结算：S1 > S0 → Up 赢；S1 < S0 → Down 赢；相等或没有有效价 → 全额退回含手续费。
- 赢 = (筹码 − 3%) ÷ 报价，向下取到分，再扣利润的 5%；输 = 筹码没了。
- 限额：单笔 $2–50、单账户未到期合计 ≤ $500、每秒 ≤ 2 笔；桌子暂停时不接新单，已开的照常结算（暂停原因见 §2.3）。
- 连赢每满 3 张掉一张 $2 仓位券，每人每天最多 $10，每天 UTC 零点重置（页面上换成用户本地时间显示），在 Rewards › Vouchers 里领。
- 一场 = 30 分钟没下单就结束；页面开着闲 30 分钟后再下单，04 归零并 toast `New session`；刷新页面时把本人最近 400 张合约按下单时间倒着往回链（相邻间隔 ≤ 30 分钟），链到的就是这一场——和服务端 `arcade_my_sessions` 同一规则，只多一个 400 张的上限（一场超过 400 张时机柜里的数字会少于 Portfolio，接受）。

### 易混点辨析

1. **「看着在上面却判输」**：S0 不是你点的那一刻的价，是服务端接单之后第一条有效指数（堵「用户比我们早半秒看到价格」的漏洞）。图上入场菱形画在 S0 那个指数点上。
2. **三个来源价不一样是正常的**：Binance 是 BTC/USDT，Coinbase 是 BTC-USD，Hyperliquid 是现货 UBTC/USDC（`@142`，不是永续 `BTC`——永续带资金费溢价，实测高约 10 bps）。USD / USDC 报价按 Coinbase 的 USDT-USD 实时汇率换算成 USDT 计价后取中位数，所以指数永远落在三家中间。
3. **报价会跳**：模型看最近 10 分钟的走势，30 秒内跌 4 bps 时 UP 会报到 0.43 左右，这是模型本身的敏感度。前端不因为报价变动闪键，只在被拒单（`Price moved · tap again`）时闪。
4. **线和指数不是一回事**：图上的白线要「一直在细碎地跳」（每 100 ms 一个点），指数是 500 ms 一个点。正式版用真实行情（指数 + 期间的真实成交 / 盘口）画出这个密度，但开仓菱形、✓ / ✕、结算价永远只认指数。Lovable 里的线是演示纹理，不许照抄（§3.3）。
5. **SESSION / LAST 10 / COMBO / best run 全是这一场的**：闲 30 分钟后再下单归零；刷新不丢。void 不进 LAST 10、不算 calls，但单独计数写在场次行与详情页里。
6. **LIVE TABLE 里的人**：正式版**只放真实的其他用户正在跑的单**（打码），后台出数据。Lovable 里桌子冷清时会补匿名模拟单（`kz***88` 这类名字），那是演示用的，正式版不做。
7. **横幅上的 `TIME 00:22` 不是局**：这个产品没有局，它是桌子的 30 秒墙钟格（和路单的格子同步）。
8. **2026-11-04 之前撤过的单**：以前有 2 秒撤单，已删。历史上撤过的单在 Portfolio / 场次详情里照常显示 `cancelled`，那是真实发生过的记录；新单不会再出现这个状态。

## 1. 功能目标

给 Lite 用户一张 24/7 的 BTC 桌：$2–50 一枚筹码压 30 秒后涨或跌，按模型报价成交、按三所指数结算，即点即玩、不锁键、不用等局。机柜是街机皮肤（钢板 + 铆钉 + CRT 屏），桌面四行：头条 / 01 路单 / 02 舞台 + 右栏 / 03 下单。入口在 Events All 顶部横幅；记录按「场」进 Portfolio；分享按「场」出海报。关键约束：报价与结算全在服务端，前端只画；路单（珠盘 + 大路）是营造赌场氛围用的，样子不能改（CPO 11-02）。

## 2. 状态与口径

### 2.1 一张合约（`arcade_calls.status`）

| status | 含义 | 谁写 | 机柜上 |
|---|---|---|---|
| open | 已接单、未到期 | `arcade_place` | YOUR CALLS 一行 + 图上菱形 / 虚线 / 杆；行尾第一秒起 `ahead` / `behind`（S0 出来之前写 `open…`） |
| won / lost | 到期按 S0 / S1 判 | `arcade_settle_due` / `arcade_settle_mine` | 杆顶翻牌、飘字、筹码飞进余额、行进 Settled 页签、LAST 10 一格 |
| void | 平局或没有有效价，全退 | 同上 | 杆顶灰横杠、飘 `VOID`；Settled 行 `void · no valid price · refunded`；不进 LAST 10、不算 calls |
| cancelled | **只剩历史数据**（2026-11-04 前 2 秒内撤回的单） | 无（撤单接口已关闭） | Portfolio / 场次详情照常显示；机柜 Settled 页签里历史上的这类行也会出现（`cancelled · taken back within 2 s`），新单不会再有 |

### 2.2 一场（展示层分组，不落状态）

| 字段 | 口径 |
|---|---|
| session_key | 这一场第一张下单时刻的毫秒时间戳（字符串）；路由 `/portfolio/quick-play/<key>` |
| started_at / ended_at | 首尾下单时刻（`created_at`）；标题 `BTC 30-second calls · Oct 28, 16:47 – 16:53`（跨天 `Oct 28 23:50 – Oct 29 00:12`） |
| last_settled_at | 最后一张结算时刻；Settled 列表按它排序，详情页 `Settled Oct 28, 2026 · 16:53` |
| calls / won / lost | `calls = won + lost`（void / cancelled 不在内） |
| refunded / cancelled | 各自计数；详情页 Details `Not settled` 行有才显示；列表行只在 calls = 0 时显示 |
| best_run | 只在 won / lost 里按下单顺序数最长连赢，void 跳过 |
| biggest_win | won 里最大的 pnl，没有时为 0 |
| staked | won + lost 的筹码合计 |
| payout | won + lost 拿回的现金：`Σ(gross + pnl)`；恒等式 `payout − staked = pnl(won + lost)` |
| fees | won + lost 的 3% 开仓费 + 历史 cancelled 的撤单费（void 的费已退，不计）；详情页 Fees = fees + commission |
| pnl | 所有非 open 单的 pnl 合计（void 为 0；历史 cancelled 为 −撤单费） |
| min_stake / max_stake | 详情页 Stake 行 `$5 – $25 a call`（相同写 `$5 a call`）与 Staked 卡副行 `8 calls @ $5 – $25` |
| active | 最后一张 < 30 分钟前，或还有 open 的 |

**时间**：机柜与 Portfolio 所有时间都是用户本地时间 24 小时制，不带时区后缀（Lite 全站规则）。

### 2.3 桌态（`arcade_table_state.paused_reason`）

暂停 = 不接新单，**已开的照常结算**。暂停时 UP / DOWN 置灰、报价显示 `—`、图表盖遮罩、不画预览线；桌面猞猁窗变成小恐龙跑酷（手机没有跑酷）。

| reason | 什么时候 | 桌面遮罩（标题 / 副行） | 手机遮罩 | 键底注 | 点键被拒时 |
|---|---|---|---|---|---|
| `index` | 指数无效（有效来源 < 2 等，§3.1.2），或最新 tick 过期 | `TABLE PAUSED` / `Index invalid · waiting for the exchanges` | `PAUSED` / `Index invalid` | `Table paused · index invalid` | `Table paused` |
| `breaker` | 价格急跳熔断（阈值与冷却时间见研发稿） | `TABLE PAUSED` / `BTC is moving too fast · back in a moment` | `PAUSED` / 同左副行 | `Table paused · market moving too fast` | `Table paused` |
| `loss` | 平台全天亏损上限（数值见风控文档） | `TABLE PAUSED` / `Daily limit reached · back tomorrow` | `PAUSED` / 同左副行 | `Table paused · daily limit reached` | `Table paused` |
| `loss_hour` | 平台 60 分钟滚动亏损上限（数值见风控文档；CPO 2026-11-05 批，和全天档分开写） | `TABLE PAUSED` / `Back within the hour` | `PAUSED` / 同左副行 | `Table paused · back within the hour` | `Table paused` |
| `off` | 运营关桌（参数 `live = 0`） | `TABLE PAUSED` / `The table is closed` | `PAUSED` / 同左副行 | `Table closed` | `Table paused` |
| `full` | 全桌最坏赔付到上限（只拦新单） | `TABLE FULL` / `Room opens as calls settle` | `TABLE FULL` / 同左副行 | `Table full · room opens as calls settle` | `Table full · room opens as calls settle` |

- 桌面遮罩下还有一行固定字 `Open calls keep running and settle as normal`；手机没有。
- **谁置位 / 谁清除**：`paused_reason` 由风控引擎写（熔断、亏损上限、全桌最坏赔付的公式、阈值、冷却与恢复条件都在《BTCUSDT_30秒与1分钟涨跌产品设计_v1.0》，本文不复述）；运营关桌是参数 `live = 0`。前端只读它。
- **`index` 的两个来源**：风控引擎置的 `paused_reason = index`，和前端自己判断的「最新 tick 过期 / 无效」——前端两者取或，显示同一套 `index` 文案；服务端下单时以自己的校验（§3.1.4 第 6 条）为准。
- **亏损上限有两档**（60 分钟滚动 / UTC 日，数值见风控文档）：风控引擎分别置 `loss_hour` / `loss`，文案见上表；入口横幅对应 `PAUSED · BACK WITHIN THE HOUR` / `PAUSED · BACK TOMORROW`。
- 跑酷 HUD：`TABLE PAUSED · TAP TO JUMP`（full 时 `TABLE FULL · TAP TO JUMP`）/ `CRASH · TAP TO RETRY` / 分数 `41 · HI 58`。
- **指数无效时**：三家来源价那一行变红（桌面 `FROM …` 行；手机来源格写 `INVALID`）。
- 入口横幅的暂停表现见 §4.7。

### 2.4 断网（用户自己的网络）

断网是**用户自己的网络**的问题，和桌子、指数无关，所以它是一个单独的态，不说成指数无效（CPO 2026-11-05 批，项 11）。

| 条目 | 口径 |
|---|---|
| 什么时候算断网 | 浏览器报离线（`offline` 事件 / `navigator.onLine = false`），或者前端每秒一次的 `arcade_table_now()` **连续 3 次**没回音（≈ 3 秒）。服务端有回应、只是指数无效 → 还是 §2.3 的 `index` 暂停 |
| 桌面图表遮罩 | `CONNECTION LOST` / `Reconnecting… check your internet` / `YOUR OPEN CALLS STILL SETTLE ON OUR SIDE`（第三行替换掉暂停态的 `Open calls keep running…`） |
| 手机图表遮罩 | `OFFLINE` / `Reconnecting…` |
| 来源价 | 三家来源价**不变红**、大价停在最后一条（手机 BTC INDEX 格也停在最后一条，不写 `INVALID`） |
| 键 | UP / DOWN 置灰、报价 `—`、底注 `Offline · reconnecting`；点了不下单 |
| 猞猁窗（桌面） | 照样变跑酷，提示条 `OFFLINE · TAP TO JUMP` |
| 入口横幅 | 副行 `CONNECTION LOST · RECONNECTING…`（§4.7） |
| 恢复 | 第一次请求成功就撤遮罩、键恢复；期间到期的单按服务端结果补翻牌（读一遍本人合约 + 触发一次结算） |
| 页面一打开就离线 | 同上判定；拿不到任何 tick 时大价 `$—` |

字典：AR-31（桌面）/ AR-32（手机）。

## 3. 数据库 / 后端

### 3.1 正式版规格

Lovable 里的实现 = 参考实现，函数可以整文件读（`supabase/migrations/20261028120000_arcade_calls.sql` 为主体，后续迁移见 §7）。**风控相关的阈值数值不在这里**，见研发稿。

#### 3.1.1 参数表 `arcade_params`（key / num / txt / note）

运营可改、改了即时生效、不用改代码。

| key | 含义 | 值 |
|---|---|---|
| `live` | 1 = 开桌，0 = 全桌停新单（paused_reason `off`） | 1 |
| `fee_rate` | 开仓费 | 0.03 |
| `commission_rate` | 赢单利润佣金 | 0.05 |
| `duration_sec` | 合约时长 | 30 |
| `p_min` / `p_max` | 报价钳位 | 0.40 / 0.60 |
| `max_open_per_user` | 单账户未到期合计上限 | 500 |
| `max_calls_per_sec` | 单账户每秒下单数 | 2 |
| `model_intercept` / `model_z30` / `model_z60` | 报价模型系数 β0 / β30 / β60 | 0.010495 / 0.106198 / 0.030205 |
| `min_history_sec` | 起报价需要的历史秒数 | 600（研发稿） |
| `quote_ttl_ms` | 报价有效期 | 500（研发稿） |
| `tick_max_age_ms` | 最新指数多老算过期（前端「报价可用」= 最新 tick 年龄 < `min(tick_max_age_ms, quote_ttl_ms)`） | 见风控文档 |
| `settle_src_age_ms` | S1 必须在 t1 之前多少毫秒内 | 500（研发稿） |
| `settle_wait_ms` | 到期后最多等迟到行情多久 | 2000（研发稿） |
| `drift_max_bps` | 报价那一刻到接单时指数允许漂多少 | 1（研发稿） |
| `src_spread_max_bps` / `pair_dev_max_bps` | 单源点差上限 / 只剩两源时允许的分歧 | 2 / 5 |
| `breaker_*` / `loss_break_*` / `max_worst_loss` | 熔断与亏损上限 | **研发稿** |
| `hl_spot_coin` | Hyperliquid 现货币对（txt） | `@142` |
| `combo_voucher_every` / `combo_voucher_face` / `combo_voucher_cap_day` | 连赢几张发一张 / 面额 / 每人每天上限 | 3 / 2 / 10 |
| `combo_pool_day` | 全站每天 $2 combo 券总配额（`voucher_daily_pools` 的 $2 档） | 见风控文档（Lovable 2,000） |
| `sim_table` / `display_texture` / `cancel_*` | 演示与历史参数 | 正式版不用 |

参数行的 `note` 列是 10-28 写的旧说明，以本表为准。

#### 3.1.2 价格指数（500 ms 采样）

1. 每次采样同时请求四个来源：Binance `bookTicker?symbol=BTCUSDT`、Hyperliquid `l2Book`（coin `@142`）、Coinbase `BTC-USD/ticker`、Coinbase `USDT-USD/ticker`。
2. 单源中间价 = (bid + ask) / 2。bid、ask 缺失、≤ 0 或盘口交叉（ask < bid）→ 该源作废；点差 (ask − bid) / bid > 2 bps → 该源作废（USDT-USD 不过这条）。
3. Hyperliquid 和 Coinbase 的中间价 ÷ USDT-USD 中间价，换成 USDT 计价；拿不到 USDT-USD 汇率时这两源作废。Binance 不换算。
4. 三源都在 → 取中位数；两源 → 取平均，但两者分歧 > 5 bps → 无效；不足两源 → 无效。无效时这条 tick `valid = false`、没有指数。
5. 每条 tick 存三源原始买卖价快照 `src_raw`，供审计。

#### 3.1.3 报价模型（研发稿 2.1）

| 量 | 定义 |
|---|---|
| r1 | `ln(idx / 上一条有效 idx)` |
| r30 | `ln(idx / 30 秒前的 idx)`，30 秒前 = `[ts−31.5 s, ts−28.5 s]` 区间里离 `ts−30 s` 最近的一条有效 tick |
| r60 | 同上，60 秒（区间 `[ts−61.5 s, ts−58.5 s]`） |
| RV600 | 过去 600 秒有效 tick 的 `Σ r1²` |
| z30 | `clip(r30 / sqrt(max(RV600 × 30/600, 1e-12)), −5, 5)` |
| z60 | `clip(r60 / sqrt(max(RV600 × 60/600, 1e-12)), −5, 5)` |
| p_up | `round_half_up(clip(sigmoid(β0 + β30·z30 + β60·z60), 0.40, 0.60), 3)`；`sigmoid(x) = 1/(1+e^−x)` |
| p_down | `1 − p_up` |

历史不满 600 秒、或 30 / 60 秒前那条找不到、或本条无效 → `p_up = NULL` → 前端键置灰，底注 `Warming up · odds in a moment`。

#### 3.1.4 下单 `arcade_place(side, gross, quote_ts, client_id)`

服务端、以当前用户身份执行。`client_id` 是**这一次点击自己的编号**（前端 `crypto.randomUUID()`，落 `arcade_calls.client_id`，`(user_id, client_id)` 唯一）：同一个用户、同一个编号只认一次——重发拿回同一张单，不会下两张；两份同时到达时后到的那份也拿回先到那份建的单（CPO 2026-11-05 批，项 10.1）。校验顺序如下，任何一条不过就报错、不扣钱；报错原文前端直接显示在键底注。

| # | 校验 | 报错原文 |
|---|---|---|
| 1 | 已登录 | `Sign in to play` |
| 1a | 这个编号已经有单 → 直接返回那张单 + 当前余额（不再往下校验） | — |
| 2 | 接受过免责（`arcade_acks` 有本人） | `Accept the rules first`（前端收到后弹免责门） |
| 3 | side ∈ up / down | `Pick Up or Down` |
| 4 | gross ∈ 2 / 5 / 10 / 25 / 50 | `Chips are $2, $5, $10, $25 or $50` |
| 5 | 桌子没暂停 | 按原因：`Table full · room opens as calls settle` / `Table paused · index invalid` / `Table paused · market moving too fast` / `Table paused · daily limit reached` / `Table paused · back within the hour` / `Table closed` |
| 6 | 最新 tick 存在、有效、没过期 | `Table paused · index invalid` |
| 7 | 用户看到的那条报价 tick 存在、有报价、有效 | `Price moved · tap again` |
| 8 | 报价没过有效期（`quote_ttl_ms`）——这也保证了前端放弃查单之后，迟到的请求不可能再成交 | `Price moved · tap again` |
| 9 | 报价那一刻到现在指数漂移 ≤ `drift_max_bps` | `Price moved · tap again` |
| 10 | 本人未到期合计 + 这一枚 ≤ $500 | `Limit reached · $500 in play · room frees up as your calls settle` |
| 11 | 本人过去 1 秒内下单 < 2 张 | `Too fast · 2 calls per second` |
| 12 | 全桌最坏赔付 + 这一张没超上限 | `Table full · room opens as calls settle` |
| 13 | 现货余额 ≥ gross | `Not enough in your spot account` |

全部通过：扣 `spot_balance` 整枚筹码 → 写一行开仓费流水 → 插 `arcade_calls`（t0 = 服务端当前时刻，t1 = t0 + 30 s，报价 p 与 win_payout 当场锁定，带 client_id）→ 返回整行 + 新余额。

**查单 `arcade_lookup(client_id)`**：返回本人这个编号的那张单（整行 + 当前余额），没有返回空。前端在「下单超时」时用它（§4.1 下单超时）。

前端在发请求之前先自己拦几条，文案和服务端一致：未登录 → 弹登录（不出字）；没接受免责 → 弹免责门；桌子暂停 → 见 §2.3；没有可用报价 → `No price right now · try again in a second`；超 $500 → 键底注 + 红色 toast 都是 `Limit reached · …`；余额不够 → `Not enough in your spot account`。服务端没给原文时显示 `Could not place that`。被拒时键抖一下、键底注变色 1.8 秒后恢复；`Price moved` 时键上报价闪一下。**置灰的键仍然可以点**（不是 `disabled`）：点了走上面这套前端拦截——抖一下 + 拒单音 + 底注写原因；键盘 ↑ / ↓ 同样。前端判定「报价可用」用的有效期和服务端同一个数（`min(tick_max_age_ms, quote_ttl_ms)`），不会出现前端还在报价、服务端已经拒的 1.5 秒缝。

**下单超时（5 秒没回音）**：筹码留在键上的塔里和 YOUR CALLS 里，那一行变淡、右侧灰字 `checking…`，键底注 `Checking your call…`（手机 MY CALLS 那枚筹码变淡、秒数换成 `…`），余额先按扣了显示；前端拿编号每 2 秒调一次 `arcade_lookup`，最多 15 秒。查到进去了 → 那一行恢复正常（ahead / behind，倒计时按服务端接单时刻算），键底注回到平时；服务端明确拒单 → 和平时一样退筹码、退余额、写原因；15 秒都查不到（或服务端说没有）→ 那一行和筹码移走、余额加回，键底注红字 `Didn’t go through · nothing was charged` 3 秒。checking 期间可以继续下别的单，这一笔钱算在 $500 上限里。网络错误（请求发不出去 / 没回音）和服务端拒单的区分：有 PostgREST 错误码的是拒单，没有的是网络。字典 AR-27 … AR-30。

#### 3.1.5 钱怎么算（一律按分精确算，不用浮点数）

| 金额 | 公式 | 取整 |
|---|---|---|
| fee 开仓费 | gross × 3% | 四舍五入到分（0.5 进位） |
| net | gross − fee | — |
| win_payout 派彩 | net ÷ p | **向下**取到分 |
| commission 佣金（只在赢时） | (win_payout − gross) × 5%；基数是相对**筹码**的利润 | 四舍五入到分（0.5 进位） |
| credit 赢时入账 = 键上的 to win | win_payout − commission | — |
| pnl | 赢 `credit − gross`；输 `−gross`；void `0` | — |

算例 $5 Up @ 50.9¢：fee 0.15 → net 4.85 → 4.85 ÷ 0.509 = 9.528… → 派彩 9.52 → 利润 4.52 × 5% = 0.226 → 佣金 0.23 → 入账 9.29（键上 `to win $9.29`）→ pnl +4.29；输 pnl −5.00。
佣金恰好半分的例子 $5 @ 51.0¢：派彩 9.50 → 利润 4.50 × 5% = 0.225 → **进位成 0.23**（不是银行家舍入的 0.22）→ 入账 9.27。
RULES 里的例子 $50 @ 53.0¢：fee 1.50 → net 48.50 → 派彩 91.50 → 利润 41.50 → 佣金 2.075 → 2.08 → 净利 39.42，键上 `to win $89.42`。

#### 3.1.6 结算 `arcade_settle_due(user)`

- 扫到期合约（t1 ≤ 现在），按 t1 排序，`FOR UPDATE SKIP LOCKED`。还没有 ts ≥ t1 的 tick 时，最多等 `settle_wait_ms`（2 秒）迟到行情。
- **S0** = t0 之后、t1 之前最早一条有效 tick；**S1** = t1 及之前、`settle_src_age_ms` 以内最晚一条有效 tick；**绝不用 t1 之后的价**。
- S0 或 S1 没有、或 S1 = S0 → void，余额 + gross（筹码连费全退）。
- `(side = up) = (S1 > S0)` → won：余额 + credit；否则 lost。
- **幂等**：同一张只结一次（行锁 + status 检查），连跑两次第二次零副作用。
- 谁来触发：后台每条 tick 扫一遍全部；前端到 t1 时调 `arcade_settle_mine()` 只结自己的（没结到每 300 ms 重试，最多 25 次），另外每 15 秒对账一次。
- 前端翻牌节奏：到 t1 杆顶立刻变 `…`，0.5–1.2 秒后翻（结果更早到也压到这个时间再翻）。

#### 3.1.7 钱包流水（`transactions`，账户都是 spot）

| 时点 | type | 金额 | description 原文 |
|---|---|---|---|
| 下单 | `fee` | −fee | `Quick Play fee · 3% · Up · BTC 30-second call` |
| 赢 | `trade_profit` | +(win_payout − net) | `Quick Play · Up · Won · open 81155.30 → close 81194.73` |
| 赢（佣金 > 0） | `winning_commission` | −commission | `Winning commission · 5% · Quick Play · Up` |
| 输 | `trade_loss` | −net | `Quick Play · Up · Lost · open … → close …` |
| void · 平局 | `trade_profit` | 0 | `Quick Play · Up · tie · chip and fee returned` |
| void · 平局 · 退费 | `fee` | +fee | `Quick Play fee returned · tie · Up` |
| void · 没有有效价 | `trade_profit` | 0 | `Quick Play · Up · no valid price · chip and fee returned` |
| void · 没有有效价 · 退费 | `fee` | +fee | `Quick Play fee returned · no valid price · Up` |

任何一种结果，该单的流水加起来 = 该单 pnl（void 为 0：−fee + 0 + fee）。下单时不写本金扣款行，本金在结算时体现在 `trade_loss` / `trade_profit` 里。2026-11-04 之前的撤单还有两行历史流水（`Quick Play cancel · 0.15% · …` / `Quick Play fee returned · cancelled within 2 s`），正式版不会产生。

#### 3.1.8 读接口

- `arcade_table_now()`：一次返回最新 tick + 桌态 + 参数 + 我的未到期合计 + 免责接受时间 + 今天已得 combo 券额 `combo_today` + 服务器时间。前端每秒调一次。
- `arcade_index_ticks`：图表拉最近 60 秒 + 增量（只读）。
- `arcade_road(120)`：最近 120 个 30 秒格的开 / 收，路单用（前端只画最近 60 格，见 §4.6）。
- `arcade_my_calls(since, limit)`：我的合约；刷新页面时拉最近 400 张、按 30 分钟链式规则复原这一场（见通俗导读「一句话规则」）。
- `arcade_table_feed()`：全桌未到期合约，按到期先后，最多 30 条（§3.1.10）。
- `arcade_lookup(client_id)`：本人这个编号的那张单 + 当前余额，没有返回空（§3.1.4 下单超时）。
- `arcade_accept_terms()`：写 `arcade_acks`。

#### 3.1.9 combo 券 `arcade_combo_vouchers(user)`

- 每次结算出现赢单，就对这个用户跑一次（加用户锁）。
- 数连赢：本人 won / lost 的合约按 (t1, id) 排序；lost 清零；**void 跳过、不清零**；相邻两张 **t1** 间隔 > 30 分钟清零（场次切分用的是下单时刻 `created_at`——合约固定 30 秒时两者等价，若以后 `duration_sec` 可变要改成同一个）。
- 连赢数是 3 的倍数的那一张 → 发一张 $2 仓位券，条件：这张是今天（UTC）结算的，且本人今天已得 + 2 ≤ $10。券：有门槛（tiered），`granted` 状态（Rewards › Vouchers 里 `Claim voucher` 领），30 天内有效，参数与 referral 券一致（50% 封顶、持仓 ≤ 72 h、入场价 0.20–0.80、距结算 ≥ 12 h），来源行 `From Quick Play — 3 wins in a row`。
- 幂等：`position_vouchers.source_arcade_call_id` 唯一，同一张单只发一次。
- 日界是 UTC 自然日，看完成连赢那一张的**结算时间**；`combo_today` = 本人今天（UTC，按发券时间）combo 券面值合计。
- 前端掉券那一刻先乐观 +$2，8 秒内以服务端为准。
- **全站每日券池**（CPO 2026-11-05 批，项 5）：combo 券从 `voucher_daily_pools` 的 **$2 档**出，每天总配额 = `arcade_params.combo_pool_day`（Lovable 演示 2,000 张；正式值见《BTCUSDT_30秒与1分钟涨跌产品设计_v1.0》）。发券前两个条件都要满足：本人今天 < $10，**且**池里 $2 档还有剩（`consume_daily_voucher_pool(2)` 先占位再发，同一张完成连赢的单不会占两次）。池子当天发完：连赢照样算、COMBO 大字和金币雨照样有，只是不掉券，HUD 副行 `vouchers all gone today · keep it going`，券计量条进「池子空了」态（§4.5）。个人 $10 先满就显示个人满了，个人没满、池子空了才显示池子空了。池子和个人上限都是 UTC 零点重置（页面上显示成用户本地时间）。
- `arcade_table_now().combo_pool_left` = 今天 $2 档还剩几张（今天还没建池子行时 = 总配额）。

#### 3.1.10 LIVE TABLE 打码

`前 2 个字符 + *** + 后 2 个字符`，例 `alexcarter` → `al***er`；用户名**短于 5 个字符**（打码后等于全露）或没有用户名 → 统一显示 `pl***er`（CPO 2026-11-05 批，B10）。只放真实用户的未到期单。

#### 3.1.11 场次 `arcade_my_sessions(limit)` / `arcade_my_session_calls(key, limit = 30, offset = 0)`

把当前用户的合约按下单时间排序，相邻两张间隔 > 30 分钟就断成新一场，每场一行（字段见 §2.2）；只返回至少有一张非 open 的场。`arcade_my_session_calls` 返回那一场全部非 open 合约，最新在上，30 条一页。**30 分钟与前端 `ARCADE_SESSION_GAP_MIN` 必须同步改。**

#### 3.1.12 审计

每张合约存 quote_ts / quote_idx / t0 / t1 / s0 / s0_ts / s1 / s1_ts / p / p_up / fee / net / win_payout / commission / pnl；每条 tick 存来源原始值 `src_raw`。

### 3.2 表与函数一览

| 对象 | 用途 |
|---|---|
| `arcade_params` | 参数表（§3.1.1） |
| `arcade_index_ticks` | 指数 tick（ts / idx / valid / 三源 / r1 r30 r60 RV600 / p_up / src_raw） |
| `arcade_calls` | 合约 |
| `arcade_table_state` | 桌态（paused_reason 及其统计） |
| `arcade_acks` | 免责接受记录（user_id, accepted_at） |
| `position_vouchers.source_arcade_call_id` | combo 券对应的那张合约（唯一） |
| 函数 | `arcade_place(side, gross, quote_ts, client_id)` / `arcade_lookup` / `arcade_settle_due` / `arcade_settle_mine` / `arcade_combo_vouchers` / `arcade_table_now` / `arcade_table_feed` / `arcade_road` / `arcade_my_calls` / `arcade_my_sessions` / `arcade_my_session_calls` / `arcade_accept_terms` |
| 正式版不要 | `arcade_cancel`（已关闭）· `arcade_feed_tick` / `arcade_feed_req`（Lovable 里的取价写法，正式版用自己的行情服务）· `arcade_sim_*` / `arcade_synth_tick` / `arcade_housekeeping`（演示）· `arcade_rounds*`（旧轮次流，只给站内其他页的 BTC 价用） |

### 3.3 Lovable 演示引擎（🔴 仅演示，正式版禁止参考）

| 项 | Lovable 现在 | 正式版 |
|---|---|---|
| 行情 | `arcade_sim_feed` 模拟 tick，实际约 **2 秒一条**（每秒跑一次，但上一条不满 1.2 秒就跳过）：在每分钟取一次的 Binance 真价附近随机游走；三家来源价 = 模拟价 ± 微小偏移 | 自己的行情服务，500 ms 采样三所取中位数 |
| 行情停顿 | 前端每秒的 `arcade_table_now()` 发现最新 tick 超过 3.5 秒没来，就补一条合成 tick 并结算到期合约 | 不适用 |
| 券池 | `combo_pool_day = 2000`（演示值），池子行按天懒建 | 配额见风控文档 |
| 报价门槛 | 60 条 tick 就开始报价；不够时沿用上一个报价（演示上 `p_up` 从不为空） | 600 秒，不够时没有报价 |
| 有效期 / 新鲜度 | 报价有效期 4.5 s、tick 过期 6 s、S1 新鲜度 4.5 s、到期不等迟到行情（0）、漂移容忍 5 bps | §3.1.1 |
| 暂停 | 熔断、亏损上限、全桌上限都拨到够不着，只有人工关桌 `live = 0` 会暂停；其他暂停态只在字典 AR-3 看 | 研发稿 |
| LIVE TABLE | 冷清时每条 tick 约 12% 概率补一张匿名模拟单（最多同时 6 张，`sim_table = 1`），不占限额、不碰钱 | 只放真实用户 |
| 展示线 | 指数点之间用固定种子的随机游走补到 100 ms 一点、首尾精确落在指数点上（`texSeries`）——**演示用，不许照抄** | 用真实行情画到 ≥ 10 Hz，效果照 Lovable |
| 清理 | 每 10 分钟（`arcade_housekeeping`）：tick 留 24 小时、模拟单（`user_id` 为空）留 24 小时、秒级 cron 的运行记录留 1 小时 | 自己的留存策略 |

## 4. 用户端

### 4.1 机柜 `/arcade`（桌面）

全屏页面，没有站点 header / footer。入口：Events All 横幅整条可点；logo 牌点击（或键盘 Enter / Space）回 `/events`。颜色只表示方向：青 = Up、柠檬绿 = Down，方向同时带 ▲ / ▼；输赢不靠颜色，看实心 / 空心与 ✓ / ✕；只有钱数（+$ / −$）用绿 / 红。

| 行 | 内容 |
|---|---|
| 头条 | logo / `BTC · 30-second calls` + 副行 `Settles on the BTC Index ⓘ` / `TOTAL OPEN POSITIONS ⓘ` + `Current $125 / Max $500` / `AVAILABLE · SPOT $6,249.09` / 单独一块键板 `+ Deposit` `⇄ Transfer` `Rules`（Deposit / Transfer 就地弹站内弹窗，Deposit 预选现货账户、Transfer 预选转入现货）/ 静音键 |
| 01 / REPLAY | 一整块屏，见 §4.6 |
| 02 / LIVE FEED · 舞台 | 头：`BTC INDEX` 小标 + 白色大价 + 上一秒 ▲▼；下一行 `FROM Binance $x · Hyperliquid $x · Coinbase $x`（缺一家写 `—`，指数无效整行红）；自己没单时再一行 `▼ −$19.72 in the last 30s`；COMBO 小框；右上 `NEXT SETTLE · 12s`（没单 `—`）。图：白色价格线、过去 45 秒 + 未来 30 秒、真实时间刻度每 15 秒 + `NOW`、右侧价格刻度（白签 = 现价，青 / 绿签 = 最近 3 张未到期单的开仓价）；自己没有开着的单时画**预览线**（现价往右 30 秒白虚线 + 旗 `if you call now · settles here`）；鼠标停在 UP / DOWN 上把赢的那一侧染色并写 `▲ UP wins if BTC ends above` / `▼ DOWN wins if BTC ends below`；底注 `← last 45 seconds` / `each call settles 30s after you tap →` |
| 右栏 | 这一场第一笔之前：`LIVE TABLE N · everyone's open calls` + `▲ UP · n $x` / `▼ DOWN · n $x` 汇总 + 每单一行 `▲ UP $5 @ 50.9¢ · al***er · 12s`（最多 9 行，≤ 5 秒的高亮）+ `Tap UP or DOWN to start — your calls and results show here`。第一笔起到这一场结束：`YOUR CALLS · only you see these` + 页签 `Open N · $x in play` ｜ `Settled N`。Open 行 `▲ UP` / `$5 · to win $9.23` / 小字 `@ 51.3¢ · open $80,900.87 · 23s` / 进度条 / 行尾 `open…` → `ahead`（白）/ `behind`（灰），放不下底部渐隐 + `↓ 3 more`，空 `No open calls · tap UP or DOWN`。Settled 行 `$5 @ 51.2¢ · won` + `open 80,933.97 · close 80,950.10` + 盈亏，最多 30 条，空 `Nothing settled yet this session`，底部 `All settled calls → Portfolio`。右栏下面另一块钢板 `04 / YOUR RESULT`（第一笔之后出现）：OPEN `6 calls · $125` / `next in 3s`；LIVE `if settled now` / `+$4.63`；SESSION `+$83.57` / `2 won · 1 lost`；LAST 10 ✓✕ / `3 in a row`；右上 `⇪ SHARE`（≥ 1 张结算才亮） |
| 03 / SELECT YOUR DIRECTION | 标题行右侧券计量条（§4.5）+ `EVERY CHIP IS ITS OWN 30-SECOND CALL`。`▲ UP` 键 / 筹码盘 `YOUR STAKE · PER CHIP` + `$5 SELECTED` + `$2 5 10 25 50` / `▼ DOWN` 键。键上筹码塔 = 这一边正在跑的合约（同面额一堆）；点下去筹码立刻进塔 + 键上方飘 `+$5 ▲`。键底注见下表 |
| 底部 | 猞猁太空窗（§4.3） |

**键底注**（按优先级）：

| 情况 | 原文 |
|---|---|
| 桌子暂停 | §2.3「键底注」列 |
| 没有 tick | `Waiting for the price` |
| 有 tick 但没报价 / 报价过期 | `Warming up · odds in a moment` |
| 下单后 1.5 秒内 | `Placed ✓ · locked in, settles in 30s`；这一边 1.5 秒内多张 `3 placed ✓ · each settles in 30s` |
| 再下一枚就超 $500 | `Limit reached · $500 in play · room frees up as your calls settle` |
| 平时 | `$5 in · fee $0.15 · to win $9.29 if Up` |
| 被拒（1.8 秒） | 拒单原文（§3.1.4） |

**窄桌面（≤ 1120 px）**：01 题牌隐藏（屏头照样在）；筹码盘标头只留 `YOUR STAKE · PER CHIP`，不显示 `$5 SELECTED`（选中的筹码自己高亮）。

**四态**：**登录状态读取中**（页面刚打开、站点还没读完本地保存的会话，通常 < 1 秒；CPO 2026-11-05 批，项 12）→ 余额 `—`、Deposit / `→ Sign in` 的位置空着、Transfer 隐藏、券计量条加载态 `$— / $10 today ›`、不弹免责门、点 UP / DOWN 不响应（不下单也不弹登录）；读完直接变成登录或未登录的样子，中间不闪「没登录」。实现：先同步读 localStorage 里保存的会话（`sb-<ref>-auth-token`，只读），有就按已登录起步、没有就按未登录起步，再用 `supabase.auth.getSession()` 确认一次；3 秒内没确认也结束读取中态——结束后按本地读到的那个状态走（本地有会话 = 已登录，没有 = 未登录）。已登录但余额还没拉到时，`AVAILABLE · SPOT` 也写 `—`，不写 `$0.00`。不碰登录 / 账号逻辑（字典 AR-33 / AR-34）。未登录 → 余额 `—`、Transfer 键隐藏、Deposit 位置换成 `→ Sign in` 键；点它或点 UP / DOWN 弹站内登录（桌面弹窗、手机底部抽屉）；右栏 LIVE TABLE、预览线照画、券计量条写规则。空 → 没下过单 = LIVE TABLE；下过单没开着的 = Open 空提示。加载 → `Waiting for the price`（没有有效指数）/ `Warming up · odds in a moment`（指数有效、模型还没报价，AR-37 / AR-38）。出错 / 暂停 → §2.3、§2.4；拒单 AR-39 … AR-44；下单超时 AR-27 … AR-30。

### 4.2 机柜（移动，375）

顶栏 logo / `AVAILABLE · SPOT $6,249.09`（不折行）/ `+`（未登录是 `SIGN IN`）/ `RULES` / 静音 → `BTC · 30s calls · $价` + `OPEN POSITIONS $0 / $500 ⓘ` → 四格来源价 `BINANCE` / `HYPERLIQ.` / `COINBASE` / `BTC INDEX`（指数无效时写 `INVALID`）→ 舞台（白大价 + `▲ +$x in the last 30s`，COMBO 右上小盒；图同桌面，预览旗只写 `30s`，没有 hover）→ 筹码带（这一场没下过单 `LIVE TABLE N` 别人的筹码，最多 7 个；下过单 `MY CALLS N` 自己的筹码 + 剩余秒数）→ OPEN / LIVE / SESSION 三格（第一笔之后才出现）→ `YOUR STAKE` + 券计量条 + 筹码 → UP / DOWN → 底部 `ROAD & STATS` 窥条。

`ROAD & STATS` 是底部抽屉：标题行右侧图例 `▲ Up ▼ Down` → 01 一块屏（§4.6，三格竖排：UP VS DOWN / BIG ROAD / BEAD）→ SESSION / LAST 10 / `⇪ SHARE` → SETTLED 列表 → 猞猁 + 气泡说路单（§4.3）。

**手机上所有浮层都是底部抽屉**：免责门、RULES、登录、ROAD & STATS、ⓘ 说明、路单格提示、路单说明、分享。

### 4.3 反馈、猞猁、声音

**每张合约**

| 时点 | 看到什么 |
|---|---|
| 点下去 | 筹码进塔 + `+$5 ▲` 飘字；键底注 `Placed ✓ …`；图上入场菱形 + 开盘虚线 + 到期杆；猞猁跳一下 |
| 跑的过程 | 行尾 `ahead` / `behind`；开盘虚线领先 = 本方向色、落后 = 灰 |
| 到期 | 杆顶 `…` → 实心点（赢，本方向色）/ 灰空心圈（输）/ 灰横杠（void）；`+$4.29` / `−$5.00` / `VOID` 飘字；赢时筹码飞进余额、余额 bump（一秒内同时结的几张只 bump 一次）；LAST 10 白底 ✓ / 灰框 ✕；一组最后一张翻完 1.5 秒后整组离开图 |

**到期杆的标签**（连点好几单时）：一单一根杆，挨近的共用一个文字标签（桌面到期相差 3 秒内、手机 9 秒内）。标签写组里最早到期那单还剩几秒，多单加 `×N`，两个方向都有写 `▲▼`；一组超过 10 张后面的不画杆、只计数；翻牌中写 `✓3 ✕1 · ▲▼ 1s`，翻完 `✓4 ✕2`。字典 AR-20…AR-23。

**连赢**（n = 当前连赢数）

| n | 看到什么 |
|---|---|
| 2 | 图表头 `COMBO ×2` + `⇪ SHARE` + 副行 `win 1 more → free $2 voucher` |
| 3 的倍数 | 掉一张 $2 券：大字 `×3 COMBO` + `+$2 voucher · in your Vouchers` + 金币雨 + `+$2 VOUCHER` 飞到券计量条；副行 `you got a $2 voucher!`；当天已满 $10 则不掉券，副行 `vouchers maxed today · keep it going` |
| 大字 + 金币雨出现在 | n 是 3 的倍数，或 n = 5、8（即 3 / 5 / 6 / 8 / 9 / 12 / 15…） |
| 档位词（大字没掉券时的副行） | ≥ 3 `on fire`、≥ 5 `unstoppable`、≥ 8 `legendary` |
| 机柜抖动 | n ≥ 5 且出大字时（用户开了「减少动态效果」就不抖） |
| 连输 | 什么都不显示（没有 LOST ×N、没有红闪、没有 COMBO BREAK） |
| 刷新后恢复的连赢 | 只显示 COMBO 小框，不放特效 |

**猞猁（桌面太空窗）**：这一场赚 > $0.5 昂首快走、亏 > $0.5 耷拉慢走；60 秒没人碰打盹冒 `z`；被点随机冒 `♥` `!` `meow` `?!` `✦` 之一；赢冒 `+`、输垂头 0.7 秒；大字连赢 `GG!`；每进新的 30 秒格看一次路单（最近 120 格）：同色连续 ≥ 5 举牌 `DRAGON ×5 ▲`，交替 ≥ 6 举牌 `choppy…`（同一状态不重复举）；打开 8 秒还没下过单 → 举牌 `new here? tap ⓘ ↗`（只一次）。桌子暂停 → 跑酷（点窗口或空格起跳，最高分存本机）。

**猞猁（手机 ROAD & STATS 气泡）**：同色连续 ≥ 4 `▲ Up 4 times in a row — a streak is running.`；交替 ≥ 5 `Flip-flopping for the last 5 — no clear direction.`；最近 20 格 Up ≥ 13 `Mostly ▲ Up lately — 14 of the last 20.`（Down 同理）；否则 `Mixed — 10 up, 10 down in the last 20.`。手机阈值比桌面低一档（4 / 5 对 5 / 6），这是现状。

**声音**（默认开，静音存本机 `omx-mute`；第一次点击后才发声）

| 声音 | 什么时候 |
|---|---|
| key | 点键类操作：未登录点 UP / DOWN、I GET IT、RULES、Deposit / Transfer、SHARE、券计量条、Portfolio 链接、logo |
| chip | 选筹码 |
| bet | 下单 |
| deny | 任何被拒 |
| win / lose | 单子赢 / 输（void 不出声） |
| big | 大字连赢 |
| jump / crash | 跑酷 |

### 4.4 键盘与无障碍

| 键 | 作用 |
|---|---|
| ↑ / ↓ | 下 Up / Down 单（当前选中的筹码），**按住只算一次**（忽略键盘自动重复）；焦点在输入框里、或任何弹层 / 抽屉 / 说明框开着（免责门、RULES、登录、Deposit / Transfer、手机 ROAD & STATS、ⓘ 说明）时不响应 |
| ⓘ 上 Enter / 空格 | 打开那条说明（和点击一样） |
| Esc | 关 RULES、关手机抽屉 |
| M | 静音开关 |
| 空格 | 跑酷起跳（只在跑酷中） |
| logo 上 Enter / 空格 | 回 `/events` |

无障碍：toast 是 `role="status" aria-live="polite"`；免责门、RULES、手机抽屉都是 `role="dialog" aria-modal="true"`；静音键 `aria-pressed` + `Mute sound` / `Unmute sound`；筹码 `aria-pressed`；ⓘ 有 `aria-label`（`What is the BTC Index` / `About the open limit` / `How to read the road`）。用户开了「减少动态效果」：所有 CSS 动画瞬间完成、粒子和金币雨大幅减少、不抖、猞猁不走动、入口横幅静止。焦点管理：免责门、RULES、手机 ROAD & STATS 打开时焦点移到层里第一个可操作件（I GET IT / 关闭键），关掉回到打开它的那个控件。Esc 关不掉 ⓘ 说明和免责门（免责门本来就要求必须点确认）。

### 4.5 券计量条

桌面在 03 标题行右侧，手机在 YOUR STAKE 右侧；点了去 Rewards › Vouchers。

| 态 | 什么时候 | 桌面 | 手机 |
|---|---|---|---|
| 未登录 | 没登录 | 券图标 + `Win 3 in a row = $2 voucher · up to $10 a day` | 图标 + `3 in a row = $2 voucher` |
| 加载中 | 登录了、服务端还没回今天的券额（约 1 秒） | 框不变、3 格变暗 + `$— / $10 today ›` | 同左 |
| 计数中 | 登录、今天没满 | 图标 + 3 格（亮 `连赢数 % 3` 格）+ `3 more wins` / `2 more wins` / `1 more win → $2 voucher` ｜ `$4 / $10 today ›` | 图标 + 3 格 + `$4 / $10 today ›` |
| 刚掉券 | 掉券后 8 秒 | 3 格全亮、框发光 + `+$2 voucher · it's in your Vouchers` ｜ `$6 / $10 today ›` | 3 格全亮 + `+$2 · $6 / $10 ›` |
| 今天满了 | 今天已得 ≥ $10 | 框变暗、没格子 + `Today's $10 of vouchers claimed · more from 08:00` | `$10 claimed today` |
| 池子空了 | 今天 < $10，但全站 $2 券池今天发完（`combo_pool_left = 0`） | 样式同「今天满了」+ `Today's vouchers are all gone · more from 08:00` | `Vouchers all gone today` |

`08:00` = UTC 零点换成用户本地时间（例中是东八区），24 小时制、不带时区。今天的券额只认服务端，没回之前不显示数字。字典：未登录 AR-6 / AR-6 移动 · 计数中 AR-2 / AR-5 · 刚掉券 AR-15 / AR-17 · 满了 AR-16 / AR-24 · 池子空了 AR-35 / AR-36 · 加载中 AR-25 / AR-26（登录状态读取中也是加载态，AR-33 / AR-34）。

### 4.6 01 / REPLAY 一块屏

题牌 `01 / REPLAY` · `BTC EVERY 30 SECONDS` + 图例 `▲ Up ▼ Down`；右边一整块屏，屏头写一次时间段：`LAST 30 MIN` `15:22 → NOW` · `60 results — each dot or box = did BTC go up or down in that 30 seconds`（手机拆两行）。下面三格读**同一批最近 60 个结果**（30 分钟）：

- `BEAD · in order`：珠盘，一列 6 格、先上后下再往右，画满 60 个；
- `BIG ROAD ⓘ · in streaks`：大路，同色往下排、换色换列；列太多时格子从 9 px 缩到 7 px，还放不下才挤掉最早几列，这时大路的起点钉写它真正的起点；ⓘ 打开「How to read the road」（Dragon / Chop / Break 三段 + 「路是背景，不是预测」）；
- `UP VS DOWN · the count`：`▲ Up 37 + 23 Down ▼ = 60` + 比例条 + `longest streak ▲ Up ×7` + 底行 `This 30s so far ▼ −$7.40 · 13s left` + 本格进度条。

珠盘、大路第一格上方钉起点时间，最新一格套白圈、上方钉 `NOW`。点 / hover 任一格弹提示：有数据 `▲ Up +$12.40` + `07:49:00 – 07:49:30`；没有数据 `No index print` + 时间段 + `colour carried over`。**珠盘和大路的样子不能改**（营造赌场氛围，CPO 11-02）。手机放在 ROAD & STATS 抽屉里。

### 4.7 入口横幅（Events All）

「像素夜景」一条（桌面 124 px，移动折成一列）：`■ QUICK PLAY` + `BTC · 30-SECOND CALLS · 24/7` / 大价 / `$81,466.92 · ▲ +$4.80 · last 30s`（30 秒前的指数与变化）/ 右侧 `TIME` 条 + `00:22`（桌子的 30 秒墙钟格倒数）/ `▲ UP 51.2¢` `▼ DOWN 48.8¢` / `PLAY ▸`。只在 All 视图出现（非日历、非 watchlist），整条可点 → `/arcade`。读机柜同一条指数（打开时拉最近 45 秒 tick，之后每 2 秒调一次 `arcade_table_now`）。

桌子不能交易时副行红字、报价 `—¢`、线变灰，红字**按原因写**（B3）：指数无效 / 没有报价 `INDEX INVALID · WAITING FOR THE EXCHANGES` ｜ 关桌 `TABLE CLOSED` ｜ 桌满 `TABLE FULL · ROOM OPENS AS CALLS SETTLE` ｜ 跳太快 `PAUSED · BTC IS MOVING TOO FAST` ｜ 全天亏损 `PAUSED · BACK TOMORROW` ｜ 60 分钟亏损熔断 `PAUSED · BACK WITHIN THE HOUR` ｜ 本机断网（横幅每 2 秒拉一次，连续 3 次拉不到 ≈ 6 秒，或浏览器报离线）`CONNECTION LOST · RECONNECTING…`（断网时价格保持上一次读数；机柜是每秒一次、3 次 ≈ 3 秒，两处阈值不同只因轮询节奏不同）。映射表在 `ArcadeEntryBanner.tsx` 的 `ARCADE_BANNER_OFF_COPY`。字典 AB-1 / AB-2 每个原因一条。

### 4.8 分享海报「Share your run」与 combo 海报

- **按场分享**，入口只有 04 的 `⇪ SHARE`（手机在 ROAD & STATS 抽屉里同一位置；≥ 1 张结算才亮，全是 void 不亮）和场次详情页右上 Share。连赢 / 大赢都不主动弹。
- 海报 = 设计师像素掌机稿（Figma omenx_lite 1283:1437 桌面 · 1283:1841 / 1283:2110 手机），恒 400 px：头像 + 徽章 `7 of 10 right`、青色 `QUICK PLAY` 框、`Profit` / `Lost` + 大字净利（已扣佣金）、`Called Bitcoin up or down, 30 seconds at a time`、`23 minutes · 10 calls · $5 each`（面额不一样写 `$80 staked`）、两格 `Best run · 4 in a row` / `Biggest win · +$9.20`、推荐码 + logo + `Pick UP or DOWN · from $2` + 二维码 → `/arcade?ref=<推荐码>`（落地后 `?ref` 走全站的推荐捕获：注册 / 登录弹窗读 `ref` 预填推荐码，与其它分享链接同一套，本需求不另做）。赚黄绿 `#CFFF4A`、亏珊瑚红 `#FF8B80`。金额超过 7 个字符字号缩到 52 / 44 px。只写净利与对了几次，不写 ROI、不出 SESSION / COMBO / LAST 10。
- 边界：pnl = 0 → 按赚的样式（`Profit +$0.00`）；没赢过 → Biggest win `—`、Best run `—`（赢过 1 张写 `1`，≥ 2 写 `4 in a row`；海报和 Portfolio 共用 `arcadeBestRunLabel`）；分钟数 = **第一张到最后一张**，至少 1 分钟（机柜海报和 Portfolio 同一个算法：机柜的场次时钟从第一单开始计，不是打开页面）。
- 徽章图标是 Lucide：赢 `zap`、亏 `trending-down`，颜色跟徽章字，方角线头（CPO 2026-11-05 批，项 17）；免责门四行也是 Lucide `timer / lock / percent / triangle-alert`。
- 弹层 = 站点 ShareModal 的 arcade 外观（Jersey 10 标题 `Share your run`，副标 `Save the card or post it straight to X / Telegram`，亏时 `Rough one — share it anyway, we go again`）；**手机是底部抽屉**。保存的 PNG 里像素字是真字体。
- 分享出去的文字（发到 X / Telegram 的，不是界面，保留 emoji）：`Called Bitcoin up or down for 23 min on OmenX Quick Play — 7 of 10 right, +$83.57 ⚡`；亏 `… −$21.40. We go again 😅`。
- **combo 海报**：COMBO 小框的 `⇪ SHARE` → `Share your combo`；海报暂用场次海报家族（`ArcadeComboPoster`）：徽章 `3 in a row`、`COMBO ×3 · ON FIRE`（徽章图标 Lucide `flame`）、大字 `+$13.92`（这一串连赢的净利）、`Called Bitcoin up or down — 3 right in a row`、`30 seconds a call · $15 staked`、两格 `Combo ×3` / `Biggest win +$4.71`。**过渡版**，设计正式稿到了整张替换。分享文字 `3 Bitcoin calls right in a row on OmenX Quick Play — COMBO ×3, +$13.92 🔥`。

### 4.9 Portfolio

- **Settled › Standard 一场一行**（不另立页签；chip 计数按场 +1；Win rate 按单算 won ÷ (won + lost)，void / cancelled 不进分母；Net profit 加上各场 pnl）：标题 `BTC 30-second calls · Oct 28, 16:47 – 16:53` + 右侧 QUICK PLAY 小牌；副行 `8 calls · won 5 of 8`；一场没有任何结算时写 `no calls settled · 1 refunded`；右侧这一场净利，› 进详情。**手机**：标题只留时间段、`BTC` 挪进副行，标题与副行都允许折成两行，不截断。从机柜 `All settled calls → Portfolio` 过来：落在 Standard，最新一场 2.2 秒 lime 底色后淡出。
- **场次详情 `/portfolio/quick-play/<key>`**：套单仓结算详情的版式——标题 + 小牌 / `Settled Oct 28, 2026 · 16:53` / Share + `Open Quick Play ›`；三卡 Result（净利 + `Won · 5 of 8 calls right`；一张都没结 `No call went to settlement`）/ Staked（`$70.00` + `8 calls @ $5 – $25`）/ Payout（`$82.06` + `after $2.65 fees` + `Trading fee $2.10 · Winning commission $0.55`；0 写 `nothing returned`）；Details（Market `BTC · 30-second calls` / Calls / Record `5 won · 3 lost` / Best run `3 in a row`（1 写 `1`、0 写 `—`）/ Stake / Not settled `1 refunded` / Started / Ended + 底注 `A session ends after 30 minutes without a call.`）+ ACTIVITY（一张合约一行 `16:52:41 · Up · $5.00 @ 50.9¢` → `+$4.29`；void `$0.00 · refunded`、历史撤单 `−$0.01 · cancelled` 灰字；最新在上，30 条一页 `Load more calls`；空 `No calls to show`）。手机 inner header 标题 `Quick Play`，右上 Share 图标。别人的 key / 不存在的 key 同一张「not found」。
- pnl = 0 的一场：海报、详情页、列表一律按赢的样式（`Won`、绿色）。

### 4.10 免责门与 RULES 原文

**免责门**（登录后第一次进来，每个账号一次——`arcade_acks` 有 `version` 列但本期不用，改文案不重弹；也会在下单时服务端说没接受时弹；没有关闭键，Esc 关不掉；未登录点 I GET IT → 关门并弹登录；请求中按钮写 `SAVING…`，失败 toast 服务端原文或 `Could not save that · try again`）：
`BEFORE YOU PLAY` / `BTC · 30-second calls`
1. **Each chip = one 30-second call.** Up or Down vs the price right after we take it.
2. **Locked once you tap.** No undo, no cash-out.
3. **3% in · 5% of profit out.** Ties refund in full.
4. **High risk.** $2–50 a call · $500 open max.
按钮 `I GET IT · START PLAYING`；链接 `How the price and odds are made →`。

**RULES**（`HOW IT WORKS`，七段一栏；全文见本节末尾「RULES 全文」，`src/pages/arcade/arcadeMarkup.ts` 与之一致）：1 The price · 2 Open and close · 3 The odds · 4 Payout & fees（含 `No undo: a tapped chip is a call and runs its full 30 seconds.`）· 5 Limits & pauses · 6 Your record（争议渠道 `support@omenx.com`，可用）· 7 Combo vouchers（`resets every day at 08:00`，本地时间）。

**ⓘ 说明**：BTC Index `The BTC Index turns the live BTC prices from Binance, Hyperliquid and Coinbase into one price, updated every second. Every call opens and settles on it, so a glitch on any single exchange can't swing your result.`；open limit `You can have up to $500 in open calls at once. Room frees up as your calls settle.`

**RULES 全文**（`HOW IT WORKS`；七段；`<本地时间 00:00 UTC>` 处显示用户本地的 UTC 零点，如 `08:00`）：

**1 · The price**

The **BTC Index** is the median of three exchanges' mid prices (best bid + best ask ÷ 2) in USDT terms: **Binance** BTC/USDT, **Hyperliquid** BTC/USDC and **Coinbase** BTC-USD (both converted at the live USDT-USD rate). A snapshot counts only when at least two sources are fresh, no book is crossed and every spread is ≤ 2 bps; with just two sources they must agree within 5 bps. If that fails the index is **invalid** for that second and we stop taking new calls (open ones still settle).

The three live prices sit right under the BTC Index price. The chart line moves many times a second; every open, close and settlement uses the index only.

**2 · Open and close**

**Open (S0)** = the first valid index *after* the server accepts your chip — never a price from before you tapped, so nobody can front-run a move they already saw. **Close (S1)** = the last valid index at or before the 30-second mark (we wait up to 2 s for late data, and never use a price from after the mark). The result shows about a second after the mark.

S1 > S0 → Up wins. S1 < S0 → Down wins. Equal, or no valid S0 / S1 → the call is void and you get everything back, fees included.

**3 · The odds**

The cents on UP / DOWN are a probability from our pricing model, built from the last 10 minutes of index moves. It is clipped to **40–60¢** and UP + DOWN always add to $1.00. A quote lives for a moment; your chip is filled at the exact quote you saw, and the payout is locked then. If the price moved too much in between, the chip is refused and you simply tap again — we never fill at a price you didn't see.

**4 · Payout & fees**

**Fee:** 3% of the chip, taken on entry. **Payout if you win:** (chip − fee) ÷ odds, rounded down to the cent, minus **5%** of the profit. **Lose:** the chip is gone.

Example: $50 on Up at 53.0¢ → fee $1.50 → working $48.50 → payout $91.50 → profit $41.50 − 5% ($2.08) = **$39.42**. The key shows this as **to win $89.42** — what comes back, chip included.

**No undo:** a tapped chip is a call and runs its full 30 seconds.

**5 · Limits & pauses**

$2–50 per call · $500 open per account · 2 calls per second. The table pauses new calls (open ones still settle) when the index is invalid, when BTC moves more than 10 bps in one second, when our daily loss limit is hit, or when the table's risk room is full. You always see why on the chart.

**6 · Your record**

Every call stores its accept time, open, close, quote, fee and payout. The **Settled** tab next to Open shows open → close for each call this session; every call is also in Portfolio. A session ends after 30 minutes without a call. Disputes: support@omenx.com with the time of the call.

**7 · Combo vouchers**

Win **3 calls in a row** and you get a **$2 Position Voucher**; every 3 more wins in the same run, another one — up to **$10 a day** (resets every day at ). Voids don't count, a loss starts the count over, and so does a new session. Your vouchers are in Rewards › Vouchers.

## 5. Lovable / 正式版边界与未了账

| 项 | 状态 |
|---|---|
| 风控数值、合规上线要求 | 见《BTCUSDT_30秒与1分钟涨跌产品设计_v1.0》 |
| 行情、报价门槛、有效期 | 正式版照 §3.1；Lovable 放宽了，见 §3.3 |
| LIVE TABLE | 正式版只放真实用户的单；模拟单只在 Lovable |
| 展示线 | 要的效果 = Lovable 现在这条线（白色 1.8 px 带淡光，每 100 ms 一个点，45 秒窗口约 450 个点，最新点到 NOW 之间也在动，**大价 / 线头圆点 / 右侧白价签跟着线头走**——线头 = 最新指数 + Binance 盘口此刻相对那条指数的偏移，所以大价和"最新 idx"相差通常不到几美元、每秒收敛一次；开仓菱形、✓ / ✕、结算价只认指数；纵轴留白 = 区间的 25%，至少 $8）。正式版用真实行情画到 ≥ 10 Hz；开仓菱形、✓ / ✕、结算价只认指数 |
| 翻牌节奏 | 到 30 秒杆顶立刻 `…`，0.5–1.2 秒后翻；正式版后端仍按研发稿（等迟到行情 ≤ 2 秒），前端节奏照这个做 |
| 文案 / i18n | 英文，未进 i18n |
| 埋点 | 本期不做 |
| 运营后台（开关桌、改参数） | 参数走后台配置（`arcade_params` 那组：开关桌、费率、筹码档位、单账户上限、每秒单数、报价系数、券池配额）；Lovable 里直接改库 |
| combo 海报 | 过渡版，设计正式稿到了替换 |
| 跑酷 | 只在桌面暂停态；手机抽屉里的猞猁只会跳 |
| alex_carter 演示数据 | 真实下单 + 补种历史（won / lost / void / cancelled），不碰余额；三场可在 Portfolio 看到 |

2026-11-04 冷读列出的待批项（10 / 11 / 12 / 17 / 5 / B1–B11）2026-11-05 全部批准并落地，口径已写进上面各节（§2.4、§3.1.4、§3.1.7、§3.1.9、§3.1.10、§3.3、§4.1、§4.4、§4.5、§4.7、§4.8、§4.9）；本文档不再有待定项。

## 6. 状态索引

| 编号 | key | 端 | 态 |
|---|---|---|---|
| AR-1 | `arcade-ar1` | 桌面 | 第一次进来：免责门 |
| AR-2 | `arcade-ar2` | 桌面 | YOUR CALLS · Open 6（最新一张刚下）· 04 · COMBO ×2 · 券 $4 / $10 |
| AR-3 | `arcade-ar3` | 桌面 | 桌子暂停（指数无效）· 猞猁跑酷 |
| AR-4 | `arcade-ar4` | 移动 | 没下过单（LIVE TABLE 筹码带） |
| AR-5 | `arcade-ar5` | 移动 | 开着 6 张合约 |
| AR-6 | `arcade-ar6` / `arcade-ar6-mobile` | 桌面 / 移动 | 未登录 |
| AR-7 | `arcade-ar7` | 桌面 | 下过单、手上没单 · 连输三把（不显示任何连输提示） |
| AR-8 | `arcade-ar8` | 桌面 | 路单格提示 |
| AR-9 | `arcade-ar9` | 桌面 | RULES |
| AR-10 | `arcade-ar10` | 移动 | ROAD & STATS 抽屉 |
| AR-11 | `arcade-ar11` | 移动 | 免责门（底部抽屉） |
| AR-12 | `arcade-ar12` | 桌面 | 没下过单 · 鼠标停在 UP：预览线染青 |
| AR-13 | `arcade-ar13` | 桌面 | YOUR CALLS · Settled 页签 |
| AR-14 | `arcade-ar14` | 桌面 | 到 $500 上限 · `↓ N more` |
| AR-15 | `arcade-ar15` | 桌面 | ×3 COMBO 掉 $2 券 |
| AR-16 | `arcade-ar16` | 桌面 | ×5 · 今天 $10 已满 |
| AR-17 | `arcade-ar17` | 移动 | ×3 掉券 |
| AR-18 | `arcade-ar18` | 移动 | ⓘ 说明 = 底部抽屉 |
| AR-19 | `arcade-ar19` | 桌面 | 大路 ⓘ 路单说明 |
| AR-20 | `arcade-ar20` | 桌面 | 到期杆 · 5 秒连点 6 单 |
| AR-21 | `arcade-ar21` | 桌面 | 到期杆 · 翻牌中 |
| AR-22 | `arcade-ar22` | 移动 | 到期杆 · 5 秒连点 6 单 |
| AR-23 | `arcade-ar23` | 移动 | 到期杆 · 翻牌中 |
| AR-24 | `arcade-ar24` | 移动 | 券计量条 · 今天 $10 已满 |
| AR-25 | `arcade-ar25` | 桌面 | 券计量条 · 加载中 |
| AR-26 | `arcade-ar26` | 移动 | 券计量条 · 加载中 |
| AR-27 / AR-28 | `arcade-ar27` / `arcade-ar28` | 桌面 / 移动 | 下单超时 · 查单中（`checking…` / `Checking your call…`） |
| AR-29 / AR-30 | `arcade-ar29` / `arcade-ar30` | 桌面 / 移动 | 下单超时 · 没进去（`Didn’t go through · nothing was charged`） |
| AR-31 / AR-32 | `arcade-ar31` / `arcade-ar32` | 桌面 / 移动 | 用户断网 · `CONNECTION LOST` / `OFFLINE` |
| AR-33 / AR-34 | `arcade-ar33` / `arcade-ar34` | 桌面 / 移动 | 登录状态读取中 |
| AR-35 / AR-36 | `arcade-ar35` / `arcade-ar36` | 桌面 / 移动 | 券计量条 · 池子空了 |
| AR-37 / AR-38 | `arcade-ar37` / `arcade-ar38` | 桌面 / 移动 | 预热中（指数有效、没报价） |
| AR-39 / AR-40 | `arcade-ar39` / `arcade-ar40` | 桌面 / 移动 | 拒单 · `Price moved · tap again` |
| AR-41 / AR-42 | `arcade-ar41` / `arcade-ar42` | 桌面 / 移动 | 拒单 · `Not enough in your spot account` |
| AR-43 / AR-44 | `arcade-ar43` / `arcade-ar44` | 桌面 / 移动 | 拒单 · `Too fast · 2 calls per second` |
| AR-45 / AR-46 | `arcade-ar45` / `arcade-ar46` | 桌面 / 移动 | 暂停 · TABLE FULL |
| AR-47 / AR-48 | `arcade-ar47` / `arcade-ar48` | 桌面 / 移动 | 暂停 · 关桌 |
| AR-49 / AR-50 | `arcade-ar49` / `arcade-ar50` | 桌面 / 移动 | 暂停 · 跳太快 |
| AR-51 / AR-52 | `arcade-ar51` / `arcade-ar52` | 桌面 / 移动 | 暂停 · 日亏损触顶 |
| AR-68 / AR-69 | `arcade-ar68` / `arcade-ar69` | 桌面 / 移动 | 暂停 · 60 分钟亏损熔断（back within the hour） |
| AR-53 | `arcade-ar53` | 移动 | 暂停 · 指数无效（AR-3 的手机版） |
| AR-54 / AR-55 | `arcade-ar54` / `arcade-ar55` | 桌面 / 移动 | 新场次 toast |
| AR-56 / AR-57 | `arcade-ar56` / `arcade-ar57` | 桌面 / 移动 | 单笔翻牌 · 赢 |
| AR-58 / AR-59 | `arcade-ar58` / `arcade-ar59` | 桌面 / 移动 | 单笔翻牌 · 输 |
| AR-60 / AR-61 | `arcade-ar60` / `arcade-ar61` | 桌面 / 移动 | 单笔翻牌 · VOID |
| AR-62 / AR-63 | `arcade-ar62` / `arcade-ar63` | 桌面 / 移动 | COMBO ×8 LEGENDARY |
| AR-64 … AR-67 | `arcade-ar64` … `arcade-ar67` | 桌面 | 猞猁 · DRAGON 举牌 / choppy / new here? / 睡着 |
| AB-1 / AB-2 | `arcade-ab1` / `arcade-ab2` | 桌面 / 移动 | 入口横幅 · 正常 + 七种暗着的原因各一条 |
| AS-1 | `arcade-as1` | — | 分享海报 · 赚 / 亏 |
| AS-2 | `arcade-as2` | — | combo 海报（过渡版） |
| AS-3 | `arcade-as3-win` / `arcade-as3-lose` | 桌面 | 分享弹窗 · 赚 / 亏 |
| AS-4 | `arcade-as4-win` / `arcade-as4-lose` | 移动 | 分享抽屉 · 赚 / 亏 |
| PF-39 | `portfolio-lite-quickplay-rows` / `-mobile` | 两端 | Settled › Standard 里的 Quick Play 行（刚玩完 / 有退款 / 跨零点） |
| PF-40 | `portfolio-lite-quickplay-detail` / `-mobile` | 两端 | 场次详情 · 赚 |
| PF-41 | `portfolio-lite-quickplay-detail-lost` / `-mobile` | 两端 | 场次详情 · 亏 · 跨零点 · 单一面额 |

## 7. 涉及文件

- 机柜：`src/pages/arcade/ArcadePage.tsx`（React 壳：登录弹窗 / 抽屉、现货余额、Deposit / Transfer 弹窗、路由跳转）、`arcadeMarkup.ts`（桌面 / 移动 / 浮层 DOM，含免责门与 RULES 原文）、`arcade.css`（机柜皮肤）、`arcade-v2.css`（流式舞台与各模块样式）、`arcadeEngine.ts`（控制器：服务器时钟对齐、每秒轮询、下单 / 结算 / 对账、展示线、到期杆、COMBO、反馈、路单、ⓘ、免责门、场次、猞猁 + 跑酷、声音、键盘；`mountArcade(root, api, {data?, fixture?})`；调试 `root.__arcade.debug()`）。
- 公共：`src/lib/arcade/arcadeCalls.ts`（RPC 封装 + 费用 / 派彩算式 + 路单格）、`src/lib/arcade/session.ts`（30 分钟断场与时间段文案）、`src/lib/arcade/quickPlayPortfolio.ts`（场次行 / 详情 / 海报的数据与文案）、`src/lib/arcade/sprites.ts`。
- 入口与分享：`src/components/lite/arcade/ArcadeEntryBanner.tsx` + `arcade-entry.css`；`ArcadeRunPoster` / `ArcadeComboPoster` / `ArcadeShareCard`（弹层复用 ShareModal）；字体 `public/fonts/arcade/`。
- Portfolio：`src/hooks/useArcadeSessions.ts`、`src/hooks/useLitePortfolio.ts`、`src/components/portfolio/lite/SettledList.tsx`、`QuickPlayTag.tsx`、`QuickPlaySessionView.tsx`、`src/pages/lite/LiteQuickPlaySession.tsx`、`PortfolioRoutes.tsx`、`SettlementDetailView.tsx`。
- 后端迁移（按时间）：`20261028120000_arcade_calls.sql`（主体）· `20261028190000_arcade_housekeeping.sql` · `20261028213000_arcade_always_on.sql` · `20261029163000_arcade_load.sql` · `20261029170000_arcade_sim_feed.sql` · `20261029190000_arcade_sessions.sql` · `20261102180000_arcade_combo_vouchers.sql`（combo 券 + 演示节奏）· `20261104170000_arcade_no_undo.sql`（关撤单）· `20261104230000_arcade_limit_copy.sql`（上限文案统一）。`20261019*` 两个是旧轮次流，只给站内其他页的 BTC 价。 · `20261105110000_arcade_pre_handoff.sql`（下单编号 `client_id` + `arcade_lookup`、$2 券池档 `combo_pool_day`、void 退费流水、模拟单清理、短名打码；已在 Lovable 库执行）· `20261105120000_arcade_loss_hour.sql`（`paused_reason = loss_hour` 的拒单文案；已执行）
- 字典 / 规范：`src/pages/StyleGuide/sections/ArcadeStatesSection.tsx` + `preview/arcadePreviews.tsx`；`PortfolioStatesSection.tsx` Ⓛ + `portfolioPreviews.tsx`；`DESIGN.md` Quick Play 各节；`docs/copy-dictionary.md`「Quick Play（/arcade · BTC 30 秒合约 · 流式舞台）」节；`docs/backend-boundary.md` Quick Play 补录。

## 8. 验证方法

1. 行情：`select ts, idx, valid, p_up from arcade_index_ticks order by ts desc limit 5` —— 有效、`p_up` 在 0.40–0.60；机柜大价跟展示线头走，和最新 idx 差不超过几美元、新 tick 到了就收敛（Lovable 约 2 秒一条）；行里的开仓价 / 结算价 = idx。
2. 下单：演示账号下一枚 $5 Up → `arcade_calls` 新一行（open，t1 = t0 + 30 s，p = 当时报价，win_payout = floor(4.85 ÷ p × 100) / 100）；现货余额减 5；流水多一行 `fee −0.15`。
3. 撤不了：以普通用户身份调 `arcade_cancel(<id>)` → `permission denied for function arcade_cancel`；`select num from arcade_params where key = 'cancel_window_ms'` = 0。
4. 结算：30 秒后约 1 秒内 status 变 won / lost / void；s0 = t0 之后第一条 tick 的 idx，s1 = t1 前最近一条；赢时余额 + (win_payout − commission)；Settled 行 open / close 与 s0 / s1 一致（实测 $5 @ 50.9¢ 赢：派彩 9.52、佣金 0.23、入账 9.29、pnl +4.29）。结算函数连跑两次，第二次零副作用。
5. 暂停：`update arcade_params set num = 0 where key = 'live'` → 机柜几秒内 `TABLE PAUSED · The table is closed`、猞猁跑酷；改回 1 恢复。
6. 横幅价格 / 报价与 `/arcade` 同一时刻一致。
7. 展示线：`document.querySelector('.arcade-root').__arcade.debug()` → 每张合约 `s0OnLine / s1OnLine` 为 true（线的首尾落在指数点上）。
8. 场次：演示账号 `/portfolio?tab=settled` → Standard 里带 QUICK PLAY 小牌的行数 = `select count(*) from arcade_my_sessions()`（以该账号身份）；点一行 → 三卡数字与 `arcade_my_sessions` 同一行一致（`payout − staked = pnl(won + lost)`），ACTIVITY 条数 = 该场非 open 合约数；机柜里闲 30 分钟后再下一单 → toast `New session`、SESSION 归零；刷新机柜 → 最近 30 分钟内的合约复原成同一场。
9. 未登录：头条 `AVAILABLE · SPOT —` + `→ Sign in`（手机 `SIGN IN`）；点 UP → 登录（手机底部抽屉）；登录后不误弹免责门（已接受过的账号）。点珠盘 / 大路任一格 → 白边 + 提示框写那格的时间段与涨跌。
10. 桌面 `+ Deposit` → 站内 Deposit 弹窗、预选现货；`⇄ Transfer` → 预选转入现货；关掉后余额刷新。手机 `+` → `/deposit`。
11. 手机 375：免责门、RULES、ROAD & STATS、登录、ⓘ、分享全部从底部升起；MY CALLS 筹码带不被裁切。
12. 券：连赢 3 张 → `position_vouchers` 多一张 $2（`source_arcade_call_id` = 第三张），券计量条 `+$2 voucher …` 8 秒；当天满 $10 后再连赢不再发、计量条变「今天满了」；刷新页面计量条先 `$— / $10 today` 再出真值，不出现 `$0`。
13. 字典：`/style-guide` 交易页 + Portfolio 节点，跑 `scripts/sg-overflow-scan.js`，除 Radix sr-only「Close」外 0 命中。
14. 下单编号：同一个 `client_id` 调两次 `arcade_place` → 第二次返回同一张单（`arcade_calls` 里只有一行）；`arcade_lookup(<id>)` 返回那张单，陌生 id 返回空。
15. 断网：DevTools 切 Offline → 3 秒内遮罩 `CONNECTION LOST`、键 `Offline · reconnecting`、来源价不变红；切回 Online → 下一秒恢复，期间到期的单补翻牌。
16. 券池：`update voucher_daily_pools set claimed_count = total_quota where face_value = 2 and pool_date = current_date` → 券计量条「池子空了」、连赢第 3 把不掉券但 COMBO 照常；改回去恢复。
17. void 流水：一张 void 的单在钱包流水里是三行（`fee −0.15` / `trade_profit 0` / `fee +0.15 · Quick Play fee returned`），合计 0。
18. 短名打码：用户名 ≤ 4 个字符的账号开一张单，别人的 LIVE TABLE 里显示 `pl***er`。

## 9. 本需求不碰的东西

- 5m / 15m / 1h / 4h / 1d 快轮页、Pro 终端、钱包流水组件：不在本需求内（只是它们的 BTC 价锚到同一指数）。
- Portfolio 的 Live tab、Boost / Standard 分段逻辑、单仓结算详情：不变（场次行只是多一种 `kind`）。
- 分享弹层 ShareModal、Lite 晒单海报家族：不变（新增两种海报）。
- 登录 / 入金 / 划转组件：不变（机柜复用，DepositDialog 多一个可选 prop `initialAccount`）。

## 附 · 代号 ↔ 章节

| 代号 | 指 | 章节 |
|---|---|---|
| AR-1…AR-69 / AB-1 AB-2 / AS-1…AS-4 / PF-39…41 | style-guide 样张 | §6 |
| 像素夜景 | Events All 入口横幅的视觉方案名 | §4.7 |
| 研发稿 | 《BTCUSDT_30秒与1分钟涨跌产品设计_v1.0》 | 文首 |

## 附 · 变更记录（只供追溯，口径以正文为准）

- 2026-10-19 v1：轮次版（一局 30 秒）——已作废，记录见 `lite-arcade-spec-v1.md`。
- 2026-10-28 v2：改成「每一枚筹码一张 30 秒合约」+ 三所指数 + 流式舞台。
- 2026-10-29：「一场」记账单位、Portfolio 场次行与详情页、演示行情改模拟。
- 2026-11-02 James 反馈轮：颜色只表示方向、图只画自己的单、右栏两态、$2 筹码、combo 券、到期杆方案、设计师海报。
- 2026-11-04 James 第二轮：删除撤销（键、文案、后台接口一起关）、券计量条、01 一块屏；窄桌面不显示 `$5 SELECTED`；券计量条加载态；交付前冷读修订（四处文案、本文档按现状重写）。
- 2026-11-05 · CPO 批冷读待批项全部落地（commit 见 git log）：下单编号 + `Checking your call…`（10）、断网态（11）、登录读取中态（12）、emoji → Lucide（17）、$2 券池档（5）、B1–B11；style-guide 补 AR-27 … AR-67；§5 不再有待定项；运营参数口径 = 走后台配置。
- 2026-11-05（下午）· 第二次冷读修 24 处矛盾；CPO 批：60 分钟亏损熔断单独一套文案（`loss_hour`，AR-68 / AR-69，横幅第七条）；`▼ DN` 保留；`tick_max_age_ms` 指向风控文档。
