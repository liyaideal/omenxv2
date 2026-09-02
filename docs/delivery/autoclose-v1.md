# Auto-close 字段常驻 + 两态值语法（Auto-close v1）— 交付说明

> 本文档覆盖 Auto-close 轮全部改动（求解器重写 + 四个面的值语法统一 + style-guide 归档）。范围 = Lite 全部 Boost 面；Standard 现货不带此字段；Pro 侧本轮零改动（挂账④）。`None at this balance` 全站退役，研发以本文档为准。

## 1. 功能目标

Boost 仓位的「预计自动平仓价」在 Lite 各面口径此前不一致：字段会因无解而消失、值有 `null / —/ None at this balance` 三种写法、求解器不分方向（short 的强平线被算到现价下方）。本轮把字段改为常驻、值收敛为两态，并让求解器 side-aware。

## 2. 值语法（两态 + 瞬态）

| 类别 | 值 | 触发 |
|---|---|---|
| level | `≈{c}¢`（交易页写作 `≈ {c}¢`） | `AutoCloseResult.kind === 'level'` |
| none | `None` / `none` | `kind === 'none'`：boost ≤ 1、解出域、数据缺失 |
| 瞬态（不进值语法） | 零单 `None · enter an amount`；加载中骨架 | `amountNum <= 0`；数据未到达 |
| hot 修饰 | 值转 trading-red + 副词 | `|mark − level| / mark ≤ 10%` |

## 2b. 统一解释 tooltip（AC-TT1）

全站唯一实现 `src/components/lite/shared/AutoCloseTooltipBody.tsx`，五处落点引用同一段静态文案，不按状态定制；**不插值，`≈ 62¢` 为冻结示例值**。值语法与 hot 判定零改动——只动解释层。

文案全文（CPO 已批，逐字冻结）：

> **Auto-close** — If your account runs low, Boost calls are closed automatically at this price to protect your remaining balance.
>
> `≈ 62¢` — The estimated auto-close price for this call. It's worked out across your whole account, so it shifts as your other positions move.
>
> `None` — This call can't be auto-closed — it's 1× (nothing borrowed), or prices only move between 0¢ and 100¢ and the line can't be reached. The most you can lose is what you put in.

触发器规格：

| 落点 | 触发器 | TooltipContent |
|---|---|---|
| 下单面板（桌面卡 + 移动 drawer 体） | 既有 `ⓘ`，partial-net 行共用本 ⓘ | `className="p-3"` 包 `<AutoCloseTooltipBody />` |
| Your call 卡（4 列与 compact 2 列） | label 右侧新增 `<Info className="w-3 h-3 cursor-help" />`（经 `PosCell.labelExtra`） | 同上 |
| Portfolio 桌面行 level | 值片段 `≈{c}¢` 加 `cursor-help border-b border-dotted border-[#4d5560]` | `side="top"` + `p-3` 包 `<AutoCloseTooltipBody />` |
| Portfolio 桌面行 none | `none` 由 `cursor-default` 改为同款虚线下划线触发 | 同上 |
| Portfolio 移动卡 | 无（句尾 `· no auto-close, loss capped` 原样，零新增 DOM） | — |

已删除两句定制文案：面板旧文 `An estimate of the price…`、桌面行旧文 `No auto-close within this market's price range…`。副行 `Moves with your other positions` 保留（无 hover 时的兜底教育层）。移动端 tooltip 为 tap 触发（shadcn 默认行为），不得用 Dialog。

## 3. 求解器契约（`src/lib/autoClosePrice.ts`）

| 项 | 约定 |
|---|---|
| 返回类型 | `{ kind: 'level'; price } \| { kind: 'none' }` —— 不返回 `null` |
| long 解 | `p = entry − (assets + pnlOther − imAfter) / qty`；合法域 `0 < p < mark`，出域 → none |
| short 解 | 方向取反，合法域 `mark < p < 1`，出域 → none |
| boost ≤ 1 | 恒 none（无借贷敞口，亏损封顶本金） |
| equity ≤ imAfter | `level = mark`，恒 hot |
| 口径 | 账户级（cross-collateral），非孤立保证金；`mode: 'new' \| 'existing'` 决定是否扣本单保证金与手续费 |
| 辅助 | `isAutoCloseHot(result, mark)`、`formatCents(price)` |

