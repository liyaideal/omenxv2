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
