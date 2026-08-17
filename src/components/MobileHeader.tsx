import type React from "react";
import { useState, useEffect, ReactNode, CSSProperties } from "react";
import { ChevronLeft, ChevronDown, ExternalLink } from "lucide-react";
import { useNavigate, useNavigationType, useLocation } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Logo } from "@/components/Logo";
import { useSurface } from "@/contexts/SurfaceContext";
import { cn } from "@/lib/utils";

/**
 * Mobile Header System v1 (DESIGN.md §10)
 * =======================================
 * ONE component, ONE height (56px + safe-area-top), TWO variants,
 * FOUR slot contracts. No Lite page may draw its own top bar.
 *
 * VARIANT A — "brand": Lite bottom-nav roots (/, /events, /portfolio,
 *   /wallet). Logo lg + Mainnet badge on the left, no back, no title,
 *   optional right slot. Divider fades in after 8px of scroll.
 * VARIANT B — "inner": everything else. Back 36x36 on the left, centered
 *   single-line 14/600 title, optional right slot, divider always on
 *   (unless `flushBottom` hands the divider to a sticky sub-bar).
 *
 * SLOTS: left (back | logo | spacer) · title (inner only) · right
 *   (`rightContent`: ≤2 MobileHeaderIconButton or 1 compact control)
 *   · optional Pro-only second stats row (endTime / tweets / price).
 *
 * Sub-bars that stick under the header use `top-[var(--mobile-header-h)]`.
 */

interface MobileHeaderProps {
  /** A/B variant. Defaults to brand when a logo is shown without a title. */
  variant?: "brand" | "inner";
  title?: string;
  subtitle?: string;
  endTime?: Date; // For countdown display
  showBack?: boolean; // Force show/hide back button (default: surface-aware)
  backTo?: string; // Custom back navigation path (default: navigate(-1))
  showLogo?: boolean;
  rightContent?: ReactNode;
  /** Hands the bottom divider to a sticky sub-bar directly below. */
  flushBottom?: boolean;
  tweetCount?: number;
  // Price-based event data (Pro stats row)
  currentPrice?: string;
  priceChange24h?: string;
  priceLabel?: string;
  sourceUrl?: string;
  sourceName?: string;
  period?: string;
  onTitleClick?: () => void;
  /** Keeps the title mounted but transparent (scroll-aware trade headers). */
  titleHidden?: boolean;
}

/** Right-slot icon button standard. Last one in the slot gets -mr-2 via wrapper. */
export const MobileHeaderIconButton = ({
  onClick,
  className,
  "aria-label": ariaLabel,
  children,
}: {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  "aria-label"?: string;
  children: ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={ariaLabel}
    className={cn(
      "h-9 w-9 flex items-center justify-center active:scale-95 transition-transform duration-200 text-muted-foreground",
      className,
    )}
  >
    {children}
  </button>
);

// Countdown hook
const useCountdown = (endTime: Date | undefined) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!endTime) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = endTime.getTime();
      const difference = end - now;

      if (difference <= 0) {
        return "00:00:00";
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  return timeLeft;
};

const LITE_ROOTS = ["/", "/events", "/portfolio", "/wallet"];
const PRO_ROOTS = ["/", "/events", "/leaderboard", "/trade", "/portfolio"];

