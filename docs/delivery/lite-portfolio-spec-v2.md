# Portfolio（Lite）— 交付说明 v2

> 这份文档讲 Lite 的 Portfolio 页（网址 `/portfolio`，含 Settled 页签和结算详情页）怎么运转，给实现它的研发和测试看。样式看生产页，每个模块什么时候变成什么样看 `/style-guide`，本文只写这两处看不到的：路由与流程、数据口径、返回机制、边界。
> 适用 Lite 面；Pro 的 Portfolio 是另一套代码，本文不涉及。
> 这是第 2 版：§1–§9 与第 1 版相同，新增 §10–§19（前后端分工、异步态、分页、实时、时区、权限、埋点、无障碍、QA、待决策）；2026-08-31 又按 auto-close 现行口径修订了 §4 / §8 / §9 / §14 / §18。研发以本版为准，第 1 版作废。

## 0. 读者须知

查什么去哪儿：
- 长什么样 → 生产页 `/portfolio`
- 什么时候变成什么样 → `/style-guide` → Lite → Portfolio 状态字典（每个 case 有「状态 / 触发条件 / 视觉 / 数据来源」表）
- 字段名、文案、公式、时间口径、术语 → `docs/copy-dictionary.md`（顶部有「Lite 术语对照表」）→ 本文档对应章节
- 设计法则（颜色轴、chip、overlay 对等）→ `DESIGN.md`
提问前先按上面顺序查一遍；查不到再提，提问时写明"我查了 X 没有"。

## 1. 功能目标

给 Lite 用户一个账户级的持仓与战绩视图：Live（当前持仓 + 挂单）与 Settled（已结算战绩，含系列聚合与逐仓详情）。

- 两个 tab、两个分段（Boost / Standard），移动与桌面共用同一份数据层 `useLitePortfolio`，只在呈现层分叉。
- KPI **恒为全账户口径**，分段 chips 只过滤列表，不影响 KPI。
- 交易动线不在本页内完成：所有交易入口都跳到 `/trade` 或 `/spot`（见 §3）。

## 2. 路由与页面关系

| 路由 | 说明 |
|---|---|
| `/portfolio` | Live tab（默认） |
| `/portfolio?tab=settled` | Settled tab |
| `/portfolio?tab=settled&series=<eventId>` | 系列详情。移动端为**独立整页**（`MobileHeader variant="inner"`，无 tabs / KPI / chips）；桌面端在同一容器内替换列表区 |
| `/portfolio/settlement/:id` | 单仓结算详情；可带 `?series=<eventId>` 表示由系列进入 |
| `/portfolio/settlements` | Lite 下 302 → `/portfolio?tab=settled`；Pro 下仍是旧页 |
| `/portfolio/airdrops` | Lite 下 302 → `/portfolio`；Pro 下仍是旧页 |

surface 分派在 `PortfolioRoutes.tsx`：`surface === "lite"` 走 Lite 组件，否则走 Pro 旧页。

## 3. 完整流程

### 3.1 未登录

```text
进入 /portfolio ──未登录──> LiteAuthGate：内容层 blur(3px)/opacity .7 + Lynx 浮层
                              ├ Sign in / Create account
                              └ 移动端 AuthSheet，桌面端 AuthDialog
             ──登录成功──> 浮层消失，children 原样透出（不刷新、不跳转）
```

底栏未登录点 Portfolio / Wallet 直接弹 AuthSheet，登录后自动进入 `pendingPath`。
结算详情页同样包在 LiteAuthGate 内。

### 3.2 Live → 市场 → 返回原位

```text
持仓卡/行 点击 ──> savePortfolioScroll() + 记住 segment ──> liteTradePath(eventId, segment)
                                                      （router state 带来源 URL）
交易页左上返回 ──> 回 /portfolio ──> 恢复 segment + 多帧 rAF 复位 scrollY
```

滚动复位在数据落地后连续重试约 45 帧，抵消列表异步增高与浏览器自带 history 复位。

