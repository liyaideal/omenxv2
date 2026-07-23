## 目标

给 Alex Carter (`7dfb4698-d7f0-40af-b155-4f0d8e948014`) 追加 **spot 侧** mock 数据，覆盖 /trade 现货、Portfolio Positions、Portfolio Settlements（Closed / Settled）、Resolved 页面 userPnl、Transparency 交易验证、Transaction History 现货相关流水。当前该账号 `product_line='spot'` 的 trades / positions 均为 0，只有 futures 数据。

不改 UI / 业务逻辑；不动 spot_balance（当前 $8,420.75 已合理），只补数据。

## 覆盖矩阵

| 页面 / 模块 | 依赖数据 | 本轮补什么 |
|---|---|---|
| /spot 交易页顶栏 Open positions | `positions` product_line=spot, status=Open | 4 条持仓 |
| /spot 挂单列表 | `trades` product_line=spot, status=Pending | 2 条 Pending 限价单 |
| Portfolio › Positions (Spot tab) | 同上 positions | 上述 4 条 |
| Portfolio › Settlements — Closed (intraday sell) | `trades` product_line=spot, status=Closed, closed_at, pnl | 3 组盘中卖出 |
| Portfolio › Settlements — Settled ($1/$0) | `trades` product_line=spot, status=Closed, price ∈ {0,1}，事件 `is_resolved=true` | 4 组（2 胜 2 负）挂到 20260721 / 20260715 已结算 spot 事件 |
| /resolved userPnl（product-line 隔离已在 4B 修好） | 上一行同 trades | 复用 |
| Transparency › Trade Verification | trades（SPOT 徽标 + Reduce 语义走现有 `useTradeVerification`） | 复用上述所有 spot trades |
| /wallet Transaction History | `transactions` account='spot' | 4 条：1 笔 `transfer_to_spot`（in）、2 笔 spot 结算相关 `platform_credit`、1 笔 `trade_fee`（可选） |

## 具体行（幂等：SQL 前先 `DELETE ... WHERE user_id=alex AND product_line='spot'`，transactions 用一段独有 note 匹配）

### A. Open positions（4 条，挂 20260723 未结算 spot 事件）

用真实 option_id + 与 `event_options.price` 一致的 mark_price；entry_price 略偏离展示浮盈/浮亏；`leverage=1`。

| event | option | side | qty | entry | mark | pnl |
|---|---|---|---|---|---|---|
| NVDA 20260723 | Up (`us-nvda-updown-20260723-up`) | long | 800 | 0.42 | 0.48 | +$48 |
| TSLA 20260723 | Not Up (`us-tsla-updown-20260723-not`) | long | 500 | 0.50 | 0.54 | +$20 |
| AAPL 20260723 | Up (`us-aapl-updown-20260723-up`) | long | 400 | 0.55 | 0.43 | -$48 |
| META 20260723 | Not Up (`us-meta-updown-20260723-not`) | long | 600 | 0.55 | 0.51 | -$24 |

每条同时插一条 `trades` 行（Filled, side=buy, product_line=spot），position.trade_id 指过去。

### B. Pending 限价单（2 条，20260723）

- COIN Up @ 0.45 × 500 shares
- MSFT Not Up @ 0.50 × 300 shares

只写 `trades` (status=Pending, order_type=Limit)，无 position。

### C. Settlements — Closed（盘中卖出 3 组，7 月中日期）

每组 2 条 trades：buy Filled + sell Closed，closed_at 落在 7/16–7/20 之间；exit price 非 0/1（保证 `useSettlements` 归 `kind='closed'`）。用**已结算事件**的 option 也可，但为避免与下面 Settled 组冲突，用 20260715 前后的日期串到既有事件名上做纯历史行（`event_name` 文本足够）。

- "Will NVDA close higher today? (Jul 17)" · Up · qty 400 · entry 0.48 · exit 0.62 → PnL +$56
- "Will TSLA close higher today? (Jul 18)" · No · qty 600 · entry 0.55 · exit 0.44 → PnL -$66
- "Will AAPL close higher today? (Jul 19)" · Yes · qty 300 · entry 0.40 · exit 0.51 → PnL +$33

### D. Settlements — Settled（$1/$0，挂已结算 spot 事件）

事件已 resolved，winner 已知：
- NVDA 20260715 winner=No → buy No 500 @ 0.68 → settled 1.0 → +$160
- NVDA 20260721 winner=No → buy Yes 400 @ 0.35 → settled 0.0 → -$140
- TSLA 20260721 winner=No → buy No 500 @ 0.52 → settled 1.0 → +$240
- AAPL 20260715 winner=No → buy Yes 300 @ 0.42 → settled 0.0 → -$126

每组 2 条 trades（buy Filled + close Closed with price ∈ {0,1}），closed_at = 事件 `expected_settlement_time` 后 5 分钟。

### E. Transactions（4 条 spot 相关流水）

| type | account | amount | status | note |
|---|---|---|---|---|
| transfer_to_spot | spot | +2000 | Completed | `Transfer from Futures to Spot` |
| platform_credit | spot | +160 | Completed | `Spot settlement · NVDA Jul 15 · No` |
| platform_credit | spot | +240 | Completed | `Spot settlement · TSLA Jul 21 · No` |
| platform_debit | spot | -140 | Completed | `Spot settlement · NVDA Jul 21 · Yes (loss)` |

（`transactions` schema 与 `record-transaction` 现有类型对齐；如某 type 未在 constraint 白名单会退化用现有 `type='credit'/'debit'` 变体，实施前再 `\d transactions` 确认。）

## 实施步骤（build 模式）

1. `psql \d transactions` 确认 type / status / account 允许值。
2. 单个 supabase--insert 事务：
   - `DELETE FROM positions WHERE user_id=alex AND product_line='spot';`
   - `DELETE FROM trades WHERE user_id=alex AND product_line='spot';`
   - `DELETE FROM transactions WHERE user_id=alex AND note LIKE 'Spot %' OR (type='transfer_to_spot' AND user_id=alex);`
   - INSERT A/B/C/D 的 trades（先），A 的 positions（引用刚插 trade.id — 用 CTE `WITH ins_trades AS (...) INSERT INTO positions ...`）。
   - INSERT E 的 transactions。
3. 用户在 preview 上巡检 /spot, /portfolio (Positions + Settlements), /resolved, /transparency, /wallet。

## 明确不做

- 不动 spot_balance / balance（余额已合理）。
- 不动 futures 侧任何数据（14 Filled / 4 Pending / 22 positions 保留）。
- 不改任何 EF / hook / UI。
- 不引入新事件（复用已存在的 spot 事件；纯 name-based 历史行仅用于 C 组 Closed 展示）。
