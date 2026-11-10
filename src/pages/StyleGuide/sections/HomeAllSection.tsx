/**
 * 首页 All 视图 · 状态字典（HA-1 … HA-22 · 首页 All 改版 D2-S3 / M-*，2026-11-09 定稿）。
 *
 * 每个 case = 生产组件 + SectionFrame 双帧（desktop 1280 在上 / mobile 375 在下）；
 * 375 帧里组件自己走手机形态（M-* 板），不是桌面压扁。fixture 冻结在 FROZEN_NOW，
 * 状态由数据决定（live 场次、直播源、盘别、事件档数），不靠布局型 prop。
 * 四栏表「状态 / 触发条件 / 视觉 / 数据来源」每行对着规则编号（H/S/C/K/E/M/G/MB），
 * 规则原文见本节末尾的台账 HA-R（= 交付文档 §规则）。
 */
import { SectionWrapper, SubSection } from "../components/SectionWrapper";
import { SectionFrame, type SectionCase } from "../components/SectionFrame";
import { HomeRulesLedger } from "../components/HomeRulesLedger";

const HERO_CASES: SectionCase[] = [
  {
    key: "home-ha1",
    label: "HA-1 · Hero（HomeHero · H2 / H3 / MB1）",
    note: "文案走 i18n：home_hero.heading_v2 / sub_v2 / sub_v2_mobile（en / zh-CN / zh-TW 已配，其余语言回落 en）。",
    spec: [
      { state: "桌面", when: "useIsMobile() === false", visual: "1440×260 全宽横幅：/assets/desktop/hero-band@2x.png 右对齐撑满高，左浅右深渐变；LIVE MARKETS 药丸 + 两行 56px「Prediction markets, / with leverage.」+ 15px 副标", source: "HomeHero · H2 H3" },
      { state: "手机", when: "useIsMobile() === true", visual: "居中两行 26px 标题 → 14px 副标「Pick a topic, tap Yes or No.」→ 358×89 插画条 /assets/mobile/hero-band@3x.png（设计师稿 203:91054 整块导出：面板底 + 插画，3×）；无药丸", source: "HomeHero isMobile · MB1" },
    ],
  },
];

