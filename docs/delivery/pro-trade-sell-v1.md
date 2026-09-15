# 合约 Pro 面板 Buy · Sell（Sell = 减仓 / 平仓）— 交付说明 v1

> 这份文档说的是 Pro 合约交易页的下单面板多了一对 **Buy · Sell** 页签。Buy 页签就是原来的面板，一个像素、一条逻辑都没变；Sell 页签是新的：它只做一件事——把你在当前结果上**已经持有的那一个仓位**平掉或减掉一部分，可以市价立即平，也可以挂一张限价平仓单。它永远不会替你开反向仓。生产页有两处：桌面 `/trade` 右侧面板，手机 `/trade/order`。给从未看过这块的人写；读法：先看 §0，再看 §2 的口径，最后按 §7 的算例对数字。

## 0. 读者须知

查什么去哪儿：
- 长什么样 → 生产页 `/trade`（桌面右栏）、`/trade/order`（手机）
- 什么时候变成什么样 → `/style-guide` →「Pro — 交易终端」→「Pro /trade/order 移动下单面板」（CT-M1…CT-M4）
- 字段名、文案、公式、术语 → `docs/copy-dictionary.md`（Trading 节）+ 本文档 §2 §7
- 设计法则（页签、下拉、颜色轴）→ `DESIGN.md` §Addendum 2026-09-14
- 平仓的钱怎么算（保证金释放、赢利佣金）→ `docs/delivery/pro-trade-v4-cleanup-v1.md`、`docs/delivery/lite-order-returns-v1.md`
- Lite 术语对照 → `docs/copy-dictionary.md` 顶部「Lite 术语对照表」（Lite 的平仓叫 Cash out，本文档不复制那张表）

提问前先按上面顺序查一遍；查不到再提，提问时写明"我查了 X 没有"。

## 1. 功能目标

给合约面板一个和现货面板一致的 Buy · Sell 入口，让用户不用离开下单面板、不用去持仓表点 Close，就能减仓或平仓；并把"限价平仓"这个此前根本不存在的动作补上。

## 2. 口径（先读这一节）

| 项 | 口径 |
|---|---|
| 仓位模型 | **一个交易对上只有一个仓位**（同一用户 + 同一结果 + 同一方向合并为一行，全仓保证金）。同向再买 = 加仓：数量相加、保证金相加、入场价按数量加权、有效杠杆重算。没有"分批""先进先出"的概念。 |
| Buy 页签 | = 原面板（Yes/No 切换、杠杆、金额、TP/SL、摘要、CTA）。行为未变，包括"买反向结果时自动净额抵扣"的既有逻辑。 |
| Sell 页签 | **只减仓 / 平仓**当前结果上已持有的仓位。空仓时两侧禁用并显示 `No position to close yet`；只持一侧时另一侧禁用并在价格条显示 `0 ct`。选边只切换结果，不改变方向。 |
| 永不反向 | Sell 数量上限 = 持仓数量，超出即钳到持仓数量（全平）。没有"卖出超过持仓变成开空"这回事。 |
| 单位 | 合约张数，全词 `contracts`（Amount 后缀 `Contracts`），整数，不用缩写。滑杆 25 / 50 / 75 / 100% 取整；100% = 精确持仓数量。 |
| 市价平仓 | 与持仓表 Close 按钮**同一条路径**（`partialClosePosition`）：释放对应比例保证金 + 已实现盈亏 − 赢利佣金，写账本，弹 `Cashed out · $X back`。 |
| 限价平仓 | 生成一张 **reduce-only** 挂单：`side = sell`、`order_type = Limit`、`margin = 0`、`fee = 0`、`reduce_only = true`，**下单不动余额**。Current Orders 表该行 Side 列显示红色 `Close` 标、类型列带 `Reduce-only` 标；`amount` 列存平仓名义额（张数 × 限价，库约束要求 > 0）。撤单只改状态，无退款。mark 触及限价时按市价平仓同一条路径成交（蓝图侧为前端 touch-fill 模拟，见 §8）。 |
| 佣金 | 赢利佣金 = `5% × max(已实现盈亏 − 已分摊开仓费, 0)`，亏损为 0。与 `pro-trade-v4-cleanup-v1.md` 同一实现 `cashBackOnClose()`。 |
| 隐藏项 | Sell 页签下不显示杠杆、TP/SL、"先平反向仓"提示。Available 保留，旁边有 ⇄ 划转入口。 |

## 3. 面板结构

**Buy 页签补充**：摘要末段为 `To win ⓘ` 行（tooltip 为共享说明），不再平铺说明句；手机的杠杆行写 `Leverage`，点开底部抽屉（滑杆 + 1/2/5/7/10x）；右栏账户卡叫 **Boost Account**（合约账户），与现货的 Standard Account 对应。

**页签行**（桌面与手机同一套 markup，与 `/spot` 面板完全相同）：左侧 `Buy · Sell` 文字页签（选中 `text-foreground border-foreground`），右侧 `Market ▾ / Limit` 下拉（`OrderTypeDropdown`）。原来的下划线式 `Limit | Market` 页签已移除。

