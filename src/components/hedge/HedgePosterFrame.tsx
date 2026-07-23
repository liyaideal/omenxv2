import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type PosterShadow = "red" | "yellow" | "blue" | "ink";

const SHADOW_COLOR: Record<PosterShadow, string> = {
  red: "#E11D48",
  yellow: "#FACC15",
  blue: "#1D4ED8",
  ink: "#0E0E0E",
};

interface HedgePosterFrameProps {
  shadow?: PosterShadow;
  /** Hide outer hard shadow & inset borders to mobile size */
  size?: "lg" | "sm";
  /** Show paper noise overlay */
  noise?: boolean;
  className?: string;
  innerClassName?: string;
  children: ReactNode;
}

/**
 * Retro poster container: thick ink border + offset hard shadow + optional paper noise.
 * Page-scoped — never use outside /hedge or its Campaign Style Guide playground.
 */
export const HedgePosterFrame = ({
  shadow = "red",
  size = "lg",
  noise = true,
  className,
  innerClassName,
  children,
}: HedgePosterFrameProps) => {
  const isLg = size === "lg";
  const color = SHADOW_COLOR[shadow];
  const offset = isLg ? 12 : 6;
  const borderWidth = isLg ? 8 : 4;

  return (
    <div
      className={cn("relative", className)}
      style={{
        boxShadow: `${offset}px ${offset}px 0 0 ${color}`,
      }}
    >
      <div
        className={cn(
          "relative bg-[#FDFCF0] text-[#0E0E0E] overflow-hidden",
          innerClassName,
        )}
        style={{
          border: `${borderWidth}px solid #0E0E0E`,
        }}
      >
        {noise && <PaperNoise />}
        {children}
      </div>
    </div>
  );
};

const PaperNoise = () => (
  <svg
    aria-hidden
    className="pointer-events-none absolute inset-0 z-50 h-full w-full opacity-[0.07] mix-blend-multiply"
  >
    <filter id="poster-noise">
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.9"
        numOctaves="2"
        stitchTiles="stitch"
      />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#poster-noise)" />
  </svg>
);
