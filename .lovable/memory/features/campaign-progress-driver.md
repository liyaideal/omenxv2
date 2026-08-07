---
name: Campaign progress driver
description: Server-side (Postgres trigger) reference implementation for campaign task progress and referral qualification — what counts, from when, and how scope matching works
type: feature
---

# Campaign progress driver (口径参考实现 · 2026-08-07)

**这是"口径参考实现"，不是最终管线。** 研发接入自有事件管线时可整体替换实现，但**口径以本文为准**。

## 红线
钱和进度**服务端权威**：客户端从不写 `campaign_grants` / `referrals` 状态。全部由 Postgres 触发器驱动。

## 组成
- `public.campaign_scope_matches(scope jsonb, event_name text)` — scope 命中判定
- `public.apply_campaign_progress(user_id, event_name, amount, at)` — 主逻辑（SECURITY DEFINER，已 REVOKE anon/authenticated EXECUTE）
- 触发器 `trg_trades_campaign_progress_ins` / `_upd`（`public.trades` AFTER INSERT / AFTER UPDATE OF status）

## 什么算数
- 只有 `trades.status = 'Filled'`（更新场景：从非 Filled 变成 Filled，只记一次）
- 成交额口径 = `trades.amount`（USD notional，不乘 boost）
- 起算时间 = 用户在该活动的 `campaign_participations.joined_at`；早于加入时间的成交不算
- 活动必须 `campaigns.status='live'` 且成交时间落在 `starts_at … ends_at` 之间

## scope 命中规则（`rules.tasks[].scope`）
- 缺省 / `{}` → 命中一切
- `{"any_market": true}` → 命中一切
- `{"categories":["sports"]}` → 按 `events.name = trades.event_name` 取最新事件的 `category`（小写比较）命中
- 找不到对应事件 → 不命中（不猜）

## 任务 metric
- `usd_volume` → `progress.value` 累加成交额，`>= target` 置 `claimable`
- `count` → 命中 scope 的首笔成交置 `value = 1` → `claimable`（无 scope 的 count 任务视为非交易类，不自动驱动）
- `manual` → **待研发事件源**，触发器不碰（见下）

## 状态只进不退
`claimed` / `not_eligible` 永不被覆盖；`claimable` 不会退回 `in_progress`；进度用 GREATEST 合并（回填同理，不覆盖更高的演示种子值）。

## Referral
同一触发器驱动：被邀用户 `Filled+Closed` 累计成交 `>= $100` → `referrals.status` `pending → qualified`（并写 `metadata.volume`）。写入通过 `set_config('app.progress_driver','on',true)` 绕过 `enforce_referral_user_update` 的用户写保护。

## 待研发事件源（不许伪造）
- `share`（分享已结算市场）— 需分享回调/归因事件
- `join_discord` — 需 Discord OAuth / bot 成员校验回调
- `connect_external` — 可接现有 `connected_accounts` 验证通道（尚未接线）

## 回填
一次性函数 `backfill_campaign_progress()` 已按同一口径跑完历史成交并**随即删除**。
