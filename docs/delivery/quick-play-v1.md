# Quick Play 专区（/arcade · BTC 30 秒合约 · 流式舞台 + Portfolio 场次）— 交付说明 v1

> **研发交付用的唯一总文档。** 范围：`/arcade` 整页（桌面 + 移动）· 每一枚筹码一张 30 秒合约的下单 / 取消 / 结算后端 · 三所指数价格流（正式版规格）与 Lovable 演示引擎（模拟 tick）· Events「All」入口横幅 · 按「场」分享的海报 · Portfolio › Settled 一场一行 + 场次详情页。
> 决策：Liya（CPO）2026-10 拍板，依据研发稿《BTCUSDT_30秒与1分钟涨跌产品设计_v1.0》+ 她的修订；交互稿 claude.ai/artifact/6AmwMxsb3aNDUgVDZ8epWJ（机柜）、23fURQjk1rc1EyFZo11aP9（Portfolio 场次）、7qNBdW1tmAmjASypyaS3sN（设计师细节）。
> 状态：**Lovable 内测可玩，真下单真记账；行情在 Lovable 是模拟 tick（正式版接真三所指数，见 §3.2）；文案英文占位。**

## 0. 读者须知

查什么去哪儿：
- 长什么样 → 生产页 `/arcade`（机柜）、`/events`（All 页顶部入口横幅）、`/portfolio?tab=settled`（场次行）、`/portfolio/quick-play/<key>`（场次详情）
- 什么时候变成什么样 → `/style-guide` → Lite → **交易页** 节点里的「/arcade · Quick Play」小节（AR-1…AR-11 · AB-1 / AB-2 · AS-1）；**Portfolio** 节点 Ⓛ 区（PF-39…PF-41）。每个 case 有「状态 / 触发条件 / 视觉 / 数据来源」表
- 字段名、文案、公式、时间口径、术语 → `docs/copy-dictionary.md`（顶部「Lite 术语对照表」；节「Quick Play（/arcade …）」）→ 本文档对应章节
- 设计法则（钢板壳、四行柜体、线的画法、横幅、海报、场次规则）→ `DESIGN.md` §Addendum 2026-10-28 第 18–27 条
- 后端什么是需求、什么只是演示 → `docs/backend-boundary.md`「2026-10-30 Quick Play」补录 + 本文档 §3
提问前先按上面顺序查一遍；查不到再提，提问时写明"我查了 X 没有"。

## 0.1 字典怎么看

1. 打开 `/style-guide`（不用登录），左栏 Lite 组点 **交易页**，本页目录里找「/arcade · Quick Play」；场次行与详情页在 **Portfolio** 节点的 Ⓛ 区。
2. 节点顶部「本页目录」= 小节按产品页从上到下，右侧是编号范围，点了滚过去。
3. 小节顶部黄框「定位行」= 路由 / 词典节 / 本文档。
4. 每张样张 = `AR-n` / `AB-n` / `AS-n` / `PF-n` + 状态名 + iframe 里的真组件：桌面机柜按 1440 宽缩到 72%，手机帧 375 宽、一个态一台手机并排。机柜帧跑的是生产引擎的 fixture 模式（零网络），可以点：点 UP / DOWN 会被夹具拒单，点 ⓘ / 路单格 / RULES / 窥条都是真反应。
5. 样张下表列固定「状态 / 触发条件 / 视觉 / 数据来源」，触发条件就是判定表达式。
6. 页头搜索框敲 `AR-8` / `PF-40` 或文字，结果「编号 · 名 → 节点 › 小节」，点了落到样张。
7. 单张查看 / 截图：`/style-guide/preview?c=<key>`（key 见 §6）。

编号规则：`AR-n` 机柜（桌面与移动各自编号，AR-4 / 5 / 10 / 11 是移动帧，AR-6 桌面 + 移动各一帧）；`AB-n` 入口横幅（AB-1 桌面 / AB-2 移动）；`AS-1` 分享海报；`PF-39…41` Portfolio 场次，每个带 `-mobile` 手机帧。
只在字典可见、生产凑不出条件的态：AR-3 桌子暂停 + 猞猁跑酷（演示桌永远能交易，暂停态只在这里看，见 §3.2）；AR-2 / AR-5 一次开着 6 张合约 + COMBO ×2；AR-7 连输 HUD；AR-11 免责门（每个账号只弹一次，alex 已接受过）；AB-1 / AB-2 的「指数无效」分支；PF-41 跨零点的一场。

## 通俗导读

> 本节是给没读过正文的人的 3 分钟通俗解读；不替代正文、不构成需求依据，一切口径以正文为准。

**一分钟看懂**——这不是"一局 30 秒、大家一起等开奖"的轮次产品：**没有"局"，每一枚筹码就是一张自己的 30 秒合约**——你什么时候落下去，就从那一刻开始数 30 秒，到点各自结算。所以整个舞台是"流式"的：

1. **图是一条时间轴**：左边是过去的价格，右边 30 秒是未来。每张合约在图上是一个入场小菱形 + 一条开盘价虚线 + 右端一面到期小旗（写着还剩几秒）。到点旗子翻成 ✓ / ✕，原地飘一个 `+$4.29` / `−$5.00`，筹码从键上飞进余额，然后在图上留一个 ✓ / ✕ 小圆点直到滚出画面。线一直在扭（浏览器直连 Binance 盘口），但**穿过每一个指数点**，入场 / 结算标记都落在线上；开 / 收 / 结算只读指数。
2. **右边一栏 MY CALLS**：每张合约一行（方向 / 投入 @ 报价 / 派彩 / 30 秒进度条 / 此刻领先还是落后），前 2 秒显示 `cancel`；到点那行闪一下滑进下面的 LAST SETTLED（只留最近一张，完整记录去 Portfolio）。开着的合约全部都在列表里，装不下就在列表内滚。旁边 TABLE 页签看桌上其他人的单（匿名），顶部有 UP / DOWN 两边各压了多少的汇总。右栏底部是 04 / YOUR RESULT 四行记分板（OPEN / LIVE / SESSION / LAST 10）+ `⇪ SHARE`。
3. **反馈分三级**，不再一局一场金币雨：每张合约 = 旗翻牌 + 数字飘 + 筹码飞；一秒内同时结的几张只 bump 一次余额；**连赢 ×3 才金币雨 + 大字 COMBO**，连输 ×3 红闪一次。跳舞机式 COMBO HUD 常驻在图表头：`COMBO ×2 · 1 more → ×3 bonus`。
4. **键不锁**：结算过程中 UP / DOWN 照样能点。键上的筹码塔 = 这一边正在跑的合约（按面额归堆，最新一枚带 2 秒取消环）。
5. **记账单位是「一场」**：一坐下来玩的这一把；两次下单间隔超过 30 分钟就算下一场。机柜 04 的 SESSION / LAST 10 / SHARE、分享海报、Portfolio 的一行，三处同一条规则。
6. **价格**：正式版 = Binance / Hyperliquid / Coinbase 三家中间价（换算成 USDT 计价）取中位数，机柜底下常驻显示三个来源价 + `LIVE · 3 of 3`。Lovable 演示引擎每 2 秒生成一条模拟 tick（锚在每分钟一次的 Binance 真价上）；页面与文案按正式版口径写——它们是给研发看的规格。

