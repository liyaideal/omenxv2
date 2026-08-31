# Copy Dictionary

Single source of truth for user-visible field names across the app.

**Rules**
- Sentence case for labels (except proper nouns). Never Title Case mid-UI.
- Numbers, codes, addresses → `font-mono` (JetBrains Mono).
- Code-level field names (e.g. `redeemableCapPct`, `maxHoldingHours`) stay in `camelCase` and are **not** governed by this doc — only the user-facing strings are.
- Before adding or renaming any user-facing field, **check this file first**. If the term is not here, add it before shipping.

## Lite 术语对照表（Lite ↔ 交易口径）

测试 / 研发 / 运营用交易口径提问时先查这张表；改 Lite 用词前先改这里。

| 交易口径（禁止出现在 Lite UI） | Lite 用户可见词 | 规则出处 |
|---|---|---|
| 杠杆 / Leverage | **Boost**（`2× Boost`；1× 不显示） | Lite banned words；`boostSuffix()` |
| 强平 / 爆仓 / Liquidation / stopped out | **auto-close**（settled 备注 `auto-closed`；`close_reason = auto_close`） | Close-reason remarks |
| 强平价 / Liq. Price | **auto-close ≈{c}¢**（账户级；两态：价或 none） | Portfolio (Lite) 节；docs/delivery/autoclose-v1.md §2–4 |
| Margin ratio / Margin call 面板 / 风险度 | **Boost check**（Healthy / Getting tight / Auto-close soon） | Portfolio (Lite) 节 Boost check 行 |
| 合约账户 / Futures account | **Boost Account**（Portfolio `Boost · N` 段含 1× 持仓） | Accounts |
| 现货账户 / Spot account | **Standard Account** | Accounts |
| 限价单 / Limit order | Lite 不支持下单；`n orders waiting to fill · placed in Pro` 只读入口 | Portfolio (Lite) 节 |
| 平仓 / Close position | **Cash out**（portfolio 点击 → 跳该市场页完成） | Verb ruling |
| 本金 / Margin（金额） | **Put in**（交易页）/ **Cost**（portfolio） | Lite banned words |
| 市值 / Notional | **Now worth** = `max(0, cost + profit)` | Portfolio (Lite) 节 |
| 多轮同名事件 / 回合 | **Series**（≥2 条已结算记录聚合）/ **Round**（其中每一条）；日内事件写 `daily rounds` | Portfolio (Lite) 节 Series 行 |
| 试玩仓 / 赠送仓 | **Voucher**（volt）/ **Airdrop**（pulse，含 welcome gift） | H2E 节；DESIGN.md Addendum 2026-08-26 A |
| 时区 / UTC / ET / HKT | 不显示。用户本地 24h，无时区后缀 | Settlement time wording 节 |


---

## Vouchers (`/vouchers`)

| Canonical | Meaning | Banned variants |
|---|---|---|
| **Face value** | Voucher denomination, e.g. `$10.00` | — |
| **Max profit** | Capped realisable upside = `faceValue × redeemableCapPct` | Max payout, Max realisable profit, Profit cap, Max Profit, cap |
| **Hold window** | Auto-settlement TTL in hours | Hold Window, Holding window, Max holding |
| **Voucher code** | 8-char alphanumeric voucher ID | Code, code, Voucher |
| **Expires in** | Countdown to voucher expiry | Expiry, Time left, Ends in |
| **Price band** | Allowed entry price range | Price Band, Entry range |
| **To claim** | Section / badge for `granted` vouchers awaiting user claim | Unclaimed, Pending vouchers |
| **Tap to claim** | CTA chip on granted voucher cards | Claim now, Activate |
| **Claim voucher** | Primary button on granted voucher (full card) | Activate voucher, Get voucher |
| **Available** | Section for `claimed` vouchers ready to redeem (within 7-day window) | Ready, Claimed vouchers |
| **Redeem voucher** | Primary button on claimed voucher | Use voucher, Open position |
| **Claim window 7 days** | Window between claim and forced expiry | 7-day expiry, Use within 7 days |
| **Left today** | Remaining quota in today's daily pool, format `X / Y left today` | Available today, X remaining, In stock |
| **Resets in {Xh Ym}** | Countdown to next UTC midnight pool reset | Refreshes in, Next batch, Back in |
| **Sold out today** | Pool exhausted state for current UTC day, paired with `· resets in {Xh Ym}` | Out of stock, Gone, Empty pool |
| **Sold out** | Disabled CTA label when pool exhausted | Unavailable, Closed |

