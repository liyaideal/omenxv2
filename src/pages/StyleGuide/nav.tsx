// ============================================================
// /style-guide information architecture — four top-level areas:
//   A) Lite       — one node per user page, each carrying a revamp badge
//   B) Foundations— cross-page primitives + 全站规范
//   C) Legacy     — surfaces not yet revamped, stored as-is
//   D) Archive    — retired components
// Navigation shell ONLY — every section file below is a living spec and is
// imported as-is. Never rewrite a section to fit the nav.
//
// Perf: every section is code-split with React.lazy so opening the style
// guide only downloads the chunk for the section actually being viewed.
// Never import the `./sections` barrel here — it defeats the splitting.
// ============================================================
import { lazy, type ComponentType } from "react";

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

type P = { isMobile: boolean };

/** Lazy-load a named export as a section component. */
const lz = (loader: () => Promise<Record<string, unknown>>, name: string) =>
  lazy(async () => ({ default: (await loader())[name] as ComponentType<P> }));

const s = (id: string, label: string, Comp: ComponentType<P>): SectionEntry => ({
  id,
  label,
  render: (isMobile) => <Comp isMobile={isMobile} />,
});

/* ---------------- Lite — one node per page ---------------- */
/** One file per page node — never a barrel: a barrel drags every section chunk in. */
const lp = (file: string, name = file) =>
  lz(() => import(`./sections/pages/${file}.tsx`), name);

/* ---------------- Foundations / Legacy / Archive ---------------- */
const sec = (file: string, name: string) =>
  lz(() => import(`./sections/${file}.tsx`), name);

const MobilePatternsSection = lz(() => import("./sections/MobilePatternsSection"), "MobilePatternsSection");
const LiteSection = lazy(async () => ({
  default: (await import("./sections/LiteSection")).LiteSection as ComponentType<any>,
}));
const MobilePatternsNode = ({ isMobile }: P) => (
  <>
    <MobilePatternsSection isMobile={isMobile} />
    <LiteSection isMobile={isMobile} part="mobile-header" />
  </>
);

export const STYLE_GUIDE_GROUPS: SectionGroup[] = [
  {
    id: "lite",
    label: "Lite — 按页面",
    sections: [
      s("lite-overview", "改版进度总览", lp("LiteOverviewSection")),
      s("lite-events", "Events 列表 ✅", lp("LiteEventsPage")),
      s("lite-trade", "交易页 ✅", lp("LiteTradePage")),
      s("lite-wallet", "Wallet ✅", lp("LiteWalletPage")),
      s("auth", "登录 / 注册 ✅", lp("AuthPage")),
      s("lite-rewards", "Rewards ✅", lp("LiteRewardsPage")),
      s("lite-vouchers", "Vouchers ✅", lp("LiteVouchersPage")),
      s("lite-h2e", "H2E Campaign ✅", lp("LiteH2ePage")),
      s("lite-api", "API / Developers ✅", lp("LiteApiPage")),
      s("lite-portfolio", "Portfolio ✅", lp("LitePortfolioPage")),
      s("lite-leaderboard", "Leaderboard ⏳", lp("LiteStubPages", "LiteLeaderboardPage")),
      s("lite-settings", "Settings ⏳", lp("LiteStubPages", "LiteSettingsPage")),
      s("lite-insights", "Insights ⏳", lp("LiteStubPages", "LiteInsightsPage")),
      s("lite-content", "内容页 ⏳", lp("LiteStubPages", "LiteContentPage")),
    ],
  },
  {
    id: "foundations",
    label: "Foundations",
    sections: [
      s("global-standards", "全站规范", sec("GlobalStandardsSection", "GlobalStandardsSection")),
      s("tokens", "Design tokens", sec("DesignTokensSection", "DesignTokensSection")),
      s("typography", "Typography", sec("TypographySection", "TypographySection")),
      s("animations", "Animations", sec("AnimationsSection", "AnimationsSection")),
      s("ui", "Common UI", sec("CommonUISection", "CommonUISection")),
      s("forms", "Forms", sec("FormsSection", "FormsSection")),
      s("states", "States", sec("StatesSection", "StatesSection")),
      s("empty-states", "Empty states", sec("EmptyStatesSection", "EmptyStatesSection")),
      s("mobile-patterns", "Mobile patterns", MobilePatternsNode),
      s("identity", "User identity", sec("UserIdentitySection", "UserIdentitySection")),
      // M1b: 从 Events 页并账迁入 —— 美术方向是全站规范，不属于单页状态字典。
      s("event-art", "Event 美术方向", sec("EventArtSection", "EventArtSection")),
      s("message-center", "Message Center（Backlog）", sec("MessageCenterSection", "MessageCenterSection")),
    ],
  },
  {
    id: "legacy",
    label: "Legacy — 未改版存量",
    sections: [
      s("transparency", "Transparency", sec("TransparencySection", "TransparencySection")),
      s("worldcup", "World Cup (legacy)", sec("WorldCupSection", "WorldCupSection")),
    ],
  },
  {
    id: "archive",
    label: "Archive — 退役件",
    sections: [s("archive", "PageTitle / PageHeader", sec("ArchiveSection", "ArchiveSection"))],
  },
];

export const ALL_SECTIONS: SectionEntry[] = STYLE_GUIDE_GROUPS.flatMap((g) => g.sections);

/** Legacy hash/tab ids kept alive so old deep links still resolve. */
export const SECTION_ALIASES: Record<string, string> = {
  // pre-restructure ids → the page node that absorbed them
  lite: "lite-trade",
  "lite-all-stage": "lite-events",
  "lite-verticals": "lite-events",
  "lite-calendar": "lite-events",
  "lite-final-touches": "lite-events",
  "lite-spot": "lite-trade",
  wallet: "lite-wallet",
  deposit: "lite-wallet",
  rewards: "lite-rewards",
  "rewards-mobile": "lite-rewards",
  vouchers: "lite-vouchers",
  vouchers2: "lite-vouchers",
  api: "lite-api",
  mobile: "mobile-patterns",
};

export const resolveSectionId = (raw: string | null | undefined): string | null => {
  if (!raw) return null;
  const key = raw.replace(/^#/, "");
  if (ALL_SECTIONS.some((x) => x.id === key)) return key;
  return SECTION_ALIASES[key] ?? null;
};
