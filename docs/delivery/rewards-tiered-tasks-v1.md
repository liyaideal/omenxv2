# Rewards 任务类型 · 阶梯解锁（Tiered）— 交付说明 v1

> **已并入 `rewards-task-types-v1.md`（任务类型体系总文档），本文只留档。**

> 通俗导读：活动详情页的任务行原来只有一种——"做到一个目标，领一份奖励"。这一轮给任务定义加了一个 `type` 字段，第一个新类型是 **阶梯解锁（tiered）**：一条任务、一根进度条、多个档位，每到一档发一档。USDC 档**达标即自动入 Standard 账户**，不用点领；券档达标后照旧点 Claim。运营在 `campaign_entries.rules.tasks[]` 里配 `type: "tiered"` + `tiers[]` 就能用，前端与服务端按 `type` 分发，老任务（没有 `type`）一字不动。首个真实配置：Starter Rewards 活动里新增的「Cumulative trading volume」（7 档，2,000 → 200,000 USDC，累计 400 USDC）。

## 0. 读者须知

查什么去哪儿：
- 长什么样 → 生产页 `/rewards/campaign/19033848-dc98-4a53-b4c5-d9e31b24a51f`（Starter Rewards，always-on，第 4 条任务）、`/rewards/campaign/a2222222-2222-4222-8222-aaaaaaaaaaa2`（Finals Week，ended，含一条阶梯）
- 什么时候变成什么样 → `/style-guide` → Lite → Rewards 状态字典 **RW-8b / RW-8c / RW-12b**（每个 case 有「状态 / 触发条件 / 视觉 / 数据来源」表）
- 字段名、文案、公式、时间口径、术语 → `docs/copy-dictionary.md`（顶部有「Lite 术语对照表」；Rewards 节新增「阶梯任务」小节）→ 本文档对应章节
- 设计法则（刻度点、奖励槽两行、抽屉 / tooltip 对等）→ `DESIGN.md` §Addendum 2026-09-23 · 阶梯任务行
- Rewards 页整体（相位、九分支任务行、邀请、合规）→ `docs/delivery/lite-rewards-spec-v1.md`（本文档只写阶梯类型新增的部分）

提问前先按上面顺序查一遍；查不到再提，提问时写明"我查了 X 没有"。

## 0.1 字典怎么看

1. 打开 `/style-guide`（不用登录），左栏点 **Lite › Rewards**。
2. 节点顶部「本页目录」按产品页从上到下排小节；本次的样张在 **Ⓒ Campaign 详情** 小节，编号 RW-8b（任务行全态）、RW-8c（档位抽屉 / tooltip）、RW-12b（自动入账 toast）。
3. 小节顶部黄框「定位行」写路由 / 词典节 / 交付文档。
4. 每张样张 = `编号 · 状态名（组件名）` + iframe 里的真组件（桌面 100% / 手机 375），可交互：RW-8c 手机帧里的抽屉是挂开的，可以滚。
5. 样张下表「状态 / 触发条件 / 视觉 / 数据来源」——触发条件就是判定表达式，可直接照抄进实现。
6. 页头搜索框敲 `RW-8b` 或 `tiered`，结果点了落到样张。
7. 单张查看 / 截图：`/style-guide/preview?c=rewards-tiered-rows` · `?c=rewards-tiered-drawer` · `?c=rewards-credited-toast`。

**编号规则**：RW 前缀 = Rewards；`b` / `c` 是同一模块的变体样张（8b 阶梯行、8c 抽屉），无 `-D` / `-M` 后缀，桌面 / 手机在同一编号的上下两帧。

**只在字典可见、生产凑不出条件的态**（既定状态，不是 bug）：RW-8b 第 9–12 行的**券阶梯**（Claim $5 / Claim all $25 / claiming / All claimed）——生产目前只配了 USDC 阶梯，券阶梯的行为已实现、等运营配；RW-8b 第 7 行 not_eligible——阶梯任务目前没有 KOL 专属入口场景；RW-8c 手机帧抽屉挂开走 fixture prop `defaultDrawerOpen`，生产要点 `N / M tiers ›` 才开。

## 1. 功能目标

给运营一个可复用的任务模版：同一指标、多档目标、逐档发奖，运营只改 JSON 不改代码。关键约束四条：

- **一根进度条**：所有档位共享一个累计值；进度文案分母永远是"下一个未达档"。
- **USDC 档达标即入账**：服务端触发器在成交落库的同一事务里把该档记为已发、Standard 余额 +X、写一条钱包流水；页面没有"待领 / 待审核"中间态。
- **券档达标后点领**：与现有 Claim voucher 流程一致，走同一个 edge function。
- **行卡字量封顶**：不管 2 档还是 8 档，行卡只有标题 / 副标题 / 一个进度数字 / 奖励槽两行；档位明细下沉到二级（桌面 hover tooltip、手机底部抽屉）。

