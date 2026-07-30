import { cn } from "@/lib/utils";
import { LynxBodyArt, LynxHeadArt, type LynxProps } from "./lynxArt";

/**
 * Full chibi lynx. Mono stroke, colored by currentColor only.
 * Never stretch, rotate, recolor or add effects.
 */
export const LynxFigure = ({ size = 100, strokeWidth = 2.6, className }: LynxProps) => (
  <svg
    viewBox="0 0 120 124"
    height={size}
    width={size * (120 / 124)}
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
    <LynxBodyArt />
  </svg>
);

export default LynxFigure;
