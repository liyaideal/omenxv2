# Rewards 任务类型体系（Task types）— 交付说明 v1（总文档）

> **通俗导读**
>
> 活动详情页的任务行，原来只有一种：做到一个目标，领一份奖励。上一批加了「阶梯解锁」（一条任务多个档，每过一档发一次）。这一批再加三种，运营在活动里配任务时可以直接选：
>
> 1. **每日 / 每周任务** —— 每天（或每周）做到目标就发一次，连续 7 天再加一笔 bonus。任务行上看得到今日进度、最近两周的点阵和 🔥 连续天数，点开有月历。
> 2. **邀请任务** —— 进度 = 邀请到的好友里成交满 $100 的人数。和 Referral 分页的每人 $5 券各算各的：好友合格时 Referral 那边照旧可领 $5，活动里的邀请任务同时 +1，两边互不影响。
> 3. **活跃天数 / 持仓时长任务** —— 进度 = 有成交的不同天数，或拿满 24 小时的仓位数。目标 ≤ 10 时进度条是分段的，达一段亮一段。
>
> 这三种和原有两种共用同一套底层：运营只在 `campaign_entries.rules.tasks[]` 里写 JSON，不改代码；USDC 奖励达标即自动入 Standard 账户（上一批已有的规则，本批沿用）；券奖励达标后点 Claim。老任务一字不动。
>
> 同批顺手补了两处：阶梯任务在桌面上把每档门槛直接写在进度条下面（档位标尺）；任务行第二列统一写成「金额 + USDC / voucher」。
>
> 本文档并入了 `rewards-tiered-tasks-v1.md`（阶梯解锁那一批）；那份只留档。
>
> **2026-11-12 追加（§12）**：为 Crypto Brunoo 的「Master of Predictions」活动加了四个以后都能复用的零件，运营照样只写 JSON：
>
> 1. **盈利交易指标** —— 进度 = 赚钱收场的交易笔数（结算赢或提前卖出赚钱都算），可设「自己出的钱至少多少才算」。
> 2. **可重复任务** —— 每做到一次目标就发一次奖励，不封顶（也可以设上限）。
> 3. **Ticket 奖励** —— 第三种奖励单位（金色）。只在这个活动里计数，不进任何余额；拿来排名或线下抽奖，用途由运营写在任务副标题里。
> 4. **活动排行榜** —— 详情页任务下面的一块榜单，按某条任务的得数排，显示前 N 名和「我」的名次。
>
> 另有一个入口级开关「只给通过这条链接注册的新用户」。页面上不出现奖金数额（CPO 定）。

## 0. 读者须知

查什么去哪儿：
- 长什么样 → 生产页 `/rewards/campaign/19033848-dc98-4a53-b4c5-d9e31b24a51f`（Starter Rewards，always-on：第 4–8 条任务分别是阶梯 / 每日 / 邀请阶梯 / 活跃天数 / 持仓）、`/rewards/campaign/a2222222-2222-4222-8222-aaaaaaaaaaa2`（Finals Week，ended：阶梯 + 每日各一条）、`/rewards?tab=referral`（好友行不因活动邀请任务改样）
- 什么时候变成什么样 → `/style-guide` → Lite → Rewards 状态字典 **RW-8b / 8c / 8d / 8d-b / 8d-c / 8e / 12b / 12c / 15**（每个 case 有「状态 / 触发条件 / 视觉 / 数据来源」表）
- 字段名、文案、公式、时间口径、术语 → `docs/copy-dictionary.md`（顶部有「Lite 术语对照表」；Rewards 节「阶梯任务」「周期任务与指标」两小节）→ 本文档对应章节
- 设计法则（刻度点、奖励槽两行、日历条、分段条、抽屉 / hover 对等）→ `DESIGN.md` §Addendum 2026-09-23 · 阶梯任务行、§Addendum 2026-09-25 · 周期任务行与指标行
- Rewards 页整体（相位、九分支任务行、邀请、合规）→ `docs/delivery/lite-rewards-spec-v1.md`（本文档只写任务类型新增的部分）

提问前先按上面顺序查一遍；查不到再提，提问时写明"我查了 X 没有"。

## 0.1 字典怎么看

1. 打开 `/style-guide`（不用登录），左栏点 **Lite › Rewards**。
2. 节点顶部「本页目录」按产品页从上到下排小节；本次样张全在 **Ⓒ Campaign 详情** 与 **Ⓓ Referral** 两个小节。
3. 小节顶部黄框「定位行」写路由 / 词典节 / 交付文档。
4. 每张样张 = `编号 · 状态名（组件名）` + iframe 里的真组件（桌面 100% / 手机 375），可交互：RW-8c / 8d-b / 8d-c 手机帧里的抽屉是挂开的，行卡帧里点 `›` 也能开抽屉（抽屉从点击行下方升起）；RW-8d 的时钟冻结在 2026-09-25 12:00 UTC，所以"今天"永远是 9 月 25 日。
5. 样张下表「状态 / 触发条件 / 视觉 / 数据来源」——触发条件就是判定表达式，可直接照抄进实现。
6. 页头搜索框敲 `RW-8d` 或 `recurring`，结果点了落到样张。
7. 单张查看 / 截图：`/style-guide/preview?c=<key>`，key 见 §7。

