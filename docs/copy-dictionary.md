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
| 平仓 / Close position | **Cash out**（portfolio 单仓点击 → 跳该市场页完成；live 列表 `Select` 模式支持多选 / `Select all` 批量直接平仓） | Verb ruling |
| 批量平仓入口 / 工具条 | **Select**（进入选择模式）→ **Select all** / **Clear** / **Cancel**，选中计数 `N selected` | Portfolio (Lite) live 列表 |
| 批量平仓动作 / 确认 | **Cash out N**（动作条按钮）；确认层标题 `Cash out N positions`，列表逐行 `{event} · {side} · {now worth}`，合计行 `You get about`，免责 `Prices move while we close — the final amount can differ slightly.`，进度 `Closing i / N…` | Portfolio (Lite) live 列表 |
| 本金 / Margin（金额） | **Put in**（交易页）/ **Cost**（portfolio） | Lite banned words |
| 市值 / Notional | **Now worth** = `max(0, cost + profit)` | Portfolio (Lite) 节 |
| 多轮同名事件 / 回合 | **Series**（≥2 条已结算记录聚合）/ **Round**（其中每一条）；日内事件写 `daily rounds` | Portfolio (Lite) 节 Series 行 |
| 试玩仓 / 赠送仓 | **Voucher**（volt）/ **Airdrop**（pulse，含 welcome gift） | H2E 节；DESIGN.md Addendum 2026-08-26 A |
| 时区 / UTC / ET / HKT | 不显示。用户本地 24h，无时区后缀 | Settlement time wording 节 |


---

## Rewards / Campaigns (`/rewards`, `/rewards/campaign/:id`, 2026-09-02)

状态字典：`/style-guide` → Lite → Rewards（RW-1…18）。规格：`docs/delivery/lite-rewards-spec-v1.md`。

| Canonical | Meaning | Banned variants |
|---|---|---|
| **Campaigns / Vouchers / Referral** | `/rewards` 三个分页标签，顺序固定 | Activities, Promos, Invites |
| **Live** | 活动进行中徽标（volt） | Active, Ongoing, Running |
| **Always on** | `ends_at === null` 活动的徽标；日期行写 `Always valid` | Evergreen, No end date, Permanent |
| **Starts {MMM d}** | upcoming 活动徽标 | Coming soon, Upcoming on |
| **Ended** | 已结束活动徽标；详情页进入 frozen 只读态 | Closed, Finished, Expired |
| **{N} joined** | 参与人数，千分位；来源 `seed_base + 实际参与` | N participants, N players |
| **Trial Position Voucher** | 券类奖励的完整名称（chip 写 `$10 Trial Position Voucher`） | Trial voucher, Free position, Bonus voucher |
| **USDC** | 现金类奖励币种，色 `#33D6FF`；券色 `#CFFF4A` | Cash, Dollars, Balance |
| **Claim voucher** | 券任务达标后的白底主按钮 | Get reward, Redeem, Collect |
| **Credited to Standard after review** | USDC 任务达标后的纯文字状态（无按钮） | Paid out, Pending payout |
| **Claimed** | 已领取任务行状态 | Done, Collected |
| **Not eligible** | 该奖励不归属当前用户（虚线灰行） | Ineligible, Locked, Unavailable |
| **Sign in to start** | 未登录时任务行动作位统一文案 | Log in to continue, Sign up first |
| **Campaign rules** | 详情页长文规则折叠条标题（44px 行） | Terms, Details, Rules & terms |
| **Your rewards here** | 详情页奖励卡标题 | Your rewards, Rewards summary |
| **Vouchers / USDC / Available** | 奖励卡三格指标（已得券 / 已得 USDC / 仍可领） | Earned, Total, Remaining |
| **Open Vouchers → / Open Wallet →** | 奖励卡两个跳转按钮，有值的一侧为主按钮 | View vouchers, Go to wallet |
| **Host** | 官方活动的归属条：`Official OmenX campaign — open to everyone` | Organizer, Provider |
| **Joined via {KOL}** | 通过专属链接绑定后的 Entry 条（橙 `#FF8A3D`） | Invited by, Referred by |
| **Exclusive entry** | KOL 专属入口标识行 | Special entry, Private link |
| **Voucher sent to Position Vouchers** | claim 成功 toast 标题；描述 `Open vouchers to reveal it.`，动作 `Open` | Reward claimed, Success |
| **This campaign is no longer available.** | 详情页取不到 view 时的空态正文 | Not found, Campaign missing |
| **Invite a friend** | Referral 邀请卡标题 | Refer a friend, Share link |
| **Your invites** | Referral 邀请列表标题 | Invited friends, Referrals |
| **In progress / Claimed** | 邀请行两个终态词；`qualified` 行显示 `$5 voucher` + `Claim voucher` | Pending, Waiting, Complete |