档数上限 8（前端不硬限，刻度点等距，8 档时桌面最小间距 35px 仍可 hover）。

## 2. 数据模型与状态机

### 2.1 任务定义（`campaign_entries.rules.tasks[]`）

| 字段 | 类型 | 说明 |
|---|---|---|
| `task_key` | text | 父任务 key；各档 grant 用 `<task_key>#t<n>`（n 从 1） |
| `type` | `"threshold"` \| `"tiered"` | 缺省 `threshold` = 现有单目标任务，**存量任务零改动** |
| `name` / `subtitle` | text | 与现有一致（2026-09-25 修正：副标题不写奖励单位，单位回到第二列奖励槽，见 rewards-task-types-v1 §2.1） |
| `metric` | `"usd_volume"` \| `"count"` | 与现有一致，`count` 阶梯没有实际意义（只能到 1） |
| `scope` | json | 与现有一致（`{any_market:true}` / `{categories:[…]}`） |
| `cta` | `{label, href}` | 与现有一致；缺省 `Trade` → `/events?sector=<scope.categories[0]>` 或 `/events` |
| `tiers` | `[{target, reward}]` | **阶梯专用**。按 `target` 升序，2–8 档；`reward` 与现有结构一致 `{usdc}` 或 `{voucher}`。**约定：一条阶梯只配一种奖励单位** |
| `target` / `reward` | — | 阶梯任务不读（有也忽略） |

真实配置（Starter Rewards 第 4 条任务）：

```json
{
  "task_key": "vl_volume_ladder",
  "type": "tiered",
  "name": "Cumulative trading volume",
  "subtitle": "Every filled order on any market counts",
  "metric": "usd_volume",
  "scope": { "any_market": true },
  "cta": { "label": "Trade", "href": "/events" },
  "tiers": [
    { "target": 2000,   "reward": { "usdc": 4 } },
    { "target": 5000,   "reward": { "usdc": 6 } },
    { "target": 10000,  "reward": { "usdc": 10 } },
    { "target": 30000,  "reward": { "usdc": 40 } },
    { "target": 50000,  "reward": { "usdc": 40 } },
    { "target": 100000, "reward": { "usdc": 100 } },
    { "target": 200000, "reward": { "usdc": 200 } }
  ]
}
```

### 2.2 grant 行（`campaign_grants`，表结构不变）

每档一行，`task_key = '<task_key>#t<n>'`；父 key 本身**不写行**。`progress` JSON：

| 键 | 说明 |
|---|---|
| `value` / `current` | 共享累计值，触发器每次对**所有档**同步写（含已发档），前端取 max |
| `target` | 该档目标 |
| `credited_usdc` / `credited_at` | 仅 USDC 档入账时写；`credited_at` 兼作入账时间戳 |

### 2.3 每档状态（`status` 沿用现有 5 值，含义按奖励单位分流）

| status | USDC 档 | 券档 |
|---|---|---|
| `not_started` | 无进度 | 无进度 |
| `in_progress` | 有进度未达 | 有进度未达 |
| `claimable` | **不出现**（达标直接 `claimed`） | 达标未领 → Claim |
| `claimed` | 已入账 Standard | 已领券 |
| `not_eligible` | 任一档为此值 → 整条任务虚线态 | 同左 |

状态只进不退（沿用现有 GREATEST 合并；`claimed` / `not_eligible` 不被覆盖）。

### 2.4 前端派生量（`deriveTiered()`，`src/components/campaigns/TieredTaskRow.tsx`）

| 量 | 表达式 |
|---|---|
| `value` | `max(grants[<key>#t*].progress.value)`；无行为 0 |
| `reached[n]` | `claimed ∨ claimable ∨ value ≥ tiers[n].target` |
| `nextIdx` | 第一个 `!reached` 的下标；全达为 −1 |
| 进度分母 | `tiers[nextIdx].target`；全达 = 最高档 target |
| 进度条填充 | **等距**：`(nextIdx + clamp((value − lo) / (target − lo))) / M`，`lo` = 上一档 target 或 0 |
| `claimableSum` / `claimableCount` | 券档 `claimable` 的面值和 / 个数 |
| `claimedSum` | 已发档面值和 |
| `allClaimed` | 每档都 `claimed` |
| `notEligible` | 任一档 `not_eligible` |

### 2.5 聚合口径（`buildCampaignView`，`useCampaigns.ts`）

- 一条阶梯任务 = **1** 个任务：`tasksTotal` 计 1；`tasksDone` 全档 `claimed` 才计；`claimableCount` 任一档 `claimable` 计 1。
- Hero / 卡片 `Rewards up to $X` = 累加**全部档**；奖励卡 `USDC` / `Vouchers` 已得 = 累加已发档。