**编号规则**：RW 前缀 = Rewards；`b / c / d / e` 是同一模块（任务行）的类型变体样张，`8d-b` 是 8d 的二级面（抽屉），`8d-c` 是它的周任务变体；`12b / 12c` 是入账 / streak 两种 toast。无 `-D` / `-M` 后缀，桌面 / 手机在同一编号的上下两帧。

**只在字典可见、生产凑不出条件的态**（既定状态，不是 bug）：
- RW-8b 券阶梯四态、RW-8d 券版周期任务（D7）——生产只配了 USDC 版；券版行为已实现等运营配。
- RW-8b 第 9 行「8 档上限」——生产最多配了 7 档；用来看档位标尺最密时的样子。
- RW-8b / 8d 的 not_eligible——阶梯 / 周期任务目前没有 KOL 专属入口场景。（2026-11-12 起入口可设「只限新用户」，但不符合条件时的 Not eligible 只接了直接达标行和可重复行；阶梯 / 周期行未接，这类入口暂时不要配阶梯 / 周期任务。）
- RW-8d D5「第 7 连今天橙点」、D8「30 / 30 Completed」、D9 周任务、RW-8d-c 周任务历史——演示账号还没跑到 / 生产没配周任务；服务端逻辑已按 §3 实测。
- RW-8e 活跃天数 3/7、持仓 1/3 的进行中态——演示账号 alex 的真实数据已经达标入账（30 天 / 19 仓），生产页上这两条显示 `Credited`。

## 1. 功能目标

给运营一套可复用的任务模版：**类型**（行卡长什么样、奖励怎么分）× **指标**（进度怎么算）两两组合，只改 JSON。

| 类型 `type` | 一句话 | 指标 `metric` | 一句话 |
|---|---|---|---|
| `threshold` 直接达标 | 一个目标一份奖励（原有） | `usd_volume` | 成交金额 |
| `tiered` 阶梯解锁 | 多个档，每过一档发一次（上批） | `count` | 有没有成交过 |
| `recurring` 周期重复 | 每日 / 每周各发一次 + 连续 bonus（**本批**） | `referrals_qualified` | 成交满门槛的好友数（**本批**） |
| | | `active_days` | 有成交的不同天数（**本批**） |
| | | `hold_positions` | 拿满 N 小时的仓位数（**本批**） |

本批必须守住的规则：

- **一条任务一根进度条、三行文案封顶**（标题 / 副标题 / 一个进度数字）；档位、历史明细一律下沉到二级（桌面 hover、手机抽屉）。
- **USDC 达标即入账，写路径只有一处**：服务端在成交 / 好友合格 / 每小时扫描的同一事务里把该档记为已发、Standard 余额 +X、写一条钱包流水（`bonus`）；页面没有"待领 / 待审核"中间态；同一档 / 同一期 / 同一次 bonus 只入账一次，重放零副作用（`campaign_settle_grant()` 行级闩锁）。
- **券达标后点领**：走 `claim-campaign-grant`，同一个函数解析三种 grant key。
- **邀请与 Referral 分页各算各的**（2026-09-26 定，取代 09-25 版的"不叠加"）：好友合格时，Referral 分页照旧出每人 `$5 voucher`，邀请人所在活动里的邀请任务同时 +1；两条路径互不判断、互不抵扣。运营配邀请任务时按"一个合格好友 = $5 券 + 任务进度"算预算。
- **持仓时长**：被自动平仓（强平）的仓位同样计入。

## 2. 数据模型

### 2.1 任务定义（`campaign_entries.rules.tasks[]`）

