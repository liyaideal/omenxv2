# Open API v1 — 门户页 + Key 管理页 双端定稿（v2）

> 本文档合并并**取代** [2026-07-15 Open API v1 交付说明](./2026-07-15-api-key-management.md)。覆盖两条 surface：
> - **`/developers`（门户页）**：桌面版沿用 Hero + 能力三卡 + 三层权限 + Quickstart + Reference + Footer CTA；**新增独立 mobile 版** `DevelopersPageMobile`（mobile-native 布局，非桌面缩放），桌面版完全不改。
> - **`/settings/api`（Key 管理页）**：视觉从"三张空卡 + 大框列表"重构为 §5 语义类 + §12 表格规范，横向 tier 解锁轨道、紧凑速答条、≤180px 空态卡；创建向导双端分叉（桌面 Dialog / 移动 MobileDrawer），4 段式进度指示，Step4 secret 展示强化仪式感。
>
> **入口 IA 定稿**：`profile 菜单 API → /developers 门面 → 门面 Manage API Keys CTA → /settings/api`。一个入口，门面优先。
>
> **DEMO-STATE 不变**：key/secret 由前端 `omx_live_<48hex>` 仿真生成、`api_keys` 只落 `key_prefix`；正式版由后端 HMAC/JWT 签发 + 哈希存储 + IP/2FA 校验在鉴权中间件执行。本轮**不改 schema**，仅读写既有 `api_keys` 表。
>
> **两处 LOCKED 规范（写入 DESIGN.md）**：
> - §7 API Surface — Two-Layer Structure：`/developers` 与 `/settings/api` 禁止合并为单页；门户 Hero CTA 必须包含 `Manage API Keys` + `Read the Docs`。
> - Overlays：**移动端零 Dialog** —— 移动视口下所有确认/编辑类 overlay 必须走 `MobileDrawer`，禁止 shadcn `Dialog`。
> - §16.1.1 Style-Guide Truth Rule：`/style-guide` 展示的必须是**真实生产组件**（用 mock props 驱动），禁止"平替卡片"；mobile 预览必须走 `DeviceFrame` iframe 隔离，触发真 `md:` 断点。

---

## 1. 功能目标

给交易者 / 做市 / Agent 提供程序化访问入口，分两层 surface：
- **/developers**：门面页，讲能力与接入方式，任何访客可看。
- **/settings/api**：登录后的密钥自助管理，创建、查看、撤销 API key。

关键约束：
- 三层准入（Read-only / Trading / Pro-MM）自动评估，未达标 tier 在创建向导中禁用并列出缺项。
- Secret 只在创建那一刻明文展示一次，之后永不回显（数据库只落 prefix）。
- 桌面与移动分别设计，不共用同一组件树；移动版不出现 Dialog。

---

## 2. 入口 IA

| 入口位置 | 目标 | 备注 |
|---|---|---|
| 桌面 profile 下拉（`EventsDesktopHeader`）"API" | `/developers` | label 保持 "API"，指向门面 |
| 移动 profile drawer（`BottomNav`）"API" | `/developers` | 同上 |
| SEO footer Learn More 列 "Developers" | `/developers` | 门面公开入口 |
| Settings 页 "API Management" 卡 | `/settings/api` | 深层入口，登录后可见 |
| `/developers` Hero "Manage API Keys" CTA | `/settings/api` | 从门面进 Key 管理 |

**已撤销**：profile 菜单里同时并列 "Developers" + "API"（避免重复），只保留一项 "API" → `/developers`。

---

## 3. `/developers` 门户页

### 3.1 桌面版（`DevelopersPage.tsx`）

模块顺序（本轮不变）：Hero → 能力三卡（Market Data / Trading / Agent-Ready）→ Access Tiers → Quickstart 代码块 → Reference 资源卡 → Footer CTA → `SeoFooter`。

- Hero CTA：`Manage API Keys` → `/settings/api`，`Read the Docs` → 锚点。
- 三终端示例（cURL / Python / TypeScript / Signing）统一使用二元预测市场：`market_id: "BTC_ABOVE:150000:2026-12-31"` + `outcome_side: "YES"`。**不再使用 TSLA / 美股示例**（美股产品线未上线）。
- `MiniOrderBook` header：`BTC ≥ $150k · Yes`。

### 3.2 移动版（`DevelopersPageMobile.tsx`，本轮新建）

桌面版组件完全不复用；`DevelopersPage.tsx` 顶部 `if (isMobile) return <DevelopersPageMobile />`，保证桌面零回归。

| 模块 | 移动实现 |
|---|---|
| Hero | 精简单列 + 2×2 stats grid |
| 请求预览 | 单卡 `POST /v1/orders/preview`（替代桌面 3-tab `ApiTerminal`） |
| 能力三卡 | 竖排 card list |
| Access Tiers | 竖向 stepper（见 §3.3） |
| Reference | 折叠 accordion（次级资源） |
| 关闭 sticky 问题 | `html/body/#root` 全局用 `overflow-x: clip`（非 hidden），保证 `MobileHeader` `sticky top-0` 生效 |

