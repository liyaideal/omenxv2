# OmenX Design System

> Machine-readable design spec. Consult before every UI change.

---

## 1. Brand Identity

- **Product**: OmenX — crypto prediction market platform
- **Theme**: Dark-first, single theme (no light mode)
- **Primary accent**: Purple `hsl(260 60% 55%)`
- **Personality**: Technical, precise, trustworthy — like a Bloomberg terminal for prediction markets

---

## 2. Color Tokens

All colors are HSL values defined as CSS custom properties in `src/index.css`.
Use Tailwind semantic classes (`bg-background`, `text-foreground`, `text-primary`, etc.) — **never** raw hex/rgb.

### Surfaces

| Token | HSL | Usage |
|-------|-----|-------|
| `--background` | 222 47% 6% | Page background |
| `--background-elevated` | 222 40% 8% | Elevated surfaces |
| `--card` | 222 35% 10% | Card backgrounds |
| `--card-hover` | 222 35% 12% | Card hover state |
| `--muted` | 222 25% 14% | Muted backgrounds, data row bg |
| `--popover` | 222 40% 9% | Dropdowns, popovers |

### Text

| Token | HSL | Usage |
|-------|-----|-------|
| `--foreground` | 210 40% 98% | Primary text |
| `--muted-foreground` | 215 20% 55% | Secondary text, labels |

### Brand

| Token | HSL | Usage |
|-------|-----|-------|
| `--primary` | 260 60% 55% | Primary actions, active states |
| `--primary-hover` | 260 60% 50% | Primary hover |
| `--primary-muted` | 260 40% 25% | Subtle primary backgrounds |
| `--accent` | 260 50% 45% | Accent elements |

### Trading Semantics

| Token | HSL | Usage |
|-------|-----|-------|
| `--trading-green` | 145 80% 42% | Profit, success, buy/long |
| `--trading-red` | 0 85% 55% | Loss, error, sell/short |
| `--trading-purple` | 260 65% 58% | Brand emphasis |
| `--trading-yellow` | 48 100% 55% | Warnings, alerts, pending |

### Borders

| Token | HSL | Usage |
|-------|-----|-------|
| `--border` | 222 25% 18% | Default borders |
| `--border-subtle` | 222 20% 14% | Subtle dividers |

### Transparency Scenario Accents

| Scenario | Tailwind Color | Usage |
|----------|---------------|-------|
| Merkle / State Root | `emerald-400` | Verified, proof valid |
| Trade Verification | `blue-400` | Trade log matching |
| Liquidation Audit | `amber-400` | Warnings, deviations |
| Funding Rate | `purple-400` | Rate analysis |
| Settlement | `cyan-400` | Oracle, settlement data |

---

## 3. Typography

### Font Stack

- **Sans** (UI text): `Inter` → `font-sans`
- **Mono** (data): `JetBrains Mono` → `font-mono`

### When to Use Each Font

| Content Type | Font | Example |
|-------------|------|---------|
| Labels, headers, descriptions | `font-sans` (Inter) | "Total Profit", "Settings" |
| Prices, amounts, percentages | `font-mono` (JetBrains Mono) | "$0.5500", "12.5%" |
| Addresses, hashes, tx IDs | `font-mono` | "0x3b4e780d12...c6b3bf" |
| Contract field names | `font-mono` | "txHash", "blockNumber" |
| Raw / debug values | `font-mono` | "550000" |

### Typography Components

Use `@/components/typography` instead of raw `<span className="font-mono">`:

| Component | Purpose |
|-----------|---------|
| `<PriceText>` | Currency values with optional sign/color |
| `<PercentText>` | Percentage values with optional sign/color |
| `<AmountText>` | Quantities (contracts, shares) |
| `<AddressText>` | Wallet addresses, tx hashes (with truncation) |
| `<MonoText>` | Generic mono-font wrapper |
| `<LabelText>` | Sans-font text with size/weight/muted props |

### Weight Hierarchy

| Weight | Class | Usage |
|--------|-------|-------|
| 400 | `font-normal` | Body text, descriptions |
| 500 | `font-medium` | Labels, option names, nav items |
| 600 | `font-semibold` | Section headers, card titles |
| 700 | `font-bold` | Hero numbers, page titles |

### Size Scale

| Size | Class | Usage |
|------|-------|-------|
| 10px | `text-[10px]` | Captions, raw values, micro-labels |
| 12px | `text-xs` | Data row labels/values, badges |
| 14px | `text-sm` | Section headers, body text |
| 16px | `text-base` | Primary content |
| 18px–24px | `text-lg`–`text-2xl` | Card titles, page titles |
| 30px–36px | `text-3xl`–`text-4xl` | Hero numbers |

### Casing Rules

| Element | Casing | Example |
|---------|--------|---------|
| Section / component headers | Title Case | "On-Chain Liquidation Snapshot" |
| Page titles | Title Case | "Trade Verification" |
| On-chain contract fields | camelCase | `positionSide`, `markPrice`, `uid` |
| Blockchain metadata | camelCase | `txHash`, `blockNumber`, `contract` |
| Platform analysis fields | camelCase | `oracleSource`, `priceDeviation` |
| Button text | Title Case | "Place Order", "View Details" |
| Descriptions / body text | Sentence case | "This trade was verified on-chain." |
| Hero labels (above big numbers) | UPPERCASE + `tracking-widest` | "TOTAL VOLUME" |

> **Rule**: Never mix Title Case and camelCase within the same data-row list.

---

## 4. Spacing & Layout

### Card Padding

| Context | Padding |
|---------|---------|
| Standard card content | `p-4` (16px) |
| Compact card / mobile | `p-3` (12px) |
| Spacious / hero sections | `p-5` or `p-6` |

### Data Row Layout

```
flex items-center justify-between py-1.5 px-2 rounded bg-muted/20 text-xs
```

- Gap between rows: `gap-1.5` or `space-y-1.5`
- Label: `text-muted-foreground font-mono` (for on-chain fields)
- Value: `font-mono text-foreground/80`

### Section Spacing

| Between | Gap |
|---------|-----|
| Major sections (top-level `<main>`) | `space-y-6` |
| Sub-sections within a card | `space-y-4` |
| Related items | `space-y-2` or `gap-2` |

> Single source of truth: **`space-y-6`** for major sections. Matches Canonical Layout below. Never use `space-y-8` on `<main>`.

### Breakpoints

| Name | Width | Usage |
|------|-------|-------|
| Mobile | < 768px | Single column, bottom nav |
| Desktop | ≥ 768px (`md:`) | Multi-column, side panels, top header |

### Desktop Page Layout 规范

所有桌面端产品页面（Events、Resolved、Portfolio 等）必须遵循统一的页面结构：

1. **共享导航栏**：`<EventsDesktopHeader />` 顶部导航
2. **`<main>` 容器**：`px-8 py-10 max-w-7xl mx-auto space-y-6`
3. **标题区**：桌面标题块**必须**由 `<PageHeader>` 渲染（见下方 Page Title Block 小节），禁止手写紫竖线 + `<h1>` 模板
4. **筛选/Tabs 区**：标题下方，`space-y-6` 间距
5. **内容区**：列表或网格

**❌ 不允许**：桌面端跳过标题区直接渲染 Tabs/内容；使用非标准 `max-w` 或 `py` 值；在页面内手写 `<h1>` 复制 PageHeader 的样式。

### Canonical Product Page Layouts

全站产品功能页只允许以下两种官方布局，不允许第三种。营销/SEO 页（Insights 走 SeoPageLayout、Leaderboard 自定义 Hero）不受此规范约束。

**Layout Wide（默认，仪表盘/数据/多区块页）**

- 容器：`<main className="mx-auto w-full max-w-7xl px-8 py-10 space-y-6">`（移动 `px-4 py-6`）
- 适用：Events / Resolved / Portfolio(+子页) / Vouchers / Rewards / Wallet / Transparency / API Management

**Layout Narrow（纯单列表单/开关页）**

- 容器：`<main className="mx-auto w-full max-w-3xl px-8 py-10 space-y-6">`（移动 `px-4 py-6`）
- 适用：**仅** Settings 这类纯设置表单页

**允许的变体**：`/settings/api` (API Management) 用全宽 hairline `border-t border-border/40` 分段替代 `space-y-6`，这是 §4 明确允许的工程图纸变体，别当违规。仍需 `max-w-7xl px-8 py-10`（移动 `px-4 py-6`）。

### Page Title Block — 强制使用 `<PageHeader>` 组件

标题块**只能**通过 `src/components/PageHeader.tsx` 渲染。任何页面手写紫竖线 + `<h1>` 都算违规。

```tsx
<PageHeader
  title="Wallet"
  subtitle="Manage your funds and saved addresses"
  actions={<Button>Create key</Button>}  // 可选右侧操作
/>
```

**组件内置固化（不暴露为 prop，杜绝漂移）**

- 紫竖线：`absolute -left-4 top-0 bottom-0 w-1 rounded-full bg-gradient-to-b from-primary via-primary/60 to-transparent hidden md:block`
- h1 字号：`text-2xl md:text-3xl font-bold text-foreground`（全站唯一响应式类）
- subtitle：`text-muted-foreground text-sm mt-1.5 max-w-2xl`
- 布局：`flex items-start justify-between gap-4`，左标题块 / 右 `actions`（可选，`flex-shrink-0`）

**Props**

| Prop       | Type        | Note                                  |
| ---------- | ----------- | ------------------------------------- |
| `title`    | `string`    | 必填                                  |
| `subtitle` | `string?`   | 可选，独立段落                        |
| `actions`  | `ReactNode?`| 可选，右侧操作槽（按钮、tabs、drawer 触发） |

