# Lovable 展示 omenx.com 真实事件（主网事件目录同步）— 交付说明 v1（2026-11-09，第 2 批 2026-11-10）

> **通俗导读**：Lovable 原来的赛事、长期事件全是演示引擎自己编的（`sp-*`、`cs2-*`、`ufc-*`、45 个长期事件），和主站对不上，产品方案拿真实数据一看就走样。现在 Lovable 的数据库每 3 分钟从 www.omenx.com 拉一次公开目录，**事件长什么样**（标题、联赛、两队、队徽、开赛时间、比分、比赛状态、直播标记和直播截图、封面图、选项名）跟主站一致；**价格和成交额**不跟主站，第一次进库时拿主站的价当起点，之后照旧由演示引擎自己动（CPO 批 A）。演示直播样板赛（`demo-live-cs2` 在播 / `demo-prekick-cs2` 待开赛）留着，方便演示直播（CPO 批 B）。分两批（CPO 批 C）：**第 1 批 = 体育 + 长期事件**；**第 2 批 = 股票日轮、加密轮的阵容对齐（2026-11-10 CPO 批十条，见 §7）**。
>
> 这件事主要是 Lovable 演示引擎的事，**正式版不需要实现同步**（正式版本来就是主网）。研发要看的只有 §4「正式版要接的几处」。

## 0. 查什么去哪儿

- 长什么样 → 生产页：`/events`（All 视图 Sports / More 段）、`/events?sector=sports`、`/trade?event=mn-<主网 eventId>`
- 什么时候变成什么样 → `/style-guide` → Events 列表 → ⑥b 小节 `EV-47 队徽四种画法`
- 字段名、文案、术语 → `docs/copy-dictionary.md` §Sports 列表「主网同步事件 / 退役事件 / 队徽」→ 本文；Lite 词 ↔ 交易词见 copy-dictionary 顶部「Lite 术语对照表」
- 表、函数能不能参考 → `docs/backend-boundary.md` 2026-11-09 一节

## 0.1 字典怎么看

| 步 | 做什么 | 看到什么 |
|---|---|---|
| 1 | 打开 `https://omenxv2.lovable.app/style-guide`（不用登录） | 本次只动 **Events 列表** 一个节点 |
| 2 | 本页目录点「⑥b Sports 品类页 · 直播与直播预告」 | EV-36 … EV-47 |
| 3 | 小节顶部定位行 | 路由 `/events?sector=sports`、词典节、本文 |
| 4 | 样张 `EV-47 · 队徽四种画法` | 桌面 = Sports 品类页列表（LiteSportsView），手机 375 = 手机 Sports 模块（MobileSportsModule），都是真组件 |
| 5 | 样张下面的表 | 「状态 / 触发条件 / 视觉 / 数据来源」 |
| 6 | 找编号 | 页头搜索框敲 `EV-47` |
| 7 | 单张看 | `https://omenxv2.lovable.app/style-guide/preview?c=events-ev47` |

只在字典可见的态：**队徽加载失败退回代码徽**（生产页上的队徽都能加载）。

## 1. 同步什么、不同步什么

| 内容 | 从主网来 | 说明 |
|---|---|---|
| 体育赛程（跟主站首页 `/?tab=sports` 同一份：今天起 7 天） | ✅ 每 3 分钟 | `/pub/sports/matches`，必须带请求头 `X-Time-Zone`（不带返回 400）。（`www.omenx.com/sports` 独立站点已下线，不再使用。）主网不再列出的比赛 30 分钟后在 Lovable 隐藏 |
| 两队名字、缩写、队徽、联赛、开赛时间 | ✅ | 改时间、改名会跟着变；**事件名首次进库后不再改**（下单、持仓按事件名找事件） |
| 比分、比赛状态（未开赛 / 进行中 / 完场 / 取消）、状态文字（`Q3 5:12`、`HT`、`SUS`） | ✅ | 列表 live 位直接显示主网的状态文字 |
| 直播 | 只同步「有没有直播」 | 主网公开接口没有播放地址；有直播的比赛在 Lovable 统一放演示动画流（CPO 2026-11-09：就用演示流），画面用演示流的静帧 |
| 长期事件（非体育、非系列轮次、非股票） | ✅ | `/pub/event/list`；主网目前只有 1 个：Anthropic 估值（4 档，每档各自 Yes / No） |
| 封面图 | ✅ | `/pub/event/homepage?page=1&pageSize=100&surface=STANDARD`（主站首页同一个请求）；体育统一用 `/card-bg/sports.jpg`（主网也是） |
| 规则说明 | ✅ 一次 | `/pub/event/detail` 的 `summary` |
| 结果 | ✅ | 完场 / 主网停止交易 / 从目录里消失时查 `/pub/event/detail` 的 `winningOutcome`，按主网结果结算；查不到结果就停在 In review |
| 价格、成交额、成交流 | ❌ | 第一次进库用主网的价和累计成交额当起点，之后 `sim_price_tick` / `sim_market_activity_tick` 照旧 |
| 股票日轮（美股 / 港股 / 韩股）阵容、开轮收盘时间、Base | ✅ 第 2 批 | 跟主网一样的股票清单（今天 美 51 · 港 12 · 韩 7），见 §7 |
| 股票日轮的盘中走势、最新价、Up / Down 报价、结算 | ❌ | 演示引擎自己模拟；结算按模拟收盘价，见 §7 规则 5、6 |
| 加密轮（BTC / ETH / SOL × 5m / 15m / 1h / 4h / 1d） | ✅ 第 2 批 只对切点 | 币种和周期本来就一样；1d / 4h 改成按美东时间切，见 §7 规则 9 |
| Quick Play | ❌ | 不动 |

