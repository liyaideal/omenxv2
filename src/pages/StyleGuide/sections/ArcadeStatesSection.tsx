/**
 * /arcade · Quick Play（BTC 30 秒合约 · 流式舞台 · 机柜皮肤）· 状态字典（AR-1 … AR-19 · AB-1 / AB-2 · AS-1 / AS-2）。
 *
 * 规则（Liya 2026-10-27 / 10-28 拍板，研发稿 v1.0 + 她的修订；2026-11-02 James 反馈轮修订）：先只上 BTC；没有「局」，
 * 每一枚筹码就是一张自己的 30 秒合约（t0 = 服务端接单时刻）；价格 = Binance / Hyperliquid / Coinbase 三所中间价
 * （USDT 计价）中位数；报价 = 研发稿模型 0.40–0.60；3% 开仓费含在筹码里、2 秒内可撤（收 0.15% 平仓费，算到 4 位小数）、
 * 不可平仓、盈利扣 5% 佣金、平局全退；$2–50 一注、单账户未到期 ≤ $500；连赢每满 3 把掉一张 $2 有门槛仓位券，每天 ≤ $10。
 * 框架同 SP / TB 系列：生产件（ArcadePage 引擎 + 入口横幅 + 海报）+ fixture 确定性注入——时钟冻结、指数序列固定、
 * 合约 / 路单 / 桌面 feed 写死、零网络（引擎 fixture 模式）。
 */
import { SectionWrapper, SubSection } from "../components/SectionWrapper";
import { SectionFrame, type SectionCase } from "../components/SectionFrame";