**渲染口径（桌面-only）**

- `<PageHeader>` **仅在桌面渲染**（`{!isMobile && <PageHeader .../>}`）。移动端标题一律由 `<MobileHeader>` 顶栏承担，正文不再重复出标题块。
- 移动端专用的筛选/drawer 触发按钮不放进 `actions`（`actions` 只在桌面显示），应在移动分支单独渲染一行 `flex justify-end` 控件。

**❌ 禁止清单**

- 禁止在 PageHeader 之外手写 `<h1>` + 紫竖线组合（Leaderboard 营销 Hero 是唯一豁免）
- 禁止在 PageHeader 上下添加 eyebrow 小标签（如 `v1 · API MANAGEMENT`）
- 禁止在标题旁塞图标（Gift、Shield、Wallet 图标等）
- 禁止自定义字号（`text-3xl` 固定 / JS 三元切换）
- 禁止自定义 subtitle `max-w`
- 禁止在移动端同时渲染 `MobileHeader` 和 `PageHeader`（标题重复）

**✅ Do**
- 外层容器一律 `mx-auto` 居中 + `px-8 py-10` 节奏
- 内容区左对齐排布

**❌ Don't（容器层）**
- 禁止 `max-w-2xl` / `max-w-6xl` 等非官方宽度
- 禁止 `px-6` / `py-8` / `p-6` 作为外层容器节奏
- 禁止内容整列 `text-center` 居中

---

## 5. Component Patterns

### Cards

**主卡片强制条款（LOCKED）**：产品功能页的主信息卡片**必须**使用下列语义类之一，**禁止**手写 `bg-card rounded-xl … p-x` / `rounded-2xl border … bg-card` 组合承担主卡角色。主卡圆角**只允许 `rounded-xl`**（由类内建）——`rounded-2xl` 或 `rounded-lg` 不得用于主卡；`rounded-lg` 只用于卡内列表行/次级元素。

- **`.trading-card`**: 默认内容/面板卡。`gradient-card` + `border border-border/50` + `rounded-xl`。Vouchers/Wallet/Portfolio 表格容器/Rewards 主面板走这个。
- **`.stats-card`**: 数据/KPI 卡。`gradient-stats-card` + `border border-border/30` + `rounded-xl`。Portfolio positions/settlements stats grid 是首个正确用例。
- **`.web3-card`**: Premium 卡（动画渐变边 + glow），仅特殊营销/亮相场景。

**已登记的例外（可保留 bespoke 容器）**：
1. **Wallet Balance Card / H2eRewardsCard** — primary 品牌渐变的英雄卡，独立视觉强调。
2. **§15 移动端列表卡**（`MarketCard` / `ResolvedEventCard`）—— 强制 raw `<div>`，见 §15。
3. **Insights 营销页**（`SeoPageLayout`）—— 营销叙事豁免。
4. **Leaderboard 营销 hero** —— 榜首视觉强调，豁免。

例外之外任何新增主卡违反此条即为回归；出现 `bg-card rounded-xl p-4` 五连的直接改成 `.trading-card` / `.stats-card`。

### Buttons

- **`.btn-primary`**: Purple gradient, white text, glow shadow
- **`.btn-trading-green`**: Green gradient, white text — Buy/Long, also 全站主 CTA（Deposit 等）
- **`.btn-trading-red`**: Red gradient, white text — Sell/Short
- All trading buttons: **always white text** (`text-primary-foreground`)

**危险/销毁操作统一 `trading-red`**：所有 destructive 操作（Revoke key、Close position、Delete wallet、Confirm withdraw 等）必须走 `bg-trading-red text-white hover:bg-trading-red/90` 或 `.btn-trading-red` 类。**禁止使用 shadcn `variant="destructive"`**——`--destructive` token 与全站交易语义色 `--trading-red` 分裂，会产生两种红。表格/inline ghost 型 Revoke 用 `text-trading-red hover:text-trading-red hover:bg-trading-red/10`。

**主 CTA 用 `.btn-*` 类，不手搓**：`bg-trading-green ... text-background rounded-xl` 之类的手写组合禁止承担主按钮底色，一律换成 `.btn-trading-green` / `.btn-primary` / `.btn-trading-red`。

#### Ghost Variant Hover Rules

shadcn `variant="ghost"` defaults to `hover:bg-accent hover:text-accent-foreground`, which renders a **purple** hover background. Purple is reserved for primary/active actions — using it on dismissive or low-priority controls (e.g. "Maybe later", "Cancel", "Skip") creates a misleading affordance.

Rules for `variant="ghost"` buttons (and any custom button using a transparent base):

- **Top nav items** (Events / Resolved / Portfolio / Insights in `EventsDesktopHeader`): use a **subtle purple tint** — `hover:bg-primary/10 hover:text-foreground`. The active state is solid `bg-primary` with primary-foreground text; the hover preview should hint at that brand color without competing with it. Do **not** use `hover:bg-muted/*` here — nav is brand chrome and must signal "this is the brand action".
- **Navigational icon buttons** (header back arrow, close X, menu trigger): the default `hover:bg-accent` (purple) is acceptable — these are interactive chrome.
- **Dismissive / weak actions** (e.g. "Maybe later", "Cancel", "Skip"): override the default with a neutral hover — `hover:bg-muted/40 hover:text-foreground`. Never let purple `--accent` show on these — it creates a misleading affordance that the dismissive option is the primary one.
- **Inside a card / on a tinted surface** (in-card secondary actions): prefer `hover:bg-muted/40` over `hover:bg-accent` so the hover state stays within the surface palette.

Quick decision rule: **brand/navigation → purple tint, opt-out/cancel → muted tint.**


### Status Badges

- **`.status-active`**: Green bg/text/border at 15%/30% opacity
- **`.status-locked`**: Red
- **`.status-pending`**: Yellow

### Filter Pills

- **`.filter-pill`**: Inactive state
- **`.filter-pill-active`**: Primary bg + white text

### Overlays (Dialog / Popover / HoverCard / Drawer)

桌面端弹层选择必须与移动端 `MobileDrawer` 形成明确的对等关系。判定规则：**有"确认按钮"且涉及资金/状态改变 → Dialog**；**就地补充输入或快捷选择，无风险 → Popover**。

| 场景 | 桌面端 | 移动端 |
|------|--------|--------|
| 资金/不可逆确认（平仓、撤单、提现确认、删除等） | `Dialog` 居中模态 + 遮罩 | `MobileDrawer` |
| 表单编辑（编辑 TP/SL、改杠杆、筛选器、设置项等） | `Dialog` 居中模态 | `MobileDrawer` |
| 就地数值快捷调整（订单簿点价、行内数量选择、时间筛选等瞬时操作） | `Popover` 锚定弹出 | `MobileDrawer` 或同 `Popover` |
| 纯信息展示（字段说明、详情预览） | `HoverCard` / `Tooltip` | `Tooltip`（点击触发） |

实施约束：
- 任何"Confirm / Close / Submit / Withdraw / Cancel order"按钮组合都必须包在 `Dialog` 里，不允许用 `Popover` 承载，避免点击外部误关闭丢失上下文。
- 桌面 `Dialog` 与移动 `MobileDrawer` 应复用同一份表单组件（如 `ClosePositionForm` 同时被 `ClosePositionDialog` + `ClosePositionDrawer` 调用），保证两端视觉/逻辑一致。
- **[LOCKED] 移动端零 Dialog 规则**：移动端（`useIsMobile() === true`）**只允许 `MobileDrawer` / `Sheet` / `Popover`**，**禁止**任何 shadcn `Dialog` / `AlertDialog` 直接渲染在移动视口。所有跨端弹层组件（如 `RevokeDialog`、`CreateKeyFlow`）必须以 `useIsMobile()` 分支，桌面走 `Dialog`、移动走 `MobileDrawer`；不允许用同一个 `Dialog` 让 mobile "凑合看"。


### MobileDrawer 内容规范（mobile bottom-sheet content spec）

唯一真相。`/trade` 的 Position Details / Edit TP-SL / Close Position 三个弹窗都按这套基准实现；桌面 `Dialog` 复用同一份表单组件时同样适用。

**容器与间距**

| 项目 | 取值 |
|---|---|
| Drawer 标题区 | 由 `MobileDrawer` 组件自带，正文里不重复 |
| 内容根容器 | `space-y-4`（区块间距 16px） |
| 区块内行间距 | `space-y-2` |
| 同级卡片间隙（多卡并列） | `space-y-3` |

**卡片基底（drawer 内所有信息块统一）**

| 项目 | 取值 |
|---|---|
| 圆角 | `rounded-lg`（统一，禁用 `rounded-md` / `rounded-xl`） |
| 边框 | `border border-border` |
| 背景 | `bg-muted/30`（禁用 `bg-muted/50`、`bg-muted/20`、`bg-muted`） |
| Padding | `p-3`（与 §4 mobile compact 一致） |
| 卡内行间距 | `space-y-1.5` |

**字号体系（混合分层）**

| 角色 | 取值 |
|---|---|
| 区块小标题（"Position" / "Funding"） | `text-xs font-medium text-muted-foreground uppercase tracking-wide` |
| 数据行 label | `text-xs text-muted-foreground` |
| 数据行 value | `text-xs font-mono`（数字/地址永远 `font-mono`） |
| 主表单 label（"Take Profit"、"Quantity"） | `text-sm font-medium` |
| 表单输入正文 | `text-sm font-mono`（数字输入）或 `text-sm` |
| 大数（Net PnL 头部） | `text-2xl font-semibold font-mono`，副数 `text-base ml-2 opacity-80` |

