# Quick Play 专区 v2（/arcade · BTC 30 秒合约 · 流式舞台）— 交付说明 v2

日期：2026-10-28 · 范围：`/arcade` 整页重做（桌面 + 移动）+ 真实三所价格流 + 每笔独立合约的下单 / 取消 / 结算后端 + Events「All」入口横幅改读同一价格 · 决策：Liya（CPO）2026-10-27 / 10-28 拍板（研发稿《BTCUSDT_30秒与1分钟涨跌产品设计_v1.0》+ 她的修订；交互按 mock claude.ai/artifact/6AmwMxsb3aNDUgVDZ8epWJ v26 逐条复刻）· 状态：**内测可玩，真价格真下单；文案英文占位**

取代 v1（`lite-arcade-spec-v1.md`）里关于 BTC 桌的全部玩法；v1 的共享 30 秒轮次只剩"站内行情流"这一个用途（见下文"价格流"）。

## 通俗导读

v1 是"一局 30 秒，大家一起等开奖"。CPO 看了研发稿之后改成：**没有"局"，每一枚筹码就是一张自己的 30 秒合约**——你什么时候落下去，就从那一刻开始数 30 秒，到点各自结算。于是整个舞台改成"流式"的：

1. **图是一条时间轴**：左边 45 秒是过去的价格，右边 30 秒是未来。每张合约在图上是一个入场小菱形 + 一条开盘价虚线 + 右端一面到期小旗（写着还剩几秒）。到点旗子翻成 ✓ / ✕，原地飘一个 `+$4.29` / `−$5.00`，筹码从键上飞进余额，然后在图上留一个 ✓ / ✕ 小圆点直到滚出画面。
2. **右边一栏 MY CALLS**：每张合约一行（方向 / 投入 @ 报价 / 开盘价 / 30 秒进度条 / 此刻领先还是落后），前 2 秒显示 `cancel`；到点那行闪一下滑进下面的 LAST SETTLED（只留最近一张，完整记录去 Portfolio）。开着的合约全部都在列表里，装不下就在列表内滚。旁边 TABLE 页签看桌上其他人的单（匿名），顶部有 UP / DOWN 两边各压了多少的汇总。右栏底部是 04 / YOUR RESULT 四行记分板（OPEN / LIVE / SESSION / LAST 10）。
3. **反馈分三级**，不再一局一场金币雨：每张合约 = 旗翻牌 + 数字飘 + 筹码飞；一秒内同时结的几张只 bump 一次余额；**连赢 ×3 才金币雨 + 大字 COMBO**，连输 ×3 红闪一次。跳舞机式 COMBO HUD 常驻在图表头：`COMBO ×2 · 1 more → ×3 bonus`。
4. **键不锁**：结算过程中 UP / DOWN 照样能点。键上的筹码塔 = 这一边正在跑的合约（按面额归堆，最新一枚带 2 秒取消环）。
5. **价格是真的**：Binance / Hyperliquid / Coinbase 三家中间价（都换算成 USDT 计价）取中位数，每秒一次写进库，机柜底下常驻显示三个来源价 + `LIVE · 3 of 3`。

### 一句话规则

- 进来先过一次免责门（每个账号只弹一次）：`Each chip = one 30-second call · 2 seconds to cancel · 3% in · 5% of profit out · High risk · $5–100 a call · $500 open max`。RULES 键 / `How the price and odds are made →` 打开六段完整规则。
- 选筹码（$5 / 10 / 25 / 50 / 100）→ 点 UP 或 DOWN → 服务端按你看到的那个报价成交（报价 0.40–0.60，三位小数，UP + DOWN = $1.00）；筹码里含 3% 开仓费。
- 2 秒内点筹码上的环可以取消：按开盘价原价平掉，只收平台平仓费 0.15%（开仓费一起退）。2 秒后锁定，**没有 Cash out**。
- 30 秒后结算：开盘价 S0 = 服务端接单后第一条有效指数（不是你点之前的价）；收盘价 S1 = 到期时刻及之前最近一条有效指数（最多等 2 秒迟到行情）。S1 > S0 → Up 赢。赢 = (筹码 − 3%) ÷ 报价 向下取分，再扣利润的 5%；输 = 筹码没了；平局或没有有效价 → 全额退款含费。
- 限额：单笔 $5–100、单账户未到期 ≤ $500、每秒 ≤ 2 笔；全桌最坏损失 ≤ $10,000（满了显示 TABLE FULL）；指数无效 / 一秒跳超 10 bps / 平台当日亏损触顶 → TABLE PAUSED（已开的照常结算）。暂停时猞猁窗口变成小恐龙跑酷。

