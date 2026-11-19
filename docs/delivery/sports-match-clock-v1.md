# 体育比赛 · 交易时间显示（比赛打没打完只看比赛状态）— 交付说明 v1

> **研发交付用的唯一总文档。** 范围：所有体育比赛（事件带 `metadata.kickoff_at`，含让分 / 大小分 / 地图等子盘）在交易相关位置显示的“时间”和交易开关。其他事件（加密快轮、股票、普通事件）一律不变。
> 决策：Liya（CPO）2026-11-04 批，方案图 11 条规则（见 §2）。起因：正式平台的 `end_date` 是运营填的“预计结束”，比赛加时 / 拖延时前端倒计时到 00:00、Pro 页头 `Ends in 00:00:00`、下拉写 `Ended`，但比赛还在打、下单按钮还能点。
> 状态：Lovable 已实现并在正式站（2026-11-04 起）；演示引擎已改（数据源报“在打”的比赛不按预计时间结算）。原常驻演示赛 `demo-live-ot-nhl` 2026-11-09 随正式版事件目录同步被标记为退役（`metadata.retired`），不再进任何列表 / Pro 下拉，只能凭 id 从 Lite 打开，且没有定时任务刷新，现在显示的是兜底后的 `Final · In review`（见 §5）。
> 交付日期：2026-11-19（交付说明 v1 + 改前改后）。

## 改前改后

这一节给所有人看（CPO / 运营 / 测试 / 研发）：体育比赛在交易相关位置的“时间”改前长什么样、改后长什么样。后面的章节写规则和研发细节。

### 总览

| 排 | 位置 | 改前 | 改后 |
|---|---|---|---|
| ① | Lite 下单卡右上（桌面） | 倒计时到预计结束：`00:00 left`，比赛还在打；按钮还能点 | 开赛前 `Kicks off in 16h 34m`；比赛中 `● LIVE · OT 3:21`（含加时）；打完 `Final · IN REVIEW`，按钮置灰 |
| ② | Lite 手机下单抽屉标题下一行 | `00:00 left · 34% chance` | `Kicks off in 16h 33m · 31% chance Canadiens wins` / `● LIVE · OT 3:21 · 41% chance Maple Leafs wins` / 打完时下单按钮置灰，抽屉不再打开 |
| ③ | Pro 桌面页头标题下一行 | `Winner · Ends in 00:00:00` | `Winner · Starts in 02:10:00` / `● Winner · LIVE · Map 2` / `Winner · Final · In review` |
| ④ | Pro 手机页头统计行 | `Ends in 00:00:00` | 灰点 `Starts in 02:10:00` / 红点 `LIVE · Map 2` / 灰点 `Final · In review` |
| ⑤ | Pro 赛事下拉 / 手机 Select Event 抽屉的 `Ends in` 列 | `Ended`（比赛还在打）；过了预计结束的行从列表消失 | `Starts 67h 00m` / `Starts 38m` / 红点 `Live` / `Final`；比赛行留到结算才离开 |
| ⑥ | 交易开关（Lite + Pro 同一条） | 过了预计结束 → 停止下单，原因 `Closed` | 只在数据源报结束（或兜底 3 小时）→ 停止下单，原因 `In review`；结算后 `Settled` |

任何状态都不再出现 `00:00`、`Ended`。预计结束时间对体育比赛只剩排序 / 按日分组和兜底两个用途。

### ① Lite 下单卡右上（桌面）

| 行 | 改前 | 改后 |
|---|---|---|
| 开赛前 | `17:31:12 left`（倒计时到预计结束；≥ 1 天写 `2d 19h left`） | `Kicks off in 16h 34m`（倒计时到开赛；≥ 24 小时也写小时；< 1 小时 `38:12` 按秒跳；开赛时间到了还没开打 `Starting soon`） |
| 比赛中 | 倒计时继续走，到预计结束变 `00:00 left`，按钮还能点 | `● LIVE · OT 3:21`（红点脉动 + 记分牌同一个时钟；数据源没给时钟只写 `● LIVE`），加时 / 拖延照样能下单 |
| 打完等结果 | 没有这个状态（页面不知道比赛打完了） | `Final ·` + 描边胶囊 `IN REVIEW`，下单按钮置灰写 `In review`，页面挂 In review 卡 |
| 标题 `Make your call`、选项按钮、金额区 | — | 不变 |