const SPORTS_CASES: SectionCase[] = [
  {
    key: "home-ha2",
    label: "HA-2 · Sports 状态①：10 场 live、3 场有直播（HomeSportsSection）",
    note: "舞台位 = 第一条有直播的 live；右上「‹ Stream 1 / 3 ›」切直播源；瓷砖 = Also live 2×2（有直播的标 ▶ Stream）+「See all 10 live →」；右表 Big this week 3 + Next up 填满。",
    spec: [
      { state: "舞台位 · 有直播", when: "live.some(m => m.streamUrl)", visual: "桌面 + 手机：不拉流。画面 = 直播截图（服务端每 10 分钟一张，压暗）+ 左上橙底 LIVE + 中间橙色播放钮「Watch live」（桌面 64 / 手机 48）；没截图用赛事封面，封面也没有用深色底（S3）。点画面 = 播放（S2：已登录进交易页开播；游客先登录，见 HA-15）", source: "StreamPreview · streamPicture · usePlayStream" },
      { state: "直播切换", when: "streams.length > 1", visual: "标签行右侧 ‹ Stream i / N ›，切换只换舞台位，瓷砖不动", source: "HomeSportsSection streamIndex" },
      { state: "Also live 瓷砖", when: "live.length > 1", visual: "最多 4 块、橙色顶线、比分柠檬 20px、meta「● 节点 · 项目图标 联赛（· ▶ Stream）」；多于 4 场出「See all N live →」整行钮", source: "Tile live · S0" },
      { state: "手机 · 有直播标记的瓷砖", when: "isMobile && live && m.streamUrl", visual: "去掉联赛名，保住「▶ Stream」不被省略号吃掉", source: "MB3" },
    ],
  },
  {
    key: "home-ha3",
    label: "HA-3 · Sports 状态②：1 场 live 有直播（今晚）",
    note: "= D2-S3 整页里的 Sports 段；瓷砖 = Up next 4 块（最近开球）。手机：面板只留 Big this week 3 行 + 底部「+N more this week ｜ All N matches →」（MB3）。",
    spec: [
      { state: "舞台位", when: "live.length === 1 && m.streamUrl", visual: "标签「● Live now · 联赛 · 节点」+ 右「▶ Live stream」；直播截图 + 播放钮 → 对阵（徽 56 / 短码 16 / 全名 11.5）→ 比分 56px 柠檬 → 两队价钮 → Open match → · Vol", source: "Stage live" },
      { state: "Up next 瓷砖", when: "live.length === 1", visual: "4 块未开球：短码 + 开球 HH:mm + 「Sat · 项目图标 联赛短码」+ 两价胶囊", source: "Tile upcoming" },
      { state: "右表", when: "desktop", visual: "面板 Big this week（按量前 3，行内 Vol 柠檬）+ Next up（按开球，行数填满到与左块齐）+「+N more this week · see all →」；一场只出现一次", source: "S0 去重顺序" },
      { state: "日历条", when: "always", visual: "ALL(总数) + 有赛事的日子（星期 / 日号 / 场数），选中柠檬底；点日子只筛右表", source: "buildDayStrip · matchesInBucket" },
    ],
  },
  {
    key: "home-ha4",
    label: "HA-4 · Sports 状态③：3 场 live 都没直播",
    spec: [
      { state: "舞台位 · 无视频面", when: "live.length > 0 && !live.some(m => m.streamUrl)", visual: "没有画面块（没有直播源就没有截图），直接对阵 + 比分；左栏形状靠瓷砖补齐", source: "Stage live !m.streamUrl" },
      { state: "瓷砖混排", when: "alsoLive.length < 4", visual: "Also live N（橙顶线）+ Up next · HH:mm / HH:mm（补到 4 块）；live 和未开球不混在一组", source: "TileGroup ×2" },
      { state: "奇数块", when: "items.length % 2 === 1", visual: "最后一块横跨整行", source: "TileGroup gridColumn 1/-1" },
    ],
  },
  {
    key: "home-ha5",
    label: "HA-5 · Sports 状态④：0 live",
    spec: [
      { state: "舞台位 = 本周最大场", when: "live.length === 0", visual: "标签「Biggest this week · kicks off in 1d 2h」（灰）+ 对阵 + 开球时间 40px 白 + 两队价钮", source: "Stage !live · upcoming by volume" },
      { state: "链接 · 没直播或超过 48h", when: "!m.streamUrl || kickoff − now > 48h", visual: "「Open match →」进交易页（本帧这场没有直播）；能设提醒的样子见 HA-21a / b / c", source: "Stage remind.can === false · S4" },
      { state: "眉行", when: "live.length === 0", visual: "「Sports · N matches this week · next kickoff in X」（无红点）；手机「Sports · N matches · kickoff in X」", source: "eyebrow" },
    ],
  },
  {
    key: "home-ha17",
    label: "HA-17 · Sports 日历条选中某一天（R1 / R2）",
    note: "同 HA-5 的数据，挂载后点日历条第三格。只有右表跟着日期变；舞台位、瓷砖、眉行数字不变。",
    spec: [
      { state: "选中某天", when: "day !== 'all'", visual: "该格变选中态；右表 Big this week / Next up 只列这一天还没开赛的比赛", source: "HomeSportsSection day · buildDayStrip" },
      { state: "数字", when: "始终", visual: "眉行 N = 这 7 天所有没结算的（含正在打）；ALL n 与各天数字 = 没开赛的；「+N more this week」= 全部没开赛 − 本段已展示，跟选哪天无关", source: "R1 / R2" },
      { state: "再点 ALL", when: "点 ALL 格", visual: "回到全周", source: "setDay('all')" },
    ],
  },
  {
    key: "home-ha15",
    isolate: true,
    label: "HA-15 · 游客点「Watch live」→ 站内登录框（桌面弹窗 / 手机抽屉）",
    note: "CPO 2026-11-09「点了才播」R3。登录框是现有组件，一个字不改；本帧挂载后直接打开它（等同游客点了播放）。登录成功后直接进这场交易页并开播（含 Google 跳转回来）；关掉登录框留在首页，什么都不发生。",
    spec: [
      { state: "游客点播放", when: "!storedSignedIn()", visual: "目的地 /trade?event=…&play=1 暂存 sessionStorage「omenx.afterSignIn」→ openPrompt()：桌面 AuthDialog、手机 AuthSheet（底部抽屉）", source: "usePlayStream" },
      { state: "登录成功", when: "signedIn && !promptOpen", visual: "取出暂存目的地并跳转；交易页静音开播（浏览器不允许新开的页面直接出声）", source: "AuthPromptHost · takeAfterSignIn" },
      { state: "关掉登录框", when: "onOpenChange(false) && !storedSignedIn()", visual: "清掉暂存目的地，留在原页", source: "AuthPromptHost · setAfterSignIn(null)" },
      { state: "已登录点播放", when: "storedSignedIn()", visual: "直接进 /trade?event=…&play=1（R2）", source: "usePlayStream" },
    ],
  },
  {
    key: "home-ha16",
    label: "HA-16 · 队徽四种画法（TeamBadge · S1 · 队徽从 omenx.com 同步）",
    note: "同 HA-4（没有比赛在打，最大的一场上舞台），只是给赛事加上数据源的队徽：NBA 四场是色块队徽，Rayo Vallecano vs Athletic Club 是真队徽，Czechia vs Spain 是国旗方图，IG vs Gen.G 指向加载不到的图，其余没有队徽。Sports 品类页 / 手机 Sports 模块的同一规则见 Events 字典 EV-47（Crest）。",
    spec: [
      { state: "色块队徽", when: "metadata.home_tile / away_tile 有值", visual: "圆形底色 = 方块颜色，白字短码（不放那张方块图）", source: "TeamBadge tileColor · S1" },
      { state: "真队徽", when: "home_logo 有值且没有 tile", visual: "深色圆底 #1B2130，图 contain 74% 不裁；国旗方图同样处理", source: "TeamBadge logoUrl · S1" },
      { state: "没有队徽", when: "home_logo 为空", visual: "灰底 #1B2130 + 白字短码", source: "TeamBadge code · S1" },
      { state: "加载失败", when: "图片 onError", visual: "同「没有队徽」", source: "TeamBadge onError" },
      { state: "两队叠放", when: "列表行 / 表格行", visual: "第二枚 −5px 压在第一枚上，外圈 2px 底色描边", source: ".tc-pair · S1" },
    ],
  },
];