| 字段 | 类型 | 说明 |
|---|---|---|
| `task_key` | text | 父任务 key；各类型的 grant key 派生规则见 §2.3 |
| `type` | `threshold` \| `tiered` \| `recurring` \| `repeatable`（2026-11-12，见 §12） | 缺省 `threshold` = 现有单目标任务，存量零改动 |
| `metric` | `usd_volume` \| `count` \| `referrals_qualified` \| `active_days` \| `hold_positions` \| `winning_trades`（2026-11-12，见 §12） | 进度怎么算，见 §2.2；缺省 `count` |
| `name` / `subtitle` | text | 与现有一致；**约定：副标题只写达成口径，不写奖励单位**（单位在第二列奖励槽），也不写判定细则（如强平计入）——细则进活动规则折叠 / 本文 |
| `scope` | json | `{any_market:true}` / `{categories:[…]}`，交易类指标按事件品类过滤；邀请指标不看 scope |
| `cta` | `{label, href}` | 缺省：邀请指标 `Invite` → `/rewards?tab=referral`，其余 `Trade` → `/events(?sector=)` |
| `target` / `reward` | — | threshold 与 recurring 用；tiered 不读 |
| `tiers` | `[{target, reward}]` | **tiered**：升序 2–8 档，每档 `{usdc}` 或 `{voucher}`，**一条只配一种单位** |
| `period` | `daily` \| `weekly` | **recurring**：UTC 日 / ISO 周（周一起） |
| `max_periods` | int | recurring：可发次数上限，缺省无上限 |
| `streak_bonus` | `{every, reward}` | recurring：每连续 `every` 期达标发一次 bonus |
| `min_notional` | number | `active_days`：每天至少成交多少才算活跃日，缺省 $10 |
| `hold` | `{min_hours, min_notional}` | `hold_positions`：持有时长与名义门槛，缺省 24h / $0 |

真实配置（Starter Rewards 第 5–8 条）：

```json
{ "task_key": "daily_trade", "type": "recurring", "period": "daily",
  "name": "Trade every day", "subtitle": "$50 in filled orders each day",
  "metric": "usd_volume", "target": 50, "scope": { "any_market": true }, "reward": { "usdc": 1 },
  "max_periods": 30, "streak_bonus": { "every": 7, "reward": { "usdc": 5 } } }

{ "task_key": "invite_ladder", "type": "tiered", "name": "Invite friends who trade",
  "subtitle": "Each friend counts once they trade $100", "metric": "referrals_qualified",
  "tiers": [ { "target": 1, "reward": { "usdc": 5 } }, { "target": 3, "reward": { "usdc": 15 } }, { "target": 10, "reward": { "usdc": 50 } } ] }

{ "task_key": "active_7d", "type": "threshold", "name": "Trade on 7 different days",
  "subtitle": "Any market · at least $10 a day", "metric": "active_days", "min_notional": 10,
  "target": 7, "scope": { "any_market": true }, "reward": { "usdc": 5 } }

{ "task_key": "hold_24h", "type": "threshold", "name": "Hold a position for 24 hours",
  "subtitle": "3 positions of $50+ held a full day",
  "metric": "hold_positions", "hold": { "min_hours": 24, "min_notional": 50 }, "target": 3,
  "scope": { "any_market": true }, "reward": { "usdc": 15 } }
```

阶梯任务的 7 档 USDC 配置见第 4 条任务 `vl_volume_ladder`（2,000 → 200,000，4 → 200 USDC，累计 400）。

### 2.2 指标口径（`campaign_metric_value()`，全部从源表**重算**，幂等）

| metric | 值 | 来源 | 触发时机 |
|---|---|---|---|
| `usd_volume` | 窗口内 Filled / Closed 成交的 USD 名义之和（scope 内） | `trades.amount` | 成交落库 |
| `count` | 窗口内有无成交（0 / 1） | `trades` | 成交落库 |
| `active_days` | 窗口内有 ≥ `min_notional` 成交的**不同 UTC 日**数 | `trades.created_at` | 成交落库 |
| `hold_positions` | 名义 ≥ `hold.min_notional` 且持有 ≥ `hold.min_hours` 的仓位数：仍持有（Filled，`now − created_at`）或已平（Closed，`closed_at − created_at`，含自动平仓） | `trades` | 平仓落库 + 每小时 cron `campaign-hold-sweep` |
| `referrals_qualified` | 窗口内 `qualified_at` 的合格好友数（status qualified / rewarded） | `referrals` | 好友合格（trigger `trg_referrals_campaign_hook`） |

窗口：repeatable 为 `[max(joined_at, 活动开始), ∞)`（§12.2）；threshold / tiered 为 `[joined_at, ∞)`；recurring 为当期 `[max(period_start, joined_at), period_end)`。`count` 无 scope 的任务（Discord / share）仍不自动驱动。

### 2.3 grant 行（`campaign_grants`，表结构不变）

> 2026-11-12：可重复任务的 grant 键是 `<task_key>#r<n>`，ticket 奖励写 `progress.credited_ticket`，详见 §12.2。

| type | grant key | 说明 |
|---|---|---|
| threshold | `<task_key>` | 一行 |
| tiered | `<task_key>#t<n>` | 每档一行，n 从 1；`progress.value` 各档同值 |
| recurring | `<task_key>@<YYYY-MM-DD>` / `<task_key>@<IYYY-Www>` | 每期一行；父 key 不写行 |
| recurring bonus | `<task_key>#s<n>` | 第 n 次 streak bonus（n = 连续期数 / every） |

`progress` 键：`value / current / target`，USDC 入账时加 `credited_usdc / credited_at`。状态 5 值不变（`not_started / in_progress / claimable / claimed / not_eligible`）；USDC 奖励不出现 `claimable`，达标直接 `claimed`。状态只进不退（GREATEST 合并）。