### 易混点辨析

1. **"看着在上面却判输"**：因为 S0 不是你点的那一刻的价，是服务端接单之后第一条有效指数（研发稿 4.2 + Jason 评论：堵"用户比我们早 0.5 秒看到价格"的漏洞）。图上的入场菱形画的就是 S0，MY CALLS 行里也写 `open $81,155.30`。
2. **三个来源价不一样是正常的**：Binance 是 BTC/USDT，Coinbase 是 BTC-USD，Hyperliquid 是 BTC/USDC（现货对 `@142` = UBTC/USDC，不是永续 `BTC`——永续带资金费溢价，10-28 实测高 10 bps）。USD / USDC 报价用 Coinbase 的 USDT-USD 实时汇率换算成 USDT 计价后取中位数，所以指数永远落在三家中间。
3. **报价会跳**：研发稿模型用最近 10 分钟一秒级收益算 z30 / z60，30 秒内跌 4 bps 时 UP 会报到 0.43 左右，是模型本身敏感（这是他们的候选系数，不是前端算的）。前端不再因为报价变动闪键，只在被拒单（`Price moved · tap again`）时闪。
4. **feed 节奏 ≈ 1.2 秒一条，不是研发稿的 500 ms**：Supabase 里 pg_cron 最快每秒跑一次、pg_net 的发送线程也是秒级，实测一条 tick 1.2 秒，偶尔 2–3 秒。所以演示引擎把"报价有效期 / 指数过期 / S1 新鲜度"三个口径放宽到 2.5–4 秒（`arcade_params` 可调，真平台照研发稿 500 ms）。模型需要的 600 秒历史放宽到 120 秒起报价（RV 按比例放大到 600 秒）。
5. **SESSION 和 LAST 10 的口径不同**：SESSION 是"你这次打开机柜以来"的盈亏和胜负，刷新归零；LAST 10 和 COMBO 读你账号的历史（刷新不丢）。这笔 cancelled 的不进 LAST 10。
6. **TABLE 页签里的人**：真用户的未到期合约 + 桌子冷清时每秒 12% 概率补的匿名模拟单（`bot_name` 像 `kz***88`，不占限额、不碰钱、不进任何账本；`arcade_params.sim_table = 0` 关掉）——与站内 `market_activity` 模拟成交流同一先例。

## 用户视角

