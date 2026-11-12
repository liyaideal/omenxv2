# 活动：赢单拿票 + 活动排行榜（Crypto Brunoo「Master of Predictions」）— 交付说明 v1

> **通俗导读**
>
> Crypto Brunoo 的活动「Master of Predictions」：通过他的链接注册的新用户，每做一笔赚钱的交易（自己出的钱 ≥ $10）拿 1 张 ticket；活动页上有一张按 ticket 数排的榜；ticket 同时是线下每周抽奖的凭证（抽奖在他的 TikTok 直播里做，站内不做）。
>
> 为了这个活动，活动模块加了四个以后都能复用的零件，运营只写配置、不改代码：
>
> 1. **盈利交易**（一种新的进度算法）—— 数"赚钱收场的交易笔数"。
> 2. **可重复任务**（一种新的任务类型）—— 每做到一次目标就发一次奖励，不封顶，也可以设上限。
> 3. **Ticket**（第三种奖励，金色）—— 只在这个活动里计数，不进任何余额。
> 4. **活动排行榜**（活动详情页上的一个区块）—— 按某条任务的得数排名，显示前 N 名和"我"的名次。
>
> 另外加了一个入口开关「只限通过这条链接注册的新用户」，语言栏加了 Español（只翻了这个活动相关的页面），并修了一个老问题（KOL 橙色条上「You joined through…」原来对所有人都显示）。
>
> 页面上**不出现奖金数额**，也没有 How it works / Prizes 区块（CPO 定）。奖金由运营线下发。
>
> 这份文档只讲这一次的需求，读它不需要先读别的文档。活动模块原有的任务类型（直接达标 / 阶梯 / 每日 / 邀请 / 活跃与持仓）见 `rewards-task-types-v1.md`，本次没有改它们的行为。

---

## 0. 读者须知

查什么去哪儿：

| 想知道 | 去哪儿 |
|---|---|
| 长什么样 | Lovable 正式站，见 §9 的四个地址（需要登录的用演示账号 alex_carter；手机看 375 宽） |
| 每个状态什么时候出现、长什么样 | `/style-guide` → Lite → Rewards → Ⓒ Campaign 详情：**RW-8f**（任务行）、**RW-8g**（排行榜）、RW-7b（KOL 橙色条） |
| 规则、算法、边界 | 本文 §3（每条规则有编号 R1…，测试用例按编号对应） |
| 配置怎么写 | 本文 §4 |
| 每块页面每个状态 + 文案原文 + 词条 key | 本文 §5 |
| 怎么测 | 本文 §8（用例表）+ §9（演示数据和账号） |
| Lovable 里哪些是演示写法、正式版要怎么做 | 本文 §10 |
| 没做的、已知问题 | 本文 §11 |
| 可能会问的问题 | 本文 §12（先看这里） |

## 0.1 字典怎么看

1. 打开 `https://omenxv2.lovable.app/style-guide`（不用登录），左栏点 **Lite › Rewards**，滚到 **Ⓒ Campaign 详情**。
2. 每张样张 = `编号 · 名称` + 一个里面跑着真实页面组件的框（桌面 / 手机 375 各一），下面一张表「状态 / 触发条件 / 视觉 / 数据来源」。触发条件就是判定表达式，可以直接照抄。
3. 页头搜索框敲 `RW-8f` 或 `RW-8g` 直接定位。
4. 单张查看：`/style-guide/preview?c=rewards-repeatable-rows`、`/style-guide/preview?c=rewards-campaign-leaderboard`、`/style-guide/preview?c=rewards-kol-band`；后面加 `&lang=es`（或 `ru` / `ja` / `ko` / `vi` / `zh-CN` / `zh-TW`）看该语言。
5. **只在字典里看得到、正式站凑不出条件的状态**（都已实现，不是 bug）：
   - RW-8f：F4 不符合资格、F7 换指标 / 换奖励（每邀请 1 人发 USDC、每 $100 交易量发 2 张票）、F8 盈利交易做成"一次性达标"的任务、F10 发满上限。
   - RW-8g：L2 / L3 我在前三 / 4–10 名（进行中的活动里演示账号在第 14 名）、L4 还没有成绩、L6 名次称号标签、L7 不带单位的榜、L8 加载中、L9 空榜、L10 加载失败。

---

## 1. 做了什么 / 没做什么

**做了**

| # | 内容 | 在哪看 |
|---|---|---|
| 1 | 盈利交易的进度算法 | §3 R1–R7 |
| 2 | 可重复任务 | §3 R8–R11 |
| 3 | Ticket 奖励 | §3 R12–R14 |
| 4 | 活动排行榜 | §3 R15–R20 |
| 5 | 入口「只限通过链接注册的新用户」 | §3 R21–R24 |
| 6 | 一个活动两个语言入口（英 / 西）、活动名可按入口覆盖 | §3 R25–R27 |
| 7 | Rewards 列表的活动卡、已结束归档、详情页奖励卡跟着显示 ticket 和名次 | §5.4–5.6 |
| 8 | 语言栏加 Español（部分翻译） | §6 |
| 9 | 修：KOL 橙色条第二行只对已加入的用户显示 | §5.7 |

**没做**（需要时另提需求）

- 站内抽奖（开奖、中奖名单）、按名次自动发奖金。这次都由运营线下做。
- 可重复任务发**券**时的逐次领取（配置能写，但页面没有领取按钮，暂时不要配）。
- 阶梯任务、每日 / 每周任务发 ticket 的显示；这两种任务行在"只限新用户"入口下的 Not eligible 显示。
- 每日上限（只有总上限 `max_times`）。
- 一人一号校验（CPO 定：不做）。
- 整站西语（只翻了 §6 列的范围）。
- 排行榜自动刷新（现在进页面时取一次）。

---

## 2. 用户看到的流程

