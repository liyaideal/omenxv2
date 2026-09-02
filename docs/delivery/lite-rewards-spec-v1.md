# Rewards（Lite）— 交付说明 v1

> 这份文档说的是 `/rewards` 这一页和它的活动详情页 `/rewards/campaign/:id`：用户在这里看活动、做任务、领奖励券、发邀请链接。这一轮把这两页的所有可见状态整理成了一份可照抄的状态字典（`/style-guide` → Lite → Rewards，编号 RW-1…RW-18），页面本身的版式与文案没有改动。移动端版式是 CPO 亲定的，实现以生产代码为唯一事实。先读 §0，再按导航去查。

## 0. 读者须知

查什么去哪儿：
- 长什么样 → 生产页 `/rewards`、`/rewards/campaign/:id`
- 什么时候变成什么样 → `/style-guide` → Lite → Rewards 状态字典（每个 case 有「状态 / 触发条件 / 视觉 / 数据来源」表）
- 字段名、文案、公式、时间口径、术语 → `docs/copy-dictionary.md`（顶部有「Lite 术语对照表」）→ 本文档对应章节
- 设计法则（颜色轴、chip、overlay 对等）→ `DESIGN.md`

提问前先按上面顺序查一遍；查不到再提，提问时写明"我查了 X 没有"。

## 1. 功能目标

给 Lite 用户一个统一的奖励入口：活动（Campaigns）、券（Vouchers）、邀请（Referral）三个分页。活动由运营在后台配置，用户完成活动内的任务后领取 Trial Position Voucher 或 USDC。关键约束三条：奖励币种双色（券 `#CFFF4A` / USDC `#33D6FF`）；每个出现 USDC 金额的页面有且只有一条完整 fine print，金额旁禁止行内声明；积分体系已退役，奖励一律以券或 USDC 形式发放。

## 2. 状态机

### 2.1 CampaignPhase（活动相位，`useCampaigns`）

| phase | 判定 | 卡上徽标 | 备注 |
|---|---|---|---|
| `upcoming` | `now < startsAt` | `Starts {MMM d}` | 整卡 opacity 0.65 |
| `live` | `startsAt ≤ now < endsAt` | `Live`（volt） | 常规态 |
| `always-on` | `endsAt === null` | `Always on` | 日期行显示 `Always valid` |
| `ended` | `now ≥ endsAt` | `Ended` | 详情页 frozen：按钮全冻结 |

### 2.2 GrantStatus（任务状态，`campaign_grants.status`）

| status | 判定 | 行右侧 |
|---|---|---|
| `not_started` | 无 grant 行或进度为 0 | CTA 按钮（Join / Connect / Share / Trade） |
| `in_progress` | 有进度未达 target | CTA 按钮 + 进度条 |
| `claimable` | 进度达标未领 | 券任务 → 白底 `Claim voucher`；USDC 任务 → 文字 `Credited to Standard after review` |
| `claimed` | 已领 | 灰字 `Claimed` |
| `not_eligible` | 该奖励归属他人（如朋友的邀请覆盖） | 虚线灰行 + `Not eligible` |

未登录时所有行的动作位统一渲染 `Sign in to start`；`frozen`（活动已结束）时所有按钮不渲染，只留状态词。

### 2.3 Referral 状态（`referrals.status`）

| status | 判定 | 行表现 |
|---|---|---|
| `pending` | 好友已注册，交易额 < $100 | `In progress`，无奖励数字 |
| `qualified` | 交易额 ≥ $100，未领 | `$5 voucher` + `Claim voucher` |
| `rewarded` | 已领 | 整行 faded + `Claimed` |

## 3. 数据库

