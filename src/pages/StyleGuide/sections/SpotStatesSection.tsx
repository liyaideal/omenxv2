/**
 * /spot（现货轮：crypto 快轮 + stocks 日内）· 状态字典（M2c · SP-1 … SP-16）。
 *
 * 框架总则同 TR 系列：SectionFrame 双帧（desktop 1280 在上 / mobile 375 在下）、
 * 三件套（label / note / spec 表）、fixture 确定性注入禁运行时 fetch、
 * 倒计时 / round id / 序列一律冻结、生产由 useIsMobile() 派生的沿用同一 hook。
 */
import { SectionWrapper, SubSection } from "../components/SectionWrapper";
import { SectionFrame, type SectionCase } from "../components/SectionFrame";

const Table = ({
  title,
  head,
  rows,
}: {
  title: string;
  head: string[];
  rows: string[][];
}) => (
  <div className="space-y-2">
    <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground/80">
      {title}
    </div>
    <div className="overflow-x-auto rounded-md border border-border/40">
      <table className="w-full min-w-[560px] border-collapse text-left text-[11px]">
        <thead>
          <tr className="bg-muted/20 text-[10px] uppercase tracking-wider text-muted-foreground/70">
            {head.map((h) => (
              <th key={h} className="px-2 py-1.5 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]} className="border-t border-border/30 align-top">
              {r.map((c, i) => (
                <td key={i} className="px-2 py-1.5 text-muted-foreground">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

/* ---------------- ① 轮次历史带（SP-3 / SP-4） ---------------- */

const TAPE_CASES: SectionCase[] = [
  {
    key: "spot-sp3",
    label: "SP-3 · round strip · crypto 快轮（RoundTape 唯一实现）",
    note:
      "逐字 legend：`Past rounds — ▲ Up won · ▼ Down won · a new round starts the moment one settles.`（▲ 走 #33D6FF，▼ 走 #CFFF4A）。左标 micro `Round #6542 · AUG 28`（CSS 大写）+ 第二行为本轮 UTC 窗口 `03:40–03:45`。倒计时 `02:41` 已冻结。",
    spec: [
      { state: "历史 chip", when: "history.slice(-10)", visual: "▲/▲▼ 26px 圆角方块，up=Pulse Blue 底 13%，down=Volt 底 13%", source: "RoundTape.chips" },
      { state: "live 药丸", when: "currentSlot[0].kind === 'countdown'", visual: "橙 #FF8A3D 描边药丸 + 同色圆点 + 倒计时文本", source: "LiteQuickTrade.currentSlot" },
      { state: "NEXT 槽", when: "currentSlot[1].kind === 'next'", visual: "虚线空槽 `NEXT`，tooltip `Next round starts the moment this one settles`", source: "RoundTape next 分支" },
      { state: "移动横滑", when: "isMobile", visual: "整条可横向滚动、滚动条隐藏；chip 命中区撑到 44px", source: "RoundTape TOUCH" },
    ],
  },
  {
    key: "spot-sp4",
    label: "SP-4 · day strip · stocks 日内（Past days）",
    note:
      "逐字 legend：`Past days — ▲ Up won · ▼ Down won · tap a day to see how it settled.` 左标两行语法：`TODAY · {DATE}`（时段开市中）/ `NEXT ROUND · {DATE}`（休市）+ 第二行本地时段 `09:30–16:00`。倒计时用 formatClockCountdown 的 hh:mm:ss（`04:12:37`），不是 mm:ss。",
    spec: [
      { state: "开市中", when: "tapeSession.open && todayEventId", visual: "左标 `TODAY · …` + 橙色 hh:mm:ss 倒计时药丸", source: "LiteSpotTrade.tapeLeftLabel / tapeSlot" },
      { state: "休市", when: "!isOpenNow", visual: "左标 `NEXT ROUND · …` + 虚线 NEXT 槽，tooltip 报下次开市时刻", source: "tapeSlot next 分支" },
      { state: "当前日高亮", when: "d.id === event.id", visual: "该 chip 加 1.5px currentColor 描边", source: "TapeChip.active" },
      { state: "点击换日", when: "任何历史 chip", visual: "导航 `/spot?event={id}`（本 case 的 onClick 为哑函数）", source: "navigate()" },
    ],
  },
];

/* ---------------- ② 行情与图表（SP-5 … SP-8） ---------------- */

const MARKET_CASES: SectionCase[] = [
  {
    key: "spot-sp5",
    label: "SP-5 · crowd bar（SpotSentimentBar · Up 55% / 45% Down）",
    spec: [
      { state: "常态", when: "恒真", visual: "`WHAT THE CROWD THINKS` + 右侧 `Vol {volText}`；左段 yes 轴渐变、右段 no 轴渐变，条高 44px", source: "SpotBlocks.SpotSentimentBar" },
      { state: "极端钳位", when: "yesPct < 1 || yesPct > 99", visual: "钳到 1…99，两段永不消失", source: "upPct clamp" },
    ],
  },
  {
    key: "spot-sp6",
    label: "SP-6 · chart 双 tab（`BTC price` / `{side} odds ¢`）",
    note:
      "切换规则：tab=stock 走灰线 #C9CED6 且 Y 轴为货币；tab=odds 时线色与 tab 文字随订单面板所选 side —— Up 走 --yes、Down 走 --no，且 Down 序列为 Up 的逐点补数（100 − Up）。两帧并列展示 side=yes 与 side=no。",
    spec: [
      { state: "stock tab", when: "tab === 'stock'", visual: "标的价走势 + baseline 虚线，Y 轴 `{currency}x.xx`", source: "LiteStockChart.stockSeries" },
      { state: "odds tab", when: "tab === 'odds'", visual: "赔率走势，Y 轴 `x¢`，标签为 `{sideLabel} odds ¢`", source: "oddsSeries / sideLabel" },
      { state: "side=no", when: "side === 'no'", visual: "序列取 100 − Up，线色改 --no，tab 文字改 `Down odds ¢`", source: "toSide()" },
      { state: "无真实历史", when: "upHistory 缺失或 < 4 点", visual: "确定性合成走势（seed 由 ticker 派生，跨挂载稳定）", source: "synth() · DEMO-STATE" },
      { state: "X 轴", when: "startDate && endDate 有效", visual: "轴跨本轮窗口；否则回落常规时段刻度 + 收盘刻", source: "roundLabels / REGULAR_LABELS" },
    ],
  },
  {
    key: "spot-sp7",
    label: "SP-7 · price-to-beat 虚线（chart 内 `Price to beat $61,569.07`）",
    note: "在 stock tab 上切换可见；本 case 与 SP-6 同一组件、同一 fixture，仅规格聚焦 baseline。",
    spec: [
      { state: "有 base_price", when: "tab === 'stock' && basePrice != null", visual: "水平虚线 + 标签 `Price to beat {currency}{base}`", source: "LiteStockChart baseline" },
      { state: "odds tab", when: "tab === 'odds'", visual: "baseline = null，虚线不渲染", source: "同上" },
    ],
  },
  {
    key: "spot-sp8",
    label: "SP-8 · HOW IT SETTLES · 时段时间轴（SpotSettlementRail）",
    note:
      "五节点逐字：`Opened` → `Market open 09:30` → `Trading now` → `Closes 15:55` → `Settles 16:00`；右上角 `Trading now` + 脉冲蓝点。",
    spec: [
      { state: "交易中", when: "tradingNow === true", visual: "进度条填至 50%，NOW 节点 yes 实心 + 4px 光晕环，右上脉冲徽标", source: "SpotSettlementRail" },
      { state: "已封盘", when: "blocked === true", visual: "进度条 100%，`Trading now` 徽标消失", source: "blocked prop" },
      { state: "节点缺时间", when: "node.time === ''", visual: "只渲染标签行，不占第二行", source: "RailNode.time" },
    ],
  },
];

/* ---------------- ③ 下单与持仓（SP-10 … SP-13） ---------------- */

const ORDER_CASES: SectionCase[] = [
  {
    key: "spot-sp10",
    label: "SP-10 · Place your order · 默认态（LiteOrderPanel · variant 随 useIsMobile）",
    note:
      "逐字：`Place your order` + `{countdown} left`；`Your call`；`How much`；`Standard balance`；预设子标 `win ${floor(preset / sidePrice)}`（$10 @ 55¢ → `win $18`，$25 → `win $45`，$50 → `win $90`，$100 → `win $181`）；三行 `Max loss · what you pay` / `You get if right · N × $1` / `Potential profit`；CTA 主行 `Buy Up`、副行 `To win $0.00 →`；脚注逐字 `Buys instantly at the current price (within 0.5%)`。",
    spec: [
      { state: "零单", when: "amountNum <= 0", visual: "三行金额全 $0.00，CTA 副行 `To win $0.00 →`", source: "LiteOrderPanel" },
      { state: "guest 余额", when: "!user", visual: "Standard balance 显示 $0.00（style-guide 无会话）；提交改走 onRequestAuth", source: "useUserProfile / onRequestAuth" },
      { state: "desktop 框", when: "variant === 'desktop'", visual: "外套卡片 + 顶部标题行；mobile 变体去掉卡壳与标题行，直接作为抽屉正文", source: "wrapClass" },
      { state: "Max 预设", when: "点击 Max", visual: "金额置为 floor(spotBalance)，无子标", source: "handlePreset('max')" },
    ],
  },
  {
    key: "spot-sp11",
    label: "SP-11 · Down 侧选中态",
    spec: [
      { state: "no 选中", when: "side === 'no'", visual: "Down 按钮切 Volt 轴；`You get if right` 行底色转 no/5；CTA 渐变改 no→#E4FF88，文案 `Buy Down`", source: "cta 分支 / SideButton" },
      { state: "份额换算", when: "任何金额", visual: "shares = floor(amount / noPrice)，随 side 立即重算", source: "sidePrice" },
    ],
  },
  {
    key: "spot-sp12",
    label: "SP-12 · 有金额态（$50 @ 55¢）",
    note: "冻结数值：shares = floor(50 / 0.55) = 90 → `You get if right · 90 × $1` = $90.00；`Potential profit` = $40.00；CTA 副行 `To win $90.00 →`；$50 预设胶囊转白底激活态。",
    spec: [
      { state: "预设命中", when: "amountNum === preset", visual: "该胶囊白底黑字，子标转 70% 黑", source: "active 分支" },
      { state: "利润为 0", when: "shares × $1 <= amount", visual: "`Potential profit` 钳 $0.00，不出负数", source: "Math.max(0, …)" },
    ],
  },
  {
    key: "spot-sp13",
    label: "SP-13 · 持仓块（SpotYourPosition · 盈 / 亏 两态）",
    spec: [
      { state: "盈利", when: "!pnl.startsWith('-')", visual: "▲ + trading-green，四格 `Current value / Avg cost / Profit / If {side} wins`", source: "SpotBlocks.SpotYourPosition" },
      { state: "亏损", when: "pnl.startsWith('-')", visual: "▼ + trading-red", source: "同上" },
      { state: "Cash out", when: "cashOutDisabledText == null", visual: "底部整宽 `Cash out · ${currentValue}`，点击开 LiteCashOutFlow", source: "onCashOut" },
      { state: "暂停兑现", when: "cashOutDisabledText != null（in review）", visual: "按钮 50% 透明禁用 + 下方说明句", source: "cashOutDisabledText" },
    ],
  },
];

/* ---------------- ④ 结算衔接（SP-14） ---------------- */

const SETTLE_CASES: SectionCase[] = [
  {
    key: "spot-sp14",
    label: "SP-14 · settlement rail · 轮结算瞬间与下一轮衔接（冻结瞬态）",
    note: "上半为 settled=true 的 rail（全节点完成、Trading now 熄灭），下半为同一时刻的 day strip：今日 chip 已落入历史、当前槽转 NEXT、左标切 `NEXT ROUND · …`。",
    spec: [
      { state: "settled", when: "settled === true", visual: "进度条 100%，除 NOW 外全部节点 yes/60", source: "SpotRailTrack" },
      { state: "衔接", when: "结算完成且下一轮未开", visual: "tape 当前槽由倒计时药丸换成虚线 NEXT 槽", source: "tapeSlot 分支" },
    ],
  },
];

/* ---------------- 缺口表与并账表 ---------------- */

const Gaps = () => (
  <div className="space-y-3">
    <Table
      title="缺口回报 · 无法在「生产零改动」前提下挂载的 5 个 case"
      head={["case", "目标区块", "为什么注不进", "解法（待批）"]}
      rows={[
        [
          "SP-1 页头 crypto 轮",
          "LiteQuickTrade 顶部 coin 头 + 现价 + 今日% + Vol + ROUND 档位盘",
          "整块是页面组件内联 JSX（依赖 useQuickRounds / useSecondTick / COIN_META 局部状态），没有导出组件",
          "照 LiteTradeBlocks 的先例抽出 SpotHeadBlocks.tsx（纯展示、props 化），属生产改动，需单独批",
        ],
        [
          "SP-2 页头 stocks 日内",
          "LiteSpotTrade QuestionBlock：`STOCKS · DAILY UP/DOWN` + `Price to beat` + `TODAY 09:30–16:00`",
          "同上，内联 JSX 且与 usStockSessions 派生量耦合",
          "同上，并入 SpotHeadBlocks.tsx",
        ],
        [
          "SP-9 YOUR PICK 卡",
          "LiteQuickTrade 的 per-round 提问卡（题面 + Up/Down chips）",
          "卡壳内联；只有内部的 SideButton 是共享件",
          "抽 SpotPickCard（题面 + 两 chip），或维持旧 LiteSpotSection 的等价演示直至抽件",
        ],
        [
          "SP-15 右栏 rail 两变体",
          "`Also live now`（crypto）/ `More stocks closing today`（stocks）",
          "两处各自内联，且 stocks 侧数据来自页面内 useOtherStocks（运行时 fetch）",
          "抽 SpotSideRail（rows 由 props 注入），数据留在页面侧",
        ],
        [
          "SP-16 移动 buy-drawer 头",
          "MobileDrawer 内的抽屉头（side 徽标 + `Buy {ticker} {tf}` + 剩余时间 · 概率）",
          "抽屉头内联在页面 JSX 中；抽屉正文（LiteOrderPanel variant=mobile）已由 SP-10…12 的 375 帧覆盖",
          "抽 SpotBuyDrawerHeader；在此之前 SP-10…12 的移动帧即抽屉正文真身",
        ],
      ]}
    />
    <Table
      title="附注 · 轮次池与 loading 判定"
      head={["项", "结论"]}
      rows={[
        [
          "quick round 池规则",
          "见 memory crypto-quick-rounds：档位 5m / 15m / 1h / 4h / 1D，每档同一 coin 恒有且仅有一个 current round，前一轮结算瞬间生成下一轮；round 号与窗口均由服务端产生，前端只读。",
        ],
        [
          "loading 骨架（SP-17 判定）",
          "不新增 SP-17。LiteSpotTrade 与 LiteQuickTrade 的首载态都不是分块骨架，而是整屏居中 Loader2 —— 与合约页 TR-19 同一实现，故复用 TR-19，不另立 case。",
        ],
      ]}
    />
  </div>
);

const Ledger = () => (
  <div className="space-y-3">
    <Table
      title="并账清单 A · 合约交易 playground（LiteSection part=trade）逐条去向 —— M2c 删除挂载，文件保留仓库"
      head={["原文位置", "去向"]}
      rows={[
        ["Where things live", "并入 TR-24 note（档位行永远在 HOW MUCH 与 Returns 之间，Custom 固定行尾第 6 位，托盘就地展开不弹二级层）"],
        ["Boost selector（档位来自 category_boost_configs.max_leverage，禁硬编码）", "并入 TR-24 spec + note，全档 1×/2×/5×/10×/20× + Custom 展开"],
        ["Contract order card", "并入 TR-5 … TR-9（默认 / No 选中 / Custom 展开 / blockNotice / netting）"],
        ["Your call — position card + Cash out", "并入 TR-10 … TR-12（单仓 / multiHeld / voucher 标仓）"],
        ["Trade-page settled state · outcome card", "并入 TR-15（终态）与 TR-16（持有 winning 份额的派彩句）"],
        ["Trade-page settled state · how-it-settled proof", "并入 TR-17（两句逐字 + 数值判据 + 来源链接三态）"],
        ["History tape · RoundTape (one implementation)", "合约侧并入 TR-14 上游语境；RoundTape 本体规范移交 SP-3 / SP-4（唯一实现立在现货节）"],
        ["Contract chart", "并入 TR-3（含 Sample data 角标与 Needed 虚线三态）"],
        ["Crowd sentiment bar", "并入 TR-2（binary 唯一形态 + 移动紧凑 + 多市场不渲染）"],
        ["Market activity", "并入 TR-14（有行态 + 空态两态）"],
        ["Mobile mounting contexts", "由每个 case 的 375 帧承接 —— 双帧制度本身即挂载语境说明，不再单列"],
        ["In review — result pending", "并入 TR-18（徽标 / 两句 / 持仓追加句 / 面板 blocked 且倒计时钳 00:00:00）"],
        ["Multi-market board (3+ options)", "并入 TR-23（非 sports 多市场板 · showChart）"],
        ["Sports game lines（5 DDP + line-scrubber）", "并入 TR-20（WINNER 组）与 TR-21（HANDICAP + TOTAL GOALS 两把尺）；旧 registry key trade-sports-lines-* 与 line-scrubber 保留兼容、由新 case 复用挂载"],
      ]}
    />
    <Table
      title="并账清单 B · Lite spot 五节（LiteSpotSection）逐条去向 —— M2c 删除挂载，文件保留仓库"
      head={["原文位置", "去向"]}
      rows={[
        ["Lite spot · Order card (states)（6 预设：coin flip / Up 72¢ / Down 68¢ / 5¢·95¢ 边缘 / Market frozen / In review）", "并入 SP-10 … SP-12；blocked 两态（Market frozen / In review）由 TR-8 与 TR-18 的 blocked 口径统辖（同一 blocked/blockedReason 分支），现货侧不重复立案"],
        ["Lite spot · Chart toggle (odds follow the selected side)", "并入 SP-6（双 tab 与 side 联动）+ SP-7（price-to-beat 虚线）"],
        ["Lite spot · Shared modules（LiteMarketActivity 与合约页同件；quick-round 页无法确定性渲染的说明）", "activity 归 TR-14（同一组件，现货不复演）；quick-round 页不可确定性渲染的原文升级为本节「缺口回报」表 SP-1 / SP-9 / SP-15 / SP-16 四行，附解法"],
        ["Lite spot · SpotBlocks（crowd bar · settlement rail · your position）", "并入 SP-5（crowd bar）、SP-8 + SP-14（rail 交易中 / 结算态）、SP-13（持仓盈亏两态）；旧节的 in-review rail 变体并入 TR-18"],
        ["Lite quick round · YOUR PICK card + buy-drawer header（含 compact SideButton 与「% say」禁用裁定）", "目标态 = SP-9 / SP-16，当前受阻（见缺口表）；其中「chips 必须是共享 SideButton size='compact'、单行 `Up 49¢`、禁止 `% say` 副标（与 crowd bar 重复）」的裁定原文在此存续，抽件后随 SP-9 落案"],
      ]}
    />
    <Table
      title="并账清单 C · 结算态 DDP × 7（Pro 件）—— 本单下架挂载，key 与文件保留"
      head={["原文位置", "去向"]}
      rows={[
        ["settlement-row-futures-win-desktop / -mobile", "下架（Pro 结算行）；Lite 终态由 TR-15 承载"],
        ["settlement-row-spot-settled-desktop / -mobile", "下架；Lite 终态由 TR-15 + SP-14 承载"],
        ["settlement-row-spot-closed-desktop / -mobile", "下架；Lite 提前平仓的呈现归 Portfolio 页结算详情"],
        ["product-line-badge-legend", "下架（Futures / Spot 徽标为 Pro 概念）；Lite 侧品类标识见 Wallet 节 product badges"],
        ["resolved-market-card-spot", "下架；Lite 结算后的市场卡见 Events 页 EV 系列"],
        ["market-search-row-spot", "下架；Lite 无该入口"],
        ["HowItSettled 证明卡（原挂结算态节）", "并入 TR-17（Lite 真身，逐字两句）"],
      ]}
    />
  </div>
);

const Pair = ({
  cases,
  desktopMin,
  mobileMin,
}: {
  cases: SectionCase[];
  desktopMin?: number;
  mobileMin?: number;
}) => (
  <div className="space-y-6">
    <SectionFrame cases={cases} device="desktop" minHeight={desktopMin ?? 360} />
    <SectionFrame cases={cases} device="mobile" minHeight={mobileMin ?? 420} />
  </div>
);

export const SpotStatesSection = () => (
  <SectionWrapper
    id="spot-states"
    title="/spot · 现货轮 · 状态字典（SP-1 … SP-16）"
    description="crypto 快轮与 stocks 日内共用同一骨架，差异只在模块增删。16 个 case 全部用生产组件 + fixture 落案（M2d 抽出 SpotHeadBlocks.tsx 后，原 5 个缺口 SP-1 / SP-2 / SP-9 / SP-15 / SP-16 已补齐，缺口表撤除）。抽件为零视觉搬移，生产页渲染未变。"
  >
    <SubSection title="① 页头（SP-1 / SP-2）">
      <Pair cases={HEAD_CASES} desktopMin={420} mobileMin={520} />
    </SubSection>

    <SubSection title="② 轮次历史带（SP-3 / SP-4）">
      <Pair cases={TAPE_CASES} desktopMin={320} mobileMin={360} />
    </SubSection>

    <SubSection title="③ 行情与图表（SP-5 … SP-8）">
      <Pair cases={MARKET_CASES} desktopMin={1100} mobileMin={1300} />
    </SubSection>

    <SubSection title="④ 下单与持仓（SP-9 … SP-13）">
      <Pair cases={ORDER_CASES} desktopMin={1600} mobileMin={1800} />
    </SubSection>

    <SubSection title="⑤ 结算衔接（SP-14）">
      <Pair cases={SETTLE_CASES} desktopMin={420} mobileMin={480} />
    </SubSection>

    <SubSection title="⑥ 侧栏与抽屉（SP-15 / SP-16）">
      <Pair cases={RAIL_CASES} desktopMin={520} mobileMin={560} />
      <div className="mt-4 space-y-3">
        <div className="text-[11px] text-muted-foreground">
          SP-16 仅移动：抽屉头只在 MobileDrawer 内出现，桌面帧不予渲染。
        </div>
        <SectionFrame cases={DRAWER_CASES} device="mobile" minHeight={220} />
      </div>
    </SubSection>

    <SubSection title="⑦ 附注">
      <Gaps />
    </SubSection>

    <SubSection title="⑧ 并账清单（M2c 旧三节删除）">
      <Ledger />
    </SubSection>
  </SectionWrapper>
);


export default SpotStatesSection;