1. 用户点 Brunoo 的链接：`/rewards/campaign/<活动 id>?entry=BRUNOO`（西语受众用 `?entry=BRUNOO-ES`）。任何带 `?entry=<code>` 的站内页面都会记住这个入口。
2. 没登录：页面照常能看（任务、榜、规则），任务行右侧写 `Sign in to start`。入口码先记在浏览器里，等登录后再绑定。
3. 注册 / 登录后：自动绑定到这个入口（没有 Join 按钮），弹一条提示：符合资格的是 `You're in — Crypto Brunoo's terms apply`；不符合资格的（老账号）是 `Only for new users who signed up through Crypto Brunoo's link.`。
4. 判定资格（R21）：是通过这条链接注册的新用户 → 任务行正常；不是 → 任务行变成虚线灰行，写 `Not eligible` 和一句原因，不计进度、不上榜。
5. 用户去交易。每有一笔赚钱收场的交易（R1–R7），自动得 1 张 ticket，不用点领取。任务行上 `{n} earned` 加 1，右侧奖励卡 `Tickets earned` 加 1，榜上的得数加 1。
6. 活动进行中任务行右侧一直是 `Trade` 按钮（去 `/events`），因为这个任务没有"完成"。
7. 活动结束：任务行冻结（`Ended`，保留已得数），榜单不再变化。活动从 Rewards 列表移到底部的 Ended campaigns，点进去还能看到最终榜。

---

## 3. 规则

每条规则：编号、说法、怎么判定。实现在 `supabase/migrations/20261112100000_campaign_winning_trades_repeatable_tickets_leaderboard.sql`（下称"迁移文件"），函数名写在括号里。

### 3.1 盈利交易（`campaign_metric_value()` 的 `winning_trades` 分支）

| 编号 | 规则 | 判定 |
|---|---|---|
| R1 | 一笔盈利交易 = 一个**已经结束**、最后是**赚钱**的仓位。市场结算赢了算；没等结算、提前卖出赚了也算。只看结果，不看是怎么结束的 | `positions.status = 'Closed'` 且 `pnl − winning_commission > 0`（扣掉盈利佣金后还是正的）。等于 0 不算 |
| R2 | 还没结束的仓位不算，哪怕浮盈 | 同上，必须 Closed |
| R3 | 只算**统计窗口内开仓**的 | `positions.created_at` 在窗口内。窗口见 R9。窗口前开的仓，哪怕在窗口内赚钱平掉，也不算 |
| R4 | 门槛 `min_stake`：**用户自己出的钱**至少这么多才算。Boost 放大出来的部分不算在内 | `positions.margin ≥ min_stake`（恰好等于算）。不配 = 0 = 不设门槛 |
| R5 | 同一个市场只算一次（缺省开启，`once_per_market: true`）。同一个市场买两边、分几次买，最多算一笔 | 市场 = 仓位所属的事件（`event_options.event_id`；取不到时退回 `event_name`）。5 分钟轮、每日轮的每一轮是各自的事件，各算各的。配成 `false` 则每个赚钱的仓位都算 |
| R6 | Quick Play 也算（缺省）：一次赢的 call 且下注额 ≥ `min_stake` 算一笔；"同一个市场" = 开仓所在的那个 30 秒窗 | `arcade_calls.status = 'won'` 且 `gross ≥ min_stake`；市场键 `floor(开仓时间秒 / 30)` |
| R7 | 可以按品类 / 按产品限定 | 任务 `scope.categories` 有值时只算这些品类的事件，且**不算** Quick Play；`scope.products` 不含 `"quick_play"` 时不算 Quick Play，不含 `"markets"` 时只算 Quick Play。缺省两个都算、不限品类 |

**分批卖出（正式版必须按这条做，Lovable 的演示数据做不到，见 §10）**：`min_stake` 比的是**开仓时投入的本金**；盈亏看**整个仓位累计的已实现盈亏**（扣佣后）是否 > 0。一个仓位分三次卖完，只在最后全部结束时判一次。

### 3.2 可重复任务（`apply_campaign_progress()` 的 `repeatable` 分支）

| 编号 | 规则 | 判定 |
|---|---|---|
| R8 | 进度每跨过一个 `target` 就发一次奖励。`target: 1` = 每一笔发一次；`target: 5` = 每满 5 笔发一次 | 应发次数 = `floor(进度值 / target)`。第 n 次的记录是 `campaign_grants` 里一行，`task_key = <任务 key>#r<n>` |
| R9 | 统计窗口 = 从「用户绑定到这个入口的时间」和「活动开始时间」里**较晚的那个**开始，到活动结束 | `GREATEST(participation.joined_at, campaign.starts_at)` 起算。活动结束后不再计算（只在活动 `status = 'live'` 且当前时间在起止之间时才算），所以活动内开的仓如果拖到活动结束后才结算，**不算** |
| R10 | 不会多发 | 每次都从源表整体重算，只补发缺的那几次；同一行有唯一键（user, entry, task_key）+ 状态闩锁。同一个事件重放两次，第二次什么都不发生 |
| R11 | 可选上限 `max_times`：最多发这么多次，发满后任务行右侧变成 `Claimed` | 应发次数取 `min(应发次数, max_times)` |

`target ≤ 0` 的配置会被跳过（不发任何东西）。

### 3.3 Ticket（`campaign_settle_grant()` 的 ticket 分支）

| 编号 | 规则 | 判定 |
|---|---|---|
| R12 | Ticket 不是钱：不进 Standard / Boost 余额，不写钱包流水，不出现在 Vouchers 页 | 达标时只把那一行 grant 置为 `claimed`，在 `progress` 里记 `credited_ticket`、`credited_at` |
| R13 | 达标即得，没有"待领取" | ticket 行直接是 `claimed`，页面没有 Claim 按钮 |
| R14 | 用户的 ticket 数 = 这条任务已发的次数 × 每次的张数 | `#r` 开头且 `status = 'claimed'` 的行数 × `reward.ticket`。**只数 claimed**。页面和排行榜用同一算法 |

Ticket 拿来干什么（排名 / 抽奖 / 别的）站内不管，由运营写在任务副标题里。

### 3.4 活动排行榜（`get_campaign_leaderboard(_entry_id, _limit)`）

| 编号 | 规则 | 判定 |
|---|---|---|
| R15 | 入口配了 `rules.leaderboard` 才显示这块；按其中 `task_key` 指的那条任务排 | 没配 = 不显示 |
| R16 | 排的数：可重复任务 = 已发次数 × 每次 ticket 数；其他类型的任务 = 进度值 | 得数为 0 的人不上榜 |
| R17 | 同一个活动里、按同一条任务排的**所有入口合成一张榜**（英语入口和西语入口的用户排在一起） | 按 `campaign_id` + `leaderboard.task_key` 相同归并 |
| R18 | 并列：先达到这个得数的排前面；名次不并列（1、2、3、4…，没有两个第 2） | 按得数降序，再按「最后一次得分的时间」升序 |
| R19 | 显示前 N 名（`top`，缺省 10，最大 100）。登录用户不在前 N 时，在列表最后加一行自己的真实名次；登录且符合资格但还没有得数的，最后一行显示 `— · You · —` | 接口返回前 N 行 + 调用者自己那一行（`is_me = true`） |
| R20 | 只显示用户名和得数，不暴露别的 | 接口只返回 `rank / username / value / is_me`，不返回用户 id。没登录也能看榜 |