### 3.3 挂单行 → Pro 终端 → 返回 Lite

Lite 目前**没有** limit order 展示模块，挂单行必须落到 Pro 交易终端。

```text
PendingOrdersRow 点击 ──> savePortfolioReturnSurface("lite") ──> Pro 终端
浏览器 back（navigationType === "POP"）──> PortfolioRoute 读回 surface，切回 lite 并复位
```

只在 POP 上消费该标记；PUSH / REPLACE 阶段消费会把用户弹回 Lite 终端。

### 3.4 Settled → 详情 → View event

```text
Settled 行 ─单仓─> /portfolio/settlement/:id
           ─系列─> ?series=<eventId> ─点某轮─> /portfolio/settlement/:id?series=<eventId>
详情页 View event ──> 交易页（router state 记录本详情页 URL）
详情页返回 ──> 确定 URL：有 series 回系列页，否则回 /portfolio?tab=settled
```

返回一律用**确定 URL**，不用 `navigate(-1)`：history 回退会在详情页与交易页之间来回弹。

## 4. 数据来源与计算口径

单一数据层 `useLitePortfolio`，桌面与移动不得各自再算。

| 数据 | 来源 |
|---|---|
| 持仓 | `usePositions` |
| 挂单 | `useOrders`（status = Pending / Partial Filled） |
| 结算 | `useSettlements` / `useSettlementDetail` |
| 实时价与浮盈 | `useRealtimePositionsPnL`（无实时价时回落到持仓自带 pnl） |
| 账户风险 | `useRealtimeRiskMetrics` |
| 券 | `usePositionVouchers`（`grantedVouchers.length` 驱动发丝行） |

| 口径 | 公式 / 规则 |
|---|---|
| `cost` | 持仓 margin |
| `nowWorth` | `max(0, cost + profit)`，**先逐仓 clamp 再求和**；亏损超过本金的部分由账户承担，不做负值 |
| `profit` | 真实 pnl，可为负 |
| `profitPercent` | `profit / cost × 100`，`cost = 0` 时为 0 |
| `ifWins` | 份额数（shares × $1） |
| `autoClose` | 账户级求解，**排除本仓**（margin 加回、自身 pnl 剔除，mode `existing`）；**所有 Boost 段行都有结果，含 1×**（1× 恒 none）。返回 `AutoCloseResult`：`{kind:'level', price}` 或 `{kind:'none'}`，不返回 null（见 `docs/delivery/autoclose-v1.md` §3） |
| `autoClose.kind` | 两态：`level`（解出且在合法域：long `0 < p < mark`，short `mark < p < 1`）/ `none`（boost ≤ 1、解出域、数据缺失）。**没有第三态 `missing`**（旧口径已废） |
| `hot` | `isAutoCloseHot(autoClose, priceNow)`：`kind === 'level'` 且 `|priceNow − price| / priceNow ≤ 0.10` |
| `riskRatio` | `imTotal / equity × 100`（账户级，跨仓） |
| `untilAutoClose` | `max(equity − imTotal, 0)` |
| Settled `payout` | `max(0, cost + net)` |
| 系列 `net` | 各轮 `pnl − fees` 之和；对账契约：**Net = Payout − Cost**，各轮 net 相加必须等于 Net |
| 详情页 fees | 取列表行的**按仓摊分** fees；详情 hook 汇总整条 (event, option) 账本，在共享系列账本上会重复计数 |
| 负零 | `|value| < 0.005` 显示 muted `$0.00`，不带符号 |

## 5. 分段与聚合规则

| 规则 | 定义 |
|---|---|
| 分段 | `productLine === "spot"` → Standard；其余 → Boost |
| 系列聚合 | 同一 **event 名**下有 ≥2 条结算 → 折叠为一行 `Series · won X of N · 最近结算日`，net 为各轮之和 |
| 排序 | 结算行按 `closedAt` 倒序；月分组同样倒序 |
| 系列 key | 稳定 `eventId`。旧链接可能传 event name（标题含 `%` 会坏），进入后一跳内 canonical 化为 id 并 `replace` URL |
| 段位记忆 | 无历史记忆时，Boost 为空且 Standard 有行则默认 Standard |

