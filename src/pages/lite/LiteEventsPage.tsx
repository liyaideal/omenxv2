import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Star } from "lucide-react";
import { useActiveEvents } from "@/hooks/useActiveEvents";
import { useMarketListData } from "@/hooks/useMarketListData";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { MobileHeader } from "@/components/MobileHeader";
import { BottomNav } from "@/components/BottomNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useCategoryBoostConfigs } from "@/hooks/useCategoryBoostConfigs";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { cn } from "@/lib/utils";
import { LiteEventCard } from "@/components/lite/LiteEventCard";
import { LiveSettledSwitch } from "@/components/lite/LiveSettledSwitch";
import {
  TopicSheet,
  TraitChip,
  WatchlistChip,
} from "@/components/lite/LiteListControls";
import { CalendarChip } from "@/components/lite/LiteListControls";
import { LiteCalendarView } from "@/components/lite/calendar/LiteCalendarView";
import { EmptyState } from "@/components/states";
import { sortLiteLiveList, trendingThreshold } from "@/lib/liteListBadges";
import {
  INTRADAY_SUBTYPES,
  type Timeframe,
  useIntradayStocks,
  useQuickRounds,
  useSecondTick,
} from "@/components/lite/intraday/intradayData";
import { LiteAllStage } from "@/components/lite/allstage/LiteAllStage";
import { LiteMobileAllStage } from "@/components/lite/mobile/LiteMobileAllStage";
import { MobileCategoryRow } from "@/components/lite/mobile/MobileCategoryRow";
import { MobileIntradayModule } from "@/components/lite/mobile/MobileIntradayModule";
import { MobileSportsModule } from "@/components/lite/mobile/MobileSportsModule";
import { EditorPicksModule } from "@/components/lite/picks/EditorPicksModule";
import { useEditorPicks } from "@/components/lite/picks/editorialPicks";
import { SportsStageCard } from "@/components/lite/sports/SportsStageCard";
import { useSportsMatches } from "@/components/lite/sports/sportsData";
import { LiteIntradayView } from "@/components/lite/categoryviews/LiteIntradayView";
import { LiteSportsView } from "@/components/lite/categoryviews/LiteSportsView";
import { useSurface } from "@/contexts/SurfaceContext";

// Data-driven sector rail. Filters on the RAW event category (lowercase DB
// value) so "Stocks" surfaces the us-*-updown spot events (category='stocks')
// rather than the Tech/Finance categoryLabel bucket.
const SECTOR_ORDER: Array<{ id: string; label: string }> = [
  { id: "stocks", label: "Stocks" },
  { id: "crypto", label: "Crypto" },
  { id: "macro", label: "Macro" },
  { id: "tech", label: "Tech" },
  { id: "entertainment", label: "Entertainment" },
  { id: "politics", label: "Politics" },
  { id: "finance", label: "Finance" },
  { id: "social", label: "Social" },
];

// Single source of truth for the pill visual language on this page (v3 sizing).
const PILL_BASE =
  "shrink-0 rounded-full px-[14px] py-[7px] text-[12.5px] transition-colors";
const PILL_ACTIVE = "bg-white text-[#0A0B0D] font-semibold";
const PILL_IDLE =
  "border-[1.5px] border-[#2B2F38] text-[#C9CED6] hover:text-foreground";

// Desktop category row per the frozen contract. Dot-marked entries are views,
// not sector filters.
const DESKTOP_CATEGORIES: Array<{ id: string; label: string; dot?: string }> = [
  { id: "all", label: "All" },
  { id: "intraday", label: "Intraday", dot: "#FF8A3D" },
  { id: "sports", label: "Sports", dot: "#F2F3F5" },
  { id: "crypto", label: "Crypto" },
  { id: "stocks", label: "Stocks" },
  { id: "politics", label: "Politics" },
  { id: "macro", label: "Economy" },
];

