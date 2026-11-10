// ============================================================
// 首页 All 改版 · 规则清单（Liya 2026-11-09 15:32 批「都批了」= 实装唯一规格）
// 画布：Design 画布「规则稿 + 手机版（可批）」页 S3-Rules-Home + M-* 板。
// 这份清单同时喂给 /style-guide 的台账 case（HomeAllSection）和交付文档
// docs/delivery/home-all-v1.md —— 编号 = 代码注释里的编号 = 验收表里的编号。
// ============================================================
export interface HomeRule {
  id: string;
  text: string;
}
export interface HomeRuleGroup {
  code: string;
  title: string;
  status: string;
  rules: HomeRule[];
}

export const HOME_ALL_RULES: HomeRuleGroup[] = [
  {
    code: "H",
    title: "页头 · Hero · chip 行",
    status: "定稿 11-09",
    rules: [
      { id: "H1", text: "顶栏 / 行情条不动。行情条走真数据，跑马灯连续左移。" },
      { id: "H2", text: "Hero = 1440×260 全宽横幅：设计师的猞猁键盘插画做整条底图（/assets/desktop/hero-band@2x.png 2880×520，右对齐、撑满高度），上压左浅右深暗色渐变。" },
      { id: "H3", text: "Hero 文案：H1 两行 56px「Prediction markets, / with leverage.」（第二行柠檬色），副标 15px「Think you know what happens next? Pick a topic, tap Yes or No.」，LIVE MARKETS 小标签。i18n key：home_hero.heading_v2 / sub_v2 / sub_v2_mobile。" },
      { id: "H4", text: "chip 行左边 = 品类：All / Intraday / Sports / Crypto / Finance…；右边 = 视图开关：⚡ Boost / ☆ Watchlist / ▦ Calendar。Boost 是筛选不是品类。" },
      { id: "H5", text: "Boost 行为不变（boostOnly）：点了换成只列能 Boost 事件的卡片网格、按品类分组，All 的排版不参与。" },
      { id: "H6", text: "Quick Play 横幅照生产组件（ArcadeEntryBanner，桌面 AB-1 / 手机 AB-2），不另画。" },
    ],
  },
  {
    code: "S",
    title: "Sports 段",
    status: "定稿 11-07 · 补 11-09",
    rules: [
      { id: "S0", text: "细则以「Sports 规则稿 v2」为准：左 Live 模块 + 右一张表（Big this week 3 行 + Next up 填满）、四态、T3 瓷砖、日历条、一场只出现一次（舞台位 > 瓷砖 > Big this week > Next up）、直播标记一律橙色。段头眉行用 Sports 段色红 #F87171（眉行是段名，不是直播标记）。" },
      { id: "S1", text: "队标通用规则：所有队标都在同一个圆里。真队徽（透明底）contain 74% 不裁；数据源的纯色占位方块不放原图，改画同色圆徽 + 白色短码；完全没图或图加载失败 = 灰底 + 短码。两队并排：第二枚 −1px 贴着第一枚 + 2px 底色描边，第一枚的短码不能被盖住（2026-11-10 由 −5px 改，原来 CLE 被盖成 CLI）。队徽地址 / 方块颜色来自赛事数据（metadata.home_logo / home_tile，2026-11-09 起 Lovable 从主网同步）。（字典 HA-16；Sports 品类页同规则见 EV-47）" },
      { id: "S2", text: "舞台位不拉流（CPO 2026-11-09「点了才播」）：画面 = 一张静态图 + 橙色播放钮「Watch live」。点画面 = 播放：已登录 → 进该场交易页静音开播；游客 → 站内登录框（桌面弹窗 / 手机抽屉），登录成功后直接进该场交易页开播（含 Google 跳转回来），关掉登录框留在原页。比分、队名、价钮、Open match 照旧直接进交易页，不弹登录、不开播。Sports 品类页顶部舞台同此规则。交易页对游客不拉流，画面位放「Sign in to watch live」+ Sign in（登录后就地开播）。价钮 / Open match 进交易页之后按交易页自己的规则：已登录静音开播、游客显示「Sign in to watch live」（交易页 S10）；链接里的 `&play=1`：交易页读它，带它进来这一页一律按 Lite 打开（S5）。（字典 HA-15 / Sports 列表 EV-36 / 交易页 S10）" },
      { id: "S3", text: "静态图按顺序取：① 直播截图——服务端对每路正在直播的流每 10 分钟截一帧，同一时段所有用户看同一张（字段 metadata.stream_thumb_url / stream_thumb_at）；② 还没截到 / 截图失败 → 这场赛事的封面图（events.image_url）；③ 封面也没有 → 深色底。三档都压暗、左上橙底 LIVE、不放队徽（下方比分行已有两队）。任何一档图片加载失败（前端 onError）就按下一档兜底。stream_thumb_at 前端不读：直播断了由服务端清掉 stream_thumb_url。（字典 EV-38 封面兜底 / EV-39 深色兜底）" },
      { id: "S4", text: "舞台位状态④（没有比赛在打、本周最大一场上舞台）的链接（CPO 2026-11-09 批）：这场有直播、还没开赛、48 小时内开赛 →「☆ Remind me」，点了设提醒、变橙色「★ Reminder set」，再点取消；和 Sports 品类页直播预告排是同一条提醒（同一张表 stream_reminders，开赛时发一条通知，字典 EV-43 / EV-45）。游客点 → 站内登录框（桌面弹窗 / 手机抽屉），登录后不自动设，再点一次才设上。其他情况（没直播 / 超过 48 小时）→「Open match →」进交易页。（字典 HA-5 / HA-21a / HA-21b / HA-21c）" },
      { id: "S5", text: "播放钮遇到 Pro 用户（CPO 2026-11-10 批）：直播只在 Lite 交易页，Pro 终端没有直播画面。① 首页舞台、Sports 品类页舞台、手机 Sports 模块的播放钮「Watch live」进交易页（`/trade?event=<比赛>&play=1`），不管用户存的是 Lite 还是 Pro，这一页按 Lite 打开并开播；② 不改存的偏好：这一页页头开关显示 Lite，选 Pro 就去掉 `play` 回 Pro 终端，之后从别处进交易页照旧按偏好；③ 同一场的价钮、比分、Open match 进来照旧按偏好（Pro 用户进 Pro，没有直播）；④ 游客点播放先登录，登录后账户存的是 Pro 也按 ① 进 Lite 开播；⑤ 在这一页刷新仍是 Lite、仍在看直播；⑥ Pro 合约终端的赛事页：比赛正在打而且有直播源时，页头状态行末尾出橙色胶囊「▶ Watch live」（桌面 + 手机；还没开赛、在打但没直播都不出），点了同 ①。现货终端没有赛事，不涉及（字典 Pro 合约终端 PW-1 … PW-6）。" },
    ],
  },
  {
    code: "C",
    title: "Crypto 段（方案 B · 图表 V1）",
    status: "定稿 11-09",
    rules: [
      { id: "C1", text: "眉行「● Crypto · Up or Down · new round every 5 min」，后半句跟周期 tab：15 min / hour / 4 hours / day。首页 Crypto 段进来默认 5m，周期单独记、切过后在首页内保持；Intraday 品类页不受影响、维持原样（桌面 5m、手机 15m）（2026-11-10 批，字典 HA-6）。" },
      { id: "C2", text: "段头右侧：倒计时「This round closes in MM:SS」（≥ 1 小时写「H:MM:SS」，如 4h / 1D 轮的「1:31:12」）28px + 220px 进度条，竖线隔开周期 tab 5m / 15m / 1h / 4h / 1D。三个币共用这一个钟。一轮已到点、下一轮还没进来的那几秒：前缀「This round closes in」隐藏，时间位写「Settling…」，不停在 00:00；同时 BTC 副句去掉「if it closed now」（如「below the open · Down wins」），ETH / SOL 的「closes HH:MM」也写「Settling…」；下一轮到了自动恢复（2026-11-10 批，字典 HA-7c）。" },
      { id: "C3", text: "BTC 主卡（8 栏裸放）：₿ BTC · Round HH:MM → HH:MM · 本轮成交 · 右上 Traded today；价格 84px；涨跌行「+$x · +x.xx%」+「above/below the open · Up/Down wins if it closed now」。不展示 open 价、不展示单轮成交量明细。「Traded today」= BTC 今天（UTC 0 点起）所有周期、所有轮次的成交额之和；「本轮成交」= 当前周期当前这一轮的成交额。平盘（现价正好等于开盘价）：后端规则是收盘 > 开盘才算 Up，所以平盘写灰色「$0 · 0.00%」不带符号 +「at the open · Down wins if it closed now」，ETH / SOL 的 0.00% 同样灰色无符号（2026-11-10 批，字典 HA-7b）。价格写法：≥ $10,000 取整（$74,063），以下两位小数（$2,137.09 / $86.97），一律千分位；图上 OPEN 标签同规则。" },
      { id: "C4", text: "BTC 图表 = V1 双色面 + 紧量程，动效借 Quick Play 舞台：canvas；时间窗 = 过去 72% 轮长 + 未来 28%，整条线随时间左移；NOW 竖虚线，未来区淡色；收盘线进入窗口才出现（橙，带 closes HH:MM）；开盘虚线横贯，OPEN $ 标签最上层带底色；高于开盘青色面、低于开盘柠檬面；开盘前历史画灰细线不算输赢；量程只看本轮——但开盘后最初 15% 的时间里，本轮还几乎没有走势，量程把窗口里开盘前的灰线也算进去，随时间平滑收回到只看本轮；超出量程的灰线断开不画，不再拉成竖条（2026-11-10 批）；头点跟最新价缓动 + 呼吸环；密点按 3px 一桶平均；时间刻度 5m 每分钟 / 15m 3 分 / 1h 10 分 / 4h 1 小时 / 1D 3 小时。" },
      { id: "C5", text: "Up / Down 大钮 + 资金比例条（Up 青 / Down 柠檬）+ 两头百分比。比例 = 本轮 Up / Down 两边下单金额的占比（正式版接资金数据；Lovable 没有资金池，用 Up 价格代替）。" },
      { id: "C6", text: "Last 8 rounds：8 根小柱按结果上色（Up 青 / Down 柠檬），最新一根描边；右侧「Up won N · Down won N · last round Up/Down」。不写上一轮涨跌金额。一轮都还没结算过时只画空柱、不写右侧这句（否则会写成「last round Down」，2026-11-10 修）。" },
      { id: "C7", text: "右栏面板 ETH / SOL 两半等高：币 + 价格 + 涨跌 + closes HH:MM；小图同 C4 画法缩小（80px 高，带 OPEN 标签）；Up / Down 小钮 + 细比例条。" },
      { id: "C8", text: "到点结算：当前轮结束 → Last 8 推入结果 → 新一轮 open = 上轮收盘价，钟和进度条重置。" },
    ],
  },
  {
    code: "K",
    title: "Stocks 段（R-A）",
    status: "定稿 11-09",
    rules: [
      { id: "K1", text: "眉行「Stocks · Daily close · N markets today」（N = 各市场可交易总数），问句「Will it finish higher than it opened?」。" },
      { id: "K2", text: "段头右侧：市场 tab 单行 US / Hong Kong / Korea（有数据才出，以后加 CN 就多一个），数量跟在名字后；下面一行状态：盘中「Market open · closes in X」、非盘中「Market opens in X」，后接「settles in Y」（Y = 下一个还没到的结算时间 = 官方收盘 + 15 分钟，与主网同步 §7 第 3 条一致；首页和现货页「Settles」都读 `expected_settlement_time`，这个字段为空时都按收盘 + 15 分钟算（CPO 2026-11-10），所以盘中「closes in」和「settles in」差 15 分钟）；这一轮结算时间已过、引擎还没滚到下一轮时写「settling now」，不写「settles in 0s」。默认选中 US；US 没有数据时选下一个有数据的市场。" },
      { id: "K3", text: "清单：按本轮成交量取前 10（成交量相同按接口顺序），两列各 5，中间一根分隔线；每行 = 图标 26 · 代码 + 短名（不截断，太长折成两行，如 Samsung Electro-Mechanics）· 走势小图 96×28 · 价格 + 相对 Base 涨跌（定宽 112px、右对齐，放得下最长的韩股价 ₩1,134,988——韩元不带小数；各行小图和价格因此上下对齐，不随价格位数左右漂）· Up / Down 定宽 88px 钮。不展示每行成交量。手机只取前 5、每只两行。" },
      { id: "K4", text: "走势小图三种时刻：① 盘中 = 从今天开盘起的 1 分钟收盘价实线（盘前那段不画）；② 收盘后还在成交（美股盘后 / 夜盘）= 同色淡一半细线，从这次收盘起画；③ 收盘后还没成交（港股 16:00 / 韩股 15:30 之后）= 不画走势线，只有基准虚线 + 末端空心点，价格 = Base，旁边写「Base price」（不是 at close）。基准虚线永远 = 上次官方收盘价 = 这轮 Base。连续相同价只留一个点，抽样 ≤ 48 点。" },
      { id: "K5", text: "小图颜色：涨 #4ADE80 / 跌 #F87171（股票沿用绿涨红跌），基准虚线橙。平盘（现价 = Base）涨跌位灰色「0.00%」不带 + 号——平盘结算 Down（2026-11-10 批）。价格两位小数 + 千分位（$1,034.20），韩元整数（股票价没有 ≥ $10,000 取整这一条，那条只管加密价）。平盘时走势小图也画灰色（2026-11-10 修，原来画绿色）。" },
      { id: "K6", text: "底部：左「N of M trading above their base price right now」，M = 当前列出的行里已经有成交价的行数（一般是 10，手机 5）；一行都没成交时这句不显示；右「Show all N →」只在该市场只数多于屏上行数时出现（10 只全在屏上就不出），点了进 Finance 品类页并预选当前页签的市场（US / Hong Kong / Korea）（2026-11-10 批）。不写数据来源、不重复结算时间。" },
    ],
  },
  {
    code: "E",
    title: "Editor's Desk（推荐模块 · E1）",
    status: "定稿 11-09",
    rules: [
      { id: "E1", text: "独立一段，放 Stocks 与 More 之间；眉行「✦ Editor's Desk · N picks」（柠檬色），问句「What's worth watching?」；段头右侧不写署名 / 更新时间。" },
      { id: "E2", text: "数据 = 运营后台 featured-markets（≤ 3 个，每个带 whyThis）；没配时整段不出现（和线上一致）。" },
      { id: "E3", text: "三列等高、无分割线、靠 56px 间距和 01 / 02 / 03 大号灰字分开；每列 = 编号 + 眉行「品类 · 时间」、标题（≤ 2 行）、引号里的 whyThis（≤ 3 行，超出省略）、下单钮贴底对齐（统一 36px 高）。" },
      { id: "E4", text: "下单钮跟事件类型走：涨跌轮 = Up / Down；比赛 = 两队名 + 价；多档 = 两档胶囊 + 「+N more」，两档取价格最高的两个结果、价高在前（不是数据源的前两个；2026-11-10 批）。普通二元（Yes / No）= Yes n¢ / No n¢。三项足球赛的 pick 只放两队（主 = 第一个选项、客 = 最后一个），平局在交易页里买。多档和三项赛的每个胶囊 = 买那一档 / 那支队的 Yes（链接 `option=<那一档>&side=yes`），不是「No on 那一档」；只有两个选项的比赛，客队钮仍是 `side=no`（2026-11-10 修：原来多档第二个胶囊打开的是 No）。" },
    ],
  },
  {
    code: "M",
    title: "More 段（长期事件 · L4 / B1）",
    status: "定稿 11-09",
    rules: [
      { id: "M1", text: "眉行「More markets · N open」，问句「Will it happen?」48px（和其他段同号）；段头右侧不放列表入口、不写说明句。长期事件少，全部直接往下铺，一行一个事件。" },
      { id: "M2", text: "每行左 = 封面 120×72 + 眉行「品类 · N markets · Boost n×」+ 标题（桌面 ≤ 3 行，2026-11-10 由 2 行放宽；手机不截断）+「Vol $x · settles 日期」；右 520px = 档位区。" },
      { id: "M3", text: "多档事件：每个可交易 market 一条青 / 黄绿 Yes / No 比例条（青 = Yes 占比）+ Yes n¢ / No n¢ 定宽 66px 钮，最多露 4 条、其余「+N more outcomes →」；互斥型在 bar 下加一句「Outcomes are mutually exclusive — exactly one pays $1.」。「互斥」由事件类型决定（多选一型），正式版看后端字段；Lovable 用各档价格之和≈1 判断。档位顺序 = 接口给的顺序，不重排。只有两档的事件按二元（M4）画。" },
      { id: "M4", text: "二元事件（B1）：不画条，右边大数字「34%」+「chance of Yes」+ Yes / No 两个 110px 钮。" },
      { id: "M5", text: "临近结算（< 48 小时）的事件眉行写「closes in Xh」；已经过了截止时间的不写（2026-11-10 修：原来写「closes in 1h」）。" },
    ],
  },
  {
    code: "G",
    title: "全局",
    status: "",
    rules: [
      { id: "G1", text: "所有段头 = 眉行（品类 · 形态 · 数量/状态）+ 48px 问句，第二行结束，不要第三行说明。主块裸放、副块进面板，裸放块之间靠留白分隔、不加分割线；段与段之间一根细线——只画在真的渲染出来的段之间；某段这一刻画不出来（比如所选周期 BTC 没有当前轮），不留空线（2026-11-10 修）。" },
      { id: "G2", text: "颜色语义：Up / Yes 青 #33D6FF，Down / No 柠檬 #CFFF4A，直播与倒计时橙 #FF8A3D，股票涨跌绿红；全站规则性文案（赢的份额付 $1 等）不在首页任何段重复。" },
      { id: "G3", text: "首页所有价格钮点击 = 进对应事件的交易页并预选那一边（CPO 2026-11-09 批）：Sports 价钮 = 那支队的选项；Crypto / Stocks 的 Up = Yes 边、Down = No 边；Editor's Desk 的钮 = 钮上那个选项；More 多档的 Yes / No = 那一档 + 那一边，二元 = 那一边。行、瓷砖、舞台位对阵、Open match → 只进交易页、不预选。链接写法 `/trade?event=<id>&option=<选项 id>&side=yes|no`（现货事件 `/spot?…`，快轮同样走 `/trade?…&side=yes|no`，旧写法 up / down 也认）；交易页进页时读一次，选中那一档、下单区切到那一边，之后用户自己改不会被拉回；找不到这一档就照常打开、不报错。首页不下单；播放规则见 S2。" },
      { id: "G4", text: "手机版按手机习惯重做，不平铺桌面（见 MB 组）。" },
      { id: "G5", text: "实装顺序：本清单批 → 手机版画板批 → 直写 Lovable（桌面 + 手机）→ style-guide 每模块每状态一帧 + 四栏表 + fixture 开关 → 交付文档 + 验收表 → 主网逐条验收 + 设计师视觉验收。" },
    ],
  },
  {
    code: "R",
    title: "研发口径（2026-11-09 终验冷读补）",
    status: "补 11-09",
    rules: [
      { id: "R1", text: "「this week」= 从查看者本地今天 0 点起 7 天。眉行「N matches this week」= 正在打的 + 还没开赛的（已经打完、等结算的不算，CPO 2026-11-10）；日历条「ALL n」和每天的数字 = 还没开赛的（日历条只筛右表）。有比赛在打时两个数不相等，差值 = 正在打的场数。" },
      { id: "R2", text: "「+N more this week」= 所有还没开赛的场次 − 本段已经展示的场次，跟日历条当前选哪天无关。选了某一天：右表标题写「Big on Fri 7 · by volume」（星期 + 日号，同日历条顺序），选的是今天（日历条写 TODAY）则写「Big today · by volume」；那天的比赛已经全部列出（Big + Next up 放得下那天剩下的所有场次），面板底写「No more matches on Fri 7 · see all →」（今天写「No more matches today」），see all 进 Sports 品类页；手机同样显示（手机右表只有 Big 3 行，那天超过 3 场就不显示）（2026-11-10 批，字典 HA-17）。" },
      { id: "R3", text: "舞台位有多路直播时，默认放成交额最大的一路（相同按开赛早者），‹ › 切换；同 Sports 品类页 EV-37。" },
      { id: "R4", text: "Sports 价钮：左钮 = 第一个选项（主队）、右钮 = 最后一个选项（客队），钮上写短名；右表和瓷砖里的小价钮同样先写那支队的短码（灰色）再写价格，如「NOT 46¢」（CPO 2026-11-10，原来只写「46¢」看不出是哪队）；价钮定宽（桌面右表 80px 一行「短码 价格」；手机右表 56px、短码在上价格在下两行；瓷砖两钮等分，手机同样两行），所有行上下对齐；常见的 3 – 4 个字母的短码不截，再长时只截短码（省略号），价格永远完整；手机右表第一行放不下「两队短码 + 成交额」时成交额换到下一行，不截短码；三项足球赛首页不放平局钮（品类页和交易页有）。" },
      { id: "R5", text: "倒计时写法：≥ 1 小时「9h 05m」，< 1 小时「22m」，< 1 分钟「45s」；超过 24 小时也写小时（「62h 05m」），不换算成天——首页舞台标签「kicks off in」和眉行「next kickoff in」同样（2026-11-10 修：原来写「1d 2h」）。交易页和 Sports 品类页的开赛倒计时是另一套写法（`kickoffInShort`，见 copy-dictionary「Sports 交易时间」），本次不动。More 的「closes in Xh」四舍五入、最少写 1h。" },
      { id: "R6", text: "加载与出错：首屏数据回来前显示首页骨架——五段（Sports / Crypto / Stocks / Editor's Desk / More）各按最终尺寸占位，数据回来不跳（CPO 2026-11-09 批，字典 HA-22 / EV-24）；之后每段数据回来才出现，接口报错与没数据一样整段不出、不显示错误；BTC 当前没有轮次时 Crypto 整段不出；Last 8 不足 8 轮时有几根画几根，右侧计数按实际；五段都没有时首页只剩 Hero、chip 行、Quick Play 横幅。" },
      { id: "R7", text: "断点：宽度 < 768 用手机版（MB 组），≥ 768 用桌面版；桌面内容区最宽 1280（容器 max-w-7xl）。768–1279 仍是桌面版，但两处换排法（2026-11-10 交叉验收）：Stocks 两列 → 一列 10 行；More 每行的档位区挪到标题下面（不再并排，最宽 640）。其余各列按网格比例收缩。" },
      { id: "R8", text: "文案语言（CPO 2026-11-09 批）：首页五段和 Sports 品类页一样 7 语（英 / 简中 / 繁中 / 日 / 韩 / 俄 / 越），key 前缀 events.screen.simple.home_all.*（Lovable 2026-11-09 新增，要回写平台 i18n 表；Yes / No / Up / Down / Vol / Remind me 等复用已有 key）。星期、日期跟用户语言，时间一律 24 小时制；倒计时单位 h / m / s 不翻（同 Sports 品类页）；赛事名、队名、联赛名、事件标题、品类名、运营推荐语是内容数据，不翻。Hero 见 H3（英 / 简中 / 繁中，其他语言回落英文）。字典单帧加 &lang=zh-CN 等可看各语言。各语言下装文字的小格子（日期条格、价钮、Yes / No 钮、手机 Up / Down 钮）都按内容变宽（最小宽度不变），俄语 / 越南语的全大写小标签收窄字距；改布局要 7 语逐个看过（2026-11-10 多语言验收）。" },
      { id: "R9", text: "常年只写在代码里的小规则（2026-11-10 冷读补成文）：① 舞台左上标签太长时只缩联赛名，比赛时钟（MAP 1 · 12:04 / Q3 5:12）永远显示；② 瓷砖区既有「Also live」又补了未开赛的，未开赛那部分小标题写「Up next · HH:mm / HH:mm」（各自开赛时间）；③ 瓷砖一律写星期几（TUE），舞台写 Today / Tomorrow；④ 手机舞台标签不带联赛名；手机 Crypto 右上写「Today $2.2M」、不写「this round」；⑤ Last 8 的柱高是固定装饰（14/9/18/6/12/20/8/15），只有颜色表示涨跌，不是数据。" },
    ],
  },
  {
    code: "MB",
    title: "手机版（390）",
    status: "批 11-09 15:32",
    rules: [
      { id: "MB1", text: "Hero 按设计师手机稿（Figma 203-91044 / 203:91054）：居中两行 26px 标题 → 一句副标「Pick a topic, tap Yes or No.」→ 358×89 插画条（/assets/mobile/hero-band@3x.png，设计师稿整块导出：面板底 + 插画，3×，紧贴副标下方）；不放 LIVE MARKETS 标签。" },
      { id: "MB2", text: "品类 chip 一行横滑；Quick Play 用生产手机横幅 AB-2。" },
      { id: "MB3", text: "Sports：日历条横滑 → 舞台位（直播预览 / 对阵 + 比分 / 最大场倒计时）→ 2 列瓷砖 → 面板只留 Big this week 3 行 → 底部「+N more this week ｜ All N matches →」（这个 N = 眉行的 N：正在打的 + 还没开赛的，所以有比赛在打时比日历条 ALL 多出正在打的场数）。不列 Next up。手机行第一行写两队短码 + 成交额，短码太长时只截短码、成交额不截（2026-11-10）。有直播标记的 live 瓷砖去掉联赛名，保住「▶ Stream」。" },
      { id: "MB4", text: "Crypto：钟 + 进度条整行、周期 tab 一行 → BTC 卡（价 48px、图 150 高、同 C4 画法）→「BTC · last 8」紧贴图表下方、在 Up / Down 钮之前 → 资金比例条 → ETH / SOL 两张半卡并排（图 64 高）。" },
      { id: "MB5", text: "Stocks：市场 tab + 一行状态 → 只取前 5，每只两行（上：代码 + 短名（同 K3）/ 价 + 涨跌；下：走势图 120×26 + Up / Down 78px 钮）→ 底注「N of 5 above their base price · Show all N →」。" },
      { id: "MB6", text: "Editor's Desk 三条竖叠（编号 + 眉行 / 标题 / 引言 / 钮）；More = 封面 + 标题一行，多档事件每档名字独占一行、下面 bar + Yes / No 58px 钮，二元事件 = 大数字 + 两钮整行。" },
    ],
  },
];

/** Flat lookup: "C4" → rule text. */
export const HOME_RULE_BY_ID: Record<string, string> = Object.fromEntries(
  HOME_ALL_RULES.flatMap((g) => g.rules.map((r) => [r.id, r.text])),
);
