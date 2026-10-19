/**
 * /arcade · Quick Play（30s / 1m Up/Down · 机柜皮肤）· 状态字典（AR-1 … AR-4 + AB-1 / AB-2）。
 *
 * 规则（Liya 2026-10-19 拍板）：Table 形态不再挂 5m / 15m，改成独立快玩专区——
 * 加密 30s + 1m 全天，美股 1m 只在美国现金时段；现货账户、无 Boost、平局退本金；
 * 第三种页面类型（机柜铺满站点 header 之下，Lite 容器规则不适用）。
 * 框架同 SP / TB 系列：生产件（ArcadePage 引擎 + 入口横幅）+ fixture 确定性注入——
 * 时钟冻结、轮次种子固定、路单序列固定、零网络（引擎 fixture 模式）。
 */
import { SectionWrapper, SubSection } from "../components/SectionWrapper";
import { SectionFrame, type SectionCase } from "../components/SectionFrame";

const CABINET: SectionCase[] = [
  {
    key: "arcade-ar1",
    label: "AR-1 · 空桌（BTC 30s · 开局 9 秒）",
    note:
      "四行动线不变：① 路单（珠盘 + 大路 + 统计，赌场标准画法：珠盘一列 6 格留最近 6 列、虚线格 = 下一局落点；大路同结果向下堆 6 行、变结果右开新列、到底或被挡向右拐龙尾，相邻列永不同色）→ ② 舞台（价格线 + 梯子 + 倒计时）→ ③ UP / 筹码 / DOWN → ④ 记分板。价格线是确定性路径（服务端同一算法），Up/Down 价格由「偏离 ÷ 剩余时间」的 tanh 曲线给出。UP/DOWN 底注写成当前筹码的结果 `$25 in → win +$X if Up`，不写份额。",
    spec: [
      { state: "题目", when: "always", visual: "`Will BTC close above $open?` + ⓘ（规则弹层：份额、判定、平局作废、30s 无 Cash out、SPOT · NO BOOST）；副行本轮起止（本地时间）", source: "arcadeEngine · labelRound / rulesHtml" },
      { state: "Available", when: "always", visual: "现货账户余额，下单 / 回款时 700ms 滚数 + bump", source: "api.getBalance · eqTo" },
      { state: "币种 / 周期", when: "always", visual: "CRYPTO ▾ / STOCK 两键（当前类目显示币种 + 下拉），30s / 1m 两键；股票时 30s 禁用", source: "renderCats · applyMarket" },
      { state: "筹码盘", when: "always", visual: "`YOUR STAKE · USD PER CHIP` + `$25 SELECTED`；$10/25/50/100/500，带 $ 前缀，选中黄绿摆动", source: "selectChip" },
      { state: "倒计时", when: "sec > 5", visual: "青色 LCD；≤5s 变红 throb + tick 音", source: "clockLoop" },
    ],
  },
  {
    key: "arcade-ar2",
    label: "AR-2 · 持仓中（$25 on Up · 21 秒）",
    note:
      "落筹 1.5s 待发环（点筹码撤回）→ 现货市价买入（executeSpotTrade，手续费从筹码里扣，份额 = ⌊(筹码 − 费)/价⌋）。持仓格显示筹码堆 + `Position $25`；底注 `$25 in · wins +$121 if Up`；对侧底注 `You're on Up · a chip here comes off it`（反向落筹 = 净额冲减，toast 说人话、只讲钱：`$25 on Down · $24 off your Up · $54 still on`）。**机柜内不出现 sh / 份额数**（CPO：正常人看不懂）——份额一律换算成钱：N 份 = `wins $N if Up`；记分板副行 `in at 27.6¢ · worth $612 now`。记分板：This round / Live（实时盈亏 + 赢了拿多少）/ Today；30s 轮 Cash out 禁用。",
    spec: [
      { state: "待发", when: "pend.length", visual: "按钮上 40px 环 1.5s 倒数 + 筹码；底注 `Filling $25 · tap chip to cancel`", source: "place / cancelPend" },
      { state: "持仓", when: "pos.side === side", visual: "held 态：筹码堆（最近 4 枚）+ Position 徽标；底注 `$25 in · wins +$121 if Up`", source: "renderButtons" },
      { state: "反向落筹 = 净额冲减", when: "pos && chip on the other side", visual: "底注 `Nets $25 against your Up · tap chip to cancel`；成交 = executeSpotTrade 按隐含价份额对份额减持仓、余量开对面（ARCADE_FLIP = net，与平台现货一致）", source: "fill" },
      { state: "Cash out", when: "pos && tf === 1m", visual: "红键可点 → 25 / 50 / 100% 滑杆弹层 → 现货 SELL；30s 轮禁用 + title 说明", source: "openCo / cashOut" },
      { state: "结算", when: "clock hits 0", visual: "赢：金币雨 + 涨落数字 splash + 猫欢呼；输：红闪 + 抖动 + 猫丧；路单弹入新格；服务端 ≤30s 内入账", source: "settle / settlePosition" },
    ],
  },
  {
    key: "arcade-ar3",
    label: "AR-3 · 股票桌（AAPL 1m · 盘外）",
    note:
      "股票桌只有 1m；美国现金时段（09:30–16:00 ET，周一到周五）之外图表区盖 `MARKET CLOSED · 下一场 Mon 09:30 ET · in Xh Ym`，UP/DOWN 置灰禁用，落筹被拦并 toast。盘中时与加密桌一致。此 case 的门读浏览者的墙钟（非 fixture 时钟），盘中看到的是开桌态。",
    spec: [
      { state: "盘外", when: "kind === stock && !usSessionOpen()", visual: "遮罩 + 禁用；30s 键禁用（title：Stock tables run 1m rounds only）", source: "applyMarket" },
      { state: "开桌", when: "usSessionOpen()", visual: "同加密桌；LIVE 标签 `LIVE · AAPL · NASDAQ`", source: "同上" },
      { state: "作废", when: "close == open（或停牌）", visual: "灰闪 + toast `Round void · … returned to Spot`；服务端按成本退款", source: "voidRound / settle_arcade_round(void)" },
    ],
  },
];