### Voucher earnings tiers (`VoucherEarningsCard`)

| Canonical | Meaning | Banned variants |
|---|---|---|
| **Volume tier** | Section label for the T1–T4 ladder | Tier progress, Volume gate |
| **Filled volume** | Cumulative `trades.amount` where `status='Filled'` | Trading volume, Total volume |
| **T1 / T2 / T3 / T4** | Tier labels with caps `$5,000 / $15,000 / $50,000 / $150,000` → `$25 / $100 / $500 / Unlimited` lifetime claim | Tier 1, Level 1, Gold/Silver |
| **Claim $X to wallet** | Primary button when claimable > 0 | Claim to balance, Withdraw earnings |
| **Tier cap claimed — reach next tier** | Button label when current-tier cap is exhausted | Cap reached, Locked |
| **Trade more to unlock** | Button label when below T1 or no claimable | Volume required, Locked |

Natural-language copy (warnings, tooltips) may paraphrase, e.g. `Profits are capped at $5.00` — that's prose, not a labeled field, and is allowed.

**Deprecated:** the single fixed `50,000 USDC volume gate` copy (e.g. `Trade $X more in filled-trade volume to unlock claim`) is replaced by the tier ladder above. Do not reintroduce single-gate language.

---


## Sports game lines (`/trade` fixture board)

| Canonical | Meaning | Banned variants |
|---|---|---|
| **Winner** | Match-result group (1x2 or head-to-head) | Moneyline, 1X2, Match odds |
| **Handicap** | Signed-line group, home-team perspective (`ARS +1.5`) | Spread, Spreads, Line betting |
| **Total goals** / **Total points** | Combined-score group; noun follows the sport | Totals, O/U, Over/Under market |
| **Over {line}** / **Under {line}** | The two sides of a total | O 2.5, U 2.5 |
| **covers** | Verb for a handicap row (`ARS +1.5 covers`) | beats the spread |
| **Regulation time** | Settlement window note on every group header | Full time only, 90 mins |

Signed lines always use a real minus sign (U+2212) for negatives and `+` for
positives. Chip words come from the sibling event's `side_labels`.

---

## Airdrops (`/portfolio/airdrops`)

| Canonical | Meaning |
|---|---|
| **Airdrop value** | Notional size of the airdrop position |
| **Expires in** | Countdown to airdrop expiry |
| **Activate** | Verb for activating a pending airdrop |
| **Welcome gift** | Fallback `$10` airdrop when no matched Polymarket positions exist |

---

## Trading (shared across `/trade`, `/portfolio`, `/wallet`)

| Canonical | Meaning |
|---|---|
| **Entry** | Position entry price |
| **Mark** | Current mark price |
| **Size** | Contract count |
| **Notional** | `size × mark` |
| **Leverage** | Position leverage multiplier |
| **Margin** | Maintenance margin required |
| **Liq. Price** | Estimated liquidation price. Formula: `entry × (1 ∓ 0.9/leverage)`, clamped to `[0, 1]`. Ignores funding drift and MM buffer — account-level threshold lives in `useRealtimeRiskMetrics`. Always rendered as `$0.xxxx` (4 decimals) or `--`. |
| **PnL** | `(mark − entry) × size × side` (see `mem://technical/pnl-formula-canonical`) |
| **Side** | `long` / `short`. Binary markets use `Yes` / `No`. Never `Buy` / `Sell` as a position side. |
| **Available balance** | Free balance in the Boost account (`profiles.balance`) |
| **Total equity** | `Boost + Standard available` (`balance + spot_balance`). **Retired 2026-07-21:** "Trial bonus" field — the Trial Bonus wallet feature was fully sunset before mainnet launch; do not reintroduce copy that references it. |

