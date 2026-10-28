/**
 * /arcade · Quick Play v2（BTC 30 秒合约 · 流式舞台 · 机柜皮肤）· 状态字典（AR-1 … AR-5 + AB-1 / AB-2）。
 *
 * 规则（Liya 2026-10-27 / 10-28 拍板，研发稿 v1.0 + 她的修订）：先只上 BTC；没有「局」，每一枚筹码就是一张
 * 自己的 30 秒合约（t0 = 服务端接单时刻）；价格 = Binance / Hyperliquid / Coinbase 三所中间价（USDT 计价）
 * 中位数；报价 = 研发稿模型 0.40–0.60；3% 开仓费含在筹码里、2 秒内可取消（收 0.15% 平仓费）、不可平仓、
 * 盈利扣 5% 佣金、平局全退；$5–100 一注、单账户未到期 ≤ $500、全桌最坏损失 ≤ $10,000。
 * 框架同 SP / TB 系列：生产件（ArcadePage 引擎 + 入口横幅）+ fixture 确定性注入——时钟冻结、指数序列固定、
 * 合约 / 路单 / 桌面 feed 写死、零网络（引擎 fixture 模式）。
 */
import { SectionWrapper, SubSection } from "../components/SectionWrapper";
import { SectionFrame, type SectionCase } from "../components/SectionFrame";

