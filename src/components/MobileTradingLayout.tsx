import { useState } from "react";
import { useNavigate, useSearchParams, useNavigationType } from "react-router-dom";
import { Loader2, Link, Star, Share2 } from "lucide-react";
import { MobileHeader, MobileHeaderIconButton } from "@/components/MobileHeader";
import { OptionChips } from "@/components/OptionChips";
import { EventSelectorSheet } from "@/components/EventSelectorSheet";
import { EventInfoContent } from "@/components/EventInfoContent";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useEvents, TradingEvent, EventOption } from "@/hooks/useEvents";
import { isSingleMarketBinary } from "@/lib/eventUtils";
import { MobileRiskIndicator } from "@/components/MobileRiskIndicator";
import { ExpiredEventFallback } from "@/components/ExpiredEventFallback";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";


// Context for sharing trading state with child components
export interface TradingContextData {
  selectedEvent: TradingEvent;
  selectedOption: string;
  selectedOptionData: EventOption;
  options: EventOption[];
  setSelectedOption: (optionId: string) => void;
}

interface MobileTradingLayoutProps {
  activeTab: "Charts" | "Trade";
  children: React.ReactNode | ((data: TradingContextData) => React.ReactNode);
  /** SP-2: tab navigation root. `/trade` (default, perp) or `/spot`. */
  basePath?: "/trade" | "/spot";
  /**
   * SP-2: `spot` drops the perp-only surfaces (risk indicator, option chips)
   * and renders a SPOT badge after the title. Defaults to `perp`.
   */
  variant?: "perp" | "spot";
  /** SP-2: bypass `useEvents` and drive the header from a supplied event. */
  event?: TradingEvent;
  /** SP-2: header countdown target override (spot uses freeze_time ?? end_date). */
  endTime?: Date;
  /** SP-2-FIX1: pre-formatted countdown text (single clock owned by the caller). */
  countdownText?: string;
  countdownLabel?: string;
  countdownUrgency?: "muted" | "yellow" | "red";
  /** SP-2: extra inline content in the header stats row (schedule ⓘ). */
  statsExtra?: React.ReactNode;
  /** SP-2: replaces the default Star + Share cluster in the header. */
  headerRight?: React.ReactNode;
  /** SP-2: replaces the body of the Event info sheet. */
  eventInfo?: React.ReactNode;
}

/**
 * SP-2-FIX1: the spot pages must NOT touch `useEvents` — its effect persists
 * `trading_last_event`, which would leak a spot id into the perp terminal.
 * The perp branch owns the hook; the spot branch renders the shell directly.
 */
export function MobileTradingLayout(props: MobileTradingLayoutProps) {
  if (props.variant === "spot" || props.event) {
    return <SpotTradingShell {...props} />;
  }
  return <PerpTradingLayout {...props} />;
}

