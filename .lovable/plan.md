# Settled 列表按月份折叠（移动端 + 桌面端）

Lite /portfolio?tab=settled 的月份分组头（如 `AUGUST 2026`）目前只是静态标签。改为可点击折叠/展开该月下的行。

**覆盖两端**：`/portfolio` 的 settled 列表由 `SettledList` 单一组件渲染，**移动端和桌面端（宽屏）共用同一实现**（`LitePortfolio.tsx:330` 不分 viewport）。因此在 `SettledList` 加折叠，两端同时生效，样式按现有 token 自适应。

**范围说明**：Pro surface 的 /portfolio settled 是平铺表格、**没有月份分组**，不属于本单；如需 Pro 也分组折叠请另行说明。

## 改动

### 1. `src/components/portfolio/lite/SettledList.tsx`（核心）
- 新增 `collapsed: Set<string>` 本地 state（存被折叠月份的 `g.key`），默认全部展开。
- 月份组头从静态 `div` 改为可点击的 `button`（`type="button"`，整行可点，移动端触控区域足够）：
  - 左侧保留现有标签样式（`text-[10px] font-bold text-[#6B7280]`、`letterSpacing 1.4px`）。
  - 右侧加 Lucide `ChevronDown` 图标（`h-3.5 w-3.5 text-[#6B7280]`），折叠时 `rotate-180`（CSS transition 旋转）。
  - 附带该月行数小字计数（如 `AUGUST 2026 · 3`），与 Resolved 分组 `(N)` 计数惯例一致——文案走 `font-mono text-[#6B7280]/60`。
- 折叠的组不渲染行（直接从 JSX 跳过），展开时恢复；无动画高度库，纯条件渲染。
- `Load earlier months` 懒加载逻辑不变；新加载的月份默认展开。

### 2. Style Guide 状态补全（新功能 playground 强制项）
- `src/pages/StyleGuide/preview/portfolioPreviews.tsx`：`PortfolioSettledListPreview` 中交互演示折叠/展开（demo 本身可交互，无需新 fixture）；补一个「部分月份已折叠」说明。
- `src/pages/StyleGuide/sections/pages/LitePortfolioPage.tsx`：spec 表新增两行状态（「月份折叠」「月份展开」，含 when / visual / source: SettledList）。

### 3. 文档
- `docs/delivery/lite-portfolio-spec-v2.md`：Settled 章节补一句月份组可折叠的行为描述（如该文档有此行为清单）。

## 不做
- 不改 Pro surface 的 Portfolio / PortfolioSettlements / ResolvedPage。
- 不改 `useLitePortfolio` 数据结构（`monthGroups` 分组逻辑复用）。
- 不持久化折叠状态（切 tab / 刷新后恢复全展开）。
- 不碰 Rewards 冻结画布与 LiteEventCard。

## 验证
- `npx tsgo --noEmit -p tsconfig.app.json` 通过。
- Playwright 分别以移动端视口和桌面视口打开 /style-guide portfolio settled 预览，点击月份头截图确认折叠/展开两端一致；生产 /portfolio 需登录态，若未注入会话则在 Style Guide 验证。