const CABINET: SectionCase[] = [
  {
    key: "arcade-ar1",
    label: "AR-1 · 第一次进来：免责门（每个账号只弹一次）",
    note:
      "登录后第一次进 `/arcade` 弹四行门：`Each chip = one 30-second call` / `2 seconds to cancel · no cash-out` / `3% in · 5% of profit out · ties refund` / `High risk · $2–50 a call · $500 open max`，一键 `I GET IT · START PLAYING`（写 `arcade_acks`），下面 `How the price and odds are made →` 打开六段完整规则。门后面是机柜本体：头条（`BTC · 30-second calls` + `Settles on the BTC Index ⓘ` / `TOTAL OPEN POSITIONS ⓘ Current $0 / Max $500` / `AVAILABLE · SPOT` / Deposit · Transfer · Rules）→ `01 / REPLAY` 路单条 → `02 / LIVE FEED` 舞台 + 右栏 → `03 / SELECT YOUR DIRECTION` → 猞猁窗。logo 板是唯一出口（无 ✕）。",
    spec: [
      { state: "免责门", when: "userId && !ack", visual: "钢板盒 + CRT 屏四行 + 黄绿大键；接受后不再弹", source: "arcadeEngine · openGate / data.acceptTerms" },
      { state: "头条", when: "always", visual: "题牌 26px；副题 `Settles on the BTC Index ⓘ`（ⓘ = BTC Index 怎么来的一句话）；`TOTAL OPEN POSITIONS ⓘ` 下 `Current $x / Max $500`（ⓘ = `You can have up to $500 in open calls at once. Room frees up as your calls settle.`）；`AVAILABLE · SPOT` 现货余额", source: "arcadeMarkup · .hbar / renderBoard / TIPS" },
      { state: "01 路单条", when: "always", visual: "四块同一骨架：标题行 / 内容 / 时间脚。`01 / REPLAY · WHAT HAPPENED` 下图例 `▲ Up ▼ Down`（珠盘和大路共用）；`BEAD · LAST N` 6 列 + `← 07:45 · now →`；`BIG ROAD ⓘ · BTC's direction, every 30 seconds` + `← 07:40 · now →`；`LAST 30 MIN`（最近 60 格）`▲ Up 28 · 32 Down ▼` + 比例条 + `longest run ▼ Down ×7`（按方向着色）+ 脚 `Now ▲ +$10.90 · 7s left` + 本格进度条", source: "renderRoads / slotLoop" },
      { state: "大价 + 来源", when: "always", visual: "`BTC INDEX` 小标 + 白色大价 + 上一秒涨跌 ▲▼；下一行 `FROM Binance $x · Hyperliquid $x · Coinbase $x`（某家缺 → `—`，指数无效整行红）；自己没单时再一行 `▲ +$136.86 in the last 30s`", source: "renderPriceBig / renderPrice" },
      { state: "预览线", when: "自己没有开着的单（或 hover 一个键）", visual: "从现价往右 30 秒一条白虚线，终点竖线 + 旗 `if you call now · settles here`", source: "draw()" },
      { state: "右栏 · LIVE TABLE", when: "这一场还没下过单", visual: "`LIVE TABLE N · everyone's open calls` + `▲ UP · n $x` / `▼ DOWN · n $x` + 别人的匿名单 + 底部虚线框 `Tap UP or DOWN to start — your calls and results show here`；04 不显示", source: "renderRail / renderTable" },
      { state: "筹码盘 + 券条", when: "always", visual: "`$2 / 5 / 10 / 25 / 50`（$100 已删，$2 紫色筹码）；03 标题行右侧虚线券条 `Win 3 in a row = $2 voucher · up to $10 a day`，点 → Rewards › Vouchers", source: "renderChips / renderVouchers" },
    ],
  },
  {
    key: "arcade-ar2",
    label: "AR-2 · 开着 6 张合约（最新一张在 2 秒 UNDO 里）· COMBO ×2 · 券 $4 / $10",
    note:
      "图只画你自己的单：白色价格线（不按涨跌变色）、真实时间刻度每 15 秒、右侧价格刻度——白签 = 现价，青 / 绿签 = 最近 3 张未到期单的开仓价（带 ▲▼）。每张单 = 入场菱形 + 开仓虚线（领先 = 本方向色，落后 = 灰）+ 旗道一面旗 `▲ 23s`（同一秒到期合并 `2 calls`）。到期：赢 = 本方向色实心圆 ✓，输 = 灰空心圈 ✕，平局 = 灰横杠；结算旗 1.5 秒后收走。右栏第一笔起换成 `YOUR CALLS · only you see these`（黄绿标题闪一下），页签 `Open 6 · $125 in play` ｜ `Settled 3`；`04 / YOUR RESULT` 另起一块钢板放在右栏下面，内容和线上一样。",
    spec: [
      { state: "落筹", when: "tap UP / DOWN", visual: "筹码**立刻**进键上的堆（2 秒 UNDO 期内也在）；键上方弹白底 `+$5 ▲` 飘起", source: "place / tapFloat / renderKeys" },
      { state: "UNDO", when: "t − t0 < 2 s", visual: "键右下黑色 `UNDO 1.6s`（底部金色进度条倒数）；2 秒内连下几笔 `UNDO (3)`，点一下撤最近一笔；底注 `Placed ✓ · undo costs $0.0075` / `3 placed ✓ · undo removes the latest`；撤后 toast `Cancelled · $0.0075 close fee`", source: "renderKeys / renderPays / cancel" },
      { state: "键底注 · 平时", when: "always", visual: "`$5 in · fee $0.15 · to win $9.43 if Up`（to win = 赢了拿回的钱，含本金，扣过佣金）", source: "renderPays · callCredit" },
      { state: "OPEN 行", when: "未到期", visual: "`▲ UP` + `$5 · to win $9.43` + 小字 `@ 51.2¢ · open $80,934.75 · 23s` + 进度条；右侧 `undo…` / `ahead`（白）/ `behind`（灰）/ 结算后 `+$4.43`（绿）/ `−$5.00`（红）", source: "renderRail" },
      { state: "COMBO ×2", when: "连赢 2", visual: "图表头 `COMBO ×2` + `⇪ SHARE` 小键 + 白字 `WIN 1 MORE → FREE $2 VOUCHER`；输一把 HUD 直接消失（无 COMBO BREAK、无 LOST ×N）", source: "comboUpdate" },
      { state: "券条 · 今天已得", when: "0 < vToday < 10", visual: "`Vouchers today $4 / $10 · View ›`", source: "renderVouchers · combo_today" },
    ],
  },
  {
    key: "arcade-ar3",
    label: "AR-3 · 桌子暂停（指数无效）· 猞猁跑酷",
    note: "指数无效 / 熔断 / 亏损触顶 / 全桌满额 → 新单暂停，已开的单照常倒数、照常结算；图上遮罩 `TABLE PAUSED` + 原因 + `Open calls keep running and settle as normal`，预览线不画，来源行变红；桌面猞猁窗变跑酷。",
    spec: [
      { state: "暂停", when: "state.paused_reason || tick 过期", visual: "遮罩 + 键灰 + 来源行红 + 键底注写原因", source: "poll / renderPrice / renderPays" },
      { state: "跑酷", when: "paused（桌面）", visual: "星空加速、地面、带火尾的像素陨石；分数 = 存活 0.1 s 计 1", source: "Lx.gameStart / gameTick" },
    ],
  },
];