---

## Portfolio (Lite)

| Canonical | Meaning | Banned variants |
|---|---|---|
| **If it wins you get $X** | Mobile live-card payout sentence | — |
| **If it wins → $X** | Desktop live-row payout column | — |
| **auto-close ≈{c}¢** | Auto-close value, level state (Boost only) | Liquidation, stop out, Liq. Price |
| **None** | Auto-close value, none state — field is always present, never blank | `None at this balance` (retired), `—` |
| **None · enter an amount** | Auto-close value in the order panel before an amount is typed | `—` |
| **auto-close none** | Desktop portfolio row suffix for a Boost row with no level; `none` is inline lowercase and the tooltip reads `No auto-close within this market's price range — your loss is capped at what you put in.` | `no auto-close`, `auto-close —` |
| **no auto-close, loss capped** | Mobile portfolio card suffix for a Boost row with no level | — |
| **≈ {c}¢** | Auto-close value, level state on the trade surfaces (order panel row + position card). The `≈` is never dropped | `{c}¢`, `= {c}¢` |
| **None · loss capped** | Auto-close value, none state in the order panel (and the `Est. auto-close (new position)` partial-net row) | `None at this balance` (retired) |
| **Loss capped at your stake** | Sub-line under a `None` value on the trade-page position card | — |
| **Close to current price** / **close to entry** | Hot adverb (|mark − level| / mark ≤ 10%) — position-card sub-line / order-panel suffix, both rendered red | `near liquidation`, `close to liq` |
| **Moves with your other positions** | Permanent helper line beside `Est. auto-close ⓘ`; renders with the field, never conditionally | — |
| ~~None at this balance~~ | RETIRED site-wide — never reintroduce | — |
| **SIDE chip** | `{sideWord} {c}¢`；底色随方向：Yes/Up `#33D6FF` / No/Down `#CFFF4A`，黑字；`{c}¢` 为该腿自身轴 mark 价（No 腿 = 1 − yes）。多选腿 chip 只写 `Yes` / `No`，选项名另起一行置于 chip 下（`Charles Leclerc`）；side 词与方向来源 `resolveLegSide()`，`short` 视为 No | 全 volt chip、`Long`/`Short`、选项名塞进 chip |
| **Boost check** | 账户级仪表：`riskRatio = imTotal / equity × 100`；**Healthy** `< 80` / **Getting tight** `80 ≤ r < 95` / **Auto-close soon** `≥ 95`；仅 Boost 段且 `boostLive.length > 0` 渲染；`Details ›` 默认折叠（移动 MobileDrawer / 桌面 320px Popover），三行 Equity / Used by Boost calls / Until auto-close starts = `max(equity − imTotal, 0)` | Margin ratio, Margin call, Risk level, Health factor |
| **Boost · N / Standard · N** | 段 chips。`Boost` 段 = Boost Account（`productLine !== 'spot'`）全部持仓，**含 1×**；1× 行不显示倍数且 auto-close 恒 `none`（无借贷敞口）。`Standard` 段 = `productLine === 'spot'`。N = Live tab 为持仓数、Settled tab 为结算行数 | Futures · N, Spot · N, Leveraged |
| **Series / Round** | **Series** = 同一事件名下 ≥2 条已结算记录聚合成的一行（`useLitePortfolio.settledRows`，`items.length > 1`），点进系列详情；**Round** = 系列中的每一条结算记录；一轮结束 = 该条 `close_reason` 落定（settlement / auto_close / cashout 任一）。详情 `Rounds` 行仅当事件 `event_subtype ∈ INTRADAY_SUBTYPES` 写 `{n} · daily rounds`，否则只写 `{n}` | Streak, Multi-round bet, Parlay |
| **If it wins → $X / If it wins you get $X** 中的 X | = `ifWins = sizeNum`（每股结算 $1） | Max payout, Potential win |