## 6. 状态索引（模块 → /style-guide case 编号）

去 `/style-guide` → Lite → Portfolio；每个 case 下方都有「状态 / 触发条件 / 视觉结果 / 数据来源」四列表。本表只索引，不复述状态。
preview key 定义在 `src/pages/StyleGuide/sections/pages/LitePortfolioPage.tsx`。

| 模块 | preview key |
|---|---|
| Tabs / 券发丝行 / 双段 chips | `portfolio-lite-chrome` |
| KPI 卡 · 移动 / 桌面 | `portfolio-lite-kpi-mobile` / `portfolio-lite-kpi-desktop` |
| Boost check 仪表三态 / 桌面条 | `portfolio-lite-gauge-states` / `portfolio-lite-gauge-bar` |
| Boost check Details（移动抽屉 / 桌面 Popover） | `portfolio-lite-details-drawer` / `portfolio-lite-details-popover` |
| 持仓卡全状态（移动） | `portfolio-lite-live-cards` |
| 桌面行式网格 / 桌面挂单行 | `portfolio-lite-desktop-rows` / `portfolio-lite-pending-desktop` |
| Settled 列表 / 加载更多 | `portfolio-lite-settled` / `portfolio-lite-settled-loadmore` |
| 单仓结算详情 · 移动（won / auto_close / cashout / lost） | `portfolio-lite-detail-won-mobile` / `portfolio-lite-detail-autoclosed-mobile` / `portfolio-lite-detail-cashout-mobile` / `portfolio-lite-detail-lost-mobile` |
| 单仓结算详情 · 桌面（won / auto_close / cashout / lost） | `portfolio-lite-detail-won` / `portfolio-lite-detail-autoclosed` / `portfolio-lite-detail-cashout` / `portfolio-lite-detail-lost` |
| 系列详情（移动整页 / 桌面 / 两极） | `portfolio-lite-series-mobile-page` / `portfolio-lite-series-detail` / `portfolio-lite-series-extremes` |
| 来源标（voucher / airdrop） | `portfolio-lite-airdrop-tag-cards` / `portfolio-lite-airdrop-tag-rows` |
| auto-close 两态（移动卡 / 桌面行 / Standard 行） | `autoclose-mobile-cards` / `autoclose-desktop-rows` / `autoclose-standard-row` |
| 空态 / 未登录门 / 已登录门 / 错误边界 | `portfolio-lite-empty` / `portfolio-lite-auth-gate-out` / `portfolio-lite-auth-gate-in` / `portfolio-lite-error` |

## 7. 会话状态（sessionStorage）

| key | 写入时机 | 读取与生命周期 |
|---|---|---|
| `lite-portfolio-scroll` | 行/卡片跳出前 | 进入 `/portfolio` 时**读后即删**，仅一次性复位 |
| `lite-portfolio-segment` | segment 变更时 | 常驻，进入页面时恢复；影响默认分段判定 |
| `lite-portfolio-return-surface` | 挂单行跳 Pro 前写 `"lite"` | 仅在 `POP` 导航时读后即删 |

全部 try/catch 包裹，storage 不可用时降级为不复位，不报错。

## 8. 文案口径

| 项 | 规则 |
|---|---|
| 收益句 | `If it wins you get $X`（移动）/ `If it wins → $X`（桌面）。**不重复 side**，side 已在上方 meta |
| auto-close 字段 | Boost 段常驻，值两态：桌面行 `· auto-close ≈{c}¢` / `· auto-close none`（none 内联灰 `#4d5560` + tooltip `No auto-close within this market's price range — your loss is capped at what you put in.`）；移动卡 `· auto-close ≈{c}¢` / `· no auto-close, loss capped`。Standard 段不带该字段。hot 时整句红 |
| auto-closed | 强制了结保留可见备注（列表 meta + 详情结果行，红色） |
| cashed out early | **已废弃**，全站不再出现；提前平仓与正常结算在用户侧文案一致，只有价格行 label 区分 `Closed at` / `Settled price` |
| 战绩格式 | `12W 15L` |
| 杠杆 | `1×` 一律不写「1× Boost」（`boostSuffix()` 返回空）；但 1× 行仍属 Boost 段并携带 auto-close 字段（值恒 none） |
| Lite 禁词 | Margin / Liquidation / Funding / Leverage / Long / Short / Order book / Limit（详见 `docs/copy-dictionary.md`） |