const MOBILE: SectionCase[] = [
  {
    key: "arcade-ar4",
    label: "AR-4 · 移动版 · 这一场还没下过单（LIVE TABLE 筹码带）",
    note: "一屏：顶栏（logo / `AVAILABLE · SPOT` 不折行 / `+` / RULES / 静音）→ `BTC · 30s calls · $价` + `OPEN POSITIONS $0 / $500 ⓘ` → 四格 BINANCE / HYPERLIQ. / COINBASE / BTC INDEX（不改）→ 舞台（白大价 + `▲ +$x in the last 30s` + 图，预览旗只写 `30s`）→ 筹码带 `LIVE TABLE N` → 筹码（`YOUR STAKE` 右侧券条 `3 wins in a row = $2 voucher`）→ UP / DOWN → `ROAD & STATS` 窥条。OPEN / LIVE / SESSION 三格第一笔之后才出现。",
    spec: [
      { state: "LIVE TABLE 带", when: "这一场没下过单", visual: "别人的筹码 + 倒数环", source: "renderRail · mobile strip" },
      { state: "三格", when: "下过单", visual: "OPEN / LIVE / SESSION 出现", source: "#mSb" },
    ],
  },
  {
    key: "arcade-ar5",
    label: "AR-5 · 移动版 · 开着 6 张合约",
    note: "筹码带切到 `MY CALLS 6`：每枚筹码外圈倒数环（方向色）+ 角标秒数；到期盖 ✓（白）/ ✕（灰）。键上 UNDO 26px 高。",
    spec: [
      { state: "筹码带", when: "mine.length", visual: "最近 7 枚，环色 = 方向色，角标秒数 / `…` 结算中 / ✓ ✕ 已结", source: "renderRail · mobile strip" },
      { state: "券条", when: "vToday > 0", visual: "`Vouchers $4 / $10 today ›`", source: "renderVouchers" },
    ],
  },
];

const GUEST: SectionCase[] = [
  {
    key: "arcade-ar6",
    label: "AR-6 · 未登录进机柜（桌面 / 移动）",
    note: "未登录不是一个空账户：`AVAILABLE · SPOT` 显示 `—`，Deposit / Transfer 换成一枚 `→ Sign in`（移动端 `SIGN IN`），点它和点 UP / DOWN 一样弹登录（桌面弹窗 / 手机底部抽屉）。右栏是 LIVE TABLE，预览线照画。",
    spec: [
      { state: "未登录头条", when: "!api.userId", visual: "`AVAILABLE · SPOT —`；键区只剩 `→ Sign in` + Rules", source: "renderAuth()" },
      { state: "路单格子", when: "hover（桌面）/ tap（手机）", visual: "提示框 `▲ Up +$12.00` + `07:49:00 – 07:49:30`；没有指数的格 `No index print · colour carried over`", source: "cellTip / showTip" },
    ],
  },
];

