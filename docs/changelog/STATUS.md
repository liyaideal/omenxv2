# 交付实施对照表（STATUS）

> 跨文档汇总，看实施进度从这里开始。
>
> **同步约定**
> - 研发每完成一项，把对应行的 `Status` 改成 ✅；遇阻塞改成 ⚠️ 并在 `Notes` 列写原因
> - 新增交付文档时，在本文件 **顶部** 追加新节，所有条目初始为 ⬜
> - PM 每周三回顾本表，未完成项进入下周需求会议

## 状态图例

| 标记 | 含义 |
|---|---|
| ⬜ | 未开始 |
| 🟡 | 进行中 |
| ✅ | 已完成且自测通过 |
| ⚠️ | 阻塞 / 有疑问（在 Notes 写原因） |
| ➖ | 不适用 / 已废弃（不需要研发处理） |

## 2026-07-22 — 现货展示对齐（轮次 4B）

源文档：[2026-07-22-spot-display-alignment.md](./2026-07-22-spot-display-alignment.md)

| # | 需求条目 | 参考位置 | Status | QA 测试要点 | Notes |
|---|---|---|---|---|---|
| SDA1 | 产品线徽标共享模块：新增 `productLineBadge.tsx`；TransactionHistory 与 TradeVerification 全部引用；/spot 终端 header 中性 outline 徽标豁免 | `src/lib/productLineBadge.tsx` · `src/components/wallet/TransactionHistory.tsx` · `src/components/transparency/TradeVerification.tsx` | ✅ | Transaction row / Transparency select+header / Portfolio row 三处 SPOT 徽标颜色像素一致（blue-400 系）；/spot 顶栏徽标不变 | 修 4A 交付的紫色错版 |
| SDA2 | `useSettlements` 删伪造 exit 逻辑，join events.is_resolved 三分口径（settled 定价 / 期货 closed / 现货 closed 无 Win-Loss）；返回值加 `kind`、`productLine` | `src/hooks/useSettlements.ts` | ✅ | 现货已 SETTLED 事件行 exit=$1/$0；现货盘中平仓行只见 PnL 数字无 Win/Loss chip；期货维持原状 | Win Rate 统计一行未改 |
| SDA3 | `PortfolioSettlements` 抽 `SettlementRowDesktop/Mobile` 真组件；现货杠杆位换 SPOT 徽标；移动卡改 `rounded-xl p-4` + 165deg 渐变 | `src/pages/PortfolioSettlements.tsx` | ✅ | 桌面/移动双端现货行 SPOT 徽标；移动卡阴影/内距对齐 §15 | §16.1 style-guide 前置 |
| SDA4 | `useSettlementDetail` 加 `productLine`；`SettlementDetail` 现货隐藏 Leverage/Position Value/Funding Fee；顶部 chip 换 SPOT 徽标 | `src/hooks/useSettlementDetail.ts` · `src/pages/SettlementDetail.tsx` | ✅ | 现货结算详情页无 Leverage/Funding 字样，Position Value 行消失 | |
| SDA5 | `SettlementPoster` 新增 `productLine` prop；direction chip 现货写 SPOT | `src/components/share/SettlementPoster.tsx` · `src/pages/SettlementDetail.tsx` | ✅ | 现货分享海报显示 SPOT 替代 5x | |
| SDA6 | `useResolvedEvents` select 增 `product_lines` + trades 子查询增 `product_line`；userPnl 按事件的 `productLines` 过滤 trades 数据源（避免跨产品线 PnL 串味）；`ResolvedMarketCard` 顶行按 `productLines.includes(spot)` 追加 SPOT 徽标 | `src/hooks/useResolvedEvents.ts` · `src/components/resolved/ResolvedMarketCard.tsx` | ✅ | /resolved 现货事件卡带 SPOT 徽标；纯期货事件不变；同名跨产品线时 userPnl 不再串味 | |
| SDA7 | `EventsPage` 全量视图 bypass：search∨watchlist 时跳过 productLine 过滤 + 隐藏 Futures\|Spot 切换；`MarketCardB`/`MarketListView` 结果加 SPOT 徽标 | `src/pages/EventsPage.tsx` · `src/components/events/MarketCardB.tsx` · `src/components/events/MarketListView.tsx` | ✅ | 搜索 "NVDA" 无论当前 tab 都返回 SPOT 结果并跳 /spot；Watchlist tab 隐藏切换、显示所有产品线；退出 search/watchlist 恢复原状 | 双线事件规则待建，DESIGN.md §16 已预留 |
| SDA8 | `sim-settle-spot` Pending 撤销对称时间窗：`.gte(created_at, start_date)`（4B 修复轮新增） + `.lte(created_at, expected_settlement_time)`（4B 收尾新增）；credit→close 双写窗口 DEMO-STATE 注释如实化（SETTLING guard 不覆盖该窗口） | `supabase/functions/sim-settle-spot/index.ts` | ✅ | 手动重跑 settle 不误伤下一日 Pending；重跑除 credit→close 崩溃窗口外 idempotent | |
| SDA9 | DESIGN.md Addendum 2026-07-22（产品线徽标 / §7 三分口径 / §15 命名与移动卡 / §16 全量视图 & 页面表） | `DESIGN.md` §Addendum 2026-07-22 | ✅ | grep 无 "ResolvedEventCard" 于规则章节 | Append-only |

**明确不做**：Win Rate 统计逻辑、点击路由、券体系、双账户内核、schema 变更、HomeSearchBar 全量搜索、双线事件多行渲染（DESIGN.md §16 预留规则待后续 PR）。

**Backlog（下一轮）**：`useResolvedEvents` trade↔event join 仍走 `.in("event_name", eventNames)`，同名不同日的已结算事件卡会汇总同产品线全部天数 PnL（sim-daily-seed 每日复用同名事件放大该问题）；后续套用 `useSettlements` 同款 `[start_date, expected_settlement_time + 15min]` 时间窗匹配 + 事件 id 维度分组隔离。

---



## 2026-07-22 — 现货结算演示流 + 种子日常化（轮次 4A）

源文档：[2026-07-22-spot-settlement-and-daily-seed.md](./2026-07-22-spot-settlement-and-daily-seed.md)

