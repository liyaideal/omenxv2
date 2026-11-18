# Lite 赢亏展示 — 交付说明 v1（2026-11-13，11-16 补下单面板）

> **通俗导读**：起因是一个线上投诉——用户放 $50 开 3× Boost，下单卡写着「最多亏 $50」，结果两笔各亏了约 $150；另一位用户下单卡显示「赢 $24.17」，实际只赚 $4.09。**机制不改（仍是全仓），只改 Lite 的展示**，让新手看得懂自己放进去多少、仓位多大、赢了净赚多少、最多会亏多少。
> 一共梳理出 17 处，分 8 排（画布「Lite 交易展示 17 条 · 改前改后」），**全部落地**；① 下单面板的规则 CTO 在 11-16 确认（§1、§1.1）。
> 0. ① 下单面板：写「对了赢多少」（扣开仓费和 5% 佣金，等于结算后 Portfolio 的 Result）和「错了最多亏多少」；最多亏不超过 Boost 账户里的钱，这一笔就够亏光、或几笔加起来可能亏光时各有一行红字；auto-close 行、底注、Boost 提示句讲人话；下单卡和手机抽屉顶部的时间改成「开赛 / 本轮结束 / 预计结束」三种说法。
> 1. ② 下单成功提示写清「投入多少 · 几倍 · 仓位多大」，右边带 `View your call` 按钮，点了滚到这笔单的持仓卡（2026-11-18 追加，规则都在 §2，不另外交付）。
> 2. ③ 交易页持仓卡：`None` 下面写「最多会亏多少」；Profit 旁加 ⓘ，解释为什么刚买完 Profit 略低于 $0。
> 3. ④ Portfolio Live：`Cost` 改 `Put in`；Boost 行的「赢了得多少」改成净赚，并写出最多会亏多少；桌面表头改 `IF IT WINS / RISK`；Boost check 说明句换成人话。
> 4. ⑤ 平仓：亏了不再自动弹海报，只出一条提示；海报一律不扣手续费和赢利佣金。
> 5. ⑥ 结算详情：`Side` 只写方向，新增 `Position` 行，`Cost` 改 `Put in`，手续费拆买 / 卖，Activity 写每笔投入。
> 6. ⑦ 钱包：总余额说明、两张账户卡底注改写；平仓流水去掉结尾的 `Won` / `Lost`。
> 7. ⑧ 首页标语：`Tap Yes or No` 改 `Pick a topic, then pick a side.`（体育盘口没有 Yes / No）。
> 8. 以上新文案全部接了 7 种语言（§10）；Boost check 说明句和钱包那几句原来页面里写死英文，这次一起接上。

## 0. 查什么去哪儿

- 长什么样 → 生产页：交易页 `/trade?event=…`（Lite）、`/portfolio`（Live / Settled → 单笔详情）、`/wallet`、首页 `/`
- 什么时候变成什么样 → `/style-guide` → Lite → `交易页 ✅`、`Portfolio ✅`、`Wallet`、`首页 All 视图`
- 字段名、文案、公式、术语 → `docs/copy-dictionary.md`（顶部「Lite 术语对照表」新增 4 行；§Portfolio (Lite)、§结算详情 · 投入与仓位、§Wallet、§Trading、§Share）→ 本文
- 交易口径对照（杠杆 / 名义价值 / 单笔最大亏损 / 净赚）只维护在 copy-dictionary 顶部那张表，本文不复制。

## 0.1 字典怎么看

| 步 | 做什么 | 看到什么 |
|---|---|---|
| 1 | 打开 `https://omenxv2.lovable.app/style-guide`（不用登录） | 本次在 **Lite** 组四个节点：`交易页`（下单面板 TR-31 … TR-34、体育下单卡 TR-29；持仓卡 AC-T1 / AC-T1b / AC-T1c，1× 卡 TR-11 / TR-12）、`Portfolio`（Live 行与卡 PF-8、Boost check 说明 PF-7、单笔结算详情 PF-24 … PF-27）、`Events 列表` 里的首页 All 视图（HA-1）、`Wallet`（总余额与两张账户卡） |
| 1b | 只在字典看得到的态 | 下单面板「这一笔就能亏光」「几笔加起来可能亏光」（TR-32 / TR-33，演示账号钱多凑不出）、手机 Profit ⓘ 抽屉打开（AC-T1c）、结算详情自动平仓 / 全亏（PF-26 / PF-25）——演示账号未必凑得出，是既定状态不是 bug；下单 / 平仓提示是 toast，没有字典帧，下一单、平一单就能看到 |
| 2 | 页头搜索框敲编号或 key | 例：`AC-T1b`、`portfolio-lite-detail-cashout` |
| 3 | 单张看 | `https://omenxv2.lovable.app/style-guide/preview?c=<key>`，切语言加 `&lang=ru` |
| 4 | 样张下面的表 | 「状态 / 触发条件 / 视觉 / 数据来源」 |