const MORE_DESK: SectionCase[] = [
  {
    key: "arcade-ar7",
    label: "AR-7 · 下过单、手上没有开着的单 · 连输三把（不显示任何连输提示）",
    note: "这一场下过单就一直是 YOUR CALLS（30 分钟没下单 = 场结束，才回到 LIVE TABLE）。Open 页签空 → 虚线框 `No open calls · tap UP or DOWN`。连输不出 HUD、不红闪，Last 10 里照样有 ✕（灰框）。",
    spec: [
      { state: "Open 空", when: "mineView && open.length === 0", visual: "`No open calls · tap UP or DOWN`", source: "renderRail" },
      { state: "Last 10", when: "always", visual: "赢 = 白底 ✓，输 = 灰框 ✕（颜色不再表示输赢）", source: "renderBoard · .ticks" },
    ],
  },
  {
    key: "arcade-ar8",
    label: "AR-8 · 点中（或 hover）路单一格",
    spec: [{ state: "格子提示", when: "hover / tap 格子", visual: "青边黑底小框：`▲ Up +$12.00`（方向色）+ `07:49:00 – 07:49:30`；没有指数的格 `No index print · colour carried over`；点别处关", source: "cellTip / showTip" }],
  },
  {
    key: "arcade-ar19",
    label: "AR-19 · Big road ⓘ：路单说明打开",
    spec: [{ state: "说明框", when: "点 Big road 的 ⓘ（同时收起格子提示）", visual: "520px 黑底黄绿边：Dragon / Chop / Break + 底注；点别处关", source: "howto · position: fixed" }],
  },
  {
    key: "arcade-ar9",
    label: "AR-9 · RULES 弹层",
    spec: [{ state: "RULES", when: "Rules 键 / 免责门上的链接", visual: "两列六段；第 5 段 `$2–50 per call · $500 open per account`", source: "#rules" }],
  },
  {
    key: "arcade-ar12",
    label: "AR-12 · 没下过单 · 鼠标停在 UP 上：预览线染青",
    spec: [{ state: "hover 预览", when: "桌面 mouseenter UP / DOWN", visual: "预览线上方（UP）/ 下方（DOWN）染方向色，线上写 `▲ UP wins if BTC ends above` / `▼ DOWN wins if BTC ends below`；有开着的单时 hover 也会画", source: "draw() · S.hover" }],
  },
  {
    key: "arcade-ar13",
    label: "AR-13 · YOUR CALLS · Settled 页签",
    spec: [
      { state: "Settled", when: "点 Settled", visual: "本场已结（最多 30）：`▲ UP $5 @ 51.2¢ · won` + 小字 `open 80,934.75 · close 80,950.10` + 右侧 `+$4.43` / `−$5.00` / `VOID`；底部 `All settled calls → Portfolio`", source: "renderRail · #dDone" },
      { state: "Settled 空", when: "S.done.length === 0", visual: "`Nothing settled yet this session`", source: "#dDoneHint" },
    ],
  },
  {
    key: "arcade-ar14",
    label: "AR-14 · 到 $500 上限 · 列表溢出",
    spec: [
      { state: "上限", when: "openStake + chip > 500", visual: "两键底注 `Limit reached · $500 in play · room frees up as your calls settle`，超额的筹码置灰；硬点同句 toast", source: "renderPays / place" },
      { state: "溢出", when: "列表放不下", visual: "底部渐隐 + 白色小键 `↓ 3 more`，点一下滚到底", source: "#dMore" },
    ],
  },
  {
    key: "arcade-ar15",
    label: "AR-15 · ×3 COMBO：掉一张 $2 券",
    spec: [
      { state: "掉券", when: "赢 && streak % 3 === 0 && 今天 + $2 ≤ $10", visual: "大字 `×3 COMBO` + `+$2 VOUCHER · IN YOUR VOUCHERS`；金币雨；黄绿 `+$2 VOUCHER` 从 HUD 飞到券条，券条弹一下变 `$4 / $10`；HUD 副行 `YOU GOT A $2 VOUCHER!`。服务端在同一次结算发券（`arcade_combo_vouchers`，Rewards › Vouchers 里显示 `From Quick Play — 3 wins in a row`）", source: "comboUpdate / mega / voucherFly" },
      { state: "档位", when: "×3 / ×5 / ×8", visual: "×3 ON FIRE（闪）· ×5 UNSTOPPABLE（白热光 + 双倍金币 + 机柜抖）· ×8 LEGENDARY（流光字）；之后每 ×3 倍数再来", source: "comboTier / isMega" },
      { state: "分享", when: "HUD 亮着", visual: "`⇪ SHARE` → 站点 ShareModal + combo 海报（AS-2）；不会自己弹", source: "api.shareCombo" },
    ],
  },
  {
    key: "arcade-ar16",
    label: "AR-16 · ×5 · 今天 $10 已满",
    spec: [
      { state: "满额", when: "vToday ≥ 10", visual: "HUD 副行 `VOUCHERS MAXED TODAY · KEEP IT GOING`；券条 `Today's $10 of vouchers claimed · resets 00:00 UTC`", source: "comboUpdate / renderVouchers" },
    ],
  },
];