截图：改前 = CPO 2026-11-04 正式站截图；改后 = 字典帧 TR-29 / TR-29c / TR-29d 对应的正式站页面（Canadiens vs. Hurricanes 开赛前；Maple Leafs vs Kraken 加时中 / 打完）。

### ② Lite 手机下单抽屉

| 行 | 改前 | 改后 |
|---|---|---|
| 标题下一行 · 开赛前 | `17:31:12 left · 31% chance` | `Kicks off in 16h 33m · 31% chance Canadiens wins` |
| 标题下一行 · 比赛中 | `00:00 left · 41% chance` | `● LIVE · OT 3:21 · 41% chance Maple Leafs wins` |
| 打完等结果 | 抽屉照常打开、能下单 | 页面底部两个 Buy 按钮置灰，抽屉不再打开；页面挂 In review 卡 |
| 抽屉其余内容 | — | 不变 |

截图：改前手机没有留下截图（当时只截了桌面），改前这一行写的就是桌面同一个 `<倒计时> left`；图只放改后。

### ③ Pro 桌面页头

| 行 | 改前 | 改后 |
|---|---|---|
| 标题下一行 · 开赛前 | `Winner · Ends in 17:31:12`（倒计时到预计结束） | `Winner · Starts in 02:10:00`（无红点） |
| 标题下一行 · 比赛中 | `Winner · Ends in 00:00:00` | `● Winner · LIVE · Map 2`（红点脉动；冰球 `OT 3:21`、足球 `63'`） |
| 标题下一行 · 打完等结果 | 没有这个状态 | `Winner · Final · In review`（无红点） |
| 标题、下拉箭头、Watch live 胶囊 | — | 不变（Watch live 规则见 PW-1 … PW-6） |

截图：改前 = CPO 2026-11-04 正式站截图；改后 = 字典帧 PW-3 / PW-2 / PW-7（生产页头组件挂固定数据）。

### ④ Pro 手机页头

| 行 | 改前 | 改后 |
|---|---|---|
| 统计行 · 开赛前 | `Ends in 17:31:12` | 灰点 `Starts in 02:10:00` |
| 统计行 · 比赛中 | `Ends in 00:00:00` | 红点脉动 `LIVE · Map 2`（白字） |
| 统计行 · 打完等结果 | 没有这个状态 | 灰点 `Final · In review` |
| 返回键、标题 | — | 不变 |

截图：改前手机没有留下截图，写法与桌面同一个 `Ends in`；改后 = 字典帧 PW-6 / PW-5 / PW-8。

### ⑤ Pro 赛事下拉 / 手机 Select Event 抽屉

| 行 | 改前 | 改后 |
|---|---|---|
| 列头 | `Ends in` | `Ends in`（不变：下拉里混着其他事件） |
| 体育行 · 开赛前 | `17h 31m`（到预计结束） | `Starts 67h 00m`（< 1 小时 `Starts 38m`；开赛时间到了还没开打 `Starting soon`） |
| 体育行 · 比赛中 | 倒计时走到 `Ended`；过了预计结束的行被过滤掉 | 红点 + `Live`；行留在列表里 |
| 体育行 · 打完等结果 | 没有 | `Final`；结算后才离开列表 |
| 其他事件的行 | — | 不变（仍是倒计时） |

截图：改前 = CPO 2026-11-04 正式站截图；改后 = 字典帧 ES-D5 / ES-M2。

### ⑥ 交易开关

| 行 | 改前 | 改后 |
|---|---|---|
| 过了预计结束 | 停止下单，原因印 `Closed`（Lite 与 Pro） | 不停；照常下单 |
| 数据源报比赛结束 / 进 In review | 没有这个入口 | 停止下单，原因印 `In review` |
| 兜底 | 没有 | 过了预计结束 3 小时还没收到结束信号 → 按打完处理（前端显示 + 禁下单；正式版后端同规则 + 告警） |
| 已结算 | `Settled` | `Settled`（不变） |
| `freeze_time` 有值 | 照旧生效 | 照旧生效（不变） |

没有单独截图，看 ① 的「打完等结果」卡。


## 0. 读者须知