| # | 需求条目 | 参考位置 | Status | QA 测试要点 | Notes |
|---|---|---|---|---|---|
| SS1 | `sim-settle-spot` EF：扫 `product_lines⊇{'spot'}` AND `expected_settlement_time<now()` AND `lifecycle_status!='SETTLED'` 事件，YES mark≥0.5 判胜；胜方 spot_balance +$1/份、负方清零；持仓 Closed；trade_profit/trade_loss 流水；Pending 挂单撤销+退款；事件 SETTLED + `is_resolved=true` 硬同步 + `winning_option_id` + `settlement_description` | `supabase/functions/sim-settle-spot/index.ts` | ✅ | 手动 POST 后 7-21 三只到期事件全部 SETTLED，胜方 spot_balance 增加、持仓关闭 | 幂等；SETTLED 事件跳过；单事件失败不阻塞 |
| SS2 | `sim-daily-seed` EF + pg_cron `5 21 * * *`（周末跳过）：先调 `sim-settle-spot`，再 upsert 下一交易日 10 只 US 股票 up/down 事件（AAPL/NVDA/TSLA/MSFT/AMZN/META/GOOGL/AMD/COIN/HOOD） | `supabase/functions/sim-daily-seed/index.ts` · `cron.job` | ✅ | 手动 POST 非周末，下一交易日新增 10 只 `us-{sym}-updown-{yyyymmdd}` 事件；`event_options` 两行 + `price_history` 一条种子 | US 假日忽略（DEMO 简化）；base_price 承接前期结算价，无则 seed；Yes 初值 hash 派生（可复现） |
| SS3 | Transparency 现货口径：`useTradeVerification` `TradeRecord` 增 `product_line`；现货 sell → `Reduce (raw=1)` 分支；结果 DB Side 显示 BUY/REDUCE；`TradeVerification.tsx` 选择列表 & 结果头对现货渲染 SPOT 徽标（复用流水同款胶囊） | `src/hooks/useTradeVerification.ts` · `src/components/transparency/TradeVerification.tsx` | ✅ | 选一条现货 Filled trade：列表 & 结果头 SPOT 徽标；Side 显示 BUY 或 REDUCE，不再显示 SHORT/Close No | |
| SS4 | `accrue-funding` 硬过滤 `product_line='futures'`（不再依赖 funding_rate=0 侥幸） | `supabase/functions/accrue-funding/index.ts` | ✅ | funding cron 跑完后 `position_funding_ledger` 无现货持仓记录 | |
| SS5 | 占位常量转正：`PRE_FREEZE_MINUTES_BEFORE_CLOSE=15` + 新增 `SETTLEMENT_CREDIT_BY_ET="16:30"` 常量，注释改 CONFIRMED（product decision 2026-07-22） | `src/lib/usStockSessions.ts` | ✅ | grep 无 `PLACEHOLDER: pending confirmation` 字样 | 正式版以结算服务 SLA 为准 |
| SS6 | 三件套 + boundary：changelog 2026-07-22 + INDEX 顶部一行 + STATUS 批次节 + `backend-boundary.md` append 现货结算章节 | 本文件 · INDEX · backend-boundary | ✅ | 四文件均含 2026-07-22 章节 | Append-only |
| SS7 | 限价现货仓 `option_id` 缺失导致 settle 静默跳过（P1 资金正确性）：`fillSpotLimitOrder` 建仓前查 `event_options` 补 `option_id`；settle 端加 `option_label` 兜底匹配 + NULL option_id 幂等回填（存量 0 行，防中间态） | `src/services/tradingService.ts` · `supabase/functions/sim-settle-spot/index.ts` | ✅ | 造一笔限价买入 → 成交后 positions.option_id 非 NULL；到期 settle 后位置正确 Closed，胜方 spot +$1/份 | 双保险 |
| SS8 | 任务展示分线（§4）：排查 first_trade 等任务 UI，`TaskCard`/`useTasks` 均不展示成交明细，**无展示点，无需改动**（不静默跳过：明确记录） | `src/components/rewards/TaskCard.tsx` · `src/hooks/useTasks.ts` | ✅ | 任务卡不展示 product_line 亦无产品线相关文案 | 需求 §4 结论 |
| SS9 | pg_cron 落 migration：`sim-daily-seed-2105utc` 幂等（unschedule if exists → schedule） | `supabase/migrations/20260722100000_sim_daily_seed_cron.sql` | ✅ | migration 可重复执行不报错，`cron.job` 表恰有一行 | 之前手工建，代码库不可重建 |
| SS10 | 文案与机制对齐：种子事件 rules/description 补当日日期与 prior close；rules 撤单表述改为 "cancelled at settlement (~15min after close)"；`SETTLEMENT_CREDIT_BY_ET` 常量值改 `"after market close"`（16:30 ET 保留在注释中作为正式版 SLA 目标） | `supabase/functions/sim-daily-seed/index.ts` · `src/lib/usStockSessions.ts` | ✅ | 新种子事件描述含具体日期；grep 无 "cancelled at freeze"；tooltip 常量与实际演示机制一致 | |
| SS11 | settle 加固：event 级 `SETTLING` guard 状态 + 每次写操作错误检查 + 位置 close 加 `.eq(status,'Open')` 幂等门；Pending 撤销改按 `event_name + created_at >= events.start_date` 匹配，避免次日同名事件误伤 | `supabase/functions/sim-settle-spot/index.ts` | ✅ | 手动重跑 sim-settle-spot 不重复入账；同名事件次日 Pending 挂单不被上一日 settle 波及 | |
| SS12 | 结算撤单退款流水改中性 `platform_credit`（不再 `trade_profit`，防污染 PnL 口径） | `supabase/functions/sim-settle-spot/index.ts` | ✅ | 结算后退款流水 type='platform_credit'，PnL 汇总不含退款 | |
| SS13 | `sim-daily-seed` base_price 真滚动链（读上一 SETTLED 事件 `base_price` + 胜方方向 ±1.2% 漂移）；`price_history` 起点 insert 加幂等（先按 option_id count → 0 才插） | `supabase/functions/sim-daily-seed/index.ts` | ✅ | 连续两次触发 seed，`price_history` 不重复；连日事件 base_price 呈滚动 | Up 胜 → 上漂 1.2%，Not Up 胜 → 下漂 1.2% |

**明确不做**（下轮 4B）：Settlements/Resolved 页面 UI 重排、搜索按 product_line 分线、收藏系统对现货的对齐。7-21 存量三只事件由 sim-settle-spot 首跑自然结算，不特判。



---

## 2026-07-21 — Trial Bonus 全面下线

源文档：[2026-07-21-trial-bonus-sunset.md](./2026-07-21-trial-bonus-sunset.md)

| # | 需求条目 | 参考位置 | Status | QA 测试要点 | Notes |
|---|---|---|---|---|---|
| TBS1 | 资金内核：`computeTotalEquity` 签名去 trialBalance；`deductBalance` 收敛为纯 `balance` 扣款；`updateTrialBalance`/`addTrialBalance`/`deductBalanceWithDetails`/`totalBalance`/`trialBalance` 全部移除 | `src/lib/equity.ts` · `src/hooks/useUserProfile.ts` | ✅ | 有 `trial_balance > 0` 的用户开合约仓：扣款只走 `balance`，`trial_balance` 数值不变 | 列本身保留，产品侧另行清零/drop |
| TBS2 | Total Equity 四处显示同步（顶栏 Equity 胶囊 + HoverCard / 首页 Hero / /wallet Band 1 / BottomNav "Me" 抽屉 Equity 卡）全部 = `spot_balance + balance` | `src/components/EventsDesktopHeader.tsx` · `src/components/home/HomeEquityHero.tsx` · `src/pages/Wallet.tsx` · `src/components/BottomNav.tsx` | ✅ | 造 spot 300 / balance 500 / trial 100 → 四处均显示 $800（不含 trial）；数字完全一致 | BottomNav 之前显示 balance+trialBalance，此处语义变化为有意 |
| TBS3 | UI 触点删格子：Wallet Futures 卡 Trial 明细格 / HoverCard Trial 行 / TransferForm TrialHint / SpotTrading Account 面板文案 / OrderPreview 紫色 breakdown 条件段 | `src/pages/Wallet.tsx` · `src/components/EventsDesktopHeader.tsx` · `src/components/wallet/TransferForm.tsx` · `src/pages/SpotTrading.tsx` · `src/pages/OrderPreview.tsx` | ✅ | 生产 UI 全站不再出现 "Trial Bonus" 文案；Futures 卡布局自然收紧无空行 | 纯删除，无重设计 |
| TBS4 | 死文件删除：`TrialCallout.tsx` / `RedeemDialog.tsx`（含 rewards index 导出）；`redeem-points` 顶部 403 硬停后 unreachable 的 `trial_balance` 写入段清理；`close-trial-position` 加护栏注释澄清命名（不改名） | `src/components/home/TrialCallout.tsx`（删） · `src/components/rewards/RedeemDialog.tsx`（删） · `supabase/functions/redeem-points/index.ts` · `supabase/functions/close-trial-position/index.ts` | ✅ | 站内 grep 无 `TrialCallout` / `RedeemDialog` 引用；close-trial-position 文件头有"'trial' = Trial Position, unrelated to wallet trial_balance"注释 | 券体系与体验仓全链路零改动 |
| TBS5 | 流水（TransactionHistory）不再渲染 "trial" 字样：`platform_credit` 描述正则改写 → "Platform credit" 中性文案 | `src/components/wallet/TransactionHistory.tsx` `formatDescription` | ✅ | 存量 `platform_credit` 流水行描述统一显示 "Platform credit"，无 trial balance/bonus 字样 | 券兑换/体验仓/收益解冻全链路回归无变化 |
| TBS6 | Style Guide WalletSection 双端预览无残留 Trial 元素；TransferForm SubSection 由 4 态改 3 态（normal / insufficient / zero）；镜像 preview 同步 | `src/pages/StyleGuide/preview/walletPreviews.tsx` · `src/pages/StyleGuide/preview/registry.tsx` · `src/pages/StyleGuide/sections/WalletSection.tsx` | ✅ | /style-guide WalletSection 双端 DeviceFrame 全无 Trial 明细格/提示；registry 无 `TransferFormTrialHintPreview` | 镜像同步义务保留 |
| TBS7 | 文档三件套：backend-boundary Trial 下线一节 + DESIGN.md Addendum Total Equity 口径更新 + copy-dictionary 删 "Trial bonus" 词条 + memory index/mobile-header-preset-d 同步 | `docs/backend-boundary.md` · `DESIGN.md` · `docs/copy-dictionary.md` · `.lovable/memory/index.md` · `.lovable/memory/design/mobile-header-preset-d.md` | ✅ | 上述文件全部无 "Total Equity 含 Trial" 类描述；memory index Core Balances 行更新 | Append-only 规则 |

