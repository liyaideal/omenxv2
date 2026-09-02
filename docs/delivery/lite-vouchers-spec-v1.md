# Vouchers（Position Vouchers）— 交付说明 v1

> 这是 `/rewards?tab=vouchers` 这一页（`/vouchers` 会跳到这里）。这页放用户手上的试玩券：领券、看券、把券换成一个真实仓位，以及券赚到的钱怎么提到钱包。
> 这一轮用户能看见的变化：券的每一种样子（还没领 / 可以用 / 用过 / 过期）现在都在 Style Guide 里有对应的图和判定条件；兑换台、市场选择器、底部确认条也都补齐了。产品页本身的版式没有改动。
> 没动的东西：券的发放规则、每日限量、收益提现的档位金额，一律照旧；移动端兑换全屏页的版式是 CPO 亲定的，不许自行调整。
> 怎么读：先看 §0 查什么去哪儿，再按 §1→§9 顺序读；每个数值都标了代码文件，状态编号（VC-x）在 §7 一张表里能查到对应模块和 Style Guide key。

## 0. 读者须知

查什么去哪儿：
- 长什么样 → 生产页 `/rewards?tab=vouchers`
- 什么时候变成什么样 → `/style-guide` → Lite → Vouchers 状态字典（每个 case 有「状态 / 触发条件 / 视觉 / 数据来源」表）
- 字段名、文案、公式、时间口径、术语 → `docs/copy-dictionary.md`（顶部有「Lite 术语对照表」）→ 本文档对应章节
- 设计法则（颜色轴、chip、overlay 对等）→ `DESIGN.md`

提问前先按上面顺序查一遍；查不到再提，提问时写明"我查了 X 没有"。

## 1. 功能目标

给用户一张有面值、有上限、有时限的「试玩仓位券」：用券开一个真实市场的仓位，亏损兜底为 $0（不扣钱包），盈利按券的上限封顶后进账。面向新用户与活动参与者，入口只有 `/rewards?tab=vouchers` 一处。关键约束：一张券只能用在一个 event 上（event 级一券锁），券的价格带、持有时长、收益上限都写在券本身的字段里，前端一律读券、不自行推导。

## 2. 状态机与收益模式

### 2.1 券状态（7 枚举 · 三桶）

| status | 含义 | 触发方 | UI 归桶 |
|---|---|---|---|
| `granted` | 已发放，等用户点一下认领 | 后端发放（活动 / 邀请 / 运营） | Ready to claim |
| `issued` | 已生成但尚未推送给用户（DB 现 0 行，预留） | 后端 | Ready to claim |
| `claimed` | 已认领，进入 7 天使用窗口 | 用户 `Claim voucher` | Active |
| `redeemed` | 已换成仓位，仓位存续中 | 用户在兑换台确认 | History |
| `settled` | 仓位已结算，收益已入账 | 结算触发器 | History |
| `expired` | 认领后 7 天未使用 | 定时任务 | History |
| `revoked` | 运营撤销（已退役，不再新增） | 运营 | History |

`lost` 不是 status 枚举，是 `VoucherHistoryArchive` 里结算亏损行的 caption（VC-7）。


### 2.2 双收益模式（三口径）

| 口径 | instant | tiered |
|---|---|---|
| 收益去向 | 结算时自动进 Standard 钱包 | 进共享 pending 池，按成交量档位解锁 |
| 落点文案 | `Credited to wallet` | `Added to pending` |
| 实现方 | 结算触发器（幂等，重复触发不重复入账） | `voucher_earnings` + ledger |

模式由 campaign entry 配置决定；referral 发放的券默认 `tiered`。标注例外、不标注默认 —— 券行只在 `payout_mode === 'instant'` 时多渲染一行 `INSTANT` 说明，tiered 不加任何标注。

### 2.3 其他判定

| 规则 | 口径 |
|---|---|
| 每日限量池 | 三档配置，按 UTC 日重置；耗尽显示 `Sold out today — resets in {Xh Ym}` |
| event 级一券锁 | 同一 event 已用过券 → 该卡 `opacity .5` + Lock +「Voucher already used」 |
| 收益上限 | `Max profit = faceValue × redeemable_cap_pct`（现值 0.5），恒显券固定上限，不随所选选项实算 |
| 入场价格带 | 仅 20¢–80¢ 之间的选项可选；无合格选项 = 等待态，不是失败态 |

## 3. 数据库

| 表 | 要点 |
|---|---|
| `position_vouchers` | 券本体：`face_value` / `redeemable_cap_pct`（现值 0.5）/ `max_holding_hours` / `entry_price_min`·`max` / `min_hours_to_settlement` / `status` / `payout_mode` / `claimed_at` / `expires_at` / `event_id` |
| `voucher_daily_pools` | 每日限量：按 UTC 日计数，读取走 `get_voucher_pool_today()` |
| `voucher_earnings` (+ ledger) | 共享 pending 池：`pending` / `lifetime_credited`；claim 走 `min(pending, tier.cap − lifetime_credited)` |
| `airdrop_positions` | 券兑换出的仓位实体，持有到 `max_holding_hours` 自动平仓 |

RLS：三张用户表均按 `auth.uid()` 限定行；池表对 `authenticated` 只读。触发器：结算时按 `payout_mode` 分流入账，instant 分支幂等。

## 4. 用户端流程

### 4.1 Vouchers tab 内体