```
用户点 UP ── arcade_place(side, gross, quote_ts) ──► arcade_calls（open，t0 = 接单时刻，t1 = t0 + 30 s，p / 派彩当场锁定）
                                                   │  ← 2 s 内 arcade_cancel(id)：退 gross − 0.15%，status = cancelled
指数 tick（arcade_index_ticks，每 1–2 s 一条）──► arcade_settle_due()：S0 = t0 后第一条有效 tick，S1 = t1 前最近一条
                                                   └──► won（入账 派彩 − 5% 利润）/ lost / void（全退）──► transactions + spot_balance
Portfolio：arcade_my_sessions() 把同一账号的合约按 30 分钟间隔切成「场」──► Settled › Standard 一场一行 ──► /portfolio/quick-play/<key>
```

**一条故事线**（用户小 A）：① 第一次进 `/arcade`，先过四行免责门，点 `I GET IT · START PLAYING`，以后不再弹；② 选 $5 点 UP，键上出现一枚带 2 秒倒数环的筹码，右栏 MY CALLS 多一行 `$5 @ 50.9¢ / wins +$4.49 · 30s`，图上一个菱形 + 一面 `30s` 小旗；③ 他后悔了，2 秒内点环 → `Cancelled · $0.01 close fee`，退 $4.99；④ 再点 UP，这次不管了；行尾变 `ahead`，LIVE 牌写 `+$4.35`；⑤ 30 秒到，旗翻 ✓、`+$4.29` 飘出来、筹码飞进余额，那行滑进 LAST SETTLED，LAST 10 打一个勾；⑥ 连赢三张，金币雨 + 大字 `×3 COMBO`；⑦ 去吃饭，40 分钟后回来再下一单 → toast `New session`，04 的板子归零；⑧ 晚上在 Portfolio › Settled 看到两行带 QUICK PLAY 小牌的记录，点进去是三卡 + 每一张合约的明细；⑨ 点右上 Share，海报写 `7 of 10 right · Profit +$31.20`。

**概念词典**（每条在 copy-dictionary 有定义行）

| 概念 | 是什么 | 判定表达式 | 一句话类比 |
|---|---|---|---|
| call（合约 / 一张） | 一枚筹码 = 一张自己的 30 秒二元合约 | `arcade_calls` 一行；`t1 = t0 + 30 s` | 一张单独计时的彩票 |
| 报价 p | 买 Up 或 Down 一侧的价格，三位小数，Up + Down = $1.00 | `p_up = sigmoid(…)` 钳在 0.40–0.60；`p_down = 1 − p_up` | 赔率 |
| S0 / S1 | 开盘价 = 服务端接单后第一条有效指数；收盘价 = 到期时刻及之前最近一条有效指数 | `s0 = first tick ts > t0`；`s1 = last valid tick ts ≤ t1`（等 ≤ 2 s 迟到行情） | 裁判看的两张照片 |
| 派彩 win_payout | 赢了能拿回的现金（含本金），扣利润 5% 后入账 | `floor((gross × 0.97) ÷ p × 100) / 100`；入账 `= win_payout − 5% × (win_payout − gross)` | 彩票面值 |
| 取消 | 落筹 2 秒内撤回，退本金减 0.15% | `clock_timestamp() ≤ t0 + 2 s`；退 `gross − round(gross × 0.0015)` | 后悔窗 |
| void（退款） | 平局或没有有效价，整枚筹码连费退回 | `s0 IS NULL OR s1 IS NULL OR s0 = s1` | 比赛取消退票 |
| 一场 session | 一坐下来玩的这一把 | 相邻两张下单间隔 `> 30 min` 断场（`ARCADE_SESSION_GAP_MIN` = SQL `interval '30 minutes'`） | 一局麻将 |
| calls / staked / payout / pnl（场） | 到期结算的张数 / 这些张的筹码 / 这些张拿回的现金 / 所有已结合约的净额（含取消手续费） | `calls = won + lost`；`staked = Σ gross(won+lost)`；`payout = Σ (gross + pnl)(won+lost)`；`pnl = Σ pnl(非 open)` | 一局的进出账 |
| best run | 场内按顺序的最长连赢 | 连续 `status = won` 的最大长度 | 连胜纪录 |
| COMBO | 当前连赢数，×3 / ×6 / ×9 触发金币雨 | 同一场内连续 won 计数，输一张归零 | 跳舞机连击 |
| 路单 | 每 30 秒一格的涨跌记录（珠盘 + 大路） | `arcade_road(120)`：格 = 30 秒墙钟，open / close 取该格内指数 | 百家乐路单 |
| 桌 | 所有人共用的一张 BTC 桌；TABLE 页签 = 桌上别人的未到期单（匿名） | `arcade_table_feed()`；用户名打码 `al***er` | 牌桌 |

### 一句话规则

- 进来先过一次免责门（每个账号只弹一次）：`Each chip = one 30-second call · 2 seconds to cancel · 3% in · 5% of profit out · High risk · $2–50 a call · $500 open max`。RULES 键 / `How the price and odds are made →` 打开六段完整规则。手机上免责门与 RULES 都是**底部抽屉**。
- 选筹码（$2 / 5 / 10 / 25 / 50）→ 点 UP 或 DOWN → 服务端按你看到的那个报价成交（报价 0.40–0.60，三位小数，UP + DOWN = $1.00）；筹码里含 3% 开仓费。
- 2 秒内点键上的 `UNDO` 撤回最近一枚：按开盘价原价平掉，只收平台平仓费 0.15%（4 位小数，$5 → $0.0075；开仓费一起退）。2 秒后锁定，**没有 Cash out**。
- 连赢每满 3 把掉一张 $2 有门槛仓位券（每天 ≤ $10，UTC 零点重置），在 Rewards › Vouchers 里领。
- 30 秒后结算：S0 = 服务端接单后第一条有效指数（不是你点之前的价）；S1 = 到期时刻及之前最近一条有效指数（最多等 2 秒迟到行情）。S1 > S0 → Up 赢。赢 = (筹码 − 3%) ÷ 报价 向下取分，再扣利润的 5%；输 = 筹码没了；平局或没有有效价 → 全额退款含费。
- 限额：单笔 $2–50、单账户未到期 ≤ $500、每秒 ≤ 2 笔；全桌最坏损失 ≤ $10,000（满了显示 TABLE FULL）；指数无效 / 一秒跳超 10 bps / 平台当日亏损触顶 → TABLE PAUSED（已开的照常结算）。暂停时猞猁窗口变成小恐龙跑酷。**Lovable 演示桌这些触发器拨到够不着，只留人工关桌**（§3.2）。
- 一场 = 30 分钟没下单就结束；页面开着闲 30 分钟后再下单，04 归零并 toast `New session`；刷新页面从最近 30 分钟内的合约复原这一场。

### 易混点辨析

