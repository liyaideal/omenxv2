// ============================================================
// Lite area — one node per user-facing page. Pure composition:
// existing section files are imported and rendered untouched.
// ============================================================
import { SubSection, DualDevicePreview } from "../../components";
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
  VouchersSection,
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
  { id: "lite-portfolio", page: "Portfolio", route: "/portfolio · /portfolio/settlements · /portfolio/airdrops", status: "todo" },
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
          2026-08-12 · 漂移修复 Round 2 — 删除 3 个 /vouchers v1 孤儿 demo（
          <code className="font-mono">voucher-page-list-level</code>、
          <code className="font-mono">voucher-redeemed-row</code>、
          <code className="font-mono">voucher-expired-row</code>
          ），原因：页面已并入 /rewards，镜像已无生产对应物。
        </li>
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
    note="v2 已上线：入口并入 /rewards 第三个 tab，双收益模式（instant → 钱包 / tiered → pending 池）。下方 v1 区块为改版前留档，仅作对照，不再是事实。"
  >
    <div className="space-y-12">
      <Vouchers2Section isMobile={isMobile} />
      <VouchersSection isMobile={isMobile} />
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

export const LitePortfolioPage = (_: P) => (
  <NotStartedPage
    id="lite-portfolio"
    title="Portfolio"
    route="/portfolio · /portfolio/settlements · /portfolio/airdrops"
    what="覆盖范围：持仓表、结算历史入口、equity 曲线、空态。"
  />
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