查什么去哪儿：
- 长什么样 → 生产页：开赛前看 Sports 列表任一预告场（如 `/trade?event=mn-EPLR7N500`，Canadiens vs. Hurricanes，2026-11-20 开赛）；比赛中看 `/trade?event=demo-live-cs2`（Spirit vs MOUZ，演示电竞赛，长期在打，Lite 与 Pro、桌面与手机都能开）；打完等结果看 Lite `/trade?event=demo-live-ot-nhl`（兜底后的 Final · In review；Pro 下拉已不列它，见 §5）
- 什么时候变成什么样 → `/style-guide` → Lite → **交易页** 节点 → 小节「⑧ 体育比赛的时间位（TR-29 … TR-29e）」；Pro → **两终端共用** 节点 → 「⓪ 页头（PW-3 / PW-2 / PW-7 桌面，PW-6 / PW-5 / PW-8 手机）」与「② 事件选择器 · 体育行（ES-D5 / ES-M2）」
- 字段名、文案、术语 → `docs/copy-dictionary.md` 节「Sports 交易时间（2026-11-04）」
- 设计法则 → `DESIGN.md` §Addendum 2026-11-04b · 体育比赛的交易时间
- 后端什么是需求、什么只是演示 → `docs/backend-boundary.md`「2026-11-04 体育比赛 · 比赛状态」
提问前先按上面顺序查一遍；查不到再提，提问时写明"我查了 X 没有"。

## 0.1 字典怎么看

1. 打开 `/style-guide`（不用登录）。Lite 组点 **交易页**，目录里找「⑧ 体育比赛的时间位」；Pro 组点 **两终端共用**，找「② 事件选择器 · 体育行」。
2. TR-29 … 29e 是 Lite 下单卡的五帧（四种状态 + 到点未开打的 Starting soon），只有桌面帧：手机下单面板没有这一行，同一句话在下单抽屉标题下一行（`● LIVE · P2 12:04 · 34% chance Maple Leafs wins`）。ES-D5 是 Pro 桌面下拉、ES-M2 是手机抽屉，一帧里五行覆盖全部状态。
3. 每张样张 = 编号 + 状态名 + iframe 里的生产组件；下面的表固定「状态 / 触发条件 / 视觉 / 数据来源」。
4. 样张用固定时间，不随真实时间走。单张查看：`/style-guide/preview?c=trade-tr29c`、`?c=event-selector-sports`。
5. Pro 页头三态有样张：桌面 PW-3（开赛前）/ PW-2（比赛中）/ PW-7（打完等结果），手机 PW-6 / PW-5 / PW-8，在 Pro → 两终端共用 → 「⓪ 页头」小节（2026-11-10 Watch live 一轮把页头抽成了 `ProEventHeaderLead`，PW-7 / PW-8 为本次交付补的第三态）。

## 通俗导读

> 给没读过正文的人的 2 分钟解读；不替代正文，一切以正文为准。

**一分钟看懂**：体育比赛的结束时间是估的。以前前端拿这个估计时间倒计时，比赛一加时就会出现“还在打却显示 00:00 / Ended”。现在体育比赛不再倒计时到结束：开赛前倒计时到开赛（这个时间是准的），开赛后显示 `● LIVE` 和比赛时钟，数据源报“比赛结束”才停止交易、显示 `Final · In review`，结算后 `Settled`。

**一条故事线**：枫叶对海怪，预计 18:00 结束。17:55 第三节打平进加时：页面照样写 `● LIVE · OT 3:21`，照样能下单。18:12 加时进球，数据源报结束 → 下单停止，显示 `Final · In review`；结果确认后结算。

**易混点**：
- 不是“延长倒计时”，而是体育比赛根本不显示到结束的倒计时。
- 不是“过了预计时间就关交易”——预计时间对体育比赛只剩两个用途：排序 / 按日分组，和兜底（过了 3 小时还没收到结束信号才强制停）。
- 不是新做一个“结果确认中”状态——就是站内现有的 In review（lifecycle `REVIEW`），只是体育比赛多了一种进入方式。

## 1. 四种状态

| 状态 | 判定（`matchPhase(e, now)`，`sportsData.ts`） | 能不能交易 |
|---|---|---|
| 开赛前 `upcoming` | `match_status` 为 scheduled / postponed；或没有 `match_status` 且 kickoff 在未来 | 能 |
| 比赛中 `live` | `match_status` 为 live（数据源说在打就在打，哪怕 kickoff 时间还没到）；或没有 `match_status` 且 kickoff 已过——且不是下面两种（**包括已过预计结束**） | 能 |
| 打完等结果 `final` | lifecycle `REVIEW`；或 `match_status` 为 final / cancelled；或兜底：`now > end_date + 3 小时` | 不能，In review |
| 已结算 `settled` | `is_resolved` | 不能，Settled |