## 2. 演示引擎自己的事件怎么处理（退役，不删）

- 打上 `metadata.retired = true`：所有未结算的 `SPORTS_MATCH`（除 `demo-live-cs2`、`demo-prekick-cs2` 及其 game line）和全部 45 个长期事件。共 217 行。
- 退役事件**不出现在任何列表**（首页、品类页、Insights、Resolved、相关市场、空投对冲池、编辑精选）；按 id / 名字仍然能打开（持仓、历史、交易页）。
- 有人还持着仓的退役赛事（含只持了它的让分 / 大小分盘）照常结算（`roll_sports_matches` / `tick_live_*`），结算后**不再重排到下周**；没人持仓的就停在那里。例外：`demo-live-wta` 是一直在打的演示网球赛，上面的演示仓不会结算。
- 演示号新开的演示仓（`roll_demo_positions`）只开在主网同步来的事件上。
- **Editor's Desk 常驻三条**（CPO 2026-11-09）：用首页改版 mock 里那三条——BTC 当日收盘涨跌、NVDA 今天收得比开盘高吗、本周最大的体育盘（Bills vs Vikings 开着时就是它，之后换成成交额最大的 NFL / 体育比赛）。它们都是滚动的轮次，`mn_refresh_demo_picks()` 每 3 分钟把精选标记挪到各自当前那一轮；推荐语沿用 mock，去掉了会过期的价格数字。
- **More 段常驻四条演示长期事件**（CPO 2026-11-09，和主网的 Anthropic 一起展示，同步不碰）：`best-ai-model-eoy-2026`（5 档互斥，露 4 档 + 「+1 more」）、`us-president-2028`（4 档互斥）、`gpt6-release-window-2026`（3 个时间段）、`fed-rate-hike-2026`（二元）。标记 `metadata.demo_pinned = true`。前三条 2026 年底到期，到期前要换。

## 3. 字段映射（主网 → Lovable）

| Lovable | 主网 | 备注 |
|---|---|---|
| `events.id` | `'mn-' || eventId` | |
| `events.name` | `title` 去掉 `【NBA】` 这类前缀 | 撞名时加 ` · Nov 12` |
| `metadata.home` / `away` | 标题里**先出现**的队 / 后出现的队 | 二元赛 = YES 那一边；三项赛 = 主队。比分跟着换边 |
| `metadata.home_abbr` / `home_logo` | `homeTeam.shortCode` / `logoUrl`（没有用 `flagUrl`） | |
| `metadata.home_tile` / `away_tile` | 美国四大联赛的方块队徽颜色 | 见 §4 ① |
| `metadata.league` / `league_code` | `tournament.name` / `shortCode` | 新联赛进 `src/lib/taxonomy.ts`（本次加了 UEFA Nations League） |
| `metadata.sport` | 由联赛代码推（NBA → basketball …；三项赛 → soccer） | `mn_sport_of` |
| `metadata.match_status` | `matchStatus` | NOT_STARTED → scheduled，LIVE → live，FINISHED → final，CANCELLED → cancelled，SUSPENDED → 开赛前 postponed / 开赛后 live |
| `metadata.score` | `liveHomeScore-liveAwayScore`（按换边后的主客） | 只在 live / final 时写 |
| `metadata.status_label` | `statusDetail` | 有值时列表 live 位直接显示它 |
| `metadata.stream_url` | `hasStream` 为真时 = 演示动画流 | 截图用演示流的静帧 |
| 选项 | 二元：o1 = YES 队、o2 = NO 队；三项：o1 主、o2 `Draw`、o3 客；长期多档：每档一个选项 `m1…mN` | 选项 ↔ 主网 market 的对应存在 `metadata.mn_outcomes` |