**合规铁律**：任何出现 USDC 金额的页面，有且只有一条完整 fine print（`RewardsFinePrint`，11.5px `#6B7280`），金额旁**禁止**行内写 "not guaranteed"。

**已退役**：Points（积分）体系全部词汇不得复用；`/rewards` 只保留一条可关闭的退役提示。

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
| **Ready to claim** | Section / badge for `granted` vouchers awaiting user claim | Unclaimed, Pending vouchers |
| **Claim voucher** | Primary button / chip on granted voucher cards（旧词 `Tap to claim` 已退役） | Activate voucher, Get voucher |
| **Active** | Section for `claimed` vouchers ready to redeem (within 7-day window)（旧词 `Available` 已退役） | Ready, Claimed vouchers |
| **Redeem voucher** | Primary button on claimed voucher | Use voucher, Open position |
| **Claim window 7 days** | Window between claim and forced expiry | 7-day expiry, Use within 7 days |
| **Left today** | Remaining quota in today's daily pool, format `X / Y left today` | Available today, X remaining, In stock |
| **Resets in {Xh Ym}** | Countdown to next UTC midnight pool reset | Refreshes in, Next batch, Back in |
| **Sold out today** | Pool exhausted state for current UTC day, paired with `— resets in {Xh Ym}` | Out of stock, Gone, Empty pool |
| **Sold out** | Disabled CTA label when pool exhausted | Unavailable, Closed |
| **Credited to wallet** | Payout destination line for `payout_mode = 'instant'`（`CloseVoucherContent` 与 `VoucherHistoryArchive` 同词） | Credited to your wallet, Paid to wallet, Instant payout |
| **Added to pending** | Payout destination line for tiered vouchers（同上两处同词） | Added to pending balance, Goes to pending, Pending credit |
| **USDC pending** | `VoucherEarningsCard` 主数值下的口径标签 | Pending USDC, Unclaimed |
| **Ready to claim** | Voucher earnings 可提取状态说明 | Claimable now, Available to claim |
| **Voucher lost · nothing owed** | `lost` 券在历史档案里的结果行 | Lost, Expired worthless, No payout |
| **Voucher already used** | event 级一券锁在选择器卡上的 Lock 文案 | Already redeemed, Used |
| **BOOST / STANDARD** | 选择器卡的产品线 LineBadge（Lite 术语） | Futures, Spot, Perp, Leverage |
| **Show N more options** | 多选项折叠展开触发 | See more, More outcomes |
| **Confirm & open position** | 兑换摘要条主按钮（进行中 `Redeeming…`） | Redeem now, Open trade |
| **Pick a voucher to redeem** | 桌面兑换台空态 | Select a voucher, No voucher selected |

### Voucher earnings tiers (`VoucherEarningsCard`)