/** Chrome shared by both branches. Owns no data hooks. */
function TradingShell({
  activeTab,
  basePath = "/trade",
  isSpot,
  activeEvent,
  endTime,
  countdownText,
  countdownLabel,
  countdownUrgency,
  statsExtra,
  headerRight,
  eventInfo,
  backTo,
  onTitleClick,
  optionChips,
  riskIndicator,
  children,
}: {
  activeTab: "Charts" | "Trade";
  basePath?: "/trade" | "/spot";
  isSpot: boolean;
  activeEvent: TradingEvent;
  endTime?: Date;
  countdownText?: string;
  countdownLabel?: string;
  countdownUrgency?: "muted" | "yellow" | "red";
  statsExtra?: React.ReactNode;
  headerRight?: React.ReactNode;
  eventInfo?: React.ReactNode;
  backTo?: string;
  onTitleClick?: () => void;
  optionChips?: React.ReactNode;
  riskIndicator?: React.ReactNode;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();

  const handleTabChange = (tab: "Charts" | "Trade") => {
    if (tab === activeTab) return;
    const path =
      tab === "Charts"
        ? `${basePath}?event=${activeEvent.id}`
        : `${basePath}/order?event=${activeEvent.id}`;
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader
        title={activeEvent.name}
        endTime={endTime}
        countdownText={countdownText}
        countdownLabel={countdownLabel}
        countdownUrgency={countdownUrgency}
        statsExtra={statsExtra}
        titleBadge={
          isSpot ? (
            <Badge variant="outline" className="text-[9px] flex-shrink-0">SPOT</Badge>
          ) : undefined
        }
        showBack={true}
        backTo={backTo}
        showLogo={false} // Trade pages don't show logo per design spec
        tweetCount={isSpot ? undefined : activeEvent.tweetCount}
        currentPrice={isSpot ? undefined : activeEvent.currentPrice}
        priceChange24h={isSpot ? undefined : activeEvent.priceChange24h}
        priceLabel={isSpot ? undefined : activeEvent.priceLabel}
        sourceUrl={activeEvent.sourceUrl}
        sourceName={activeEvent.sourceName}
        period={activeEvent.period}
        onTitleClick={onTitleClick}
        rightContent={headerRight}
      />

      {optionChips}

      {/* Charts/Trade Tabs with MM Indicator */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-border/30">
        <div className="flex">
          {(["Charts", "Trade"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`py-1.5 mr-6 text-sm font-medium transition-all ${
                activeTab === tab
                  ? "text-trading-purple border-b-2 border-trading-purple"
                  : "text-muted-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Right cluster: Info + MM Indicator */}
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <button
                aria-label="Event info"
                className="flex flex-col items-center justify-center w-14 h-10 rounded-lg bg-muted/50 border border-border/30 hover:bg-muted transition-colors"
              >
                <span className="text-[10px] text-muted-foreground leading-none mb-0.5">Event info</span>
                <Link className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-2xl">
              <SheetHeader className="sr-only">
                <SheetTitle>Event Info</SheetTitle>
              </SheetHeader>
              <div className="px-1 pb-4">
                {eventInfo ?? <EventInfoContent event={activeEvent} />}
              </div>
            </SheetContent>
          </Sheet>
          {riskIndicator}
        </div>
      </div>

      {children}
    </div>
  );
}

/** SP-2: spot pages supply their own event, watchlist star and countdown. */
function SpotTradingShell({
  activeTab,
  children,
  basePath = "/spot",
  event,
  endTime,
  countdownText,
  countdownLabel,
  countdownUrgency,
  statsExtra,
  headerRight,
  eventInfo,
}: MobileTradingLayoutProps) {
  const navigationType = useNavigationType();
  const backTo = navigationType === "PUSH" ? undefined : "/";
  if (!event) return null;

  return (
    <TradingShell
      activeTab={activeTab}
      basePath={basePath}
      isSpot
      activeEvent={event}
      endTime={endTime}
      countdownText={countdownText}
      countdownLabel={countdownLabel}
      countdownUrgency={countdownUrgency}
      statsExtra={statsExtra}
      headerRight={headerRight}
      eventInfo={eventInfo}
      backTo={backTo}
    >
      {typeof children === "function"
        ? (children as (data: TradingContextData) => React.ReactNode)({
            selectedEvent: event,
            selectedOption: "",
            selectedOptionData: undefined as unknown as EventOption,
            options: [],
            setSelectedOption: () => undefined,
          })
        : children}
    </TradingShell>
  );
}

function PerpTradingLayout({
  activeTab,
  children,
  basePath = "/trade",
  endTime: endTimeOverride,
  countdownLabel,
  countdownUrgency,
  statsExtra,
  headerRight,
  eventInfo,
}: MobileTradingLayoutProps) {
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("event") || undefined;
  const { user } = useAuth();

  // Determine back navigation behavior:
  // - If user navigated here via PUSH (from Events, Portfolio, etc.), use browser history (navigate(-1))
  // - If user came via bottom toolbar (REPLACE/POP) or direct URL, go back to home
  const backTo = navigationType === "PUSH" ? undefined : "/";

  const {
    isLoading,
    selectedEvent,
    options,
    selectedOption,
    setSelectedOption,
    selectedOptionData,
    setSelectedEvent,
    favorites,
    toggleFavorite,
    searchQuery,
    setSearchQuery,
    filteredEvents,
    showFavoritesOnly,
    toggleShowFavoritesOnly,
  } = useEvents(eventId);

  const [eventSheetOpen, setEventSheetOpen] = useState(false);

  // Handle event selection and update URL
  const handleEventSelect = (event: TradingEvent) => {
    setSelectedEvent(event);
    const target = activeTab === "Charts" ? basePath : `${basePath}/order`;
    navigate(`${target}?event=${event.id}`, { replace: true });
    setEventSheetOpen(false);
    setSearchQuery("");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading events...</p>
        </div>
      </div>
    );
  }

  // No event found — check if user provided an event ID that doesn't exist (expired/settled)
  if (!selectedEvent) {
    if (eventId) {
      return <ExpiredEventFallback eventId={eventId} />;
    }
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <p className="text-lg font-medium text-foreground">No events available</p>
          <p className="text-sm text-muted-foreground">Please check back later for new trading events.</p>
          <button
            onClick={() => navigate("/")}
            className="text-primary hover:underline"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const contextData: TradingContextData = {
    selectedEvent,
    selectedOption,
    selectedOptionData,
    options,
    setSelectedOption,
  };

  return (
    <>
      <EventSelectorSheet
        open={eventSheetOpen}
        onOpenChange={setEventSheetOpen}
        selectedEvent={selectedEvent}
        filteredEvents={filteredEvents}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showFavoritesOnly={showFavoritesOnly}
        toggleShowFavoritesOnly={toggleShowFavoritesOnly}
        onEventSelect={handleEventSelect}
      />

      <TradingShell
        activeTab={activeTab}
        basePath={basePath}
        isSpot={false}
        activeEvent={selectedEvent}
        endTime={endTimeOverride ?? selectedEvent.endTime}
        countdownLabel={countdownLabel}
        countdownUrgency={countdownUrgency}
        statsExtra={statsExtra}
        eventInfo={eventInfo}
        backTo={backTo}
        onTitleClick={() => setEventSheetOpen(true)}
        headerRight={
          headerRight ?? (
            <div className="flex items-center gap-1 -mr-2">
              <MobileHeaderIconButton
                aria-label="Favorite"
                onClick={() => toggleFavorite(selectedEvent.id)}
              >
                <Star
                  className={`w-5 h-5 ${favorites.has(selectedEvent.id) ? "text-trading-yellow fill-trading-yellow" : ""}`}
                  strokeWidth={1.5}
                />
              </MobileHeaderIconButton>
              <MobileHeaderIconButton
                aria-label="Share"
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                }}
              >
                <Share2 className="w-5 h-5" strokeWidth={1.5} />
              </MobileHeaderIconButton>
            </div>
          )
        }
        optionChips={
          // 单 market binary 不渲染（对阵信息已在标题+Yes/No 切换器表达）
          !isSingleMarketBinary(options) ? (
            <OptionChips
              options={options}
              selectedId={selectedOption}
              onSelect={setSelectedOption}
            />
          ) : null
        }
        riskIndicator={user ? <MobileRiskIndicator /> : null}
      >
        {typeof children === "function"
          ? (children as (data: TradingContextData) => React.ReactNode)(contextData)
          : children}
      </TradingShell>
    </>
  );
}

// Hook to access trading context from child pages
export function useMobileTradingContext() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("event") || undefined;
  return useEvents(eventId);
}