榜单在进入页面时取一次，不自动刷新；用户刚拿到 ticket 后刷新页面可见。

### 3.5 只限新用户（`campaign_entry_eligible()`）

| 编号 | 规则 | 判定 |
|---|---|---|
| R21 | 入口配了 `eligibility.new_users_only: true` 时，只有**通过这条链接注册的新用户**计进度 | 两个条件都要满足：① 参与记录是通过链接建立的（`campaign_participations.source = 'link'`）；② 账号创建时间不早于绑定这条链接前 24 小时（`profiles.created_at ≥ joined_at − 24h`）。也就是：点链接 → 注册 → 自动绑定，或者注册后 24 小时内点了链接 |
| R22 | 白名单 `allow_user_ids` 里的账号不受限（给 KOL 本人、演示账号用） | 在名单里 = 直接符合 |
| R23 | 不符合的用户：能看页面和榜；任务行是虚线灰行，状态 `Not eligible`，副标题位置换成原因句 `Only for new users who signed up through {KOL 名}'s link.`；不计进度、不得票、不上榜；榜上没有"我"那一行 | 服务端不给他建任何 grant 行 |
| R24 | 没登录的访客不显示 Not eligible（还不知道他是谁），显示 `Sign in to start` | — |

### 3.6 入口

| 编号 | 规则 | 判定 |
|---|---|---|
| R25 | 一个用户在一个活动里只属于一个入口 | `campaign_participations` 每个用户每个活动一行 |
| R26 | 拿到第一次可重复奖励后，入口**锁定**：之后再点另一条链接不会换过去（会看到提示 `This entry is not available` 并回到首页）。拿到之前可以换 | grant 行变 `claimed` 且 key 含 `#r` 时，把参与记录的 `locked_at` 置为当前时间（触发器 `trg_campaign_grants_lock_entry`）。目的：防止同一批盈利交易在两个入口各发一遍 |
| R27 | 入口可以覆盖活动名（西语入口显示「Maestro de las Predicciones」） | `campaign_entries.branding.title` 有值时，活动卡、详情页头、归档都用它 |

访客看到的是哪个入口：已加入的 → 他加入的那个；没加入但带着 `?entry=<code>`（或之前带过、还存在浏览器里）→ 那个入口；都没有 → 活动的公开入口，没有公开入口就取第一个入口（本活动是英语入口）。

---

## 4. 运营怎么配

全部写在 `campaign_entries.rules`（JSON）里。**本次新增的字段**：

**任务（`rules.tasks[]` 的一项）**

| 字段 | 必填 | 取值 | 说明 |
|---|---|---|---|
| `type` | 是 | `"repeatable"` | 可重复任务（R8–R11）。其他取值是原有类型，不变 |
| `metric` | 是 | `"winning_trades"` | 盈利交易（R1–R7）。也可以配原有的指标（`usd_volume` 交易量、`referrals_qualified` 合格好友数等），可重复任务对任何指标都成立 |
| `target` | 是 | 数字，> 0 | 每多少发一次 |
| `max_times` | 否 | 正整数 | 最多发几次；不写 = 不封顶 |
| `min_stake` | 否 | 数字，≥ 0 | 只对 `winning_trades`：自己出的钱至少多少才算；缺省 0 |
| `once_per_market` | 否 | `true` / `false` | 只对 `winning_trades`：缺省 `true` |
| `scope.products` | 否 | `["markets","quick_play"]` 的子集 | 只对 `winning_trades`：缺省两个都算 |
| `reward.ticket` | 是（三选一） | 正整数 | 每次发几张 ticket。`reward` 里 `ticket` / `usdc` / `voucher` 只写一个 |
| `name` / `subtitle` | 是 | 文案 | 任务名 / 副标题。运营写什么显示什么，不走站内翻译（西语入口直接写西语）。副标题里写清门槛和 ticket 的用途 |
| `cta` | 否 | `{ "label": "Trade", "href": "/events" }` | 右侧按钮的字和去向；不写用缺省的 Trade → `/events` |
| `task_key` | 是 | 入口内唯一的字符串 | 两个语言入口要共用一张榜，就用同一个 key |

**排行榜（`rules.leaderboard`，可选）**

| 字段 | 必填 | 说明 |
|---|---|---|
| `task_key` | 是 | 按哪条任务排；必须是本入口里存在的任务 |
| `top` | 否 | 显示前几名，缺省 10 |
| `title` | 否 | 榜的标题，运营写什么显示什么；不写用站内缺省 `Ranking · top {N}`（会翻译）。本活动写的是 `Ticket ranking · top 10`。**不要叫 Leaderboard**，会和主站的 Leaderboard 混 |
| `prizes` | 否 | `[{ "rank": 1, "label": "称号" }]`：给某个名次加一个小标签。本活动没配 |

**资格（`rules.eligibility`，可选）**

| 字段 | 说明 |
|---|---|
| `new_users_only` | `true` = 只限通过这条链接注册的新用户（R21） |
| `allow_user_ids` | 用户 id 数组，名单里的不受限（R22） |

**入口品牌（`campaign_entries.branding`）新增**：`title`（可选）覆盖活动名（R27）。

**本活动英语入口的完整配置**（西语入口结构相同，文案换成西语，`link_code` 是 `BRUNOO-ES`，多一个 `branding.title`；全文见 `supabase/migrations/20261112100100_seed_master_of_predictions_demo.sql`）：

