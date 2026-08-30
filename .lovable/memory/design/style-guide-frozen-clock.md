---
name: Style guide rules 9 & 10 (geometry contract + frozen clock)
description: 规则 9 = 版式几何契约（页级总表 + 模块几何表）；规则 10 = 时间态 case 用 nowOverride 冻结在交易所时区
type: preference
---
**规则 9 · 版式几何契约**（DESIGN.md §7.9）
凡参与列对齐/高度分配的布局承重模块，case 必须附几何表，列固定为
「元素 → 宽 → 高 → 定高? → 延伸方向与上限 → 溢出处置」；
页级另立「版式几何总表」挂在该页定位行之下。数值一律抄代码常量，禁写「大约」。
落地：lite-events 页顶总表（SG-HP 附录 F2）+ EV-33 / EV-5 / EV-7 / EV-9·EV-31 / EV-32 模块表。

**规则 10 · 时间态 case 必须冻结钟**（DESIGN.md §7.10，原编号 9，SG-HPa 让位后改 10）
Style-guide 里任何 session/倒计时相关 case，用组件可选 prop `nowOverride?: Date`
冻结时钟，且锚点按**交易所时区**的 wall-clock 计算（America/New_York、Asia/Hong_Kong…），
不要用查看者本地时间。生产调用永远不传 `nowOverride`，行为与实时钟一致。
已实现的承接件：`HomeStocksCard`、`StockRow`、`SpotSessionBanner`。
例外：`formatLocalTime` 渲染的开盘钟点（`Opens hh:mm`）本就是**查看者本地时区**口径
（全站时间口径 R1），同一冻结瞬间在不同查看者时区显示不同数字，属预期，不是漂移。
主页 stage / /spot session 的 previews 集中在
`src/pages/StyleGuide/preview/homeStagePreviews.tsx`（EV-1/5-10/24/25/27-35、SP-17/18）。
