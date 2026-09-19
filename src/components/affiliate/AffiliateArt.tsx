import { cn } from "@/lib/utils";

/**
 * Decorative art for /affiliate (Figma Omenx_Affiliate, 2026-09-18).
 *
 * Files are supplied by the product owner (素材铁律) into `src/assets/affiliate/`
 * and resolved BY NAME at build time through `import.meta.glob`, so a missing
 * file never breaks the build: the slot renders nothing in production and a
 * dashed spec box in dev. Add the file, restart nothing — Vite picks it up.
 *
 * Files in repo (2026-09-19, exported by the product owner from Figma, 2x, overlay gradients baked into alpha):
 *   earn-1-desktop  2448×372  (slot 1224×186)   earn-1-mobile  684×408 (slot 342×204)
 *   earn-2-desktop  2448×372  (slot 1224×186)   earn-2-mobile  684×408 (slot 342×204)
 *   earn-band-desktop 2880×518 (slot 1440×260)  earn-band-mobile 732×366 (slot 342×193)
 *   market-sports / market-crypto / market-finance  1232×752, shared by both breakpoints (object-cover crops)
 *   cta-mosaic  2881×973 (slot 1440×486), one strip for both edges, shared by both breakpoints
 * The hero X visual is a video loop → see AffiliateHeroLoop.tsx.
 */
export type AffiliateArtName =
  | "earn-1-desktop"
  | "earn-1-mobile"
  | "earn-2-desktop"
  | "earn-2-mobile"
  | "earn-band-desktop"
  | "earn-band-mobile"
  | "market-sports"
  | "market-crypto"
  | "market-finance"
  | "cta-mosaic";

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
