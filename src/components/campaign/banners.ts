export type BannerThemeKey = "gold" | "primary" | "green" | "violet" | "poster";

export interface CampaignBannerConfig {
  id: string;
  href: string;
  title: string;
  ctaLabel: string;
  qualifierChip?: { text: string; tone: "accent" | "success" | "neutral" };
  heroMetric: { value: string; label: string };
  countdown?: boolean;
  theme: BannerThemeKey;
  /** Full-card cinematic background image. */
  backgroundImage?: string;
}

export const banners: CampaignBannerConfig[] = [
  {
    id: "hedge",
    href: "/hedge",
    title: "Hedge your World Cup pick.",
    ctaLabel: "CLAIM YOUR HEDGE",
    qualifierChip: { text: "World Cup 2026", tone: "accent" },
    heroMetric: { value: "$500", label: "Redeem up to" },
    theme: "poster",
  },
];
