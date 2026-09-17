import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams, useNavigationType } from "react-router-dom";
import { Loader2, Link, Star, Share2 } from "lucide-react";
import { MobileHeader, MobileHeaderIconButton } from "@/components/MobileHeader";
import { OptionChips } from "@/components/OptionChips";
import { EventSelectorSheet } from "@/components/EventSelectorSheet";
import { EventInfoContent } from "@/components/EventInfoContent";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useEvents, TradingEvent, EventOption } from "@/hooks/useEvents";
import { useEventSelector } from "@/hooks/useEventSelector";
import { terminalPath, type ProductTab } from "@/lib/eventSelector";
import { buildFixtureMarkets, fixtureLinePath } from "@/lib/fixtureMarkets";
import { MarketLineRow } from "@/components/pro/MarketLineRow";
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
  /** SP-2: tab navigation root. `/trade` (default, perp) or `/spot`. */
  basePath?: "/trade" | "/spot";
  /**
   * SP-2: `spot` drops the perp-only surfaces (risk indicator, option chips).
   * ES-1: no product badge on either terminal header — the product tab lives
   * in the event selector. Defaults to `perp`.
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
  /** Shared outcome rail rendered directly below the mobile header. */
  optionChips?: ReactNode;
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
    // SL-P: keep `?event=<fixture>&line=<sibling>` intact across Charts ↔ Trade.
    const search = new URLSearchParams(window.location.search);
    const line = search.get("line");
    const fixture = line ? search.get("event") ?? activeEvent.id : activeEvent.id;
    const qs = line ? `?event=${fixture}&line=${line}` : `?event=${activeEvent.id}`;
    navigate(tab === "Charts" ? `${basePath}${qs}` : `${basePath}/order${qs}`);
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
  optionChips,
}: MobileTradingLayoutProps) {
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const backTo = navigationType === "PUSH" ? undefined : "/";
  // ES-1: the spot title opens the same selector as /trade (Standard tab default).
  const selector = useEventSelector({ terminal: "standard" });
  const [eventSheetOpen, setEventSheetOpen] = useState(false);
  const handleEventSelect = (picked: TradingEvent, tab: ProductTab) => {
    setEventSheetOpen(false);
    selector.reset();
    navigate(terminalPath(tab, picked.id, activeTab === "Charts" ? "charts" : "order"), { replace: tab === "standard" });
  };
  if (!event) return null;

  return (
    <>
    <EventSelectorSheet
      open={eventSheetOpen}
      onOpenChange={(o) => { setEventSheetOpen(o); if (!o) selector.reset(); }}
      selector={selector}
      currentEventId={event.id}
      onSelect={handleEventSelect}
    />
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
      optionChips={optionChips}
      backTo={backTo}
      onTitleClick={() => setEventSheetOpen(true)}
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
    </>
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
  // SL-P: `?event=<fixture>&line=<sibling>` — the line, when present, is the event the terminal trades.
  const fixtureParam = searchParams.get("event") || undefined;
  const lineParam = searchParams.get("line") || undefined;
  const eventId = lineParam ?? fixtureParam;
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
    events,
    siblings,
    getEventById,
    getOptionsForEvent,
  } = useEvents(eventId);

  // SL-P: fixture market row for sports fixtures (same model as desktop).
  const fixtureMarkets = useMemo(
    () => buildFixtureMarkets(selectedEvent, events, siblings, getOptionsForEvent),
    [selectedEvent, events, siblings, getOptionsForEvent],
  );
  const currentLine = selectedEvent ? fixtureMarkets?.byId.get(selectedEvent.id)?.line ?? null : null;
  const orderBase = activeTab === "Charts" ? "/trade" : "/trade/order";
  useEffect(() => {
    if (!selectedEvent || !fixtureMarkets) return;
    const fx = fixtureMarkets.fixture.id;
    const wantLine = selectedEvent.id !== fx ? selectedEvent.id : undefined;
    if (fixtureParam !== fx || (lineParam ?? undefined) !== wantLine) {
      navigate(fixtureLinePath(orderBase, fx, selectedEvent.id), { replace: true });
    }
  }, [selectedEvent, fixtureMarkets, fixtureParam, lineParam, navigate, orderBase]);
  const handleLineSelect = (lineId: string) => {
    if (!fixtureMarkets) return;
    const target = getEventById(lineId);
    if (target) setSelectedEvent(target);
    navigate(fixtureLinePath(orderBase, fixtureMarkets.fixture.id, lineId), { replace: true });
  };

  // ES-1: one selector for both product lines; Boost is this terminal's tab.
  const selector = useEventSelector({ terminal: "boost", favorites, toggleFavorite });
  const [eventSheetOpen, setEventSheetOpen] = useState(false);

  // Handle event selection and update URL (a Standard pick jumps to /spot).
  const handleEventSelect = (event: TradingEvent, tab: ProductTab) => {
    setEventSheetOpen(false);
    selector.reset();
    const view = activeTab === "Charts" ? "charts" : "order";
    if (tab === "boost") {
      setSelectedEvent(event);
      navigate(terminalPath("boost", event.id, view), { replace: true });
    } else {
      navigate(terminalPath("standard", event.id, view));
    }
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
        onOpenChange={(o) => { setEventSheetOpen(o); if (!o) selector.reset(); }}
        selector={selector}
        currentEventId={selectedEvent.id}
        onSelect={handleEventSelect}
      />

      <TradingShell
        activeTab={activeTab}
        basePath={basePath}
        isSpot={false}
        activeEvent={fixtureMarkets ? { ...selectedEvent, name: fixtureMarkets.fixture.name } : selectedEvent}
        endTime={endTimeOverride ?? selectedEvent.endTime}
        countdownLabel={currentLine ? `${currentLine.caption} · ${countdownLabel ?? "Ends in"}` : countdownLabel}
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
          fixtureMarkets ? (
            // SL-P: sports fixture → market row (Winner / Handicap / Total … · Map n)
            <MarketLineRow
              markets={fixtureMarkets}
              currentId={selectedEvent.id}
              onSelect={handleLineSelect}
              variant="mobile"
            />
          ) :
          // 市场 chip 行 = 多 market 专属；binary（含队名/盘口/Up-Down 别名）不渲染
          !isSingleMarketBinary(options, selectedEvent) ? (
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
  // SL-P: a fixture line is the traded event.
  const eventId = searchParams.get("line") || searchParams.get("event") || undefined;
  return useEvents(eventId);
}
