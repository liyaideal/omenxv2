# Vouchers · Payout tier 近 30 天滚动 — 交付说明 v1

日期：2026-10-08 · 范围：`/rewards` → Vouchers tab 右上角 Payout tier（`VoucherEarningsCard`）+ `claim-voucher-earnings` 边缘函数 · 决策：Liya（CPO）批规则 1–8 + desktop / mobile mock · Lovable commit 见 changelog

## 通俗导读

Payout tier 是 Vouchers 页右上角那个 T0–T4 的阶梯：档位越高，券收益（tiered voucher 的利润）能领出来的总额越高（T0 $2 → T4 $50）。以前档位看的是**终身累计成交量**——交易量永远不清零，一个月交易 $500 的人两年后也能磨到 T4。

这轮改成**近 30 天滚动**：T2 / T3 / T4 只看最近 30 天的成交量，老成交量每天自然滚出，量跌破门槛就即时掉档、没有保护期。磨量的人到不了高档；想保住 T3 就得持续交易。

没变的两件事：

- **cap 还是终身累计**。T3 一共最多领 $20，领过的部分不退、换档不重置。从 T3 掉到 T2，已经领过 $20 的人在 T2（cap $10）什么也领不到，想再领只能冲到 T4（再多 $30）。
- **T1 的 $10 入金门槛是终身的**，存过一次永久 T1，不参与滚动。

### 易混点辨析

1. **"30 天"是滚动窗口，不是固定周期**：每次打开页面按 `now − 30d` 实时算，没有"起算日"、没有"清零日"、没有定时任务。
2. **Closed 的单也算成交量**。以前只算 `Filled`，仓位一结算 trade 变 `Closed` 就从成交量里消失——这是本轮顺手修掉的既有 bug。Cancelled / Pending 不算。
3. **掉档不影响 pending**：收益池里的钱留着，等重新达档再领。已领的不追回。
4. **"reach T4 to unlock $30 more"里的 T4 可以跳档**：它指的是"第一个 cap 比你已领总额高的更高档"，不一定是相邻档。T2 已领 $20 的人直接指向 T4。
5. **"per claim"是旧文案 bug**：原来写 "T3 releases up to $20 per claim"，代码一直是终身累计。本轮文案改成 "up to $20 in total"。

### 用户视角

看到：右栏 label 变 `Traded volume (30d)`；档位说明句改为 "T3 unlocks up to $20 in total — keep trading to hold your tier."；领满本档后说明句变 "T3 cap fully claimed — reach T4 to unlock $30 more." + 置灰按钮 "Tier cap claimed — reach T4"。
看不到：任何版式、字号、配色变化；轨道、标签、进度句格式不变。

## 0. 读者须知

- 长什么样 → 生产：`/rewards` → Vouchers tab，登录 `alex_carter`（常驻 T3，30d 量由演示补量 cron 维持）。
- 什么时候变成什么样 → `/style-guide` → **Lite** 组 **Vouchers** 节点 **Ⓐ 组合层 → VC-2 收益 hero 七态**（preset rail：Claimable / Locked / **T3 · cap fully claimed** / **Dropped to T2 (30d)** / Pending $0 / Loading / Claiming）。
- 字段名、文案、公式 → `docs/copy-dictionary.md`「Voucher earnings tiers」节（本轮重写 + Concepts 表）。Lite 术语对照表见该文档顶部。
- 设计法则 → 无新增视觉规则（零版式改动）。
- Lovable / 正式版边界 → 本文 §5。

### 0.1 字典怎么看

- 网址：https://omenxv2.lovable.app/style-guide
- 本次节点：左栏 **Lite** 组 → `Vouchers ✅`；页内目录到 **Ⓐ 组合层 → VC-2**。
- 定位行：样张上方一行「编号 · 名称 · 平台」，下方 Desktop / Mobile · 375 两个 iframe 各挂一份生产组件（`fixture` prop，零 supabase 查询）。
- 一张样张怎么读：VC-2 顶部 preset rail 切态——`T3 · cap fully claimed` 看到顶态（说明句 + 置灰按钮）；`Dropped to T2 (30d)` 看降档后轨道 / 标签 / 说明句如何指向 T4；`Claimable (T3)` 看正常态的新说明句与 `(30d)` label。样张下方 spec 表每行 = 状态 / 触发 / 视觉 / 来源。
- 搜索：页顶搜索框敲 `VC-2` 直达。单张预览：`/style-guide/preview?c=vouchers2-earnings`。
- 编号前缀：`VC-` = Vouchers 节。
- 只在字典可见的态：`Dropped to T2 (30d)` 在生产上要等 alex 的 30d 量真跌破 $10k 才会出现，演示 cron 刻意不让它出现，所以只在字典看。