### 2.4 前端派生（纯函数，字典与生产共用）

- `deriveTiered(task, grants)` — 共享值、各档态、下一档分母、等距填充、可领和。
- `deriveRecurring(task, grants, joinedAt, now)` — 当期值 / 态、done 数、streak（末尾连续达标期）、bonus 期、earned、completed、14 期点阵、月历格。**行卡上每个数字和点阵只能从这里出**，禁止各画各的。

### 2.5 聚合口径（`buildCampaignView`）

| | tasksTotal | tasksDone | claimableCount | up to | claimed |
|---|---|---|---|---|---|
| threshold | 1 | claimed | claimable | reward | claimed 的 reward |
| tiered | 1 | 全档 claimed | 任一档 claimable | 全档之和 | 已发档之和 |
| recurring | 1 | `max_periods` 达到（无上限永不计） | 任一期 / bonus claimable | `reward × max_periods` + 凑得到的 bonus（无上限时不累加） | 已发期 + bonus |

## 3. 数据库 / 服务端（migration `20260923150000` + `20260925100000` + `20260926110000`）

两层：**指标层** `campaign_metric_value()` 重算绝对值 → **类型层** `apply_campaign_progress()` 按 `type` 分发 → **结算层** `campaign_settle_grant()` 唯一入账点。

1. `campaign_settle_grant(user, entry, key, value, target, reward, label)`：upsert 行；已 `claimed / not_eligible` 只同步 value；`value ≥ target` 且 USDC → `UPDATE … WHERE status <> 'claimed'` 闩锁 → `profiles.spot_balance += usdc` → `transactions(bonus, spot, 'Campaign reward · <label>')`；券 → `claimable`；否则 `in_progress`。
2. `campaign_recurring_apply(user, entry, task, at, joined_at)`：算当期 key 与窗口；`max_periods` 已满则不再开新期；结算当期行；当期 `claimed` 时向前数连续 `claimed` 期 = streak，`streak % every = 0` → 结算 bonus 行 `#s<streak/every>`（label `<name> · 7-day streak`）。
3. `apply_campaign_progress(user, event_name, amount, at, metrics[])`：遍历 live 活动 × 任务；`metrics` 非空时只处理这些指标；交易类指标带 event_name 时过 scope；按 type 分发。4 参数版是 trades 触发器用的兼容壳。
4. `trades_campaign_progress()`：INSERT / 转 Filled → 全量；转 Closed → 只 `hold_positions`。
5. `referrals_campaign_hook()`（AFTER UPDATE OF status，migration `20260926110000` 重定义）：pending → qualified 时只做一件事——`apply_campaign_progress(referrer, NULL, 1, now(), [referrals_qualified])` 驱动邀请人所在 live 活动里的邀请任务；**不写 referrals 表**，Referral 分页的 `$5 voucher` 流程不受影响。
6. `campaign_hold_sweep()`：pg_cron `15 * * * *`，对所有参加含 `hold_positions` 任务活动的用户重算。
7. Edge Function `claim-campaign-grant`：`#t<n>` → `tiers[n-1].reward`；`@<period>` → `task.reward`；`#s<n>` → `streak_bonus.reward`；只服务券。

实测（fixture 用户，已清理）：连续 7 天各 $60 → 7 期各入账 $1 + `7-day streak` $5；同日再 $10 不重复；活跃天 7/7 入账；好友合格 → 邀请阶梯 t1 $5 入账，referral 行本身仍 `qualified`（$5 券可领）；随后重放 + 手动 sweep → 流水数不变。

## 4. 用户端流程

### 4.1 任务行（挂在 `LiteCampaignDetailPage`，按 `task.type` 分发到 `GrantTaskRow` / `TieredTaskRow` / `RecurringTaskRow`）

三种行卡共用 `TaskRowShell`。新增的槽：

