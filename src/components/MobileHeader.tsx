import { useState, useEffect, ReactNode } from "react";
import { ChevronLeft, ChevronDown, Star, Share2, ExternalLink } from "lucide-react";
import { useNavigate, useNavigationType, useLocation } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";

/**
 * Mobile Header Design Specification
 * ==================================
 * 
 * LOGO RULES:
 * - Show logo on all pages EXCEPT Trade pages (TradeOrder, TradingCharts)
 * - Logo is positioned on the left side
 * - Use showLogo prop to control (default: true)
 * 
 * BACK BUTTON RULES:
 * - NEVER show on BottomNav entry pages: /, /events, /leaderboard, /trade, /portfolio
 * - Show when navigationType === "PUSH" (user clicked a link to get here)
 * - Hide when navigationType === "POP" or "REPLACE" (browser back, or direct URL)
 * - Use showBack prop to force override
 * - Style: Ghost button, h-9 w-9, no background frame
 * 
 * TITLE RULES:
 * - Always centered
 * - Subtitle or countdown displayed below title
 * 
 * RIGHT ACTIONS:
 * - Optional favorite and share buttons via showActions prop
 * - Custom right content via rightContent prop
 */

interface MobileHeaderProps {
  title?: string; // Optional - when not provided, title section is hidden
  subtitle?: string;
  endTime?: Date; // For countdown display
  showBack?: boolean; // Force show/hide back button (default: auto based on navigationType)
  backTo?: string; // Custom back navigation path (default: navigate(-1))
  showLogo?: boolean; // Show logo (default: true, set false for Trade pages)
  showActions?: boolean; // Show favorite and share buttons
  rightContent?: ReactNode; // Custom right side content (overrides showActions)
  tweetCount?: number;
  // Price-based event data
  currentPrice?: string;
  priceChange24h?: string;
  priceLabel?: string; // Dynamic label for the asset (e.g., "BTC/USD", "S&P 500")
  sourceUrl?: string;
  sourceName?: string;
  period?: string;
  onTitleClick?: () => void;
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
}

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

export const MobileHeader = ({ 
  title, 
  subtitle, 
  endTime, 
  showBack, 
  backTo,
  showLogo = true,
  showActions = false,
  rightContent,
  tweetCount, 
  currentPrice,
  priceChange24h,
  priceLabel,
  sourceUrl,
  sourceName,
  period,
  onTitleClick,
  isFavorite = false,
  onFavoriteToggle,
}: MobileHeaderProps) => {
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const location = useLocation();
  const countdown = useCountdown(endTime);
  const displayTime = endTime ? countdown : subtitle;
  
  // BottomNav entry pages - should NEVER show back button
  const BOTTOM_NAV_ROUTES = ['/', '/events', '/leaderboard', '/trade', '/portfolio'];
  const isBottomNavPage = BOTTOM_NAV_ROUTES.includes(location.pathname);
  
  // Show back button: 
  // 1. If explicitly set, use that value
  // 2. Never show on BottomNav entry pages
  // 3. Otherwise show only for PUSH navigation
  const shouldShowBack = showBack !== undefined 
    ? showBack 
    : (!isBottomNavPage && navigationType === "PUSH");

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  const handleFavorite = () => {
    if (onFavoriteToggle) {
      onFavoriteToggle();
      toast(isFavorite ? "Removed from favorites" : "Added to favorites", {
        duration: 2000,
      });
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: title,
      text: `Check out this prediction market: ${title}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast("Link copied to clipboard", { duration: 2000 });
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        await navigator.clipboard.writeText(window.location.href);
        toast("Link copied to clipboard", { duration: 2000 });
      }
    }
  };

  // Determine what to show on the left
  // Hide MAINNET badge whenever there's a centered title to avoid overlap.
  const showBadge = !title;
  const renderLeft = () => {
    if (shouldShowBack && showLogo) {
      // Both back button and logo
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={handleBack}
            className="h-9 w-9 flex items-center justify-center transition-all duration-200 active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <Logo size="md" showMainnetBadge={showBadge} />
        </div>
      );
    } else if (shouldShowBack) {
      // Only back button, no logo
      return (
        <button
          onClick={handleBack}
          className="h-9 w-9 flex items-center justify-center transition-all duration-200 active:scale-95"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
      );
    } else if (showLogo) {
      // Only logo, no back button
      return <Logo size="md" showMainnetBadge={showBadge} />;
    } else {
      // Neither - empty space for alignment
      return <div className="w-9" />;
    }
  };

  // Determine what to show on the right
  const renderRight = () => {
    if (rightContent) {
      return rightContent;
    }
    
    if (showActions) {
      return (
        <div className="flex items-center gap-1">
          <button 
            onClick={handleFavorite}
            className="h-9 w-9 flex items-center justify-center transition-all duration-200 active:scale-95"
          >
            <Star 
              className={`w-5 h-5 transition-colors ${isFavorite ? "text-trading-yellow fill-trading-yellow" : "text-muted-foreground"}`} 
              strokeWidth={1.5} 
            />
          </button>
          <button 
            onClick={handleShare}
            className="h-9 w-9 flex items-center justify-center transition-all duration-200 active:scale-95"
          >
            <Share2 className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
          </button>
        </div>
      );
    }
    
    return <div className="w-9" />;
  };

  // Check if we have stats to show (Trade page specific)
  const hasStats = displayTime || tweetCount !== undefined || currentPrice;

  return (
    <header className="sticky top-0 bg-background/95 backdrop-blur z-40 px-4 py-2 border-b border-border">
      {/* Row 1: Back + Title + Actions */}
      <div className="flex items-center justify-between gap-2">
        {/* Left: Back button and/or Logo */}
        <div className="flex-shrink-0">
          {renderLeft()}
        </div>

        {/* Center: Title - allows 2 lines for long titles */}
        {title ? (
          <div 
            className={`flex-1 min-w-0 text-center ${onTitleClick ? "cursor-pointer" : ""}`}
            onClick={onTitleClick}
          >
            <div className="flex items-center justify-center gap-1">
              <h1 className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">{title}</h1>
              {onTitleClick && <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 self-start mt-0.5" />}
            </div>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {/* Right: Action buttons or custom content */}
        <div className="flex-shrink-0">
          {renderRight()}
        </div>
      </div>

      {/* Row 2: Stats bar (only for Trade pages with stats) */}
      {hasStats && (
        <div className="flex items-center justify-center gap-4 mt-1.5 pt-1.5 border-t border-border/30">
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