## 1. 规则（Liya 2026-10-08 批）

| # | 规则 | 实现 |
|---|---|---|
| 1 | T2 / T3 / T4 的 volume = 用户近 30 天（滚动，按 `created_at`）`trades.amount` 之和，`status IN ('Filled','Closed')`；实时算，不另存字段 | `useVoucherEarnings` 查询 + `claim-voucher-earnings` 同条件 |
| 2 | T1 入金门槛终身累计（`transactions.type='deposit' AND status='completed'` 总和 ≥ $10） | 不变 |
| 3 | cap 终身累计：`claimable = min(pending, tier.maxClaim − lifetime_credited)`，`lifetime_credited` 永不重置 | 不变（`deriveVoucherTierState`） |
| 4 | 量滚出即时降档，无保护期；已领不追回；pending 不清零 | 由 1 + 3 自然得出，无额外代码 |
| 5 | 文案：label `Traded volume (30d)`；进度句不变；档位说明句修正（见 §2） | `VoucherEarningsCard` |
| 6 | 到顶态：说明句 "Tn cap fully claimed — reach Tm to unlock $X more." + 置灰按钮 "Tier cap claimed — reach Tm"；Tm = next unlock tier | `VoucherEarningsCard` + `nextUnlockTier` |
| 7 | alex_carter 常驻 T3：演示补量 cron | `top_up_demo_voucher_volume()`（§4） |
| 8 | 落档：spec §10、copy-dictionary、字典 VC-2 两个新 preset | 本文 + 同轮 commit |

## 2. 文案矩阵（`capLine` / 按钮）

| 条件 | 说明句 | 按钮 |
|---|---|---|
| `claimable > 0` | 成交量档：`T3 unlocks up to $20 in total — keep trading to hold your tier.`；T0/T1：`T0 unlocks up to $2 in total — trade more to raise the cap.` | 白底 `Claim $4.20 to wallet` |
| `claimable = 0`，未到顶（pending = 0） | 同上 | 描边 `Redeem a voucher` |
| `lifetime_credited ≥ cap`，有 next unlock tier | `T3 cap fully claimed — reach T4 to unlock $30 more.`（`$30` = T4.cap − lifetime_credited，整数不带小数） | 置灰 `Tier cap claimed — reach T4` |
| `lifetime_credited ≥ cap`，无更高档（T4 领满 $50，或从 T4 掉档且已领 $50） | `T4 cap fully claimed — $50 is the lifetime maximum.` | 置灰 `All tier caps claimed` |
| T4 进度句 | `Top tier reached — $30 left under the T4 cap.`（`$30` = $50 − lifetime_credited）；领满后 `Top tier reached.` | — |

**"$50 到顶在哪看"（Liya 2026-10-08 问）**：就在这张卡——左栏 `Lifetime claimed $50.00`、右栏进度句 `Top tier reached.` + 说明句 `T4 cap fully claimed — $50 is the lifetime maximum.` + 置灰按钮 `All tier caps claimed`。字典 VC-2 preset `T4 · $50 lifetime max claimed`。

`next unlock tier` = `VOUCHER_TIERS.find(t => t.maxClaim > lifetime_credited && t.id > current.id)`。

## 3. 恒等式

- `volume30d = Σ amount (status ∈ {Filled, Closed}, created_at ≥ now − 30 × 86400s)`
- `current = max tier t s.t. unlock(t) met by (depositTotal, volume30d)`；T0 恒满足
- `headroom = max(0, current.maxClaim − lifetime_credited)`；`claimable = max(0, min(pending, headroom))`
- `lifetimeAtCap = lifetime_credited ≥ current.maxClaim`
- 进度句 `remaining = next.unlock.amount − volume30d`（或 deposit）
- 前端 hook 与边缘函数各自独立算同一公式，领取以边缘函数为准（服务端权威）。

## 4. 演示数据