const CABINET: SectionCase[] = [
  {
    key: "arcade-ar1",
    label: "AR-1 · 第一次进来：免责门（每个账号只弹一次）",
    note:
      "登录后第一次进 `/arcade` 弹四行门：`Each chip = one 30-second call` / `2 seconds to cancel · no cash-out` / `3% in · 5% of profit out · ties refund` / `High risk · $5–100 a call · $500 open max`，一键 `I GET IT · START PLAYING`（写 `arcade_acks`），下面 `How the price and odds are made →` 打开六段完整规则（价格怎么算、开盘 / 收盘怎么取、赔率模型、派彩与费用、限额与暂停、记录）。未登录先走登录弹窗再弹门。门后面是机柜本体：头条（题牌 `BTC · 30-second calls` / YOUR OPEN / AVAILABLE · SPOT / Deposit · Transfer · Rules）→ `01 / REPLAY` 路单条（珠盘 + 大路 + Up/Down 统计 + THIS SLOT）→ `02 / LIVE FEED` 舞台 + 右栏（MY CALLS / TABLE 页签，底部 `04 / YOUR RESULT` 记分板）→ `03 / SELECT YOUR DIRECTION` UP / 筹码 / DOWN → 猞猁窗。桌面只有这四行，图表行吃掉剩余高度（最矮 400px）：1080p 一屏全见，13 寸本滚到猞猁。logo 板是唯一出口（无 ✕）。",
    spec: [
      { state: "免责门", when: "userId && !ack", visual: "钢板盒 + CRT 屏四行 + 黄绿大键；接受后不再弹", source: "arcadeEngine · openGate / data.acceptTerms" },
      { state: "RULES 弹层", when: "Rules 键 / 门上链接", visual: "两列六段：1 The price · 2 Open and close · 3 The odds · 4 Payout & fees（$100 @ 53.0¢ 例：派彩 183.01、利润 83.01 − 5% = 78.86）· 5 Limits & pauses · 6 Your record", source: "arcadeMarkup · ARCADE_OVERLAYS #rules" },
      { state: "头条", when: "always", visual: "`YOUR OPEN $0 / $500` 随未到期总额更新；`AVAILABLE · SPOT` 现货余额，入账 bump；三键 Deposit（黄绿）/ Transfer / Rules（青）", source: "renderBoard / bumpEq" },
      { state: "三来源价", when: "always", visual: "大价下一行 `BINANCE $x · HYPERLIQUID $x · COINBASE $x · LIVE · 3 of 3`；某家缺 → `—`；指数无效整行变红 `INDEX INVALID · 原因`", source: "renderPrice" },
      { state: "筹码盘", when: "always", visual: "`YOUR STAKE · PER CHIP` + `$5 SELECTED`；$5 / 10 / 25 / 50 / 100（$500 已删），超单账户 $500 的档位置灰", source: "renderChips" },
    ],
  },
  {
    key: "arcade-ar2",
    label: "AR-2 · 开着 6 张合约（一张还能取消）· 3 张已结 · 会话 +$",
    note:
      "舞台 = 时间轴：左 45 秒过去、右 30 秒未来；每张合约 = 入场菱形（S0）+ 开盘虚线（领先 = 本色、落后 = 灰）+ 旗道里一面到期旗（剩余秒数；同一秒到期的合并 `×N`；旗与虚线之间有垂线连到价格）。已结的在 (t1, S1) 留 ✓ / ✕ 圆点直到滚出画面。右栏 MY CALLS 每张一行：`$25 @ 51.2¢ · wins +$21.46` / `open $80,9xx · 12s` / 进度条 / 行尾 `cancel`（前 2 秒）→ `ahead` / `behind` → 结算瞬间闪色 → 滑进 LAST SETTLED（只留最近一张：`$25 @ 51.0¢ · won · open … · close …` / `+$21.46`；有两张以上已结时出现 `All settled calls → Portfolio` 链接）。开着的合约全部都在列表里，装不下就在列表内滚动、底边渐隐。TABLE 页签：顶部 `UP · 4 $105 | DOWN · 2 $110` 汇总，每行 `UP $100 @ 50.3¢ · ha***ru  12s`（无进度条，最后 5 秒倒数变白），右上金额 = 桌面总额；该页签下不显示提示框和 LAST SETTLED。键上筹码塔 = 这一边正在跑的合约（最近面额靠环、按面额归堆 ×N、堆多了缩小、再多把最旧的折成 `+N`），最新一枚带 2 秒取消环，底注 `tap chip to cancel · costs $0.04`。右栏底部 `04 / YOUR RESULT` 四行记分板（每项一行：标签 | 数值 | 小字）：OPEN `6 calls · $125 / next in 3s` · LIVE `+$4.63 / if settled now` · SESSION `+$83 / 2 won · 1 lost` · LAST 10 ✓✕ + `3 in a row`。图表头一行：`02 / LIVE FEED` 题牌 | 44px 价格 | COMBO HUD（居中，上 `COMBO ×3` 下 pips + `1 MORE → ×4 BONUS`；无连胜时整块隐藏）| `NEXT SETTLE · 3S`；第二行三来源价 + `LIVE · all 3 valid`（价格下不再写 this slot 涨跌，路单条 THIS SLOT 已有）。",
    spec: [
      { state: "落筹", when: "tap UP / DOWN", visual: "键上筹码 + 环；服务端按你看到的报价成交（p / 派彩当场锁定）；拒单 → 键上价闪白 + 底注 `Price moved · tap again`，不扣钱", source: "place / data.place" },
      { state: "取消", when: "t − t0 < 2 s", visual: "点环 → toast `Cancelled · $0.04 close fee`，退 gross − 0.15%", source: "cancel / arcade_cancel" },
      { state: "到期", when: "t ≥ t1", visual: "旗 `…` → ✓ / ✕；`+$4.29` 飘字；筹码飞进余额；一秒内合并一次余额 bump；行闪后进 SETTLED", source: "applySettled / flagFloat / flyChip" },
      { state: "连赢 / 连输", when: "streak ≥ 2", visual: "`COMBO ×N` / `LOST ×N` HUD；×3 / ×6 … → 金币雨 + 大字 `×3 COMBO · keep it rolling · next bonus at ×6`；连输 ×3 → 红闪 + `×3 LOST · take a breath`；断链 `COMBO BREAK` 掉落", source: "comboUpdate / mega" },
      { state: "键不锁", when: "always", visual: "结算过程中 UP / DOWN 照样能点；同向 / 反向都各自独立开一张", source: "renderKeys" },
    ],
  },
  {
    key: "arcade-ar3",
    label: "AR-3 · 桌子暂停（指数无效）· 猞猁跑酷",
    note:
      "指数无效（少于两家有效 / 两家偏差 > 5 bps / 没有 USDT-USD 汇率 / tick 超 4 秒没来）、市场熔断（一秒跳 > 10 bps 或 30 秒实现波动 > 20 bps，30 秒冷却）、平台当日亏损触顶、全桌最坏损失满额（TABLE FULL）、人工关桌（`arcade_params.live = 0`）五种情况：图表盖 `TABLE PAUSED` + 原因 + `Open calls keep running and settle as normal`，UP / DOWN 置灰、底注写原因，三来源行变红 `INDEX INVALID`。暂停的瞬间猞猁窗变成小恐龙式跑酷：猞猁自动跑、点窗口 / 空格跳陨石、右上计分 + 本地最高分 `HI`，撞上 `CRASH · TAP TO RETRY`；恢复的瞬间游戏结束猞猁回到闲逛。",
    spec: [
      { state: "暂停", when: "state.paused_reason || tick 过期", visual: "遮罩 + 键灰 + 来源行红；已开的合约照常倒数、照常结算", source: "poll / renderPrice / renderPays" },
      { state: "跑酷", when: "paused（桌面）", visual: "星空加速、地面、带火尾的像素陨石；分数 = 存活 0.1 s 计 1", source: "Lx.gameStart / gameTick" },
      { state: "猞猁情绪", when: "always", visual: "会话 > +$0.5 昂首阔步、< −$0.5 耷拉慢走；60 秒没人碰打盹 zzz；大路 ≥5 同色举牌 `DRAGON ×5 ▲`、≥6 交替举牌 `choppy…`；新手 8 秒没下单举牌 `new here? tap ⓘ ↗`", source: "Lx.think / readRoad" },
    ],
  },
];