**Sell 页签自上而下**：
1. Yes/No 切换（`BinarySideToggle`，未持仓侧禁用）
2. `Held {size} contracts · {outcome} · {leverage}x · entry {price}` 一行
3. Available (USDC) + ⇄ 划转（开钱包同款 Transfer 弹层 / 抽屉）
4. Limit 时：`Close price` 输入框（默认 = mark），偏离 mark 时提示 `Limit above/below mark — order will rest as Pending until touched.`
5. Amount（后缀 `Contracts`）+ 滑杆
6. 摘要（平铺，同 Buy 摘要 chrome）：`Close price (mark)` / `Contracts` / `Released margin` / `Realized PnL est.` / `Est. commission` / **`You receive`**（加粗末行）
7. CTA（红色，`side="sell"`）：全平 `Close {outcome}`，部分 `Reduce {outcome}`；副文案 `You receive $X`。空仓禁用；数量为 0 时可点，点击聚焦输入框并提示 `Enter an amount`。

**桌面**：市价 → 预览弹窗（同 Buy 预览，减仓分支显示 Released margin / Realized PnL est. / Est. commission / You receive）→ 确认。**手机**：市价 → 打开持仓表同款 `ClosePositionDialog` 确认；限价 → `/order-preview` 显示 reduce-only 预览（Position / Order `Limit · Reduce-only` / Close price / Contracts / Released margin / Realized PnL est. / Est. commission / You receive）→ 确认挂单。Buy · Sell 页签状态与 Yes/No 一样按 `事件:结果` 记忆，`/trade` ↔ `/trade/order` 往返不丢。

## 4. 四态

| 态 | 行为 |
|---|---|
| 未登录 | 到不了 Pro 面（游客恒为 Lite），不适用 |
| 登录 · 空仓 | Sell 页签两侧禁用、`No position to close yet`、CTA 禁用 |
| 登录 · 持仓 | 见 §3 |
| 加载 / 出错 | 持仓查询未返回前按空仓渲染；平仓失败弹 `Failed to close position: …`，面板状态不变 |

## 5. 文案（已入 copy-dictionary Trading 节）

`Buy` / `Sell`（页签）· `Held` · `contracts` / `shares`（单位全词）· `Close price` / `Close price (mark)` · `Contracts` · `Released margin` · `Realized PnL est.` · `Est. commission` · `You receive` · `Close {outcome}` / `Reduce {outcome}` · `Reduce-only` · `No position to close yet` · `Limit above/below mark — order will rest as Pending until touched.` · `Cashed out · $X back`（成交 toast，沿用）· `Limit close filled · N ct`（限价平仓成交附加 toast）。

## 6. 数据

| 表 / 字段 | 说明 |
|---|---|
| `trades.reduce_only boolean not null default false` | **新增列**。限价平仓单为 true。迁移文件 `supabase/migrations/20260910105544_*.sql` |
| `positions` | 未改。市价 / 限价成交都走 `partialClosePosition`，同持仓表 Close |

## 7. 算例

持仓 40 ct · Up · 5x · entry 0.6200 · 保证金 4.96，mark 0.6800，全平 40 ct：
- Released margin = 4.96 × 40/40 = **4.96**
- Realized PnL = (0.68 − 0.62) × 40 = **+2.40**
- 已分摊开仓费 = 0.62 × 40 × 0.0015 = 0.0372
- Est. commission = 5% × (2.40 − 0.0372) = **0.12**
- You receive = 4.96 + 2.40 − 0.12 = **7.24**

减仓 20 ct：以上各项 × 20/40（Released 2.48，PnL +1.20，佣金 0.06，You receive 3.62）。

## 8. 已知缺口与蓝图说明（提缺陷前先对表）

- **限价平仓的撮合是前端模拟**（`DESKTOP /trade` 页内 touch-fill：mark 触及限价即成交）。真平台由后端撮合；手机页不跑这个循环，挂单要等桌面页或后端成交。
- **桌面面板未组件化**：`/trade` 右栏面板仍是页面内联 JSX，字典里只能挂手机版 `TradeForm`（CT-M1…M4）；桌面规格与手机一致，以生产页为准。待提取为 `ProContractPanel` 后补 `pro-trade-panel-*` 四态。
- **引擎不一致（QA 注意）**：面板 Buy 页签"买反向结果触发的自动减仓"走 `executeTrade`，**不扣赢利佣金**；Sell 页签与持仓表 Close 走 `partialClosePosition`，**扣**。真平台请统一为后者口径。
- **不在本特性范围**：合约 Buy 限价单在蓝图侧从不成交、且面板输入的限价没有随单提交（沿用 mark）——历史问题，未动。
- Lite 面的平仓仍是持仓卡 `Cash out`，未动。
- **顺手修掉的历史缺陷（写给 QA 对表）**：Buy 页签的 `Amount ⇄ Qty` 切换从未接入计算（只改标签、藏后缀），已删除，Buy 一律输 USDC；桌面 Current Orders 的 Cancel 此前对登录用户从不生效（成功 toast 照弹、库里仍 Pending），现已修；手机市价平仓确认框此前总是 100% 开启，现按 Sell 页签填的数量预填。
