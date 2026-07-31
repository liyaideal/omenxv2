import { useState } from "react";
import { cn } from "@/lib/utils";

interface CardArtTileProps {
  /** Delivered card art (JPEG). null → striped fallback. */
  src?: string | null;
  /** Tiny base64 blur placeholder shown until the art decodes. */
  blur?: string | null;
  /** Above-the-fold tiles load eagerly at high priority; the rest lazily. */
  priority?: boolean;
  /** Badge stack etc., rendered above the scrim. */
  children?: React.ReactNode;
  className?: string;
}

// Fallback diagonal stripe, matches the mock scaffolding.
const STRIPE_FALLBACK =
  "repeating-linear-gradient(135deg,#1D2026,#1D2026 12px,#131519 12px,#131519 24px)";

// Scrim overlay (bottom → top) so light art stays legible under the badges.
const SCRIM = "linear-gradient(to top, rgba(10,11,13,0.85), transparent 60%)";

/**
 * The 130px card art strip.
 *
 * Uses a real <img> (not background-image) so off-screen cards are skipped by
 * the browser's lazy loader and the first row can be prioritised — a full
 * /events grid used to fetch every tile eagerly.
 */
export const CardArtTile = ({
  src,
  blur,
  priority = false,
  children,
  className,
}: CardArtTileProps) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={cn("relative h-[130px] w-full overflow-hidden", className)}
      style={{
        background: blur ? undefined : src ? "#131519" : STRIPE_FALLBACK,
        backgroundImage: blur ? `url("${blur}")` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {src && (
        <img
          src={src}
          alt=""
          aria-hidden
          width={840}
          height={360}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          // @ts-expect-error - fetchpriority is a valid DOM attribute
          fetchpriority={priority ? "high" : "low"}
          onLoad={() => setLoaded(true)}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-200",
            loaded ? "opacity-100" : "opacity-0",
          )}
        />
      )}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: SCRIM }}
      />
      {children}
    </div>
  );
};