1. **"看着在上面却判输"**：因为 S0 不是你点的那一刻的价，是服务端接单之后第一条有效指数（研发稿 4.2 + Jason 评论：堵"用户比我们早 0.5 秒看到价格"的漏洞）。图上的入场菱形画在 S0 那个指数点的时刻，MY CALLS 行的开盘价看图上虚线。
2. **三个来源价不一样是正常的**（正式版）：Binance 是 BTC/USDT，Coinbase 是 BTC-USD，Hyperliquid 是 BTC/USDC（现货对 `@142` = UBTC/USDC，不是永续 `BTC`——永续带资金费溢价，实测高 10 bps）。USD / USDC 报价用 Coinbase 的 USDT-USD 实时汇率换算成 USDT 计价后取中位数，所以指数永远落在三家中间。Lovable 现在三家来源价 = 模拟价 ± 微小偏移，数是假的、关系是对的。
3. **报价会跳**：研发稿模型用最近 10 分钟一秒级收益算 z30 / z60，30 秒内跌 4 bps 时 UP 会报到 0.43 左右，是模型本身敏感（这是他们的候选系数，不是前端算的）。前端不因为报价变动闪键，只在被拒单（`Price moved · tap again`）时闪。
4. **线和指数不是一回事**：图上的线 = Binance 盘口实时流（为了一直在扭的手感）逐段锚在指数点上——两个指数点之间 = 两点连线 + Binance 相对自己连线的偏离（两端为零），最新点之后 = 该点 + Binance 自那一刻的变化；指数点画成淡白小方点。**主网直接画指数线**，Binance 流只是演示用，页面上不写说明。
5. **SESSION / LAST 10 / COMBO / LAST SETTLED 全是这一场的**：闲 30 分钟后再下单归零；刷新不丢（从最近 30 分钟的合约复原）。取消的那张不进 LAST 10、不算 calls；退款（void）也不算 calls，但两者各自计数写在场次行与详情页里。
6. **TABLE 页签里的人**：真用户的未到期合约 + 桌子冷清时每秒 12% 概率补的匿名模拟单（`bot_name` 像 `kz***88`，不占限额、不碰钱、不进任何账本；`arcade_params.sim_table = 0` 关掉）——与站内 `market_activity` 模拟成交流同一先例。
7. **Lovable 的行情节奏不是研发稿的 500 ms**：Supabase 里 pg_cron 最快每秒、pg_net 秒级，真取价时实测一条 tick 1.2 秒；现在是模拟 tick 每 2 秒。所以演示引擎把"报价有效期 / 指数过期 / S1 新鲜度"三个口径放宽（`arcade_params`，§3.2），模型需要的 600 秒历史放宽到 120 秒起报价（RV 按比例放大到 600 秒）。**真平台照研发稿。**
8. **横幅上的 `TIME 00:22` 不是局**：这个产品没有"局"，它是桌子的 30 秒墙钟格（和机柜路单的格子同步）。

## 1. 功能目标

给 Lite 用户一张 24/7 的 BTC 桌：$2–50 一枚筹码压 30 秒后涨或跌，按模型报价成交、按三所指数结算，即点即玩、不锁键、不用等局。机柜是街机皮肤（设计师钢板壳），四行：头条 / 路单条 / 舞台 + 右栏 / 方向键。入口在 Events All 顶部横幅；记录按「场」进 Portfolio；分享按「场」出海报。关键约束：报价与结算全在服务端（S0 取接单后），前端只画；风控限额按研发稿；演示桌永远能交易、暂停态只在字典看。

## 2. 状态与口径

### 2.1 一张合约（`arcade_calls.status`）

| status | 含义 | 触发方 | 机柜上 |
|---|---|---|---|
| open | 已接单、未到期 | `arcade_place` | MY CALLS 行 + 图上菱形 / 虚线 / 小旗；前 2 秒行尾 `cancel`、筹码带倒数环 |
| cancelled | 2 秒内撤回 | `arcade_cancel` | 行消失、筹码飞回；toast `Cancelled · $0.01 close fee`；不进 LAST 10 |
| won / lost | 到期按 S0 / S1 判 | `arcade_settle_due` / `arcade_settle_mine` | 旗翻 ✓ / ✕、飘字、筹码飞进余额、行滑进 LAST SETTLED、LAST 10 一格 |
| void | 平局或无有效价，全退 | 同上 | 旗翻 `—`、`refunded`；不进 LAST 10、不算 calls |

### 2.2 一场（展示层分组，不落状态）

| 字段 | 口径 |
|---|---|
| session_key | 第一张下单的 epoch ms（字符串）；路由 `/portfolio/quick-play/<key>` |
| started_at / ended_at | 首尾下单时刻；标题 `BTC 30-second calls · Oct 28, 16:47 – 16:53`（跨天 `Oct 28 23:50 – Oct 29 00:12`，同一分钟只写一次） |
| last_settled_at | 最后一张结算时刻；Settled 列表按它排序，详情页 `Settled Oct 28, 2026 · 16:53` |
| calls / won / lost | 到期结算的张数及胜负（void / cancelled 不在内） |
| refunded / cancelled | 各自计数；详情页 Details `Not settled` 行有才显示；列表行只在 calls = 0 时显示 |
| best_run / biggest_win | 场内最长连赢 / 单张最大净利（详情页与海报；不进列表） |
| staked / payout / fees / commission / pnl | 见概念词典；`payout = staked + pnl(won+lost)`，恒等式 `payout − staked = pnl(won+lost)` |
| min_stake / max_stake | 详情页 Details 的 Stake 行 `$5 – $25 a call`（相同写 `$5 a call`）与 Staked 卡副行 `8 calls @ $5 – $25`；列表行不显示 |
| active | 最后一张 < 30 分钟前或还有 open 的 |

### 2.3 桌态（`arcade_table_state.paused_reason`）

`null` 正常 · `index` 指数无效 · `breaker` 一秒跳超 10 bps · `loss` 60 分钟 / 当日平台净亏触顶 · `full` 全桌最坏损失 ≥ $10,000（只拦新单，显示 TABLE FULL）· `off` 人工关桌（`arcade_params.live = 0`）。暂停时 UP / DOWN 置灰、图表盖 `TABLE PAUSED` + 原因、三来源价变红 `INDEX INVALID`、猞猁窗变跑酷；已开的合约照常结算。

## 3. 数据库 / 后端

### 3.1 正式版规格（研发稿 + CPO 修订；Lovable 里的实现 = 参考实现，可整文件重放 `supabase/migrations/20261028120000_arcade_calls.sql`）