| Canonical | Meaning | Banned variants |
|---|---|---|
| **Volume tier** | Section label for the T1–T4 ladder | Tier progress, Volume gate |
| **Filled volume** | Cumulative `trades.amount` where `status='Filled'` | Trading volume, Total volume |
| **T0 / T1 / T2 / T3 / T4** | Tier labels with lifetime claim caps `$2 / $5 / $10 / $20 / $50` and unlocks `No req. / $10 deposit / $1K vol / $10K vol / $50K vol` | Tier 1, Level 1, Gold/Silver |
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
| **Series lines** | Series-level group head on segmented boards (`groupSegmentedMarkets` → `grp-series`) | Match lines, Outright |
| **Fight lines** | Fight-level group head on MMA boards (`grp-fight`) | Bout lines, Main lines |
| **Method** | Group head for how the fight ends (`grp-method`) | Method of victory, Finish type |
| **Map {n}** | Segment group head on esports boards (`grp-seg-{n}`) | Game {n}, Round {n} |
| **Map {n} winner** | Series-lines row for the current map | Map winner, Current map |
| **Rounds handicap** | Segment-level handicap row | Round spread, Rounds line |
| **Total rounds** | Segment-level total row, and the MMA fight total | Total maps rounds, O/U rounds |
| **Total maps** | Series-level total row | Map total, Maps O/U |
| **Goes the distance** | Method row: the fight reaches the final bell | Decision, Full distance |
| **Won by KO/TKO** | Method row | KO, Knockout win |
| **Won by submission** | Method row | Sub, Tap out |
| **Not played yet** | Group annotation for a segment that hasn't started | Upcoming map, TBD |
| **How the fight ends** | Group annotation on the Method head | Finish method, Result type |
| **A draw or No Contest voids the Method markets — those stakes are refunded in full.** | Method refund clause, rendered in `TradeRuleCard` | Void = refund, Draw no bet |
| **goals** | 足球记分牌总数列表头词（两个半场相加） | Score, Total, GLS |
| **maps** | 电竞记分牌总数列表头词（赢下的地图数） | Games, Wins |
| **1H** / **2H** | 足球记分牌的半场列头 | H1/H2, First half（列头位不写全称） |
| **1st half** / **2nd half** | 上下文行里的半场全称（`Ligue 1 · 2nd half`） | 1H/2H（上下文行不用缩写）, Half 1 |
| **63′** | 足球记分牌右上角的比赛分钟，撇号是 U+2032 PRIME | 63', 63 min, 63:00 |
| **pts** | 篮球记分牌总数列表头词（各节相加） | points, PTS., Score |
| **sets** | 网球记分牌总数列表头词（赢下的盘数） | Sets won, S |
| **games** | MOBA 记分牌总数列表头词（赢下的局数） | Maps, Wins, Rounds |
| **Q1** / **Q2** / **Q3** / **Q4** | 篮球的节次列头 | 1Q, Quarter 1, P1 |
| **OT** / **2OT** | 篮球加时列头（第五列起） | Overtime, EXT, ET |
| **S1** / **S2** / **S3** | 网球的盘次列头 | Set 1（列头位不写全称）, 1S |
| **G1** … **G5** | MOBA 的局次列头 | Game 1（列头位不写全称）, M1 |
| **Set {n}** / **Game {n}** | 上下文行里的段落全称（`ATP Rome · Set 3`） | S3 / G4（上下文行不用缩写） |
| **{选手} serving** | 网球上下文行的发球方后缀（`· Alcaraz serving`） | Serve: X, on serve |
| **30–15** | 网球右上角的当前局比分，减号是 U+2013 EN DASH | 30-15（ASCII 连字符）, 30:15 |
| **24:10** | MOBA 右上角的当前局已进行时长，无上限 | 24m, 24'10, +24:10 |
| **W** / **L** | MOBA 已打完那一局的格子内容 | Win/Loss, 1/0, ✓/✗ |
| **●** | MOBA 当前局的格子内容，橙 `#FF8A3D` | LIVE, ▶, 圆点用其他颜色 |

---

## Sports live stage (`/trade` 直播舞台，2026-09-01)

| Canonical | 出现位置 / 规则 |
|---|---|
| **LIVE** | `LiveMatchboard.LivePill` — 段进行中，橙 `#FF8A3D` 实心 |
| **BREAK** | `LiveMatchboard.LivePill` — 段间休息 |
| **UPCOMING** | `LiveMatchboard.QuietPill` — 未开赛 |
| **FINISHED** | `LiveMatchboard.QuietPill` — 打完未结算 |
| **SETTLED** | `LiveMatchboard.QuietPill` — 已结算 |
| **In review · result pending** | `LiveMatchboard.ReviewBadge` — FINISHED 态桌面右侧 |
| **Scorecards sealed until the decision** | `LiveMatchboard` — MMA 专用，live / break 态 |
| **Watch** | `LiveMatchboard` 顶栏按钮，唤回被收起的舞台 |
| **Watch live** | `HomeSportsCard` 实心橙芯片，有流的 live 卡 |
| **Stream at kickoff** | `HomeSportsCard` 描边芯片，赛前有流 |
| **Back to stage** | `LiveStage` 迷你窗回舞台 |
| 比分分隔符 | en dash `–`（U+2013），Space Grotesk + `tabular-nums` |

