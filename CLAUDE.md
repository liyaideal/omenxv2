# CLAUDE.md — omenxv2（OmenX 产品蓝图仓库）

> 给在本仓库里干活的 AI 编码代理（Claude Code / Cowork）看的路由文件。规则本体都在仓库里已有的文档中，本文件只负责：这仓库是什么、规则在哪、改动怎么流、哪些红线不能碰。**读完本文件再动代码。**

## 1. 这个仓库是什么

- OmenX 的**产品蓝图**：高保真、可交互、带演示后端（Supabase）的前端原型。研发团队基于另一套工程实现正式版，**以本仓库 `docs/` 为需求事实来源**，代码只是参考实现。详见 `README.md`「研发协作说明」和 `docs/README.md`。
- 生产（研发实操 / 对外演示）：https://omenxv2.lovable.app ；preview：Lovable 项目的 id-preview 域名。两者都由 Lovable 托管，从本仓库 `main` 构建。
- 技术栈：Vite + React 18 + TypeScript + Tailwind + shadcn/ui；后端 Supabase（`supabase/functions` 26 个 Edge Function、`supabase/migrations`），仅作**演示引擎**（`docs/backend-boundary.md`）。
- 包管理用 **bun**（`bun.lock` 为准；`package-lock.json` 已过期，不要 `npm ci`）。

## 2. 改动怎么流（2026-09-11 起）

- 代码改动**直接提交到 `main`**，不再通过 Lovable 的 AI 聊天框。Lovable 只做 preview / publish / 后端托管，它会在 push 后十几秒内自动同步。
- 提交前必须通过：`npx tsc -p tsconfig.app.json --noEmit` 和 `npx vite build`。Lovable 自己从不跑类型检查（2026-09-10 的 commit 就带着一个 `ReferenceError` 上了 preview），所以 tsc 是这个仓库唯一的类型门禁。
- 涉及 style-guide 字典页的改动，收尾跑 `npm run sg:audit`。
- commit message 用 conventional 前缀（`feat:` / `fix:` / `chore:` / `docs:`），正文说清「改了什么 / 没动什么」；研发靠 `docs/` 读需求，不靠 commit diff。

## 3. 规则在哪（读取顺序）

| 要做的事 | 先读 |
|---|---|
| 任何 UI 改动 | `DESIGN.md`（产品端设计系统）→ `docs/design-contracts/master-components.html`（权威条文，§12 全站规范）→ `/style-guide` 对应页面的状态字典 |
| 活动落地页 | `CAMPAIGN_DESIGN.md` + `/campaign-style-guide`，与产品端 DESIGN.md 隔离 |
| 文案、字段名、公式、Lite 术语对应 | `docs/copy-dictionary.md` |
| 品类树 / Boost 杠杆上限 | `src/lib/taxonomy.ts` + `docs/taxonomy.md` |
| 后端表 / 函数能不能改、研发能不能参考 | `docs/backend-boundary.md`（append-only） |
| 交付文档怎么写 | `.agents/skills/delivery-doc/SKILL.md`，样例 `docs/delivery/lite-delivery-v2.md` |
| 历史决策与冻结项 | `.lovable/memory/index.md`（核心规则清单）及其链接的 memory 文件 |

## 4. 红线（违反即回滚）

1. **禁止擅自重新设计。** 改 UI 先查 DESIGN.md 和字典；规范没覆盖的先补规范再实现，不凭感觉发挥。冻结组件（LiteEventCard、BottomNav、`/rewards` 全家）只可放置不可改型；交易页复用 SpotBlocks 与 LiteStockChart / LiteContractChart。
2. **全站只有两个交易页** `/trade`（合约）与 `/spot`（现货）。新品类/新功能只能在这两个骨架内增删模块，禁止新建交易页或新图表视觉。
3. **多状态必进 `/style-guide`**（desktop + mobile 双端），且 preview 必须挂生产组件本体，不许手写外壳（「半活体」）。
4. **演示数据只挂固定演示账号**（`alex_carter` 等，见 `.lovable/memory/features/demo-accounts-fixed-identities.md`）；产品页面禁止出现 demo 切换入口，演示一律放 `/style-guide`。
5. **状态走库，内容走 mock。** 跨模块流转的状态（下单/持仓/流水/券/积分）落 Supabase；纯展示内容永远 mock，禁止入库。新增演示专用 Edge Function 用 `sim-` 前缀。
6. **新表 / 新 Edge Function 上线同一轮**必须在 `docs/backend-boundary.md` 补一行标注 🟢/🟡/🔴。
7. **交付文档三件套同轮完成**：`docs/changelog/YYYY-MM-DD-{slug}.md` + `INDEX.md` 顶部插行 + `STATUS.md` 顶部追加节。
8. **Lite 面禁用交易黑话**与内部名（`.lovable/memory/design/lite-banned-words.md`）；图标用 Lucide，UI 里不出现 emoji。
9. 移动端不是降级：内联面板走 MobileDrawer，"流程即页面"走全屏路由 + sticky CTA，抽屉不嵌套。
10. 图片 / 插画 / 艺术底资产不由代理生成或改动，只给素材清单，由产品负责人上传。

## 5. 本地开发

```bash
bun install --frozen-lockfile
npx vite            # http://localhost:5173
npx tsc -p tsconfig.app.json --noEmit
npx vite build
npm run sg:audit    # style-guide 字典完整性闸门
```

`.env` 里只有 Supabase 的 publishable key（前端公开），没有秘密。