本轮受影响的样张见 §8；按条核对见 §0.2。

## 0.2 研发核对清单（一条一行，做完一条勾一条）

改动比较碎，按页面拆成 27 条。每条的完整规则在「详见」那一节，样子看「字典」那一列的 key（`/style-guide/preview?c=<key>`）。**「共用」标了 ⚠ 的条目，改一处会同时影响别的页面，别漏。**

**① 交易页 · 下单面板**（桌面右侧下单卡 + 手机下单抽屉，同一个组件 `LiteContractOrderPanel`）

| # | 改什么 | 详见 | 字典 |
|---|---|---|---|
| 1 | 「对了赢」改成净额（扣开仓费和 5% 赢利佣金），旁边加 ⓘ 说明；下单按钮 `To win $X →` 用同一个数 | §1、§1.1 | TR-31 |
| 2 | 买对面抵掉旧仓位时：「对了赢」换成两行 `You'll get back ≈` + `Then if the rest is right, you win`；按钮上的 `To win` 只算新开部分 | §1.1 | — |
| 3 | 新增「错了亏」一行：1× `If you're wrong, you lose`，Boost `… lose up to` + ⓘ；金额 = 仓位 + 开仓费，封顶 Boost 账户总值；部分抵掉只算新开部分，全部抵掉不显示 | §1、§1.1 | TR-31 / TR-32 |
| 4 | 这一笔就能亏光时，亏损行下面红字 `That's everything you have in Boost.` | §1.1 | TR-32 |
| 5 | 这一笔 + 其他 Boost 持仓可能亏光时，红框 `If this and your other Boost calls all go wrong, …` | §1.1 | TR-33 |
| 6 | 「账户总值」「其他持仓还可能亏」两个新数（Lovable 在 `useRealtimeRiskMetrics` 前端算，正式版建议后端给，三处已知不准见 §9） | §1、§9 | — |
| 7 | Auto-close 行：标题 `Auto-close`、副标 `Only if your Boost balance runs low`；None 的三种小字；离买入价近时红字 `close to entry`；部分抵掉时叫 `Auto-close (new position)` | §1.1 | AC-T4 |
| 8 | 底注三种（1× 写具体金额 / Boost / 空金额）；**空金额时仍是原来的 `Want to place a limit order? Pro ›` 入口，不变** | §1.1 | TR-31 / TR-33 |
| 9 | Boost 档位下面加一句 `Bigger Boost: bigger win if you're right, bigger loss if you're wrong.` | §1.1 | TR-31 |
| 10 | 时间：桌面下单卡右上三种（`Kicks off in` / `Closes in` / `Expected to end in`，去掉原来结尾的 `left`）；比赛中沿用比赛时钟；长期事件过了预计结束日不显示 | §1.1 | TR-29 / TR-31 |
| 11 | 手机下单抽屉顶部：选的那边 + 时间 + 概率（体育 `78% chance Magic wins`，其他 `64% chance`），四种写法 | §1.1 | TR-34 |
| 12 | 下单按钮 `Buy {side}` / `{n}× BOOST` / `To win $X →` / `Market closed`、Boost 档位 `Custom` 接 7 语 | §10 | TR-33 |

**② 下单成功提示**

| # | 改什么 | 详见 | 字典 |
|---|---|---|---|
| 13 | 买入成功提示：标题 `Bought {side} · $A` + 副行 `N× Boost · $P position`（1× 和 Standard 没有副行）+ 按钮 `View your call`（2026-11-18 更新，原来是一行字、没有按钮） | §2 | TR-35 / TR-35b / TR-36 |

**③ 交易页 · 持仓卡**

| # | 改什么 | 详见 | 字典 |
|---|---|---|---|
| 14 | auto-close 为 None 时副行 `Can lose up to $X`，取代 `Loss capped at your stake` | §3 | AC-T1 |
| 15 | Profit 旁加 ⓘ 解释刚买完为什么略低于 $0；**手机上 ⓘ 点开是底部抽屉**（同卡 auto-close ⓘ 也一起改） | §3 | AC-T1b / AC-T1c |
| 16 | ⚠ 共用：auto-close 说明框（`AutoCloseTooltipBody`）None 那一段改写——下单面板、持仓卡、Portfolio 行等 5 处同时生效 | copy-dictionary「Auto-close tooltip（全站唯一）」 | AC-T4 |

