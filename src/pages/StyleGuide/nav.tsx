// ============================================================
// /style-guide information architecture — four top-level areas:
//   A) Lite       — one node per user page, each carrying a revamp badge
//   B) Foundations— cross-page primitives + 全站规范
//   C) Legacy     — surfaces not yet revamped, stored as-is
//   D) Archive    — retired components
// Navigation shell ONLY — every section file below is a living spec and is
// imported as-is. Never rewrite a section to fit the nav.
// ============================================================
import { SectionWrapper } from "./components/SectionWrapper";
import { TradingHeaderPlayground } from "./components/TradingHeaderPlayground";
import {
  DesignTokensSection,
  TypographySection,
  AnimationsSection,
  CommonUISection,
  FormsSection,
  UserIdentitySection,
  TradingSection,
  SpotSection,
  TransparencySection,
  MobilePatternsSection,
  WorldCupSection,
  StatesSection,
  EmptyStatesSection,
  GlobalStandardsSection,
  ArchiveSection,
} from "./sections";
import {
  LiteOverviewSection,
  LiteHomePage,
  LiteEventsPage,
  LiteTradePage,
  LiteWalletPage,
  LiteRewardsPage,
  LiteVouchersPage,
  LiteApiPage,
  LitePortfolioPage,
  LiteLeaderboardPage,
  LiteSettingsPage,
  LiteInsightsPage,
  LiteContentPage,
} from "./sections/pages/litePages";

export interface SectionEntry {
  id: string;
  label: string;
  render: (isMobile: boolean) => JSX.Element;
}

export interface SectionGroup {
  id: string;
  label: string;
  sections: SectionEntry[];
}

const s = (
  id: string,
  label: string,
  Comp: (props: { isMobile: boolean }) => JSX.Element,
): SectionEntry => ({
  id,
  label,
  render: (isMobile) => <Comp isMobile={isMobile} />,
});

export const STYLE_GUIDE_GROUPS: SectionGroup[] = [
  {
    id: "lite",
    label: "Lite — 按页面",
    sections: [
      s("lite-overview", "改版进度总览", LiteOverviewSection),
      s("lite-home", "Home ✅", LiteHomePage),
      s("lite-events", "Events 列表 ✅", LiteEventsPage),
      s("lite-trade", "交易页 ✅", LiteTradePage),
      s("lite-wallet", "Wallet ✅", LiteWalletPage),
      s("lite-rewards", "Rewards ✅", LiteRewardsPage),
      s("lite-vouchers", "Vouchers ⏳", LiteVouchersPage),
      s("lite-api", "API / Developers ✅", LiteApiPage),
      s("lite-portfolio", "Portfolio ⏳", LitePortfolioPage),
      s("lite-leaderboard", "Leaderboard ⏳", LiteLeaderboardPage),
      s("lite-settings", "Settings ⏳", LiteSettingsPage),
      s("lite-insights", "Insights ⏳", LiteInsightsPage),
      s("lite-content", "内容页 ⏳", LiteContentPage),
    ],
  },
  {
    id: "foundations",
    label: "Foundations",
    sections: [
      s("global-standards", "全站规范", GlobalStandardsSection),
      s("tokens", "Design tokens", DesignTokensSection),
      s("typography", "Typography", TypographySection),
      s("animations", "Animations", AnimationsSection),
      s("ui", "Common UI", CommonUISection),
      s("forms", "Forms", FormsSection),
      s("states", "States", StatesSection),
      s("empty-states", "Empty states", EmptyStatesSection),
      s("mobile-patterns", "Mobile patterns", MobilePatternsSection),
      s("identity", "User identity", UserIdentitySection),
    ],
  },
  {
    id: "legacy",
    label: "Legacy — 未改版存量",
    sections: [
      s("trading", "Trading (Pro 终端)", TradingSection),
      {
        id: "trading-header",
        label: "Trading header playground",
        render: () => (
          <SectionWrapper
            id="trading-header"
            title="Trading header playground"
            platform="shared"
          >
            <TradingHeaderPlayground />
          </SectionWrapper>
        ),
      },
      s("spot", "Spot (Pro 现货)", SpotSection),
      s("transparency", "Transparency", TransparencySection),
      s("worldcup", "World Cup (legacy)", WorldCupSection),
    ],
  },
  {
    id: "archive",
    label: "Archive — 退役件",
    sections: [s("archive", "PageTitle / PageHeader", ArchiveSection)],
  },
];

export const ALL_SECTIONS: SectionEntry[] = STYLE_GUIDE_GROUPS.flatMap((g) => g.sections);

/** Legacy hash/tab ids kept alive so old deep links still resolve. */
export const SECTION_ALIASES: Record<string, string> = {
  // pre-restructure ids → the page node that absorbed them
  home: "lite-home",
  "mobile-home": "lite-home",
  lite: "lite-events",
  "lite-all-stage": "lite-events",
  "lite-verticals": "lite-events",
  "lite-calendar": "lite-events",
  "lite-final-touches": "lite-events",
  "event-art": "lite-events",
  "lite-spot": "lite-trade",
  wallet: "lite-wallet",
  deposit: "lite-wallet",
  rewards: "lite-rewards",
  "rewards-mobile": "lite-rewards",
  vouchers: "lite-vouchers",
  api: "lite-api",
  mobile: "mobile-patterns",
};

export const resolveSectionId = (raw: string | null | undefined): string | null => {
  if (!raw) return null;
  const key = raw.replace(/^#/, "");
  if (ALL_SECTIONS.some((x) => x.id === key)) return key;
  return SECTION_ALIASES[key] ?? null;
};
