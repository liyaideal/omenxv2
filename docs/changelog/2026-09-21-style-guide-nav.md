# /style-guide 导航整理（nav 2026-09-21）

> 交易页 Lite / Pro 一体化交付前 Liya 反馈「字典涵盖好多块，很不好找」。本轮只动 /style-guide 的导航壳，**case 编号、preview key、每个 case 的内容、深链别名一个不变**。批的六项如下。

## 改了什么

| # | 项 | 结果 |
|---|---|---|
| A | 「Pro — 交易终端」原来一个节点 → 拆成三个节点 | `合约终端 /trade`（① 比赛市场行 → ② 下单面板 → ③ 手机 dock → ④ 账户风险）· `现货终端 /spot`（面板 → 盘口 → 预览 → 手机）· `两终端共用`（Surface switch → 事件选择器 → 终端骨架 → 订单状态标）；小节按产品页从上到下排 |
| B | 每个节点顶部自动生成「本页目录」 | 从渲染出的小节 `<section id>` + `<h2>` 读，附该小节的编号范围（`SL-D1…4`）；左栏当前节点下方同样展开小节；点了滚到小节 |
| C | 全站搜索 | 页头搜索框改为全站索引：编号 / 小节标题 / case 名 / 节点名；结果「编号 · 名 → 节点 › 小节」，点了切节点并落到该 case 的标签行（描一圈）；范围写法 `SS-1…SS-5` 搜 `SS-3` 也命中。索引由 `scripts/sg-index.mjs` 生成到 `src/pages/StyleGuide/searchIndex.json`，`npm run sg:audit` 先校验索引未过期 |
| D | Pro 三个节点页顶三行定位行 | 路由 → `docs/copy-dictionary.md §Trading` → 九份交付文档；共用节点交叉指向 Lite「交易页」TR-27 / SP-19（Lite 侧 `Pro ›` 入口留在 Lite） |
| E | Lite「交易页」末尾「⑨ 并账清单」折叠 | `<details>` 收起，点开查看 |
| F | 其余不动 | 编号、preview key、内容、`#foundations-surface-switch` 等旧深链（别名到 `pro-shared`） |

## 旧位置 → 新位置

| 原来在 | 现在在 |
|---|---|
| Pro — 交易终端（单节点）：市场行 / 下单面板 / dock / 风险 | 合约终端 /trade |
| Pro — 交易终端：现货面板 / 盘口 / 预览 / 手机 | 现货终端 /spot |
| Pro — 交易终端：事件选择器 / 终端骨架 / 订单状态标 | 两终端共用 |
| Foundations › Mobile patterns › Surface switch（SS-1…SS-5） | 两终端共用（`#foundations-surface-switch` 仍可用） |

## 研发要知道的

- 找某个编号：页头搜索框直接敲编号（如 `SL-D2` / `TR-27b` / `PF-M1`）。
- 文档里写的「Pro — 交易终端」是分组名，下面三个节点；本轮已把九份 Pro 交付文档的 §0 指引改到具体节点。
- 新增 case 后要跑 `npm run sg:index`（或直接 `sg:audit`，它会报索引过期）并把 `searchIndex.json` 一起提交。

## 涉及文件

`src/pages/StyleGuide/{index.tsx, nav.tsx, toc.ts, search.ts, searchIndex.json}`、`sections/ProSpotSection.tsx`（三个页节点 + 定位行）、`sections/MobilePatternsSection.tsx`（Surface switch 抽成导出节）、`sections/SpotStatesSection.tsx`（并账清单折叠）、`components/SectionFrame.tsx`（case 标签行加 `data-case`，搜索落点用）、`scripts/sg-index.mjs`、`package.json`（`sg:index`；`sg:audit` 先跑 `--check`）。