## 9. 涉及文件

**数据层**
- `src/hooks/useLitePortfolio.ts`（唯一口径来源）
- `src/lib/portfolioReturn.ts`、`src/lib/autoClosePrice.ts`、`src/lib/settleLabel.ts`、`src/lib/liteSideName.ts`、`src/lib/liteTradePath.ts`

**页面**
- `src/pages/PortfolioRoutes.tsx`、`src/pages/lite/LitePortfolio.tsx`、`src/pages/lite/LiteSettlementDetail.tsx`

**组件**
- `src/components/portfolio/lite/`：`parts.tsx`（KPI / chips / 仪表）、`LiveCards.tsx`、`SettledList.tsx`、`SettlementDetailView.tsx`、`SeriesDetailView.tsx`、`LiteAuthGate.tsx`、`PortfolioErrorBoundary.tsx`

**文档**
- `src/pages/StyleGuide/sections/pages/LitePortfolioPage.tsx`（状态字典）、`docs/copy-dictionary.md`

## 10. 前后端分工

后端接口由后端团队自行设计，本文**不定义接口字段与形态**，只声明前端依赖的语义与自算范围。

**后端需保证的语义**

| 场景 | 前端依赖 |
|---|---|
| Live 列表 | 每个持仓的 cost（margin）、size、entryPrice、markPrice、pnl、leverage、productLine、airdropSource、event、option、sideLabels |
| 实时通道 | 最新价 / mark price；账户级 `equity`、`imTotal`、`unrealizedPnL`（auto-close 与 Boost check 依赖账户快照，非单仓） |
| Settled 列表 | 按 `closedAt` 倒序；pnl、fees、cost、closeReason、option、sideLabels、leverage、productLine；同一 event 可被聚合为 series |
| 系列对账 | 系列内各轮 `pnl − fees` 必须可精确加总为 Net（Net = Payout − Cost），不允许四舍五入漂移 |
| 挂单 | Pending / Partial Filled 状态与所属 event 关联。**原型缺口**：本仓库无 orders 表，挂单在前端 store，正式系统必须有真实订单账本 |
| fees 粒度 | 需要**按仓摊分**后的费用；整条 (event, option) 账本汇总在共享系列上会重复计数 |

**前端自算（不得下沉，除非同步改文档）**

| 计算 | 说明 |
|---|---|
| `nowWorth = max(0, cost + profit)` | 逐仓 clamp 后求和，展示层语义 |
| `autoClosePrice` | 账户级求解、排除本仓，属估算值 |
| `hot` / KPI / `profitPercent` | 纯派生 |
| 月分组 / series 聚合 | 当前前端做；数据量大时建议下沉（见 §12） |

## 11. 异步态（待实现项）

现状：Lite portfolio **没有骨架屏**，`isLoading` 只用于滚动复位；请求失败无 UI，`PortfolioErrorBoundary` 只兜渲染崩溃。落地时需补齐三态。

| 态 | 触发 | 要求 |
|---|---|---|
| Loading | 首次拉取未返回 | 骨架屏，色板复用 LiteEventsPage：底 `#171A1F`、块 `#15181C`；KPI 2/3 卡 + 3 行列表占位；tabs 与 chips 直接渲染不占位 |
| Error | 请求失败（非渲染异常） | 列表区替换为错误文案 + Retry 按钮；KPI 显示 `—` 而非 `$0.00` |
| Empty | 请求成功但无数据 | 现有 `No live calls yet` + Browse events；Settled 空态同理 |
| 渲染崩溃 | 组件抛错 | `PortfolioErrorBoundary`，带 reset 回列表 |
| 详情 Not found | id 不存在 / 无权限 | 现有文案 + 返回按钮；需补 Retry |

