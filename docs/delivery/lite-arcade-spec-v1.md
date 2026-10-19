# Quick Play 专区（/arcade · 30s / 1m Up/Down）— 交付说明 v1

日期：2026-10-19 · 范围：新页面 `/arcade`（桌面 + 移动）+ Events「All」入口横幅 + 后端轮次 / 结算 · 决策：Liya（CPO）2026-10-19 拍板 · Lovable commit `2893c674`（后端 + 页面）/ 本轮第二笔（入口 + style-guide + 文档）· 状态：**内测可玩，真数据真下单；文案占位**

## 通俗导读

上一轮把"筹码上桌"做到了 5m / 15m 快轮页。CPO 实际玩过之后判断：这套节奏（落筹、看路单、三十秒出结果）属于 30 秒和 1 分钟的局，不属于 5 分钟。所以这轮做了三件事：

1. **5m / 15m 回到原来的 Classic 页**（合约面板、Boost 照旧），Table 的分叉拆掉。
2. **单开一个专区 `/arcade`**：加密 BTC / ETH / SOL 的 30s 和 1m 桌全天开；美股 AAPL / NVDA / TSLA / COIN 的 1m 桌只在美国现金时段开。走**现货账户**，**没有 Boost**，赢了一份额付 $1，最多亏本金；收盘价等于开盘价这一局作废退钱。
3. **视觉是设计师的街机机柜**，原样搬进来，**全屏**（没有站点 header / footer，机柜右上 ✕ 回 Events；桌面一屏、移动一屏 + 抽屉），只换了数据：价格走势、轮次、路单、余额、下单、今日战绩全是真的。

### 一句话规则

- 选筹码（$10 / 25 / 50 / 100 / 500）→ 点 UP 或 DOWN（或把筹码拖上去）→ 筹码在按钮上转 1.5 秒（这时点一下能撤回）→ 自动按当前份额价市价买入。
- 同一局只持一边；再往同一边放就加仓；**往对面放 = 净额冲减**（CPO 终拍，和平台其他现货交易一样）：这枚筹码换到的份额先一份对一份把手里的持仓抵掉（按隐含价 1−p 成交、盈亏实打实），抵完还有剩的才开到对面。
- 30 秒局不能 Cash out（拿到底）；1 分钟局可以随时 Cash out（卖出，25 / 50 / 100%）。
- 结算时客户端立刻开奖（金币雨 / 路单弹入 / 猫欢呼），钱在 30 秒内由服务端入账。

### 易混点辨析

1. **为什么没有 Boost**：二元结算（最后只有 0 和 1）下，Boost 把赢的部分放大、亏的部分却封顶在保证金，用户期望收益为正、台子稳亏；真平台的连续 mark price 能提前强平，30 秒局没有这个时间。所以专区 = 现货 = 份额。
2. **净额冲减**：专区沿用现货轨的"买对面 = 先用份额抵掉持仓、剩下的才开新仓"（CPO 2026-10-19 终拍：不能和平台其他交易逻辑不一样）。实测：持 Up 78 份，往 DOWN 放 $500（74¢ → 674 份）→ Up 78 份按 26¢ 平掉（−$4.68），剩 596 份开成 Down（$441.04），页面记分板随之显示 `Down · $441 on the table`。底注 / toast 都把"抵掉多少、剩多少"说出来。常量 `ARCADE_FLIP` 保留"全平再开"备选。
3. **价格是演示的，但两边一致**：每一局有一个种子，SQL（`public.arcade_path`）和前端（`src/lib/arcade/arcadePath.ts`）用同一个算法算同一条线，收盘价一字不差，所以不会出现"看着在上面结果判 Down"。同一币种的 30s 桌和 1m 桌读同一条流，1m 一局正好是它跨的两局 30s。真平台换真实参考价，这一点只对 Lovable 演示引擎。
4. **站内行情条的 $48k 和专区的 $67k 对不上**：行情条、日线、快轮、专区各有各的演示价格源，这是老问题，本轮没动。
5. **DB 里的事件名带 UTC 时间**（`BTC — up or down? (30s · 03:51:00 UTC)`）：30 秒一局同名的话，现货下单的"对侧持仓"匹配会把上一局的腿当成这一局的，所以名字里带了轮次起点；页面上显示的是用户本地时间。

## 用户视角

| 场景 | 看到什么 | 做什么 |
|---|---|---|
| 进 `/arcade`（默认 BTC 30s） | 全屏机柜（右上 ✕ 回 Events）：题目 `Will BTC close above $X?`、Available 余额、CRYPTO/STOCK 与 30s/1m 键、路单条、价格舞台 + 梯子 + 倒计时、UP / 筹码 / DOWN、记分板 | 选筹码 → 点 UP/DOWN |
| 落筹后 1.5 秒内 | 按钮上一枚筹码带倒数环，底注 `Filling $25 · tap chip to cancel` | 点筹码撤回 |
| 成交 | toast `Up · $25 in → win +$17 if BTC closes above $X`，按钮变 held 态（筹码堆 + Position $25），记分板出 This round / Live | 等结果或（1m）Cash out |
| 往对面放 | 底注 `Nets $25 against your Up · tap chip to cancel` → 成交 toast `Down · $25 in · netted against your Up → Up reduced by N sh · M sh left`（或 `Up closed · Down N sh opened`） | 平台现货统一逻辑 |
| 结算 | 赢：金币雨 + `+$17` 大字 + 路单弹入；输：红闪抖动；Today 更新、最近 10 局打 ✓/✕ | 下一局自动开始 |
| 切 STOCK（盘外） | 图表区 `MARKET CLOSED · 下一场 Mon 09:30 ET · in Xh Ym`，UP/DOWN 置灰，30s 键禁用 | 换回 CRYPTO 或等开盘 |
| 未登录点 UP | toast `Sign in to play` + 登录弹窗 | 登录后持仓 / 今日战绩自动加载 |
| Events「All」 | chips 带下一条横幅：QUICK PLAY · 实时 BTC 价格线 · 本局倒计时 · UP/DOWN 价 · PLAY | 点整条进专区 |
| 移动端 | 全屏一屏机柜（右上 ✕ 回 Events）；`ROAD & STATS` 窥条上滑开抽屉 | 同桌面 |

