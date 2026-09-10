# Surface switch（Lite / Pro）— 交付说明 v1

> 这份文档说的是交易页上那对看法切换：桌面在页头右侧是一件 `Lite` / `Pro` 分段控件，手机上则是贴在底部下单条最左边的一枚方钮（写着"要去的那一边"）。以前"简单版 / 专业版"是整站的设置，藏在头像菜单里，切了以后首页、事件页、组合页、钱包全都跟着换脸；现在整站只剩一套外观（原来的简单版），只有交易页那两页还保留两种看法，所以开关只留在交易页上，登录后才出现，点一下当场换，网址不变、页面不跳。别的页面已经没有任何地方能切换外观了。怎么读：先看 §0，再按章节看；每个状态在 `/style-guide` → Foundations → Surface switch 有对应 case。

## 0. 读者须知

查什么去哪儿：
- 长什么样 → 生产页 `/trade`（也见 `/trade/order`、`/spot`）
- 什么时候变成什么样 → `/style-guide` → Foundations → `Surface switch · Lite / Pro` 状态字典（SS-1…SS-5）
- 字段名、文案、公式、时间口径、术语 → `docs/copy-dictionary.md` → 本文档对应章节
- 设计法则（颜色轴、chip、overlay 对等）→ `DESIGN.md`
提问前先按上面顺序查一遍；查不到再提，提问时写明"我查了 X 没有"。

## 1. 功能目标

给交易页——且只给交易页——一个就地切换看法的控件；其余所有页面恒为 Lite，不再受任何模式影响。控件对未登录用户不渲染。切换只改渲染，不改路由、不改数据。

## 2. 状态机与解剖

| 状态 | 触发条件 | 视觉 |
|---|---|---|
| Lite 选中（页头） | `user != null && surface === "lite"` | 选中段 `bg-white` / 字 `#0a0b0d`；未选段 `text-muted-foreground`（hover 转 `text-foreground`） |
| Pro 选中（页头） | `user != null && surface === "pro"` | 镜像 |
| 贴底方钮 · 在 Lite | `size="dock" && surface === "lite"` | 46px 方钮，`ArrowLeftRight` 14px + 10px 粗体标签 `Pro` |
| 贴底方钮 · 在 Pro | `size="dock" && surface === "pro"` | 同上，标签 `Lite` |
| 游客 | `user == null` | 整件 `return null`，不占位（Buy 按钮占满） |

桌面页头分段控件：外壳 `inline-flex items-center h-7 rounded-lg border border-border bg-muted/50 p-0.5`；每段 `h-[22px] px-2.5 rounded-md text-[11px] font-semibold leading-none`，两段相邻无间隙。`size="compact"` 只缩尺寸（外壳 `h-[26px]`，段 `h-[20px] px-2` 10.5px）。
移动贴底方钮：`w-[46px] self-stretch rounded-[10px] border border-border bg-muted/50 text-muted-foreground`，与 Buy 按钮等高，贴底栏高度不变。
无障碍：页头件 `role="radiogroup"` + `aria-label="Trading view"`，每段 `role="radio"` + `aria-checked`；方钮 `aria-label="Switch to Pro view" / "Switch to Lite view"`。

## 3. 挂载点（五处，仅此五处）

| 位置 | 文件 | 尺寸 |
|---|---|---|
| 桌面交易页头右簇首位（仅 `/trade`、`/trade/order`、`/spot`） | `src/components/EventsDesktopHeader.tsx` | `header` |
| Pro 桌面终端自绘页头（合约） | `src/pages/DesktopTrading.tsx` | `compact` |
| Pro 现货自绘页头（桌面 / 移动 chrome） | `src/pages/SpotTrading.tsx` | `compact` |
| Lite 三张交易页共用的移动贴底 Buy 条首位 | `LiteContractTrade` / `LiteSpotTrade` / `LiteQuickTrade` | `dock` |
| Pro 移动端贴底动作条首位 | `src/pages/TradingCharts.tsx` | `dock` |

移动端页头（MobileHeader / MobileTradingLayout 右槽）**不挂**该控件，已恢复 D6′-1 之前的样子；`/trade/order` 不挂。

移动 Lite 多市场页无贴底栏 → 同一颗方钮改为左下角浮钮（fixed，left 12 / bottom 14 + safe-area），列表底部留 64px。浮钮在任何抽屉 / 底部弹层 / 平仓流打开时隐藏，关闭后恢复；同一页永不同时出现贴底方钮与浮钮。

## 4. 路由收敛

| 路由 | 旧 | 新 |
|---|---|---|
| `/` | surface 分叉（MobileHome / EventsPage / LiteEventsPage） | 恒 `LiteEventsPage` |
| `/events` | surface 分叉 | 恒 `LiteEventsPage` |
| `/resolved`、`/resolved/:id` | Pro 有独立页 | 恒重定向（`/events` / 该事件交易页） |
| `/portfolio` 及其子路由 | surface 分叉 | 恒 Lite（settlements / airdrops 继续重定向） |
| `/trade`、`/trade/order`、`/spot` | surface 分叉 | **保留分叉**（唯一保留处） |