const MORE_MOB: SectionCase[] = [
  {
    key: "arcade-ar10",
    label: "AR-10 · 移动版 · ROAD & STATS 抽屉打开",
    spec: [
      { state: "抽屉", when: "点窥条", visual: "钢板 sheet：标题行右侧图例 `▲ Up ▼ Down` → 三张卡（LAST 30 MIN · BIG ROAD ⓘ · BEAD，各带时间脚）→ SESSION / LAST 10 / ⇪ SHARE → SETTLED → 猞猁 + 气泡（`▼ Down 4 boxes in a row — a streak is running.` / `Flip-flopping …` / `Mostly ▲ Up lately …` / `Mixed …`）", source: "sheetOpen / renderRoads / roadSay" },
    ],
  },
  {
    key: "arcade-ar11",
    label: "AR-11 · 移动版 · 免责门",
    spec: [{ state: "免责门", when: "userId && !ack（连续两次轮询）", visual: "底部抽屉，内容同 AR-1（`$2–50 a call`）", source: "openGate" }],
  },
  {
    key: "arcade-ar17",
    label: "AR-17 · 移动版 · ×3 掉券",
    spec: [{ state: "HUD", when: "streak ≥ 2", visual: "右上小盒：`COMBO ×3` + `⇪` + 两行小字；券飞到 YOUR STAKE 旁的券条", source: "comboUpdate" }],
  },
  {
    key: "arcade-ar18",
    label: "AR-18 · 移动版 · ⓘ 说明是底部抽屉",
    spec: [{ state: "ⓘ", when: "点 ⓘ / 路单格", visual: "手机上 ⓘ 说明、格子提示、路单说明一律从底部升起（抓手 + 通栏），点别处关", source: ".is-m .tipbox / .is-m > .howto" }],
  },
];

const SHARE: SectionCase[] = [
  {
    key: "arcade-as1",
    label: "AS-1 · 分享海报「Share your run」· 赚 / 亏",
    note: "按场分享，入口只有 `04 / YOUR RESULT` 标题行的 `⇪ SHARE`（≥1 笔结算才亮；手机在 ROAD & STATS 抽屉）。CTA `Pick UP or DOWN · from $2`。",
    spec: [
      { state: "赚", when: "pnl ≥ 0", visual: "黄绿：`Profit +$83.57`、徽章 ⚡、撒金币猞猁", source: "ArcadeRunPoster" },
      { state: "亏", when: "pnl < 0", visual: "红：`Lost −$21.40`、徽章 📉、哭的猞猁", source: "ArcadeRunPoster" },
    ],
  },
  {
    key: "arcade-as2",
    label: "AS-2 · combo 海报（过渡版 · 设计稿到了整张替换）",
    note: "字段 = 和 Liya 定给设计的那份：N 连对、这次 combo 赚了多少（净）、一句人话、本金、最大一笔、用户名 / QUICK PLAY / 推荐码 / 二维码 / logo。设计方向 B · Fever / E · Arcade score screen。",
    spec: [{ state: "combo", when: "HUD `⇪ SHARE`", visual: "徽章 `🔥 3 in a row`；小标 `COMBO ×3 · ON FIRE`；大字 `+$13.92`；`Called Bitcoin up or down — 3 right in a row`；`30 seconds a call · $15 staked`；两格 `Combo ×3` / `Biggest win +$4.71`", source: "ArcadeComboPoster / ArcadeComboShareCard" }],
  },
];

const BANNER: SectionCase[] = [
  {
    key: "arcade-ab1",
    label: "AB-1 · Events All 入口横幅（桌面 · 方案 C 像素夜景）· 活体 / 指数无效",
    note: "CPO 2026-10-28 选入口比稿方案 C：124px 像素夜景 + 指数线 + 猞猁；本轮未改。",
    spec: [
      { state: "活体", when: "tick valid && p_up", visual: "夜景 + 指数线 + 猞猁；`TIME 00:22` 按墙钟 30 秒循环；`▲ UP 51.2¢ · ▼ DOWN 48.8¢`", source: "ArcadeEntryBanner" },
      { state: "指数无效", when: "!live", visual: "副行红字 `INDEX INVALID…`、时钟红闪、报价 `—`", source: "同上（.qpc.off）" },
    ],
  },
  {
    key: "arcade-ab2",
    label: "AB-2 · 入口横幅（移动 · 方案 C 竖排）· 活体 / 指数无效",
    spec: [
      { state: "活体", when: "live", visual: "竖排六段；猞猁在底部路面", source: "ArcadeEntryBanner (isMobile · .qpc.m)" },
      { state: "指数无效", when: "!live", visual: "同桌面", source: "同上" },
    ],
  },
];

