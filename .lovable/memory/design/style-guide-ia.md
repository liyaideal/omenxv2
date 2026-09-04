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

## 2026-08-27 · Lite-only 收敛（CPO 指示）
1. **style-guide 只服务 Lite**：不再保留 Pro 对照 case。已删 `auth-login-pro` /
   `auth-create-pro` / `auth-profile-pro` / `auth-gate-pro` / `wallet-lite-hero-note-pro`
   五个 key；「登录 / 注册」页 case 数 = 16。
2. **三个 Pro 导航节下架（不删文件）**：「Trading (Pro 终端)」「Trading header playground」
   「Spot (Pro 现货)」从 `nav.tsx` 移除导航与挂载，section/preview 文件全部保留，
   待 Pro 线恢复时再归位。Transparency / API 等共用节不动。
3. **Settlements · 4B spot display** 整节撤出 Wallet 页，目前无任何挂载页；
   `settlementPreviews.tsx` 与 `settlement-*` / `resolved-market-card-spot` /
   `market-search-row-spot` / `product-line-badge-legend` registry key 保留。
4. **Home 节下架（Lite 无 Home 页，/ = Events 列表）**：`lite-home` 导航与总览挂载已移除；
   `LiteHomePage.tsx` / `MobileHomeSection.tsx` 等文件及 registry key 保留不删。
5. Wallet 页尾序：… → Recovery → Maintenance（Settlements 节消失）。

## 铁律 · 禁止「半活体」（2026-09-04 立，事故：登录弹窗 teal 渐变顶改了三次字典都没跟）

「半活体」= preview 挂了生产的**内容**组件，却自己手写了外面那层**容器 / 弹窗 / 抽屉 / 卡片 / 面板外壳**。
后果：改内容会自动同步，改外壳永远不同步——比整块手抄更隐蔽，因为 import 一眼看过去是"合格"的。

1. preview 文件里**不许出现任何带视觉样式的手写元素**（rounded / border / bg / shadow / ring / max-w-[ / 内联 background、borderRadius、boxShadow）。
   唯一豁免：只有 position 与高宽数字、零视觉样式的定位占位 div。
2. 模块在生产里长在哪个 chrome 里，字典就挂哪个 chrome 本体（Dialog 挂 Dialog、Drawer 挂 Drawer），不许挂内容层了事。
3. 生产件没导出、挂不上 → **先做零视觉变化的 export 提取，再回填字典**；不许"因为挂不上所以手写一个"。
4. 只允许给生产组件加**纯展示的可选 prop**（preview* / fixture 类），不传时渲染必须逐像素不变；不许为了 demo 重构生产组件。
5. **改动传导（本条对所有改动生效，包括人直接下的样式指令）**：任何改到 `src/components/**` 或 `src/pages/**` 视觉/结构的一轮，必须同轮
   grep `src/pages/StyleGuide/preview/**` 与 `src/pages/StyleGuide/sections/**` 找该组件的引用：
   - 字典挂的是本体 → 自动跟随，回报里写明"字典自动跟随，无需改动"；
   - 字典手写了它的外壳 → **同轮换壳**，或明确报告冲突并说明为什么本轮做不了。
   **不许沉默跳过。**
6. 每次动 style-guide 的轮次收尾必须跑 `npm run sg:audit`，把输出贴进回报。
