import { cn } from "@/lib/utils";

/**
 * Decorative art for /affiliate (Figma Omenx_Affiliate, 2026-09-18).
 *
 * Files are supplied by the product owner (素材铁律) into `src/assets/affiliate/`
 * and resolved BY NAME at build time through `import.meta.glob`, so a missing
 * file never breaks the build: the slot renders nothing in production and a
 * dashed spec box in dev. Add the file, restart nothing — Vite picks it up.
 *
 * Export spec (2x PNG, flattened with overlay gradients, text layers hidden):
 *   hero-x-desktop        661×496   Figma 42:11785        hero-x-mobile         342×257   46:12640
 *   earn-1-desktop        1224×186  42:11949              earn-1-mobile         342×204   46:12781
 *   earn-2-desktop        1224×216  42:12109              earn-2-mobile         342×204   46:12913 box
 *   earn-band-desktop     1440×260  42:12170              earn-band-mobile      342×193   46:12954
 *   market-sports-desktop 616×376   42:12236              market-sports-mobile  340×217   46:13004
 *   market-crypto-desktop 672×347   42:12264              market-crypto-mobile  342×184   46:13056
 *   market-finance-desktop 672×376  42:12292              market-finance-mobile 342×199   46:13060
 *   cta-mosaic-left-desktop 370×486 / cta-mosaic-right-desktop 494×486   (42:12456 / 42:12462)
 *   cta-mosaic-left-mobile  100×131 / cta-mosaic-right-mobile  134×131   (46:13198)
 */
export type AffiliateArtName =
  | "hero-x-desktop"
  | "hero-x-mobile"
  | "earn-1-desktop"
  | "earn-1-mobile"
  | "earn-2-desktop"
  | "earn-2-mobile"
  | "earn-band-desktop"
  | "earn-band-mobile"
  | "market-sports-desktop"
  | "market-sports-mobile"
  | "market-crypto-desktop"
  | "market-crypto-mobile"
  | "market-finance-desktop"
  | "market-finance-mobile"
  | "cta-mosaic-left-desktop"
  | "cta-mosaic-right-desktop"
  | "cta-mosaic-left-mobile"
  | "cta-mosaic-right-mobile";

const files = import.meta.glob("../../assets/affiliate/*.{png,webp,jpg}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

/** Resolved URL for a named art file, or undefined when the owner has not supplied it yet. */
export const affiliateArtSrc = (name: AffiliateArtName): string | undefined => {
  const key = Object.keys(files).find((k) => /\/([^/]+)\.(png|webp|jpg)$/.exec(k)?.[1] === name);
  return key ? files[key] : undefined;
};

export const AffiliateArt = ({
  name,
  width,
  height,
  className,
  fit = "cover",
  position,
  eager = false,
}: {
  name: AffiliateArtName;
  /** Design slot size (1x) — drives the dev placeholder's aspect ratio and the label. */
  width: number;
  height: number;
  className?: string;
  fit?: "cover" | "contain";
  /** CSS object-position, e.g. "top center". */
  position?: string;
  eager?: boolean;
}) => {
  const src = affiliateArtSrc(name);
  const isAbsolute = /\babsolute\b/.test(className ?? "");

  if (!src) {
    if (!import.meta.env.DEV) return null;
    return (
      <div
        aria-hidden
        className={cn(
          "flex items-center justify-center border border-dashed border-border/70 text-center",
          className,
        )}
        style={isAbsolute ? undefined : { aspectRatio: `${width} / ${height}` }}
      >
        <span className="px-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
          Art · {name} · {width}×{height}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      aria-hidden
      draggable={false}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={cn(
        "pointer-events-none select-none",
        fit === "cover" ? "object-cover" : "object-contain",
        className,
      )}
      style={position ? { objectPosition: position } : undefined}
    />
  );
};