| 槽 | 规格 |
|---|---|
| 进度单位 | `$` 前缀（金额）或后缀词 `friends / days / positions`（计数） |
| 分段条 | 计数类指标且 target ≤ 10：N 段 22×5，达一段亮一段（青），全达 lime；否则连续条。文案列不够宽时（375 帧 7 段）段宽等比收缩到最低 10px，计数文字不折行 |
| 刻度点（tiered） | 等距 `n / M`，未达灰 / 已达青 / 已发青+暗芯；桌面 hover 单档 tooltip |
| 当期后缀（recurring） | `$32 / $50 today`（周 `this week`）；当期达标后条填满变 lime |
| 第三行（recurring） | 最近 14 期点阵（手机 7 期）+ `🔥 5-day streak`（≥2）/ `Last 14 days`；达标青、未达灰、bonus 期橙 `#FF8A3D`、今天空心、加入前虚线 |
| 档位标尺（桌面） | tiered 行进度条 360px 下方，每个刻度点正下方写该档门槛：`2K / 30K / 200K`（K 缩写、不带 $；计数指标 `1 / 3 / 10`），已达白 / 下一档青 / 未达灰；只写门槛，奖励看 tooltip。移动端无标尺（抽屉全表）。DESIGN §Addendum 2026-09-23 规则 4b |
| 奖励槽行 1 | 金额 + 单位词 + 奖励色（USDC 青 / voucher lime），与直达行同配方。tiered：下一档 `$40 USDC` / 可领和 `$25 voucher` / 全发累计 `$400 USDC`；recurring：每期 `$1 USDC` / 可领和 `$3 voucher` / Completed·Ended 累计 `$50 USDC`。状态词由动作栏承担 |
| 奖励槽行 2 | tiered `4 / 7 tiers`；recurring `12 / 30 days`；手机带 `›` 起抽屉 |
| 动作栏 | 未登录 `Sign in to start` → `Not eligible` → 已结束 `Ended` → `Completed` → 券可领 `Claim $X` / `Claim all $X`（顺序逐档，失败即停）→ 当期已达 `Done today` → 全部已发 `All credited` → 描边 CTA |

二级面：tiered = `Tiers` tooltip（桌面）/ 抽屉（手机）列每档；recurring = `Daily progress` hover 卡（桌面）/ 抽屉（手机）：三格 KPI（Days done / Streak / Earned；标签单行、数值贴底同底线，周任务是 `Weeks done`）+ 月历——**一次一个月**，默认当月，‹ › 在「第一条记录所在月 … 当月」之间切换，到头禁用；周任务只有 14 周点阵。历史起点 = max(任务第一条期记录, 加入活动)：任务后加进活动时，之前的日子留白不算 missed（点阵同理）。

### 4.2 反馈 toast（详情页加载时，一档一次，localStorage seen-set，首访静默）

- 阶梯 USDC 档入账：`+$40 USDC credited to Standard` / `Tier 4 of <task>` / `Open wallet`
- streak bonus：`+$5 USDC · 7-day streak` / `<task> · bonus credited to Standard` / `Open wallet`
- 每日 $1 不弹。

### 4.3 Referral 分页

本批不改 Referral 分页。好友合格 → 该行照旧 `Qualified {date}` + `$5 voucher` + `Claim voucher`；同一好友是否被活动邀请任务计数，这里看不出来也不需要看出来（各算各的）。09-25 曾做过的 `Counted toward campaign` 行态已于 09-26 废止（migration `20260926110000`）。

### 4.4 钱包流水

复用 `bonus` 类型（Gift 绿图标），描述：`Campaign reward · <task> · Tier n` / `Campaign reward · <task> · 2026-09-24` / `Campaign reward · <task> · 7-day streak` / `Campaign reward · <task>`。

### 4.5 演示数据（alex_carter）

| 活动 | 任务 | 状态 |
|---|---|---|
| Starter Rewards | `vl_volume_ladder` | $36,000，t1–t4 已入账 |
| | `daily_trade` | 相对今天（UTC）：最近 14 天里 12 天达标（D-11 $18 未达、D-6 未开始），今天 $32 进行中，🔥 5。**每天 00:02 UTC 由 `roll_demo_campaign_daily()`（pg_cron `roll-demo-campaign-daily`）按今天重写**，否则第二天就成「昨天没做、streak 归零」 |
| | `invite_ladder` | 2 位好友合格（Referral 分页两行 `$5 voucher · Claim voucher`），t1 $5 已入账，t2 2/3 |
| | `active_7d` / `hold_24h` | alex 真实数据已达标 → 已入账 $5 / $15 |
| Finals Week（ended） | `fw_volume_ladder` / `fw_daily` | 阶梯 3/7 档已入账；每日 3 天达标 |

`profiles.spot_balance` 与全部 `Campaign reward` 流水恒等。留档：`supabase/migrations/20260923150100_seed_volume_ladder_demo.sql`、`20260925100100_seed_task_types_r2_demo.sql`、`20260926000000_roll_demo_campaign_daily.sql`（滚动器，演示专用，正式版不需要）。

## 5. Admin 端：无

运营直接改 `campaign_entries.rules`。

## 7. 状态索引

