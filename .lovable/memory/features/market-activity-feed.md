---
name: Market activity 匿名全站成交流
description: Lite 交易页的 Market activity 读 market_activity 表（无用户字段、public SELECT），不是用户自己的 trades
type: feature
---
`trades` 的 RLS 是 owner-scoped，客户端永远读不到别人的成交，所以社交证明**不能**用 `trades` 聚合。

- 表 `market_activity`：`event_name / option_label / amount / boost / created_at`，**没有任何用户身份列**；public SELECT，客户端无写权限。
- `trades` 上的 AFTER INSERT 触发器（side='buy' AND status='Filled'）由 SECURITY DEFINER 函数写入匿名行。
- DEMO-STATE：`sim_market_activity_tick()` 由 pg_cron 每 5 分钟生成 0–3 行/未结算事件，并删除 48h 以上旧行。上线时只保留触发器。
- UI：`LiteMarketActivity`，**统一 ledger 行格式（2026-07-31 LOCKED，binary/spot/multi 完全一致）**：`[相对时间 | "Bought {side}"（MARKET 轴配色）| muted context | $金额右对齐]`。唯一差别是 context 列：binary/spot = `{N}×`（只有 boost，页面本身就是这个市场），multi = `{option} · {N}×`。旧的「side chip 打头 + 时间收尾」布局已废弃，禁止回退。side 以 `market_activity.is_yes` 为准，`"No: "` 前缀仅作 legacy 兜底。空态 "No activity yet"。
- 严禁回退成 "Your recent activity" / 用 `trades` 做 volume 聚合。