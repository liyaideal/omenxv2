import { cn } from "@/lib/utils";
import { LynxHeadArt, type LynxProps } from "./lynxArt";

/**
 * Lynx head mark. Mono stroke, colored by currentColor only.
 * Minimum render size 40px. Never stretch, rotate, recolor or add effects.
 */
export const LynxMark = ({ size = 64, strokeWidth = 2.6, className }: LynxProps) => (
  <svg
    viewBox="0 0 120 98"
    height={size}
    width={size * (120 / 98)}
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    className={cn("text-muted-foreground", className)}
  >
    <LynxHeadArt />
  </svg>
);

export default LynxMark;
