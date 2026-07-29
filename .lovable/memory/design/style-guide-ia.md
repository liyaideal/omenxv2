---
name: /style-guide 信息架构
description: Style guide 分组侧栏 IA、section 注册表位置、以及 section 文件不可改写的约束
type: preference
---
- 导航壳层在 `src/pages/StyleGuide/index.tsx`，分组注册表在 `src/pages/StyleGuide/nav.tsx`。
- 分组：Foundations / Core UI / Trading — Pro / Lite (consumer surface) / Wallet & Money / Mobile / Misc — Legacy。
- **section 源文件是活规范**：只能移动、重新注册、import，禁止改写其内部实现。
- 深链用 hash（`/style-guide#lite`），`resolveSectionId` 负责老 id 兼容。
- `/campaign-style-guide` 独立页面，仅在侧栏页脚交叉链接。
- Lite 组件的多状态 playground 在 `sections/LiteSection.tsx`；为可演示性只允许加"零风险附加 prop"（如 `defaultTrayOpen`），不允许为 demo 重构生产组件。

## Demo 标注标准（round 7 起，所有新 section 必须遵守）
1. **禁止 "shared" 字样**。每个 demo 必须挂一个 context chip，只能是三选一：
   `Desktop · right rail` / `Mobile · bottom drawer` / `Desktop & Mobile · same component`。
   样式沿用 label-chip（muted、无底色）。
2. **Where things live 表格**放在 section 顶部：组件名 | desktop 位置 | mobile 位置 | 由什么打开 | demo 状态数。
3. **移动端挂载形态**必须放进 375px 带边框的 frame（标注 `375px · mobile`），
   演示挂载差异（drawer 组合、sticky 底栏、compact 变体），而不只是"组件存在"。
   真实 MobileDrawer 会 portal 到 body，frame 内用静态 chrome 复刻。