## 研发 / 测试视角

### 后端（已在真库执行，migration `supabase/migrations/20261019120000_arcade_rounds.sql`）

- 表 `public.arcade_rounds`（id / symbol / kind / tf / start_at / end_at / open_price / close_price / seed / steps / sigma / winner），RLS 只读对所有人开放。
- `roll_arcade_rounds()`：pg_cron **每 30 秒**（job 22）——结算到期局（算收盘价 → 定胜负 / 作废 → 写 events / event_options → `settle_arcade_round`）→ 为每张活桌保证"当前局 + 下一局"存在（`arcade_open_round`，同币种一条价格流 `arcade_state_at`）→ 清理 6 小时前没人下过单的局。
- `settle_arcade_round(event_id, void)`：只认本轮 option_id 的现货仓；赢 = size × $1，5% 佣金扣在（利润 − 手续费）上，现金进 `profiles.spot_balance`，写 transactions；`void = true` 按成本退款，`close_reason = 'void'`。
- 每局同时写一对 `events` / `event_options`（subtype `ARCADE_UPDOWN_SPOT`，`product_lines = ['spot']`），所以 Portfolio、结算记录、海报等现有链路不用改。
- 美股时段：`us_session_open(at)`，周一到周五 09:30–16:00 America/New_York，无节假日表。

### 前端

- 路由 `/arcade?table=BTC&tf=30s`（`src/App.tsx`）；页面 `src/pages/arcade/ArcadePage.tsx`（React 壳：AuthDialog、useUserProfile 现货余额、useReferral、`exit` → `/events`；**无站点 header / footer**）。
- 机柜 = 设计师 HTML 原样：`arcadeMarkup.ts`（桌面 + 移动两套 DOM）、`arcade.css`（全部选择器 scoped `.arcade-root`）、`arcadeEngine.ts`（控制器，`mountArcade(root, api, opts)` 返回卸载函数）。React 只喂 `api`（余额 / buy / sell / 持仓 / 今日 / 推荐码 / 登录门）。
- 下单：`executeSpotTrade`，买 = `{side:'buy', price: 份额价, quantity: ⌊(筹码 − 0.15%)/价⌋, fee}`，卖 = `{side:'sell', price, quantity}`；余额走 `deductSpotBalance / addSpotBalance`，与 `LiteOrderPanel` 一字不差。
- 价格 / 轮次：`src/lib/arcade/arcadeTables.ts`（`fetchArcadeTable` 当前 + 下一局 + 60 局历史，15s 轮询 + 换局时刷新）、`arcadePath.ts`（LCG 路径、`arcadeNextOf` 本地续局、`arcadeEventName`）。
- 入口横幅 `src/components/lite/arcade/ArcadeEntryBanner.tsx`（桌面钢板 + 整圈跑灯 `ARCADE_BANNER_LIGHTS = true`，移动 CRT），挂在 `LiteEventsPage` All 视图舞台之上（`isStageView || isMobileStage`，非日历非 watchlist）。
- 字体 `public/fonts/arcade/*.woff2`（Jersey 10 / VT323 / Chakra Petch，OFL，自托管；`ensureArcadeFonts()` 按需注入）；素材 `public/arcade/*.png`（设计师文件里的猫 / 金币 / 分享图原样取出）。
- style-guide：`/style-guide` 交易页「/arcade · Quick Play」节（AR-1…AR-4、AB-1 / AB-2），引擎 fixture 模式（`opts.fixture = {nowMs, snapshot}` 冻结时钟 + 零网络）。

### 验证方法

1. `localhost:5173/arcade`：倒计时与 `select start_at, end_at from arcade_rounds where symbol='BTC' and tf='30s' and winner is null` 一致；换局时 open = 上一局 close。
2. alex_carter 落一枚 $25 Up → `positions` 出现 `option_id = arcade-btc-30s-…-up`，`product_line = spot`，size = ⌊(25 − 0.04)/价⌋；`spot_balance` 减 size×价 + 0.04。
3. 局结束 ≤30s：该行 `status = Closed`，`pnl` = 赢 size − margin（扣 5%）/ 输 −margin，与页面 Today 一致（本轮实测：输 −$24.82，服务端 13 秒后入账）。
4. 切 AAPL：盘外遮罩 + 禁用；`select public.us_session_open()` 为 false。
5. Events All 横幅的价格 / 倒计时与 `/arcade` 同时刻一致。

## 边界 / 未了账

| 项 | 状态 |
|---|---|
| 翻面语义 | 净额冲减（CPO 终拍，`ARCADE_FLIP = net`） |
| 文案 / 合规措辞、i18n key | 占位英文，待措辞轮 |
| Share 卡 | 设计师卡：Copy Link = 真推荐链接，X / Telegram 直链，Save = 长按提示；站内海报服务未接 |
| 10s 轮、memecoin 桌、积分模式 | 未做（见 DESIGN 附录第 6 条） |
| 入口 A（Classic 快轮页右栏卡）/ B（crypto 分类首格） | 未做，等 All 横幅数据 |
| 美股节假日 | 无节假日表，节假日会按工作日开桌 |
| 价格源不一致（行情条 vs 专区） | 老问题未动 |
| alex_carter 演示数据 | 当日已有真实落子记录；补种的历史战绩见 commit 说明 |
