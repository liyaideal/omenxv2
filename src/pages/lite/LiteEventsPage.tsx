import { SeoFooter } from "@/components/seo/SeoFooter";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Star } from "lucide-react";
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
import { WatchlistChip } from "@/components/lite/LiteListControls";
import { CalendarChip } from "@/components/lite/LiteListControls";

import { LiteEventsFilterRow } from "@/components/lite/LiteEventsHeader";

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
import { HomeTape, buildTapeItems } from "@/components/lite/home/HomeTape";
import { HomeHero } from "@/components/lite/home/HomeHero";
import { HomeStage } from "@/components/lite/home/HomeStage";
import {
  LiteAllStageSkeleton,
  LiteMarketGridSkeleton,
  LiteMarketListSkeleton,
  LiteMobileStageSkeleton,
} from "@/components/lite/skeletons/LiteEventsSkeletons";
import { SPORTS_SUBTYPE } from "@/components/lite/sports/sportsData";
import { MobileCategoryRow } from "@/components/lite/mobile/MobileCategoryRow";
import { MobileIntradayModule } from "@/components/lite/mobile/MobileIntradayModule";
import { MobileSportsModule } from "@/components/lite/mobile/MobileSportsModule";
import { useEditorPicks } from "@/components/lite/picks/editorialPicks";
import { SportsStageCard } from "@/components/lite/sports/SportsStageCard";
import { useSportsMatches } from "@/components/lite/sports/sportsData";
import { LiteIntradayView } from "@/components/lite/categoryviews/LiteIntradayView";
import { LiteSportsView } from "@/components/lite/categoryviews/LiteSportsView";
import { LiteCryptoView } from "@/components/lite/categoryviews/LiteCryptoView";
import { LiteFinanceView } from "@/components/lite/categoryviews/LiteFinanceView";
import {
  SECTOR_CATEGORIES,
  categoryMatchesTop,
  topCategoryForKey,
  topCategoryOrder,
} from "@/lib/taxonomy";

// Pill visual language lives in the shared CategoryPill module (v3 sizing).

/**
 * Catalogue identity card (HP-1b) — the first cell of the "All" catalogue grid.
 * Non-interactive brand card; NOT a market, never counted in "n open".
 */
const CatalogueIdentityCard = ({ isMobile }: { isMobile: boolean }) => (
  <div
    aria-hidden
    style={{
      position: "relative",
      background: "#131519",
      border: "1px solid #1d2026",
      borderRadius: 16,
      overflow: "hidden",
    }}
  >
    <img
      src={isMobile ? "/assets/mobile/will-it-happen.png" : "/assets/desktop/will-it-happen.png"}
      alt=""
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        width: "100%",
        objectFit: "cover",
        pointerEvents: "none",
      }}
    />
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.2)" }} />
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(to bottom, rgba(24,24,27,0.3) 0%, rgba(24,24,27,0.65) 50%, #18181b 100%)",
      }}
    />
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        height: "100%",
        padding: "37px 16px 32px 18px",
        boxSizing: "border-box",
      }}
    >
      <div
        className="font-display"
        style={{
          fontWeight: 700,
          fontSize: 40,
          lineHeight: "39px",
          letterSpacing: "-0.52px",
          color: "#fff",
        }}
      >
        Will it
        <br />
        happen?
      </div>
      <div
        className="font-sans"
        style={{
          fontSize: 13,
          lineHeight: "19.5px",
          color: "#9AA1AC",
          marginTop: 16,
          maxWidth: 279,
        }}
      >
        Buy Yes or No on real-world outcomes.
        <br />
        Winning shares pay <span style={{ color: "#fff" }}>$1</span>.
      </div>
    </div>
  </div>
);

