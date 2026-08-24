# 移除 "cashed out early" 备注（列表 + 详情全站）

提前平仓这件事用户不关心，只关心 win / loss 和金额。把 `cashed out early` 从所有可见文案里去掉；`auto-closed` 保留（它解释了为什么亏损被强制了结）。

## 改动点

1. `src/hooks/useLitePortfolio.ts`（约 259 行）
   - 删除 `if (s.closeReason === "cashout") meta.push("cashed out early");`
   - `auto_close` 那行保留。Settled 行 meta 变成 `ARS +1.5 · Aug 12`。

2. `src/components/portfolio/lite/SettlementDetailView.tsx`
   - `exitValueLine`：cashout 分支去掉后缀，只输出 `48¢`（保持 cents 口径，行 label 仍是 `Closed at`）。
   - `resultSub`：cashout 分支改为只有 `Won` / `Lost`，不再拼 `· cashed out early`。
   - `auto_close` 两处逻辑不动。

3. `src/pages/StyleGuide/preview/portfolioPreviews.tsx`
   - settled 行 fixture 去掉 `"cashed out early"` meta 项；cashout 详情 fixture 无需改数据（closeReason 仍是 cashout，渲染结果自动变）。

4. `src/pages/StyleGuide/sections/pages/litePages.tsx`
   - 触发条件表里 cashout 相关行的「视觉结果」改写：`closeReason === 'cashout'` → 眉线 CLOSED、`Closed at 48¢`、结果行只显示 Won/Lost，**无附加备注**；明确写出「提前平仓不做可见标注」。

5. `docs/copy-dictionary.md`
   - 把 `cashed out early` 标为已废弃（禁用词），并说明 cashout 与 settlement 在列表/结果行上文案一致。

## 不动的部分

- `close_reason` 数据字段与统计口径不变（仍区分 settlement / cashout / auto_close）。
- 眉线 SETTLED vs CLOSED、价格行 label `Settled price` / `Closed at` 保留，这是价格口径不是营销备注。
- 系列详情里 `auto-closed` 轮次红字保留。
