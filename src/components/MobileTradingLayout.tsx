import { useState } from "react";
import { useNavigate, useSearchParams, useNavigationType, useLocation } from "react-router-dom";
import { Loader2, Link } from "lucide-react";
import { MobileHeader } from "@/components/MobileHeader";
import { OptionChips } from "@/components/OptionChips";
import { EventSelectorSheet } from "@/components/EventSelectorSheet";
import { EventInfoContent } from "@/components/EventInfoContent";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useEvents, TradingEvent, EventOption } from "@/hooks/useEvents";
import { isSingleMarketBinary } from "@/lib/eventUtils";
import { MobileRiskIndicator } from "@/components/MobileRiskIndicator";
import { ExpiredEventFallback } from "@/components/ExpiredEventFallback";
import { useAuth } from "@/hooks/useAuth";

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
}

export function MobileTradingLayout({ activeTab, children }: MobileTradingLayoutProps) {
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("event") || undefined;
  const { user } = useAuth();
  
  // Determine back navigation behavior:
  // - If user navigated here via PUSH (from Events, Portfolio, etc.), use browser history (navigate(-1))
  // - If user came via bottom toolbar (REPLACE/POP) or direct URL, go back to home
  // Note: location.state?.tab is used by TradeOrder to show a specific section, not for routing
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
    const basePath = activeTab === "Charts" ? "/trade" : "/trade/order";
    navigate(`${basePath}?event=${event.id}`, { replace: true });
    setEventSheetOpen(false);
    setSearchQuery("");
  };

  const handleTabChange = (tab: "Charts" | "Trade") => {
    if (tab === activeTab) return;
    if (!selectedEvent) return;
    const path = tab === "Charts" 
      ? `/trade?event=${selectedEvent.id}` 
      : `/trade/order?event=${selectedEvent.id}`;
    navigate(path);
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

  // Create context data for children
  const contextData: TradingContextData = {
    selectedEvent,
    selectedOption,
    selectedOptionData,
    options,
    setSelectedOption,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Event Selector Sheet */}
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

      <MobileHeader 
        title={selectedEvent.name}
        endTime={selectedEvent.endTime}
        showActions
        showBack={true}
        backTo={backTo}
        showLogo={false} // Trade pages don't show logo per design spec
        tweetCount={selectedEvent.tweetCount}
        currentPrice={selectedEvent.currentPrice}
        priceChange24h={selectedEvent.priceChange24h}
        priceLabel={selectedEvent.priceLabel}
        sourceUrl={selectedEvent.sourceUrl}
        sourceName={selectedEvent.sourceName}
        period={selectedEvent.period}
        onTitleClick={() => setEventSheetOpen(true)}
        isFavorite={favorites.has(selectedEvent.id)}
        onFavoriteToggle={() => toggleFavorite(selectedEvent.id)}
      />

      {/* Option Chips — 单 market binary 不渲染（对阵信息已在标题+Yes/No 切换器表达）；多 outcome 才显示横排选择 */}
      {!isSingleMarketBinary(options) && (
        <OptionChips
          options={options}
          selectedId={selectedOption}
          onSelect={setSelectedOption}
        />
      )}

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
                <EventInfoContent event={selectedEvent} />
              </div>
            </SheetContent>
          </Sheet>
          {user && <MobileRiskIndicator />}
        </div>
      </div>

      {/* Render children with context */}
      {typeof children === "function" 
        ? (children as (data: TradingContextData) => React.ReactNode)(contextData)
        : children}
    </div>
  );
}

// Hook to access trading context from child pages
export function useMobileTradingContext() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("event") || undefined;
  return useEvents(eventId);
}