/* Stage state ④ with a reminder. HA-21c opens the fixed sign-in layer → `isolate` gives it its own iframe. */
const REMIND_CASES: SectionCase[] = [
  {
    key: "home-ha21a",
    label: "HA-21a · 状态④ · 能设提醒（☆ Remind me · S4）",
    note: "同 HA-5，只给舞台上那场（Nottingham Forest vs Manchester City，26 小时后开赛）加了直播。fixture 下点击只在本帧切换，不写库。",
    spec: [
      { state: "能设提醒", when: "!live && m.streamUrl && kickoff > now && kickoff − now ≤ 48h", visual: "价钮下「☆ Remind me」（白，13.5 / 手机 13）+ Vol", source: "Stage remind.can · PREVIEW_WINDOW_MS" },
      { state: "点击（已登录）", when: "signedIn", visual: "乐观切到「★ Reminder set」，写 stream_reminders 一行；失败回滚 + toast「Couldn't update the reminder」", source: "useStreamReminders.toggle（与 Sports 品类页 EV-43 同一个）" },
    ],
  },
  {
    key: "home-ha21b",
    label: "HA-21b · 状态④ · 已设提醒（★ Reminder set）",
    spec: [
      { state: "已设", when: "reminders.has(m.id)", visual: "「★ Reminder set」橙 #FF8A3D，aria-pressed=true；再点取消、回到 HA-21a", source: "useStreamReminders.has" },
      { state: "开赛", when: "kickoff ≤ now", visual: "这条提醒变成一条通知（Notifications → Updates，system.stream_live）；舞台位换成 live 态", source: "notify_stream_reminders() cron" },
    ],
  },
  {
    key: "home-ha21c",
    isolate: true,
    label: "HA-21c · 状态④ · 游客点 Remind me → 站内登录框（桌面弹窗 / 手机抽屉）",
    note: "挂载后点一下「☆ Remind me」（= 游客点击）。登录框是现有组件，一个字不改。",
    spec: [
      { state: "游客点击", when: "!user", visual: "openPrompt()：桌面 AuthDialog、手机 AuthSheet（底部抽屉）；本地不存", source: "useStreamReminders · AuthPromptHost" },
      { state: "登录后", when: "signedIn", visual: "回到首页、仍是「☆ Remind me」，再点一次才设上（同 EV-45）", source: "useStreamReminders" },
    ],
  },
];