### 概念

| 概念 | 是什么 | 判定表达式 | 出处 |
|---|---|---|---|
| **Series（赛列）** | 整场比赛这个层级的盘口 | `metadata.family === "main"` | `sportsData.groupSegmentedMarkets` |
| **Segment（分段）** | CS2 的 map / MMA 的 round | `metadata.family === "seg" && metadata.segment_index === n` | `sportsData.groupSegmentedMarkets` |
| **Current segment（当前段）** | 正在打的那一段 | `useMatchboardModel(event).idx` | `matchboardModel.buildModel` |
| **Decisive threshold（分段决胜分）** | 一段打到多少分算结束 | `SPORT_SEGMENTS[segments_key].decisiveThreshold`；CS2 = 13，MMA = `null`（回合不计分） | `src/lib/sportSegments.ts` |
| **Live（进行中）** | 已开赛、未到结束、未结算 | `isFixtureLive()`，即 `kickoff <= now && now < end_date && !is_resolved`；**`metadata.live` 是引擎调试输出，UI 永不读取** | `sportsData.isFixtureLive` |
| **运动形态（SegmentSpec）** | 一个项目的记分牌长什么样：分几段、列头怎么写、大数字算什么 | `SPORT_SEGMENTS[segments_key] ?? SPORT_FALLBACK[sport]`；两个都查不到即退化 | `src/lib/sportSegments.ts` |
| **大数字口径（totalsRule）** | 左边那个大数字是相加还是数段数 | `"sum"` = 各段值相加（足球进球）；`"won"` = 赢下的段数（CS2 地图） | `matchboardModel.buildModel` |
| **格子口径（cell）** | 分段格里写数字还是写胜负 | `"score"` = 该段的数字；`"winloss"` = `W`/`L`（MOBA，一局没有可比分数）；UFC 走组件既有的 MMA 分支，优先级在本字段之上 | `src/lib/sportSegments.ts` |

### helper 家族（`matchboardModel.ts`，成对入典）

| 函数 | 输出格式 | 单位 / 边界 |
|---|---|---|
| `clockText(raw)` | `m:ss`（如 `1:07`） | 秒；`null`/`undefined` → `0:00`；钳在 `[0, 300]` |
| `elapsedText(raw)` | `m:ss`（如 `24:10`） | 秒；**无上限**（对比 `clockText` 钳在 `[0, 300]`）；`null`/`undefined` → `0:00`；负数钳为 0 |
| `startsIn(kickoff, now)` | `Starts in 5d 4h` / `Starts in 2h 14m` / `Starts in 9m` | 分钟粒度；负数钳为 0 → `Starts in 0m`；`d > 0` 只出 `d/h`，否则 `h > 0` 出 `h/m`，否则只出 `m` |

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
| **To win** | Pro CTA figure = net profit after 5% winning commission (same `netWin()` helper as Lite) | gross profit |
| **Standard Account** | 现货账户在 Pro `/spot` 与余额提示中的名字 | Spot Account（已退役）|
| **Fee (0.15%)** | Pro `/spot` 下单摘要手续费行 | Fee, Trading fee（该行专用写法）|
| **Proceeds** | Pro `/spot` 卖出摘要行 = 卖出份额 × 成交价（未扣费；费另起 `Fee (0.15%)` 行） | Total, Return |
| **You receive** | Pro `/spot` **卖出** CTA 副文案（买入侧仍为 `To win`）| To win（卖出侧禁用）|
| ~~**Max loss**~~ | **Retired 2026-09-09 (SP-1)** — Pro `/spot` 与 Lite 下单面板都不再显示这行；净利口径由 `To win` 单行承担 | — |
| ~~**Not Up**~~ | **Retired 2026-09-09** — Standard 段负向词一律显示 `Down`（`liteSideName()`），Pro `/spot` 与 Lite 同口径；DB `side_labels` 可继续存旧值 | — |
| ~~**Funding Rate**~~ | **Retired 2026-09-09 (Fee System V4)** — funding is 0 by policy; no funding figure is displayed anywhere | — |
| ~~**Next Funding**~~ | **Retired 2026-09-09** — countdown removed with the funding display | — |
| ~~**Isolated**~~ | **Retired 2026-09-09** — cross margin is the only supported mode; the Cross/Isolated switch and the preview `Margin` / `Margin type` rows are gone | — |