- **参数表 `arcade_params`**（key / num / txt / note）：费率、限额、熔断阈值、模型系数、`quote_ttl_ms`、`tick_max_age_ms`、`settle_src_age_ms`、`min_history_sec`、`sim_table`、`live`（1 = 开桌，0 = 全桌停新单）、`hl_spot_coin`（`@142`）。改参数即时生效，不用改代码。
- **价格流 `arcade_feed_tick()`**（正式版口径；Lovable 已停用其调度，见 §3.2）：① 收上一批 pg_net 应答（Binance bookTicker / Hyperliquid l2Book `@142` / Coinbase BTC-USD ticker / Coinbase USDT-USD ticker，FIFO、四个都到或超 3 秒才收，一批一 tick；同一秒的重复批丢弃）→ ② 算 mid、点差 ≤ 2 bps 过滤、USD → USDT 换算、≥2 源取中位数（只剩 2 源且偏差 > 5 bps 判无效）→ ③ 写 `arcade_index_ticks`（含 r1 / r30 / r60 / RV600 / `p_up` 模型报价 / 原始 bid-ask 快照 `src_raw`）→ ④ 更新 `arcade_table_state`（paused_reason；worst_loss；60 分钟 / 当日平台净亏）→ ⑤ `arcade_settle_due()` 结到期合约 → ⑥ 桌子冷清时 `arcade_sim_tick` 补匿名单 → ⑦ 发下一批请求。整个 tick 用 advisory lock 防重入。
- **报价模型**（研发稿 2.1，参数全在 `arcade_params`）：`z30 = clip(r30 / sqrt(max(RV600·30/600, 1e-12)), −5, 5)`，`p = round_3(clip(sigmoid(0.010495 + 0.106198·z30 + 0.030205·z60), 0.40, 0.60))`；历史不足 `min_history_sec` 或 30 / 60 秒点缺失 → `p_up = NULL` → 前端 `Warming up · odds in a moment`、键置灰。
- **下单 `arcade_place(side, gross, quote_ts)`**（SECURITY DEFINER，auth.uid()）：校验免责已接受 / 筹码档位 / 桌子未暂停 / 最新 tick 有效且未过期 / 报价 tick 存在且在有效期 / 指数漂移 ≤ 1 bp / 单账户未到期 ≤ $500 / 每秒 ≤ 2 笔 / 全桌 worst_loss ≤ $10,000 / 余额够 → 扣 `spot_balance` 整枚筹码 → 写 transactions `fee −3%` → 插 `arcade_calls`（t0 = `clock_timestamp()`，t1 = t0 + 30 s，p / win_payout 当场锁定）→ 返回整行 + 新余额。任一校验失败 RAISE 人话（`Price moved · tap again` / `$500 max open per account` / `Table full · room opens as calls settle` …），不扣钱。
- **取消 `arcade_cancel(id)`**：本人、status = open、`clock_timestamp() ≤ t0 + 2 s`；退 `gross − round(gross × 0.15%)`，status = cancelled，transactions 两行（`cancel −0.15%` / `fee returned +3%`）。
- **结算 `arcade_settle_due(user)`**：到期合约（t1 ≤ now）在"已有 ts ≥ t1 的 tick"或"t1 + 2 s"后结：S0 = t0 之后第一条有效 tick，S1 = t1 及之前 `settle_src_age_ms` 内最近一条有效 tick；无 S0 / S1 或相等 → void 退 gross；赢 → `credit = win_payout − round(5% × (win_payout − gross))` 进余额，transactions `trade_profit` + `winning_commission`；输 → `trade_loss −net`。`FOR UPDATE SKIP LOCKED` + status 检查 → **幂等**（连跑两次第二次零副作用）。cron 每 tick 扫全部；客户端到点调 `arcade_settle_mine()` 只结自己的，结果立刻返回。
- **读接口**：`arcade_table_now()`（最新 tick + 桌态 + 参数 + 我的未到期总额 + 免责时间，一次 RPC，前端每秒轮询）、`arcade_index_ticks`（RLS 全开只读，图表拉最近 60 s + 增量）、`arcade_road(120)`（30 秒格的 open / close，路单）、`arcade_my_calls(since, limit)`、`arcade_table_feed()`（全桌未到期，用户名打码 `al***er`）、`arcade_accept_terms()`（写 `arcade_acks`）。
- **场次**（`supabase/migrations/20261029190000_arcade_sessions.sql`）：`arcade_my_sessions(p_limit)` 把 auth.uid() 的合约按下单时间排序，相邻两张间隔 > 30 分钟就断成新一场（lag + 累加窗口），每场一行（字段见 §2.2）；只返回至少有一张非 open 的场。`arcade_my_session_calls(p_key, p_limit = 30, p_offset = 0)` 返回那一场的全部非 open 合约（`SETOF arcade_calls`），最新在上。两个函数 STABLE SECURITY DEFINER，只给 authenticated。**30 分钟与前端 `ARCADE_SESSION_GAP_MIN` 必须同步改。**
- **站内其他页的 BTC 价**：`roll_arcade_rounds` 开新 BTC 局时 open 取 `arcade_real_btc()`（最近 10 秒内的有效指数），所以首页行情条 / 5m 15m 1h 4h 1d 快轮 / 横幅跟着同一指数走；ETH / SOL / 美股仍是演示 LCG 流。
- **审计**：每张合约存 quote_ts / quote_idx / t0 / t1 / s0 / s0_ts / s1 / s1_ts / p / p_up / fee / net / win_payout / commission / pnl；每条 tick 存来源原始值（`src_raw`）。
- **钱包流水 description**（`transactions`）：`Quick Play fee · 3% · Up · BTC 30-second call` / `Quick Play cancel · 0.15% · …` / `Quick Play fee returned · cancelled within 2 s` / `Quick Play · Up · Won · open 81155.30 → close 81194.73` / `Winning commission · 5% · Quick Play · Up` / `Quick Play · Up · tie · chip and fee returned`。

### 3.2 Lovable 演示引擎现状（🔴 仅演示，正式版禁止参考）

| 项 | Lovable 现在 | 正式版 |
|---|---|---|
| 行情来源 | `arcade_sim_feed` pg_cron **每 2 秒**一条模拟 tick：上一条价格走 ~0.06% 随机步，向每分钟取一次的 Binance 真价锚靠拢；三家来源价 = 模拟价 ± 微小偏移（`20261029170000_arcade_sim_feed.sql`）。真三所取价 `arcade_feed_tick()` 函数仍在库里但**未调度**（Lovable 小实例跑不动每秒 4 个 HTTP 请求） | 自己的行情服务按研发稿 500 ms 采样三所取中位数 |
| 行情停顿 | 客户端每秒的 `arcade_table_now()` 发现上一条 tick 超过 1.5 s 没来就服务端补一条合成 tick（±0.4 bps 随机步，`src_raw.synthetic = true`，报价沿用上一条）并结算到期合约（`20261028213000_arcade_always_on.sql`） | 不适用 |
| 暂停触发器 | 熔断 1 s / 30 s 阈值、60 分钟 / 当日亏损上限、全桌最坏损失上限全部拨到够不着；只留人工关桌 `live = 0`。暂停态代码、文案、AR-3 照旧，只在字典看 | 按研发稿 |
| 报价有效期 / 指数过期 / S1 新鲜度 | 放宽到 4.5 s / 6 s / 4.5 s（`20261029163000_arcade_load.sql`）；历史门槛 120 s | 500 ms / 500 ms / 500 ms；600 s |
| 匿名桌 `arcade_sim_tick` | 每 tick 12% 概率补一张 bot 单（`sim_table = 1`） | 真用户为主；是否保留模拟单是运营决定 |
| 清理 `arcade_housekeeping` | 每 10 分钟：`cron.job_run_details` 秒级任务留 1 小时、其余 7 天；`arcade_index_ticks` 留 24 小时；`arcade_feed_req` 丢 2 分钟前没回的批次 | 自己的留存策略 |
| 轮次流 `arcade_rounds_30s` | 每分钟跑，只给站内其他页的 BTC 行情用 | 不适用 |
| 残留 | `arcade_probe` 表 + `arcade_stall_probe()` 函数是查行情停顿用的探针，未调度；可删 | 不适用 |

### 3.3 表与函数一览

