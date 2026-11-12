# Lite 交易页与 Portfolio 四处小优化 — 交付说明 v1（2026-11-05）

> **通俗导读**：这次是在已经交付过的 Lite 交易页和 Portfolio 上改四处，都不是新页面。
> 1. **余额不够时的下单卡**：原来输入金额会被限制在 Max 以内（主站已经这么做了），但余额不到 $1 时 Max 是 0，输什么都变回 $0.00，用户以为是 bug。现在这种情况下卡片多一行提示 `Add money to your Boost balance to make a call.`（Standard 卡写 `…Standard balance to place an order.`），快捷金额置灰；下单按钮不变，划转还是用余额旁边原有的 ⇄。
> 2. **桌面交易页下单卡悬浮**：右栏的下单卡跟着页面走，滚到列表很下面选 market 也能看到下单卡。原来在下单卡下面的 More markets / More stocks 挪到左栏最底部。
> 3. **Settled 的分享入口**：Live 早就有分享，Settled 之前只有单笔详情页有。现在 Settled 列表每一行、以及系列详情页都能分享；海报沿用原来的结算海报和 Quick Play 海报，不新增样式。
> 4. **Settled 的数统一扣手续费**：列表行、顶部 Net Profit / Win Rate / Record、单笔详情、系列详情、分享海报，全部用"盈亏 − 手续费"这一个数，现在各行加起来正好等于顶部 Net Profit。

## 0. 查什么去哪儿

- 长什么样 → 生产页：交易页 `/trade?event=…`、`/spot?event=…`；组合页 `/portfolio?tab=settled`
- 什么时候变成什么样 → `/style-guide` → Lite → `交易页 ✅`、`Portfolio ✅`
- 字段名、文案、公式、术语 → `docs/copy-dictionary.md`（§Portfolio (Lite) 结算详情一节）→ 本文
- 提问前先按上面顺序查一遍；查不到再提，提问时写明"我查了 X 没有"。

## 0.1 字典怎么看

| 步 | 做什么 | 看到什么 |
|---|---|---|
| 1 | 打开 `https://omenxv2.lovable.app/style-guide`（不用登录） | 本次只在 **Lite** 组的两个节点：`交易页 ✅`、`Portfolio ✅` |
| 2 | 点节点，看顶部「本页目录」 | 小节按产品页从上到下排，右侧是编号范围，点了滚过去 |
| 3 | 小节顶部黄框「定位行」 | 对应路由、词典节、交付文档 |
| 4 | 每张样张 | `编号 · 状态名（组件名）` + iframe 里的真组件（桌面 100% 宽 / 手机 375 宽），可以点 |
| 5 | 样张下面的表 | 「状态 / 触发条件 / 视觉 / 数据来源」，触发条件就是判定表达式 |
| 6 | 找编号 | 页头搜索框敲 `TR-30` / `SP-20` / `PF-19` / `PF-29` |
| 7 | 单张看 | `https://omenxv2.lovable.app/style-guide/preview?c=trade-tr30`（其它：`spot-sp20`、`portfolio-lite-settled`、`portfolio-lite-series-detail`、`portfolio-lite-series-mobile-page`） |

编号规则：`TR-` 合约交易页，`SP-` 现货交易页，`PF-` Portfolio；字典里 Settled 行、系列详情的样张都按"已登录"画，所以带分享图标。

只在字典可见、演示账号凑不出条件的态：**TR-30 / SP-20 余额不够**——演示账号 alex_carter 有余额，生产页上看不到，是既定状态不是 bug（换一个余额不到 $1 的账号就能在生产页看到）。

## 1. 余额不够时的下单卡（Boost 卡 + Standard 卡，桌面右栏与手机抽屉同一张卡）

| 规则 | 触发条件 | 表现 |
|---|---|---|
| 输入不超过 Max | 已登录，手输或点快捷金额 > `floor(该账户余额)` | 输入框里的数直接变成 Max，不提示 |
| 余额不够 | 已登录，`floor(该账户余额) < 1`（即 Max = 0） | 输入框锁住只显示占位 `0`；输入框下一行提示（文案见下）；$10 / $25 / $50 / $100 / Max 置灰不可点；**下单按钮、按钮下的脚注都不变** |
| 对冲例外（仅 Boost 卡） | 买的是已持仓的另一边 | 不封顶、不提示——这笔先用持仓换回的钱，钱包不是上限 |
| 游客例外 | 未登录 | 不封顶、不提示——点 Buy 先拉起登录 |

文案（7 种语言已入 `src/locales/*.json`）：
- Boost 卡：`Add money to your Boost balance to make a call.`（key `trade.screen.lite.lite_contract_order_panel.low_balance_hint`）
- Standard 卡：`Add money to your Standard balance to place an order.`（key `spot.screen.lite_spot_order_panel.low_balance_hint`）

和主站的差别：主站已经有"输入不超过 Max"，缺的是 Max 为 0 时那一行提示和快捷金额置灰。