---

## 2026-07-21 — 双账户改造 · 轮次 2b（钱包 UI）

源文档：[2026-07-21-dual-account-wallet-ui.md](./2026-07-21-dual-account-wallet-ui.md) · 长效文档：[backend-boundary.md](../backend-boundary.md)

| # | 需求条目 | 参考位置 | Status | QA 测试要点 | Notes |
|---|---|---|---|---|---|
| DAW1 | 全站 Total Equity 口径统一 helper：`computeTotalEquity({ spotBalance, balance, trialBalance })`（不含未实现 PnL），所有 UI（顶栏胶囊 HoverCard / 首页 Hero / /wallet Band 1）走该口径 | `src/lib/equity.ts` · `src/pages/Wallet.tsx` · `src/components/EventsDesktopHeader.tsx` · `src/components/home/HomeEquityHero.tsx` | ✅ | 造 spot 300 / balance 500 / trial 100 → 三处显示 $900 | 移动 /wallet Band 1 也走该口径 |
| DAW2 | /wallet 桌面三段式（Band 1 Total Equity 英雄条 / Band 2 双账户 stats-card / Band 3 12 栅格），移动同构（Band 1 → 三按钮 → Spot/Futures 卡纵向 → 流水），Futures 卡大数 = balance（仅 Available），Trial 只出现在明细格 | `src/pages/Wallet.tsx` desktop / mobile 分支 | ✅ | 桌面/移动均无重复 Deposit/Withdraw 入口；Futures 大数不含 Trial；Band 1 副注行 "Spot + Futures + Trial Bonus · does not include unrealized PnL" 存在 | 移动端 BalanceCard 已删除（2b 收尾） |
| DAW3 | Transfer 三件套：`TransferForm` + `TransferDialog`（桌面）+ `TransferDrawer`（移动）；From=Futures 时 Available 仅显示 balance（Trial 不可划转），旁附 ⓘ；`transferBetweenAccounts` 捕获 `FunctionsHttpError` 时读 `error.context.json()` 把 EF 具体文案透传 toast | `src/components/wallet/TransferForm.tsx` · `TransferDialog.tsx` · `TransferDrawer.tsx` · `src/hooks/useUserProfile.ts` `transferBetweenAccounts` | ✅ | 划 spot→futures 金额 > spot_balance → toast 显示 EF 具体错误（不是通用 non-2xx）；amount=0 提交按钮禁用 | 移动端出现 Dialog = 验收失败 |
| DAW4 | 充值/提现选账户：Deposit 三 Tab 前插「Deposit to」单选屏（`AccountPickerRows`），选完顶端加可点回改的账户 crumb；Withdraw 表单顶部（Base-USDC 条之下）加「From account」选择行；账户偏好由 `useAccountPreference` 落 localStorage；record-transaction 落 `account` 字段 | `src/components/deposit/DepositDialog.tsx` · `src/pages/Deposit.tsx` · `src/components/withdraw/WalletWithdraw.tsx` · `src/hooks/useAccountPreference.ts` · `supabase/functions/record-transaction/index.ts` | ✅ | 首次进 Deposit 无默认预选；选 Spot 后 crumb 显示 "To: Spot Account ›"；Withdraw 切 From Futures/Spot → Available 数字跟随；transactions 行 account 列写入正确 | localStorage key 分 flow |
| DAW5 | 顶栏 Equity 胶囊数值改 `computeTotalEquity`，包 HoverCard（~260px）：Spot Account / Futures Account / Trial Bonus 三行 + 分隔线 + Total Equity 行 + "Transfer ›" 文字链（打开 TransferDialog）；移动顶栏维持无余额 | `src/components/EventsDesktopHeader.tsx` | ✅ | hover 展开明细行；点 Transfer 链接打开划转 Dialog | |
| DAW6 | 首页 Hero 主数字改 Total Equity 口径（不加账户明细副指标）；`.lovable/memory/design/mobile-header-preset-d.md` 同步为 Total Equity 口径 | `src/components/home/HomeEquityHero.tsx` · `mem://design/mobile-header-preset-d` | ✅ | 三处（顶栏 / Hero / /wallet Band 1）显示同一数字 | |
| DAW7 | TransactionHistory 行加 `SPOT`/`FUTURES` 徽标（`text-[10px] rounded-full border`）；桌面第一层可见、移动只进第二层；`transfer_to_spot` / `transfer_to_futures` 类型注册 ArrowLeftRight 图标 + Transfer 胶囊 | `src/components/wallet/TransactionHistory.tsx` · `src/pages/Wallet.tsx` 查询含 `account` | ✅ | 转账两条行显示对应账户徽标；移动首层不见徽标；老流水 account NULL 不显示徽标 | §8 Don't 兜底 |
| DAW8 | DESIGN.md §5 例外条款改写为 "Wallet **Total Equity** Card"（账户 stats-card 不享英雄渐变例外）；§8 追加双账户卡组 / Transfer 三件套 / 流水 account 徽标 / Band 1 副注行规格；§9 追加充值 & 提现选账户步骤；Overlay 对等表加 Transfer 行；HoverCard 顶栏 Equity 明细规格；Total Equity 口径 definition；§10 Preset D 数据源修订 | `DESIGN.md` | ✅ | grep "Total Equity Card" 命中；§10 Preset D 提到 `computeTotalEquity` | 详见 DESIGN.md §Addendum 2026-07-21 |
| DAW9 | Style Guide WalletSection 增量：Total Equity 条 + 双账户卡组 + TransferForm 全状态（正常 / 余额不足 / 金额 0 / Trial ⓘ）+ 选账户步骤 + 顶栏 HoverCard 明细 + 流水账户徽标行，均走 DeviceFrame + preview/registry，桌面 & 移动双端 | `src/pages/StyleGuide/sections/WalletSection.tsx` · `src/pages/StyleGuide/preview/registry.tsx` · `src/pages/StyleGuide/preview/walletPreviews.tsx` | ✅ | 每个 preview key 都有 desktop + mobile 双端 DeviceFrame | 真组件为主；WalletEquityBands / EquityHoverCard 为镜像（带同步义务注释） |

**明确不做**（后续轮）：Sports 子站余额源接入、现货结算入账演示流（轮次 4，目标 spot_balance 已在 2a 文档写死）。

---

## 2026-07-21 — 双账户改造 · 轮次 2a（资金内核）

源文档：[2026-07-21-dual-account-core.md](./2026-07-21-dual-account-core.md) · 长效文档：[backend-boundary.md](../backend-boundary.md)