---

## Accounts (CPO ruling 2026-08-06)

| Canonical | Meaning | Banned variants |
|---|---|---|
| **Standard Account** | Spot account (`profiles.spot_balance`, productLine `spot`, route `/spot`) | Spot Account, Spot |
| **Boost Account** | Futures account (`profiles.balance`, productLine `futures`, route `/trade`) | Futures Account, Futures, Margin account |
| **STANDARD / BOOST** | Product-line badge labels | SPOT / FUTURES |
| **In use by open positions** | Margin currently locked | Margin in Use, Margin |

Internal identifiers are unchanged and NOT governed here: `spot` / `futures`
productLine values, `to_spot` / `to_futures` transfer directions, DB columns,
routes, localStorage keys.

User-visible **Spot / Futures / Margin / Leverage / Liquidation** are banned
platform-wide (not just Lite).

---

## Addresses

Truncate to **First 6 + Last 6**, e.g. `0x1234...345678`.
Full address rendering: digits `text-primary`, letters `text-foreground` (see `mem://style/blockchain-address-security-design`).

---

## Intraday rounds

| Canonical | Meaning | Banned variants |
|---|---|---|
| **Round** | The 5m / 15m / 1h / 4h / 1D duration selector (dial) on every intraday surface — desktop Intraday view, Crypto vertical, mobile module, quick-trade page | Window, WINDOW, Round length, Timeframe, Duration |

`Round #12`, `Round open $X` and `Round opens 09:30` refer to the round *object*
and stay as-is — they are a different noun from the selector label.

---

## Lite banned words

Trader jargon is banned in rendered Lite copy: **Margin, Liquidation, Funding,
Leverage, Long, Short, Spot, Futures, Order book, Limit, Moneyline** (account
nouns Spot/Futures are exempt).

| Banned | Why | Use instead |
|---|---|---|
| **Spread(s) / Totals / 1X2 / O/U** | Bookmaker jargon for the sports game-line groups. | Handicap · Total goals · Over/Under · Winner |
| **Props** | Internal taxonomy bucket name only (`PROPS_BUCKET` in `src/lib/taxonomy.ts`) — the non-intraday event catalogue of a vertical. Same class as the Moneyline ban. | Question-style section titles: "Will it happen?", "Who wins the match?" |
| **Margin call / Margin ratio / Health factor** | 风险面板的交易所叫法 | Boost check |
| **Liquidated / Stopped out / Stop-out** | 强平的交易所叫法 | auto-closed |

Pro escape-hatch line (updated 2026-08-06, byte-identical from now on):
"Want charts and advanced trading tools? Switch to Pro mode".

---

## Verb ruling — "Back" retired (2026-08-06, CPO-approved)

The wagering verb **Back** is retired from the Lite UI. User verbs are
**Buy / Cash out**, matching the CTAs that already say Buy
(`Bought {side} · $X`, "Buying {side} cashes out your {heldSide} first.").
Money-sense "back" ("You'll get back ≈", "$X back") is unaffected and stays.
The "call" family ("Make your call", "your Yes call") is reviewed separately.

---

## Settlement time wording — `settleLabel()` (2026-08-19, CPO-approved)

All Portfolio "settles / settled at" strings come from
`settleLabel()` (`src/lib/settleLabel.ts`). No page formats its own.

| Case | Output |
|---|---|
| same calendar day | `today 16:00` |
| same year | `Aug 21 16:00` |
| another year | `Jan 12, 2027` (no clock) |