---

## How much 输入语义（Lite）

Lite 合约下单面板 `/trade` 的「How much」输入框语义已定稿，规格全文见
`docs/delivery/lite-order-input-v1.md`。

| 项 | 口径 |
|---|---|
| 输入 | = margin = 用户掏的钱，切 Boost 恒不变（面板不再显示 Max loss 行） |
| 赢的数字 | 净利 = 毛利 − 5% × max(毛利 − 开仓手续费, 0)，唯一实现 tradingService.netWin()；面板 win 行、CTA 同数 |
| Winning commission | 5% 赢利佣金，只在 win 行 ⓘ 与 Wallet 流水出现，不上面板正文 |
| auto-close None 子态 | 1× → `None · nothing borrowed`；碰不到线 → `None · can't be reached` |
| 仓位规模 | `notional = 输入 × Boost` |
| 份数 | `qty = 输入 × Boost ÷ 价格` |
| 手续费 | `fee = 输入 × Boost × 费率` |
| 派生行 | 逐字 `= {money(输入 × Boost)} position`（例：`= $30.00 position`），仅 `Boost > 1 且 输入 > 0` 时渲染，恒中性灰 |
| Max 按钮 / $10–$100 预设 | 均为 margin 值，不乘 Boost |

Pro 侧输入语义为 notional / 数量，两面各自 canonical，不互相迁移。
`margin` / `leverage` 等词只出现在文档，禁止进入 Lite UI。

---


## Portfolio (Lite)

| Canonical | Meaning | Banned variants |
|---|---|---|
| **If it wins you get $X** | Mobile live-card payout sentence | — |
| **If it wins → $X** | Desktop live-row payout column | — |
| **auto-close ≈{c}¢** | Auto-close value, level state (Boost only) | Liquidation, stop out, Liq. Price |
| **None** | Auto-close value, none state — field is always present, never blank | `None at this balance` (retired), `—` |
| **None · enter an amount** | Auto-close value in the order panel before an amount is typed | `—` |
| **auto-close none** | Desktop portfolio row suffix for a Boost row with no level; `none` is inline lowercase with a dotted underline that opens the shared auto-close tooltip (see 「Auto-close tooltip（全站唯一）」) | `no auto-close`, `auto-close —` |
| **no auto-close, loss capped** | Mobile portfolio card suffix for a Boost row with no level | — |
| **≈ {c}¢** | Auto-close value, level state on the trade surfaces (order panel row + position card). The `≈` is never dropped | `{c}¢`, `= {c}¢` |
| **None · nothing borrowed** | Auto-close value, none state in the order panel when Boost is 1× (and the `Est. auto-close (new position)` partial-net row) | `None · loss capped` (retired), `None at this balance` (retired) |
| **None · can't be reached** | Auto-close value, none state in the order panel when the level can't be hit between 0¢ and 100¢ | `None · loss capped` (retired) |
| **Loss capped at your stake** | Sub-line under a `None` value on the trade-page position card | — |
| **Close to current price** / **close to entry** | Hot adverb (|mark − level| / mark ≤ 10%) — position-card sub-line / order-panel suffix, both rendered red | `near liquidation`, `close to liq` |
| **Moves with your other positions** | Permanent helper line beside `Est. auto-close ⓘ`; renders with the field, never conditionally | — |
| ~~None at this balance~~ | RETIRED site-wide — never reintroduce | — |

### Auto-close tooltip（全站唯一）

唯一实现：`src/components/lite/shared/AutoCloseTooltipBody.tsx`（AC-TT1，CPO 已批）。五处引用：① 下单面板 `Est. auto-close ⓘ`（`LiteContractOrderPanel`，桌面卡与移动 drawer 体共用，partial-net 行共用本 ⓘ）② 交易页 Your call 卡 `Est. auto-close` / compact `Auto-close` 格 label 右侧 ⓘ（`LitePositionCard`）③ Portfolio 桌面行 level 值片段（虚线下划线触发）④ Portfolio 桌面行 none 值片段（同款触发）⑤ —— 移动卡零触发（第五处为「不挂」裁定）。**静态文案不插值，`≈ 62¢` 为冻结示例值，不是 live 数据**。全文：