## 3. 数据库 / 服务端

### 3.1 进度触发器 `apply_campaign_progress()`（migration `20260923150000_campaign_tiered_tasks.sql`）

`trades` AFTER INSERT / UPDATE OF status 触发（现有），函数按 `rules.tasks[].type` 分支：

- `threshold`（缺省）：与之前**逐字相同**。
- `tiered`：读该任务所有档行的 `max(value)` 为当前值，`usd_volume` 累加成交额 / `count` 置 1；然后**逐档**：
  1. `INSERT … ON CONFLICT DO NOTHING` 建行；
  2. 已 `claimed` / `not_eligible` → 只同步 `value`；
  3. `value ≥ target` 且档奖励是 USDC → `UPDATE … SET status='claimed', progress += {credited_usdc, credited_at} WHERE status <> 'claimed'`（**行级闩锁**，只有真正翻转状态的那次写才入账）→ `profiles.spot_balance += usdc` → `INSERT transactions (type 'bonus', account 'spot', description 'Campaign reward · <task name> · Tier n', status 'completed')`；
  4. 否则 → `claimable`（券档达标）或 `in_progress`。
- 一笔大单跨多档 → 同一事务逐档入账、逐档一条流水。
- 幂等：重放同一事件不会重复入账（已 `claimed` 的档走分支 2）。实测：四次调用（2,500 / 3,000 / 30,000 / 0.01）→ 四档各入账一次、四条流水，第四次零副作用。
- 入账写路径**唯一**在此函数；`claim-campaign-grant` 不处理 USDC 档。
- 活动必须 `campaigns.status='live'` 且成交时间在 `starts_at … ends_at` 内、晚于 `joined_at`（与现有一致）。

### 3.2 Edge Function `claim-campaign-grant`

`taskKey` 形如 `<task_key>#t<n>` 时：按 `#t` 拆出父 key 与档号，校验 `task.type === 'tiered'` 且档号在范围内，面值取 `tiers[n-1].reward.voucher`；grant 行按完整 tier key 查。其余（payout_mode、发券、幂等）不变。USDC 档到这里会因 `voucher` 为 0 被拒（`This task has no voucher reward to claim`）——这是预期，USDC 档不经此路径。

### 3.3 钱包流水

复用现有 `bonus` 类型（钱包历史 icon `Gift` 绿、`bg-trading-green/20`，与 instant 券结算同一形态），描述 `Campaign reward · Cumulative trading volume · Tier 4`。不新增交易类型，钱包枚举映射无缺口。

### 3.4 演示数据（alex_carter · `968a2b3a-3913-4acb-948b-c78cc828a125`）

| 活动 | entry | 任务 | 状态 |
|---|---|---|---|
| Starter Rewards（always-on） | `690c42ff-a87d-4201-937f-311c8c4432d5` | `vl_volume_ladder` 7 档 USDC，排在 first_trade / join_discord / connect_external 之后 | value 36,000：t1–t4 已入账（4 / 6 / 10 / 40），t5–t7 进行中；4 条 bonus 流水；entry.reward 加 `usdc: 400` |
| Finals Week（ended） | `b2222222-…-bbbbbbbbbbb2` | `fw_volume_ladder` 7 档 USDC（scope sports） | value 12,400：t1–t3 已入账，其余进行中；活动已结束 → 行卡 `$20 credited` + `Ended`；3 条 bonus 流水 |

`profiles.spot_balance` 相应 +80（与流水恒等）。留档：`supabase/migrations/20260923150100_seed_volume_ladder_demo.sql`。

## 4. 用户端流程

### 4.1 任务行（`TieredTaskRow`，挂在 `LiteCampaignDetailPage` 任务列表，按 `task.type` 分发）

外壳与 `GrantTaskRow` 完全相同（`TaskRowShell`：#131519 卡 / #1D2026 线 / r14 / 15×16 / 36px 图标 / 桌面三栏 92 + 132 / 手机两层）。新增三处：

1. **进度条刻度点**：每档一个 8px 圆，等距 `n / M`，外圈 2px 卡底色描边；未达 `#2B2F38`、已达未领 `#33D6FF`、已发 `#33D6FF` + 55% 暗芯。桌面 hover 出 tooltip `Tier 4 · $30,000 → $40 USDC · Credited`。
2. **进度文案** `$36,000 / $50,000`（千分位，分母 = 下一档）。手机端阶梯行的进度条通栏、数字换行右对齐（7–8 个刻度点才放得开）。
3. **奖励槽两行**（92px，不带单位词）：