/** Shared card grid — used flat and inside Boost category groups. */
const CardGrid = ({
  items,
  getBoostConfig,
  trendingCutoff,
  leadingSlot,
}: {
  items: ReturnType<typeof useMarketListData>;
  getBoostConfig: (category: string) => { enabled: boolean; maxBoost: number };
  trendingCutoff: number;
  leadingSlot?: React.ReactNode;
}) => (
  <div className={cn("grid gap-[18px]", "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3")}>
    {leadingSlot}
    {items.map((market, i) => {
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
);

const LiteEventsPage = () => {
  const isMobile = useIsMobile();
  const { events: dbEvents, isLoading } = useActiveEvents();
  const markets = useMarketListData(dbEvents);
  const { user } = useAuth();
  const { watchlist } = useWatchlist();
  const { getConfig: getBoostConfig } = useCategoryBoostConfigs();
  const [authOpen, setAuthOpen] = useState(false);
  const [boostOnly, setBoostOnly] = useState(false);
  // Calendar is a lens on this page — a view state, never a route.
  const [calendarOn, setCalendarOn] = useState(false);

  // Non-sports markets pool ("All" and per-sector filter both operate here).
  // Intraday events live in the dedicated band above the grid, never in it.
  const openMarkets = useMemo(
    () =>
      markets.filter(
        (m) =>
          // Only the winner-result fixtures live in the Sports module — every
          // other sports-derived market belongs in the catalogue (HP-1 §3.6).
          (m.eventSubtype || "") !== SPORTS_SUBTYPE &&
          !INTRADAY_SUBTYPES.includes(
            (m.eventSubtype || "") as (typeof INTRADAY_SUBTYPES)[number],
          ),
      ),
    [markets],
  );

  // Only render sector pills for categories that actually have events.
  // Counts are keyed by TAXONOMY top-level id, so `stocks` + `finance`
  // events fold into the single "Finance" chip. They are computed over the
  // WHOLE live pool (intraday rounds included) — a vertical view owns both
  // its engine and its catalogue, so Finance must light up when the only
  // live finance markets are the daily stock rounds.
  const sectorCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of markets) {
      const top = topCategoryForKey(m.category);
      if (!top) continue;
      counts.set(top.id, (counts.get(top.id) || 0) + 1);
    }
    return counts;
  }, [markets]);

  const availableSectors = useMemo(
    () => SECTOR_CATEGORIES.filter((s) => (sectorCounts.get(s.id) || 0) > 0),
    [sectorCounts],
  );

  // Campaign task CTAs land here with ?sector=<category> — deep-link the filter.
  const [searchParams] = useSearchParams();
  const [sector, setSector] = useState<string>(() => searchParams.get("sector") || "all");
  const isWatchlistView = sector === "watchlist";
  const isStageView = !calendarOn && !isMobile && sector === "all" && !boostOnly;
  const isIntradayView = !calendarOn && !isMobile && sector === "intraday";
  const isSportsView = !calendarOn && !isMobile && sector === "sports";
  // Mobile mirrors the same category-as-view IA (contract 11B).
  const isMobileStage = !calendarOn && !!isMobile && sector === "all" && !boostOnly;
  const isMobileIntraday = !calendarOn && !!isMobile && sector === "intraday";
  const isMobileSports = !calendarOn && !!isMobile && sector === "sports";
  // Crypto / Finance verticals — same component on both breakpoints.
  // Boost composes IN PLACE with the vertical views — the view stays mounted
  // and its engine/catalogue filter through the same boost predicate.
  const isCryptoView = !calendarOn && sector === "crypto";
  const isFinanceView = !calendarOn && sector === "finance";
  const [mobileTf, setMobileTf] = useState<Timeframe>("15m");
  // One-shot intent: the user tapped a "session open" row, so the Finance view
  // should scroll its rounds engine into view once after landing.
  const [scrollToEngine, setScrollToEngine] = useState(0);

  // Stage data — desktop only, and only for the views that render it.
  // The quote tape rides the same two streams, so they stay on in every view.
  const stageActive = true;
  const tickSeconds = useSecondTick();
  const { currentFor, historyFor, loading: roundsLoading } = useQuickRounds(stageActive);
  const { rows: stockRows, loading: stocksLoading } = useIntradayStocks(stageActive);
  const { rows: sportsMatches, loading: sportsLoading } = useSportsMatches();

  // First-load gates. A module only skeletons while its own hook is loading
  // AND it has nothing cached — a tab switch or a back-navigation with data
  // in hand renders the real content immediately (no skeleton flash).
  const eventsFirstLoad = isLoading && dbEvents.length === 0;
  const sportsFirstLoad = sportsLoading && sportsMatches.length === 0;
  const stageFirstLoad =
    (roundsLoading && currentFor.size === 0) ||
    (stocksLoading && stockRows.length === 0) ||
    sportsFirstLoad;
  /** A sports fixture is in play right now → the Sports pill pulses red. */
  const sportsLive = useMemo(
    () => sportsMatches.some((m) => m.live),
    [sportsMatches],
  );
  const { picks: editorPicks } = useEditorPicks();
  // Sports matches carry no per-event boost row — the category config is the
  // same predicate the card grid uses (enabled + at least 2x).
  const sportsBoostEnabled = useMemo(() => {
    const cfg = getBoostConfig("sports");
    return cfg.enabled && cfg.maxBoost >= 2;
  }, [getBoostConfig]);

  const filtered = useMemo(() => {
    if (isWatchlistView) {
      // Watchlist keeps the user's own order — no re-ranking.
      return openMarkets.filter((m) => watchlist.has(m.eventId));
    }
    let set =
      sector === "all"
        ? openMarkets
        : openMarkets.filter((m) => categoryMatchesTop(m.category, sector));
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

  // Boost is an IN-PLACE filter. With no category selected the filtered list
  // is grouped by category with small headers, in taxonomy order. Combined
  // with a category (Sports + Boost) it's a flat list — no headers needed.
  const boostGroups = useMemo(() => {
    if (!boostOnly || sector !== "all" || isWatchlistView) return null;
    const by = new Map<string, { id: string; label: string; items: typeof filtered }>();
    for (const m of filtered) {
      const top = topCategoryForKey(m.category);
      const id = top?.id ?? "other";
      const g = by.get(id) ?? { id, label: top?.label ?? "Other", items: [] };
      g.items.push(m);
      by.set(id, g);
    }
    return [...by.values()].sort(
      (a, b) => topCategoryOrder(a.id) - topCategoryOrder(b.id),
    );
  }, [filtered, boostOnly, sector, isWatchlistView]);

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


  const tapeItems = useMemo(
    () => buildTapeItems(currentFor, mobileTf, stockRows, tickSeconds),
    [currentFor, mobileTf, stockRows, tickSeconds],
  );
  const tapeLoading =
    (roundsLoading && currentFor.size === 0) || (stocksLoading && stockRows.length === 0);

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

  /* Chips band content — semantics unchanged, only the container moved. */
  const chipsRow =
    isWatchlistView && !calendarOn && !isMobile ? (
      <div className="flex items-center gap-2" style={{ marginTop: 16 }}>
        <div className="min-w-0 flex-1">{watchlistStatusLine}</div>
        <div className="flex shrink-0 items-center gap-2">
          <WatchlistChip
            active
            count={watchlist.size}
            showLabel
            onClick={handleWatchlistClick}
          />
          <CalendarChip active={calendarOn} onClick={handleCalendarClick} />
        </div>
      </div>
    ) : isMobile ? (
      <div className="flex flex-col" style={{ marginTop: 12, gap: 10 }}>
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
          boostActive={boostOnly}
          onBoost={() => setBoostOnly((v) => !v)}
        />
        {isWatchlistView && !calendarOn && watchlistStatusLine}
      </div>
    ) : (
      <LiteEventsFilterRow
        sector={sector}
        onSelectSector={setSector}
        sectorCounts={sectorCounts}
        sportsCount={sportsMatches.length}
        sportsLive={sportsLive}
        calendarOn={calendarOn}
        boostOnly={boostOnly}
        onToggleBoost={() => setBoostOnly((v) => !v)}
        watchlistActive={isWatchlistView}
        watchlistCount={watchlist.size}
        onWatchlist={handleWatchlistClick}
        onCalendar={handleCalendarClick}
      />
    );



  return (
    <div className="flex min-h-screen flex-col bg-background">
      {isMobile ? (
        <MobileHeader variant="brand" showBack={false} />
      ) : (
        <EventsDesktopHeader />
      )}

      {/* Quote tape — fed by the page's own crypto + equity streams. */}
      <HomeTape items={tapeItems} loading={tapeLoading} isMobile={!!isMobile} />

      {/* Hero — replaces the old greeting strip (HP-1). */}
      <HomeHero isMobile={!!isMobile} />

      {/* Chips band — same controls, now on a full-bleed dark rail. */}
      <div
        style={{
          background: "#08090D",
          borderTop: "1px solid rgba(148,163,184,0.08)",
          borderBottom: "1px solid rgba(148,163,184,0.08)",
        }}
      >
        <div
          className={cn(
            "mx-auto w-full max-w-7xl",
            isMobile ? "px-4" : "px-4 lg:px-6",
          )}
          style={{ paddingTop: 8, paddingBottom: 8 }}
        >
          {chipsRow}
        </div>
      </div>

      <div
        className={cn(
          "mx-auto flex w-full max-w-7xl flex-1 flex-col",
          isMobile ? "px-4 py-4" : "px-4 py-6 lg:px-6",
        )}
      >




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
                // Both surfaces have a dedicated Intraday view.
                setSector("intraday");
              }}
            />
          </div>
        )}

        {/* Desktop "All stage" — category-as-view. */}
        {!calendarOn && isStageView && stageFirstLoad && <LiteAllStageSkeleton />}
        {!calendarOn && isStageView && !stageFirstLoad && (
          <HomeStage
            currentFor={currentFor}
            historyFor={historyFor}
            stockRows={stockRows}
            stocksLoading={stocksLoading}
            matches={sportsMatches}
            picks={editorPicks}
            tf={mobileTf}
            onSelectTf={setMobileTf}
            tickSeconds={tickSeconds}
            isMobile={false}
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
            boostOnly={boostOnly}
          />
        )}

        {/* Sports category view (contract 7B) — full width, desktop. */}
        {isSportsView && (
          <LiteSportsView
            matches={sportsMatches}
            boostOnly={boostOnly}
            boostEnabled={sportsBoostEnabled}
          />
        )}

        {/* Crypto vertical view — engine (rounds) + catalogue. */}
        {isCryptoView && (
          <LiteCryptoView
            currentFor={currentFor}
            historyFor={historyFor}
            tickSeconds={tickSeconds}
            events={filtered}
            isMobile={!!isMobile}
            boostOnly={boostOnly}
            renderGrid={(items) => (
              <CardGrid
                items={items}
                getBoostConfig={getBoostConfig}
                trendingCutoff={trendingCutoff}
              />
            )}
          />
        )}

        {/* Finance vertical view — session engine + catalogue. */}
        {isFinanceView && (
          <LiteFinanceView
            stockRows={stockRows}
            tickSeconds={tickSeconds}
            events={filtered}
            isMobile={!!isMobile}
            boostOnly={boostOnly}
            scrollToEngine={scrollToEngine}
            renderGrid={(items) => (
              <CardGrid
                items={items}
                getBoostConfig={getBoostConfig}
                trendingCutoff={trendingCutoff}
              />
            )}
          />
        )}

        {/* Mobile "All" stage (contract 11B/11C) — Intraday · Sports · Picks. */}
        {isMobileStage && stageFirstLoad && <LiteMobileStageSkeleton />}
        {isMobileStage && !stageFirstLoad && (
          <HomeStage
            currentFor={currentFor}
            historyFor={historyFor}
            stockRows={stockRows}
            stocksLoading={stocksLoading}
            matches={sportsMatches}
            picks={editorPicks}
            tf={mobileTf}
            onSelectTf={setMobileTf}
            tickSeconds={tickSeconds}
            isMobile
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
            onOpenSession={() => {
              setSector("finance");
              setScrollToEngine((n) => n + 1);
            }}
              boostOnly={boostOnly}
            />
          </div>
        )}
        {isMobileSports && (
          <div style={{ marginTop: 18 }}>
            <MobileSportsModule
              matches={sportsMatches}
              filters
              boostOnly={boostOnly}
              boostEnabled={sportsBoostEnabled}
              onOpenAll={() => setSector("sports")}
            />
          </div>
        )}

        {/* Card grid */}
        <div className="mt-6 flex flex-1 flex-col gap-6">
        {!calendarOn && (isStageView || isMobileStage) && (
          <div className="flex items-center" style={{ padding: "6px 2px 0" }}>
            <span
              className="font-display"
              style={{
                fontWeight: 700,
                fontSize: 15,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#fff",
              }}
            >
              All Markets
            </span>
            <span style={{ color: "#6B7280", marginLeft: 8, fontSize: 15 }}>›</span>
            <span
              className="font-mono"
              style={{ marginLeft: "auto", color: "#6B7280", fontSize: 12 }}
            >
              {filtered.length} open
            </span>
          </div>
        )}
        {calendarOn ? null : isCryptoView ||
          isFinanceView ||
          isIntradayView ||
          isSportsView ||
          isMobileIntraday ||
          isMobileSports ? null : eventsFirstLoad ? (
          isMobile ? (
            <LiteMarketListSkeleton />
          ) : (
            <LiteMarketGridSkeleton />
          )
        ) : isWatchlistView &&
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
        ) : boostGroups ? (
          <div className="flex flex-col" style={{ gap: 26 }}>
            {boostGroups.map((g) => (
              <div key={g.id} className="flex flex-col" style={{ gap: 12 }}>
                <div className="flex items-center" style={{ gap: 8 }}>
                  <span
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: "#CFFF4A",
                      fontWeight: 700,
                    }}
                  >
                    {g.label}
                  </span>
                  <span style={{ fontSize: 11, color: "#6B7280" }}>{g.items.length}</span>
                  <span
                    aria-hidden
                    className="flex-1"
                    style={{ height: 1, background: "#1D2026" }}
                  />
                </div>
                <CardGrid
                  items={g.items}
                  getBoostConfig={getBoostConfig}
                  trendingCutoff={trendingCutoff}
                />
              </div>
            ))}
          </div>
        ) : (
          <CardGrid
            items={filtered}
            getBoostConfig={getBoostConfig}
            trendingCutoff={trendingCutoff}
          />
        )}
        </div>
      </div>

      <div style={isMobile ? { marginBottom: "calc(var(--bottom-nav-h, 76px) + env(safe-area-inset-bottom))" } : undefined}>
        <SeoFooter />
      </div>


      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      {isMobile && <BottomNav />}
    </div>
  );
};

export default LiteEventsPage;