> **Auto-close** — If your account runs low, Boost calls are closed automatically at this price to protect your remaining balance.
>
> `≈ 62¢` — The estimated auto-close price for this call. It's worked out across your whole account, so it shifts as your other positions move.
>
> `None` — This call can't be auto-closed — it's 1× (nothing borrowed), or prices only move between 0¢ and 100¢ and the line can't be reached. The most you can lose is what you put in.

已删除定制文案（禁止回引）：`An estimate of the price at which this call would be closed automatically. It shifts as your other positions move.`；`No auto-close within this market's price range — your loss is capped at what you put in.`
| **SIDE chip** | `{sideWord} {c}¢`；底色随方向：Yes/Up `#33D6FF` / No/Down `#CFFF4A`，黑字；`{c}¢` 为该腿自身轴 mark 价（No 腿 = 1 − yes）。多选腿 chip 只写 `Yes` / `No`，选项名另起一行置于 chip 下（`Charles Leclerc`）；side 词与方向来源 `resolveLegSide()`，`short` 视为 No | 全 volt chip、`Long`/`Short`、选项名塞进 chip |
| **Boost check** | 账户级仪表：`riskRatio = imTotal / equity × 100`；**Healthy** `< 80` / **Getting tight** `80 ≤ r < 95` / **Auto-close soon** `≥ 95`；仅 Boost 段且 `boostLive.length > 0` 渲染；`Details ›` 默认折叠（移动 MobileDrawer / 桌面 320px Popover），三行 Equity / Used by Boost calls / Until auto-close starts = `max(equity − imTotal, 0)` | Margin ratio, Margin call, Risk level, Health factor |
| **Boost · N / Standard · N** | 段 chips。`Boost` 段 = Boost Account（`productLine !== 'spot'`）全部持仓，**含 1×**；1× 行不显示倍数且 auto-close 恒 `none`（无借贷敞口）。`Standard` 段 = `productLine === 'spot'`。N = Live tab 为持仓数、Settled tab 为结算行数 | Futures · N, Spot · N, Leveraged |
| **Series / Round** | **Series** = 同一事件名下 ≥2 条已结算记录聚合成的一行（`useLitePortfolio.settledRows`，`items.length > 1`），点进系列详情；**Round** = 系列中的每一条结算记录；一轮结束 = 该条 `close_reason` 落定（settlement / auto_close / cashout 任一）。详情 `Rounds` 行仅当事件 `event_subtype ∈ INTRADAY_SUBTYPES` 写 `{n} · daily rounds`，否则只写 `{n}`。系列详情两种写法都是设计意图、不得互相替换：**眉线** `Series · {n} rounds`（列表 / 详情头，只报轮数）与 **DETAILS 行** `{n} · daily rounds`（明细行，报轮数 + 该系列是日内轮次） | Streak, Multi-round bet, Parlay |
| **If it wins → $X / If it wins you get $X** 中的 X | = `ifWins = sizeNum`（每股结算 $1） | Max payout, Potential win |
| **Up / Down**（Standard 段词轴） | Standard 段（`productLine === 'spot'`）的 side 词一律走事件 `side_labels` 别名 `Up` / `Down`，不写 `Yes` / `No`，不带杠杆后缀；有别名只显别名，无别名才回落 Yes/No（唯一来源 `resolveLegSide()`）。退役词 `Not Up` 在显示层恒改写为 `Down`（`liteSideName`）；事件行已被清理的存量现货结算仓由 `src/lib/orphanSpotSideLabels.ts` 兜底补 `side_labels` | `Up · Yes`、`Down · No`、`Not Up` |
| **Couldn't load your positions.** | Portfolio 列表请求失败文案，配描边按钮 `Retry`；同屏 KPI 三值渲染 `—`，不得渲染 `$0.00` | `Failed to load`, `Error`, `$0.00` 假零态 |
| **Position not found** / **It may have been removed, or the link is wrong.** | 结算详情 Not found 态标题 + 副行，按钮 `Back to settled`；id 不存在与越权访问渲染逐字相同，不泄露他人 event 名与金额 | `No access`, `Forbidden`, `404` |
| **（骨架无文案）** | Loading 态只渲染占位块（底 `#171A1F` / 块 `#15181C` / `animate-pulse`），不写 `Loading…`；tabs 与 Boost/Standard chips 首载即实底可点、不骨架 | `Loading…`, spinner |

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