## 12. 规模与分页（待实现项）

| 项 | 现状 | 落地要求 |
|---|---|---|
| Settled 列表 | 无上限全量拉，按 `closed_at` 倒序 | 分页或「加载更多」，建议首屏 50 条、按月边界续拉 |
| 系列聚合 | 前端按 event 名聚合 | 结算条数大时下沉服务端，前端只渲染聚合行 |
| Live auto-close | 每仓一次账户级求解，O(n) | 明确可接受仓位上限（建议 ≤ 100 仓内不做优化，超出需批量求解） |
| 月分组渲染 | 一次性渲染全部月 | 与分页同步，滚动到底再追加 |

## 13. 实时刷新口径

| 项 | 口径 |
|---|---|
| 价格 | 走实时订阅；无实时价时回落到持仓自带 `markPrice` / `pnl`，不显示占位 |
| KPI / 仪表 | 跟随价格 tick 重算（纯 memo 派生，不额外请求） |
| 页面不可见 | `document.hidden` 时应降频或暂停订阅，恢复可见时立即补一次全量刷新（**待实现**） |
| 断线 | 回落到最后一次快照继续显示，不清空列表、不弹错 |
| Settled | 非实时，进入 tab 时拉一次即可 |

## 14. 时区与格式

| 项 | 口径 |
|---|---|
| 时区 | 全部**用户本地时间**，不带时区后缀。`settleLabel` / `settledDayLabel` / `monthGroupLabel` 均用本地 `getFullYear/getMonth/getDate` 切天与切月 |
| 后果声明 | 跨时区用户看到的「结算日」与「月分组」可能不同，这是既定口径，不做 UTC 归一 |
| 时间格式 | 24 小时制。Live：`settleLabel()` 同日 `today 16:00` / 同年 `Aug 21 16:00` / 跨年 `Jan 12, 2027`；Settled 列表行：`settledDayLabel()` 只到日 `Aug 12`；结算详情时间行：`settledStampLabel()` `Aug 1, 2026 · 14:00`；月分组头 `monthGroupLabel()` `AUGUST 2026`。三种精度是设计意图 |
| 金额 | USD，两位小数；`|value| < 0.005` → muted `$0.00`（不带正负号） |
| 价格 | 分位显示 `48¢`（四舍五入到整分） |
| 多币种 | 不在本期范围，全站 USD |

## 15. 权限

| 项 | 要求 |
|---|---|
| 列表可见性 | 只能读当前登录用户自己的持仓 / 挂单 / 结算记录，服务端强制 |
| 详情越权 | `/portfolio/settlement/:id` 传他人 id 必须返回「无权限 / 不存在」，前端统一渲染 `Not found`，不得泄露对方 event 名或金额 |
| 未登录 | 页面不请求业务数据，直接渲染 LiteAuthGate（见 §3.1） |
| 演示开关 | `LiteAuthGate.forceSignedOut` 仅 style-guide 使用，生产禁止传入 |

## 16. 埋点

| 事件 | 触发 | 参数 |
|---|---|---|
| `portfolio_view` | 进入页面 | `tab`、`segment`、`isSignedIn` |
| `portfolio_tab_switch` | 切 Live / Settled | `from`、`to` |
| `portfolio_segment_switch` | 切 Boost / Standard | `to`、`rowCount` |
| `portfolio_position_open` | 点持仓卡 / 行 | `eventId`、`segment`、`hot` |
| `portfolio_pending_order_open` | 点挂单行 | `eventId`、`orderStatus` |
| `portfolio_settled_open` | 点结算行 | `settlementId` 或 `seriesId`、`isSeries` |
| `portfolio_view_event` | 详情页 View event | `eventId`、`from`（settlement / series） |
| `portfolio_auth_cta` | 未登录门点 CTA | `cta`（signin / signup） |

