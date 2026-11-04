/**
 * /arcade · Quick Play（BTC 30 秒合约 · 流式舞台 · 机柜皮肤）· 状态字典（AR-1 … AR-26 · AB-1 / AB-2 · AS-1 … AS-4）。
 *
 * 规则（Liya 2026-10-27 / 10-28 拍板，研发稿 v1.0 + 她的修订；2026-11-02 James 反馈轮修订）：先只上 BTC；没有「局」，
 * 每一枚筹码就是一张自己的 30 秒合约（t0 = 服务端接单时刻）；价格 = Binance / Hyperliquid / Coinbase 三所中间价
 * （USDT 计价）中位数；报价 = 研发稿模型 0.40–0.60；3% 开仓费含在筹码里、点下去就锁定（2026-11-04 起没有撤销）、
 * 不可平仓、盈利扣 5% 佣金、平局全退；$2–50 一注、单账户未到期 ≤ $500；连赢每满 3 把掉一张 $2 有门槛仓位券，每天 ≤ $10。
 * 框架同 SP / TB 系列：生产件（ArcadePage 引擎 + 入口横幅 + 海报）+ fixture 确定性注入——时钟冻结、指数序列固定、
 * 合约 / 路单 / 桌面 feed 写死、零网络（引擎 fixture 模式）。
 */
import { SectionWrapper, SubSection } from "../components/SectionWrapper";
import { SectionFrame, type SectionCase } from "../components/SectionFrame";

/* the voucher meter (James round 2, CPO 2026-11-04): one table, referenced by the frames that show each state */
const VOUCHER_SPEC = [
  { state: "未登录", when: "!userId", visual: "桌面 `Win 3 in a row = $2 voucher · up to $10 a day`；手机 `3 in a row = $2 voucher`；只有券图标，没有格子", source: "renderVouchers" },
  { state: "计数中", when: "登录 && vToday < cap", visual: "3 格亮 `streakW % 3` 格（输一把清零、void 不算、新一场清零——同服务端发券口径）；桌面 `3 more wins` / `2 more wins` / `1 more win → $2 voucher` ｜ `$4 / $10 today ›`；手机只有格子 + `$4 / $10 today ›`", source: "renderVouchers" },
  { state: "刚掉券", when: "掉券后 8 秒（vHold）", visual: "3 格全亮、框变亮发光；桌面 `+$2 voucher · it's in your Vouchers` ｜ `$6 / $10 today ›`；手机 `+$2 · $6 / $10 ›`；`+$2 VOUCHER` 飞牌落在框上", source: "comboUpdate / voucherFly" },
  { state: "今天满了", when: "vToday ≥ cap", visual: "框变暗、没有格子；桌面 `Today's $10 of vouchers claimed · more from 08:00`（UTC 零点换成用户本地时间）；手机 `$10 claimed today`", source: "renderVouchers" },
  { state: "加载中", when: "登录 && 服务端还没回今天的券额（进页 / 刚登录后约 1 秒）", visual: "框不变，3 格变暗（不亮格），桌面 / 手机同一句 `$— / $10 today ›`；服务端一回就换成上面对应的态——不许先闪 `$0`（2026-11-04 CPO 批）", source: "renderVouchers · S.vKnown" },
  { state: "点击", when: "任一态", visual: "→ Rewards › Vouchers", source: "api.vouchers" },
];

