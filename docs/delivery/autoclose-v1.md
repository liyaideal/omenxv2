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

| 面 | level | hot | none | 瞬态 | Standard |
|---|---|---|---|---|---|
| 下单面板 Returns 行 | `≈ {c}¢` | 红 `≈ {c}¢ · close to entry` | `None · loss capped` | 零单 `None · enter an amount`；加载骨架 | 无此行 |
| 下单面板 partial-net 行 | `≈ {c}¢` | 红 | `None · loss capped` | 零单 `None` | — |
| 交易页持仓条 | `≈ {c}¢`（无副行） | 红 + `Close to current price` | `None` + `Loss capped at your stake` | 加载骨架 | 无此列 |
| Portfolio 桌面行 | `· auto-close ≈{c}¢` | 整行红轨 + 红字 | `· auto-close none`（内联小写 `#4d5560` + tooltip 全句） | 加载骨架 | 不追加该段 |
| Portfolio 移动卡 | 句尾 `· auto-close ≈{c}¢` | 红描边 + 红句 | `· no auto-close, loss capped` | 加载骨架 | 不追加 |
| Pro | 本轮不动 | — | — | — | — |

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
