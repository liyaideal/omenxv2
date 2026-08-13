# Rewards & Vouchers（/rewards）— 交付说明 v1

> 日期 2026-08-13。本文档覆盖 /rewards 全新改版：Campaigns tab、Referral tab、并入的 Vouchers tab（v2）以及 v2.1 移动全屏 redeem 流。研发以本文档 + `/style-guide` 活体 demo 为准：**本文档不写像素**，视觉规格一律以 style-guide 对应 demo 为唯一真相。`/portfolio` 的 VoucherBanner 与 `/trade` `/spot` 的 CloseVoucher 只在挂载点处交代，不展开。

---

## 1. 功能目标

- `/rewards` 是奖励唯一入口：Campaigns（活动与任务）、Vouchers（Trial Position Voucher 全生命周期）、Referral（邀请）三 tab。
- 奖励物只有两种：**Trial Position Voucher**（试用仓位券）与 **USDC**。Points 已退役。
- 券的价值实现路径：redeem → 在市场上开一个 trial position → 平仓后利润归用户，券本体不可提现。
- 专属链接（`?entry=CODE`）把用户软绑定到某个 campaign entry，不合资格者当场拒入并跳回首页。

---

## 2. 状态机与数据模型

### 2.1 Voucher 生命周期

| status | 含义 | 触发方 | 用户端表现 |
|---|---|---|---|
| `granted` | 已发放，等用户领取 | 服务端发放 | "Ready to claim" 分区，Tap to claim |
| `issued` | 历史发放态（等价 granted 之前口径） | 服务端 | 与 granted 同列 |
| `claimed` | 用户已领取，待 redeem | 用户点击领取 | "Active" 分区，可进入 redeem |
| `redeemed` | 已换成 trial position | redeem 确认 | Active 分区显示已开仓；archive 记录 |
| `settled` | 关联 trial position 已结算 | 结算链路 | 归入 History 档案条 |
| `expired` | 到期未 redeem | `expires_at` 到期 | History 档案条 |
| `revoked` | 人工作废 | 运营 | History 档案条 |

发放与领取补充：新用户注册由 `handle_new_user()` 从当日券池（`voucher_daily_pools`，面值 $10 / $25 / $50，配额 1000 / 500 / 100，`consume_daily_voucher_pool` 原子扣减）发 `granted` 券，`expires_at = now() + 30 天`。领取走 edge function `claim-position-voucher`，toast `Voucher claimed` / `You have 7 days to redeem it.`；兑换走 `redeem-position-voucher`，成功 toast `Voucher redeemed` / `Your position is now active.`。列表另注入两条只读 demo `expired` 券，用于无真实数据时展示过期态，永不参与 claim/redeem。

`payout_mode` 双轨：

| payout_mode | 结算行为 |
|---|---|
| `instant` | trial position 结算时由 Postgres 触发器直接把利润入 Standard 余额并写一条 transaction |
| `tiered` | 利润先进 `voucher_earnings.pending_amount`，用户在 earnings hero 走阶梯 claim |

阶梯（源：`src/lib/voucherTiers.ts`，服务端 `claim-voucher-earnings` 必须与之同步）：

| Tier | 累计可提上限 | 解锁条件 |
|---|---|---|
| T0 | $2 | 无 |
| T1 | $5 | $10 deposit |
| T2 | $10 | $1K 交易量 |
| T3 | $20 | $10K 交易量 |
| T4 | $50 | $50K 交易量 |

单次可 claim = `min(pending, unlockedCap − lifetimeCredited)`。

### 2.2 Voucher 兑换资格判定（`EventPickerList.checkEligibility`，判定顺序即下表顺序）

| 判定 | 条件 | 不通过文案 |
|---|---|---|
| 事件级锁 | 该 event 已被本人任一券占用 | `One voucher per event — you already opened a trial position here.`（卡内展开："One voucher per event — you already opened a trial position here. The lock covers both product lines of this event."） |
| 已结算 | `is_resolved` | `Event already resolved` |
| 无结算时间 | `end_date` 为空 | `No end date` |
| 结算过近 | 距结算 < `min_hours_to_settlement`（默认 12h） | `Vouchers can't open a position this close to settlement.` |
| 价格带 | option 价格需落在 `entry_price_min`–`entry_price_max`（默认 20¢–80¢） | `Priced outside the voucher band — pick another option.` |