## 4. 正式版要接的几处（研发看这里）

1. **队徽（S1 规则扩到 Crest）**：真队徽（透明底）画在深色圆里、`contain` 74%；美国四大联赛的「队徽」其实是印着缩写的纯色方块（Polymarket 图库），按 S1 画成「方块颜色的圆 + 白字缩写」；没有图或加载失败 → 原来的代码徽。这些图没有 CORS 头，前端取不到颜色，**正式版请后端在队伍资料里直接给方块颜色**（Lovable 是一次性取色存进 `mn_logo_tiles`）。
2. **直播截图**：首页 sports 接口（`/pub/sports/matches`）目前只有 `hasStream`，没有截图地址；「点了才播」要的 10 分钟快照（`metadata.stream_thumb_url`）需要这个接口补上。
3. **live 位文字**：有 `statusDetail` 就原样显示（`Q3 5:12` / `HT` / `63'`），没有再按运动自己推。
4. **股票显示（第 2 批）**：头像用股票资料里的 logo（主网 `asset.iconUrl`，铺满圆形）；港股代码补成 4 位（`0700.HK`）；韩股代码写 `000660.KR`；韩元价格不带小数、带千分位（`₩1,136,000`，图表纵轴、`Price to beat` 同样）；行里公司名用短名（`AMD`、`SK Hynix`，不是 `Advanced Micro Devices, Inc.` / `SKHynix`），短名表见 `mn_stock_names`，正式版请放进股票资料。

## 5. 发现的主网数据问题（报给研发 / 运营）

- `E5C6EX3DH` Rayo Vallecano vs Athletic Club：10 月 10 日的比赛，`matchStatus = FINISHED`、`statusDetail = SUS`，但事件状态还是 TRADING，至今挂在赛程第一天。Lovable 照搬后显示为 In review。
- `/pub/notification/v1/announcements/popups` 在页面挂后台时被反复请求（几分钟内 398 次，当时在已下线的 `/sports` 站点上观察到），疑似轮询没节流，首页是否同样有待确认。

## 6. Lovable 侧怎么跑（运维）

- cron `mainnet-catalog-sync`，`*/3 * * * *`：先 `mn_sync_apply()` 处理上一轮的回包，再 `mn_sync_request()` 发这一轮的请求（pg_net 异步）。
- 每轮结果写 `mn_sync_log.stats`（插入 / 更新 / 封面 / 结算 / 错误），保留 3 天。
- 主网接口挂了：这一轮记 `http_*` 状态码（主站改接口时最先看到的就是这个），数据保持上一轮的样子；赛事过了预计结束 3 小时还没结果 → 前端按看门狗规则显示 In review。
- 恢复某个退役事件：`update events set metadata = metadata - 'retired' where id = '…'`。
- migration：`supabase/migrations/20261109190000_mainnet_catalog_sync.sql`、`20261109200000_mainnet_sync_home_tab.sql`（换成首页 sports 接口、常驻精选与 More）、`20261110120000_mainnet_sync_batch2_rounds.sql`（第 2 批）。
- 第 2 批起：目录多拉一页（`pageNum=2`，主网可交易事件已经 190 个左右，200 一页快满了）；每轮 `mn_sync_log.stats` 多三个数 `stock_inserted / stock_updated / stock_settled`；旧的两个股票开轮 cron（`roll-daily-stock-events`、`roll-daily-hk-stock-events`）已停，股票的开轮、状态、结算都在 `mainnet-catalog-sync` 里跑；加密轮仍是 `roll-crypto-quick-rounds` 每分钟。

## 7. 第 2 批：股票日轮、加密轮（CPO 2026-11-10 批，十条）

**为什么**：Lovable 原来只有演示引擎自己滚的 10 只美股、6 只港股，没有韩股；美股收盘后要到 UTC 05:00 才开下一轮，中间几个小时首页一直写 `settling now`；Base 是上一轮随机 ±1.5%；加密 1d / 4h 按 UTC 切，主网按美东切。