const MOBILE: SectionCase[] = [
  {
    key: "arcade-ar4",
    label: "AR-4 · 移动版（一屏 + 抽屉）",
    note:
      "设计师的抽屉版 1:1：全屏（无站点 header / footer），机柜占满视口不滚动，右上 ✕ 回 Events；顶部题目 → 币种 / 周期 → 舞台（价格 + 倒计时 + 图 + 梯子）→ `ROAD & STATS` 窥条（最近 10 局 + 合计，上滑 / 点开抽屉：珠盘、大路、统计、Today、猫）→ This round / Live / Share / Cash out → 筹码盘 → UP / DOWN 两大键。弹层（Cash out / Share / Orders）都在壳内从底部升起。",
    spec: [
      { state: "窥条", when: "always", visual: "`ROAD & STATS` + 10 格 ✓✕ + `Last 10 ±$X`；aria-expanded 跟抽屉", source: "mobileSheet · renderTicks" },
      { state: "抽屉开", when: "peek tap / swipe up", visual: "半屏钢板 sheet，拖把手下拉 80px 关闭，Esc 关闭", source: "mobileSheet" },
      { state: "下单", when: "tap UP / DOWN 或拖筹码", visual: "同桌面（1.5s 待发环）", source: "place" },
    ],
  },
];

