# Surface switch（Simple / Pro）— 交付说明 v1

> 这份文档说的是交易页右上角那对小胶囊：`Simple` 与 `Pro`。以前"简单版 / 专业版"是整站的设置，藏在头像菜单里，切了以后首页、事件页、组合页、钱包全都跟着换脸；现在整站只剩一套外观（原来的简单版），只有交易页那两页还保留两种看法，所以开关直接搬到了交易页页头上，登录后才出现，点一下当场换，网址不变、页面不跳。别的页面已经没有任何地方能切换外观了。怎么读：先看 §0，再按章节看；每个状态在 `/style-guide` → Foundations → Surface switch 有对应 case。

## 0. 读者须知

查什么去哪儿：
- 长什么样 → 生产页 `/trade`（也见 `/trade/order`、`/spot`）
- 什么时候变成什么样 → `/style-guide` → Foundations → `Surface switch · Simple / Pro` 状态字典（SS-1…SS-3）
- 字段名、文案、公式、时间口径、术语 → `docs/copy-dictionary.md` → 本文档对应章节
- 设计法则（颜色轴、chip、overlay 对等）→ `DESIGN.md`
提问前先按上面顺序查一遍；查不到再提，提问时写明"我查了 X 没有"。

## 1. 功能目标

给交易页——且只给交易页——一个就地切换看法的控件；其余所有页面恒为 Lite，不再受任何模式影响。控件对未登录用户不渲染。切换只改渲染，不改路由、不改数据。

## 2. 状态机

| 状态 | 触发条件 | 视觉 |
|---|---|---|
| Simple 选中 | `user != null && surface === "lite"` | `Simple` 白底 `#FFFFFF` / 字 `#0B0D10` / 700；`Pro` 底 `#14171C` + 1px `#262B33` / 字 `#C7CCD4` / 600 |
| Pro 选中 | `user != null && surface === "pro"` | 镜像 |
| 游客 | `user == null` | 整件 `return null`，不占位 |

尺寸：`size="header"` = `px-3.5 py-[7px] / 12.5px`；`size="compact"` = `px-3 py-[5px] / 11.5px`。
无障碍：容器 `role="group"` + `aria-label="Trading view"`，两枚按钮各带 `aria-pressed`。

## 3. 挂载点（四处，仅此四处）

| 位置 | 文件 | 尺寸 |
|---|---|---|
| 桌面交易页头右簇首位（仅 `/trade`、`/trade/order`、`/spot`） | `src/components/EventsDesktopHeader.tsx` | `header` |
| Lite 三张交易页的移动端页头右槽 | `LiteContractTrade` / `LiteSpotTrade` / `LiteQuickTrade` | `compact` |
| Pro 移动端合约终端页头右槽 | `src/components/MobileTradingLayout.tsx` | `compact` |
| Pro 桌面终端自绘页头（合约 / 现货）与 Pro 现货移动端 chrome | `DesktopTrading.tsx` / `SpotTrading.tsx` | `compact` |

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
| SurfaceSwitch 三态 + 两尺寸 + 点击口径 | Foundations → Surface switch（`foundations-surface-switch`，SS-1…SS-3） |

## 8. 涉及文件

前端：`src/components/surface/SurfaceSwitch.tsx`（新）、`EventsDesktopHeader.tsx`、`BottomNav.tsx`、`MobileHeader.tsx`、`MobileTradingLayout.tsx`、`seo/SeoFooter.tsx`、`App.tsx`、`PortfolioRoutes.tsx`、`Wallet.tsx`、`Deposit.tsx`、`Withdraw.tsx`、`auth/AuthContent.tsx`、`ExpiredEventFallback.tsx`、`DesktopTrading.tsx`、`SpotTrading.tsx`、`lite/LiteContractTrade.tsx`、`lite/LiteSpotTrade.tsx`、`lite/LiteQuickTrade.tsx`
状态字典：`StyleGuide/preview/surfacePreviews.tsx`（新）、`preview/registry.tsx`、`sections/MobilePatternsSection.tsx`、`scripts/sg-audit-baseline.json`
后端 / 数据库：无变更（`profiles.preferred_surface` 继续由 `setSurface` 尽力写入）

## 9. 未变更项

交易页本身的排版、图表、下单面板、持仓卡、分享入口一律未动；`SurfaceContext` 的存储口径（localStorage + `profiles.preferred_surface`）未动；Pro 终端内部一切未动。
