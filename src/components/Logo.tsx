import wordmarkWhiteGradient from "@/assets/brand/omenx-wordmark-white-gradient.svg";
import wordmarkWhite from "@/assets/brand/omenx-wordmark-white.svg";
import wordmarkBlackGradient from "@/assets/brand/omenx-wordmark-black-gradient.svg";
import wordmarkBlack from "@/assets/brand/omenx-wordmark-black.svg";
import markGradientDark from "@/assets/brand/omenx-mark-gradient-dark.svg";
import markGradientLight from "@/assets/brand/omenx-mark-gradient-light.svg";
import markWhite from "@/assets/brand/omenx-mark-white.svg";
import markBlack from "@/assets/brand/omenx-mark-black.svg";
import { cn } from "@/lib/utils";
import { MainnetBadge } from "@/components/MainnetBadge";

/**
 * `sm…xl` are the generic scale (Auth, Footer, Style-guide). `nav` / `brand-bar` are the two
 * page-chrome sizes measured off the omenx_lite page stage (Event_All 140:68990 / event_all 203:92635):
 * the wordmark is 35% wider than the old mark, so the chrome uses a smaller height than the generic scale.
 */
export type LogoSize = "sm" | "md" | "lg" | "xl" | "nav" | "brand-bar";

/**
 * Brand-book placement rule (OmenX_Branding-Assets · Logo Usage):
 * - solid black stage      → `white-gradient` (white letters + Signal X)   ← site default, we are dark-first
 * - solid white stage      → `black-gradient`
 * - gradient / coloured / patterned stage (art, photos, teal auth header, posters) → solid `white` or `black`
 */
export type LogoVariant = "white-gradient" | "white" | "black-gradient" | "black";

export const wordmark: Record<LogoVariant, string> = {
  "white-gradient": wordmarkWhiteGradient,
  white: wordmarkWhite,
  "black-gradient": wordmarkBlackGradient,
  black: wordmarkBlack,
};

/** Standalone X — icons, avatars, tight cells (≤ 18px wide) where the wordmark cannot read. */
export const mark: Record<LogoVariant, string> = {
  "white-gradient": markGradientDark,
  white: markWhite,
  "black-gradient": markGradientLight,
  black: markBlack,
};

interface LogoProps {
  size?: LogoSize;
  variant?: LogoVariant;
  className?: string;
  showMainnetBadge?: boolean;
}

// Standard logo heights — use these consistently across the app. Wordmark ratio is 433:65 (≈ 6.66:1).
const sizeClasses: Record<LogoSize, string> = {
  sm: "h-4 w-auto",   // Small: compact headers, mobile nav items          (≈ 107px wide)
  md: "h-5 w-auto",   // Medium: default for mobile headers               (≈ 133px wide)
  lg: "h-6 w-auto",   // Large: mobile brand bar, desktop sub-headers      (≈ 160px wide)
  xl: "h-8 w-auto",   // Extra large: landing, footers                    (≈ 213px wide)
  nav: "h-[26px] w-auto",        // Desktop top nav — omenx_lite stage 26.5px  (≈ 173px wide)
  "brand-bar": "h-[15px] w-auto", // Mobile brand bar — omenx_lite stage 14.75px (≈ 100px wide)
};

// Gap wordmark → Mainnet pill = 0.22 × logo height (brand book lockup).
const gapClasses: Record<LogoSize, string> = {
  sm: "gap-1",
  md: "gap-1",
  lg: "gap-[5px]",
  xl: "gap-[7px]",
  nav: "gap-[6px]",         // stage: 6px
  "brand-bar": "gap-[6px]", // stage: 6px
};

export function Logo({ size = "md", variant = "white-gradient", className, showMainnetBadge = true }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center", gapClasses[size], className)}>
      <img src={wordmark[variant]} alt="OMENX" className={sizeClasses[size]} />
      {showMainnetBadge && <MainnetBadge size={size} responsive={false} />}
    </span>
  );
}

/** Default wordmark for raw <img>/mask usage (posters, masks, StyleGuide). Prefer <Logo> in UI. */
export const omenxLogo = wordmarkWhiteGradient;
/** Solid-white wordmark for art / photo / gradient stages (share posters). */
export const omenxLogoSolid = wordmarkWhite;
/** Default standalone X for tight cells. */
export const omenxMark = markWhite;