```json
{
  "tasks": [{
    "task_key": "mp_wins",
    "type": "repeatable",
    "metric": "winning_trades",
    "target": 1,
    "min_stake": 10,
    "once_per_market": true,
    "scope": { "any_market": true },
    "reward": { "ticket": 1 },
    "name": "Make a profitable trade",
    "subtitle": "Trades of $10 or more count · tickets enter the weekly lucky draw",
    "cta": { "label": "Trade", "href": "/events" }
  }],
  "leaderboard": { "task_key": "mp_wins", "top": 10, "title": "Ticket ranking · top 10" },
  "eligibility": { "new_users_only": true, "allow_user_ids": [] },
  "details": { "heading": "Campaign rules", "paragraphs": ["…活动规则正文，四段，见 seed 文件…"] }
}
```

活动本身（`campaigns` 表）：`name = "Master of Predictions"`，`status = "live"`，`starts_at = 2026-11-15 23:00 UTC`，`ends_at = 2026-11-30 22:59:59 UTC`（西班牙时间 11 月 16 日 00:00 → 30 日 23:59）。入口 `kind = "special"`（KOL 专属入口），`channel` 指向 Crypto Brunoo。

> **Lovable 上有两处为了演示和上面不一样**：活动开始时间是 `2026-11-10 23:00 UTC`（为了现在就能看到进行中的样子）；两个入口的 `allow_user_ids` 里有演示账号 alex_carter。正式版按上面写的配。

**正式版后台要做的配置校验**：`repeatable` 的 `target > 0`；`reward` 只含一种单位；`leaderboard.task_key` 指向本入口存在的任务；`min_stake ≥ 0`；`max_times` 为正整数；`link_code` 全站唯一。

---

## 5. 页面：每一块、每个状态、文案

文案列里，「词条」= 站内翻译的 key（都在 `src/locales/*.json` 的 `rewards` 命名空间下，除非另写）；「配置」= 运营在活动里写的原文，不翻译。

### 5.1 任务行（可重复任务，字典 RW-8f）

和别的任务行同一个外壳：左图标（盈利交易用奖杯）、标题、副标题、奖励位、右侧动作位。**没有进度条**。手机上标题和副标题在上，下面一条细线，线下左边奖励位、右边动作位。

奖励位两行：上面 `1 ticket`（金色 `#FBBA23`），下面 `{n} earned`（灰色小字，n = 已得的 ticket 数；奖励是 USDC / 券时 n = 已发次数）。

| 状态 | 什么时候 | 奖励位 | 右侧动作位 | 其他 |
|---|---|---|---|---|
| 未登录 | 没登录、活动没结束 | `1 ticket`，不显示第二行 | 灰字 `Sign in to start`（长语言在自己那一栏里折两行，不压奖励位） | F1 |
| 还没有票 | 已登录、符合资格、0 张 | `1 ticket` / `0 earned` | `Trade` 按钮 | F2 |
| 有票 | 已登录、n ≥ 1 | `1 ticket` / `12 earned` | `Trade` 按钮 | F3 |
| 不符合资格 | R23 | `1 ticket` 变灰，不显示第二行 | 灰字 `Not eligible` | 整行虚线边框、图标换成禁止符、副标题换成原因句。F4 |
| 活动结束 | 活动已结束 | `1 ticket` 变灰 / `12 earned` | 灰字 `Ended` | F5 |
| 发满上限 | 配了 `max_times` 且已发满 | 照常 | 灰字 `Claimed` | F10 |

文案：

| 显示 | 来源 |
|---|---|
| `Make a profitable trade` / `Trades of $10 or more count · tickets enter the weekly lucky draw` / `Trade` | 配置 |
| `{n} ticket` / `{n} tickets` | 词条 `screen.campaign_repeatable.ticket_reward`（单复数 `_one` / `_other`） |
| `{n} earned` | 词条 `screen.campaign_repeatable.earned_count` |
| `Sign in to start` | 词条 `screen.campaign_detail_page.sign_in_to_start` |
| `Not eligible` | 词条 `screen.campaign_detail_page.not_eligible` |
| `Only for new users who signed up through {name}'s link.` | 词条 `screen.campaign_repeatable.new_users_only`（name = 入口的 KOL 显示名） |
| `Ended` | 词条 `screen.campaign_detail_page.ended` |
| `Claimed` | 词条 `common.claimed` |

和原有任务排在同一个活动里时（F9）：行高、三栏位置、按钮都对齐，唯一的新东西是金色奖励位。原有的"一次性达标"任务也可以发 ticket（F8）：有分段进度条 `3 / 5 wins`，达标后右侧 `Credited`。

### 5.2 排行榜（字典 RW-8g）

位置：任务列表下面、Campaign rules 上面。上方一行小标题（配置里的 `title`）。

**前三名**：不用盒子、不用头像、不用金银铜。
- 桌面：三栏等宽，栏之间一根细线。每栏：左上名次大数字（第 1 名柠檬绿 `#CFFF4A`，2、3 名浅灰），右上得数 + 单位词 `tickets`，下面用户名，再下面一根细条——长度 = 这个人的得数 ÷ 第 1 名的得数（第 1 名的条是满的、柠檬绿；2、3 名灰色）。
- 手机：三行，每行：名次大数字、用户名 + 细条、右侧得数（不显示单位词）。
- 榜上不足 3 人时有几人显示几栏。

**第 4 名起**：每人一行，名次、小头像（用户名首字母）、用户名、得数（右对齐成一列）。

**"我"**：名次、名字、得数都是青色 `#33D6FF`，行底色更亮；用户名位置写 `You`。在前三名里时只是用户名位变成青色的 `You`。

| 状态 | 什么时候 | 显示 |
|---|---|---|
| 有榜，我在榜外 | 登录、有得数、名次 > N | 前 N 名 + 最后一行 `14 · You · 12` |
| 有榜，我在前三 / 4–N 名 | 登录、名次 ≤ N | 我的位置高亮 |
| 有榜，我还没有得数 | 登录、符合资格、得数 0 | 最后一行 `— · You · —` |
| 有榜，没有"我" | 没登录，或不符合资格 | 只有前 N 名 |
| 加载中 | 数据还没回来 | 5 行灰色占位（已知：占位没有做成前三名的形状，加载完会轻微跳一下，见 §11） |
| 空榜 | 还没有任何人有得数 | 一句 `No one is on the board yet. Be the first.` |
| 加载失败 | 接口报错 | 一句 `The ranking could not be loaded. Refresh to try again.` |
| 活动结束 | 活动已结束 | 样子和标题都不变，数据不再变 |

超长用户名折行，不用省略号截断。