- alex_carter（`968a2b3a-…`）改前近 30 天量 $7.3k → 会掉到 T2。演示引擎 `roll_demo_positions` 每天只开 ~$75 小单，补一次一周内腐烂。
- 新增 `top_up_demo_voucher_volume()` + pg_cron `top-up-demo-voucher-volume`（每日 05:25 UTC）：30d 量 < $12k 时补一笔已结算合约单（trade `Closed` + position `Closed`/settlement + `trade_profit` 流水，≤ $4k / 次，目标 $15k），选最近 7 天内已结算且有赢方的合约事件。连跑两次第二次 `skipped`（已实测）。2026-10-08 首跑后 alex 30d = $15,000.00。
- migration：`supabase/migrations/20261008120000_demo_voucher_volume_topup.sql`。

## 5. Lovable / 正式版边界

| 项 | Lovable | 正式版 |
|---|---|---|
| 30d 成交量 | 前端 / 边缘函数各查一次 `trades` 表求和 | 建议服务端维护用户 30d 成交量（或 trade 表索引 `(user_id, created_at)`），接口直接给 `volume_30d` |
| 档位 / cap 配置 | `src/lib/voucherTiers.ts` + 边缘函数内硬拷贝 | 一份配置、后台可改；门槛 / cap 数值照旧 |
| 领取 | `claim-voucher-earnings` 边缘函数（**需单独部署**，push 不部署） | 同公式，服务端权威 |
| 演示补量 cron | 演示专用 | 不存在 |

## 6. 未了账 / 待拍板

- ~~T4 进度句~~ 2026-10-08 Liya 批改：`Top tier reached — $30 left under the T4 cap.` / 领满 `Top tier reached.`（已落）。
- i18n：`en.json` 里 `tier_claim_cap` / `tier_cap_claimed` 等 key 文案与本轮定稿不同且组件未接线（卡片其余句子本就硬编码英文）；多语言二期接线时按本文 §2 更新 7 语。

## 7. 验收剧本

| 步骤 | 打开 | 应该看到 | 看什么 |
|---|---|---|---|
| 1 | `localhost:5173/rewards` → Vouchers，登录 alex | 右栏 `T3`，`Traded volume (30d)` `$15,000.00 / $50k`，`$35,000.00 more volume to T4`，说明句 `T3 unlocks up to $20 in total — keep trading to hold your tier.` | label 带 (30d)；数值 = §4 补量后 |
| 2 | 同页 | Lifetime claimed `$6.58`，按钮按 pending 决定（pending 0 → `Redeem a voucher`） | 按钮逻辑未变 |
| 3 | `/style-guide` → Vouchers → VC-2 → `T3 · cap fully claimed` | 说明句 `T3 cap fully claimed — reach T4 to unlock $30 more.`，置灰 `Tier cap claimed — reach T4` | desktop + mobile 单行不折 |
| 4 | VC-2 → `Dropped to T2 (30d)` | 轨 2 段实心、T2 描边，`$2,480.00 / $50k`，`$7,520.00 more volume to T3`，说明句 `T2 cap fully claimed — reach T4 to unlock $30 more.` | 跳档指向 T4 |
| 5 | VC-2 → `Locked (T0 · cap reached)` | `T0 cap fully claimed — reach T1 to unlock $3 more.` | 非成交量档也走到顶句 |
| 5b | VC-2 → `T4 · $30 left` / `T4 · $50 lifetime max claimed` | 进度句 `Top tier reached — $30 left under the T4 cap.` / `Top tier reached.` + `T4 cap fully claimed — $50 is the lifetime maximum.` + 置灰 `All tier caps claimed`，Lifetime claimed `$50.00` | 终身上限态 |
| 6 | 字典页滚到底 → `sg-overflow-scan.js` | 0 命中 | — |

## 8. 文件

- `src/lib/voucherTiers.ts`（窗口常量 / 状态集 / `nextUnlockTier` / `formatCapDelta`）
- `src/hooks/useVoucherEarnings.ts`
- `src/components/vouchers/VoucherEarningsCard.tsx`
- `supabase/functions/claim-voucher-earnings/index.ts`（待部署）
- `supabase/migrations/20261008120000_demo_voucher_volume_topup.sql`
- `src/pages/StyleGuide/preview/vouchers2Previews.tsx`、`sections/VouchersStatesSection.tsx`
- `docs/copy-dictionary.md`、`docs/backend-boundary.md`、`docs/delivery/lite-vouchers-spec-v1.md` §10