**④ Portfolio Live**

| # | 改什么 | 详见 | 字典 |
|---|---|---|---|
| 17 | `Cost` → `Put in`（KPI、手机卡片格、桌面表头） | §4 | PF-4 / PF-8 |
| 18 | 桌面表头 `IF IT WINS / RISK`，整排大写，列宽 150 → 180、按钮列 170 → 140 | §4 | PF-8 |
| 19 | Boost 行：净赚 + 最多亏 + auto-close（手机一句，桌面三行）；Standard 行不变 | §4 | PF-8 |
| 20 | Boost check 说明句换成人话（卡片 / 抽屉 / 桌面弹层） | §4 | PF-7 |

**⑤ 平仓**

| # | 改什么 | 详见 | 字典 |
|---|---|---|---|
| 21 | 亏了不自动弹海报，只出 toast `… you lost $X on this call` | §5 | 无帧（toast） |
| 22 | 所有海报（自动弹出 / Settled 行 / 系列 / 单笔详情 Share）都不扣手续费和赢利佣金 | §5 | — |

**⑥ 单笔结算详情（手机 + 桌面）**

| # | 改什么 | 详见 | 字典 |
|---|---|---|---|
| 23 | Side 只写方向；`Cost` → `Put in`；新增 Position 行；手续费拆买 / 卖；Activity 金额与副行 | §6 | PF-24 … PF-27 |

**⑦ 钱包 · ⑧ 首页**

| # | 改什么 | 详见 | 字典 |
|---|---|---|---|
| 24 | Wallet 总余额下一行、Standard / Boost 两张卡底注改写，品类名接 7 语 | §7 | `wallet-lite-hero-note-lite`、`wallet-equity-bands` |
| 25 | 平仓流水去掉结尾 `· Won` / `· Lost`（旧流水显示时也去掉） | §7 | — |
| 26 | 首页标语 `Pick a topic, then pick a side.` | §7 | HA-1 |

**其他页面顺带受影响**

| # | 改什么 | 详见 | 字典 |
|---|---|---|---|
| 27 | ⚠ 共用：Lite 加密快轮页（`/spot?event=crypto-…-updown-…`，`LiteQuickTrade`）切到 Boost 时，下单卡右上倒计时也是 `Closes in …`（同一个下单组件）；Standard 那张卡仍是原来的 `12:30 left`，不动 | §1.1 | — |

**这次没动的**（别顺手改）：Pro / 现货的下单卡和按钮（赢的 ⓘ 仍是原文案）；Pro 页头赛前倒计时仍是 `Starts in 02:10:00`；Standard 下单卡的 toast；系列详情（多轮）仍是 `Cost`；单笔结算详情的旧行名（Side、Avg price、Fees 等）仍是英文写死；赢亏和 auto-close 的计算方法本身。

**只在正式站存在、Lovable 里已经对的问题**（赢多少公式、Boost check `$1.00`、结算 Payout 对不上等）另列给研发，不在这张清单里。

## 1. 数字口径（全部从一个文件出：`src/lib/liteWinLoss.ts`）

| 名称 | 用户看到 | 公式 | 函数 |
|---|---|---|---|
| 投入 | **Put in** | A（margin） | — |
| 仓位 | **Position** | P = A × Boost | — |
| 开仓手续费 | **trading fee** | F = P × 费率（`FUTURES_FEE_RATE`，与实际扣费同一配置；Lovable 0.15%，主网按主网配置） | `entryFeeFor(P)` |
| 赢了净赚 | **If it wins → +$X** | (1 − p) × Q − F − 5% × ((1 − p) × Q − F)，Q = 份数，p = 买入价 | `netWinIfRight(p, Q)` |
| 单笔最多亏 | **can lose up to $Y** | P + F | `maxLossFor(P)`；交易页持仓卡的 F 取「实际读到的开仓费」与「费率 × 整个仓位」中较大的那个（加过仓的单只能读到第一笔的费） |