`LiveCards.PendingOrdersRow.openInPro` 行为不变。

## 5. 其他随动

| 项 | 说明 |
|---|---|
| 桌面头像菜单 | 删除 `Switch to Pro mode / Switch to Simple mode` 菜单项 |
| 移动端 Me 抽屉 | 删除同名列表项 |
| 底部导航 | 恒 Lite 三项（Events / Portfolio / Wallet + Me），Pro 导航分支删除 |
| SeoFooter | Platform 列不再出现 `Resolved` |
| MobileHeader | 根页判定固定为 Lite 根列表 |

## 6. 已删除 / 已废弃

| 项 | 说明 |
|---|---|
| `SurfaceToggleMenuItem`（EventsDesktopHeader 内联件） | 删除 |
| BottomNav `navItems`（Pro 四项导航） | 删除 |
| `MobileHeader.PRO_ROOTS` | 删除 |
| `MobileHome` / `EventsPage` / `ResolvedPage` / `ResolvedEventDetail` / `Portfolio` / `PortfolioSettlements` / `PortfolioAirdrops` / `SettlementDetail` | 文件保留，路由不再挂载 |

## 7. 状态索引

| 模块 | `/style-guide` case |
|---|---|
| SurfaceSwitch 页头三态 + 贴底两向 + 尺寸与点击口径 | Foundations → Surface switch（`foundations-surface-switch`，SS-1…SS-5） |

## 8. 涉及文件

前端：`src/components/surface/SurfaceSwitch.tsx`（新）、`EventsDesktopHeader.tsx`、`BottomNav.tsx`、`MobileHeader.tsx`、`MobileTradingLayout.tsx`（移除页头挂载）、`TradingCharts.tsx`、`seo/SeoFooter.tsx`、`App.tsx`、`PortfolioRoutes.tsx`、`Wallet.tsx`、`Deposit.tsx`、`Withdraw.tsx`、`auth/AuthContent.tsx`、`ExpiredEventFallback.tsx`、`DesktopTrading.tsx`、`SpotTrading.tsx`、`lite/LiteContractTrade.tsx`、`lite/LiteSpotTrade.tsx`、`lite/LiteQuickTrade.tsx`
状态字典：`StyleGuide/preview/surfacePreviews.tsx`（新）、`preview/registry.tsx`、`sections/MobilePatternsSection.tsx`、`scripts/sg-audit-baseline.json`
后端 / 数据库：无变更（`profiles.preferred_surface` 继续由 `setSurface` 尽力写入）

## 9. 未变更项

交易页本身的排版、图表、下单面板、持仓卡、分享入口一律未动；`SurfaceContext` 的存储口径（localStorage + `profiles.preferred_surface`）未动；Pro 终端内部一切未动。

## 10. FIX8 · 未登录强制 Lite（2026-09-10）

规则：**游客恒为 Lite**，Pro 只在登录态可达。此前 `SurfaceContext` 只从 localStorage 水合，退出登录后仍停在 Pro 终端，且看到旧的 `AuthGateOverlay`（模糊底 + Log In / Sign Up）。

- **auth 监听**：`SurfaceProvider` 内 `supabase.auth.getSession()` + `onAuthStateChange` 维护 `hasSession: boolean | null`（`null` = 会话未决）。`SIGNED_OUT` 时额外调用 `clearPortfolioReturnSurface()`。
- **派生口径**：`surface = hasSession === false ? "lite" : storedSurface`。会话未决时沿用 storedSurface，避免登录用户出现 Lite→Pro 闪烁；会话确认为空后立刻回落 Lite。
- **localStorage 不清**：`omenx_surface` 在退出登录时保留，用户再次登录即恢复 Pro 偏好；`profiles.preferred_surface` 首次水合仍然优先。
- **游客的 `setSurface` / `toggle` 均为 no-op。**
- 路由无需改动：`/trade`、`/trade/order`、`/spot`、`/spot/order` 四条路由与桌面分叉全部读 `useSurface().surface`，代码中已无直接读 `omenx_surface` 的地方。
- **Pro 登录门换件**：`ProBottomTabs`、`TradeOrder`、`SpotTradeOrder` 改用站点唯一的 `LiteAuthGate`（新增 `variant="panel"`：`bg-card` 无模糊、72px lynx、单行标题、Sign in / Create account 同排、总高 ≤ 220px）。此前"Pro 面保留 `AuthGateOverlay` 原样不动"的说法作废。`src/components/AuthGateOverlay.tsx` 因 `Wallet` / `PortfolioSettlements` / style-guide 仍在引用而保留，交易面已不再使用。
- 状态字典：Pro — 交易终端 → `pro-bottom-tabs-guest`（SP-I）。
