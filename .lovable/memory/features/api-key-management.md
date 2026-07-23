---
name: API key management (Open API v1 user surface)
description: /settings/api tier checklist (Read-only/Trading/Pro-MM), 7-scope enumeration, IP whitelist gating for trade_* & ws_private, one-time secret reveal (demo-only front-end signing)
type: feature
---

## 页面
- 路由：`/settings/api`
- 入口：Settings 卡片 + 桌面 EventsDesktopHeader 下拉 "API" + 移动 BottomNav 抽屉 "API"（图标 `KeyRound`）

## 三层准入（`useTierEligibility`）
- Read-only = email verified + 2FA
- Trading = Read-only + ≥1 completed deposit + balance ≥ 100 USDC + ≥1 Filled trade
- Pro / MM = 30d filled 成交量 ≥ 50,000 或 equity ≥ 10,000；恒 Manual approval，不自助
- 判定实时读 `profiles` / `user_security`（totp_enabled）/ `transactions` / `trades`

## Scope 枚举（FD-API-04）
`read_public` / `read_private` / `trade_order` / `trade_cancel` / `trade_conditional` / `ws_public` / `ws_private`
- 需 IP：任一 `trade_*` 或 `ws_private`；勾选后 IP whitelist 至少一条否则禁用 Create

## 创建向导 3 步
1. Label + Tier（未达标层禁用并显示缺项）
2. Scopes + IP whitelist
3. 一次性 secret：`omx_live_<48hex>` 前端仿真生成 → `api_keys` 只落 `key_prefix`

## DEMO-STATE
- key/secret 前端 `crypto.getRandomValues` 生成，正式版由后端 HMAC/JWT 签发 + 哈希存储
- IP whitelist / 2FA 校验在正式版鉴权中间件执行；本演示只做前端 gating
- 本轮不改 `api_keys` schema

## 禁忌
- 文案禁止提对冲 / 做市成本 / 内部撮合结构；能力描述只写交易者视角
- Pro / MM 不写具体限频阈值