| # | 需求条目 | 参考位置 | Status | QA 测试要点 | Notes |
|---|---|---|---|---|---|
| DAC1 | `profiles.spot_balance` 列新增（NOT NULL DEFAULT 0）；`profiles.balance` 默认值 13530 → 0；`transactions.account` 列新增（'spot' \| 'futures'，约束幂等重建）+ `transfer_to_spot` / `transfer_to_futures` 类型放行 | migration | ⬜ | 新注册用户 balance=0、spot_balance=0；老用户余额未动；transactions.account 老行为 NULL | 存量演示行不回填；**存量现货 Pending 挂单跨账户漂移口子**：切换前预扣走合约账户的现货挂单，2a 后成交/撤单会退进 spot_balance，已查库确认切换时点存量为 0，不做迁移 |
| DAC2 | `handle_new_user` 触发器 `v_initial_balance` 13530 → 0；不再插入演示历史 transactions；vouchers 与 points_accounts 逻辑保留 | migration `public.handle_new_user` | ⬜ | 新账号注册 → transactions 表零行；vouchers 仍按每日池发放；profiles 两账户均 0 | |
| DAC3 | `sim-transfer` Edge Function：入参 direction/amount，服务端校验来源余额→原子改两列→写两条 transactions（+/-，account 双侧）；余额不足 400 | `supabase/functions/sim-transfer/index.ts` · `useUserProfile.transferBetweenAccounts` | ⬜ | curl {"direction":"to_spot","amount":100} 余额不足 → 400；充足 → 200 & profiles 两列一增一减；transactions 两行含 account | DEMO-STATE：当前演示下客户端仍可直改 balance 列（RLS 未收敛），正式版目标是收敛到 Edge Function |
| DAC4 | 现货链路余额源切换：`SpotTrading` 下单校验、买入扣款、限价预扣、撤单退款、卖出回款全部走 `deductSpotBalance` / `addSpotBalance`；不再读 `totalBalance` / `trialBalance` | `src/pages/SpotTrading.tsx` L210 起 · `src/hooks/useSupabaseOrders.ts` spot 分支 | ⬜ | 合约账户 $500、Trial $10、Spot $0 → 打开 /spot 显示 Available $0，Buy $50 直接 Insufficient balance | Trial 不再补贴现货 |
| DAC5 | 现货 Account 面板改为 "Spot Account" 单余额显示（Available USDC + Open positions + 提示句），移除 Trial/Cash 拆分 | `src/pages/SpotTrading.tsx` `AccountPanel` | ✅ | Account 卡右上角标题 "Spot Account"；不再出现 Trial bonus 行 | 已追认收编（2b） |
| DAC6 | `useRealtimeRiskMetrics` 输入 positions 过滤 `product_line !== 'spot'` | `src/hooks/useRealtimeRiskMetrics.ts` L28-38 | ⬜ | 造 spot 持仓 $500 + futures 持仓 $500 → Risk Ratio 只反映 futures；纯 spot 持仓时 Risk Ratio = 0 | 修复 spot 虚高 bug |
| DAC7 | `docs/backend-boundary.md` 追加 2026-07-21 双账户 append-only 章节（5 行：spot_balance 🟡 / `profiles.balance` 默认值 13530→0 与 `handle_new_user` 🟢 / transactions.account 🟡 / sim-transfer 🟡 / useRealtimeRiskMetrics 🟢） | `docs/backend-boundary.md` 2026-07-21 章节 | ✅ | grep "双账户" 命中；章节含 spot_balance / balance 默认值 / transactions.account / sim-transfer / useRealtimeRiskMetrics 五行 | |

**明确不做**（2b/后续轮）：/wallet 分区改版、Transfer 弹窗 UI、充值/提现选账户、顶栏 Total Equity、style-guide 双账户 section、Sports 子站余额源。

---



## 2026-07-21 — Pro 现货全站渗透 · 轮次 1（数据链路必修 + 仓位券排除现货）

源文档：[2026-07-21-spot-dataline-hardening.md](./2026-07-21-spot-dataline-hardening.md) · 长效文档：[backend-boundary.md](../backend-boundary.md) · 记忆：`mem://features/pro-spot-us-stocks`

| # | 需求条目 | 参考位置 | Status | QA 测试要点 | Notes |
|---|---|---|---|---|---|
| SPD1 | /trade 桌面/移动 Positions & Current Orders 在 hook 边界过滤 `productLine !== 'spot'`（orders 用 `?? 'futures'` 兜底），面板只见 futures 行 | `src/pages/DesktopTrading.tsx` L225-258 · `src/pages/TradingCharts.tsx` L32-40 · `src/pages/TradeOrder.tsx` L36-42 | ⬜ | 造一条 spot 持仓 + 一条 futures 持仓，切到 /trade 桌面与移动两处 Positions/Orders Tab 均只见 futures；spot 行不再出现 Liq/杠杆列 | 死代码 `DesktopPositionsPanel` 不再是唯一收敛点 |
| SPD2 | `useSupabaseOrders.fillOrder` spot 分流走 `fillSpotLimitOrder`；BUY/SELL 均放行，净 short 由服务层拒绝 | `src/hooks/useSupabaseOrders.ts` L119-146 · `src/services/tradingService.ts` `fillSpotLimitOrder` SELL 分支 | ⬜ | 持 +10 Up 时 sell 6 → 成交 & 净 +4；空仓 sell → 服务层报错；BUY 走 SIGNED_YES_SHARE 对冲 | 早期版本 blanket 抛错，会误杀 reduce-only 挂单 |
| SPD3 | `useSupabaseOrders.cancelOrder` spot 走 `cancelSpotLimitOrder` 回退预扣款；futures 保持 status flip | `src/hooks/useSupabaseOrders.ts` L87-117 | ⬜ | 挂单 $100 → 撤单 → 余额恢复 $100；futures 撤单不动余额 | |
| SPD4 | `PositionDetailContent` spot 分支：隐藏 leverage/liq/funding，展示 Shares / Avg cost / Mark / Current value / Cost basis | `src/components/positions/PositionDetailContent.tsx` | ⬜ | 打开一条 spot 持仓详情，无 Liq. price / Funding 区块；futures 详情不受影响 | style-guide 双端对照可做回归判定 |
| SPD5 | Portfolio `handlePositionAction` 从 `sortedPositions[index]` 取 target；futures 目标按 id 在 destination 的 futures-only 数组里重算 `highlightPosition` | `src/pages/Portfolio.tsx` L213-241 | ⬜ | 按 PnL 排序后点 View → 打开正确行；spot 行 → `/spot?event={id}`；futures 行 → /trade 高亮到正确行 | 之前 `positions[index]` 会跨类型误路由 |
| SPD6 | 仓位券排除现货：前端 `EventPickerList` 过滤 spot 事件；`redeem-position-voucher` 读 `events.product_lines`，含 `'spot'` 返回 409 | `src/components/vouchers/EventPickerList.tsx` · `supabase/functions/redeem-position-voucher/index.ts` | ⬜ | Redeem drawer 事件列表看不到 spot；直接调用 API 传 spot event_id → 409 `Position vouchers cannot be redeemed on spot markets` | 双闸防御，前端 + 服务端 |
| SPD7 | `docs/backend-boundary.md` 追加 2026-07-21 章节，落 4 条 🟢 硬规则；`/style-guide` Spot 补 Position detail 双端对照 | `docs/backend-boundary.md` · `src/pages/StyleGuide/sections/SpotSection.tsx` | ⬜ | style-guide 打开 Spot section 能看到 spot vs futures 详情并排 | 回归判定：spot 侧出现 Liq/Funding = bug |

---



## 2026-07-15 — Open API v1 用户侧 Key 管理页

源文档：[2026-07-15-api-key-management.md](./2026-07-15-api-key-management.md) · 长效文档：[backend-boundary.md](../backend-boundary.md) · 记忆：`mem://features/api-key-management`

| # | 需求条目 | 参考位置 | Status | QA 测试要点 | Notes |
|---|---|---|---|---|---|
| API1 | 三层准入 checklist 判定：Read-only（email + 2FA）/ Trading（+ 入金 + 余额 ≥ 100 + 成交）/ Pro-MM（30d 量 ≥ 50k 或 equity ≥ 10k，Manual） | `src/hooks/useApiKeys.ts` `useTierEligibility` · `src/pages/ApiManagement.tsx` TierCard | ⬜ | demo 账号三层卡状态：Read-only Available、Trading Available、Pro-MM Manual approval；关闭 2FA 后 Read-only 变 Requirements not met | |
| API2 | 创建向导 3 步 + scope 门禁：未达标 Tier 禁用；scope 默认 read_public+read_private；secret 一次性展示后关闭不再可见 | `src/pages/ApiManagement.tsx` `CreateKeyDialog` · `src/hooks/useApiKeys.ts` `createKey` | ⬜ | 只满足 Read-only 时 Trading Tier 卡片禁用并列缺项；创建成功后新行只显示 `omx_live_xxxx••••xxxx` prefix | key/secret 前端 `crypto.getRandomValues` 仿真，DEMO-STATE |
| API3 | IP whitelist 强制：勾选任一 `trade_*` 或 `ws_private` scope 时 IP whitelist 必填，否则 Create 按钮禁用 | `src/pages/ApiManagement.tsx` `requiresIp` + `canNext2` · `useApiKeys.ts` `ALL_SCOPES.requiresIp` | ⬜ | 勾 `trade_order` 且 IP 输入为空 → Create 按钮 disabled；填入 `203.0.113.10` 后可提交；非法 IP 显示红字 Invalid | |