const CRYPTO_CASES: SectionCase[] = [
  {
    key: "home-ha6",
    label: "HA-6 · Crypto 5m（HomeCryptoSection · C1–C7）",
    note: "fixture：三个币同一轮窗口（已过 62%），BTC open 74,081 / Up 55¢；价格路径 = roundSeries（按 event id 播种的确定性游走，真平台换成 underlyingTrendPoints，画法不变）。",
    spec: [
      { state: "段头", when: "currentFor.get(`btc-${tf}`)", visual: "眉行「● Crypto · Up or Down · new round every 5 min」+ 48px 问句；右：This round closes in MM:SS 28px + 220px 进度条 ｜ 5m 15m 1h 4h 1D", source: "C1 C2" },
      { state: "BTC 主卡", when: "always", visual: "₿ BTC · Round HH:MM → HH:MM · ● this round $x · Traded today $xk；价 84px；+$x · +x.xx% / above the open · Up wins if it closed now；图 206px；Up / Down 大钮 + 比例条 + 两头 %；Last 8 rounds 柱 + Up won N · Down won N · last round Up", source: "C3 C4 C5 C6" },
      { state: "图表（V1）", when: "canvas", visual: "窗口 过去 72% / 未来 28%；NOW 竖虚线 + 未来淡区；收盘线进窗才出；开盘虚线 + OPEN $ 标签压顶；上青下柠檬双色面；开盘前灰线；头点缓动 + 呼吸环；时间刻度 5m 每分钟", source: "RoundCanvas · C4" },
      { state: "ETH / SOL 面板", when: "always", visual: "右 4 栏面板两半等高：币 · 价 20px · 涨跌 · closes HH:MM；小图 80px 同画法；Up ｜ 细比例条 ｜ Down", source: "C7" },
      { state: "手机", when: "isMobile", visual: "钟 + 进度条整行 → tab → BTC 卡（价 48 / 图 150）→「BTC · last 8」紧贴图下 → Up / Down → 比例条 → ETH / SOL 两张半卡（图 64）", source: "MB4" },
      { state: "到点结算", when: "now ≥ end_date（生产，fixture 不演）", visual: "Last 8 推入结果、下一轮 open = 上轮收盘、钟和进度条重置（useQuickRounds 过期看门狗换轮）", source: "C8 · useQuickRounds" },
    ],
  },
  {
    key: "home-ha7",
    label: "HA-7 · Crypto 1h（周期 tab 切换）",
    spec: [
      { state: "tab = 1h", when: 'tf === "1h"', visual: "眉行后半句「new round every hour」；时间刻度每 10 分钟；密点按 3px 一桶平均", source: "C1 C4 · TICK_MS" },
    ],
  },
  {
    key: "home-ha18a",
    label: "HA-18a · Crypto 15m",
    spec: [{ state: "tab = 15m", when: 'tf === "15m"', visual: "眉行「new round every 15 min」；刻度每 3 分钟；钟 = 本轮剩余", source: "C1 C2 C4" }],
  },
  {
    key: "home-ha18b",
    label: "HA-18b · Crypto 4h",
    spec: [{ state: "tab = 4h", when: 'tf === "4h"', visual: "眉行「new round every 4 hours」；刻度每 1 小时；钟剩余 ≥ 1 小时写「H:MM:SS」（如「1:31:12」，不写「91:12」）", source: "C1 C2 C4" }],
  },
  {
    key: "home-ha18c",
    label: "HA-18c · Crypto 1D",
    spec: [{ state: "tab = 1D", when: 'tf === "1d"', visual: "眉行「new round every day」；刻度每 3 小时", source: "C1 C2 C4" }],
  },
  {
    key: "home-ha19",
    label: "HA-19 · Crypto 历史不足 8 轮（R6）",
    spec: [{ state: "只有 3 轮", when: "history.length < 8", visual: "Last 8 只画 3 根柱，右侧计数按实际（Up won n · Down won n）", source: "C6 · R6" }],
  },
];