| 显示 | 来源 |
|---|---|
| `Ticket ranking · top 10` | 配置（`leaderboard.title`）；不配时词条 `screen.campaign_leaderboard.title` = `Ranking · top {{count}}` |
| `tickets`（前三名得数后面） | 词条 `screen.campaign_leaderboard.unit_tickets`；排的不是 ticket 时不显示单位词 |
| `You` | 词条 `screen.campaign_leaderboard.you` |
| 空榜 / 失败两句 | 词条 `screen.campaign_leaderboard.empty` / `.load_error` |

### 5.3 详情页页头

活动名（R27）下面一行：`Nov 16 – Dec 1 · 19 days left · 180 joined`（手机写 `19d left`）。

- 日期按**用户所选语言和用户本地时区**显示（CPO 定）。所以活动规则正文里写的是西班牙时间 16–30 日，页头在别的时区可能显示成 15 日或 12 月 1 日，这是既定行为。
- `joined` = 入口的基数（`seed_base`）+ 实际加入人数，两个入口各算各的，所以英语入口和西语入口的数字不同。
- 活动结束后不显示剩余天数，多一个 `ENDED` 标。

词条：`screen.campaign_detail_page.days_left`、`.days_left_compact`、`.joined_count`、`.always_valid`、`.ended`。

### 5.4 详情页奖励卡（Your rewards here）

只显示这个活动实际会发的东西：

| 行 | 什么时候显示 | 值 |
|---|---|---|
| `Tickets earned` | 活动里有发 ticket 的任务 | ticket 数，金色 |
| `Your rank` | 入口配了排行榜且用户符合资格 | 名次；还没上榜显示 `—` |
| Vouchers / USDC 相关的行和 `Open Vouchers →` / `Open Wallet →` 按钮 | 活动里有发券 / 发 USDC 的任务 | 原有逻辑不变；本活动没有，所以不显示 |
| 底部归属条 | 一直显示 | KOL 入口：`ENTRY` / `Joined via Crypto Brunoo`；公开入口：`HOST` / `Official OmenX campaign — open to everyone` |

没登录时整张卡换成登录提示：`Sign in to track progress and claim rewards.` + `Log In` / `Sign Up`。

页面最底下那行关于 USDC 和券的免责小字：活动里没有发 USDC / 券的任务时**不显示**（本活动不显示）。

词条：`screen.campaign_repeatable.tickets_earned`、`screen.campaign_leaderboard.your_rank`、`screen.campaign_detail_page.entry` / `.host` / `.joined_via` / `.official_host_line` / `.your_rewards_here` / `.sign_in_to_track_progress_and_claim_rewards`。

### 5.5 Rewards 列表的活动卡

活动里**只有**可重复任务时：不显示进度条，不显示 `x / y tasks done`，不显示 `Rewards up to`；`Your progress` 右边是金色的 `{n} tickets earned`（0 也显示 `0 tickets earned`）。没登录时这一块本来就不显示。其他活动的卡不变。

词条：`screen.campaign_repeatable.tickets_earned_count`（`_one` / `_other`）、`screen.campaign_card.joined_count`、`.ends_in_days`、`.always_valid`。

### 5.6 已结束活动的归档（Rewards 列表底部 Ended campaigns）

只有可重复任务的活动，那一行右边（手机在第二行）写金色的 `{n} tickets earned`，不写 `x/y tasks` 和券 / USDC 金额。点进去是冻结的详情页。

### 5.7 KOL 橙色条（字典 RW-7b）

KOL 专属入口的详情页头上那条橙色胶囊。

- 第一行一直显示：`Crypto Brunoo × OmenX · Exclusive entry`（手机只显示 `Crypto Brunoo × OmenX`，原有行为）。
- 第二行 `You joined through Crypto Brunoo's link — his terms apply.`：**只在当前用户已经绑定到这个入口、并且符合资格时显示**。没登录、登录了但没加入这个入口、或加入了但不符合资格（R21）的，只有第一行。（这是本次修的：之前对所有人都显示。）

词条：`screen.campaign_detail_page.kol_exclusive_entry`、`.kol_joined_through`。

### 5.8 提示（toast，原有，未改）

| 什么时候 | 文案 |
|---|---|
| 登录用户第一次绑定到一个链接入口（或在锁定前换入口），且符合资格 | `You're in — {KOL 名}'s terms apply`（写死的英语） |
| 同上，但入口只限新用户而这个账号不符合（R21） | `Only for new users who signed up through {KOL 名}'s link.`（词条 `screen.campaign_repeatable.new_users_only`，和任务行上的原因句是同一句，已翻译）。账号仍然会绑定到入口，能看页面，只是不计进度 |
| 入口码不存在，或用户已锁定在别的入口 | `This entry is not available`，并回到首页（写死的英语） |

---

## 6. 多语言：Español

- 语言栏（页头的语言按钮、登录后在头像菜单 › Language、Settings › Preferences）多了第 8 种：**Español**，短码 `ES`，代码 `es`。存储和其他语言一样（登录用户存 `profiles.language`，访客存浏览器）。
- **只翻了一部分**，约 210 条，在 `src/locales/es.json`：活动详情页、Rewards 列表的活动卡、登录弹窗、全站导航和页脚。其余页面（交易、Portfolio、Wallet、Settings…）在西语下显示英语。整站西语另排期。
- 找不到西语词条时自动回落英语，不会显示成 key。
- 活动里运营写的文案（任务名、副标题、规则正文、榜单标题、按钮字）不翻译：英语入口永远是英语，西语入口永远是西语，和用户选的界面语言无关。所以会出现"界面是英语、活动文案是西语"的组合（用户用英语界面打开西语入口），这是既定行为。
- 本次新增的词条（8 个语言文件里都有）：`screen.campaign_repeatable.*`、`screen.campaign_leaderboard.*`、`screen.campaign_detail_page.sign_in_to_start` / `.not_eligible` / `.kol_exclusive_entry` / `.kol_joined_through` / `.official_host_line`。同时把活动页上原来写死的英语（joined、days left、Entry、Host、Always valid、Ended、登录卡两句）接到了词条上。**这些还没有回写到 i18n 总表 xlsx**，以 `src/locales/*.json` 为准。
- 西语是产品侧自己翻的，没有经过母语者校对。ticket 译作 boleto。

---

## 7. 数据与接口

没有新表、没有新列。全部用原有的三张表：