语义色 label（Take Profit 绿、Stop Loss 红）允许保留，但 size/weight 必须按上表 `text-sm font-medium`。

**表单控件**

| 项目 | 取值 |
|---|---|
| 数字/文本输入框 | `h-11 rounded-lg bg-muted border-0 px-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary` |
| Segmented 切换（%/$、模式 chip） | 外壳 `rounded-lg bg-muted p-0.5`，内项 `px-2 py-1.5 text-xs rounded-md` |
| Quick-ratio 按钮（25/50/75/100） | `h-9 text-xs rounded-md`，激活 `bg-trading-red/20 text-trading-red border border-trading-red/40`，未激活 `bg-muted/50 text-muted-foreground border border-transparent` |
| Slider | `Slider` 组件默认尺寸，搭配下方 `text-xs` 行显示当前值 |

**按钮 / 底部 CTA**

| 项目 | 取值 |
|---|---|
| 必须的包裹容器 | `MobileDrawerActions`（所有提交型 drawer 都用，禁止把按钮散在 content 末尾） |
| 主按钮高度 | `h-11`（满足 44px 触控） |
| 按钮组件 | shadcn `<Button>`（禁止裸 `<button>`，保证圆角/字号/disabled 一致） |
| 双按钮布局 | `flex gap-2`；`Cancel` 用 `variant="outline" flex-1`；主操作 `flex-1` |
| 主操作样式 | 编辑/确认 → 默认 primary；不可逆/销毁性（平仓、撤单、删除）→ `bg-trading-red text-white hover:bg-trading-red/90` |
| 主操作文案 | sentence case：`Confirm` / `Save` / `Close all` / `Close N contracts` |
| 单按钮例外 | 仅纯展示型 drawer（如 Position Details 只读）允许无 footer；任何含"提交"语义都必须 Cancel + 主按钮 |

**信息密度规则**

- key-value 列表统一用 `grid grid-cols-2 gap-y-1.5 text-xs`，value 列加 `text-right`
- 解释性 tooltip 触发器统一用 `<Info className="w-3 h-3 cursor-help" />` 跟在 label 右侧
- 图标统一 Lucide：数据行内 `w-3 h-3`；区块小标题内 `w-3 h-3` 前置 + `gap-1.5`

**三种 drawer 类型对照（/trade 场景）**

| 类型 | 代表 | Footer |
|---|---|---|
| Read-only 展示 | Position Details (`PositionDetailContent`) | 无 footer |
| Edit / Confirm | TP/SL 编辑（`PositionCard` 内联 drawer） | `MobileDrawerActions` + Cancel(Outline) + `Confirm`(Primary) |
| Destructive | Close Position (`ClosePositionForm` in drawer) | `MobileDrawerActions` + Cancel(Outline) + `Close …`(Destructive 红) |

**禁止项**

- ❌ `bg-muted/50`、`bg-muted/20` 作 drawer 卡片底
- ❌ `rounded-md` 作信息卡圆角（仅 segmented 内项可用）
- ❌ 主按钮使用裸 `<button>`
- ❌ 提交型 drawer 不带 Cancel
- ❌ 在 drawer 内直接放 `Dialog` 或嵌套 drawer

### Tooltips

Tooltip content is explanatory text and must be visually stable across contexts.

- **Content alignment**: Always use left-aligned text inside tooltip popups, even when the trigger sits in a right-aligned table column.
- **Trigger alignment**: The trigger/header may align with its parent column (`justify-end` for numeric table columns), but popup copy must not inherit that alignment.
- **Standard classes**: `text-left text-xs leading-relaxed max-w-72`.
- **Multi-line content**: Use vertical spacing (`space-y-1`) for grouped explanations. Do not center-align or right-align multi-line explanatory copy.
- **Exception rule**: Any non-left-aligned tooltip must include an explicit component-level reason; do not rely on inherited text alignment.

### Option Chips

- **`.option-chip-active`**: Primary border + subtle primary bg
- **`.option-chip-inactive`**: Muted bg, transparent border

### Pagination Dots

Used by any horizontal carousel (campaign banners, settlement carousels, onboarding, future product carousels). It is a **product-level component** — never re-themed per slide or per campaign.

| State | Width | Height | Background | Notes |
|---|---|---|---|---|
| Active | `w-6` | `h-1.5` | `bg-primary` | Always primary, regardless of slide content |
| Inactive | `w-1.5` | `h-1.5` | `bg-muted-foreground/40` | Hover: `bg-muted-foreground/60` |

- Container: `flex justify-center gap-2 mt-3`
- Shape: `rounded-full`
- Transition: `transition-all duration-200`
- Aria: each dot is a `<button>` with `aria-label="Go to slide N"`

Do NOT swap the active color for theme/brand accents (gold, violet, green) — pagination is chrome, not content.

---

## 6. Address & Hash Truncation

**Unified standard: First 6 + Last 6** — applies to ALL contexts (addresses, tx hashes, UIDs, oracle proofs, contract addresses).

| Input | Displayed |
|-------|-----------|
| `0x1234567890abcdef1234567890abcdef12345678` | `0x1234...345678` |
| `0xabc123def456...` (any hash) | `0xabc1...ef4567` |

- Always `font-mono`
- Use `<AddressText address={hash} truncate />` component (default `truncateLength=6`)
- On mobile: add `max-w-[200px] truncate` if needed
- **Do NOT** use other truncation lengths (8+5, 10+6, 14+10, 6+4) — they have been eliminated

### Security: Color-Coded Address Display

For full deposit address displays (e.g., `FullAddressSheet`), apply color differentiation:
- **Digits (0–9)**: `text-primary` (purple)
- **Letters (a–f)**: `text-foreground` (white)

This prevents character confusion (e.g., `6` vs `b`, `0` vs `O`).

---

## 7. Trading Patterns

### Trading Color Semantics

| Color | Token | Meaning |
|-------|-------|---------|
| Green | `text-trading-green` | Profit, Buy/Long, Success |
| Red | `text-trading-red` | Loss, Sell/Short, Error |
| Yellow | `text-trading-yellow` | Warning, Pending |
| Purple | `text-trading-purple` | Brand emphasis, Active state |

### Account Risk Indicator (4-Tier)

Formula: `Risk Ratio = Initial Margin / Equity × 100` where `Equity = Balance + Unrealized PnL`

| Tier | Range | Color | Behavior |
|------|-------|-------|----------|
| SAFE | < 80% | `trading-green` | Normal trading |
| WARNING | 80–95% | `trading-yellow` | Reduce positions suggested |
| RESTRICTION | 95–100% | `trading-red` | Close-only mode |
| LIQUIDATION | ≥ 100% | `trading-red` + `animate-pulse` | Forced liquidation |

### Order Status Badges

| Status | Colors |
|--------|--------|
| Pending | `bg-amber-500/20 text-amber-400` |
| Partial Filled | `bg-cyan-500/20 text-cyan-400` |
| Filled | `bg-trading-green/20 text-trading-green` |
| Cancelled | `bg-trading-red/20 text-trading-red` |

### Option Chips

Use `<OptionChips>` component for event option selection:
- Active: `option-chip-active` (primary border + bg)
- Inactive: `option-chip-inactive` (muted bg, transparent border)
- Always show price in `font-mono` next to label

### Event Category Badges

Use `CATEGORY_STYLES` from `@/lib/categoryUtils` — never hardcode category colors:
```tsx
import { CATEGORY_STYLES, getCategoryFromName } from "@/lib/categoryUtils";
```

### Single-Market Binary Trade Toggle

桌面/移动的 Trade 面板里，binary 单 market 事件的 Yes/No 切换器规范：

> **前置规则 — 不渲染 Market / Option 选择行**：单 market binary 事件**不得**在事件 header 下方追加 `Market: X or Y` 标签行，也不渲染 `Select Option:` chip。对阵信息已由事件标题（"UFC 316 Headliner: Pereira vs Ankalaev?"）+ Trade 面板内 Yes/No 切换器的 `binaryLabels` 表达，重复一行只会浪费纵向空间。多 outcome 事件（总统大选、多队冠军等）才保留 `Select Option:` chip 行。


- **容器**：`grid grid-cols-2 gap-2 p-1 bg-muted/30 rounded-lg`（独立卡片岛，与外层 Trade 面板背景区分）
- **按钮**：`relative flex flex-col h-full rounded-md overflow-hidden`，**不固定高度**，由内容驱动；`h-full` 配合 grid 默认 `items-stretch` 保证两侧外壳等高
- **上层 label 区**：
  - `relative flex-1 flex items-center justify-center min-h-[24px] py-1.5 px-2`
  - **必须** `flex-1`：一侧因 `line-clamp-2` 换行变高时，另一侧的 label 区会自动伸展填满剩余空间，两侧视觉等高
  - 文案 `text-[11px] font-semibold leading-tight line-clamp-2 text-center`
  - 选中 Yes → `bg-trading-green text-trading-green-foreground`
  - 选中 No → `bg-trading-red text-foreground`
  - 未选中 → `bg-muted text-muted-foreground hover:bg-muted/80`
  - 选中态右上角加 `absolute top-1 right-1 w-1 h-1 rounded-full bg-current shadow-[0_0_4px_currentColor]` 圆点
- **下层 price 区**（固定 `h-[22px]`，与上层用 `border-t` 分隔）：
  - 文字 `text-[11px] font-mono`
  - 选中 Yes → `bg-trading-green/85 text-trading-green-foreground border-black/20`
  - 选中 No → `bg-trading-red/85 text-foreground border-black/20`
  - 未选中 → `bg-muted-foreground/15 text-foreground/80 border-border/40`