| 区 | 模块 | RW 编号 | style-guide key |
|---|---|---|---|
| Ⓒ | TieredTaskRow 阶梯任务全态 | RW-8b | `rewards-tiered-rows` |
| Ⓒ | 档位抽屉 / tooltip | RW-8c | `rewards-tiered-drawer` |
| Ⓒ | RecurringTaskRow 周期任务全态 | RW-8d | `rewards-recurring-rows` |
| Ⓒ | 周期任务历史（hover 卡 / 抽屉） | RW-8d-b | `rewards-recurring-drawer` |
| Ⓒ | 周期任务历史 · 周任务变体 | RW-8d-c | `rewards-recurring-drawer-weekly` |
| Ⓒ | 指标行（邀请 / 活跃天 / 持仓 + 邀请阶梯） | RW-8e | `rewards-metric-rows` |
| Ⓒ | RepeatableTaskRow 可重复任务全态（ticket 奖励、盈利交易、混排、Not eligible、冻结、最长文案） | RW-8f | `rewards-repeatable-rows` |
| Ⓒ | CampaignLeaderboard 活动排行榜全态（桌面 + 手机；我在榜内 / 榜外 / 未上榜 / 未登录 / 加载 / 空 / 出错 / 已结束） | RW-8g | `rewards-campaign-leaderboard` |
| Ⓒ | 自动入账 toast | RW-12b | `rewards-credited-toast` |
| Ⓒ | streak bonus toast | RW-12c | `rewards-streak-toast` |
| Ⓓ | Your invites 行（pending / qualified / rewarded） | RW-15 | `rewards-referral-rows` |

## 8. 涉及文件

**前端**：`src/components/campaigns/TieredTaskRow.tsx` · `RecurringTaskRow.tsx` · `CreditedToastBody.tsx` · `TaskRowShell.tsx` · `GrantTaskRow.tsx` · `ReferralPanel.tsx` · `src/pages/lite/LiteCampaignDetailPage.tsx` · `src/hooks/useCampaigns.ts` · 2026-11-12：`RepeatableTaskRow.tsx` · `CampaignLeaderboard.tsx` · `CampaignCard.tsx` · `CampaignRewardsCard.tsx` · `EndedCampaignsArchive.tsx`

**后端**：`supabase/functions/claim-campaign-grant/index.ts` · `supabase/migrations/20260923150000_campaign_tiered_tasks.sql` · `20260925100000_campaign_task_types_r2.sql` · `20260926110000_referral_no_link.sql` · 演示留档 `20260923150100_*` / `20260925100100_*` / `20260926000000_*` · 2026-11-12：`20261112100000_campaign_winning_trades_repeatable_tickets_leaderboard.sql` + 演示 `20261112100100_*`

**字典**：`src/pages/StyleGuide/preview/rewardsPreviews.tsx` · `preview/registry.tsx` · `sections/RewardsStatesSection.tsx`

## 10. Lovable / 正式版边界

| 项 | Lovable | 正式版 |
|---|---|---|
| 指标重算与类型分发 | Postgres 触发器 + pg_cron | 研发自有事件管线，**口径以 §2.2 / §3 为准**，可整体替换实现 |
| USDC 入账 | `campaign_settle_grant()` 同事务写余额 + 流水 | 真实记账系统；必须保留「一档 / 一期 / 一次 bonus 只入账一次」的幂等语义，入账写路径唯一 |
| 邀请任务进度 | referrals 触发器在好友合格时给邀请人任务 +1 | 同语义；与 Referral 每人券是两条独立路径，不需要跨模块判断 |
| 持仓时长 | 平仓事件 + 每小时 cron | 可改事件驱动（仓位跨过 min_hours 时推一次） |
| 券档领取 | `claim-campaign-grant` | 同 |
| 入账 / streak 通知 | 页面加载 toast（localStorage） | 服务端推送 / 站内信，文案沿用 RW-12b / 12c |
| 配置校验 | 无 | 后台校验：tiers 2–8 升序单一单位；recurring `period` 枚举、`every > 0`；metric 与 scope 组合合法 |

## 11. 未做的类型（等拍板）

顺序清单、人工审核（解 share / discord 事件源缺口）、按排名自动发奖、瓜分奖池、站内抽奖（开奖 / 中奖名单）。框架已预留 `type` / `metric` 两轴。排行榜的**展示**已在 §12 做了；按名次自动结算奖金没做，Master of Predictions 的奖金由运营线下发。

## 12. 2026-11-12 追加 · 盈利交易 / 可重复 / ticket / 活动排行榜

首次使用：Crypto Brunoo「Master of Predictions」（英语入口 `BRUNOO`、西语入口 `BRUNOO-ES`，两个入口共用一张榜）。四个零件互相独立，可与原有类型任意组合。migration `20261112100000_campaign_winning_trades_repeatable_tickets_leaderboard.sql`，演示留档 `20261112100100_seed_master_of_predictions_demo.sql`。

### 12.1 配置写法