---

## 2026-07-15 — /spot 与技术对接 v1.0 对齐

源文档：[2026-07-15-spot-tech-alignment.md](./2026-07-15-spot-tech-alignment.md) · 长效文档：[backend-boundary.md](../backend-boundary.md) · 记忆：`mem://features/pro-spot-us-stocks`

| # | 需求条目 | 参考位置 | Status | QA 测试要点 | Notes |
|---|---|---|---|---|---|
| SPA1 | 现货净仓（SIGNED_YES_SHARE）：反向买入自动冲减对面，超出部分开新仓；sell 只在持有同侧净仓时允许 | `src/services/tradingService.ts` `reduceOppositeLeg` / `executeSpotTrade` / `fillSpotLimitOrder`（BUY 路径） · 文档 §3 | ⬜ | 持 +10 Up 时买 6 Not Up → 净 +4 Up 且不再有 Not Up 行；买 15 Not Up → 净 +5 Not Up 且不再有 Up 行；仅持 Up 时 sell Not Up 报错 | 冲减用 `1 − buyPrice` 作对面 mark 的 demo 简化 |
| SPA2 | 时间字段消费：`events.freeze_time` 驱动冻结判定与 "Closing soon"；`events.expected_settlement_time` 驱动结算行；16:30 占位删除 | `src/lib/usStockSessions.ts`（`isPastFreeze` / `isInPreFreezeWindow`） · `src/pages/SpotTrading.tsx` | ⬜ | Event Info 和下单区结算行显示实际字段值（16:15 ET / 04:15 北京）；改事件 freeze_time 到未来 10 分钟，Pending 到时自动撤销 | 提前收盘日字段值来自后端交易所日历 |
| SPA3 | 状态机 9 态：删 OPEN_COOLDOWN / CLOSE_MODE；允许下单仅 TRADING / EXTENDED_TRADING；SUSPENDED = cancel-only（Pending 保留 Cancel） | `src/lib/usStockSessions.ts`（LIFECYCLE_BADGE / ORDERABLE_STATES / getBlockedReason） · `/style-guide` Spot 段 | ⬜ | 手动改 lifecycle=SUSPENDED，CTA 文案 "Suspended · cancel only" 且禁用，但 Orders 里 Pending 仍可 Cancel；CREATED 文案 "Not yet open" | |



## 2026-07-15 — Pro 现货产品线上线：美股当日涨跌试点

源文档：[2026-07-15-pro-spot-us-stocks.md](./2026-07-15-pro-spot-us-stocks.md) · 长效文档：[backend-boundary.md](../backend-boundary.md) · 记忆：`mem://features/pro-spot-us-stocks`

| # | 需求条目 | 参考位置 | Status | QA 测试要点 | Notes |
|---|---|---|---|---|---|
| SPOT1 | 现货下单/持仓语义：Buy=多头 long、Sell=减仓/平仓（禁空）；leverage=1、fee=0、product_line='spot'；Trial 优先扣 | `src/services/tradingService.ts` `executeSpotTrade` · `docs/changelog/2026-07-15-pro-spot-us-stocks.md` §2 | ⬜ | 3 个种子事件均可 Buy Yes / Buy No；未持仓时 Sell 报错；持有 100 sh 时 Sell 120 sh 报错；balance 变化优先扣 trial_balance | |
| SPOT2 | 状态机与时刻表：5 态徽标 + 4 个占位常量（PRE_FREEZE 15m / FREEZE 5m / OPEN_COOLDOWN 09:30–09:35 / SETTLEMENT ≤16:30，均 ET）；非 TRADING/EXTENDED_TRADING 禁下单 | `src/lib/usStockSessions.ts`（4 个 PLACEHOLDER 注释） · SpotTrading 页头 | ⬜ | 4 个时刻表常量待 PM 确认后去 PLACEHOLDER 注释；lifecycle_status 手动改为 PRE_FREEZE/FROZEN 时下单按钮禁用 | 4 值为占位，需 PM 确认 |
| SPOT3 | Portfolio 按 product_line 条件渲染：spot 行显示 SPOT 徽标，隐藏杠杆/Liq./Funding | `src/pages/Portfolio.tsx` · `src/hooks/usePositions.ts` | ⬜ | 现货持仓行 SPOT 徽标可见；杠杆/Liq. 相关列在该行不显示或显示为 "—" | 本轮做了 SPOT 徽标最小落地；杠杆列条件隐藏留研发深化 |
| SPOT4 | 限价挂单演示态：非可成交限价单落 Pending（Buy 预扣、Sell 校验持有）；Cancel 走 `cancelSpotLimitOrder` 全额退回；触价由前端订阅 mark price 调 `fillSpotLimitOrder`；`trades.status` 走 Pending→Filled/Cancelled | `src/services/tradingService.ts`（`placeSpotLimitOrder` / `cancelSpotLimitOrder` / `fillSpotLimitOrder`） · `src/pages/SpotTrading.tsx`（touch-fill useEffect） | ⬜ | Buy 限价低于最优 ask → Pending 行出现且余额减；Cancel → 余额恢复；把 limit 调到 mark 之上 → Pending 秒变 Filled 并建仓；同名合约事件的挂单不进现货列表 | 🔴 前端模拟，正式版由撮合引擎替换 |
| SPOT5 | Session 感知盘口：`getCurrentSession()` 按 ET 时间派生 REGULAR / EXTENDED_AFTER_HOURS / OVERNIGHT / PRE_MARKET，profile 联动 buildBook 深度/spread/size 及 LP quote-mode 徽标 | `src/lib/usStockSessions.ts` · `src/pages/SpotTrading.tsx` · `/style-guide` Spot 新 section | ⬜ | 4 个 session 的盘口档数与徽标符合表格；tooltip 描述当前时段；正式版实现时需与 LP 引擎实际报价窗口对齐 | 4 个窗口沿用原 PLACEHOLDER，与 PRD 4 常量一起确认 |


---

## 2026-07-13 — Google 账号选择器仿真（固定身份自然入口）

源文档：[2026-07-13-google-account-chooser.md](./2026-07-13-google-account-chooser.md) · 长效文档：[backend-boundary.md](../backend-boundary.md) · 记忆：`mem://features/demo-accounts-fixed-identities`

| # | 需求条目 | 参考位置 | Status | QA 测试要点 | Notes |
|---|---|---|---|---|---|
| GAC1 | 研发知悉：`signInAnonymously` + Google 账号选择器仿真均为 🔴 仅演示，产品面禁止出现 demo / test 字样 | `docs/backend-boundary.md` §一般红线 · `docs/changelog/2026-07-13-google-account-chooser.md` §红线 | ⬜ | 全站登录弹窗与选择器 UI 无 demo/test 文字；固定账号仅以 Alex Carter / Mia Reyes 呈现 | |
| GAC2 | 正式版 OAuth 落地时账号选择器行为对齐：真 Google Identity Services 选中账号后本质等价于「老用户直接进站，不重复 onboarding」 | `docs/changelog/2026-07-13-google-account-chooser.md` §正式版对齐 | ⬜ | 真 OAuth 版对已注册用户跳过 createWallet / completeProfile 两步；新账号仍走完整 3 步 | |

---

## 2026-07-13 — OmenX Sports 接入演示引擎

源文档：[2026-07-13-sports-demo-engine-integration.md](./2026-07-13-sports-demo-engine-integration.md) · 长效文档：[backend-boundary.md](../backend-boundary.md)