24h user-local time, **no timezone suffix**. The verb is added by the caller
(`settles Aug 21 16:00`). Sports `kickoffLabel` is a separate rule, unchanged.

同文件其余三个函数（同一 24h 用户本地、无时区后缀规则，精度按位置有意不同）：

| 函数 | 用在哪 | 输出 |
|---|---|---|
| `settledDayLabel()` | Settled 列表行 meta、系列详情 First round / Last settled、轮次行 | `Aug 12`；跨年 `Aug 12, 2025`（**只到日，不带钟点**） |
| `settledStampLabel()` | 结算详情 Placed / Settled / Closed 时间行 | `Aug 1, 2026 · 14:00` |
| `monthGroupLabel()` | Settled 列表月份分组头 | `AUGUST 2026` |

Live 带钟点、Settled 列表只到日、详情带年份与钟点——三种精度是设计意图，不是不一致。


### CLOSED vs SETTLED（结算详情眉线，2026-08-21）

| close_reason | 眉线 | 价格行 | 时间行 label |
|---|---|---|---|
| `settlement` | `SETTLED · {日期}` | `Settled price` | `Settled` |
| `auto_close` | `CLOSED · {日期}` | `Closed at {价} · auto-closed` | `Closed` |
| `cashout` | `CLOSED · {日期}` | `Closed at {价}`（无备注） | `Closed` |

`Payout = max(0, Cost + PnL − Fees)`；为 0 时副行写 `nothing returned`。
系列眉线为 `SERIES · WON {x} OF {n}`。

### Close-reason remarks

| Reason | Rendered remark |
|---|---|
| `settlement` | (nothing — a normal resolution needs no remark) |
| `auto_close` | `auto-closed` |
| `cashout` | (nothing — 提前平仓不做可见标注) |

**已废弃（禁用）：`cashed out early`**（2026-08-24）。用户只关心 win / loss 与金额；cashout 在 Settled 列表行与详情结果行上与 settlement 完全一致，仅保留眉线 CLOSED 与价格行 label `Closed at` 的口径差异。

Never render "liquidated" or "stopped out" — banned Lite jargon.

---

## Wallet (`/wallet`, 2026-08-25)

| Canonical | Meaning | Banned variants |
|---|---|---|
| **Sign in to view your wallet** | Lite auth-gate title on `/wallet` | Login required, Sign in to continue |
| **Deposit, withdraw and move funds between your accounts by signing in.** | Lite auth-gate description | — |
| **Saved addresses** | Address-book section title | My wallets, Addresses, Withdrawal addresses |
| **Default** | Badge on the primary saved address | Primary, Main |
| **Set as default** | Menu action promoting an address | Make primary, Set primary |
| **Copy address** | Menu action (mobile drawer only) | Copy, Copy wallet |
| **Delete address** | Destructive menu action | Remove, Delete wallet |
| **Transfer to Boost / Transfer to Standard** | Outgoing transfer leg description | Transfer · Standard → Boost |
| **Transfer from Boost / Transfer from Standard** | Incoming transfer leg description | Transfer · Boost → Standard |
| **does not include open trade profit** | Lite equity note under Total equity | excludes unrealized PnL |
| **does not include unrealized PnL** | Pro equity note (default) | — |
| **Trading fee** | `fee` transaction description | Fees, Commission |
| **Deposit to · 账户选择** | 充值前的「Deposit to」选账户屏保留；用户的选择必须**持久化到服务端**作为该用户的充值路由偏好，链上到账任务按该偏好记入 Standard / Boost 账户；单一充值地址，不按账户分地址 | 仅存 localStorage、按账户分两个地址 |

---

## H2E — Airdropped positions (`/rewards/campaign/h2e`, 2026-08-26)

模块题头、行态与说明句一律逐字使用下表；改字前先改这张表。