- 价格接近 $1 时，赢了的价格结果可能小于手续费，净赚会显示成负数（如 `If it wins → -$0.03`）；这时不收赢利佣金（佣金只对正利润收）。
- 全仓：一笔亏过投入的部分从 Boost 余额里扣，所以「最多亏」写的是**仓位 + 开仓费**，不是投入。
- 下单面板的「最多亏」不超过 **Boost 账户总值**（现金 + 持仓投入 + 浮盈浮亏，`useRealtimeRiskMetrics().boostAccountValue`）；亏光后超出的部分由保险基金承担、**不向用户追缴**（CTO 2026-11-16）。
- 到期按 $1 结算只收开仓费、不收平仓费，所以「赢了净赚」只减开仓费（CTO 2026-11-16）。
- 海报口径与对账口径分开：海报（用户点 Share）**不扣手续费、不扣赢利佣金**；Portfolio、结算详情、钱包一律净额（2026-11-05 已统一）。

## 1.1 ① 下单面板（桌面下单卡 + 手机下单抽屉，同一个组件 `LiteContractOrderPanel`）

| 行 | 什么时候 | 写法 |
|---|---|---|
| 对了赢 | 始终（空金额为 $0.00）；买对面抵掉旧仓位时换成两行：`You'll get back ≈ $Y`（抵掉部分按现价拿回）+ `Then if the rest is right, you win $Z`（只算新开部分），全部抵掉时只有第一行 | `If you're right, you win` ⓘ + `netWinIfRight(价格, 份数)`；CTA `To win $X →` 同一个数（部分抵掉时 = 新开部分的 $Z）。ⓘ 说明：`After the trading fee and the 5% winning commission on profit. This is the same number your Portfolio will show once it settles.` |
| 错了最多亏 | 始终；买对面且全部抵掉旧仓位时不显示 | 1× `If you're wrong, you lose`，Boost `If you're wrong, you lose up to` ⓘ + 金额 M。M = 仓位 + 开仓费；买对面只抵掉一部分时只算新开那部分（CTO）。ⓘ 说明：`If you're wrong, the price goes to 0¢ and you lose the whole position plus the trading fee. With Boost, the part beyond what you put in comes out of your Boost balance.` |
| 这一笔就能亏光 | 已登录，账户总值 > 0，且 仓位 + 开仓费 ≥ Boost 账户总值 | M 写账户总值；亏损行下面红字 `That's everything you have in Boost.` |
| 几笔加起来可能亏光 | 已登录、这一笔没被封顶、有其他 Boost 持仓，且 M + 其他持仓还可能亏的钱 > 账户总值 | 亏损行下面红框 `If this and your other Boost calls all go wrong, you could lose everything you have in Boost.`。「其他持仓还可能亏」= 多：份数 × 现价；空：份数 × (1 − 现价)（`openCallsCouldLose`），买对面时减掉这一笔要抵掉的那部分旧仓位 |
| Auto-close | 始终 | 标题 `Auto-close` ⓘ，副标 `Only if your Boost balance runs low`；值 `≈ 52¢`；None 时 1× `nothing borrowed`、Boost `your balance covers it`、空金额 `enter an amount`；离买入价 10% 以内后缀红字 `close to entry`。部分抵掉时这一行叫 `Auto-close (new position)`，只算新开部分。估算算法不动 |
| 底注 | 金额 > 0 | 1×：`Not guaranteed. You can lose your full $X.`（X = M；全部抵掉、没有亏损行时用空金额那句）；Boost：`Not guaranteed. With Boost you can lose more than you put in.`；空金额：1× `… You can lose everything you put in.`、Boost 同 Boost 句 |
| Boost 档位下的提示 | 始终 | `Bigger Boost: bigger win if you're right, bigger loss if you're wrong.` |
| 时间（桌面卡右上 / 手机抽屉顶部） | — | 体育赛前 `Kicks off in 16h 08m`，比赛中沿用比赛时钟；轮次事件（`event_subtype` 含 `UPDOWN`，即全部 Up/Down 轮，不只加密）`Closes in 12:30`；其他长期事件 `Expected to end in 45d 3h`（倒数的是 Polymarket 预计结束日，过了可能还能交易，过了之后不显示时间）。手机抽屉后面接概率：体育 `78% chance Magic wins`，其他 `64% chance`；桌面不写概率 |

红字里**不写余额数**：有持仓时账户总值和上方显示的 `Boost balance`（可用现金）不是一个数，写出来会对不上（CPO 2026-11-16）。游客不封顶、不出红字。

## 2. ② 下单成功提示

> 2026-11-18 更新：提示从「一行字」改成「标题 + 副行 + `View your call` 按钮」，点按钮会滚到这笔单的持仓卡并描边 1.5 秒。下表和「点 View your call 之后」是现行写法，这两处随本需求一起做，不另外交付；`docs/delivery/placed-toast-view-call-v1.md` 只是同一件事的展开版（带代码常量）。

