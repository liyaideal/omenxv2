# Style Guide · Portfolio 从"状态陈列"改成"可实现的需求文档"

现在的问题是结构性的：预览只把状态摆出来，触发条件写在一条长长的中文 note 里，研发看完仍然不知道"什么时候变红""这条什么时候出现"。这一轮把 Portfolio 节改成 **每个状态一行规格**，并顺手修掉桌面 frame 里混进移动端的 bug。

## 1. 每个 case 配一张"触发条件表"，而不是一段 note

给 `SectionFrame` 增加 `spec` 字段（表格数据），在 frame 下方按 case 渲染成表格，固定四列：

| 状态 | 触发条件（字段 / 公式） | 视觉结果 | 数据来源 |
|---|---|---|---|

规则：条件列必须写**可判定的表达式**，不写形容词。示例（持仓卡）：

| 状态 | 触发条件 | 视觉结果 | 来源 |
|---|---|---|---|
| 普通行 | `hot === false` | 卡片无描边，payout 句 `#6B7280` | `useLitePortfolio` |
| 热行（发红） | `autoClosePrice != null && \|priceNow − autoClosePrice\| / priceNow ≤ 0.10` | 卡片 `1px solid rgba(255,92,92,.55)`；桌面行 `inset 3px` 红左轨 + `rgba(255,92,92,.04)` 底；payout 整句 `RED` | `live[].hot` |
| 有 auto-close 后缀 | `segment==='boost' && leverageNum>1 && autoCloseState==='level' && autoClosePrice!=null` | 主句后追加 ` · auto-close ≈{cents}` | `autoCloseState` |
| 无后缀 | `autoCloseState` 为 `'none'` 或 `'missing'`，或 standard | 只有 `If it wins you get $X` | 同上 |
| voucher 行 | `isVoucher === true` | meta 行尾追加 volt 色 `Voucher` | `airdropSource==='voucher'` |
| 挂单行 | `orders.length > 0` | 虚线行；`=== 0` 时组件 return null | `PendingOrdersRow` |

Boost check 仪表同样处理，条件写死阈值与来源公式：

| 状态 | 触发条件 | 视觉 |
|---|---|---|
| Healthy | `riskRatio < 80` | 绿字 + 绿条 |
| Getting tight | `80 ≤ riskRatio < 95` | 琥珀 |
| Auto-close soon | `riskRatio ≥ 95` | 红 |

并补一行口径说明：`riskRatio = imTotal / equity × 100`（账户级、跨仓，非单仓），`untilAutoClose = equity − imTotal`；仪表只在存在 Boost 持仓时渲染。

同样补齐的还有：KPI 零态（`|net| < 0.005` → muted `$0.00` 不带符号）、Settled remark 三态（`closeReason` = `settlement` / `auto_close` / `cashout`）、系列聚合行（`isSeries`）、空态 / 未登录门 / 错误边界的触发条件。

## 2. 修桌面 frame 里出现移动端的问题

原因确认：`portfolioPreviews.tsx` 里 4 个结算详情 preview（won / auto_close / cashout / lost）都是 `SettlementDetailMobile` 与 `SettlementDetailDesktop` **并排**渲染，所以挂在桌面 case 列表里就带出了移动端那一列。

改法：拆成纯端 preview。
- `*DesktopPreview` 只渲染 `SettlementDetailDesktop` → 留在桌面 case 列表。
- `*MobilePreview` 只渲染 `SettlementDetailMobile` → 移到移动 case 列表。
- 系列详情、series 两极同样检查并拆分。
- 规则写进 SectionFrame 注释：**桌面 frame 内不得出现任何移动端组件**，双端对照靠两个 frame 并列，而不是一个 iframe 内左右并排。

## 3. 节首加一段"怎么读这份文档"

Portfolio 节顶部加一个小说明块：状态由 `useLitePortfolio` 派生的字段驱动（`segment` / `isVoucher` / `autoCloseState` / `hot` / `closeReason` / `isSeries`），style-guide 的每个 case 都能用表里的条件在生产数据上复现；表里没有的组合视为不存在。

## 技术改动清单

- `src/pages/StyleGuide/components/SectionFrame.tsx` — `SectionCase` 增加 `spec?: { state: string; when: string; visual: string; source?: string }[]`，legend 区改为按 case 渲染小标题 + 表格（保留 `note` 作为补充说明）。
- `src/pages/StyleGuide/preview/portfolioPreviews.tsx` — 4 个结算详情 preview 拆成 mobile / desktop 两套导出；其余混端 preview 同步拆分。
- `src/pages/StyleGuide/preview/registry.tsx` — 注册新拆出的 key。
- `src/pages/StyleGuide/sections/pages/litePages.tsx` — Portfolio 的移动 / 桌面 case 列表改写为带 `spec` 表；新增节首阅读说明。
- 不动 `src/components/portfolio/lite/**` 与 `useLitePortfolio.ts`：全部是文档层改动，生产行为零变更。

做完这一轮，其它章节可按同一 `spec` 表格式逐节迁移。