| Canonical | 出现位置 / 规则 |
|---|---|
| **Airdropped positions** | 模块题头（micro label，题头右侧数字 = pending + activated） |
| **Hedge positions we airdropped against your Polymarket exposure. Activate within 72h or they expire.** | 模块题头下说明句，逐字 |
| **Activate in {h}h {m}m** | pending 行倒计时（`#FFD666`，h/m 均向下取整；≤0 时降级为 `Expiring…`） |
| **Activate** | pending 行主按钮；进行中 `Activating…` |
| **Live · {±$pnl}** | activated 行（volt 圆点 + volt 文案，负号用 `−`） |
| **View in portfolio ›** | activated 行右侧 pulse 链接 |
| **Expired** | expired 行右侧灰字；整行 `opacity-55`，不计入徽标 |
| **Settled airdrops move to Recent settlements below. Airdrop profit stays locked here until you unlock it by trading.** | 模块底部 fine print，逐字 |
| **Matched: {externalEventName} — {side} @ {price}¢ on Polymarket** | `source === 'matched'` 的副本行 |
| **Welcome gift — no matching OmenX event for your positions, so we sent one on us** | `source === 'welcome_gift'` 的副本行 |
| **Wallet not connected** | S3 头部横条未连接分支（`#FFD666`），不得省略该项 |
| **Airdrop** | portfolio Live 行来源标（pulse `#33D6FF`；matched 与 welcome_gift 同标） |
| **Voucher** | portfolio Live 行来源标（volt `#CFFF4A`） |

单复数规则：`{n} airdrop(s) active` —— `n === 1` 写 `1 airdrop active`，其余写 `{n} airdrops active`；
完整句为 `{positions} positions scanned · {n} airdrop(s) active — earnings land when hedges settle.`。
无合格仓位时整句换成 `No qualifying positions yet — positions ≥ $20 held a day qualify.`。

## Stocks · 交易时段（ST-1）

| Canonical | 出现位置 / 规则 |
|---|---|
| **Next session** | 下一交易时段唯一用词。行尾标 `NEXT SESSION · opens {HH:MM}`；模块头 `Next session · US opens {HH:MM}` / `Next session · HK opens 09:30 HKT`；结算空窗按钮 `Next session in {mm:ss}`。禁用 `Pre-market` / `After hours` / `Tomorrow's session`，禁止外显内部状态名 `preSession`。 |
| **Settled** | 结算空窗（收盘后 1 小时）模块头用词：`Settled · next session in {mm:ss}`。禁止外显 `Settling`。 |
| **Closed ↑ / Closed ↓** | 仅结算空窗的结果徽章（客观结果色：↑ pulse、↓ volt，非盈亏语义）。`Closed` 不作它用。 |
| **Last close {price}** | preSession 参照价前缀，整列 muted，且不显示涨跌%。禁用 `Prev close` / `Yesterday`。 |

## Home (`/`, Lite)

首页 = `/` 与 `/events` 同一 `LiteEventsPage`。完整交付口径见 `docs/delivery/lite-home-v1.md`。
股票三态四条词条已在上方「Stocks · 交易时段（ST-1）」节，本节不重复，引用即可。

