# 2026-11-10 · 首页 / Sports / Finance · 交叉验收待批项落地（15 条）

起因：三方交叉验收（2026-11-10）留下 16 条要 CPO 拍板的口径。CPO 在 mock 画布上看完「现在 → 改后」后全部批准；其中港股午休与节假日（第 4 条）不改——休市时段本来就可以交易下一个交易日的涨跌，当开盘处理没有问题；第 7 条只补文档、界面不变。

**改了什么**

- 股票卡 `settles in` 算到官方收盘 + 15 分钟（与现货页 Settles、同步文档 §7 第 3 条一致），盘中「closes in」和「settles in」不再是同一个数。
- 平盘（现价正好等于开盘价 / Base）：加密主卡写灰色 `$0 · 0.00%` + `at the open · Down wins if it closed now`；ETH / SOL 和股票行的 `0.00%` 灰色、不带符号。后端规则一直是「收盘 > 开盘才算 Up」，原来平盘画成绿色 `Up wins` 是错的。
- 首页 Sports 的开赛倒计时（舞台标签、眉行）统一用 `26h 00m` 写法（≥ 1 小时写小时 + 两位分钟，不换算成天），原来写 `1d 2h`。交易页和 Sports 品类页的写法不在本次范围。
- 首页 Crypto 段默认 5m，周期在首页单独记；Intraday 品类页不受影响（桌面 5m、手机 15m，维持原样）。
- Sports 日历条选了某一天：右表标题写 `Big on Fri 7 · by volume`；那天的比赛已全部列出时，面板底写 `No more matches on Fri 7 · see all →`。
- 加密一轮到点、下一轮还没进来时，钟写 `Settling…`，不停在 00:00。
- Stocks `Show all N →` 只在该市场只数多于屏上行数时出现，点了进 Finance 并预选当前页签的市场。Finance 选 Korea 时原来不列股票轮（韩股是今天才同步进来的），一并改成照常列出。
- Editor's Desk 多选项精选显示价格最高的两个结果（价高在前），不再取数据源的前两个；`+N more` 仍按原来的选项总数算。
- 价格写法：加密价 ≥ $10,000 取整、以下两位小数（`$74,063` / `$2,137.09`），加密卡和图上 OPEN 标签同一规则；股票价两位小数，都加千分位（`$1,034.20`）；韩元照旧整数。顶部行情条不在本次范围。
- 股票事件名改成 `Apple (AAPL) — will it close higher today?`。只改同步模板，2026-11-10 之后新开的轮次才用新名；已经开的轮次保持原名，免得已下单的人对不上。
- Finance、日历页、Intraday 舞台的股票行一律 `Up` / `Down`（原来写 `Not up`）；Finance 两颗钮定宽 112px，价格列对齐。数据库选项名仍是 `Not Up`，展示层照旧改写成 Down。
- More 段标题桌面最多 3 行（原来 2 行就截断）；手机本来不截断。
- Sports 品类页桌面页头：大数字 = 日期条 ALL；有比赛在打时写 `Upcoming this week · N live`。
- `Tmrw` 改成 `Tomorrow`（Sports 开赛时间、直播预告）。

**验收里一并修的（三方交叉验收，2026-11-10）**

- 加密价格规则（≥ $10,000 取整、以下两位小数）补到 Crypto 品类页卡片、Intraday 舞台、手机 Intraday 模块和顶部行情条——原来这几处 $1,000 以上就取整（ETH 写成 $3,325）。
- 0.00% 一律灰色不带符号：共用的涨跌组件（`PctChange`）、顶部行情条、手机 Intraday 模块原来写绿色「+0.00%」。
- 首页右表两队队徽重叠从 −5px 改 −1px，第一队的短码不再被盖掉末字母。
- Editor's Desk 多选项精选「+N more」恢复（上一笔把选项总数算成了 2）。
- Finance 选 Korea 照常列出股票轮。

**验收后 CPO 再定的三条（2026-11-10 下午）**

- 每轮刚开盘时图上灰线被拉成竖条：开盘后最初 15% 的时间，量程把窗口里开盘前的灰线也算进去，随时间平滑收回到只看本轮；超出量程的灰线断开不画。
- Sports 日历条选的是今天：右表标题写 `Big today · by volume`，排完写 `No more matches today`（和日历条的 TODAY 一致）。
- Settling 那几秒：BTC 副句去掉 `if it closed now`，ETH / SOL 小卡也写 `Settling…`。

**没动什么**

- 港股午休与节假日的时段判断不变。
- 结算逻辑、价格引擎、数据库选项名不变；股票同步只改了事件名模板（`mn_apply_stock_rounds`，迁移 `20261110150000_stock_round_name_it.sql`，已在 Lovable 库执行并回查）。

**字典**

- 新增 HA-7b（加密平盘）、HA-7c（Settling…）。
- 更新 HA-5（倒计时写法）、HA-6（默认周期、价格写法）、HA-8（settles 时间、平盘、Show all）、HA-12（多选项取前两高）、HA-13（标题 3 行）、HA-17（选某天的标题与底句）、EV-36（Sports 页头大数字）、Finance 视图说明（Up / Down 定宽）。全站规范 R3 日词改 `Tomorrow`。

**文档**

- `docs/delivery/home-all-v1.md`：C1 C2 C3 K2 K5 K6 E4 M2 R2 R5。
- `docs/delivery/mainnet-catalog-sync-v1.md` §7 规则 7（新事件名）。
- `docs/copy-dictionary.md`：首页 R 表（右表、钟、BTC 行、股票事件名、Stocks 底注）、Sports 品类页页头、股票行 Up / Down、`Tomorrow`。