```jsonc
// campaign_entries.rules
{
  "tasks": [{
    "task_key": "mp_wins",
    "type": "repeatable",            // 每达到一次 target 发一次 reward
    "metric": "winning_trades",
    "target": 1,
    "max_times": 50,                 // 可选，最多发几次；不写 = 不封顶
    "min_stake": 10,                 // 可选，自己出的钱（margin）至少多少才算；缺省 0
    "once_per_market": true,         // 可选，同一个市场只算一次；缺省 true
    "scope": { "any_market": true, "products": ["markets", "quick_play"] },   // products 缺省两个都算
    "reward": { "ticket": 1 },
    "name": "Make a profitable trade",
    "subtitle": "Trades of $10 or more count · tickets enter the weekly lucky draw",
    "cta": { "label": "Trade", "href": "/events" }
  }],
  "leaderboard": { "task_key": "mp_wins", "top": 10, "title": "Ticket ranking · top 10",
                   "prizes": [{ "rank": 1, "label": "Master of Predictions" }] },   // title / prizes 可选
  "eligibility": { "new_users_only": true, "allow_user_ids": ["<uuid>"] }           // 可选
}
// campaign_entries.branding.title：可选，覆盖活动名（西语入口写 "Maestro de las Predicciones"）
```

### 12.2 口径

| 项 | 口径 |
|---|---|
| **一笔盈利交易**（`winning_trades`） | `positions` 里 `status = 'Closed'` 且 `pnl − winning_commission > 0` 的仓位：市场结算赢、提前卖出赚钱都算；不看平仓原因，只看最后是不是赚的。统计窗口内**开仓**的才算 |
| `min_stake` | 比的是 `positions.margin`（用户自己出的钱），不是 Boost 放大后的名义 |
| `once_per_market` | 市场 = 仓位所属的事件（`event_options.event_id`，取不到用 `event_name`）。同一事件买两边、分几次买，都只算一次；每一轮 5 分钟 / 每日轮是各自的事件，各算各的 |
| Quick Play | `arcade_calls.status = 'won'` 且 `gross ≥ min_stake` 算一笔；市场 = 开仓所在的 30 秒窗。任务 `scope` 带 `categories` 时不计 Quick Play；`scope.products` 不含 `quick_play` 时也不计 |
| 窗口 | repeatable 从 `max(加入时间, 活动开始)` 起算到活动结束；活动开始前的交易不算 |
| **repeatable 发放** | 值每跨过一个 `target` 发一次：第 n 次的 grant 行是 `<task_key>#r<n>`，目标 `target × n`。全部从源表重算，重复触发不会多发（同一行唯一键 + 行级闩锁） |
| **ticket** | `campaign_settle_grant()` 达标即把该行置 `claimed`，`progress.credited_ticket = n`、`credited_at`；**不写余额、不写流水**。用户的 ticket 数 = 该入口下 `#r` 行里 `claimed` 的行数 × `reward.ticket`（只数 claimed；页面与排行榜同一算法） |
| 其他奖励单位 + repeatable | USDC：每次达标自动入 Standard（沿用原入账路径）。券：grant 行会变 `claimable`，但页面的逐次领取按钮和 `claim-campaign-grant` 对 `#r` 键的解析**本轮未做**，暂不要配 |
| **排行榜**（`get_campaign_leaderboard(_entry_id, _limit)`） | 同一活动下、`leaderboard.task_key` 相同的所有入口合成一张榜。repeatable 任务按「已发次数 × 每次 ticket 数」排，其他类型按进度值排；并列时先达到的在前。返回前 N 名 + 调用者自己那一行（不在前 N 也返回）。只返回 `rank / username / value / is_me`，不返回 user_id。anon 可读 |
| **换入口** | 同一活动的两个入口（英 / 西）一个用户只能在一个里。拿到第一次可重复奖励时，参与记录即锁定在当前入口（`campaign_participations.locked_at`，与领券后锁定同一机制，触发器 `trg_campaign_grants_lock_entry`），之后再点另一条链接不会换过去，避免同一批盈利交易在两个入口各发一遍 |
| 分批卖出（**Lovable 的已知偏差**） | Lovable 的演示仓位在部分卖出后 `margin` 变成剩余部分、`pnl` 只留最后一笔，所以分批卖的仓位可能判不准。**正式版口径：`min_stake` 比开仓时投入的本金；盈亏看整个仓位累计已实现盈亏（扣佣后）> 0** |
| **只限新用户**（`campaign_entry_eligible()`） | `new_users_only = true` 时，只有 `campaign_participations.source = 'link'` 且账号创建时间不早于绑定这条链接前 24 小时的用户计进度；`allow_user_ids` 里的账号不受限（KOL 本人、演示号）。不符合的用户看得到页面，任务行显示 Not eligible + 一句原因，不计进度、不上榜 |

### 12.3 页面

