# 首页 All 视图改版（Hero · Sports · Crypto · Stocks · Editor's Desk · More）— 交付说明 v1

> **研发交付用的唯一总文档。** 范围：Lite 首页 `/`（= `/events`，`sector = all`）桌面 1440 与手机 390 两套形态；品类视图（Intraday / Sports / Crypto / Finance）、Watchlist、Calendar、Boost 网格**一像素不动**。
> 决策：Liya（CPO）2026-11-05 起在 Design 画布逐模块定稿，2026-11-09 15:32 批「都批了」= 规则清单 + 手机版画板一起批准。规则原文 = `src/components/lite/home/homeAllRules.ts`（代码、字典台账 HA-R、本文 §2 同一份）。
> 状态：Lovable 已实装（桌面 + 手机）。Lovable 没有行情 tick 源，Crypto 图表与 Stocks 走势是按事件 id 播种的确定性模拟（§5 写了真平台换成什么）。

## 0. 读者须知

查什么去哪儿：
- 长什么样 → 生产页 `/`（桌面 + 手机）为准。Design 画布「规则稿 + 手机版（可批）」页是 2026-11-09 批准时的原图；11-10 验收后又改了一批（价钮带队伍短码、平盘灰色、价格写法等，见 §9），画布上没有，**和画布不一样的地方以生产页 + 字典 + §2 为准**
- 什么时候变成什么样 → `/style-guide` → Lite → **Events 列表** 节点 → 顶部小节「首页 All 视图 · 状态字典（HA-1 … HA-22，含 HA-7b / HA-7c / HA-10b 等带字母的补充帧，+ HA-R）」
- 规则编号（H / S / C / K / E / M / G / MB）→ 本文 §2 或字典 HA-R，和组件注释里的编号一致
- 字段、接口 → 本文 §4 §5
- 设计法则 → `DESIGN.md` §Addendum 2026-11-09 · 首页 All 视图 + §Addendum 2026-11-10 · 首页 All 视图 · 验收后补
提问前先按上面顺序查一遍；查不到再提，提问时写明"我查了 X 没有"。

## 0.1 字典怎么看

1. 打开 `/style-guide`，左栏 Lite 组点 **Events 列表**，第一个小节就是首页 All 视图。
2. 七组样张：HA-1 Hero · HA-2…5 Sports 四态 · HA-6/7 Crypto · HA-8…10 Stocks 三种时刻 · HA-11/12 Editor's Desk · HA-13 More 四种事件 · HA-14 整页 · HA-15 游客点播放 · HA-16 队徽四种画法 · HA-17 日历条选中某天 · HA-18a/b/c Crypto 15m / 4h / 1D · HA-19 历史不足 8 轮 · HA-20 Desk 两条 pick + 普通二元 · HA-21a/b/c 状态④能设提醒 / 已设 / 游客点了登录 · HA-22 首屏骨架。每组上面桌面 1280 帧、下面手机 375 帧；**手机帧是组件自己的手机形态**（和 M-* 画板一样），不是桌面压扁。
3. 每张样张 = 编号 + 状态名 + iframe 里的生产组件；下面的表固定「状态 / 触发条件 / 视觉 / 数据来源」，触发条件就是判定表达式，数据来源栏写着对应的规则编号。
4. 样张跑在冻结时钟上（`FROZEN_NOW`），倒计时不走、图表只画一帧；Stocks 三张用的是各自市场的冻结时刻（盘中 / 盘后 / 收盘无成交）。
5. 单张查看：`/style-guide/preview?c=home-ha6`（key = `home-ha` + 编号）；加 `&lang=zh-CN`（`zh-TW` / `ja` / `ko` / `ru` / `vi`）看该语言。
6. 页头左上 ⇤ 按钮收起左侧目录，样张占满整宽（目录挤着时有的标签会被压成省略号，那不是规格）。

只在字典里看得到的态：Sports 状态①（10 场 live、3 路直播切换）和状态③④、Stocks「收盘后没成交」（HA-10）、More 的互斥多档 + 长标题（HA-13）——演示库某一时刻通常只有其中一种。Crypto 平盘（HA-7b，现价正好等于开盘价）和「Settling…」（HA-7c，一轮到点、下一轮还没进来的那几秒）在生产页上一闪而过，按字典看。

## 通俗导读

**一分钟看懂**：首页从「几张卡片 + 一个目录网格」改成五段大字问句：**Who wins the match?**（Sports）→ **Will the price go up?**（Crypto）→ **Will it finish higher than it opened?**（Stocks）→ **What's worth watching?**（Editor's Desk）→ **Will it happen?**（长期事件）。每段 = 眉行 + 48px 问句 + 主块裸放 / 副块进面板，段与段之间一根细线。手机是单列重排，不是桌面缩小。

**一条故事线**（用户周五晚打开首页）：① Hero 一句话「Prediction markets, with leverage.」；② Sports 段左边正在打的 Spirit vs MOUZ 放着一张直播截图和橙色播放钮「Watch live」（点了才进交易页播放），比分 1 – 0，两个价钮；下面四块「Up next」瓷砖，右边一张表「Big this week」3 行 + 「Next up」；③ 往下 Crypto 段一个大钟「This round closes in 02:44」，BTC 的 5 分钟轮在画图，Up 84¢ / Down 16¢；④ Stocks 段美股还没开盘，每只股票一条淡线，底下「Market opens in 9h 22m」；⑤ Editor's Desk 三条运营挑的；⑥ More 段一行一个长期事件，Anthropic 估值四档各一条 Yes/No 比例条。任何价钮 / 行 / 舞台位点一下都进交易页。