## 4. 面 × 态矩阵

| 面 | level | hot | none | 瞬态 | Standard | tooltip（AC-TT1） |
|---|---|---|---|---|---|---|
| 下单面板 Returns 行 | `≈ {c}¢` | 红 `≈ {c}¢ · close to entry` | `None · loss capped` | 零单 `None · enter an amount`；加载骨架 | 无此行 | 既有 `ⓘ`，内容换统一组件（partial-net 行共用本 ⓘ） |
| 下单面板 partial-net 行 | `≈ {c}¢` | 红 | `None · loss capped` | 零单 `None` | — | 同上（共用主行 ⓘ） |
| 交易页持仓条 | `≈ {c}¢`（无副行） | 红 + `Close to current price` | `None` + `Loss capped at your stake` | 加载骨架 | 无此列 | label 右侧新增 `ⓘ`（4 列与 compact 2 列都有） |
| Portfolio 桌面行 | `· auto-close ≈{c}¢` | 整行红轨 + 红字 | `· auto-close none`（内联小写 `#4d5560`） | 加载骨架 | 不追加该段 | level 与 none 两态值片段虚线下划线触发统一组件 |
| Portfolio 移动卡 | 句尾 `· auto-close ≈{c}¢` | 红描边 + 红句 | `· no auto-close, loss capped` | 加载骨架 | 不追加 | 无 |
| Pro | 本轮不动 | — | — | — | — | — |

tooltip 统一全文与触发器规格见 §2b。

`Est. auto-close ⓘ` 旁的 `Moves with your other positions` 随字段常驻。

## 5. Style Guide

`/style-guide` 8 个真实渲染 case（每态一 case，非文字表）：

| 编号 | preview key | 覆盖 |
|---|---|---|
| AC-P1 | `autoclose-desktop-rows` | 桌面行 level / hot / none / none(1×) |
| AC-P2 | `autoclose-standard-row` | Standard 行无 auto-close 段 |
| AC-P3 | `autoclose-mobile-cards` | 移动卡三态句式 |
| AC-T1 | `autoclose-position-none` | 持仓条 None + 副行 |
| AC-T2 | `autoclose-position-hot` | 持仓条 hot 红态 |
| AC-T3 | `autoclose-position-level` | 持仓条 level 无副行 |
| AC-T4 | `autoclose-order-panel-states` | 下单面板四态（2×2） |
| AC-T5 | `autoclose-order-panel-partial-net` | 新仓行 `Est. auto-close (new position)` |

节尾附两张表：求解器契约 / 面×态矩阵。所有 case 挂生产组件，值经 fixture 注入。

## 6. 涉及文件

**前端 · 逻辑**
- `src/lib/autoClosePrice.ts`（整文件重写）
- `src/hooks/useLitePortfolio.ts`（`LiteLiveRow.autoClose: AutoCloseResult`）

**前端 · 呈现**
- `src/components/portfolio/lite/LiveCards.tsx`
- `src/components/lite/contract/LitePositionCard.tsx`（新增 `autoCloseSub` / `autoCloseHot`）
- `src/pages/lite/LiteContractTrade.tsx`（`autoCloseFor` / `autoCloseDisplayFor`）
- `src/components/lite/contract/LiteContractOrderPanel.tsx`（`autoCloseRow` + 可选 `fixture` prop）

**Style Guide**
- `src/pages/StyleGuide/preview/autoClosePreviews.tsx`（新）
- `src/pages/StyleGuide/preview/registry.tsx`
- `src/pages/StyleGuide/sections/pages/LitePortfolioPage.tsx`
- `src/pages/StyleGuide/sections/pages/AutoCloseTradeCases.tsx`（新）、`LiteTradePage.tsx`

**文档 / 测试**
- `docs/copy-dictionary.md`、`DESIGN.md` §Addendum 2026-08-26
- `.lovable/memory/features/portfolio-auto-close-column.md`
- `src/lib/__tests__/autoClosePrice.test.ts`

## 7. 未变更项

- Pro 侧交易页、`useRealtimeRiskMetrics` 风控口径。
- Standard 段的任何列结构（不新增字段）。
- `fixture` prop 仅 style-guide 传入；生产不传 = 行为与视觉零变化。