| 对象 | 用途 |
|---|---|
| `arcade_params` | 参数表（§3.1）；2026-11-02 加 `combo_voucher_every` 3 / `combo_voucher_face` 2 / `combo_voucher_cap_day` 10 |
| `position_vouchers.source_arcade_call_id` | combo 券对应的那张凑满 3 连赢的合约（唯一） |
| `arcade_index_ticks` | 指数 tick（ts / idx / valid / 三源 / r1 r30 r60 RV600 / p_up / src_raw） |
| `arcade_calls` | 合约（§2.1 字段 + 审计字段） |
| `arcade_table_state` | 桌态（paused_reason / worst_loss / 平台净亏） |
| `arcade_acks` | 免责接受记录（user_id, accepted_at） |
| `arcade_feed_req` | pg_net 请求批次（正式版不用） |
| `arcade_sim_state` | 模拟行情状态（🔴） |
| `arcade_rounds` | 30 秒 / 1 分钟轮次流，只给站内其他页的 BTC 行情用 |
| 函数 | `arcade_combo_vouchers(user)`（combo 券，2026-11-02）/ `arcade_place` / `arcade_cancel` / `arcade_settle_due` / `arcade_settle_mine` / `arcade_table_now` / `arcade_table_feed` / `arcade_road` / `arcade_my_calls` / `arcade_my_sessions` / `arcade_my_session_calls` / `arcade_accept_terms` / `arcade_real_btc` / `arcade_feed_tick`（正式版口径）/ `arcade_sim_feed` `arcade_synth_tick` `arcade_sim_tick` `arcade_housekeeping`（🔴） |

## 4. 用户端流程

### 4.1 机柜 `/arcade`（桌面）

> 2026-11-02 James 反馈轮按 mock claude.ai/artifact/1hCirCctvs2VNkP2J5bUfC v17c 改过一遍（CPO 批）。总原则：**图只讲你自己的单**；**颜色只表示方向**（青 = Up、柠檬绿 = Down），输赢看实心 / 空心与 ✓ / ✕，只有钱数（+$ / −$）还是绿 / 红。

入口：Events All 横幅整条可点；顶栏不加入口。四行（钢板 + 铆钉 + 编号题牌）：

| 行 | 内容 |
|---|---|
| 头条 72px | logo / `BTC · 30-second calls` + 副题 `Settles on the BTC Index ⓘ`（ⓘ：`The BTC Index turns the live BTC prices from Binance, Hyperliquid and Coinbase into one price, updated every second. Every call opens and settles on it, so a glitch on any single exchange can't swing your result.`）/ `TOTAL OPEN POSITIONS ⓘ` + `Current $125 / Max $500`（ⓘ：`You can have up to $500 in open calls at once. Room frees up as your calls settle.`）/ `AVAILABLE · SPOT $6,249.09` / 键板 `+ Deposit` `⇄ Transfer` `Rules`（Deposit / Transfer 就地弹站内弹窗）/ 静音 |
| 01 / REPLAY · 路单条 | 四块同一骨架（标题行 / 内容 / 时间脚）：`01 / REPLAY · WHAT HAPPENED` + 图例 `▲ Up ▼ Down`（珠盘、大路共用）· `BEAD · LAST 32`（6 列）+ `← 15:36 · now →` · `BIG ROAD ⓘ · BTC's direction, every 30 seconds` + `← 15:30 · now →` · `LAST 30 MIN`（最近 60 格）`▲ Up 28 · 16 Down ▼` + 比例条 + `longest run ▲ Up ×7`（按方向着色）+ 脚 `Now ▼ −$7.40 · 13s left` + 本格进度条。格子 hover（手机 tap）弹提示 `▲ Up +$12.00` + `07:49:00 – 07:49:30`；ⓘ 打开 Dragon / Chop / Break 说明 |
| 02 / LIVE FEED · 舞台 + 右栏 | 舞台头：题牌 / `BTC INDEX` 小标 + 白色 44px 大价 + 上一秒 ▲▼ / 下一行 `FROM Binance $x · Hyperliquid $x · Coinbase $x`（缺 → `—`，指数无效整行红）/ 自己没单时再一行 `▼ −$19.72 in the last 30s` / COMBO HUD / `NEXT SETTLE · 12s`。图：白色价格线（不按涨跌变色）、真实时间刻度每 15 秒 + `NOW`、右侧价格刻度（白签 = 现价，青 / 绿签 = 最近 3 张未到期单的开仓价带 ▲▼）；自己没有开着的单时画**预览线**（现价往右 30 秒白虚线 + 旗 `if you call now · settles here`），鼠标停在 UP / DOWN 上把赢的那一侧染色并写 `▲ UP wins if BTC ends above` / `▼ DOWN wins if BTC ends below`；底注 `← last 45 seconds` / `each call settles 30s after you tap →`。没有 30 秒格阴影、没有格子开盘线（格子只活在路单里）。<br>右栏：**这一场还没下过单** = `LIVE TABLE N · everyone's open calls` + `▲ UP · n $x` / `▼ DOWN · n $x` + 别人的匿名单 + `Tap UP or DOWN to start — your calls and results show here`；**第一笔起到这一场结束（30 分钟没下单）** = `YOUR CALLS · only you see these`（黄绿标题闪一下）+ 页签 `Open N · $x in play` ｜ `Settled N`。Open 行：`▲ UP` / `$5 · to win $9.23` / 小字 `@ 51.3¢ · open $80,900.87 · 23s` / 进度条 / 右侧 `undo…` → `ahead`（白）/ `behind`（灰）→ 结算后 `+$4.23` / `−$5.00`；放不下时底部渐隐 + `↓ 3 more`；空 `No open calls · tap UP or DOWN`。Settled 行：`$5 @ 51.2¢ · won` + `open 80,933.97 · close 80,950.10` + 盈亏，最多 30 条，空 `Nothing settled yet this session`，底部 `All settled calls → Portfolio`。`04 / YOUR RESULT` 内容不变，另起一块钢板放在右栏下面，第一笔之后才出现 |
| 03 / SELECT YOUR DIRECTION | 标题行右侧券条（三态：`Win 3 in a row = $2 voucher · up to $10 a day` / `Vouchers today $4 / $10 · View ›` / `Today's $10 of vouchers claimed · resets 00:00 UTC`，点 → Rewards › Vouchers）。`▲ UP`（青）/ 筹码 **$2 5 10 25 50** / `▼ DOWN`（黄绿）；键上筹码塔 = 这一边正在跑的合约，**点下去立刻进塔**（2 秒内也在）+ 键上方弹 `+$5 ▲`；2 秒内右下角黑色 `UNDO 1.6s`（金色进度条，连下几笔 `UNDO (3)`，点一下撤最近一笔）。底注：平时 `$5 in · fee $0.15 · to win $9.25 if Up`（to win = 赢了拿回的钱，含本金、已扣佣金，和主站 To win 同口径）/ 2 秒内 `Placed ✓ · undo costs $0.0075`、多笔 `3 placed ✓ · undo removes the latest` / 到上限 `Limit reached · $500 in play · room frees up as your calls settle` |

四态：**未登录**——头条 `AVAILABLE · SPOT —` + 一枚 `→ Sign in` 键，点它或点 UP / DOWN 弹站内登录；右栏 LIVE TABLE，预览线照画。**空**——没下过单 = LIVE TABLE；下过单没开着的 = Open 空提示。**加载 / 出错**——没价 `Waiting for the price`、历史不够 `Warming up · odds in a moment`、暂停遮罩 `TABLE PAUSED` + 原因 + `Open calls keep running and settle as normal`（预览线不画）。

### 4.2 机柜（移动，375）

