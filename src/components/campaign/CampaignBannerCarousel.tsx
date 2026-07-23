import { useEffect, useState } from "react";
import { ArrowRight, Coins, ShieldCheck } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { CarouselApi } from "@/components/ui/carousel";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Countdown } from "@/components/mainnet-launch/Countdown";
import { cn } from "@/lib/utils";
import { banners, type BannerThemeKey as ThemeKey } from "@/components/campaign/banners";
import { PosterBanner } from "@/components/campaign/PosterBanner";

interface CampaignBannerCarouselProps {
  variant?: "desktop" | "mobile";
  className?: string;
}

const labelClassName = {
  accent: "border-mainnet-gold/30 bg-mainnet-gold/10 text-mainnet-gold font-thin",
  success: "border-trading-green/25 bg-trading-green/10 text-trading-green",
  neutral: "border-border/60 bg-background/35 text-muted-foreground",
};

const themeMap: Record<Exclude<ThemeKey, "poster">, {
  border: string;
  surface: string;
  surfaceMaskFrom: string;
  surfaceMaskVia: string;
  metric: string;
  cta: string;
  visualBorder: string;
  visualSurface: string;
  visualAccent: string;
  dot: string;
}> = {
  gold: {
    border: "border-mainnet-gold/25 hover:border-mainnet-gold/45",
    surface: "bg-mainnet-surface",
    surfaceMaskFrom: "from-mainnet-surface",
    surfaceMaskVia: "via-mainnet-surface/85",
    metric: "text-mainnet-gold",
    cta: "border-mainnet-gold bg-mainnet-gold text-background",
    visualBorder: "border-mainnet-gold/25",
    visualSurface: "bg-mainnet-gold/5",
    visualAccent: "text-mainnet-gold",
    dot: "bg-mainnet-gold",
  },
  primary: {
    border: "border-primary/25 hover:border-primary/45",
    surface: "bg-background",
    surfaceMaskFrom: "from-background",
    surfaceMaskVia: "via-background/85",
    metric: "text-primary",
    cta: "border-primary bg-primary text-primary-foreground",
    visualBorder: "border-primary/25",
    visualSurface: "bg-primary/5",
    visualAccent: "text-primary",
    dot: "bg-primary",
  },
  green: {
    border: "border-trading-green/25 hover:border-trading-green/45",
    surface: "bg-background",
    surfaceMaskFrom: "from-background",
    surfaceMaskVia: "via-background/85",
    metric: "text-trading-green",
    cta: "border-trading-green bg-trading-green text-background",
    visualBorder: "border-trading-green/25",
    visualSurface: "bg-trading-green/5",
    visualAccent: "text-trading-green",
    dot: "bg-trading-green",
  },
  violet: {
    border: "border-purple-500/25 hover:border-purple-500/45",
    surface: "bg-background",
    surfaceMaskFrom: "from-background",
    surfaceMaskVia: "via-background/85",
    metric: "text-purple-400",
    cta: "border-purple-500 bg-purple-500 text-background",
    visualBorder: "border-purple-500/25",
    visualSurface: "bg-purple-500/5",
    visualAccent: "text-purple-400",
    dot: "bg-purple-500",
  },
};

/* ------------------------------------------------------------------ */
/* Fallback visual primitives (used when backgroundImage is missing)   */
/* ------------------------------------------------------------------ */

const DiagramVisual = ({ theme }: { theme: ThemeKey }) => {
  const t = themeMap[theme];
  return (
    <div className={cn("relative h-full min-h-[140px] overflow-hidden border p-4", t.visualBorder, t.visualSurface)}>
      <div className={cn("absolute inset-x-4 top-5 h-px", t.dot, "opacity-30")} />
      <div className={cn("absolute inset-x-8 bottom-7 h-px", t.dot, "opacity-20")} />
      <div className="relative grid h-full min-h-[120px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
        <div className="space-y-2">
          <div className={cn("h-2 w-16", t.dot, "opacity-40")} />
          <div className="h-2 w-10 bg-muted-foreground/25" />
        </div>
        <div className={cn("flex h-16 w-16 items-center justify-center border bg-background/70 shadow-lg", t.visualBorder, t.visualAccent)}>
          <ShieldCheck className="h-7 w-7" />
        </div>
        <div className="ml-auto space-y-2">
          <div className={cn("h-2 w-14", t.dot, "opacity-40 ml-auto")} />
          <div className="ml-auto h-2 w-9 bg-muted-foreground/25" />
        </div>
      </div>
    </div>
  );
};

const HeroObjectVisual = ({ theme }: { theme: ThemeKey }) => {
  const t = themeMap[theme];
  return (
    <div className={cn("relative h-full min-h-[140px] overflow-hidden border", t.visualBorder, t.visualSurface)}>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.18)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.14)_1px,transparent_1px)] bg-[size:24px_24px] opacity-50" />
      <div className="relative flex h-full items-center justify-center">
        <div className={cn("relative flex h-24 w-24 items-center justify-center rounded-full border-2", t.visualBorder, t.visualAccent)}>
          <div className={cn("absolute inset-1 rounded-full border", t.visualBorder, "opacity-50")} />
          <Coins className="h-10 w-10" />
        </div>
      </div>
    </div>
  );
};

/* Banner config now lives in ./banners.ts (shared with HomeCampaignRail). */

