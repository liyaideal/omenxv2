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

/** World Cup 2026 hedge banner retired 2026-10-21; rail renders nothing until a new campaign is configured. */
export const banners: CampaignBannerConfig[] = [];
