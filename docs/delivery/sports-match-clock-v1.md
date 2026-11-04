# 体育比赛 · 交易时间显示（比赛打没打完只看比赛状态）— 交付说明 v1

> **研发交付用的唯一总文档。** 范围：所有体育比赛（事件带 `metadata.kickoff_at`，含让分 / 大小分 / 地图等子盘）在交易相关位置显示的“时间”和交易开关。其他事件（加密快轮、股票、普通事件）一律不变。
> 决策：Liya（CPO）2026-11-04 批，方案图 11 条规则（见 §2）。起因：正式平台的 `end_date` 是运营填的“预计结束”，比赛加时 / 拖延时前端倒计时到 00:00、Pro 页头 `Ends in 00:00:00`、下拉写 `Ended`，但比赛还在打、下单按钮还能点。
> 状态：Lovable 已实现；演示引擎已改（数据源报“在打”的比赛不按预计时间结算），并有一场常驻“已过预计结束、加时中”的演示赛。

## 0. 读者须知

查什么去哪儿：
- 长什么样 → 生产页 `/trade?event=demo-live-ot-nhl`（Lite 与 Pro、桌面与手机；这场比赛预计结束已过、加时中）
- 什么时候变成什么样 → `/style-guide` → Lite → **交易页** 节点 → 小节「⑧ 体育比赛的时间位（TR-29 … TR-29d）」；Pro → **两终端共用** 节点 → 「② 事件选择器 · 体育行（ES-D5 / ES-M2）」
- 字段名、文案、术语 → `docs/copy-dictionary.md` 节「Sports 交易时间（2026-11-04）」
- 设计法则 → `DESIGN.md` §Addendum 2026-11-04b · 体育比赛的交易时间
- 后端什么是需求、什么只是演示 → `docs/backend-boundary.md`「2026-11-04 体育比赛 · 比赛状态」
提问前先按上面顺序查一遍；查不到再提，提问时写明"我查了 X 没有"。

## 0.1 字典怎么看

1. 打开 `/style-guide`（不用登录）。Lite 组点 **交易页**，目录里找「⑧ 体育比赛的时间位」；Pro 组点 **两终端共用**，找「② 事件选择器 · 体育行」。
2. TR-29 … 29d 是 Lite 下单卡的四种状态，只有桌面帧：手机下单面板没有这一行，同一句话在下单抽屉标题下一行（`● LIVE · P2 12:04 · 34% chance`）。ES-D5 是 Pro 桌面下拉、ES-M2 是手机抽屉，一帧里五行覆盖全部状态。
3. 每张样张 = 编号 + 状态名 + iframe 里的生产组件；下面的表固定「状态 / 触发条件 / 视觉 / 数据来源」。
4. 样张用固定时间，不随真实时间走。单张查看：`/style-guide/preview?c=trade-tr29c`、`?c=event-selector-sports`。
5. Pro 页头（`Winner · ● LIVE · P2 12:04`）没有独立样张：它长在 `DesktopTrading` / `MobileTradingLayout` 里，看演示赛 `demo-live-ot-nhl` 的生产页。

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
| 比赛中 `live` | kickoff 已过，且不是下面两种（**包括已过预计结束**） | 能 |
| 打完等结果 `final` | lifecycle `REVIEW`；或 `match_status` 为 final / cancelled；或兜底：`now > end_date + 3 小时` | 不能，In review |
| 已结算 `settled` | `is_resolved` | 不能，Settled |

- kickoff = `metadata.kickoff_at`，没有时回落 `start_date`。子盘（让分 / 大小分 / 地图）带同样的 `kickoff_at`，跟主赛一起判。
- `end_date` 对体育比赛只用于：排序 / 按日分组，和兜底。不显示、不倒计时、不关交易。
- `metadata.live` 是演示引擎的调试字段，前端不读。

## 2. 每个位置显示什么

| 位置 | 开赛前 | 比赛中（含加时、拖延） | 打完等结果 |
|---|---|---|---|
| Lite 桌面下单卡右上（原 `<倒计时> left`） | `Starts in 2h 10m`（≥1 天 `2d 19h`，<1 小时 `38:12` 按秒跳） | `● LIVE · P2 12:04` | `Final ·` + 描边胶囊 `IN REVIEW`；CTA 置灰 `In review`；页面挂 In review 卡（TR-18） |
| Lite 手机下单抽屉标题下一行 | `Starts in 2h 10m · 34% chance` | `● LIVE · P2 12:04 · 34% chance` | `Final · In review · 34% chance` |
| Pro 桌面页头标题下一行（原 `Ends in 00:00:00`） | `Winner · Starts in 02:10:00`（无红点） | `● Winner · LIVE · P2 12:04`（红点脉动） | `Winner · Final · In review`（无红点） |
| Pro 手机页头统计行 | 灰点 `Starts in 02:10:00` | 红点脉动 `LIVE · P2 12:04`（白字） | 灰点 `Final · In review` |
| Pro 赛事下拉 / 手机抽屉 `Ends in` 列 | `Starts 2d 19h`（<1 小时 `Starts 38m`） | 红点 + `Live` | `Final`（行留在列表里，结算后才离开） |

