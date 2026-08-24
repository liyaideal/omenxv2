// ============================================================
// Lite area — one node per user-facing page. Pure composition:
// existing section files are imported and rendered untouched.
// ============================================================
import { SubSection, DualDevicePreview } from "../../components";
import { DeviceFrame } from "../../components/DeviceFrame";
import { SectionFrame, type SectionCase } from "../../components/SectionFrame";

import { LitePage, NotStartedPage, StatusBadge, type RevampStatus } from "./shell";
import {
  MobileHomeSection,
  LiteSection,
  LiteAllStageSection,
  LiteVerticalViewsSection,
  LiteCalendarSection,
  LiteFinalTouchesSection,
  EventArtSection,
  LiteSpotSection,
  WalletSection,
  DepositWithdrawSection,
  RewardsSection,
  RewardsMobileSection,
  Vouchers2Section,
  ApiSection,
} from "../index";

type P = { isMobile: boolean };

/* ---------------- Progress overview ---------------- */

const PAGES: Array<{ id: string; page: string; route: string; status: RevampStatus }> = [
  { id: "lite-home", page: "Home", route: "/", status: "done" },
  { id: "lite-events", page: "Events 列表", route: "/events", status: "done" },
  { id: "lite-trade", page: "交易页（合约 + 现货 + 结算态）", route: "/trade · /spot", status: "done" },
  { id: "lite-wallet", page: "Wallet", route: "/wallet · /deposit · /withdraw · /wallet/recovery", status: "done" },
  { id: "lite-rewards", page: "Rewards", route: "/rewards", status: "done" },
  { id: "lite-vouchers", page: "Vouchers（并入 /rewards Tab）", route: "/rewards?tab=vouchers", status: "done" },
  { id: "lite-api", page: "API / Developers", route: "/settings/api · /developers", status: "done" },
  { id: "lite-portfolio", page: "Portfolio", route: "/portfolio · /portfolio?tab=settled · /portfolio/settlement/:id", status: "done" },
  { id: "lite-leaderboard", page: "Leaderboard", route: "/leaderboard", status: "todo" },
  { id: "lite-settings", page: "Settings", route: "/settings · /settings/transparency", status: "todo" },
  { id: "lite-insights", page: "Insights", route: "/insights", status: "todo" },
  {
    id: "lite-content",
    page: "内容页（FAQ · Glossary · About · Methodology · 法务）",
    route: "/faq · /glossary · /about · /methodology · /privacy-policy · /terms-of-service",
    status: "todo",
  },
];