锁卡右上徽标文案：`Voucher already used`。锁的判定来源是 `usedEventIds`（本人全部券的 `redeemedEventId` 集合），跨 Boost / Standard 两条产品线生效。

其余固定业务参数：面值 `face_value`；最大利润 = `face_value × redeemable_cap_pct`（默认 0.5）；持仓窗口 `max_holding_hours` 默认 72h，到点自动平仓。

### 2.3 Campaign 归因判定（`CampaignAttribution`）

| 分支 | 条件 | 结果 |
|---|---|---|
| 首次绑定 | 该 campaign 无 participation | 插入 participation，toast `You're in — {display_name}'s terms apply` |
| 换绑 | participation 存在、`locked_at` 为空、entry 不同 | 更新 entry_id，同上 toast |
| 已锁定拒入 | participation 已 `locked_at` 且 entry 不同 | 拒入 |
| 链接无效 | `link_code` 查无 entry | 拒入 |
| 写库失败 | insert / update 报错 | 拒入 |

拒入行为：清掉本地 pending code → 弹**一条** `IneligibleEntryToast` → `navigate("/", { replace: true })`。toast 逐字：标题 `This entry is not available`；正文 `Your account isn't eligible for this exclusive link. Redirecting you to the home page.`

未登录访客带 `?entry=CODE` 落地时，code 暂存 `localStorage: omenx_pending_campaign_entry`，登录后再执行上表判定。

### 2.4 Grant 任务状态

`not_started` / `in_progress` / `claimable` / `claimed` / `not_eligible`。状态词让位给动作：`not_started`、`in_progress` 且已登录未冻结时，行右渲染次级动作按钮（由 task `cta` 决定跳转，缺省按 task_key 推导：discord → 外链、connect → `/settings`、其余 → `/events?sector=…`）。

行右侧渲染优先级：未登录且未冻结 → 文案 `Sign in to start`（无按钮）；`showAction` → 动作按钮；`claimable` 且 voucher > 0 → 白底 `Claim voucher`；`claimable` 且仅 USDC → 静态文案 `Credited to Standard after review`；其余 → 状态词。`not_eligible` 行走 muted / dashed，副标题固定为 `Covered by your friend's invite — this one goes to them.`

---

## 3. 数据库

### 3.1 `position_vouchers`（核心字段）

| 字段 | 类型 | 说明 |
|---|---|---|
| `code` | text unique | 券码 |
| `face_value` | numeric | 面值 |
| `redeemable_cap_pct` | numeric default 0.5 | 最大利润比例 |
| `max_holding_hours` | int default 72 | 持仓窗口 |
| `entry_price_min` / `entry_price_max` | numeric default 0.20 / 0.80 | 价格带 |
| `min_hours_to_settlement` | int default 12 | 距结算最小时长 |
| `status` | text | 见 §2.1 |
| `payout_mode` | text | `instant` / `tiered` |
| `instant_paid_at` | timestamptz | instant 入账时间 |
| `source_entry_id` | uuid → campaign_entries | 来源活动入口 |
| `claimed_at` / `redeemed_at` / `expires_at` | timestamptz | 生命周期时点 |
| `redeemed_event_id` / `redeemed_option_id` / `redeemed_side` / `redeemed_airdrop_position_id` | — | 兑换落点 |

RLS：仅 `GRANT SELECT ... TO authenticated`，策略 `auth.uid() = user_id`；写入全部走服务端（edge function / trigger）。

Trigger：`trg_pay_instant_voucher_settlement` → `pay_instant_voucher_settlement()`，在 `airdrop_positions` 结算时对 `payout_mode = 'instant'` 的券把利润写入 Standard 余额并落 transaction。

### 3.1b 收益与券池附表