**易混点**：
- 不是「Boost 是一个品类」——它是筛选，挪到右边和 Watchlist / Calendar 一组；点了还是原来的 Boost 网格（H4 / H5）。
- 不是「首页能播放视频」——舞台位只放一张静态截图 + 播放钮，点播放进交易页才开播，游客先登录（S2 / S3）。
- 不是「Stocks 收盘后画一条平线」——港股 / 韩股收盘后没成交就不画图，价格旁写 **Base price**（K4 ③）。
- 不是「Editor's Desk 永远在」——运营没配就整段不出现（E2）。

## 1. 页面结构（自上而下）

| 段 | 出现条件 | 组件 | 字典 |
|---|---|---|---|
| 顶栏 · 行情 tape | 不变 | `HomeTape` | EV-33 |
| Hero | 永远 | `HomeHero` | HA-1 |
| chip 行（Boost 在右组） | 永远 | `LiteEventsFilterRow` / `MobileCategoryRow` | EV-2 |
| Quick Play 横幅 | All 视图 | `ArcadeEntryBanner`（不变） | Arcade 字典 |
| §1 Sports | 有体育场次 | `HomeSportsSection` | HA-2 … HA-5 |
| §2 Crypto | 有活轮 | `HomeCryptoSection` + `RoundCanvas` | HA-6 / HA-7 |
| §3 Stocks | 有股票日轮 | `HomeStocksSection` | HA-8 … HA-10 |
| §3b Editor's Desk | picks ≥ 1 | `HomeDeskSection` | HA-11 / HA-12 |
| §4 More markets | 有长期事件 | `HomeMoreSection` | HA-13 |
| 五段的组合 | — | `HomeStage`（`.hall` / `.hall-m`） | HA-14 |

某段无数据就整段不出，上下段之间的细线跟着少一根。Watchlist / Boost / 品类视图仍走原来的卡片网格（`LiteEventCard`），本次未动。

## 2. 规则清单（批准版 · 由 `src/components/lite/home/homeAllRules.ts` 生成，与字典台账 HA-R 同一份；改规则只改那个文件再重新生成本节）

### H · 页头 · Hero · chip 行
- **H1** 顶栏 / 行情条不动。行情条走真数据，跑马灯连续左移。
- **H2** Hero = 1440×260 全宽横幅：设计师的猞猁键盘插画做整条底图（/assets/desktop/hero-band@2x.png 2880×520，右对齐、撑满高度），上压左浅右深暗色渐变。
- **H3** Hero 文案：H1 两行 56px「Prediction markets, / with leverage.」（第二行柠檬色），副标 15px「Think you know what happens next? Pick a topic, tap Yes or No.」，LIVE MARKETS 小标签。i18n key：home_hero.heading_v2 / sub_v2 / sub_v2_mobile。
- **H4** chip 行左边 = 品类：All / Intraday / Sports / Crypto / Finance…；右边 = 视图开关：⚡ Boost / ☆ Watchlist / ▦ Calendar。Boost 是筛选不是品类。
- **H5** Boost 行为不变（boostOnly）：点了换成只列能 Boost 事件的卡片网格、按品类分组，All 的排版不参与。
- **H6** Quick Play 横幅照生产组件（ArcadeEntryBanner，桌面 AB-1 / 手机 AB-2），不另画。

### S · Sports 段
- **S0** 细则以「Sports 规则稿 v2」为准：左 Live 模块 + 右一张表（Big this week 3 行 + Next up 填满）、四态、T3 瓷砖、日历条、一场只出现一次（舞台位 > 瓷砖 > Big this week > Next up）、直播标记一律橙色。段头眉行用 Sports 段色红 #F87171（眉行是段名，不是直播标记）。
- **S1** 队标通用规则：所有队标都在同一个圆里。真队徽（透明底）contain 74% 不裁；数据源的纯色占位方块不放原图，改画同色圆徽 + 白色短码；完全没图或图加载失败 = 灰底 + 短码。两队并排：第二枚 −1px 贴着第一枚 + 2px 底色描边，第一枚的短码不能被盖住（2026-11-10 由 −5px 改，原来 CLE 被盖成 CLI）。队徽地址 / 方块颜色来自赛事数据（metadata.home_logo / home_tile，2026-11-09 起 Lovable 从主网同步）。（字典 HA-16；Sports 品类页同规则见 EV-47）
- **S2** 舞台位不拉流（CPO 2026-11-09「点了才播」）：画面 = 一张静态图 + 橙色播放钮「Watch live」。点画面 = 播放：已登录 → 进该场交易页静音开播；游客 → 站内登录框（桌面弹窗 / 手机抽屉），登录成功后直接进该场交易页开播（含 Google 跳转回来），关掉登录框留在原页。比分、队名、价钮、Open match 照旧直接进交易页，不弹登录、不开播。Sports 品类页顶部舞台同此规则。交易页对游客不拉流，画面位放「Sign in to watch live」+ Sign in（登录后就地开播）。价钮 / Open match 进交易页之后按交易页自己的规则：已登录静音开播、游客显示「Sign in to watch live」（交易页 S10）；链接里的 &play=1 只是来源标记，交易页不读它。（字典 HA-15 / Sports 列表 EV-36 / 交易页 S10）
- **S3** 静态图按顺序取：① 直播截图——服务端对每路正在直播的流每 10 分钟截一帧，同一时段所有用户看同一张（字段 metadata.stream_thumb_url / stream_thumb_at）；② 还没截到 / 截图失败 → 这场赛事的封面图（events.image_url）；③ 封面也没有 → 深色底。三档都压暗、左上橙底 LIVE、不放队徽（下方比分行已有两队）。任何一档图片加载失败（前端 onError）就按下一档兜底。stream_thumb_at 前端不读：直播断了由服务端清掉 stream_thumb_url。（字典 EV-38 封面兜底 / EV-39 深色兜底）
- **S4** 舞台位状态④（没有比赛在打、本周最大一场上舞台）的链接（CPO 2026-11-09 批）：这场有直播、还没开赛、48 小时内开赛 →「☆ Remind me」，点了设提醒、变橙色「★ Reminder set」，再点取消；和 Sports 品类页直播预告排是同一条提醒（同一张表 stream_reminders，开赛时发一条通知，字典 EV-43 / EV-45）。游客点 → 站内登录框（桌面弹窗 / 手机抽屉），登录后不自动设，再点一次才设上。其他情况（没直播 / 超过 48 小时）→「Open match →」进交易页。（字典 HA-5 / HA-21a / HA-21b / HA-21c）