| 表 | 本次怎么用 |
|---|---|
| `campaign_entries` | `rules` 里多了 §4 的字段；`branding.title` |
| `campaign_participations` | `source`（`link` / `direct`）、`joined_at` 用来判资格（R21）；`locked_at` 用来锁入口（R26） |
| `campaign_grants` | 可重复任务每发一次一行：`task_key = <key>#r<n>`，`status = 'claimed'`，`progress = { value, current, target, credited_ticket, credited_at }` |

函数与触发器（全部在迁移文件里，可整段读）：

| 名称 | 作用 |
|---|---|
| `campaign_metric_value(user, metric, task, from, to)` | 算进度值。新增 `winning_trades` 分支 |
| `campaign_settle_grant(user, entry, key, value, target, reward, label)` | 唯一的发放入口。新增 ticket 分支 |
| `campaign_entry_eligible(user, rules, joined_at, source)` | 判资格 |
| `apply_campaign_progress(user, event_name, amount, at, metrics[])` | 遍历用户参加的进行中活动，逐任务重算并发放。新增资格判断、`repeatable` 分支 |
| 触发器 `trg_positions_campaign_wins`（`positions` 状态变为 Closed 时） | 调上面的函数，只重算 `winning_trades` 任务 |
| 触发器 `trg_arcade_calls_campaign_wins`（`arcade_calls` 状态变为 won 时） | 同上 |
| 触发器 `trg_campaign_grants_lock_entry`（grant 行变为 claimed 且 key 含 `#r`） | 锁定入口 |
| `get_campaign_leaderboard(_entry_id uuid, _limit int default 10)` → `(rank int, username text, value numeric, is_me boolean)` | 排行榜。未登录可调；`_limit` 被夹在 1–100；没配排行榜的入口返回空 |

两个 `…_campaign_wins` 触发器里包了异常处理：活动计算出错只记一条警告，**不会挡住仓位结算**。正式版同样要保证这一点。

前端：`src/hooks/useCampaigns.ts`（类型定义、`deriveRepeatable()` 算已得数、`isEntryEligible()` 前端的资格判断——与服务端同一规则、`useCampaignLeaderboard()`）；组件 `RepeatableTaskRow.tsx`、`CampaignLeaderboard.tsx`、`CampaignRewardsCard.tsx`、`CampaignCard.tsx`、`EndedCampaignsArchive.tsx`、`KolBand.tsx`、`GrantTaskRow.tsx`（都在 `src/components/campaigns/`）；页面 `src/pages/lite/LiteCampaignDetailPage.tsx`。

---

## 8. 测试用例

账号怎么准备见 §9。「得票」类用例在 Lovable 上最快的做法：用符合资格的账号，在 `/events` 找一个 5 分钟的加密轮，Standard 下 ≥ $10，等它结算；或者去 Quick Play 下一注 ≥ $10 的 call。赢了刷新活动页看结果。

### 8.1 盈利交易与得票

| 编号 | 对应规则 | 步骤 | 预期 |
|---|---|---|---|
| T1 | R1 | 下 $10，市场结算时我这边赢 | 刷新活动页：`earned` +1，奖励卡 Tickets earned +1，榜上得数 +1 |
| T2 | R1 | 下 $10，结算前价格涨了，提前卖出，有盈利 | +1 |
| T3 | R1 | 下 $10，结算输了 / 提前卖出亏了 | 不变 |
| T4 | R2 | 下 $10，仓位还开着且浮盈 | 不变 |
| T5 | R4 | 下 $9.99 并赢 | 不变 |
| T6 | R4 | 下恰好 $10 并赢 | +1 |
| T7 | R4 | Boost：自己出 $5、放大到 $25 的仓位，赢 | 不变（自己出的钱不到 $10） |
| T8 | R4 | Boost：自己出 $10、放大到 $50，赢 | +1 |
| T9 | R5 | 同一个市场同一边分两次各下 $10，都赢 | 只 +1 |
| T10 | R5 | 同一个市场两边各下 $10，一边赢 | 只 +1 |
| T11 | R5 | 两个不同的市场（比如相邻两个 5 分钟轮）各下 $10，都赢 | +2 |
| T12 | R6 | Quick Play 下 $10 的 call，赢 | +1 |
| T13 | R6 | Quick Play 下 $5 的 call，赢 | 不变 |
| T14 | R6 | Quick Play 同一个 30 秒窗里下两注 $10，都赢 | 只 +1 |
| T15 | R3 / R9 | 加入活动**之前**开的 $10 仓位，加入后赢了 | 不变 |
| T16 | R9 | 活动结束前开仓，活动结束后才结算并赢 | 不变 |
| T17 | R10 | 得到 1 张后，反复刷新页面、反复进出 | 始终是 1 张，不会涨 |
| T18 | R12 | 得票前后看 Wallet 余额、钱包流水、Vouchers 页 | 都没有变化，没有新流水 |
| T19 | R13 | 得票后看任务行 | 没有 Claim 按钮，右侧还是 `Trade` |

### 8.2 排行榜

| 编号 | 对应规则 | 步骤 | 预期 |
|---|---|---|---|
| T20 | R19 | 用 alex 看进行中的活动 | 前 10 名 + 最后一行青色 `14 · You · 1` |
| T21 | R19 | 用 alex 看已结束的活动 | 第 9 名那行是青色 `You`，没有额外的最后一行 |
| T22 | R19 / R20 | 退出登录看榜 | 只有前 10 名，没有 You 行 |
| T23 | R17 | 分别打开英语入口和西语入口 | 榜上的人和得数完全一样，只有标题语言不同 |
| T24 | R18 | （需造数据）两个人得数相同 | 先达到的排前面，名次不并列 |
| T25 | R16 | 一个符合资格但 0 张票的账号 | 不在榜上；最后一行 `— · You · —`；奖励卡 Your rank 显示 `—` |
| T26 | 5.2 | 桌面看前三名 | 三栏、细线分隔、第 1 名数字柠檬绿、第 1 名的条是满的 |
| T27 | 5.2 | 手机（375）看前三名 | 三行、不显示 `tickets` 单位词、没有横向滚动 |
| T28 | 5.2 | 得票后不刷新 | 榜不变；刷新后变（既定行为） |

### 8.3 资格与入口