const STOCKS_CASES: SectionCase[] = [
  {
    key: "home-ha8",
    label: "HA-8 · Stocks · 盘中（K4 ①，US Wed 11:00 ET）",
    note: "fixture 19 只：US 10 / HK 6 / KR 3；桌面前 10 两列各 5，手机前 5 每只两行（K3 / MB5）。",
    spec: [
      { state: "段头", when: "stockRows.length > 0", visual: "眉行「Stocks · Daily close · N markets today」+ 问句；右：US 10 ｜ Hong Kong 6 ｜ Korea 3 单行 tab + 一行状态「Market open · closes in X · settles in Y」", source: "K1 K2 · getStockSessionState" },
      { state: "行 · 盘中实线", when: 'session.phase === "live"', visual: "图标 26 · 代码 + 全名不截断 · 96×28 实线（涨 #4ADE80 / 跌 #F87171，基准橙虚线）· 价 + 相对 Base % · Up / Down 88px", source: "K3 K4① K5" },
      { state: "底部", when: "live.length > 0", visual: "「N of 10 trading above their base price right now」+「Show all N →」", source: "K6" },
    ],
  },
  {
    key: "home-ha9",
    label: "HA-9 · Stocks · 收盘后还在成交（K4 ②，US 盘后）",
    spec: [
      { state: "行 · 淡线", when: 'phase !== "live" && market.extendedPrints', visual: "同色线 opacity .5；状态行「Market opens in X · settles in Y」", source: "K4②" },
    ],
  },
  {
    key: "home-ha10",
    label: "HA-10 · Stocks · 收盘后没成交（K4 ③，HK 16:00 / KR 15:30 后）",
    spec: [
      { state: "行 · 无图", when: 'phase !== "live" && !market.extendedPrints', visual: "不画线，只有基准虚线 + 空心点；价格 = Base，涨跌位写灰字「Base price」；底部左句不显示", source: "K4③ K6" },
    ],
  },
  {
    key: "home-ha10b",
    label: "HA-10b · Stocks · Korea 盘中（₩ 不带小数 · 长短名折两行 · 主网 logo）",
    note: "韩股 2026-11-10 起跟主网同步（同步文档 §7）。fixture 用真实的短名、代码和价位；头像 logo 来自主网（mn_stock_names.icon_url），离线时退回代码字。",
    spec: [
      { state: "韩元", when: 'market.key === "kr"', visual: "价格整数 + 千分位（₩1,134,988），价格列仍定宽 112px", source: "formatMarketPrice · K3" },
      { state: "长短名", when: "短名放不下一行", visual: "折成两行（Samsung Electro- / Mechanics），不截断、不压到走势线", source: "K3 · .srow .n" },
      { state: "头像", when: "mn_stock_names.icon_url 有值", visual: "主网 logo 铺满圆；没有 → 仓库 logo → 代码字（韩股去掉前导 0）", source: "AssetAvatar · 同步 §7 7b" },
    ],
  },
];

const DESK_CASES: SectionCase[] = [
  {
    key: "home-ha11",
    label: "HA-11 · Editor's Desk · 三种钮（HomeDeskSection · E1–E4）",
    note: "picks = 0 → 整段不渲染（E2）；fixture 三条 = 涨跌轮 / 股票轮 / 比赛。",
    spec: [
      { state: "三列等高", when: "picks.length ≥ 1", visual: "眉行「✦ Editor's Desk · N picks」柠檬 + 问句；三列 56px 间距、无分割线、01 / 02 / 03 大号灰字；标题 ≤ 2 行、引言 ≤ 3 行斜体、钮贴底 36px", source: "E1 E3" },
      { state: "涨跌轮", when: 'yesLabel ∈ {Up, Down}', visual: "Up n¢ / Down n¢", source: "E4" },
      { state: "比赛", when: "optionCount === 2 && 非 Yes/No/Up/Down", visual: "两队名 + 价（odds 钮）", source: "E4" },
      { state: "手机", when: "isMobile", visual: "三条竖叠，每条上细线分隔", source: "MB6" },
    ],
  },
  {
    key: "home-ha12",
    label: "HA-12 · Editor's Desk · 多档 pick",
    spec: [
      { state: "多档", when: "optionCount > 2", visual: "两档胶囊 +「+N more」", source: "E4" },
    ],
  },
  {
    key: "home-ha20",
    label: "HA-20 · Editor's Desk · 2 条 pick，其中一条普通二元（E2 / E4）",
    spec: [
      { state: "条数 < 3", when: "picks.length === 2", visual: "按实际条数排，列宽不变、不补空位；编号 01 / 02", source: "E2 E3" },
      { state: "普通二元", when: "yesLabel === 'Yes'", visual: "「Yes n¢」/「No n¢」两钮", source: "E4" },
      { state: "比赛", when: "metadata.kickoff_at", visual: "两队名 + 价；三项赛只放两队（平局在交易页买）", source: "E4 · toEditorPick" },
    ],
  },
];