### C · Crypto 段
- **C1** 眉行「● Crypto · Up or Down · new round every 5 min」，后半句跟周期 tab：15 min / hour / 4 hours / day。首页 Crypto 段进来默认 5m，周期单独记、切过后在首页内保持；Intraday 品类页不受影响、维持原样（桌面 5m、手机 15m）（2026-11-10 批，字典 HA-6）。
- **C2** 段头右侧：倒计时「This round closes in MM:SS」（≥ 1 小时写「H:MM:SS」，如 4h / 1D 轮的「1:31:12」）28px + 220px 进度条，竖线隔开周期 tab 5m / 15m / 1h / 4h / 1D。三个币共用这一个钟。一轮已到点、下一轮还没进来的那几秒：前缀「This round closes in」隐藏，时间位写「Settling…」，不停在 00:00；同时 BTC 副句去掉「if it closed now」（如「below the open · Down wins」），ETH / SOL 的「closes HH:MM」也写「Settling…」；下一轮到了自动恢复（2026-11-10 批，字典 HA-7c）。
- **C3** BTC 主卡（8 栏裸放）：₿ BTC · Round HH:MM → HH:MM · 本轮成交 · 右上 Traded today；价格 84px；涨跌行「+$x · +x.xx%」+「above/below the open · Up/Down wins if it closed now」。不展示 open 价、不展示单轮成交量明细。「Traded today」= BTC 今天（UTC 0 点起）所有周期、所有轮次的成交额之和；「本轮成交」= 当前周期当前这一轮的成交额。平盘（现价正好等于开盘价）：后端规则是收盘 > 开盘才算 Up，所以平盘写灰色「$0 · 0.00%」不带符号 +「at the open · Down wins if it closed now」，ETH / SOL 的 0.00% 同样灰色无符号（2026-11-10 批，字典 HA-7b）。价格写法：≥ $10,000 取整（$74,063），以下两位小数（$2,137.09 / $86.97），一律千分位；图上 OPEN 标签同规则。
- **C4** BTC 图表 = V1 双色面 + 紧量程，动效借 Quick Play 舞台：canvas；时间窗 = 过去 72% 轮长 + 未来 28%，整条线随时间左移；NOW 竖虚线，未来区淡色；收盘线进入窗口才出现（橙，带 closes HH:MM）；开盘虚线横贯，OPEN $ 标签最上层带底色；高于开盘青色面、低于开盘柠檬面；开盘前历史画灰细线不算输赢；量程只看本轮——但开盘后最初 15% 的时间里，本轮还几乎没有走势，量程把窗口里开盘前的灰线也算进去，随时间平滑收回到只看本轮；超出量程的灰线断开不画，不再拉成竖条（2026-11-10 批）；头点跟最新价缓动 + 呼吸环；密点按 3px 一桶平均；时间刻度 5m 每分钟 / 15m 3 分 / 1h 10 分 / 4h 1 小时 / 1D 3 小时。
- **C5** Up / Down 大钮 + 资金比例条（Up 青 / Down 柠檬）+ 两头百分比。比例 = 本轮 Up / Down 两边下单金额的占比（正式版接资金数据；Lovable 没有资金池，用 Up 价格代替）。
- **C6** Last 8 rounds：8 根小柱按结果上色（Up 青 / Down 柠檬），最新一根描边；右侧「Up won N · Down won N · last round Up/Down」。不写上一轮涨跌金额。一轮都还没结算过时只画空柱、不写右侧这句（否则会写成「last round Down」，2026-11-10 修）。
- **C7** 右栏面板 ETH / SOL 两半等高：币 + 价格 + 涨跌 + closes HH:MM；小图同 C4 画法缩小（80px 高，带 OPEN 标签）；Up / Down 小钮 + 细比例条。
- **C8** 到点结算：当前轮结束 → Last 8 推入结果 → 新一轮 open = 上轮收盘价，钟和进度条重置。