| 表 | 内容 |
|---|---|
| `voucher_earnings` | 每人一行：`pending_amount` / `lifetime_credited` / `last_settled_at`，本人只读 |
| `voucher_earnings_ledger` | `type ∈ (accrual, claim)`、`amount`、`airdrop_position_id`，本人只读 |
| `voucher_daily_pools` | `face_value + pool_date` 唯一，`total_quota` / `claimed_count`，公开可读；`ensure_voucher_pool_today()` 播种，`consume_daily_voucher_pool()` 仅 service_role |

### 3.2 Campaign 系列

| 表 | 读权限 | 写权限 |
|---|---|---|
| `campaigns` | anon/authenticated SELECT，策略限 `status IN ('live','ended')` | 仅 admin |
| `channels` | anon/authenticated SELECT | 仅 admin |
| `campaign_entries` | anon/authenticated SELECT | 仅 admin |
| `campaign_participations` | 本人 SELECT | 本人 INSERT；UPDATE 仅当 `locked_at IS NULL` |
| `campaign_grants` | 本人 SELECT | 本人 INSERT/UPDATE，且 `status <> 'claimed'` |

`campaign_entries.rules` JSON 承载：`tasks[]`（`task_key / name / subtitle / target / metric(count|usd_volume) / reward{voucher,usdc} / scope{categories,any_market} / cta{label,href}`）与 `details{heading, paragraphs[]}`（长文规则）。

进度驱动（全部在 Postgres）：`trades` 的 AFTER INSERT / AFTER UPDATE OF status 触发器 `trades_campaign_progress()` 仅在 `status = 'Filled'` 时触发 → `apply_campaign_progress(user, event_name, amount, at)`，按 `campaign_scope_matches(scope, event_name)` 累加 `usd_volume` 或 `count` 并 upsert `campaign_grants`（达标转 `claimable`）；同一函数顺带把被邀用户累计成交 ≥ $100 的 referral 转 qualified。两个函数对 anon/authenticated `REVOKE EXECUTE`。口径参考实现见 `campaign-progress-driver.md`。

种子数据：World Cup Qualifiers（public 入口 + special 入口 `WANG24`）、Starter Rewards（常驻，无 `ends_at`）、CPI Print Week（upcoming）。

---

## 4. 用户端流程

> 各小节只给结构与规则，视觉规格以 `/style-guide` 活体 demo 为准。

### 4.1 /rewards 页壳

下划线三 tab：`Campaigns` / `Vouchers` / `Referral`，`?tab=` 同步 URL（replace）。Points 退役公告条常驻至用户 dismiss（`localStorage: omenx_points_retired_notice_dismissed`），文案：`Points have retired. Rewards now come as Trial Position Vouchers.` + `Open vouchers →`。

每个出现 USDC 金额的页面挂**一条** fine print（`RewardsFinePrint`），逐字：`USDC amounts are estimates and not guaranteed. A Trial Position Voucher opens a trial position — the profit is yours, the voucher itself is not withdrawable.` 金额旁不得再出现 inline "not guaranteed"。

### 4.2 Campaigns tab

活动卡网格（`live` / `upcoming` / `always-on` / `ended` 四相位），已结束折进 archive 条。空态：`No campaigns running` / `New campaigns show up here as they go live.`

详情页 = hero（`entry.kind === "special"` 才出 KOL band 品牌带）+ 任务面板（GrantTaskRow 五态）+ Campaign rules 长文折叠（仅当 `entry.details` 存在，标题取 `heading`，缺省 `Campaign rules`）+ 奖励汇总栏（`Your rewards here`，底部归属 chip：special → `Joined via {kolName}`，public → `Official OmenX campaign — open to everyone`）+ fine print。奖励徽章文案：`$X Trial Position Voucher`（volt）与 `$X USDC`（蓝）。领取走 edge function `claim-campaign-grant`（`{entryId, taskKey}`），成功 toast `Voucher sent to Position Vouchers` / `Open vouchers to reveal it.`，失败回落 `Could not claim this reward`。活动不存在时正文为 `This campaign is no longer available.`

首次访问 public 活动详情且尚无 participation 时，自动 soft-bind（`source: "direct"`）。Starter Rewards 为常驻 campaign，承接原 onboarding 任务。

### 4.3 Vouchers tab

