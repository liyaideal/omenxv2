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
      { id: "H2", text: "Hero = 1440×260 全宽横幅：设计师的猞猁键盘插画做整条底图（2× PNG，右对齐、撑满高度），上压左浅右深暗色渐变。" },
      { id: "H3", text: "Hero 文案（10-26 SEO 轮候选）：H1 两行 56px「Prediction markets, / with leverage.」（第二行柠檬色），副标 15px「Think you know what happens next? Pick a topic, tap Yes or No.」，LIVE MARKETS 小标签。" },
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
      { id: "S0", text: "细则以「Sports 规则稿 v2」为准：左 Live 模块 + 右一张表（Big this week 3 行 + Next up 填满）、四态、T3 瓷砖、日历条、一场只出现一次（舞台位 > 瓷砖 > Big this week > Next up）、直播标记一律橙色。" },
      { id: "S1", text: "队标通用规则：所有队标都在同一个圆里。真队徽（透明底）contain 74% 不裁；数据源的纯色占位方块不放原图，改画同色圆徽 + 白色短码；完全没图 = 灰底 + 短码。两队重叠 −5px。" },
      { id: "S2", text: "舞台位不拉流（CPO 2026-11-09「点了才播」）：画面 = 一张静态图 + 橙色播放钮「Watch live」。点画面 = 播放：已登录 → 进该场交易页静音开播；游客 → 站内登录框（桌面弹窗 / 手机抽屉），登录成功后直接进该场交易页开播（含 Google 跳转回来），关掉登录框留在原页。比分、队名、价钮、Open match 照旧直接进交易页，不弹登录、不开播。Sports 品类页顶部舞台同此规则。交易页对游客不拉流，画面位放「Sign in to watch live」+ Sign in（登录后就地开播）。" },
      { id: "S3", text: "静态图按顺序取：① 直播截图——服务端对每路正在直播的流每 10 分钟截一帧，同一时段所有用户看同一张（字段 metadata.stream_thumb_url / stream_thumb_at）；② 还没截到 / 截图失败 → 这场赛事的封面图（events.image_url）；③ 封面也没有 → 深色底。三档都压暗、左上橙底 LIVE、不放队徽（下方比分行已有两队）。" },
    ],
  },
  {
    code: "C",
    title: "Crypto 段（方案 B · 图表 V1）",
    status: "定稿 11-09",
    rules: [
      { id: "C1", text: "眉行「● Crypto · Up or Down · new round every 5 min」，后半句跟周期 tab：15 min / hour / 4 hours / day。" },
      { id: "C2", text: "段头右侧：倒计时「This round closes in MM:SS」28px + 220px 进度条，竖线隔开周期 tab 5m / 15m / 1h / 4h / 1D。三个币共用这一个钟。" },
      { id: "C3", text: "BTC 主卡（8 栏裸放）：₿ BTC · Round HH:MM → HH:MM · 本轮成交 · 右上 Traded today；价格 84px；涨跌行「+$x · +x.xx%」+「above/below the open · Up/Down wins if it closed now」。不展示 open 价、不展示单轮成交量明细。" },
      { id: "C4", text: "BTC 图表 = V1 双色面 + 紧量程，动效借 Quick Play 舞台：canvas；时间窗 = 过去 72% 轮长 + 未来 28%，整条线随时间左移；NOW 竖虚线，未来区淡色；收盘线进入窗口才出现（橙，带 closes HH:MM）；开盘虚线横贯，OPEN $ 标签最上层带底色；高于开盘青色面、低于开盘柠檬面；开盘前历史画灰细线不算输赢；量程只看本轮；头点跟最新价缓动 + 呼吸环；密点按 3px 一桶平均；时间刻度 5m 每分钟 / 15m 3 分 / 1h 10 分 / 4h 1 小时 / 1D 3 小时。" },
      { id: "C5", text: "Up / Down 大钮 + 资金比例条（Up 青 / Down 柠檬）+ 两头百分比。" },
      { id: "C6", text: "Last 8 rounds：8 根小柱按结果上色（Up 青 / Down 柠檬），最新一根描边；右侧「Up won N · Down won N · last round Up/Down」。不写上一轮涨跌金额。" },
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
      { id: "K2", text: "段头右侧：市场 tab 单行 US / Hong Kong / Korea（以后加 CN 就多一个），数量跟在名字后；下面一行状态：盘中「Market open · closes in X」、非盘中「Market opens in X」，后接「settles in Y」（Y = 这一轮结算倒计时）；结算时间已过、下一轮还没开时写「settling now」，不写「settles in 0s」。" },
      { id: "K3", text: "清单：按本轮成交量取前 10，两列各 5，中间一根分隔线；每行 = 图标 26 · 代码 + 全名（全名不截断）· 走势小图 96×28 · 价格 + 相对 Base 涨跌 · Up / Down 定宽 88px 钮。不展示每行成交量。手机只取前 5、每只两行。" },
      { id: "K4", text: "走势小图三种时刻：① 盘中 = 自上次收盘以来的 1 分钟收盘价实线；② 收盘后还在成交（美股盘后 / 夜盘）= 同色淡一半细线，开盘后实线接上；③ 收盘后还没成交（港股 / 韩股 16:00 之后）= 不画图，价格旁写「Base price」（不是 at close）。基准虚线永远 = 上次官方收盘价 = 这轮 Base。连续相同价只留一个点，抽样 ≤ 48 点。" },
      { id: "K5", text: "小图颜色：涨 #4ADE80 / 跌 #F87171（股票沿用绿涨红跌），基准虚线橙。" },
      { id: "K6", text: "底部：左「N of 10 trading above their base price right now」（没成交时不显示）；右「Show all N →」。不写数据来源、不重复结算时间。" },
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
      { id: "E4", text: "下单钮跟事件类型走：涨跌轮 = Up / Down；比赛 = 两队名 + 价；多档 = 两档胶囊 + 「+N more」。" },
    ],
  },
  {
    code: "M",
    title: "More 段（长期事件 · L4 / B1）",
    status: "定稿 11-09",
    rules: [
      { id: "M1", text: "眉行「More markets · N open」，问句「Will it happen?」48px（和其他段同号）；段头右侧不放列表入口、不写说明句。长期事件少，全部直接往下铺，一行一个事件。" },
      { id: "M2", text: "每行左 = 封面 120×72 + 眉行「品类 · N markets · Boost n×」+ 标题（≤ 2 行）+「Vol $x · settles 日期」；右 520px = 档位区。" },
      { id: "M3", text: "多档事件：每个可交易 market 一条青 / 黄绿 Yes / No 比例条（青 = Yes 占比）+ Yes n¢ / No n¢ 定宽 66px 钮，最多露 4 条、其余「+N more outcomes →」；互斥型在 bar 下加一句「Outcomes are mutually exclusive — exactly one pays $1.」。" },
      { id: "M4", text: "二元事件（B1）：不画条，右边大数字「34%」+「chance of Yes」+ Yes / No 两个 110px 钮。" },
      { id: "M5", text: "临近结算的事件眉行写「closes in Xh」。" },
    ],
  },
  {
    code: "G",
    title: "全局",
    status: "",
    rules: [
      { id: "G1", text: "所有段头 = 眉行（品类 · 形态 · 数量/状态）+ 48px 问句，第二行结束，不要第三行说明。主块裸放、副块进面板，裸放块之间靠留白分隔、不加分割线；段与段之间一根细线。" },
      { id: "G2", text: "颜色语义：Up / Yes 青 #33D6FF，Down / No 柠檬 #CFFF4A，直播与倒计时橙 #FF8A3D，股票涨跌绿红；全站规则性文案（赢的份额付 $1 等）不在首页任何段重复。" },
      { id: "G3", text: "首页所有价格钮 / 行 / 舞台位点击 = 进对应事件交易页；首页不下单、不播放。" },
      { id: "G4", text: "手机版按手机习惯重做，不平铺桌面（见 MB 组）。" },
      { id: "G5", text: "实装顺序：本清单批 → 手机版画板批 → 直写 Lovable（桌面 + 手机）→ style-guide 每模块每状态一帧 + 四栏表 + fixture 开关 → 交付文档 + 验收表 → 主网逐条验收 + 设计师视觉验收。" },
    ],
  },
  {
    code: "MB",
    title: "手机版（390）",
    status: "批 11-09 15:32",
    rules: [
      { id: "MB1", text: "Hero 按设计师手机稿（Figma 203-91049）：居中两行 26px 标题 → 一句副标「Pick a topic, tap Yes or No.」→ 358×89 插画条；不放 LIVE MARKETS 标签。" },
      { id: "MB2", text: "品类 chip 一行横滑；Quick Play 用生产手机横幅 AB-2。" },
      { id: "MB3", text: "Sports：日历条横滑 → 舞台位（直播预览 / 对阵 + 比分 / 最大场倒计时）→ 2 列瓷砖 → 面板只留 Big this week 3 行 → 底部「+N more this week ｜ All N matches →」。不列 Next up。有直播标记的 live 瓷砖去掉联赛名，保住「▶ Stream」。" },
      { id: "MB4", text: "Crypto：钟 + 进度条整行、周期 tab 一行 → BTC 卡（价 48px、图 150 高、同 C4 画法）→「BTC · last 8」紧贴图表下方、在 Up / Down 钮之前 → 资金比例条 → ETH / SOL 两张半卡并排（图 64 高）。" },
      { id: "MB5", text: "Stocks：市场 tab + 一行状态 → 只取前 5，每只两行（上：代码 + 全名 / 价 + 涨跌；下：走势图 120×26 + Up / Down 78px 钮）→ 底注「N of 5 above their base price · Show all N →」。" },
      { id: "MB6", text: "Editor's Desk 三条竖叠（编号 + 眉行 / 标题 / 引言 / 钮）；More = 封面 + 标题一行，多档事件每档名字独占一行、下面 bar + Yes / No 58px 钮，二元事件 = 大数字 + 两钮整行。" },
    ],
  },
];

/** Flat lookup: "C4" → rule text. */
export const HOME_RULE_BY_ID: Record<string, string> = Object.fromEntries(
  HOME_ALL_RULES.flatMap((g) => g.rules.map((r) => [r.id, r.text])),
);