| 场景 | 看到什么 | 做什么 |
|---|---|---|
| 第一次进 `/arcade`（已登录） | 四行免责门 `BEFORE YOU PLAY` + `I GET IT · START PLAYING` + `How the price and odds are made →` | 点一次以后不再弹（`arcade_acks`） |
| 未登录点 UP | 登录弹窗 → 登录后弹免责门 | |
| 机柜 | 头条：`BTC · 30-second calls` / `YOUR OPEN $0 / $500` / `AVAILABLE · SPOT` / `+ Deposit` `⇄ Transfer` `Rules`；路单条（珠盘 + 大路 + Up/Down 统计 + ⓘ 怎么看）；舞台（一行：`02 / LIVE FEED` 题牌 / 大价 / COMBO HUD / `NEXT SETTLE · 12s`，第二行三来源 + `LIVE · 3 of 3`）；右栏 MY CALLS / TABLE + LAST SETTLED + `04 / YOUR RESULT`（OPEN / LIVE / SESSION / LAST 10）；UP / 筹码 / DOWN；猞猁窗。桌面只有这四行，图表行吃掉剩余高度（最矮 400px） | 点 UP / DOWN |
| 落筹 0–2 秒 | 键上一枚带倒数环的筹码，底注 `tap chip to cancel · costs $0.01`；MY CALLS 行尾 `cancel`；图上入场菱形 + 虚线 + 右端 `30s` 小旗 | 点环取消 → toast `Cancelled · $0.01 close fee` |
| 2–30 秒 | 筹码进塔（同面额归堆 ×N）；行尾 `ahead` / `behind`；LIVE 牌 `+$4.35`（此刻全结的话） | 可以继续落（同向 / 反向都行，各自独立） |
| 到期 | 旗翻 ✓/✕ + `+$4.29` 飘字 + 筹码飞进余额 + 余额 bump；行闪后滑进 LAST SETTLED（`$5 @ 50.9¢ · won · open 81,155.30 · close 81,194.73`）；LAST 10 打勾；图上留 ✓ 圆点 | — |
| 连赢 2 | 图表头 `COMBO ×2 · 1 more → ×3 bonus`（三格 pips） | — |
| 连赢 3 / 6 / 9 | 金币雨 + 大字 `×3 COMBO · keep it rolling · next bonus at ×6` + 猞猁欢呼 | — |
| 连输 2 / 3 | `LOST ×2` 红色 HUD；×3 红闪一次 + `×3 LOST · take a breath` | — |
| 报价过期 / 价格跳了 | 键上价闪白，底注 `Price moved · tap again`，不扣钱 | 再点一次 |
| 指数无效 / 市场熔断 / 当日亏损触顶 | 图表盖 `TABLE PAUSED` + 原因，UP/DOWN 置灰，底下三来源价变红 `INDEX INVALID`；猞猁窗变跑酷（点窗口 / 空格跳陨石，本地最高分） | 等恢复 |
| 全桌满额 | `TABLE FULL · Room opens as calls settle` | 等别人的单结算 |
| 猞猁 | 会话赚钱时昂首阔步、亏钱时耷拉；60 秒没人碰就打盹（zzz）；大路同色 ≥5 格举牌 `DRAGON ×5 ▲`、交替 ≥6 格举牌 `choppy…`；新手 8 秒没下单时举牌 `new here? tap ⓘ ↗` | 点它有表情 |
| 移动端 | 顶栏（logo / Available / + / RULES / 静音）→ `BTC · 30s calls · $价` + `YOUR OPEN` → 四格来源价 → 舞台 → `MY CALLS` 筹码带（没有自己的单时显示 `TABLE N` 别人的）→ OPEN / LIVE / SESSION → 筹码 → UP / DOWN → 底部 `ROAD & STATS` 窥条（最近 10 格）→ 抽屉：路单 + SESSION / LAST 10 + SETTLED + 猞猁 | 同桌面 |
| Events「All」横幅 | `QUICK PLAY · BTC · 30-SECOND CALLS · 24/7` + 实时指数价格线 + `UP 51.2¢ / 30 SEC / DOWN 48.8¢` + PLAY；指数无效显示 `PAUSED` | 点整条进专区 |

## 研发 / 测试视角

### 后端（已在真库执行；migration `supabase/migrations/20261028120000_arcade_calls.sql` 可整文件重放）