**高度自适应原则**：短标签（默认 Yes / No）保持紧凑（≈ 48px 总高），长标签（如 "Magomed Ankalaev"）`line-clamp-2` 撑到两行（≈ 62px 总高）。**两侧必须等高**：通过 `grid items-stretch`（默认）+ 按钮 `h-full` + 上层 `flex-1` 三层叠加实现——一侧变高，另一侧 label 区自动拉伸填齐，价格条始终对齐。**严禁**给按钮硬编码 `h-14` / `h-16`，也**严禁**省略 `flex-1` 或 `h-full`（否则短标签那侧会出现底部空隙、参差不齐）。

**sideLabels 别名传播规则**：事件配置了 `sideLabels`（体育队名等）时，所有展示"方向"的 UI 必须显示别名而非 Yes/No——包括 Trade 面板切换按钮（`binaryMode.yesLabel/noLabel`）、提交按钮（`getIntentLabel(intent, side, sideLabels)`）、OrderPreview Side 字段、TradingCharts 方向 chip/图例。持仓与订单卡片：当 `displayOption` 已渲染别名（判定 `displayOption !== option && (option === "Yes" || option === "No")` → `isBinaryAlias`）时，**禁止**再挂冗余 Yes/No 侧别 chip；详情面板里 "Yes/No + leverage" 应替换为 "alias + leverage"。

**Desktop `/trade` 同样适用**：(1) 当前事件作用域——Trade 提交按钮、Order Preview 确认按钮、Preview 顶部 side chip、`orderDetails` 的 Side 字段必须通过 `getIntentLabel(..., isBinarySingleMarket ? binaryLabels : undefined)` 或 `resolveBinarySideLabel(...)` 渲染别名。(2) 跨事件聚合表（Open Orders / Positions / Airdrops 的 side 列、Close Position Dialog 的 Position 行、Cancel Order AlertDialog 的 Order Type 行）需通过 `useEventSideLabelsLookup()` 按行的 `event` 名解析对应 sideLabels；非 single-market binary 或 lookup 失败时回退 Yes/No。**禁止**在 desktop 任何 binary 方向位置硬编码 `"Yes" / "No"` 字面量。

---

### API Surface — Two-Layer Structure (LOCKED)

Open API v1 采用行业标准的两层结构，禁止合并为单页：

| 层 | Path | 定位 | 骨架 |
|----|------|------|------|
| 1. 门户 | `/developers` | 介绍 + 入口（对标 Binance /binance-api、Bybit developer 页） | Marketing (`EventsDesktopHeader` / `MobileHeader` + `SeoFooter`)，Hero + 能力三卡 + 三层权限概览 + Quickstart 代码块 + Reference 资源卡 + Footer CTA |
| 2. 配置 | `/settings/api` | Key 自助管理 | §4 Layout Wide + `<PageHeader>` 标题块（`max-w-7xl mx-auto px-8 py-10`），去程靠 `/developers` 的 CTA，无正文面包屑 |

**LOCKED**：
- 门户 Hero CTA 必须包含主 `Manage API Keys → /settings/api` + 次 `Read the Docs`
- 配置页三层 tier 卡等高（`items-stretch` + `h-full` + `flex-1`），已满足层用 `border-primary/40` + gradient tint 强调
- 配置页空态**收敛**成 `max-w-sm mx-auto` 虚线卡（图标 + 一句副文 + Create 按钮），**禁止**占满整个下半屏
- 两层文案统一保密红线：不提对冲 / 做市成本 / 内部撮合结构，只讲交易者视角

---




## 8. Wallet & Transaction Patterns

### Transaction Status Config

| Status | Icon | Color | Animation |
|--------|------|-------|-----------|
| pending | `Clock` | `text-trading-yellow` | — |
| processing | `Loader2` | `text-trading-yellow` | `animate-spin` |
| completed | `CheckCircle2` | `text-trading-green` | — |
| failed | `XCircle` | `text-trading-red` | — |
| cancelled | `AlertCircle` | `text-muted-foreground` | — |

### Transaction Card Layout (compact summary card)

```
flex items-center justify-between p-3 bg-card rounded-lg border border-border/50
```

- Left: Icon (colored circle) + amount + description
- Right: Status badge

### Transaction History Row Spec

Used in `/wallet` Transaction History list (`TransactionHistory.tsx`). Rows live inside a `bg-card border border-border/50 rounded-xl divide-y divide-border/30` container; each row is `p-4` and becomes `cursor-pointer hover:bg-muted/30` when `hasDetails(tx)` is true (txHash / non-completed status / network / fee / sourceChain / destChain).

**Shared atoms**

- Icon disc: `w-10 h-10 rounded-full flex items-center justify-center shrink-0`, background = `getTransactionBgColor(tx)` (e.g. `bg-trading-green/20`, `bg-trading-red/20`, `bg-blue-500/20`)
- Description: `text-sm font-medium truncate` (sentence case, see §3.5)
- Amount: `text-sm font-semibold font-mono shrink-0`, green if `>= 0` (with `+` prefix), red otherwise; absolute value formatted as `$1,234.56`
- Type badge (only for `cross_chain_in`, `cross_chain_out`, `fiat_buy`, `fiat_sell`): `inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] font-semibold whitespace-nowrap`, colors from `TYPE_BADGE_CONFIG`
- Status icon (only when `status !== 'completed'`): `w-3.5 h-3.5 shrink-0` from `STATUS_CONFIG`, `processing` adds `animate-spin`
- Chevron (only when row is expandable): `w-4 h-4 text-muted-foreground transition-transform`, `rotate-180` when expanded

**Desktop (`!isMobile`) — single line**

```
[icon]  Description  [badge?] [status?]              date     amount  chevron?
```

- Outer: `flex items-center justify-between`
- Left cluster: `flex items-center gap-3 min-w-0 flex-1` containing icon + a `min-w-0 flex-1` text block where the first row is `flex items-center gap-2` (description / badge / status) and the second row is `text-xs text-muted-foreground` date
- Right cluster: `flex items-center gap-2 shrink-0` containing amount + chevron

**Mobile (`isMobile`) — two layers**

```
[icon]  Description                                       amount
        date · [badge?] · [status?]                       chevron?
```

- Row 1: `flex items-center gap-3` → icon + `text-sm font-medium truncate flex-1 min-w-0` description + amount (`shrink-0 text-right`)
- Row 2: `flex items-start justify-between gap-2 mt-1 pl-[52px]` (52px = 40px icon + 12px gap, keeps the secondary line aligned to the description)
  - Left: `flex items-center flex-wrap gap-1.5 text-xs text-muted-foreground min-w-0` containing date, optional badge, optional status icon
  - Right: chevron with `shrink-0 mt-0.5`

**Expanded details panel** (`isExpanded && hasDetails(tx)`): `mt-3 pt-3 border-t border-border/30 space-y-2`, left padding `ml-[52px]` on desktop / `pl-[52px]` on mobile so it aligns under the description. Each detail row is `flex items-center justify-between text-sm` with `text-muted-foreground` label and value styled per type (hashes/fees `font-mono`, explorer link `text-primary hover:underline` + `<ExternalLink className="w-3 h-3" />`).

**Do / Don't**

- ✅ Always render amount on the first visual line so it never gets squeezed under badges or spinners
- ✅ Keep the secondary metadata (date / badge / status) on its own line on mobile
- ❌ Don't put the type badge or spinner inline with the description on mobile — at 390px the description gets truncated to `Bri...` and badges overlap the amount
- ❌ Don't drop the `pl-[52px]` alignment on mobile rows 2 / expanded panel — losing it breaks the icon-anchored visual rhythm

### Vertical Stepper

Used in withdrawal flow and deposit tracking:
- Completed steps: `bg-trading-green border-trading-green` with `CheckCircle2` icon
- Current step: `bg-trading-yellow/20 border-trading-yellow` with spinning `Loader2`
- Pending steps: `bg-muted border-border` with step number
- Connector line: `w-0.5 h-8` — green if previous step completed, `bg-border` otherwise

### Block Confirmations

- In-progress: Yellow-themed card with `animate-pulse` progress bar
- Completed: Green-themed card with full progress bar
- Format: `{current}/{required}` in `font-mono`

### Explorer Link Pattern

- Always `font-mono` for hashes
- Truncate: `hash.slice(0, 8)...hash.slice(-5)` (Wallet convention, differs from transparency 10+6)
- Include `<ExternalLink className="h-3 w-3" />` icon
- Use `text-primary hover:underline`

---

## 9. Deposit & Withdraw Patterns

### Chain & Token Logos

- Always use official SVGs from `/chain-logos/` and `/token-logos/`
- Standard size: `w-5 h-5` (inline), `w-8 h-8` (selector)
- **Never** use emoji, text, or generic icons for chains/tokens

### Deposit/Withdraw Typography

| Element | Spec |
|---------|------|
| Section title | `text-base font-semibold` (16px) |
| Card label (From / To) | `text-sm text-muted-foreground` (14px) |
| Amount input | `text-2xl font-mono` (24px) |
| Token selector text | `text-sm font-medium` (14px) |
| Chain name in selector | `text-xs text-muted-foreground` (12px) |
| Quote detail label | `text-xs text-muted-foreground` (12px) |
| Quote detail value | `text-xs font-mono` (12px) |
| Balance display | `text-xs font-mono` |
| Result amount | `text-3xl font-mono font-bold` |
| CTA button | `text-sm font-semibold` (14px) |
| Powered by footer | `text-[10px] text-muted-foreground` |

