---
name: Market activity 匿名全站成交流
description: Lite 交易页的 Market activity 读 market_activity 表（无用户字段、public SELECT），不是用户自己的 trades
type: feature
---
`trades` 的 RLS 是 owner-scoped，客户端永远读不到别人的成交，所以社交证明**不能**用 `trades` 聚合。

- 表 `market_activity`：`event_name / option_label / amount / boost / created_at`，**没有任何用户身份列**；public SELECT，客户端无写权限。
- `trades` 上的 AFTER INSERT 触发器（side='buy' AND status='Filled'）由 SECURITY DEFINER 函数写入匿名行。
- DEMO-STATE：`sim_market_activity_tick()` 由 pg_cron 每 5 分钟生成 0–3 行/未结算事件，并删除 48h 以上旧行。上线时只保留触发器。
- UI：`LiteMarketActivity`，行文案 `Backed {side} · $25 · 5× Boost · 2m`，side chip 走 MARKET 轴；空态 "No activity yet — be the first."
- 严禁回退成 "Your recent activity" / 用 `trades` 做 volume 聚合。