export const MobileHeader = ({
  variant,
  title,
  subtitle,
  endTime,
  showBack,
  backTo,
  showLogo = true,
  rightContent,
  flushBottom = false,
  tweetCount,
  currentPrice,
  priceChange24h,
  priceLabel,
  sourceUrl,
  sourceName,
  period,
  onTitleClick,
  titleHidden = false,
}: MobileHeaderProps) => {
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const location = useLocation();
  const { surface } = useSurface();
  const countdown = useCountdown(endTime);
  const displayTime = endTime ? countdown : subtitle;

  const resolvedVariant = variant ?? (showLogo && !title ? "brand" : "inner");
  const isBrand = resolvedVariant === "brand";

  // Surface-aware root fallback: a bottom-nav root never shows back.
  const roots = surface === "pro" ? PRO_ROOTS : LITE_ROOTS;
  const isRoot = roots.includes(location.pathname);
  const shouldShowBack =
    showBack !== undefined ? showBack : !isRoot && navigationType === "PUSH";

  const handleBack = () => {
    if (backTo) navigate(backTo);
    else navigate(-1);
  };

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    if (!isBrand) return;
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isBrand]);

  const renderLeft = () => {
    if (isBrand && showLogo) return <Logo size="lg" showMainnetBadge />;
    if (shouldShowBack) {
      return (
        <button
          onClick={handleBack}
          aria-label="Back"
          className="h-9 w-9 -ml-2 flex items-center justify-center active:scale-95 transition-transform duration-200"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" strokeWidth={1.5} />
        </button>
      );
    }
    if (showLogo) return <Logo size="lg" showMainnetBadge />;
    return <div className="w-9 -ml-2" />;
  };

  const renderRight = () => {
    if (rightContent) return rightContent;
    if (isBrand) return null;
    return <div className="w-9 -mr-2" />;
  };

  const hasStats = displayTime || tweetCount !== undefined || currentPrice;

  const headerStyle = {
    paddingTop: "env(safe-area-inset-top)",
    ["--mobile-header-h" as string]: "calc(56px + env(safe-area-inset-top))",
  } as CSSProperties;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-background px-4",
        isBrand
          ? cn(
              "border-b transition-colors duration-200",
              scrolled ? "border-border" : "border-transparent",
            )
          : flushBottom
            ? "border-b border-transparent"
            : "border-b border-border",
      )}
      style={headerStyle}
    >
      {/* Row 1: left slot + title + right slot — fixed 56px */}
      <div className="flex h-14 items-center gap-2">
        <div className="flex-shrink-0">{renderLeft()}</div>

        {isBrand || !title ? (
          <div className="flex-1" />
        ) : (
          <div
            className={cn(
              "flex-1 min-w-0 text-center px-1 transition-opacity duration-150",
              titleHidden ? "opacity-0 pointer-events-none" : "opacity-100",
              onTitleClick ? "cursor-pointer" : "",
            )}
            onClick={onTitleClick}
          >
            <div className="flex items-center justify-center gap-1">
              <h1 className="text-sm font-semibold text-foreground truncate">
                {title}
              </h1>
              {onTitleClick && (
                <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              )}
            </div>
          </div>
        )}

        <div className="flex-shrink-0">{renderRight()}</div>
      </div>

      {/* Row 2: Pro stats bar (trade surfaces only) */}
      {hasStats && (
        <div className="flex items-center justify-center gap-4 pb-1.5 pt-1.5 border-t border-border/30">
          {displayTime && (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-trading-red rounded-full animate-pulse" />
              <span className="text-xs text-muted-foreground">Ends in</span>
              <span className="text-xs text-trading-red font-mono font-medium">{displayTime}</span>
            </div>
          )}
          {tweetCount !== undefined && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                >
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                  <span className="text-xs text-muted-foreground">Tweets</span>
                  <span className="text-xs text-orange-500 font-mono font-medium">{tweetCount}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" align="center">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Tweet Count</span>
                    <span className="text-lg font-bold text-orange-500">{tweetCount}</span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Period</span>
                      <span>{period || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last updated</span>
                      <span>Just now</span>
                    </div>
                  </div>
                  {sourceUrl && (
                    <a
                      href={sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {sourceName || "View Source"}
                    </a>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
          {currentPrice && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                >
                  <span className="w-1.5 h-1.5 bg-trading-green rounded-full animate-pulse" />
                  <span className="text-xs text-muted-foreground">Price</span>
                  <span className="text-xs text-trading-green font-mono font-medium">{currentPrice}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" align="center">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{priceLabel || "Current Price"}</span>
                    <span className="text-lg font-bold text-trading-green">{currentPrice}</span>
                  </div>
                  {priceChange24h && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">24h Change</span>
                      <span className={`text-sm font-medium ${priceChange24h.startsWith('+') ? 'text-trading-green' : 'text-trading-red'}`}>
                        {priceChange24h}
                      </span>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Period</span>
                      <span>{period || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last updated</span>
                      <span>Just now</span>
                    </div>
                  </div>
                  {sourceUrl && (
                    <a
                      href={sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {sourceName || "View Source"}
                    </a>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      )}
    </header>
  );
};