- kickoff = `metadata.kickoff_at`，没有时回落 `start_date`。子盘（让分 / 大小分 / 地图）带同样的 `kickoff_at`，跟主赛一起判。
- `end_date` 对体育比赛只用于：排序 / 按日分组，和兜底（兜底对 `match_status = live` 的比赛同样生效，恰好等于 3 小时时还算在打）。不显示、不倒计时、不关交易。
- 体育行的 `freeze_time` 必须为空：它有值仍会按原规则在冻结时间印 `Closed`，和本需求相反。Lovable 现有 184 场未结算体育行 0 场有值（2026-11-19 查）。
- `metadata.live` 是演示引擎的调试字段，前端不读。

## 2. 每个位置显示什么

| 位置 | 开赛前 | 比赛中（含加时、拖延） | 打完等结果 |
|---|---|---|---|
| Lite 桌面下单卡右上（原 `<倒计时> left`） | `Kicks off in 2h 10m`（2026-11-16 起由 `Starts in` 改为 `Kicks off in`，≥ 24 小时也写小时 `26h 10m`；<1 小时 `38:12` 按秒跳；开赛时间已过、比赛还没开打写 `Starting soon`） | `● LIVE · P2 12:04` | `Final ·` + 描边胶囊 `IN REVIEW`；CTA 置灰 `In review`；页面挂 In review 卡（TR-18） |
| Lite 手机下单抽屉标题下一行 | `Kicks off in 2h 10m · 34% chance Maple Leafs wins` | `● LIVE · P2 12:04 · 34% chance Maple Leafs wins` | 下单按钮置灰、抽屉不再打开（打开着时会写 `Final · In review · …`） |
| Pro 桌面页头标题下一行（原 `Ends in 00:00:00`） | `Winner · Starts in 02:10:00`（无红点；≥ 1 天写 `2d 03:10:00`，Pro 倒计时一贯如此，与 Lite 的小时写法不同） | `● Winner · LIVE · P2 12:04`（红点脉动） | `Winner · Final · In review`（无红点） |
| Pro 手机页头统计行 | 灰点 `Starts in 02:10:00` | 红点脉动 `LIVE · P2 12:04`（白字） | 灰点 `Final · In review` |
| Pro 赛事下拉 / 手机抽屉 `Ends in` 列 | `Starts 26h 10m`（<1 小时 `Starts 38m`；开赛时间已过未开打 `Starting soon`） | 红点 + `Live` | `Final`（行留在列表里，结算后才离开） |

- 比赛时钟 = 记分牌同一个值（`liveLabelFor`：冰球 `P2 12:04` / `OT 3:21`、美式运动 `Q3 8:42`、足球 `63'`、电竞 `Map 2`、棒球 `▼ 7th`）；数据源没给时钟时只写 `● LIVE`。
- 任何状态都不会出现 `00:00`、`Ended`。
- 下拉列头仍叫 `Ends in`：下拉里混着其他事件，体育行的值本身写清楚。
- Sports 列表、首页 Sports 卡、交易页记分牌判断“正在打”用同一个 `matchPhase`：过了预计时间还在打的比赛继续在舞台 / Playing now 里，记分牌也不会提前显示 FINISHED。
- 文案 7 语：`src/locales/*.json` 的 `events` 命名空间 `screen.simple.sports_clock.*`（Lovable 2026-11-04 新增，回写平台 i18n 表）；`LIVE` 用 `common.live`。`es.json` 只覆盖活动页，不在 7 语内。2026-11-19 验收后改了两条译法：ru `In review` → `На проверке`（与站内其他 In review 一致，原 `Проверка результата` 在 1280 卡头折到第二行）、ja 下拉 `Starts {time}` → `あと {time}`（原 `開始まで 67h 00m` 在 96px 列里折行）；另 ru 全站 `Ends in` → `До конца`（原 `Заканчивается через` 撑破下拉列头）。
- 记分牌仍写 `Starts in 16h 34m`（不补零 `2h 5m`），下单卡写 `Kicks off in 16h 34m`（补零 `2h 05m`）——同页两种写法，待 CPO 定是否统一（见交付回报）。