### K · Stocks 段
- **K1** 眉行「Stocks · Daily close · N markets today」（N = 各市场可交易总数），问句「Will it finish higher than it opened?」。
- **K2** 段头右侧：市场 tab 单行 US / Hong Kong / Korea（有数据才出，以后加 CN 就多一个），数量跟在名字后；下面一行状态：盘中「Market open · closes in X」、非盘中「Market opens in X」，后接「settles in Y」（Y = 下一个还没到的结算时间 = 官方收盘 + 15 分钟，与主网同步 §7 第 3 条一致；首页和现货页「Settles」都读 `expected_settlement_time`，这个字段为空时都按收盘 + 15 分钟算（CPO 2026-11-10），所以盘中「closes in」和「settles in」差 15 分钟）；这一轮结算时间已过、引擎还没滚到下一轮时写「settling now」，不写「settles in 0s」。默认选中 US；US 没有数据时选下一个有数据的市场。
- **K3** 清单：按本轮成交量取前 10（成交量相同按接口顺序），两列各 5，中间一根分隔线；每行 = 图标 26 · 代码 + 短名（不截断，太长折成两行，如 Samsung Electro-Mechanics）· 走势小图 96×28 · 价格 + 相对 Base 涨跌（定宽 112px、右对齐，放得下最长的韩股价 ₩1,134,988——韩元不带小数；各行小图和价格因此上下对齐，不随价格位数左右漂）· Up / Down 定宽 88px 钮。不展示每行成交量。手机只取前 5、每只两行。
- **K4** 走势小图三种时刻：① 盘中 = 从今天开盘起的 1 分钟收盘价实线（盘前那段不画）；② 收盘后还在成交（美股盘后 / 夜盘）= 同色淡一半细线，从这次收盘起画；③ 收盘后还没成交（港股 16:00 / 韩股 15:30 之后）= 不画走势线，只有基准虚线 + 末端空心点，价格 = Base，旁边写「Base price」（不是 at close）。基准虚线永远 = 上次官方收盘价 = 这轮 Base。连续相同价只留一个点，抽样 ≤ 48 点。
- **K5** 小图颜色：涨 #4ADE80 / 跌 #F87171（股票沿用绿涨红跌），基准虚线橙。平盘（现价 = Base）涨跌位灰色「0.00%」不带 + 号——平盘结算 Down（2026-11-10 批）。价格两位小数 + 千分位（$1,034.20），韩元整数（股票价没有 ≥ $10,000 取整这一条，那条只管加密价）。平盘时走势小图也画灰色（2026-11-10 修，原来画绿色）。
- **K6** 底部：左「N of M trading above their base price right now」，M = 当前列出的行里已经有成交价的行数（一般是 10，手机 5）；一行都没成交时这句不显示；右「Show all N →」只在该市场只数多于屏上行数时出现（10 只全在屏上就不出），点了进 Finance 品类页并预选当前页签的市场（US / Hong Kong / Korea）（2026-11-10 批）。不写数据来源、不重复结算时间。

### E · Editor's Desk
- **E1** 独立一段，放 Stocks 与 More 之间；眉行「✦ Editor's Desk · N picks」（柠檬色），问句「What's worth watching?」；段头右侧不写署名 / 更新时间。
- **E2** 数据 = 运营后台 featured-markets（≤ 3 个，每个带 whyThis）；没配时整段不出现（和线上一致）。
- **E3** 三列等高、无分割线、靠 56px 间距和 01 / 02 / 03 大号灰字分开；每列 = 编号 + 眉行「品类 · 时间」、标题（≤ 2 行）、引号里的 whyThis（≤ 3 行，超出省略）、下单钮贴底对齐（统一 36px 高）。
- **E4** 下单钮跟事件类型走：涨跌轮 = Up / Down；比赛 = 两队名 + 价；多档 = 两档胶囊 + 「+N more」，两档取价格最高的两个结果、价高在前（不是数据源的前两个；2026-11-10 批）。普通二元（Yes / No）= Yes n¢ / No n¢。三项足球赛的 pick 只放两队（主 = 第一个选项、客 = 最后一个），平局在交易页里买。多档和三项赛的每个胶囊 = 买那一档 / 那支队的 Yes（链接 `option=<那一档>&side=yes`），不是「No on 那一档」；只有两个选项的比赛，客队钮仍是 `side=no`（2026-11-10 修：原来多档第二个胶囊打开的是 No）。

### M · More 段（长期事件）
- **M1** 眉行「More markets · N open」，问句「Will it happen?」48px（和其他段同号）；段头右侧不放列表入口、不写说明句。长期事件少，全部直接往下铺，一行一个事件。
- **M2** 每行左 = 封面 120×72 + 眉行「品类 · N markets · Boost n×」+ 标题（桌面 ≤ 3 行，2026-11-10 由 2 行放宽；手机不截断）+「Vol $x · settles 日期」；右 520px = 档位区。
- **M3** 多档事件：每个可交易 market 一条青 / 黄绿 Yes / No 比例条（青 = Yes 占比）+ Yes n¢ / No n¢ 定宽 66px 钮，最多露 4 条、其余「+N more outcomes →」；互斥型在 bar 下加一句「Outcomes are mutually exclusive — exactly one pays $1.」。「互斥」由事件类型决定（多选一型），正式版看后端字段；Lovable 用各档价格之和≈1 判断。档位顺序 = 接口给的顺序，不重排。只有两档的事件按二元（M4）画。
- **M4** 二元事件（B1）：不画条，右边大数字「34%」+「chance of Yes」+ Yes / No 两个 110px 钮。
- **M5** 临近结算（< 48 小时）的事件眉行写「closes in Xh」；已经过了截止时间的不写（2026-11-10 修：原来写「closes in 1h」）。

### G · 全局
- **G1** 所有段头 = 眉行（品类 · 形态 · 数量/状态）+ 48px 问句，第二行结束，不要第三行说明。主块裸放、副块进面板，裸放块之间靠留白分隔、不加分割线；段与段之间一根细线——只画在真的渲染出来的段之间；某段这一刻画不出来（比如所选周期 BTC 没有当前轮），不留空线（2026-11-10 修）。
- **G2** 颜色语义：Up / Yes 青 #33D6FF，Down / No 柠檬 #CFFF4A，直播与倒计时橙 #FF8A3D，股票涨跌绿红；全站规则性文案（赢的份额付 $1 等）不在首页任何段重复。
- **G3** 首页所有价格钮点击 = 进对应事件的交易页并预选那一边（CPO 2026-11-09 批）：Sports 价钮 = 那支队的选项；Crypto / Stocks 的 Up = Yes 边、Down = No 边；Editor's Desk 的钮 = 钮上那个选项；More 多档的 Yes / No = 那一档 + 那一边，二元 = 那一边。行、瓷砖、舞台位对阵、Open match → 只进交易页、不预选。链接写法 `/trade?event=<id>&option=<选项 id>&side=yes|no`（现货事件 `/spot?…`，快轮同样走 `/trade?…&side=yes|no`，旧写法 up / down 也认）；交易页进页时读一次，选中那一档、下单区切到那一边，之后用户自己改不会被拉回；找不到这一档就照常打开、不报错。首页不下单；播放规则见 S2。
- **G4** 手机版按手机习惯重做，不平铺桌面（见 MB 组）。
- **G5** 实装顺序：本清单批 → 手机版画板批 → 直写 Lovable（桌面 + 手机）→ style-guide 每模块每状态一帧 + 四栏表 + fixture 开关 → 交付文档 + 验收表 → 主网逐条验收 + 设计师视觉验收。

