# Lite 赢亏展示 — 交付说明 v1（2026-11-13）

> **通俗导读**：起因是一个线上投诉——用户放 $50 开 3× Boost，下单卡写着「最多亏 $50」，结果两笔各亏了约 $150；另一位用户下单卡显示「赢 $24.17」，实际只赚 $4.09。**机制不改（仍是全仓），只改 Lite 的展示**，让新手看得懂自己放进去多少、仓位多大、赢了净赚多少、最多会亏多少。
> 一共梳理出 17 处，分 8 排（画布「Lite 交易展示 17 条 · 改前改后」）。**本轮落地 ②–⑧**；① 下单面板等 CTO 确认赢亏规则后再做（见 §9）。
> 1. ② 下单成功提示写清「投入多少 · 几倍 · 仓位多大」。
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
| 1 | 打开 `https://omenxv2.lovable.app/style-guide`（不用登录） | 本次在 **Lite** 组四个节点：`交易页`（持仓卡 AC-T1 / AC-T1b / AC-T1c，1× 卡 TR-11 / TR-12）、`Portfolio`（Live 行与卡 PF-8、Boost check 说明 PF-7、单笔结算详情 PF-24 … PF-27）、`Events 列表` 里的首页 All 视图（HA-1）、`Wallet`（总余额与两张账户卡） |
| 1b | 只在字典看得到的态 | 手机 Profit ⓘ 抽屉打开（AC-T1c）、结算详情自动平仓 / 全亏（PF-26 / PF-25）——演示账号未必凑得出，是既定状态不是 bug；下单 / 平仓提示是 toast，没有字典帧，下一单、平一单就能看到 |
| 2 | 页头搜索框敲编号或 key | 例：`AC-T1b`、`portfolio-lite-detail-cashout` |
| 3 | 单张看 | `https://omenxv2.lovable.app/style-guide/preview?c=<key>`，切语言加 `&lang=ru` |
| 4 | 样张下面的表 | 「状态 / 触发条件 / 视觉 / 数据来源」 |

本轮受影响的样张见 §8。

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
- **单笔最多亏是否再按余额封顶、几笔加起来超过余额怎么提示**——属于 ①，等 CTO 确认，本轮不做。
- 海报口径与对账口径分开：海报（用户点 Share）**不扣手续费、不扣赢利佣金**；Portfolio、结算详情、钱包一律净额（2026-11-05 已统一）。

## 2. ② 下单成功提示

| 条件 | 文案 |
|---|---|
| Boost > 1× | `Bought {side} · ${A} at {N}× Boost · ${P} position` |
| Boost 1× | `Bought {side} · ${A}` |

Standard 下单卡（`LiteOrderPanel`）的 toast 本轮不动，仍是 `Bought {qty} shares · {side}`。

位置：`LiteContractOrderPanel` 下单成功 toast。

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

- **① 下单面板**（赢多少 / 最多亏多少 / 几笔加起来超过余额的提示）：等 CTO 回答（表格「Lite 下单面板赢亏规则 · 给 Jason」的「待确认」页）。
- 只在正式站存在、Lovable 里已经对的问题（赢多少公式、Boost check `$1.00`、结算 Payout 对不上等）单独列给研发，不在本文。
- 结算详情的买 / 卖手续费拆分来自成交记录；同一事件同一选项的多轮共用一本账时，成交记录可能多算，所以买入部分封顶为该仓手续费。正式版建议后端直接给每仓的开仓费 / 平仓费。

## 10. 多语言（7 语：en / zh-CN / zh-TW / ja / ko / ru / vi）

本文所有新文案都有 key，切语言即变；以下 key 是 **Lovable 2026-11-13 新增**，要回写平台 i18n 表（西语没有，回退英文）：

| key | en |
|---|---|
| `trade.screen.lite.winloss.toast_bought_boost` | `Bought {{side}} · {{putIn}} at {{boost}}× Boost · {{position}} position` |
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
| `wallet.category.{sports,crypto,macro,stocks,quickplay,politics,social}` | `sports` … `Quick Play` … |
| `wallet.category_list_two / _three / _more` | `{{a}} and {{b}}` / `{{a}}, {{b}} and {{c}}` / `{{a}}, {{b}} and more` |

改了值的已有 key：`portfolio.lite.boost.description`、`portfolio.lite.live.auto_close_if_wins`、`wallet.equityNoteLite`、`wallet.standardCategory`、`wallet.standardDescription`、`wallet.boostDescription`、`events.screen.simple.home.home_hero.sub_v2 / sub_v2_mobile / how_to_trade`、`events.screen.simple.events_simple_intro.how_to_trade`。

结算详情页里原有的行名（Side、Avg price、Shares、Fees、Payout、Placed 等）和 `Trading fee $X` / `Winning commission` 原来就是英文写死，不在本轮；这一页切到其他语言时会是新行中文 / 旧行英文混排，下一轮整页接 i18n。

## 11. 改动文件

`src/lib/liteWinLoss.ts`（新）· `LiteContractOrderPanel` · `LiteContractTrade` · `LitePositionCard` · `LiveCards` · `LitePortfolio` · `parts.tsx` · `LiteCashOutFlow` · `liteSettledShare` · `LiteSettlementDetail` · `SettlementDetailView` · `useSettlementDetail` · `Wallet.tsx` · `tradingService` / `useSupabasePositions`（流水描述）· 7 语 locales · style-guide 预览与说明表。
