# 2026-07-15 — /spot 与《美股当日涨跌现货事件 PRD 技术对接 v1.0》对齐

> 本轮以《技术对接 v1.0》为准，收敛此前事件 PRD 的口径分歧。定稿事项：**event_status 9 态**（删 OPEN_COOLDOWN / CLOSE_MODE，SUSPENDED = cancel-only）；**freeze_time / expected_settlement_time 转为数据驱动**（前端只消费字段，不再本地推算）；**现货持仓改为 SIGNED_YES_SHARE 单净仓**（反向买入自动冲减）；**event_id 规范** `US_STOCK_UPDOWN:{symbol}:{trade_date}` 为研发侧蓝图，本仓库演示数据 id 不回改；**event_pending_cash 简化**（demo 卖出直接回余额，UI 明示）。合约端行为完全不动。

## 1. 状态机 9 态定稿（技术对接 §2）

`events.event_status` 枚举：`CREATED / EXTENDED_TRADING / TRADING / FROZEN / SETTLING / SETTLED + SUSPENDED / REVIEW / CANCELED`。

- **删除** OPEN_COOLDOWN、CLOSE_MODE（QA-16：开盘直接进 TRADING，开盘保护由 quote profile 内部实现）
- **允许下单**只有 `TRADING` / `EXTENDED_TRADING`；其余（含 CREATED、未知）一律禁单
- `CREATED`：事件卡可预览不可交易，按钮禁用文案 "Not yet open"
- `SUSPENDED`：按钮禁用文案 `Suspended · cancel only`；已有 Pending 单保留 Cancel 按钮
- `usStockSessions.ts` 的 `LIFECYCLE_BADGE` 收敛为 9 键；unknown → 灰色 `Unknown` + 禁单

## 2. 时间字段数据驱动（技术对接 §4.1 / §12.2）

`events.freeze_time` / `events.expected_settlement_time` 已由后端按交易所日历种入（本轮试点值：freeze 15:55 ET / settlement 16:15 ET）。

- 前端"冻结判定"改读 `events.freeze_time`：`isPastFreeze(freezeAt, endDate)` 若过 freeze 或 `lifecycle === 'FROZEN'` 触发自动撤单退款
- "Closing soon" 提示 `isInPreFreezeWindow(freezeAt, endDate)`：默认 15 min 窗口，锚点用 freeze_time
- Event Info 与下单面板结算行改读 `expected_settlement_time`：`Settles & credits by ~16:15 ET / 04:15 北京`（双时区）；**删除 16:30 占位**
- Rules 自动追加行：`All open orders are automatically cancelled and refunded at freeze ({freeze_time_et}).`
- `usStockSessions.ts`：
  - 删除 `OPEN_COOLDOWN_START_ET/END_ET`、`SETTLEMENT_CREDIT_BY_ET` 常量
  - `FREEZE_MINUTES_BEFORE_CLOSE = 5` 与 `PRE_FREEZE_MINUTES_BEFORE_CLOSE = 15` 保留为 **fallback**（当 events 字段缺失时兜底），注释更新为 `// Fallback only — prefer events.freeze_time`
  - 提前收盘日 freeze / settlement 由后端按交易所日历写入字段，前端只消费——**这就是禁止硬编码 16:00/16:30 的实现方式**

## 3. 现货净仓模型（技术对接 §7 / §8）

现货（`product_line='spot'`）采用 **SIGNED_YES_SHARE 单净仓**，与合约的双向持仓不同。

| 场景 | 行为 |
|---|---|
| 同侧再买 | 加仓 + 加权平均入场（原逻辑保留） |
| 反向买入 x ≤ q（已持 q 份对面） | 冲减对面 x 份，按 `1 − buyPrice` 结算实现盈亏，返还相应 margin + realizedPnl，不开新仓 |
| 反向买入 x > q | 先平掉对面 q 份，再用剩余 `x − q` 在当前边开新仓 @ `buyPrice` |
| Sell | 只有持有同侧净仓才允许；持有对面时报错 "Buy back to reduce, don't sell" |