顶栏 `logo 72px / AVAILABLE · SPOT $6,249.09（不折行）/ + / RULES / 静音` → `BTC · 30s calls · $价` + `OPEN POSITIONS $0 / $500 ⓘ`（删掉了 `$2–50 a call`）→ 四格来源价 BINANCE / HYPERLIQ. / COINBASE / BTC INDEX（不改）→ 舞台（白大价 + `▲ +$x in the last 30s`；图同桌面，刻度 52px、预览旗只写 `30s`、hover 不适用）→ 筹码带（没下过单 `LIVE TABLE N` 别人的筹码；下过单 `MY CALLS N`）→ OPEN / LIVE / SESSION（第一笔之后才出现）→ `YOUR STAKE` + 券条（`3 wins in a row = $2 voucher` / `Vouchers $4 / $10 today ›` / `Today's $10 vouchers claimed`）+ 筹码 → UP / DOWN（UNDO 26px）→ 底部 `ROAD & STATS` 窥条。抽屉：标题行右侧图例 `▲ Up ▼ Down` → 三张卡（LAST 30 MIN · BIG ROAD ⓘ · BEAD，各带时间脚）→ SESSION / LAST 10 / ⇪ SHARE → SETTLED → 猞猁 + 气泡说路单（`▲ Up 4 boxes in a row — a streak is running.` / `Flip-flopping for 5 boxes — no clear direction.` / `Mostly ▼ Down lately — 14 of the last 20 boxes.` / `Mixed — 10 up, 10 down in the last 20 boxes.`）。**手机上 ⓘ 说明、格子提示、路单说明一律是底部抽屉**。

### 4.3 反馈与猞猁

| 场景 | 看到什么 |
|---|---|
| 落筹 0–2 秒 | 筹码立刻进塔 + `+$5 ▲` 飘起；`UNDO` 键倒数；底注 `Placed ✓ · undo costs $0.0075`；Open 行尾 `undo…`；图上入场菱形 + 虚线 + 旗道 `▲ 30s` |
| 2–30 秒 | 行尾 `ahead` / `behind`；开仓虚线领先 = 本方向色、落后 = 灰；右侧价签 |
| 到期 | 旗 `…` → ✓ / ✕，1.5 秒后收走；图上赢 = 本方向色实心 ✓、输 = 灰空心 ✕、平局 = 灰横杠；`+$4.29` 飘字 + 筹码飞进余额 + 余额 bump；LAST 10 白底 ✓ / 灰框 ✕ |
| 连赢 2 | `COMBO ×2` + `⇪ SHARE` + 白字 `win 1 more → free $2 voucher` |
| 连赢 3 / 6 / 9 … | 掉一张 $2 有门槛仓位券（每天 ≤ $10）：大字 `×3 COMBO` + `+$2 voucher · in your Vouchers` + 金币雨 + `+$2 VOUCHER` 飞到券条；HUD 副行 `you got a $2 voucher!`；当天满了 `vouchers maxed today · keep it going` |
| 档位 | ×3 ON FIRE（闪）· ×5 UNSTOPPABLE（白热光 + 双倍金币 + 机柜抖）· ×8 LEGENDARY（流光字）；大字副行没掉券时写档位词 |
| 连输 | **什么都不显示**（无 LOST ×N、无红闪、无 COMBO BREAK）；LAST 10 里照样有 ✕ |
| 报价过期 / 价格跳了 | 键上价闪白，底注 `Price moved · tap again`，不扣钱 |
| 新一场 | toast `New session`；右栏回到 LIVE TABLE |
| 猞猁 | 同前（情绪 / 打盹 / 举牌 DRAGON / choppy / 跑酷） |

### 4.4 入口横幅（Events All）

「像素夜景」124px 一条（移动折成一列）：`■ QUICK PLAY` + `BTC · 30-SECOND CALLS · 24/7` / 32px 大价 / `$x · ▲ +$y · last 30s`（30 秒前的指数与变化）；右 `TIME` 条 + `00:22`（桌子的 30 秒墙钟格）/ `▲ UP 51.2¢ | ▼ DOWN 48.8¢` / PLAY ▸。只在 All（非日历、非 watchlist）出现，整条可点 → `/arcade`。指数无效：副行红字 `INDEX INVALID · WAITING FOR THE EXCHANGES`、时钟红闪、报价 `—`。读机柜同一条指数（`arcade_table_now` 每 2 秒 + 最近 45 秒 tick）。

### 4.5 分享海报「Share your run」

按场分享，入口只有 04 的 `⇪ SHARE`（移动端在 ROAD & STATS 抽屉的 04 同位置；连赢 / 大赢都不主动弹）。海报 = Lite 晒单海报家族（恒 400px 内联样式）+ Quick Play 身份：徽章 `⚡ 7 of 10 right`（亏 `📉`）、`PROFIT` / `LOST` + 等宽大字、`Called Bitcoin up or down, 30 seconds at a time`、`23 minutes · 10 calls · $5 each`（面额不一样写 `$80 staked`）、两格 `Best run · 4 in a row` / `Biggest win · +$9.20`、推荐码 + logo + CTA `Pick UP or DOWN · from $5` + 二维码 → `/arcade?ref=code`。只写净利（已扣佣金）与对了几次，不写 ROI、不出 SESSION / COMBO / LAST 10。弹层 = 站点 ShareModal。场次详情页右上 Share 出同一张海报，数字来自那一场。

### 4.6 Portfolio

- **Settled › Standard 一场一行**（不另立页签；chip 计数按场 +1；Win rate / Net profit / Record 把场里的合约一起算）：标题 `BTC 30-second calls · Oct 28, 16:47 – 16:53` + 右侧 QUICK PLAY 小牌（标题左缘与其他行对齐；移动端标题只留时间段、`BTC` 挪进副行），副行只写 `8 calls · won 5 of 8`（best run / 每注金额 / 退款 / 取消都只在详情页；一场没有任何结算时写 `no calls settled · 1 refunded · 1 cancelled`；**手机上标题与副行都允许折成两行**，不截断，标题只在 ` – ` 处断、小牌跟在标题末尾），右侧这一场净利，› 进详情。从机柜 `All settled calls → Portfolio` 过来：落 Standard，最新一场 2.2 s lime 底色后淡出，URL 参数随即去掉。
- **场次详情 `/portfolio/quick-play/<key>`**：套单仓结算详情的版式——标题 + 小牌 / `Settled Oct 28, 2026 · 16:53` / Share + `Open Quick Play ›`；三卡 Result（净利 + `Won · 5 of 8 calls right`）/ Staked（`$70.00` + `8 calls @ $5 – $25`）/ Payout（`$82.06` + `after $0.63 fees` + `Trading fee $0.08 · Winning commission $0.55`，0 写 `nothing returned`）；Details（Market `BTC · 30-second calls` / Calls / Record `5 won · 3 lost` / Best run `3 in a row` / Stake / Not settled `1 refunded · 1 cancelled` / Started / Ended + 底注 `A session ends after 30 minutes without a call.`）+ ACTIVITY（一张合约一行 `16:52:41 · Up · $5.00 @ 50.9¢` → `+$4.29`；`$0.00 · refunded` / `-$0.01 · cancelled` 灰字；最新在上，30 条一页 `Load more calls`；空 `No calls to show`）。移动端 inner header 标题 `Quick Play`，右上 Share 图标；顶部 `SETTLED · OCT 28` / `Won +$12.06` / 标题 + 小牌，下面同一组 Row。别人的 key / 不存在的 key 同一张「not found」。

### 4.7 combo 分享与 combo 券（2026-11-02）