const Desk = ({ cases, min }: { cases: SectionCase[]; min: number }) => (
  <div className="space-y-3">
    <SectionFrame cases={cases} device="desktop" minHeight={min} />
  </div>
);
const Mob = ({ cases, min }: { cases: SectionCase[]; min: number }) => (
  <div className="space-y-3">
    <SectionFrame cases={cases} device="mobile" minHeight={min} />
  </div>
);

export const ArcadeStatesSection = () => (
  <SectionWrapper
    id="arcade-states"
    title="/arcade · Quick Play（BTC 30 秒合约 · 流式舞台 · 机柜皮肤）· 状态字典（AR-1 … AR-19 · AB-1 / AB-2 · AS-1 / AS-2）"
    description="CPO 2026-10-27 / 10-28 拍板 + 2026-11-02 James 反馈轮（mock claude.ai/artifact/1hCirCctvs2VNkP2J5bUfC v17c）：先只上 BTC；每一枚筹码一张 30 秒合约；三所中位数指数；报价 0.40–0.60；3% 开仓费、2 秒可撤（0.15%，4 位小数）、不可平仓、盈利扣 5% 佣金、平局全退；$2–50 一注、单账户未到期 ≤ $500；连赢每 3 把一张 $2 有门槛仓位券、每天 ≤ $10。颜色只表示方向（青涨 / 柠檬绿跌），输赢看实心 / 空心与 ✓ / ✕。ETH / SOL / 美股桌隐藏。文案英文占位。"
  >
    <div className="rounded-lg border border-[#FF8A3D]/30 bg-[#FF8A3D]/5 px-3 py-2 text-[12px] text-foreground">
      交互契约：每筹一合约（t0 = 服务端接单）· 2 s 可撤（0.15%，4 位小数）· 无 Cash out · S0 = 接单后第一条有效指数、S1 = 到期前最近一条（等 2 s 迟到行情）。
      后端 <code className="font-mono">supabase/migrations/20261028120000_arcade_calls.sql</code> + <code className="font-mono">20261102180000_arcade_combo_vouchers.sql</code>（`arcade_combo_vouchers`、`arcade_table_now().combo_today`、`arcade_params.combo_voucher_*`）。
    </div>
    <SubSection title="机柜（AR-1 … AR-3，桌面 1440 → 缩放 72%）">
      <Desk cases={CABINET} min={700} />
    </SubSection>
    <SubSection title="移动版（AR-4 / AR-5）">
      <Mob cases={MOBILE} min={780} />
    </SubSection>
    <SubSection title="右栏 / 预览线 / 上限 / combo 与券 / 说明框 / RULES（AR-7 … AR-9 · AR-12 … AR-16 · AR-19，桌面）">
      <Desk cases={MORE_DESK} min={700} />
    </SubSection>
    <SubSection title="移动版 · 抽屉 / 免责门 / 掉券 / ⓘ（AR-10 / AR-11 / AR-17 / AR-18）">
      <Mob cases={MORE_MOB} min={780} />
    </SubSection>
    <SubSection title="未登录（AR-6）">
      <Desk cases={GUEST} min={700} />
      <Mob cases={[{ ...GUEST[0], key: "arcade-ar6-mobile", label: `${GUEST[0].label}（移动）` }]} min={780} />
    </SubSection>
    <SubSection title="入口横幅（AB-1 / AB-2）">
      <Desk cases={[BANNER[0]]} min={280} />
      <Mob cases={[BANNER[1]]} min={320} />
    </SubSection>
    <SubSection title="分享海报（AS-1 · AS-2）">
      <Desk cases={SHARE} min={520} />
    </SubSection>
    <SubSection title="附注 · 本轮不做 / 演示引擎放宽">
      <ul className="list-disc space-y-1 pl-5 text-[12px] text-muted-foreground">
        <li>采样 ≈ 1.2 s / 报价有效 4.5 s / 指数过期 6 s / 模型历史 120 s 起（研发稿 500 ms / 500 ms / 600 s）——Supabase pg_cron + pg_net 的上限，`arcade_params` 可调。</li>
        <li>演示桌永远能交易：行情停顿时服务端补合成 tick，熔断 / 亏损上限 / 全桌上限在演示桌拨到够不着；AR-3 的暂停是 fixture。</li>
        <li>combo 海报是过渡版（AS-2），设计稿到了整张替换；文案词典 review 后续一轮。</li>
        <li>ETH / SOL / 美股桌隐藏（`ARCADE_LIVE_TABLES`）。</li>
      </ul>
    </SubSection>
  </SectionWrapper>
);
