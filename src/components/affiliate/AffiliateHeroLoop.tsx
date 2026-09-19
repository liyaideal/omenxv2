import { cn } from "@/lib/utils";
import heroLoopWebm from "@/assets/affiliate/hero-x-loop.webm";
import heroLoopMp4 from "@/assets/affiliate/hero-x-loop.mp4";

/**
 * Hero X visual for /affiliate — the "liquid metal" X as a 9.8s video loop
 * (858×638, supplied by the product owner 2026-09-19, two encodes):
 *   hero-x-loop.webm  VP9 + alpha, 1.6 MB — true transparency (Chromium / Firefox)
 *   hero-x-loop.mp4   H.264 "screen" master on the brand navy, 417 KB — fallback
 * The element is composited with `mix-blend-mode: screen`: transparent pixels are
 * a no-op, a decoder that drops VP9 alpha paints black (screen → invisible), and
 * the mp4's navy nearly vanishes over the page background. Decorative: muted,
 * looped, inline, aria-hidden, no controls.
 * Slots: desktop 661×496 (Figma 42:11785) / mobile 342×257 (46:12640).
 */
export const AffiliateHeroLoop = ({ variant, className }: { variant: "desktop" | "mobile"; className?: string }) => (
  <video
    autoPlay
    muted
    loop
    playsInline
    preload="auto"
    aria-hidden
    tabIndex={-1}
    disablePictureInPicture
    className={cn(
      "pointer-events-none select-none object-contain mix-blend-screen",
      variant === "desktop" ? "h-[496px] w-[661px]" : "h-[257px] w-full",
      className,
    )}
  >
    <source src={heroLoopWebm} type="video/webm" />
    <source src={heroLoopMp4} type="video/mp4" />
  </video>
);