| 情形 | 行 1 | 行 2 |
|---|---|---|
| 有券档可领 | lime `$25 ready` | `2 / 3 tiers` |
| 无可领、有未达 | 灰 `next $40` | `4 / 7 tiers` |
| 全部已发 | 灰 `$400 credited`（USDC）/ `$85 claimed`（券） | `7 / 7 tiers` |
| 活动已结束 | 灰 `$20 credited`（已发部分） | `3 / 7 tiers` |

行 2 桌面 hover 出全档表 tooltip；手机带 `›`，点开底部抽屉（`MobileDrawer`，标题 `Tiers`，副题 `<task> · $36,000 traded`，每档：状态点 / `$target` + `Tier n` / 奖励 / `Credited` · `Ready` · `Locked`；券档 `Ready` 行内可单独 Claim）。

**动作栏优先级**：`Sign in to start`（未登录）→ `Not eligible` → 已结束（`All credited` / `Ended`）→ 券档可领（1 档 `Claim $5`，≥2 档 `Claim all $25`，顺序逐档调 `claim-campaign-grant`，失败即停、已领档保持）→ 全部已发（`All credited` / `All claimed`）→ 描边 CTA（`Trade`）。

### 4.2 自动入账反馈

详情页加载时，对每条阶梯任务找出 `claimed` 且 `credited_usdc > 0` 的档；与 `localStorage["omenx_campaign_credited_seen:<userId>"]` 比对，未见过的每档弹一次 `toast.success`：标题 `+$40 USDC credited to Standard`、描述 `Tier 4 of Cumulative trading volume`、动作 `Open wallet` → `/wallet`。首访（seen 为空且已发档 > 1）静默标记不弹，避免老账号一次弹七条。服务端入账发生在成交那一刻，页面不做实时推送。

### 4.3 未变的部分

活动卡、Hero、奖励卡、规则折叠、fine print、Referral、券领取流程、threshold 任务行——全部不变；`TaskRowShell` 对非阶梯行零视觉变化（进度数字加了千分位，现有目标 ≤ 500 不受影响）。

## 5. Admin 端：无

运营直接改 `campaign_entries.rules`。

## 7. 状态索引

| 区 | 模块 | RW 编号 | style-guide key |
|---|---|---|---|
| Ⓒ | TieredTaskRow 阶梯任务全态（7 档 USDC + 3 档券，12 行） | RW-8b | `rewards-tiered-rows` |
| Ⓒ | 档位抽屉（手机）/ tooltip 规格（桌面） | RW-8c | `rewards-tiered-drawer` |
| Ⓒ | 自动入账反馈 toast | RW-12b | `rewards-credited-toast` |

## 8. 涉及文件

**前端**：`src/components/campaigns/TieredTaskRow.tsx`（新）· `src/components/campaigns/CreditedToastBody.tsx`（新）· `src/components/campaigns/TaskRowShell.tsx`（`progress.pct` / `progress.ticks`）· `src/pages/lite/LiteCampaignDetailPage.tsx`（按 type 分发 + 入账 toast）· `src/hooks/useCampaigns.ts`（`type` / `tiers` / `isTieredTask` / `tierGrantKey` / 聚合口径）

**后端**：`supabase/functions/claim-campaign-grant/index.ts`（`#t<n>` 解析）· `supabase/migrations/20260923150000_campaign_tiered_tasks.sql`（`apply_campaign_progress` 阶梯分支）· `supabase/migrations/20260923150100_seed_volume_ladder_demo.sql`（演示数据留档）

**字典**：`src/pages/StyleGuide/preview/rewardsPreviews.tsx` · `src/pages/StyleGuide/preview/registry.tsx` · `src/pages/StyleGuide/sections/RewardsStatesSection.tsx`

## 10. Lovable / 正式版边界

| 项 | Lovable | 正式版 |
|---|---|---|
| 进度累计与档位判定 | Postgres 触发器 `apply_campaign_progress` | 研发自有事件管线，**口径以 §3.1 为准**（可整体替换实现） |
| USDC 入账 | 同事务写 `profiles.spot_balance` + `transactions(bonus)` | 真实记账系统；必须保留「行级闩锁 + 幂等」语义，一档只入账一次 |
| 券档领取 | `claim-campaign-grant` | 同 |
| 入账通知 | 页面加载时 toast（localStorage seen-set） | 可改为服务端推送 / 站内信；文案沿用 RW-12b |
| 档数上限 | 前端不硬限（设计验证到 8） | 后台配置校验 2–8、`target` 升序、单一奖励单位 |

## 11. 后续类型（本轮未做，等拍板）

周期重复（daily / weekly + streak）、顺序清单、人工审核（解决 share / discord 事件源缺口）、排名结算、瓜分奖池、邀请达标、持仓 / 留存、抽奖。分类框架「类型 × 修饰符（scope / quota / window / eligibility / requires）」已在 2026-09-23 方案里，`type` 字段即为此预留。