分区顺序：`Ready to claim`（granted，volt dot）→ `Active`（claimed / issued）→ earnings hero（pending / lifetime、tier 段条、`Claim $X to wallet` 或 `Redeem a voucher`）→ History 折叠档案条（settled / expired / revoked，档案行 payout caption：`Credited to wallet` / `Added to pending` / `Voucher lost · nothing owed`）。

空态：`No vouchers yet` / `Vouchers you earn from campaigns and referrals land here, ready to open a trial position.`；桌面 desk 未选券时：`Pick a voucher to redeem` / `Choose one on the left and the market picker opens here. Your own balance is never used — the voucher funds the trial position.`

Redeem 入口：券行右侧动作 → 桌面在 tab 内展开 redeem desk；移动端写 URL `?redeem=<voucherId>`。

### 4.4 移动全屏 redeem（六态，与 style-guide 帧一一对应）

进入条件：`isMobile && tab === "vouchers" && ?redeem=<id>`。此时页壳隐藏 tab、隐藏 BottomNav，只保留一个居中 `Redeem voucher` header，返回键回 `/rewards?tab=vouchers`。

| 帧 | 状态 |
|---|---|
| A | 默认（票根折叠、未选中、无 confirm bar） |
| B | 票根展开（Max profit / Hold window / Payout）+ 品类 pills（仅当 eligible > 8 才出 pills） |
| C | 互补两选项市场选中（方向对） |
| D | 多选市场选中（选中侧 label 变 `Picked`） |
| E | 事件锁卡 + 空态 |
| F | 桌面 desk（同一分支，inline summary 卡） |

市场卡数据规则（双端一致）：
- **互补两选项市场**折叠为方向对（如 Up / Down），不渲染 Buy 按钮，选中侧填色但保留原 label。
- **真多选市场（3+）**保留 per-option Yes/No 对并内置价格；默认只展示前 2 个选项，其余折进 `Show N more options` 行；若被折叠项已选中，则顶替进前 2 显示。
- 选中后 confirm bar 才从底部升起（fixed 坐底）；三行读出：`{eventName} · {label} at {price}¢` / `${face} voucher · closes automatically after {h}h · Max profit $X.XX` / `Reset` + `Confirm & open position`（进行中 `Redeeming…`）。移动端未选中时无任何底部 chrome。
- 无可用市场空态：`No eligible markets right now` / `This voucher opens a trial position on Boost and Standard markets priced between 20¢ and 80¢. None are open at the moment — the voucher stays valid until {expiresLabel}.` + `Browse all events`。搜索无结果：`No markets match "{query}"` / `Nothing here right now takes a voucher. Clear the filter to see everything eligible.`

确认后按产品线分流：`productLine === "spot"` → `/spot?event=<id>`，否则 `/trade?event=<id>`。

### 4.5 桌面 redeem desk

与移动同一套判定与数据规则，差异仅在容器：`VoucherDeskHeader` 完整头（`REDEEMING VOUCHER` + 面值 + 券码 + Max profit / Hold window / Payout 三格 + 收益模式说明句）+ picker 内嵌于卡片，summary 为 inline 卡而非坐底 bar。移动端同一头折叠为 56px 票根。

### 4.6 Referral tab

三面板（邀请码 / 进度 / 明细）不在本轮改动范围，行为不变。

### 4.7 其他挂载点（不展开）

- `/portfolio`：`VoucherBanner` — 券状态提示带。
- `/trade` `/spot`：`CloseVoucherContent`（Dialog / Drawer 双端）— trial position 平仓确认。

---

## 5. 已删除 / 已废弃

| 项 | 说明 |
|---|---|
| `/vouchers` 独立页 | 退役，`src/pages/Vouchers.tsx` 仅做 `Navigate → /rewards?tab=vouchers`，保留原 query 与 hash |
| Header 下拉 / 移动 Me drawer 的 "Position Vouchers" 入口 | 已删除 |
| `src/components/vouchers/VoucherCard.tsx`（v1） | 死代码，已删除 |
| style-guide Vouchers v1 留档块 | 整节删除；仍服役的 `VoucherBanner` / `CloseVoucherContent` demo 已并入 v2 节 |
| `voucher-position-chip` demo | v1 遗想，生产无对应件，注册键与 preview 同删 |
| Points 体系 | 退役，页面仅保留一条退役公告 |
| Trial bonus 作为奖励物 | 落日，奖励只发 voucher 与 USDC |
| 金额旁 inline "not guaranteed" | 全删，改为每页一条 fine print |

