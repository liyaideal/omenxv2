import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { banners, type BannerThemeKey } from "@/components/campaign/banners";
import { PosterBanner } from "@/components/campaign/PosterBanner";
import { cn } from "@/lib/utils";

const themeMap: Record<Exclude<BannerThemeKey, "poster">, {
  surfaceMaskFrom: string;
  surfaceMaskVia: string;
  metric: string;
  chip: string;
}> = {
  gold: {
    surfaceMaskFrom: "from-mainnet-surface",
    surfaceMaskVia: "via-mainnet-surface/85",
    metric: "text-mainnet-gold",
    chip: "border-mainnet-gold/30 bg-mainnet-gold/10 text-mainnet-gold",
  },
  primary: {
    surfaceMaskFrom: "from-background",
    surfaceMaskVia: "via-background/85",
    metric: "text-primary",
    chip: "border-primary/30 bg-primary/10 text-primary",
  },
  green: {
    surfaceMaskFrom: "from-background",
    surfaceMaskVia: "via-background/85",
    metric: "text-trading-green",
    chip: "border-trading-green/30 bg-trading-green/10 text-trading-green",
  },
  violet: {
    surfaceMaskFrom: "from-background",
    surfaceMaskVia: "via-background/85",
    metric: "text-purple-400",
    chip: "border-purple-500/30 bg-purple-500/10 text-purple-400",
  },
};

const toneMap = {
  accent: "border-mainnet-gold/30 bg-mainnet-gold/10 text-mainnet-gold",
  success: "border-trading-green/30 bg-trading-green/10 text-trading-green",
  neutral: "border-border/60 bg-background/35 text-muted-foreground",
};

/**
 * Compact mobile horizontal carousel of campaign banners.
 * Mirrors HomeTournamentsRail dimensions (260x140 snap cards) but renders
 * the same backgrounds + content as CampaignBannerCarousel.
 */
export const HomeCampaignRail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const navigateWithRef = (path: string) => {
    const ref = searchParams.get("ref");
    navigate(ref ? `${path}?ref=${encodeURIComponent(ref)}` : path);
  };

  return (
    <section>
      <div className="mb-2 flex items-end justify-between gap-2 px-1">
        <h2 className="text-[18px] font-extrabold uppercase tracking-tight text-foreground">
          Campaigns
        </h2>
      </div>

      <div className="-mr-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pr-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {banners.map((banner) => {
          if (banner.theme === "poster") {
            return (
              <PosterBanner
                key={banner.id}
                banner={banner}
                variant="rail"
                onClick={() => navigateWithRef(banner.href)}
              />
            );
          }
          const t = themeMap[banner.theme];
          const chipClass = banner.qualifierChip ? toneMap[banner.qualifierChip.tone] : "";
          return (
            <button
              key={banner.id}
              type="button"
              onClick={() => navigateWithRef(banner.href)}
              aria-label={banner.title}
              className={cn(
                "group relative flex h-[140px] w-[260px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-2xl p-4 text-left",
                "border border-border/40 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.5)] transition-transform duration-150 active:scale-[0.98]",
              )}
            >
              {/* Background image */}
              {banner.backgroundImage && (
                <img
                  src={banner.backgroundImage}
                  alt=""
                  aria-hidden
                  loading="lazy"
                  decoding="async"
                  className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-right"
                />
              )}
              {/* Left→right surface mask for text contrast */}
              <div
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-0 bg-gradient-to-r to-transparent",
                  t.surfaceMaskFrom,
                  t.surfaceMaskVia,
                )}
                style={{
                  ["--tw-gradient-from-position" as string]: "25%",
                  ["--tw-gradient-via-position" as string]: "60%",
                }}
              />

              {/* Top row: chip + arrow */}
              <div className="relative flex items-start justify-between gap-2">
                {banner.qualifierChip ? (
                  <span
                    className={cn(
                      "border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide backdrop-blur-sm",
                      chipClass,
                    )}
                  >
                    {banner.qualifierChip.text}
                  </span>
                ) : (
                  <span />
                )}
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground/95 text-background">
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.75} />
                </span>
              </div>

              {/* Bottom: title + metric */}
              <div className="relative max-w-[78%]">
                <div className="line-clamp-2 text-[15px] font-extrabold leading-tight text-foreground">
                  {banner.title}
                </div>
                <div className="mt-1 flex items-baseline gap-1.5 font-mono">
                  <span className={cn("text-[13px] font-semibold tabular-nums", t.metric)}>
                    {banner.heroMetric.value}
                  </span>
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {banner.heroMetric.label}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