## Share / 晒单（Lite）

> 状态字典：`/style-guide` → Lite → Share（`share-sh1` … `share-sh8`）。规格文档：`docs/delivery/lite-share-v1.md`。

| Canonical | Meaning | Banned variants |
|---|---|---|
| **Share Your Win 🏆** | 盈利时分享弹窗标题 | Share your profit, Flex your win |
| **Share Your Trade** | 亏损时分享弹窗标题 | Share your loss |
| **LIVE CALL** | 海报右上角标签：这笔还开着、价格还在动 | Open position, Live position |
| **Profit so far** | 进行中且盈利时的盈亏区标题（强调未落袋） | Unrealized PnL, Current profit |
| **Profit** | 已平仓 / 已结算且盈利时的盈亏区标题 | Realized PnL, Total profit |
| **Lost** | 亏损时的盈亏区标题（三种形态通用） | Loss, PnL |
| **Put in** | 海报左侧金额格：这笔投入的本金 | Cost, Stake, Amount in |
| **Now worth** | 进行中形态右侧金额格：按当前价格折算的价值 | Current value, Market value |
| **Cashed out** | 已平仓形态右侧金额格：主动平仓拿回的金额 | Sold for, Exit amount |
| **Paid out** | 已结算形态右侧金额格：结算发放的金额 | Settled amount, Payout amount |
| **⚡ Winning!** | 进行中且盈利时用户名下方的状态药丸 | In profit, Up |
| **⚡ Winner!** | 已平仓 / 已结算且盈利时的状态药丸 | Won, Winner badge |
| **💀 RIP** | 亏损时的状态药丸（三种形态通用） | Lost, Rekt |
| **Referral** | 海报页脚邀请码前缀 | Invite code, Promo code |
| **Up · 15m round**（快速回合方向行） | 快速回合（intraday）海报上事件名下面的方向行：方向（`Up` / `Down`）+ ` · ` + 轮次时长 + ` round`，例 `Up · 15m round` / `Down · 1D round`。时长取值只有五个：5m / 15m / 1h / 4h / 1D，与交易页轮次切换器的标签逐字一致 | Up · Standard（日线现货的写法，两者不能混）, Up · 15M ROUND（时长不改大小写）, 15m round（缺方向） |
| **Join & trade like a pro!** | 盈利海报页脚号召语 | Trade like a pro, Join now |
| **Join & do better than me 😅** | 亏损海报页脚号召语 | Do better than me |
| **Save** | 分享弹窗：把海报下载成图片 | Download, Save image |
| **Copy Link** | 分享弹窗：复制分享链接 | Copy URL, Share link |
| **More Options** | 分享弹窗：调起系统原生分享面板 | Share via, Native share |

**概念定义（研发按此判定）**