| # | 需求条目 | 参考位置 | Status | QA 测试要点 | Notes |
|---|---|---|---|---|---|
| SDE1 | 研发知悉跨站数据流：demo 账号（matched / welcome）在 Sports 端产生的 trades / positions 会出现在主站 `/portfolio` 与余额中，为预期行为 | `docs/changelog/2026-07-13-sports-demo-engine-integration.md` §3 | ⬜ | 主站 `/portfolio` 能看到 Sports 端下的两场 WC26 半决赛持仓；余额一致 | |
| SDE2 | 正式架构评审时按 "单一引擎多 surface" 模式对齐 Sports 接入方案（未来 Pro / Lite 遵循同一原则；schema 变更仅在本仓库） | `docs/backend-boundary.md` §未来扩张预告 | ⬜ | 评审文档明确 surface / product_line 维度归属 | |

---

## 2026-07-13 — 后端参考边界说明

源文档：[2026-07-13-backend-boundary.md](./2026-07-13-backend-boundary.md) · 长效文档：[backend-boundary.md](../backend-boundary.md)

| # | 需求条目 | 参考位置 | Status | QA 测试要点 | Notes |
|---|---|---|---|---|---|
| BB1 | 研发通读《后端参考边界说明》，并在需求评审中引用其分类（🟢/🟡/🔴） | `docs/backend-boundary.md` | ⬜ | 评审记录中出现引用；红线条款进入 checklist | |
| BB2 | 后端评审按红线检查：不得照抄 🔴 类实现（价格模拟 / 假确认 / 演示地址 / demo 用户等） | `docs/backend-boundary.md` §通用红线 + §Edge Functions | ⬜ | 评审 PR 描述包含"边界自检"段，逐条对照红线 | |

---

## 2026-05-25 — Single-market binary 收敛（第三轮）

源文档：[2026-05-25-single-market-binary-round3.md](./2026-05-25-single-market-binary-round3.md)

| # | 需求条目 | 参考位置 | Status | QA 测试要点 | Notes |
|---|---|---|---|---|---|
| BIN3-1 | 删除单 market binary 的 `Market:` 行与 `Select Option:` chip | `DesktopTrading.tsx` / `MobileTradingLayout.tsx` | ✅ | 二元事件 `/trade` 顶部无 Market 行、无 chip；多 outcome 仍渲染 chip | |
| BIN3-2 | Yes/No 切换按钮等高规范（`grid items-stretch + h-full + flex-1` + `line-clamp-2`） | Trade 面板（mobile + desktop）、Style Guide TradingSection | ✅ | 长球员名一侧两行，另一侧自动撑齐，底边对齐、价格条对齐、无空隙 | |
| BIN3-3 | 价格条选中态视觉（`bg-trading-{green,red}/85` + `border-t`，未选中 `bg-muted-foreground/15 + text-foreground/80`） | 同上 | ✅ | 选中色饱和、未选中弱化，可读但非主视觉 | |
| BIN3-4 | 新增 `useEventSideLabelsLookup` + `resolveBinarySideLabel` | `src/hooks/useEventSideLabelsLookup.ts` | ✅ | 跨事件聚合表按行 lookup 不重复 fetch 事件 | |
| BIN3-5 | Desktop `/trade` 当前事件作用域 4 处别名（Trade 提交按钮 / Preview 确认按钮 / Preview side chip / orderDetails Side 字段） | `DesktopTrading.tsx` | ✅ | 体育类事件按钮文案 "Buy {Player}" 而非 "Buy No" | |
| BIN3-6 | Desktop 跨事件聚合表 5 处别名（Open Orders / Positions / Airdrops side 列、Close Position Dialog、Cancel Order AlertDialog） | `DesktopTrading.tsx` | ✅ | 多事件混排时每行 side 列按各自事件解析 | |
| BIN3-7 | Mobile 端别名传播（Trade 按钮 / Preview / Charts / 持仓订单 chip 收敛） | `TradeForm.tsx` / `OrderPreview.tsx` / `TradingCharts.tsx` / `PositionCard.tsx` 等 | ✅ | 与 desktop 行为一致 | |
| BIN3-8 | 文档同步：`DESIGN.md` + `mem://design/single-market-binary-ui` | DESIGN.md §Single-Market Binary Trade Toggle | ✅ | 包含等高规范 + 双端 sideLabels 传播规则 + 硬编码禁令 | |

---

## 2026-05-25 — 安全加固：transactions / TOTP / Realtime

源文档：[2026-05-25-security-hardening.md](./2026-05-25-security-hardening.md)

| # | 需求条目 | 参考位置 | Status | QA 测试要点 | Notes |
|---|---|---|---|---|---|
| SEC1 | 新增 `record-transaction` Edge Function；客户端 `transactions` INSERT policy drop | `supabase/functions/record-transaction/`、`transactions` 表 | ⬜ | 客户端直 insert 报 RLS 403；通过 invoke 成功返回新行 id；type/status 越界返回 4xx | |
| SEC2 | `useWithdraw` / `TopUpDialog` / `PendingConfirmations` 改走 `record-transaction` | 提现 / 充值流程 | ⬜ | Withdraw 提交后流水立即出现且 id 为 UUID（非 `wd-${ts}`）；失败不写库 | |
| SEC3 | 新增 `user_security` 表（RLS 无 client policy）+ 数据迁移 + drop `profiles.totp_secret` | DB | ⬜ | anon/authenticated 查 `user_security` 返回 0 行；`profiles` 不再有 `totp_secret` 列 | |
| SEC4 | 新增 `totp-manage` Edge Function；`useUserProfile` enable/disable 改 invoke | `supabase/functions/totp-manage/`、Settings | ⬜ | 设置内 enable/disable TOTP 走 invoke；前端类型不再含 secret；disable 时若提现依赖 TOTP 自动回落 Email | |
| SEC5 | `realtime.messages` 启用 RLS，仅 authenticated 接收 postgres_changes | DB | ⬜ | 未登录访客订阅业务表 channel 拿不到事件；登录后正常 | |
| SEC6 | Field-locking triggers：`enforce_points_account_user_update` / `enforce_user_task_user_write` / `enforce_referral_user_update` | DB triggers | ⬜ | 客户端尝试 update 关键字段（balance / status / claimed_at）→ raise exception | |
| SEC7 | `points_redemptions` 客户端 INSERT policy drop；统一走 `redeem-points` | DB + 任务奖励流程 | ⬜ | 客户端直 insert 拒绝；通过 invoke 兑换正常 | |
| SEC8 | 内部 trigger 函数（`handle_new_user` / `update_updated_at_column` 等）REVOKE EXECUTE | DB | ⬜ | 公共角色无法 SELECT 调用这些函数；trigger 上下文照常执行 | `has_role` / `lookup_referral_code` 保留 authenticated EXECUTE |

---

## 2026-05-25 — 全站方向文案 Long/Short + Buy/Sell → Yes/No

源文档：[2026-05-25-yes-no-terminology.md](./2026-05-25-yes-no-terminology.md)

| # | 需求条目 | 参考位置 | Status | QA 测试要点 | Notes |
|---|---|---|---|---|---|
| YN1 | `tradingTerms.ts` 字典 + `sideLabel()` / `orderSideLabel()` helper | `src/lib/tradingTerms.ts` | ⬜ | 全站方向文案统一从 helper 取值；LONG="Yes" / SHORT="No" | |
| YN2 | `positionIntent.ts` `getIntentLabel` 输出 Yes/No 组合 | `src/lib/positionIntent.ts` | ⬜ | CTA 文案 `Buy Yes / Buy No / Close Yes / Reduce No` 正确 | |
| YN3 | 交易界面：TradeForm / DesktopTradeForm / OrderPreview / OrderBook / DesktopOrderBook | `/trade` | ⬜ | Yes/No 切换 + Buy Yes/Buy No CTA + 列头 Yes Price/No Price + 角标 Y/N + 颜色不变 | |
| YN4 | 持仓 / 结算 / 分享：PositionCard / DesktopPositionsPanel / Close*  / SettlementPoster / SettlementShareCard / AirdropPositionCard | `/portfolio`、`/settlement`、分享卡 | ⬜ | Side 列、按钮、分享卡全部 Yes/No；颜色 green/red 不变 | |
| YN5 | 事件列表 / 首页：EventCard / MarketListView / HomeDiscover / PositionAlertCard / BinaryEventHint | `/events`、`/` | ⬜ | tooltip 与教育文案统一 Yes/No；BinaryEventHint 文案更新 | |
| YN6 | 审计 / 透明度：TradeVerification / FundingRateAudit / useTradeVerification / useLiquidationAudit | `/transparency` 各子页 | ⬜ | 徽章 YES/NO；资金费方向描述 `Yes pays No` / `No pays Yes` | |
| YN7 | Style Guide / Playground 全部 demo mock 数据更新 | `/style-guide`、`/campaign-style-guide` | ⬜ | 所有 demo 文案统一 Yes/No；Playground 卡片标签更新 | |
| YN8 | Glossary / Terms：双标条目 `Yes (Long)` / `No (Short)`，SEO anchor 保留 | `data/glossaryTerms.ts`、`TermsOfServicePage.tsx` | ⬜ | 词条标题 / URL anchor 不变；条目正文双标 | |
| YN9 | B 类保留：Hedge 落地页、Glossary 教学映射、ToS 法律映射、SellToFiat | 对应文件 | ➖ | 保持 Long/Short 不变；研发实现时不要顺手替换 | |
| YN10 | 底层不动：`side: 'long'\|'short'`、`order.side: 'buy'\|'sell'`、Supabase schema、PnL 公式、`no = 1 − yes` | TS 类型、DB、PnL | ➖ | 数据写入与既有逻辑兼容；前端只在渲染层映射 | 详见 §5 |

