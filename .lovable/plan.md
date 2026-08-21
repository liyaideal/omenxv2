# Settled 桌面第三张 KPI 卡：RECORD 改写

## 问题
桌面 Settled 视图的第三张卡显示 `RECORD` + `12 – 15`，读者无法判断这是比分、区间还是日期范围。移动端没有这张卡，所以只影响桌面。

## 方案（推荐）
保留这张卡，但把数字写成自解释的胜负记录：

- 标签：`RECORD`
- 主数值：`12W 15L`（赢的数字后跟 W，输的数字后跟 L，中间一个空格）
- 副行：`wins · losses`（muted 灰，和其他卡副行同规格）

这样即使不看副行也能读懂，且与旁边两张卡（WIN RATE、NET PROFIT）不重复信息。

## 备选（如果你更想精简）
直接删掉这张卡，桌面 Settled 改为两张卡（和移动端一致的 WIN RATE + NET PROFIT），网格从 3 列改 2 列。

## 技术改动
- `src/pages/lite/LitePortfolio.tsx` — `settledKpiDesktop` 中 RECORD 卡的 `value` 改为 `${wins}W ${losses}L`，新增 `sub="wins · losses"`。
- `src/pages/StyleGuide/preview/portfolioPreviews.tsx` — KPI demo 同步补一张相同写法的 RECORD 卡，保证 playground 覆盖。
- 纯展示层改动，不动 `useLitePortfolio` 的统计口径。