## 17. 无障碍

- Tabs 用 `role="tablist" / role="tab"`，支持左右方向键切换，选中态 `aria-selected`。
- Segment chips 同为一组可键盘遍历的按钮，选中态需可读（不能只靠颜色）。
- 未登录门：模糊层 `aria-hidden="true"` 且 `pointer-events: none`（现状已满足），焦点只能落在浮层 CTA 上。
- 金额涨跌不得只用颜色表达：正负号必须存在（`+$12.40` / `−$8.10`）。
- 卡片整块可点时给出可访问名（事件名 + side + 金额），不要只在图标上挂 label。
- 目标热区 ≥ 44px（移动端行高与 CTA 已按此设计）。

## 18. QA 验收 checklist

按 §3 的四条流程逐条验：

**未登录**
- [ ] 未登录进入 `/portfolio` 显示模糊门，内容不可选中不可点
- [ ] 移动端弹 AuthSheet、桌面端弹 AuthDialog
- [ ] 登录成功后浮层消失且不跳转、不刷新
- [ ] 底栏未登录点 Portfolio / Wallet 弹登录，登录后落到原目标页

**Live → 市场 → 返回**
- [ ] 滚到列表中部点持仓，返回后 scroll 与 segment 都还原
- [ ] Boost / Standard 两个分段各验一次
- [ ] KPI 在切分段时**不变**（全账户口径）

**挂单 → Pro → 返回**
- [ ] 挂单行进入的是 Pro 终端，不是 Lite
- [ ] 浏览器返回落回 Lite portfolio，不是 Pro portfolio

**Settled**
- [ ] 单仓详情返回 `/portfolio?tab=settled`
- [ ] 系列内某轮详情返回系列页；系列页返回结算列表
- [ ] 详情页 View event 进入市场后返回**回到该详情页**，且再次返回不循环
- [ ] 系列各轮 net 相加等于 Net，Net = Payout − Cost
- [ ] auto_close 行显示 `auto-closed` 红字；cashout 行**无任何附加备注**

**数值与文案**
- [ ] 亏损超本金的仓 NOW WORTH 显示 `$0.00`，PROFIT 仍显示真实负值
- [ ] Boost 段每行都有 auto-close 字段：有价 `≈{c}¢`，无价桌面 `none` / 移动 `no auto-close, loss capped`；Standard 段无此字段
- [ ] 全站无 `cashed out early`、无 `1× Boost`

## 19. 待决策项

| 项 | 需谁拍板 |
|---|---|
| Settled 分页粒度（条数 / 按月）与「加载更多」交互 | 产品 + 后端 |
| 系列聚合是否下沉服务端、阈值多少 | 后端 |
| 实时推送频率与页面不可见时的降频策略 | 后端 + 前端 |
| 错误态是否需要 Retry 之外的降级（如显示缓存快照） | 产品 |
| 埋点平台与事件命名前缀 | 数据 |
| 仓位数量上限与超限表现 | 产品 + 后端 |
| Live 行 SIDE chip 的颜色规则（现行硬编码 volt，与 DESIGN §2 market axis 的作用域关系未定）——**待 CPO 拍板，勿实现** | CPO |
| 多选市场 No 腿的 chip 文案（现行 `displayOption` 不带 No，与 Yes 腿同形）——**待 CPO 拍板，勿实现** | CPO |

## 20. 未变更 / 不做

| 项 | 说明 |
|---|---|
| Pro portfolio | 独立代码路径，样式与逻辑均未变 |
| `close_reason` 数据字段 | 仍区分 `settlement` / `cashout` / `auto_close`，只是 cashout 不再有可见备注 |
| Lite limit order | 本期无展示模块，挂单一律跳 Pro；后续单独规划 |
| `LiteAuthGate.forceSignedOut` | 仅 style-guide 用于演示未登录态，生产禁止传入 |
| 交易执行 | 不在本页发生，Portfolio 只做只读展示 + 跳转 |