## 3. 交易开关

- Lite（`LiteContractTrade`）与 Pro（`lib/contractGate`，`/trade` 桌面、`/trade/order`、手机图表页共用）同一条规则：体育比赛只在 `final`（含兜底）与 `settled` 时停止交易，原因分别印 `In review` / `Settled`；过了 `end_date` 不再印 `Closed`。`freeze_time` 若有值仍照旧生效。
- 其他事件不变：过 `end_date` / `freeze_time` → `Closed`。

## 4. 数据要求（给正式版研发）

- 事件需要一个比赛状态字段，建议 `metadata.match_status`：`scheduled` / `live` / `final` / `postponed` / `cancelled`，由体育数据源写入。前端只认这个字段（和 lifecycle `REVIEW` / `is_resolved`），不认 `end_date`。体育行不要写 `freeze_time`。
- 收到 `final`：停止交易、进入 `REVIEW`（结果确认中），确认后结算。
- 兜底由后端做：`live` 状态下过了 `end_date + 3 小时` 仍没收到结束信号 → 停止交易、进 `REVIEW`、告警。前端也按同一规则显示，防止后端漏做时还能下单。
- 延期：数据源写 `postponed` 并更新 `kickoff_at`，比赛回到“开赛前”。取消：走现有作废流程（本轮不改）。
- 没有 `match_status` 的老数据：kickoff 未到 = 开赛前，已过 = 比赛中，直到 REVIEW / 结算 / 兜底。

## 5. Lovable / 正式版边界

| 项 | Lovable | 正式版 |
|---|---|---|
| 比赛状态 | 2026-11-09 起正式版目录同步给 `mn-*` 体育行写 `match_status`（148 / 148 行都有）；旧 `sp-*` / `demo-*` 演示行没有，前端按 kickoff 推出开赛前 / 比赛中；结算引擎到 `end_date` 结算，但 `match_status = 'live'` 的比赛不结算（`roll_sports_matches`） | 数据源写 `match_status`，见 §4 |
| 兜底 | 前端按 `end_date + 3h` 显示 Final · In review、禁止下单 | 后端停交易 + 告警，前端同规则 |
| 演示赛 | `demo-live-ot-nhl` Toronto Maple Leafs vs Seattle Kraken（kickoff = 现在 − 2 小时 50 分，`end_date` = 现在 − 20 分，`match_status = 'live'`，加时 `OT 3:21`）由 `keep_demo_overtime_fixture()` 刷新。**现状（2026-11-19）**：没有定时任务，数据停在 2026-11-04，已触发兜底显示 `Final · In review`；并且 2026-11-09 正式版事件目录同步把它标成 `metadata.retired = true`，不进列表 / Pro 下拉，Pro 直接开 id 会报「Event Has Ended」，只有 Lite 能凭 id 打开。长期在打的演示改看电竞 `demo-live-cs2`（`end_date` 设在远期，不会触发兜底）。要恢复一场“已过预计结束、加时中”的常驻演示，需要 CPO 定：去掉 retired 标记 + 加每 10 分钟的定时任务 | — |

## 6. 字典 case 索引

| 编号 | 状态 | preview key |
|---|---|---|
| TR-29 | Lite 下单卡 · 开赛前 | `trade-tr29` |
| TR-29b | Lite 下单卡 · 比赛中 | `trade-tr29b` |
| TR-29c | Lite 下单卡 · 比赛中、已过预计结束（加时） | `trade-tr29c` |
| TR-29d | Lite 下单卡 · 打完等结果 | `trade-tr29d` |
| TR-29e | Lite 下单卡 · 到了开赛时间、比赛还没开打（Starting soon，2026-11-16 补） | `trade-tr29e` |
| PW-3 / PW-2 / PW-7 | Pro 桌面页头 · 开赛前 / 比赛中 / 打完等结果 | `pro-watch-desk-pre` / `pro-watch-desk-nostream` / `pro-watch-desk-final` |
| PW-6 / PW-5 / PW-8 | Pro 手机页头 · 开赛前 / 比赛中 / 打完等结果 | `pro-watch-mob-pre` / `pro-watch-mob-nostream` / `pro-watch-mob-final` |
| ES-D5 | Pro 赛事下拉 · 体育行（五行覆盖全部状态） | `event-selector-sports` |
| ES-M2 | 手机 Select Event 抽屉 · 体育行 | `event-selector-drawer-sports` |