- **参数表 `arcade_params`**（key / num / txt / note）：费率、限额、熔断阈值、模型系数、`quote_ttl_ms`（2500）、`tick_max_age_ms`（4000）、`settle_src_age_ms`（2500）、`min_history_sec`（120）、`sim_table`（1）、`live`（1 = 开桌，0 = 全桌停新单）、`hl_spot_coin`（`@142`）。改参数即时生效，不用改代码。
- **价格流 `arcade_feed_tick()`**，pg_cron `arcade_feed` 每秒（job 23）：① 收上一批 pg_net 应答（Binance bookTicker / Hyperliquid l2Book `@142` / Coinbase BTC-USD ticker / Coinbase USDT-USD ticker，FIFO、四个都到或超 3 秒才收，一批一 tick；同一秒的重复批丢弃）→ ② 算 mid、点差 ≤ 2 bps 过滤、USD → USDT 换算、≥2 源取中位数（只剩 2 源且偏差 > 5 bps 判无效）→ ③ 写 `arcade_index_ticks`（含 r1 / r30 / r60 / RV600 / `p_up` 模型报价 / 原始 bid-ask 快照）→ ④ 更新 `arcade_table_state`（paused_reason：index / breaker / loss / full / off；worst_loss；60 分钟 / 当日平台净亏）→ ⑤ `arcade_settle_due()` 结到期合约 → ⑥ 桌子冷清时 `arcade_sim_tick` 补匿名单 → ⑦ 发下一批请求。整个 tick 用 advisory lock 防重入。
- **报价模型**（研发稿 2.1，参数全在 `arcade_params`）：`z30 = clip(r30 / sqrt(max(RV600·30/600, 1e-12)), −5, 5)`，`p = round_3(clip(sigmoid(0.010495 + 0.106198·z30 + 0.030205·z60), 0.40, 0.60))`；历史不足 120 秒或 30 / 60 秒点缺失 → `p_up = NULL` → 前端 `Warming up · odds in a moment`、键置灰。
- **下单 `arcade_place(side, gross, quote_ts)`**（SECURITY DEFINER，auth.uid()）：校验免责已接受 / 筹码档位 / 桌子未暂停 / 最新 tick 有效且 ≤ 4 s / 报价 tick 存在且 ≤ 2.5 s / 指数漂移 ≤ 1 bp / 单账户未到期 ≤ $500 / 每秒 ≤ 2 笔 / 全桌 worst_loss ≤ $10,000 / 余额够 → 扣 `spot_balance` 整枚筹码 → 写 transactions `fee −3%` → 插 `arcade_calls`（t0 = `clock_timestamp()`，t1 = t0 + 30 s，p / win_payout 当场锁定）→ 返回整行 + 新余额。任一校验失败 RAISE 人话（`Price moved · tap again` / `$500 max open per account` / `Table full · room opens as calls settle` …），不扣钱。
- **取消 `arcade_cancel(id)`**：本人、status = open、`clock_timestamp() ≤ t0 + 2 s`；退 `gross − round(gross × 0.15%)`，status = cancelled，transactions 两行（`cancel −0.15%` / `fee returned +3%`）。
- **结算 `arcade_settle_due(user)`**：到期合约（t1 ≤ now）在"已有 ts ≥ t1 的 tick"或"t1 + 2 s"后结：S0 = t0 之后第一条有效 tick，S1 = t1 及之前 ≤ 2.5 s 内最近一条有效 tick；无 S0 / S1 或相等 → void 退 gross；赢 → `credit = win_payout − round(5% × (win_payout − gross))` 进余额，transactions `trade_profit` + `winning_commission`；输 → `trade_loss −net`。`FOR UPDATE SKIP LOCKED` + status 检查 → 幂等。cron 每秒扫全部；客户端到点调 `arcade_settle_mine()` 只结自己的，结果立刻返回。
- **读接口**：`arcade_table_now()`（最新 tick + 桌态 + 参数 + 我的未到期总额 + 免责时间，一次 RPC，前端每秒轮询）、`arcade_index_ticks`（RLS 全开只读，图表拉最近 60 s + 增量）、`arcade_road(120)`（30 秒格的 open / close，路单）、`arcade_my_calls(since)`、`arcade_table_feed()`（全桌未到期，用户名打码 `al***er`）、`arcade_accept_terms()`。
- **站内其他页的 BTC 价**：`roll_arcade_rounds` 每 30 秒开新 BTC 局时 open 改取 `arcade_real_btc()`（最近 10 秒内的有效指数），所以首页行情条 / 5m 15m 1h 4h 1d 快轮 / 横幅都跟着真价走；ETH / SOL / 美股仍是演示 LCG 流。
- 审计：每张合约存 quote_ts / quote_idx / t0 / t1 / s0 / s0_ts / s1 / s1_ts / p / p_up / fee / net / win_payout / commission / pnl；每条 tick 存三家 bid-ask 原始值（`src_raw`）。

### 前端

- `src/pages/arcade/ArcadePage.tsx`（React 壳：AuthDialog、`useUserProfile` 现货余额、`exit → /events`、`deposit → /deposit`、`transfer → /wallet`；`ARCADE_LIVE_TABLES = ['BTC']`，ETH / SOL / 美股桌隐藏）。
- `arcadeMarkup.ts`（桌面 / 移动 / overlay 三段 DOM，mock v26 结构 + 设计师钢板壳）、`arcade.css`（设计师皮肤，旧轮次版选择器保留不删）、**`arcade-v2.css`**（流式舞台全部新样式，`:is(.arcade-root .v2, .arcade-root .v2m)` 作用域）、**`arcadeEngine.ts`**（控制器：服务器时钟对齐、1 Hz 轮询、落筹 / 取消 / 结算 / 对账、图表时间轴与旗道、combo HUD、三级反馈、路单、猞猁 + 跑酷、移动抽屉；`mountArcade(root, api, {data?, fixture?})`）。
- `src/lib/arcade/arcadeCalls.ts`：RPC 封装 + 费用 / 派彩算式（与 SQL 同口径：`callFee / callNet / callPayout / callCredit / callNetWin / cancelFee`）+ `roadCells`。
- 时钟：所有倒计时 / 旗子 / 图表都按**服务器时间**（`arcade_table_now().now − Date.now()` 做偏移），所以本机时间不准也不影响。
- 入口横幅 `ArcadeEntryBanner.tsx` 改读 `arcade_table_now` + `arcade_index_ticks`（每 2 秒），倒计时换成 `30 SEC` 徽章。
- style-guide：交易页「/arcade · Quick Play」节 AR-1（免责门）/ AR-2（6 张未到期 + 3 张已结 + 会话）/ AR-3（指数无效 → 跑酷）/ AR-4（移动空桌）/ AR-5（移动持仓）/ AB-1 / AB-2，引擎 fixture 模式（`opts.fixture = {nowMs, ticks, calls, feed, road, state, ack, session}`，零网络）。