| 编号 | 对应规则 | 步骤 | 预期 |
|---|---|---|---|
| T29 | R21 | 退出登录 → 打开带 `?entry=BRUNOO` 的活动页 → 用一个全新邮箱注册 | 弹 `You're in — Crypto Brunoo's terms apply`；任务行是正常的 `0 earned` + `Trade`；橙色条出现第二行 |
| T30 | R21 / R23 | 用一个老账号（如 Mia）登录后打开带 `?entry=BRUNOO` 的活动页 | 弹的提示是 `Only for new users who signed up through Crypto Brunoo's link.`（不是 `You're in…`）；任务行虚线灰、`Not eligible`、原因句；橙色条只有第一行；榜上没有 You 行；奖励卡没有 Your rank 行（底部归属条仍写 `Joined via Crypto Brunoo`，这是事实归属，既定） |
| T31 | R23 | 上一条的老账号去做一笔符合条件的盈利交易 | 不得票，不上榜 |
| T32 | R24 | 退出登录看活动页 | 任务行右侧 `Sign in to start`，不是 Not eligible |
| T33 | R26 | T29 的新账号还没得票时，打开 `?entry=BRUNOO-ES` | 换到西语入口：活动名变成 Maestro de las Predicciones，任务文案变西语 |
| T34 | R26 | 得到第一张票之后，再打开另一个入口的链接 | 弹 `This entry is not available`，回到首页；回活动页仍是原来的入口，票数不变 |
| T35 | R22 | alex（在白名单里，老账号） | 正常得票、上榜 |
| T36 | 5.7 | 退出登录看活动页（桌面） | 橙色条只有一行 |
| T37 | R27 | 打开西语入口 | 活动名「Maestro de las Predicciones」，Rewards 列表的卡片和归档里也是这个名字 |

### 8.4 其他页面与状态

| 编号 | 步骤 | 预期 |
|---|---|---|
| T38 | alex 看 `/rewards` | Master of Predictions 卡片：没有进度条，`Your progress` 右边金色 `1 ticket earned` |
| T39 | alex 在 `/rewards` 底部展开 Ended campaigns | Prediction Sprint 一行写 `9 tickets earned` |
| T40 | alex 看已结束活动的详情页 | 任务行 `1 ticket`（灰）/ `9 earned` / `Ended`；页头有 ENDED 标、没有剩余天数；奖励卡 9 张、第 9 名 |
| T41 | 看进行中活动页的最底部 | 没有关于 USDC / Trial Position Voucher 的免责小字 |
| T42 | 看一个原有的活动（Starter Rewards） | 和以前完全一样：进度条、`x / y tasks done`、`Rewards up to`、底部免责小字都在 |
| T43 | 点任务行的 `Trade` | 去 `/events` |
| T44 | 字典 RW-8f、RW-8g 逐帧对照 §5 的状态表 | 每个状态都有一帧，桌面和手机各一 |

### 8.5 多语言

| 编号 | 步骤 | 预期 |
|---|---|---|
| T45 | 语言切到 Español，退出登录，打开西语入口 | 整页西语：导航、活动名、日期（`11 nov – 1 dic`）、`quedan 19 días · 174 participantes`、任务、`1 boleto`、`Inicia sesión para empezar`、榜、规则标题、登录卡 |
| T46 | 同上，手机 375 | `Inicia sesión para empezar` 在自己那一栏折成两行，不压到 `1 boleto`；没有横向滚动 |
| T47 | 语言 Español，去 `/events`、`/portfolio`、`/wallet` | 导航和页脚是西语，页面主体是英语（既定，见 §6） |
| T48 | 语言切到 ru / ja / ko / vi / zh-CN / zh-TW，看进行中活动页，桌面 + 手机 | 框架词已翻译（任务行的 `Sign in to start`、`earned`、榜上的 `You`、奖励卡）；没有文字溢出、互相压住、横向滚动。任务名 / 副标题 / 规则 / 榜标题保持英语（配置原文） |
| T49 | 语言 English 打开西语入口 | 活动文案西语、框架词英语（既定） |

---

## 9. 演示数据与账号（Lovable）

**地址**（`https://omenxv2.lovable.app` + ）

| 页面 | 地址 |
|---|---|
| 进行中的活动，英语入口 | `/rewards/campaign/b3333333-3333-4333-8333-bbbbbbbbbbb3` |
| 同一活动，西语入口 | `/rewards/campaign/b3333333-3333-4333-8333-bbbbbbbbbbb3?entry=BRUNOO-ES` |
| 已结束的活动（Prediction Sprint，公开入口，不限新用户） | `/rewards/campaign/b4444444-4444-4444-8444-bbbbbbbbbbb4` |
| Rewards 列表 | `/rewards` |

**账号**

| 账号 | 用来测什么 | 现状 |
|---|---|---|
| alex_carter（Google 登录选 Alex Carter） | 符合资格的用户（靠白名单）：得票、榜上的"我"、奖励卡 | 进行中活动 1 张票、第 14 名；已结束活动 9 张票、第 9 名。已锁定在英语入口，所以**不能用它看登录后的西语入口** |
| Mia Reyes（Google 登录选 Mia Reyes） | 老账号、不在白名单：Not eligible | 已通过英语入口的链接绑定，状态是 Not eligible |
| 自己新注册一个邮箱账号 | 真正的"通过链接注册的新用户"流程（T29、T33、T34） | — |

**榜上的 13 个交易者**（Flickergecko_Jaw 41 张 … 最少 3 张）是直接写进库的演示数据，一直都在。已结束活动的榜同样是演示数据。

alex 那 1 张票是他真实的一笔盈利交易重算出来的，不是手写的。

---

## 10. Lovable 与正式版的差别

**必须照做（规则，不能改）**

- §3 全部规则，尤其：R1 的盈亏判定、R4 比的是自己出的钱、R5 每市场一次、R9 的窗口、R10 不多发、R14 只数已入账的行、R18 并列规则、R20 不暴露用户 id、R21 新用户判定、R26 入口锁定。
- 分批卖出按 §3.1 末尾那段：本金看开仓时投入，盈亏看整个仓位累计。
- 活动计算出错不能影响交易结算。

**可以换实现**