模块顺序：`VoucherEarningsCard`（收益 + 档位轨）→ `Ready to claim` 分组 → `Active` 分组 → `VoucherHistoryArchive`。零券时整段替换为空态。异步三态：skeleton / 错误卡 + Retry / 内容。

### 4.2 认领

granted 券行显示 `Claim voucher`；点击后 `status → claimed`，进入 7 天窗口，行移入 `Active` 分组。

### 4.3 兑换

- 桌面：页内兑换台 = `VoucherDeskHeader`（全幅票面）+ 市场选择器 + `RedeemSummaryBar` inline 卡。
- 移动：`?redeem={id}` 进入全屏页，单头部、无 BottomNav、返回由头部 `‹` 负责；选中结果后底部升起 fixed 摘要条（未选中不渲染）。
- 选择器：卡片按 event 聚合，多选项 3 条以上折叠成 `Show N more options`；方向控件双色轴 long `#33D6FF` / short `#CFFF4A`；No 价 = 1 − price；`eligibleCount > 8` 时才渲染分类 pills。

### 4.4 确认与跳转

确认后开仓，按产品线分流到对应交易页。平仓走 `CloseVoucherContent`：`credit = clamp(rawPnl, 0, cap)`，落点文案按 `payout_mode` 二选一。

## 5. Admin 端

无独立后台，运营直接维护数据库（发券、配置每日池、调整 campaign entry 的 payout mode）。

## 6. 已删除 / 已废弃

| 项 | 说明 |
|---|---|
| `RedeemVoucherSheet` | 全库无引用，已删除；兑换统一走桌面 desk / 移动全屏页 |
| demo 假券 | 仅对 `alex_carter` 演示账号注入 `demoExpired`，其余账号一律不注入 |
| `revoked` 状态 | 判定退役，不再新增；历史行仍可渲染 |
| `Vouchers2Section`（Style Guide 旧节） | 页内退场，规范文字逐条并入 VC-1…17；文件保留仓库，preview key 保留以维持深链 |
| preview key `vouchers2-mobile-flow` | 六态 playground 退场，拆进 VC-8 / 9 / 10 / 13 / 15 / 16 |

## 7. 状态索引

| 模块 | VC | preview key |
|---|---|---|
| VouchersBody 组合层 | VC-1 | `vouchers-body-layout` / `-mobile` |
| VoucherEarningsCard 五态 | VC-2 | `vouchers2-earnings` |
| 空态 | VC-3a | `vouchers-empty` |
| 异步三态 | VC-3b | `vouchers-async` |
| 每日池行 | VC-4 | spec only |
| VoucherRow 全态 | VC-5 | `vouchers2-rows` |
| 状态机分桶 | VC-6 | spec only |
| 历史档案 | VC-7 | `vouchers2-archive` |
| EventPickerCard 态 | VC-8 | `vouchers2-picker` |
| 方向控件 | VC-9 | `vouchers-picker-direction` |
| 多选折叠 | VC-10 | `vouchers-picker-fold` |
| picker 周边态 | VC-11 | `vouchers-picker-states` |
| CAPTION 行 + 分类 pills | VC-12 | `vouchers-picker-chrome` |
| VoucherDeskHeader / 票根 | VC-13 | `vouchers2-desk` / `vouchers-desk-header` |
| metaCells | VC-14 | `vouchers-meta-cells` |
| RedeemSummaryBar | VC-15 | `vouchers-summary-bar` / `-mobile` |
| desk 空态 + 桌面组合 | VC-16 | `vouchers-desk-empty` |
| VoucherBanner + CloseVoucherContent | VC-17 | `voucher-banner` / `voucher-close` |

## 8. 涉及文件

前端：
- `src/components/vouchers/`：`VouchersBody.tsx` / `VoucherRow.tsx` / `VoucherEarningsCard.tsx` / `VoucherHistoryArchive.tsx` / `VoucherDeskHeader.tsx` / `RedeemVoucherContent.tsx` / `RedeemSummaryBar.tsx` / `EventPickerCard.tsx` / `EventPickerList.tsx` / `VoucherBanner.tsx`
- `src/components/positions/CloseVoucherContent.tsx`
- `src/lib/voucherTiers.ts`
- Style Guide：`src/pages/StyleGuide/sections/VouchersStatesSection.tsx`、`src/pages/StyleGuide/preview/vouchersDictPreviews.tsx`、`vouchers2Previews.tsx`、`preview/registry.tsx`、`sections/pages/LiteVouchersPage.tsx`

后端：`supabase/functions/close-trial-position`、结算触发器、`get_voucher_pool_today()`

数据库：`position_vouchers` / `voucher_daily_pools` / `voucher_earnings`(+ledger) / `airdrop_positions`

## 9. 未变更项

- 券发放规则、每日限量额度、档位金额（T0 $2 / T1 $5 / T2 $10 / T3 $20 / T4 $50；解锁条件 No req. / $10 deposit / $1K vol / $10K vol / $50K vol，与 `src/lib/voucherTiers.ts` 一致）全部照旧。
- `/rewards` 三个 tab 的顺序与 Campaigns / Referral 两个 tab 的内容未动。
- 生产页版式零改动：本轮生产文件的改动只有可选 prop（`defaultExpanded` / `stubDefaultOpen` / `fixture`）与一处落点文案对齐词典。移动版式为 CPO 亲定，实现以生产代码为唯一事实。