## 7. 代码坐标

- 判定：`src/components/lite/sports/sportsData.ts` — `matchPhase`、`isFixtureLive`、`isSportsFixture`、`SPORTS_WATCHDOG_MS`、`liveAt`
- 显示：`src/components/lite/sports/sportsClock.tsx` — `useSportsClock`、`sportsClockAt`、`SportsClockLabel`（card / line / header）、`SportsClockCell`、`sportsClockText`
- 接入：`LiteContractTrade`、`LiteContractOrderPanel`（`timeSlot`）、`LiteOrderDrawerHeader`、`DesktopTrading` → `ProEventHeaderLead`（`components/pro/ProWatchLive.tsx`）、`MobileTradingLayout` + `MobileHeader`（`countdownUrgency="live"`）、`EventSelectorPanel`、`useEventSelector`、`lib/contractGate`
- 字典：`StyleGuide/preview/tradePreviews.tsx`（TR-29…）、`proWatchLivePreviews.tsx`（PW-7 / PW-8 本次补）、`eventSelectorPreviews.tsx`（ES-D5 / ES-M2）
- 后端：`supabase/migrations/20261104160000_sports_match_status.sql`

## 8. 测试用例

生产页能凑出的在正式站点；凑不出的（数据源报结束、兜底、开赛时间过了没开打）看字典帧，它们是既定状态不是 bug。

| # | 场景 | 怎么做 | 预期 |
|---|---|---|---|
| 1 | 开赛前（≥ 1 小时） | Lite / Pro 打开任一预告场（Sports 列表「Upcoming」里挑） | Lite 卡右上 `Kicks off in 16h 34m`（≥ 24 小时也写小时）；手机抽屉 `Kicks off in … · 31% chance … wins`；Pro 页头 `Starts in 16:34:12`；下拉 `Starts 16h 34m`；能下单 |
| 2 | 开赛前（< 1 小时） | 同上，挑 1 小时内开赛的 | Lite 卡 `38:12` 按秒跳；下拉 `Starts 38m`（按分钟） |
| 3 | 开赛时间到了还没开打 | 字典 TR-29 note / DESIGN §Addendum 2026-11-16 4b（生产要靠数据源 `scheduled` + kickoff 已过） | 全处写 `Starting soon`，不出现 `00:00`；仍能下单 |
| 4 | 比赛中 | `/trade?event=demo-live-cs2`（长期在打） | Lite 卡 `● LIVE · Map 2`；手机抽屉同句；Pro 页头红点 + `LIVE · Map 2`；下拉红点 `Live`；能下单 |
| 5 | 比赛中、已过预计结束（加时 / 拖延） | 字典 TR-29c（生产要靠 `match_status = live` 且 `end_date` 已过） | 和 4 一样，照样能下单；Sports 列表 / 首页仍算正在打 |
| 6 | 数据源报结束 | 字典 TR-29d / PW-7 / PW-8；或 Lite `/trade?event=demo-live-ot-nhl`（兜底后的样子） | Lite 卡 `Final · IN REVIEW`，CTA 置灰写 In review，页面挂 In review 卡；手机 Buy 置灰、抽屉不开；Pro 页头 `Final · In review`；下拉 `Final` 行仍在 |
| 7 | 兜底 | 把 `end_date` 改到 3 小时前且没有 `match_status`（测试库） | 同 6；正式版后端同时停交易 + 告警 |
| 8 | 结算 | 结算任一体育事件 | 显示 `Settled`；下拉行离开列表；持仓走正常结算 |
| 9 | 取消 / 延期 | 数据源写 `cancelled` / `postponed` + 新 `kickoff_at` | cancelled 同 6 进 In review 走作废流程；postponed 回到 1 |
| 10 | 非体育事件回归 | 任一加密轮 / 股票 / 普通事件 | 仍是倒计时：Lite `… left`、Pro `Ends in …`、过期 `Closed`，一字不变 |
| 11 | 7 语 | 字典帧加 `&lang=ru` / `vi` / `ja` / `ko` | 时间位不折行不溢出；vi 的 In review 写 `Chờ kết quả` |