### R · 研发口径（2026-11-09 终验冷读补）
- **R1** 「this week」= 从查看者本地今天 0 点起 7 天。眉行「N matches this week」= 正在打的 + 还没开赛的（已经打完、等结算的不算，CPO 2026-11-10）；日历条「ALL n」和每天的数字 = 还没开赛的（日历条只筛右表）。有比赛在打时两个数不相等，差值 = 正在打的场数。
- **R2** 「+N more this week」= 所有还没开赛的场次 − 本段已经展示的场次，跟日历条当前选哪天无关。选了某一天：右表标题写「Big on Fri 7 · by volume」（星期 + 日号，同日历条顺序），选的是今天（日历条写 TODAY）则写「Big today · by volume」；那天的比赛已经全部列出（Big + Next up 放得下那天剩下的所有场次），面板底写「No more matches on Fri 7 · see all →」（今天写「No more matches today」），see all 进 Sports 品类页；手机同样显示（手机右表只有 Big 3 行，那天超过 3 场就不显示）（2026-11-10 批，字典 HA-17）。
- **R3** 舞台位有多路直播时，默认放成交额最大的一路（相同按开赛早者），‹ › 切换；同 Sports 品类页 EV-37。
- **R4** Sports 价钮：左钮 = 第一个选项（主队）、右钮 = 最后一个选项（客队），钮上写短名；右表和瓷砖里的小价钮同样先写那支队的短码（灰色）再写价格，如「NOT 46¢」（CPO 2026-11-10，原来只写「46¢」看不出是哪队）；价钮定宽（桌面右表 80px、手机 64px、瓷砖两钮等分），所有行上下对齐；短码太长时只截短码（省略号），价格永远完整；三项足球赛首页不放平局钮（品类页和交易页有）。
- **R5** 倒计时写法：≥ 1 小时「9h 05m」，< 1 小时「22m」，< 1 分钟「45s」；超过 24 小时也写小时（「62h 05m」），不换算成天——首页舞台标签「kicks off in」和眉行「next kickoff in」同样（2026-11-10 修：原来写「1d 2h」）。交易页和 Sports 品类页的开赛倒计时是另一套写法（`kickoffInShort`，见 copy-dictionary「Sports 交易时间」），本次不动。More 的「closes in Xh」四舍五入、最少写 1h。
- **R6** 加载与出错：首屏数据回来前显示首页骨架——五段（Sports / Crypto / Stocks / Editor's Desk / More）各按最终尺寸占位，数据回来不跳（CPO 2026-11-09 批，字典 HA-22 / EV-24）；之后每段数据回来才出现，接口报错与没数据一样整段不出、不显示错误；BTC 当前没有轮次时 Crypto 整段不出；Last 8 不足 8 轮时有几根画几根，右侧计数按实际；五段都没有时首页只剩 Hero、chip 行、Quick Play 横幅。
- **R7** 断点：宽度 < 768 用手机版（MB 组），≥ 768 用桌面版；桌面内容区最宽 1280（容器 max-w-7xl）。768–1279 仍是桌面版，但两处换排法（2026-11-10 交叉验收）：Stocks 两列 → 一列 10 行；More 每行的档位区挪到标题下面（不再并排，最宽 640）。其余各列按网格比例收缩。
- **R8** 文案语言（CPO 2026-11-09 批）：首页五段和 Sports 品类页一样 7 语（英 / 简中 / 繁中 / 日 / 韩 / 俄 / 越），key 前缀 events.screen.simple.home_all.*（Lovable 2026-11-09 新增，要回写平台 i18n 表；Yes / No / Up / Down / Vol / Remind me 等复用已有 key）。星期、日期跟用户语言，时间一律 24 小时制；倒计时单位 h / m / s 不翻（同 Sports 品类页）；赛事名、队名、联赛名、事件标题、品类名、运营推荐语是内容数据，不翻。Hero 见 H3（英 / 简中 / 繁中，其他语言回落英文）。字典单帧加 &lang=zh-CN 等可看各语言。各语言下装文字的小格子（日期条格、价钮、Yes / No 钮、手机 Up / Down 钮）都按内容变宽（最小宽度不变），俄语 / 越南语的全大写小标签收窄字距；改布局要 7 语逐个看过（2026-11-10 多语言验收）。
- **R9** 常年只写在代码里的小规则（2026-11-10 冷读补成文）：① 舞台左上标签太长时只缩联赛名，比赛时钟（MAP 1 · 12:04 / Q3 5:12）永远显示；② 瓷砖区既有「Also live」又补了未开赛的，未开赛那部分小标题写「Up next · HH:mm / HH:mm」（各自开赛时间）；③ 瓷砖一律写星期几（TUE），舞台写 Today / Tomorrow；④ 手机舞台标签不带联赛名；手机 Crypto 右上写「Today $2.2M」、不写「this round」；⑤ Last 8 的柱高是固定装饰（14/9/18/6/12/20/8/15），只有颜色表示涨跌，不是数据。