| 项 | Lovable | 正式版 |
|---|---|---|
| 什么时候算 | 仓位 / call 的状态变化触发数据库触发器，整体重算 | 接自己的结算事件即可，保持"重算、不多发" |
| 排行榜 | 每次请求实时聚合 | 人多了可以物化 / 缓存；R16–R20 保持 |
| 新用户判定 | 账号创建时间和绑定链接时间比（24 小时内） | 有注册归因字段的话可以直接用，语义不变：通过这条链接注册的新号 |
| Ticket 存哪 | 就是 `campaign_grants` 的行 | 同语义即可；ticket 不是资产，不进账务系统 |

**Lovable 里不对、正式版要做对的**

| 项 | Lovable 的问题 | 正式版 |
|---|---|---|
| 分批卖出 | 演示仓位在部分卖出后，`margin` 变成剩余部分、`pnl` 只留最后一笔，所以分批卖的仓位可能判错（比如 $15 分两次卖，剩余本金不到 $10 就不算了） | 按 §3.1 末尾的口径 |
| 参与记录的写权限 | 用户在入口锁定前可以改自己的参与记录（包括来源和加入时间），理论上能绕过"只限新用户" | 参与记录只能服务端写 |
| 任务记录的写权限 | 用户可以给自己插入 / 修改**未入账**的任务记录（已入账 `claimed` 的不能碰，所以票数和排名伪造不了）；但插一行同名的未入账记录可以让自己那一次发不出来 | 任务记录只能服务端写 |
| 配置校验 | 没有 | §4 末尾那几条 |

**演示专用，正式版不需要**

- 活动开始时间提前到 11-10、alex 在白名单里（§4）。
- 榜上 13 个演示交易者、已结束的活动 Prediction Sprint。
- `supabase/migrations/20261112100100_seed_master_of_predictions_demo.sql` 整个文件（但里面有两个入口的完整配置和中英西文案，可以照抄）。

---

## 11. 已知问题与未做

| # | 问题 | 影响 | 打算 |
|---|---|---|---|
| 1 | 排行榜加载中的占位是 5 行等高的灰条，加载完前三名更高，页面会轻微跳一下 | 观感 | 下次动这页时改 |
| 2 | 两条 toast（§5.8 里标了「写死的英语」的）没接翻译 | 西语用户看到英语提示 | 随整站西语一起做 |
| 3 | 榜和票数不自动刷新，要刷新页面 | 得票后不是立刻看到 | 未排期 |
| 4 | 已结束活动的榜没有"Final"之类的标记 | 只能靠页头的 ENDED 标区分 | CPO：先不加 |
| 5 | 西语只翻了约 210 条，且未经母语者校对 | 见 §6 | 整站西语另排期 |
| 6 | 新词条没回写 i18n 总表 xlsx | 平台侧接词条时要从 JSON 取 | 待补 |

未做的功能见 §1。

---

## 12. 先回答可能会问的

**Q：用户赢了一笔，但票没涨？** 按顺序查：是不是符合资格（R21）；自己出的钱够不够 $10（R4，Boost 放大的不算）；是不是加入活动之后开的仓（R3）；同一个市场是不是已经算过一次（R5）；扣掉佣金后是不是还赚（R1）；活动是不是还在进行（R9）；有没有刷新页面。

**Q：打平 / 盈亏为 0 算不算？** 不算，必须大于 0。

**Q：被自动平仓的算不算？** 只看最后是不是赚的。自动平仓一般是亏的，所以一般不算；规则本身不看平仓原因。

**Q：一个仓位赚了很多，会不会多给票？** 不会。一笔就是一笔，和赚多少无关。

**Q：为什么英语入口和西语入口的 joined 人数不一样，榜却一样？** 人数是各入口自己的（R17 只合并榜）；榜是两个入口合在一起排的。

**Q：页头日期和规则正文里的日期对不上？** 页头按用户本地时区显示，规则正文是运营写的西班牙时间（§5.3）。

**Q：用户换了入口，票会跟着走吗？** 拿到票之前可以换入口，那时也没有票可带；拿到第一张票之后入口就锁定了，换不了（R26）。

**Q：两个人票数一样谁在前？** 先达到的（R18）。

**Q：Ticket 能提现 / 能转让 / 会过期吗？** 都不是。Ticket 只是这个活动里的一个计数，活动结束后数字保留在归档里，没有别的用途。

**Q：抽奖在哪？** 站内没有。运营用榜单 / 票数线下抽（Brunoo 的 TikTok 直播），奖金线下发到中奖者的 OmenX 余额。

**Q：为什么页面上没写奖金多少？** CPO 定的，不写。

**Q：为什么不叫 Leaderboard？** 主站已经有一个 Leaderboard 页面，怕用户混，所以这块的标题由运营自己写，本活动叫 Ticket ranking。

**Q：不符合资格的用户为什么还能看到活动？** 既定。他能看任务、榜和规则，只是不计进度。

**Q：这次改动会影响原有活动吗？** 不会。原有任务类型的算法没动；活动卡、奖励卡、归档只在"活动里有 ticket / 只有可重复任务"时才走新的显示，其他情况和以前一样（T42）。

---

## 13. 涉及文件

- 后端：`supabase/migrations/20261112100000_campaign_winning_trades_repeatable_tickets_leaderboard.sql`；演示数据与完整配置 `20261112100100_seed_master_of_predictions_demo.sql`
- 前端：`src/hooks/useCampaigns.ts`；`src/components/campaigns/RepeatableTaskRow.tsx`、`CampaignLeaderboard.tsx`、`CampaignRewardsCard.tsx`、`CampaignCard.tsx`、`EndedCampaignsArchive.tsx`、`KolBand.tsx`、`GrantTaskRow.tsx`、`TaskRowShell.tsx`、`SignInPromptCard.tsx`；`src/pages/lite/LiteCampaignDetailPage.tsx`
- 多语言：`src/lib/languages.ts`、`src/i18n/index.ts`、`src/locales/es.json`（新）及其余 7 个语言文件
- 字典：`src/pages/StyleGuide/preview/rewardsPreviews.tsx`、`sections/RewardsStatesSection.tsx`（RW-8f、RW-8g、RW-7b）
- 相关文档：`docs/copy-dictionary.md`（Rewards / Campaigns 主表末尾）、`DESIGN.md`（§Addendum 2026-11-12）、`docs/backend-boundary.md`、`docs/delivery/language-entry-v1.md`（Español）、`docs/delivery/rewards-task-types-v1.md`（活动任务模块的总文档，§12 是本次内容的摘要）
