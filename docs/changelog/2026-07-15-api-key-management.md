# Open API v1 — 门户页 + 用户侧 Key 自助管理页

> Open API v1 上线两层入口，对标 Binance / Bybit developer 站结构：
> - **`/developers`（门户页，本轮重做）**：Hero + 能力三卡（Market Data / Trading / Agent-Ready）+ 三层权限概览 + Quickstart 代码块 + Reference 资源卡 + Footer CTA，SeoFooter 收尾
> - **`/settings/api`（配置页，本轮视觉重做）**：§4 桌面页面骨架（紫色左竖线 + `text-3xl` 标题 + `max-w-7xl`），顶部 `← API Overview` 面包屑回门户；三层 tier 卡等高、已满足层用 `border-primary/40` + primary gradient tint 强调；空态收敛成 `max-w-sm` 虚线卡（不再占满整个下半屏）；创建向导 4 步（label → scope+IP → 2FA → 一次性 secret）
>
> **DEMO-STATE**：key/secret 由前端 `omx_live_<48hex>` 仿真生成、`api_keys` 只落 `key_prefix`；正式版 secret 由后端 HMAC/JWT 签发 + 哈希存储 + IP/2FA 校验在鉴权中间件执行。本轮不改 schema，仅读写既有 `api_keys` 表。
>
> **两层结构 LOCKED**：DESIGN.md §7 新增「API Surface — Two-Layer Structure」小节；禁止合并为单页；门户 Hero CTA 必须包含 `Manage API Keys` + `Read the Docs`；配置页顶部必带面包屑回门户。


## 1. 页面 `/settings/api`

- **顶部**：`API Management` + 副标 "Programmatic access for trading bots, market makers, and agents."
- **三层状态卡**（横向 3 张）：
  - 每张卡展示 checklist（✓ / ○），未达标层禁用创建向导中的对应选项
  - Pro / MM 恒为 Manual approval，"Contact us" 邮件占位
- **Key 列表**：Label · Key（`omx_live_a1b2••••`，`font-mono`）· Tier badge · Scope chips · IP 数 · Created · Last used · Status · Revoke
- **空态**：Key 图标 + "No API keys yet" + Create CTA

## 2. 三层准入判定（`useTierEligibility`）

| Tier | 判定 |
|---|---|
| Read-only | `profile.email` 存在 + `profile.totp_enabled` |
| Trading | Read-only + 至少 1 笔 `transactions.type='deposit' & status='completed'` + `balance + trial_balance ≥ 100` + 至少 1 笔 `trades.status='Filled'` |
| Pro / MM | 近 30d filled 成交量 ≥ 50,000 或 equity ≥ 10,000；仅显示，不自助开通 |

demo 账号默认满足 Read-only + Trading。

## 3. 创建向导（3 步 Dialog）

| Step | 内容 |
|---|---|
| 1 | Label（≥2 字符）+ Tier 选择（未达标层禁用并列出缺项） |
| 2 | Scopes 多选（默认 `read_public` + `read_private`）+ IP whitelist（多行 / 逗号分隔，IPv4 / IPv6 / CIDR 基础校验）。勾选任一 `trade_*` 或 `ws_private` 时强制至少一条 IP |
| 3 | 一次性 secret 展示：`omx_live_<48hex>`，红色 warning 卡 + Copy 按钮；关闭后列表新增记录（只存 prefix） |

`X-OMENX-API-KEY` header 提示嵌在 secret 卡底部。

## 4. Scope 枚举（对齐 FD-API-04）

| Scope | 说明 | 需 IP |
|---|---|---|
| `read_public` | 公开行情 / 事件列表 | ✗ |
| `read_private` | 账户余额 / 持仓 / 历史 | ✗ |
| `trade_order` | 下单（spot & perp） | ✓ |
| `trade_cancel` | 撤单 | ✓ |
| `trade_conditional` | 条件单 / 止损单 | ✓ |
| `ws_public` | 公开 WebSocket 流 | ✗ |
| `ws_private` | 私有 WebSocket（成交 / 余额） | ✓ |

## 5. 入口

- **Settings 页**：新增 "API Management" 卡片（Key 图标）
- **桌面 EventsDesktopHeader 下拉**：Referral / Position Vouchers 同组新增 "API"（`KeyRound` 图标）
- **移动 BottomNav 抽屉**：同上，Position Vouchers 之后新增

## 6. 涉及文件

- 新增 `src/pages/ApiManagement.tsx` / `src/hooks/useApiKeys.ts`
- 新增 `src/pages/StyleGuide/sections/ApiSection.tsx`（三层卡两态 + Key 行 + 向导 scope 列表 + secret 展示）
- 编辑 `src/App.tsx`（route `/settings/api`）
- 编辑 `src/pages/Settings.tsx`（桌面 + 移动菜单条目）
- 编辑 `src/components/EventsDesktopHeader.tsx`（桌面下拉入口）
- 编辑 `src/components/BottomNav.tsx`（移动抽屉入口）
- 编辑 `docs/backend-boundary.md`（`api_keys` 🟡 append）

## 7. 保密红线

- 页面文案禁止提对冲 / 做市成本 / 内部撮合结构，只讲交易者视角（下单 / 撤单 / 私有流 / 限频）
- Pro / MM 层"更高限频 / 更多 open orders / 批量"仅描述能力，不透露具体阈值上限