### MB · 手机版（390）
- **MB1** Hero 按设计师手机稿（Figma 203-91044 / 203:91054）：居中两行 26px 标题 → 一句副标「Pick a topic, tap Yes or No.」→ 358×89 插画条（/assets/mobile/hero-band@3x.png，设计师稿整块导出：面板底 + 插画，3×，紧贴副标下方）；不放 LIVE MARKETS 标签。
- **MB2** 品类 chip 一行横滑；Quick Play 用生产手机横幅 AB-2。
- **MB3** Sports：日历条横滑 → 舞台位（直播预览 / 对阵 + 比分 / 最大场倒计时）→ 2 列瓷砖 → 面板只留 Big this week 3 行 → 底部「+N more this week ｜ All N matches →」（这个 N = 眉行的 N：正在打的 + 还没开赛的，所以有比赛在打时比日历条 ALL 多出正在打的场数）。不列 Next up。手机行第一行写两队短码 + 成交额，短码太长时只截短码、成交额不截（2026-11-10）。有直播标记的 live 瓷砖去掉联赛名，保住「▶ Stream」。
- **MB4** Crypto：钟 + 进度条整行、周期 tab 一行 → BTC 卡（价 48px、图 150 高、同 C4 画法）→「BTC · last 8」紧贴图表下方、在 Up / Down 钮之前 → 资金比例条 → ETH / SOL 两张半卡并排（图 64 高）。
- **MB5** Stocks：市场 tab + 一行状态 → 只取前 5，每只两行（上：代码 + 短名（同 K3）/ 价 + 涨跌；下：走势图 120×26 + Up / Down 78px 钮）→ 底注「N of 5 above their base price · Show all N →」。
- **MB6** Editor's Desk 三条竖叠（编号 + 眉行 / 标题 / 引言 / 钮）；More = 封面 + 标题一行，多档事件每档名字独占一行、下面 bar + Yes / No 58px 钮，二元事件 = 大数字 + 两钮整行。
## 3. 四态与判定（Sports）

| 状态 | 判定 | 舞台位 | 瓷砖 | 右表 / 手机面板 |
|---|---|---|---|---|
| ① 多场 live、多路直播 | `live.filter(streamUrl).length > 1` | 成交额最大的一路直播截图 + ‹ Stream i / N ›（R3）| Also live ≤ 4（▶ Stream 标）+ See all N live → | Big 3 + Next up 填满 / Big 3 |
| ② 1 场 live 有直播 | `streams.length === 1` | 直播截图 + 播放钮（S2 / S3）| Up next 4 | 同上 |
| ③ live 都没直播 | `live.length > 0 && streams.length === 0` | 无视频面，对阵 + 比分 | Also live N + Up next 补到 4 | 同上 |
| ④ 0 live | `live.length === 0` | 本周最大场（成交额）+ 开球倒计时 + 有直播且 48h 内开赛 → ☆ Remind me，否则 Open match →（S4）| Up next 4 | 同上 |

`live` = `liveAt(m, now)`（每秒重算）；`upcoming` 按开球升序；Big this week = 剩余池按成交额前 3；Next up = 剩余池按开球；日历条只筛右表。

「Next up 填满」= 让右表和左栏一样高，按舞台位形态定行数：有视频面 8 行（再出「See all N live」整行钮时 9 行）；有 live 但没视频面 5 行；0 live 4 行。手机不列 Next up（MB3）。舞台位画面块只在这场**有直播源**时出现，内容是静态截图 + 播放钮（S2 / S3，首页不拉流）；live 但没有直播源的场次没有画面块，直接对阵 + 比分（状态③）。

## 4. 字段来源（Lovable）

| 段 | hook / 表 | 字段 |
|---|---|---|
| Sports | `useSportsMatches()` → `events` + `metadata` | `kickoff_at / live / score / liveLabel / stream_url / volume / options[].price / home_abbr / away_abbr`；队徽 `home_logo / away_logo / home_tile / away_tile`（S1）；live 位文字 `status_label`；直播截图 `stream_thumb_url / stream_thumb_at`（S3） |
| Crypto | `useQuickRounds()`（`CRYPTO_QUICK_UPDOWN_SPOT`） | `base_price`（open）/ `start_date` / `end_date` / `volume` / `event_options[].price`；`historyFor` = 已结算轮 `is_winner` |
| Crypto 现价 | `useArcadeLivePrices()`（Quick Play 流） | 用来把图表头锚到行情条同一个数 |
| Stocks | `useIntradayStocks()`（US / HK / KR 日轮） | `base_price` / `end_date` / `event_subtype` / `upPrice` / `downPrice`；盘别 `getStockSessionState(market, now)` |
| Editor's Desk | `useEditorPicks()`（`metadata.editorial.pick = true`） | `note`（whyThis）/ `rank` / `category` / `end_date`（新增进 select）/ `side_labels` / `event_options` |
| More | `useMarketListData()` 过滤 | 非 `SPORTS_MATCH`、非日轮 / 快轮、非 `ARCADE_UPDOWN_SPOT`（Quick Play 轮不进目录）；`children[]`（档位）/ `totalVolume` / `expiry` / `imageUrl` |
| Boost n× | `useCategoryBoostConfigs()` | `enabled && maxBoost ≥ 2` |

## 5. 真平台对接（后端 / 数据边界）