### Swap Card Layout

- **From card**: `rounded-xl border border-border/50 bg-muted/20 p-4`
- **Arrow divider**: `w-9 h-9 rounded-lg bg-card border border-border/50` with `ArrowDown` icon, centered `-my-2 relative z-10`
- **To card**: `rounded-xl border border-primary/30 bg-primary/5 p-4`

### Quote Detail Rows

```
flex justify-between text-xs text-muted-foreground
```
- Values: `font-mono`
- Free/zero fees: `text-trading-green`

### Powered By Footer

```html
<p className="text-[10px] text-center text-muted-foreground">
  Powered by <span className="font-semibold">SOCKET</span>
</p>
```

---

## 10. Mobile Patterns

### Logo Usage

| Context | Size | Notes |
|---------|------|-------|
| MobileHome, EventsPage headers | `md` (h-5) | Left-aligned, no back button |
| Trade pages | — | Logo hidden, back button only |
| Detail pages with back button | `md` | Back + Logo together |
| Desktop navigation | `xl` (h-8) | Left side of top nav |
| Marketing / landing pages | `xl` (h-8) | Hero sections, footers |

Logo rules:
- Always use `<Logo>` component from `@/components/Logo`
- On light backgrounds: use `className="invert"` or wrap in dark container
- Never stretch, add effects, or use raw SVG import

### Page Type Classification

| Type | Back Button | Logo | Examples |
|------|------------|------|----------|
| Functional | Never | Yes | `/`, `/events`, `/leaderboard`, `/portfolio` |
| Operational (Logo) | Yes | Yes | `/trade/:id`, `/resolved/:id` |
| Operational (No Logo) | Yes | No | `/deposit`, `/withdraw`, `/settings` |
| SEO / Marketing sub-page | Yes | No | `/about`, `/faq`, `/insights`, `/methodology`, `/developers`, `/glossary`, `/hedge`, `/transparency`, `/privacy`, `/terms` |

### Mobile Header Presets

The mobile `<MobileHeader>` component has **three canonical presets**. Pick one based on the page type above — never invent a fourth.

| Preset | `showLogo` | `showBack` | `title` | Visual | When to use |
|--------|------------|-----------|---------|--------|-------------|
| **A. Home / hub** | `true` | `false` | optional | Logo left-aligned, no back arrow | Top-level functional pages reachable from bottom nav: `/events`, `/portfolio`, `/leaderboard`, `/wallet` (when nav-rooted) |
| **B. Functional inner page** | `false` | `true` | required, centered | Back arrow ← centered title | Operational flows the user enters from another screen: `/settings`, `/deposit`, `/withdraw`, `/rewards`, `/trade/:id`, `/resolved/:id`, `/portfolio/airdrops`, `/portfolio/settlements` |
| **C. SEO / marketing sub-page** | `false` | `true` | required, centered | Back arrow ← centered title | Content & marketing pages: `/about`, `/faq`, `/glossary`, `/insights`, `/methodology`, `/developers`, `/hedge`, `/transparency`, `/privacy`, `/terms` |
| **D. Home (Preset A + Equity Hero)** | `true` | `false` | n/a | Standard Preset A header + non-sticky `<HomeEquityHero>` card as first body section | **Only `/` (MobileHome).** Header is identical to Preset A — KPI lives in a separate Hero card, not the header. See "Preset D · Home Equity Hero Spec" below. |

Preset C is identical in chrome to Preset B — the distinction matters because SEO pages are routed to from search engines & footer links, so the back button **must** still render even when there is no in-app history (the component handles fallback navigation to `/`).

#### Examples

```tsx
// Preset A — home / hub (only the very few nav-rooted pages)
<MobileHeader title="Events" showLogo={true} showBack={false} />

// Preset B — functional inner page
<MobileHeader title="Settings" showLogo={false} showBack={true} />
<MobileHeader title="Wallet"   showLogo={false} showBack={true} />

// Preset C — SEO / marketing sub-page
// In practice, prefer <SeoPageLayout title="..."> which wires this preset for you:
<SeoPageLayout title="OmenX Insights" description="...">
  {children}
</SeoPageLayout>

// Equivalent raw usage (only when SeoPageLayout is unsuitable, e.g. /hedge):
<MobileHeader title="Hedge-to-Earn" showLogo={false} showBack={true} />
```

#### Do / Don't

✅ **Do**
- Use `<SeoPageLayout>` for any new SEO / marketing sub-page — it locks in Preset C automatically.
- Always set `showBack={true}` on SEO pages, even when the page is occasionally linked from in-app surfaces. Search-engine entry traffic has no history stack.
- **功能内页 / SEO 页的 `<MobileHeader>` 必须显式 `showBack={true}`**——不依赖 `navigationType` 或历史栈自动判定。直接 URL/刷新进入时自动判定会让 back 箭头消失。Preset B/C 一律显式声明。
- Center the title; keep it short (≤ 24 chars) so it renders on a single line at 375 px width.
- Match the page's `<title>` / `h1` tag with the `MobileHeader` `title` prop for consistency.

❌ **Don't**
- Don't use `showLogo={true}` on SEO / marketing sub-pages (e.g. `/hedge`, `/about`). The Logo is reserved for top-level hub pages — putting it on every marketing page makes the app look like it has many disconnected entry points.
- Don't omit `showBack` on an SEO page just because the desktop version doesn't need it. Mobile users arriving from Google must be able to navigate up.
- Don't replace the standard back arrow with a custom button, or stack a Logo + back button + title in the SEO preset — that breaks visual rhythm with `/about`, `/faq`, `/glossary`, etc.
- Don't introduce a new preset combination (e.g. `showLogo={true} showBack={true}`) for marketing pages. If a page genuinely needs custom chrome, build a dedicated marketing header (see `/leaderboard`) rather than overloading `MobileHeader`.

### Mobile Header `rightContent` 规范

**关键规则：EventsPage 与 ResolvedPage 的移动端 Header 右上角必须使用 `MobileStatusDropdown` 组件**，允许用户通过下拉菜单在 "Active" 和 "Resolved" 之间切换页面。**严禁**替换为普通按钮、图标链接或其他自定义 UI。

| Page | rightContent | Component | Behavior |
|------|-------------|-----------|----------|
| EventsPage (`/events`) | Status dropdown | `<MobileStatusDropdown statusFilter="active" />` | 选择 "Resolved" → `navigate("/resolved")` |
| ResolvedPage (`/resolved`) | Status dropdown | `<MobileStatusDropdown statusFilter="resolved" />` | 选择 "Active" → `navigate("/events")` |

- 组件来源：`import { MobileStatusDropdown } from "@/components/EventFilters"`
- 两个页面的行为必须**镜像对称**，保持一致体验
- 修改这两个页面的 Header 时，必须先确认此规范

### Preset D · Home Equity Hero Spec (`<HomeEquityHero>`)

**唯一使用页面：`/` (MobileHome)。其他页面严禁复用此组件。**

Preset D **不是**一个 header 变体。`/` 的 header 直接用标准 Preset A (`<MobileHeader showLogo showBack={false} rightContent={...} />`)，与 `/events`、`/portfolio`、`/leaderboard`、`/wallet` 完全一致。Total Equity KPI 拆出来作为 `<main>` 内的第一张 Hero 卡 `<HomeEquityHero>`，**不 sticky**，随页面滚动消失。

设计意图：把 KPI 的"大气"承载放在卡片层，让它能用大字号 + gradient 而不挤压 sticky header 高度；同时 `/` 的 header 与其他 hub 页面 100% 对齐，规范负担最低。

#### 结构

```text
┌──────────────────────────────────────────────────────┐
│ [Logo md + Mainnet]              Discord 🌐 🔔      │  ← Preset A header (sticky)
├──────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────┐ │
│ │ TOTAL EQUITY                                     │ │  ← <HomeEquityHero> (not sticky)
│ │ $13,530.00                                       │ │
│ │ +$34.56  ·  7D +1.9%                             │ │
│ └──────────────────────────────────────────────────┘ │
│ [Onboarding strip]                                   │
│ [Airdrop strip]                                      │
│ [Campaign banner carousel]                           │
│ [HomeAccountHub / HomeDiscover / HomeMore]           │
└──────────────────────────────────────────────────────┘
```

未登录态：Hero 卡内容替换为 CTA "Sign in to start trading"，外壳样式不变。

#### 锁定的 token（不要再改）

| Slot | Token | 备注 |
|------|-------|------|
| 容器 | `rounded-2xl border border-border/40 bg-gradient-to-br from-trading-green/[0.04] via-card/40 to-card/20 px-5 pt-5 pb-5` | 极淡绿色径向感，不引入新色 |
| Label "Total equity" | `font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground` | sentence case |
| 主数字 | `font-mono text-[40px] font-bold tracking-tight leading-none text-foreground mt-2` | **最大 40px**——超过会顶到 header |
| Meta 行容器 | `mt-3 flex items-center gap-2.5 font-mono text-[12px]` | 单行 |
| Meta · 今日 PnL | `font-semibold text-trading-green/red` | 含正负号 |
| Meta · 分隔点 | 字符 `·`，`text-muted-foreground/40` | |
| Meta · 7D | `font-semibold text-muted-foreground` 前缀 + 内嵌 `text-trading-green/red` 的百分比 | |
| 未登录 CTA | 同容器 + `border-trading-green/30 from-trading-green/[0.08]` | 卡内放 label + 大字 CTA + ChevronRight |

#### Props 契约

```tsx
interface HomeEquityHeroProps {
  onLogin: () => void;            // 未登录态 CTA
  todayPnL?: string;              // "+$34.56"
  weeklyPnLPercent?: string;      // "+1.9%"
}
```