| # | 规则 | 怎么做的 |
|---|---|---|
| 1 | 股票清单跟主网一样（美股 / 港股 / 韩股全量） | 目录里 `marketRegion ∈ US/HK/KR`、`seriesPeriod = 1d` 的每一条开一轮；主网下架的股票不再开新轮，已开的那轮照常结算 |
| 2 | 韩股上线 | `KR_STOCK_DAILY_UPDOWN_SPOT`，前端本来支持（首页 Korea tab、Finance 品类页 Korea 筛选、日历、`/spot`）；韩元不带小数、千分位（`₩1,136,000`） |
| 3 | 主网挂出下一轮就开，收盘时间用主网的 | `start_date` = `tradingStart`，`end_date` = `lockTime`；冻结 = 收盘前 5 分钟，结算展示 = 收盘后 15 分钟 |
| 4 | Base 用主网的 | `basePrice`（上一交易日官方收盘） |
| 5 | 其他价格照旧模拟 | Up / Down 报价第一次进库用主网 `lastTradePrice`（和第 1 批一样），成交额第一次用 `totalVolume`，之后演示引擎动 |
| 6 | 按 Lovable 自己的模拟收盘价结算 | 收盘价 = 首页 Stocks 小图那条走势线的最后一点（`HomeStocksSection` 的 `walk`，48 个点，σ 0.004，按事件 id 定种子），后端 `mn_walk_close()` 逐位照抄，结果和前端一致到小数点后 8 位；大于 Base → Up，否则 Not Up |
| 7 | 名字 `短名 (代码) — will it close higher today?`（2026-11-10 起新开的轮次；之前已开的轮次保持原名 `— will close higher today?`，不改名，免得已下单的人对不上） | 短名表 `mn_stock_names`（如 `Advanced Micro Devices, Inc.` → `AMD`、`SKHynix` → `SK Hynix`）；没有短名的去掉 Inc. / Corporation 等后缀。前端公司名一律从事件名里取（`stockCompanyName`） |
| 8 | 港股 4 位、韩股照主网 | `700.HK` → `0700.HK`；`000660.KR`（原来前端写 `.KS`，已改） |
| 9 | 加密 1d / 4h 按美东切 | 1d = 美东中午 12 点到次日 12 点；4h = 美东 0 / 4 / 8 / 12 / 16 / 20 点；夏令时跟着变。切换当天，已开的那一轮按旧时间跑完，下一轮从新切点开（第一轮会短一些） |
| 7b | 股票 logo 跟主网（同日补） | 主网交易目录里没有 logo，首页「daily close」接口有：`/pub/event/daily-close/rounds/current?assetCode=<代码>` → `asset.iconUrl`（96×96 圆形头像 SVG）。每轮同步取 12 只缺 logo 或超过一天的，存进 `mn_stock_names.icon_url`；前端头像优先用它、铺满圆（和主网一样），没有再用仓库自带 logo、再没有才是代码字。主网没有的（阿里 `9988.HK`、汇丰 `0005.HK`，旧阵容）保留仓库 logo |
| 10 | 加密名字不变、只挂当前一轮 | `Bitcoin — up or down?`；每个币 × 周期同时只有一轮在交易 |

**字段对应（主网 → Lovable，股票）**

| Lovable | 主网 | 备注 |
|---|---|---|
| `events.id` | `us-<代码小写>-updown-<tradeDate>` / `hk-<4 位代码>-updown-…` / `kr-<6 位代码>-updown-…` | 沿用原来的 id 形状，持仓、历史、过去几天条都按它找 |
| `events.event_subtype` | `<marketRegion>_STOCK_DAILY_UPDOWN_SPOT` | |
| `events.base_price` / `price_label` | `basePrice` | 每 3 分钟跟一次（未结算前） |
| `start_date` / `end_date` | `tradingStart` / `lockTime` | |
| `lifecycle_status` | 按开盘时间算：开盘前 `EXTENDED_TRADING`、盘中 `TRADING`、收盘前 5 分钟起 `FROZEN` | 美 / 港 09:30、韩 09:00（当地） |
| 选项 | `Up` / `Not Up` | 起始价 `markets[0].lastTradePrice` |
| `metadata.mainnet_id` | `eventId` | |

**已知差异（不在这批）**

- Lovable 不同页面的「现在价」各自生成：首页小图、Finance 品类页、`/spot` 页头不是同一个数。结算跟首页小图走。要统一需要另开一轮。
- 主网韩股 / 港股盘子很薄，`lastTradePrice` 会出现 `Up 3¢ / 97¢`，Lovable 照搬起始价，之后由演示引擎慢慢动。