| Lovable 里的模拟 | 正式版换成 | 备注 |
|---|---|---|
| Crypto 价格路径 `roundSeries()`（按事件 id 播种的随机游走） | `/pub/event/crypto/rounds/current?interval=5m…1d` 的 `underlyingTrendPoints`（5s）+ `underlying.open / current` + `recentResults` | 画法 `RoundCanvas` 不变；5m 接口一币两轮（当前 + 下一轮），取 `startTime` 最早的一轮 |
| Stocks 走势 `printsFor()`（确定性游走）| `/pub/event/underlying/bars?assetCode=X&range=SINCE_CLOSE`（1 分钟收盘价） | 有 bars → 实线 / 淡线；bars 为空 → 「Base price」；美股盘后有 bars、港韩收盘后没有 |
| 市场列表 / 结算时间 | `/pub/event/daily-close/rounds/current`（`availableTotal` / `currentSessionCloseAt`）| tab 数量 = `availableTotal` |
| Traded today | BTC 今天（UTC 0 点起）开始的所有周期、所有轮次的 `volume` 之和（`useQuickRounds().btcTodayVolume`，已结算的也算；Lovable 只回看最近 300 个已结算轮，深夜会少算一点） | 正式版取 `tradedTodayU`，**只算 BTC**（C3）；2026-11-10 前 Lovable 错算成三个币当前轮之和，已改 |
| 资金比例条（C5） | 用 Up 价格代替 | 正式版要新增：本轮 Up / Down 两边下单金额（`upStakeU` / `downStakeU` 或同义字段），比例 = 一边 ÷ 两边之和 |
| Stocks「settles in」/ 现货页「Settles」 | 结算时间读事件的 `expected_settlement_time`（= 官方收盘 + 15 分钟）；字段为空时按收盘时间 + 15 分钟算（K2，2026-11-10） | 首页和现货页读同一个字段、同一个兜底；正式版接口给的计划结算时间直接用 |
| Crypto「this round $x」 | 本轮真实成交额 | Lovable 演示快轮没人下单，每分钟一次的演示任务 `sim_quick_round_volume_tick` 给开着的快轮加模拟成交额（见 `backend-boundary.md`），正式版不需要 |
| 股票事件名 | 主网事件名 | Lovable 同步模板写 `Apple (AAPL) — will it close higher today?`（2026-11-10 起新开的轮次）；首页短名从事件名括号前取（K3） |
| Editor's Desk | `/pub/event/featured-markets`（`whyThis / imageUrl / category / event`） | ≤ 3，空则整段不出 |
| 直播截图（S3 ①） | **要新增**：直播服务对每路正在直播的流每 10 分钟截一帧存 CDN，赛事数据给 `metadata.stream_thumb_url`（图片地址）+ `stream_thumb_at`（截图时间）；所有用户共用同一张，用户端不碰直播流 | Lovable 没有截图服务：演示比赛都用同一路演示直播，`public/assets/streams/demo-01…11.jpg` 是从这路直播里截好的静帧，前端按「现在落在哪个 10 分钟格」挑图，效果同主网（`streamPicture.ts`）。没截图用 `events.image_url` 封面，再没有用深色底 |
| 直播只对已登录开放（S2） | 主网直播接口对游客不返回播放地址（或返回 401） | Lovable 前端判断：游客不请求流，交易页显示 Sign in to watch live |
| 队徽（S1） | 队伍资料给真队徽 URL + 占位方块的颜色 `tileColor`（这些图没有 CORS 头，前端取不到颜色，必须后端给） | Lovable 2026-11-09 起从主网同步队徽（`metadata.home_logo`），方块颜色一次性取色存在 `mn_logo_tiles`（`metadata.home_tile`），见 `mainnet-catalog-sync-v1.md` |

## 6. 验收表（Liya / 测试）

| # | 打开 | 应该看到 | 看什么 |
|---|---|---|---|
| 1 | `/` 桌面 1440 | Hero 整条横幅 + 两行标题；chip 行 Boost 在右边三个开关里 | 底图不糊、文案与 H3 一致、Boost 点开仍是网格 |
| 2 | `/` 往下 Sports 段 | 左舞台位 + 2×2 瓷砖，右面板 Big 3 + Next up；日历条在段头右 | 一场不重复；有直播时舞台位是截图 + 播放钮、首页不拉流；点播放进交易页开播（游客先登录） |
| 3 | Crypto 段 | 段头右钟 + 5 个 tab；BTC 84px 价、canvas 图在动；ETH / SOL 面板 | 切 tab 眉行文案变；OPEN 标签压在线上；Last 8 柱色 |
| 4 | Stocks 段 | US / Hong Kong / Korea tab + 一行状态；1280 以上 10 行两列，768–1279 一列 10 行；底注 | 美股盘中实线 / 盘后淡线；港股收盘后无图 + Base price |
| 5 | Editor's Desk / More | 三列等高；More 一行一个事件，多档条 + 二元大数字 | picks 没配时整段消失；Quick Play 30s / 1m 轮不在 More 里 |
| 6 | 手机 390 `/` | Hero 居中稿；Sports 单列无 Next up；Stocks 5 行两行式；BTC · last 8 在图下 | 没有省略号截断、没有横向滚动 |
| 7 | `/style-guide` → Events 列表 → 首页 All 视图 | HA-1…22 桌面 + 375 两帧；HA-R 台账 | 四栏表每行能对到规则编号 |
| 8 | 首页任一价钮（Sports 队 / Crypto Down / Stocks Down / More 某档 No） | 进交易页，下单区已是点的那一边、那一档 | 链接带 `&option=` / `&side=`（G3）；行 / 瓷砖 / Open match 不预选 |
| 9 | 右上语言切到 简中 / 日 / 俄 | 五段眉行、问句、按钮、底注都换语言 | 星期跟语言、时间 24 小时；队名 / 事件名不翻（R8）；手机没有横向滚动 |
| 10 | 首次打开（清缓存，慢网） | 五段骨架按最终尺寸占位，数据来了不跳 | HA-22 |
| 11 | Sports 右表 / 瓷砖的小价钮（桌面 + 手机，切俄语 / 越南语） | 先灰色队伍短码再价格，如 `MIA 61¢`；两颗钮上下对成一列 | 定宽桌面 80 / 手机 64 / 瓷砖两颗平分；短码太长只截短码、价格和成交额不截（R4） |
| 12 | 现货页 `/spot?event=<美股日轮>`（Lite） | 时间轴 `Closes 15:55` → `Settles 16:15`（美东） | Settles = 收盘 + 15 分钟，和首页 Stocks「settles in」同一个数（K2） |