### 3.3 Access Tiers 竖向 stepper（`TiersStepperMobile.tsx`）

替代原方案的三个空心圆点。使用 `TIER_NODE_STYLES` 统一色板：

| 节点 | 编号 | 语义色 | Tier |
|---|---|---|---|
| 01 | Muted | Read-only |
| 02 | Primary（含轻微 glow） | Trading |
| 03 | Amber | Pro / Market Maker |

竖轨居中穿过 badge，垂直排列不再显示方向箭头（`hidden md:block`）。

---

## 4. `/settings/api` 管理页

### 4.1 页面骨架

- 容器：`max-w-7xl px-8 py-10`（Canonical Layout Wide）。
- 桌面标题走共享 `PageHeader`（紫竖线 + h1 + 副标）；**不再有正文面包屑**（对齐 DESIGN.md §4）。
- 移动走 `MobileHeader` title="Keys & access"、`showBack={true}`。
- 大区之间用全宽 `border-t border-border/30` hairline 分隔。

### 4.2 模块顺序

1. `TierQuickAnswer` — 一行紧凑摘要，用 chip 说明"当前可建 key 类型"；移动竖排。
2. Access Tiers — `TierTrack` 横向解锁轨道，顶部进度线 + 三个状态点，共享边框；已满足层用 primary 强调。移动优化 tap target。窄屏 "Auto-evaluated · Read-only → Trading → Pro" 注记用 `truncate hidden md:inline`。
3. Your API keys —
   - 空态：`≤180px` `EmptyState` 紧凑卡（虚线，Key 图标 + Create CTA），不再占满下半屏。
   - 有数据：桌面走 §12 表格规范 `KeysTable`（Label · Key prefix · Tier · Scopes · IPs · Created · Last used · Status · Revoke）；**移动改卡片列表**（每 key 一张，Revoke 收在卡底）。

### 4.3 创建向导（4 步）

双端分叉：**桌面 `Dialog` / 移动 `MobileDrawer`**（移动零 Dialog 规则）。顶部 `StepIndicator` 4 段进度指示。

| Step | 内容 |
|---|---|
| 1 | Label（≥2 字符）+ Tier 选择（未达标层禁用并列出缺项） |
| 2 | Scopes 多选 + IP whitelist（多行 / 逗号分隔，IPv4 / IPv6 / CIDR 基础校验）。勾选任一 `trade_*` 或 `ws_private` 时强制至少一条 IP |
| 3 | 2FA OTP 6 位验证（`verifyDemoOtp`） |
| 4 | 一次性 secret 展示：`omx_live_<48hex>`，warning 卡 + Copy 按钮 + `X-OMENX-API-KEY` header 提示 |

按钮统一 `h-11 md:h-10`；主/次按钮走 shadcn `Button` + `outline`，不手搓背景色。

### 4.4 Revoke 确认

`RevokeDialog` 桌面走 `Dialog`、移动走 `MobileDrawer`；destructive 按钮统一 `trading-red`（不用 shadcn `destructive` 变体）。

### 4.5 三层准入判定（`useTierEligibility`，逻辑不变）

| Tier | 判定 |
|---|---|
| Read-only | `profile.email` 存在 + `user_security.totp_enabled` |
| Trading | Read-only + 至少 1 笔 `transactions.type='deposit' & status='completed'` + `balance + trial_balance ≥ 100` + 至少 1 笔 `trades.status='Filled'` |
| Pro / MM | 近 30d filled 成交量 ≥ 50,000 或 equity ≥ 10,000；仅显示，不自助开通（Manual approval） |

Demo 账号（alex_carter 等）默认满足 Read-only + Trading。

### 4.6 Scope 枚举（对齐 FD-API-04，不变）

| Scope | 说明 | 需 IP |
|---|---|---|
| `read_public` | 公开行情 / 事件列表 | ✗ |
| `read_private` | 账户余额 / 持仓 / 历史 | ✗ |
| `trade_order` | 下单 | ✓ |
| `trade_cancel` | 撤单 | ✓ |
| `trade_conditional` | 条件单 / 止损单 | ✓ |
| `ws_public` | 公开 WebSocket 流 | ✗ |
| `ws_private` | 私有 WebSocket（成交 / 余额） | ✓ |

---

## 5. 数据库

- 表：既有 `public.api_keys`（本轮**不改 schema**）。字段与 [2026-07-15 v1](./2026-07-15-api-key-management.md) 一致：`user_id / label / key_prefix / tier / scopes[] / ip_whitelist[] / status / created_at / last_used_at`。
- 演示种子：给 `alex_carter` 账号（user_id `7dfb4698-d7f0-40af-b155-4f0d8e948014`）通过 psql 插入 5 条示例 key，覆盖不同 tier / scope / IP 组合。
- 正式版存储要求（🔴 仅演示，本仓库不实现）：secret 明文永不落库；仅存 HMAC/JWT 哈希 + prefix；IP/2FA 校验在鉴权中间件；限频参数持久化在服务端。

---

## 6. Style Guide（`/style-guide` API section）

