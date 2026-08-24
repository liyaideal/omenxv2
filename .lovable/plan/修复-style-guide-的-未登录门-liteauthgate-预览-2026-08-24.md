# 修复 style-guide 的「未登录门 LiteAuthGate」预览

## 现状

`/portfolio` 的未登录门产品口径不变：**保留模糊垫底 + 站内 CTA**（山猫图 + Sign in / Create account），点击才弹 AuthSheet（移动）/ AuthDialog（桌面）。这套逻辑生产上是对的，不动。

问题只出在 style-guide：`PortfolioAuthGatePreview` 直接挂了真实的 `LiteAuthGate`，而它内部读真实登录态。开发者在 style-guide 里是已登录的，组件走 `if (user) return children`，于是遮罩根本不渲染，截图看到的就是一张普通持仓卡——研发会误以为「未登录也照常展示持仓」。

## 要做的事

1. **让预览能强制未登录**
   给 `LiteAuthGate` 加一个只服务于文档的可选 prop（`forceSignedOut?: boolean`，默认 false）。为 true 时跳过 `user` 判断，始终渲染遮罩层。生产调用点不传，行为零变化。

2. **拆成两态并列**
   - `portfolio-lite-auth-gate-out`：未登录态，`forceSignedOut` 打开，渲染模糊 KPI + 持仓卡 + 遮罩 CTA。
   - `portfolio-lite-auth-gate-in`：已登录态，同样的 children 但门透传，清晰无模糊。
   两个 case 放在同一个移动端 `SectionFrame` 里，上下并列。

3. **补触发条件表**
   按现有 spec 表格式给这个 case 写四列：

   | 状态 | 触发条件 | 视觉结果 | 数据来源 |
   |---|---|---|---|
   | 未登录 | `user === null` | 内容 `blur-[3px] opacity-70` + `bg-background/40` 遮罩，山猫 100px + 标题 + 描述 + Sign in（btn-primary）/ Create account（描边） | `useAuth().user` |
   | 已登录 | `user !== null` | 直接透传 children，无模糊无遮罩 | `useAuth().user` |
   | 点击任一 CTA | `authOpen === true` | 移动弹 `AuthSheet`，桌面弹 `AuthDialog` | `useIsMobile()` |

   并注明高度锁定 `min/maxHeight`：移动 420px、桌面 400px。

## 技术细节

- 改动文件：`src/components/portfolio/lite/LiteAuthGate.tsx`（加 prop）、`src/pages/StyleGuide/preview/portfolioPreviews.tsx`（拆两个 preview 组件）、`src/pages/StyleGuide/preview/registry.tsx`（注册新 key）、`src/pages/StyleGuide/sections/pages/litePages.tsx`（替换旧 case、补 spec 表）。
- 不改 `useAuth`、`BottomNav` 的未登录跳转逻辑，也不改 `AuthGateOverlay`（那是 Pro 侧的另一套，规则要求两者不互相借用样式）。
- 验收：`/style-guide#lite-portfolio` 里该 section 显示上下两帧，未登录帧可见模糊 + 山猫 + 双按钮；生产 `/portfolio` 已登录访问无任何变化。