- **combo 海报**：HUD 的 `⇪ SHARE` → 站点 ShareModal（`Share your combo`），海报暂用场次海报家族（`ArcadeComboPoster`）：徽章 `🔥 3 in a row`、`COMBO ×3 · ON FIRE`、大字 `+$13.92`（这一串连赢的净利，已扣佣金）、`Called Bitcoin up or down — 3 right in a row`、`30 seconds a call · $15 staked`、两格 `Combo ×3` / `Biggest win +$4.71`、推荐码 / logo / 二维码。**过渡版**：设计按 Liya 定的字段出 B · Fever / E · Arcade score screen 方向的正式稿后整张替换。不会自己弹。
- **combo 券**：连赢每满 3 把（×3 / ×6 / ×9 …）掉一张 **$2 有门槛（tiered）仓位券**，每个账号每个 UTC 日最多 $10。参数与 referral 发的券一致（50% 封顶、持仓 ≤ 72 h、入场价 0.20–0.80、距结算 ≥ 12 h），状态 `granted`（Rewards › Vouchers 里 `Claim voucher`），30 天内领取，来源行 `From Quick Play — 3 wins in a row`。**服务端说了算**：`arcade_settle_due` 每结完一个用户的赢单就调 `arcade_combo_vouchers(user)`——按 t1 顺序重算这个用户的连赢（void / 撤单不算，30 分钟没下单断场），每个凑满 3 的那张赢单发一张（`position_vouchers.source_arcade_call_id` 唯一，重复跑零副作用）。机柜从 `arcade_table_now().combo_today` 读今天已得，掉券那一刻先乐观 +$2，8 秒内以服务端为准。

## 5. Lovable / 正式版边界与未了账

| 项 | 状态 |
|---|---|
| 采样 500 ms、报价有效期 500 ms、600 s 历史门槛、真三所行情 | 正式版照研发稿；Lovable 见 §3.2 |
| 可用结算现金 ≥ 1.10 × total_payout、关联账户组限额、异常胜率人工复核 | 未做（演示引擎没有 USDC 专户 / 关联账户数据）；正式版必做 |
| 损失熔断恢复 | 自动按 UTC 日重置，未做人工确认 |
| 展示线（价格线的手感） | **要的效果 = Lovable 现在这条线**（CPO 2026-11-02 定：「研发按真实价格实现成这个效果」）：白色 1.8px 线带淡光，**每 100 ms 一个点**，45 秒窗口约 450 个点，线一直在细碎地跳，最新点到 NOW 之间也在动，大价 / 头部圆点 / 右侧价签跟着线走；纵轴留白 = 区间的 25%（至少 $8）。**Lovable 怎么做的**：指数是演示行情（约 2 秒一个点），两点之间用固定种子的随机游走补到 100 ms、首尾精确落在指数点上（`texSeries`，`arcade_params.display_texture` = 0 可关）——**这层是演示用的，正式版不许照抄**。**正式版**：用真实行情画到 ≥ 10 Hz（指数 500 ms 采样 + 期间的真实成交 / 盘口），做出同样的密度和跳动；开仓菱形、✓ / ✕、结算价永远只认指数 |
| 文案 / 合规措辞、i18n key | 英文占位，未进 i18n |
| 跑酷小游戏 | 桌面暂停态；移动抽屉里的猞猁只会跳 |
| combo 海报 | 过渡版（场次海报家族），设计稿到了替换 `ArcadeComboPoster` |
| combo 券预算 | 每人每天 ≤ $10，未接全站每日券池（`consume_daily_voucher_pool`）；要不要接由 CPO 定 |
| alex_carter 演示数据 | 真实落子 + 补种历史（won / lost / void / cancelled），不碰余额；三场可在 Portfolio 看到 |

## 6. 状态索引

| 编号 | key | 态 |
|---|---|---|
| AR-1 | `arcade-ar1` | 第一次进来：免责门（桌面） |
| AR-2 | `arcade-ar2` | YOUR CALLS · Open 6（最新一张在 UNDO 里）· 04 独立钢板 · COMBO ×2 · 券 $4 / $10 |
| AR-3 | `arcade-ar3` | 桌子暂停（指数无效）· 猞猁跑酷 |
| AR-4 | `arcade-ar4` | 移动 · 没下过单（LIVE TABLE 筹码带） |
| AR-5 | `arcade-ar5` | 移动 · 开着 6 张合约 |
| AR-6 | `arcade-ar6` / `arcade-ar6-mobile` | 未登录进机柜（桌面 / 移动） |
| AR-7 | `arcade-ar7` | 下过单、手上没单 · 连输三把（不显示任何连输提示） |
| AR-8 | `arcade-ar8` | 路单格子提示 |
| AR-9 | `arcade-ar9` | RULES 弹层 |
| AR-10 | `arcade-ar10` | 移动 · ROAD & STATS 抽屉（三张卡 + 猞猁气泡） |
| AR-11 | `arcade-ar11` | 移动 · 免责门（底部抽屉） |
| AR-12 | `arcade-ar12` | 没下过单 · hover UP：预览线染青 |
| AR-13 | `arcade-ar13` | YOUR CALLS · Settled 页签 |
| AR-14 | `arcade-ar14` | $500 上限 · `↓ N more` |
| AR-15 | `arcade-ar15` | ×3 COMBO 掉 $2 券 |
| AR-16 | `arcade-ar16` | ×5 · 今天 $10 已满 |
| AR-17 | `arcade-ar17` | 移动 · ×3 掉券 |
| AR-18 | `arcade-ar18` | 移动 · ⓘ 说明 = 底部抽屉 |
| AR-19 | `arcade-ar19` | Big road ⓘ 路单说明 |
| AB-1 / AB-2 | `arcade-ab1` / `arcade-ab2` | 入口横幅 桌面 / 移动 · 活体 + 指数无效 |
| AS-1 | `arcade-as1` | 分享海报 · 赚 / 亏 |
| AS-2 | `arcade-as2` | combo 海报（过渡版） |
| PF-39 | `portfolio-lite-quickplay-rows` / `-mobile` | Settled › Standard 里的三种 Quick Play 行（刚玩完 / 退款和取消 / 跨零点） |
| PF-40 | `portfolio-lite-quickplay-detail` / `-mobile` | 场次详情 · won |
| PF-41 | `portfolio-lite-quickplay-detail-lost` / `-mobile` | 场次详情 · lost · 跨零点 · 单一面额 |

## 7. 涉及文件