| 表 | 要点 |
|---|---|
| `campaigns` | 活动本体：`name` / `starts_at` / `ends_at`（null = always-on）/ `status` / `budget_total` |
| `campaign_entries` | 一个活动可有多个入口：`kind`（`public` / `special`）、`link_code`（KOL 专属链接码）、`rules`（JSON，含 `tasks` 与 `details`）、`reward`、`branding`（`key_visual_url` / `display_name` / `avatar_url` / `accent`）、`seed_base`（joined 计数基数）、`cap` |
| `campaign_grants` | 用户 × 任务的领取状态：`task_key` / `progress`（JSON）/ `status` |
| `campaign_participations` | 用户 × 活动 × entry 的绑定关系，`locked_at` 后不可改绑 |
| `referrals` | 邀请关系：`referrer_id` / `referee_id` / `status` / `qualified_at` / `rewarded_at` / `metadata`（`masked_email`、`volume`） |

**`tasks` / `user_tasks` 两张表已退役**：Rewards 的任务定义活在 `campaign_entries.rules.tasks` 这段 JSON 里，不再读旧任务表。

## 4. 用户端流程

### 4.1 `/rewards` 三分页

入口：底栏 Rewards、头像菜单、活动卡跳转。分页由 `?tab=` 同步（`campaigns` / `vouchers` / `referral`，`replace: true` 不产生历史栈）。

- **Campaigns**：网格首位恒为 H2E 卡，其后按 `useCampaignViews()` 渲染未结束活动，网格下方是已结束活动归档条，再下面是 fine print。桌面把积分退役提示放在网格上方，移动放在卡片下方。
- **Vouchers**：游客换 `SignInPromptCard`（cap `VOUCHERS`）。移动端带 `?redeem=` 时进入全屏载壳：去 tabs、去 BottomNav，`MobileHeader ‹` 是唯一出口。
- **Referral**：游客同样换登录门（cap `REFERRAL`）。

### 4.2 活动详情 `/rewards/campaign/:id`

`campaignId === "h2e"` 直接交给 H2E 页面。其余：加载中出骨架，`view` 取不到出 `This campaign is no longer available.`。正常渲染顺序 —— 移动：hero → 任务面板 → 规则 → 奖励卡 → fine print；桌面：hero → 左栏（任务面板 → 规则 → fine print）+ 右栏 320px 奖励卡。

### 4.3 entry 绑定两条路径

1. **专属链接**：带 `?entry=CODE` 首访，能绑就静默写入 `campaign_participations`，奖励卡的 Entry 条改显 `Joined via {KOL}`；绑不了（名额满 / 已锁定别的 entry / 账户不合格 / 链接过期）就弹一条通用 sonner toast 并跳回 `/`，详情页不渲染。
2. **public 软绑**：登录用户进入 public 活动详情页即软绑，无任何界面反馈，成功后刷新使 joined 与 Host 条生效。

### 4.4 claim 流

活动任务 claim 走 `claim-campaign-grant`，邀请 claim 走 `claim-referral-voucher`。成功后两处共用同一条成功提示：标题 `Voucher sent to Position Vouchers`，描述 `Open vouchers to reveal it.`，动作 `Open` → `/vouchers`。失败走 `toast.error`，文案取服务端 `error`，缺省 `Could not claim this reward`。

## 6. 已废弃

| 项 | 说明 |
|---|---|
| 积分（Points）体系 | 已退役，`/rewards` 只保留一条可一次性关闭的退役提示卡 |
| `tasks` / `user_tasks` 表 | 不再用于 Rewards，任务定义活在 `campaign_entries.rules.tasks` |
| `rewards-taskrow-playground` | 字典页内退场（RW-8 全量板已穷尽同样状态），key 保留 registry |
| `rewards-ended-detail` | 字典页内退场（走运行时 fetch，违 fixture 确定性），key 保留 registry；frozen 覆盖由 RW-7 / RW-8 / RW-10 承接 |
| 旧 `RewardsSection` / `RewardsMobileSection` 两节 | 已从字典页撤下，规范文字逐条并入 RW 编号（并账表渲染在字典节末尾） |

## 7. 状态索引