---

## 2026-05-21 — /resolved 列表 + 详情页改版

源文档：[2026-05-21-resolved-revamp.md](./2026-05-21-resolved-revamp.md)

| # | 需求条目 | 参考位置 | Status | QA 测试要点 | Notes |
|---|---|---|---|---|---|
| RES1 | /resolved 列表改为 Event→Markets 两级结构 | `ResolvedGroupedGrid` + `ResolvedMarketCard` | ⬜ | 同一事件下 markets 聚合在一个分组下；binary YES/NO 也走分组结构 | 旧 `ResolvedEventCard.tsx` 删除 |
| RES2 | Market 卡片不渲染价格，仅 Winner badge + Check/X 图标 | `ResolvedMarketCard.tsx` | ⬜ | 卡片无 `$0.62` / `$83.29` 类异常值；winner 高亮 trading-green | |
| RES3 | 头部三段式：Title / Tabs(All Resolved / My Settled) / 内联筛选 | `ResolvedPage.tsx` | ⬜ | 桌面 Search + Category 内联无 Card 包裹；视觉与 /events 一致 | |
| RES4 | 桌面 `ResolvedFilters` 去掉 Status / Sort / Tag 筛选 | `ResolvedFilters.tsx` | ⬜ | 只剩 Search + Category | |
| RES5 | 移动 `MobileResolvedFilterDrawer` 收纳全部筛选（含 View 切换） | 移动 `/resolved` | ⬜ | Drawer 按 §3.2 排版；Apply/Cancel 按 §5.1 规范 | |
| RES6 | 详情页 Final Results 改为 `is_winner ? "$1.00" : "$0.00"`，不再读 `final_price` | `ResolvedEventDetail.tsx` | ⬜ | 双列 grid；winner 行 trading-green；不出现 `$83.29` 类异常 | |
| RES7 | Price History Chart 归一化到 0–1 区间，末点对齐 winner=1 / loser=0 | `resolved/PriceHistoryChart.tsx` | ⬜ | y 轴 grid label `$0.xx`；真实价格 > 1 自动 `/100` 归一；mock 用 ±0.08 随机游走 | tooltip 变化率 % 保留 |
| RES8 | `handle_new_user` trigger 回填 4 笔 settled trades + 4 条 closed positions | DB | ⬜ | 新用户注册即可在 My Settled 看到 4 笔示例数据 | 老用户不补 |

---

## 2026-05-21 — 资金费率审计：结算周期列表中间页

源文档：[2026-05-21-funding-rate-periods-step.md](./2026-05-21-funding-rate-periods-step.md)

| # | 需求条目 | 参考位置 | Status | QA 测试要点 | Notes |
|---|---|---|---|---|---|
| 1 | `useFundingRateAudit` 增加 `periods` step + `loadPeriods/selectPeriod/backToPeriods` | `src/hooks/useFundingRateAudit.ts` | ⬜ | 选持仓后 step 变为 `periods` 并发起 ledger 查询；selectPeriod 后走 fetching→comparing→result | |
| 2 | Periods 结算列表页（持仓头卡 + 倒序列表 + 空态） | `FundingRateAudit.tsx` periods 分支 | ⬜ | 列表与 `position_funding_ledger`（按 position、`amount≠0`、倒序）一致；空 ledger 显示空态 | |
| 3 | Result 详情页新增 "Settlement Window" 卡 + on-chain 字段表追加 windowStart/End/SettlementTsMs | `FundingRateAudit.tsx` result 分支 | ⬜ | 详情页 rate/amount/window/settledAt 与所选 ledger 行一致 | |
| 4 | Result 按钮拆分：Verify Another Settlement / Change Position | `FundingRateAudit.tsx` result actions | ⬜ | 前者回 periods、后者回 select；BaseScan 链接照常打开 | |
| 5 | Position/Periods 列表 ≤18 条按内容自适应高度，>18 才出现内部滚动 | `FundingRateAudit.tsx` select / periods 分支 | ⬜ | 3 / 18 / 25 三档：≤18 无滚动条且不留空白，>18 锁 `min(70vh, 1100px)` 并出现内部滚动 | |

---

## 2026-05-21 — Style Guide 增量

源文档：[2026-05-21-style-guide-tx-row.md](./2026-05-21-style-guide-tx-row.md)

| # | 需求条目 | 参考位置 | Status | QA 测试要点 | Notes |
|---|---|---|---|---|---|
| 1 | StyleGuide WalletSection 新增 "Transaction History Row" playground | `/style-guide` → Wallet | ⬜ | 进入页面能看到该 section，桌面/移动两种示例同屏可对照 | 仅参考用，不影响业务 |
| 2 | StyleGuide 顶部增加 `/campaign-style-guide` 入口按钮 | `/style-guide` 顶部 | ⬜ | 桌面显示 Megaphone + 文字；移动端仅图标；点击跳转 `/campaign-style-guide` | |

---

## 2026-05-20 — 迭代批次（Recovery / Settings / Withdraw / TX History）

源文档：[2026-05-20-requirements.md](./2026-05-20-requirements.md)
（与 [2026-05-20-recovery-v2.md](./2026-05-20-recovery-v2.md) 关于 Recovery 的描述以 v2 为准）

### Recovery 简化

| # | 需求条目 | 参考位置 | Status | QA 测试要点 | Notes |
|---|---|---|---|---|---|
| R1 | 申请表单精简字段（移除 quote 相关）| `/wallet/recovery` 新建申请 | ⬜ | 表单只剩 tx_hash / wrong_network / wrong_token / claimed_amount / sender_address / user_note | |
| R2 | 状态机收敛为 3 态 `submitted / completed / rejected` | DB + 详情页 Badge | ⬜ | 提交后默认 submitted；Admin 操作后变 completed/rejected；用户无法改 status | v1 的 5 个中间态应清理 |
| R3 | 详情页移除 Quote Accept/Decline 卡 | `/wallet/recovery/:id` | ⬜ | 详情页模块顺序：Timeline → Summary → Fee breakdown → Credited(only completed) → Admin note(only rejected) → Support footer | |
| R4 | Fee breakdown 固定 10%（不再走报价）| 详情页 Fee 卡 | ⬜ | `Recovery fee (10%) -$Y.YY`；`Estimated return $Z.ZZ` 永久显示 | |
| R5 | "Contact support" 改跳 Discord | 详情页 footer | ⬜ | 点击新标签页跳 `discord.gg/qXssm2crf9` | 与 FloatingDiscordButton 一致 |
| R6 | DB：`recovery_requests` 表 + RLS + Trigger | `public.recovery_requests` | ⬜ | 用户只能 select 自己；UPDATE 被 trigger 拦截 `status` 等关键字段；admin 全开 | migration `...042031_*.sql` + v2 CHECK/trigger |
| R7 | StyleGuide → Deposit & Withdraw → Recovery Status playground | `/style-guide` | ⬜ | 可见 3 状态 Badge + 3 状态 Timeline | |
| R8 | v1 遗留字段处理（`quoted_at / accepted_at` 保留但不写）| DB schema | ➖ | 兼容性字段，研发无需新动作 | 仅做 schema 备注 |