- 比赛时钟 = 记分牌同一个值（`liveLabelFor`：冰球 `P2 12:04` / `OT 3:21`、美式运动 `Q3 8:42`、足球 `63'`、电竞 `Map 2`、棒球 `▼ 7th`）；数据源没给时钟时只写 `● LIVE`。
- 任何状态都不会出现 `00:00`、`Ended`。
- 下拉列头仍叫 `Ends in`：下拉里混着其他事件，体育行的值本身写清楚。
- Sports 列表、首页 Sports 卡、交易页记分牌判断“正在打”用同一个 `matchPhase`：过了预计时间还在打的比赛继续在舞台 / Playing now 里，记分牌也不会提前显示 FINISHED。
- 文案 7 语：`src/locales/*.json` 的 `events` 命名空间 `screen.simple.sports_clock.*`（Lovable 2026-11-04 新增，回写平台 i18n 表）；`LIVE` 用 `common.live`。

## 3. 交易开关

- Lite（`LiteContractTrade`）与 Pro（`lib/contractGate`，`/trade` 桌面、`/trade/order`、手机图表页共用）同一条规则：体育比赛只在 `final`（含兜底）与 `settled` 时停止交易，原因分别印 `In review` / `Settled`；过了 `end_date` 不再印 `Closed`。`freeze_time` 若有值仍照旧生效。
- 其他事件不变：过 `end_date` / `freeze_time` → `Closed`。

## 4. 数据要求（给正式版研发）

- 事件需要一个比赛状态字段，建议 `metadata.match_status`：`scheduled` / `live` / `final` / `postponed` / `cancelled`，由体育数据源写入。前端只认这个字段（和 lifecycle `REVIEW` / `is_resolved`），不认 `end_date`。
- 收到 `final`：停止交易、进入 `REVIEW`（结果确认中），确认后结算。
- 兜底由后端做：`live` 状态下过了 `end_date + 3 小时` 仍没收到结束信号 → 停止交易、进 `REVIEW`、告警。前端也按同一规则显示，防止后端漏做时还能下单。
- 延期：数据源写 `postponed` 并更新 `kickoff_at`，比赛回到“开赛前”。取消：走现有作废流程（本轮不改）。
- 没有 `match_status` 的老数据：kickoff 未到 = 开赛前，已过 = 比赛中，直到 REVIEW / 结算 / 兜底。

## 5. Lovable / 正式版边界

| 项 | Lovable | 正式版 |
|---|---|---|
| 比赛状态 | 演示引擎不写 `match_status`（前端按 kickoff 推出开赛前 / 比赛中）；结算引擎到 `end_date` 结算，但 `match_status = 'live'` 的比赛不结算（`roll_sports_matches`） | 数据源写 `match_status`，见 §4 |
| 兜底 | 前端按 `end_date + 3h` 显示 Final · In review、禁止下单 | 后端停交易 + 告警，前端同规则 |
| 演示赛 | `demo-live-ot-nhl` Toronto Maple Leafs vs Seattle Kraken：kickoff = 现在 − 2 小时 50 分，`end_date` = 现在 − 20 分（预计结束已过），`match_status = 'live'`，加时 `OT 3:21`。保持函数 `keep_demo_overtime_fixture()`；要它一直停在加时，需要每 10 分钟跑一次的定时任务（待 CPO 确认后加），没加时约 3 小时后触发兜底变成 `Final · In review` | — |

## 6. 字典 case 索引

| 编号 | 状态 | preview key |
|---|---|---|
| TR-29 | Lite 下单卡 · 开赛前 | `trade-tr29` |
| TR-29b | Lite 下单卡 · 比赛中 | `trade-tr29b` |
| TR-29c | Lite 下单卡 · 比赛中、已过预计结束（加时） | `trade-tr29c` |
| TR-29d | Lite 下单卡 · 打完等结果 | `trade-tr29d` |
| ES-D5 | Pro 赛事下拉 · 体育行（五行覆盖全部状态） | `event-selector-sports` |
| ES-M2 | 手机 Select Event 抽屉 · 体育行 | `event-selector-drawer-sports` |

## 7. 代码坐标

- 判定：`src/components/lite/sports/sportsData.ts` — `matchPhase`、`isFixtureLive`、`isSportsFixture`、`SPORTS_WATCHDOG_MS`、`liveAt`
- 显示：`src/components/lite/sports/sportsClock.tsx` — `useSportsClock`、`sportsClockAt`、`SportsClockLabel`（card / line / header）、`SportsClockCell`、`sportsClockText`
- 接入：`LiteContractTrade`、`LiteContractOrderPanel`（`timeSlot`）、`DesktopTrading`、`MobileTradingLayout` + `MobileHeader`（`countdownUrgency="live"`）、`EventSelectorPanel`、`useEventSelector`、`lib/contractGate`
- 后端：`supabase/migrations/20261104160000_sports_match_status.sql`