const LiteEventsPage = () => {
  const navigate = useNavigate();
  const { setSurface } = useSurface();
  const isMobile = useIsMobile();
  const { events: dbEvents, isLoading } = useActiveEvents();
  const markets = useMarketListData(dbEvents);
  const { user } = useAuth();
  const { watchlist } = useWatchlist();
  const { getConfig: getBoostConfig } = useCategoryBoostConfigs();
  const [authOpen, setAuthOpen] = useState(false);
  const [topicSheetOpen, setTopicSheetOpen] = useState(false);
  const [boostOnly, setBoostOnly] = useState(false);
  // Calendar is a lens on this page — a view state, never a route.
  const [calendarOn, setCalendarOn] = useState(false);

  // Non-sports markets pool ("All" and per-sector filter both operate here).
  // Intraday events live in the dedicated band above the grid, never in it.
  const openMarkets = useMemo(
    () =>
      markets.filter(
        (m) =>
          (m.category || "").toLowerCase() !== "sports" &&
          !INTRADAY_SUBTYPES.includes(
            (m.eventSubtype || "") as (typeof INTRADAY_SUBTYPES)[number],
          ),
      ),
    [markets],
  );

  // Only render sector pills for categories that actually have events.
  const sectorCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of openMarkets) {
      const c = (m.category || "").toLowerCase();
      counts.set(c, (counts.get(c) || 0) + 1);
    }
    return counts;
  }, [openMarkets]);

  const availableSectors = useMemo(
    () => SECTOR_ORDER.filter((s) => (sectorCounts.get(s.id) || 0) > 0),
    [sectorCounts],
  );

  const [sector, setSector] = useState<string>("all");
  const isWatchlistView = sector === "watchlist";
  const isStageView = !calendarOn && !isMobile && sector === "all" && !boostOnly;
  const isIntradayView = !calendarOn && !isMobile && sector === "intraday";
  const isSportsView = !calendarOn && !isMobile && sector === "sports";
  // Mobile mirrors the same category-as-view IA (contract 11B).
  const isMobileStage = !calendarOn && !!isMobile && sector === "all" && !boostOnly;
  const isMobileIntraday = !calendarOn && !!isMobile && sector === "intraday";
  const isMobileSports = !calendarOn && !!isMobile && sector === "sports";
  const [mobileTf, setMobileTf] = useState<Timeframe>("15m");

  // Stage data — desktop only, and only for the views that render it.
  const stageActive =
    calendarOn ||
    (!isMobile && (isStageView || isIntradayView)) ||
    isMobileStage ||
    isMobileIntraday;
  const tickSeconds = useSecondTick();
  const { currentFor, historyFor } = useQuickRounds(stageActive);
  const { rows: stockRows } = useIntradayStocks(stageActive);
  const { rows: sportsMatches } = useSportsMatches();
  const { picks: editorPicks, updatedAt: picksUpdatedAt } = useEditorPicks();

  const filtered = useMemo(() => {
    if (isWatchlistView) {
      // Watchlist keeps the user's own order — no re-ranking.
      return openMarkets.filter((m) => watchlist.has(m.eventId));
    }
    let set =
      sector === "all"
        ? openMarkets
        : openMarkets.filter((m) => (m.category || "").toLowerCase() === sector);
    if (boostOnly) {
      set = set.filter((m) => {
        const cfg = getBoostConfig(m.category);
        return cfg.enabled && cfg.maxBoost >= 2;
      });
    }
    // Same three-step rule for "All" and for each sector, scoped to the set.
    return sortLiteLiveList(set);
  }, [openMarkets, sector, watchlist, boostOnly, getBoostConfig, isWatchlistView]);

  // Trending cutoff is computed once from the whole live pool so a card's
  // badge doesn't flip when the user changes sector.
  const trendingCutoff = useMemo(() => trendingThreshold(openMarkets), [openMarkets]);

  const topicOptions = useMemo(
    () => [
      { id: "all", label: "All", count: openMarkets.length },
      ...availableSectors.map((s) => ({
        id: s.id,
        label: s.label,
        count: sectorCounts.get(s.id) || 0,
      })),
    ],
    [availableSectors, sectorCounts, openMarkets.length],
  );

  const topicLabel =
    sector === "all" ? "All" : availableSectors.find((s) => s.id === sector)?.label || "All";

  const resetAll = () => {
    setSector("all");
    setBoostOnly(false);
  };

  const handleWatchlistClick = () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    // Calendar and watchlist are mutually exclusive views.
    if (calendarOn) {
      setCalendarOn(false);
      setBoostOnly(false);
      setSector("watchlist");
      return;
    }
    if (isWatchlistView) {
      setSector("all");
      return;
    }
    // Trait toggles don't apply inside watchlist view.
    setBoostOnly(false);
    setSector("watchlist");
  };

  const handleCalendarClick = () => {
    setCalendarOn((v) => {
      const next = !v;
      if (next && isWatchlistView) setSector("all");
      return next;
    });
  };

  const traitChips = (
    <TraitChip kind="boost" active={boostOnly} onClick={() => setBoostOnly((v) => !v)} />
  );

  const watchlistStatusLine = (
    <div className="flex items-center gap-2" style={{ marginTop: 12, fontSize: 13 }}>
      <Star
        className="h-3.5 w-3.5"
        style={{ color: "#FFD23E", fill: "#FFD23E" }}
        strokeWidth={1.5}
      />
      <span style={{ color: "#C9CED6" }}>
        Your watchlist · {filtered.length} markets
      </span>
      <span className="flex-1" />
      <button
        type="button"
        onClick={resetAll}
        className="text-primary underline"
        style={{ textUnderlineOffset: 3 }}
      >
        Browse all
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {isMobile ? (
        <MobileHeader showLogo showBack={false} />
      ) : (
        <EventsDesktopHeader />
      )}

      <div
        className={cn(
          "mx-auto flex w-full max-w-7xl flex-1 flex-col pb-24",
          isMobile ? "px-4 py-4" : "px-4 py-6 lg:px-6",
        )}
      >
        {/* Intro strip — plain-language, no trader jargon; display treatment */}
        <div className={cn(!isMobile && "flex items-start justify-between gap-5")}>
          <div>
            <h1
              className="font-display font-bold tracking-tight text-foreground"
              style={{ fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.05 }}
            >
              What do you think happens next?
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Pick a topic. Tap Yes or No. That's it.
            </p>
          </div>
          {!isMobile && (
            <div className="flex shrink-0 items-center gap-2" style={{ marginTop: 6 }}>
              <LiveSettledSwitch
                value="live"
                onSelect={(v) => {
                  if (v === "settled") navigate("/resolved");
                }}
              />
            </div>
          )}
        </div>

        {/* Mobile view cluster — view switches, not filters */}
        {isMobile && (
          <div className="flex items-center" style={{ marginTop: 14 }}>
            <LiveSettledSwitch
              value="live"
              onSelect={(v) => {
                if (v === "settled") navigate("/resolved");
              }}
            />
          </div>
        )}

        {/* Filter row (removed entirely in watchlist view) */}
        {isWatchlistView && !calendarOn ? (
          isMobile ? (
            watchlistStatusLine
          ) : (
            <div className="flex items-center gap-2" style={{ marginTop: 16 }}>
              <div className="min-w-0 flex-1">{watchlistStatusLine}</div>
              <div className="flex shrink-0 items-center gap-2">
                <WatchlistChip
                  active
                  count={watchlist.size}
                  showLabel
                  onClick={handleWatchlistClick}
                />
                <CalendarChip
                  active={calendarOn}
                  onClick={handleCalendarClick}
                />
              </div>
            </div>
          )
        ) : isMobile ? (
          <div style={{ marginTop: 12 }}>
            <MobileCategoryRow
              categories={[
                { id: "all", label: "All" },
                { id: "intraday", label: "Intraday", dot: "#FF8A3D" },
                ...(sportsMatches.length
                  ? [
                      {
                        id: "sports",
                        label: "Sports",
                        dot: "#FF3B4E",
                        pulse: sportsMatches.some((m) => m.live),
                      },
                    ]
                  : []),
                ...availableSectors.map((s) => ({ id: s.id, label: s.label })),
              ]}
              value={sector}
              onSelect={setSector}
              watchlistActive={isWatchlistView}
              watchlistCount={watchlist.size}
              onWatchlist={handleWatchlistClick}
              calendarActive={calendarOn}
              onCalendar={handleCalendarClick}
            />
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2" style={{ marginTop: 16 }}>
            {DESKTOP_CATEGORIES.filter(
              (c) =>
                c.id === "all" ||
                c.id === "intraday" ||
                (c.id === "sports" ? sportsMatches.length > 0 : sectorCounts.get(c.id)),
            ).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSector(c.id)}
                className={cn(
                  PILL_BASE,
                  "flex items-center gap-[7px]",
                  c.id === sector ? PILL_ACTIVE : PILL_IDLE,
                )}
              >
                {c.dot && (
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 999,
                      background: c.dot,
                    }}
                  />
                )}
                {c.label}
              </button>
            ))}
            {/* Boost is a grid trait — hidden in calendar and module views. */}
            {!calendarOn && !isIntradayView && !isSportsView && (
              <>
                <span
                  aria-hidden
                  style={{ width: 1, height: 22, background: "#1D2026", margin: "0 5px" }}
                />
                {traitChips}
              </>
            )}
            {/* View lenses live at the right end of the category row. */}
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <WatchlistChip
                active={isWatchlistView}
                count={watchlist.size}
                showLabel
                onClick={handleWatchlistClick}
              />
              <CalendarChip
                active={calendarOn}
                onClick={handleCalendarClick}
              />
            </div>
          </div>
        )}

        {/* Calendar lens — replaces the page body in place. */}
        {calendarOn && (
          <div style={{ marginTop: 20 }}>
            <LiteCalendarView
              events={openMarkets}
              matches={sportsMatches}
              stocks={stockRows}
              sector={sector}
              isMobile={!!isMobile}
              onBackToList={() => setCalendarOn(false)}
              onOpenIntraday={() => {
                setCalendarOn(false);
                // Desktop has a dedicated Intraday view; mobile surfaces the
                // Intraday band on the "All" list.
                setSector(isMobile ? "all" : "intraday");
              }}
            />
          </div>
        )}

        {/* Desktop "All stage" — category-as-view. */}
        {!calendarOn && isStageView && (
          <LiteAllStage
            currentFor={currentFor}
            historyFor={historyFor}
            stockRows={stockRows}
            matches={sportsMatches}
            tickSeconds={tickSeconds}
            onOpenIntraday={() => setSector("intraday")}
            onOpenSports={() => setSector("sports")}
          />
        )}

        {/* Intraday category view (contract 7A) — full width, desktop. */}
        {isIntradayView && (
          <LiteIntradayView
            currentFor={currentFor}
            historyFor={historyFor}
            stockRows={stockRows}
            tickSeconds={tickSeconds}
          />
        )}

        {/* Sports category view (contract 7B) — full width, desktop. */}
        {isSportsView && <LiteSportsView matches={sportsMatches} />}

        {/* Mobile "All" stage (contract 11B/11C) — Intraday · Sports · Picks. */}
        {isMobileStage && (
          <LiteMobileAllStage
            currentFor={currentFor}
            historyFor={historyFor}
            stockRows={stockRows}
            matches={sportsMatches}
            tf={mobileTf}
            onSelectTf={setMobileTf}
            tickSeconds={tickSeconds}
            onOpenIntraday={() => setSector("intraday")}
            onOpenSports={() => setSector("sports")}
          />
        )}

        {/* Mobile category-as-view: Intraday / Sports full width. */}
        {isMobileIntraday && (
          <div style={{ marginTop: 18 }}>
            <MobileIntradayModule
              currentFor={currentFor}
              historyFor={historyFor}
              stockRows={stockRows}
              tf={mobileTf}
              onSelectTf={setMobileTf}
              tickSeconds={tickSeconds}
              onOpenIntraday={() => setSector("intraday")}
            />
          </div>
        )}
        {isMobileSports && (
          <div style={{ marginTop: 18 }}>
            <MobileSportsModule
              matches={sportsMatches}
              onOpenAll={() => setSector("sports")}
            />
          </div>
        )}

        {/* Editor's picks — desktop All view, between Sports and the catalogue. */}
        {!calendarOn && isStageView && editorPicks.length > 0 && picksUpdatedAt && (
          <div style={{ marginTop: 24 }}>
            <EditorPicksModule picks={editorPicks} updatedAt={picksUpdatedAt} />
          </div>
        )}

        {/* Card grid */}
        <div className="mt-6 flex flex-1 flex-col space-y-6">
        {!calendarOn && (isStageView || isMobileStage) && (
          <div className="flex items-start justify-between" style={{ padding: "6px 2px 0" }}>
            <div className="flex flex-col gap-[7px]">
              <span
                className="font-display"
                style={{
                  fontWeight: 700,
                  fontSize: 26,
                  color: "#fff",
                  letterSpacing: "-0.02em",
                }}
              >
                Will it happen?
              </span>
              <span style={{ fontSize: 13, color: "#9AA1AC" }}>
                Back Yes or No on real-world outcomes. Winning shares pay $1.
              </span>
            </div>
            <span style={{ fontSize: 12, color: "#6B7280" }}>
              {filtered.length} open
            </span>
          </div>
        )}
        {calendarOn ? null : isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : isIntradayView ||
          isSportsView ||
          isMobileIntraday ||
          isMobileSports ? null : isWatchlistView &&
          filtered.length === 0 ? (
          <EmptyState
            variant="page"
            title="Nothing starred yet"
            description="Tap the ★ on any market and it'll show up here."
            actionLabel="See all markets"
            onAction={resetAll}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            variant="page"
            title="No open markets here right now"
            description="New markets land in this topic as they open. Check back soon."
            actionLabel="See all markets"
            onAction={resetAll}
          />
        ) : (
          <div
            className={cn(
              "grid gap-[18px]",
              "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
            )}
          >
            {filtered.map((market, i) => {
              const cfg = getBoostConfig(market.category);
              return (
                <LiteEventCard
                  key={market.id}
                  market={market}
                  index={i}
                  boostMax={cfg.enabled ? cfg.maxBoost : null}
                  trendingCutoff={trendingCutoff}
                />
              );
            })}
          </div>
        )}

        {/* Pro escape hatch — plain-language, no big CTA. */}
        <div className="mt-auto pt-6 text-center text-xs text-muted-foreground">
          Want charts, leverage and the order book?{" "}
          <button
            type="button"
            onClick={() => {
              // Switch surfaces in place (context + localStorage + profile),
              // then land on the Pro events page — no /settings detour.
              setSurface("pro");
              navigate("/events");
            }}
            className="text-primary underline underline-offset-2 hover:text-primary/80"
          >
            Switch to Pro mode
          </button>
        </div>
        </div>
      </div>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      {isMobile && <BottomNav />}
    </div>
  );
};

export default LiteEventsPage;