数据源：`useAuth()` 判断登录态，`useUserProfile().profile.balance` 取余额。**不要** hardcode 余额值。

#### Header 行为

- `MobileHome.tsx` 必须使用 `<MobileHeader showLogo showBack={false} rightContent={headerActions} />`
- `headerActions` 包含 Discord / Globe / Bell 三个图标按钮，沿用现有实现
- Mainnet 标识由 `<Logo>` 默认 `showMainnetBadge={true}` 自然带出，**不要**在 header 里加自定义胶囊

#### Do / Don't

✅ **Do**
- 想"再大气一点" → 调 Hero 卡的 token（数字字号 / gradient 强度 / padding），不要碰 header
- 任何视觉调整必须先改本规范 → 再改 StyleGuide playground → 再改组件
- Hero 卡保持单一职责：只展示 Total Equity + 当日 PnL + 7D %

❌ **Don't**
- 不要把 `<HomeEquityHero>` 用到其他页面——它是 `/` 专属
- 不要把 KPI 重新塞回 header（即使 sticky 看起来更好）——拆分是规范决策
- 不要在 Hero 卡里加 Available / Locked / Trial Bonus / 持仓数等副指标——它们属于 `<HomeAccountHub>`
- 不要把 Onboarding / Airdrop / Campaign banner 合并进 Hero 卡——保持三层堆叠独立
- 不要给数字加 shadow / glow / 动效

修改 Hero 卡前，先 review StyleGuide → Mobile Patterns → "Header Preset D" playground，确保规范与实现同步。

### Mobile Bottom Nav

- Safe area: `--safe-area-bottom: 5rem`
- Content padding: `pb-safe` to avoid bottom nav overlap

---

## 11. User Identity

### Username Generation

- Library: `sillyname`
- Format: `sillyname().replace(/ /g, '_')` → e.g., "Fluffy_Bunny"

### Default Avatars

- Provider: DiceBear `adventurer-neutral` style
- API: `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed={seed}&backgroundColor={bg}`
- Use `generateAvatarUrl()` and `getRandomAvatarUrl()` from `@/hooks/useUserProfile`

---

## 12. Forms & Tables

### Form Validation

- Schema: Zod (`z.object(...)`)
- Integration: `react-hook-form` with `zodResolver`
- Error display: `<FormMessage />` component

### Table Patterns

- Use `<Table>` components from `@/components/ui/table`
- Numeric columns: `font-mono`
- PnL values: Color by sign (`text-trading-green` / `text-trading-red`)
- Status cells: Use trading status badges
- Selection: `<Checkbox>` with `data-state="selected"` row styling

---

## 13. Animations

| Animation | Class | Duration | Usage |
|-----------|-------|----------|-------|
| Fade in | `animate-fade-in` | 0.3s | Content appearing |
| Slide up | `animate-slide-up` | 0.4s | Cards entering |
| Scale in | `animate-scale-in` | 0.2s | Modals, popovers |
| Pulse soft | `animate-pulse-soft` | 2s loop | Live indicators |
| Enter | `animate-enter` | 0.3s | Combined scale + translate |

### Order Book Flashes

- Price increase: `flash-update-green` (0.5s)
- Price decrease: `flash-update-red` (0.5s)
- New trade: `flash-new-trade` (0.8s)

### Web3 Card Glow

- `.web3-card`: Animated gradient border + radial glow
- `.web3-card-intense`: Higher opacity/intensity variant
- Animations: `gradient-rotate` (4s) + `glow-pulse` (3s)

---

## 14. Do / Don't

### ✅ Do

- Use semantic Tailwind tokens (`bg-card`, `text-muted-foreground`, `text-trading-green`)
- Use Typography components for all numerical displays
- Apply `font-mono` to every number, hash, and address
- Use `camelCase` for all data field labels in transparency/audit pages
- Use `Title Case` for section headers and page titles
- Keep all buttons' text white on colored backgrounds
- Use `.trading-card` / `.stats-card` for all product-page main cards — see §5 Cards 强制条款 for the full rule and exception list
- Use official chain/token SVG logos from `/chain-logos/` and `/token-logos/`
- Use `<Logo>` component — never raw SVG imports
- Use `CATEGORY_STYLES` for event category badges
- Use `STATUS_CONFIG` pattern for transaction status badges

### ❌ Don't

- Use raw colors (`bg-gray-900`, `text-white`, `#7c3aed`)
- Mix `Title Case` and `camelCase` within the same data-row list
- Use `font-sans` for prices, amounts, or percentages
- Use `font-mono` for descriptive text or labels (except on-chain field names)
- Create custom color classes — add to `index.css` tokens instead
- Use light mode colors — the app is dark-only
- Hardcode pixel values for spacing — use Tailwind scale
- Use emoji or generic icons for chain/token logos
- Stretch, add effects to, or modify the OMENX logo
- Place white logo on light backgrounds without `invert`
- **Render the site-wide navigation header (`EventsDesktopHeader` / `MobileHeader` w/ Logo) on any trading page.** All trading terminals — perp (`/trade`) and spot (`/spot`) — share the full-screen terminal chrome: back arrow + event title + red-pulse countdown + right-side stat cluster + watchlist star. A trading page rendered inside the standard app shell is a regression; fix it, don't ship it.
- **Build a spot page as a "simplified" generic layout.** `/spot` = `/trade` minus the perp-only surfaces. Removed on spot: Margin Mode, Leverage, TP/SL, Funding Rate, Next Funding, Open Interest, Index Price, Liq. price, Margin req. Everything else (chart, order book, recent trades, Y/N ratio, positions/orders tabs, Account panel) is reused. Never re-implement a spot page from a bare `<main>` template.
- **Spot terminal header information architecture is LOCKED (final spec).** Layout: **left** = back arrow + ticker badge + event name + `SPOT` badge + lifecycle badge, followed by a **single** countdown row `● Trading ends in {countdown} · until {HH:MM} ET` with a trailing ⓘ that reveals the full schedule (Opens / Trading ends / Official close / Credits by / Your time). **Right** = exactly three stats: `Volume`, `Base ({priorDate} close)`, `{TICKER} $price ±% [· pre-mkt|after-hrs]`. Don'ts: never add a second time row under the countdown (no "Settles at HH:MM ET · credits by …" strip — that info lives in Event Info and the order-confirmation summary); never surface the Yes-price outcome in header stats (Trade panel + chart already own it); never render non-English characters in the header (no `北京` chip, no Beijing timezone label — the user's local time appears only inside the ⓘ tooltip and is auto-detected from the browser); never label volume `24h Volume` (event lifecycle is intraday — just `Volume`).


---

## 15. 移动端卡片一致性规范（Mobile Card Consistency）

Active（`MarketCard`）和 Resolved（`ResolvedEventCard`）移动端卡片 **必须** 共享以下设计 token，禁止使用 `<Card>` 组件的默认样式：

| Token | Value | Notes |
|-------|-------|-------|
| 外壳 | raw `<div>` + `rounded-xl border border-border/40 p-4` | 不使用 `<Card>`/`<CardHeader>`/`<CardContent>` |
| 背景 | `linear-gradient(165deg, hsl(222 35% 11%) 0%, hsl(225 40% 7%) 100%)` | inline style |
| 标题 | `text-sm font-semibold text-foreground leading-snug line-clamp-2 mb-3` | 不用 `text-[15px]` |
| 顶行 | 左侧 badges（Category + 状态），右侧时间信息 | `mb-2` |
| hover | `hover:border-primary/40`，无 glow | 移动端不需要发光效果 |
| 底部分隔 | `mt-2 pt-2 border-t border-border/20` | Volume 等附加信息 |

**禁止**：在移动端卡片中使用 `<Card>` 组件（其默认 `p-6` 和 `rounded-lg` 会破坏一致性）。

---

## 16. 移动端列表页规范（Mobile List Page Pattern）

### 页面头部

移动端标题一律由 `<MobileHeader>` 顶栏承担（Preset A/B/C，见 §10 Mobile Header Presets），**正文不再渲染 `<PageHeader>`**（`<PageHeader>` 是桌面-only 组件，见 §4 Page Title Block）。移动端主内容区从筛选/Tabs 直接开始。

```
┌─────────────────────────────────────┐
│  <MobileHeader>  (顶栏，sticky)      │
├─────────────────────────────────────┤
│ [Tabs / Filter row（如有）]           │
│ [Content]                            │
└─────────────────────────────────────┘
```

| 元素 | 规范 | 备注 |
|------|------|------|
| 顶栏标题 | 由 `<MobileHeader>` 渲染（Preset A/B/C） | 不在正文重复标题 |
| 筛选按钮 | 若不放进 MobileHeader `rightContent`，则在正文首行 `flex justify-end` 独立一行 | 点击弹出 `MobileDrawer` |
| Tabs | 在筛选行下方独立一行 | 不与筛选按钮同行 |

### 页面实现对照

| Page | 标题 | 副标题 | Tabs | Filter Drawer |
|------|------|--------|------|---------------|
| EventsPage (`/events`) | Active Events | Browse and trade live prediction markets | `EventTabs` | `MobileActiveFilterDrawer` |
| ResolvedPage (`/resolved`) | Resolved Events | View results from all completed prediction events | 无 | `MobileResolvedFilterDrawer` |

### 筛选 Drawer 规范

所有移动端列表页面的筛选 **必须** 收进 Drawer，不允许在页面内平铺筛选控件。

