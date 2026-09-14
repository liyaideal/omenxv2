import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Hero illustration slot for /affiliate.
 * Asset is supplied by the product owner (素材铁律) at:
 *   desktop → public/assets/desktop/affiliate-hero-lynx.png   (slot 560×560, transparent)
 *   mobile  → public/assets/mobile/affiliate-hero-lynx.png    (slot 343×200, transparent)
 * Until the file exists the slot renders nothing in production and a dashed
 * spec box in dev, so the layout can be reviewed before the art lands.
 */
export const AffiliateHeroArt = ({
  variant,
  caption,
  className,
}: {
  variant: "desktop" | "mobile";
  caption?: string;
  className?: string;
}) => {
  const [missing, setMissing] = useState(false);
  const src = `/assets/${variant}/affiliate-hero-lynx.png`;
  const isDesktop = variant === "desktop";

  if (missing) {
    if (!import.meta.env.DEV) return null;
    return (
      <div
        aria-hidden
        className={cn(
          "relative flex items-center justify-center rounded-sm border border-dashed border-border text-center",
          isDesktop ? "w-full aspect-square max-w-[560px]" : "w-full aspect-[343/200]",
          className,
        )}
      >
        <div className="px-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
            Illustration slot · {isDesktop ? "560 × 560" : "343 × 200"}
          </div>
          <div className="mt-1 font-mono text-[10px] text-muted-foreground/50 break-all">{src}</div>
        </div>
      </div>
    );
  }

  return (
    <figure className={cn("relative", className)}>
      <img
        src={src}
        alt=""
        aria-hidden
        onError={() => setMissing(true)}
        className={cn(
          "pointer-events-none select-none object-contain",
          isDesktop ? "w-full max-w-[560px] aspect-square" : "w-full aspect-[343/200]",
        )}
        loading={isDesktop ? "eager" : "lazy"}
      />
      {caption && (
        <figcaption className="mt-3 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/70 text-right">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};
