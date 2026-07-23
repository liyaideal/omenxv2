# 2026-05-25 · 二元事件 No 作为独立持仓

> 配合此前的 Yes/No 文案统一改造（见 `2026-05-25-yes-no-terminology.md`），废弃"No 边交易自动翻转到 Yes 轴反向仓位"的归一化逻辑。Yes 和 No 现在是各自独立的持仓。

## 1. 背景

旧模型为了在"Long/Short on dual price"的 UI 下避免同事件出现两条对冲持仓，把所有 No 边交易转成 Yes 轴反向仓位：
- Buy No  → `option_label="Yes", side="short", entry = 1 − price`
- Sell No → `option_label="Yes", side="long",  entry = 1 − price`

Yes/No 文案改造后，用户视角里已经是"Yes 市场 / No 市场"两个独立按钮，再做翻转会让 Buy No 的持仓在列表里显示为 Yes/Short，与操作完全不符。

## 2. 改造内容

### 2.1 写库逻辑（`src/services/tradingService.ts`）
删除 `isNoOption` 翻转分支：
```ts
const positionSide: "long" | "short" = validated.side === "buy" ? "long" : "short";
const positionOptionLabel = validated.optionLabel;
const canonicalClosePrice = validated.price;
```
`oppositeSide` 查询保持不变，仍按 `option_label + side` 在同 option 内做 reduce/close。

### 2.2 Intent 分类（`src/lib/positionIntent.ts`）
`toCanonicalOrder` 改为 identity 映射；`getIntentLabel` 用 `canonical.optionLabel` 拼 `Reduce/Close ${label}`、`Buy/Sell ${label}`。

### 2.3 Order → Position（`src/lib/orderUtils.ts`）
`orderToPosition` 去掉 No 翻转，`positionType = order.type === 'buy' ? 'long' : 'short'`。

### 2.4 UI 清理
- 删除 `src/components/BinaryEventHint.tsx`（整个组件及其 `isNoOption` / `isBinaryEvent` helper）。
- 清理 `TradeForm.tsx`、`OrderPreview.tsx`、`DesktopTrading.tsx` 中的 `showBinaryHint` state、`useMemo` 与渲染块。

## 3. 不动的部分

- TS 类型 `side: 'long' | 'short'`、`order.side: 'buy' | 'sell'`。
- Supabase schema、PnL/notional/margin 公式（杠杆不进 PnL 公式）。
- 双价结构 `noPrice = 1 − yesPrice`（仍用于价格展示，只是不再用来把 No 仓"翻译"成 Yes 轴写库）。
- 颜色映射 Yes=green / No=red。
- **历史持仓**：旧的 `option_label="Yes"` 数据保留原样，按现有 PnL 流程结算，不做迁移。

## 4. 行为变化（用户可感知）

- 同事件先 Buy Yes 再 Buy No → 列表里出现两条独立持仓，各自占保证金（数学上对冲；如需保证金优化未来走 Portfolio Margin 专项）。
- Buy No 的持仓 Side 列直接显示 No，Entry 是 no_price，PnL 在 no_price 上涨时为正（用户最初困惑的场景被修复）。
- 无须 `BinaryEventHint` 提示，UI 自解释。

## 5. QA 清单

- [ ] Buy No 后 `/portfolio` 出现 `option=No, side=long, entry=no_price` 的持仓。
- [ ] 同事件先 Yes 再 No，得到两条独立持仓。
- [ ] No 仓 PnL：no_price ↑ → 盈利，no_price ↓ → 亏损。
- [ ] 同 option reduce/close：Buy No 100 → 内部 Sell No 60 → 剩 40。
- [ ] Settlement / 分享卡片 / 审计页（TradeVerification、FundingRateAudit）正确显示 No 选项。
- [ ] 旧 Yes-only 历史仓位仍能正常展示与结算。
- [ ] 全站搜索 `BinaryEventHint` / `isNoOption` / `isBinaryEvent` 应无残留。

## 6. 涉及文件

- `src/services/tradingService.ts`
- `src/lib/positionIntent.ts`
- `src/lib/orderUtils.ts`
- `src/components/TradeForm.tsx`
- `src/pages/OrderPreview.tsx`
- `src/pages/DesktopTrading.tsx`
- `src/components/BinaryEventHint.tsx` **(deleted)**

## 7. 记忆同步

- 新增 `mem://features/binary-event-no-as-native-position.md`。
- `mem://index.md` Core 第 `Binary Events` 条改写；移除 `binary-event-conversion-logic` / `binary-event-ui-clarification` 引用。