- 落库：冲减部分把原 position `size` 递减（归零则 `status='Closed' + pnl 累加 + closed_at`）；新开部分正常插入 `product_line='spot'` 行
- 现货持仓表同一事件仅显示一行（Up 或 Not Up）
- 实现：`src/services/tradingService.ts` 新增内部工具 `fetchSpotSides / reduceOppositeLeg / openOrMergeSameSide`；`executeSpotTrade` 与 `fillSpotLimitOrder` 的 BUY 路径统一调用；均带 `// 技术对接 §7: SIGNED_YES_SHARE net position, one-way mode` 注释
- 合约（futures）路径的双向持仓逻辑**完全未动**

## 4. Sell 回款标注（技术对接 §7.2 简化）

- 蓝图简化为卖出直接回余额；toast description 明示 `"Proceeds settle to balance (demo). Production: held as event pending cash until settlement."`
- 代码路径带 `// DEMO-STATE: event_pending_cash 简化` 注释；正式版应入 `event_pending_cash`，事件终态前不可提现

## 5. 下单面板补充（技术对接 §10.1）

- 明细区新增 **Max win** 行：Buy 为 `qty × $1 − cost`；Sell 为 `proceeds`
- Limit price **tick 0.01** 校验：非 0.01 整数倍时红字提示 "Price must be a multiple of $0.01 (tick)."，CTA 同步禁用
- CTA 副标从 `To win $X` 改为 `Max win $X`，与明细区口径一致

## 6. event_id 规范（研发蓝图，不回改）

规范：`US_STOCK_UPDOWN:{symbol}:{trade_date}`（例 `US_STOCK_UPDOWN:TSLA:2026-07-15`）。本仓库演示数据沿用 `us-tsla-updown-20260715` 等短 id，**不回改**——研发以规范落地，演示引擎 id 只作运行时匹配用。

## 7. Style Guide 同步

`/style-guide` Spot section：

- Lifecycle 徽标集合更新为 **9 态**（说明文字标 QA-16 删除原因）
- 新增 **Net position (SIGNED_YES_SHARE)** section：两组三步示意（+10 Up 买 6 Not Up → +4 Up；+10 Up 买 15 Not Up → +5 Not Up）
- 移除 `CLOSE_MODE` 示例 header 行，替换为 `SUSPENDED`

## 8. 涉及文件

- 前端
  - `src/lib/usStockSessions.ts`（9 态、fallback 注释、freeze/settle helpers）
  - `src/services/tradingService.ts`（净仓工具 + `executeSpotTrade` / `fillSpotLimitOrder` 重构 BUY 路径）
  - `src/pages/SpotTrading.tsx`（freeze_time / expected_settlement_time 消费、Max win、tick 校验、sell toast、rules 行、CTA disabled 增加 tickInvalid）
  - `src/pages/StyleGuide/sections/SpotSection.tsx`（9 态 + net-position demo）
- 文档：本文 + `docs/backend-boundary.md` append + `docs/changelog/INDEX.md` + `docs/changelog/STATUS.md`
- 记忆：`.lovable/memory/features/pro-spot-us-stocks.md`

## 9. 红线

- 🟢 状态机 9 态、允许下单集、SUSPENDED = cancel-only 均为需求硬口径
- 🟢 时间字段（freeze_time / expected_settlement_time）语义是需求，值必须来自 events 表；fallback 常量仅当字段缺失时兜底
- 🟢 SIGNED_YES_SHARE 净仓模型是需求；正式撮合引擎需在服务端强制单侧净仓
- 🔴 event_pending_cash 简化：demo 卖出直接回钱包；正式版必须按 §7.2 入 pending cash
- 🔴 前端触价成交 / 冻结撤单继续保持 v1.1 / v1.2 的 DEMO-STATE 标注