const BANNER: SectionCase[] = [
  {
    key: "arcade-ab1",
    label: "AB-1 · Events All 入口横幅（桌面 V1-B 钢板）· 活体 / 开桌中",
    note:
      "Events「All」视图 chips 带之下、舞台之上；只在 All（非日历、非 watchlist）出现。读的是 BTC 30s 桌的同一条确定性价格流：价格、`BTC · OPEN $X · ▲ +$Y`、UP/DOWN 价、倒计时全部与点进去看到的一致。没有开放轮次时显示 `OPENING…` 而不是假数字；不显示在线人数（没有数据源）。整条可点 → `/arcade?table=BTC&tf=30s`。跑灯环（V1-B+）开，ARCADE_BANNER_LIGHTS（CPO）。",
    spec: [
      { state: "活体", when: "round != null", visual: "钢板 170 / 1fr / auto / 150 四列；CRT 屏铺价格线；青色 LCD 倒计时，≤5s 变红", source: "ArcadeEntryBanner · useArcadeTicker" },
      { state: "开桌中", when: "round == null", visual: "价格位 `OPENING…`，倒计时位 `—`", source: "同上" },
    ],
  },
  {
    key: "arcade-ab2",
    label: "AB-2 · 入口横幅（移动 V1-A CRT）· 活体 / 开桌中",
    note: "整块 CRT 屏折三行：标题 + 倒计时 / 题目 / 价格 + 赔率 + PLAY 键；高度 ~120px，列表第一张卡仍在首屏。",
    spec: [
      { state: "活体", when: "round != null", visual: "三行；价格线做底（55% 透明）", source: "ArcadeEntryBanner (isMobile)" },
      { state: "开桌中", when: "round == null", visual: "`OPENING…` / 副行 `30S · 1M · CRYPTO 24/7`", source: "同上" },
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
    title="/arcade · Quick Play（30s / 1m Up/Down · 机柜皮肤）· 状态字典（AR-1 … AR-4 · AB-1 / AB-2）"
    description="2026-10-19 CPO 拍板：Table 形态离开 5m / 15m 页，成为独立快玩专区。加密 BTC / ETH / SOL 30s + 1m 全天；美股 AAPL / NVDA / TSLA / COIN 1m 只在美国现金时段。现货账户、无 Boost、平局退本金、停牌作废。第三种页面类型：全屏游戏页，无站点 header / footer，机柜自带 ✕ 出口。设计师机柜（artifact BKHuHJvFkzeLXQxLWBHxSF）1:1 搬入，只换数据缝：轮次 / 价格 = public.arcade_rounds + 确定性路径（SQL 与 JS 同一算法），下单 = executeSpotTrade。字体自托管 public/fonts/arcade。文案占位，待措辞轮。"
  >
    <div className="rounded-lg border border-[#FF8A3D]/30 bg-[#FF8A3D]/5 px-3 py-2 text-[12px] text-foreground">
      交互契约：落筹 = 1.5s 待发可撤（无 Confirm）· 一轮一仓、同向加仓 · 反向落筹 = 净额冲减（<code className="font-mono">ARCADE_FLIP = net</code>，与平台现货一致）· 30s 无 Cash out，1m 可 · 结算由
      <code className="font-mono"> roll_arcade_rounds</code>（pg_cron 每 30s）按 option_id 结现货仓（<code className="font-mono">settle_arcade_round</code>，migration <code className="font-mono">20261019120000</code>），
      客户端用同一路径先行开奖、≤30s 内服务端入账。
    </div>
    <SubSection title="机柜（AR-1 … AR-3，桌面 1440 → 缩放 72%）">
      <Desk cases={CABINET} min={660} />
    </SubSection>
    <SubSection title="移动版（AR-4）">
      <Mob cases={MOBILE} min={780} />
    </SubSection>
    <SubSection title="入口横幅（AB-1 / AB-2）">
      <Desk cases={[BANNER[0]]} min={280} />
      <Mob cases={[BANNER[1]]} min={320} />
    </SubSection>
    <SubSection title="附注 · 本轮不做">
      <ul className="list-disc space-y-1 pl-5 text-[12px] text-muted-foreground">
        <li>措辞 / 合规终稿；i18n key 接入（机柜文案全为英文占位）。</li>
        <li>Share 卡：用设计师的卡（Save = 长按提示，X / Telegram 直链）；接站内海报服务另议。</li>
        <li>memecoin 桌、10s 轮、积分模式：待真平台参考价与 CPO 拍板。</li>
        <li>价格源已统一（migration 20261019130000）：加密快轮五档周期读专区价格流，行情条 / 快轮 / 横幅 / 机柜同一个 BTC 价；美股日线仍是每日链。</li>
      </ul>
    </SubSection>
  </SectionWrapper>
);
