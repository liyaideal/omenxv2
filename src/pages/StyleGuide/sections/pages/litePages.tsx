// ============================================================
// Lite area — one node per user-facing page. Pure composition:
// existing section files are imported and rendered untouched.
// ============================================================
import { SubSection, DualDevicePreview } from "../../components";
import { DeviceFrame } from "../../components/DeviceFrame";
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

export const LitePortfolioPage = ({ isMobile }: P) => (
  <LitePage
    id="lite-portfolio"
    title="Portfolio"
    route="/portfolio · /portfolio?tab=settled · /portfolio/settlement/:id"
    status="done"
    note="2026-08-19 改版：Live / Settled 两 tab（Rewards 开场 tab 制式），KPI 卡、voucher 发丝行、Boost/Standard 双段 chips、Boost check 仪表、持仓卡 / 桌面行式网格、结算月份分组与系列聚合行。以下全部挂载生产组件（fixture 数据驱动状态），非手抄。"
  >
    <SubSection title="Tabs · voucher 发丝行 · 双段 chips" description="开场 chrome，两态 chips 可直接点击切换。">
      <DeviceFrame previewKey="portfolio-lite-chrome" device="mobile" minHeight={220} />
    </SubSection>

    <SubSection title="KPI 卡（Live 正 / Settled / Live 负）" description="全账户口径，切段不变。">
      <DeviceFrame previewKey="portfolio-lite-kpi" device="mobile" minHeight={360} />
    </SubSection>

    <SubSection title="Boost check 仪表三态" description="Healthy &lt;80 / Getting tight ≥80 / Auto-close soon ≥95。">
      <DeviceFrame previewKey="portfolio-lite-gauge-states" device="mobile" minHeight={300} />
      <DeviceFrame previewKey="portfolio-lite-gauge-bar" device="desktop" minHeight={120} />
    </SubSection>

    <SubSection title="持仓卡：常规 / 热卡 / voucher 仓 / Standard + 挂单虚线行" description="热卡=现价距 auto-close ≤10%，整句转红且卡描边红。">
      <DeviceFrame previewKey="portfolio-lite-live-cards" device="mobile" minHeight={640} />
    </SubSection>

    <SubSection title="桌面行式网格" description="列模板 minmax(0,1fr) 110px 96px 104px 100px 150px 170px；热行 inset 左轨。">
      <DeviceFrame previewKey="portfolio-lite-desktop-rows" device="desktop" minHeight={260} />
    </SubSection>

    <SubSection title="Settled 列表" description="月份分组、auto-closed 红备注、cashed out early、系列聚合行、按月懒加载。">
      <DeviceFrame previewKey="portfolio-lite-settled" device="mobile" minHeight={420} />
    </SubSection>

    <SubSection title="空态" description="Live 段空态与 Settled 空态。">
      <DeviceFrame previewKey="portfolio-lite-empty" device="mobile" minHeight={220} />
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