| 条件 | 标题 | 副行 | 按钮 |
|---|---|---|---|
| Boost ≥ 2× | `Bought {side} · ${A}` | `{N}× Boost · ${P} position` | `View your call` |
| Boost 1× | `Bought {side} · ${A}` | 没有 | `View your call` |
| Standard 新开 / 加仓 | `Bought {side} · ${实际扣款}` | 没有 | `View your call` |
| Standard 反向买入（把手里的持仓冲掉） | `Bought {qty} shares · {side}`（不变） | 没有 | 没有 |

- `${A}` = 投入金额（和持仓卡 PUT IN 一致，不含手续费）；`${P}` = 仓位金额。Standard 写实际从余额扣掉的钱（份数取整，可能比输入少几分）。
- 提示停留 6 秒（其他提示仍是默认时长）；样式沿用全站现有提示，按钮是白底黑字小按钮。
- 平仓提示（§5）不变，没有按钮。
- 11-13 的一行写法 `Bought {side} · ${A} at {N}× Boost · ${P} position` 和 Standard 的 `Bought {qty} shares · {side}`（新开 / 加仓时）已退役。

### 点 View your call 之后

| 规则 | 表现 |
|---|---|
| 滚动 | 页面平滑滚到这笔单的持仓卡，卡片停在视窗中间；提示同时收起 |
| 描边 | 卡片外圈亮一圈主色描边，约 1.5 秒后淡掉 |
| 定位到哪张 | 多 market 的事件定位到刚买的那个选项的持仓卡（按下单时的 option 匹配），不是页面上的第一张 |
| 卡片还没出来 | 每 150ms 再找一次，最多约 2 秒；到时仍没匹配上就取页面上第一张，一张都没有就不动 |
| 减少动态效果 | 系统开了这个设置时直接跳过去，不做平滑滚动 |
| 手机 | 下单抽屉先收起，提示出现在页面顶部，其余同桌面 |
| 范围 | Lite 的 Boost 事件页、Standard 事件页、加密涨跌轮页；Pro 终端不在范围 |

位置：`LiteContractOrderPanel` / `LiteOrderPanel` 下单成功后调 `showPlacedToast`（`src/components/lite/shared/placedToast.tsx`）。字典：TR-35 / TR-35b / TR-36。

## 3. ③ 交易页持仓卡

| 规则 | 触发 | 表现 |
|---|---|---|
| None 副行 | auto-close 为 none | `Can lose up to ${P + 已付开仓费}`（取实际扣的开仓费；读不到时按费率算）。取代 `Loss capped at your stake` |
| Profit ⓘ | 持仓卡有活价 | Profit 标签旁 ⓘ，悬停 / 点按打开：`Right after you buy, this starts a little below $0: you bought at {entry}, and selling right now gets {mark}. The {fee} trading fee was charged when you bought.` |

单仓卡和多 market 的每条腿都有 ⓘ。**手机上 ⓘ 点按打开底部抽屉**（标题 = 格子标签，正文同上）——tooltip 在触屏上点不开；同卡的 auto-close ⓘ 一起改成手机抽屉，桌面仍是悬停 tooltip。来源：`LiteContractTrade.profitNoteFor` → `LitePositionCard.profitNote`。

## 4. ④ Portfolio Live

| 规则 | 范围 | 表现 |
|---|---|---|
| `Cost` → `Put in` | KPI（手机 + 桌面）、手机卡片格、桌面表头 | key `common.put_in`（7 语已有）；手机卡片三格标签也改走 key（`common.now_worth`、Profit），不再写死英文 |
| 桌面表头 | 赢 / 风险那一列 | `IF IT WINS / RISK`（原 `AUTO-CLOSE / IF WINS`，顺序和格内内容相反，ru / vi 还在斜杠处折行）；整排表头统一大写；列宽 150 → 180px、按钮列 170 → 140px，7 语表头都不折行 |
| Boost 行一句话 | Boost 段的行（含 1×：全仓同样可能亏过投入） | 手机卡：`If it wins → +$X · can lose up to $Y`，level 态后接 ` · auto-close ≈{c}¢`；桌面行列窄，拆三行 `If it wins → +$X` / `Can lose up to $Y` / `auto-close ≈{c}¢`（或 `None`） |
| Standard 行 | Standard 段 | 不变：手机 `If it wins you get $X`，桌面 `If it wins → $X` |
| Boost check 说明句 | 卡片 / 抽屉 / 桌面弹层 | `All your Boost calls share your Boost balance. If it runs low, calls start closing automatically.`（key `portfolio.lite.boost.description`，7 语；原来页面里写死英文，这次接上） |

