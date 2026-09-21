# 订单状态标 · 部分成交明细（PF-1）— 交付说明 v1

> 2026-09-21 联合验收时 Liya 提出：限价单部分成交时，Current Orders 里应该有提示（hover 看成交进度），桌面和手机都没有。查下来：桌面**合约**表有一个老的 hover（本地 mock 订单时代留下的），桌面**现货**表、手机合约卡、手机现货卡都没有；且蓝图引擎限价撮合是整单成交，`Partial Filled` 在生产上从不出现。本轮把四个挂载点统一到一个组件，并把规格挂进字典给研发。

## 0. 读者须知

- 长什么样 → `/style-guide` →「Pro — 交易终端」→「订单状态标 · 部分成交明细」：PF-D1（桌面表 hover）、PF-M1（手机卡点开）
- 生产上看不到 `Partial Filled`（见 §4），Pending / Filled / Cancelled 三态生产可见
- Lite 面 → 不涉及

## 1. 口径（Liya 09-21 批，A–E）

| 条 | 规则 |
|---|---|
| A 位置 | 桌面 `/trade` 与 `/spot` 的 Current Orders 表 Status 列、手机合约 `OrderCard`、手机现货卡的状态标——同一个组件 `OrderStatusBadge` |
| B 内容 | `Fill progress  480 / 1,200 (40%)` + 进度条 + `Filled` / `Remaining` 两行；沿用字典原「Order Status & Partial Fill」规格，不新造词 |
| C 条件 | 只有 status = `Partial Filled` 才可展开；桌面 hover（HoverCard），手机点一下（Popover），再点或点外面收起。Pending / Filled / Cancelled 是普通标 |
| D 数据 | 蓝图引擎照旧整单成交，不模拟部分成交；`UnifiedOrder.filledAmount / remainingAmount` 只有本地 mock 订单带，Supabase `trades` 没有已成交数量字段。研发的真撮合要给到 filled 数量 |
| E 字典 | 原「Order Status & Partial Fill」所在的 `TradingSection` 并未挂载在 `/style-guide`（死文件，未动）；新节挂生产 `SpotOrdersTable` 两个变体，PF-D1 / PF-M1 |

## 2. 实现指引

- `src/components/trading/OrderStatusBadge.tsx`：`{ status, amount, filledAmount?, remainingAmount?, variant, label?, previewOpen? }`；filled 缺省时用 `amount − remaining`。颜色：Partial 青、Pending 黄、Filled 绿、Cancelled 红。
- 挂载：`DesktopTrading.tsx` 合约表（替换原 Tooltip 内联）、`ProSpotShared.tsx` 桌面表 + 手机卡（`label` 传 `Cancelled · market frozen` 覆盖文案）、`OrderCard.tsx`（新增 `filledAmount / remainingAmount` props，卡头与取消抽屉里的状态行都用它）。
- 现货表 `Partial Filled` 行的 `Cancel` 保持可点（之前只认 `Pending`）。

## 3. 已知边界

- 生产上 `Partial Filled` 不可达，直到研发接真撮合；蓝图里只在字典看。
- 桌面合约表仍是 `DesktopTrading.tsx` 内联 JSX，字典里桌面态用的是现货表（同一个 badge），合约表随 ProContractPanel 提取再补。
