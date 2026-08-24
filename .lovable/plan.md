# Portfolio（Lite）交付文档

产出一份研发交付说明，写到 `/mnt/documents/lite-portfolio-spec.md`，用 delivery-doc 规范（中文为主、表格优先、不贴代码、100–200 行）。

定位：生产页面 `/portfolio` 已经说明了"长什么样"，`/style-guide` 的 Portfolio 节已经说明了"每个状态什么时候出现"。本文档只写这两处看不到的东西——路由与流程、数据来源与口径、跳转/返回规则、边界与不做的事。

## 文档骨架

```
# Portfolio（Lite）— 交付说明 v1
> 定位 quote：样式看生产 /portfolio，状态看 /style-guide → Lite Pages → Portfolio；本文只写流程与口径。

## 1. 功能目标与范围（Lite surface；Pro portfolio 独立代码路径，不在本次范围）
## 2. 路由与页面关系
     /portfolio（live / settled tab）、?tab=settled&series=<eventId>、
     /portfolio/settlement/:id、/portfolio/settlements 与 /portfolio/airdrops 的重定向；
     移动端 series/详情为独立整页（MobileHeader variant="inner"），桌面端为容器内视图
## 3. 完整用户流程（含时序图 text 块）
     3.1 进入 → 未登录 → LiteAuthGate 模糊门 → 登录后原位恢复
     3.2 Live → 点持仓 → 交易页 → 返回原位（滚动 + 段位记忆）
     3.3 挂单行 → Pro 交易终端 → 返回落回 Lite portfolio
     3.4 Settled → 单仓详情 / 系列详情 → View event → 返回目标是确定 URL（不用 history）
## 4. 数据来源与计算口径（表）
     positions / orders / settlements / realtime PnL / risk / vouchers 各自 hook；
     nowWorth = max(0, cost+profit)；profitPercent；ifWins = shares；
     payout = max(0, cost + net)；系列 Net 为费后且各轮 net 相加等于 Net；
     autoClosePrice 为账户级求解（排除本仓）；hot = |priceNow − autoClose|/priceNow ≤ 10%；
     riskRatio = imTotal / equity × 100；KPI 恒为全账户（段位 chips 不影响 KPI）
## 5. 分段与聚合规则
     boost = 非 spot，standard = spot；同一 event 名 ≥2 条结算聚合为 series 行；
     月分组；series key 为 eventId（旧链接传 name 时一跳内 canonical 化）
## 6. 状态清单（只给索引表：模块 → style-guide 章节名，不复述状态）
## 7. 会话状态与返回机制（sessionStorage 三个 key 的语义与生命周期）
## 8. 文案口径（If it wins / auto-close 后缀仅在有价时出现 / cashed out early 已废弃 / 禁词）
## 9. 涉及文件（前端分组）
## 10. 未变更 / 不做的部分（Pro portfolio、close_reason 数据层、Lite 暂无 limit order 模块）
```

## 说明

- §6 只做索引，避免和 style-guide 重复维护。
- §4 口径与 `useLitePortfolio.ts` 逐条核对后写，不凭印象。
- 交付时用 `<presentation-artifact>` 标签给出文档。
- 纯文档产出，不改任何生产代码。