| 元素 | 规范 | 备注 |
|------|------|------|
| 活跃筛选计数 | 筛选按钮右上角圆形 badge 显示活跃筛选数量 | `bg-primary text-primary-foreground` |
| Drawer 内部 | 各筛选项使用 label + 控件垂直排列，底部 Reset + Apply 按钮 | `space-y-6` |

**禁止**：
- 在移动端页面平铺 `<Select>`、`<Input>` 等筛选控件
- 列表页头部缺少标题或副标题
- 筛选按钮使用非 Drawer 的交互方式

---

## 16.5 全站统一 Footer 规范（Site-wide Footer）

所有内容页、营销页、详情页（包括但不限于 `/hedge`、`/about`、`/faq`、`/transparency`、`/glossary`、`/methodology`、`/developers`、`/privacy-policy`、`/terms-of-service`）**必须** 使用统一的 `<SeoFooter />` 组件，禁止任何页面创建自定义 footer。

### 唯一 Footer 组件

| 项目 | 规范 |
|------|------|
| 组件路径 | `src/components/seo/SeoFooter.tsx` |
| 引用方式 | `import { SeoFooter } from "@/components/seo/SeoFooter"` |
| 容器样式 | `border-t border-border/30 bg-card/50 mt-auto` |
| 内容容器 | `max-w-7xl mx-auto px-6 py-10` |

### 桌面端布局（5 列网格）

```
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│  Brand   │ Platform │  Learn   │  Legal   │ Connect  │
│ Logo XL  │  Events  │   More   │ Privacy  │  X / DC  │
│ + Desc   │ Resolved │ About …  │ Terms    │ Email    │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

| 列 | 内容 |
|----|------|
| Brand | `<Logo size="xl" />` + 60 字以内描述（`max-w-[200px] text-xs text-muted-foreground`） |
| Platform | Events / Resolved / Leaderboard / Insights |
| Learn More | About / FAQ / Glossary / Methodology / On-Chain Transparency |
| Legal | Privacy Policy / Terms of Service |
| Connect | X + Discord 图标 + `support@omenx.com` |

### 移动端布局

- Brand 区始终常驻（顶部）
- 链接列折叠为手风琴（Accordion，`<FooterAccordion />`），点击展开
- Connect 区（社交图标 + Email）始终展示，不折叠

### 官方账号清单（不允许任何页面自定义）

| 平台 | 官方链接 |
|------|----------|
| X (Twitter) | `https://x.com/OmenX_Official` |
| Discord | `https://discord.gg/qXssm2crf9` |
| Email | `support@omenx.com` |

### 底部栏

```
© 2026 OmenX. All rights reserved.
For informational purposes only. Not financial advice. Trading involves risk of loss.
```

样式：`border-t border-border/20 mt-8 pt-6 flex flex-col items-center gap-1.5 text-center`

### 禁止

- ❌ 任何页面创建自定义 `<Footer>` / `<XxxFooter>` 组件
- ❌ 在 footer 中使用未列入官方账号的社交链接（例如 `x.com/omenxfi`、Telegram 个人账号等）
- ❌ 跳过版权行或风险提示行
- ❌ 修改 5 列结构（必须 Brand + Platform + Learn More + Legal + Connect）

---

## 16. File References

| File | Contains |
|------|----------|
| `src/index.css` | All CSS custom properties, component classes, animations |
| `tailwind.config.ts` | Token → Tailwind class mappings, keyframes |
| `src/components/typography/` | PriceText, PercentText, AmountText, AddressText, MonoText, LabelText |
| `src/lib/categoryUtils.ts` | Event category styles and badge mappings |
| `src/components/Logo.tsx` | Logo component with size variants |
| `src/hooks/useUserProfile.ts` | Avatar generation utilities |
| `/style-guide` | Interactive playground for all design tokens |

---

## 16.1 Style-Guide Truth Rule (LOCKED)

`/style-guide` is a spec surface, not marketing. Any page module with ≥2 visual states MUST be showcased there by **importing the real production component** and driving it with mock props — never with hand-rolled lookalike cards. Every distinct state (empty / loading / error / loaded, wizard step, validation error, copied toast, active/revoked, tier eligible/manual/locked, etc.) must be present, labeled with `<PlatformBadge>` for desktop vs mobile. If a component can't be extracted for reuse, extract it first (see `src/components/api/` as the reference split) — then land the style-guide coverage in the same PR. Regressions in this rule get pinned in §7 Don'ts.

### 16.1.1 Dual-device previews MUST use `<DeviceFrame>` (LOCKED)

Desktop/mobile side-by-side previews in `/style-guide` MUST render through `<DeviceFrame>` / `<DualDevicePreview>` (`src/pages/StyleGuide/components/DeviceFrame.tsx`), which mounts the case inside a same-origin `<iframe>` sized to 375px for mobile and 100% for desktop. Only an iframe gives the component a **real viewport** so Tailwind `md:` breakpoints and `useIsMobile()` resolve honestly (e.g. `CreateKeyFlow` actually swaps Dialog → MobileDrawer, `TierTrack` actually stacks). **Never** simulate mobile by shrinking a parent `<div>` — container width does not trigger media queries, so the mobile view is a lie. New cases register in `src/pages/StyleGuide/preview/registry.tsx` and are consumed via the `/style-guide/preview?c=<key>` route.




## 17. Content Rules

- **No icons on events or markets**: Events and markets (options) do not have icons or emoji. Never render `eventIcon` or any icon/emoji next to event or market names in any view (list, grid, card, shelf).
- **Icons must use Lucide**: All UI icons must use Lucide React SVG icons (`lucide-react`). Never use emoji (🔥✨⏰ etc.) as icons anywhere in the interface.
- **Terminology**: "Event" is the parent prediction question; "Market" is an individual option/outcome within an event.
- **Watchlist / Favorite icon**: Always use `Star` from `lucide-react`. Active state: `fill-trading-yellow text-trading-yellow`. Inactive: `text-muted-foreground`. Never use `Heart` for watchlist/favorite functionality.

---

## 18. Category Card Backgrounds

Each event category can display a themed background image on its market card (`MarketCardB`).

### File Locations

| Category | File | Badge Variant |
|----------|------|---------------|
| Social | `/card-bg/social.jpg` | `social` |
| Crypto | `/card-bg/crypto.jpg` | `crypto` |
| Finance | `/card-bg/finance.jpg` | `finance` |
| Politics | `/card-bg/politics.jpg` | `politics` |
| Tech | `/card-bg/tech.jpg` | `tech` |
| Entertainment | `/card-bg/entertainment.jpg` | `entertainment` |
| Sports | `/card-bg/sports.jpg` | `sports` |
| Market / General | _(none)_ | `general` |

### Visual Specs

- **Image opacity**: `opacity-[0.15]` — subtle texture, never overpowers text
- **Gradient overlay**: `bg-gradient-to-r from-[hsl(225_40%_7%)] via-[hsl(225_40%_7%/0.65)] to-transparent` — darkens the left (text) side
- **Positioning**: `absolute inset-0`, `object-cover`, behind content (`z-0`)
- **Loading**: `loading="lazy"` — off-screen cards don't block initial paint

### Image Requirements

- **Max width**: 600px (cards render at ~400px max)
- **Format**: JPEG, quality ≤ 60%
- **Target size**: ≤ 50 KB per image
- **Rationale**: Images display at 15% opacity; high resolution is imperceptible

### Configuration

Category-to-background mapping is defined in `src/lib/categoryUtils.ts` via the `cardBg` property in `CATEGORY_STYLES`.

---

## 19. Marketing Surface Architecture

Locked with `/developers` v5. Applies to all outward-facing marketing pages (developer portal, landing, campaign hubs) — never to product pages, portfolio, wallet, or the trading terminal.

### 19.1 Page skeleton

- Full-width bleed bands alternate `bg-background` / `bg-background-elevated`, separated by a top hairline (`border-t border-border/30`).
- Each band pins its content to `max-w-7xl mx-auto` with `md:border-x border-border/40` vertical tracks (drop `border-x` on mobile).
- No rounded outer frames on decorative containers. Only real product objects (order book, terminal window, code block) keep a card frame.
- Every section opens with a `SectionHeader`: ghost mono number (`text-5xl text-muted-foreground/[0.12]`), small `text-xl` h2, subtitle, right-aligned mono meta note.

### 19.2 Display typography

- Display font = **Space Grotesk** (weights 500/700), loaded in `index.html`, mapped to Tailwind `font-display`.
- Use only on marketing surfaces and only on: hero h1 (`font-bold tracking-[-0.02em]`), section h2 / CTA h3 (`font-medium tracking-[-0.01em]`), tier names.
- Never use `font-display` for body copy, buttons, notes, stat numbers (mono forever), ghost section numbers (mono forever), or anywhere inside product/trading UI.
- `font-poster` (Archivo Black) is the retro campaign poster font (see CAMPAIGN_DESIGN.md); it is reserved for campaign surfaces such as `/hedge` and the homepage campaign banner and is **not interchangeable with `font-display`** — do not swap one for the other.

### 19.3 Copy voice — engineering spec sheet

- Short sentences. Concrete nouns, concrete numbers. Vary sentence length.
- No three-item list pileups ("fast, reliable, and scalable"). No adjective stacking.
- Prefer verbs of the surface itself ("preview", "sign", "commit") over marketing verbs ("empower", "unlock the future of").
- Every claim should map to a field, endpoint, or measurable behavior — otherwise cut it.

---

## 20. State Patterns

**Rule:** Every product page renders empty / loading / error states through the three shared primitives in `src/components/states/`. Never hand-roll a divless "No data" string, a bare `<Loader2>`, or a silent `return []`. Status and risk colors always come from `src/lib/statusStyles.ts` — never invented per-page.