| 概念 | 一句话定义 | 判定 |
|---|---|---|
| 进行中（live） | 仓位还开着，海报上的价值会随行情变 | 仓位未平仓且事件未结算 |
| 已平仓（cashed） | 用户主动离场，金额已落袋 | 用户执行过平仓 |
| 已结算（settled） | 事件出结果由系统结算 | 事件已结算 |
| 盈亏方向 | 决定海报配色、插画、药丸与号召语 | 金额 ≥ 0 为盈，否则为亏；与形态无关 |

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
| **Winning commission** | `winning_commission` 流水 label / 结算详情 Fees 副行 | Profit fee, Success fee |
| **Winning commission · 5% · {side} · {event}** | `winning_commission` 流水 description 模板 | — |
| **Cashed out · ${'{'}amount{'}'} back** | 平仓成功 toast，金额为真正到账现金 | Position closed, Margin returned |
| **Deposit to · 账户选择** | 充值前的「Deposit to」选账户屏保留；用户的选择必须**持久化到服务端**作为该用户的充值路由偏好，链上到账任务按该偏好记入 Standard / Boost 账户；单一充值地址，不按账户分地址 | 仅存 localStorage、按账户分两个地址 |
| **Varies by route** | 跨链充值 Bridge fee 行的中性说明（不写死数值） | Free, 0.1%, Est. fee |
| **Base only — this address can't receive withdrawals** | 提现地址列表里非 Base 行的 disabled caption（逐字） | Unsupported network, Base network only |
| **Only send USDC on Base network.** | 充值地址页风险句 | Only send USDC, Base only |
| **Sent funds to the wrong network? Request recovery →** | `/wallet` 底部 recovery 文字链 | Wrong network? Recover funds |
| **Sign in required** | `/wallet/recovery` 未登录标题 | Login required |
| **No recovery requests yet** | Recovery 列表空态 | No requests |
| **Network maintenance** | 维护横幅题头（后接网络名，如 `· BASE_ETH`） | Maintenance notice, Service suspended |
| **Withdraw** | 提现 sticky CTA；提交中为 `Processing...` | Confirm withdrawal, Send |
| **I am sending USDC (not USDT, ETH, BNB, or any other token)** | 充值确认清单第 1 句（`WalletDeposit` checklist，逐字） | I'm sending USDC |
| **I am using the Base network (not Ethereum, BSC, Polygon, Arbitrum, or any other chain)** | 充值确认清单第 2 句（逐字） | I'm on Base |
| **I have double-checked the deposit address below before sending** | 充值确认清单第 3 句（逐字） | Address checked |
| **Pending confirmations** | `PendingConfirmations` 区块题头 | Pending deposits, Awaiting confirmations |
| **Confirming** | 单笔待确认充值的状态词 | Pending, In progress |
| **{c}/{r} blocks** | 确认进度（如 `6/12 blocks`） | 6 of 12 confirmations, 6/12 confs |
| **A flat 10% recovery fee applies** | `/wallet/recovery` 说明段费率句（逐字） | 10% fee charged, Service fee 10% |
| **10% flat fee** | Recovery 说明 pill | 10% fee |
| **3–7 business days** | Recovery 处理时长 pill（en dash） | 3-7 business days, 3 to 7 days |
| **For {categories}.** | 两张账户卡底注的前半句，业务线；Boost 侧取 `category_boost_configs` 中 enabled 的品类，Standard 侧暂为常量（`STANDARD_CATEGORIES`） | — |
| **Put in $100, buy $100 of shares.** | Standard 卡底注后半句 | — |
| **Put in $100, trade like ${100 × maxBoost} — up to {maxBoost}×.** | Boost 卡底注后半句，金额随配置计算；maxBoost < 2 时整句退回 `Buy and sell shares at full price.` | — |
| **Losses are amplified too, and a bad move can auto-close your position.** | Boost 卡 Available 弹层风险句（Lite）；Pro 分支为 `Losses are amplified too, and positions can be liquidated.` | — |

已取代（2026-09-07，底注改版）：~~Buy and sell shares at full price.~~（Standard 卡旧底注，现仅作 Boost 全关时的回退句）、~~Put in a little to control a bigger trade — Boost up to {N}×~~（Boost 卡旧底注）。

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

## Surface switch（交易页，2026-09-09）

| 词 | 一句定义 | 判定表达式 | 出处 |
|---|---|---|---|
| **Lite** / **Pro** | Trade-page view switch segments | Simple, Basic, Advanced, Simple mode / Pro mode (retired) |
| `Lite` | 交易页的简版看法，也是全站其余页面唯一的样子 | `surface === "lite"` | `src/components/surface/SurfaceSwitch.tsx` |
| `Pro` | 交易页的专业终端看法，仅这三条路由存在 | `surface === "pro"` | 同上 |
| `Trading view` | 页头分段控件的无障碍名，只出现在 `aria-label`，界面上不显示 | `aria-label="Trading view"` | 同上 |
| `Switch to Pro view` / `Switch to Lite view` | 移动端贴底方钮的无障碍名，界面上只显示目的地标签 | `size === "dock"` | 同上 |

禁写：`Simple` / `Simple mode` / `Simple view` / `Switch to Simple` / `Pro mode` / `Basic` / `Advanced`（模式一词随全站模式一并退役）。