Boost 行里 X、Y 由「投入 × Boost」和份数反推买入价后代入 §1 公式（`LiveCards.boostFigures`）。

## 5. ⑤ 平仓提示与海报

| 规则 | 表现 |
|---|---|
判定按**价格结果**（这笔按买入价和卖出价算出的盈亏，不含手续费）——和海报口径一致：

| 条件 | 表现 |
|---|---|
| 价格结果 > 0 | toast `Cashed out ≈ $X`（X = 到账金额），并照旧自动弹海报（海报写价格结果，不扣费）。价格赚了但被手续费吃成小亏的也走这一支 |
| 价格结果 ≤ 0，且扣完开仓费后是亏的 | toast `Cashed out {side} · you lost $X on this call`（X = 投入 + 开仓费 − 拿回），**不弹海报**。价格持平但付了手续费也算这一支 |
| 价格结果 ≤ 0，扣费后不亏（没有开仓费的极端情况） | toast `Cashed out ≈ $X`，不弹海报 |
| 海报数字（自动弹出或用户点 Share） | 盈亏 = 价格结果（不扣开仓费、不扣赢利佣金）；左格 Put in；右格 = Put in + 价格结果 |

覆盖面：Lite 合约平仓、Standard 平仓（Standard 没有 pnl 时按「拿回 − 投入」算）、Settled 行 / 系列 / 单笔详情的 Share。

## 6. ⑥ 结算详情（单笔，手机 + 桌面）

| 行 | 规则 |
|---|---|
| Side | 只写方向，如 `Magic`（不再拼 `· 3× Boost`） |
| Put in | 取代 `Cost`；手机为 Details 一行，桌面为 KPI 卡标题 |
| Position | Boost > 1× 才有：`$X · N× Boost`，X = 投入 × N。手机在 Put in 下一行，桌面在 Details 的 Side 下一行；桌面 PUT IN 卡副行第二行 `$X position` |
| Fees 副行 | `Trading fee $A buy · $B sell`；A = Open / Add 成交的手续费合计（封顶为该仓手续费），B = 剩下的部分；B < $0.005 时整句退回 `Trading fee $X`；有赢利佣金时后接 ` · Winning commission $Y` |
| Activity · Open / Add | 金额 = 份数 × 成交价（这笔成交的仓位价值；trades.amount 在个别下单路径存的是输入额，不可靠）；Boost > 1× 时下方加副行 `$X put in · N× Boost`（X = 份数 × 成交价 ÷ N） |

数据：`useSettlementDetail` 的成交记录新增 `fee`（取 trades.fee）。系列详情（多轮）不在本轮范围，仍是 `Cost`。

## 7. ⑦ 钱包 · ⑧ 首页

| 位置 | 新文案 |
|---|---|
| Wallet 总余额下一行（Lite） | `Cash in your accounts now. Open calls count once you close them.`（单独一句，不再接 `Boost + Standard ·`；Pro 不变） |
| Standard 卡底注 | `For stocks and Quick Play. Put in $100, buy $100 of shares — the most you can lose is what you put in.` |
| Boost 卡底注 | `For {categories}. Trade with leverage — Boost up to {maxBoost}×.`（品类随配置） |
| 平仓流水 | `Cashed out: {event} · {side}`——新写入的不再带 `· Won` / `· Lost`；旧流水显示时去掉 |
| 首页 hero 副标题（手机）/ `how_to_trade` | `Pick a topic, then pick a side.` |
| 首页 hero 副标题（桌面） | `Think you know what happens next? Pick a topic, then pick a side.`（`sub_v2` 与手机 `sub_v2_mobile` 两个 key 在 ja / ko / ru / vi 里本来就没有，回退英文，与改前一致；`how_to_trade` 7 语齐） |

Wallet 卡底注与总余额说明原来页面里写死英文，这次全部接上 7 语：`wallet.equityNoteLite`、`wallet.boostCategories`（Standard 卡也用它拼 `For stocks and Quick Play.`）、`wallet.standardDescription`、`wallet.boostDescription`、`wallet.boostFullPriceDescription`；品类名改走 `wallet.category.<key>`，列举的连接词走 `wallet.category_list_two / _three / _more`（俄语用属格，如 `Для спорта, криптовалют и макроэкономики.`）。

## 8. 字典样张（本轮新增 / 受影响）

