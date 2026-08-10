---
name: /style-guide 信息架构
description: Style guide 四区导航（Lite 按页面 / Foundations / Legacy / Archive）、section 注册表位置、改版状态只进 Lite 页面节的铁律
type: preference
---
## 四区结构（2026-08-10 重组轮定稿）
导航壳层 `src/pages/StyleGuide/index.tsx`，注册表 `src/pages/StyleGuide/nav.tsx`。
- **A · Lite — 按页面**：一页一节，节标题挂改版徽标（✅ 已改版 / 🔧 进行中 / ⏳ 未开始）；
  区顶 `lite-overview` 是页面 × 徽标 × 锚点的进度总览表。页面节由
  `src/pages/StyleGuide/sections/pages/litePages.tsx` **纯组合**既有 section 文件而成，
  shell 在 `sections/pages/shell.tsx`。
- **B · Foundations**：全站规范 + tokens / typography / animations / common UI / forms /
  states / empty states / mobile patterns / user identity。
- **C · Legacy — 未改版存量**：Pro Trading、Pro Spot、Transparency、World Cup。
- **D · Archive — 退役件**：PageTitle / PageHeader（`sections/ArchiveSection.tsx`）。
- `/campaign-style-guide` 独立页面，仅在侧栏页脚交叉链接。

## 铁律
1. **改版状态展示只许进 Lite 区对应页面节**；没有该页面节就新建一节，禁止散落到
   Foundations / Legacy / Archive。页面节徽标随改版进度更新。
2. **徽标判定标准**：✅ 只代表该页完成过 Lite 视觉改版；仅有功能/状态展示而未翻新视觉的页面标 ⏳，其现役 demo 以「现状留档」名义留在页面节内。
3. **section 源文件是活规范**：只能移动、重新注册、import，禁止改写其内部实现。
4. **只增不删**：previewRegistry 键集合只增不减；重组不得让任何 section 内容缩水。
5. 深链用 hash（`/style-guide#lite-events`），`resolveSectionId` + `SECTION_ALIASES`
   负责老 id 兼容（如 `#lite` → `#lite-events`、`#wallet` → `#lite-wallet`）。
6. Lite 组件的多状态 playground 只允许加"零风险附加 prop"（如 `defaultTrayOpen`），
   不允许为 demo 重构生产组件。
7. **进度总览必须覆盖 `src/App.tsx` 全部用户路由**（重定向、style-guide 自身、campaign landing 除外）；
   新增路由的同一轮必须把该页面补进总览表与 Lite 区导航。

## Demo 标注标准（round 7 起，所有新 section 必须遵守）
1. **禁止 "shared" 字样**。每个 demo 必须挂一个 context chip，只能是三选一：
   `Desktop · right rail` / `Mobile · bottom drawer` / `Desktop & Mobile · same component`。
2. **Where things live 表格**放在 section 顶部：组件名 | desktop 位置 | mobile 位置 | 由什么打开 | demo 状态数。
3. **移动端挂载形态**必须放进 375px 带边框的 frame（标注 `375px · mobile`）。