### Primitives

| Component | Purpose | Key props |
| --- | --- | --- |
| `<EmptyState>` | Empty block/list | `icon` (LucideIcon, required), `title`, `description?`, `action?`, `variant?: "card" \| "inline"` |
| `<LoadingState>` | Loading placeholder | `label?`, `variant?: "spinner" \| "skeleton"`, `skeletonRows?` |
| `<ErrorState>` | Fetch/network failure | `title?`, `description?`, `onRetry?` (Retry button renders only when supplied) |

Import from `@/components/states`. Rendered demo: `/style-guide` → **States** tab.

### Color source

- `STATUS_STYLES` — `success / active / pending / error / revoked / neutral` with `badge` + `fg` class strings.
- `RISK_STYLES` — `SAFE / WARNING / RESTRICTION / LIQUIDATION` (matches §7). `LIQUIDATION` uses `motion-safe:animate-pulse`.
- Helpers: `getStatusStyle(key)`, `getRiskTier(ratio)`, `getRiskStyle(tier)`.

### Do / Don't

**Do**
- Reach for `<EmptyState variant="card">` inside product regions; `variant="inline"` inside dense tables/lists.
- Use `<LoadingState variant="skeleton" skeletonRows={n}>` for list/table loads so the layout doesn't jump.
- Provide `onRetry` on `<ErrorState>` whenever a retry is meaningful — the button hides itself otherwise.
- Import status/risk badge classes from `STATUS_STYLES` / `RISK_STYLES`.

**Don't**
- Don't render bare strings like `"No data"` or `"Loading..."` — always use a primitive.
- Don't inline `bg-trading-green/10 text-trading-green ...` copies of the status palette in a page. Import the token.
- Don't invent risk colors (`text-orange-500`, `bg-yellow-400`) — use the four risk tiers only.
- Don't compose empty states from marketing hero heights. States are compact; they never occupy half a viewport.

---

## §Addendum 2026-07-21 · Dual-Account Wallet UI (Round 2b, LOCKED)

Append-only. Six items promised in the round 2b spec. Do not delete; supersede in a future dated addendum.

### 1. §5 exception clarification — "Wallet Total Equity Card" (singular)

The engineering-blueprint no-decoration rule has **one** exception in /wallet: the top **Total Equity Card** (Band 1). It uses the brand gradient (`rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent`) + blur orbs.

**The two account cards (Spot Account, Futures Account) in Band 2 do NOT inherit this exception.** They use `.stats-card` only. Reusing the gradient on account cards = design regression.

### 2. §8 Dual-Account Card Group + Transfer + tx account badge + Band 1 subnote

**Band 1 subnote (locked copy, 2026-07-21 Trial Bonus sunset):**
> "Spot + Futures · does not include unrealized PnL"

`font-mono text-[10px] text-muted-foreground mt-1`. Always visible under the main equity number.

**Band 2 dual account cards:**
- Layout: desktop `grid-cols-2 gap-6`; mobile stacked `space-y-3`
- Shell: `.stats-card p-6` (desktop) / `.stats-card p-4` (mobile), **no gradient**
- Header: account name (`text-sm font-medium text-muted-foreground`)
- Main number: `font-mono text-2xl font-semibold` — Spot = `spot_balance`, Futures = `balance`
- Detail grid: `p-3 rounded-lg bg-muted/20` cells with `font-mono text-sm font-semibold` values
- Top-right Transfer ghost icon: `absolute top-4 right-4 h-8 w-8 rounded-md hover:bg-muted/50` with `ArrowLeftRight w-3.5`
- ~~Trial Bonus cell~~ **RETIRED 2026-07-21.** The Futures card no longer renders a Trial Bonus detail cell; the Trial Bonus wallet feature was never launched and is fully sunset.

**Transfer three-piece (Round 2b LOCKED):** Desktop = `TransferDialog`, mobile = `TransferDrawer`. Shared body = `TransferForm`. **Mobile Dialog = acceptance fail (§5 LOCKED rule sync).**

Form structure: Segmented direction switch → From/To swap cards (From `bg-muted/20`, To `border-primary/30 bg-primary/5`, center `w-9 h-9` ArrowDown disc) → amount input `text-2xl font-mono` + MAX + Available row. From=Futures → Available shows `balance`. (Trial ⓘ tooltip retired 2026-07-21 with the Trial Bonus sunset.)

**TransactionHistory account badge:**
- Token: `text-[10px] rounded-full border px-1.5 py-0` — `SPOT` / `FUTURES` / `Transfer`
- Desktop: inline next to description
- Mobile: **row 2 only** (never in row 1 — §8 Don't rule sync)
- Legacy rows with `account = NULL` render no badge

### 3. §9 Deposit / Withdraw account selection

- **Deposit:** Insert an "Deposit to" pre-screen (radio card list, active = `border-primary bg-primary/10`) **before** the three tabs (WalletDeposit / CrossChainDeposit / BuyWithFiat). No default preselection. `useAccountPreference` persists per-flow choice in localStorage. Post-selection: a clickable crumb "To: Spot Account ›" appears above the tabs.
- **Withdraw:** Add a "From account" selector row at the top of `WalletWithdraw` (below the Base-USDC info strip). Uses same picker pattern as `WithdrawAddressSelect` (desktop Dialog / mobile Sheet). Amount validation + Available row follows the selected account.
- Both flows must write `account` on the resulting `transactions` row via `record-transaction`.

### 4. §5 Overlay parity table — add Transfer row + Equity HoverCard spec

Add to overlay parity table:

| Intent | Desktop | Mobile |
|---|---|---|
| Transfer between accounts | `TransferDialog` | `TransferDrawer` (MobileDrawer) |

**Desktop-only Equity HoverCard** (attached to top-nav Equity capsule): ~260px width. Content: two data rows (Spot Account / Futures Account, `font-mono text-sm`) → hairline divider → Total Equity row (`font-semibold`) → "Transfer ›" text link that opens `TransferDialog`. Mobile: no equity in the header. **2026-07-21:** Trial Bonus row removed with sunset.

### 5. Total Equity definition (site-wide single source)

```
Total Equity = spot_balance + balance
             (does NOT include unrealized PnL)
```

Helper: `src/lib/equity.ts` `computeTotalEquity({ spotBalance, balance })`. Every surface that displays "Total Equity" (top-nav capsule, HoverCard total row, HomeEquityHero main number, /wallet Band 1, StyleGuide previews) MUST read this helper. No ad-hoc summing. **2026-07-21:** `trialBalance` parameter removed with the Trial Bonus sunset — do not reintroduce.

### 6. §10 Preset D revision — HomeEquityHero data source

`<HomeEquityHero>` main number data source is now **`computeTotalEquity`**, not `balance + trialBalance`. Everything else in Preset D (40px cap, no meta row, eye toggle, single Deposit CTA, non-sticky) stays. `.lovable/memory/design/mobile-header-preset-d.md` synced.

## §Addendum 2026-07-22 · Spot Display Alignment (Round 4B, LOCKED)

### 1. Product-Line Badge (single source)

Canonical module: `src/lib/productLineBadge.tsx`. `<ProductLineBadge line="spot" />` or `PRODUCT_LINE_BADGE_CLASSES.spot` — never re-declare.

| Line | Classes | Where it appears |
|---|---|---|
| SPOT | `border-blue-500/30 bg-blue-500/10 text-blue-400` filled pill | TransactionHistory row · TradeVerification select/header · PortfolioSettlements row · SettlementDetail header · SettlementPoster direction chip · ResolvedMarketCard top badges · MarketCardB top badges · MarketListView Event cell |
| FUTURES | `border-primary/30 bg-primary/10 text-primary` filled pill | TransactionHistory (implicit — badge hidden when only futures on that surface) |

**Exempt (LOCKED)**: `/spot` terminal header uses the neutral outline SPOT badge from §14 — it lives *inside* the spot terminal and needs to read as chrome, not accent. Do not swap it for the shared pill.

### 2. §7 addendum — Settlements 3-way status

`useSettlements.kind` drives all rendering:

| kind | Trigger | Exit Price | Row badge |
|---|---|---|---|
| `settled` | joined `events.is_resolved=true` | pin `$1.00` (win) / `$0.00` (lose) | Settled + Win/Loss |
| `closed` (futures) | events.is_resolved=false | real `trades.price` | Closed + Win/Loss |
| `closed` (spot) | events.is_resolved=false, product_line='spot' | real `trades.price` | Closed + **PnL number only** (green/red), no Win/Loss chip |

**Never fabricate exit price**. The historical `exitPrice = isWin ? 1 : 0` line is banned.

### 3. §15 corrections

- Rename: ResolvedEventCard → **ResolvedMarketCard** (the file name is authoritative).
- PortfolioSettlements mobile card: `rounded-xl border-border/40 p-4` + 165deg gradient surface. Not `p-3`, not flat.

### 4. §16 — Full-catalog view switch rule

When `search.trim() !== "" || activeTab === "watchlist"`:
- **Skip** the Futures|Spot productLine filter (show everything).
- **Hide** the top Futures|Spot switch chip group entirely.
Exit either condition → both revert.

### 5. §16 page table addendum

| Page | Product-line surface |
|---|---|
| PortfolioSettlements | Row-level SPOT badge in leverage slot; spot intraday closes hide Win/Loss chip |

### 6. Future rule (documented, not yet built)

Dual-line events (`product_lines ⊇ {spot, futures}`): render **one row per product line**, each with its own badge and route. Not implemented in 4B — search / watchlist currently shows one row per event.