| Canonical | 出现位置 | 规则 |
|---|---|---|
| **`{SYMBOL} {price} {±x.xx%}`** | 顶部行情 tape 单元（`HomeTape.tsx`） | 一个 cell 三段：symbol 粗体 `#F2F3F5`、price `#C9CED6`、涨跌%走盈亏色。cell 顺序固定 BTC→ETH→SOL→NVDA→TSLA→AAPL→MSFT→META，缺数据静默跳过、不留占位；全缺整条不渲染。 |
| **● Live markets** | hero 徽标（桌面 / 移动同字） | 全大写由 `textTransform` 呈现，源串保持 `● Live markets`。禁用 `Live now` / `Open markets`。 |
| **What do you think happens next?** | hero h1（桌面 44px / 移动 27px） | `happens next` 走 LIME 高亮，问号在高亮外。逐字不可改。 |
| **Pick a topic. Tap Yes or No. That's it.** | hero 副标题 | 三句式逐字不可改；禁止改成 `Buy Yes or No`。 |
| **● Intraday · Rolling rounds** | Crypto 卡 eyebrow | 与目录 chips 的 `Intraday` 同源词。 |
| **Will the price go up?** | Crypto 卡问题句 | 问句形态；禁用 `Up or down?`。 |
| **ROUND** | Crypto 卡 dial 标签 | 时长选择器唯一用词（模块级，三卡同步）。禁用 `Round length` / `Timeframe` / `Interval`。 |
| **Round open {price}** | Crypto tile 参照价 | 无开盘价时 `Round open —`。禁用 `Open price` / `Start price`。 |
| **Closes {mm:ss}** | Crypto 卡右上倒计时（橙 `#FF8A3D`） | `Closes` 标为小字全大写呈现，下一行走 `mm:ss`（长于 1 小时按 `formatCountdown()`）。禁用 `Ends in` / `Time left`。 |
| **Last 8** | Crypto tile 历史点阵（`Last8Strip` 默认 label） | 恒补满 8 格；未开轮为空格。禁用 `History` / `Recent`。 |
| **Stocks · Closing today** | Stocks 卡 eyebrow | 逐字；禁用 `Daily stocks` / `Today's close`。 |
| **Will it finish higher than it opened?** | Stocks 卡问题句 | 逐字；禁用含 Up/Down 的缩写句。 |
| **{n} stocks · {settleLine}** | Stocks 卡头右端（桌面） | `settleLine` 六组合见「Stocks · 交易时段（ST-1）」节。移动端改渲染成单独一行 `● {settleLine}`。 |
| **Show all {n} →** / **Show less** | Stocks 卡移动端展开器 | 默认显示 5 行；`{n}` = 当前 tab 全部行数。展开器只切换本卡行数，不跳页。 |
| **Unavailable** | Stocks 行第四态（数据缺失）禁用条 | 与 `Closed` / `Next session` 互斥；不显示价格与涨跌%。 |
| **● Sports · Match winners** | Sports 卡 eyebrow | 逐字。 |
| **Who wins the match?** | Sports 卡问题句 | 逐字；禁用 ` v `，对阵一律 ` vs `。 |
| **TODAY** / **{WEEKDAY} {D}** | Sports 日期胶囊（`buildDayStrip`） | 当日写 `TODAY`，其余写三字母星期缩写全大写 + 日号，如 `MON 31`。星期由查看者本地时间派生。 |
| **{n} more this week** | Sports 卡溢出计数 | 含被降级与被折叠的 live 场次；卡内条数封顶后剩余全部计入该句。 |
| **All {n} matches →** | Sports 卡底部入口 | 页内切到 sports 品类，不离开 `/`。 |
| **✦ Editor's Desk** | Editor's Desk 卡 eyebrow | 逐字（含 `✦`）。 |
| **What's worth watching** | Editor's Desk 问题句 | 无问号，逐字。 |
| **+{n} markets →** | Editor's Desk 多市场入口 | `n = optionCount − 1`。 |
| **All Markets ›** | 目录板头（桌面） | 源串 `All Markets`，由 `textTransform: uppercase` 呈现为 `ALL MARKETS`，`›` 为独立字符。右端配 `{n} open`。 |
| **{n} open** | 目录板头 / 目录身份卡右端 | 等宽字体，仅数字 + `open`。禁用 `{n} markets open`。 |
| **Will it happen?** | 目录身份卡 / 移动目录横幅标题 | 逐字。 |
| **Buy Yes or No on real-world outcomes. Winning shares pay $1.** | 目录身份卡副句 | `$1` 走白色高亮；逐字不可改。 |