> **2026-11-12 追加**：提示里的 `Add money` 改成链接——另一个账户有钱打开划转、两个都没钱去 `/deposit`，下单按钮仍不变。见 [deposit-ux-v1 §3](./deposit-ux-v1.md#3-下单卡余额不够add-money-做成链接)。

## 2. 桌面交易页下单卡悬浮

适用所有 Lite 交易页桌面端：合约（Boost）、现货（Standard）、加密快速回合；一个 market 和多个 market 都一样。手机端是底部抽屉，不涉及。

1. 右栏顶上那块（下单卡；已结算时是结果卡；快速回合是 pick 卡 + 下单卡）贴在站点顶栏下方 16px 悬浮。用户滚到列表下面选了某个 market，下单卡仍在眼前，卡上 `Market · change in the list ←` 写着选中的是哪一个。
2. 卡片比顶栏下面的可见区域还高时，改为贴底：卡底离窗口底 16px，先滚走卡片顶部，Buy 按钮永远看得见。
3. 右栏下面原来的 `More markets` / `More stocks` / `Also live now` 挪到左栏最底部（否则会滚到悬浮卡下面被盖住）。
4. 卡片不跟着选中行上下对齐，只做悬浮。

## 3. Settled 的分享入口

| 入口 | 位置 | 控件 |
|---|---|---|
| Settled 列表 | 每一行（单笔、系列、Quick Play 场次） | 金额左边的分享图标，同 Live 行；金额列固定宽度（88px）右对齐，各行图标在同一列；点图标只开海报，点行其它位置照旧进详情 |
| 系列详情 | `/portfolio?tab=settled&series=…` | 桌面：标题行 `Share` 按钮（同单笔详情）；手机：页头右上分享图标 |

只在已登录时渲染。手机上为了给图标让位，Settled 行的标题最多两行、副行换行显示，不用省略号截断。

海报怎么填（不新增样式，字段也不变）：

| 海报位置 | 单笔结算 | 系列 | Quick Play 场次 |
|---|---|---|---|
| 用哪张 | 结算海报（和单笔详情页弹出的一样） | 同一张结算海报 | 场次详情页那张街机海报 |
| 第二行 | 方向词，如 `Up · Boost` | `Won {赢的轮数} of {总轮数} rounds` | — |
| Profit / Lost、ROI | 这笔的结果（扣费后）、结果 ÷ 投入 | 系列合计结果、合计 ÷ 总成本 | — |
| Put in / Paid out | 投入 / 拿回 | 总成本 / 总派彩 | — |
| 右上角日期 | 结算日 | 最后一轮结算日 | — |
| 海报链接 | 该笔结算详情页 | 事件页（系列没有单笔结算 id） | 不变 |

完整入口表见 `docs/delivery/lite-share-v1.md` §4.1（现为十处）及文末附表。

## 4. Settled 的数统一扣手续费

| 位置 | 用的数 |
|---|---|
| 单笔行、单笔详情的 Won / Lost | `pnl − fees` |
| 系列行、系列详情 Net | 各轮 `pnl − fees` 之和 |
| 顶部 Net Profit | 全部单笔 `pnl − fees` 之和 + Quick Play 场次净额 |
| Win Rate / Record | 按扣费后的结果判输赢（`> 0` 才算赢） |
| Payout | `max(0, Cost + 结果)` |
| 分享海报 | 与对应详情页同一组数 |

对账：Settled 各行（含系列、Quick Play）加起来 = 顶部 Net Profit（演示账号实测 -$1,424.96 vs -$1,424.97，差 1 分是四舍五入）。`fees` = 交易手续费（同一事件同一选项的账本按投入摊分到各仓）+ 赢利佣金，取数同列表行。

## 7. 状态索引

| 模块 | 字典编号 |
|---|---|
| Boost 卡余额不够 | TR-30（`trade-tr30`） |
| Standard 卡余额不够 | SP-20（`spot-sp20`） |
| Settled 列表分享图标、海报字段 | PF-19（`portfolio-lite-settled`）spec 末两行；PF-20 / PF-21 / PF-39 样张同样带图标 |
| 系列详情 Share | PF-29（`portfolio-lite-series-detail`、`portfolio-lite-series-mobile-page`） |
| Payout 与结果数口径 | PF-24 spec「Payout 公式」行 |

## 8. 涉及文件

- 下单卡：`src/components/lite/contract/LiteContractOrderPanel.tsx`、`src/components/lite/trade/LiteOrderPanel.tsx`
- 悬浮：`src/components/lite/shared/StickyRailCard.tsx`；挂载 `src/pages/lite/LiteContractTrade.tsx`、`LiteSpotTrade.tsx`、`LiteQuickTrade.tsx`
- 分享：`src/lib/liteSettledShare.ts`、`src/components/portfolio/lite/SettledList.tsx`、`SeriesDetailView.tsx`、`src/pages/lite/LitePortfolio.tsx`
- 扣费口径：`src/hooks/useLitePortfolio.ts`、`src/pages/lite/LiteSettlementDetail.tsx`、`src/components/portfolio/lite/SettlementDetailView.tsx`（`detailPayout`）
- 相关文档同步改动：`lite-order-input-v1.md` §2、`lite-behavior-appendix.md` §1.6、`lite-share-v1.md` §4.1 与附表、`lite-portfolio-spec-v2.md` §4、`copy-dictionary.md` 结算详情一节

## 9. 未变更项

- 下单按钮文案、脚注、划转弹窗本身都没改；Quick Play（/arcade）与 Table 下单区不在本次范围。
- 手机交易页布局不变（下单仍是底部抽屉）。
- Live 页签、Pro 终端、Pro 的 `/portfolio/settlements` 旧页不变。
- 海报组件样式不变。