const MOBILE: SectionCase[] = [
  {
    key: "arcade-ar4",
    label: "AR-4 · 移动版 · 自己没单（筹码带显示 TABLE）",
    note:
      "一屏：顶栏（logo = 出口 / AVAILABLE / `+` 存款 / RULES / 静音）→ `BTC · 30s calls · $价` + `YOUR OPEN $0 / $500 · $5–100 A CALL` → 四格 BINANCE / HYPERLIQ. / COINBASE / INDEX → 舞台（大价 + COMBO + NEXT + 图）→ 筹码带（自己没单时显示 `TABLE N` 别人的筹码，带倒数环；有单时 `MY CALLS N`）→ OPEN / LIVE / SESSION → 筹码 → UP / DOWN（底注两行）→ 底部 `ROAD & STATS` 窥条（最近 10 格珠子 + ▲）。免责门 / RULES 弹层同桌面。",
    spec: [
      { state: "窥条", when: "always", visual: "贴底一条：`ROAD & STATS` + 10 枚珠子 + ▲；点开抽屉", source: "mPeek / sheetOpen" },
      { state: "抽屉", when: "peek tap", visual: "钢板 sheet：路单条（珠盘 + 大路 + 统计 + ⓘ）→ SESSION / LAST 10 → SETTLED 列表 → 猞猁（点了跳）；✕ / 遮罩 / Esc 关", source: "sheetOpen" },
      { state: "暂停", when: "paused", visual: "图上 `PAUSED · Index invalid`，四格来源价变红；跑酷只在桌面", source: "renderPrice" },
    ],
  },
  {
    key: "arcade-ar5",
    label: "AR-5 · 移动版 · 开着 6 张合约",
    note: "筹码带切到 `MY CALLS 6`：每枚筹码外圈倒数环（按边配色）+ 右下角剩余秒数；到期筹码盖 ✓ / ✕。UP 键上的筹码塔 24px 三档缩放、最新一枚带取消环；OPEN `6 · $125`、LIVE `+$4.63`。",
    spec: [
      { state: "筹码带", when: "mine.length", visual: "最近 7 枚，环色 = 方向色，角标秒数 / `…` 结算中 / ✓ ✕ 已结", source: "renderRail · mobile strip" },
      { state: "结算反馈", when: "t ≥ t1", visual: "同桌面（飘字 + 飞筹码 + 余额 bump + COMBO HUD 右上小盒）", source: "applySettled" },
    ],
  },
];