| 位置 | 行为 |
|---|---|
| 任务行（`RepeatableTaskRow`，RW-8f） | 结构与其他任务行同一外壳：标题、副标题、奖励槽、右侧动作。奖励槽两行：`1 ticket`（金 `#FBBA23`）+ `{n} earned`。右侧一直是 CTA（Trade），因为它没有「完成」这个终点；设了 `max_times` 并发满后变 Claimed（RW-8f F10）。未登录：Sign in to start。活动已结束：冻结，保留已得数。不符合条件：虚线灰行 + 原因句 |
| 与其他任务混排 | ticket 是第三种奖励色，与 USDC（青）、voucher（柠檬）并列；单阈值任务（`GrantTaskRow`）也可以发 ticket。阶梯 / 周期任务发 ticket 的显示本轮未做 |
| 排行榜（`CampaignLeaderboard`，RW-8g） | 位置：任务列表之下、Campaign rules 之上。前 3 名是一条「领先者」区：桌面三栏用细线分开，每栏有大名次数字（第 1 名柠檬绿）、得数、用户名和一根表示与第 1 名差距的细条；手机上是三行同样的内容。4 名以后为列表行；「我」的那行高亮，不在前 N 时钉在列表末尾并显示真实名次。态：加载骨架 / 空（No one is on the board yet. Be the first.）/ 读取失败 / 活动结束（样式与标题不变，数据冻结，RW-8g L11）。用户名过长时折行，不截断 |
| 奖励卡（Your rewards here） | 只显示这个活动实际会发的单位：有 ticket 的活动显示 `Tickets earned`，配了排行榜再显示 `Your rank`；没有券 / USDC 任务时不显示对应格和跳转按钮 |
| 活动卡 / 已结束归档 | 活动里只有可重复任务时，不显示「x of y done」进度条和 `Rewards up to`，改为一行 `{n} tickets earned` |
| 活动名 | `branding.title` 有值时，卡片、详情页头、归档都用它 |

多语言：页面框架文案走站内语言；任务名、副标题、规则正文、榜单标题是运营写进配置的原文，不翻译（西语入口整套写西语）。**2026-11-12 起语言栏有 Español**（`src/locales/es.json`）：目前只翻了活动详情页、Rewards 列表卡、登录弹窗和全站外壳（导航 / 页脚）约 210 条，其余页面在西语下回落英语，等整站西语那一轮补齐。活动页的日期按用户所选语言和本地时区显示。

### 12.4 演示数据

| 活动 | 地址 | 看什么 |
|---|---|---|
| Master of Predictions（进行中） | `/rewards/campaign/b3333333-3333-4333-8333-bbbbbbbbbbb3`，西语 `?entry=BRUNOO-ES` | alex_carter 1 张 ticket（真实成交重算出来的），榜上 13 个演示交易者 41 → 3 张，alex 钉在末尾 |
| Prediction Sprint（已结束） | `/rewards/campaign/b4444444-4444-4444-8444-bbbbbbbbbbb4` | 冻结态；alex 9 张 ticket，第 9 名在前 10 内高亮 |

**Lovable 上有两处是为演示留的，和正式上线的配置不一样（CPO 2026-11-12 定：Lovable 保持现状，正式版按下表配）：**

| 项 | Lovable 现状（演示用） | 正式上线要配成 |
|---|---|---|
| 活动开始时间 `campaigns.starts_at` | `2026-11-10 23:00 UTC`，为了现在就能看到进行中的状态 | `2026-11-15 23:00 UTC`（西班牙时间 11 月 16 日 00:00）。结束时间不变：`2026-11-30 22:59:59 UTC`（西班牙时间 30 日 23:59） |
| 两个入口的 `rules.eligibility.allow_user_ids` | 里面有演示账号 alex_carter（`968a2b3a-…`），所以这个老账号也能拿票、上榜 | 留空（或只放 KOL 本人）。alex 不在名单里时，他在这个活动里是 Not eligible |

榜上 13 个演示交易者是直接写进库的演示数据，正式版不需要。

### 12.5 Lovable / 正式版边界

| 项 | Lovable | 正式版 |
|---|---|---|
| 盈利交易计数 | `positions` / `arcade_calls` 的状态触发器 → 重算 | 接自有结算事件；口径以 §12.2 为准，必须保留重算幂等 |
| ticket 记账 | 就是 `campaign_grants` 的行 | 同语义即可；ticket 不是资产，不进账务系统 |
| 参与记录写权限 | 现有 RLS 允许用户改自己的 `campaign_participations`（含 `source` / `joined_at`） | **必须只允许服务端写**，否则「只限新用户」可被绕过 |
| grant 行写权限 | 现有 RLS 允许用户更新自己的 grant 行（历史遗留） | **必须只允许服务端写**，否则 ticket 数可被改 |
| 排行榜 | 每次请求实时聚合 | 人多时改物化 / 缓存；并列规则、「我」的行、不外泄 user_id 三点保留 |
| 新用户判定 | 账号创建时间 vs 绑定链接时间（24 小时内） | 可换成注册归因字段，语义不变：通过这条链接注册的新号 |
| 按名次发奖 / 抽奖 | 无，运营线下做 | 等拍板（§11） |
| 配置校验 | 无 | `repeatable` 要求 `target > 0`、单一奖励单位；`leaderboard.task_key` 必须指向本入口存在的任务；`min_stake ≥ 0` |