### 验证方法

1. `select to_char(ts,'HH24:MI:SS.MS'), idx, valid, p_up from arcade_index_ticks order by ts desc limit 5` —— 每 ~1.2 s 一条、valid、p_up 在 0.40–0.60；机柜大价 = 最新 `idx`，三来源 = `binance / hyperliquid / coinbase`。
2. alex_carter 落一枚 $5 Up → `arcade_calls` 新行（status open，t1 = t0 + 30 s，p = 当时 `p_up`，win_payout = floor(4.85 / p × 100) / 100）；`profiles.spot_balance` 减 5；transactions 多一行 `fee −0.15`。
3. 2 秒内点环 → status cancelled，余额回 +4.99，transactions `−0.01` 与 `+0.15`。
4. 30 秒后 ≤ 2 s：status won / lost / void，s0 = t0 后第一条 tick 的 idx，s1 = t1 前最近一条；赢时余额 +（win_payout − commission）；页面 SETTLED 行 open / close 与 s0 / s1 一致（10-28 实测：$5 @ 50.9¢ 赢 → 派彩 9.52、佣金 0.23、入账 9.29、pnl +4.29）。
5. `update arcade_params set num = 0 where key = 'live'` → 机柜几秒内 `TABLE PAUSED · The table is closed`、猞猁跑酷；改回 1 恢复。
6. Events All 横幅价格 / 赔率与 `/arcade` 同时刻一致。

## 边界 / 未了账

| 项 | 状态 |
|---|---|
| 采样节奏 500 ms、报价有效期 500 ms、600 s 历史门槛 | 演示引擎放宽（1.2 s / 2.5 s / 120 s，`arcade_params`），真平台照研发稿 |
| 可用结算现金 ≥ 1.10 × total_payout、关联账户组限额、异常胜率人工复核 | 未做（演示引擎没有 USDC 专户 / 关联账户数据） |
| 损失熔断恢复 | 自动按 UTC 日重置，未做人工确认 |
| Portfolio / 钱包流水 | 合约只进 `arcade_calls`（机柜 LAST SETTLED / LAST 10）；钱包 transactions 有 fee / profit / loss / commission 行；**CPO 10-28 定：Portfolio 加一个 Quick Play 页签放完整记录（下一轮做）**，机柜右栏的 `All settled calls → Portfolio` 已指向 `/portfolio` |
| 入口横幅 | Events All 页横幅 10-28 换成入口比稿方案 C「像素夜景」（`src/components/lite/arcade/ArcadeEntryBanner.tsx` + `arcade-entry.css`）：读同一条指数；右侧 TIME 是桌子的 30 秒墙钟格，不是局；指数无效显示 INDEX INVALID，不出假数字 |
| 演示引擎稳定性 | 10-28 观察到 pg_cron `arcade_feed` 每 10–15 分钟有一次 2–12 秒的停顿、11:04 一次 60 秒（与 Lovable 发布 / 重查询同时），停顿后一次性收多批应答会在同一秒写入多条不同价的 tick；已做（CPO 10-28 批）：`arcade_housekeeping` 每 10 分钟跑一次——`cron.job_run_details` 两个秒级任务只留 1 小时、其余任务留 7 天（当时 40 万行 / 76 MB → 4 万行）、`arcade_index_ticks` 留 24 小时、`arcade_feed_req` 丢 2 分钟前没回的批次（migration `20261028190000_arcade_housekeeping.sql`）；feed 的锁等待上限仍待做，先观察清理后停顿是否消失。真平台按研发稿自己的行情服务，不走 pg_net |
| 展示线 | 内测版图上的线 = Binance 盘口实时流（为了一直在扭的手感）+ 指数基差；**主网直接画指数线**，Binance 流只是演示用，页面上不写说明（CPO 10-28） |
| Share 海报 | 本轮未做（mock 里没有；待定） |
| 文案 / 合规措辞、i18n key | 英文占位 |
| ETH / SOL / 美股桌 | 隐藏（`ARCADE_LIVE_TABLES`），后端旧轮次流照跑给站内行情用 |
| 跑酷小游戏 | 桌面；移动抽屉里的猞猁只会跳 |
| alex_carter 演示数据 | 10-28 真实落子 4 笔 + 补种 8 笔历史（won / lost / void），不碰余额 |
