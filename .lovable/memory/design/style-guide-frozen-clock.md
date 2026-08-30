---
name: Style guide frozen clock
description: 时间态 style-guide case 必须用 nowOverride 冻结在交易所时区，生产不传该 prop
type: preference
---
Style-guide 里任何 session/倒计时相关 case，用组件可选 prop `nowOverride?: Date`
冻结时钟，且锚点按**交易所时区**的 wall-clock 计算（America/New_York、Asia/Hong_Kong…），
不要用查看者本地时间。生产调用永远不传 `nowOverride`，行为与实时钟一致。
已实现的承接件：`HomeStocksCard`、`StockRow`、`SpotSessionBanner`。
主页 stage / /spot session 的 previews 集中在
`src/pages/StyleGuide/preview/homeStagePreviews.tsx`（EV-1/5-10/24/25/27-35、SP-17/18）。
