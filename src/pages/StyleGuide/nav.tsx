// ============================================================
// /style-guide information architecture. Navigation shell ONLY — every
// section file below is a living spec and is imported as-is.
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
  LiteSection,
  LiteSpotSection,
  WalletSection,
  DepositWithdrawSection,
  VouchersSection,
  MobilePatternsSection,
  MobileHomeSection,
  ApiSection,
  WorldCupSection,
  StatesSection,
  EmptyStatesSection,
  EventArtSection,
} from "./sections";

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
    id: "foundations",
    label: "Foundations",
    sections: [
      s("tokens", "Design tokens", DesignTokensSection),
      s("typography", "Typography", TypographySection),
      s("animations", "Animations", AnimationsSection),
    ],
  },
  {
    id: "core-ui",
    label: "Core UI",
    sections: [
      s("ui", "Common UI", CommonUISection),
      s("empty-states", "Empty states", EmptyStatesSection),
      s("event-art", "Event cover art", EventArtSection),
      s("forms", "Forms", FormsSection),
      s("identity", "User identity", UserIdentitySection),
    ],
  },
  {
    id: "trading-pro",
    label: "Trading — Pro",
    sections: [
      s("trading", "Trading", TradingSection),
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
      s("spot", "Spot", SpotSection),
      s("transparency", "Transparency", TransparencySection),
    ],
  },
  {
    id: "lite",
    label: "Lite (consumer surface)",
    sections: [
      s("lite", "Lite components", LiteSection),
      s("lite-spot", "Lite spot trade", LiteSpotSection),
    ],
  },
  {
    id: "wallet-money",
    label: "Wallet & Money",
    sections: [
      s("wallet", "Wallet", WalletSection),
      s("deposit", "Deposit / Withdraw", DepositWithdrawSection),
      s("vouchers", "Vouchers", VouchersSection),
    ],
  },
  {
    id: "mobile",
    label: "Mobile",
    sections: [
      s("mobile-patterns", "Mobile patterns", MobilePatternsSection),
      s("mobile-home", "Mobile home", MobileHomeSection),
    ],
  },
  {
    id: "misc",
    label: "Misc / Legacy",
    sections: [
      s("api", "API keys", ApiSection),
      s("states", "States", StatesSection),
      s("worldcup", "World Cup (legacy)", WorldCupSection),
    ],
  },
];

export const ALL_SECTIONS: SectionEntry[] = STYLE_GUIDE_GROUPS.flatMap((g) => g.sections);

/** Legacy hash/tab ids kept alive so old deep links still resolve. */
export const SECTION_ALIASES: Record<string, string> = {
  home: "mobile-home",
  "mobile-home": "mobile-home",
  mobile: "mobile-patterns",
  "mobile-patterns": "mobile-patterns",
  "lite-spot": "lite-spot",
  "trading-header": "trading-header",
};

export const resolveSectionId = (raw: string | null | undefined): string | null => {
  if (!raw) return null;
  const key = raw.replace(/^#/, "");
  if (SECTION_ALIASES[key]) return SECTION_ALIASES[key];
  return ALL_SECTIONS.some((x) => x.id === key) ? key : null;
};