- 前端机柜：`src/pages/arcade/ArcadePage.tsx`（React 壳：AuthDialog / AuthSheet、`useUserProfile` 现货余额、DepositDialog `initialAccount="spot"` / TransferDialog `initialDirection="to_spot"`、`exit → /events`、`portfolio → /portfolio?tab=settled&from=quick-play`；`ARCADE_LIVE_TABLES`）、`arcadeMarkup.ts`（桌面 / 移动 / overlay 三段 DOM，含 `keyplate`）、`arcade.css`（设计师皮肤）、`arcade-v2.css`（流式舞台样式，`:is(.arcade-root .v2, .arcade-root .v2m)` 作用域；末尾含说明框 / 底部 sheet 与设计师键板 / 右栏样式块）、`arcadeEngine.ts`（控制器：服务器时钟对齐、1 Hz 轮询、落筹 / 取消 / 结算 / 对账、Binance WS + 逐段锚定的展示线、旗道、COMBO HUD、三级反馈、路单 + 格子点选、ⓘ 说明框、免责门两次轮询规则、场次 `newSession / restoreSession`、猞猁 + 跑酷、移动抽屉与底部 sheet；`mountArcade(root, api, {data?, fixture?})`；`root.__arcade.debug()`）、`src/lib/arcade/arcadeCalls.ts`（RPC 封装 + 费用 / 派彩算式 `callFee / callNet / callPayout / callCredit / callNetWin / cancelFee` + `roadCells / roadSlotInfo` + `fetchMySessions / fetchMySessionCalls`）、`src/lib/arcade/session.ts`（`ARCADE_SESSION_GAP_MIN` / `ARCADE_SESSION_NOTE` / `ARCADE_SESSION_NEW` / `arcadeSessionKey` / `arcadeSessionSpan` / `arcadeSessionMinutes`）、`src/lib/arcade/sprites.ts`（精灵图取一次转 blob URL）。
- 入口与分享：`src/components/lite/arcade/ArcadeEntryBanner.tsx` + `arcade-entry.css`；`ArcadeRunPoster` / `ArcadeShareCard`（弹层复用 ShareModal）；字体 `/fonts/arcade/press-start-2p-latin-400-normal.woff2`。
- Portfolio：`src/hooks/useArcadeSessions.ts`、`src/lib/arcade/quickPlayPortfolio.ts`（行 / 详情 / 海报 view-model 与文案规则）、`src/hooks/useLitePortfolio.ts`（场次行并进 settledRows，`kind = "quickplay"`）、`src/components/portfolio/lite/SettledList.tsx`（`QuickPlayTag`、移动短标题、`highlightId`）、`QuickPlayTag.tsx`、`QuickPlaySessionView.tsx`（桌面 / 移动纯视图）、`src/pages/lite/LiteQuickPlaySession.tsx`、`PortfolioRoutes.tsx`（`QuickPlaySessionRoute`）、`LitePortfolio.tsx`（`?from=quick-play`）、`SettlementDetailView.tsx`（`DetailTitleRow` 新增 `badge` / `viewEventLabel`，`Row` 导出）、`src/components/deposit/DepositDialog.tsx`（新 prop `initialAccount`）。
- 后端：`supabase/migrations/20261028120000_arcade_calls.sql`（主体）、`20261028190000_arcade_housekeeping.sql`、`20261028213000_arcade_always_on.sql`、`20261029163000_arcade_load.sql`、`20261029170000_arcade_sim_feed.sql`、`20261029190000_arcade_sessions.sql`；v1 的 `20261019120000_arcade_rounds.sql` / `20261019130000_quick_rounds_on_arcade_stream.sql`（站内行情流）。
- 字典 / 规范：`src/pages/StyleGuide/sections/ArcadeStatesSection.tsx` + `preview/arcadePreviews.tsx`；`PortfolioStatesSection.tsx` Ⓛ + `portfolioPreviews.tsx` PF-39…41；`DESIGN.md` §Addendum 2026-10-28 第 18–27 条；`docs/copy-dictionary.md`「Quick Play v2」节；`docs/backend-boundary.md` 2026-10-30 补录。

## 8. 验证方法

1. 行情：`select to_char(ts,'HH24:MI:SS.MS'), idx, valid, p_up, src_raw->>'synthetic' from arcade_index_ticks order by ts desc limit 5` —— Lovable 每 ~2 s 一条、valid、p_up 在 0.40–0.60；机柜大价 = 最新 `idx`。
2. alex_carter 落一枚 $5 Up → `arcade_calls` 新行（status open，t1 = t0 + 30 s，p = 当时 `p_up`，win_payout = floor(4.85 / p × 100) / 100）；`profiles.spot_balance` 减 5；transactions 多一行 `fee −0.15`。
3. 2 秒内点环 → status cancelled，余额回 +4.99，transactions `−0.01` 与 `+0.15`。
4. 30 秒后 ≤ 2 s：status won / lost / void，s0 = t0 后第一条 tick 的 idx，s1 = t1 前最近一条；赢时余额 +（win_payout − commission）；LAST SETTLED 行 open / close 与 s0 / s1 一致（实测：$5 @ 50.9¢ 赢 → 派彩 9.52、佣金 0.23、入账 9.29、pnl +4.29）。结算函数连跑两次，第二次零副作用。
5. `update arcade_params set num = 0 where key = 'live'` → 机柜几秒内 `TABLE PAUSED · The table is closed`、猞猁跑酷；改回 1 恢复。
6. Events All 横幅价格 / 赔率与 `/arcade` 同时刻一致。
7. 展示线：`document.querySelector('.arcade-root').__arcade.debug()` → 每张合约 `s0OnLine / s1OnLine` 为 true；`line == tick.p + (mid − tick.mid)`。
8. 场次：alex_carter 登录后 `/portfolio?tab=settled` → Standard 里带 QUICK PLAY 小牌的行数 = `select count(*) from arcade_my_sessions()`（以 alex 身份）；点一行 → 三卡数字与 `arcade_my_sessions` 同行一致（`payout − staked = pnl(won+lost)`），ACTIVITY 条数 = 该场非 open 合约数（> 30 条出现 `Load more calls`）；机柜里闲 30 分钟后再下一单 → toast `New session`、SESSION 归零；刷新机柜 → 最近 30 分钟内的合约复原成同一场（SESSION 金额 = 这一场 pnl）。
9. 未登录 `/arcade`：头条 `AVAILABLE · SPOT —` + `→ Sign in`（移动 `SIGN IN`）；点 UP → 登录弹窗（移动为底部 AuthSheet）；登录后不误弹免责门（alex 已接受过）。点 ⓘ 说明框完整可见；点珠盘 / 大路任一格 → 白边 + `THIS SLOT` 位置 4 秒显示那格的时间 / 涨跌 / 开收。
10. 桌面头条 `+ Deposit` → 站内 Deposit 弹窗且账户预选 Standard；`⇄ Transfer` → Transfer 弹窗预选转入现货；关掉余额刷新。移动端 `+` → `/deposit`。
11. 移动端 375：免责门、RULES、ROAD & STATS、登录全部从底部升起；MY CALLS 筹码带不被裁切。
12. 站内行情条 BTC ≈ 机柜指数（`select open_price from arcade_rounds where symbol='BTC' order by start_at desc limit 1`）。
13. 字典：`/style-guide` 交易页 + Portfolio 节点，`scripts/sg-overflow-scan.js` 除 Radix sr-only "Close" 外 0 命中；PF-39 三条副行只有 `BTC · N calls · won x of N`；第三条跨零点标题两行 `Oct 29 23:50 –` / `Oct 30 00:12` + 小牌，无 `…`。

## 9. 本需求不碰的东西

- 5m / 15m / 1h / 4h / 1d 快轮页、Pro 终端、Wallet 流水组件：不在本需求内（只是它们的 BTC 价锚到同一指数）。
- Portfolio 的 Live tab、Boost / Standard 分段逻辑、单仓结算详情：不变（场次行只是多一种 `kind`）。
- 分享弹层 ShareModal、Lite 晒单海报家族：不变（新增一种海报）。
- 登录 / 入金 / 划转组件：不变（机柜复用，DepositDialog 多一个可选 prop）。

## 附 · 代号 ↔ 章节

| 代号 | 指 | 章节 |
|---|---|---|
| AR-1…AR-11 / AB-1 AB-2 / AS-1 / PF-39…41 | style-guide case | §6 |
| 像素夜景 | Events All 入口横幅的视觉方案名 | §4.4 |