const SHARE: SectionCase[] = [
  {
    key: "arcade-as1",
    label: "AS-1 · 分享海报「Share your run」· 赚 / 亏",
    note:
      "CPO 2026-10-28：按场分享（这次打开机柜以来），入口只有右栏 `04 / YOUR RESULT` 标题行的 `⇪ SHARE` 键（有 ≥1 笔结算才亮；移动端在 ROAD & STATS 抽屉的 04 同位置），连赢 / 大赢都不主动弹。海报走主站 Lite 晒单海报同一家族（黑底渐变、头像 + 徽章、PROFIT 等宽大字、两格、推荐码 + logo + 二维码，恒 400px 内联样式），Quick Play 身份靠右上 `QUICK PLAY` 标签 + 大字下一句 `Called Bitcoin up or down, 30 seconds at a time` + 小字 `23 minutes · 10 calls · $5 each` + 设计师的撒金币 / 哭的猞猁。徽章 `⚡ 7 of 10 right`；两格 `Best run · 4 in a row` / `Biggest win · +$9.20`；CTA `Pick UP or DOWN · from $5`；二维码 → `/arcade?ref=code`。只写净利（已扣佣金）与对了几次，不写 ROI、不出 SESSION / COMBO / LAST 10。弹层 = 站点 ShareModal（Save / Copy Link / X / Telegram，手机走系统分享面板）。",
    spec: [
      { state: "赚", when: "pnl ≥ 0", visual: "黄绿：`Profit +$83.57`、徽章 ⚡、撒金币猞猁", source: "ArcadeRunPoster" },
      { state: "亏", when: "pnl < 0", visual: "红：`Lost −$21.40`、徽章 📉、哭的猞猁；弹层副标题 `Rough one — share it anyway, we go again`", source: "ArcadeRunPoster / ArcadeShareCard" },
      { state: "入口", when: "won + lost ≥ 1", visual: "`⇪ SHARE` 黄绿小键亮；0 笔结算灰", source: "arcadeEngine · renderBoard / #shareKey → api.share" },
    ],
  },
];