**Truth rule 落地**：section 内展示的所有组件均从 `src/components/api/*` 直接引用生产组件，用 mock props 驱动，**禁止平替卡片**。

- 使用 `DualDevicePreview`（真实 iframe，触发 `md:` 断点）双端并排预览。
- 覆盖状态（≈20 项）：TierTrack 三种进度（0/1/2 达成）· TierQuickAnswer 三种摘要 · KeysTable（0 / 1 / 5 keys · disabled key · revoked · long IP list · 各 scope 组合）· CreateKeyFlow Step1–4（含 Step4 secret）· RevokeDialog · 移动 KeysTable 卡片列表 · 移动 CreateKey MobileDrawer · Developers mobile stepper（`developers-mobile-tiers`）。

---

## 7. 已删除 / 已废弃

| 项 | 说明 |
|---|---|
| `/settings/api` 顶部 "← API Overview" 面包屑 | 对齐 DESIGN.md §4，桌面标题区不留正文返回 |
| Access Tiers 三张空卡布局 | 改为共享边框的横向解锁轨道 |
| Keys 列表外层大框 | 直接走 §12 表格规范，无冗余包裹 |
| 创建向导单一 Dialog 路径 | 移动分叉到 `MobileDrawer` |
| 创建向导 3 步 | 升级为 4 步（新增 2FA） |
| profile 菜单 "Developers" 项 | 已撤，避免与 "API" 并列重复；只保留 "API" → `/developers` |
| `MobileHeader` 全局 `overflow-x: hidden` | 改为 `overflow-x: clip`，修复 sticky header |
| `/developers` 桌面 3-tab `ApiTerminal` 在移动版 | 移动改为单卡请求预览 |
| `/developers` mobile Access Tiers 三空心圆点 | 改 01/02/03 monospace badge + `TIER_NODE_STYLES` |
| `MiniOrderBook` "TSLA · Up" mock | 改 "BTC ≥ $150k · Yes"（美股未上线） |
| 未使用的 `MobileHeader` import in `DevelopersPage.tsx` | 已删 |
| Agent-Ready stepper 移动向下 chevron | `hidden md:block`（垂直列表不需要方向箭头） |
| `DevelopersPage.tsx` 中 `offsetHeight=0` 的空 `<section>` | 已删 |

---

## 8. Style Guide 位置

- API section：`/style-guide` → API（`ApiSection.tsx`）
- Developers mobile stepper：同 API section 下 preview key `developers-mobile-tiers`

---

## 9. 涉及文件

**页面**
- `src/pages/ApiManagement.tsx`（重构骨架 + 状态组件迁移）
- `src/pages/DevelopersPage.tsx`（清理 + mobile 分叉入口 + TSLA→BTC mock）
- `src/pages/DevelopersPageMobile.tsx`（新建）

**组件（`src/components/api/`）**
- `TierTrack.tsx` / `TierQuickAnswer.tsx` / `KeysTable.tsx`（含移动卡片分支）
- `CreateKeyFlow.tsx` / `CreateKeySteps.tsx` / `StepIndicator.tsx`
- `RevokeDialog.tsx`（双端分叉）
- `tierMeta.ts`（`TIER_META` 单源）· `index.ts`

**组件（`src/components/developers/`）**
- `TiersStepperMobile.tsx`（新建）· `MiniOrderBook.tsx`（BTC 二元 mock）· `ApiTerminal.tsx` / `EndpointMarquee.tsx`

**共享**
- `src/components/PageHeader.tsx`（新建，全站铺开）
- `src/components/states/*`（`EmptyState` / `LoadingState` / `ErrorState`）
- `src/lib/statusStyles.ts`
- `src/index.css`（`overflow-x: clip` 全局修复）

**入口**
- `src/components/EventsDesktopHeader.tsx` / `src/components/BottomNav.tsx`（"API" → `/developers`）
- `src/components/seo/SeoFooter.tsx`（Learn More 列 Developers）
- `src/pages/Settings.tsx`（API Management 卡 → `/settings/api`）

**Style Guide**
- `src/pages/StyleGuide/sections/ApiSection.tsx`（真组件 + 双端）
- `src/pages/StyleGuide/preview/registry.tsx`
- `src/pages/StyleGuide/components/DeviceFrame.tsx` / `DualDevicePreview.tsx`

**规范**
- `DESIGN.md` §4（Canonical Layout）· §5（Card System / 危险色）· §7（API Surface 两层结构）· Overlays（移动零 Dialog）· §12（表格）· §16.1 / §16.1.1（Style-Guide Truth Rule + DeviceFrame）
- `docs/backend-boundary.md`（`api_keys` 🟡 边界说明保留）

---

## 10. 未变更项

- `api_keys` 表结构 / RLS / 触发器
- `useApiKeys` / `useTierEligibility` 业务逻辑
- Scope 枚举与 IP 必填规则
- Secret 生成机制（`omx_live_<48hex>` 前端仿真，DEMO-STATE）
- `/developers` 桌面版模块顺序与视觉
- `alex_carter` 之外的账号 API 数据