### Settings 安全模块重构

| # | 需求条目 | 参考位置 | Status | QA 测试要点 | Notes |
|---|---|---|---|---|---|
| S1 | 删除旧 `SecurityCard.tsx`，拆为两张卡 | `/settings` | ⬜ | 原合并卡已消失 | |
| S2 | 新增 `AccountSecurityCard`（TOTP 绑定）| `/settings` | ⬜ | 未绑定显示 Setup；绑定后显示绿色 Enabled + Disable | |
| S3 | 新增 `WithdrawalVerificationCard`（3 模式）| `/settings` | ⬜ | 凭据全缺：黄色提示 + 全部禁用；仅邮箱：只 Email only 可选 | |
| S4 | `Setup2FADialog` TOTP 绑定向导（二维码 + 6 位码）| 唤起入口：上述卡片 | ⬜ | 选 TOTP/Both 但未绑定 → 内联打开 → 绑定成功自动写回选择 | |
| S5 | Settings 顺序：Email → Account Security → Withdrawal Verification | `/settings` | ⬜ | 顺序固定 | |
| S6 | DB：`profiles` 表新增 `totp_enabled` / `withdraw_2fa_mode` | `public.profiles` | ⬜ | 字段存在；migration `...094029_*.sql` | |
| S7 | Disable TOTP 时若提现模式依赖 TOTP，自动回落 Email | `/settings` | ⬜ | Disable 后 mode 自动变 Email only 并 toast 提示 | |

### Withdraw 二次验证

| # | 需求条目 | 参考位置 | Status | QA 测试要点 | Notes |
|---|---|---|---|---|---|
| W1 | `WithdrawVerifyDialog` 按 mode 渲染 1 步或 2 步 | `/withdraw` 提交流程 | ⬜ | Email-only → 1 步邮件 OTP；TOTP-only → 1 步 TOTP；Both → 2 步带进度指示 | |
| W2 | Dialog header 排版修复（关闭按钮不与 step 标题重叠）| Dialog 顶部 | ⬜ | 桌面 Dialog + 移动 MobileDrawer 均不重叠 | |
| W3 | 验证通过才调 `submitWithdrawal` | `useWithdraw` | ⬜ | 关闭/失败 dialog 后不会触发实际提交 | |
| W4 | 表单地址格式校验修正 + 携带 `network` 字段 | `WithdrawForm` | ⬜ | 非法地址按钮禁用；提交 payload 含 network | |

### Withdraw 流水落库

| # | 需求条目 | 参考位置 | Status | QA 测试要点 | Notes |
|---|---|---|---|---|---|
| WH1 | `useWithdraw` 校验后向 `transactions` 表 insert | DB `public.transactions` | ⬜ | type=withdraw / amount=负 / status=processing / network 写入 / tx_hash=null | |
| WH2 | 使用 insert 返回 id 替代本地 `wd-${Date.now()}` | 客户端状态 | ⬜ | 状态追踪用真实 id | |
| WH3 | `invalidateQueries(['wallet-fund-transactions'])` 立即刷新 | `/wallet` | ⬜ | 提交后 Transaction History 顶部立即出现新行 | |
| WH4 | 提交失败不写库 | error path | ⬜ | 后端报错时 transactions 表无脏数据 | |

### Transaction History 移动端排版

| # | 需求条目 | 参考位置 | Status | QA 测试要点 | Notes |
|---|---|---|---|---|---|
| T1 | 移动两层结构（描述+金额 / 第二行 pl-[52px] date·badge·status） | `/wallet` 390px | ⬜ | 描述不被截成 `Bri...`；金额右对齐不被遮挡；第二行换行后仍与图标对齐 | |
| T2 | 桌面单行结构保持不变 | `/wallet` ≥md | ⬜ | 桌面布局与之前一致 | 回归即可 |
| T3 | 共用：状态图标 `w-3.5 h-3.5` + `processing` 旋转 | 各行 status icon | ⬜ | processing 行图标在转 | |
| T4 | 共用：金额按正负 trading-green/trading-red + `font-mono` | 各行金额 | ⬜ | 颜色 + 字体一致 | |
| T5 | 共用：chevron 仅 `hasDetails(tx)` 时显示 + 整行可点击展开 | 各行右侧 | ⬜ | 无 details 的行不显示 chevron 且不可展开 | |

---

## 2026-05-20 — Recovery v2（与上节 Recovery 同源，以本节为准）

源文档：[2026-05-20-recovery-v2.md](./2026-05-20-recovery-v2.md)

| # | 需求条目 | 参考位置 | Status | QA 测试要点 | Notes |
|---|---|---|---|---|---|
| RV1 | WalletDeposit 三段独立 checkbox（token / network / 合约地址）全勾才解锁地址 | `/wallet/deposit` | ⬜ | 任一未勾：地址区不可见；全勾后才显示；localStorage key=`deposit-ack-v2` | |
| RV2 | WalletDeposit 底部小字入口 "Sent to wrong chain? → 申请找回" | `/wallet/deposit` 底部 | ⬜ | 点击跳 `/wallet/recovery` | |
| RV3 | `/wallet/recovery` 顶部 intro 卡（10% 手续费 / 3–7 business days / No quote needed） | 列表页 | ⬜ | 黄色 Info 图标 + 三条描述 | |
| RV4 | 表单底部预览 `You will receive ≈ $X.XX (after 10% fee)` | 新建表单 | ⬜ | 随 claimed_amount 实时计算 | |
| RV5 | PendingConfirmations 卡片底部 inline 链接（"看到错链的 tx？申请找回"） | `/wallet` 主页 | ⬜ | 链接跳 `/wallet/recovery` | |
| RV6 | 删除：`respondToQuote` mutation、Quote 卡、5 中间态、用户改 status 能力、"Wait for quote" 文案 | 全局清理 | ➖ | 研发参考实现时确认不要保留以上代码 | v1 → v2 主要废弃项 |

---

## 2026-05-11 — 已上线需求合集 v2（历史基线）

源文档：[2026-05-11-shipped-requirements-v2.md](./2026-05-11-shipped-requirements-v2.md)

> 此批次为 5 月初已上线基线，默认全部 ✅；如研发那边某项未实现/有 gap，把对应行改成 ⬜ 并在 Notes 说明。

| # | 需求条目 | 参考位置 | Status | QA 测试要点 | Notes |
|---|---|---|---|---|---|
| H1 | H2E Welcome Gift 兜底（无匹配仓位发 $10）| H2E 流程 | ✅ | Polymarket 无匹配 → 发 $10；终身 1 次；独立 `WELCOME GIFT` 绿色徽章 | |
| H2 | Pending Airdrop 倒计时（按钮内嵌 `46h` / `12m` urgent 红） | `/portfolio/airdrops`、桌面/移动 | ✅ | <1h 转红；过期按钮隐藏；激活中显示 `Activating…` | |
| H3 | H2E 6 档解锁阶梯（含 $0 Starter 档 +$5 starter unlock）| `/wallet` H2E 卡片 | ✅ | 6 节点 / 阶梯非线性 / Starter 独立绿色显示 | |
| H4 | Available for Withdraw = `max(0, balance + trialBalance − lockedAmount)` | `/wallet`、`/withdraw` | ✅ | balance=0 无 H2E 时仍显示 $5 可提 | |
| H5 | Withdraw 最低额 UX（placeholder `Min 20` / 同行展示 / 实时红字 / Submit 禁用）| `/withdraw` 输入区 | ✅ | <20 立即红字；按钮禁用 | |
| H6 | Withdraw 弹窗移除 H2E 文案模块（与 Wallet 页面去重）| `/withdraw` | ✅ | Available 行下方无 H2E 锁定文案 | 余额扣减逻辑保留 |
| H7 | 登录页常驻两个 demo 账号入口（matched / welcome）| `/login` | ✅ | 两账号数据互不干扰；可重复登录 | password 仅内部 |

---

## 维护历史

- 2026-05-21：首次建立 STATUS.md，覆盖 4 份历史交付文档；新交付按顶部追加规则维护