## 7. 代码坐标

- 样式：`src/components/lite/home/home-all.css`（`.hall` 桌面 / `.hall-m` 手机，字面量 = 画布 mock）
- 共用件：`homeAllShell.tsx`（SectionHead / Up / Down / Odds 钮 / TeamBadge / SportIcon）
- 五段：`HomeSportsSection.tsx` · `HomeCryptoSection.tsx` + `RoundCanvas.tsx` + `roundSeries.ts` · `HomeStocksSection.tsx` · `HomeDeskSection.tsx` · `HomeMoreSection.tsx`；组合 `HomeStage.tsx`
- 页面：`src/pages/lite/LiteEventsPage.tsx`（All 视图挂 `HomeStage`，长期事件传 `filtered`）；Hero `HomeHero.tsx`；chip 行 `LiteEventsHeader.tsx`
- 字典：`src/pages/StyleGuide/sections/HomeAllSection.tsx` + `preview/homeAllPreviews.tsx`；台账 `components/HomeRulesLedger.tsx`
- 骨架：`LiteEventsSkeletons.tsx` `LiteAllStageSkeleton` / `LiteMobileStageSkeleton`（五段首载骨架，字典 HA-22 / EV-24）
- 文案：`src/locales/<语言>.json` → `events` 命名空间 `screen.simple.home_all.*`（7 语，Lovable 2026-11-09 新增，要回写平台 i18n 表）；取词 `ht()` / 带粗体数字的句子 `rich()`（`homeAllShell.tsx`）
- 交易页预选：`tradeLink()`（`homeAllShell.tsx`）生成链接；`LiteContractTrade.tsx` / `LiteSpotTrade.tsx` / `LiteQuickTrade.tsx` 进页读一次 `option` / `side`
- 已删除：`HomeCryptoCard / HomeStocksCard / HomeSportsCard / HomeDeskCard`、目录板头 / 身份卡（`CatalogueHeaderRow / CatalogueIdentityCard / CatalogueMobileBanner`）

## 8. 终验冷读拍板记录（2026-11-09，CPO「4件事都批了」）

| # | 问题 | 定了什么 | 规则 / 字典 |
|---|---|---|---|
| 1 | 状态④舞台的「☆ Remind me」 | 有直播且 48 小时内开赛 → 真提醒（与 Sports 品类页同一条，游客先登录）；否则「Open match →」 | S4 · HA-5 / HA-21a/b/c |
| 2 | 首页价钮进交易页要不要预选 | 全部预选：点哪边进去就是哪边、哪一档 | G3 |
| 3 | 首页五段多语言 | 7 语，同 Sports 品类页 | R8 |
| 4 | 首屏骨架 | 按五段重画 | R6 · HA-22 / EV-24 |

## 9. 2026-11-10 验收后的改动（CPO 当天分三批定，生产页已上）

画布上没有这些，按生产页和字典看。规则原文已同步进 §2（编号在括号里）。

**看得见的变化**
- 平盘（现价正好等于开盘价 / 基准价）：Crypto 主卡写灰色 `$0 · 0.00%` +「at the open · Down wins if it closed now」，ETH / SOL 和股票行的 `0.00%` 灰色、不带符号——后端规则一直是「收盘高于开盘才算 Up」（C3 / K5，字典 HA-7b）。
- 一轮到点、下一轮还没进来时，钟写 `Settling…`，不停在 00:00；那几秒 BTC 副句去掉「if it closed now」，ETH / SOL 小卡也写 `Settling…`（C2，HA-7c）。
- 每轮刚开盘那一刻图上的灰线不再被拉成竖条：开盘后最初 15% 的时间量程慢慢收回到只看本轮（C4）。
- 价格写法：加密价 ≥ $10,000 取整、以下两位小数；股票价两位小数加千分位；韩元整数（C3）。首页、Crypto 品类页、Intraday、顶部行情条同一规则。
- Sports 右表和瓷砖的小价钮先写队伍短码（灰）再写价格，如 `NOT 46¢`；钮定宽（桌面 80 / 手机 64 / 瓷砖两颗平分），短码太长只截短码（R4）。
- Sports 开赛倒计时统一 `26h 00m` 写法；选了某一天：右表标题 `Big on Fri 7 · by volume`，排完写 `No more matches on Fri 7`；选的是今天就写 `Big today` / `No more matches today`（R5 / R2）。
- Sports 眉行「N matches this week」= 正在打的 + 还没开赛的，已打完待结算的不算（R1 / MB3）。
- Stocks「settles in」= 官方收盘 + 15 分钟；`Show all N →` 只在只数多于屏上行数时出现，点了进 Finance 并预选当前市场（K2 / K6）。
- Editor's Desk 多选项精选显示价格最高的两个结果，胶囊买的是那一档 / 那支队的 Yes（E4）。
- More 段标题桌面最多 3 行（M2）。
- 7 种语言下按钮、日期格、价钮按内容变宽，俄语 / 越南语的全大写小标签收窄字距（R8）。

**顺手改的（首页以外）**
- 现货页（Lite）时间轴「Settles」改显示收盘 + 15 分钟，和首页 Stocks 一致。
- Finance 选 Korea 照常列出股票轮；Finance、日历页、Intraday 舞台的股票行一律 `Up` / `Down`（原来写 `Not up`），两颗钮定宽 112px。
- `Tmrw` 一律写 `Tomorrow`。

**没动的**：结算逻辑、价格引擎、数据库选项名（库里仍是 `Not Up`，展示层改写成 Down）；港股午休与节假日按开盘处理。

明细与每批的取舍见 `docs/changelog/2026-11-10-review-decisions.md`。

