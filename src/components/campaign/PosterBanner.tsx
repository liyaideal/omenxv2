import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CampaignBannerConfig } from "@/components/campaign/banners";

interface PosterBannerProps {
  banner: CampaignBannerConfig;
  variant?: "desktop" | "mobile" | "rail";
  onClick?: () => void;
}

/**
 * Retro-poster style banner that matches the HedgeHero aesthetic.
 * Cream surface, thick black border, hard red offset shadow, rotated sticker,
 * bold display headline (Space Grotesk), yellow metric rule, black CTA with
 * blue offset shadow.
 *
 * Variants:
 *  - desktop: 220px tall, full-width carousel card
 *  - mobile : 200px tall, full-width carousel card (compact)
 *  - rail   : 140px tall, 260px wide mobile-home snap card
 */
export const PosterBanner = ({ banner, variant = "desktop", onClick }: PosterBannerProps) => {
  const isRail = variant === "rail";
  const isMobile = variant === "mobile";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={banner.title}
      className={cn(
        "group relative block select-none bg-[#FDFCF0] text-left font-poster text-[#0E0E0E] transition-transform",
        "border-[#0E0E0E] hover:-translate-x-0.5 hover:-translate-y-0.5",
        isRail
          ? "h-[140px] w-[260px] shrink-0 snap-start border-[3px] p-3 shadow-[5px_5px_0_0_#E11D48] hover:shadow-[7px_7px_0_0_#E11D48]"
          : isMobile
            ? "min-h-[200px] w-full border-[3px] p-5 shadow-[6px_6px_0_0_#E11D48] hover:shadow-[8px_8px_0_0_#E11D48]"
            : "min-h-[220px] w-full border-4 p-7 shadow-[10px_10px_0_0_#E11D48] hover:shadow-[14px_14px_0_0_#E11D48]",
      )}
    >
      {/* Rotated sticker chip */}
      {banner.qualifierChip && (
        <span
          className={cn(
            "absolute z-20 -rotate-2 origin-top-left whitespace-nowrap border-2 border-[#0E0E0E] bg-[#E11D48] font-black uppercase text-white",
            isRail
              ? "top-0 left-3 px-2 py-0.5 text-[8px] tracking-[0.12em] shadow-[2px_2px_0_0_#0E0E0E]"
              : isMobile
                ? "top-0 left-4 px-3 py-1 text-[10px] tracking-[0.14em] shadow-[3px_3px_0_0_#0E0E0E]"
                : "top-0 left-6 px-4 py-1.5 text-[11px] tracking-[0.16em] shadow-[4px_4px_0_0_#0E0E0E]",
          )}
        >
          {banner.qualifierChip.text}
        </span>
      )}

      {/* Corner triangle decoration (not in rail) */}
      {!isRail && (
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 right-0 h-24 w-24 bg-[#1D4ED8] opacity-[0.06]"
          style={{ clipPath: "polygon(100% 0, 0% 100%, 100% 100%)" }}
        />
      )}

      {/* === Rail layout (compact 140x260) === */}
      {isRail ? (
        <div className="relative z-10 flex h-full flex-col justify-between pt-6">
          <h3 className="pt-4 text-[15px] font-black uppercase leading-[0.95] tracking-tight">
            {banner.title}
          </h3>
          <div className="flex items-end justify-between">
            <div className="border-l-[4px] border-[#FACC15] pl-2">
              <div className="text-2xl font-black leading-none">{banner.heroMetric.value}</div>
              <div className="mt-1 text-[8px] font-bold uppercase tracking-widest opacity-70">
                {banner.heroMetric.label}
              </div>
            </div>
            <span className="flex h-7 w-7 items-center justify-center bg-[#0E0E0E] text-[#FDFCF0]">
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
          </div>
        </div>
      ) : (
        /* === Desktop / Mobile layout === */
        <div
          className={cn(
            "relative z-10 flex h-full w-full gap-6",
            isMobile ? "flex-col justify-between" : "items-center justify-between",
          )}
        >
          {/* Left: headline + metric */}
          <div className={cn("flex flex-col gap-4", isMobile ? "pt-8" : "flex-1")}>
            <h3
              className={cn(
                "font-black uppercase leading-[0.95] tracking-tight",
                isMobile ? "text-[28px]" : "text-[40px] lg:text-[42px]",
              )}
            >
              {banner.title}
            </h3>

            <div
              className={cn(
                "flex items-center gap-4 border-l-[6px] border-[#FACC15] pl-4",
                isMobile ? "h-12" : "h-14",
              )}
            >
              <span
                className={cn(
                  "font-black leading-none",
                  isMobile ? "text-4xl" : "text-5xl",
                )}
              >
                {banner.heroMetric.value}
              </span>
              <span
                className={cn(
                  "font-bold uppercase tracking-widest opacity-70",
                  isMobile ? "text-[10px]" : "text-[11px]",
                )}
              >
                {banner.heroMetric.label}
              </span>
            </div>
          </div>

          {/* Right: CTA */}
          <div className={cn("shrink-0", isMobile && "self-start")}>
            <span
              className={cn(
                "inline-flex items-center gap-4 bg-[#0E0E0E] font-black uppercase tracking-[0.14em] text-[#FDFCF0]",
                "shadow-[4px_4px_0_0_#1D4ED8] transition-all group-hover:shadow-[7px_7px_0_0_#1D4ED8]",
                isMobile ? "px-6 py-3 text-xs" : "px-8 py-5 text-sm",
              )}
            >
              <span>{banner.ctaLabel}</span>
              <ArrowRight
                className={cn(
                  "transition-transform group-hover:translate-x-1",
                  isMobile ? "h-4 w-4" : "h-5 w-5",
                )}
                strokeWidth={3}
              />
            </span>
          </div>
        </div>
      )}
    </button>
  );
};