export const CampaignBannerCarousel = ({ variant = "desktop", className }: CampaignBannerCarouselProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const isMobile = variant === "mobile";
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setSelected(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  useEffect(() => {
    if (!api) return;
    const timer = window.setInterval(() => {
      if (!isPaused) api.scrollNext();
    }, 6800);
    return () => window.clearInterval(timer);
  }, [api, isPaused]);

  const navigateWithRef = (path: string) => {
    const ref = searchParams.get("ref");
    navigate(ref ? `${path}?ref=${encodeURIComponent(ref)}` : path);
  };

  return (
    <div
      className={cn("relative w-full max-w-full overflow-hidden", className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <Carousel setApi={setApi} opts={{ loop: true }} className="w-full max-w-full overflow-hidden">
        <CarouselContent className="-ml-0">
          {banners.map((banner) => {
            if (banner.theme === "poster") {
              return (
                <CarouselItem key={banner.id} className="min-w-0 pl-0">
                  <PosterBanner
                    banner={banner}
                    variant={isMobile ? "mobile" : "desktop"}
                    onClick={() => navigateWithRef(banner.href)}
                  />
                </CarouselItem>
              );
            }
            const t = themeMap[banner.theme];
            const hasBgImage = !!banner.backgroundImage;
            return (
              <CarouselItem key={banner.id} className="min-w-0 pl-0">
                <button
                  type="button"
                  onClick={() => navigateWithRef(banner.href)}
                  aria-label={banner.title}
                  className={cn(
                    "group relative block w-full max-w-full overflow-hidden rounded-md border text-left shadow-lg shadow-background/30 transition-all",
                    t.border,
                    t.surface,
                    isMobile ? "min-h-[200px] p-4" : "min-h-[220px] p-6",
                  )}
                >
                  {/* Layer 1: full-card background image with skeleton placeholder */}
                  {hasBgImage && (
                    <>
                      {!loadedImages[banner.id] && (
                        <div
                          aria-hidden
                          className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted/40 via-muted/20 to-transparent pointer-events-none"
                        />
                      )}
                      <img
                        src={banner.backgroundImage}
                        alt=""
                        aria-hidden
                        loading={selected === banners.findIndex(b => b.id === banner.id) ? "eager" : "lazy"}
                        decoding="async"
                        fetchPriority={selected === banners.findIndex(b => b.id === banner.id) ? "high" : "low"}
                        onLoad={() => setLoadedImages(prev => ({ ...prev, [banner.id]: true }))}
                        className={cn(
                          "absolute inset-0 h-full w-full object-cover object-right pointer-events-none select-none transition-opacity duration-500",
                          loadedImages[banner.id] ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </>
                  )}

                  {/* Layer 2: left→right surface gradient mask, ensures text contrast */}
                  {hasBgImage && (
                    <div
                      aria-hidden
                      className={cn(
                        "absolute inset-0 bg-gradient-to-r to-transparent pointer-events-none",
                        t.surfaceMaskFrom,
                        t.surfaceMaskVia,
                      )}
                      style={{ ["--tw-gradient-from-position" as string]: "30%", ["--tw-gradient-via-position" as string]: "55%" }}
                    />
                  )}

                  {/* Layer 3: dotted grid (lighter when bg image present) */}
                  <div
                    className={cn(
                      "absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.18)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.14)_1px,transparent_1px)] bg-[size:34px_34px] pointer-events-none",
                      hasBgImage ? "opacity-15" : "opacity-30",
                    )}
                  />

                  <div
                    className={cn(
                      "relative z-10 grid h-full min-w-0 gap-5",
                      // When bg image takes the right side, content is single-column constrained to ~60%.
                      // When falling back to visual tile, keep the original 2-column layout.
                      !hasBgImage && "sm:grid-cols-[minmax(0,1fr)_minmax(220px,300px)] sm:items-stretch",
                    )}
                  >
                    {/* Information column */}
                    <div
                      className={cn(
                        "flex min-w-0 flex-col justify-between gap-4",
                        hasBgImage && "sm:max-w-[60%]",
                      )}
                    >
                      <div className="min-w-0 space-y-3">
                        {(banner.qualifierChip || (banner.countdown && isMobile)) && (
                          <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase">
                            {banner.qualifierChip && (
                              <span className={cn("border px-2 py-1 backdrop-blur-sm", labelClassName[banner.qualifierChip.tone])}>
                                {banner.qualifierChip.text}
                              </span>
                            )}
                            {banner.countdown && isMobile && (
                              <span className={cn("ml-auto border border-border/60 bg-background/35 px-2 py-1 backdrop-blur-sm", t.metric)}>
                                <Countdown compact />
                              </span>
                            )}
                          </div>
                        )}
                        <h3
                          className={cn(
                            "font-semibold leading-tight text-foreground",
                            isMobile ? "text-xl" : "text-2xl lg:text-3xl",
                          )}
                        >
                          {banner.title}
                        </h3>
                        <div className="flex flex-wrap items-baseline gap-2 font-mono">
                          <span className={cn("font-semibold", isMobile ? "text-xl" : "text-2xl", t.metric)}>
                            {banner.heroMetric.value}
                          </span>
                          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                            {banner.heroMetric.label}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                        <span
                          className={cn(
                            "inline-flex items-center justify-center gap-2 border px-4 py-2 font-mono text-xs font-semibold uppercase transition-transform group-hover:translate-x-1",
                            t.cta,
                          )}
                        >
                          {banner.ctaLabel} <ArrowRight className="h-4 w-4" />
                        </span>
                        {banner.countdown && !isMobile && (
                          <span className="font-mono text-xs text-muted-foreground">
                            <span className="text-foreground">Ends </span>
                            <Countdown compact className={t.metric} />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right visual slot removed — all banners use backgroundImage. */}
                  </div>
                </button>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>

      <div className="mt-3 flex justify-center gap-2">
        {banners.map((banner, index) => (
          <button
            key={banner.id}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            onClick={() => api?.scrollTo(index)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-200",
              selected === index ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/40 hover:bg-muted-foreground/60",
            )}
          />
        ))}
      </div>
    </div>
  );
};
