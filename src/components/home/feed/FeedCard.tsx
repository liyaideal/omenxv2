import { ReactNode, CSSProperties } from "react";
import { cn } from "@/lib/utils";

export type FeedTier = 1 | 2 | 3;
export type FeedAccent = "primary" | "green" | "red" | "yellow" | "none";

interface FeedCardProps {
  /** Top-left tag, e.g. "Trending", "Onboarding". Sentence/Title case OK. Hidden when compact. */
  tag: string;
  /** Optional small element on the top-right (e.g. countdown, dismiss). */
  meta?: ReactNode;
  /** Card body. */
  children: ReactNode;
  /** Optional click handler (turns the whole card into a button). */
  onClick?: () => void;
  /** Visual hierarchy tier. Defaults to 3 (browse). */
  tier?: FeedTier;
  /** Accent color (left bar for tier 1; meta tint for tier 2). */
  accent?: FeedAccent;
  /** Compact mode — used for 2nd+ consecutive same-kind item. */
  compact?: boolean;
  /** Tier 1 only — show a 6px red unread dot in the tag row. */
  unread?: boolean;
  className?: string;
}

const accentBarMap: Record<FeedAccent, string> = {
  primary: "bg-primary",
  green: "bg-trading-green",
  red: "bg-trading-red",
  yellow: "bg-trading-yellow",
  none: "",
};

// HSL triplets matching the design tokens — used to drive accent-breathe glow.
const accentGlowMap: Record<FeedAccent, string | undefined> = {
  primary: "var(--primary)",
  green: "var(--trading-green)",
  red: "var(--trading-red)",
  yellow: "var(--trading-yellow)",
  none: undefined,
};

/**
 * Shared visual shell for every Home feed item.
 *
 * Rules:
 *  - shell: rounded-2xl border border-border/40 bg-card
 *  - tier 1 (personal): p-4 + 2px left accent bar with breathing glow
 *  - tier 2 (opportunity): p-4, accent only on meta
 *  - tier 3 (browse): p-3.5, no accent
 *  - compact: hide tag, p-3 (used for repeated kinds)
 *  - unread (tier 1): 6px red dot beside the tag
 *
 * One accent allowed inside (primary / trading-green|red|yellow).
 * No background gradients, no decorative imagery.
 *
 * Motion: subtle press scale + border highlight on hover. All animations
 * disabled under `prefers-reduced-motion: reduce`.
 */
export const FeedCard = ({
  tag,
  meta,
  children,
  onClick,
  tier = 3,
  accent = "none",
  compact = false,
  unread = false,
  className,
}: FeedCardProps) => {
  const Wrapper = onClick ? "button" : "div";
  const showAccentBar = tier === 1 && accent !== "none" && !compact;

  const padding = compact ? "p-3" : tier === 3 ? "p-3.5" : "p-4";

  const glowVar = accentGlowMap[accent];
  const accentStyle: CSSProperties | undefined = glowVar
    ? ({ ["--accent-glow" as string]: glowVar } as CSSProperties)
    : undefined;

  return (
    <Wrapper
      onClick={onClick}
      style={accentStyle}
      className={cn(
        "relative block w-full overflow-hidden rounded-2xl border border-border/40 bg-card text-left",
        "transition-[transform,background-color,border-color,box-shadow] duration-150 ease-out",
        "motion-reduce:transition-none",
        padding,
        onClick && "hover:bg-card-hover hover:border-border/70 active:scale-[0.985] active:bg-card-hover",
        onClick && tier === 1 && "hover:shadow-[0_0_0_1px_hsl(var(--primary)/0.25)]",
        showAccentBar && "pl-[14px]",
        className,
      )}
    >
      {showAccentBar && (
        <span
          aria-hidden
          className={cn(
            "absolute inset-y-2 left-0 w-[2px] rounded-r-full",
            "animate-accent-breathe motion-reduce:animate-none",
            accentBarMap[accent],
          )}
        />
      )}
      {!compact && (
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {tag}
            {unread && tier === 1 && (
              <span
                aria-label="Unread"
                className="inline-block h-1.5 w-1.5 rounded-full bg-trading-red animate-pulse-soft motion-reduce:animate-none"
              />
            )}
          </span>
          {meta && <span className="text-[11px] text-muted-foreground">{meta}</span>}
        </div>
      )}
      {children}
    </Wrapper>
  );
};