const CABINET: SectionCase[] = [
  {
    key: "arcade-ar1",
    label: "AR-1 · 第一次进来：免责门（每个账号只弹一次）",
    note:
      "登录后第一次进 `/arcade` 弹四行门：`Each chip = one 30-second call. Up or Down vs the price right after we take it.` / `Locked once you tap. No undo, no cash-out.` / `3% in · 5% of profit out. Ties refund in full.` / `High risk. $2–50 a call · $500 open max.`，一键 `I GET IT · START PLAYING`（写 `arcade_acks`），下面 `How the price and odds are made →` 打开七段完整规则。门后面是机柜本体：头条（`BTC · 30-second calls` + `Settles on the BTC Index ⓘ` / `TOTAL OPEN POSITIONS ⓘ Current $0 / Max $500` / `AVAILABLE · SPOT` / Deposit · Transfer · Rules）→ `01 / REPLAY` 路单条 → `02 / LIVE FEED` 舞台 + 右栏 → `03 / SELECT YOUR DIRECTION` → 猞猁窗。logo 板是唯一出口（无 ✕）。",
    spec: [
      { state: "免责门", when: "userId && !ack", visual: "钢板盒 + CRT 屏四行 + 黄绿大键；接受后不再弹", source: "arcadeEngine · openGate / data.acceptTerms" },
      { state: "头条", when: "always", visual: "题牌 26px；副题 `Settles on the BTC Index ⓘ`（ⓘ = BTC Index 怎么来的一句话）；`TOTAL OPEN POSITIONS ⓘ` 下 `Current $x / Max $500`（ⓘ = `You can have up to $500 in open calls at once. Room frees up as your calls settle.`）；`AVAILABLE · SPOT` 现货余额", source: "arcadeMarkup · .hbar / renderBoard / TIPS" },
      { state: "01 路单条", when: "always", visual: "2026-11-04 起：题牌 `01 / REPLAY · BTC EVERY 30 SECONDS` + 图例 `▲ Up ▼ Down`，右边一整块屏。屏头写一次时间段：`LAST 30 MIN` `15:22 → NOW` · `60 results — each dot or box = did BTC go up or down in that 30 seconds`。下面虚线分三格，读的是同一批最近 60 个结果：`BEAD · in order`（珠盘画满 60 个）/ `BIG ROAD ⓘ · in streaks`（列太多时格子 9 → 7px）/ `UP VS DOWN · the count`（`▲ Up 37 + 23 Down ▼ = 60` + 比例条 + `longest streak ▲ Up ×7` + `This 30s so far ▼ −$7.40 · 13s left` + 本格进度条）。珠盘、大路第一格上方钉起点时间，最新一个结果套白圈、上方钉 `NOW`；大路挤不下时起点钉写它真正的起点。珠盘、大路的点 / 格样子不变", source: "renderRoads / slotLoop" },
      { state: "大价 + 来源", when: "always", visual: "`BTC INDEX` 小标 + 白色大价 + 上一秒涨跌 ▲▼；下一行 `FROM Binance $x · Hyperliquid $x · Coinbase $x`（某家缺 → `—`，指数无效整行红）；自己没单时再一行 `▲ +$136.86 in the last 30s`", source: "renderPriceBig / renderPrice" },
      { state: "预览线", when: "自己没有开着的单（或 hover 一个键）", visual: "从现价往右 30 秒一条白虚线，终点竖线 + 旗 `if you call now · settles here`", source: "draw()" },
      { state: "右栏 · LIVE TABLE", when: "这一场还没下过单", visual: "`LIVE TABLE N · everyone's open calls` + `▲ UP · n $x` / `▼ DOWN · n $x` + 别人的匿名单 + 底部虚线框 `Tap UP or DOWN to start — your calls and results show here`；04 不显示", source: "renderRail / renderTable" },
      { state: "筹码盘 + 券计量条", when: "always", visual: "`$2 / 5 / 10 / 25 / 50`（$100 已删，$2 紫色筹码）；标头 `YOUR STAKE · PER CHIP` + `$5 SELECTED`，窄桌面（≤ 1120，本节 1040 宽的帧都是）只留 `YOUR STAKE · PER CHIP`、不显示 `$5 SELECTED`（选中的筹码自己高亮；2026-11-04 起，原来会被截成 `$5 S…`）；03 标题行右侧券计量条（2026-11-04 起实线亮框）：券图标 + 3 格（本场连赢数 % 3）+ `3 more wins → $2 voucher` ｜ `$0 / $10 today ›`，点 → Rewards › Vouchers。各态见下面「券计量条」", source: "renderChips / renderVouchers" },
    ],
  },
  {
    key: "arcade-ar2",
    label: "AR-2 · 开着 6 张合约（最新一张刚下）· COMBO ×2 · 券 $4 / $10",
    note:
      "图只画你自己的单：白色价格线（不按涨跌变色）、真实时间刻度每 15 秒、右侧价格刻度——白签 = 现价，青 / 绿签 = 最近 3 张未到期单的开仓价（带 ▲▼）。每张单 = 入场菱形 + 开仓虚线（领先 = 本方向色，落后 = 灰）+ 旗道里每张单一根杆 + 杆顶小三角（▲ 青 / ▼ 绿）+ 标签 `▲ 23s`；到期时间挨得近的共用一个标签 `▲▼ 23s ×2`（见 AR-20 … AR-23）。到期：赢 = 本方向色实心圆 ✓，输 = 灰空心圈 ✕，平局 = 灰横杠；结算旗 1.5 秒后收走。右栏第一笔起换成 `YOUR CALLS · only you see these`（黄绿标题闪一下），页签 `Open 6 · $125 in play` ｜ `Settled 3`；`04 / YOUR RESULT` 另起一块钢板放在右栏下面，内容和线上一样。",
    spec: [
      { state: "落筹", when: "tap UP / DOWN", visual: "筹码**立刻**进键上的堆；键上方弹白底 `+$5 ▲` 飘起。没有撤销（2026-11-04 起）：点下去就是一张 30 秒合约", source: "place / tapFloat / renderKeys" },
      { state: "刚下单", when: "t − t0 < 1.5 s", visual: "键底注 `Placed ✓ · locked in, settles in 30s`；1.5 秒内连下几笔 `3 placed ✓ · each settles in 30s`；之后回到平时底注。原 2 秒 UNDO 键与 0.15% 撤单费 2026-11-04 删除", source: "renderPays · PLACED_MS" },
      { state: "键底注 · 平时", when: "always", visual: "`$5 in · fee $0.15 · to win $9.43 if Up`（to win = 赢了拿回的钱，含本金，扣过佣金）", source: "renderPays · callCredit" },
      { state: "OPEN 行", when: "未到期", visual: "`▲ UP` + `$5 · to win $9.43` + 小字 `@ 51.2¢ · open $80,934.75 · 23s` + 进度条；右侧 `ahead`（白，第一秒起就显示）/ `behind`（灰）/ 结算后 `+$4.43`（绿）/ `−$5.00`（红）", source: "renderRail" },
      { state: "COMBO ×2", when: "连赢 2", visual: "图表头 `COMBO ×2` + `⇪ SHARE` 小键 + 白字 `WIN 1 MORE → FREE $2 VOUCHER`；输一把 HUD 直接消失（无 COMBO BREAK、无 LOST ×N）", source: "comboUpdate" },
      { state: "券计量条 · 计数中", when: "登录 && vToday < 10", visual: "实线亮框：券图标 + 3 格亮 2 格 + `1 more win → $2 voucher` ｜ `$4 / $10 today ›`", source: "renderVouchers · streakW % 3 / combo_today" },
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
    note: "一屏：顶栏（logo / `AVAILABLE · SPOT` 不折行 / `+` / RULES / 静音）→ `BTC · 30s calls · $价` + `OPEN POSITIONS $0 / $500 ⓘ` → 四格 BINANCE / HYPERLIQ. / COINBASE / BTC INDEX（不改）→ 舞台（白大价 + `▲ +$x in the last 30s` + 图，预览旗只写 `30s`）→ 筹码带 `LIVE TABLE N` → 筹码（`YOUR STAKE` 右侧券计量条；未登录 `3 in a row = $2 voucher`）→ UP / DOWN → `ROAD & STATS` 窥条。OPEN / LIVE / SESSION 三格第一笔之后才出现。",
    spec: [
      { state: "LIVE TABLE 带", when: "这一场没下过单", visual: "别人的筹码 + 倒数环", source: "renderRail · mobile strip" },
      { state: "三格", when: "下过单", visual: "OPEN / LIVE / SESSION 出现", source: "#mSb" },
    ],
  },
  {
    key: "arcade-ar5",
    label: "AR-5 · 移动版 · 开着 6 张合约",
    note: "筹码带切到 `MY CALLS 6`：每枚筹码外圈倒数环（方向色）+ 角标秒数；到期盖 ✓（白）/ ✕（灰）。YOUR STAKE 右边券计量条：3 格 + `$4 / $10 today ›`。",
    spec: [
      { state: "筹码带", when: "mine.length", visual: "最近 7 枚，环色 = 方向色，角标秒数 / `…` 结算中 / ✓ ✕ 已结", source: "renderRail · mobile strip" },
      { state: "券计量条", when: "登录 && vToday < cap", visual: "3 格 + `$4 / $10 today ›`", source: "renderVouchers" },
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
    spec: [{ state: "RULES", when: "Rules 键 / 免责门上的链接", visual: "一栏七段（2026-11-02 起）：左边编号 + 标题、右边正文，高度跟内容走，超出在框内滚动；1 The price · 2 Open and close · 3 The odds · 4 Payout & fees（例：$50 @ 53.0¢ → 净赚 $39.42 = 键上 to win $89.42；`No undo: a tapped chip is a call and runs its full 30 seconds.`）· 5 Limits & pauses（$2–50）· 6 Your record（Settled 页签 + Portfolio + 30 分钟一场）· 7 Combo vouchers；手机是底部抽屉，标题在正文上面", source: "#rules" }],
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
      { state: "掉券", when: "赢 && streak % 3 === 0 && 今天 + $2 ≤ $10", visual: "大字 `×3 COMBO` + `+$2 VOUCHER · IN YOUR VOUCHERS`；金币雨；黄绿 `+$2 VOUCHER` 从 HUD 飞到券计量条，计量条弹一下、3 格全亮、变 `+$2 voucher · it's in your Vouchers` ｜ `$4 / $10 today ›`，亮 8 秒后回到计数（`3 more wins → $2 voucher`）；HUD 副行 `YOU GOT A $2 VOUCHER!`。服务端在同一次结算发券（`arcade_combo_vouchers`，Rewards › Vouchers 里显示 `From Quick Play — 3 wins in a row`）", source: "comboUpdate / mega / voucherFly" },
      { state: "档位", when: "×3 / ×5 / ×8", visual: "×3 ON FIRE（闪）· ×5 UNSTOPPABLE（白热光 + 双倍金币 + 机柜抖）· ×8 LEGENDARY（流光字）；之后每 ×3 倍数再来", source: "comboTier / isMega" },
      { state: "分享", when: "HUD 亮着", visual: "`⇪ SHARE` → 站点 ShareModal + combo 海报（AS-2）；不会自己弹", source: "api.shareCombo" },
    ],
  },
  {
    key: "arcade-ar16",
    label: "AR-16 · ×5 · 今天 $10 已满",
    spec: [
      { state: "满额", when: "vToday ≥ 10", visual: "HUD 副行 `VOUCHERS MAXED TODAY · KEEP IT GOING`；券计量条变暗、不显示格子：`Today's $10 of vouchers claimed · more from 08:00`（本地时间）", source: "comboUpdate / renderVouchers" },
    ],
  },
];

const MORE_MOB: SectionCase[] = [
  {
    key: "arcade-ar10",
    label: "AR-10 · 移动版 · ROAD & STATS 抽屉打开",
    spec: [
      { state: "抽屉", when: "点窥条", visual: "钢板 sheet：标题行右侧图例 `▲ Up ▼ Down` → 一整块屏（2026-11-04）：屏头 `LAST 30 MIN 15:22 → NOW · 60 results` + 第二行 `Each dot or box = did BTC go up or down in that 30 seconds` → 虚线分三格 UP VS DOWN · BIG ROAD ⓘ · BEAD（同一批 60 个，带首尾钉）→ SESSION / LAST 10 / ⇪ SHARE → SETTLED → 猞猁 + 气泡（`▼ Down 4 times in a row — a streak is running.` / `Flip-flopping for the last 6 …` / `Mostly ▲ Up lately — 14 of the last 20.` / `Mixed — 10 up, 10 down in the last 20.`）", source: "sheetOpen / renderRoads / roadSay" },
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
    spec: [{ state: "HUD", when: "streak ≥ 2", visual: "右上小盒：`COMBO ×3` + `⇪` + 两行小字；券飞到 YOUR STAKE 旁的券计量条，计量条 3 格全亮 + `+$2 · $4 / $10 ›` 8 秒", source: "comboUpdate" }],
  },
  {
    key: "arcade-ar18",
    label: "AR-18 · 移动版 · ⓘ 说明是底部抽屉",
    spec: [{ state: "ⓘ", when: "点 ⓘ / 路单格", visual: "手机上 ⓘ 说明、格子提示、路单说明一律从底部升起（抓手 + 通栏），点别处关", source: ".is-m .tipbox / .is-m > .howto" }],
  },
  {
    key: "arcade-ar24",
    label: "AR-24 · 移动版 · 今天 $10 券已满",
    note: "James 第二轮（2026-11-04）：券计量条五态——未登录（AR-6 移动）/ 计数中（AR-5）/ 刚掉券（AR-17）/ 今天满了（本帧）/ 加载中（AR-25 桌面、AR-26 移动）。",
    spec: VOUCHER_SPEC,
  },
  {
    key: "arcade-ar25",
    label: "AR-25 · 桌面 · 券计量条加载中",
    note: "进页或刚登录后约 1 秒，服务端还没回今天的券额：框不变、格子变暗、`$— / $10 today ›`。这一帧的账号其实今天已满 $10——服务端一回就直接变成 AR-16 的样子，中间不出现 `$0`。",
    spec: VOUCHER_SPEC,
  },
  {
    key: "arcade-ar26",
    label: "AR-26 · 移动版 · 券计量条加载中",
    note: "同 AR-25，手机 YOUR STAKE 旁边那条：格子变暗 + `$— / $10 today ›`；服务端一回变成 AR-24。",
    spec: VOUCHER_SPEC,
  },
];

const SHARE: SectionCase[] = [
  {
    key: "arcade-as1",
    label: "AS-1 · 分享海报「Share your run」· 赚 / 亏 / 长金额",
    note: "设计师掌机稿（Figma omenx_lite 1283:1437，CPO 2026-11-02）：机壳渐变 → 黑色边框 → 屏幕（像素夜空 + 山）里放头像 + `⚡ 7 of 10 right` 徽章、青色 `QUICK PLAY` 框、`PROFIT` / `LOST` + Jersey 10 大字、人话两行 + `23 minutes · 10 calls · $5 each`、`Best run` / `Biggest win` 两格、猞猁；屏幕下 十字键 / 电源灯 / A·B 键；底部 `Referral: ALEX7K` + OmenX 字标 + `Pick UP or DOWN · from $2` + 二维码。按场分享，入口只有 `04 / YOUR RESULT` 标题行的 `⇪ SHARE`（≥1 笔结算才亮；手机在 ROAD & STATS 抽屉）。",
    spec: [
      { state: "赚", when: "pnl ≥ 0", visual: "黄绿 #CFFF4A：头像框、徽章 ⚡、PROFIT 大字（18px 同色光晕）、Best run 值、电源灯、B 键、CTA；撒金币猞猁", source: "ArcadeRunPoster" },
      { state: "亏", when: "pnl < 0", visual: "珊瑚红 #FF8B80：同上各处换色、徽章 📉、LOST；哭的猞猁（比赢的小一号、靠右下）", source: "ArcadeRunPoster" },
      { state: "长金额", when: "金额字符 > 7", visual: "大字 60 → 52（≤ 9 字符）→ 44px，永远不压到猞猁；猞猁在文字下层", source: "ArcadeRunPoster.bigSize" },
      { state: "导出", when: "Save / More Options", visual: "PNG 里 Jersey 10 / Archivo 是真字体（导出时把站内自托管的 woff2 以 data URL 嵌入），和预览一致", source: "arcadePosterFontCSS → ShareModal.fontEmbedCSS" },
    ],
  },
  {
    key: "arcade-as2",
    label: "AS-2 · combo 海报（过渡版 · 设计稿到了整张替换）",
    note: "字段 = 和 Liya 定给设计的那份：N 连对、这次 combo 赚了多少（净）、一句人话、本金、最大一笔、用户名 / QUICK PLAY / 推荐码 / 二维码 / logo。设计方向 B · Fever / E · Arcade score screen。",
    spec: [{ state: "combo", when: "HUD `⇪ SHARE`", visual: "徽章 `🔥 3 in a row`；小标 `COMBO ×3 · ON FIRE`；大字 `+$13.92`；`Called Bitcoin up or down — 3 right in a row`；`30 seconds a call · $15 staked`；两格 `Combo ×3` / `Biggest win +$4.71`", source: "ArcadeComboPoster / ArcadeComboShareCard" }],
  },
];

/* AS-3 / AS-4 · the share sheet open — one frame per case (the sheet portals to its frame's body) */
const SHEET_SPEC = [
  { state: "外壳", when: "桌面", visual: "440 宽、底 #14161A、描边 #1E2630、r18、padding 18、间距 14；遮罩 rgba(9,10,11,.8) + 4px 模糊", source: "ShareModal variant=\"arcade\"" },
  { state: "外壳", when: "手机", visual: "底部抽屉：宽 min(356, 100% − 34)、上圆角 14.5、左右上描边、底部留 24 + 安全区；海报按宽度等比缩小（≈ 0.82）", source: "同上" },
  { state: "标题", when: "always", visual: "Jersey 10 白字 `Share Your Run`（桌面 28 / 手机 24）；副标 12/500 #94A0AD——赚 `Save the card or post it straight to X / Telegram`，亏 `Rough one — share it anyway, we go again`；右上 ✕", source: "ArcadeRunShareSheet" },
  { state: "按键", when: "always", visual: "两列：Save · Copy Link / X · Telegram，底 #1B2228、描边 #1C1F26（桌面 r15 / 18px 字，手机 r12 / 14px 字）；整行 `More Options` 黄绿 #CFFF4A（系统支持分享时才有）", source: "ShareModal" },
  { state: "combo", when: "HUD `⇪ SHARE`", visual: "同一套外壳，里面是 AS-2 的过渡海报", source: "ArcadeComboShareCard" },
];
const SHEET_DESK: SectionCase[] = [
  { key: "arcade-as3-win", label: "AS-3 · 分享弹窗（桌面）· 赚", note: "Figma 1283:1437 左。", spec: SHEET_SPEC },
  { key: "arcade-as3-lose", label: "AS-3 · 分享弹窗（桌面）· 亏", note: "Figma 1283:1437 右。", spec: SHEET_SPEC },
];
const SHEET_MOB: SectionCase[] = [
  { key: "arcade-as4-win", label: "AS-4 · 分享抽屉（手机）· 赚", note: "Figma 1283:1841。", spec: SHEET_SPEC },
  { key: "arcade-as4-lose", label: "AS-4 · 分享抽屉（手机）· 亏", note: "Figma 1283:2110。", spec: SHEET_SPEC },
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

/* flag lane · a burst (CPO 2026-11-02 option A) */
const FLAG_SPEC = [
  { state: "杆", when: "每张未到期 / 刚结算的单", visual: "在自己的到期时刻立一根杆；杆与杆至少隔 4px（桌面 1 秒 ≈ 13px 用不到，手机 1 秒 ≈ 3.5px，同一秒连点两单时推开）；一组最多画 10 根，其余只计数", source: "draw() · flag lane" },
  { state: "杆顶记号", when: "杆顶", visual: "进行中：无字小三角，▲ 青朝上 / ▼ 绿朝下；结算中白三角；翻牌后变成价格线上同款记号——赢 = 本方向色实心点、输 = 灰空心圈、void = 灰横杠", source: "draw()" },
  { state: "开仓刻度", when: "未到期", visual: "价格线上每张单一个短竖线 + 一条淡虚线连到自己的杆（以前全叠在第一单位置）", source: "draw()" },
  { state: "标签 · 单独一张", when: "前后 3 秒（桌面）/ 9 秒（手机）内没有别的单", visual: "`▲ 23s` → 结算中 `…` → `✓` / `✕`", source: "draw()" },
  { state: "标签 · 一组", when: "到期时间相差 3 秒（桌面）/ 9 秒（手机）以内", visual: "进行中 `▲▼ 23s ×6`（23s = 这组最早到期那单，同方向写 ▲ 或 ▼）；翻牌中 `✓3 ✕1 · ▲▼ 1s`；全翻完 `✓4 ✕2`；标签不互相压，靠右边界时往左收", source: "draw()" },
  { state: "结算节奏", when: "每张到期", visual: "每根杆在自己的到期时刻翻、各飘一个 +$ / −$；整组在最后一根翻完 1.5 秒后一起离开", source: "reveal / flagFloat / draw()" },
];
const FLAGS_DESK: SectionCase[] = [
  { key: "arcade-ar20", label: "AR-20 · 旗道 · 5 秒连点 6 单（进行中）", note: "6 根杆排成梳子，开仓刻度各在各的位置；桌面 3 秒内到期的共用一个标签，所以这一串分成两段。", spec: FLAG_SPEC },
  { key: "arcade-ar21", label: "AR-21 · 旗道 · 同一串翻牌中（4 张已翻、2 张还开着）", note: "到期的四张已翻：小三角变成和价格线一样的记号——赢 = 本方向色实心点、输 = 灰空心圈（void = 灰横杠），留在原位；桌面这一串分两段标签：已翻完的一段 `✓3 ✕1`，还开着的一段 `▲▼ 1s ×2`（一段里有翻有开时，标签是已翻的计数 + 下一张的倒数，例如手机 AR-23 的 `✓3 ✕1 · ▲▼ 1s`）。整组在最后一张翻完 1.5 秒后一起离开。", spec: FLAG_SPEC },
];
const FLAGS_MOB: SectionCase[] = [
  { key: "arcade-ar22", label: "AR-22 · 移动版 · 5 秒连点 6 单", note: "手机 1 秒约 3.5px：6 根杆挤成一束（约 18px），一个标签 `▲▼ 23s ×6`。", spec: FLAG_SPEC },
  { key: "arcade-ar23", label: "AR-23 · 移动版 · 翻牌中", note: "手机上 6 张同属一组：标签 `✓3 ✕1 · ▲▼ 1s`，四个点 / 圈 + 两个还开着的小三角挤成一束。", spec: FLAG_SPEC },
];

export const ArcadeStatesSection = () => (
  <SectionWrapper
    id="arcade-states"
    title="/arcade · Quick Play（BTC 30 秒合约 · 流式舞台 · 机柜皮肤）· 状态字典（AR-1 … AR-26 · AB-1 / AB-2 · AS-1 … AS-4）"
    description="CPO 2026-10-27 / 10-28 拍板 + 2026-11-02 James 反馈轮（mock claude.ai/artifact/1hCirCctvs2VNkP2J5bUfC v17c）：先只上 BTC；每一枚筹码一张 30 秒合约；三所中位数指数；报价 0.40–0.60；3% 开仓费、没有撤销（2026-11-04）、不可平仓、盈利扣 5% 佣金、平局全退；$2–50 一注、单账户未到期 ≤ $500；连赢每 3 把一张 $2 有门槛仓位券、每天 ≤ $10。颜色只表示方向（青涨 / 柠檬绿跌），输赢看实心 / 空心与 ✓ / ✕。ETH / SOL / 美股桌隐藏。文案英文占位。"
  >
    <div className="rounded-lg border border-[#FF8A3D]/30 bg-[#FF8A3D]/5 px-3 py-2 text-[12px] text-foreground">
      交互契约：每筹一合约（t0 = 服务端接单）· 没有撤销（2026-11-04）· 无 Cash out · S0 = 接单后第一条有效指数、S1 = 到期前最近一条（等 2 s 迟到行情）。
      后端 <code className="font-mono">supabase/migrations/20261028120000_arcade_calls.sql</code> + <code className="font-mono">20261102180000_arcade_combo_vouchers.sql</code>（`arcade_combo_vouchers`、`arcade_table_now().combo_today`、`arcade_params.combo_voucher_*`）。
    </div>
    <SubSection title="机柜（AR-1 … AR-3，桌面 1440 → 缩放 72%）">
      <Desk cases={CABINET} min={700} />
    </SubSection>
    <SubSection title="移动版（AR-4 / AR-5）">
      <Mob cases={MOBILE} min={780} />
    </SubSection>
    <SubSection title="旗道 · 连发（AR-20 / AR-21 桌面 · AR-22 / AR-23 移动）">
      <Desk cases={FLAGS_DESK} min={700} />
      <Mob cases={FLAGS_MOB} min={780} />
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
    <SubSection title="分享弹窗 / 抽屉（AS-3 桌面 · AS-4 手机，一态一帧）">
      {SHEET_DESK.map((c) => (
        <Desk key={c.key} cases={[c]} min={900} />
      ))}
      {SHEET_MOB.map((c) => (
        <Mob key={c.key} cases={[c]} min={820} />
      ))}
    </SubSection>
    <SubSection title="附注 · 本轮不做 / 演示引擎放宽">
      <ul className="list-disc space-y-1 pl-5 text-[12px] text-muted-foreground">
        <li>演示行情约 2 s 一条 / 报价有效 4.5 s / 指数过期 6 s / 模型历史 60 条起（研发稿 500 ms / 500 ms / 600 s）——Lovable 演示用，`arcade_params` 可调；正式版照交付文档 §3.1。</li>
        <li>演示桌永远能交易：行情停顿时服务端补合成 tick，熔断 / 亏损上限 / 全桌上限在演示桌拨到够不着；AR-3 的暂停是 fixture。</li>
        <li>combo 海报是过渡版（AS-2），设计稿到了整张替换；文案词典 review 后续一轮。</li>
        <li>ETH / SOL / 美股桌隐藏（`ARCADE_LIVE_TABLES`）。</li>
      </ul>
    </SubSection>
  </SectionWrapper>
);