export const LiteOverviewSection = (_: P) => (
  <section id="lite-overview" className="scroll-mt-20">
    <div className="mb-4 border-b border-border pb-2">
      <h2 className="text-xl font-semibold text-foreground">Lite — 改版进度总览</h2>
    </div>
    <p className="mb-5 max-w-3xl text-sm text-muted-foreground">
      Lite 区按<strong className="text-foreground">用户页面</strong>组织，一页一节。任何改版轮的状态展示只进对应页面节
      （没有该页面节就新建一节），不得散落到 Foundations / Legacy / Archive。徽标随改版进度更新。
    </p>
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
          <tr>
            <th className="px-4 py-2 font-medium">页面</th>
            <th className="px-4 py-2 font-medium">路由</th>
            <th className="px-4 py-2 font-medium">状态</th>
            <th className="px-4 py-2 font-medium">锚点</th>
          </tr>
        </thead>
        <tbody>
          {PAGES.map((p) => (
            <tr key={p.id} className="border-t border-border">
              <td className="px-4 py-2 text-foreground">{p.page}</td>
              <td className="px-4 py-2 font-mono text-[11px] text-muted-foreground">{p.route}</td>
              <td className="px-4 py-2"><StatusBadge status={p.status} /></td>
              <td className="px-4 py-2">
                <a className="font-mono text-[11px] text-primary hover:underline" href={`#${p.id}`}>
                  #{p.id}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="mt-6 rounded-xl border border-border p-4">
      <h3 className="mb-2 text-sm font-semibold text-foreground">Changelog</h3>
      <ul className="space-y-1 text-[12px] text-muted-foreground">
        <li>
          2026-08-17 · Sports Game Lines v1 —— 一场比赛 = 多条同{" "}
          <code className="font-mono">fixture_id</code> 的兄弟事件（winner / handicap / total），
          交易页在同一块 LiteMarketBoard 上按组渲染：组标题 + 让分/大小球各一行 +{" "}
          <code className="font-mono">LiteLineScrubber</code> 离散换线；chip 文案取兄弟事件的{" "}
          side_labels。非体育事件 DOM 完全不变。style-guide 交易页新增 6 键。
        </li>
        <li>
          2026-08-17 · 资金流移动端整治 —— /deposit /withdraw 判定为全屏流（§5 新判据）；账户/地址选择器
          收编 MobileDrawer，新增地址改为抽屉内二步（去嵌套），提交型抽屉统一 MobileDrawerActions
          Cancel+主按钮；Withdraw 主 CTA sticky；充值地址 §6 着色；style-guide 新增 10 键。
        </li>
        <li>
          2026-08-17 · Mobile Header System v1 —— Lite 移动端顶栏统一为一套组件 / 56px / A brand · B
          inner 两形态；收编 RedeemMobileHeader、Deposit/Withdraw、Recovery×2、Leaderboard 自绘头与
          <code className="font-mono">showActions</code>；标题 sentence case；Rewards Tabs 吸顶改读{" "}
          <code className="font-mono">--mobile-header-h</code>。style-guide Mobile patterns 新增 10 个
          375 iframe 预览键。A brand 形态含此前的开场式品牌栏（logo{" "}
          <code className="font-mono">lg</code>、无右侧占位方块、分割线滚动 &gt; 8px 后淡入）。
        </li>
        <li>
          2026-08-17 · Finance 视图 rounds 引擎新增一次性滚动锚点 —— 从移动 Intraday 的
          “session open” 行进入时自动把当日股票 rounds 滚进首屏，筛选保持 All / All regions。
        </li>
        <li>
          2026-08-14 · 全站时间口径统一（R1-R3）—— 展示层所有钟点改用户本地渲染、去掉 ET / HKT / KST
          等时区标（<code className="font-mono">formatLocalTime / formatLocalStamp / formatLocalDate /
          sessionWindowFor</code> 取代 <code className="font-mono">formatSessionStamp / formatEtTime /
          market.label / openLabel / closeLabel</code>）；场所名词保留（“HK closes …”“New York opens …”）；
          日词从本地时间戳重推；日历去掉「Times in TZ」与 spine 行的时区微标；Pro /spot 时间行与 schedule
          tooltip 去掉「Your time」冗余行。倒计时与时长不受影响，DB / 结算仍为 UTC。Foundations 新增
          「5. 时间口径（全站）」。
        </li>
        <li>
          2026-08-14 · 新增韩国市场（KRX 09:00–15:30 KST）与多会话并排芯片 ——{" "}
          <code className="font-mono">StockMarket</code> 增加 <code className="font-mono">short</code> /
          每市场 open-close 分钟数，<code className="font-mono">getMarketSession</code> 不再假设全市场 09:30–16:00；
          <code className="font-mono">groupStockRows</code> 返回 <code className="font-mono">openSessions[]</code>
          （按收盘时间升序），会话芯片改为「每个开市市场一枚」并排、窄屏横向滚动；
          <code className="font-mono">STOCKS CLOSING TODAY</code> 的 close 行用 · 串联多市场。
        </li>
        <li>
          2026-08-14 · Sports kickoff 时间口径统一 —— 行内 kickoff 改为用户本地时间、无时区微标，与日期签 /
          日期分组 / stage 卡（<code className="font-mono">kickoffLabel</code>）同一口径；
          <code className="font-mono">kickoffCell</code> 不再接 league 参数，删除{" "}
          <code className="font-mono">LEAGUE_ZONES / zoneForLeague</code> 死代码；ledger 时间格改单行垂直居中（列宽 74 不变）。
        </li>
        <li>
          2026-08-14 · LiteEventsPage 模块级骨架屏落地 —— 新增{" "}
          <code className="font-mono">src/components/lite/skeletons/LiteEventsSkeletons.tsx</code>
          （All-stage intraday/sports、桌面网格卡与移动列表卡）。品类 rail 属静态 chrome，首载即渲染真 pills、不骨架。仅首载显示，缓存直渲，
          各模块独立 loading 渐进点亮；纯中性色 #171A1F / #15181C + 统一 pulse，与终态逐模块同尺寸。
          style-guide #lite-events 补 loading 态 demo（真组件 + 375 真 iframe）。
        </li>
        <li>
          2026-08-13 · Vouchers v2.1 实装（CPO 定稿 sha 5f430ac4）— mobile redeem 全屏化（redeem 态隐藏
          BottomNav，头部 ‹ 唯一出口）；<code className="font-mono">VoucherDeskHeader</code> compact 改票根
          stub + 就地 disclosure；picker chrome 合并为单行 caption + 放大镜（分类 pills 仅在 eligible &gt; 8
          时渲染）；互补市场折叠为 <code className="font-mono">PickerDirectionPair</code>（44px、label 左 / 价格
          右、无 BINARY 尾签），多选按钮自带价格并删除行级重复价；
          <code className="font-mono">RedeemSummaryBar</code> 未选中不渲染、选中后坐底三行（桌面为 inline 卡）；
          新增 <code className="font-mono">PickerNoEligible</code> 空态。style-guide vouchers2 §6 改为六态
          playground（A–F，375 真 iframe）。
        </li>
        <li>
          2026-08-13 · CPO 批准（冻结画布一次性手术）— redeem picker 的{" "}
          <code className="font-mono">SideButton</code> 方向色统一到 market axis：Yes ={" "}
          <code className="font-mono">--yes</code> Pulse Blue、No = <code className="font-mono">--no</code> Volt，
          选中态按 tone 分色填充；neutral（binary Buy）不动。盈亏红绿仅留给 PnL。
        </li>
        <li>
          2026-08-12 · 漂移修复 Round D — 删除过期 IA 手抄件 <code className="font-mono">SectorRailDemo</code>
          （规则并入 All-stage 真 Category row caption）；wallet 权益带 preview 补移动分支（compact ×3 + space-y-3）；
          vouchers2 移动 redeem 屏改挂真 <code className="font-mono">RedeemSummaryBar</code>（inline）+ 真 ChevronLeft；
          多市场「对侧封锁」demo 改为 netting 现行态（<code className="font-mono">blockNotice: null</code> +
          <code className="font-mono">noAsSell</code> + <code className="font-mono">nettingScopeLabel</code>）；
          四个股票 RoundTape demo 文案对齐生产（Down won / closes at Tue 16:00）；
          LiteSpotSection 补 SpotBlocks 三件真 import demo；MobileHome 幽灵代码
          <code className="font-mono">TrialCallout/interlude</code> 删除、theme 表补 <code className="font-mono">poster</code>；
          WHERE_ROWS 与 Wallet 节文按 Standard/Boost 现行 IA 订正。
        </li>
        <li>
          2026-08-12 · CPO 裁定删除 Vouchers v1 留档块（两次被误读为现行规格）；仍服役组件 demo 并入 v2 节。
        </li>
        <li>
          2026-08-12 · CPO 抓获 RewardsMobile 假移动端（窄容器冒充 375 iframe），修复 + 全站清扫：
          <code className="font-mono">rewards-taskrow-playground</code> /{" "}
          <code className="font-mono">rewards-taskrow-board</code> 改走 DualDevicePreview 真 375 iframe。
        </li>
        <li>
          2026-08-12 · CPO 裁定补生产 — ineligible entry 拒绝 toast+跳转落地：
          <code className="font-mono">?entry=CODE</code> 绑定被拒时弹一次通用 toast 并 redirect 到{" "}
          <code className="font-mono">/</code>；<code className="font-mono">rewards-ineligible-redirect</code> demo
          改挂真 <code className="font-mono">IneligibleEntryToastBody</code>。
        </li>
        <li>
          2026-08-12 · 复审修复 Round 3 — Desktop Header 手绘 preview 删除，改挂真{" "}
          <code className="font-mono">EventsDesktopHeader</code>；Wallet 手抄 Transaction History Row
          删除（规格并入 <code className="font-mono">wallet-tx-history</code> caption）；
          <code className="font-mono">H2eRewardsCard</code>、
          <code className="font-mono">EquityHoverCardBody</code>、
          <code className="font-mono">SettlementPoster</code>、picker 的{" "}
          <code className="font-mono">PickerSkeleton / PickerEmpty / PickerSearchBar</code> 全部转活体。
        </li>
        <li>
          2026-08-12 · Legacy 标注条款 — 存量手抄块（Trading / Trading header playground / Spot /
          Deposit-Withdraw 的 Swap·Quote·Status / Lite quick round YOUR PICK）一律挂
          「存量手抄留档 — 未与生产逐行核对，不可作为研发规格；随该页改版一并转活体」，本轮不要求转活体。
        </li>
        <li>
          2026-08-12 · CPO 裁定删除 <code className="font-mono">voucher-position-chip</code> 孤儿 demo（生产 PositionCard 无此物，判为 v1 遗想，不落地）。
        </li>
        <li>
          2026-08-12 · 漂移修复 Round 2 — 删除 3 个 /vouchers v1 孤儿 demo（
          <code className="font-mono">voucher-page-list-level</code>、
          <code className="font-mono">voucher-redeemed-row</code>、
          <code className="font-mono">voucher-expired-row</code>
          ），原因：页面已并入 /rewards，镜像已无生产对应物。
        </li>
        <li>
          2026-08-12 · 漂移修复 Round 2 · P3 — 手抄碎屑转活体：T1 chip → 真{" "}
          <code className="font-mono">DirectionButton</code>、日历/Boost 品类底板 → 真{" "}
          <code className="font-mono">CategoryPill</code> + <code className="font-mono">TOP_CATEGORIES</code>、
          boost pill → 真 <code className="font-mono">TraitChip</code>；voucher banner / picker /
          redeem confirm bar 改为 import 生产纯展示件（
          <code className="font-mono">VoucherBannerView</code>、
          <code className="font-mono">EventPickerCard</code>、
          <code className="font-mono">RedeemSummaryBar</code>
          ）。概念示意图（Mobile patterns、API marketing）已加注标注。
        </li>
      </ul>
    </div>

    <div className="mt-4 rounded-xl border border-dashed border-border p-4">
      <h3 className="mb-2 text-sm font-semibold text-foreground">覆盖欠账（待补 demo）</h3>
      <p className="mb-2 text-[12px] text-muted-foreground">
        以下生产件目前在 style-guide 零覆盖或仅部分覆盖，登记为欠账，后续轮次补 demo：
      </p>
      <ul className="grid gap-1 text-[12px] text-muted-foreground sm:grid-cols-2">
        {[
          "AirdropHomepageModal",
          "AuthSheet",
          "移动 watchlistStatusLine",
          "Boost 组合空态（MobileIntradayModule / MobileSportsModule boostOnly）",
          "LiteCrowdOverview",
          "MultiMetaRow",
          "MoreMarkets / MoreStocks",
          "移动 CountdownLine",
          "已结算移动底条",
          "LiteStockChart currency / 时间轴分支",
          "SavedAddressesList / PendingConfirmations",
          "campaign 详情登录态 3 格统计",
          "Vouchers 空态 + metaCells",
          "GrantTaskRow frozen preset",
          "/rewards sticky Tabs",
        ].map((t) => (
          <li key={t}>· {t} — 待补 demo</li>
        ))}
      </ul>
    </div>
  </section>
);

/* ---------------- Page nodes ---------------- */

export const LiteHomePage = ({ isMobile }: P) => (
  <LitePage
    id="lite-home"
    title="Home"
    route="/"
    status="done"
    note="首页 feed 与移动首页模块。桌面首页目前复用同一批模块，暂无独立 demo。"
  >
    <MobileHomeSection isMobile={isMobile} />
  </LitePage>
);

export const LiteEventsPage = ({ isMobile }: P) => (
  <LitePage
    id="lite-events"
    title="Events 列表"
    route="/events"
    status="done"
    note="列表卡、All stage、垂类视图、日历视图、收官细节，以及事件封面插画契约（封面只在列表/卡片出现，故归入本页）。"
  >
    <LiteSection isMobile={isMobile} part="events" />
    <LiteAllStageSection />
    <LiteVerticalViewsSection />
    <LiteCalendarSection />
    <LiteFinalTouchesSection />
    <EventArtSection isMobile={isMobile} />
  </LitePage>
);

export const LiteTradePage = ({ isMobile }: P) => (
  <LitePage
    id="lite-trade"
    title="交易页（合约 + 现货 + 结算态）"
    route="/trade · /spot"
    status="done"
    note="单一交易页纪律：全站只有 /trade 与 /spot 两个交易页，任何品类都在这两个骨架内做模块增删。结算态展示也归本页。"
  >
    <LiteSection isMobile={isMobile} part="trade" />
    <LiteSpotSection isMobile={isMobile} />

    <section className="scroll-mt-20">
      <div className="mb-4 border-b border-border pb-2">
        <h2 className="text-xl font-semibold text-foreground">结算态 — settled rows &amp; product line</h2>
      </div>
      <p className="mb-6 max-w-3xl text-sm text-muted-foreground">
        成交结算后的呈现（futures win / spot settled / spot closed，桌面与移动），以及产品线徽标图例与结算后的市场卡/搜索行。
        同一批 preview 也出现在 Wallet 页节的结算历史上下文里 —— 归属理由：结算结果首先是交易页的终态。
      </p>
      <div className="space-y-10">
        <SubSection title="1. Settled rows — desktop" platform="desktop">
          <div className="space-y-4">
            <DualDevicePreview previewKey="settlement-row-futures-win-desktop" label="Futures — win" minHeight={140} />
            <DualDevicePreview previewKey="settlement-row-spot-settled-desktop" label="Spot — settled" minHeight={140} />
            <DualDevicePreview previewKey="settlement-row-spot-closed-desktop" label="Spot — closed early" minHeight={140} />
          </div>
        </SubSection>
        <SubSection title="2. Settled rows — mobile" platform="mobile">
          <div className="space-y-4">
            <DualDevicePreview previewKey="settlement-row-futures-win-mobile" label="Futures — win" minHeight={160} />
            <DualDevicePreview previewKey="settlement-row-spot-settled-mobile" label="Spot — settled" minHeight={160} />
            <DualDevicePreview previewKey="settlement-row-spot-closed-mobile" label="Spot — closed early" minHeight={160} />
          </div>
        </SubSection>
        <SubSection title="3. Product line badge legend" platform="shared">
          <DualDevicePreview previewKey="product-line-badge-legend" label="Futures / Spot" minHeight={120} />
        </SubSection>
        <SubSection title="4. Resolved market card + market search row (spot)" platform="shared">
          <div className="space-y-4">
            <DualDevicePreview previewKey="resolved-market-card-spot" label="Resolved market card" minHeight={200} />
            <DualDevicePreview previewKey="market-search-row-spot" label="Market search row" minHeight={140} />
          </div>
        </SubSection>
      </div>
    </section>
  </LitePage>
);

export const LiteWalletPage = ({ isMobile }: P) => (
  <LitePage
    id="lite-wallet"
    title="Wallet"
    route="/wallet · /deposit · /withdraw · /wallet/recovery"
    status="done"
    note="Dual-account（Boost / Standard）余额与转账、交易历史，以及充值 / 提现动线。"
  >
    <WalletSection isMobile={isMobile} />
    <DepositWithdrawSection isMobile={isMobile} />
  </LitePage>
);

export const LiteRewardsPage = ({ isMobile }: P) => (
  <LitePage
    id="lite-rewards"
    title="Rewards"
    route="/rewards · /rewards/campaign/:id"
    status="done"
    note="Campaign 网格、详情页、Referral，以及任务行的全状态 playground（桌面三列 / 移动两层）。"
  >
    <RewardsSection isMobile={isMobile} />
    <RewardsMobileSection isMobile={isMobile} />
  </LitePage>
);

export const LiteVouchersPage = ({ isMobile }: P) => (
  <LitePage
    id="lite-vouchers"
    title="Vouchers"
    route="/rewards?tab=vouchers（/vouchers 重定向）"
    status="done"
    note="v2 已上线：入口并入 /rewards 第三个 tab，双收益模式（instant → 钱包 / tiered → pending 池）。本节只呈现现行事实，v1 留档块已删除（旧设计见 CD 存档与 git 历史）。"
  >
    <div className="space-y-12">
      <Vouchers2Section isMobile={isMobile} />
    </div>
  </LitePage>
);

export const LiteApiPage = ({ isMobile }: P) => (
  <LitePage
    id="lite-api"
    title="API / Developers"
    route="/settings/api · /developers"
    status="done"
    note="Tier track、密钥表、创建向导，以及 /developers 移动端 tier stepper。"
  >
    <ApiSection isMobile={isMobile} />
  </LitePage>
);

const PORTFOLIO_MOBILE_CASES: SectionCase[] = [
  {
    key: "portfolio-lite-chrome",
    label: "Tabs · voucher 发丝行 · 双段 chips",
    note: "开场 chrome：Live / Settled 两 tab + voucher 发丝行 + Boost/Standard 双段 chips。",
    spec: [
      {
        state: "voucher 发丝行 · 显示",
        when: "voucherCount > 0",
        visual: "tabs 下一条 volt 发丝行，文案带券数",
        source: "VoucherHairline",
      },
      {
        state: "voucher 发丝行 · 隐藏",
        when: "voucherCount === 0",
        visual: "整行不渲染（不是占位空行）",
        source: "VoucherHairline",
      },
      {
        state: "chips 有计数",
        when: "boostLive.length > 0 || standardLive.length > 0",
        visual: "chip 文案后跟计数；选中 chip volt 底",
        source: "SegmentChips",
      },
      {
        state: "chips 计数为 0",
        when: "对应 segment 数组为空",
        visual: "chip 仍渲染并可点，计数显示 0",
        source: "SegmentChips",
      },
    ],
  },
  {
    key: "portfolio-lite-kpi-mobile",
    label: "KPI 卡 · 移动（Live 正 / Live 负 / 零态 / Settled 2 卡）",
    note: "移动端一律 2 列；3 列口径只在桌面成立（见桌面 frame）。KPI 永远是全账户口径，segment chips 不影响它。",
    spec: [
      { state: "Live 盈利", when: "profitTotal > 0.005", visual: "PROFIT 值 +$X，volt/green 色", source: "useLitePortfolio.kpi" },
      { state: "Live 亏损", when: "profitTotal < −0.005", visual: "PROFIT 值 −$X，红色", source: "useLitePortfolio.kpi" },
      {
        state: "零态",
        when: "Math.abs(value) < 0.005（isZeroMoney）",
        visual: "$0.00，不带 +/− 符号、不上色（muted）",
        source: "isZeroMoney",
      },
      { state: "Settled 移动 2 卡", when: "tab === 'settled' && 移动宽度", visual: "WIN RATE / NET PROFIT 两卡", source: "LitePortfolio" },
    ],
  },
  {
    key: "portfolio-lite-gauge-states",
    label: "Boost check 仪表三态",
    note: "口径：riskRatio = imTotal / equity × 100，账户级跨仓（不是单仓）；untilAutoClose = equity − imTotal。仪表只在账户存在 Boost 持仓时渲染，Standard-only 账户完全不画。",
    spec: [
      { state: "Healthy", when: "riskRatio < 80", visual: "绿字 Healthy + 绿色进度条", source: "boostState()" },
      { state: "Getting tight", when: "80 ≤ riskRatio < 95", visual: "琥珀字 Getting tight + 琥珀条", source: "boostState()" },
      { state: "Auto-close soon", when: "riskRatio ≥ 95", visual: "红字 Auto-close soon + 红条", source: "boostState()" },
      { state: "不渲染", when: "boostLive.length === 0", visual: "整张 Boost check 卡不出现", source: "LitePortfolio" },
    ],
  },
  {
    key: "portfolio-lite-live-cards",
    label: "持仓卡全状态 + 挂单行两态",
    note: "发红只有一个来源：hot。hot 与盈亏正负无关 —— 亏损但离 auto-close 还远的卡不红，盈利但贴近 auto-close 的卡也会红。",
    spec: [
      {
        state: "常规卡（不红）",
        when: "hot === false",
        visual: "卡片无描边；payout 句 #6B7280",
        source: "live[].hot",
      },
      {
        state: "热卡（整句发红）",
        when: "autoClosePrice != null && Math.abs(priceNow − autoClosePrice) / priceNow ≤ 0.10",
        visual: "卡片 1px solid rgba(255,92,92,.55)；payout 整句 RED（桌面行为 inset 3px 红左轨 + rgba(255,92,92,.04) 底）",
        source: "useLitePortfolio.hot",
      },
      {
        state: "追加 auto-close 后缀",
        when: "segment === 'boost' && leverageNum > 1 && autoCloseState === 'level' && autoClosePrice != null",
        visual: "主句后追加 ` · auto-close ≈{cents}`",
        source: "autoCloseState",
      },
      {
        state: "无后缀",
        when: "segment === 'standard' || autoCloseState === 'none' || autoCloseState === 'missing'",
        visual: "只有 `If it wins you get $X`，不画 `auto-close —` 占位",
        source: "autoCloseState",
      },
      { state: "voucher 行", when: "isVoucher === true", visual: "meta 行尾追加 volt 色 `Voucher`", source: "airdropSource === 'voucher'" },
      { state: "挂单行 · 有单", when: "orders.length > 0", visual: "虚线折叠行 `n orders waiting to fill · placed in Pro`，点开跳 Pro", source: "PendingOrdersRow" },
      { state: "挂单行 · 无单", when: "orders.length === 0", visual: "组件 return null，不占高度", source: "PendingOrdersRow" },
    ],
  },
  {
    key: "portfolio-lite-settled",
    label: "Settled 列表",
    note: "按月份分组、按月懒加载。备注行的三态完全由 closeReason 决定，不看盈亏。",
    spec: [
      { state: "settlement", when: "closeReason === 'settlement'", visual: "无红备注，正常结算行", source: "resolvedGrouping" },
      { state: "auto_close", when: "closeReason === 'auto_close'", visual: "行内红字备注 auto-closed", source: "closeReason" },
      { state: "cashout", when: "closeReason === 'cashout'", visual: "备注 `cashed out early`（中性色）", source: "closeReason" },
      { state: "系列聚合行", when: "isSeries === true", visual: "一行代表整个系列，点进系列详情而非单仓详情", source: "isSeries" },
      { state: "零结果行", when: "Math.abs(net) < 0.005", visual: "muted $0.00，不带符号", source: "isZeroMoney" },
    ],
  },
  {
    key: "portfolio-lite-detail-won-mobile",
    label: "单仓结算详情 · 移动（settlement + won）",
    note: "移动端为纵列：概览 → Side/Avg price/Shares/Settled price/Cost/Fees/Payout/Placed/Settled → ACTIVITY。",
    spec: [
      { state: "won", when: "closeReason === 'settlement' && outcomeWon === true", visual: "眉线 SETTLED，`Won +$X` 绿", source: "SettlementDetailVM" },
      { state: "Payout 公式", when: "始终", visual: "Payout = max(0, Cost + PnL − Fees)", source: "settlementCopy" },
    ],
  },
  {
    key: "portfolio-lite-detail-autoclosed-mobile",
    label: "单仓结算详情 · 移动（auto_close）",
    spec: [
      { state: "auto_close", when: "closeReason === 'auto_close'", visual: "眉线 CLOSED；`Closed at 25¢ · auto-closed` 整值红；时间行 label 为 Closed", source: "closeReason" },
      { state: "零回收", when: "payout === 0", visual: "Payout $0.00 → 副行 `nothing returned`", source: "settlementCopy" },
    ],
  },
  {
    key: "portfolio-lite-series-mobile-page",
    label: "系列详情 · 移动独立整页",
    note: "移动端选中 series 时不是内嵌面板，而是自己的一页。",
    spec: [
      {
        state: "移动系列页",
        when: "isMobile && searchParams.series != null",
        visual: "MobileHeader variant='inner' + 返回 /portfolio?tab=settled；无 brand 头 / tabs / KPI / chips",
        source: "LitePortfolio",
      },
    ],
  },
  {
    key: "portfolio-lite-empty",
    label: "空态",
    spec: [
      { state: "Live 空", when: "live.length === 0 && !isLoading", visual: "`No live calls yet` + Browse events 主按钮", source: "LitePortfolio" },
      { state: "Settled 空", when: "settled.length === 0 && !isLoading", visual: "`Nothing settled yet`，无按钮", source: "LitePortfolio" },
    ],
  },
  {
    key: "portfolio-lite-auth-gate-out",
    label: "未登录门 LiteAuthGate · 未登录",
    note: "门高度锁定：移动 min/maxHeight 420px，桌面 400px，避免大片空白模糊区。",
    spec: [
      {
        state: "未登录",
        when: "user === null",
        visual:
          "children 层 blur-[3px] + opacity-70 + pointer-events-none；上覆 bg-background/40 遮罩：Lynx 100px + 标题 `Sign in to view your portfolio` + 描述 + Sign in（btn-primary）/ Create account（描边 pill）",
        source: "useAuth().user",
      },
      {
        state: "点击任一 CTA",
        when: "authOpen === true",
        visual: "isMobile → AuthSheet；!isMobile → AuthDialog。两个按钮打开同一个入口",
        source: "useIsMobile()",
      },
    ],
  },
  {
    key: "portfolio-lite-auth-gate-in",
    label: "未登录门 LiteAuthGate · 已登录",
    spec: [
      {
        state: "已登录",
        when: "user !== null",
        visual: "门直接 return children：无模糊、无遮罩、无高度锁定",
        source: "useAuth().user",
      },
    ],
  },

  {
    key: "portfolio-lite-error",
    label: "详情页错误边界",
    spec: [
      {
        state: "详情渲染抛错",
        when: "详情子树 throw",
        visual: "降级为 `Something went wrong` + Back to settled，不白屏",
        source: "PortfolioErrorBoundary",
      },
    ],
  },
];

const PORTFOLIO_DESKTOP_CASES: SectionCase[] = [
  {
    key: "portfolio-lite-kpi-desktop",
    label: "KPI 卡 · 桌面（Live 3 卡 · Settled 3 卡 + RECORD）",
    note: "3 列 KPI 只在桌面宽度成立，移动端强制 2 列（见移动 frame）。",
    spec: [
      { state: "Live 桌面", when: "tab === 'live' && ≥ md", visual: "COST / NOW WORTH / PROFIT 三卡", source: "LitePortfolio" },
      { state: "Settled 桌面", when: "tab === 'settled' && ≥ md", visual: "WIN RATE / NET PROFIT / RECORD 三卡，RECORD 格式 `7W 5L`", source: "LitePortfolio" },
      { state: "零态", when: "Math.abs(value) < 0.005", visual: "muted $0.00，无符号", source: "isZeroMoney" },
    ],
  },
  {
    key: "portfolio-lite-gauge-bar",
    label: "Boost check 条（桌面）",
    note: "与移动仪表同一套阈值与口径，只是排布为行内条。",
    spec: [
      { state: "Healthy", when: "riskRatio < 80", visual: "绿条", source: "boostState()" },
      { state: "Getting tight", when: "80 ≤ riskRatio < 95", visual: "琥珀条", source: "boostState()" },
      { state: "Auto-close soon", when: "riskRatio ≥ 95", visual: "红条", source: "boostState()" },
    ],
  },
  {
    key: "portfolio-lite-desktop-rows",
    label: "桌面行式网格（含 voucher 行 / 热行 / 零盈亏行）",
    note: "列模板：minmax(0,1fr) minmax(110px,200px) 96px 104px 100px 150px 170px。",
    spec: [
      {
        state: "热行",
        when: "hot === true（|priceNow − autoClosePrice| / priceNow ≤ 0.10）",
        visual: "inset 3px 0 0 rgba(255,92,92,.7) 左轨 + rgba(255,92,92,.04) 底 + payout 列整句 RED",
        source: "live[].hot",
      },
      {
        state: "AUTO-CLOSE / IF WINS 列",
        when: "始终显示主句；autoCloseState === 'level' 时追加",
        visual: "`If it wins → $X`，有价才追加 `· auto-close ≈{cents}`",
        source: "LiveRow",
      },
      { state: "voucher 行", when: "isVoucher === true", visual: "CALL 列 meta 尾部 volt `Voucher`", source: "airdropSource" },
      { state: "零盈亏行", when: "Math.abs(profit) < 0.005", visual: "PROFIT 列 muted $0.00", source: "isZeroMoney" },
      { state: "Side chip 溢出", when: "sideWord 过长", visual: "chip truncate + hover tooltip 显示全文", source: "LiveRow" },
    ],
  },
  {
    key: "portfolio-lite-detail-won",
    label: "单仓结算详情 · 桌面（settlement + won）",
    note: "v1.17 §4b：back 链接 + 标题行 + meta + KPI 三卡 + DETAILS / ACTIVITY 双卡。",
    spec: [
      { state: "won", when: "closeReason === 'settlement' && outcomeWon === true", visual: "RESULT 卡 +$X 绿，副行 `Won · Up settled at $1.00`", source: "SettlementDetailVM" },
      { state: "Payout", when: "始终", visual: "max(0, Cost + PnL − Fees)，副行 `after $F fees`", source: "settlementCopy" },
      { state: "View event", when: "eventId != null", visual: "右上 `View event ›`，带 fromState 返回本详情页", source: "portfolioReturn" },
    ],
  },
  {
    key: "portfolio-lite-detail-autoclosed",
    label: "单仓结算详情 · 桌面（auto_close）",
    spec: [
      { state: "auto_close", when: "closeReason === 'auto_close'", visual: "眉线 CLOSED；`Closed at 25¢ · auto-closed` 整值红；时间行 label Closed", source: "closeReason" },
      { state: "零回收", when: "payout === 0", visual: "Payout $0.00 → 副行 `nothing returned`", source: "settlementCopy" },
    ],
  },
  {
    key: "portfolio-lite-detail-cashout",
    label: "单仓结算详情 · 桌面（cashout）",
    spec: [
      {
        state: "cashout",
        when: "closeReason === 'cashout'",
        visual: "`Closed at 48¢ · cashed out early`，时间行 label Closed；outcomeWon 不参与文案",
        source: "closeReason",
      },
    ],
  },
  {
    key: "portfolio-lite-detail-lost",
    label: "单仓结算详情 · 桌面（settlement + lost）",
    spec: [
      {
        state: "lost",
        when: "closeReason === 'settlement' && outcomeWon === false",
        visual: "`Settled at $0.00 · Up lost`；Payout $0.00 → `nothing returned`",
        source: "outcomeWon",
      },
    ],
  },
  {
    key: "portfolio-lite-series-detail",
    label: "系列结算详情 · 桌面",
    note: "§4d：Net = Payout − Cost（费后）。",
    spec: [
      { state: "眉线", when: "始终", visual: "`SERIES · WON {wins} OF {rounds.length}`", source: "SeriesDetailVM" },
      { state: "轮次行", when: "rounds[]", visual: "每轮一行，可点进该轮单仓详情", source: "SeriesDetail" },
      { state: "auto-closed 轮", when: "round.autoClosed === true", visual: "该行追加红字 auto-closed", source: "round.autoClosed" },
    ],
  },
  {
    key: "portfolio-lite-series-extremes",
    label: "系列两极 + Standard/Boost 口径",
    spec: [
      { state: "全胜", when: "wins === rounds.length", visual: "`WON 2 OF 2`，Net 正", source: "SeriesDetailVM" },
      { state: "全败", when: "wins === 0", visual: "`WON 0 OF 2`，Payout $0.00", source: "SeriesDetailVM" },
      { state: "非日轮", when: "isDailyRounds === false", visual: "轮次文案改为按日期而非 Day n；segmentLabel 显示 Boost", source: "isDailyRounds" },
    ],
  },
];

const READ_ME =
  "怎么读这一节：所有状态都由 useLitePortfolio 派生的字段驱动（segment / isVoucher / autoCloseState / hot / closeReason / isSeries / isZeroMoney）。每个 case 下方的表给出「触发条件 → 视觉结果 → 字段来源」，条件都是可判定表达式，可直接照抄进实现；表里没有列出的组合视为不存在，不要自行发挥。";

export const LitePortfolioPage = ({ isMobile }: P) => (
  <LitePage
    id="lite-portfolio"
    title="Portfolio"
    route="/portfolio · /portfolio?tab=settled · /portfolio/settlement/:id"
    status="done"
    note="2026-08-19 改版：Live / Settled 两 tab（Rewards 开场 tab 制式），KPI 卡、voucher 发丝行、Boost/Standard 双段 chips、Boost check 仪表、持仓卡 / 桌面行式网格、结算月份分组与系列聚合行。以下全部挂载生产组件（fixture 数据驱动状态），非手抄。"
  >
    <div className="rounded-lg border border-border/40 bg-muted/10 p-3 text-[11px] leading-relaxed text-muted-foreground">
      {READ_ME}
    </div>

    <SubSection
      title="移动端全状态（375 · 单 iframe）"
      description="整节移动端案例合并在一个 375px iframe 里按顺序纵向排列，每段上方有 label 分隔线；下方按 case 给出触发条件表。本 frame 内只有移动端组件。"
    >
      <SectionFrame device="mobile" minHeight={900} cases={PORTFOLIO_MOBILE_CASES} />
    </SubSection>

    <SubSection
      title="桌面端全状态（单 iframe）"
      description="整节桌面端案例合并在一个桌面宽 iframe 里，且只包含桌面组件（双端对照请对照上方移动 frame）。3 列 KPI、行式网格与结算详情只在桌面宽度成立。"
    >
      <SectionFrame device="desktop" minHeight={900} cases={PORTFOLIO_DESKTOP_CASES} />
    </SubSection>
  </LitePage>
);

export const LiteLeaderboardPage = (_: P) => (
  <NotStartedPage
    id="lite-leaderboard"
    title="Leaderboard"
    route="/leaderboard"
    what="覆盖范围：霓虹 hero（现有豁免）、榜单行、周期切换、我的排名条。"
  />
);

export const LiteSettingsPage = (_: P) => (
  <NotStartedPage
    id="lite-settings"
    title="Settings"
    route="/settings · /settings/transparency"
    what="覆盖范围：账户设置主页、通知/安全分组、transparency 子页（其现有 demo 暂存 Legacy 区，改版后迁入本节）。"
  />
);

export const LiteInsightsPage = (_: P) => (
  <NotStartedPage
    id="lite-insights"
    title="Insights"
    route="/insights"
    what="覆盖范围：洞察列表、文章详情、空态。"
  />
);

export const LiteContentPage = (_: P) => (
  <NotStartedPage
    id="lite-content"
    title="内容页（FAQ · Glossary · About · Methodology · 法务）"
    route="/faq · /glossary · /about · /methodology · /privacy-policy · /terms-of-service"
    what="覆盖范围：共用 SeoPageLayout（现有豁免），改版时作为一轮统一处理。"
  />
);