---

## 6. Style Guide

视觉唯一真相。全部 demo 为真组件 + mock props；移动端一律 375px 真 iframe（`DualDevicePreview`）。规范锚点为 `#lite-rewards` 与 `#lite-vouchers`，旧链接 `#rewards` / `#rewards-mobile` / `#vouchers` / `#vouchers2` 由 `SECTION_ALIASES` 自动重定向。

`#lite-rewards`：
`rewards-campaign-cards`（四相位 + fallback）、`rewards-grant-rows`（五态）、`rewards-kol-band`、`rewards-ended-archive`、`rewards-ended-detail`、`rewards-points-notice`、`rewards-signin-prompt`、`rewards-referral-panels`、`rewards-fine-print`、`rewards-campaign-rules`（collapsed / expanded）、`rewards-ineligible-redirect`；移动任务行另有 `rewards-taskrow-playground` 与 `rewards-taskrow-board`。

`#lite-vouchers`：
`vouchers2-rows`（ready · sold out · active tiered · active instant · selected）、`vouchers2-earnings`（claimable · locked at cap · pending $0）、`vouchers2-archive`、`vouchers2-picker`（7 卡态）、`vouchers2-desk`（tiered · instant · empty）、`vouchers2-mobile-flow`（六态 A–F PresetRail）、`voucher-banner`、`voucher-close`。

---

## 7. 涉及文件

**前端 — 页面/壳**
`src/pages/lite/LiteRewardsPage.tsx`、`src/pages/lite/LiteCampaignDetailPage.tsx`、`src/pages/Vouchers.tsx`（重定向）

**前端 — Campaigns**
`src/components/campaigns/CampaignAttribution.tsx`、`IneligibleEntryToast.tsx`（toast id `campaign-entry-ineligible`，top-center，4s）、`GrantTaskRow.tsx`、`TaskRowShell.tsx`、`CampaignCard.tsx`、`CampaignKeyVisual.tsx`、`CampaignRulesDisclosure.tsx`、`KolBand.tsx`、`PointsRetiredNotice.tsx`、`RewardsFinePrint.tsx`

**前端 — Vouchers**
`src/components/vouchers/VouchersBody.tsx`、`VoucherRow.tsx`、`VoucherEarningsCard.tsx`、`RedeemVoucherContent.tsx`、`VoucherDeskHeader.tsx`、`EventPickerList.tsx`、`EventPickerCard.tsx`、`RedeemSummaryBar.tsx`、`VoucherBanner.tsx`

**Hooks / lib**
`src/hooks/useCampaigns.ts`、`src/hooks/usePositionVouchers.ts`、`src/hooks/useVoucherEarnings.ts`、`src/lib/voucherTiers.ts`

**后端**
edge function `claim-voucher-earnings`；函数 `apply_campaign_progress` / `campaign_scope_matches` / `trades_campaign_progress` / `pay_instant_voucher_settlement`

**Style Guide**
`src/pages/StyleGuide/sections/RewardsSection.tsx`、`RewardsMobileSection.tsx`、`Vouchers2Section.tsx` 及 `preview/rewardsPreviews.tsx`、`preview/vouchers2Previews.tsx`

---

## 8. 未变更项

- Referral 三面板逻辑与版式。
- `/portfolio` VoucherBanner 与 `/trade` `/spot` CloseVoucher 的内部行为。
- 交易页开仓 / 平仓链路本身，voucher 只作为开仓来源标记。
- 账户命名沿用 **Boost / Standard**（用户可见文案不出现 Futures / Spot；`futures` / `spot` 仅作为代码字段名）。
- 方向色语义不变：交易绿/红只染方向词，动作动词（Buy / Confirm）永不染色；蓝 `#33D6FF` 专用于 USDC。
