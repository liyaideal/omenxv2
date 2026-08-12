// ============================================================
// CATEGORY PILL — desktop top-level category row (/events, Lite).
// The ONE pill implementation: production and the style-guide
// playground both render this component with the same constants.
// ============================================================
import { cn } from "@/lib/utils";

export const PILL_BASE =
  "shrink-0 rounded-full px-[14px] py-[7px] text-[12.5px] transition-colors";
export const PILL_ACTIVE = "bg-white text-[#0A0B0D] font-semibold";
export const PILL_IDLE =
  "border-[1.5px] border-[#2B2F38] text-[#C9CED6] hover:text-foreground";

/** Live pulse dot colour — a sport is in play right now. */
export const LIVE_DOT = "#FF4D4F";

export const CategoryPill = ({
  label,
  dot,
  active,
  live = false,
  onClick,
}: {
  label: string;
  dot?: string;
  active: boolean;
  /** Overrides the dot with a pulsing red one (in-play sports). */
  live?: boolean;
  onClick?: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      PILL_BASE,
      "flex items-center gap-[7px]",
      active ? PILL_ACTIVE : PILL_IDLE,
    )}
  >
    {dot && (
      <span
        aria-hidden
        className={live ? "animate-pulse" : undefined}
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: live ? LIVE_DOT : dot,
        }}
      />
    )}
    {label}
  </button>
);