| 排 | key | 看什么 |
|---|---|---|
| ① | `trade-tr31` … `trade-tr33`（TR-31 … TR-33） | 下单面板：1×、这一笔就能亏光、几笔加起来可能亏光（桌面 1280 + 手机 375） |
| ① | `trade-tr34`（TR-34） | 手机抽屉顶部四种时间写法 |
| ① | `trade-tr29` | 体育下单卡右上 `Kicks off in …` |
| ③ | `autoclose-position-none` | None 副行 `Can lose up to $242.41` |
| ③ | `autoclose-position-profit-note`（新增 AC-T1b） | Profit ⓘ 打开态（桌面 tooltip） |
| ③ | `autoclose-position-profit-note-mobile`（新增 AC-T1c） | Profit ⓘ 手机抽屉打开态 |
| ③ | `trade-tr11`、`trade-tr12` | 1× 卡的 None 副行 |
| ④ | `portfolio-lite-live-cards`、`portfolio-lite-desktop-rows` | Put in；Boost 行一句话 |
| ④ | `portfolio-lite-kpi-mobile`、`portfolio-lite-kpi-desktop` | KPI `Put in` |
| ④ | `portfolio-lite-details-drawer`、`portfolio-lite-details-popover`、`portfolio-lite-gauge-states` | Boost check 说明句 |
| ⑥ | `portfolio-lite-detail-cashout(-mobile)` | Bucks vs. Magic 那笔：Position、手续费拆买卖、Activity 副行 |
| ⑥ | `portfolio-lite-detail-won(-mobile)` | 2× 到期结算：有 Position、没有卖出费所以手续费不拆、有赢利佣金 |
| ⑥ | `portfolio-lite-detail-autoclosed(-mobile)` | 3× 自动平仓：有 Position、手续费拆买 / 卖（卖出那笔是自动平仓的费） |
| ⑥ | `portfolio-lite-detail-lost(-mobile)` | 1×：没有 Position 行、Activity 无副行 |
| ⑦ | `wallet-equity-bands`、`wallet-lite-hero-note-lite` | 总余额说明、两张卡底注 |
| ⑧ | `home-ha1` | hero 副标题 |

② 与 ⑤ 是 toast，没有字典帧；在交易页下单 / 平仓即可看到。

## 9. 没做的 / 等确认的

- 只在正式站存在、Lovable 里已经对的问题（赢多少公式、Boost check `$1.00`、结算 Payout 对不上等）单独列给研发，不在本文。
- 结算详情的买 / 卖手续费拆分来自成交记录；同一事件同一选项的多轮共用一本账时，成交记录可能多算，所以买入部分封顶为该仓手续费。正式版建议后端直接给每仓的开仓费 / 平仓费。
- ① 下单面板「Boost 账户总值」和「其他持仓还可能亏」在 Lovable 里是前端用持仓与实时价格算的，正式版建议后端给。三处已知不准，Lovable 没修，正式版请按后端口径做：
  - 挂着没成交的限价单占用的钱没算进账户总值；
  - 部分平仓以后，没有实时价格时用数据库里的盈亏兜底，这时可能多算一遍；
  - 空单「还可能亏」按 份数 × (1 − 现价) 估。

## 10. 多语言（7 语：en / zh-CN / zh-TW / ja / ko / ru / vi）

本文所有新文案都有 key，切语言即变；以下 key 是 **Lovable 2026-11-13 / 11-16 新增**，要回写平台 i18n 表（西语没有，回退英文）：

