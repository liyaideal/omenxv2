import { cn } from "@/lib/utils";

/** Mirrors LogoSize — the badge is sized from the logo's cap-height (brand book lockup rule). */
export type MainnetBadgeSize = "sm" | "md" | "lg" | "xl" | "nav" | "brand-bar" | "modal";

interface MainnetBadgeProps {
  className?: string;
  size?: MainnetBadgeSize;
  /** Hide on narrow viewports to avoid header overflow. */
  responsive?: boolean;
}

/**
 * Brand-book "Mainnet" lockup (OmenX_Branding-Assets · Logo Lockups, node 1:4921):
 * outlined Volt pill, Archivo Regular, sentence case. Proportions against the logo
 * height H — pill 0.88H · radius 0.30H · 1px stroke · type 0.49H · pad-x 0.23H.
 * Permanent brand signal that the platform is live on mainnet; kept after Launch Campaign ends.
 */
// leading-none sits after text-[..] on purpose: tailwind-merge drops a leading-* that precedes a font-size class.
const sizeClasses: Record<MainnetBadgeSize, string> = {
  sm: "h-[14px] rounded-[4px] px-[4px] text-[9px] leading-none",   // Logo sm  (h-4 / 16px)
  md: "h-[18px] rounded-[6px] px-[5px] text-[11px] leading-none",  // Logo md  (h-5 / 20px)
  lg: "h-[21px] rounded-[7px] px-[6px] text-[13px] leading-none",  // Logo lg  (h-6 / 24px)
  xl: "h-[28px] rounded-[9px] px-[7px] text-[15px] leading-none",  // Logo xl  (h-8 / 32px)
  // Page chrome — pill heights taken from the omenx_lite stage (22px desktop / 20px→17px mobile, type floor 9px).
  nav: "h-[22px] rounded-[7px] px-[6px] text-[12px] leading-none",        // Logo nav       (26px)
  "brand-bar": "h-[17px] rounded-[5px] px-[5px] text-[9px] leading-none", // Logo brand-bar (15px)
  modal: "h-[21px] rounded-[7px] px-[6px] text-[13px] leading-none",       // Logo modal     (17px) — stage pill 21
};

export const MainnetBadge = ({ className, size = "sm", responsive = true }: MainnetBadgeProps) => {
  return (
    <span
      className={cn(
        "items-center whitespace-nowrap border border-accent font-sans font-normal tracking-[0.02em] text-accent",
        responsive ? "hidden sm:inline-flex" : "inline-flex",
        sizeClasses[size],
        className,
      )}
      aria-label="Live on mainnet"
    >
      Mainnet
    </span>
  );
};