const MORE_CASES: SectionCase[] = [
  {
    key: "home-ha13",
    label: "HA-13 · More markets · 四种事件（HomeMoreSection · M1–M5）",
    note: "fixture：6 档阶梯（露 4 +「+2 more outcomes →」）/ 4 档互斥（加一句 mutually exclusive）/ 二元 B1 / 临近结算长标题（眉行 closes in 24h，标题 2 行）。events = 非轮次、非赛事的长期事件（Quick Play 轮 ARCADE_UPDOWN_SPOT 不进）。",
    spec: [
      { state: "多档", when: "children.length > 2", visual: "每档 名字 · 青/黄绿 Yes-No 比例条 · Yes n¢ / No n¢ 66px；最多 4 条 +「+N more outcomes →」", source: "M3" },
      { state: "互斥", when: "|Σ yes − 1| < .12", visual: "bar 下加「Outcomes are mutually exclusive — exactly one pays $1.」", source: "M3" },
      { state: "二元", when: "children.length ≤ 2", visual: "大数字 36px「34%」+ chance of Yes + Yes / No 110px", source: "M4 · B1" },
      { state: "临近结算", when: "expiry − now < 48h", visual: "眉行末尾「closes in Xh」", source: "M5" },
      { state: "手机", when: "isMobile", visual: "封面 96×58 + 标题；多档每档名字独占一行、下面 bar + 58px 钮；二元 = 大数字 + 两钮整行", source: "MB6" },
    ],
  },
];

const LOADING_CASES: SectionCase[] = [
  {
    key: "home-ha22",
    label: "HA-22 · 首屏骨架（LiteAllStageSkeleton / LiteMobileStageSkeleton · R6）",
    note: "生产页 stageFirstLoad 时就是这一块（上面还有行情条骨架，见 EV-24）。数据回来后每段各自换成真内容，没数据的段整段收起。",
    spec: [
      { state: "桌面", when: "stageFirstLoad && !isMobile", visual: "五段各按最终尺寸占位：Sports（段头 + 日历条位 / 左：舞台 + 对阵 + 两价钮 + 瓷砖 2×2 / 右表 10 行）→ Crypto（段头 + 钟 / BTC 主卡 + 图 / ETH·SOL 面板）→ Stocks（段头 + tab / 两列各 5 行）→ Editor's Desk（三列）→ More（3 行：封面 + 标题 / 档位区）；段间细线；色块只用 #171A1F / #15181C", source: "LiteAllStageSkeleton" },
      { state: "手机", when: "stageFirstLoad && isMobile", visual: "同顺序单列：Sports 段头 + 日历条 + 舞台 + 对阵 + 两价钮 + 瓷砖 2×2 → Crypto 段头 + 钟 + 进度条 + 周期 tab + BTC 卡（价 / 图 150 / 两钮）→ Stocks 段头 + tab + 5 只（每只两行）→ Desk 三条竖叠 → More 2 条", source: "LiteMobileStageSkeleton" },
      { state: "有缓存", when: "react-query 有缓存", visual: "不出骨架，直接渲染上次的数据再刷新", source: "stageFirstLoad 判定（EV-24）" },
    ],
  },
];