| key | en |
|---|---|
| `trade.screen.lite.winloss.toast_bought_boost` | `Bought {{side}} · {{putIn}} at {{boost}}× Boost · {{position}} position`（2026-11-18 起不再使用，key 保留） |
| `trade.screen.lite.winloss.toast_boost_line` | `{{boost}}× Boost · {{position}} position`（2026-11-18 新增） |
| `trade.screen.lite.winloss.toast_view_call` | `View your call`（2026-11-18 新增） |
| `trade.screen.lite.winloss.toast_bought` | `Bought {{side}} · {{putIn}}` |
| `trade.screen.lite.winloss.can_lose_up_to` | `Can lose up to {{amount}}` |
| `trade.screen.lite.winloss.profit_note` | `Right after you buy, this starts a little below $0: you bought at {{entry}}, and selling right now gets {{mark}}. The {{fee}} trading fee was charged when you bought.` |
| `trade.screen.lite.winloss.about_profit` | `About profit`（ⓘ 的读屏名） |
| `trade.screen.lite.winloss.toast_cashed_out` | `Cashed out ≈ {{amount}}` |
| `trade.screen.lite.winloss.toast_cashed_out_lost` | `Cashed out {{side}} · you lost {{amount}} on this call` |
| `portfolio.lite.live.boost_sentence` | `If it wins → {{win}} · can lose up to {{loss}}` |
| `portfolio.lite.live.if_wins_net` | `If it wins → {{win}}` |
| `portfolio.lite.live.can_lose_up_to` | `Can lose up to`（金额另起一个白色 span） |
| `portfolio.lite.live.auto_close_word` | `auto-close` |
| `portfolio.lite.live.auto_close_at` | `auto‑close ≈{{price}}`（不换行连字符 + 不换行空格；整段 nowrap，中日韩也不会从中间断） |
| `portfolio.lite.detail.position` | `Position` |
| `portfolio.lite.detail.position_value` | `{{amount}} · {{boost}}× Boost` |
| `portfolio.lite.detail.position_sub` | `{{amount}} position` |
| `portfolio.lite.detail.fee_split` | `Trading fee {{buy}} buy · {{sell}} sell` |
| `portfolio.lite.detail.put_in_sub` | `{{amount}} put in · {{boost}}× Boost` |
| `trade.screen.lite.lite_contract_order_panel.{lose, lose_up_to, about_what_you_lose, lose_tooltip, lose_everything, over_account}` | ① 错了最多亏一行、两种红字（11-16） |
| `trade.screen.lite.lite_contract_order_panel.{auto_close, ac_only_if_low, ac_nothing_borrowed, ac_balance_covers, ac_enter_amount, ac_close_to_entry, ac_new_position}` | ① Auto-close 行（11-16） |
| `trade.screen.lite.lite_contract_order_panel.{get_back, rest_right_win}` | ① 买对面抵掉旧仓位时的两行（11-16） |
| `trade.screen.lite.lite_contract_order_panel.{cta_to_win, cta_boost, market_closed}` | ① 下单按钮：`To win {{amount}} →`、`{{boost}}× BOOST`、`Market closed`（11-16；`Buy {{side}}` 复用已有 `lite_contract_trade_page.buy_side`，`Custom` 复用已有 `lite_contract_order_panel.custom`） |
| `trade.screen.lite.lite_contract_order_panel.{footnote_boost, footnote_full, footnote_empty, boost_hint, win_tooltip}` | ① 底注、Boost 提示句、赢的 ⓘ 说明 |
| `trade.screen.lite.lite_contract_order_panel.{closes_in, expected_to_end_in, chance, chance_side_wins}` · `events.screen.simple.sports_clock.kicks_off_in` | ① 时间与概率 |
| `wallet.category.{sports,crypto,macro,stocks,quickplay,politics,social}` | `sports` … `Quick Play` … |
| `wallet.category_list_two / _three / _more` | `{{a}} and {{b}}` / `{{a}}, {{b}} and {{c}}` / `{{a}}, {{b}} and more` |

改了值的已有 key：`portfolio.lite.boost.description`、`portfolio.lite.live.auto_close_if_wins`、`wallet.equityNoteLite`、`wallet.standardCategory`、`wallet.standardDescription`、`wallet.boostDescription`、`events.screen.simple.home.home_hero.sub_v2 / sub_v2_mobile / how_to_trade`、`events.screen.simple.events_simple_intro.how_to_trade`。

结算详情页里原有的行名（Side、Avg price、Shares、Fees、Payout、Placed 等）和 `Trading fee $X` / `Winning commission` 原来就是英文写死，不在本轮；这一页切到其他语言时会是新行中文 / 旧行英文混排，下一轮整页接 i18n。

## 11. 改动文件

`src/lib/liteWinLoss.ts`（新）· `LiteContractOrderPanel` · `LiteOrderDrawerHeader`（新）· `LiteBoostSelector` · `LiteContractTrade` · `LiteQuickTrade` · `sportsClock` · `WinTooltipBody`（加可选 body，默认不变）· `AutoCloseTooltipBody` · `useRealtimeRiskMetrics`（新增 `boostAccountValue` / `openCallsCouldLose`）· `LitePositionCard` · `LiveCards` · `LitePortfolio` · `parts.tsx` · `LiteCashOutFlow` · `liteSettledShare` · `LiteSettlementDetail` · `SettlementDetailView` · `useSettlementDetail` · `Wallet.tsx` · `tradingService` / `useSupabasePositions`（流水描述）· 7 语 locales · style-guide 预览与说明表。
