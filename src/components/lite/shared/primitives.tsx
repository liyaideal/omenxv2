// ============================================================
// SHARED LITE PRIMITIVES — one implementation per rendered object.
// Consolidation round A: these replace the hand-copied Last-8 strips,
// crests, live pulses and price/±% read-outs that had drifted across
// the All stage, the vertical views, the mobile modules and Calendar.
// Every surface keeps its CURRENT pixels via props — no redesign.
// ============================================================
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/* ---------------- Tokens ---------------- */

/** Direction axis (DESIGN.md): Pulse Blue = up, Volt = down. */
export const DIR_UP = "#33D6FF";
export const DIR_DOWN = "#CFFF4A";
/** Softened direction fills used by the tall "bars" Last-8 treatment. */
export const DIR_UP_SOFT = "rgba(51,214,255,.7)";
export const DIR_DOWN_SOFT = "rgba(207,255,74,.55)";
/** Empty Last-8 slot. */
export const DIR_EMPTY = "#1D2026";

/** Soft chalk — neutral outcome text + muted crest glyphs. */
export const CHALK_SOFT = "#E6E9EE";
/** Chalk — crest fill. */
export const CHALK = "#F2F3F5";
/** Live indicator red. */
export const LIVE_RED = "#FF3B4E";

/** Canonical ±% colour law (trading tokens, never ad-hoc greens/reds). */
export const pctColor = (pct: number) =>
  pct >= 0 ? "hsl(74 100% 65%)" : "hsl(0 100% 68%)";

/* ---------------- Live pulse ---------------- */

/**
 * The one pulsing status dot. Sizes in use: 6px (intraday eyebrows),
 * 5px (sports live rows), 4px (calendar compact tickets).
 */
export const LivePulse = ({
  size = 6,
  color = LIVE_RED,
  className,
}: {
  size?: number;
  /** Omit to colour via `className` (e.g. a Tailwind bg token). */
  color?: string;
  className?: string;
}) => (
  <span
    className={cn("animate-pulse", className)}
    style={{
      width: size,
      height: size,
      borderRadius: 999,
      background: color,
      flex: "none",
    }}
  />
);

/* ---------------- Crest ---------------- */

/** Team crest token. `muted` is the SportsStageCard away-side treatment. */
export const Crest = ({
  abbr,
  size = 34,
  overlap = false,
  overlapPx = -10,
  muted = false,
  fontSize,
}: {
  abbr: string;
  size?: number;
  overlap?: boolean;
  overlapPx?: number;
  muted?: boolean;
  fontSize?: number;
}) => (
  <span
    className="font-display"
    style={{
      width: size,
      height: size,
      borderRadius: 999,
      background: muted ? "#23262D" : CHALK,
      border: "1px solid rgba(255,255,255,.08)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 700,
      fontSize: fontSize ?? (size >= 38 ? 10 : 9),
      color: muted ? CHALK_SOFT : "#0A0B0D",
      flex: "none",
      marginLeft: overlap ? overlapPx : 0,
    }}
  >
    {abbr}
  </span>
);

/* ---------------- Last 8 ---------------- */

export type Last8Variant = "squares" | "strip" | "bars";

const LAST8: Record<
  Last8Variant,
  { outerGap: number; innerGap: number; w: number; h: number; r: number; up: string; down: string }
> = {
  /** Vertical-view coin tile — 11px rounded squares. */
  squares: { outerGap: 9, innerGap: 4, w: 11, h: 11, r: 3, up: DIR_UP, down: DIR_DOWN },
  /** All-stage tiles — 9px (State A) / 8px (State B) tight strip. */
  strip: { outerGap: 8, innerGap: 3, w: 9, h: 9, r: 2, up: DIR_UP, down: DIR_DOWN },
  /** Tall 7×14 bars with softened fills. */
  bars: { outerGap: 8, innerGap: 3, w: 7, h: 14, r: 3, up: DIR_UP_SOFT, down: DIR_DOWN_SOFT },
};

export const Last8Strip = ({
  history,
  variant = "squares",
  dot,
  label = "Last 8",
  labelStyle,
  outerGap,
  innerGap,
  /** Pad to eight slots with empty marks (off = render only played rounds). */
  pad = true,
  tooltip = false,
}: {
  history: ("up" | "down")[];
  variant?: Last8Variant;
  dot?: number;
  label?: string;
  labelStyle?: React.CSSProperties;
  outerGap?: number;
  innerGap?: number;
  pad?: boolean;
  tooltip?: boolean;
}) => {
  const v = LAST8[variant];
  const last8 = history.slice(-8);
  const marks = pad
    ? Array.from({ length: 8 }).map((_, i) => last8[i - (8 - last8.length)])
    : last8;

  const row = (
    <span
      className="flex items-center"
      style={{ gap: innerGap ?? v.innerGap }}
      aria-label={tooltip ? "Last 8 rounds — ▲ Up won · ▼ Down won" : undefined}
    >
      {marks.map((m, i) => (
        <span
          key={i}
          style={{
            width: dot ?? v.w,
            height: dot ?? v.h,
            borderRadius: v.r,
            background: m === "up" ? v.up : m === "down" ? v.down : DIR_EMPTY,
          }}
        />
      ))}
    </span>
  );

  return (
    <span className="flex items-center" style={{ gap: outerGap ?? v.outerGap }}>
      <span style={labelStyle}>{label}</span>
      {tooltip ? (
        <TooltipProvider delayDuration={120}>
          <Tooltip>
            <TooltipTrigger asChild>{row}</TooltipTrigger>
            <TooltipContent>
              Last 8 rounds — <span style={{ color: DIR_UP }}>▲</span> Up won ·{" "}
              <span style={{ color: DIR_DOWN }}>▼</span> Down won
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        row
      )}
    </span>
  );
};

/* ---------------- Price / ±% read-out ---------------- */

/** Formatted price read-out. Callers pass the already-localised string. */
export const PriceReadout = ({
  text,
  size,
  color = "#fff",
  weight = 700,
  letterSpacing,
  className,
}: {
  text: string;
  size: number;
  color?: string;
  weight?: number;
  letterSpacing?: string;
  className?: string;
}) => (
  <span
    className={cn("font-display", className)}
    style={{
      fontSize: size,
      color,
      fontWeight: weight,
      fontVariantNumeric: "tabular-nums",
      letterSpacing,
    }}
  >
    {text}
  </span>
);

/** Signed percentage change, always coloured by the trading token law. */
export const PctChange = ({
  value,
  size = 12,
  weight,
  decimals = 2,
  minus = "−",
  tabular = true,
  className,
}: {
  value: number;
  size?: number;
  weight?: number;
  decimals?: number;
  /** "−" (minus sign) on the dense surfaces, "-" where the copy uses ASCII. */
  minus?: string;
  tabular?: boolean;
  className?: string;
}) => (
  <span
    className={className}
    style={{
      fontSize: size,
      fontWeight: weight,
      fontVariantNumeric: tabular ? "tabular-nums" : undefined,
      color: pctColor(value),
    }}
  >
    {value >= 0 ? "+" : minus}
    {Math.abs(value).toFixed(decimals)}%
  </span>
);