const STAGE_CASES: SectionCase[] = [
  {
    key: "home-ha14",
    label: "HA-14 · 整页 All 视图（HomeStage · 五段 + 段间细线 · G1）",
    note: "生产组合：Sports ② → Crypto 5m → Stocks → Editor's Desk → More；某段无数据就整段不出（Sports 无场次 / Crypto 无活轮 / Stocks 无行 / picks = 0 / 无长期事件）。",
    spec: [
      { state: "桌面", when: "useIsMobile() === false", visual: "D2-S3 定稿 1:1；段头眉行 + 48px 问句；主块裸放、副块进面板", source: "HomeStage · G1" },
      { state: "手机", when: "useIsMobile() === true", visual: "M-Full 1:1：单列、34px 问句、各段手机形态", source: "HomeStage hall-m · G4" },
    ],
  },
];

const Pair = ({ cases, desktopMin, mobileMin }: { cases: SectionCase[]; desktopMin?: number; mobileMin?: number }) => (
  <>
    <SectionFrame cases={cases} device="desktop" minHeight={desktopMin ?? 600} />
    <div className="mt-3">
      <SectionFrame cases={cases} device="mobile" minHeight={mobileMin ?? 800} />
    </div>
  </>
);

export const HOME_ALL_CASES: SectionCase[] = [
  ...HERO_CASES,
  ...SPORTS_CASES,
  ...REMIND_CASES,
  ...CRYPTO_CASES,
  ...STOCKS_CASES,
  ...DESK_CASES,
  ...MORE_CASES,
  ...LOADING_CASES,
  ...STAGE_CASES,
];

export const HomeAllSection = () => (
  <SectionWrapper
    id="home-all"
    title="首页 All 视图 · 状态字典（HA-1 … HA-22 + 规则台账 HA-R）"
    description="首页 All 改版（2026-11-09 定稿）：Hero → chip 行 → Quick Play 横幅 → Sports → Crypto → Stocks → Editor's Desk → More markets。每个 case 双帧（desktop 1280 / mobile 375），375 帧是组件自己的手机形态；文案 7 语，单帧网址加 &lang=zh-CN（ja / ko / ru / vi / zh-TW）看各语言；四栏表每行对着规则编号，规则原文在本节末 HA-R。chip 行 / Quick Play 横幅 / 行情 tape 见 Events 字典 EV-2 … EV-4 / Arcade 字典 / EV-33。"
  >
    <div className="space-y-12">
      <SubSection title="① Hero（HA-1）">
        <Pair cases={HERO_CASES} desktopMin={300} mobileMin={320} />
      </SubSection>
      <SubSection title="② Sports 四态（HA-2 … HA-5）">
        <Pair cases={SPORTS_CASES} desktopMin={1100} mobileMin={1300} />
      </SubSection>
      <SubSection title="②b Sports 状态④ · Remind me（HA-21a / b / c）">
        <Pair cases={REMIND_CASES} desktopMin={1100} mobileMin={1300} />
      </SubSection>
      <SubSection title="③ Crypto（HA-6 / HA-7）">
        <Pair cases={CRYPTO_CASES} desktopMin={700} mobileMin={900} />
      </SubSection>
      <SubSection title="④ Stocks 三种时刻（HA-8 … HA-10）">
        <Pair cases={STOCKS_CASES} desktopMin={600} mobileMin={800} />
      </SubSection>
      <SubSection title="⑤ Editor's Desk（HA-11 / HA-12）">
        <Pair cases={DESK_CASES} desktopMin={420} mobileMin={800} />
      </SubSection>
      <SubSection title="⑥ More markets（HA-13）">
        <Pair cases={MORE_CASES} desktopMin={700} mobileMin={1000} />
      </SubSection>
      <SubSection title="⑦ 首屏骨架（HA-22）">
        <Pair cases={LOADING_CASES} desktopMin={2400} mobileMin={4000} />
      </SubSection>
      <SubSection title="⑧ 整页（HA-14）">
        <Pair cases={STAGE_CASES} desktopMin={2400} mobileMin={4800} />
      </SubSection>
      <SubSection title="HA-R · 规则台账（= 交付文档 §规则 · 代码注释同编号）">
        <HomeRulesLedger />
      </SubSection>
    </div>
  </SectionWrapper>
);

export default HomeAllSection;