const BANNER: SectionCase[] = [
  {
    key: "arcade-ab1",
    label: "AB-1 · Events All 入口横幅（桌面 · 方案 C 像素夜景）· 活体 / 指数无效",
    note:
      "CPO 2026-10-28 选入口比稿（artifact QeVaSA7hP2jwBpRXkoAJk4）的方案 C：一条 124px 的像素夜景——星空 + 流云 + 城市天际线向左滚、路面砖纹滚，猞猁在路面上走走停停、跳一下弹枚金币；指数线（辉光 + 面积 + 脉冲线头，涨青跌黄绿）横在天际线上方。左 HUD：`■ QUICK PLAY` + `BTC · 30-SECOND CALLS · 24/7` / 32px 像素大价 / `$x · ▲ +$y · last 30s`（30 秒前的指数 + 变化）。右 HUD：`TIME` 条 + `00:22`（**桌子的 30 秒墙钟格**，和机柜路单的格子同步，不是局）/ `▲ UP 51.2¢ | ▼ DOWN 48.8¢`（模型报价）/ PLAY ▸ 黄绿键（呼吸辉光 + 扫光）。只在 All（非日历、非 watchlist）出现，整条可点 → `/arcade`。指数无效：副行 `INDEX INVALID · WAITING FOR THE EXCHANGES`，时钟变红闪，报价 `—` 且盒子变暗。读的仍是机柜同一条三所指数（`arcade_table_now` 每 2 秒 + 最近 45 秒 tick）。标题字 Press Start 2P 已自托管。",
    spec: [
      { state: "活体", when: "tick valid && p_up", visual: "夜景 + 指数线 + 猞猁；`TIME 00:22` 按墙钟 30 秒循环；`▲ UP 51.2¢ · ▼ DOWN 48.8¢`", source: "ArcadeEntryBanner · useArcadeTicker / useSlotClock" },
      { state: "指数无效", when: "!live", visual: "大价留上一个价（没有就 `$—`）、副行红字 `INDEX INVALID…`、时钟红闪、报价 `—`", source: "同上（.qpc.off）" },
    ],
  },
  {
    key: "arcade-ab2",
    label: "AB-2 · 入口横幅（移动 · 方案 C 竖排）· 活体 / 指数无效",
    note: "同一条夜景折成一列：标题行 / 42px 大价 + 30 秒变化 / 84px 指数线 / `TIME` 条 + 倒数 / UP · DOWN 两盒 / 60px PLAY 键；底部留 78px 路面给猞猁走。",
    spec: [
      { state: "活体", when: "live", visual: "竖排六段；猞猁在底部路面", source: "ArcadeEntryBanner (isMobile · .qpc.m)" },
      { state: "指数无效", when: "!live", visual: "同桌面：红副行、红时钟、报价 `—`", source: "同上" },
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
    title="/arcade · Quick Play v2（BTC 30 秒合约 · 流式舞台 · 机柜皮肤）· 状态字典（AR-1 … AR-5 · AB-1 / AB-2 · AS-1）"
    description="2026-10-27 / 10-28 CPO 拍板（研发稿 v1.0 + 修订）：先只上 BTC；没有「局」，每一枚筹码就是一张自己的 30 秒合约；价格 = Binance / Hyperliquid / Coinbase 三所中间价中位数（pg_cron + pg_net 每秒采样，真价）；报价 = 研发稿模型 0.40–0.60 三位小数；3% 开仓费含在筹码里、2 秒内可取消（0.15%）、不可平仓、盈利扣 5% 佣金、平局全退；$5–100 一注、单账户未到期 ≤ $500、全桌最坏损失 ≤ $10,000；指数无效 / 熔断 / 亏损触顶 / 满额暂停新单。交互按 mock v26（claude.ai/artifact/6AmwMxsb3aNDUgVDZ8epWJ）复刻在设计师钢板壳上。ETH / SOL / 美股桌隐藏。文案英文占位。"
  >
    <div className="rounded-lg border border-[#FF8A3D]/30 bg-[#FF8A3D]/5 px-3 py-2 text-[12px] text-foreground">
      交互契约：每筹一合约（t0 = 服务端接单）· 2 s 可取消（0.15%）· 无 Cash out · S0 = 接单后第一条有效指数、S1 = 到期前最近一条（等 2 s 迟到行情）· 赢 = ⌊(筹码 − 3%) ÷ p⌋ − 5% 利润 · 平局 / 无价全退 · 键不锁 · 反馈三级（每张 / 每秒 / 连赢 ×3）·
      后端 <code className="font-mono">supabase/migrations/20261028120000_arcade_calls.sql</code>（`arcade_feed_tick` 每秒、`arcade_place` / `arcade_cancel` / `arcade_settle_due`），参数全在 <code className="font-mono">arcade_params</code>。
    </div>
    <SubSection title="机柜（AR-1 … AR-3，桌面 1440 → 缩放 72%）">
      <Desk cases={CABINET} min={700} />
    </SubSection>
    <SubSection title="移动版（AR-4 / AR-5）">
      <Mob cases={MOBILE} min={780} />
    </SubSection>
    <SubSection title="入口横幅（AB-1 / AB-2）">
      <Desk cases={[BANNER[0]]} min={280} />
      <Mob cases={[BANNER[1]]} min={320} />
    </SubSection>
    <SubSection title="分享海报（AS-1）">
      <Desk cases={SHARE} min={520} />
    </SubSection>
    <SubSection title="附注 · 本轮不做 / 演示引擎放宽">
      <ul className="list-disc space-y-1 pl-5 text-[12px] text-muted-foreground">
        <li>采样 ≈ 1.2 s / 报价有效 2.5 s / 指数过期 4 s / 模型历史 120 s 起（研发稿 500 ms / 500 ms / 600 s）——Supabase pg_cron + pg_net 的上限，`arcade_params` 可调；真平台照研发稿。</li>
        <li>演示桌永远能交易（CPO 10-28）：行情停顿时服务端补合成 tick（`src_raw.synthetic`），熔断 / 亏损上限 / 全桌上限在演示桌拨到够不着；AR-3 的暂停态只在这里看得到，线上基本不会出现。</li>
        <li>可用结算现金 1.10× 门控、关联账户组、异常胜率人工复核、损失熔断人工恢复：未做。</li>
        <li>措辞 / 合规终稿；i18n key；Portfolio 的 Quick Play 页签（右栏 `All settled calls → Portfolio` 已指过去，页签待做）。</li>
        <li>ETH / SOL / 美股桌隐藏（`ARCADE_LIVE_TABLES`）；旧轮次流照跑给站内行情，BTC 开盘改锚真指数。</li>
      </ul>
    </SubSection>
  </SectionWrapper>
);