| 区 | 模块 | RW 编号 | style-guide key |
|---|---|---|---|
| Ⓐ | Tabs 三分页 | RW-1 | `rewards-lite-tabs` |
| Ⓐ | 移动 redeem 全屏壳 | RW-2 | `rewards-lite-redeem-shell`（仅移动） |
| Ⓐ | 积分退役提示 | RW-3 | `rewards-points-notice` |
| Ⓑ | CampaignCard 全相 | RW-4 | `rewards-campaign-cards` |
| Ⓑ | 网格 loading 骨架 | RW-5 | `rewards-grid-loading` |
| Ⓑ | 已结束活动归档 | RW-6 | `rewards-ended-archive` |
| Ⓒ | 详情 Hero | RW-7 | `rewards-campaign-hero` / `rewards-campaign-hero-mobile` |
| Ⓒ | KolBand 双端本体 | RW-7b | `rewards-kol-band` |
| Ⓒ | GrantTaskRow 九分支 | RW-8 | `rewards-grant-rows` |
| Ⓒ | 活动规则折叠 | RW-9 | `rewards-campaign-rules` |
| Ⓒ | Your rewards here | RW-10 | `rewards-rewards-card` / `rewards-rewards-card-mobile` |
| Ⓒ | 详情 loading | RW-11a | `rewards-detail-loading` |
| Ⓒ | 详情空态 | RW-11b | `rewards-detail-unavailable` |
| Ⓒ | claim 成功反馈 | RW-12 | `rewards-claim-toast` |
| Ⓒ | entry 绑定两路径 | RW-13 | `rewards-ineligible-redirect` |
| Ⓓ | Invite a friend 卡 | RW-14 | `rewards-referral-invite` |
| Ⓓ | Your invites 行 | RW-15 | `rewards-referral-rows` |
| Ⓓ | overview 双版式 | RW-16 | `rewards-referral-panels` |
| Ⓓ | 游客门 | RW-17 | `rewards-signin-prompt` |
| Ⓔ | 合规 fine print | RW-18 | `rewards-fine-print` |

## 8. 涉及文件

**页面**：`src/pages/lite/LiteRewardsPage.tsx`、`src/pages/lite/LiteCampaignDetailPage.tsx`、`src/pages/lite/H2eCampaignDetailPage.tsx`

**组件**（`src/components/campaigns/`）：`CampaignCard` · `CampaignKeyVisual` · `CampaignGridSkeleton` · `CampaignDetailSkeleton` · `CampaignUnavailable` · `CampaignRewardsCard` · `CampaignRulesDisclosure` · `CampaignAttribution` · `ClaimSuccessToastBody` · `EndedCampaignsArchive` · `GrantTaskRow` · `TaskRowShell` · `IneligibleEntryToast` · `KolBand` · `PointsRetiredNotice` · `ReferralPanel` · `RewardsFinePrint` · `SignInPromptCard`

**Hook**：`src/hooks/useCampaigns.ts`、`src/hooks/useReferral.ts`

**后端**：edge function `claim-campaign-grant`、`claim-referral-voucher`

**数据库**：`campaigns` / `campaign_entries` / `campaign_grants` / `campaign_participations` / `referrals`

**字典**：`src/pages/StyleGuide/sections/RewardsStatesSection.tsx`、`src/pages/StyleGuide/preview/rewardsPreviews.tsx`

## 9. 未变更项

- `/rewards` 与 `/rewards/campaign/:id` 的版式、文案、交互本轮零改动；本轮只新增状态字典与文档。
- `BottomNav`、底栏合规 footer 未触碰。
- Vouchers 分页内体与兑换流程不在本文档范围（见 `docs/delivery/rewards-vouchers-spec.md`）。
- H2E 卡与 H2E 详情页不在本文档范围（见 H2E 交付文档）。
- 移动版式为 CPO 亲定，实现以生产代码为唯一事实。
