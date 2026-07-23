# OmenX Sports 接入演示引擎 — 交付说明

> OmenX Sports 子站（`omenx-sports.lovable.app`，独立 Lovable 项目）今天已接入本仓库 Supabase 演示引擎：共享 auth（demo 账号 matched / welcome，经 `ensure-demo-user`）、读 profiles 双余额、读 events / event_options 行情（Realtime + 60s 轮询）、下单直插 trades + positions（市价、leverage=1、fee=0、`side='long'`、Trial Bonus 优先扣）。为此在 `events` 表种入两场 WC26 半决赛。这是 `docs/backend-boundary.md` 治理规则 "单一演示引擎" 的首个跨项目落地。

## 1. Sports 接入范围

| 能力 | 走本仓库的哪部分 | 说明 |
|---|---|---|
| Auth | 与主站共享，走 `ensure-demo-user` | 支持 demo 账号 matched / welcome，session 由 Sports 端自己持有 |
| 余额 | 读 `profiles.balance` + `profiles.trial_balance` | 双余额只读，扣款走下单流程 |
| 行情 | 读 `events` + `event_options` | Realtime 订阅 `event_options` + 60s 轮询兜底 |
| 下单 | 直插 `trades` + `positions` | 市价单，`leverage=1`、`fee=0`、`side='long'`；Trial Bonus 先扣 |
| 持仓 | 读 `positions`（Sports 端自渲染） | 与主站 `/portfolio` 同表 |

Sports 端未新增任何表 / 函数 / RLS；只调用现成接口。

## 2. 新种事件数据

两条 `events` 记录 + 各自 2 条 `event_options`：

| event id | 名称 | 收盘时间 (UTC) | side_labels |
|---|---|---|---|
| `wc26-semi-fra-esp` | France vs Spain | 2026-07-14 | `{ yes: "France", no: "Spain" }` |
| `wc26-semi-arg-eng` | Argentina vs England | 2026-07-15 | `{ yes: "Argentina", no: "England" }` |

Option 结构：

| option_id | 归属 event | 初始价格 |
|---|---|---|
| `wc26-semi-fra-esp-yes` | France vs Spain | 0.52 |
| `wc26-semi-fra-esp-no`  | France vs Spain | 0.48 |
| `wc26-semi-arg-eng-yes` | Argentina vs England | 0.57 |
| `wc26-semi-arg-eng-no`  | Argentina vs England | 0.43 |

价格由 `update-prices` 演示模拟器接管，无需人工维护。

## 3. 对主站的影响

- Sports 端使用 demo 账号（matched / welcome）下单产生的 `trades` / `positions` **会出现在主站 `/portfolio` 与余额中**——这是**预期行为**，因为两站共用同一 profile
- 主站 `/events` 会看到这两条 WC26 半决赛（single-market binary，`sideLabels` 走 France/Spain、Argentina/England 别名）
- 主站与 Sports 端 PnL、余额一致，无需额外同步逻辑

## 4. 对研发的提示

- 正式架构中这对应 "**同一引擎，多前端 surface**" 模式：本仓库是唯一 backend，Sports 是首个外部 surface
- Sports 端**仅调用现成接口**、未做任何 schema 变更；后续 Pro / Lite 分面遵循同一原则
- 未来若需要区分 surface（如 Sports-only 事件、Pro-only 杠杆参数），在 `events` / `positions` 加 `surface` / `product_line` 维度，schema 变更仍**只在本仓库**发生
- 参考：`docs/backend-boundary.md` §未来扩张预告

## 5. 未变更项

- 主站 UI 未动，本轮不含任何产品代码修改
- 本仓库 RLS / Edge Function / 表结构未新增或修改
- 主站 demo 账号、余额、下单流程未变
